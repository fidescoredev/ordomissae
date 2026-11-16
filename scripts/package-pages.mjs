import { cp, mkdir, readFile, readdir, rm, stat, access } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
// Only the generated directory inside this checkout may be replaced.
if (output !== root + sep + 'dist') throw new Error('Diretório de publicação inválido.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', '.nojekyll', 'assets', 'licenses']) {
  await cp(resolve(root, name), resolve(output, name), { recursive: true });
}
const manifest = JSON.parse(await readFile(resolve(root, 'content/propers-manifest.json'), 'utf8'));
for (const entry of Object.values(manifest.months)) {
  const target = resolve(output, entry.file);
  if (!target.startsWith(output + sep)) throw new Error('Recurso fora do pacote público.');
  await access(target);
}
const html = await readFile(resolve(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await access(resolve(output, match[1]));
let count = 0;
let bytes = 0;
async function inspect(directory) {
  for (const name of await readdir(directory)) {
    const path = resolve(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) await inspect(path);
    else { count++; bytes += info.size; }
  }
}
await inspect(output);
console.log(`Pacote público pronto em dist/: ${count} arquivos, ${(bytes / 1048576).toFixed(1)} MiB, 24 meses de próprios.`);
