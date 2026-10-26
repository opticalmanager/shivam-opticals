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

        {/* 7 Shapes Rail / Grid */}
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-6 md:gap-8 items-center text-center pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {shapes.map((s) => {
            const href = `/products?type=${type}&shape=${encodeURIComponent(
              s.queryParam
            )}`;

            return (
              <Link
                key={s.name}
                href={href}
                onClick={() => onSelectShape?.(s.queryParam)}
                className="shape-card group flex flex-col items-center flex-shrink-0 snap-start w-[88px] sm:w-auto cursor-pointer transition duration-300"
              >
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#FCFAF7] border border-[#E8DEC8]/60 flex items-center justify-center p-2 transition-all duration-300 group-hover:scale-105 group-hover:border-[#C5A059] group-hover:shadow-md">
                  <img
                    src={s.img}
                    alt={`${s.name} ${type === "sunglasses" ? "Sunglasses" : "Eyeglasses"}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="mt-2 text-xs sm:text-sm md:text-[15px] font-bold text-[#1E2250] group-hover:text-[#C5A059] transition-colors whitespace-nowrap">
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
