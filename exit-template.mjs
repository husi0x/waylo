/**
 * Waylo EXIT PAGE TEMPLATES.
 * A template is a normalized JSON document: palette, background (color or
 * photos with blur/dim/slideshow), card, badge, texts and a dynamic button
 * list. renderExitTemplatePage() turns it into a standalone HTML page that
 * keeps the in-app browser escape + tracking runtime.
 */
import { normalizeCountdown, textOrDefault } from './exit-page-config.mjs';

const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const HEX = /^#[0-9a-fA-F]{6}$/;
const PHOTO_ID = /^[a-z0-9_-]{1,64}\.(jpg|jpeg|png|webp|gif)$/i;
const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/i;

const color = (value, fallback) =>
  typeof value === 'string' && HEX.test(value.trim()) ? value.trim().toLowerCase() : fallback;
const num = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
};
const str = (value, maxLength, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback;
const httpsUrl = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return HTTPS_URL.test(text) ? text.slice(0, 500) : '';
};
const hexA = (hex, opacityPercent) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, opacityPercent / 100)).toFixed(3)})`;
};

export const EXIT_TEMPLATE_LIMITS = Object.freeze({ buttons: 6, photos: 6 });

export function normalizeExitTemplate(raw = {}) {
  const palette = raw.palette || {};
  const background = raw.background || {};
  const card = raw.card || {};
  const badge = raw.badge || {};
  const buttons = (Array.isArray(raw.buttons) ? raw.buttons : []).slice(0, EXIT_TEMPLATE_LIMITS.buttons)
    .map((item = {}, index) => ({
      id: str(item.id, 40) || 'b' + (index + 1) + '_' + Math.random().toString(36).slice(2, 7),
      label: str(item.label, 40, 'Button ' + (index + 1)),
      url: httpsUrl(item.url),
      style: ['solid', 'outline', 'ghost'].includes(item.style) ? item.style : 'solid',
    }));
  if (!buttons.length) buttons.push({ id: 'b1', label: 'Continue', url: '', style: 'solid' });
  const photos = (Array.isArray(background.photos) ? background.photos : [])
    .filter((photo) => typeof photo === 'string' && PHOTO_ID.test(photo))
    .slice(0, EXIT_TEMPLATE_LIMITS.photos);
  return {
    id: typeof raw.id === 'string' && raw.id.length <= 64 ? raw.id : '',
    name: str(raw.name, 60, 'Untitled template'),
    mode: raw.mode === 'app' ? 'app' : 'browser',
    scheme: typeof raw.scheme === 'string' ? raw.scheme.trim().slice(0, 120) : '',
    palette: {
      bg: color(palette.bg, '#08090b'),
      card: color(palette.card, '#121214'),
      cardBorder: color(palette.cardBorder, '#2a2a31'),
      text: color(palette.text, '#f7f7f8'),
      sub: color(palette.sub, '#929298'),
      accent: color(palette.accent, '#e94b50'),
      btnBg: color(palette.btnBg, '#f3f3f4'),
      btnText: color(palette.btnText, '#111113'),
      btnBorder: color(palette.btnBorder, '#3a3a42'),
      radius: num(palette.radius, 0, 28, 18),
    },
    background: {
      type: background.type === 'photo' ? 'photo' : 'color',
      photos,
      blur: num(background.blur, 0, 40, 0),
      dim: num(background.dim, 0, 90, 30),
      slideshow: Boolean(background.slideshow),
      interval: num(background.interval, 3, 30, 6),
    },
    card: {
      visible: card.visible !== false,
      opacity: num(card.opacity, 0, 100, 100),
    },
    badge: {
      show: badge.show !== false,
      text: str(badge.text, 8, '18+'),
    },
    heading: str(raw.heading, 80, ''),
    subtext: str(raw.subtext, 300, ''),
    buttons,
    countdown: normalizeCountdown(raw.countdown),
    auto: raw.auto !== false,
  };
}

/** Classic card template — the look the built-in exit page always had. */
export function defaultExitTemplate() {
  return normalizeExitTemplate({
    name: 'Classic 18+ card',
    heading: 'Adults Only',
    subtext: 'This content is intended for adults aged 18 and older. By continuing, you confirm that you are at least 18 years old.',
    badge: { show: true, text: '18+' },
    buttons: [{ label: 'Continue (18+)', url: '', style: 'solid' }],
    palette: { radius: 21 },
  });
}

export const EXIT_TEMPLATE_CSS = String.raw`
.xt-shell,.xt-shell *{box-sizing:border-box}
.xt-shell{position:relative;min-height:100vh;min-height:100dvh;display:grid;place-items:center;overflow-x:hidden;background:var(--xt-bg-color);color:var(--xt-text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;-webkit-font-smoothing:antialiased;text-align:center;padding:calc(22px + env(safe-area-inset-top)) 18px calc(22px + env(safe-area-inset-bottom))}
.xt-bg{position:fixed;inset:0;z-index:0;overflow:hidden;background:var(--xt-bg-color)}
.xt-bg-img{position:absolute;inset:-6%;background-size:cover;background-position:center;opacity:0;transition:opacity 1.1s ease;filter:blur(var(--xt-blur)) saturate(1.06);transform:scale(1.06)}
.xt-bg-img.is-active{opacity:1}
.xt-dim{position:absolute;inset:0;background:rgba(0,0,0,var(--xt-dim))}
.xt-card{position:relative;z-index:1;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;padding:36px 24px 30px;border-radius:var(--xt-radius)}
.xt-card.xt-card--boxed{background:var(--xt-card);border:1px solid var(--xt-card-border);box-shadow:0 18px 50px rgba(0,0,0,.3)}
.xt-badge{width:44px;height:44px;border:3px solid var(--xt-accent);border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13.5px;line-height:1;letter-spacing:-.3px;color:var(--xt-text);margin-bottom:18px;flex-shrink:0}
.xt-title{font-size:22px;font-weight:800;letter-spacing:-.3px;line-height:1.25;margin:0 0 10px;max-width:320px;overflow-wrap:anywhere}
.xt-sub{font-size:14.5px;font-weight:400;line-height:1.52;color:var(--xt-sub);margin:0 0 24px;max-width:310px;overflow-wrap:anywhere}
.xt-actions{width:100%;display:grid;gap:10px}
.xt-btn{width:100%;min-height:54px;padding:14px 18px;border-radius:calc(var(--xt-radius) * .8);font:inherit;font-size:16px;font-weight:750;line-height:1.2;text-decoration:none;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .1s ease,opacity .14s ease,background-color .14s ease}
.xt-btn:active{transform:scale(.985)}
.xt-btn:focus-visible{outline:2px solid var(--xt-accent);outline-offset:3px}
.xt-btn[aria-disabled="true"]{cursor:wait;opacity:.75}
.xt-btn--solid{background:var(--xt-btn-bg);color:var(--xt-btn-text);border:1px solid var(--xt-btn-bg)}
@media(hover:hover) and (pointer:fine){.xt-btn--solid:hover{opacity:.92}}
.xt-btn--outline{background:transparent;color:var(--xt-text);border:1px solid var(--xt-btn-border)}
@media(hover:hover) and (pointer:fine){.xt-btn--outline:hover{background:rgba(255,255,255,.05)}}
.xt-btn--ghost{background:transparent;color:var(--xt-sub);border:1px solid transparent}
.xt-status{min-height:18px;margin:14px 0 0;color:var(--xt-sub);font-size:12.5px;line-height:1.4;font-variant-numeric:tabular-nums}
@media(max-height:560px){.xt-shell{place-items:start center}.xt-card{margin:auto 0}}
@media(prefers-reduced-motion:reduce){.xt-bg-img{transition:none}.xt-btn{transition:none}}
`;

export function templateVars(template) {
  const palette = template.palette;
  const background = template.background;
  return [
    `--xt-bg-color:${palette.bg}`,
    `--xt-card:${hexA(palette.card, template.card.opacity)}`,
    `--xt-card-border:${hexA(palette.cardBorder, Math.max(35, template.card.opacity))}`,
    `--xt-text:${palette.text}`,
    `--xt-sub:${palette.sub}`,
    `--xt-accent:${palette.accent}`,
    `--xt-btn-bg:${palette.btnBg}`,
    `--xt-btn-text:${palette.btnText}`,
    `--xt-btn-border:${palette.btnBorder}`,
    `--xt-radius:${palette.radius}px`,
    `--xt-blur:${background.blur}px`,
    `--xt-dim:${(background.dim / 100).toFixed(2)}`,
  ].join(';');
}

export function renderExitTemplatePage(cfg = {}) {
  const template = normalizeExitTemplate(cfg.template || {});
  const heading = textOrDefault(template.heading, 'Continue', 80);
  const subtext = template.subtext;
  const primary = typeof cfg.primary === 'string' ? cfg.primary : '';
  const destination = typeof cfg.destination === 'string' ? cfg.destination : '';
  const fallback = typeof cfg.fallback === 'string' ? cfg.fallback : destination;
  const hasPhotos = template.background.type === 'photo' && template.background.photos.length > 0;
  const photoLayers = hasPhotos
    ? template.background.photos.map((photo, index) =>
        `<div class="xt-bg-img${index === 0 ? ' is-active' : ''}" style="background-image:url('/exitmedia/${esc(photo)}')"></div>`).join('')
    : '';
  const backgroundHtml = hasPhotos
    ? `<div class="xt-bg" aria-hidden="true">${photoLayers}<div class="xt-dim"></div></div>`
    : '';
  const badgeHtml = template.badge.show
    ? `<div class="xt-badge" aria-hidden="true">${esc(template.badge.text)}</div>`
    : '';
  const buttonsHtml = template.buttons.map((button) => {
    if (!button.url) {
      return `<button class="xt-btn xt-btn--${button.style}" id="xt-continue" type="button">${esc(button.label)}</button>`;
    }
    return `<a class="xt-btn xt-btn--${button.style} xt-link" href="${esc(button.url)}" rel="noopener noreferrer">${esc(button.label)}</a>`;
  }).join('');
  const runtime = JSON.stringify({
    auto: template.auto,
    countdown: template.countdown,
    primary,
    destination,
    fallback,
    track: cfg.track && cfg.track.linkId ? { linkId: cfg.track.linkId, routeId: cfg.track.routeId || null } : null,
    slideshow: hasPhotos && template.background.photos.length > 1 && template.background.slideshow,
    interval: template.background.interval,
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="${esc(template.palette.bg)}">
<title>${esc(heading)}</title>
<style>${EXIT_TEMPLATE_CSS}</style>
</head>
<body class="xt-shell" style="${templateVars(template)}">
${backgroundHtml}
  <main class="xt-card${template.card.visible ? ' xt-card--boxed' : ''}" aria-labelledby="xt-title" aria-describedby="xt-sub">
    ${badgeHtml}
    <h1 class="xt-title" id="xt-title">${esc(heading)}</h1>
    ${subtext ? `<p class="xt-sub" id="xt-sub">${esc(subtext)}</p>` : ''}
    <div class="xt-actions">${buttonsHtml}</div>
    <p class="xt-status" id="xt-status" aria-live="polite"></p>
  </main>
<script>
(function(){
  var cfg = ${runtime};
  var continueButton = document.getElementById('xt-continue');
  var status = document.getElementById('xt-status');
  var startedAt = Date.now();
  var inFlight = false;
  var automaticAttempted = false;
  var tracked = false;
  var redirectTimer = null;
  var countdownTimer = null;
  var fallbackTimer = null;
  var unlockTimer = null;
  var slideTimer = null;

  function fireTrack(){
    if (tracked || !cfg.track || !cfg.track.linkId) return;
    tracked = true;
    try {
      var payload = new Blob([JSON.stringify(cfg.track)], { type: 'application/json' });
      if (navigator.sendBeacon) navigator.sendBeacon('/track', payload);
      else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/track', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
    } catch (error) {}
  }

  function clearPendingTimers(){
    if (redirectTimer !== null) clearTimeout(redirectTimer);
    if (countdownTimer !== null) clearInterval(countdownTimer);
    redirectTimer = null;
    countdownTimer = null;
  }

  function attemptOpen(source){
    if (inFlight || (source === 'auto' && automaticAttempted)) return;
    if (source === 'manual') clearPendingTimers();
    if (source === 'auto') automaticAttempted = true;
    inFlight = true;
    fireTrack();
    if (continueButton) continueButton.setAttribute('aria-disabled', 'true');
    status.textContent = 'Opening…';
    var target = cfg.primary || cfg.destination || cfg.fallback;
    try { window.location.href = target; } catch (error) {}
    fallbackTimer = setTimeout(function(){
      status.textContent = continueButton
        ? 'If nothing opened, tap the button again.'
        : 'If nothing opened, reload the page.';
    }, 1100);
    unlockTimer = setTimeout(function(){
      inFlight = false;
      if (continueButton) continueButton.removeAttribute('aria-disabled');
    }, 800);
  }

  function updateCountdown(){
    var elapsed = Date.now() - startedAt;
    var remaining = Math.max(1, Math.ceil((cfg.countdown * 1000 - elapsed) / 1000));
    status.textContent = 'Opening automatically in ' + remaining + ' ' + (remaining === 1 ? 'second' : 'seconds') + '…';
  }

  if (continueButton) continueButton.addEventListener('click', function(){ attemptOpen('manual'); });
  var links = document.querySelectorAll('.xt-link');
  for (var i = 0; i < links.length; i++) links[i].addEventListener('click', function(){ fireTrack(); });

  if (cfg.auto) {
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 250);
    redirectTimer = setTimeout(function(){
      clearPendingTimers();
      attemptOpen('auto');
    }, cfg.countdown * 1000);
  } else {
    status.textContent = continueButton ? 'Tap the button to continue.' : '';
    if (!continueButton) fallbackTimer = setTimeout(function(){ status.textContent = ''; }, 1200);
  }

  if (cfg.slideshow) {
    var layers = document.querySelectorAll('.xt-bg-img');
    if (layers.length > 1) {
      var active = 0;
      slideTimer = setInterval(function(){
        layers[active].classList.remove('is-active');
        active = (active + 1) % layers.length;
        layers[active].classList.add('is-active');
      }, cfg.interval * 1000);
    }
  }

  window.addEventListener('pagehide', function(){
    clearPendingTimers();
    if (unlockTimer !== null) clearTimeout(unlockTimer);
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
    if (slideTimer !== null) clearInterval(slideTimer);
  }, { once: true });
})();
</script>
</body>
</html>`;
}
