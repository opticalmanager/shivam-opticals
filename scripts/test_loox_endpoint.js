const https = require('https');

function test(url) {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log(url, 'STATUS:', res.statusCode, 'LENGTH:', d.length, 'DATA:', d.slice(0, 150)));
  });
}

test('https://loox.io/widget/Ey-jqVbXiF/reviews');
test('https://loox.io/widget/Ey-jqVbXiF/reviews?productId=10554467746097');
