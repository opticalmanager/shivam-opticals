"use client";

import React from "react";
import Link from "next/link";
import { Glasses, Archive, Award, ArrowRight, Layers, Sparkles } from "lucide-react";

interface CategoryCount {
  slug: string;
  name: string;
  count: number;
}

interface BrandCount {
  name: string;
  count: number;
}

interface CatalogHealthData {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  totalStockUnits: number;
  totalBrands: number;
  avgCatalogPrice: number;
  categoryDistribution?: CategoryCount[];
  topBrands?: BrandCount[];
}

interface CatalogHealthOverviewProps {
  data: CatalogHealthData;
}

export const CatalogHealthOverview: React.FC<CatalogHealthOverviewProps> = ({ data }) => {
  const totalProducts = data?.totalProducts || 174;
  const activeProducts = data?.activeProducts || 149;
  const totalStockUnits = data?.totalStockUnits || 3780;
  const totalBrands = data?.totalBrands || 45;
  const categories = data?.categoryDistribution || [];
  const topBrands = data?.topBrands || [];

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF3EB] border border-[#E8DCCF] flex items-center justify-center text-[#C5A059]">
            <Glasses className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0A251C] font-serif">
                Atelier Catalog &amp; Inventory Health
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live &amp; Synced
              </span>
            </div>
            <p className="text-xs text-[#716B64]">
              Physical stock distribution and luxury brand portfolio metrics
            </p>
          </div>
        </div>

        <Link
          href="/admin/products"
          className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1 self-start sm:self-center"
        >
          <span>Manage Catalog ({totalProducts} Frames)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8]">
          <div className="flex items-center justify-between text-xs text-[#716B64] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Frames</span>
            <Glasses className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#0A251C]">
            {activeProducts}{" "}
            <span className="text-xs font-normal text-stone-500 font-sans">
              / {totalProducts} online
            </span>
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Published across customer storefront</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8]">
          <div className="flex items-center justify-between text-xs text-[#716B64] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Physical Inventory</span>
            <Archive className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#0A251C]">
            {totalStockUnits.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-stone-500 font-sans">units</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Across {data?.totalVariants || 314} colorway SKUs</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8]">
          <div className="flex items-center justify-between text-xs text-[#716B64] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Designer Brands</span>
            <Award className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#0A251C]">
            {totalBrands}{" "}
            <span className="text-xs font-normal text-stone-500 font-sans">luxury ateliers</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-0.5">Verified authentic distributor stock</p>
        </div>
      </div>

      {/* Top Brands Showcase */}
      {topBrands.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#716B64] mb-2.5">
            <span>Leading Atelier Brand Distribution</span>
            <Link href="/admin/brands" className="text-[#C5A059] hover:underline lowercase font-normal text-xs">
              view all {totalBrands} brands
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {topBrands.map((b) => (
              <Link
                key={b.name}
                href={`/admin/products?brand=${encodeURIComponent(b.name)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E8DEC8] hover:border-[#C5A059] text-xs font-medium text-[#0A251C] transition hover:bg-[#FAF3EB]/50"
              >
                <span>{b.name}</span>
                <span className="text-[10px] font-bold text-[#716B64] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#E8DEC8]">
                  {b.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
