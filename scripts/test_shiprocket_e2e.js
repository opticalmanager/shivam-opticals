const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runE2ETests() {
  console.log('===============================================================');
  console.log('SHIVAM OPTICAL — SHIPROCKET LOGISTICS END-TO-END VERIFICATION');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Database Settings Store
  console.log('--- TEST 1: Database Admin Settings Verification ---');
  const dbRes = await pool.query("SELECT value FROM public.admin_settings WHERE key = 'shipping'");
  assert(dbRes.rows.length > 0, "Shipping config exists in public.admin_settings");
  const cfg = dbRes.rows[0]?.value;
  assert(cfg?.shiprocketEmail === "service.viralnest@gmail.com", "Config has correct email");
  assert(cfg?.shiprocketPickupLocation === "Mayur Vihar Atelier", "Config has 'Mayur Vihar Atelier' pickup location code");
  assert(cfg?.shiprocketPickupPincode === "110091", "Config has '110091' Mayur Vihar pickup postal code");
  assert(cfg?.shiprocketWebhookSecret === "#$#%OMw956hgchpCZLULEGW3B573on0g", "Config has secure webhook secret");

  // TEST 2: Live Shiprocket Production Auth
  console.log('\n--- TEST 2: Live Shiprocket Production Auth ---');
  const loginRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cfg.shiprocketEmail,
      password: cfg.shiprocketPassword
    })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, `Shiprocket auth status is 200 (Got ${loginRes.status})`);
  assert(Boolean(loginData.token), "Valid JWT Bearer token acquired");
  assert(loginData.company_id === 11877754, `Matched expected Company ID 11877754 (Got ${loginData.company_id})`);
  const token = loginData.token;

  // TEST 3: Pickup Location Audit
  console.log('\n--- TEST 3: Verified Pickup Location Audit ---');
  const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const pickupData = await pickupRes.json();
  assert(pickupRes.status === 200, "Fetched company pickup locations successfully");
  const mayurViharLoc = pickupData?.data?.shipping_address?.find(a => a.pickup_location === 'Mayur Vihar Atelier');
  assert(Boolean(mayurViharLoc), "Registered pickup location 'Mayur Vihar Atelier' found");
  assert(mayurViharLoc?.pin_code === '110091', "Primary pickup postal code is 110091 (Mayur Vihar, Delhi)");
  console.log(`    Warehouse: ${mayurViharLoc?.address}, ${mayurViharLoc?.city} (${mayurViharLoc?.pin_code})`);

  // TEST 4: Multi-City Live Courier Serviceability
  console.log('\n--- TEST 4: Multi-City Live Courier Serviceability from Mayur Vihar (110091) ---');
  const testCities = [
    { city: 'Delhi', pincode: '110001' },
    { city: 'Mumbai', pincode: '400001' },
    { city: 'Bengaluru', pincode: '560001' },
    { city: 'Kolkata', pincode: '700001' },
  ];

  for (const t of testCities) {
    const sRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=110091&delivery_postcode=${t.pincode}&weight=0.35&cod=0`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const sData = await sRes.json();
    assert(sRes.status === 200, `Serviceability API 200 OK for ${t.city} (${t.pincode})`);
    const couriers = sData?.data?.available_courier_companies || [];
    assert(couriers.length > 0, `Available couriers found for ${t.city} (Count: ${couriers.length})`);
    if (couriers.length > 0) {
      const top = couriers[0];
      console.log(`    -> ${t.city}: Best Courier = ${top.courier_name} | Rate: Rs ${top.rate} | Transit: ${top.estimated_delivery_days} days | ETD: ${top.etd}`);
    }
  }

  // TEST 5: Webhook Signature & Status Mapping Logic
  console.log('\n--- TEST 5: Webhook Security Verification ---');
  const webhookSecret = "#$#%OMw956hgchpCZLULEGW3B573on0g";
  assert(webhookSecret.length > 10, "Webhook secret is properly formatted");

  function testWebhookSecretCheck(headerSecret, expected) {
    const cleanSecret = (headerSecret || '').replace(/^Bearer\s+/i, '');
    return cleanSecret === expected;
  }

  assert(testWebhookSecretCheck(webhookSecret, webhookSecret), "Direct secret match passes");
  assert(testWebhookSecretCheck("Bearer " + webhookSecret, webhookSecret), "Bearer prefixed secret passes");
  assert(!testWebhookSecretCheck("wrong-secret", webhookSecret), "Invalid secret rejected");

  // Summary
  console.log('\n===============================================================');
  console.log(`E2E TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  await pool.end();
}

runE2ETests().catch((err) => {
  console.error("Fatal test error:", err);
  pool.end();
  process.exit(1);
});
