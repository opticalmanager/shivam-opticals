const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Exact PDF price assignments for all updated products
const PRICE_UPDATES = [
  // --- CARRERA OVERPRICED & OUTLIERS ---
  {
    slug: 'so-carrera-ca-347',
    targetPrice: 9500,
    reason: 'PDF row FR00020B CA-347 284 9500 0.00 (was parsed as 95000)'
  },
  {
    slug: 'so-carrera-ca286',
    targetPrice: 8700,
    reason: 'PDF row FR00004B C A286 PJP 8700 0.00 (was parsed as 87000)'
  },
  {
    slug: 'so-carrera-ca8853',
    targetPrice: 12100,
    reason: 'PDF row FR00026B CA8853 003 12100 0. (was fallback 1990)'
  },
  {
    slug: 'so-carrera-caprw12-1n',
    targetPrice: 10500,
    reason: 'PDF row FR00014B CAPRW12/1N 10500 0.00 (was fallback 1990)'
  },
  {
    slug: 'so-carrera-carduc025',
    targetPrice: 10900,
    fixName: 'Carrera Ducati CARDUC025 807',
    reason: 'PDF row FR00051 CARDUC025 807 10900'
  },

  // --- BURBERRY OUTLIERS ---
  {
    slug: 'so-burberry-b1367',
    targetPrice: 19500,
    reason: 'PDF row FR0132.SB B1367 1337 (was fallback 1990)'
  },
  {
    slug: 'so-burberry-b3149',
    targetPrice: 21500,
    reason: 'PDF row SG00313B B3149 1109/87 (was fallback 1990)'
  },
  {
    slug: 'so-burberry-b2425-d',
    targetPrice: 10600,
    reason: 'PDF row FR01230B B2425-D 4121 10600 0.00 (was fallback 1990)'
  },

  // --- ARMANI EXCHANGE OUTLIER ---
  {
    slug: 'so-armani-exchange-ax305x',
    targetPrice: 8250,
    reason: 'PDF row FRO 1242B AX305.x 8257 (was fallback 1990)'
  },

  // --- TOMMY HILFIGER OUTLIERS ---
  {
    slug: 'so-tommy-hilfiger-th1116',
    targetPrice: 14700,
    reason: 'PDF row SCJ0024SB THI 1 16 14700 0.00 (was fallback 1990)'
  },
  {
    slug: 'so-tommy-hilfiger-th7214',
    targetPrice: 15300,
    reason: 'PDF row SG00255B TH7214 15300 0.00 (was fallback 1990)'
  },
  {
    slug: 'so-tommy-hilfiger-th2655',
    targetPrice: 15900,
    reason: 'PDF row SG00247B TH2655 15900 0.00 (was fallback 1990)'
  },
  {
    slug: 'so-tommy-hilfiger-th2680',
    targetPrice: 15100,
    reason: 'PDF row SG00252B TH2680 CIO (was fallback 1990)'
  },

  // --- VOGUE OUTLIERS (Were fallback 1990, real prices on sheet) ---
  {
    slug: 'so-vogue-vo5545w',
    targetPrice: 3590,
    reason: 'PDF row FR01276B VOS 545 W 44 3590'
  },
  {
    slug: 'so-vogue-vo5276',
    targetPrice: 6590,
    reason: 'PDF row vosc,76 2940 6590'
  },
  {
    slug: 'so-vogue-vo5497w44',
    targetPrice: 3590,
    reason: 'PDF row FR01278B VOS 497 W44 3590'
  },
  {
    slug: 'so-vogue-vo5712west',
    targetPrice: 7190,
    reason: 'PDF row FRO VOS712 we;st; 7190'
  },
  {
    slug: 'so-vogue-vo5712',
    targetPrice: 7190,
    reason: 'PDF row FRO VOS712 7190'
  },
  {
    slug: 'so-vogue-vo5719',
    targetPrice: 3690,
    reason: 'PDF row FR012S3B VOS719 2966 3690'
  },
  {
    slug: 'so-vogue-vo5120',
    targetPrice: 3890,
    reason: 'PDF row FRO 1260B VOS 1 20 2288 3890'
  },
  {
    slug: 'so-vogue-vo5701',
    targetPrice: 3290,
    reason: 'PDF row Vos 701 3290'
  },
  {
    slug: 'so-vogue-vo570',
    targetPrice: 3290,
    reason: 'PDF row Vos 701 3290 (was parsed as color 3289)'
  },
  {
    slug: 'so-vogue-vo70',
    targetPrice: 3290,
    reason: 'PDF row Vos 701 3290 (was parsed as color 3289)'
  },
  {
    slug: 'so-vogue-vo5',
    targetPrice: 3890,
    reason: 'PDF row FRO 1267B VOS12(i 3890'
  },
  {
    slug: 'so-vogue-vo571v',
    targetPrice: 4590,
    reason: 'PDF row VOS718 2820 4590'
  },
  {
    slug: 'so-vogue-vo512i',
    targetPrice: 3890,
    reason: 'PDF row FRO 1260B VOS 1 20 2288 3890'
  },

  // --- RAY-BAN OUTLIERS (Color codes were saved as price) ---
  {
    slug: 'so-ray-ban-rb8780d',
    targetPrice: 12290,
    reason: 'PDF row FR00093B RB8780D 1061 12290 (1061 was color code)'
  },
  {
    slug: 'so-ray-ban-rb3016',
    targetPrice: 13390,
    reason: 'PDF row SG00348B RB3016 6878/53 13390 (was OCR truncated as 1339)'
  },
  {
    slug: 'so-ray-ban-rb7216',
    targetPrice: 9790,
    reason: 'PDF row FR00073B RB7216 2000 9790 (2000 was color code)'
  },
  {
    slug: 'so-ray-ban-rb5397',
    targetPrice: 9990,
    reason: 'PDF row FR01215B RB5397 2000 9990 (2000 was color code)'
  },
  {
    slug: 'so-ray-ban-rb4340v',
    targetPrice: 9990,
    reason: 'PDF row FR01212B RB4340V 2000 9990 (2000 was color code)'
  },
  {
    slug: 'so-ray-ban-rb7025',
    targetPrice: 9990,
    reason: 'PDF row FR01207B RB7025 8475 9990 (8475 was color code)'
  },
  {
    slug: 'so-ray-ban-rb702-5',
    targetPrice: 9290,
    reason: 'PDF row RB702-5 8282 9290 (8282 was color code)'
  },
  {
    slug: 'so-ray-ban-rb5389',
    targetPrice: 6090,
    reason: 'PDF row FR01201B RB5389 2000 6090 (2000 was color code)'
  },
  {
    slug: 'so-ray-ban-rb5438',
    targetPrice: 6490,
    reason: 'PDF row FR00071B RB5438 8327 6490 (8327 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6335',
    targetPrice: 9290,
    reason: 'PDF row RB6335 2890 9290 (2890 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6425l',
    targetPrice: 6090,
    reason: 'PDF row FR00100B RB642.Sl 3009 6090 (3009 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6483',
    targetPrice: 5990,
    reason: 'PDF row FRO 1210B RB6483 2692 5990 (2692 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6488',
    targetPrice: 7090,
    reason: 'PDF row FR00088B RB64881 2502 7090 (2502 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6506',
    targetPrice: 6890,
    reason: 'PDF row FR0008.SB RB6506 2500 6890 (2500 was color code)'
  },
  {
    slug: 'so-ray-ban-rb7027',
    targetPrice: 6490,
    reason: 'PDF row FR00069B RB7027 8417 6490 (8417 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6489',
    targetPrice: 6110,
    reason: 'PDF row FR01223B RB6489 2502 6110 (2500 was fallback)'
  },
  {
    slug: 'so-ray-ban-rb5364',
    targetPrice: 5500,
    reason: 'PDF row RB5364 5809 5500 (was parsed as 2012)'
  },
  {
    slug: 'so-ray-ban-rb6323',
    targetPrice: 5290,
    reason: 'PDF row FR00083B RB6323 2500 5290 (2500 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6531',
    targetPrice: 6690,
    reason: 'PDF row FR01178B RB6531 2503 6690 (2503 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6304',
    targetPrice: 5290,
    reason: 'PDF row FR00077B RB6304 2509 5290 (2509 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6463',
    targetPrice: 6090,
    reason: 'PDF row FR01205B RB6463 2500 6090 (2500 was color code)'
  },
  {
    slug: 'so-ray-ban-rb7033',
    targetPrice: 6090,
    reason: 'PDF row FR01202B RB7033 2000 6090 (2000 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6303',
    targetPrice: 5290,
    reason: 'PDF row RB6303 2509 5290 (2500 was color code)'
  },
  {
    slug: 'so-ray-ban-rb6267',
    targetPrice: 5290,
    reason: 'PDF row RB62671 2502 5290 (2502 was color code)'
  },
  {
    slug: 'so-ray-ban-rb5423',
    targetPrice: 6690,
    reason: 'PDF row FR01204B RB5423 5753 6690 (5753 was color code)'
  },

  // --- RAY-BAN SUNGLASSES (Were fallback 1990) ---
  {
    slug: 'so-ray-ban-rb3025',
    targetPrice: 9690,
    reason: 'PDF row RB30251 001/51 9690'
  },
  {
    slug: 'so-ray-ban-rb3689',
    targetPrice: 9690,
    reason: 'PDF row RB.3689 9147/51'
  },
  {
    slug: 'so-ray-ban-rb2132',
    targetPrice: 13490,
    reason: 'PDF row RB2132 710/51 13490'
  },
  {
    slug: 'so-ray-ban-rb2140',
    targetPrice: 13490,
    reason: 'PDF row RB2140F 901/3F 13490'
  },
  {
    slug: 'so-ray-ban-rb2140f',
    targetPrice: 13490,
    reason: 'PDF row RB2140F 901/3F 13490'
  },
  {
    slug: 'so-ray-ban-rb3447',
    targetPrice: 9290,
    reason: 'PDF row SG00341B RB3447 001 9290'
  },
  {
    slug: 'so-ray-ban-rb4460',
    targetPrice: 13490,
    reason: 'PDF row SG00007B RB44601'
  },
  {
    slug: 'so-ray-ban-rb4940',
    targetPrice: 14290,
    reason: 'PDF row SG00332B RB494() 601/69 14290'
  },
  {
    slug: 'so-ray-ban-rb3695',
    targetPrice: 8790,
    reason: 'PDF row SG00328B RB36951 90355 1 8790'
  },
  {
    slug: 'so-ray-ban-rb4349',
    targetPrice: 9390,
    reason: 'PDF row RB43491 601/9A 9390'
  },
  {
    slug: 'so-ray-ban-rb-3928',
    targetPrice: 16190,
    reason: 'PDF row SG00334B RB3928 001/71 16190 (was 17490)'
  }
];

// Slugs of duplicate / dummy items to deactivate
const DUPLICATE_SLUGS_TO_DEACTIVATE = [
  // Ghost duplicates of Carrera 1069/S
  'so-carrera-cassio',
  'so-carrera-ca',
  'so-carrera-jsg',
  'so-carrera-yoo',
  'so-carrera-sheet',
  'so-carrera-calexotg',
  'so-carrera-carnio',
  'so-carrera-caprwiyin',
  'so-carrera-cacflxovg',

  // Ghost duplicates of Tommy Hilfiger 7206
  'so-tommy-hilfiger-metal',
  'so-tommy-hilfiger-vusi',
  'so-tommy-hilfiger-thi',
  'so-tommy-hilfiger-cio',
  'so-tommy-hilfiger-thio',

  // Ghost duplicates of Ray-Ban 2140
  'so-ray-ban-mix',
  'so-ray-ban-sheet',
  'so-ray-ban-sheetattach',
  'so-ray-ban-rbs397'
];

async function executeReconciliation() {
  const client = await pool.connect();
  try {
    console.log('Beginning atomic price reconciliation transaction...');
    await client.query('BEGIN');

    // 1. Deactivate duplicate dummy rows
    console.log(`\n1. Deactivating ${DUPLICATE_SLUGS_TO_DEACTIVATE.length} ghost duplicate / placeholder rows...`);
    for (const slug of DUPLICATE_SLUGS_TO_DEACTIVATE) {
      const res = await client.query(
        'UPDATE public.products SET is_active = false, updated_at = NOW() WHERE slug = $1 RETURNING id, name;',
        [slug]
      );
      if (res.rows.length > 0) {
        console.log(`   ✕ Deactivated: ${slug} (${res.rows[0].name})`);
      }
    }

    // 2. Apply verified PDF selling prices & calculate MRP with 10% discount
    console.log(`\n2. Applying verified PDF selling prices to ${PRICE_UPDATES.length} products...`);
    let updatedCount = 0;

    for (const item of PRICE_UPDATES) {
      const sellingPrice = item.targetPrice;
      const mrp = Math.round(sellingPrice / 0.90); // Exact 10% discount rule

      let query = `
        UPDATE public.products
        SET base_price = $1, original_price = $2, updated_at = NOW()
      `;
      const params = [sellingPrice, mrp];

      if (item.fixName) {
        query += `, name = $3 WHERE slug = $4 RETURNING id, name;`;
        params.push(item.fixName, item.slug);
      } else {
        query += ` WHERE slug = $3 RETURNING id, name;`;
        params.push(item.slug);
      }

      const res = await client.query(query, params);
      if (res.rows.length > 0) {
        const prodId = res.rows[0].id;
        // Also update product_variants
        await client.query(
          `UPDATE public.product_variants SET price_override = $1, updated_at = NOW() WHERE product_id = $2;`,
          [sellingPrice, prodId]
        );
        console.log(`   ✓ Updated ${item.slug}: Base = ₹${sellingPrice}, MRP = ₹${mrp} | Reason: ${item.reason}`);
        updatedCount++;
      } else {
        console.warn(`   ! Slug not found in DB: ${item.slug}`);
      }
    }

    // 3. Final pass: Ensure EVERY active product has original_price = ROUND(base_price / 0.90)
    console.log('\n3. Recalculating MRP across ALL active products to maintain strictly 10% discount...');
    const allActive = await client.query(`
      UPDATE public.products
      SET original_price = ROUND(base_price / 0.90), updated_at = NOW()
      WHERE is_active = true
      RETURNING id;
    `);
    console.log(`   ✓ Atomic MRP rule verified across all ${allActive.rowCount} active products.`);

    await client.query('COMMIT');
    console.log('\nTRANSACTION COMMITTED SUCCESSFULLY!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('TRANSACTION ROLLED BACK DUE TO ERROR:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

executeReconciliation().catch(console.error);
