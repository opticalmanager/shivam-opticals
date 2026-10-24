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
  { name: 'R. Kumar Opticians', domain: 'rkumar.in' },
  { name: 'Intense Focus', domain: 'intensefocus.com' },
  { name: 'Sunstyle', domain: 'sunstyle.co.in' },
  { name: 'Kapoor Optical', domain: 'kapooropticalco.com' },
  { name: 'Edge Opticals', domain: 'edgeopticals.com' },
  { name: 'Eyeworld Optics', domain: 'eyeworldoptics.com' },
  { name: 'The Vision Factory', domain: 'thevisionfactoryindia.com' },
  { name: 'Laxmi Opticians', domain: 'laxmiopticians.com' },
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
          resolve({ domain, prods });
        } catch {
          resolve({ domain, prods: [] });
        }
      });
    });
    req.on('error', () => resolve({ domain, prods: [] }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ domain, prods: [] });
    });
  });
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const pending = JSON.parse(fs.readFileSync('data/unmatched_designer_pending.json', 'utf8'));
  console.log(`Parallel searching 16 authorized optical networks for ${pending.length} remaining models...`);

  const confirmed = [];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const brand = item.brand;
    const model = item.model;
    const digits = (model.match(/\d+/) || [''])[0];

    const queries = new Set();
    queries.add(model);
    if (digits) queries.add(digits);

    if (brand === 'Carrera') {
      if (digits) {
        queries.add(`CA ${digits}`);
        queries.add(`CARRERA ${digits}`);
        queries.add(`CA${digits}`);
      }
      if (model.includes('3020')) queries.add('3020');
      if (model.includes('3053')) queries.add('3053');
      if (model.includes('I130')) queries.add('1130', 'CA 1130', 'CARRERA 1130');
      if (model.includes('8X58')) queries.add('8858', 'CA 8858');
      if (model.includes('249')) queries.add('249', 'CA 249', 'CARRERA 249');
      if (model.includes('37YG')) queries.add('317', 'CA 317', 'CARRERA 317', '317/G');
      if (model.includes('8883')) queries.add('8883', 'CA 8883');
      if (model.includes('8919')) queries.add('8919', 'CA 8919');
    } else if (brand === 'Ray-Ban') {
      if (digits) {
        queries.add(`RX${digits}`);
        queries.add(`RB${digits}`);
        queries.add(`RJ${digits}`);
      }
      if (model.includes('9594')) queries.add('9594', 'RJ9594', 'RJ 9594');
    } else if (brand === 'Vogue') {
      if (digits) {
        queries.add(`VO ${digits.slice(0, 4)}`);
        queries.add(`VO${digits.slice(0, 4)}`);
      }
      if (model.includes('5718')) queries.add('5718', '5218');
    } else if (brand === 'French Connection') {
      if (digits) {
        queries.add(`FC ${digits}`);
        queries.add(`FC${digits}`);
      }
    } else if (brand === 'Armani Exchange') {
      if (digits) {
        queries.add(`AX ${digits}`);
        queries.add(`AX${digits}`);
      }
    } else if (brand === 'Bebe') {
      queries.add(`Bebe ${model}`);
      if (digits) queries.add(`BB ${digits}`);
    }

    let match = null;

    for (const q of queries) {
      if (match) break;
      if (!q || q.length < 3) continue;

      // Query all 16 stores in parallel
      const storeResults = await Promise.all(STORES.map(s => searchStore(s.domain, q)));

      for (const res of storeResults) {
        if (match) break;
        const storeObj = STORES.find(s => s.domain === res.domain);

        for (const p of res.prods) {
          const tNorm = normalize(p.title);
          const hNorm = normalize(p.handle);
          const bNorm = normalize(brand);
          const dNorm = digits ? digits.replace(/^0+/, '') : '';

          let brandOk = false;
          if (bNorm.includes('carrera')) {
            brandOk = tNorm.includes('carrera') || tNorm.includes('ca') || hNorm.includes('carrera');
          } else if (bNorm.includes('rayban')) {
            brandOk = tNorm.includes('rayban') || tNorm.includes('rb') || tNorm.includes('rx') || tNorm.includes('rj') || hNorm.includes('ray-ban');
          } else if (bNorm.includes('vogue')) {
            brandOk = tNorm.includes('vogue') || tNorm.includes('vo') || hNorm.includes('vogue');
          } else if (bNorm.includes('frenchconnection')) {
            brandOk = tNorm.includes('french') || tNorm.includes('fc') || hNorm.includes('french');
          } else if (bNorm.includes('armaniexchange')) {
            brandOk = tNorm.includes('armani') || tNorm.includes('ax') || hNorm.includes('armani');
          } else if (bNorm.includes('bebe')) {
            brandOk = tNorm.includes('bebe') || tNorm.includes('bb') || hNorm.includes('bebe');
          }

          if (!brandOk) continue;

          let modelOk = false;
          if (dNorm && dNorm.length >= 3 && (tNorm.includes(dNorm) || hNorm.includes(dNorm))) {
            modelOk = true;
          }
          if (model.includes('I130') && (tNorm.includes('1130') || hNorm.includes('1130'))) modelOk = true;
          if (model.includes('8X58') && (tNorm.includes('8858') || hNorm.includes('8858'))) modelOk = true;
          if (model.includes('37YG') && (tNorm.includes('317') || hNorm.includes('317'))) modelOk = true;

          if (modelOk && p.image) {
            match = {
              item,
              store: storeObj.name,
              domain: storeObj.domain,
              query: q,
              title: p.title,
              handle: p.handle,
              image: p.image
            };
            break;
          }
        }
      }
    }

    if (match) {
      console.log(`[${i+1}/${pending.length}] MATCH: ${brand} ${model} -> [${match.store}] "${match.title}" (${match.domain})`);
      confirmed.push(match);
    } else {
      console.log(`[${i+1}/${pending.length}] Pending: ${brand} ${model}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Confirmed New Matches: ${confirmed.length} / ${pending.length}`);
  console.log(`========================================`);
  fs.writeFileSync('data/new_16_network_matches.json', JSON.stringify(confirmed, null, 2));
}

run();
