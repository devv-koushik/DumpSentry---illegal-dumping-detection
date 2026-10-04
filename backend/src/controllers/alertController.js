import Alert from "../models/Alert.js";
import Detection from "../models/Detection.js";
import Authority from "../models/Authority.js";
import { getAuthorityForContext } from "../services/ruleEngine.js";
import { sendAlertEmail } from "../services/email.js";

/**
 * Format alert for frontend consumption and API responses
 */
export function formatAlert(alertDoc) {
  const a = alertDoc.toObject ? alertDoc.toObject() : alertDoc;
  const detection = a.detectionId;
  let detId = a.detectionCode || "";
  let detObjId = "";
  if (detection) {
    if (typeof detection === "object") {
      detId = a.detectionCode || detection.detectionId || detection._id?.toString() || "";
      detObjId = detection._id ? detection._id.toString() : "";
    } else {
      detId = a.detectionCode || String(detection);
      detObjId = String(detection);
    }
  }

  const authority = a.authorityId || {};
  const statusNormalized = (a.status || "pending").toLowerCase();
  const displayStatus =
    statusNormalized === "sent" ? "Sent" : statusNormalized === "failed" ? "Failed" : "Pending";

  return {
    id: a._id.toString(),
    _id: a._id.toString(),
    alertId: a._id.toString(),
    detectionId: detId,
    detectionDocId: detObjId,
    detectionCode: detId,
    incident:
      a.subject ||
      (detection && detection.incidentType
        ? detection.incidentType.replace(/_/g, " ")
        : "Suspected Illegal Dumping"),
    location: (detection && detection.location) || "Coordinates Monitored",
    context: a.context || (detection && detection.context) || "Monitored Zone",
    contextType: a.contextType || (detection && detection.contextType) || "OTHER_UNKNOWN",
    authority:
      a.recipientName ||
      (a.recipient && a.recipient.name) ||
      authority.name ||
      (detection && detection.authorityName) ||
      "Designated Authority",
    authorityName:
      a.authorityName || authority.name || (detection && detection.authorityName) || "Designated Authority",
    recipient: a.recipient || {
      name: a.recipientName,
      email: a.recipientEmail,
      department: a.contextType || "Enforcement",
    },
    email: a.recipientEmail || (a.recipient && a.recipient.email) || authority.email || "authority@dumpsentry.ai",
    recipientEmail: a.recipientEmail,
    recipientName: a.recipientName,
    status: displayStatus,
    notificationStatus: statusNormalized,
    emailStatus: a.emailStatus || statusNormalized,
    messageId: a.messageId || null,
    previewUrl: a.previewUrl || null,
    timestamp: a.timestamp || a.createdAt,
    date: a.sentAt
      ? new Date(a.sentAt).toISOString().split("T")[0]
      : a.createdAt
      ? new Date(a.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    sentAt: a.sentAt || null,
    createdAt: a.createdAt,
    error: a.error || a.errorMessage || null,
    retryCount: a.retryCount || 0,
    lastRetryAt: a.lastRetryAt || null,
    reason: a.bodySnippet || (detection && detection.suspicionReason) || "",
  };
}

/**
 * Core dispatch function for alert notifications.
 * Flow:
 *  detection doc -> authority mapping -> idempotency check -> Alert(pending) -> send real email -> Alert(sent|failed)
 *
 * Preserves the detection in MongoDB on any email delivery error and stores failure status for retry.
 *
 * @param {object} params
 * @param {object} params.detection - The Detection document
 * @param {object} [params.authority] - Matched authority document
 * @param {string} [params.customEmail] - Optional override email address
 * @param {string} [params.customMessage] - Optional custom message/reason
 * @param {boolean} [params.forceRetry] - Whether to bypass idempotency check for retries
 * @param {string} [params.idempotencyKey] - Unique key for this notification request
 * @returns {Promise<{ success: boolean, status: string, emailStatus: string, alert: object, messageId?: string, previewUrl?: string, error?: string, duplicate?: boolean }>}
 */
export async function dispatchAlertForDetection({
  detection,
  authority = null,
  customEmail = null,
  customMessage = null,
  forceRetry = false,
  idempotencyKey = null,
}) {
  if (!detection) {
    throw new Error("Detection document is required for alert dispatch");
  }

  // 1. Resolve target authority if not already provided
  let targetAuthority = authority;
  if (!targetAuthority && detection.authorityId) {
    if (typeof detection.authorityId === "object" && detection.authorityId.name) {
      targetAuthority = detection.authorityId;
    } else {
      targetAuthority = await Authority.findById(detection.authorityId).lean();
    }
  }

  if (!targetAuthority && detection.contextType) {
    targetAuthority = await getAuthorityForContext(detection.contextType);
  }

  const targetEmail = (customEmail || targetAuthority?.email || "municipal.waste@dumpsentry.gov.in").trim();
  const targetName = targetAuthority?.name || detection.authorityName || "Responsible Authority";
  const detectionCode = detection.detectionId || (detection._id ? detection._id.toString() : "DS-ALERT");

  // 2. Notification Deduplication & Idempotency Check
  const key = idempotencyKey || `alert_${detection._id}_${targetEmail}`;

  // Check if an alert has already been successfully sent for this detection
  const existingAlert = await Alert.findOne({
    $or: [{ idempotencyKey: key }, { detectionId: detection._id }],
  });

  if (existingAlert) {
    const isSent =
      existingAlert.status === "sent" ||
      existingAlert.status === "SENT" ||
      existingAlert.emailStatus === "sent";

    // Deduplication rule: never re-send email if already sent unless explicit forceRetry is requested
    if (isSent && !forceRetry) {
      console.log(
        `[AlertController] Deduplication: Alert already dispatched for detection ${detectionCode}. Suppressing duplicate email.`
      );
      return {
        success: true,
        duplicate: true,
        status: "sent",
        emailStatus: "sent",
        message: `Alert already sent to ${existingAlert.recipientEmail} (deduplicated)`,
        alert: existingAlert,
        messageId: existingAlert.messageId,
        previewUrl: existingAlert.previewUrl,
        recipient: existingAlert.recipientEmail,
      };
    }

    // In-flight concurrency check: if pending within the last 15 seconds, avoid double-dispatch
    if (
      (existingAlert.status === "pending" || existingAlert.status === "PENDING") &&
      !forceRetry
    ) {
      const ageMs = Date.now() - new Date(existingAlert.updatedAt || existingAlert.createdAt).getTime();
      if (ageMs < 15000) {
        console.log(`[AlertController] Concurrency: Dispatch in progress for ${detectionCode}.`);
        return {
          success: true,
          pending: true,
          status: "pending",
          emailStatus: "pending",
          message: "Alert dispatch currently in progress",
          alert: existingAlert,
        };
      }
    }
  }

  // 3. Create or reuse Alert record with status "pending"
  let alertRecord = existingAlert;
  if (!alertRecord) {
    alertRecord = new Alert({
      detectionId: detection._id,
      detectionCode,
      context: detection.context || "Monitored Zone",
      contextType: detection.contextType || "OTHER_UNKNOWN",
      authorityId: targetAuthority?._id || detection.authorityId || null,
      authorityName: targetName,
      recipient: {
        name: targetName,
        email: targetEmail,
        department: targetAuthority?.type || detection.contextType || "Enforcement",
      },
      recipientName: targetName,
      recipientEmail: targetEmail,
      subject: `[DumpSentry ALERT] ${detection.status || "Suspected Illegal"} - ${detection.context || "Monitored Zone"} (${detection.location || "Coordinates Monitored"})`,
      bodySnippet: customMessage || detection.suspicionReason,
      status: "pending",
      emailStatus: "pending",
      idempotencyKey: key,
      timestamp: new Date(),
    });
    await alertRecord.save();
  } else {
    alertRecord.status = "pending";
    alertRecord.emailStatus = "pending";
    alertRecord.recipientEmail = targetEmail;
    alertRecord.recipientName = targetName;
    alertRecord.recipient = {
      name: targetName,
      email: targetEmail,
      department: targetAuthority?.type || detection.contextType || "Enforcement",
    };
    if (customMessage) {
      alertRecord.bodySnippet = customMessage;
    }
    await alertRecord.save();
  }

  // 4. Attempt to send REAL email via Nodemailer SMTP service
  try {
    const sendResult = await sendAlertEmail({
      to: targetEmail,
      authorityName: targetName,
      detection,
      reason: customMessage || detection.suspicionReason,
      customSubject: alertRecord.subject,
    });

    // Update alert status to "sent"
    alertRecord.status = "sent";
    alertRecord.emailStatus = "sent";
    alertRecord.messageId = sendResult.messageId;
    alertRecord.previewUrl = sendResult.previewUrl;
    alertRecord.sentAt = new Date();
    alertRecord.error = "";
    alertRecord.errorMessage = "";
    await alertRecord.save();

    // Update detection status to reflect alert dispatched
    if (detection.save) {
      detection.alertStatus = "Sent";
      await detection.save();
    } else {
      await Detection.findByIdAndUpdate(detection._id, { alertStatus: "Sent" });
    }

    return {
      success: true,
      status: "sent",
      emailStatus: "sent",
      alert: alertRecord,
      messageId: sendResult.messageId,
      previewUrl: sendResult.previewUrl,
      recipient: sendResult.recipient,
      reroutedFrom: sendResult.reroutedFrom,
    };
  } catch (sendErr) {
    console.error("[AlertController] Real email dispatch failed:", sendErr.message);

    // CRITICAL: The incident in MongoDB MUST NOT disappear!
    // Store failure status and error details to allow retry
    alertRecord.status = "failed";
    alertRecord.emailStatus = "failed";
    alertRecord.error = sendErr.message;
    alertRecord.errorMessage = sendErr.message;
    alertRecord.retryCount = (alertRecord.retryCount || 0) + 1;
    alertRecord.lastRetryAt = new Date();
    await alertRecord.save();

    if (detection.save) {
      detection.alertStatus = "Failed";
      await detection.save();
    } else {
      await Detection.findByIdAndUpdate(detection._id, { alertStatus: "Failed" });
    }

    return {
      success: false,
      status: "failed",
      emailStatus: "failed",
      error: sendErr.message,
      alert: alertRecord,
      detectionPreserved: true,
    };
  }
}

/**
 * GET /api/alerts
 * Pure read query - NEVER sends duplicate emails on dashboard refresh
 */
export async function getAlerts(req, res, next) {
  try {
    const alerts = await Alert.find()
      .populate("detectionId")
      .populate("authorityId")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts.map(formatAlert));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/alerts/:id
 */
export async function getAlertById(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("detectionId")
      .populate("authorityId");

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(formatAlert(alert));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/alerts/:detectionId/send
 * Dispatches notification to the responsible authority with deduplication & retry support.
 */
export async function sendAlert(req, res, next) {
  try {
    const { detectionId } = req.params;
    const { customEmail, customMessage, forceRetry } = req.body || {};

    const query = detectionId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: detectionId }
      : { detectionId };

    const detection = await Detection.findOne(query).populate("authorityId");
    if (!detection) {
      return res.status(404).json({ error: "Detection not found" });
    }

    const result = await dispatchAlertForDetection({
      detection,
      authority: detection.authorityId,
      customEmail,
      customMessage,
      forceRetry: Boolean(forceRetry),
    });

    if (result.success) {
      return res.json({
        success: true,
        message: result.duplicate
          ? result.message
          : `Alert dispatched successfully to ${result.recipient}`,
        alert: formatAlert(result.alert),
        status: result.status,
        emailStatus: result.emailStatus,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        duplicate: Boolean(result.duplicate),
      });
    }

    // Email dispatch failed: return error status while confirming incident is preserved
    return res.status(502).json({
      success: false,
      error: `Failed to dispatch email: ${result.error}`,
      alert: formatAlert(result.alert),
      status: "failed",
      emailStatus: "failed",
      detectionPreserved: true,
      canRetry: true,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/alerts/:detectionId/retry
 * Explicit retry endpoint for failed alerts
 */
export async function retryAlert(req, res, next) {
  req.body = { ...req.body, forceRetry: true };
  return sendAlert(req, res, next);
}
