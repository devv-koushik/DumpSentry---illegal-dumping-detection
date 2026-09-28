import Alert from "../models/Alert.js";
import Detection from "../models/Detection.js";
import Authority from "../models/Authority.js";
import { sendAlertEmail } from "../services/email.js";

/**
 * Format alert for frontend consumption
 */
function formatAlert(alertDoc) {
  const a = alertDoc.toObject ? alertDoc.toObject() : alertDoc;
  const detection = a.detectionId;
  let detId = "";
  if (detection) {
    if (typeof detection === "object" && (detection.detectionId || detection._id)) {
      detId = detection.detectionId || detection._id.toString();
    } else {
      detId = String(detection);
    }
  }

  const authority = a.authorityId || {};

  return {
    id: a._id.toString(),
    _id: a._id.toString(),
    alertId: a._id.toString(),
    detectionId: detId,
    incident: a.subject || a.emailSubject || (detection && detection.incidentType ? detection.incidentType.replace(/_/g, " ") : "Suspected Illegal Dumping"),
    location: a.location || (detection && detection.location) || "Coordinates Monitored",
    context: (detection && detection.context) || "Monitored Zone",
    authority: a.recipientName || (a.recipient && a.recipient.name) || authority.name || (detection && detection.authorityName) || "Designated Authority",
    email: a.recipientEmail || (a.recipient && a.recipient.email) || authority.email || "authority@gov.in",
    status: a.status === "SENT" ? "Sent" : a.status === "FAILED" ? "Failed" : "Pending",
    date: a.sentAt ? new Date(a.sentAt).toISOString().split("T")[0] : new Date(a.createdAt).toISOString().split("T")[0],
    createdAt: a.createdAt,
    reason: a.bodySnippet || (detection && detection.suspicionReason) || "",
  };
}

/**
 * GET /api/alerts
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
 * POST /api/alerts/:detectionId/send
 * Dispatches notification to the responsible authority
 */
export async function sendAlert(req, res, next) {
  try {
    const { detectionId } = req.params;
    const { customEmail, customMessage } = req.body || {};

    const query = detectionId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: detectionId }
      : { detectionId };

    const detection = await Detection.findOne(query).populate("authorityId");
    if (!detection) {
      return res.status(404).json({ error: "Detection not found" });
    }

    // Determine target authority
    let authority = detection.authorityId;
    if (!authority && detection.contextType) {
      authority = await Authority.findOne({ active: true });
    }

    const recipientEmail = customEmail || authority?.email || "authority@citycorp.gov.in";
    const recipientName = authority?.name || detection.authorityName || "Responsible Authority";

    // Attempt to send email
    let alertRecord;
    try {
      await sendAlertEmail({
        to: recipientEmail,
        authorityName: recipientName,
        detection,
        reason: customMessage || detection.suspicionReason,
      });

      alertRecord = new Alert({
        detectionId: detection._id,
        authorityId: authority?._id || null,
        recipientEmail,
        recipientName,
        subject: `[DumpSentry ALERT] ${detection.incidentType || "Suspected Illegal Dumping"} - ${detection.location}`,
        bodySnippet: customMessage || detection.suspicionReason,
        status: "SENT",
        sentAt: new Date(),
      });
      await alertRecord.save();

      detection.alertStatus = "Sent";
      await detection.save();

      res.json({
        success: true,
        message: `Alert dispatched successfully to ${recipientEmail}`,
        alert: formatAlert(alertRecord),
      });
    } catch (sendErr) {
      console.error("[AlertController] Email dispatch failed:", sendErr.message);

      alertRecord = new Alert({
        detectionId: detection._id,
        authorityId: authority?._id || null,
        recipientEmail,
        recipientName,
        subject: `[DumpSentry ALERT] ${detection.incidentType || "Suspected Illegal Dumping"}`,
        bodySnippet: customMessage || detection.suspicionReason,
        status: "FAILED",
        error: sendErr.message,
      });
      await alertRecord.save();

      detection.alertStatus = "Failed";
      await detection.save();

      res.status(500).json({
        error: `Failed to dispatch email: ${sendErr.message}`,
        alert: formatAlert(alertRecord),
      });
    }
  } catch (err) {
    next(err);
  }
}
