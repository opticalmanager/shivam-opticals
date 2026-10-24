const https = require('https');

function fetchHtml(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function test() {
  const url1 = 'https://dayalopticalsindia.com/products/ray-ban-0rb-3928';
  console.log('Fetching Dayal:', url1);
  const html1 = await fetchHtml(url1);
  console.log('Dayal fetched length:', html1.length);
  
  const jsonLd = html1.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  console.log('Dayal JSON-LD blocks:', jsonLd.length);
  jsonLd.forEach((b, i) => {
    if (b.includes('Rating') || b.includes('review') || b.includes('ratingValue')) {
      console.log(`Found rating in Dayal JSON-LD [${i}]:`, b.slice(0, 300));
    }
  });

  const url2 = 'https://gemopticians.com/products/burberry-3167-1005-11-59';
  console.log('\nFetching Gem:', url2);
  const html2 = await fetchHtml(url2);
  console.log('Gem fetched length:', html2.length);
  const jsonLd2 = html2.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  console.log('Gem JSON-LD blocks:', jsonLd2.length);
  jsonLd2.forEach((b, i) => {
    if (b.includes('Rating') || b.includes('review') || b.includes('ratingValue')) {
      console.log(`Found rating in Gem JSON-LD [${i}]:`, b.slice(0, 300));
    }
  });

  // Check review widgets
  const keywords = ['judge.me', 'loox', 'yotpo', 'stamped', 'spr-badge', 'data-rating', 'rating-count'];
  console.log('\nDayal review keyword presence:');
  keywords.forEach(k => console.log(' ', k, '->', html1.toLowerCase().includes(k)));
  console.log('\nGem review keyword presence:');
  keywords.forEach(k => console.log(' ', k, '->', html2.toLowerCase().includes(k)));
}

test().catch(console.error);
