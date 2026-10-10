"use client";

import React, { useState, useEffect } from "react";
import { Plus, Sparkles, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StoredBrand } from "@/lib/adminDb";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<StoredBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("Italy");
  const [tagline, setTagline] = useState("");

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands || []);
      }
    } catch (err) {
      console.warn("Failed to fetch brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          origin: origin.trim(),
          tagline: tagline.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Brand added to catalog");
        setIsModalOpen(false);
        setName("");
        setTagline("");
        fetchBrands();
      } else {
        toast.error("Failed to add brand", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error creating brand", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Brand deleted");
        fetchBrands();
      } else {
        toast.error("Delete failed", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Delete error", { description: err.message });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Designer Brands & Maisons
          </h1>
          <p className="text-xs text-stone-500">
            Authorized luxury eyewear labels, origins, and atelier partnerships
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Brand</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-[#E8DCCF] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#FAF7F2] text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-4">Brand Name</th>
                <th className="py-3 px-3">Heritage / Origin</th>
                <th className="py-3 px-3">Tagline</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0A251C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{b.name}</span>
                  </td>
                  <td className="py-3 px-3 text-stone-700">
                    {b.origin}
                  </td>
                  <td className="py-3 px-3 text-stone-500">
                    {b.tagline || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Authorized
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <h3 className="font-bold text-[#0A251C] font-serif text-base">New Designer Brand</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lindberg"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Origin Country</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Denmark"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Danish Architectural Titanium Eyewear"
                  className="w-full px-3 py-2 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-stone-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {saving ? "Saving..." : "Add Brand"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
