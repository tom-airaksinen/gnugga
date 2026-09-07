#!/bin/bash
# Rökprov: kör appen i headless Chrome mot en lokal server, spelar igenom pass automatiskt
# och rapporterar JS-fel. Kör: bash scripts/smoke.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8766
cd "$ROOT"
python3 -m http.server $PORT --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; rm -f "$ROOT/smoke.html"' EXIT
sleep 0.7

python3 - "$ROOT" <<'EOF'
import sys
root = sys.argv[1]
s = open(f"{root}/index.html", encoding="utf-8").read()
hook = '''<script>
window.__errs=[];window.addEventListener("error",e=>__errs.push((e.message||"")+" @ "+(e.filename||"").split("/").pop()+":"+e.lineno));
window.addEventListener("unhandledrejection",e=>__errs.push("rej: "+String(e.reason&&e.reason.stack||e.reason).slice(0,200)));
</script>'''
test = '''<script>
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const out = [];
  const play = async (label) => {
    let guard = 0, wrongEvery = 3;
    while (activeScreen === "s-session" && guard++ < 400) {
      await wait(5);
      if ($("#intro-go")) { $("#intro-go").click(); continue; }
      if ($("#fb-next")) { $("#fb-next").click(); continue; }
      if ($("#fb-giveup")) { $("#fb-giveup").click(); continue; }
      const c = S && S.cur; if (!c) continue;
      if (c.type === "valj") { const b = $$(".opt").find(o => !o.disabled); if (b) b.click(); }
      else if (c.type === "boj") { const inp = $("#inp"); if (inp && !$("#fb").classList.contains("show")) { inp.value = (guard % wrongEvery === 0) ? "xx" : c.ex.answer; $("#check").click(); } }
      else if (c.type === "sag") { if ($("#reveal")) $("#reveal").click(); else if ($("#sg-y")) $("#sg-y").click(); }
      else if (c.type === "rattfel") { const b = $("#tf-y"); if (b && !b.disabled) b.click(); }
    }
    out.push(`${label}: screen=${activeScreen} guard=${guard} done="${$("#done-body").textContent.replace(/\\s+/g," ").slice(0,80)}"`);
  };
  try {
    while (!L) await wait(20);
    // generatorer: alla mönster × 150
    let genErr = 0, few = 0;
    for (const p of PATTERNS) for (let i = 0; i < 150; i++) { try { const ex = p.gen(chooseLemma(p), L); if (!ex.answer || !ex.hint || !ex.why || !ex.say) genErr++; if (ex.distractors.length < 3) few++; if (ex.distractors.includes(ex.answer)) genErr++; } catch (e) { genErr++; __errs.push("gen " + p.id + ": " + e.message); } }
    out.push(`gen: errors=${genErr} fewDistractors=${few}`);
    // pass 1: nytt mönster, fokus
    startSession({ focus: "n-def" }); await play("pass1-fokus-nytt");
    $("#done-home").click();
    // pass 2: alla mönster aktiva → blandat med alla typer
    for (const p of PATTERNS) { P.pat[p.id].intro = "2026-09-01"; P.pat[p.id].seen = 20; P.pat[p.id].right = 16; P.pat[p.id].fast = 5; }
    save(); renderHome();
    out.push("home: " + $("#today h2").textContent + " | rows=" + $$(".row").length + " | lvl=" + $$(".lvl").map(x=>x.textContent).join(","));
    startSession({}); await play("pass2-blandat");
    $("#done-home").click();
    openPattern("adj"); out.push("pattern: " + $("#p-title").textContent + " | " + $$("#p-body .card").length + " cards");
    openSettings(); out.push("settings: " + $$("#modal .set-row").length + " rows"); closeModal();
    openHelp(); out.push("help: " + $$("#modal details").length + " sections"); closeModal();
    SET.passLen = 8; save(); SET.passLen = 99; loadProgress(); out.push("settings-persist: passLen=" + SET.passLen + " (förväntat 8)");
    out.push("items=" + Object.keys(P.items).length + " days=" + JSON.stringify(P.days));
  } catch (e) { __errs.push("test: " + (e.stack || e.message)); }
  document.documentElement.setAttribute("data-test", out.join("\\n"));
  document.documentElement.setAttribute("data-errs", __errs.join("\\n") || "none");
})();
</script>'''
s = s.replace('<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="style.css" />' + hook)
s = s.replace('<script src="app.js"></script>', '<script src="app.js"></script>' + test)
open(f"{root}/smoke.html", "w", encoding="utf-8").write(s)
EOF

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --no-first-run --virtual-time-budget=30000 --dump-dom "http://127.0.0.1:$PORT/smoke.html" 2>/dev/null > /tmp/gnugga-smoke.html
python3 - <<'EOF'
import re, html
h = open("/tmp/gnugga-smoke.html", encoding="utf-8").read()
t = re.search(r'data-test="([^"]*)"', h); e = re.search(r'data-errs="([^"]*)"', h)
print("== TEST =="); print(html.unescape(t.group(1)) if t else "(inget resultat – boot hann inte klart?)")
print("== JS-FEL =="); print(html.unescape(e.group(1)) if e else "(okänt)")
EOF
