"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Glasses,
  Layers,
  Sparkles,
  Archive,
  Percent,
  Calendar,
  Megaphone,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  ExternalLink,
  Shield,
  Sliders,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const [settingsExpanded, setSettingsExpanded] = useState(
    pathname.startsWith("/admin/settings")
  );

  const sections: NavSection[] = [
    {
      title: "ADMIN",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "SALES",
      items: [
        { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
        { label: "Customers", href: "/admin/customers", icon: Users },
      ],
    },
    {
      title: "CATALOG",
      items: [
        { label: "Products", href: "/admin/products", icon: Glasses },
        { label: "Categories", href: "/admin/categories", icon: Layers },
        { label: "Brands", href: "/admin/brands", icon: Sparkles },
        { label: "Inventory", href: "/admin/inventory", icon: Archive },
      ],
    },
    {
      title: "STORE",
      items: [
        { label: "Discounts", href: "/admin/discounts", icon: Percent },
        { label: "Appointments", href: "/admin/appointments", icon: Calendar },
        { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Shipping", href: "/admin/shipping", icon: Truck },
        { label: "Payments", href: "/admin/payments", icon: CreditCard },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
  ];

  const settingsSubItems = [
    { label: "General", href: "/admin/settings?tab=general", icon: Sliders },
    { label: "Store", href: "/admin/settings?tab=store", icon: Store },
    { label: "Payments", href: "/admin/settings?tab=payments", icon: CreditCard },
    { label: "Shipping", href: "/admin/settings?tab=shipping", icon: Truck },
    { label: "Notifications", href: "/admin/settings?tab=notifications", icon: Bell },
    { label: "Admin & Roles", href: "/admin/settings?tab=roles", icon: Shield },
  ];

  const isRouteActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  const renderContent = () => (
    <div className="flex flex-col h-full bg-[#FAF3EB] border-r border-[#E8DCCF]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E8DCCF] flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0A251C] text-[#C5A059] flex items-center justify-center font-serif text-base font-bold shadow-xs">
            SO
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider font-serif text-[#0A251C] uppercase">
              Shivam Optics
            </div>
            <div className="text-[10px] text-stone-500 font-medium tracking-wide">
              Admin Operating System
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isRouteActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-all group",
                    active
                      ? "bg-white text-[#0A251C] shadow-xs font-semibold border border-[#E8DCCF]"
                      : "text-stone-600 hover:text-[#0A251C] hover:bg-black/5"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        active ? "text-[#C5A059]" : "text-stone-500 group-hover:text-[#0A251C]"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* SETTINGS SECTION (Collapsible accordion) */}
        <div className="space-y-0.5 pt-1">
          <button
            type="button"
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider text-stone-500 uppercase hover:text-[#0A251C] cursor-pointer"
          >
            <span>SETTINGS</span>
            {settingsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {settingsExpanded && (
            <div className="space-y-0.5 pl-2 border-l border-[#E8DCCF] ml-2">
              {settingsSubItems.map((sub) => {
                const isSubActive =
                  pathname === "/admin/settings" &&
                  typeof window !== "undefined" &&
                  window.location.search.includes(sub.href.split("?")[1]);

                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-all group text-xs",
                      isSubActive
                        ? "bg-white text-[#0A251C] shadow-xs font-semibold border border-[#E8DCCF]"
                        : "text-stone-600 hover:text-[#0A251C] hover:bg-black/5"
                    )}
                  >
                    <SubIcon
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        isSubActive ? "text-[#C5A059]" : "text-stone-500 group-hover:text-[#0A251C]"
                      )}
                    />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#E8DCCF] bg-[#FAF3EB] text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-stone-500">
          <span>Catalog Database</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live / Synced
          </span>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-md bg-white border border-[#E8DCCF] text-stone-700 hover:text-[#0A251C] hover:border-stone-400 text-xs font-medium transition-colors"
        >
          <Store className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Customer Storefront</span>
          <ExternalLink className="w-3 h-3 text-stone-400 ml-auto" />
        </Link>
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
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-md bg-white border border-[#E8DCCF] text-stone-600 hover:text-red-700 hover:border-red-300 text-xs font-medium transition-colors cursor-pointer group"
        >
          <LogOut className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-600" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0 z-30 select-none">
        {renderContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};
