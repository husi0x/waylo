/**
 * Waylo — smart exit page (in-app browser escape).
 * Served with HTTP 200 from /r/:slug when the visitor is inside an in-app
 * browser (Instagram, TikTok, Facebook, X, …) and the link has the exit
 * page enabled. Hands the visitor off to the device's real browser or into
 * a native app via a custom URL scheme.
 *
 * Scheme matrix (verified against production smart-link implementations):
 *   iOS  Instagram/Threads : instagram://extbrowser/?url=<page> (IG opens Safari)
 *   iOS  Facebook/Messenger: x-safari-https://<page> (Apple private scheme)
 *   iOS  TikTok/X/LinkedIn/Snap/Pinterest/Reddit : button-only (gesture required)
 *   Android (all apps)     : intent://<page>#Intent;scheme=https;S.browser_fallback_url=...;end
 */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

export function renderLanding(cfg) {
  const {
    auto = true,
    countdown = 2,
    primary = "",
    destination = "",
    fallback = "",
    heading = "Opening in your browser…",
    subtext = "You are being redirected outside this app for the best experience.",
    button = "Continue",
    copyLabel = "Copy link",
    directLabel = "Continue in browser",
    initials = "W",
  } = cfg;

  const safe = {
    heading: esc(heading),
    subtext: esc(subtext),
    button: esc(button),
    copyLabel: esc(copyLabel),
    directLabel: esc(directLabel),
    initials: esc(initials.slice(0, 2).toUpperCase()),
    primary: esc(primary),
    fallback: esc(fallback),
    destination: esc(destination),
  };

  const json = JSON.stringify({ auto, countdown, primary, destination, fallback }).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>${safe.heading}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;
    background:radial-gradient(1200px 800px at 50% -10%,#1c1b33 0%,#0e0e15 55%,#0a0a10 100%);
    color:#fff;display:flex;align-items:center;justify-content:center;
    min-height:100vh;min-height:100dvh;padding:24px 18px;
    -webkit-font-smoothing:antialiased;text-align:center;
  }
  .wrap{width:min(100%,360px);display:flex;flex-direction:column;align-items:center;gap:22px}
  .card{
    width:100%;background:#16161f;border:1px solid #262635;border-radius:22px;
    padding:30px 24px 24px;display:flex;flex-direction:column;align-items:center;gap:14px;
    box-shadow:0 24px 70px rgba(0,0,0,.45);
  }
  .avatar{
    width:56px;height:56px;border-radius:18px;font-size:19px;font-weight:800;
    background:linear-gradient(135deg,#7258ff,#9b7bff);color:#fff;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 24px rgba(114,88,255,.35);
  }
  .ring{position:relative;width:64px;height:64px;margin:2px 0}
  .ring svg{width:64px;height:64px;transform:rotate(-90deg)}
  .ring .bg{stroke:#23232f;stroke-width:5;fill:none}
  .ring .fg{stroke:url(#grad);stroke-width:5;fill:none;stroke-linecap:round;stroke-dasharray:151;stroke-dashoffset:0;transition:stroke-dashoffset .9s linear}
  .ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800;color:#c8bfff}
  .spinner{width:34px;height:34px;border:3px solid #23232f;border-top-color:#8b6dff;border-radius:50%;animation:spin .9s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  h1{font-size:19px;font-weight:700;letter-spacing:-.2px}
  .sub{font-size:13px;line-height:1.55;color:#9a9aab;max-width:290px}
  .cta{
    display:flex;align-items:center;justify-content:center;gap:9px;width:100%;
    padding:16px 18px;border-radius:14px;background:linear-gradient(135deg,#7258ff,#8a6cff);
    color:#fff;text-decoration:none;font-size:15px;font-weight:700;border:none;cursor:pointer;
    box-shadow:0 10px 30px rgba(114,88,255,.35);transition:transform .12s ease,box-shadow .12s ease;
    -webkit-tap-highlight-color:transparent;
  }
  .cta:active{transform:scale(.98)}
  .cta svg{width:17px;height:17px;flex-shrink:0}
  .row{display:flex;gap:9px;width:100%}
  .ghost{
    flex:1;background:transparent;border:1px solid #2c2c3c;color:#b9b9c8;
    border-radius:12px;padding:12px;font-size:12px;font-weight:600;cursor:pointer;
    -webkit-tap-highlight-color:transparent;transition:background .15s ease;
  }
  .ghost:active{background:#1c1c27}
  .direct{font-size:11.5px;color:#6f6f80;text-decoration:none;border-bottom:1px dashed #3a3a4a;padding-bottom:2px}
  .foot{font-size:10.5px;color:#4c4c5c;letter-spacing:.03em}
  .toast{
    position:fixed;left:50%;bottom:34px;transform:translate(-50%,12px);
    background:#2b2b3a;color:#e6e6f0;border:1px solid #3c3c50;border-radius:10px;
    padding:10px 18px;font-size:12.5px;opacity:0;pointer-events:none;transition:all .25s ease;
    box-shadow:0 10px 30px rgba(0,0,0,.4);
  }
  .toast.show{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="avatar">${safe.initials}</div>
      <div id="timer" class="ring" style="display:none">
        <svg viewBox="0 0 64 64">
          <defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7258ff"/><stop offset="1" stop-color="#a88bff"/></linearGradient></defs>
          <circle class="bg" cx="32" cy="32" r="24"/>
          <circle class="fg" id="bar" cx="32" cy="32" r="24"/>
        </svg>
        <b id="num">${countdown}</b>
      </div>
      <div id="spin" class="spinner" style="display:none"></div>
      <h1>${safe.heading}</h1>
      <p class="sub">${safe.subtext}</p>
      <a class="cta" id="cta" href="${safe.primary}">
        ${safe.button}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
      <div class="row">
        <button class="ghost" id="copy">${safe.copyLabel}</button>
      </div>
      <a class="direct" id="direct" href="${safe.fallback}">${safe.directLabel}</a>
    </div>
    <p class="foot">Powered by Waylo</p>
  </div>
  <div class="toast" id="toast"></div>
  <script>
  (function(){
    var cfg = ${json};
    var LEFT = Math.max(0, Math.floor(cfg.countdown) || 0);
    var BAR = 151; // 2*pi*24
    function fire(){
      try { window.location.href = cfg.primary; } catch(e){}
      setTimeout(function(){
        try { window.location.href = cfg.fallback; } catch(e){}
      }, 2600);
    }
    var num = document.getElementById("num");
    var bar = document.getElementById("bar");
    var timer = document.getElementById("timer");
    var spin = document.getElementById("spin");
    if (cfg.auto) {
      if (LEFT > 0) {
        timer.style.display = "flex";
        var t0 = Date.now(), total = LEFT * 1000;
        (function tick(){
          var remain = Math.max(0, Math.ceil((total - (Date.now() - t0)) / 1000));
          num.textContent = remain;
          bar.style.strokeDashoffset = BAR * (1 - (total - (Date.now() - t0)) / total);
          if (remain <= 0) { timer.style.display = "none"; spin.style.display = "block"; fire(); return; }
          setTimeout(tick, 200);
        })();
      } else {
        spin.style.display = "block";
        fire();
      }
    }
    var toast = document.getElementById("toast");
    function showToast(msg){
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function(){ toast.classList.remove("show"); }, 2200);
    }
    function manualCopy(){
      var ta = document.createElement("textarea");
      ta.value = cfg.destination;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta);
      showToast("Link copied");
    }
    document.getElementById("copy").addEventListener("click", function(){
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cfg.destination).then(
          function(){ showToast("Link copied"); },
          manualCopy
        );
      } else manualCopy();
    });
  })();
  </script>
  <noscript><meta http-equiv="refresh" content="0;url=${safe.fallback}"></noscript>
</body>
</html>`;
}
