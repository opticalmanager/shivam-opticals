import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ADMIN_EMAIL = "shivamoptical999@gmail.com";
const ADMIN_COOKIE_NAME = "shivam_admin_session";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "shivam_optics_super_secret_admin_atelier_jwt_hmac_2026_key";

/**
 * Edge-compatible HMAC-SHA256 signature verifier using Web Crypto API.
 */
async function verifyAdminSessionEdge(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    const expectedSigHex = Array.from(new Uint8Array(expectedSigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSigHex) {
      return false;
    }

    // Decode base64url payload
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false;
    }

    if (payload.email?.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Identify whether request arrives on the dedicated admin subdomain
  const isAdminSubdomain =
    host === "admin.shivamoptical.in" ||
    host.startsWith("admin.");

  // Check if session token exists & is cryptographically valid
  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticatedAdmin = await verifyAdminSessionEdge(sessionCookie);

  // =========================================================================
  // SCENARIO 1: Request arrives on admin.shivamoptical.in
  // =========================================================================
  if (isAdminSubdomain) {
    // If accessing root "/" on admin subdomain
    if (pathname === "/") {
      if (!isAuthenticatedAdmin) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    // If accessing "/login" on admin subdomain
    if (pathname === "/login") {
      if (isAuthenticatedAdmin) {
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      url.pathname = "/admin/login";
      return NextResponse.rewrite(url);
    }

    // If accessing direct "/admin/login" on admin subdomain, normalize to clean "/login"
    if (pathname === "/admin/login") {
      if (isAuthenticatedAdmin) {
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Rewrite clean paths like "/orders" -> "/admin/orders" if not starting with /admin or /api
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      // If not authenticated -> redirect to clean /login
      if (!isAuthenticatedAdmin) {
        url.pathname = "/login";
        url.searchParams.set("returnUrl", pathname);
        return NextResponse.redirect(url);
      }
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    // If explicit path /admin/* on admin subdomain
    if (pathname.startsWith("/admin")) {
      if (!isAuthenticatedAdmin) {
        url.pathname = "/login";
        url.searchParams.set("returnUrl", pathname.replace(/^\/admin/, "") || "/");
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }
  }

  // =========================================================================
  // SCENARIO 2: Request arrives on main storefront domain (shivamoptical.in)
  // =========================================================================
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  // In production, if anyone visits /admin on main domain -> redirect to admin.shivamoptical.in
  if (!isLocalhost && !isAdminSubdomain && pathname.startsWith("/admin")) {
    const targetUrl = new URL(
      `${pathname}${url.search}`,
      "https://admin.shivamoptical.in"
    );
    return NextResponse.redirect(targetUrl, 301);
  }

  // In localhost development or standard routing for /admin
  if (pathname.startsWith("/admin")) {
    const isLoginRoute = pathname === "/admin/login";

    // If already logged in and visiting login page, redirect to admin home
    if (isLoginRoute && isAuthenticatedAdmin) {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // If not authenticated and not on login page, redirect to login
    if (!isLoginRoute && !isAuthenticatedAdmin) {
      url.pathname = "/admin/login";
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Guard protected Admin API routes: /api/admin/* (except /api/admin/auth/*)
  if (pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/auth/")) {
    if (!isAuthenticatedAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Administrator authentication required.",
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
