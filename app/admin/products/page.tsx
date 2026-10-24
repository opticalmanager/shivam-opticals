"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/products/ProductTable";
import { ProductFilterBar } from "@/components/admin/products/ProductFilterBar";
import { EmptyState } from "@/components/admin/common/EmptyState";
import { ConfirmDialog } from "@/components/admin/common/ConfirmDialog";
import { BulkActionBar } from "@/components/admin/common/BulkActionBar";
import { toast } from "sonner";
import { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [shape, setShape] = useState("");

  // Selections & Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (shape) params.set("shape", shape);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.pagination) setPagination(data.pagination);
        if (Array.isArray(data.shapes)) setShapes(data.shapes);
      }
    } catch (err) {
      console.warn("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, brand, shape, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
    ]).then(([catData, brandData]) => {
      if (catData.success) setCategories(catData.categories || []);
      if (brandData.success) setBrands(brandData.brands || []);
    });
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted from catalog");
        setDeleteDialog({ isOpen: false, id: "", name: "" });
        fetchProducts();
      } else {
        toast.error("Failed to delete", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Delete error", { description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const rows = products.map((p) => ({
      ID: p.id,
      Name: p.name || "Eyewear Frame",
      Brand: p.brand || (p as any).brand_name || "Shivam Optical",
      Category: p.category || (p as any).category_name || "Eyewear",
      Price: typeof p.price === "number" ? p.price : Number(p.price || (p as any).base_price || 0),
      Shape: p.shape || (p as any).specs?.shape || "Classic",
      Gender: p.gender || (p as any).specs?.gender || "Unisex",
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Name,Brand,Category,Price,Shape,Gender"]
        .concat(rows.map((r) => `"${r.ID}","${r.Name}","${r.Brand}","${r.Category}","${r.Price}","${r.Shape}","${r.Gender}"`))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `shivam_optics_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Eyewear Catalog & Frames
          </h1>
          <p className="text-xs text-stone-500">
            Manage handcrafted titanium & acetate models, descriptions, and pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="text-xs h-8 bg-white border-[#E8DCCF] text-stone-700"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-stone-500" />
            <span>Export Catalog</span>
          </Button>

          <Link href="/admin/products/new">
            <Button
              type="button"
              size="sm"
              className="text-xs h-8 bg-[#C5A059] hover:bg-[#b59049] text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add New Frame</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <ProductFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        brand={brand}
        onBrandChange={(val) => {
          setBrand(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        shape={shape}
        onShapeChange={(val) => {
          setShape(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        categories={categories}
        brands={brands}
        shapes={shapes}
        onReset={() => {
          setSearch("");
          setCategory("");
          setBrand("");
          setShape("");
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
      />

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E8DCCF]">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin mb-2" />
          <span className="text-xs text-stone-500 font-medium">Loading catalog frames...</span>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No Frames Found"
          description="No products match your search or filter criteria."
          actionLabel="Add New Frame"
          onAction={() => {}}
        />
      ) : (
        <>
          <ProductTable
            products={products}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onDeleteClick={(id, name) => setDeleteDialog({ isOpen: true, id, name })}
          />

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white border border-[#E8DCCF] rounded-xl text-xs text-stone-600 shadow-2xs">
              <div>
                Showing{" "}
                <span className="font-bold text-[#0A251C]">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#0A251C]">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#0A251C]">{pagination.total}</span> frames
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="p-1.5 rounded-md border border-[#E8DCCF] text-stone-600 hover:text-[#0A251C] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 rounded-md bg-[#FAF7F2] border border-[#E8DCCF] font-semibold text-[#0A251C] text-[11px]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="p-1.5 rounded-md border border-[#E8DCCF] text-stone-600 hover:text-[#0A251C] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Archive Frame"
        description={`Are you sure you want to remove "${deleteDialog.name}" from the active boutique catalog?`}
        confirmLabel="Archive"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, id: "", name: "" })}
      />
    </div>
  );
}
