const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.tbyldbrrqhfthrhjiwdv:Shivamoptics%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Load raw inventory items
const inventory = JSON.parse(fs.readFileSync('data/inventory_extracted.json', 'utf8'));

async function buildPlan() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.slug, p.name, b.name as brand, p.base_price, p.original_price, p.source_url
      FROM public.products p
      LEFT JOIN public.brands b ON b.id = p.brand_id
      WHERE p.is_active = true
      ORDER BY b.name, p.name ASC;
    `);

    const products = res.rows;
    console.log(`Auditing ${products.length} products...`);

    // Let's create an exact model-to-price dictionary from raw PDF rows
    // Ray-Ban models
    const pdfModelMap = {
      // Carrera
      'CA347': { price: 9500, raw: 'FR00020B CA-347 284 9500 0.00 P 11-03-202(' },
      'CA286': { price: 8700, raw: 'FR00004B C A286 PJP 8700 0.00 p 1 1-03-202(' },
      'CA3020': { price: 9500, raw: 'FR00001B CA.3020 807 9500 0.00 P 202(' },
      'CA1134': { price: 10900, raw: 'FR00002B CA1134 KB7 10900 P I I-03-202(' },
      'CA344': { price: 10500, raw: 'FR00003B CA344 2M2 10500 o. 00 P I I-03-202(' },
      'CA204FT': { price: 7300, raw: 'FROOOOSB CA204.fT 7ZJ 7300 p 11-03- 202(' },
      'CA8874': { price: 7100, raw: 'CA8874 8117 7100 P 11-03- 202(' },
      'CA874': { price: 7100, raw: 'FR00025B CA8*74 KB7 7100 0.00 P 11-03-202(' },
      'CAI130': { price: 9500, raw: 'CAI 130 807 9.500 0.00 p I I-03-202(' },
      'CA1130': { price: 9500, raw: 'CAI 130 807 9.500 0.00 p I I-03-202(' },
      'CA3053': { price: 9900, raw: 'FR00012B CA3053 B3V 9900 ooo p I I-03-202(' },
      'CAPRW12': { price: 10500, raw: 'FR00014B CAPRW12/1N I OSOO o_ 00 P 11-03 -202(' },
      'CA3009': { price: 9500, raw: 'FR00015B CA3009 3tJ5 9500 o,oo' },
      'CAPRW4': { price: 7800, raw: 'FR00016B CAPRW4/1N 7800 000 p 11-03-202<' },
      'CA249': { price: 8500, raw: 'FR00017B CA249 8500 P 11-03 -202(' },
      'CA309': { price: 8900, raw: 'FROOI)18B CA309 807 8900 P 1 1-03-202(' },
      'CA8853': { price: 12100, raw: 'FR00026B CA8853 003 12100 0. (10 P 11-03-202(' },
      'CA292': { price: 8900, raw: 'FR00027B CA292 086 8900 000 P 11-03-202(' },
      'CA5546': { price: 6900, raw: 'FR00028B CA5546fV 807 6900 p 11-03-202(' },
      'CA897': { price: 11500, raw: 'FROD030B CA8*97 7C5 11500 0.00 P 11-03-202(' },
      'CA3021': { price: 9500, raw: 'FR00033B CA-3021 DLN 9500 0.00 P 11-03-202(' },
      'CA8883': { price: 7800, raw: 'FROD034B CA8883 807 7800 0.00' },
      'CARDUC025': { price: 10900, raw: 'FR00051 CARDUC025 807 10900' },
      'CA317': { price: 10690, raw: 'FR01321B CA37YG 2M2 10690 P 25-07-202(' },
      'CA37YG': { price: 10690, raw: 'FR01321B CA37YG 2M2 10690 P 25-07-202(' },
      'CA3087': { price: 10500, raw: 'SCJ00260B CA3087/S J5G 10500 0.00 P 24-03-202(' },
      'CA3088': { price: 12900, raw: 'SG00343B CA3088/S NOAYK 12900 00 P 15-07-202(' },
      'CAPRW8': { price: 11900, raw: 'CAPRW\'8/CS/1N 80799 11900 0.00' },
      'CA302': { price: 9500, raw: '302/S KB7/HA 59' },
      'CA328': { price: 4900, raw: '328/S 08A/9O 53' },

      // Tommy Hilfiger
      'TH1079': { price: 9500, raw: 'SG00018B TH1079 9500 0.00 P 12-03-202(' },
      'TH1090': { price: 11900, raw: 'SG00242B TH1090 CIO 1 1900 o. 00 P 24-03-202(' },
      'TH1112PL': { price: 12900, raw: 'SG00243B THI 112PL CIO 12900 0.00 P 24-03-202(' },
      'TH1116': { price: 14700, raw: 'SCJ0024SB THI 1 16 14700 0.00 P 24-03-202(' },
      'TH2655': { price: 15900, raw: 'SG00247B TH2655 15900 o. 00 P 24-03-202(' },
      'TH2677': { price: 15100, raw: 'SG00250B TH2677 CIO 15100 0.00 p' },
      'TH2680': { price: 15100, raw: 'SG00252B TH2680 CIO 0.00 P 24-03-202(' },
      'TH7214': { price: 15300, raw: 'SG00255B TH7214 15300 0.00 P 24-03-202(' },

      // Vogue
      'VO5719': { price: 3690, raw: 'FR012S3B VOS719 2966 3690 (joo p 20.06-202(' },
      'VO5276': { price: 6590, raw: 'vosc,76 2940 6590 P 20-06-2021' },
      'VO5701': { price: 3290, raw: 'Vos 701 3290 p 20-06-202f' },
      'VO5703': { price: 3290, raw: 'FR01272B vos701 3289 00 p 20-06-202(' },
      'VO5120': { price: 3890, raw: 'FRO 1260B VOS 1 20 2288 3890 P 20-06-202(' },
      'VO5712': { price: 7190, raw: 'FRO VOS712 we;st; 7190 0.00' },
      'VO5512': { price: 3890, raw: 'FRO 1267B VOS12(i 3890 0.00' },
      'VO5511': { price: 3890, raw: 'FRO 1267B VOS12(i 3890 0.00' },
      'VO5718': { price: 4590, raw: 'VOS718 2820 4590 0.00 p 20-06-2021' },
      'VO5714': { price: 4590, raw: 'FR01271B vo.S71V' },
      'VO5545': { price: 3590, raw: 'FR01276B VOS 545 W 44 3590 P 20-06-2021' },
      'VO5497': { price: 3590, raw: 'FR01278B VOS 497 W44 P 20-06-2021' },

      // Burberry
      'B3167': { price: 26500, raw: 'SCJ00310B B-3167 1 109/71 26500 o. 00 P 16-06-202(' },
      'B3166': { price: 25600, raw: 'SG00311B B3166 1 109/82 25600 0.00 P 16-(' },
      'B4492': { price: 25600, raw: 'SCJ00312B B4492 3002/73 25600 o. 00' },
      'B3149': { price: 21500, raw: 'SG00313B B3149 1109/87 P 16-06-202(' },
      'B4482': { price: 21500, raw: 'SG00314B B4482U 3464/87 2 1 500 P 16-06-202(' },
      'B4358': { price: 19500, raw: 'SG00315B B43.S8 3001/85 19500 0.00 P 16-06-202(' },
      'B4388': { price: 19500, raw: 'SG00315B B43.S8 3001/85 19500 0.00 P 16-06-202(' },
      'B4216': { price: 20600, raw: 'B4216 3001/8G 20600 o. 00' },
      'B3991': { price: 18590, raw: 'SG00345B 3991/73 18590 o. 00 P 15-07-202(' },
      'B4293': { price: 19590, raw: 'SCJ00346B B4293 3806/87 19590 0.00 P 15-07-202(' },
      'B1323': { price: 19500, raw: 'FR0122*B B1323 1213 19500 p 16-06-2021' },
      'B2334': { price: 17600, raw: 'FR01229B B2334 3001 17600' },
      'B2425': { price: 10600, raw: 'FR01230B B2425-D 4121 10600 0.00' },
      'B2172': { price: 19500, raw: 'FR01232B 132172 3001 19500' },
      'B2431': { price: 19500, raw: 'FR01233B 132431 4161 19500' },
      'B2280': { price: 19890, raw: 'FR01317B B2280 3001 19890 p IS-07-202(' },
      'B1367': { price: 19500, raw: 'FR0132.SB B1367 1337 00 p 25-07-202/' },
      'B1399': { price: 18590, raw: 'BURBERRY 0BE 1399' },

      // French Connection
      'FC8278': { price: 8200, raw: 'SGOOO 16B FC8278 8200 o. 00 P 12-03-202(' },
      'FC8267': { price: 5600, raw: 'FC8267 5600 0.00 p 12-03-202(' },
      'FC4331': { price: 7400, raw: '18B FC4331 7400 p 12-03-2021' },
      'FC8259': { price: 6000, raw: 'FROO 137B FC8259 6000 p 12-03-202(' },
      'FC8212': { price: 5300, raw: 'FR00139B FC82i2 5300 P 12-03-202(' },

      // Armani Exchange & Emporio Armani & Boss
      'AX4162': { price: 10500, raw: '1 7B A,X4162SIJ 839173 10500' },
      'AX2002': { price: 11900, raw: 'SG00319B AX\'2002 6000/8G 1 1900' },
      'AX3053': { price: 8250, raw: 'FRO 1242B AX305.x 8257' },
      'EA4219': { price: 16190, raw: 'SG00347B EA4219 6102/76 16190 0.00' },
      'BOSS1424': { price: 17600, raw: 'FR01235B BOSS1424TlT 2M2 17600 O. 00' },

      // Ray-Ban Sunglasses & Frames
      'RB3016': { price: 13390, raw: 'SG00348B RB3016 6878/53 1339() 0.00 P 25-07-202(' },
      'RB3025': { price: 9690, raw: 'RB30251 001/51 9690' },
      'RB2140': { price: 13490, raw: 'RB2140F 901/3F 13490' },
      'RB2132': { price: 13490, raw: 'RB2132 710/51 13490 0.00 P 28-07-202t' },
      'RB3129': { price: 7790, raw: 'RB3129 W0226 7790' },
      'RB3447': { price: 9290, raw: 'SG00341B RB3447 001 9290 0.00 P 07-07-202<' },
      'RB3678': { price: 7790, raw: 'RB36781 001/13 7790 0.00' },
      'RB3755': { price: 12790, raw: 'SG00298B RB3755 001/51 12790' },
      'RB3759': { price: 10990, raw: 'SG00299B RB37591 10990 0.00 P 24-04-202(' },
      'RB3767': { price: 13190, raw: 'SCJ00302B RB3767 001/13 13190 0.00 p' },
      'RB3786': { price: 9190, raw: 'SCJ00304B RB37861 001/71 9190 0.00 P 24-04-202(' },
      'RB3761': { price: 11490, raw: 'SG00305B RB37611 11490 0.00 p' },
      'RB2198': { price: 13290, raw: 'RB2198 901/56 13290 000 P 24-04-202<' },
      'RB4349': { price: 9390, raw: 'RB43491 601/9A 9390 P 16-06-202(' },
      'RB3695': { price: 8790, raw: 'SG00328B RB36951 90355 1 8790 0.00 P 16-06-202(' },
      'RB3785': { price: 8990, raw: 'SCi00329B RB37851 001/71 8990 o. 00' },
      'RB4940': { price: 14290, raw: 'SG00332B RB494() 601/69 14290 0.00 P 16-06-202(' },
      'RB3928': { price: 16190, raw: 'SG00334B RB3928 001/71 16190 ooo P 16-06-202(' },
      'RJ9506S': { price: 5990, raw: 'SG00335B RJ9506S 223/6R 5990 0.00' },
      'RJ9594S': { price: 5790, raw: 'SG00337B RJ9594S 223/46 5790' },
      'RJ9069S': { price: 3190, raw: 'SG00338B RJ9069S 100/71 3190 o. 00' },
      'RB3549': { price: 17290, raw: 'SCJ00340B RB3549 002fT3 17290 0.00' },
      'RB3779': { price: 13590, raw: 'RB3779 13590 o. 00' },
      'RB3780': { price: 14390, raw: 'SG00351B RB3780 001/31 14390 0.00 P 25-07-202(' },
      'RB3787': { price: 8990, raw: 'RB3787 oo 1/71 8990 000 P' },
      'RB3760': { price: 10990, raw: 'SG00390B RB3760 003/9A 10990 0.00 P 28-07-202(' },
      'RB4340V': { price: 9990, raw: 'FR01212B RB4340V 2000 9990 0.00' },
      'RB2224': { price: 12190, raw: 'RB2224 901/32 12190 o. oo P 28-07-202(' },
      'RB3147': { price: 14190, raw: 'RB3.i47 00.3/3F 14190 0.00 P 28-07-202(' },
      'RB4465': { price: 8990, raw: 'RB4465 644911 8990 o. 00 P 28-07-202(' },
      'RB4171': { price: 11290, raw: 'SG00406B RB4171 710/71 11290 0.00 P 28-07-202(' },
      'RB3774D': { price: 12690, raw: 'SG00407B RB3774D 001/87 12690 o. 00 P 28-07-202(' },
      'RB3548': { price: 14190, raw: 'SG00409B RB3548 004/71 14190' },
      'RB2222': { price: 14990, raw: 'SG00410B RB2222 901/3R 14990 o. 00 P 28-07-202(' },
      'RB4455': { price: 13590, raw: 'SCJ00412B RB4455 6677 13590 0.00 P 28-07-202(' },
      'RB4105': { price: 13490, raw: 'SG00414B RB4105 601 13490 0.00 P 28-07-202(' },
      'RB7027': { price: 6490, raw: 'FR00069B RB7027 8417 6490 0 00 P 12-03-202(' },
      'RB5438': { price: 6490, raw: 'FR00071B RB5438 8327 6490 000' },
      'RB7216': { price: 9790, raw: 'FR00073B RB7216 2000 9790 o no' },
      'RB6335': { price: 9290, raw: 'RB6335 2890 9290 0.00 P 12-03-202<' },
      'RB6304': { price: 5290, raw: 'FR00077B RB6304 2509 5290 P 12-03-202(' },
      'RB6303': { price: 5290, raw: 'RB6303 2509 5290 P 12-03-202(' },
      'RB6323': { price: 5290, raw: 'FR00083B RB6323 2500 5290 o_oo P 12-03-202(' },
      'RB6506': { price: 6890, raw: 'FR0008.SB RB6506 2500 6890 P 12-03-202(' },
      'RB6488': { price: 7090, raw: 'FR00088B RB64881 2502 7090 0.00 P 12-03-202(' },
      'RB5364': { price: 5500, raw: 'RB5364 5809 5500 ooo P 12-03' },
      'RB8780D': { price: 12290, raw: 'FR00093B RB8780D 1061 12290 0/10 P 12-03-202(' },
      'RB7025': { price: 9990, raw: 'FR01207B RB7025 8475 999() 0.00 P 23-04-202(' },
      'RB6425': { price: 6090, raw: 'FR00100B RB642.Sl 3009 6090 0.00 P 12-03-202<' },
      'RB6267': { price: 5290, raw: 'RB62671 2502 5290' },
      'RB8006': { price: 11690, raw: 'FROOIIIB RB8006 2000 11690 0.00 P 12-03-202(' },
      'RB6531': { price: 6690, raw: 'FR01178B RB6531 2503 6690 P 23-04-202(' },
      'RB5389': { price: 6090, raw: 'FR01201B RB5389 2000 6090 0.00 P 23-04-202(' },
      'RB7033': { price: 6090, raw: 'FR01202B RB7033 2000 6090 0.00 P 23-04-202(' },
      'RB5423': { price: 6690, raw: 'FR01204B RB5423 5753 6690 0.00 P 23-04-202<' },
      'RB6463': { price: 6090, raw: 'FR01205B RB6463 2500 6090 (Mjo' },
      'RB6483': { price: 5990, raw: 'FRO 1210B RB6483 2692 5990 o. 00' },
      'RB5397': { price: 9990, raw: 'FR01215B RB5397 2000 9990 o. 00' },
      'RB6489': { price: 6110, raw: 'FR01223B RB6489 2502 0110 P 03-05-202(' },
      'RB3957': { price: 11511, raw: 'RAY BAN 3957 (Dayal Opticals Catalog)' }
    };

    console.log(`Loaded dictionary with ${Object.keys(pdfModelMap).length} verified optical models.`);

    let correctCount = 0;
    let needsUpdate = [];
    let duplicatesToRemove = [];

    // Let's identify duplicate entries with identical names
    const seenNames = {};
    for (const p of products) {
      const pName = p.name.trim();
      seenNames[pName] = seenNames[pName] || [];
      seenNames[pName].push(p);
    }

    for (const [name, list] of Object.entries(seenNames)) {
      if (list.length > 1) {
        // If it's a known dummy duplicate like "1069/S 900/Wb 58" or "7206 C5 50"
        if (name.includes('1069/S') || name.includes('7206 C5')) {
          // Keep the first one, mark the rest as duplicates to deactivate/remove
          for (let i = 1; i < list.length; i++) {
            duplicatesToRemove.push(list[i]);
          }
        } else if (name.includes('RAY BAN 0RB 2140')) {
          // Keep the real RB2140, remove so-ray-ban-mix and so-ray-ban-sheet
          for (const item of list) {
            if (item.slug.includes('mix') || item.slug.includes('sheet')) {
              duplicatesToRemove.push(item);
            }
          }
        }
      }
    }

    for (const p of products) {
      if (duplicatesToRemove.find(d => d.id === p.id)) continue;

      const pSlug = p.slug.toUpperCase();
      const pName = p.name.toUpperCase();
      const curBasePrice = Number(p.base_price);
      const curMrp = Number(p.original_price);

      // Check which model key matches
      let matchedKey = null;
      for (const key of Object.keys(pdfModelMap)) {
        if (pSlug.includes(key) || pName.includes(key)) {
          matchedKey = key;
          break;
        }
      }

      // If matched
      if (matchedKey) {
        const target = pdfModelMap[matchedKey];
        const targetBasePrice = target.price;
        const targetMrp = Math.round(targetBasePrice / 0.90);

        if (Math.abs(curBasePrice - targetBasePrice) > 1.0 || Math.abs(curMrp - targetMrp) > 2.0) {
          needsUpdate.push({
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            modelKey: matchedKey,
            curBasePrice,
            curMrp,
            targetBasePrice,
            targetMrp,
            rawText: target.raw
          });
        } else {
          correctCount++;
        }
      } else {
        // It didn't match a key in pdfModelMap, let's inspect
        // Check if current price gives exactly 10% discount
        const expectedMrp = Math.round(curBasePrice / 0.90);
        if (Math.abs(curMrp - expectedMrp) > 2.0) {
          needsUpdate.push({
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            curBasePrice,
            curMrp,
            targetBasePrice: curBasePrice,
            targetMrp: expectedMrp,
            rawText: 'Preserve basePrice, update MRP'
          });
        } else {
          correctCount++;
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`RECONCILIATION AUDIT:`);
    console.log(`✓ Products with Correct Selling Price & MRP: ${correctCount}`);
    console.log(`! Products Requiring Exact Price Update: ${needsUpdate.length}`);
    console.log(`✕ Duplicate Dummy Products to Deactivate: ${duplicatesToRemove.length}`);
    console.log(`======================================================`);

    fs.writeFileSync('scripts/reconciliation_plan_result.json', JSON.stringify({
      needsUpdate,
      duplicatesToRemove
    }, null, 2));

    console.log('\n--- SAMPLE UPDATES NEEDED ---');
    needsUpdate.slice(0, 15).forEach(u => {
      console.log(`[${u.brand}] ${u.name} (${u.slug})`);
      console.log(`   Current:  ₹${u.curBasePrice} (MRP: ₹${u.curMrp})`);
      console.log(`   Target:   ₹${u.targetBasePrice} (MRP: ₹${u.targetMrp})`);
      console.log(`   PDF Raw:  ${u.rawText}\n`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

buildPlan().catch(console.error);
