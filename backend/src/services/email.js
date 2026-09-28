import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

/**
 * Initialize nodemailer transporter.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (env.smtp?.host && env.smtp?.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port || 587,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  } else {
    // Development/Fallback mock transporter that logs to console
    transporter = {
      sendMail: async (options) => {
        console.log("-----------------------------------------");
        console.log("[Mock Email Service] Email would be sent:");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Preview: ${options.text || options.html?.slice(0, 150)}...`);
        console.log("-----------------------------------------");
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }
  return transporter;
}

/**
 * Send an alert email to an authority.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.authorityName - Name of recipient authority
 * @param {object} params.detection - Detection object details
 * @param {string} params.reason - Suspicion reasoning
 */
export async function sendAlertEmail({ to, authorityName, detection, reason }) {
  const mailer = getTransporter();

  const formattedWaste = Array.isArray(detection.wasteTypes) && detection.wasteTypes.length > 0
    ? detection.wasteTypes.join(", ")
    : Array.isArray(detection.wasteClasses) && detection.wasteClasses.length > 0
    ? detection.wasteClasses.join(", ")
    : detection.wasteType || "General Waste";

  const latNum = Number(detection.latitude);
  const lonNum = Number(detection.longitude);
  const coordinates = !isNaN(latNum) && !isNaN(lonNum)
    ? `${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`
    : "N/A";
  const mapLink = !isNaN(latNum) && !isNaN(lonNum)
    ? `https://www.google.com/maps?q=${latNum},${lonNum}`
    : "#";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #10b981; color: white; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
        <h2 style="margin: 0;">DumpSentry Alert Notification</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Automated Illegal Dumping Detection System</p>
      </div>

      <div style="padding: 20px;">
        <p>Dear <strong>${authorityName || "Concerned Authority"}</strong>,</p>
        <p>An incident of suspected illegal dumping has been detected by drone surveillance and requires your urgent attention.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Incident ID:</td>
            <td style="padding: 8px 0;">${detection.detectionId || detection._id || detection.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Location:</td>
            <td style="padding: 8px 0;">${detection.location || "Coordinates specified below"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Coordinates:</td>
            <td style="padding: 8px 0;"><a href="${mapLink}" target="_blank" style="color: #0284c7;">${coordinates} (View on Map)</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Waste Types Detected:</td>
            <td style="padding: 8px 0;"><span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${formattedWaste}</span></td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">AI Confidence:</td>
            <td style="padding: 8px 0;">${Math.round((detection.confidence || 0) * 100)}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Surrounding Context:</td>
            <td style="padding: 8px 0;">${detection.context || "Unclassified"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Violation Reason:</td>
            <td style="padding: 8px 0; color: #b91c1c;">${reason || detection.suspicionReason || "Proximity to restricted facility"}</td>
          </tr>
        </table>

        ${detection.imageUrl ? `
          <div style="margin: 20px 0; text-align: center;">
            <p style="font-weight: bold; margin-bottom: 8px; color: #475569;">Captured Drone Evidence:</p>
            <img src="${detection.imageUrl}" alt="Dump Evidence" style="max-width: 100%; border-radius: 6px; border: 1px solid #cbd5e1;" />
          </div>
        ` : ""}

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>This is an automated dispatch from DumpSentry Drone Monitoring AI System.</p>
        </div>
      </div>
    </div>
  `;

  const info = await mailer.sendMail({
    from: env.smtp?.from || `"DumpSentry System" <noreply@dumpsentry.ai>`,
    to,
    subject: `[DumpSentry ALERT] Suspected Illegal Dumping - ${detection.location || coordinates}`,
    html,
  });

  return info;
}
