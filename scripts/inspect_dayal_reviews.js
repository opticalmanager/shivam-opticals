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

async function findRatings() {
  const url = 'https://dayalopticalsindia.com/products/ray-ban-0rb-3928';
  const html = await fetchHtml(url);

  // Search around star-rating
  const idx = html.indexOf('star-rating');
  if (idx !== -1) {
    console.log('Dayal context around star-rating:');
    console.log(html.slice(Math.max(0, idx - 200), idx + 400));
  }

  // Look for judge.me product review count or rating
  const jmMatches = html.match(/class=['"][^'"]*jdgm-[^'"]*['"]/gi) || [];
  console.log('\njdgm classes:', jmMatches);

  // Look for any review API endpoints mentioned in JS
  const apiMatches = html.match(/https?:\/\/[^"'\s]+(?:review|rating|judge|loox)[^"'\s]*/gi) || [];
  console.log('\nReview API URLs in HTML:', [...new Set(apiMatches)]);
}

findRatings();
