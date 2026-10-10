import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trackingNumber =
      body.trackingNumber || `SO-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderNumber = body.id || trackingNumber;

    // Estimate delivery date (default 4 days for luxury atelier assembly)
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 4);

    const guestEmail =
      body.shippingAddress?.email || body.email || "patron@shivamoptics.in";
    const guestPhone =
      body.shippingAddress?.phone || body.phone || "+91 9810012345";
    const paymentStatus =
      body.paymentStatus || (body.paymentMethod === "cod" ? "unpaid" : "paid");
    const paymentMethod = body.paymentMethod || "razorpay";
    const paymentId = body.paymentId || body.payment_id || null;
    const paymentDetails = JSON.stringify(
      body.paymentDetails || body.payment_details || {}
    );
    const subtotal = Number(body.subtotal || body.totalAmount || 0);
    const discountAmount = Number(body.discount || 0);
    const couponCode = body.couponApplied || null;
    const shippingFee = Number(body.shippingFee || 0);
    const totalAmount = Number(body.totalAmount || subtotal);
    const shippingAddress = JSON.stringify(body.shippingAddress || {});
    const estDelivery = estimatedDate.toISOString().split("T")[0];

    const customerId = body.customerId || body.customer_id || null;

    // 1. Insert order into public.orders table directly via PostgreSQL
    const orderRes = await query(
      `INSERT INTO public.orders (
        order_number, customer_id, guest_email, guest_phone, status, payment_status,
        payment_method, payment_id, payment_details, subtotal, discount_amount, coupon_code, shipping_fee,
        total_amount, shipping_address, tracking_number, estimated_delivery, created_at
      ) VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING id, order_number, tracking_number;`,
      [
        orderNumber,
        customerId,
        guestEmail,
        guestPhone,
        paymentStatus,
        paymentMethod,
        paymentId,
        paymentDetails,
        subtotal,
        discountAmount,
        couponCode,
        shippingFee,
        totalAmount,
        shippingAddress,
        trackingNumber,
        estDelivery,
      ]
    );

    const insertedOrder = orderRes.rows[0];

    // 2. Insert order items if available
    if (insertedOrder && Array.isArray(body.items) && body.items.length > 0) {
      for (const item of body.items) {
        const qty = item.quantity || 1;
        const unitPrice = Number(item.product?.price || item.unitPrice || 0);
        const lensPrice = Number(item.lensConfig?.totalLensPrice || item.customLens?.totalPrice || 0);
        const totalPrice = Number((unitPrice + lensPrice) * qty);

        const snapshot = JSON.stringify({
          name: item.product?.name,
          brand: item.product?.brand,
          color: item.selectedColor || item.color || item.product?.colors?.[0],
          lensType: item.lensConfig?.lensType || item.customLens?.lensType || "frame-only",
          lensPackage: item.lensConfig?.lensPackage?.name || item.customLens?.lensPackage?.name || "Frame Only",
          prescription: item.lensConfig?.prescription || item.customLens?.prescription || null,
          images: item.product?.images || (item.product?.img ? [item.product.img] : []),
        });

        const productId = item.product?.id || null;
        const variantId = item.selectedVariant?.id || null;

        await query(
          `INSERT INTO public.order_items (
            order_id, product_id, variant_id, quantity, unit_price, lens_price, total_price, product_snapshot
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [
            insertedOrder.id,
            productId,
            variantId,
            qty,
            unitPrice,
            lensPrice,
            totalPrice,
            snapshot,
          ]
        );

        // Deduct inventory stock quantity if variant ID is valid
        if (variantId) {
          try {
            await query(
              `UPDATE public.product_variants 
               SET stock_quantity = GREATEST(0, stock_quantity - $1) 
               WHERE id = $2;`,
              [qty, variantId]
            );
          } catch (e) {
            console.warn("Stock decrement warning:", e);
          }
        }
      }
    }

    // 3. Increment coupon usage count if coupon was applied
    if (couponCode) {
      try {
        await query(
          `UPDATE public.coupons 
           SET usage_count = COALESCE(usage_count, 0) + 1 
           WHERE UPPER(code) = UPPER($1);`,
          [couponCode]
        );
      } catch (e) {
        console.warn("Coupon usage increment warning:", e);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      trackingNumber,
      message: "Order successfully registered in Mayur Vihar optical lab queue",
    });
  } catch (error: any) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get("tracking") || searchParams.get("id");
    const phone = searchParams.get("phone");

    if (trackingNumber) {
      const res = await query(
        `SELECT * FROM public.orders 
         WHERE order_number = $1 OR tracking_number = $1 OR id::text = $1
         LIMIT 1;`,
        [trackingNumber]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: res.rows[0] });
    }

    if (phone) {
      const res = await query(
        `SELECT * FROM public.orders 
         WHERE guest_phone = $1 
         ORDER BY created_at DESC 
         LIMIT 20;`,
        [phone]
      );
      return NextResponse.json({ success: true, orders: res.rows });
    }

    return NextResponse.json({ success: false, error: "Query parameter required" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
