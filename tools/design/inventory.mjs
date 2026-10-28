import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const source = walk(join(root, 'src')).filter(file => /\.(tsx?|css)$/.test(file) && !/[/\\]__tests__[/\\]|\.test\./.test(file));
const files = source.map(file => {
  const text = readFileSync(file, 'utf8');
  return {
    path: relative(root, file).replaceAll('\\', '/'),
    lines: text.split('\n').length,
    sha256: createHash('sha256').update(text).digest('hex'),
    literalColors: (text.match(/#[\da-f]{3,8}\b|(?:rgba?|hsla?|oklch)\([^)]*\)/gi) ?? []).length,
    arbitrarySpacing: (text.match(/\b(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-\[[^\]]+\]/g) ?? []).length,
    arbitraryType: (text.match(/\btext-\[[\d.]+(?:px|rem|em)\]/g) ?? []).length,
    handlers: Object.fromEntries(['onClick', 'onSubmit', 'onChange', 'onKeyDown', 'onDragStart', 'onDrop'].map(name => [name, (text.match(new RegExp('\\b' + name + '=', 'g')) ?? []).length])),
    imports: [...text.matchAll(/from\s+["']([^"']+)["']/g)].map(match => match[1]),
  };
});
const routes = files.filter(file => /src\/app\/.+\/page\.tsx$/.test(file.path) || file.path === 'src/app/page.tsx').map(file => ({
  route: '/' + file.path.replace(/^src\/app\//, '').replace(/(?:^|\/)page\.tsx$/, '').replace(/\([^/]+\)\//g, ''),
  file: file.path,
  components: file.imports.filter(value => value.startsWith('@/components')),
}));
const sum = key => files.reduce((total, file) => total + file[key], 0);
const report = {
  checkedAtUtc: new Date().toISOString(),
  purpose: 'Baseline source inventory and wiring ledger; counts are findings, never acceptance claims.',
  stack: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).dependencies,
  totals: { sourceFiles: files.length, routes: routes.length, literalColors: sum('literalColors'), arbitrarySpacing: sum('arbitrarySpacing'), arbitraryType: sum('arbitraryType') },
  routes, files,
};
const destination = resolve(root, process.argv[2] ?? '.hallmark/source-inventory.json');
if (!destination.startsWith(root + '\\') && !destination.startsWith(root + '/')) throw new Error('Inventory must stay inside the frontend project');
mkdirSync(resolve(destination, '..'), { recursive: true });
writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: relative(root, destination), ...report.totals }));
