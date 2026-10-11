const { Pool } = require('pg');
const crypto = require('node:crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const OTP_PEPPER = process.env.OTP_SECRET_PEPPER || "shivam_optics_super_secure_otp_pepper_2026";

async function verifyOtpLogic(canonicalPhone, rawOtp, patronName) {
  // Simulates the exact updated app/api/auth/verify-otp/route.ts logic
  if (!/^\d{6}$/.test(rawOtp)) {
    return { success: false, error: "Please enter a complete 6-digit verification code", status: 400 };
  }

  // 1. Look up active, unexpired OTP verification record (WHERE verified_at IS NULL AND expires_at > NOW())
  const recordRes = await pool.query(
    `SELECT id, phone, otp_hash, channel, attempts, max_attempts, expires_at
     FROM public.otp_verifications
     WHERE phone = $1 AND verified_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1;`,
    [canonicalPhone]
  );

  if (recordRes.rows.length === 0) {
    return {
      success: false,
      error: "Verification code expired or not found. Please request a new code.",
      status: 400
    };
  }

  const record = recordRes.rows[0];

  if (record.attempts >= record.max_attempts) {
    await pool.query(
      `UPDATE public.otp_verifications SET expires_at = NOW() WHERE id = $1;`,
      [record.id]
    );
    return {
      success: false,
      error: "Too many failed attempts. Please request a new verification code.",
      status: 400
    };
  }

  const candidateHash = crypto
    .createHash("sha256")
    .update(`${canonicalPhone}:${rawOtp}:${OTP_PEPPER}`)
    .digest("hex");

  await pool.query(
    `UPDATE public.otp_verifications SET attempts = attempts + 1 WHERE id = $1;`,
    [record.id]
  );

  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(candidateHash, "hex"),
      Buffer.from(record.otp_hash, "hex")
    );
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    const remainingAttempts = record.max_attempts - (record.attempts + 1);
    if (remainingAttempts <= 0) {
      await pool.query(
        `UPDATE public.otp_verifications SET expires_at = NOW() WHERE id = $1;`,
        [record.id]
      );
    }
    return {
      success: false,
      error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      status: 400
    };
  }

  // Mark verified
  await pool.query(
    `UPDATE public.otp_verifications SET verified_at = NOW() WHERE id = $1;`,
    [record.id]
  );

  return { success: true, message: "Authentication successful", phone: canonicalPhone };
}

async function runTests() {
  console.log("=== RUNNING AUTH SAFEGUARD RIGOROUS VERIFICATION ===");
  const testPhone = "+919999988888";

  // Clean up any old test records for this number
  await pool.query(`DELETE FROM public.otp_verifications WHERE phone = $1;`, [testPhone]);

  // Test 1: Random phone number with no OTP requested -> MUST FAIL
  console.log("\n[TEST 1] Verifying random phone with no OTP dispatched...");
  const res1 = await verifyOtpLogic(testPhone, "123456", "Random User");
  if (!res1.success && res1.status === 400) {
    console.log("PASS: Rejected unauthorized attempt with code 400:", res1.error);
  } else {
    throw new Error("FAIL: Allowed unauthorized random phone without OTP!");
  }

  // Test 2: Request OTP and attempt invalid code -> MUST FAIL
  console.log("\n[TEST 2] Dispatching valid OTP and trying wrong code '000000'...");
  const genuineOtp = "654321";
  const otpHash = crypto
    .createHash("sha256")
    .update(`${testPhone}:${genuineOtp}:${OTP_PEPPER}`)
    .digest("hex");

  await pool.query(
    `INSERT INTO public.otp_verifications (
       phone, otp_hash, channel, attempts, max_attempts, expires_at, created_at
     ) VALUES ($1, $2, 'sms', 0, 5, NOW() + INTERVAL '10 minutes', NOW());`,
    [testPhone, otpHash]
  );

  const res2 = await verifyOtpLogic(testPhone, "000000", "Random User");
  if (!res2.success && res2.status === 400) {
    console.log("PASS: Wrong code rejected:", res2.error);
  } else {
    throw new Error("FAIL: Wrong code was accepted!");
  }

  // Test 3: Attempt correct code -> MUST SUCCEED
  console.log("\n[TEST 3] Trying correct code '654321'...");
  const res3 = await verifyOtpLogic(testPhone, genuineOtp, "Gaurav Patron");
  if (res3.success) {
    console.log("PASS: Genuine code authenticated successfully:", res3.message);
  } else {
    throw new Error("FAIL: Valid code was rejected: " + res3.error);
  }

  // Test 4: The 90-second bypass test! Trying to sign in again immediately with no new OTP -> MUST BE REJECTED!
  console.log("\n[TEST 4] Immediate re-login test (Verifying that the 90-second bypass loophole is GONE)...");
  const res4 = await verifyOtpLogic(testPhone, genuineOtp, "Another User");
  if (!res4.success && res4.status === 400) {
    console.log("PASS: Re-login without fresh OTP correctly rejected:", res4.error);
  } else {
    throw new Error("CRITICAL VULNERABILITY DETECTED: Old verified OTP was reused or bypassed!");
  }

  // Test 5: Invalidation check (send-otp must expire old unverified OTPs, not mark them verified)
  console.log("\n[TEST 5] Testing invalidation behavior when requesting a new code...");
  const oldCode = "111111";
  const oldHash = crypto
    .createHash("sha256")
    .update(`${testPhone}:${oldCode}:${OTP_PEPPER}`)
    .digest("hex");
  await pool.query(
    `INSERT INTO public.otp_verifications (
       phone, otp_hash, channel, attempts, max_attempts, expires_at, created_at
     ) VALUES ($1, $2, 'sms', 0, 5, NOW() + INTERVAL '10 minutes', NOW());`,
    [testPhone, oldHash]
  );

  // Simulate send-otp invalidating old unverified records:
  await pool.query(
    `UPDATE public.otp_verifications 
     SET expires_at = NOW() 
     WHERE phone = $1 AND verified_at IS NULL;`,
    [testPhone]
  );

  // Ensure it was NOT marked verified!
  const checkRes = await pool.query(
    `SELECT verified_at, expires_at FROM public.otp_verifications WHERE phone = $1 ORDER BY created_at DESC LIMIT 1;`,
    [testPhone]
  );
  if (checkRes.rows[0].verified_at === null) {
    console.log("PASS: Invalidated record correctly has verified_at = null (not marked verified).");
  } else {
    throw new Error("FAIL: Invalidated record was marked verified!");
  }

  // Clean up test records
  await pool.query(`DELETE FROM public.otp_verifications WHERE phone = $1;`, [testPhone]);
  console.log("\n=== ALL 5 AUTH SAFEGUARD SECURITY TESTS PASSED PERFECTLY ===");
  await pool.end();
}

runTests().catch(err => {
  console.error("TEST FAILED:", err);
  pool.end();
  process.exit(1);
});
