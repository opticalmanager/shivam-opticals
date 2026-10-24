import type { Metadata } from "next";
import { AdminLayoutShell } from "@/components/admin/layout/AdminLayoutShell";

export const metadata: Metadata = {
  title: "Admin Operating System | Shivam Optical",
  description: "Enterprise administration and optical atelier management system for Shivam Optical.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
