"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowRight, ShieldCheck, Phone, Mail, UserCheck } from "lucide-react";

interface PatronItem {
  id: string;
  phone?: string | null;
  email?: string | null;
  full_name?: string | null;
  role: string;
  created_at: string;
}

interface RecentPatronsCardProps {
  patrons: PatronItem[];
}

export const RecentPatronsCard: React.FC<RecentPatronsCardProps> = ({ patrons = [] }) => {
  return (
    <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A251C] font-serif">Verified Boutique Patrons</h3>
              <p className="text-xs text-[#716B64]">Registered customer accounts &amp; profiles</p>
            </div>
          </div>
          <Link
            href="/admin/customers"
            className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Patrons Feed */}
        <div className="space-y-2.5">
          {patrons && patrons.length > 0 ? (
            patrons.map((p) => {
              const name = p.full_name?.trim() || "Valued Patron";
              const initial = name.charAt(0).toUpperCase() || "P";
              const contact = p.phone || p.email || "Registered Account";

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 bg-[#FAF7F2]/50 hover:bg-[#FAF3EB]/60 hover:border-[#C5A059] transition"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-full bg-[#0A251C] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0 border border-[#C5A059]/40">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0A251C] truncate">{name}</span>
                        <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-[#716B64] truncate flex items-center gap-1 mt-0.5">
                        {p.phone ? (
                          <Phone className="w-3 h-3 text-[#C5A059] shrink-0" />
                        ) : (
                          <Mail className="w-3 h-3 text-[#C5A059] shrink-0" />
                        )}
                        <span>{contact}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono shrink-0">
                    {new Date(p.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#716B64]">
              No patrons registered yet.
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-4 mt-4 border-t border-stone-100">
        <Link
          href="/admin/customers"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#FAF7F2] border border-[#E8DEC8] hover:border-[#C5A059] text-xs font-semibold text-[#0A251C] transition hover:bg-[#FAF3EB]"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Manage All Patron Profiles</span>
        </Link>
      </div>
    </div>
  );
};
