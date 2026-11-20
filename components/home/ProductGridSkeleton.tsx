import React from "react";

export function ProductGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      aria-label="Loading collection"
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#E8DEC8] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs animate-pulse"
        >
          {/* Frame Photo Placeholder */}
          <div className="w-full aspect-[4/3] bg-[#FAF3EB] rounded-xl mb-3 flex items-center justify-center overflow-hidden">
            <div className="w-24 h-12 rounded-full border-2 border-stone-200/60 opacity-40" />
          </div>

          {/* Details Skeleton */}
          <div className="space-y-2">
            {/* Brand pill skeleton */}
            <div className="h-3 w-16 bg-[#F4EFEA] rounded-full" />
            {/* Title skeleton */}
            <div className="h-4 w-3/4 bg-[#E8DEC8]/60 rounded-md" />
            {/* Price skeleton */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-4 w-14 bg-[#C5A059]/25 rounded-md" />
              <div className="h-3 w-10 bg-[#FAF3EB] rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
