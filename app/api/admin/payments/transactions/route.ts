import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/adminDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const method = searchParams.get("method") || "all";
    const status = searchParams.get("status") || "all";

    const store = getStore();
    let txs = store.orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      payment_id: o.payment_id || `pay_${o.id}`,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      payment_details: {
        method: o.payment_method,
        status: o.payment_status,
      },
      total_amount: o.total_amount,
      subtotal: o.subtotal,
      discount_amount: o.discount_amount,
      shipping_fee: o.shipping_fee,
      shipping_address: o.shipping_address,
      guest_email: o.guest_email,
      guest_phone: o.guest_phone,
      created_at: o.created_at,
      order_status: o.status,
    }));

    if (search) {
      txs = txs.filter(
        (t) =>
          t.order_number.toLowerCase().includes(search) ||
          t.payment_id.toLowerCase().includes(search) ||
          t.guest_email.toLowerCase().includes(search) ||
          t.guest_phone.includes(search) ||
          t.shipping_address.fullName.toLowerCase().includes(search)
      );
    }

    if (method !== "all") {
      txs = txs.filter((t) => t.payment_method.toLowerCase().includes(method.toLowerCase()));
    }

    if (status !== "all") {
      txs = txs.filter((t) => t.payment_status.toLowerCase() === status.toLowerCase());
    }

    // Compute metrics
    const allOrders = store.orders;
    const totalTransactions = allOrders.length;
    const paidOrders = allOrders.filter((o) => o.payment_status === "paid");
    const totalSettledVolume = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const paidTransactions = paidOrders.length;
    const pendingTransactions = allOrders.filter((o) => o.payment_status === "pending").length;
    const failedTransactions = allOrders.filter((o) => o.payment_status === "failed").length;

    const rzpOrders = allOrders.filter((o) => o.payment_method.toLowerCase().includes("razorpay") || o.payment_method.toLowerCase().includes("upi"));
    const razorpayCount = rzpOrders.length;
    const razorpayVolume = rzpOrders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total_amount, 0);
    const codCount = allOrders.filter((o) => o.payment_method.toLowerCase().includes("cash") || o.payment_method.toLowerCase().includes("cod")).length;

    const successRate = totalTransactions > 0 ? Math.round((paidTransactions / totalTransactions) * 100) : 100;

    return NextResponse.json({
      success: true,
      transactions: txs,
      metrics: {
        totalSettledVolume,
        totalTransactions,
        paidTransactions,
        pendingTransactions,
        failedTransactions,
        razorpayVolume,
        razorpayCount,
        codCount,
        successRate,
      },
    });
  } catch (error: any) {
    console.error("Payment transactions GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load payment transactions" },
      { status: 500 }
    );
  }
}
