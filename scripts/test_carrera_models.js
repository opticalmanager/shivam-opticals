const https = require('https');

const STORES = [
  'ramavision.in',
  'prismeyecare.in',
  'himalayaoptical.com',
  'dayalopticalsindia.com',
  'gemopticians.com',
  'optorium.in',
  'shop-srgopalrao.co',
  'nayansukhexclusive.com'
];

const testModels = ['3020', '1130', '3053', '249', '8883', '8919', '8858', '8874', '8006'];

async function check() {
  for (const m of testModels) {
    for (const d of STORES) {
      await new Promise(r => {
        const url = 'https://' + d + '/search/suggest.json?q=' + encodeURIComponent(m) + '&resources[type]=product&resources[limit]=6';
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => {
            try {
              const prods = (JSON.parse(b).resources?.results?.products) || [];
              const carr = prods.filter(p => {
                const s = (p.title + ' ' + p.handle).toLowerCase();
                return s.includes('carrera') || s.includes('rayban') || s.includes('ray-ban') || s.includes('rb');
              });
              if (carr.length > 0) {
                console.log(`[${d}] ${m} ->`, carr.map(x => `${x.title} (${x.handle})`));
              }
            } catch {}
            r();
          });
        }).on('error', () => r());
      });
    }
  }
}

check();
