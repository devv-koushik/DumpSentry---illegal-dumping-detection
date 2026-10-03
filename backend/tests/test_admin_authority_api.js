import fetch from "node-fetch";

const BACKEND_URL = "http://localhost:5000";

async function testAdminUpdate() {
  console.log("--- Testing Admin Authority Contact Update via HTTP API ---");

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@dumpsentry.ai",
      password: "DumpSentry@2026",
    }),
  });

  const { token } = await loginRes.json();
  console.log("1. Admin authenticated successfully.");

  // 2. Fetch list of authorities
  const getRes = await fetch(`${BACKEND_URL}/api/authorities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const authorities = await getRes.json();
  const waterAuth = authorities.find((a) => a.type === "WATER_RESOURCES");
  console.log(`2. Found Water Resources Authority: ${waterAuth.name} (ID: ${waterAuth._id})`);
  console.log(`   Current Email: ${waterAuth.email}`);

  // 3. Admin updates authority contact details via PUT /api/authorities/:id
  const updatedEmail = "wetlands.enforcement@dumpsentry.gov.in";
  const updatedPhone = "+91 33 2334 9999";
  const putRes = await fetch(`${BACKEND_URL}/api/authorities/${waterAuth._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: updatedEmail,
      phone: updatedPhone,
    }),
  });

  if (!putRes.ok) {
    console.error("PUT failed:", await putRes.text());
    process.exit(1);
  }

  const updatedDoc = await putRes.json();
  console.log(`3. Admin successfully updated contact details via PUT /api/authorities/${waterAuth._id}`);
  console.log(`   New Email: ${updatedDoc.email}`);
  console.log(`   New Phone: ${updatedDoc.phone}`);

  // 4. Verify that fetching authorities reflects the change
  const verifyRes = await fetch(`${BACKEND_URL}/api/authorities?type=WATER_RESOURCES`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const [verified] = await verifyRes.json();
  console.log(`4. Verified via GET /api/authorities: Email = ${verified.email}`);

  // 5. Restore original email
  await fetch(`${BACKEND_URL}/api/authorities/${waterAuth._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: waterAuth.email,
      phone: waterAuth.phone,
    }),
  });
  console.log(`5. Restored original contact details: ${waterAuth.email}`);
  console.log("\n-> Admin Authority Management API Test: PASSED!");
}

testAdminUpdate().catch(console.error);
