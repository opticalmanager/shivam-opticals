"use client";

import React from "react";
import Link from "next/link";

interface ShapeItem {
  name: string;
  queryParam: string;
  img: string;
}

interface ShapeFilterBarProps {
  title: string;
  type: "sunglasses" | "eyeglasses";
  shapes: ShapeItem[];
  onSelectShape?: (shape: string) => void;
}

export const ShapeFilterBar: React.FC<ShapeFilterBarProps> = ({
  title,
  type,
  shapes,
  onSelectShape,
}) => {
  return (
    <section className="py-10 sm:py-14 bg-white border-y border-[#E8E2D9]/60">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0C1033] tracking-tight mb-8">
          {title}
        </h2>

        {/* 7 Shapes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6 md:gap-8 items-center text-center">
          {shapes.map((s) => {
            const href = `/products?type=${type}&shape=${encodeURIComponent(
              s.queryParam
            )}`;

            return (
              <Link
                key={s.name}
                href={href}
                onClick={() => onSelectShape?.(s.queryParam)}
                className="shape-card group flex flex-col items-center cursor-pointer transition duration-300"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={s.img}
                    alt={`${s.name} ${type === "sunglasses" ? "Sunglasses" : "Eyeglasses"}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="mt-2.5 text-xs sm:text-sm md:text-[15px] font-bold text-[#1E2250] group-hover:text-[#C5A059] transition-colors">
                  {s.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
