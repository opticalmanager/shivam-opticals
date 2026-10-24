const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function cleanDups() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const toDeactivate = [
      'so-carrera-7a',
      'so-carrera-cai',
      'so-ray-ban-rb-3928',
      'so-carrera-ca874',
      'so-ray-ban-rb417',
      'so-ray-ban-rb-3785',
      'so-vogue-vo5712west'
    ];

    for (const slug of toDeactivate) {
      await client.query('UPDATE public.products SET is_active = false, updated_at = NOW() WHERE slug = $1;', [slug]);
      console.log('Deactivated duplicate:', slug);
    }

    await client.query(`UPDATE public.products SET name = 'RAY BAN 0RB 3025 Aviator Metal', updated_at = NOW() WHERE slug = 'so-ray-ban-rb-3025';`);
    await client.query(`UPDATE public.products SET name = 'RAY BAN 0RX 7025-I 8282', updated_at = NOW() WHERE slug = 'so-ray-ban-rb702-5';`);

    await client.query('COMMIT');
    console.log('Committed disambiguation.');

  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDups();
