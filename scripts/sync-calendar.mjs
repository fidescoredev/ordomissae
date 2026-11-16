import { readFile, writeFile } from 'node:fs/promises';
import { SOURCE_REPOSITORY, SOURCE_REVISION, convertCalendar } from './calendar-source.mjs';

const years = [...new Set(process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [2026, 2027])].sort();
if (!years.length || years.some(year => !Number.isInteger(year) || year < 1900 || year > 2199)) throw new Error('Informe anos entre 1900 e 2199.');
const sourceUrl = year => `https://raw.githubusercontent.com/${SOURCE_REPOSITORY}/${SOURCE_REVISION}/data/v1/1962/general-roman/${year}.json`;
const results = await Promise.allSettled(years.map(async year => {
  const response = await fetch(sourceUrl(year), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Fonte indisponível para ${year}: HTTP ${response.status}. A base publicada cobre 2026 e 2027.`);
  return convertCalendar(await response.json());
}));
const failures = results.filter(result => result.status === 'rejected');
if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'Importação cancelada. O calendário anterior foi preservado.');
const previous = JSON.parse(await readFile(new URL('../content/calendar-1962.json', import.meta.url), 'utf8'));
const data = { ...previous, source: { ...previous.source, revision: SOURCE_REVISION, retrieved: new Date().toISOString().slice(0, 10) }, days: results.flatMap(result => result.value) };
await writeFile(new URL('../content/calendar-1962.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(`Importadas ${data.days.length} datas. Execute npm run build e npm run check para atualizar e verificar a página.`);
