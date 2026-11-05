// Bypass del check versione per ambienti locali con Node.js < 18.17.0
// Non influenza gli ambienti di produzione come Vercel (che utilizzano Node 20.x / 22.x di default).
const semver = process.versions.node.split('.').map(Number);
if (semver[0] === 18 && semver[1] < 17) {
  Object.defineProperty(process.versions, 'node', {
    value: '18.17.0',
    writable: true,
    configurable: true,
  });
}
