import { getCatalogProducts } from '../lib/productsService';

async function main() {
  console.log('Fetching catalog products via getCatalogProducts()...');
  const products = await getCatalogProducts(true);
  console.log('Total products loaded:', products.length);
  if (products.length > 0) {
    const sample = products[0];
    console.log('Sample product:', {
      id: sample.id,
      name: sample.name,
      brand: sample.brand,
      price: sample.price,
      imagesCount: sample.images.length,
      variantsCount: sample.variants?.length,
      tryOnEnabled: sample.tryOnEnabled,
      specs: sample.specs,
      packageDimensions: sample.packageDimensions
    });

    // Check unique brands and categories
    const brands = new Set(products.map(p => p.brand).filter(Boolean));
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    const shapes = new Set(products.map(p => p.shape).filter(Boolean));
    console.log('\nUnique brands count in loaded products:', brands.size);
    console.log('Sample brands:', Array.from(brands).slice(0, 10));
    console.log('Unique categories:', Array.from(categories));
    console.log('Unique shapes:', Array.from(shapes));
  }
}

main().catch(console.error);
