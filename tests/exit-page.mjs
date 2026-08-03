import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawn} from 'node:child_process';
import {EXIT_PAGE_DEFAULTS, normalizeCountdown, normalizeLandingFields} from '../exit-page-config.mjs';
import {renderLanding} from '../landing.mjs';

assert.deepEqual(EXIT_PAGE_DEFAULTS, {
  mode: 'browser',
  heading: 'Adults Only',
  countdown: 3,
  subtext: 'This content is intended for adults aged 18 and older. By continuing, you confirm that you are at least 18 years old.',
  button: 'Continue (18+)',
  customLabel: '',
  customUrl: '',
});

for (const value of [undefined, null, '', 'bad', Number.NaN, Number.POSITIVE_INFINITY, -8, 0, 1, 2, 2.6]) {
  assert.equal(normalizeCountdown(value), 3, `countdown ${String(value)} should normalize to 3`);
}
assert.equal(normalizeCountdown(3), 3);
assert.equal(normalizeCountdown('4.6'), 5);
assert.equal(normalizeCountdown(8.2), 8);

const fresh = normalizeLandingFields({landing: true});
assert.equal(fresh.landingMode, 'browser');
assert.equal(fresh.landingHeading, EXIT_PAGE_DEFAULTS.heading);
assert.equal(fresh.landingSubtext, EXIT_PAGE_DEFAULTS.subtext);
assert.equal(fresh.landingButton, EXIT_PAGE_DEFAULTS.button);
assert.equal(fresh.landingCustomLabel, '');
assert.equal(fresh.landingCustomUrl, '');
assert.equal(fresh.landingCountdown, 3);

const legacy = normalizeLandingFields({
  landing: true,
  landingHeading: 'My heading',
  landingSubtext: 'My subtext',
  landingButton: 'Go now',
  landingCopy: 'Duplicate URL',
  landingDirect: 'Use browser',
  landingCustomLabel: 'Contact support',
  landingCustomUrl: 'https://example.com/support',
  landingCountdown: 1,
});
assert.equal(legacy.landingHeading, 'My heading');
assert.equal(legacy.landingSubtext, 'My subtext');
assert.equal(legacy.landingButton, 'Go now');
assert.equal(legacy.landingCustomLabel, 'Contact support');
assert.equal(legacy.landingCustomUrl, 'https://example.com/support');
assert.equal('landingCopy' in legacy, false);
assert.equal('landingDirect' in legacy, false);
assert.equal(legacy.landingCountdown, 3);

const html = renderLanding({
  primary: 'intent://example.com#Intent;scheme=https;end',
  destination: 'https://example.com/content',
  fallback: 'https://example.com/content?_inapp_escaped=1',
});
assert.match(html, /Adults Only/);
assert.match(html, /Continue \(18\+\)/);
assert.match(html, /class="exit-age-icon"/);
assert.match(html, /Opening automatically in 3 seconds/);
assert.doesNotMatch(html, /Copy link|Open directly|id="copy"|id="direct"|exit-page-copy|exit-page-direct/);
assert.match(html, /function attemptOpen/);
assert.match(html, /clearTimeout\(redirectTimer\)/);
assert.doesNotMatch(html, /gradient|Powered by Waylo|class="avatar"|class="ring"/i);

const customHtml = renderLanding({
  primary: 'intent://example.com#Intent;scheme=https;end',
  destination: 'https://example.com/content',
  fallback: 'https://example.com/content?_inapp_escaped=1',
  customLabel: 'Contact support',
  customUrl: 'https://example.com/support',
});
assert.match(customHtml, /id="fallback-actions"[^>]*hidden/);
assert.match(customHtml, /id="custom-action"/);
assert.match(customHtml, /href="https:\/\/example\.com\/support"/);
assert.match(customHtml, />Contact support<\/a>/);
assert.doesNotMatch(customHtml, /Copy link|Open directly|id="copy"|id="direct"/);

function createRuntime(renderedHtml) {
  const script = renderedHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
  let nextTimerId = 1;
  const timers = new Map();
  const cleared = new Set();
  const targets = [];
  const elements = new Map();
  const element = (id) => {
    const listeners = new Map();
    return {
      id, hidden: id === 'fallback-actions', textContent: '', style: {},
      listeners,
      addEventListener(type, listener) { listeners.set(type, listener); },
      setAttribute(name, value) { this[name] = value; },
      removeAttribute(name) { delete this[name]; },
      focus() {},
      select() {},
    };
  };
  for (const id of ['continue', 'status', 'fallback-actions', 'custom-action']) elements.set(id, element(id));
  const schedule = (callback, delay, repeat = false) => {
    const id = nextTimerId++;
    timers.set(id, {callback, delay, repeat});
    return id;
  };
  const sandbox = {
    Date: {now: () => 0},
    navigator: {},
    document: {
      getElementById: (id) => elements.get(id),
      createElement: () => element('textarea'),
      body: {appendChild() {}, removeChild() {}},
      execCommand: () => true,
    },
    window: {
      location: Object.defineProperty({}, 'href', {set(value) { targets.push(value); }}),
      addEventListener() {},
    },
    setTimeout: (callback, delay) => schedule(callback, delay),
    clearTimeout: (id) => cleared.add(id),
    setInterval: (callback, delay) => schedule(callback, delay, true),
    clearInterval: (id) => cleared.add(id),
  };
  vm.runInNewContext(script, sandbox);
  return {timers, cleared, targets, elements};
}

const manualRuntime = createRuntime(customHtml);
const redirectEntry = [...manualRuntime.timers.entries()].find(([, timer]) => timer.delay === 3000 && !timer.repeat);
assert.ok(redirectEntry, 'three-second redirect timer should be scheduled once');
manualRuntime.elements.get('continue').listeners.get('click')();
assert.equal(manualRuntime.targets.length, 1, 'manual click should start one transition');
assert.ok(manualRuntime.cleared.has(redirectEntry[0]), 'manual click should cancel the pending redirect timer');
redirectEntry[1].callback();
assert.equal(manualRuntime.targets.length, 1, 'simultaneous timer callback should be ignored while a manual attempt is active');

const automaticRuntime = createRuntime(customHtml);
const automaticRedirect = [...automaticRuntime.timers.values()].find((timer) => timer.delay === 3000 && !timer.repeat);
automaticRedirect.callback();
assert.equal(automaticRuntime.targets.length, 1, 'automatic timer should start one transition');
const unlock = [...automaticRuntime.timers.values()].find((timer) => timer.delay === 800);
const reveal = [...automaticRuntime.timers.values()].find((timer) => timer.delay === 1100);
unlock.callback();
reveal.callback();
assert.equal(automaticRuntime.elements.get('fallback-actions').hidden, false);
automaticRuntime.elements.get('continue').listeners.get('click')();
assert.equal(automaticRuntime.targets.length, 2, 'manual retry should remain available after an automatic attempt');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waylo-exit-page-'));
fs.writeFileSync(path.join(dataDir, 'data.json'), JSON.stringify({
  domains: [{id: 'd1', host: 'links.test', status: 'active', ssl: false}],
  links: [{
    id: 'legacy', name: 'Legacy', slug: 'adult', domain: 'links.test', destination: 'https://example.com/adult',
    status: 'active', clicks: 0, rules: 0, routes: [], landing: true, landingCountdown: 1,
  }],
  events: [],
  page: {slug: 'p', name: 'Test', bio: '', accent: '#000', blocks: []},
}));
const port = await new Promise((resolve, reject) => {
  const socket = net.createServer();
  socket.on('error', reject);
  socket.listen(0, '127.0.0.1', () => {
    const address = socket.address();
    socket.close(() => resolve(address.port));
  });
});
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: path.resolve(import.meta.dirname, '..'),
  env: {...process.env, PORT: String(port), DATA_DIR: dataDir, ADMIN_PASSWORD: 'exit-page-test-password'},
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (data) => { logs += data; });
child.stderr.on('data', (data) => { logs += data; });
const base = `http://127.0.0.1:${port}`;
try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(base + '/api/health')).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (attempt === 49) throw new Error('server did not start: ' + logs);
  }

  const ordinary = await fetch(base + '/adult', {headers: {host: 'links.test'}, redirect: 'manual'});
  assert.equal(ordinary.status, 302);
  assert.equal(ordinary.headers.get('location'), 'https://example.com/adult');

  const inApp = await fetch(base + '/adult', {
    headers: {host: 'links.test', 'user-agent': 'Mozilla/5.0 (iPhone) Instagram 320.0.0.0'},
    redirect: 'manual',
  });
  const inAppHtml = await inApp.text();
  assert.equal(inApp.status, 200, inAppHtml);
  assert.match(inAppHtml, /Adults Only/);
  assert.match(inAppHtml, /Opening automatically in 3 seconds/);
  assert.match(inAppHtml, /instagram:\/\/extbrowser/);
  assert.match(inAppHtml, /instagram:\/\/extbrowser\/\?url=https%3A%2F%2Fexample\.com%2Fadult/);
  assert.doesNotMatch(inAppHtml, /instagram:\/\/extbrowser\/\?url=http%3A%2F%2Flinks\.test%2Fadult/);

  const login = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({password: 'exit-page-test-password'}),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = {'content-type': 'application/json', cookie};
  const invalid = await fetch(base + '/api/links', {
    method: 'POST', headers,
    body: JSON.stringify({name: 'Invalid', slug: 'invalid', domain: 'links.test', destination: 'https://example.com', landing: true, landingCountdown: 2}),
  });
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /at least 3/);

  const invalidCustom = await fetch(base + '/api/links', {
    method: 'POST', headers,
    body: JSON.stringify({name: 'Invalid custom', slug: 'invalid-custom', domain: 'links.test', destination: 'https://example.com', landing: true, landingCustomLabel: 'Support'}),
  });
  assert.equal(invalidCustom.status, 400);
  assert.match((await invalidCustom.json()).error, /custom button/i);

  const unsafeCustom = await fetch(base + '/api/links', {
    method: 'POST', headers,
    body: JSON.stringify({name: 'Unsafe custom', slug: 'unsafe-custom', domain: 'links.test', destination: 'https://example.com', landing: true, landingCustomLabel: 'Support', landingCustomUrl: 'http://example.com/support'}),
  });
  assert.equal(unsafeCustom.status, 400);
  assert.match((await unsafeCustom.json()).error, /public HTTPS link/i);

  const created = await fetch(base + '/api/links', {
    method: 'POST', headers,
    body: JSON.stringify({name: 'Fresh', slug: 'fresh', domain: 'links.test', destination: 'https://example.com', landing: true, landingCustomLabel: 'Support', landingCustomUrl: 'https://example.com/support'}),
  });
  const createdText = await created.text();
  assert.equal(created.status, 201, createdText);
  const createdLink = JSON.parse(createdText);
  assert.equal(createdLink.landingHeading, EXIT_PAGE_DEFAULTS.heading);
  assert.equal(createdLink.landingCountdown, 3);
  assert.equal(createdLink.landingCustomLabel, 'Support');
  assert.equal(createdLink.landingCustomUrl, 'https://example.com/support');
  assert.equal('landingCopy' in createdLink, false);
  assert.equal('landingDirect' in createdLink, false);
} finally {
  child.kill('SIGTERM');
  fs.rmSync(dataDir, {recursive: true, force: true});
}

console.log('exit-page: PASS');
