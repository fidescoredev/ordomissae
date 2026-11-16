(() => {
  'use strict';
  const pad = number => String(number).padStart(2, '0');
  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1900 || year > 2199) return false;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }
  function shiftDate(value, delta) {
    if (!isDate(value)) return '';
    const date = new Date(value + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + delta);
    const result = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    return isDate(result) ? result : '';
  }
  function sourceUrl(value) {
    const url = new URL('https://www.divinumofficium.com/cgi-bin/missa/missa.pl');
    if (isDate(value)) {
      const [year, month, day] = value.split('-');
      url.search = new URLSearchParams({ date: `${month}-${day}-${year}`, command: 'praySanctaMissa', version: 'Rubrics 1960 - 1960', lang1: 'Latin', lang2: 'Portugues', langfb: 'Latin', Propers: '1' });
    }
    return url.href;
  }
  const books = {
    '1 Corinthians': '1 Coríntios', '2 Corinthians': '2 Coríntios', '1 Thessalonians': '1 Tessalonicenses', '2 Thessalonians': '2 Tessalonicenses',
    '1 Timothy': '1 Timóteo', '2 Timothy': '2 Timóteo', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro', '1 John': '1 João', '2 John': '2 João', '3 John': '3 João',
    '1 Kings': '1 Reis', '2 Kings': '2 Reis', '3 Kings': '3 Reis', '4 Kings': '4 Reis', '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel',
    '1 Maccabees': '1 Macabeus', '2 Maccabees': '2 Macabeus', 'Song of Songs': 'Cântico dos Cânticos', 'Song of Solomon': 'Cântico dos Cânticos',
    Genesis: 'Gênesis', Exodus: 'Êxodo', Leviticus: 'Levítico', Numbers: 'Números', Deuteronomy: 'Deuteronômio', Joshua: 'Josué', Judges: 'Juízes', Ruth: 'Rute',
    Chronicles: 'Crônicas', Ezra: 'Esdras', Nehemiah: 'Neemias', Tobit: 'Tobias', Judith: 'Judite', Esther: 'Ester', Job: 'Jó', Psalms: 'Salmos', Psalm: 'Salmo',
    Proverbs: 'Provérbios', Ecclesiastes: 'Eclesiastes', Ecclesiasticus: 'Eclesiástico', Sirach: 'Eclesiástico', Wisdom: 'Sabedoria',
    Isaiah: 'Isaías', Jeremiah: 'Jeremias', Lamentations: 'Lamentações', Baruch: 'Baruc', Ezekiel: 'Ezequiel', Daniel: 'Daniel', Hosea: 'Oseias',
    Joel: 'Joel', Amos: 'Amós', Obadiah: 'Abdias', Jonah: 'Jonas', Micah: 'Miqueias', Nahum: 'Naum', Habakkuk: 'Habacuc', Zephaniah: 'Sofonias', Haggai: 'Ageu', Zechariah: 'Zacarias', Malachi: 'Malaquias',
    Matthew: 'Mateus', Mark: 'Marcos', Luke: 'Lucas', John: 'João', Joannes: 'João', Acts: 'Atos dos Apóstolos', Romans: 'Romanos',
    Galatians: 'Gálatas', Ephesians: 'Efésios', Philippians: 'Filipenses', Colossians: 'Colossenses', Titus: 'Tito', Philemon: 'Filêmon', Hebrews: 'Hebreus', James: 'Tiago', Jude: 'Judas', Revelation: 'Apocalipse', Apocalypse: 'Apocalipse'
  };
  const bookPattern = new RegExp(Object.keys(books).sort((a, b) => b.length - a.length).join('|'), 'g');
  const localCitation = value => value.replace(bookPattern, book => books[book]);
  function readingLabel(id, title) {
    if (title === 'Domingo de Ramos' && id === 'gospel') return 'Evangelho da bênção dos ramos';
    if (title === 'Domingo de Ramos' && id === 'gospel-2') return 'Paixão na Missa';
    if (id === 'epistle') return 'Epístola';
    if (id === 'gospel') return 'Evangelho';
    if (id === 'passion') return 'Paixão';
    return /^lesson(?:-\d+)?$/.test(id) ? 'Lição' + (id.includes('-') ? ' ' + id.split('-').at(-1) : '') : 'Leitura';
  }
  function specialNote(title) {
    if (title === 'Sexta-feira Santa') return 'Celebração da Paixão do Senhor: neste dia não se celebra a Missa. O rito próprio completo é apresentado abaixo.';
    if (title === 'Sábado Santo') return 'A Vigília Pascal possui rito e leituras próprios. A cor indicada no calendário refere-se ao dia; na Missa da Vigília usam-se paramentos brancos.';
    if (title === 'Domingo de Ramos') return 'A bênção e a procissão dos ramos antecedem a Missa. As referências abaixo distinguem o Evangelho da bênção e a Paixão.';
    if (title.startsWith('Natal:')) return 'O Natal tem três Missas. Escolha o formulário abaixo para inserir seus textos completos no ordinário.';
    return '';
  }
  const helpers = { dateKey, isDate, shiftDate, sourceUrl, localCitation, readingLabel, specialNote };
  globalThis.OrdoDailyCalendar = Object.freeze(helpers);
  if (typeof document === 'undefined') return;

  const $ = selector => document.querySelector(selector);
  const panel = $('#liturgia-diaria');
  if (!panel) return;
  const calendar = globalThis.ORDO_CALENDAR;
  if (!calendar || calendar.form !== '1962' || calendar.calendar !== 'general-roman' || !Array.isArray(calendar.days)) {
    $('#daily-status').textContent = 'O calendário local não pôde ser carregado. O ordinário e a consulta externa continuam disponíveis.';
    return;
  }
  const days = new Map(calendar.days.map(day => [day.date, day]));
  const dateInput = $('#daily-date');
  const formatted = value => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value + 'T12:00:00Z'));
  const colors = { white: 'Branco', red: 'Vermelho', green: 'Verde', violet: 'Roxo', rose: 'Róseo', black: 'Preto', gold: 'Dourado' };
  function render(value) {
    const valid = isDate(value);
    const day = valid ? days.get(value) : undefined;
    dateInput.value = valid ? value : '';
    panel.dataset.date = valid ? value : '';
    $('#daily-previous').disabled = !valid || !shiftDate(value, -1);
    $('#daily-next').disabled = !valid || !shiftDate(value, 1);
    $('#daily-result').hidden = !day;
    $('#daily-status').classList.toggle('sr-only', !!day);
    $('#daily-source').href = sourceUrl(value);
    document.querySelectorAll('.daily-proper-link').forEach(link => {
      link.href = valid ? sourceUrl(value) : '#liturgia-diaria';
      link.textContent = valid ? `Consultar os próprios de ${value.split('-').reverse().join('/')} ↗` : 'Escolher a data e consultar os próprios ↑';
      if (valid) { link.target = '_blank'; link.rel = 'noreferrer'; }
      else { link.removeAttribute('target'); link.removeAttribute('rel'); }
    });
    document.dispatchEvent(new CustomEvent('ordo:datechange', { detail: { date: valid ? value : '' } }));
    if (!valid) {
      $('#daily-status').textContent = 'Escolha uma data válida. O calendário local abrange 2026 e 2027.';
      return;
    }
    if (!day) {
      $('#daily-status').textContent = `Não há dados locais para ${formatted(value)}. A base desta edição abrange 2026 e 2027. Consulte a data selecionada no Divinum Officium pelo botão abaixo.`;
      return;
    }
    $('#daily-status').textContent = `${formatted(value)}: ${day.title}. ${day.rank}.`;
    $('#daily-date-label').textContent = formatted(value);
    $('#daily-title').textContent = day.title;
    $('#daily-rank').textContent = day.rank;
    $('#daily-season').textContent = day.season;
    $('#daily-color').textContent = 'Cor: ' + (colors[day.color] || 'consultar o próprio');
    $('#daily-color').dataset.color = Object.hasOwn(colors, day.color) ? day.color : 'unknown';
    const note = specialNote(day.title);
    $('#daily-special').hidden = !note;
    $('#daily-special').textContent = note;
    const list = $('#daily-readings-list');
    list.replaceChildren();
    for (const reading of day.readings) {
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = readingLabel(reading.id, day.title) + ': ';
      item.append(label, document.createTextNode(localCitation(reading.citation)));
      list.append(item);
    }
    if (!day.readings.length) {
      const item = document.createElement('li');
      item.textContent = 'Referências não disponíveis nesta base. Consulte o formulário completo.';
      list.append(item);
    }
  }
  dateInput.disabled = false;
  $('#daily-today').disabled = false;
  dateInput.addEventListener('change', () => render(dateInput.value));
  $('#daily-previous').addEventListener('click', () => render(shiftDate(dateInput.value, -1)));
  $('#daily-next').addEventListener('click', () => render(shiftDate(dateInput.value, 1)));
  $('#daily-today').addEventListener('click', () => render(dateKey()));
  const requested = new URLSearchParams(location.search).get('data');
  render(requested && isDate(requested) ? requested : dateKey());
})();
