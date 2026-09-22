/**
 * Quick helper: list devices and Aungsha-related packages on the connected tablet.
 */
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return (err.stdout || err.message || '').toString().trim();
  }
}

const adbCandidates = [
  process.env.ADB_PATH,
  'adb',
  path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WinGet',
    'Packages',
    'Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'platform-tools',
    'adb.exe'
  ),
].filter(Boolean);

let adb = 'adb';
for (const candidate of adbCandidates) {
  try {
    execSync(`"${candidate}" version`, { stdio: 'ignore' });
    adb = candidate;
    break;
  } catch {
    // try next
  }
}

console.log('Using ADB:', adb);
console.log('\n=== Devices ===');
console.log(run(`"${adb}" devices -l`));

console.log('\n=== Packages matching aungsha ===');
console.log(run(`"${adb}" shell pm list packages | findstr /i aungsha`));

const pkg = process.env.APP_PACKAGE || 'com.aungsha.app';
console.log(`\n=== Launcher activity for ${pkg} ===`);
console.log(
  run(
    `"${adb}" shell cmd package resolve-activity --brief ${pkg}`
  )
);
console.log(
  run(
    `"${adb}" shell dumpsys package ${pkg} | findstr /i "Activity Resolver"`
  )
);
