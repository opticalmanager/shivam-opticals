import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// GET /api/wishlist?userId=...&sessionId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("userId");
    const rawSessionId = searchParams.get("sessionId");

    const validUserId = isValidUUID(rawUserId) ? rawUserId : null;
    const effectiveSessionId = !validUserId ? (rawUserId || rawSessionId) : rawSessionId;

    if (!validUserId && !effectiveSessionId) {
      return NextResponse.json({ wishlistIds: [], items: [] });
    }

    let sql = "";
    let params: any[] = [];

    if (validUserId) {
      sql = `SELECT product_id, created_at FROM public.wishlist_items WHERE user_id = $1 ORDER BY created_at DESC;`;
      params = [validUserId];
    } else {
      sql = `SELECT product_id, created_at FROM public.wishlist_items WHERE session_id = $1 ORDER BY created_at DESC;`;
      params = [effectiveSessionId];
    }

    const res = await query(sql, params);
    const wishlistIds = res.rows.map((row) => row.product_id);

    return NextResponse.json({ wishlistIds, items: res.rows });
  } catch (err: any) {
    console.error("GET /api/wishlist error:", err);
    return NextResponse.json({ error: err.message, wishlistIds: [] }, { status: 500 });
  }
}

// POST /api/wishlist
// Body: { action: 'toggle' | 'add' | 'sync', productId?: string, userId?: string, sessionId?: string, localIds?: string[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "toggle", productId, userId: rawUserId, sessionId: rawSessionId, localIds } = body;

    const validUserId = isValidUUID(rawUserId) ? rawUserId : null;
    const effectiveSessionId = !validUserId ? (rawUserId || rawSessionId) : rawSessionId;

    if (!validUserId && !effectiveSessionId) {
      return NextResponse.json({ error: "userId or sessionId is required" }, { status: 400 });
    }

    // Action 1: Batch sync local storage wishlist to DB
    if (action === "sync" && Array.isArray(localIds) && localIds.length > 0) {
      let existingRes: any;
      if (validUserId) {
        existingRes = await query(
          `SELECT product_id FROM public.wishlist_items WHERE user_id = $1;`,
          [validUserId]
        );
      } else {
        existingRes = await query(
          `SELECT product_id FROM public.wishlist_items WHERE session_id = $1;`,
          [effectiveSessionId]
        );
      }

      const existingSet = new Set((existingRes.rows || []).map((r: any) => r.product_id));
      const newIdsToInsert = localIds.filter((pid: string) => !existingSet.has(pid));

      for (const pid of newIdsToInsert) {
        if (validUserId) {
          await query(
            `INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [validUserId, pid]
          );
        } else {
          await query(
            `INSERT INTO public.wishlist_items (session_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [effectiveSessionId, pid]
          );
        }
      }

      // Return refreshed wishlist IDs
      let refreshRes: any;
      if (validUserId) {
        refreshRes = await query(
          `SELECT product_id FROM public.wishlist_items WHERE user_id = $1 ORDER BY created_at DESC;`,
          [validUserId]
        );
      } else {
        refreshRes = await query(
          `SELECT product_id FROM public.wishlist_items WHERE session_id = $1 ORDER BY created_at DESC;`,
          [effectiveSessionId]
        );
      }

      const wishlistIds = refreshRes.rows.map((r: any) => r.product_id);
      return NextResponse.json({ success: true, wishlistIds });
    }

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Action 2: Add single product
    if (action === "add") {
      if (validUserId) {
        await query(
          `INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [validUserId, productId]
        );
      } else {
        await query(
          `INSERT INTO public.wishlist_items (session_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [effectiveSessionId, productId]
        );
      }
      return NextResponse.json({ success: true, isWishlisted: true });
    }

    // Action 3: Toggle product (add if not exists, remove if exists)
    let checkRes: any;
    if (validUserId) {
      checkRes = await query(
        `SELECT id FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2;`,
        [validUserId, productId]
      );
    } else {
      checkRes = await query(
        `SELECT id FROM public.wishlist_items WHERE session_id = $1 AND product_id = $2;`,
        [effectiveSessionId, productId]
      );
    }

    if (checkRes.rows && checkRes.rows.length > 0) {
      // Remove
      if (validUserId) {
        await query(
          `DELETE FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2;`,
          [validUserId, productId]
        );
      } else {
        await query(
          `DELETE FROM public.wishlist_items WHERE session_id = $1 AND product_id = $2;`,
          [effectiveSessionId, productId]
        );
      }
      return NextResponse.json({ success: true, isWishlisted: false, action: "removed" });
    } else {
      // Add
      if (validUserId) {
        await query(
          `INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2);`,
          [validUserId, productId]
        );
      } else {
        await query(
          `INSERT INTO public.wishlist_items (session_id, product_id) VALUES ($1, $2);`,
          [effectiveSessionId, productId]
        );
      }
      return NextResponse.json({ success: true, isWishlisted: true, action: "added" });
    }
  } catch (err: any) {
    console.error("POST /api/wishlist error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/wishlist
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let productId = searchParams.get("productId");
    let userId = searchParams.get("userId");
    let sessionId = searchParams.get("sessionId");
    let clearAll = searchParams.get("clearAll") === "true";

    if (!productId && !clearAll) {
      try {
        const body = await req.json();
        productId = body.productId;
        userId = body.userId || userId;
        sessionId = body.sessionId || sessionId;
        clearAll = body.clearAll || clearAll;
      } catch {
        // No body provided
      }
    }

    const validUserId = isValidUUID(userId) ? userId : null;
    const effectiveSessionId = !validUserId ? (userId || sessionId) : sessionId;

    if (!validUserId && !effectiveSessionId) {
      return NextResponse.json({ error: "userId or sessionId required" }, { status: 400 });
    }

    if (clearAll) {
      if (validUserId) {
        await query(`DELETE FROM public.wishlist_items WHERE user_id = $1;`, [validUserId]);
      } else {
        await query(`DELETE FROM public.wishlist_items WHERE session_id = $1;`, [effectiveSessionId]);
      }
    } else if (productId) {
      if (validUserId) {
        await query(
          `DELETE FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2;`,
          [validUserId, productId]
        );
      } else {
        await query(
          `DELETE FROM public.wishlist_items WHERE session_id = $1 AND product_id = $2;`,
          [effectiveSessionId, productId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/wishlist error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
