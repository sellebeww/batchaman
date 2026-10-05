import { readFileSync } from 'node:fs';
const report=JSON.parse(readFileSync(process.argv[2]??'lighthouse.json','utf8'));
for(const name of ['performance','accessibility']){const score=report.categories[name]?.score;console.log(`${name}: ${score===undefined?'missing':Math.round(score*100)}`);if(score===undefined||score<0.9)process.exitCode=1}
