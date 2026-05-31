import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
const badDeps = [];
for (const [name, version] of Object.entries(allDeps)) {
  if (version.endsWith('.tgz') || version.startsWith('./') || version.startsWith('../')) {
    badDeps.push(name);
  }
}
if (badDeps.length > 0) {
  console.error('Found local/tgz dependencies:', badDeps.join(', '));
  console.log('Please uninstall with: npm uninstall ' + badDeps.join(' '));
  process.exit(1);
} else {
  console.log('All dependencies are clean!');
}