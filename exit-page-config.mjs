export const EXIT_PAGE_DEFAULTS = Object.freeze({
  mode: 'browser',
  heading: 'Adults Only',
  countdown: 3,
  subtext: 'This content is intended for adults aged 18 and older. By continuing, you confirm that you are at least 18 years old.',
  button: 'Continue (18+)',
  copyLabel: 'Copy link',
  directLabel: 'Open directly',
});

export function normalizeCountdown(value) {
  if (value === null || value === undefined || value === '') return EXIT_PAGE_DEFAULTS.countdown;
  const number = Number(value);
  if (!Number.isFinite(number)) return EXIT_PAGE_DEFAULTS.countdown;
  return Math.max(EXIT_PAGE_DEFAULTS.countdown, Math.round(number));
}

export function isValidCountdownInput(value) {
  if (value === null || value === undefined || value === '') return true;
  const number = Number(value);
  return Number.isFinite(number) && number >= EXIT_PAGE_DEFAULTS.countdown;
}

export function textOrDefault(value, fallback, maxLength) {
  if (typeof value !== 'string') return fallback;
  const text = value.trim().slice(0, maxLength);
  return text || fallback;
}

export function withExitPageDefaults(value = {}) {
  return {
    mode: value.landingMode === 'app' ? 'app' : EXIT_PAGE_DEFAULTS.mode,
    heading: textOrDefault(value.landingHeading, EXIT_PAGE_DEFAULTS.heading, 80),
    countdown: normalizeCountdown(value.landingCountdown),
    subtext: textOrDefault(value.landingSubtext, EXIT_PAGE_DEFAULTS.subtext, 220),
    button: textOrDefault(value.landingButton, EXIT_PAGE_DEFAULTS.button, 40),
    copyLabel: textOrDefault(value.landingCopy, EXIT_PAGE_DEFAULTS.copyLabel, 40),
    directLabel: textOrDefault(value.landingDirect, EXIT_PAGE_DEFAULTS.directLabel, 40),
  };
}

export function normalizeLandingFields(body = {}) {
  const on = Boolean(body && body.landing);
  const defaults = withExitPageDefaults(body || {});
  const scheme = typeof body?.landingScheme === 'string'
    ? body.landingScheme.trim().slice(0, 120)
    : '';
  return {
    landing: on,
    landingMode: on ? defaults.mode : EXIT_PAGE_DEFAULTS.mode,
    landingScheme: on && defaults.mode === 'app' && /^[a-z][a-z0-9+.-]*:\/\//i.test(scheme) ? scheme : '',
    landingHeading: on ? defaults.heading : '',
    landingSubtext: on ? defaults.subtext : '',
    landingButton: on ? defaults.button : '',
    landingCopy: on ? defaults.copyLabel : '',
    landingDirect: on ? defaults.directLabel : '',
    landingCountdown: on ? defaults.countdown : EXIT_PAGE_DEFAULTS.countdown,
  };
}

export const EXIT_PAGE_CSS = String.raw`
.exit-page-shell,.exit-page-shell *{box-sizing:border-box}
.exit-page-shell{width:100%;min-height:100vh;min-height:100dvh;overflow-x:hidden;overflow-y:auto;display:grid;place-items:center;padding:calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom));background:#08090b;color:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;-webkit-font-smoothing:antialiased;text-align:center}
.exit-page-card{width:100%;max-width:370px;padding:38px 25px 32px;background:#121214;border:1px solid rgba(255,255,255,.09);border-radius:21px;box-shadow:0 18px 50px rgba(0,0,0,.24);display:flex;flex-direction:column;align-items:center}
.exit-age-icon{position:relative;width:43px;height:43px;border:3px solid #e94b50;border-radius:50%;display:grid;place-items:center;color:#f2f2f3;font-size:15px;font-weight:750;line-height:1;letter-spacing:-.4px}
.exit-age-icon::after{content:"";position:absolute;left:1px;right:1px;top:18px;height:3px;border-radius:3px;background:#e94b50;transform:rotate(-45deg);transform-origin:center;box-shadow:0 0 0 1px #121214}
.exit-page-title{margin:21px 0 0;color:#fff;font-size:21px;font-weight:700;line-height:1.25;letter-spacing:-.25px}
.exit-page-subtext{max-width:290px;margin:11px 0 0;color:#929298;font-size:15px;font-weight:400;line-height:1.48}
.exit-page-primary{width:100%;min-height:55px;margin-top:28px;padding:14px 18px;border:1px solid #f3f3f4;border-radius:15px;background:#f3f3f4;color:#111113;font:inherit;font-size:16px;font-weight:700;line-height:1.2;text-decoration:none;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .14s ease,border-color .14s ease,transform .1s ease}
@media (hover:hover) and (pointer:fine){.exit-page-primary:hover{background:#fff;border-color:#fff}}
.exit-page-primary:active{transform:scale(.985);background:#e7e7e9;border-color:#e7e7e9}
.exit-page-primary:focus-visible,.exit-page-copy:focus-visible,.exit-page-direct:focus-visible{outline:2px solid #fff;outline-offset:3px}
.exit-page-primary[aria-disabled="true"]{cursor:wait}
.exit-page-status{min-height:18px;margin:13px 0 0;color:#69696f;font-size:12.5px;line-height:1.4;font-variant-numeric:tabular-nums}
.exit-page-fallback{width:100%;margin-top:14px;display:grid;justify-items:center;gap:12px}
.exit-page-fallback[hidden]{display:none}
.exit-page-copy{width:100%;min-height:44px;padding:10px 15px;border:1px solid rgba(255,255,255,.11);border-radius:13px;background:transparent;color:#b7b7bc;font:inherit;font-size:13px;font-weight:650;cursor:pointer;-webkit-tap-highlight-color:transparent}
@media (hover:hover) and (pointer:fine){.exit-page-copy:hover{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.17)}}
.exit-page-copy:active{background:rgba(255,255,255,.055)}
.exit-page-direct{color:#77777d;font-size:12px;line-height:1.4;text-underline-offset:3px}
@media (max-width:390px){.exit-page-shell{padding-left:20px;padding-right:20px}.exit-page-card{padding:34px 22px 29px}}
@media (max-height:560px){.exit-page-shell{place-items:start center}.exit-page-card{margin:auto 0}}
@media (prefers-reduced-motion:reduce){.exit-page-primary{transition:none}}
`;
