(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const calendar = globalThis.OrdoDailyCalendar;
  const manifest = globalThis.ORDO_PROPERS_MANIFEST;
  const ordinary = $('article.reading');
  const panel = $('#liturgia-diaria');
  if (!calendar || !manifest || !ordinary || !panel) return;
  const base = new URL('./', document.currentScript.src);
  const pending = new Map();
  const originalVisibility = new Map();
  let request = 0;
  let activeDay = null;
  const status = $('#proper-status');
  const formSelect = $('#proper-form');
  const special = $('#special-rite');

  function notify() { document.dispatchEvent(new CustomEvent('ordo:properschange')); }
  function setStatus(text, state) {
    status.textContent = text;
    status.dataset.state = state;
    ordinary.setAttribute('aria-busy', String(state === 'loading'));
    all('[data-print]').forEach(button => { button.disabled = state === 'loading'; });
  }
  function hide(element) {
    if (!element) return;
    if (!originalVisibility.has(element)) originalVisibility.set(element, element.hidden);
    element.hidden = true;
    if (element.classList.contains('reading-section')) element.dataset.properHidden = 'true';
  }
  function clear() {
    all('.proper-content').forEach(node => node.replaceChildren());
    all('.source-insert').forEach(node => node.remove());
    for (const [element, hidden] of originalVisibility) { element.hidden = hidden; delete element.dataset.properHidden; }
    originalVisibility.clear();
    all('.proper-placeholder').forEach(node => { node.hidden = false; });
    all('[data-proper-slot]').forEach(node => { delete node.dataset.loaded; });
    ordinary.hidden = false;
    special.replaceChildren();
    special.hidden = true;
    all('.special-index').forEach(node => node.remove());
    all('.section-index[data-ordinary-index]').forEach(node => { node.hidden = false; });
  }
  function loadMonth(month) {
    const cached = globalThis.ORDO_PROPERS_MONTHS?.[month];
    if (cached) return Promise.resolve(cached);
    if (pending.has(month)) return pending.get(month);
    const entry = manifest.months[month];
    if (!entry) return Promise.reject(new Error('Esta data não possui próprios nesta edição.'));
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(`./propers/${month}.js`, base).href;
      script.onload = () => {
        const data = globalThis.ORDO_PROPERS_MONTHS?.[month];
        if (data?.month === month && data.days) resolve(data);
        else reject(new Error('O arquivo dos próprios não contém dados válidos.'));
        script.remove();
      };
      script.onerror = () => { script.remove(); reject(new Error('Não foi possível carregar o arquivo local dos próprios.')); };
      document.head.append(script);
    }).catch(error => { pending.delete(month); throw error; });
    pending.set(month, promise);
    return promise;
  }

  // Parse source markup in an inert template. Only text and our own elements reach the page.
  function prayerLines(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup || '';
    const lines = [[]];
    function newline() { if (lines.at(-1).length) lines.push([]); }
    function walk(node, rubric = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/[\r\n]+/g, ' ');
        if (text) lines.at(-1).push({ text, rubric });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'LINK', 'INPUT', 'BUTTON', 'FORM'].includes(node.tagName)) return;
        if (node.tagName === 'BR') { newline(); return; }
        if (['P', 'DIV', 'H1', 'H2', 'H3'].includes(node.tagName)) newline();
        rubric ||= node.tagName === 'FONT' && /^(red|maroon)$/i.test(node.getAttribute('color') || '');
      }
      for (const child of node.childNodes) walk(child, rubric);
      if (['P', 'DIV', 'H1', 'H2', 'H3'].includes(node.tagName)) newline();
    }
    walk(template.content);
    return lines.map(parts => ({ text: parts.map(part => part.text).join('').replace(/\s+/g, ' ').trim().replace(/[℟℣]/g, symbol => symbol === '℟' ? 'R' : 'V').replace(/^[RM]\s*\/\.?\s*/, 'R. ').replace(/^M\.\s*/, 'R. ').replace(/[✠✝✚]/g, '†'), rubric: parts.filter(part => part.text.trim()).every(part => part.rubric) })).filter(line => line.text && line.text !== '_');
  }
  function appendText(parent, text) {
    const parts = text.replaceAll('+', '†').split('†');
    parts.forEach((part, index) => {
      if (index) { const cross = document.createElement('strong'); cross.className = 'cross'; cross.textContent = '†'; parent.append(cross); }
      parent.append(document.createTextNode(part));
    });
  }
  function textColumn(markup, language) {
    const column = document.createElement('div');
    column.className = 'prayer-text ' + (language === 'la' ? 'latin' : 'portuguese');
    column.lang = language;
    const label = document.createElement('span');
    label.className = 'mobile-language'; label.setAttribute('aria-hidden', 'true');
    label.textContent = language === 'la' ? 'Latim' : 'Português'; column.append(label);
    const lines = prayerLines(markup);
    for (const line of lines) {
      const paragraph = document.createElement('p');
      paragraph.className = line.rubric && !/^(R|V|S)\./.test(line.text) ? 'rubric source-rubric' : 'proper-line';
      if (/^R\./.test(line.text)) {
        const response = document.createElement('strong'); response.className = 'response';
        appendText(response, line.text); paragraph.append(response);
      } else appendText(paragraph, line.text);
      column.append(paragraph);
    }
    if (!lines.length) {
      const note = document.createElement('p'); note.className = 'source-rubric';
      note.textContent = language === 'la' ? 'Textus non adest.' : 'Tradução não disponível na fonte para este trecho; consulte a coluna latina.';
      column.append(note);
    }
    return column;
  }
  function table(rows) {
    const result = document.createElement('div'); result.className = 'prayer-table proper-table';
    const head = document.createElement('div'); head.className = 'language-head'; head.setAttribute('aria-hidden', 'true');
    for (const title of ['PORTUGUÊS', 'LATIM']) { const span = document.createElement('span'); span.textContent = title; head.append(span); }
    result.append(head);
    for (const row of rows) {
      const pair = document.createElement('div'); pair.className = 'prayer-row';
      pair.append(textColumn(row.pt, 'pt-BR'), textColumn(row.la, 'la')); result.append(pair);
    }
    return result;
  }
  function insertVariant(selector, rows, before = false) {
    const original = $(selector);
    if (!original || !rows?.length) return;
    const insert = document.createElement('div'); insert.className = 'source-insert'; insert.append(table(rows));
    (original.classList.contains('prayer-row') ? original.closest('.prayer-table') : original).before(insert); hide(original);
  }
  function omitted(selector, condition, message) {
    const section = $(selector);
    if (!section || !condition) return;
    const note = document.createElement('p'); note.className = 'source-insert source-omitted'; note.textContent = message;
    section.querySelector('.section-heading').after(note);
    if (selector === '#gloria') hide(section.querySelector('[data-source-line="228"]'));
    else hide(section.querySelector('.prayer-table'));
  }
  const labels = { Incipit: 'Ao pé do altar', Introitus: 'Intróito', Kyrie: 'Kyrie', Gloria: 'Glória', Oratio: 'Oração', Lectio: 'Leitura', Graduale: 'Gradual', Evangelium: 'Evangelho', Credo: 'Credo', Offertorium: 'Ofertório', Secreta: 'Secreta', Prefatio: 'Prefácio', Canon: 'Cânon', Communio: 'Comunhão', Postcommunio: 'Pós-Comunhão' };
  function celebrationTitle(form) {
    if (activeDay.forms.length > 1 && activeDay.date.endsWith('-12-25')) return 'Natal do Senhor — ' + ['Missa da meia-noite', 'Missa da aurora', 'Missa do dia'][form.number - 1];
    if (activeDay.forms.length > 1 && activeDay.date.endsWith('-11-02')) return `Comemoração dos Fiéis Defuntos — ${form.number}ª Missa`;
    return activeDay.title;
  }
  function fullRite(form) {
    ordinary.hidden = true; special.hidden = false;
    const heading = document.createElement('h2'); heading.className = 'special-title'; heading.textContent = 'Rito próprio — ' + celebrationTitle(form); special.append(heading);
    const intro = document.createElement('p'); intro.className = 'special-intro'; intro.textContent = 'Texto completo desta celebração, na ordem resolvida pela fonte sob as rubricas de 1960.'; special.append(intro);
    const entries = [];
    form.full.forEach((row, index) => {
      const section = document.createElement('section'); section.className = 'reading-section';
      section.id = 'rito-' + (index + 1); section.dataset.index = index + 1; section.dataset.part = 'Rito próprio';
      const title = labels[row.label] || row.label || 'Continuação';
      const h3 = document.createElement('h3'); h3.textContent = title; section.append(h3, table([row])); special.append(section);
      if (row.label) entries.push({ id: section.id, title });
    });
    all('.section-index[data-ordinary-index]').forEach(original => {
      original.hidden = true;
      const nav = document.createElement('nav'); nav.className = 'section-index special-index'; nav.setAttribute('aria-label', 'Índice do rito próprio');
      const group = document.createElement('div'); group.className = 'nav-group';
      for (const entry of entries) { const link = document.createElement('a'); link.className = 'index-link'; link.href = '#' + entry.id; link.textContent = entry.title; group.append(link); }
      nav.append(group); original.after(nav);
    });
  }
  function applyForm(number) {
    const form = activeDay.forms.find(form => form.number === number) || activeDay.forms[0];
    clear();
    formSelect.value = String(form.number);
    $('#daily-title').textContent = celebrationTitle(form);
    // The calendar card initially describes the first Mass; align it with a selected alternative.
    if (activeDay.forms.length > 1) {
      const references = [];
      for (const [slot, label] of [[3, 'Epístola'], [5, 'Evangelho']]) {
        const lines = (form.slots[slot] || []).flatMap(row => prayerLines(row.pt || row.la));
        const reference = lines.find(line => /^[\p{L}\p{N} .,-]+?\s*\d+:\d/u.test(line.text));
        if (reference) references.push({ label, text: reference.text });
      }
      const list = $('#daily-readings-list'); list.replaceChildren();
      if (!references.length) { const item = document.createElement('li'); item.textContent = 'As leituras deste formulário estão no ordinário abaixo.'; list.append(item); }
      for (const reference of references) { const item = document.createElement('li'); const label = document.createElement('strong'); label.textContent = reference.label + ': '; item.append(label, document.createTextNode(reference.text)); list.append(item); }
    }
    if (form.full?.length) fullRite(form);
    else {
      for (const [slot, rows] of Object.entries(form.slots)) {
        const target = $(`[data-proper-slot="${slot}"]`);
        if (!target || !rows.length) continue;
        target.querySelector('.proper-placeholder').hidden = true;
        target.querySelector('.proper-content').append(table(rows));
        target.dataset.loaded = activeDay.date;
      }
      // These responses and announcements are already supplied by the resolved proper.
      for (const line of [245, 262, 657]) hide($(`[data-source-line="${line}"]`)?.closest('.prayer-table'));
      for (const selector of ['#evangelho [data-source-line="284"]', '#evangelho [data-source-line="290"]', '#evangelho [data-source-line="293"]']) hide($(selector));
      hide($('#prefacio-trindade'));
      omitted('#gloria', !form.gloria, 'O Glória é omitido nesta Missa.');
      omitted('#credo', !form.credo, 'O Credo é omitido nesta Missa.');
      if (form.omitPsalm) for (let line = 133; line <= 142; line++) hide($(`[data-source-line="${line}"]`));
      insertVariant('#comunicantes .prayer-table', form.communicantes);
      insertVariant('#aceitacao-oferendas [data-source-line="469"]', form.hancigitur);
      insertVariant('#ultimo-evangelho .prayer-table', form.lastGospel);
      if (form.omitLastGospel) hide($('#ultimo-evangelho'));
    }
    const url = new URL(calendar.sourceUrl(activeDay.date)); url.searchParams.set('missanumber', String(form.number));
    $('#daily-source').href = url.href;
    all('.daily-proper-link').forEach(link => { link.href = url.href; });
    setStatus('Textos completos inseridos para ' + activeDay.date.split('-').reverse().join('/') + (activeDay.forms.length > 1 ? ` · ${form.number}ª Missa.` : '.'), 'ready');
    notify();
  }
  async function selectDate(date) {
    const ownRequest = ++request;
    activeDay = null; clear(); $('#proper-form-field').hidden = true;
    if (!calendar.isDate(date) || !manifest.months[date.slice(0, 7)]) {
      setStatus('Não há próprios locais para esta data. Selecione um dia de 2026 ou 2027.', 'unavailable'); notify(); return;
    }
    setStatus('Carregando os textos completos da Missa…', 'loading'); notify();
    try {
      const month = await loadMonth(date.slice(0, 7));
      if (ownRequest !== request) return;
      const day = month.days[date];
      if (!day?.forms?.length) throw new Error('Os próprios desta data não estão disponíveis.');
      activeDay = day;
      formSelect.replaceChildren();
      for (const form of day.forms) {
        const option = document.createElement('option'); option.value = form.number;
        const christmas = /^\d{4}-12-25$/.test(date);
        option.textContent = christmas ? ['Missa da meia-noite', 'Missa da aurora', 'Missa do dia'][form.number - 1] : `${form.number}ª Missa`;
        formSelect.append(option);
      }
      $('#proper-form-field').hidden = day.forms.length < 2;
      applyForm(1);
    } catch (error) {
      if (ownRequest !== request) return;
      setStatus(error.message + ' Verifique os arquivos da página ou consulte a fonte.', 'error'); notify();
    }
  }
  formSelect.addEventListener('change', () => { if (activeDay) applyForm(Number(formSelect.value)); });
  document.addEventListener('ordo:datechange', event => selectDate(event.detail.date));
  selectDate(panel.dataset.date || calendar.dateKey());
})();
