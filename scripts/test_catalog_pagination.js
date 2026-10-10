const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function parseEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[match[1]] = val;
      }
    }
  }
  return env;
}

const env = parseEnv('c:/Users/Gaurav/Desktop/shivam-optics/.env.local');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetchAll() {
  console.log('Testing paginated fetch of all products from Supabase...');
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(name, slug),
        category:categories(name, slug),
        product_variants(*),
        product_images(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Supabase error:', error);
      break;
    }
    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    console.log(`Fetched chunk: ${data.length} rows (total so far: ${allRows.length})`);
    if (data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
    }
  }

  console.log('\nTotal products fetched from Shivam Supabase:', allRows.length);
  const brands = new Set(allRows.map(r => r.brand?.name).filter(Boolean));
  const categories = new Set(allRows.map(r => r.category?.slug).filter(Boolean));
  console.log('Unique brands count:', brands.size);
  console.log('Sample brands:', Array.from(brands).slice(0, 15));
  console.log('Unique categories:', Array.from(categories));
}

testFetchAll().catch(console.error);
