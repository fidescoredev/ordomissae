import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const sections = JSON.parse(await readFile('content/sections.json', 'utf8'));
const prayers = JSON.parse(await readFile('content/prayers.json', 'utf8'));
const html = await readFile('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs duplicados');
assert.equal(sections.length, 49, 'O roteiro precisa conter todas as 49 etapas');
assert.equal(prayers.length, 157, 'Pares de oração ausentes');
for (const prayer of prayers) {
  assert.ok(prayer.pt && prayer.la, `Tradução ausente na linha ${prayer.line}`);
  assert.equal(sections.filter(s => prayer.line >= s.start && prayer.line <= s.end).length, 1, `Oração omitida ou repetida: ${prayer.line}`);
  assert.ok(html.includes(`data-source-line="${prayer.line}"`), `Oração ausente do HTML: ${prayer.line}`);
}
for (const section of sections) {
  assert.ok(ids.includes(section.id), `Âncora ausente: ${section.id}`);
  assert.ok(section.proper || prayers.some(p => p.line >= section.start && p.line <= section.end), `Etapa vazia: ${section.id}`);
}
assert.deepEqual(sections.filter(s => s.proper).map(s => s.proper), [1,2,3,4,5,6,7,8,9,10], 'Remissões ao próprio do dia incompletas');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Link interno quebrado: ${match[1]}`);
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await access(match[1]);
assert.ok(!/<(?:iframe|script)[^>]+(?:src="https?:)/.test(html), 'Dependência externa inesperada');
execFileSync(process.execPath, ['--check', 'assets/app.js']);
execFileSync(process.execPath, ['--check', 'assets/daily.js']);
console.log(`Verificação concluída: ${sections.length} etapas, ${prayers.length} pares, 10 próprios, âncoras e arquivos locais válidos.`);
