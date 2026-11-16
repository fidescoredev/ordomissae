import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const calendar = JSON.parse(await readFile('content/calendar-1962.json', 'utf8'));
const upstream = JSON.parse(await readFile('vendor/upstream.json', 'utf8'));
const perl = process.env.ORDO_PERL || (process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/perl.exe' : 'perl');
const dates = process.argv.slice(2);
const selected = dates.length ? calendar.days.filter(day => dates.includes(day.date)) : calendar.days;
if (dates.some(date => !selected.some(day => day.date === date))) throw new Error('Uma das datas não está no calendário local.');
const mapping = [null, 'Introitus', 'Oratio', 'Lectio', 'Graduale', 'Evangelium', 'Offertorium', 'Secreta', 'Prefatio', 'Communio', 'Postcommunio'];
const cleanLabel = value => value.replace(/<[^>]*>/g, '').replace(/\{.*?\}/g, '').trim().replace(/[.:]$/, '');
const cacheVersion = createHash('sha256').update(readFileSync('scripts/render-mass.pl')).update(upstream.revision).digest('hex').slice(0, 16);
const cacheDirectory = resolve('.preview/engine', cacheVersion);
mkdirSync(cacheDirectory, { recursive: true });
function render(date, number, full = false) {
  const cacheFile = resolve(cacheDirectory, `${date}-${number}-${full ? 'full' : 'proper'}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, 'utf8'));
  const result = spawnSync(perl, [resolve('scripts/render-mass.pl').replaceAll('\\', '/'), date, String(number), full ? '1' : '0'], { cwd: resolve('vendor/divinum-officium/web/cgi-bin/missa'), env: { ...process.env, ORDO_WORKSPACE: resolve('.').replaceAll('\\', '/') }, encoding: 'utf8', maxBuffer: 15 * 1024 * 1024, windowsHide: true });
  if (result.status !== 0) throw new Error(`${date}, formulário ${number}: ${result.stderr || result.error || result.stdout}`);
  const mass = JSON.parse(result.stdout);
  if (mass.error) throw new Error(`${date}: ${mass.error}`);
  if (/\bmissing\b|not found|cannot open/i.test(mass.rows.map(row => row.la + row.pt).join(' '))) throw new Error(`${date}: texto ou referência não resolvida pelo motor.`);
  writeFileSync(cacheFile, JSON.stringify(mass));
  return mass;
}
const months = new Map();
let count = 0;
for (const day of selected) {
  const first = render(day.date, 1);
  const multiple = /multiple\s*([23])/.exec(first.rule || '');
  const alternatives = /celebranda\s+aut\s+([^\n]+)/i.exec(first.rule || '');
  const formCount = multiple ? Number(multiple[1]) : alternatives ? Math.min(3, alternatives[1].split(/\s+aut\s+/i).length) : 1;
  const forms = [];
  for (let number = 1; number <= formCount; number++) {
    const mass = number === 1 ? first : render(day.date, number);
    const slots = {};
    const variants = { communicantes: [], hancigitur: [], lastGospel: [] };
    let current = '';
    const other = [];
    for (const row of mass.rows) {
      const label = cleanLabel(row.label).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/^communicantes$/i.test(label)) { variants.communicantes.push({ la: row.la, pt: row.pt }); current = ''; continue; }
      if (/^hancigitur$/i.test(label)) { variants.hancigitur.push({ la: row.la, pt: row.pt }); current = ''; continue; }
      if (/^Ultimaev$/i.test(label)) { variants.lastGospel.push({ la: row.la, pt: row.pt }); current = ''; continue; }
      if (/^(Allel[uú][ij]a|Tractus|Sequentia)$/i.test(label)) current = 'Graduale';
      else if (mapping.includes(label)) current = label;
      else if (label) current = '';
      if (current) (slots[mapping.indexOf(current)] ||= []).push({ la: row.la, pt: row.pt });
      else other.push(row);
    }
    const holyWeek = /(?:Domingo de Ramos|Quinta-feira Santa|Sexta-feira Santa|Sábado Santo)/.test(day.title);
    const special = holyWeek || /Full text|Prelude|LectioL\d/i.test(mass.rule || '') || /11-02/.test(mass.winner) || other.some(row => /Lectio|Prophetia/.test(row.label));
    const fullMass = special ? render(day.date, number, true) : null;
    if (!fullMass && mapping.slice(1).some((key, i) => !slots[i + 1]?.length)) throw new Error(`${day.date}: próprios ausentes: ${mapping.slice(1).filter((key, i) => !slots[i + 1]?.length).join(', ')}. Títulos: ${mass.rows.map(row => row.label).join(', ')}`);
    forms.push({ number, title: cleanLabel(mass.title || day.title), winner: mass.winner, rule: mass.rule, gloria: mass.gloria, credo: mass.credo, omitPsalm: mass.omitPsalm, omitLastGospel: /no Ultima Evangelium/i.test(mass.rule || ''), slots, ...variants, ...(fullMass ? { full: fullMass.rows.map(row => ({ label: cleanLabel(row.label), la: row.la, pt: row.pt })) } : {}) });
  }
  const month = day.date.slice(0, 7);
  if (!months.has(month)) months.set(month, {});
  months.get(month)[day.date] = { date: day.date, title: day.title, forms };
  count++;
  if (count % 50 === 0) console.log(`${count}/${selected.length} datas resolvidas`);
}
await mkdir('assets/propers', { recursive: true });
const manifest = { schemaVersion: 1, form: '1962', calendar: 'general-roman', source: { repository: upstream.repository, revision: upstream.revision }, months: {} };
for (const [month, days] of months) {
  const data = JSON.stringify({ month, days }).replaceAll('<', '\\u003c');
  const script = `globalThis.ORDO_PROPERS_MONTHS ||= {}; globalThis.ORDO_PROPERS_MONTHS[${JSON.stringify(month)}] = ${data};\n`;
  await writeFile(`assets/propers/${month}.js`, script);
  manifest.months[month] = { file: `assets/propers/${month}.js`, days: Object.keys(days).length, sha256: createHash('sha256').update(script).digest('hex') };
}
await writeFile('content/propers-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${count} datas exportadas para ${months.size} arquivos mensais.`);
