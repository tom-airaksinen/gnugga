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
    openPattern("adj"); out.push("pattern: " + $("#p-title").textContent + " | " + $$("#p-body .card").length + " cards | ai=" + ($("#p-ai") ? $("#p-ai").dataset.q.slice(0, 60) : "SAKNAS"));
    for (const p of PATTERNS) { const ex = p.gen(chooseLemma(p), L); out.push("ai " + p.id + ": " + aiQuestion(ex)); }
    { const ex = PATTERNS[0].gen(chooseLemma(PATTERNS[0]), L);
      const q = aiQuestion(ex, wrongPhrase({ type: "boj", lastInput: "xyz", ex }));
      out.push("ai med felsvar: " + (q.includes('Jag svarade "xyz"') && q.includes("varför mitt svar blev fel") ? "OK" : "SAKNAS – " + q));
      const qr = aiQuestion(ex, wrongPhrase({ type: "rattfel", said: true, truth: false, shown: "fel-form", ex }));
      out.push("ai rätt-eller-fel: " + (qr.includes('Jag trodde att "fel-form" var rätt form') ? "OK" : "SAKNAS – " + qr));
      const qc = aiQuestion(ex, wrongPhrase({ type: "boj", lastInput: ex.answer, ex }));
      out.push("ai utan felsvar: " + (qc.includes("Jag svarade") ? "FEL – citerar rätt svar" : "OK")); }

    // skrivläge: klassen som lyfter fältet ovanför tangentbordet
    { const el = document.createElement("div"); document.body.appendChild(el);
      typingOn(el); const on = document.body.classList.contains("typing");
      typingOff(); await wait(250); const off = !document.body.classList.contains("typing");
      el.remove();
      out.push("skrivläge: på=" + on + " av=" + off); }

    // Böj hela verbet: sex kort i lådorna men EN rad i dagsstatistiken
    { const p = byId["v-pres"], lem = tablePool(p)[0], forms = p.paradigm.forms(lem);
      const fill = () => $$("#tbl-para input").forEach((inp, i) => { if (!inp.readOnly) inp.value = forms[i]; });
      openTable("v-pres", lem); const pre = $$("#tbl-para input[readonly]").length;
      fill(); checkTable();
      const d0 = (P.days[today()] || { n: 0 }).n, seen0 = P.pat["v-pres"].seen, due0 = dueCount();
      openTable("v-pres", lem); fill(); checkTable();
      const keys = Object.keys(P.items).filter((k) => k.startsWith("v-pres|" + p.key(lem) + "#"));
      const d1 = (P.days[today()] || { n: 0 }).n, seen1 = P.pat["v-pres"].seen, due1 = dueCount();
      out.push("tabell: stödhjul=" + pre + " kort=" + keys.length + " dagrader=+" + (d1 - d0) + " mönster-seen=+" + (seen1 - seen0) + " förfallna oförändrat=" + (due1 === due0));
      out.push("tabell: " + ($("#tbl-res .tres") ? $("#tbl-res .tres").textContent : "inget resultat") + " · lådor=" + keys.map((k) => P.items[k].box).join(","));
      const fel = $$("#tbl-para .prow.bad").length; out.push("tabell: felrader vid rätt svar=" + fel);
      openTable("v-pres", lem);
      const tin = $$("#tbl-para input").find((x) => !x.readOnly); tin.value = "test";
      $("#tbl-keys button").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      out.push("tabellens krumelurknapp: " + tin.value); }

    // krumelurknapparna: tecknet ska in i fältet utan att fokus tappas
    { const y = addDays(today(), -1);
      P.pat["n-def"] = { seen: 20, right: 20, fast: 5, intro: y, last: y, dayList: [y], hist: Array(20).fill(1) };
      startSession({ focus: "n-def" }); await wait(80);
      const inp = $("#inp"), key = $(".keys button");
      if (!inp || !key) out.push("krumelur: ingen boj-övning att testa på");
      else {
        inp.focus(); inp.value = "cas";
        const notPrev = key.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        out.push("krumelur: fält=" + inp.value + " fokus kvar=" + (document.activeElement === inp) + " default stoppad=" + !notPrev);
      }
      S = null; renderHome(); show("s-home"); }

    // gruppass: tre verb ur samma mönster + jämförelsen
    { const p = byId["v-pres"], list = groupList(p);
      out.push("grupper: " + list.map((x) => x.g.name + "=" + x.verbs.length).join(" · "));
      const gEz = list.find((x) => x.g.id === "a-ez").g;
      const q = groupPick(p, gEz);
      out.push("gruppass val: " + q.map((v) => v.inf).join(", ") + " · unika=" + (new Set(q.map((v) => v.inf)).size));
      const d0 = (P.days[today()] || { n: 0 }).n;
      for (let i = 0; i < q.length; i++) {
        openTable("v-pres", q[i], { g: gEz, queue: q, qi: i });
        const forms = p.paradigm.forms(q[i]);
        $$("#tbl-para input").forEach((inp, j) => { if (!inp.readOnly) inp.value = forms[j]; });
        checkTable();
      }
      const d1 = (P.days[today()] || { n: 0 }).n;
      out.push("gruppass: knapp=" + ($("#tbl-next") ? $("#tbl-next").textContent : "saknas") + " dagrader=+" + (d1 - d0));
      $("#tbl-next").click();
      out.push("jämförelse: celler=" + $$("#tbl-body .cmp .c").length + " markerade=" + $$("#tbl-body .cmp em").length + " rubrik=" + $("#tbl-title").textContent);
      const gOa = list.find((x) => x.g.id === "oa");
      out.push("oa-gruppen: " + (gOa ? gOa.verbs.slice(0, 3).map((v) => v.inf).join(", ") : "saknas")); }

    // grinden för nya mönster: förkunskaper + allt aktivt på Lärt + ett per dag
    { const backup = JSON.stringify(P); const y = addDays(today(), -1);
      const pat = (seen) => ({ seen, right: seen, fast: 0, intro: y, last: y, dayList: [y], hist: Array(Math.min(20, seen)).fill(1) });
      const only = (map) => { for (const p of PATTERNS) P.pat[p.id] = { seen: 0, right: 0, fast: 0, intro: null, last: null, dayList: [], hist: [] };
                              for (const k in map) P.pat[k] = pat(map[k]); };
      const ja = (b) => b ? "ja" : "NEJ (fel)"; const nej = (b) => b ? "FEL – öppen" : "ja";
      only({ "n-def": 12 });  out.push("grind: Övat blockerar = " + nej(canIntroduce()));
      only({ "n-def": 20 });  out.push("grind: Lärt öppnar = " + ja(canIntroduce()) + ", nästa=" + (nextNew() || {}).id);
      only({ "n-def": 20, "n-pl": 20, "n-pldef": 20, "v-pres": 20, "v-irr": 12 });
      out.push("grind: perfekt kräver oregelbundna = " + nej(canIntroduce()) + ", nästa=" + (nextNew() || {}).id);
      P.pat["v-irr"].paused = true;
      out.push("grind: paus kringgår inte förkunskap = " + nej(canIntroduce()));
      only({ "n-def": 20, "n-pl": 20, "n-pldef": 20, "v-pres": 20, "v-irr": 20 });
      out.push("grind: öppnar när allt sitter = " + ja(canIntroduce()));
      P.pat["n-def"].paused = true; P.pat["n-def"].seen = 5; P.pat["n-def"].hist = [];
      out.push("paus: pausat svagt mönster blockerar inte = " + ja(canIntroduce()));
      P = JSON.parse(backup); }
    openSettings(); out.push("settings: " + $$("#modal .set-row").length + " rows"); closeModal();
    renderHelp(); out.push("help: " + $$("#help-body details").length + " sections, om-rader=" + $$("#help-body .set-row").length);
    renderStats(); out.push("stats: kpi=" + $$("#stats-body .kpi").length + " heat=" + $$("#stats-body .heat .d").length + " weak=" + $$("#stats-body .wl span").length + " err=" + $$("#stats-body .flist div").length + " | " + $("#stats-body .st-hero .cap").textContent);
    statsPeriod = "week"; renderStats(); out.push("stats week: " + $$("#stats-body .kpi b").map(x=>x.textContent).join(" / "));
    const wb = $("#st-weak"); if (wb) { wb.click(); await play("pass3-plock"); $("#done-home").click(); } else out.push("pass3-plock: inga svaga ord");
    const dx = (i, ex) => (diagnose(i, ex) || "PATTERN-HINT").replace(/<[^>]+>/g, "");
    const exN = { answer: "mâna", hint: "H", forms: { "mână": "grundformen", "mâna": "bestämd singular", "mâini": "obestämd plural" }, target: "bestämd singular", stemHint: "STEM" };
    out.push("diag dia: " + dx("mana", exN)); out.push("diag form: " + dx("mâini", exN)); out.push("diag typo: " + dx("mânz", exN)); out.push("diag ending: " + dx("mânăul", exN));
    const exV = { answer: "mergem", hint: "H", forms: { "merg": "presens för eu", "mergem": "presens för noi" }, target: "presens för noi", stemHint: "STEM" };
    out.push("diag stem: " + dx("margem", exV)); out.push("diag other: " + dx("merg", exV)); out.push("diag none: " + dx("xyz", exV));
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
