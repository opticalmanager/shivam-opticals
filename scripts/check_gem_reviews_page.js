const https = require('https');

https.get('https://www.gemopticians.com/pages/reviews', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Reviews page status:', res.statusCode, 'length:', d.length);
    const looxData = d.match(/data-loox-[a-z-]+=['"][^'"]*['"]/gi) || [];
    console.log('Loox data attrs in reviews page:', looxData.slice(0, 10));
  });
});
