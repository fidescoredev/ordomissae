// Optional local browser QA. No npm packages are required.
// Usage: node scripts/browser-check.mjs <path-to-chromium>
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const executable = process.argv[2];
if (!executable) throw new Error('Informe o caminho de um navegador Chromium.');
await mkdir('.preview', { recursive: true });
const profile = await mkdtemp(resolve('.preview/profile-'));
const browser = spawn(executable, ['--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
let browserLog = '';
browser.stderr.on('data', chunk => { browserLog += chunk.toString(); });
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (browser.exitCode !== null) throw new Error('O navegador encerrou: ' + browserLog.slice(-1500));
    try { port = (await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; await fetch(`http://127.0.0.1:${port}/json/version`); break; }
    catch { await new Promise(r => setTimeout(r, 250)); }
  }
  assert.ok(port, 'Depuração do navegador indisponível. ' + browserLog.slice(-1500));
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const waiting = new Map();
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
    if (message.id && waiting.has(message.id)) {
      const { resolve, reject, timer } = waiting.get(message.id);
      clearTimeout(timer); waiting.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  };
  function cdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { waiting.delete(id); reject(new Error('Tempo excedido: ' + method)); }, 15000);
      waiting.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Erro no navegador');
    return result.result.value;
  }
  async function waitFor(expression, description) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 75));
    }
    throw new Error('Não concluiu: ' + description + ' / ' + await evaluate('document.querySelector("#proper-status").textContent'));
  }
  async function chooseDate(date) {
    await evaluate(`document.querySelector('#daily-date').value=${JSON.stringify(date)};document.querySelector('#daily-date').dispatchEvent(new Event('change'))`);
    await waitFor('document.querySelector("#proper-status").dataset.state === "ready"', date);
  }
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: 'http://127.0.0.1:4173/?data=2026-11-16' });
  for (let i = 0; i < 50; i++) { if (await evaluate('document.readyState === "complete"')) break; await new Promise(r => setTimeout(r, 100)); }
  await waitFor('document.querySelector("#proper-status").dataset.state === "ready"', 'carregamento inicial dos próprios');
  assert.equal(await evaluate('document.querySelectorAll(".reading-section").length'), 49);
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Rolagem horizontal no computador');
  await writeFile('.preview/desktop.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  assert.equal(await evaluate('document.querySelector("#daily-title").textContent'), 'Santa Gertrudes, virgem');
  assert.equal(await evaluate('new URL(document.querySelector("#daily-source").href).searchParams.get("version")'), 'Rubrics 1960 - 1960');
  assert.equal(await evaluate('document.querySelectorAll(".daily-proper-link[target=_blank]").length'), 10);
  assert.equal(await evaluate('document.querySelectorAll("[data-proper-slot][data-loaded=\\"2026-11-16\\"]").length'), 10);
  assert.ok(await evaluate('document.querySelector("#introito .proper-content").textContent.includes("justiça")'));
  assert.ok(await evaluate('document.querySelector("#coleta .proper-content").textContent.includes("Gertrudes")'));
  assert.ok(await evaluate('document.querySelector("#introito .proper-content strong.response") !== null'));
  assert.equal(await evaluate('document.querySelectorAll(".proper-content script,.proper-content iframe,.proper-content img,.proper-content [onclick],.proper-content [style]").length'), 0);
  await evaluate('scrollTo({top:scrollY+document.querySelector("#introito .proper-content").getBoundingClientRect().top-220,behavior:"instant"})');
  await new Promise(resolve => setTimeout(resolve, 650));
  await writeFile('.preview/propers-desktop.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  await evaluate('document.querySelector("#daily-next").click()');
  assert.equal(await evaluate('document.querySelector("#daily-date").value'), '2026-11-17');
  await evaluate('document.querySelector("#daily-previous").click()');
  assert.equal(await evaluate('document.querySelector("#daily-date").value'), '2026-11-16');
  await evaluate(`document.querySelector('#daily-date').value='2026-05-24';document.querySelector('#daily-date').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate('document.querySelector("#daily-color").textContent'), 'Cor: Vermelho');
  await evaluate(`document.querySelector('#daily-date').value='2026-03-29';document.querySelector('#daily-date').dispatchEvent(new Event('change'))`);
  await waitFor('document.querySelector("#proper-status").dataset.state === "ready"', 'rito de Ramos');
  assert.equal(await evaluate('document.querySelector("article.reading").hidden'), true);
  assert.equal(await evaluate('document.querySelector("#special-rite").hidden'), false);
  assert.ok(await evaluate('document.querySelector("#special-rite").textContent.length > 10000'));
  assert.ok(await evaluate('document.querySelector("#daily-readings-list").textContent.includes("Paixão na Missa") && document.querySelector("#daily-readings-list").textContent.includes("bênção dos ramos")'));
  await evaluate(`document.querySelector('#daily-date').value='2030-01-01';document.querySelector('#daily-date').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate('document.querySelector("#daily-result").hidden'), true, 'Um dia indisponível deixou a festa anterior visível');
  assert.equal(await evaluate('new URL(document.querySelector("#daily-source").href).searchParams.get("date")'), '01-01-2030');
  await evaluate(`document.querySelector('#daily-date').value='';document.querySelector('#daily-date').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate('document.querySelector("#daily-result").hidden'), true);
  assert.equal(await evaluate('new URL(document.querySelector("#daily-source").href).search'), '');
  await evaluate('document.querySelector("#daily-today").click()');
  assert.equal(await evaluate('document.querySelector("#daily-date").value === OrdoDailyCalendar.dateKey()'), true);
  await chooseDate('2026-12-25');
  assert.equal(await evaluate('document.querySelector("#proper-form").options.length'), 3);
  const midnightGospel = await evaluate('document.querySelector("#evangelho .proper-content").textContent');
  await evaluate('document.querySelector("#proper-form").value="3";document.querySelector("#proper-form").dispatchEvent(new Event("change"))');
  assert.notEqual(await evaluate('document.querySelector("#evangelho .proper-content").textContent'), midnightGospel);
  assert.equal(await evaluate('new URL(document.querySelector("#daily-source").href).searchParams.get("missanumber")'), '3');
  await chooseDate('2026-11-16');
  assert.equal(await evaluate('document.querySelector("#special-rite").hidden'), true);
  assert.equal(await evaluate('document.querySelector("article.reading").hidden'), false);
  await evaluate('document.querySelector("#liturgia-diaria").scrollIntoView()');
  await new Promise(r => setTimeout(r, 700));
  await writeFile('.preview/daily-desktop.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  await evaluate('scrollTo(0,0)');
  await evaluate(`document.querySelector('input[value="la"]').click()`);
  assert.equal(await evaluate('document.body.dataset.language'), 'la');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".portuguese")).display'), 'none');
  await evaluate(`document.querySelector('#search').value='ressurreicao'; document.querySelector('#search').dispatchEvent(new Event('input'))`);
  assert.ok(await evaluate('document.querySelectorAll(".reading-section:not([hidden])").length > 0 && document.querySelectorAll(".reading-section:not([hidden])").length < 49'), 'Busca sem acentos não funcionou');
  await evaluate(`document.querySelector('#search').value='zzzzzzzz'; document.querySelector('#search').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate('document.querySelector("#no-results").hidden'), false);
  await evaluate(`document.querySelector('#clear-search').click();document.querySelector('input[value="both"]').click()`);
  assert.equal(await evaluate('document.querySelectorAll(".reading-section:not([hidden])").length'), 48);
  await evaluate(`document.querySelector('#search').value='Gertrudes';document.querySelector('#search').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate('document.querySelector("#coleta").hidden'), false, 'Busca não incluiu o próprio inserido');
  await chooseDate('2026-11-17');
  assert.equal(await evaluate('document.querySelector("#coleta .proper-content").textContent.includes("Gertrudes")'), false, 'Texto anterior permaneceu depois da troca de data');
  await chooseDate('2026-11-16');
  await evaluate('document.querySelector("#clear-search").click()');
  await evaluate('document.querySelector("#font-up").click()');
  assert.equal(await evaluate('getComputedStyle(document.documentElement).getPropertyValue("--reader-size")'), '19px');
  await evaluate('document.querySelector("#show-notes").click()');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".rubric")).display'), 'none');
  await evaluate('document.querySelector("#show-notes").click();document.querySelector("#font-down").click();document.querySelector("[data-bookmark=credo]").click()');
  assert.equal(await evaluate('document.querySelector("#resume").hidden'), false);
  await cdp('Page.reload'); await new Promise(r => setTimeout(r, 500));
  assert.equal(await evaluate('document.querySelector("[data-bookmark=credo]").getAttribute("aria-pressed")'), 'true', 'Marcador não persistiu');
  await evaluate('document.querySelector("#clear-bookmark").click()');
  for (const width of [320, 390, 768]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 720 });
    await evaluate('scrollTo(0,0)'); await new Promise(r => setTimeout(r, 100));
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Rolagem horizontal na largura ' + width);
    if (width === 390) {
      await writeFile('.preview/mobile.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      await evaluate('document.querySelector("#liturgia-diaria").scrollIntoView()');
      await new Promise(r => setTimeout(r, 700));
      await writeFile('.preview/daily-mobile.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      await evaluate('document.querySelector("#toast").classList.remove("visible");scrollTo({top:scrollY+document.querySelector("#introito .proper-content").getBoundingClientRect().top-190,behavior:"instant"})');
      await new Promise(resolve => setTimeout(resolve, 650));
      await writeFile('.preview/propers-mobile.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      await evaluate('document.querySelector("#open-index").click()');
      assert.equal(await evaluate('document.querySelector("#index-dialog").open'), true);
      await evaluate('document.querySelector("#index-dialog a[href=\\"#kyrie\\"]").click()');
      assert.equal(await evaluate('document.querySelector("#index-dialog").open'), false);
      await evaluate('document.querySelector("#ao-pe-do-altar").scrollIntoView()');
      await new Promise(r => setTimeout(r, 800));
      await writeFile('.preview/mobile-reading.png', Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    }
  }
  await cdp('Emulation.setEmulatedMedia', { media: 'print' });
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".reader-tools")).display'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".prayer-row")).display'), 'grid');
  assert.deepEqual(errors, [], 'Erros de JavaScript');
  console.log('Navegador: calendário de 1962, mudança de data, Pentecostes, Ramos, data indisponível e inválida, links dos próprios, idiomas, busca, leitura, marcador, índice móvel, impressão e larguras 320/390/768/1440 verificados. Capturas em .preview/.');
} catch (error) {
  console.error(browserLog.slice(-3500));
  throw error;
} finally {
  socket?.close();
  browser.kill();
}
