import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trackingNumber =
      body.trackingNumber || `SO-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderNumber = body.id || trackingNumber;

    // Estimate delivery date (default 4 days for lab assembly)
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 4);

    const guestEmail =
      body.shippingAddress?.email || body.email || "customer@shivamoptical.in";
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
    const email = searchParams.get("email");
    const customerId = searchParams.get("customerId");

    if (trackingNumber) {
      const res = await query(
        `SELECT 
          o.*,
          COALESCE((
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'lens_price', oi.lens_price,
              'total_price', oi.total_price,
              'product_name', COALESCE(oi.product_snapshot->>'name', p.name, 'Optical Frame'),
              'brand', COALESCE(oi.product_snapshot->>'brand', b.name, 'Shivam Optical'),
              'color', COALESCE(oi.product_snapshot->>'color', pv.color_name, 'Standard'),
              'lens_package', oi.product_snapshot->>'lensPackage',
              'prescription', oi.product_snapshot->'prescription',
              'images', oi.product_snapshot->'images'
            ))
            FROM public.order_items oi
            LEFT JOIN public.products p ON p.id = oi.product_id
            LEFT JOIN public.brands b ON b.id = p.brand_id
            LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
            WHERE oi.order_id = o.id
          ), '[]'::json) as items
         FROM public.orders o
         WHERE o.order_number = $1 OR o.tracking_number = $1 OR o.id::text = $1
         LIMIT 1;`,
        [trackingNumber]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: res.rows[0] });
    }

    if (phone || email || customerId) {
      const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const validCustomerId = customerId && customerId.length >= 20 ? customerId : null;

      const res = await query(
        `SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.guest_name,
          o.guest_email,
          o.guest_phone,
          o.status,
          o.payment_status,
          o.payment_method,
          o.subtotal,
          o.discount_amount,
          o.coupon_code,
          o.shipping_fee,
          o.total_amount,
          o.shipping_address,
          o.tracking_number,
          o.courier_partner,
          o.estimated_delivery,
          o.created_at,
          COALESCE((
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'lens_price', oi.lens_price,
              'total_price', oi.total_price,
              'product_name', COALESCE(oi.product_snapshot->>'name', p.name, 'Optical Frame'),
              'brand', COALESCE(oi.product_snapshot->>'brand', b.name, 'Shivam Optical'),
              'color', COALESCE(oi.product_snapshot->>'color', pv.color_name, 'Standard'),
              'lens_package', oi.product_snapshot->>'lensPackage',
              'prescription', oi.product_snapshot->'prescription',
              'images', oi.product_snapshot->'images'
            ))
            FROM public.order_items oi
            LEFT JOIN public.products p ON p.id = oi.product_id
            LEFT JOIN public.brands b ON b.id = p.brand_id
            LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
            WHERE oi.order_id = o.id
          ), '[]'::json) as items
        FROM public.orders o
        WHERE 
          ($1::text IS NOT NULL AND (
            o.guest_phone ILIKE '%' || $1 || '%' OR 
            RIGHT(REGEXP_REPLACE(COALESCE(o.guest_phone, ''), '\D', '', 'g'), 10) = $2
          )) OR
          ($3::text IS NOT NULL AND LOWER(o.guest_email) = $3) OR
          ($4::uuid IS NOT NULL AND o.customer_id = $4)
        ORDER BY o.created_at DESC
        LIMIT 50;`,
        [phone || null, cleanPhone || null, cleanEmail || null, validCustomerId || null]
      );
      return NextResponse.json({ success: true, orders: res.rows });
    }

    return NextResponse.json({ success: false, error: "Query parameter required (tracking, phone, email, or customerId)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
