import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const data = JSON.parse(await readFile('content/calendar-1962.json', 'utf8'));
const context = vm.createContext({ URL, URLSearchParams });
vm.runInContext(await readFile('assets/daily.js', 'utf8'), context);
const helpers = context.OrdoDailyCalendar;
assert.equal(data.form, '1962');
assert.equal(data.calendar, 'general-roman');
assert.equal(data.days.length, 730);
const days = new Map(data.days.map(day => [day.date, day]));
assert.equal(days.size, data.days.length, 'Datas repetidas');
for (const [index, day] of data.days.entries()) {
  assert.ok(helpers.isDate(day.date));
  assert.ok(day.title && day.rank && day.season);
  assert.ok(day.readings.every(r => r.id && r.citation));
  if (index) assert.equal(helpers.shiftDate(data.days[index - 1].date, 1), day.date, 'Lacuna no calendário');
}
const cases = {
  '2026-02-01': 'Domingo da Septuagésima',
  '2026-02-18': 'Quarta-feira de Cinzas',
  '2026-04-05': 'Domingo da Páscoa na Ressurreição do Senhor',
  '2026-05-14': 'Ascensão do Senhor',
  '2026-06-04': 'Santíssimo Corpo e Sangue de Cristo',
  '2026-10-25': 'Cristo Rei',
  '2027-03-25': 'Quinta-feira Santa',
  '2027-03-28': 'Domingo da Páscoa na Ressurreição do Senhor',
  '2027-04-05': 'Anunciação de Nossa Senhora',
  '2027-10-31': 'Cristo Rei'
};
for (const [date, title] of Object.entries(cases)) assert.equal(days.get(date).title, title);
for (const date of ['2026-05-24', '2027-05-16']) assert.equal(days.get(date).color, 'red');
for (const date of ['2026-03-29', '2027-03-21']) {
  const readings = days.get(date).readings;
  assert.ok(readings.some(r => r.id === 'gospel'));
  assert.ok(readings.some(r => r.id === 'gospel-2'));
}
assert.equal(helpers.readingLabel('gospel', 'Domingo de Ramos'), 'Evangelho da bênção dos ramos');
assert.equal(helpers.readingLabel('gospel-2', 'Domingo de Ramos'), 'Paixão na Missa');
assert.match(helpers.specialNote('Sexta-feira Santa'), /não se celebra a Missa/);
assert.equal(helpers.shiftDate('2026-12-31', 1), '2027-01-01');
assert.equal(helpers.shiftDate('2028-02-28', 1), '2028-02-29');
assert.equal(helpers.isDate('2027-02-29'), false);
assert.equal(helpers.isDate('2026-04-31'), false);
assert.equal(helpers.isDate('<script>'), false);
assert.equal(helpers.dateKey(new Date(2026, 0, 1, 23, 30)), '2026-01-01');
assert.equal(helpers.localCitation('2 Corinthians 10:17-18; 11:1-2'), '2 Coríntios 10:17-18; 11:1-2');
const url = new URL(helpers.sourceUrl('2026-11-16'));
assert.equal(url.hostname, 'www.divinumofficium.com');
assert.equal(url.searchParams.get('date'), '11-16-2026');
assert.equal(url.searchParams.get('version'), 'Rubrics 1960 - 1960');
assert.equal(url.searchParams.get('lang2'), 'Portugues');
assert.equal(url.searchParams.get('Propers'), '1');
assert.equal(new URL(helpers.sourceUrl('invalid')).search, '');
const generated = await readFile('assets/calendar-data.js', 'utf8');
const generatedContext = vm.createContext({ window: {} });
vm.runInContext(generated, generatedContext);
assert.equal(JSON.stringify(generatedContext.window.ORDO_CALENDAR), JSON.stringify(data), 'Calendário gerado desatualizado');
console.log('Calendário: 730 datas contínuas, ciclos móveis, transferência da Anunciação em 2027, Pentecostes, Ramos, validação de datas e links de 1962 verificados.');
