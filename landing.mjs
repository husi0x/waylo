/**
 * Waylo EXIT PAGE. Served with HTTP 200 for supported in-app browsers.
 * Platform-specific destination schemes are selected in server.mjs; this file
 * owns only the shared age-gate presentation and transition controller.
 */
import {
  EXIT_PAGE_CSS,
  EXIT_PAGE_DEFAULTS,
  normalizeCountdown,
  textOrDefault,
} from './exit-page-config.mjs';

const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function renderLanding(cfg = {}) {
  const countdown = normalizeCountdown(cfg.countdown);
  const values = {
    heading: textOrDefault(cfg.heading, EXIT_PAGE_DEFAULTS.heading, 80),
    subtext: textOrDefault(cfg.subtext, EXIT_PAGE_DEFAULTS.subtext, 220),
    button: textOrDefault(cfg.button, EXIT_PAGE_DEFAULTS.button, 40),
    customLabel: typeof cfg.customLabel === 'string' ? cfg.customLabel.trim().slice(0, 40) : '',
    customUrl: typeof cfg.customUrl === 'string' ? cfg.customUrl.trim().slice(0, 500) : '',
  };
  const primary = typeof cfg.primary === 'string' ? cfg.primary : '';
  const destination = typeof cfg.destination === 'string' ? cfg.destination : '';
  const fallback = typeof cfg.fallback === 'string' ? cfg.fallback : destination;
  const safe = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, esc(value)]));
  const customAction = values.customLabel && values.customUrl
    ? `<div class="exit-page-fallback" id="fallback-actions" hidden><a class="exit-page-custom" id="custom-action" href="${safe.customUrl}" rel="noopener noreferrer">${safe.customLabel}</a></div>`
    : '';
  const noscriptAction = values.customLabel && values.customUrl
    ? `<noscript><p><a class="exit-page-custom" href="${safe.customUrl}" rel="noopener noreferrer">${safe.customLabel}</a></p></noscript>`
    : '';
  const runtime = JSON.stringify({
    auto: cfg.auto !== false,
    countdown,
    primary,
    destination,
    fallback,
    hasCustomAction: Boolean(customAction),
    track: cfg.track && cfg.track.linkId ? { linkId: cfg.track.linkId, routeId: cfg.track.routeId || null } : null,
  }).replace(/</g, '\\u003c');
  const seconds = countdown === 1 ? 'second' : 'seconds';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#08090B">
<title>${safe.heading}</title>
<style>${EXIT_PAGE_CSS}</style>
</head>
<body class="exit-page-shell">
  <main class="exit-page-card" aria-labelledby="exit-page-title" aria-describedby="exit-page-description">
    <div class="exit-age-icon" aria-hidden="true"><span>18</span></div>
    <h1 class="exit-page-title" id="exit-page-title">${safe.heading}</h1>
    <p class="exit-page-subtext" id="exit-page-description">${safe.subtext}</p>
    <button class="exit-page-primary" id="continue" type="button">${safe.button}</button>
    <p class="exit-page-status" id="status" aria-live="polite">Opening automatically in ${countdown} ${seconds}…</p>
    ${customAction}
  </main>
<script>
(function(){
  var cfg = ${runtime};
  var continueButton = document.getElementById('continue');
  var status = document.getElementById('status');
  var fallbackActions = document.getElementById('fallback-actions');
  var redirectTimer = null;
  var countdownTimer = null;
  var unlockTimer = null;
  var fallbackTimer = null;
  var startedAt = Date.now();
  var inFlight = false;
  var automaticAttempted = false;
  var tracked = false;

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

  function revealFallback(){
    if (fallbackActions) fallbackActions.hidden = false;
    status.textContent = cfg.hasCustomAction
      ? 'If nothing opened, try again or use the option below.'
      : 'If nothing opened, tap Continue to try again.';
  }

  function attemptOpen(source){
    if (inFlight || (source === 'auto' && automaticAttempted)) return;
    if (source === 'manual') clearPendingTimers();
    if (source === 'auto') automaticAttempted = true;
    inFlight = true;
    fireTrack();
    continueButton.setAttribute('aria-disabled', 'true');
    status.textContent = 'Opening…';
    var target = cfg.primary || cfg.destination || cfg.fallback;
    try { window.location.href = target; } catch (error) {}
    fallbackTimer = setTimeout(revealFallback, 1100);
    unlockTimer = setTimeout(function(){
      inFlight = false;
      continueButton.removeAttribute('aria-disabled');
    }, 800);
  }

  function updateCountdown(){
    var elapsed = Date.now() - startedAt;
    var remaining = Math.max(1, Math.ceil((cfg.countdown * 1000 - elapsed) / 1000));
    status.textContent = 'Opening automatically in ' + remaining + ' ' + (remaining === 1 ? 'second' : 'seconds') + '…';
  }

  continueButton.addEventListener('click', function(){ attemptOpen('manual'); });
  var customActionLink = document.getElementById('custom-action');
  if (customActionLink) customActionLink.addEventListener('click', function(){ fireTrack(); });

  if (cfg.auto) {
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 250);
    redirectTimer = setTimeout(function(){
      clearPendingTimers();
      attemptOpen('auto');
    }, cfg.countdown * 1000);
  } else {
    status.textContent = 'Tap continue to open this link.';
    fallbackTimer = setTimeout(revealFallback, 1200);
  }

  window.addEventListener('pagehide', function(){
    clearPendingTimers();
    if (unlockTimer !== null) clearTimeout(unlockTimer);
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
  }, {once:true});
})();
</script>
${noscriptAction}
</body>
</html>`;
}
