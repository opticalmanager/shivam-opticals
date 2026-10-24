import { supabase } from "@/lib/supabase";
import { PRODUCTS } from "@/data/products";
import { Product, FilterState, ProductVariant } from "@/types";

/**
 * Shivam Optical - Product Service
 * Dual-layer product loading: fetches from Supabase / PostgreSQL if available,
 * with instantaneous in-memory caching, comprehensive filtering, and fallback to static catalog.
 */

let cachedProducts: Product[] | null = null;

export function invalidateProductsCache(): void {
  cachedProducts = null;
}

export const ALL_FALLBACK_PRODUCTS: Product[] = PRODUCTS;

/**
 * Helper to map Supabase row to client Product domain model
 */
function mapRowToProduct(row: any): Product {
  const localMatch = PRODUCTS.find((p) => p.id === row.slug || p.id === row.id);

  const rawImages = (row.product_images || [])
    .slice()
    .sort(
      (a: any, b: any) =>
        (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) ||
        (a.display_order || 0) - (b.display_order || 0)
    )
    .map((img: any) => img.url?.trim())
    .filter((url: string | undefined): url is string => Boolean(url));

  const resolvedImages =
    rawImages.length > 0
      ? rawImages
      : localMatch?.images && localMatch.images.length > 0
      ? localMatch.images
      : row.img
      ? [row.img]
      : ["/images/placeholder.jpg"];

  const price = Number(row.base_price || row.price || localMatch?.price || 0);
  const originalPrice = row.original_price ? Number(row.original_price) : localMatch?.originalPrice;
  const calculatedDiscountPct =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : row.discount_pct || localMatch?.discountPct;

  const mappedVariants: ProductVariant[] =
    row.product_variants && row.product_variants.length > 0
      ? row.product_variants.map((v: any) => {
          const variantImgObj = (row.product_images || []).find((img: any) => img.variant_id === v.id);
          const rawVarUrl = variantImgObj?.url || variantImgObj?.image_url;
          const validVarImg =
            rawVarUrl && (rawVarUrl.startsWith("/") || rawVarUrl.startsWith("http"))
              ? rawVarUrl.trim()
              : resolvedImages[0];

          return {
            id: v.id,
            colorName: (v.color_name || "").replace(/\s+/g, " ").trim(),
            colorHex: v.color_hex || "#1A1A1A",
            image: validVarImg,
            inStock: v.stock_quantity > 0,
          };
        })
      : row.color_variants && row.color_variants.length > 0
      ? row.color_variants.map((cv: any, cIdx: number) => ({
          id: cv.id || `var-${row.slug || row.id}-${cIdx}`,
          colorName: (cv.colorName || "").replace(/\s+/g, " ").trim(),
          colorHex: cv.colorHex || "#1A1A1A",
          image: cv.featuredImage || cv.gallery?.[0] || resolvedImages[0],
          inStock: cv.available !== false,
        }))
      : (localMatch?.variants || []).map((v: any) => ({
          ...v,
          colorName: (v.colorName || "").replace(/\s+/g, " ").trim(),
        }));

  // Derive distinct color hex values from variants or product row
  const variantColorHexes = mappedVariants
    .map((v) => v.colorHex)
    .filter((hex): hex is string => Boolean(hex && typeof hex === "string" && hex.startsWith("#")));

  const distinctColors = Array.from(new Set(variantColorHexes));
  const resolvedColors =
    distinctColors.length > 0
      ? distinctColors
      : row.colors || localMatch?.colors || (row.color_hex ? [row.color_hex] : ["#1A1A1A"]);

  return {
    id: row.slug || row.id,
    brand: row.brand?.name || localMatch?.brand || "Shivam Optical",
    name: row.name,
    subtitle: row.subtitle || localMatch?.subtitle,
    price,
    originalPrice,
    discountPct: calculatedDiscountPct,
    category: row.category?.slug || row.category || localMatch?.category || "sunglasses",
    type: row.type || localMatch?.type || "sunglasses",
    gender: (row.gender || localMatch?.gender || "unisex") as any,
    shape: (row.shape || localMatch?.shape || "rectangle") as any,
    rimType: (row.rim_type || localMatch?.rimType || "full-rim") as any,
    material: (row.material || localMatch?.material || "acetate") as any,
    color: row.color || localMatch?.color || "Black",
    colorHex: row.color_hex || localMatch?.colorHex || "#1A1A1A",
    colors: resolvedColors,
    lensProperties: row.lens_properties || localMatch?.lensProperties || ["uv-protection"],
    size: row.size || localMatch?.size || "M",
    isNewArrival: Boolean(row.is_new_arrival ?? localMatch?.isNewArrival),
    isBestSeller: Boolean(row.is_best_seller ?? localMatch?.isBestSeller),
    isOnSale: Boolean(row.is_on_sale ?? localMatch?.isOnSale),
    isLimitedEdition: Boolean(row.is_limited_edition ?? localMatch?.isLimitedEdition),
    rating: Number(row.rating) || localMatch?.rating || 5.0,
    reviewCount: Number(row.review_count) || localMatch?.reviewCount || 0,
    img: resolvedImages[0] || "/images/placeholder.jpg",
    images: resolvedImages,
    description: row.description || localMatch?.description || "",
    specs: row.specs || localMatch?.specs || {
      lensWidth: 53,
      bridgeWidth: 18,
      templeLength: 145,
      frameWidth: 140,
      weight: "20g",
    },
    measurements: row.measurements || localMatch?.measurements || {
      lensWidth: 53,
      bridgeWidth: 18,
      templeLength: 145,
    },
    packageDimensions: row.package_dimensions || row.specs?.packageDimensions || localMatch?.packageDimensions,
    contactLensSpecs: row.specs?.contactLensSpecs || localMatch?.contactLensSpecs,
    colorVariants: (row.color_variants || localMatch?.colorVariants || []).map((cv: any) => ({
      ...cv,
      colorName: (cv.colorName || "").replace(/\s+/g, " ").trim(),
    })),
    sourceUrl: row.source_url || localMatch?.sourceUrl,
    variants: mappedVariants,
    tryOnEnabled: row.try_on_enabled ?? localMatch?.tryOnEnabled ?? false,
    tryOnModelUrl: row.try_on_model_url || localMatch?.tryOnModelUrl,
    tryOnConfig: row.try_on_configuration || localMatch?.tryOnConfig,
  };
}

/**
 * Fetch all active catalog products from Supabase with graceful fallback
 */
export async function getCatalogProducts(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && cachedProducts !== null) {
    return cachedProducts;
  }

  try {
    let allRows: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          brand:brands(name, slug),
          category:categories(name, slug),
          product_variants(*),
          product_images(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error || !data || data.length === 0) {
        break;
      }

      allRows = allRows.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    if (allRows.length === 0) {
      cachedProducts = [];
      return [];
    }

    const mapped: Product[] = allRows.map(mapRowToProduct);
    cachedProducts = mapped;
    return mapped;
  } catch (err) {
    console.warn("Product loading error:", err);
    cachedProducts = [];
    return [];
  }
}

/**
 * Fast single product fetch
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;
  const cleanSlug = decodeURIComponent(slug).toLowerCase();

  // 1. Fast in-memory catalog cache lookup (0 ms)
  if (cachedProducts && cachedProducts.length > 0) {
    const found = cachedProducts.find(
      (p) =>
        p.id.toLowerCase() === cleanSlug ||
        p.id.replace(/\s+/g, "-").toLowerCase() === cleanSlug
    );
    if (found) return found;
  }

  // 2. Direct single row lookup in Supabase
  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        brand:brands(name, slug),
        category:categories(name, slug),
        product_variants(*),
        product_images(*)
      `)
      .eq("is_active", true);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.maybeSingle();

    if (data && !error) {
      return mapRowToProduct(data);
    }
  } catch (err) {
    console.warn("Single product Supabase lookup error:", err);
  }

  // 3. Fallback to catalog or local static dataset
  const all = await getCatalogProducts();
  return (
    all.find(
      (p) =>
        p.id.toLowerCase() === cleanSlug ||
        p.id.replace(/\s+/g, "-").toLowerCase() === cleanSlug
    ) || null
  );
}

export const getProductById = getProductBySlug;

/**
 * Filter and sort catalog in-memory with maximum performance and zero latency.
 */
export function filterAndSortProducts(
  products: Product[],
  filterState: Partial<FilterState>
): Product[] {
  let result = [...products];

  // 1. Category Filter
  if (filterState.category && filterState.category !== "all") {
    const cat = filterState.category.toLowerCase();
    if (cat === "sunglasses") {
      result = result.filter((p) => p.category === "sunglasses" || p.type === "sunglasses");
    } else if (cat === "eyeglasses") {
      result = result.filter((p) => p.category === "eyeglasses" || p.type === "eyeglasses");
    } else if (cat === "meta-smart" || cat === "smart-glasses") {
      result = result.filter((p) => p.category === "meta-smart");
    } else if (cat === "kids") {
      result = result.filter((p) => p.category === "kids" || p.gender === "kids");
    } else if (cat === "new" || cat === "new-arrivals") {
      result = result.filter((p) => p.isNewArrival);
    } else if (cat === "sale") {
      result = result.filter((p) => p.isOnSale || (p.originalPrice && p.originalPrice > p.price));
    } else if (cat === "contact-lenses" || cat === "contacts" || cat === "contact lenses") {
      result = result.filter((p) => {
        const c = p.category?.toLowerCase();
        return c === "contact-lenses" || c === "contact lenses" || c === "contact lens" || p.type === "contact-lenses";
      });
    } else {
      result = result.filter((p) => {
        const c = p.category?.toLowerCase();
        return c === cat || c?.replace(/-/g, " ") === cat.replace(/-/g, " ");
      });
    }
  }

  // 1b. Strict New Arrivals Flag
  if (filterState.onlyNewArrivals) {
    result = result.filter((p) => p.isNewArrival);
  }

  // 1c. Strict Sale / Discount Filter
  if (filterState.onlySale) {
    result = result.filter((p) => p.isOnSale || (p.originalPrice && p.originalPrice > p.price));
  }

  if (filterState.minDiscount && filterState.minDiscount > 0) {
    result = result.filter((p) => {
      const discount =
        p.originalPrice && p.originalPrice > p.price
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : p.isOnSale
          ? 15
          : 0;
      return discount >= (filterState.minDiscount || 0);
    });
  }

  // 2. Gender Filter
  if (filterState.gender && filterState.gender.length > 0) {
    result = result.filter((p) => {
      if (filterState.gender.includes("men")) {
        return p.gender === "men" || p.gender === "unisex";
      }
      if (filterState.gender.includes("women")) {
        return p.gender === "women" || p.gender === "unisex";
      }
      if (filterState.gender.includes("kids")) {
        return p.gender === "kids" || p.category === "kids";
      }
      return filterState.gender.includes(p.gender);
    });
  }

  // 3. Brands Filter
  if (filterState.brands && filterState.brands.length > 0) {
    result = result.filter((p) => {
      const pBrand = (p.brand || "").toLowerCase().trim();
      return filterState.brands.some((brand) => {
        const target = brand.toLowerCase().trim();
        return (
          pBrand === target ||
          pBrand.replace(/[^a-z0-9]+/g, "-") === target ||
          pBrand.includes(target) ||
          p.id.toLowerCase().includes(target)
        );
      });
    });
  }

  // 4. Frame Shapes Filter
  if (filterState.shapes && filterState.shapes.length > 0) {
    result = result.filter((p) =>
      filterState.shapes?.some((s) => s.toLowerCase() === p.shape?.toLowerCase())
    );
  }

  // 5. Rim Types Filter
  if (filterState.rimTypes && filterState.rimTypes.length > 0) {
    result = result.filter((p) => {
      const r = (p.rimType || "").toLowerCase().replace(/[\s_]+/g, "-");
      return filterState.rimTypes.some((targetRim) => {
        const normTarget = targetRim.toLowerCase().replace(/[\s_]+/g, "-");
        if (normTarget === "half-rim" || normTarget === "semi-rimless") {
          return r === "half-rim" || r === "semi-rimless";
        }
        return r === normTarget;
      });
    });
  }

  // 6. Materials Filter
  if (filterState.materials && filterState.materials.length > 0) {
    result = result.filter((p) => p.material && filterState.materials.includes(p.material));
  }

  // 7. Search Query Filter
  if (filterState.searchQuery && filterState.searchQuery.trim() !== "") {
    const q = filterState.searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }

  // 8. Sorting
  if (filterState.sortBy === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (filterState.sortBy === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  } else if (filterState.sortBy === "newest") {
    result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
  } else if (filterState.sortBy === "rating") {
    result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  }

  return result;
}
