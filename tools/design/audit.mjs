import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

// Source inventory excludes test fixtures and the public homepage, which the
// user explicitly asked to preserve. Shared Logo belongs to that same brand.
function walk(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const p=join(dir,entry.name);
    return entry.isDirectory()?walk(p):[p];
  });
}
const files=walk('src').filter(p=>/\.(tsx|css)$/.test(p)&&!/[\\/]__tests__[\\/]|\.test\.|src[\\/]test[\\/]|components[\\/]v-intern[\\/]|^src[\\/]app[\\/]page\.tsx$/.test(p));
mkdirSync('.hallmark',{recursive:true});
writeFileSync('.hallmark/audit-scope.json',JSON.stringify({files:files.map(p=>relative('.',p)),excluded:['test fixtures','public homepage and v-intern brand components'],reason:'User instruction: preserve public homepage /.'},null,2));
const result=spawnSync(process.execPath,['.agents/skills/hallmark/scripts/sloplint.mjs',...files,'--scope','app','--genre','modern-minimal','--json',...process.argv.slice(2)],{encoding:'utf8',maxBuffer:10*1024*1024});
if(result.error)throw result.error;
writeFileSync('.hallmark/scoped-audit.json',result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
const report=JSON.parse(result.stdout);
console.log(JSON.stringify(report.summary));
process.exitCode=result.status??1;
