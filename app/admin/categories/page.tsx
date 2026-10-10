"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, X, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirm modal
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.warn("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setName(category.name || "");
    setDescription(category.description || "");
    setDisplayOrder(category.display_order ?? 1);
    setIsActive(Boolean(category.is_active));
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        // PATCH
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: name.trim(),
            description: description.trim(),
            displayOrder: Number(displayOrder),
            isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Category updated successfully");
          setIsModalOpen(false);
          fetchCategories();
        } else {
          toast.error("Failed to update category", { description: data.error });
        }
      } else {
        // POST
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            displayOrder: Number(displayOrder),
            isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Category created successfully");
          setIsModalOpen(false);
          fetchCategories();
        } else {
          toast.error("Error creating category", { description: data.error });
        }
      }
    } catch (err: any) {
      toast.error("Error saving category", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: any) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          isActive: !category.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${category.name}" ${!category.is_active ? "activated" : "deactivated"}`);
        fetchCategories();
      } else {
        toast.error("Failed to update status", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Update error", { description: err.message });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${categoryToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Category "${categoryToDelete.name}" deleted successfully`);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        toast.error("Cannot delete category", { description: data.error });
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
            Categories &amp; Collections
          </h1>
          <p className="text-xs text-stone-500">
            Organize the storefront catalog into distinct optical hierarchies
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={openAddModal}
          className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Category</span>
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
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-3">Category Name</th>
                <th className="py-3 px-3">Slug</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Products</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-stone-500">
                    {c.display_order}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#0A251C]">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-500">{c.slug}</td>
                  <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                    {c.description || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full">
                      {c.product_count || 0}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      title="Click to toggle status"
                      className="cursor-pointer"
                    >
                      <StatusBadge status={c.is_active ? "active" : "inactive"} size="sm" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        title="Edit Category"
                        className="p-1 rounded text-stone-500 hover:text-[#0A251C] hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(c)}
                        title="Delete Category"
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
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meta Smart Glasses"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Category description..."
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DCCF] rounded-md text-xs text-[#0A251C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                  />
                  <span>Active in Storefront Navigation &amp; Filters</span>
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
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DCCF] w-full max-w-sm rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#0A251C]">Delete Category</h3>
                <p className="text-xs text-stone-500">
                  Are you sure you want to delete &ldquo;{categoryToDelete.name}&rdquo;?
                </p>
              </div>
            </div>

            {parseInt(categoryToDelete.product_count || "0", 10) > 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                This category currently has {categoryToDelete.product_count} product(s) assigned. You must reassign or remove them before deleting this category.
              </p>
            ) : (
              <p className="text-xs text-stone-600">
                This category has 0 products assigned and can be safely removed.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                className="text-xs bg-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteCategory}
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
