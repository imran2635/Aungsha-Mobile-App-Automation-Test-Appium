const fs = require('fs');
const path = process.argv[2] || 'e:/Aungsha-Mobile-App-Automation-Test/apps/downloads/emu-withdraw-check.xml';
const x = fs.readFileSync(path, 'utf8');
const labels = [...x.matchAll(/content-desc="([^"]*)"/g)].map((m) =>
  m[1].replace(/&#10;/g, ' | ')
);
const unique = [...new Set(labels)];
const withdraw = unique.filter((s) => /withdraw/i.test(s));
console.log('=== ALL labels (short) ===');
unique
  .filter((s) => s.length <= 80)
  .slice(0, 60)
  .forEach((s) => console.log(s));
console.log('=== WITHDRAW matches ===');
withdraw.forEach((s) => console.log(s));
console.log('HAS_WITHDRAW=', withdraw.length > 0);
