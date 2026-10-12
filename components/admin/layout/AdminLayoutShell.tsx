"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // If on admin login page, render full-screen gateway without admin sidebar & header
  if (
    pathname === "/admin/login" ||
    pathname === "/login" ||
    pathname?.endsWith("/login") ||
    pathname?.includes("/login")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0A251C] flex print:block print:bg-white">
      {/* Sidebar (Desktop persistent, mobile drawer) */}
      <div className="print:hidden">
        <AdminSidebar
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
      </div>

      {/* Main Administrative Work Area */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        <div className="print:hidden">
          <AdminHeader onToggleMobileMenu={() => setIsMobileNavOpen(true)} />
        </div>

        {/* Controlled Content Container (Strict max-w-[1400px], no over-stretching) */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
};
