import React from "react";

interface SalesPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesPoint[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const points = data || [];
  const hasData = points.length > 0;
  const totalPeriodRevenue = points.reduce((acc, p) => acc + Number(p.revenue), 0);
  const maxRevenue = Math.max(...points.map((p) => Number(p.revenue)), 10000);

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#0A251C] font-serif">Revenue & Orders Trend</h3>
          <p className="text-xs text-stone-500">Daily gross turnover across verified checkout orders</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
            <span className="text-stone-600">Daily Revenue</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-xs text-stone-400 border-b border-stone-100">
          No transactions recorded for the selected timeframe.
        </div>
      ) : (
        <div className="h-44 flex items-end justify-between gap-2 pt-4 border-b border-stone-100">
          {points.map((pt, idx) => {
            const rev = Number(pt.revenue);
            const heightPercent = totalPeriodRevenue > 0 && rev > 0
              ? Math.max(8, Math.round((rev / maxRevenue) * 100))
              : 4;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#0A251C] text-white px-2 py-1 rounded shadow-md whitespace-nowrap mb-1 pointer-events-none">
                  ₹{rev.toLocaleString("en-IN")} ({pt.orders} {pt.orders === 1 ? "order" : "orders"})
                </div>
                <div className="w-full max-w-[36px] bg-stone-100 rounded-t-sm relative flex flex-col justify-end overflow-hidden h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      rev > 0 ? "bg-[#C5A059] group-hover:bg-[#b59049]" : "bg-stone-200"
                    }`}
                  />
                </div>
                <span className="text-[11px] text-stone-500 font-medium mt-2 truncate max-w-[40px]">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
