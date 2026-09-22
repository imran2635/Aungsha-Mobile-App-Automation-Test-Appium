const fs = require('fs');
const h = fs.readFileSync('e:/Aungsha-Mobile-App-Test/apps/ui-force.xml', 'utf8');
const labels = [...new Set([...h.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]))];
console.log(labels.filter(Boolean).join('\n'));
