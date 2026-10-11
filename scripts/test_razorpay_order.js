const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TfX2gVZqD6Ern5";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "9lrOQWoB18TQgHvX46AcBk2a";

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
        store: "Shivam Optics Luxury Eyewear Atelier",
      },
    });
    console.log("Razorpay Order Created Successfully! Order:", order);
  } catch (err) {
    console.error("Razorpay Order Creation ERROR:", err);
  }
}

testOrder();
