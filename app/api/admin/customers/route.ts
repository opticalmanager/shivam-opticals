import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    let searchCondition = "";
    const params: any[] = [];
    if (search) {
      searchCondition = `WHERE (
        c.full_name ILIKE $1 OR 
        c.email ILIKE $1 OR 
        c.phone ILIKE $1 OR 
        c.city ILIKE $1
      )`;
      params.push(`%${search}%`);
    }

    // Query combining real profiles with order history
    const customersRes = await query(`
      WITH registered_patrons AS (
        SELECT 
          p.id as profile_id,
          COALESCE(NULLIF(p.full_name, ''), 'Valued Patron') as full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          p.created_at,
          (
            SELECT ca.city FROM public.customer_addresses ca 
            WHERE ca.user_id = p.id 
            ORDER BY ca.is_default DESC, ca.created_at DESC 
            LIMIT 1
          ) as address_city,
          (
            SELECT ca.state FROM public.customer_addresses ca 
            WHERE ca.user_id = p.id 
            ORDER BY ca.is_default DESC, ca.created_at DESC 
            LIMIT 1
          ) as address_state
        FROM public.profiles p
      ),
      guest_order_patrons AS (
        SELECT 
          NULL::uuid as profile_id,
          COALESCE(o.shipping_address->>'fullName', o.guest_name, 'Guest Patron') as full_name,
          COALESCE(o.guest_email, '') as email,
          COALESCE(o.guest_phone, o.shipping_address->>'phone', '') as phone,
          MIN(o.created_at) as created_at,
          o.shipping_address->>'city' as address_city,
          o.shipping_address->>'state' as address_state
        FROM public.orders o
        WHERE NOT EXISTS (
          SELECT 1 FROM public.profiles pr 
          WHERE (pr.email IS NOT NULL AND pr.email = o.guest_email) 
             OR (pr.phone IS NOT NULL AND pr.phone = o.guest_phone)
        )
        GROUP BY 
          COALESCE(o.shipping_address->>'fullName', o.guest_name, 'Guest Patron'),
          o.guest_email,
          COALESCE(o.guest_phone, o.shipping_address->>'phone', ''),
          o.shipping_address->>'city',
          o.shipping_address->>'state'
      ),
      all_unique_patrons AS (
        SELECT * FROM registered_patrons
        UNION ALL
        SELECT * FROM guest_order_patrons
      ),
      patron_aggregates AS (
        SELECT 
          u.profile_id,
          u.full_name,
          u.email,
          u.phone,
          COALESCE(u.address_city, 'New Delhi') as city,
          COALESCE(u.address_state, 'Delhi') as state,
          u.created_at as registered_date,
          COUNT(o.id)::int as total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0)::numeric as total_spent,
          MAX(o.created_at) as last_order_date,
          COALESCE(
            BOOL_OR(EXISTS (
              SELECT 1 FROM public.order_items oi 
              WHERE oi.order_id = o.id AND oi.product_snapshot->'prescription' IS NOT NULL
            )), 
            false
          ) as has_prescription_on_file,
          COALESCE(
            (
              SELECT json_agg(json_build_object(
                'id', o_sub.id,
                'order_number', o_sub.order_number,
                'total_amount', o_sub.total_amount,
                'status', o_sub.status,
                'payment_status', o_sub.payment_status,
                'created_at', o_sub.created_at
              ) ORDER BY o_sub.created_at DESC)
              FROM public.orders o_sub
              WHERE (u.email != '' AND o_sub.guest_email = u.email)
                 OR (u.phone != '' AND o_sub.guest_phone = u.phone)
            ),
            '[]'::json
          ) as orders_list,
          (
            SELECT oi.product_snapshot->'prescription'
            FROM public.order_items oi
            JOIN public.orders o2 ON o2.id = oi.order_id
            WHERE ((u.email != '' AND o2.guest_email = u.email) OR (u.phone != '' AND o2.guest_phone = u.phone))
              AND oi.product_snapshot->'prescription' IS NOT NULL
            LIMIT 1
          ) as latest_rx
        FROM all_unique_patrons u
        LEFT JOIN public.orders o ON (u.email != '' AND o.guest_email = u.email) OR (u.phone != '' AND o.guest_phone = u.phone)
        GROUP BY 
          u.profile_id,
          u.full_name,
          u.email,
          u.phone,
          u.address_city,
          u.address_state,
          u.created_at
      )
      SELECT c.* 
      FROM patron_aggregates c
      ${searchCondition}
      ORDER BY c.total_spent DESC, c.total_orders DESC, c.registered_date DESC;
    `, params);

    // Compute stats
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(DISTINCT COALESCE(NULLIF(email, ''), phone)) FROM (
          SELECT email, phone FROM public.profiles
          UNION
          SELECT guest_email as email, guest_phone as phone FROM public.orders
        ) u WHERE COALESCE(NULLIF(email, ''), phone) IS NOT NULL) as total_customers,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as cumulative_ltv,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as avg_order_value
      FROM public.orders;
    `);

    const statsRow = statsRes.rows[0] || {};
    const totalCustomersCount = parseInt(statsRow.total_customers || "0", 10) || customersRes.rows.length;

    return NextResponse.json({
      success: true,
      customers: customersRes.rows,
      stats: {
        totalCustomers: totalCustomersCount,
        cumulativeLtv: Number(statsRow.cumulative_ltv || 0),
        avgOrderValue: Math.round(Number(statsRow.avg_order_value || 0)),
      },
    });
  } catch (error: any) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load customers" },
      { status: 500 }
    );
  }
}
