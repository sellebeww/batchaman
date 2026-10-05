import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
const root=resolve('apps/web/dist');
const manifest=JSON.parse(readFileSync(resolve(root,'.vite/manifest.json'),'utf8'));
const seen=new Set();
function visit(key){if(seen.has(key))return;seen.add(key);for(const dep of manifest[key].imports??[])visit(dep)}
for(const [key,item] of Object.entries(manifest))if(item.isEntry)visit(key);
const bytes=[...seen].reduce((n,key)=>n+gzipSync(readFileSync(resolve(root,manifest[key].file))).length,0);
console.log(`Initial JavaScript: ${(bytes/1024).toFixed(2)} KiB gzip / 200 KiB`);
if(bytes>200*1024)process.exit(1);
