import React from "react";

export function CatalogLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* Subheader Banner Skeleton */}
      <div className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto space-y-2">
          <div className="h-3 w-32 bg-[#E8DEC8] rounded-full animate-pulse" />
          <div className="h-8 w-64 bg-[#E8DEC8] rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-[#E8DEC8]/60 rounded-md animate-pulse" />
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Filter Rail Skeleton */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-5 space-y-5 animate-pulse">
              <div className="h-5 w-28 bg-[#E8DEC8] rounded-md" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3.5 w-24 bg-[#FAF3EB] rounded-md" />
                    <div className="h-3.5 w-6 bg-[#FAF3EB] rounded-full" />
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8DEC8] pt-4 space-y-3">
                <div className="h-4 w-20 bg-[#E8DEC8] rounded-md" />
                <div className="h-8 w-full bg-[#FAF3EB] rounded-lg" />
              </div>
            </div>
          </aside>

          {/* Right Product Grid Skeleton */}
          <section className="lg:col-span-3 space-y-6">
            {/* Search and Sort Bar */}
            <div className="h-12 w-full bg-white rounded-xl border border-[#E8DEC8] animate-pulse" />

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E8DEC8] p-4 flex flex-col justify-between shadow-xs animate-pulse"
                >
                  <div className="w-full aspect-[4/3] bg-[#FAF3EB] rounded-xl mb-3 flex items-center justify-center">
                    <div className="w-24 h-12 rounded-full border-2 border-stone-200/60 opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-[#F4EFEA] rounded-full" />
                    <div className="h-4 w-3/4 bg-[#E8DEC8]/60 rounded-md" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-4 w-14 bg-[#C5A059]/25 rounded-md" />
                      <div className="h-3 w-10 bg-[#FAF3EB] rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
