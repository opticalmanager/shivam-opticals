const https = require('https');

https.get('https://gemopticians.com/products/burberry-3167-1005-11-59', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const urls = d.match(/https?:\/\/[^\s"'<>]*(?:loox|review|rating)[^\s"'<>]*/gi) || [];
    console.log('Loox/Review URLs in Gem:');
    [...new Set(urls)].forEach(u => console.log(' ', u));
  });
});
