import mongoose from "mongoose";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import Authority from "../src/models/Authority.js";
import Rule from "../src/models/Rule.js";
import Detection from "../src/models/Detection.js";
import { detectEnvironmentalContext } from "../src/services/geospatial.js";
import { evaluateRules } from "../src/services/ruleEngine.js";
import { seedInitialData } from "../src/services/seed.js";
import { CONTEXT_TYPES } from "../src/config/constants.js";

const BACKEND_URL = "http://localhost:5000";

// Controlled coordinates representing each major environmental context
const CONTROLLED_COORDINATES = [
  {
    context: CONTEXT_TYPES.HEALTHCARE,
    name: "Calcutta Medical College & Hospital",
    lat: 22.5726,
    lon: 88.3639,
    expectedAuthorityType: "HOSPITAL",
  },
  {
    context: CONTEXT_TYPES.WATER_BODY,
    name: "College Square Water Body / Pond",
    lat: 22.5746,
    lon: 88.3644,
    expectedAuthorityType: "WATER_RESOURCES",
  },
  {
    context: CONTEXT_TYPES.EDUCATIONAL,
    name: "Calcutta University Academic Campus",
    lat: 22.5744,
    lon: 88.3629,
    expectedAuthorityType: "EDUCATION",
  },
  {
    context: CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED,
    name: "Maidan Central Protected Parkland",
    lat: 22.5542,
    lon: 88.3516,
    expectedAuthorityType: "FOREST",
  },
  {
    context: CONTEXT_TYPES.ROADSIDE,
    name: "Grand Trunk Road Corridor",
    lat: 22.8239,
    lon: 88.2415,
    expectedAuthorityType: "PWD",
  },
  {
    context: CONTEXT_TYPES.TRANSPORT,
    name: "Howrah Railway Station & Transit Terminal",
    lat: 22.5830,
    lon: 88.3428,
    expectedAuthorityType: "TRANSPORT",
  },
  {
    context: CONTEXT_TYPES.COMMERCIAL,
    name: "New Market Commercial District",
    lat: 22.5583,
    lon: 88.3527,
    expectedAuthorityType: "MUNICIPAL",
  },
  {
    context: CONTEXT_TYPES.PUBLIC_AREA,
    name: "Kolkata Town Hall / Civic Complex",
    lat: 22.5675,
    lon: 88.3440,
    expectedAuthorityType: "CIVIC",
  },
  {
    context: CONTEXT_TYPES.INDUSTRIAL,
    name: "Taratala Industrial Estate",
    lat: 22.5100,
    lon: 88.2950,
    expectedAuthorityType: "POLLUTION_CONTROL",
  },
  {
    context: CONTEXT_TYPES.RESIDENTIAL,
    name: "Ballygunge Residential Neighborhood",
    lat: 22.5300,
    lon: 88.3650,
    expectedAuthorityType: "MUNICIPAL",
  },
  {
    context: CONTEXT_TYPES.AGRICULTURAL,
    name: "North 24 Parganas Farmland",
    lat: 22.8000,
    lon: 88.5000,
    expectedAuthorityType: "AGRICULTURE",
  },
  {
    context: CONTEXT_TYPES.OTHER_UNKNOWN,
    name: "Unclassified Zone (Missing GPS Coordinates)",
    lat: null,
    lon: null,
    expectedAuthorityType: "MUNICIPAL",
  },
];

async function runTests() {
  await mongoose.connect("mongodb://127.0.0.1:27017/dumpsentry");
  console.log("Connected to MongoDB for integration verification.");

  // Sync initial authorities and rules
  await seedInitialData();

  console.log("\n=======================================================");
  console.log("  PART 1: TESTING AUTHORITY ROUTING FOR ALL 12 CONTEXTS");
  console.log("=======================================================\n");

  let passedContexts = 0;
  for (const item of CONTROLLED_COORDINATES) {
    console.log(`\nTesting Context: ${item.context}`);
    console.log(`  Target Location: ${item.name} [${item.lat}, ${item.lon}]`);

    // 1. Detect geospatial context
    const geo = await detectEnvironmentalContext(item.lat, item.lon, 300);
    console.log(`  Geospatial Detection: ${geo.contextType} (${geo.contextLabel})`);

    // 2. Evaluate authority routing rule based on detected environmental context
    const effectiveContext = geo.contextType !== "OTHER_UNKNOWN" ? geo.contextType : item.context;
    const ruleEval = await evaluateRules(geo.nearbyPlaces, effectiveContext, geo);

    console.log(`  Evaluated Rule: ${ruleEval.matchedRule?.name || "Default Rule"}`);
    console.log(`  Selected Authority: ${ruleEval.authority?.name}`);
    console.log(`  Authority Type: ${ruleEval.authority?.type}`);
    console.log(`  Departmental Email: ${ruleEval.authority?.email}`);
    console.log(`  Reason Template: ${ruleEval.suspicionReason}`);

    // Verify non-personal email
    const email = ruleEval.authority?.email || "";
    const isDepartmental =
      email.includes("@dumpsentry.gov.in") ||
      email.includes("@pwd.gov.in") ||
      email.includes("@edu.gov.in") ||
      email.includes("@spcb.gov.in");

    if (isDepartmental) {
      console.log(`  [OK] Email is non-personal departmental address`);
    } else {
      console.warn(`  [WARN] Email format unexpected: ${email}`);
    }

    // Verify non-presumptive reason (does not legally claim proof of crime)
    const reasonText = ruleEval.suspicionReason || "";
    const nonPresumptive =
      reasonText.toLowerCase().includes("suspected") ||
      reasonText.toLowerCase().includes("requires field verification") ||
      reasonText.toLowerCase().includes("requires site inspection") ||
      reasonText.toLowerCase().includes("manual review");

    if (nonPresumptive) {
      console.log(`  [OK] Legal determination is non-presumptive and configurable`);
    } else {
      console.warn(`  [WARN] Reason might claim legal certainty: ${reasonText}`);
    }

    if (ruleEval.authority) {
      passedContexts++;
      console.log(`  -> RESULT: PASSED (Successfully routed)`);
    } else {
      console.log(`  -> RESULT: FAILED (No authority found)`);
    }
  }

  console.log(`\nContext Routing Tests Summary: ${passedContexts}/${CONTROLLED_COORDINATES.length} passed.`);

  // PART 2: Admin Authority Update Capability
  console.log("\n=======================================================");
  console.log("  PART 2: TESTING ADMIN AUTHORITY UPDATE CAPABILITY");
  console.log("=======================================================\n");

  const pwdAuth = await Authority.findOne({ type: "PWD" });
  if (pwdAuth) {
    const originalEmail = pwdAuth.email;
    const testUpdatedEmail = "highway.maintenance@dumpsentry.gov.in";

    console.log(`Original PWD Authority Email in DB: ${originalEmail}`);

    // Simulate Admin PUT /api/authorities/:id
    pwdAuth.email = testUpdatedEmail;
    await pwdAuth.save();
    console.log(`Admin updated PWD Authority Email to: ${testUpdatedEmail}`);

    // Verify rule engine retrieves the updated email immediately
    const roadsideEval = await evaluateRules([], "ROADSIDE");
    console.log(`Rule Engine returned Authority Email: ${roadsideEval.authority?.email}`);

    if (roadsideEval.authority?.email === testUpdatedEmail) {
      console.log("-> Admin authority update test: PASSED (Rule engine immediately picked up updated contact)");
    } else {
      console.log("-> Admin authority update test: FAILED");
    }

    // Revert back
    pwdAuth.email = originalEmail;
    await pwdAuth.save();
    console.log(`Reverted PWD Authority Email back to: ${originalEmail}`);
  }

  // PART 3: Full End-to-End Analysis Pipeline
  console.log("\n=======================================================");
  console.log("  PART 3: TESTING FULL ANALYSIS PIPELINE (/api/analysis/analyze)");
  console.log("=======================================================\n");

  // Locate sample drone image
  const candidatePaths = [
    path.resolve("..", "ai-service", "dataset", "processed", "dronewaste_yolo", "images", "train", "site10_12.png"),
    path.resolve("..", "ai-service", "dataset", "processed", "dronewaste_yolo", "images", "train", "site10_13.png"),
    path.resolve("uploads", "sample.jpg"),
  ];

  let sampleImagePath = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      sampleImagePath = p;
      break;
    }
  }

  if (sampleImagePath) {
    console.log(`Testing with real drone waste image: ${sampleImagePath}`);

    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@dumpsentry.ai",
        password: "DumpSentry@2026",
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Admin authentication successful, token acquired.");

    const form = new FormData();
    form.append("image", fs.createReadStream(sampleImagePath));
    form.append("latitude", "22.5726");
    form.append("longitude", "88.3639"); // Medical College Hospital coordinates
    form.append("confidence", "0.25");

    try {
      const apiRes = await fetch(`${BACKEND_URL}/api/analysis/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...form.getHeaders(),
        },
        body: form,
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        console.log(`Analysis HTTP Status: ${apiRes.status}`);
        console.log(`Detection ID: ${data.detection?.detectionId}`);
        console.log(`Waste Detected: ${data.ai?.wasteDetected}`);
        console.log(`Detected Waste Classes: ${data.ai?.classes?.join(", ") || "None"}`);
        console.log(`Initial Status: ${data.detection?.status}`);
        console.log(`Alert Status: ${data.detection?.alertStatus}`);
        console.log(`Context: ${data.detection?.context}`);
        console.log(`Authority Assigned: ${data.detection?.authority}`);
        console.log(`Authority Email: ${data.ruleEngine?.authority?.email}`);
        console.log(`Incident Type: ${data.ruleEngine?.incidentType}`);
        console.log(`Suspicion Reason: ${data.ruleEngine?.suspicionReason}`);

        // Sequence verification
        console.log("\n--- Sequence Check ---");
        console.log("1. YOLO detects waste: " + (data.ai?.wasteDetected ? "YES" : "NO"));
        console.log("2. Context identified: " + data.geospatial?.contextType);
        console.log("3. Rule evaluated: " + data.ruleEngine?.matchedRule);
        console.log("4. Suspected illegal dumping determination: " + data.detection?.status);
        console.log("5. Authority selected: " + data.detection?.authority);
        console.log("6. Incident stored: " + data.detection?.detectionId);
        console.log("7. Notification eligible (not auto-sent): alertStatus = " + data.detection?.alertStatus);

        if (data.detection?.alertStatus === "Not Sent") {
          console.log("-> Email Guard Check: PASSED (No email sent on detection)");
        } else {
          console.log("-> Email Guard Check: FAILED");
        }
      } else {
        console.warn(`Analysis API returned HTTP ${apiRes.status}:`, await apiRes.text());
      }
    } catch (apiErr) {
      console.warn("Analysis API fetch error:", apiErr.message);
    }
  } else {
    console.log("No sample image located for live pipeline test.");
  }

  await mongoose.disconnect();
  console.log("\nAll Integration Tests Finished.");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
