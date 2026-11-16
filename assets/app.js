(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  let sections = all('.reading-section');
  let links = all('.index-link');
  const storageKey = 'ordo-missae.preferences.v1';
  const state = { language: 'both', notes: true, font: 18, bookmark: '' };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (['both', 'pt', 'la'].includes(saved.language)) state.language = saved.language;
    if (typeof saved.notes === 'boolean') state.notes = saved.notes;
    if (Number.isFinite(saved.font)) state.font = Math.max(16, Math.min(26, saved.font));
    if (typeof saved.bookmark === 'string' && sections.some(s => s.id === saved.bookmark)) state.bookmark = saved.bookmark;
  } catch { storageAvailable = false; }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; }
  }
  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
  }
  function preferences() {
    document.body.dataset.language = state.language;
    document.body.classList.toggle('notes-hidden', !state.notes && !$('#search').value.trim());
    document.documentElement.style.setProperty('--reader-size', state.font + 'px');
    $(`input[name="language"][value="${state.language}"]`).checked = true;
    $('#show-notes').checked = state.notes;
    $('#font-down').disabled = state.font <= 16;
    $('#font-up').disabled = state.font >= 26;
    all('[data-bookmark]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.bookmark === state.bookmark)));
    $('#resume').hidden = !state.bookmark;
    if (state.bookmark) {
      const section = document.getElementById(state.bookmark);
      $('#resume-link').href = '#' + state.bookmark;
      $('#resume-link').textContent = 'Retomar: ' + section.querySelector('h3').textContent;
    }
  }
  preferences();
  all('input[name="language"]').forEach(input => input.addEventListener('change', () => {
    state.language = input.value; preferences(); persist();
  }));
  $('#show-notes').addEventListener('change', event => {
    state.notes = event.target.checked; preferences(); persist();
  });
  for (const [id, delta] of [['#font-down', -1], ['#font-up', 1]]) $(id).addEventListener('click', () => {
    state.font = Math.max(16, Math.min(26, state.font + delta)); preferences(); persist();
  });
  all('[data-bookmark]').forEach(button => button.addEventListener('click', () => {
    state.bookmark = state.bookmark === button.dataset.bookmark ? '' : button.dataset.bookmark;
    preferences(); persist();
    toast(state.bookmark ? (storageAvailable ? 'Etapa marcada. Retome por aqui na próxima visita.' : 'Etapa marcada nesta visita. O navegador não permitiu salvá-la.') : 'Marcador removido.');
  }));
  $('#clear-bookmark').addEventListener('click', () => {
    state.bookmark = ''; preferences(); persist(); toast('Marcador removido.');
  });

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('æ', 'ae').replaceAll('Æ', 'ae').replaceAll('œ', 'oe').toLowerCase();
  const searchable = new Map();
  function refreshContent() {
    sections = all('.reading-section').filter(section => !section.closest('article.reading[hidden]') && !section.dataset.properHidden);
    links = all('.index-link');
    searchable.clear();
    for (const section of sections) {
      const copy = section.cloneNode(true);
      copy.querySelectorAll('[hidden]').forEach(node => node.remove());
      searchable.set(section.id, normalize(copy.textContent));
    }
  }
  refreshContent();
  const search = $('#search');
  function filter() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    const visible = new Set();
    for (const section of sections) {
      const match = words.every(word => searchable.get(section.id).includes(word));
      section.hidden = !match;
      if (match) { count++; visible.add(section.id); }
    }
    all('.part-heading').forEach(heading => {
      heading.hidden = !sections.some(s => s.dataset.part === heading.dataset.part && !s.hidden);
    });
    links.forEach(link => { link.hidden = !visible.has(link.hash.slice(1)); });
    all('.nav-group').forEach(group => { group.hidden = !group.querySelector('.index-link:not([hidden])'); });
    $('#no-results').hidden = count !== 0;
    $('#search-count').textContent = words.length ? `${count} ${count === 1 ? 'etapa' : 'etapas'}` : '';
    // Search can match explanations; keep those visible while filtering.
    document.body.classList.toggle('notes-hidden', !state.notes && words.length === 0);
    updateProgress();
  }
  search.addEventListener('input', filter);
  document.addEventListener('ordo:properschange', () => { refreshContent(); filter(); });
  function clearSearch() { search.value = ''; filter(); }
  $('#clear-search').addEventListener('click', () => { clearSearch(); search.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) && !event.target.isContentEditable) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search) clearSearch();
  });

  const dialog = $('#index-dialog');
  $('#open-index').addEventListener('click', () => dialog.showModal());
  $('#close-index').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.addEventListener('click', event => { if (event.target.closest('.index-link') && dialog.open) dialog.close(); });
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
    if (target?.classList.contains('reading-section') && target.hidden) { clearSearch(); target.scrollIntoView(); }
  }
  window.addEventListener('hashchange', revealHash);
  $('#resume-link').addEventListener('click', () => clearSearch());
  all('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));

  let queued = false;
  function updateProgress() {
    queued = false;
    const limit = $('.reader-tools').getBoundingClientRect().bottom + 40;
    let current = '';
    for (const section of sections) if (!section.hidden && section.getBoundingClientRect().top <= limit) current = section.id;
    links.forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $('#progress-bar').style.width = (max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0) + '%';
  }
  function queueProgress() { if (!queued) { queued = true; requestAnimationFrame(updateProgress); } }
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress);
  new ResizeObserver(queueProgress).observe(document.querySelector('main'));
  revealHash();
  updateProgress();
})();
