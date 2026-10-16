const Razorpay = require('razorpay');

const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const k = match[1].trim();
      const v = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  });
}

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_live_Tn3v56njBS0cGX";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "5B0VMymOFpkJfPsiE1sBWaSy";

console.log("Testing Razorpay with Key ID:", key_id);

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function testOrder() {
  try {
    const order = await razorpay.orders.create({
      amount: 50000, // 500 INR in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        store: "Shivam Opticals Luxury Eyewear Atelier",
      },
    });
    console.log("Razorpay Order Created Successfully! Order:", order);
  } catch (err) {
    console.error("Razorpay Order Creation ERROR:", err);
  }
}

testOrder();
