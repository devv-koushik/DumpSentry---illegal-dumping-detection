import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Detection from "./models/Detection.js";

const BACKEND_URL = "http://localhost:5000";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/dumpsentry");
  console.log("Connected to MongoDB");

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@dumpsentry.ai",
      password: "DumpSentry@2026",
    }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    process.exit(1);
  }

  const { token } = await loginRes.json();
  console.log("1. Authenticated as Admin successfully.");

  // 2. Prepare drone waste image
  const sampleImagePath = path.resolve(
    "..",
    "ai-service",
    "dataset",
    "processed",
    "dronewaste_yolo",
    "images",
    "test",
    "site10_51.png"
  );

  if (!fs.existsSync(sampleImagePath)) {
    console.error("Sample image not found at:", sampleImagePath);
    process.exit(1);
  }

  console.log(`2. Using real drone image: ${sampleImagePath}`);

  // 3. Send to POST /api/analysis/analyze with Healthcare coordinates
  const form = new FormData();
  form.append("image", fs.createReadStream(sampleImagePath));
  form.append("latitude", "22.5726");
  form.append("longitude", "88.3639"); // Healthcare facility coordinates
  form.append("confidence", "0.25");

  console.log("3. Calling POST /api/analysis/analyze with GPS coordinates [22.5726, 88.3639]...");
  const res = await fetch(`${BACKEND_URL}/api/analysis/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    console.error(`API Error ${res.status}:`, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log("\n=======================================================");
  console.log("  ANALYSIS PIPELINE RESPONSE");
  console.log("=======================================================");
  console.log(`Detection ID:        ${data.detection?.detectionId}`);
  console.log(`Waste Detected:      ${data.ai?.wasteDetected}`);
  console.log(`Detected Waste:      ${data.ai?.classes?.join(", ")}`);
  console.log(`Overall Confidence:  ${data.detection?.confidence}%`);
  console.log(`Context Detected:    ${data.geospatial?.contextType} (${data.geospatial?.contextLabel})`);
  console.log(`Nearby Place:        ${data.geospatial?.nearbyPlaceName} (${data.geospatial?.distance}m)`);
  console.log(`Matched Rule:        ${data.ruleEngine?.matchedRule}`);
  console.log(`Initial Status:      ${data.detection?.status}`);
  console.log(`Selected Authority:  ${data.detection?.authority}`);
  console.log(`Authority Email:     ${data.ruleEngine?.authority?.email}`);
  console.log(`Authority Type:      ${data.ruleEngine?.authority?.type}`);
  console.log(`Suspicion Reason:    ${data.ruleEngine?.suspicionReason}`);
  console.log(`Alert Status:        ${data.detection?.alertStatus}`);

  // 4. Verify in MongoDB directly
  const savedDoc = await Detection.findOne({ detectionId: data.detection?.detectionId });
  console.log("\n=======================================================");
  console.log("  DATABASE RECORD VERIFICATION");
  console.log("=======================================================");
  console.log(`Stored in DB:        ${Boolean(savedDoc)}`);
  console.log(`Stored Status:       ${savedDoc.status}`);
  console.log(`Stored Alert Status: ${savedDoc.alertStatus} (Must be 'Not Sent')`);
  console.log(`Stored Authority:    ${savedDoc.authorityName}`);
  console.log(`Stored Context:      ${savedDoc.contextType}`);
  console.log(`Stored Reason:       ${savedDoc.suspicionReason}`);

  // 5. Verification checks against requirements
  console.log("\n=======================================================");
  console.log("  REQUIREMENTS VERIFICATION CHECKLIST");
  console.log("=======================================================");

  const check1 = data.ai?.wasteDetected === true;
  console.log(`[${check1 ? "PASS" : "FAIL"}] Step 1: YOLO detects waste`);

  const check2 = data.geospatial?.contextType === "HEALTHCARE";
  console.log(`[${check2 ? "PASS" : "FAIL"}] Step 2: Environmental context identified as HEALTHCARE`);

  const check3 = Boolean(data.ruleEngine?.matchedRule);
  console.log(`[${check3 ? "PASS" : "FAIL"}] Step 3: Rule evaluated`);

  const check4 = data.detection?.status === "Suspected Illegal";
  console.log(`[${check4 ? "PASS" : "FAIL"}] Step 4: Suspected illegal dumping determined`);

  const check5 = data.ruleEngine?.authority?.type === "HOSPITAL";
  console.log(`[${check5 ? "PASS" : "FAIL"}] Step 5: Hospital/health authority selected (${data.detection?.authority})`);

  const check6 = Boolean(savedDoc);
  console.log(`[${check6 ? "PASS" : "FAIL"}] Step 6: Incident stored in MongoDB`);

  const check7 = savedDoc.alertStatus === "Not Sent";
  console.log(`[${check7 ? "PASS" : "FAIL"}] Step 7: Notification eligible, no email auto-sent (alertStatus = 'Not Sent')`);

  const check8 = !savedDoc.authorityName.includes("@") && !savedDoc.suspicionReason.toLowerCase().includes("legally proves");
  console.log(`[${check8 ? "PASS" : "FAIL"}] Step 8: Non-personal contact and non-presumptive legal reasoning`);

  await mongoose.disconnect();
  console.log("\nLive pipeline test finished successfully!");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
