"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  ExternalLink,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminGlobalSearchModal } from "../common/AdminGlobalSearchModal";

interface AdminHeaderProps {
  onToggleMobileMenu: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: "order" | "alert" | "info";
  href: string;
}

function getRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileMenu }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const res = await fetch("/api/admin/dashboard?range=all");
        const data = await res.json();
        if (data.success && isMounted) {
          const items: NotificationItem[] = [];

          if (Array.isArray(data.recentOrders)) {
            data.recentOrders.slice(0, 4).forEach((o: any) => {
              const productName = o.items?.[0]?.product_name || "Eyewear item";
              items.push({
                id: `order-${o.id}`,
                title: `Order #${o.order_number}`,
                desc: `${productName} • ₹${Number(o.total_amount).toLocaleString("en-IN")} (${o.status.replace(/_/g, " ")})`,
                time: getRelativeTime(o.created_at),
                unread: o.status === "confirmed" || o.status === "optician_assembly",
                type: "order",
                href: `/admin/orders/${o.id}`,
              });
            });
          }

          if (Array.isArray(data.lowStock)) {
            data.lowStock.slice(0, 3).forEach((s: any) => {
              items.push({
                id: `stock-${s.id}`,
                title: "Low Inventory Alert",
                desc: `${s.product_name} (${s.color_name || s.sku}) is down to ${s.stock_quantity} units`,
                time: "Action needed",
                unread: true,
                type: "alert",
                href: `/admin/inventory`,
              });
            });
          }

          setNotifications(items);
        }
      } catch (err) {
        console.warn("Failed to load header notifications:", err);
      } finally {
        if (isMounted) setLoadingNotifications(false);
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <header className="h-14 bg-[#FAF3EB] border-b border-[#E8DCCF] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle + Global Search Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle mobile menu"
            className="lg:hidden p-1.5 rounded-md text-stone-600 hover:text-[#0A251C] hover:bg-black/5 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Input Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full max-w-sm px-3 py-1.5 rounded-md bg-white border border-[#E8DCCF] text-xs text-stone-400 hover:border-stone-400 transition-colors shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0A251C] transition-colors" />
              <span className="text-stone-500 group-hover:text-stone-700">
                Search products, orders, patrons...
              </span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-[#FAF3EB] px-1.5 py-0.5 rounded border border-stone-200 text-stone-500">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Add Product, View Store, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Product Action */}
          <Link href="/admin/products/new">
            <Button
              type="button"
              size="sm"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#b59049] text-white text-xs h-8 px-3 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Frame</span>
            </Button>
          </Link>

          {/* View Storefront Link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#0A251C] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition-colors font-medium"
          >
            <span>View Store</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
              className="relative p-1.5 rounded-md text-stone-600 hover:text-[#0A251C] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A059]" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8DCCF] rounded-xl shadow-xl overflow-hidden z-40 animate-in fade-in duration-150">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A251C]">Live Atelier Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white font-mono font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="py-8 text-center text-xs text-stone-400 flex flex-col items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-spin text-[#C5A059]" />
                      <span>Checking optical activity...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-stone-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                      <p className="font-semibold text-stone-700">All clear</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        No urgent orders or low inventory alerts
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setIsNotificationsOpen(false)}
                        className={`block p-3 text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                          n.unread ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-[#0A251C] flex items-center gap-1.5">
                            {n.type === "order" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {n.type === "alert" && <AlertCircle className="w-3 h-3 text-amber-600" />}
                            <span>{n.title}</span>
                          </span>
                          <span className="text-[10px] text-stone-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{n.desc}</p>
                      </Link>
                    ))
                  )}
                </div>

                <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <Link
                    href="/admin/orders"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[#C5A059] font-semibold hover:underline"
                  >
                    View All Orders
                  </Link>
                  <Link
                    href="/admin/inventory"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-stone-500 hover:text-stone-800"
                  >
                    Stock Management
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-stone-300 hidden sm:block" />

          {/* Admin User Profile Pill with Sign Out Trigger */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-[#0A251C] text-[#C5A059] flex items-center justify-center text-xs font-serif font-bold shadow-xs shrink-0">
              SO
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-[#0A251C] flex items-center gap-1">
                <span>Super Admin</span>
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-[10px] text-stone-500 font-mono">shivamoptical999@gmail.com</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/admin/auth/logout", { method: "POST" });
                  window.location.href = "/admin/login";
                } catch {
                  window.location.href = "/admin/login";
                }
              }}
              title="Sign Out of Administrator Terminal"
              className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-black/5 transition cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <AdminGlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
