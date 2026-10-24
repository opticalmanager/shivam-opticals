const fs = require('fs');
const https = require('https');

const STORES = [
  { name: 'Optorium', domain: 'optorium.in' },
  { name: 'Himalaya', domain: 'himalayaoptical.com' },
  { name: 'Ramavision', domain: 'ramavision.in' },
  { name: 'Prism Eye Care', domain: 'prismeyecare.in' },
  { name: 'SR Gopal Rao', domain: 'shop-srgopalrao.co' },
  { name: 'Dayal Opticals', domain: 'dayalopticalsindia.com' },
  { name: 'Gem Opticians', domain: 'gemopticians.com' },
  { name: 'Nayan Sukh', domain: 'nayansukhexclusive.com' },
];

function searchStore(domain, q) {
  return new Promise(resolve => {
    const url = 'https://' + domain + '/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6';
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const prods = (json.resources && json.resources.results && json.resources.results.products) || [];
          resolve(prods);
        } catch {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(3500, () => {
      req.destroy();
      resolve([]);
    });
  });
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const pending = JSON.parse(fs.readFileSync('data/unmatched_designer_pending.json', 'utf8'));
  console.log(`Searching with targeted variations for ${pending.length} models...`);

  const confirmedMatches = [];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const brand = item.brand;
    const model = item.model;
    const digits = (model.match(/\d+/) || [''])[0];

    const queries = [];

    if (brand === 'Ray-Ban') {
      if (digits) {
        queries.push(`RX${digits}`);
        queries.push(`RB${digits}`);
        queries.push(`RX${digits}I`);
        queries.push(`RB${digits}I`);
        queries.push(`${digits}I`);
        queries.push(`${digits}`);
      }
      queries.push(model);
    } else if (brand === 'Carrera') {
      if (digits) {
        queries.push(`CARRERA ${digits}`);
        queries.push(`CA ${digits}`);
        queries.push(`CA${digits}`);
        queries.push(`${digits}`);
      }
      if (model.includes('8X58')) queries.push('8858', 'CARRERA 8858');
      if (model.includes('I130')) queries.push('1130', 'CARRERA 1130');
      queries.push(model);
    } else if (brand === 'Vogue') {
      if (digits) {
        queries.push(`VO ${digits}`);
        queries.push(`VO${digits}`);
        // Handle merged model codes like 57192966 -> model 5719 or 5419 or 5219
        const m4 = digits.slice(0, 4);
        queries.push(`VO${m4}`);
        queries.push(`VO ${m4}`);
        queries.push(`VO ${m4}-I`);
        if (m4.startsWith('57')) {
          queries.push(`VO52${m4.slice(2)}`);
          queries.push(`VO54${m4.slice(2)}`);
        }
      }
      if (model.includes('VO5C76')) {
        queries.push('VO5076', 'VO 5076');
      }
    } else if (brand === 'French Connection') {
      if (digits) {
        queries.push(`FC ${digits}`);
        queries.push(`FC${digits}`);
        queries.push(`FC-${digits}`);
      }
      if (model.includes('82S9')) queries.push('FC 8299', 'FC8299');
    } else if (brand === 'Armani Exchange') {
      if (digits) {
        queries.push(`AX${digits}`);
        queries.push(`AX ${digits}`);
      }
    } else if (brand === 'Bebe') {
      queries.push(model);
      queries.push(`Bebe ${model}`);
      if (digits) queries.push(`BB ${digits}`, `BB${digits}`);
    }

    let found = null;

    for (const q of queries) {
      if (found) break;
      for (const store of STORES) {
        if (found) break;
        const results = await searchStore(store.domain, q);
        for (const p of results) {
          const tNorm = normalize(p.title);
          const hNorm = normalize(p.handle);
          const bNorm = normalize(brand);
          const dNorm = digits ? digits.replace(/^0+/, '') : '';

          // Strict brand match
          let brandOk = false;
          if (bNorm.includes('rayban')) {
            brandOk = tNorm.includes('rayban') || tNorm.includes('rb') || tNorm.includes('rx') || hNorm.includes('ray-ban');
          } else if (bNorm.includes('carrera')) {
            brandOk = tNorm.includes('carrera') || tNorm.includes('ca') || hNorm.includes('carrera');
          } else if (bNorm.includes('vogue')) {
            brandOk = tNorm.includes('vogue') || tNorm.includes('vo') || hNorm.includes('vogue');
          } else if (bNorm.includes('frenchconnection')) {
            brandOk = tNorm.includes('french') || tNorm.includes('connection') || tNorm.includes('fc') || hNorm.includes('french');
          } else if (bNorm.includes('armaniexchange')) {
            brandOk = tNorm.includes('armani') || tNorm.includes('ax') || hNorm.includes('armani');
          } else if (bNorm.includes('bebe')) {
            brandOk = tNorm.includes('bebe') || tNorm.includes('bb') || hNorm.includes('bebe');
          }

          if (!brandOk) continue;

          // Strict model digits or model code match
          let modelOk = false;
          if (dNorm && dNorm.length >= 3 && (tNorm.includes(dNorm) || hNorm.includes(dNorm))) {
            modelOk = true;
          }

          // Special OCR checks
          if (model.includes('8X58') && (tNorm.includes('8858') || hNorm.includes('8858'))) modelOk = true;
          if (model.includes('I130') && (tNorm.includes('1130') || hNorm.includes('1130'))) modelOk = true;
          if (model.includes('VO5C76') && (tNorm.includes('5076') || hNorm.includes('5076'))) modelOk = true;
          if (model.includes('82S9') && (tNorm.includes('8299') || hNorm.includes('8299'))) modelOk = true;

          if (modelOk) {
            found = {
              itemIndex: i,
              originalItem: item,
              store: store.name,
              domain: store.domain,
              query: q,
              matchedTitle: p.title,
              handle: p.handle,
              image: p.image
            };
            break;
          }
        }
      }
    }

    if (found) {
      console.log(`[${i+1}/${pending.length}] MATCH: ${brand} ${model} -> [${found.store}] "${found.matchedTitle}" (handle: ${found.handle})`);
      confirmedMatches.push(found);
    } else {
      console.log(`[${i+1}/${pending.length}] No match: ${brand} ${model}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Total Confirmed Matches: ${confirmedMatches.length} / ${pending.length}`);
  console.log(`========================================`);
  fs.writeFileSync('data/confirmed_targeted_matches.json', JSON.stringify(confirmedMatches, null, 2));
}

run();
