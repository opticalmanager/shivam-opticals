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

async function inspectWidgets() {
  const url1 = 'https://dayalopticalsindia.com/products/ray-ban-0rb-3928';
  const html1 = await fetchHtml(url1);

  // Look for judge.me snippet
  const jmMatches = html1.match(/class="[^"]*jdgm-[^"]*"/gi) || [];
  console.log('Dayal jdgm matches:', jmMatches.slice(0, 10));

  // Look for any snippet with jdgm-prev-badge or data-average-rating
  const ratingSnippets = html1.match(/<[^>]+(jdgm|rating|review|stars)[^>]+>/gi) || [];
  console.log('Dayal rating snippets count:', ratingSnippets.length);
  ratingSnippets.slice(0, 10).forEach(s => console.log('Snippet:', s));

  // Look for loox snippets
  const looxSnippets = html1.match(/<[^>]+loox[^>]+>/gi) || [];
  console.log('Dayal loox snippets count:', looxSnippets.length);
  looxSnippets.slice(0, 5).forEach(s => console.log('Loox:', s));

  // Let's also inspect Gem
  const url2 = 'https://gemopticians.com/products/burberry-3167-1005-11-59';
  const html2 = await fetchHtml(url2);
  const gemLoox = html2.match(/<[^>]+(loox|review|rating)[^>]+>/gi) || [];
  console.log('\nGem rating snippets count:', gemLoox.length);
  gemLoox.slice(0, 10).forEach(s => console.log('Gem Snippet:', s));
}

inspectWidgets().catch(console.error);
