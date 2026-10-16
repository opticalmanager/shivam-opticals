"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package, ShoppingBag, Users, ArrowRight, Loader2 } from "lucide-react";

interface SearchResult {
  type: "product" | "order" | "customer";
  title: string;
  subtitle: string;
  badge?: string;
  url: string;
}

interface AdminGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminGlobalSearchModal: React.FC<AdminGlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes, custRes] = await Promise.all([
          fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=3`).then((r) => r.json()),
          fetch(`/api/admin/orders?search=${encodeURIComponent(query)}&limit=3`).then((r) => r.json()),
          fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`).then((r) => r.json()),
        ]);

        const aggregated: SearchResult[] = [];

        if (prodRes.products) {
          prodRes.products.forEach((p: any) => {
            const price = p.base_price !== undefined ? Number(p.base_price) : Number(p.price || 0);
            const brand = p.brand_name || p.brand || "Shivam Opticals";
            const category = p.category_name || p.category || "Eyewear";
            aggregated.push({
              type: "product",
              title: p.name,
              subtitle: `${brand} • ₹${price.toLocaleString("en-IN")} • ${category}`,
              badge: p.is_active ? "Published" : "Draft",
              url: `/admin/products/${p.id}`,
            });
          });
        }

        if (orderRes.orders) {
          orderRes.orders.forEach((o: any) => {
            aggregated.push({
              type: "order",
              title: `Order ${o.order_number}`,
              subtitle: `${o.shipping_address?.fullName || o.guest_email} • ₹${Number(o.total_amount).toLocaleString("en-IN")} • ${o.status.replace(/_/g, " ")}`,
              badge: o.payment_status,
              url: `/admin/orders/${o.id}`,
            });
          });
        }

        if (custRes.customers) {
          custRes.customers.slice(0, 3).forEach((c: any) => {
            aggregated.push({
              type: "customer",
              title: c.full_name || "Guest Patron",
              subtitle: `${c.email} • ${c.phone || "No phone"} • ${c.total_orders} orders`,
              url: `/admin/customers`,
            });
          });
        }

        setResults(aggregated);
      } catch (err) {
        console.warn("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#E8DCCF] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-stone-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers, or SKUs..."
            className="w-full bg-transparent text-sm text-[#0A251C] placeholder:text-stone-400 focus:outline-hidden"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin shrink-0" />}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200 shrink-0">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2 space-y-1">
          {query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-stone-500">
              Type at least 2 characters to search across catalog, orders, and customer records.
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="py-8 text-center text-xs text-stone-500">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {results.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onClose();
                router.push(item.url);
              }}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAF3EB] cursor-pointer transition-colors border border-transparent hover:border-[#E8DCCF] group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059]">
                  {item.type === "product" && <Package className="w-4 h-4" />}
                  {item.type === "order" && <ShoppingBag className="w-4 h-4" />}
                  {item.type === "customer" && <Users className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#0A251C] truncate flex items-center gap-2">
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-normal">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">{item.subtitle}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#C5A059] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
