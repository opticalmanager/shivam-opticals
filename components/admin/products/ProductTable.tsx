import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit3, Trash2, CheckSquare, Square, Star } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeleteClick: (id: string, name: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteClick,
}) => {
  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));
  const someSelected =
    products.some((p) => selectedIds.includes(p.id)) && !allSelected;

  return (
    <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-10">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  aria-label="Select all"
                  className="text-stone-400 hover:text-[#0A251C] flex items-center cursor-pointer"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                  ) : someSelected ? (
                    <Square className="w-4 h-4 text-[#C5A059] fill-[#C5A059]/20" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">Frame Model</th>
              <th className="py-3 px-3">Category &amp; Brand</th>
              <th className="py-3 px-3">Shape &amp; Material</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const primaryImage =
                (typeof p.img === "string" && p.img) ||
                (Array.isArray(p.images) && typeof p.images[0] === "string" && p.images[0]) ||
                (Array.isArray(p.images) && (p.images[0] as any)?.url) ||
                (p as any).primary_image_url ||
                "/images/clean_frame_1.png";

              const brandName = p.brand || (p as any).brand_name || "Shivam Optical";
              const categoryName = p.category || (p as any).category_name || "Eyewear";
              const price = typeof p.price === "number" ? p.price : Number(p.price || (p as any).base_price || 0);
              const origPrice = p.originalPrice
                ? Number(p.originalPrice)
                : (p as any).original_price
                ? Number((p as any).original_price)
                : undefined;
              const colorwaysCount =
                p.colorVariants?.length ||
                (p as any).variants?.length ||
                (Array.isArray(p.colors) ? p.colors.length : 1);

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-[#FAF7F2]/80 transition-colors group ${
                    isSelected ? "bg-amber-50/30" : ""
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(p.id)}
                      aria-label="Select row"
                      className="text-stone-400 hover:text-[#0A251C] flex items-center cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Product Name + Thumbnail */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                        <img
                          src={primaryImage}
                          alt={p.name}
                          className="w-full h-full object-contain p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/clean_frame_1.png";
                          }}
                        />
                      </div>
                      <div className="min-w-0 max-w-[240px]">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-bold text-[#0A251C] hover:text-[#C5A059] hover:underline truncate block"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-stone-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{p.shape || "Eyewear"}</span>
                          <span>&bull;</span>
                          <span>{colorwaysCount} Colorway(s)</span>
                          {p.rating ? (
                            <>
                              <span>&bull;</span>
                              <span className="inline-flex items-center gap-0.5 text-[#C5A059] font-semibold">
                                <Star className="w-2.5 h-2.5 fill-[#C5A059] text-[#C5A059]" />
                                {Number(p.rating).toFixed(1)}
                                {p.reviewCount ? (
                                  <span className="text-stone-400 font-normal">({p.reviewCount})</span>
                                ) : null}
                              </span>
                            </>
                          ) : null}
                          {Array.isArray(p.colors) && p.colors.length > 0 && (
                            <div className="inline-flex items-center gap-0.5 ml-1">
                              {p.colors.slice(0, 4).map((c, i) => (
                                <span
                                  key={i}
                                  className="w-2 h-2 rounded-full border border-stone-300"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                              {p.colors.length > 4 && (
                                <span className="text-[9px] text-stone-400">+{p.colors.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {p.tag && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-[#C5A059] border border-amber-200/80 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                            {p.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category & Brand */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-stone-800">{brandName}</div>
                    <div className="text-[10px] text-stone-500">{categoryName}</div>
                  </td>

                  {/* Shape & Material */}
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-stone-800 capitalize">{p.shape || "Spectacles"}</div>
                    <div className="text-[10px] text-stone-400 truncate max-w-[140px]">
                      {p.material || "Beta Titanium"}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#0A251C]">
                      ₹{price.toLocaleString("en-IN")}
                    </div>
                    {origPrice && origPrice > price && (
                      <div className="text-[10px] text-stone-400 line-through">
                        ₹{origPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    <StatusBadge status={(p as any).is_active !== false ? "published" : "draft"} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        aria-label="Edit product"
                        className="p-1 rounded text-stone-500 hover:text-[#0A251C] hover:bg-stone-100 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(p.id, p.name)}
                        aria-label="Delete product"
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
