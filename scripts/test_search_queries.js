const https = require('https');

function search(domain, q) {
  return new Promise(resolve => {
    const url = 'https://' + domain + '/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=5';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const prods = (json.resources && json.resources.results && json.resources.results.products) || [];
          resolve({ domain, q, titles: prods.map(p => p.title) });
        } catch(e) {
          resolve({ domain, q, error: e.message });
        }
      });
    }).on('error', e => resolve({ domain, q, error: e.message }));
  });
}

async function run() {
  const tests = [
    ['ramavision.in', 'Ray-Ban RX6531'],
    ['ramavision.in', 'RX6531'],
    ['ramavision.in', '6531'],
    ['prismeyecare.in', 'Ray-Ban RB6463'],
    ['prismeyecare.in', '6463'],
    ['prismeyecare.in', '6463I'],
    ['shop-srgopalrao.co', '6463'],
    ['himalayaoptical.com', '6463'],
    ['optorium.in', '6463'],
    ['nayansukhexclusive.com', '6463'],
  ];

  for (const [d, q] of tests) {
    const res = await search(d, q);
    console.log(`[${res.domain}] "${res.q}" ->`, res.titles || res.error);
  }
}

run();
