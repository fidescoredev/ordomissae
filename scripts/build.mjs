import { readFile, writeFile } from 'node:fs/promises';

const sections = JSON.parse(await readFile(new URL('../content/sections.json', import.meta.url), 'utf8'));
const prayers = JSON.parse(await readFile(new URL('../content/prayers.json', import.meta.url), 'utf8'));
const calendar = JSON.parse(await readFile(new URL('../content/calendar-1962.json', import.meta.url), 'utf8'));
const propers = JSON.parse(await readFile(new URL('../content/propers-manifest.json', import.meta.url), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const groups = [...new Set(sections.map(s => s.group))];
const nav = groups.map((group, index) => `<div class="nav-group"><p class="nav-group-title"><span>${String(index + 1).padStart(2, '0')}</span>${escape(group)}</p>${sections.filter(s => s.group === group).map(s => `<a class="index-link" href="#${s.id}">${escape(s.title)}</a>`).join('')}</div>`).join('');

function prose(text) {
  // Restore spaces lost in the source's HTML extraction without changing its words.
  return escape(text.replaceAll('\u00a0', ' ').replace(/([.!?;:,])(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 '))
    .replace(/(^|\s)([SR])\s*[.:](?=\s)([\s\S]*?)(?=\s[SR]\s*[.:](?=\s)|$)/g, (_, space, speaker, words) => {
      const phrase = `<span class="speaker">${speaker}.</span>${words}`;
      return space + (speaker === 'R' ? `<strong class="response">${phrase}</strong>` : phrase);
    })
    .replaceAll('†', '<strong class="cross" aria-label="sinal da cruz">†</strong>')
    .replaceAll('\n', '<br><br>');
}
function proper(s) {
  return `<div class="proper-slot" data-proper-slot="${s.proper}"><div class="proper proper-placeholder"><span class="proper-number">${s.proper}</span><div><strong>Próprio da Missa do dia</strong><p>Selecione uma data acima para inserir automaticamente este texto.</p><a class="daily-proper-link" href="#liturgia-diaria">Escolher a data e consultar a fonte ↑</a></div></div><div class="proper-content"></div></div>`;
}
let previousGroup = '';
const reading = sections.map((s, index) => {
  const group = s.group !== previousGroup ? `<div class="part-heading" data-part="${escape(s.group)}"><span>PARTE ${String(groups.indexOf(s.group) + 1).padStart(2, '0')}</span><h2>${escape(s.group)}</h2><div aria-hidden="true">✦</div></div>` : '';
  previousGroup = s.group;
  const rows = prayers.filter(p => p.line >= s.start && p.line <= s.end);
  const row = p => `<div class="prayer-row" data-source-line="${p.line}"><div class="prayer-text portuguese" lang="pt-BR"><span class="mobile-language" aria-hidden="true">Português</span>${prose(p.pt)}</div><div class="prayer-text latin" lang="la"><span class="mobile-language" aria-hidden="true">Latim</span>${prose(p.la)}</div></div>`;
  const table = list => list.length ? `<div class="prayer-table"><div class="language-head" aria-hidden="true"><span>PORTUGUÊS</span><span>LATIM</span></div>${list.map(row).join('')}</div>` : '';
  let body;
  if (s.properAfter) body = table(rows.filter(p => p.line <= s.properAfter)) + proper(s) + table(rows.filter(p => p.line > s.properAfter));
  else body = (s.proper ? proper(s) : '') + table(rows);
  return `${group}<section class="reading-section" id="${s.id}" aria-labelledby="title-${s.id}" data-part="${escape(s.group)}" data-index="${index + 1}">
    <div class="section-heading"><div><p class="section-latin">${escape(s.latin)}</p><h3 id="title-${s.id}">${escape(s.title)}</h3></div><button class="bookmark" data-bookmark="${s.id}" aria-label="Marcar ${escape(s.title)} para retomar" aria-pressed="false" title="Marcar para retomar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button></div>
    ${s.posture ? `<p class="posture"><span aria-hidden="true">◇</span> ${escape(s.posture)}</p>` : ''}
    <div class="rubric">${s.notes.map(n => `<p>${escape(n)}</p>`).join('')}</div>
    ${body}
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#70262d">
  <meta name="description" content="Ordinário da Missa na forma extraordinária: orações em português e latim, instruções, preces finais e cânticos. Um missal digital para acompanhar e estudar.">
  <title>Ordo Missæ — Ordinário da Santa Missa</title>
  <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./assets/style.css">
  <link rel="stylesheet" href="./assets/daily.css">
  <link rel="stylesheet" href="./assets/propers.css">
  <script src="./assets/app.js" defer></script>
  <script src="./assets/calendar-data.js" defer></script>
  <script src="./assets/daily.js" defer></script>
  <script src="./assets/propers-manifest.js" defer></script>
  <script src="./assets/propers.js" defer></script>
</head>
<body data-language="both">
  <a href="#ordinario" class="skip-link">Pular para o ordinário</a>
  <header class="site-header">
    <a href="#inicio" class="brand" aria-label="Ordo Missae, início"><span class="brand-cross" aria-hidden="true">✠</span><span>Ordo Missæ<small>ORDINÁRIO DA SANTA MISSA</small></span></a>
    <nav aria-label="Navegação principal" class="top-nav"><a href="#liturgia-diaria">Liturgia do dia</a><a href="#ordinario">O ordinário</a><a href="#como-acompanhar">Como acompanhar</a><a href="#fontes">Fontes</a></nav>
    <button type="button" class="print-button" data-print><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z"/></svg><span>Imprimir</span></button>
  </header>
  <div class="site-layout">
    <aside class="sidebar" aria-label="Índice do ordinário">
      <div class="sidebar-heading"><span>ÍNDICE DO ORDINÁRIO</span><span aria-hidden="true">☷</span></div>
      <nav class="section-index" data-ordinary-index aria-label="Etapas da Missa">${nav}</nav>
      <div class="sidebar-foot"><span class="small-cross" aria-hidden="true">✠</span><span>Ad majorem Dei gloriam</span></div>
    </aside>
    <main id="inicio">
      <div class="hero">
        <p class="eyebrow"><span></span> UM GUIA PARA A ORAÇÃO <span></span></p>
        <h1>Ordo Missæ<span class="title-dot">.</span></h1>
        <p class="hero-subtitle">Ordinário da Missa na Forma Extraordinária</p>
        <p class="hero-description">Acompanhe a Santa Missa em português e latim.<br>Da preparação às últimas preces, com recolhimento e atenção.</p>
        <div class="hero-actions"><a class="primary-button" href="#ordinario">Começar a leitura <span aria-hidden="true">↓</span></a><a href="#como-acompanhar" class="quiet-link">Como acompanhar <span aria-hidden="true">↗</span></a></div>
        <div class="hero-meta"><span>PORTUGUÊS & LATIM</span><span aria-hidden="true">✦</span><span>${sections.length} ETAPAS</span><span aria-hidden="true">✦</span><span>LEITURA CONTÍNUA</span></div>
      </div>
      <section id="liturgia-diaria" class="daily" aria-labelledby="daily-heading">
        <div class="daily-top"><div><p class="eyebrow">CALENDÁRIO ROMANO GERAL · 1962</p><h2 id="daily-heading">Liturgia do dia</h2></div><span class="daily-mark" aria-hidden="true">✦</span></div>
        <p class="daily-intro">Consulte a celebração e acesse os próprios em português e latim.</p>
        <div class="daily-controls" role="group" aria-label="Escolher o dia litúrgico"><button id="daily-previous" aria-label="Dia anterior" disabled>←</button><label><span class="sr-only">Data da celebração</span><input id="daily-date" type="date" min="1900-01-01" max="2199-12-31" disabled></label><button id="daily-next" aria-label="Dia seguinte" disabled>→</button><button id="daily-today" disabled>Hoje</button></div>
        <p id="daily-status" class="daily-status" role="status" aria-live="polite">Ative o JavaScript para consultar o calendário de 2026 e 2027. O ordinário permanece disponível abaixo.</p>
        <div id="daily-result" hidden>
          <p id="daily-date-label" class="daily-date-label"></p><h3 id="daily-title"></h3>
          <ul class="daily-tags" aria-label="Informações da celebração"><li id="daily-rank"></li><li id="daily-season"></li><li id="daily-color"></li></ul>
          <div id="daily-special" class="daily-special" hidden></div>
          <div class="daily-readings"><h4>Referências das leituras</h4><ul id="daily-readings-list"></ul><p>Referências da fonte, com numeração bíblica do missal. Os textos completos são inseridos automaticamente no ordinário abaixo.</p></div>
        </div>
        <label id="proper-form-field" class="proper-form-field" hidden>Formulário da celebração <select id="proper-form" aria-label="Escolher o formulário da Missa"></select></label>
        <p id="proper-status" class="proper-status" role="status" aria-live="polite">Selecione uma data para inserir os textos no ordinário.</p>
        <div class="daily-source-actions"><a class="primary-button" href="#ordinario">Ler a Missa deste dia ↓</a><a id="daily-source" class="quiet-link" href="https://www.divinumofficium.com/cgi-bin/missa/missa.pl" target="_blank" rel="noreferrer">Conferir na fonte ↗</a></div>
        <p class="daily-scope">Calendário romano geral de 1962, sob as rubricas de 1960. Festas próprias do Brasil, da diocese e da comunidade não estão incorporadas. Nos dias com vários formulários, selecione a Missa abaixo.</p>
        <details class="daily-about"><summary>Fonte e alcance desta consulta</summary><p>Dados locais para 2026 e 2027: <a href="https://github.com/igorlaguiar/ambo-liturgical-calendars" target="_blank" rel="noreferrer">Ambo Liturgical Calendars</a>, derivados do Divinum Officium. A cor de Pentecostes foi corrigida para vermelho, conforme a errata da própria base. No Domingo de Ramos, distinguimos o Evangelho da bênção dos ramos da Paixão da Missa.</p><p>Esta seção mostra a celebração principal e as referências disponíveis. Comemorações e transferências devem ser conferidas na consulta completa do <a href="https://www.divinumofficium.com/" target="_blank" rel="noreferrer">Divinum Officium</a>. O link fixa a data selecionada e as rubricas de 1960, com latim e português. Os próprios são gerados a partir do motor do Divinum Officium e inseridos nesta página. A consulta externa fica disponível para conferência. Trechos sem tradução própria na fonte podem permanecer em latim.</p><p>Fonte importada em 16/11/2026. <a href="./licenses/ambo-liturgical-calendars.txt">Licença e atribuição dos dados</a>.</p></details>
      </section>
      <details id="como-acompanhar" class="guide">
        <summary>Antes de começar <span>Um breve guia de leitura</span><span class="details-plus" aria-hidden="true">+</span></summary>
        <div class="guide-content"><p><strong>S.</strong> indica o sacerdote; <strong>R.</strong> indica a resposta do ministro ou do povo. O sinal <strong>†</strong> representa o sinal da cruz. As indicações de postura acompanham o roteiro da fonte.</p><p>Escolha os dois idiomas ou apenas um. As notas explicam os gestos e a sequência; você pode ocultá-las para concentrar-se nas orações. O marcador ao lado de cada título permite retomar uma etapa neste navegador.</p><p>Os dez campos numerados do <strong>Próprio da Missa do dia</strong> dependem da celebração e não trazem texto completo na página de referência. Ao selecionar uma data, esta página preenche os dez campos com os textos resolvidos pela fonte. Nos ritos especiais, apresenta a sequência completa da celebração.</p><p>Esta é uma edição digital de leitura baseada no roteiro indicado em <a href="#fontes">Fontes</a>. As observações históricas e as variantes ali presentes são identificadas no texto.</p></div>
      </details>
      <div id="resume" class="resume" hidden><div><span class="eyebrow">SUA ETAPA MARCADA</span><a id="resume-link" href="#ordinario">Retomar a leitura</a></div><button id="clear-bookmark" aria-label="Remover etapa marcada">×</button></div>
      <div id="ordinario" class="reader-start" tabindex="-1"><p class="eyebrow">O ORDINÁRIO</p><h2>Uma oração, dois idiomas.</h2><p>Leia no seu ritmo. Acompanhe cada parte da celebração.</p></div>
      <div class="reader-tools" role="region" aria-label="Preferências de leitura">
        <div class="tools-main"><fieldset class="language-switch"><legend class="sr-only">Idioma das orações</legend><label><input type="radio" name="language" value="both" checked><span>Português + Latim</span></label><label><input type="radio" name="language" value="pt"><span>Português</span></label><label><input type="radio" name="language" value="la"><span>Latim</span></label></fieldset><div class="reading-options"><label class="notes-toggle"><input type="checkbox" id="show-notes" checked><span>Notas</span></label><div class="font-controls" role="group" aria-label="Tamanho da letra"><button id="font-down" aria-label="Diminuir letra">A−</button><button id="font-up" aria-label="Aumentar letra">A+</button></div></div></div>
        <div class="tools-search"><button class="mobile-index-button" id="open-index" aria-haspopup="dialog">☷ <span>Índice</span></button><label class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span class="sr-only">Buscar nas orações e nas notas</span><input id="search" type="search" placeholder="Buscar uma oração ou palavra…" autocomplete="off"><kbd aria-hidden="true">/</kbd></label><span class="search-count" id="search-count" role="status" aria-live="polite"></span></div>
      </div>
      <div id="no-results" class="no-results" hidden><span aria-hidden="true">✦</span><h3>Nenhuma etapa encontrada</h3><p>Tente outra palavra em português ou latim.</p><button id="clear-search" class="primary-button">Limpar busca</button></div>
      <article id="special-rite" class="special-rite" aria-label="Rito próprio da celebração" hidden></article>
      <article class="reading" aria-label="Texto do ordinário">${reading}</article>
<section id="fontes" class="sources" aria-labelledby="sources-title"><p class="eyebrow">SOBRE ESTA EDIÇÃO</p><h2 id="sources-title">Fontes e notas editoriais</h2><p>Organização digital do roteiro <a href="https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/" target="_blank" rel="noreferrer">Ordinário da Missa na Forma Extraordinária, do Rumo à Santidade ↗</a>. As explicações foram redigidas para esta página; os textos tradicionais de oração seguem a sequência da fonte. Os cânticos recebem uma tradução de leitura própria desta edição.</p><p>O endereço originalmente indicado é a <a href="https://web.archive.org/web/20260420122206/https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/" target="_blank" rel="noreferrer">captura do Wayback Machine de 20 de abril de 2026 ↗</a>. Essa captura não pôde ser recuperada nesta implementação. O conteúdo foi conferido a partir da versão atual acessível; sua identidade com a captura não foi verificada.</p><p>As remissões ao próprio do dia, as preces finais e as observações históricas pertencem ao roteiro consultado. A consulta diária acrescenta o calendário romano geral de 1962 para 2026 e 2027, com referências e links para os próprios. Os textos completos dos próprios são inseridos automaticamente a partir de arquivos locais gerados pelo motor do Divinum Officium. A ilustração e os menus gerais do portal de origem podem ser consultados diretamente na fonte.</p><p class="source-note">Edição de leitura e estudo. A transcrição conserva variantes e possíveis erros tipográficos da fonte; uma revisão litúrgica e linguística ainda é necessária antes de usá-la como edição de referência.</p></section>
      <footer class="site-footer"><span aria-hidden="true">✠</span><p>Ordo Missæ</p><small>Para acompanhar, meditar e rezar.</small><a href="#inicio">Voltar ao início ↑</a></footer>
    </main>
  </div>
  <dialog id="index-dialog" aria-labelledby="dialog-title"><div class="dialog-heading"><h2 id="dialog-title">Índice do ordinário</h2><button id="close-index" aria-label="Fechar índice">×</button></div><nav class="section-index" data-ordinary-index aria-label="Etapas da Missa no celular">${nav}</nav></dialog>
  <div class="reading-progress" aria-hidden="true"><span id="progress-bar"></span></div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
</body>
</html>`;
await writeFile(new URL('../index.html', import.meta.url), html);
await writeFile(new URL('../assets/calendar-data.js', import.meta.url), `// Dados sob licença MIT; consulte licenses/ambo-liturgical-calendars.txt.\nwindow.ORDO_CALENDAR = ${JSON.stringify(calendar).replaceAll('<', '\\u003c')};\n`);
await writeFile(new URL('../assets/propers-manifest.js', import.meta.url), `// Fonte: Divinum Officium; consulte licenses/divinum-officium.txt.\nglobalThis.ORDO_PROPERS_MANIFEST = ${JSON.stringify(propers).replaceAll('<', '\\u003c')};\n`);
console.log(`Página gerada: ${sections.length} etapas, ${prayers.length} pares de oração.`);
