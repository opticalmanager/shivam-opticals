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
 * Historical duplicate slug aliases mapping legacy scraped slugs to canonical products.
 */
export const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  // Legacy Nov 16 scraped slugs mapping to active canonical products
  "ray-ban-5438i": "so-ray-ban-rb5438",
  "ray-ban-5389i": "so-ray-ban-rb5389",
  "ray-ban-2140-sunglasses": "so-ray-ban-rb2140",
  "ray-ban-2140f-sunglasses": "so-ray-ban-rb2140f",
  "ray-ban-2198-sunglasses": "so-ray-ban-rb2198",
  "ray-ban-3025-sunglasses": "so-ray-ban-rb-3025",
  "ray-ban-3025-i-sunglasses": "so-ray-ban-rb-3025",
  "ray-ban-3025i-sunglasses": "so-ray-ban-rb-3025",
  "ray-ban-3129-i-sunglasses": "so-ray-ban-rb3129",
  "ray-ban-7027i": "so-ray-ban-rb7027",
  "ray-ban-6483": "so-ray-ban-rb6483",
  "ray-ban-6483i": "so-ray-ban-rb6483",
  "ray-ban-6488": "so-ray-ban-rb6488",
  "ray-ban-6496": "so-ray-ban-rb6496",
  "ray-ban-4340v": "so-ray-ban-rb4340v",
  "ray-ban-6539i": "so-ray-ban-rb653",
  "ray-ban-7025": "so-ray-ban-rb7025",
  "ray-ban-3779-sunglasses": "so-ray-ban-rb3779",
  "ray-ban-3785i-sunglasses": "so-ray-ban-rb3785",
  "ray-ban-3016-sunglasses": "so-ray-ban-rb3016",
  "ray-ban-3755-sunglasses": "so-ray-ban-rb3755",
  "ray-ban-3447-sunglasses": "so-ray-ban-rb3447",
  "ray-ban-3787-sunglasses": "so-ray-ban-rb3787",
  "ray-ban-4349-i-sunglasses": "so-ray-ban-rb4349",
  "rayban-4349i-sunglasses": "so-ray-ban-rb4349",

  // Deduplicated active catalog items
  "so-carrera-7a": "so-carrera-ca37yg",
  "so-ray-ban-rb-3928": "so-ray-ban-rb3928",
  "so-ray-ban-rb417": "so-ray-ban-rb4171",
  "so-ray-ban-mix": "so-ray-ban-rb2140",
  "so-ray-ban-sheet": "so-ray-ban-rb2140",
  "so-ray-ban-rb-3785": "so-ray-ban-rb3785",
  "so-vogue-vo570": "so-vogue-vo5701",
  "so-ray-ban-rb702-5": "so-ray-ban-rb7025",
  "rayban-3774b-sunglasses": "so-ray-ban-rb3774d",
  "3025 9286/48 62": "so-ray-ban-rb-3025",
  "so-ray-ban-rb302s": "so-ray-ban-rb-3025",
  "so-ray-ban-rb3025": "so-ray-ban-rb-3025",
  "rayban-3723-i-sunglasses": "rayban-3723-sunglasses",
};

export function isValidProductImageUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("banner") ||
    lower.includes("promo") ||
    lower.includes("crop_") ||
    lower.includes("inspect_") ||
    lower.includes("precision1") ||
    lower.includes("alcon") ||
    lower.includes("contact_lens") ||
    lower.includes("contact-lens") ||
    lower.includes("baush") ||
    lower.includes("bausch") ||
    lower.includes("optima38") ||
    lower.includes("optima") ||
    lower.includes("biotrue") ||
    lower.includes("purevision") ||
    lower.includes("acuvue") ||
    lower.includes("coopervision") ||
    lower.includes("freshlook") ||
    lower.includes("soflens") ||
    lower.includes("airoptix") ||
    lower.includes("air_optix") ||
    lower.includes("dailies")
  ) {
    return false;
  }
  return true;
}

export function getProductFallbackImage(shape?: string, slug?: string): string {
  const normalized = (shape || "").toLowerCase();
  if (normalized.includes("round") || normalized.includes("oval")) return "/images/clean_frame_2.png";
  if (normalized.includes("square")) return "/images/clean_frame_3.png";
  if (normalized.includes("aviator") || normalized.includes("pilot")) return "/images/clean_frame_4.png";
  if (slug) {
    const charCode = slug.charCodeAt(slug.length - 1) % 4;
    return `/images/clean_frame_${charCode + 1}.png`;
  }
  return "/images/clean_frame_1.png";
}

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
    .filter((url: string | undefined): url is string => Boolean(url && isValidProductImageUrl(url)));

  const defaultFallback = getProductFallbackImage(row.shape || localMatch?.shape, row.slug || localMatch?.slug);

  const resolvedImages =
    rawImages.length > 0
      ? rawImages
      : localMatch?.images && localMatch.images.length > 0
      ? localMatch.images.filter(isValidProductImageUrl)
      : row.img && isValidProductImageUrl(row.img)
      ? [row.img]
      : [defaultFallback];

  const price = Number(row.base_price || row.price || localMatch?.price || 0);
  const originalPrice = row.original_price ? Number(row.original_price) : localMatch?.originalPrice;
  const calculatedDiscountPct =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : row.discount_pct || localMatch?.discountPct;

  const mappedVariants: ProductVariant[] =
    row.product_variants && row.product_variants.length > 0
      ? row.product_variants.map((v: any) => {
          // 1. Direct matched images by variant_id
          const directImages = (row.product_images || [])
            .filter((img: any) => img.variant_id === v.id && isValidProductImageUrl(img.url || img.image_url))
            .sort(
              (a: any, b: any) =>
                (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) ||
                (a.display_order || 0) - (b.display_order || 0)
            )
            .map((img: any) => (img.url || img.image_url)?.trim())
            .filter((url: string | undefined): url is string => Boolean(url && isValidProductImageUrl(url)));

          // 2. Fallback token-based match in image URLs if directImages is empty
          let fallbackImages: string[] = [];
          if (directImages.length === 0) {
            const rawTokens = [
              v.sku?.split("-").pop(),
              ...(v.color_name || "").split(/[\s/_-]+/),
              v.barcode,
            ].filter((t): t is string => Boolean(t && t.length >= 2 && !/^(black|brown|gold|grey|gray|blue|green|unisex|men|women)$/i.test(t)));

            if (rawTokens.length > 0) {
              fallbackImages = (row.product_images || [])
                .filter((img: any) => {
                  const url = (img.url || img.image_url || "").toLowerCase();
                  return isValidProductImageUrl(url) && rawTokens.some((tok) => url.includes(tok.toLowerCase()));
                })
                .map((img: any) => (img.url || img.image_url)?.trim())
                .filter((url: string | undefined): url is string => Boolean(url && isValidProductImageUrl(url)));
            }
          }

          const variantImgs = directImages.length > 0 ? directImages : fallbackImages;
          const validVarImg =
            variantImgs.length > 0
              ? variantImgs[0]
              : resolvedImages[0];

          return {
            id: v.id,
            colorName: (v.color_name || "").replace(/\s+/g, " ").trim(),
            colorHex: v.color_hex || "#1A1A1A",
            image: validVarImg,
            images: variantImgs.length > 0 ? variantImgs : [validVarImg],
            inStock: v.stock_quantity > 0,
          };
        })
      : row.color_variants && row.color_variants.length > 0
      ? row.color_variants.map((cv: any, cIdx: number) => ({
          id: cv.id || `var-${row.slug || row.id}-${cIdx}`,
          colorName: (cv.colorName || "").replace(/\s+/g, " ").trim(),
          colorHex: cv.colorHex || "#1A1A1A",
          image: cv.featuredImage || cv.gallery?.[0] || resolvedImages[0],
          images: cv.gallery || (cv.featuredImage ? [cv.featuredImage] : [resolvedImages[0]]),
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

  const rawCategorySlug =
    (typeof row.category === "object" ? row.category?.slug : row.category) ||
    localMatch?.category;

  const lowerName = (row.name || "").toLowerCase();
  const lowerSlug = (row.slug || "").toLowerCase();
  const lowerDesc = (row.description || "").toLowerCase();

  const hasExplicitSunglassTerm =
    lowerName.includes("sunglass") ||
    lowerSlug.includes("sunglass") ||
    lowerName.includes("/g/s") ||
    lowerSlug.includes("/g/s") ||
    lowerName.includes("/p/s") ||
    lowerSlug.includes("/p/s") ||
    lowerName.endsWith("/s") ||
    lowerName.includes("/s ");

  const isExplicitClearOptical =
    !hasExplicitSunglassTerm &&
    (lowerName.includes("spectacle") ||
      lowerName.includes("optical frame") ||
      lowerDesc.includes("lens colour clear") ||
      lowerDesc.includes("lens color clear") ||
      lowerDesc.includes("lens color: clear") ||
      lowerDesc.includes("lens colour: clear") ||
      lowerSlug === "so-carrera-ca1145" ||
      lowerSlug === "so-burberry-399" ||
      lowerSlug === "so-burberry-3991" ||
      lowerSlug === "so-tommy-hilfiger-th1079" ||
      lowerSlug === "so-ray-ban-rb4340v");

  let resolvedCategory =
    rawCategorySlug ||
    (hasExplicitSunglassTerm ? "sunglasses" : "eyeglasses");

  if (isExplicitClearOptical && resolvedCategory === "sunglasses") {
    resolvedCategory = "eyeglasses";
  } else if (hasExplicitSunglassTerm && resolvedCategory === "eyeglasses") {
    resolvedCategory = "sunglasses";
  }

  const resolvedType =
    row.type ||
    localMatch?.type ||
    (resolvedCategory === "sunglasses"
      ? "sunglasses"
      : resolvedCategory === "eyeglasses"
      ? "eyeglasses"
      : resolvedCategory === "contact-lenses"
      ? "contact-lenses"
      : resolvedCategory === "meta-smart"
      ? "meta-smart"
      : resolvedCategory === "kids"
      ? (lowerName.includes("sunglass") ? "sunglasses" : "eyeglasses")
      : "eyeglasses");

  return {
    id: row.slug || row.id,
    slug: row.slug || row.id,
    brand: row.brand?.name || localMatch?.brand || "Shivam Optical",
    name: row.name,
    subtitle: row.subtitle || localMatch?.subtitle,
    price,
    originalPrice,
    discountPct: calculatedDiscountPct,
    category: resolvedCategory,
    type: resolvedType,
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
    img: resolvedImages[0] || defaultFallback,
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
    colorVariants:
      mappedVariants.length > 0
        ? mappedVariants.map((mv, mIdx) => ({
            id: mv.id,
            variantId: mv.id,
            sku: row.product_variants?.[mIdx]?.sku || `${row.slug || row.id}-${mIdx + 1}`,
            colorName: mv.colorName,
            colorHex: mv.colorHex,
            price,
            compareAtPrice: originalPrice || null,
            available: mv.inStock !== false,
            featuredImage: mv.image,
            gallery: mv.images && mv.images.length > 0 ? mv.images : (mv.image ? [mv.image] : []),
          }))
        : (row.color_variants || localMatch?.colorVariants || []).map((cv: any) => ({
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
  const rawClean = decodeURIComponent(slug).toLowerCase();
  const cleanSlug = PRODUCT_SLUG_ALIASES[rawClean] || rawClean;

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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
    if (isUuid) {
      query = query.or(`slug.eq.${cleanSlug},id.eq.${cleanSlug}`);
    } else {
      query = query.eq("slug", cleanSlug);
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
      result = result.filter(
        (p) =>
          (p.category === "sunglasses" || p.type === "sunglasses") &&
          p.category !== "eyeglasses" &&
          p.category !== "meta-smart"
      );
    } else if (cat === "eyeglasses") {
      result = result.filter(
        (p) =>
          (p.category === "eyeglasses" || p.type === "eyeglasses") &&
          p.category !== "sunglasses" &&
          p.category !== "meta-smart"
      );
    } else if (cat === "meta-smart" || cat === "smart-glasses" || cat === "meta") {
      result = result.filter((p) => {
        const c = (p.category || "").toLowerCase();
        const t = (p.type || "").toLowerCase();
        const n = (p.name || "").toLowerCase();
        const s = (p.slug || "").toLowerCase();
        return (
          c === "meta-smart" ||
          t === "meta-smart" ||
          s.startsWith("so-ray-ban-meta") ||
          /\bmeta\b/i.test(n) ||
          /\bmeta\b/i.test(s)
        );
      });
    } else if (cat === "kids") {
      result = result.filter((p) => p.category === "kids" || p.gender === "kids");
    } else if (cat === "new" || cat === "new-arrivals") {
      result = result.filter((p) => p.isNewArrival);
    } else if (cat === "sale") {
      result = result.filter((p) => p.isOnSale || (p.originalPrice && p.originalPrice > p.price));
    } else if (cat === "contact-lenses" || cat === "contacts" || cat === "contact lenses") {
      result = result.filter((p) => {
        const c = (p.category || "").toLowerCase();
        const t = (p.type || "").toLowerCase();
        return c.includes("contact") || t.includes("contact");
      });
    } else {
      result = result.filter((p) => {
        const c = (p.category || "").toLowerCase();
        return c === cat || c.replace(/-/g, " ") === cat.replace(/-/g, " ");
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

  // 7. Search Query Filter (Smart Multi-Token Logic)
  if (filterState.searchQuery && filterState.searchQuery.trim() !== "") {
    const rawTokens = filterState.searchQuery
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (rawTokens.length > 0) {
      result = result.filter((p) => {
        const searchable = [
          p.name,
          p.brand,
          p.shape,
          p.category,
          p.type,
          p.color,
          p.colorHex,
          ...(p.colors || []),
          p.material,
          p.subtitle,
          p.description,
          p.sku,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return rawTokens.every((token) => {
          const cleanToken = token.replace(/[-_]/g, "");
          const cleanSearchable = searchable.replace(/[-_]/g, "");
          return searchable.includes(token) || cleanSearchable.includes(cleanToken);
        });
      });
    }
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
