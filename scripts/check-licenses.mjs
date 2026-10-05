import { readFileSync, writeFileSync } from 'node:fs';
const input = JSON.parse(readFileSync(process.argv[2] ?? 'licenses.json', 'utf8'));
const allowed = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  '(MIT OR Apache-2.0)',
  '(MIT AND Zlib)',
  'Python-2.0',
  '(Unlicense OR Apache-2.0)',
]);
const bad = Object.keys(input).filter((k) => !allowed.has(k));
const output = Object.entries(input)
  .flatMap(([license, packages]) =>
    packages.map((p) => ({ name: p.name, versions: p.versions, license })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('docs/dependency-licenses.json', JSON.stringify(output, null, 2) + '\n');
console.log(
  `${output.length} production packages inspected; licenses: ${Object.keys(input).join(', ')}`,
);
if (bad.length) {
  console.error('Review required:', bad.join(', '));
  process.exit(1);
}
