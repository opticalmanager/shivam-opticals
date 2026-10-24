const https = require('https');

https.get('https://loox.io/widget/Ey-jqVbXiF/reviews?productId=10554467746097', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const starMatches = d.match(/class=['"][^'"]*star[^'"]*['"]/gi) || [];
    console.log('Star matches count:', starMatches.length);
    console.log('Star matches:', starMatches.slice(0, 5));

    const itemMatches = d.match(/class=['"][^'"]*review-item[^'"]*['"]/gi) ||
                        d.match(/class=['"][^'"]*review[^'"]*['"]/gi) || [];
    console.log('Review elements:', itemMatches.slice(0, 10));

    // Check if there are actual reviews or empty state
    const emptyState = d.includes('no-reviews') || d.includes('No reviews');
    console.log('Empty state detected:', emptyState);
    if (!emptyState) {
      console.log('Sample text:', d.slice(1000, 2000));
    }
  });
});
