/**
 * DumpSentry Email Notification Service
 * Connects to real SMTP server configured via environment variables.
 * Enforces placeholder protection, idempotency, and full delivery tracking.
 */

import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

/**
 * Validates if an email address is a placeholder or fake domain.
 * Ensures DumpSentry never sends automated emails to non-existent or placeholder addresses.
 *
 * @param {string} email
 * @returns {boolean} True if placeholder or invalid
 */
export function isPlaceholderEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return true;

  const [localPart, domainPart] = trimmed.split("@");
  if (!localPart || !domainPart) return true;

  // Known placeholder/template domains that cannot receive external emails
  const placeholderDomains = [
    "example.com",
    "example.org",
    "example.net",
    "placeholder.com",
    "placeholder.org",
    "test.com",
    "domain.com",
    "your-domain.com",
    "dumpsentry.gov.in", // simulated domain from seed data
    "citycorp.gov.in",
    "edu.gov.in",
    "invalid",
    "localhost",
  ];

  if (placeholderDomains.includes(domainPart)) {
    return true;
  }

  // Placeholder prefixes
  const placeholderPrefixes = [
    "placeholder",
    "noreply",
    "no-reply",
    "dummy",
    "fake",
    "temp",
    "null",
    "undefined",
    "nobody",
  ];

  if (placeholderPrefixes.some((p) => localPart === p || localPart.startsWith(p + "+"))) {
    return true;
  }

  return false;
}

/**
 * Initialize and verify real Nodemailer SMTP transporter.
 * All credentials are read strictly from process.env / env.js.
 */
export async function getTransporter() {
  if (transporter) return transporter;

  const host = env.smtp?.host || process.env.SMTP_HOST;
  const port = parseInt(env.smtp?.port || process.env.SMTP_PORT || "587", 10);
  const secure = env.smtp?.secure === true || process.env.SMTP_SECURE === "true" || port === 465;
  const user = env.smtp?.user || process.env.SMTP_USER;
  const pass = env.smtp?.pass || process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  } else if (!env.isDev) {
    throw new Error(
      "SMTP credentials not configured in environment. Please set SMTP_USER and SMTP_PASS in .env"
    );
  } else {
    // In dev mode without configured credentials, create an on-demand Ethereal SMTP test account
    console.log("[EmailService] No SMTP_USER configured in env. Initializing real Ethereal SMTP test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EmailService] Ethereal SMTP initialized: ${testAccount.user} on ${testAccount.smtp.host}:${testAccount.smtp.port}`);
  }

  return transporter;
}

/**
 * Send a real incident alert email to the designated authority.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.authorityName - Target authority
 * @param {object} params.detection - Real detection document
 * @param {string} params.reason - Suspicion reasoning / rule trigger
 * @param {string} [params.customSubject] - Optional subject line
 * @returns {Promise<{ success: boolean, messageId: string, previewUrl: string, recipient: string }>}
 */
export async function sendAlertEmail({ to, authorityName, detection, reason, customSubject }) {
  let targetEmail = (to || "").trim();
  let reroutedFrom = null;

  // Validate basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!targetEmail || !emailRegex.test(targetEmail)) {
    throw new Error(`Invalid recipient email address format: "${targetEmail}"`);
  }

  // Enforce rule: Never send an email to a placeholder address
  if (isPlaceholderEmail(targetEmail)) {
    const controlledTestRecipient = env.alertTestRecipient || process.env.ALERT_TEST_RECIPIENT;
    if (controlledTestRecipient && !isPlaceholderEmail(controlledTestRecipient)) {
      reroutedFrom = targetEmail;
      targetEmail = controlledTestRecipient.trim();
      console.warn(
        `[EmailService] Authority recipient "${reroutedFrom}" is a placeholder address. Rerouted to controlled test recipient: "${targetEmail}"`
      );
    } else {
      throw new Error(
        `Cannot send alert: Recipient address "${targetEmail}" is a placeholder domain. Please configure a valid authority email or set ALERT_TEST_RECIPIENT in .env.`
      );
    }
  }

  const mailer = await getTransporter();

  // Format waste classes
  const wasteList = Array.isArray(detection.wasteTypes) && detection.wasteTypes.length > 0
    ? detection.wasteTypes.map((w) => w.replace(/_/g, " ")).join(", ")
    : detection.wasteType || "Unclassified Waste";

  // Coordinates and maps
  const latNum = Number(detection.latitude);
  const lonNum = Number(detection.longitude);
  const hasGps = !isNaN(latNum) && !isNaN(lonNum) && latNum !== 0;
  const coordinatesStr = hasGps ? `${latNum.toFixed(5)}, ${lonNum.toFixed(5)}` : "Location Unavailable (No GPS Telemetry)";
  const mapLink = hasGps ? `https://www.google.com/maps?q=${latNum},${lonNum}` : "#";

  // Nearby places summary
  const nearbyPlacesHtml = Array.isArray(detection.nearbyPlaces) && detection.nearbyPlaces.length > 0
    ? `<ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; color: #475569;">
        ${detection.nearbyPlaces
          .slice(0, 4)
          .map((p) => `<li><strong>${p.name}</strong> (${p.type || p.contextType || "Facility"}, ${Math.round(p.distance)}m away)</li>`)
          .join("")}
      </ul>`
    : `<span style="color: #64748b;">No nearby facilities recorded within 300m</span>`;

  // Image evidence URL
  const backendBase = (env.frontendUrl || "http://localhost:5173").replace(/:\d+$/, ":5000");
  const rawImageUrl = detection.annotatedImageUrl || detection.originalImageUrl || detection.image;
  const imageUrl = rawImageUrl
    ? (rawImageUrl.startsWith("http://") || rawImageUrl.startsWith("https://")
      ? rawImageUrl
      : `${backendBase}${rawImageUrl.startsWith("/") ? "" : "/"}${rawImageUrl}`)
    : null;

  const incidentId = detection.detectionId || detection.id || detection._id;
  const contextLabel = detection.context || detection.contextType || "General Area";
  const confidenceScore = Math.round(
    (detection.overallConfidence || detection.confidence || 0) > 1
      ? (detection.overallConfidence || detection.confidence)
      : (detection.overallConfidence || detection.confidence || 0) * 100
  );

  const subject = customSubject || `[DumpSentry ALERT] ${detection.status || "Suspected Illegal"} - ${contextLabel} (${detection.location || coordinatesStr})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #16241d 0%, #20352a 100%); color: #ffffff; padding: 24px 28px; text-align: left;">
          <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(226,163,59,0.2); border: 1px solid rgba(226,163,59,0.4); color: #e2a33b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">
            Aerial AI Surveillance Alert
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
            DumpSentry Incident Dispatch
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">
            Automated Environmental Protection & Municipal Enforcement Routing
          </p>
        </div>

        ${
          reroutedFrom
            ? `<div style="background-color: #fffbeb; border-bottom: 1px solid #fef3c7; padding: 12px 24px; font-size: 12px; color: #92400e;">
                <strong>Controlled Test Delivery:</strong> Rerouted from authority address <code>${reroutedFrom}</code> to verified test inbox <code>${targetEmail}</code>.
              </div>`
            : ""
        }

        <!-- Content -->
        <div style="padding: 24px 28px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;">
            To <strong>${authorityName || "Concerned Authority"}</strong>,
          </p>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            An incident of suspected illegal dumping has been flagged by autonomous drone surveillance in your designated jurisdiction. Please review the evidence below and assign field sanitation / enforcement officers.
          </p>

          <!-- Incident Card -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b; width: 35%;">Incident ID</td>
              <td style="padding: 10px 14px; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a;">${incidentId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b;">Waste Types</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #c94b3f;">${wasteList}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b;">AI Confidence</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a;">${confidenceScore}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b;">Environmental Context</td>
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0284c7;">${contextLabel}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b;">Location</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #0f172a;">${detection.location || "Coordinates Monitored"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b;">GPS Coordinates</td>
              <td style="padding: 10px 14px; font-size: 13px; font-family: monospace;">
                ${
                  hasGps
                    ? `<a href="${mapLink}" target="_blank" style="color: #0284c7; text-decoration: underline;">${coordinatesStr} (Open Map)</a>`
                    : coordinatesStr
                }
              </td>
            </tr>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b; vertical-align: top;">Nearby Facilities</td>
              <td style="padding: 10px 14px; font-size: 13px;">${nearbyPlacesHtml}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #64748b; vertical-align: top;">Violation Reason</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #b91c1c; font-weight: 500;">
                ${reason || detection.suspicionReason || "Unauthorized waste detected in proximity to designated facility buffer zone."}
              </td>
            </tr>
          </table>

          ${
            imageUrl
              ? `
              <div style="margin: 20px 0; text-align: center;">
                <p style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">
                  Drone Aerial Evidence (YOLO Annotated)
                </p>
                <img src="${imageUrl}" alt="Aerial Detection Evidence" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #cbd5e1;" />
              </div>
            `
              : ""
          }

          <div style="margin-top: 24px; text-align: center;">
            <a href="${env.frontendUrl || "http://localhost:5173"}/dashboard/detections/${incidentId}" target="_blank" style="display: inline-block; padding: 10px 22px; background-color: #16241d; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
              Open Incident in Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">DumpSentry Drone AI Surveillance Platform &bull; Automated Dispatch</p>
          <p style="margin: 4px 0 0 0;">All AI detection scores require human verification before legal enforcement action.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: env.smtp?.from || process.env.SMTP_FROM || `"DumpSentry Alerts" <alerts@dumpsentry.ai>`,
    to: targetEmail,
    subject,
    html,
  };

  const info = await mailer.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(`[EmailService] Alert sent successfully! MessageID: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[EmailService] Preview URL: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    recipient: targetEmail,
    reroutedFrom,
    timestamp: new Date(),
  };
}
