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

async function testFetch() {
  const defaultRes = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true);
  console.log('Without range - count returned:', defaultRes.data?.length, 'error:', defaultRes.error?.message);

  const rangeRes = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true)
    .range(0, 4999);
  console.log('With .range(0, 4999) - count returned:', rangeRes.data?.length, 'error:', rangeRes.error?.message);
}

testFetch().catch(console.error);
