const https = require('https');

function testFetch(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: b.length, body: b.slice(0, 500) });
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function run() {
  console.log('Testing alensa:', await testFetch('https://www.alensa.co.uk/carrera-ca-1130-807'));
  console.log('Testing smartbuyglasses:', await testFetch('https://www.smartbuyglasses.co.in/designer-eyeglasses/Carrera/Carrera-CARRERA-1130-807-526433.html'));
}

run();
