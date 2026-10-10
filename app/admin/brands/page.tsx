"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, X, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [brandToDelete, setBrandToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands || []);
      }
    } catch (err) {
      console.warn("Failed to load brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openAddModal = () => {
    setEditingBrand(null);
    setName("");
    setOrigin("");
    setTagline("");
    setDescription("");
    setIsFeatured(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    setName(brand.name || "");
    setOrigin(brand.origin || "");
    setTagline(brand.tagline || "");
    setDescription(brand.description || "");
    setIsFeatured(Boolean(brand.is_featured));
    setIsActive(Boolean(brand.is_active));
    setIsModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingBrand) {
        // PATCH
        const res = await fetch("/api/admin/brands", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBrand.id,
            name: name.trim(),
            origin: origin.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            is_featured: isFeatured,
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Brand updated successfully");
          setIsModalOpen(false);
          fetchBrands();
        } else {
          toast.error("Failed to update brand", { description: data.error });
        }
      } else {
        // POST
        const res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            origin: origin.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            isFeatured,
            isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Brand created successfully");
          setIsModalOpen(false);
          fetchBrands();
        } else {
          toast.error("Failed to create brand", { description: data.error });
        }
      }
    } catch (err: any) {
      toast.error("Error saving brand", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (brand: any) => {
    try {
      const res = await fetch("/api/admin/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: brand.id,
          is_featured: !brand.is_featured,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${brand.name}" ${!brand.is_featured ? "featured in boutique collections" : "set to standard"}`);
        fetchBrands();
      } else {
        toast.error("Failed to update featured state", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Update error", { description: err.message });
    }
  };

  const handleToggleActive = async (brand: any) => {
    try {
      const res = await fetch("/api/admin/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: brand.id,
          is_active: !brand.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${brand.name}" ${!brand.is_active ? "activated" : "deactivated"}`);
        fetchBrands();
      } else {
        toast.error("Failed to update status", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Update error", { description: err.message });
    }
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands?id=${brandToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Brand "${brandToDelete.name}" deleted successfully`);
        setBrandToDelete(null);
        fetchBrands();
      } else {
        toast.error("Cannot delete brand", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Luxury Eyewear Maisons & Brands
          </h1>
          <p className="text-xs text-stone-500">
            Authorized luxury optical houses, origin, and featured boutique collections
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={openAddModal}
          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Brand</span>
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
                <th className="py-3 px-3">Origin / Atelier</th>
                <th className="py-3 px-3">Tagline</th>
                <th className="py-3 px-3">Products</th>
                <th className="py-3 px-3">Featured</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0A251C]">{b.name}</td>
                  <td className="py-3 px-3 text-stone-600">{b.origin || "International"}</td>
                  <td className="py-3 px-3 text-stone-500 max-w-xs truncate">
                    {b.tagline || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full">
                      {b.product_count || 0}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(b)}
                      title="Click to toggle featured state"
                      className="cursor-pointer"
                    >
                      {b.is_featured ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 transition-colors">
                          Featured
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
                          Standard
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(b)}
                      title="Click to toggle active status"
                      className="cursor-pointer"
                    >
                      <StatusBadge status={b.is_active ? "active" : "inactive"} size="sm" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        title="Edit Brand"
                        className="p-1 rounded text-stone-500 hover:text-[#0A251C] hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandToDelete(b)}
                        title="Delete Brand"
                        className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-2">
              <h3 className="text-sm font-bold text-[#0A251C]">
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Add Luxury Brand"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jacques Marie Mage"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Origin / Atelier</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Los Angeles / Japan"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Artisanal Precision & Limited Batches"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Boutique background and craft details..."
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-1 space-y-2">
                <label className="flex items-center gap-2 text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                  />
                  <span>Feature in Storefront Marquee &amp; Navigation</span>
                </label>

                <label className="flex items-center gap-2 text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                  />
                  <span>Active in Storefront Catalog</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs bg-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white cursor-pointer"
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : editingBrand ? (
                    "Update Brand"
                  ) : (
                    "Create Brand"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-sm rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#0A251C]">Delete Brand</h3>
                <p className="text-xs text-stone-500">
                  Are you sure you want to delete &ldquo;{brandToDelete.name}&rdquo;?
                </p>
              </div>
            </div>

            {parseInt(brandToDelete.product_count || "0", 10) > 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                This brand currently has {brandToDelete.product_count} product(s) attached. You must reassign or remove them before deleting this brand.
              </p>
            ) : (
              <p className="text-xs text-stone-600">
                This brand has 0 products attached and can be safely removed. This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBrandToDelete(null)}
                className="text-xs bg-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteBrand}
                className="text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {deleting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
