import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const manifest = JSON.parse(await readFile('content/propers-manifest.json', 'utf8'));
const calendar = JSON.parse(await readFile('content/calendar-1962.json', 'utf8'));
const days = new Map();
assert.equal(manifest.form, '1962');
assert.equal(manifest.calendar, 'general-roman');
assert.equal(Object.keys(manifest.months).length, 24, 'Esperados os 24 meses de 2026 e 2027');
for (const [month, entry] of Object.entries(manifest.months)) {
  const script = await readFile(entry.file, 'utf8');
  assert.equal(createHash('sha256').update(script).digest('hex'), entry.sha256, `Arquivo alterado: ${month}`);
  const context = vm.createContext({}); vm.runInContext(script, context);
  const payload = context.ORDO_PROPERS_MONTHS[month];
  assert.equal(payload.month, month);
  assert.equal(Object.keys(payload.days).length, entry.days);
  for (const [date, day] of Object.entries(payload.days)) {
    assert.equal(date, day.date); assert.equal(date.slice(0, 7), month);
    assert.ok(!days.has(date), `Data duplicada: ${date}`); days.set(date, day);
    assert.ok(day.forms.length >= 1 && day.forms.length <= 3);
    for (const form of day.forms) {
      assert.equal(typeof form.gloria, 'boolean'); assert.equal(typeof form.credo, 'boolean');
      if (!form.full) for (let slot = 1; slot <= 10; slot++) assert.ok(form.slots[slot]?.length, `${date}: próprio ${slot} ausente`);
      const rows = form.full || Object.values(form.slots).flat();
      for (const row of rows) {
        assert.ok(row.la.trim(), `${date}: latim ausente`);
        assert.ok(row.pt.trim(), `${date}: segunda coluna ausente`);
        assert.ok(!/\bmissing\b|cannot open|not found/i.test(row.la + row.pt), `${date}: referência não resolvida`);
        assert.ok(!/(?:^|\n)\s*[@$&](?:Commune|Sancti|Tempora|Per |Qui |Gloria|prefatio)/i.test(row.la + row.pt), `${date}: macro não expandida`);
      }
    }
  }
}
assert.equal(days.size, 730);
for (const day of calendar.days) assert.ok(days.has(day.date), `Próprios ausentes: ${day.date}`);
const text = (date, slot, lang = 'pt', number = 0) => days.get(date).forms[number].slots[slot].map(row => row[lang]).join(' ');
assert.match(text('2026-11-16', 1), /justi[çc]a/);
assert.match(text('2026-11-16', 2), /Gertrudes/);
assert.match(text('2026-11-16', 3), /Cor[ií]ntios/);
assert.equal(days.get('2026-11-16').forms[0].credo, false);
assert.equal(days.get('2026-11-16').forms[0].gloria, true);
assert.equal(days.get('2026-02-01').forms[0].gloria, false);
for (const date of ['2026-12-25', '2027-12-25', '2026-11-02', '2027-11-02']) assert.equal(days.get(date).forms.length, 3, `Formulários incompletos: ${date}`);
assert.notEqual(text('2026-12-25', 5, 'la', 0), text('2026-12-25', 5, 'la', 2));
for (const date of ['2026-03-29', '2026-04-02', '2026-04-03', '2026-04-04']) assert.ok(days.get(date).forms[0].full?.length > 10, `Rito próprio incompleto: ${date}`);
assert.match(text('2027-04-05', 5, 'la'), /Mar[ií]a/);
assert.ok(days.get('2026-05-24').forms[0].communicantes.length);
console.log('Próprios: 730 datas, 24 arquivos mensais, dez textos nas Missas usuais, Semana Santa, formulários de Natal/Defuntos e referências aos comuns verificados.');
