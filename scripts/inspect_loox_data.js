const https = require('https');

https.get('https://loox.io/widget/Ey-jqVbXiF/reviews?productId=10554467746097', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Look for ratings
    const ratings = d.match(/data-rating=['"]([^'"]+)['"]/gi) || [];
    console.log('data-rating count:', ratings.length, ratings.slice(0, 10));

    // Look for stars or average rating
    const avg = d.match(/data-average-rating=['"]([^'"]+)['"]/i) ||
                d.match(/data-loox-rating=['"]([^'"]+)['"]/i) ||
                d.match(/"rating":\s*([0-9.]+)/i);
    console.log('Average rating match:', avg);

    const count = d.match(/data-review-count=['"]([^'"]+)['"]/i) ||
                  d.match(/data-loox-raters=['"]([^'"]+)['"]/i) ||
                  d.match(/"reviewCount":\s*([0-9]+)/i);
    console.log('Review count match:', count);

    // Look for script tags or json
    const jsonLd = d.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    console.log('JSON-LD count:', jsonLd.length);
    jsonLd.forEach(j => console.log('JSON-LD:', j));
  });
});
