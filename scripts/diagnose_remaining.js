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
    const url = 'https://' + domain + '/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=5';
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
    req.setTimeout(4000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

async function diagnose() {
  const pending = JSON.parse(fs.readFileSync('data/unmatched_designer_pending.json', 'utf8'));
  console.log(`Diagnosing ${pending.length} remaining models...`);

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const brand = item.brand;
    const model = item.model;
    const cleanDigits = (model.match(/\d+/) || [''])[0];

    // Generate smart candidates
    const queries = new Set();
    queries.add(model);
    if (cleanDigits && cleanDigits.length >= 3) {
      queries.add(cleanDigits);
    }
    if (brand === 'Ray-Ban' && cleanDigits) {
      queries.add(`RX${cleanDigits}`);
      queries.add(`RB${cleanDigits}`);
      queries.add(`0RX${cleanDigits}`);
      queries.add(`${cleanDigits}I`);
    }
    if (brand === 'Carrera') {
      queries.add(`CA ${cleanDigits}`);
      queries.add(`CARRERA ${cleanDigits}`);
      if (model.includes('CAI130')) queries.add('1130');
      if (model.includes('CA8X58')) queries.add('8858');
      if (model.includes('3021')) queries.add('3021');
    }
    if (brand === 'Vogue') {
      // OCR repairs: VO5C76 -> VO5076, VO5701 -> VO5201, VO5719 -> VO5419 or VO5219
      queries.add(model.replace(/VO5C76.*/, '5076'));
      queries.add(model.replace(/VO5701.*/, '5201'));
      queries.add(model.replace(/VO5719.*/, '5419'));
      queries.add(model.replace(/VO5718.*/, '5218'));
      queries.add(model.replace(/VO5120.*/, '5120'));
      queries.add('VO' + cleanDigits.slice(0, 4));
      queries.add(cleanDigits.slice(0, 4));
    }
    if (brand === 'French Connection') {
      queries.add(`FC ${cleanDigits}`);
      queries.add(`FC${cleanDigits}`);
    }

    const foundMatches = [];

    for (const q of queries) {
      if (!q || q.length < 3) continue;
      for (const store of STORES) {
        const results = await searchStore(store.domain, q);
        for (const p of results) {
          const t = p.title.toLowerCase();
          const h = p.handle.toLowerCase();
          const qLower = q.toLowerCase();
          const digitsMatch = cleanDigits && cleanDigits.length >= 3 && (t.includes(cleanDigits) || h.includes(cleanDigits));
          const queryMatch = t.includes(qLower) || h.includes(qLower);

          if (digitsMatch || (q.length >= 4 && queryMatch)) {
            // Check brand affinity
            const bLower = brand.toLowerCase().replace(/[^a-z]/g, '');
            const titleLetters = t.replace(/[^a-z]/g, '');
            if (bLower.includes('rayban') && !titleLetters.includes('rayban') && !titleLetters.includes('rb') && !titleLetters.includes('rx')) continue;
            if (bLower.includes('carrera') && !titleLetters.includes('carrera') && !titleLetters.includes('ca')) continue;

            foundMatches.push({
              store: store.name,
              domain: store.domain,
              query: q,
              title: p.title,
              handle: p.handle,
              image: p.image,
              price: p.price
            });
          }
        }
      }
    }

    // Deduplicate matches by handle
    const unique = [];
    const seen = new Set();
    for (const m of foundMatches) {
      if (!seen.has(m.handle)) {
        seen.add(m.handle);
        unique.push(m);
      }
    }

    if (unique.length > 0) {
      console.log(`\n[${i+1}/${pending.length}] MATCH FOUND for ${brand} ${model}:`);
      unique.forEach(u => console.log(`   -> [${u.store}] ${u.title} (query: "${u.query}") handle: ${u.handle}`));
    } else {
      process.stdout.write('.');
    }
  }
  console.log('\nDiagnosis complete.');
}

diagnose();
