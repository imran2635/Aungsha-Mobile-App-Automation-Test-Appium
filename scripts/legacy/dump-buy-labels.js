const fs = require('fs');
for (const f of [
  'e:/Aungsha-Mobile-App-Test/apps/locators/flow-buy-shares.xml',
  'e:/Aungsha-Mobile-App-Test/apps/locators/flow-cloud9-failed.xml',
]) {
  if (!fs.existsSync(f)) {
    console.log('missing', f);
    continue;
  }
  const h = fs.readFileSync(f, 'utf8');
  const labels = [...new Set([...h.matchAll(/content-desc="([^"]+)"/g)].map((m) => m[1]))];
  console.log('\n====', f.split('/').pop(), '====');
  console.log(labels.filter(Boolean).join('\n'));
}
