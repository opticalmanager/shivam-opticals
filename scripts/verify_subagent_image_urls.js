const https = require('https');

const TEST_URLS = [
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-3020-807-front.jpg',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-3020-807-side.jpg',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-1130-807-front.jpg',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-1130-086-front.jpg',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-3053-b3v-front.jpg',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/carrera/carrera-ca-249-0807-front.jpg',
  'https://assets2.ray-ban.com/cdn-record-files-pi/0d131f13-64ef-4bdf-87f5-b15200216174/rj9594s_223_46_front.png',
  'https://images.framesdirect.com/image/upload/w_1600,f_auto,q_auto/v1/frames/vogue/vogue-vo5718-2820-front.jpg',
  'https://cdn.shopify.com/s/files/1/0958/3565/2388/files/FC8278CliponC3-LS_3e501e20-a7cf-41b8-84ff-5b598ce1d66d.png?v=1772922175',
  'https://cdn.shopify.com/s/files/1/0608/8563/1222/files/653578_1697506158927.webp?v=1709795343'
];

async function check() {
  for (const url of TEST_URLS) {
    await new Promise(r => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        console.log(res.statusCode, url.slice(0, 80));
        r();
      }).on('error', e => {
        console.log('ERR', e.message, url.slice(0, 80));
        r();
      });
    });
  }
}

check();
