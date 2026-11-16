// The source covers 2026 and 2027; do not extrapolate it into later years.
export const SOURCE_REPOSITORY = 'igorlaguiar/ambo-liturgical-calendars';
export const SOURCE_REVISION = 'af4a22a4014e9a46cadafc4c2ede4aa784f5a6f2';
export function convertCalendar(source) {
  if (source.form !== '1962' || source.calendar !== 'general-roman' || !Array.isArray(source.days)) throw new Error('Fonte incompatível com o calendário romano geral de 1962.');
  const year = source.year;
  if (!Number.isInteger(year) || year < 1900 || year > 2199) throw new Error('Ano inválido.');
  const count = new Date(Date.UTC(year, 2, 0)).getUTCDate() === 29 ? 366 : 365;
  if (source.days.length !== count) throw new Error(`Ano ${year} incompleto.`);
  return source.days.map((day, index) => {
    const date = new Date(Date.UTC(year, 0, index + 1)).toISOString().slice(0, 10);
    if (day.date !== date || day.form !== '1962' || day.calendar !== 'general-roman') throw new Error(`Data ausente, duplicada ou incompatível: ${date}`);
    const title = day.celebration?.title?.['pt-BR'];
    const rank = day.celebration?.rank?.name?.['pt-BR'];
    const season = day.season?.name?.['pt-BR'];
    if (typeof title !== 'string' || !title || typeof rank !== 'string' || !rank || typeof season !== 'string' || !season || !Array.isArray(day.readings)) throw new Error(`Registro incompleto: ${date}`);
    if (day.readings.some(r => typeof r.id !== 'string' || typeof r.citation !== 'string')) throw new Error(`Referências inválidas: ${date}`);
    // Correct the source's documented Pentecost colour issue. Retain both Palm Sunday readings.
    return { date, title, rank, color: title === 'Pentecostes' ? 'red' : day.celebration.color, season, readings: day.readings.map(r => ({ id: r.id, citation: r.citation })), additional: (day.alternatives || []).map(a => a.title['pt-BR']) };
  });
}
