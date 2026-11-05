import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateTrackingId(): string {
  const prefix = "SO";
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomDigits}`;
}

export function getEstimatedDeliveryDate(daysToAdd: number = 4): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "https://www.shivamoptical.in";
}

/**
 * Resolves the actual customer storefront URL cleanly.
 * When accessed from the admin panel on admin.shivamoptical.in or an admin subdomain,
 * it returns the actual customer storefront URL (e.g., https://shivamoptical.in/ or https://www.shivamoptical.in/).
 * When accessed on localhost or standard domain, it returns the standard root "/".
 */
export function getStorefrontUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname, protocol, port } = window.location;
    if (hostname === "admin.shivamoptical.in" || hostname.startsWith("admin.")) {
      const storeHost = hostname.replace(/^admin\./, "");
      return `${protocol}//${storeHost}${port ? `:${port}` : ""}/`;
    }
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") + "/";
  }
  return "/";
}
