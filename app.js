"use strict";
/* Gnugga – grammatikdrill. Språkoberoende motor; allt språkspecifikt bor i data/<lang>/monster.js
   (regler, generatorer) och data/<lang>/lexikon.json (böjningsformer från Wiktionary).

   Pedagogiken (se docs/plan.md):
   - kort regel → övning (≈10/90), regeln alltid ett tryck bort under passet
   - produktion före igenkänning: Välj bara i intro, sedan Böj/Säg det
   - interleaving: blockat bara första repen av nytt mönster, sedan blandas allt aktivt
   - feedback i två steg: ledtråd utan facit → nytt försök → facit + varför
   - SRS: Leitner-lådor per (mönster × lemma), som Flippa; mönsternivå Nytt→Lärt→Övat→Automatiskt */

const APP_VERSION = "v1";
const LANG = window.GNUGGA_LANG;
const PATTERNS = LANG.patterns.slice().sort((a, b) => a.order - b.order);
const byId = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
const KEY = `gnugga-${LANG.code}-progress`;
const SETTINGS_KEY = "gnugga-settings";
const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // dagar per Leitner-låda 0..6 (0 = idag igen)

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => (s || "").trim().toLowerCase().replace(/ş/g, "ș").replace(/ţ/g, "ț").replace(/\s+/g, " ");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const plain = (html) => String(html).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
function track() { /* GoatCounter läggs till när appen delas – se docs/oppna-fragor.md */ }

/* ============================================================
   Lagring
   ============================================================ */
let L = null;      // lexikon
let P = null;      // progress
let SET = { passLen: 20, tts: true, name: "" };

function loadProgress() {
  try { P = JSON.parse(localStorage.getItem(KEY)) || null; } catch (_) { P = null; }
  if (!P || !P.pat) P = { pat: {}, items: {}, days: {}, v: 1 };
  for (const p of PATTERNS) P.pat[p.id] = P.pat[p.id] || { seen: 0, right: 0, fast: 0, intro: null, last: null };
  try { SET = Object.assign(SET, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}); } catch (_) {}
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(P)); localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); }
  catch (e) { toast("Kunde inte spara – lagringen är full?"); }
}

/* Mönsternivå. Automatiskt = hög korrekthet OCH snabbhet (Ellis 2005: tidspress mäter automatisering). */
function level(id) {
  const s = P.pat[id];
  if (!s.seen) return { n: 0, t: "Nytt" };
  const acc = s.right / s.seen;
  if (s.seen >= 40 && s.fast >= 15 && acc >= .85) return { n: 3, t: "Automatiskt" };
  if (s.seen >= 15 && acc >= .7) return { n: 2, t: "Övat" };
  return { n: 1, t: "Lärt" };
}
function pct(id) {
  const s = P.pat[id];
  if (!s.seen) return 0;
  const acc = s.right / s.seen;
  return Math.min(100, Math.round(20 + Math.min(1, s.seen / 40) * 50 * acc + Math.min(1, s.fast / 15) * 30));
}
const active = () => PATTERNS.filter((p) => P.pat[p.id].seen > 0 || P.pat[p.id].intro);
const nextNew = () => PATTERNS.find((p) => !P.pat[p.id].intro);
const itemKey = (pid, key) => `${pid}|${key}`;

/* Val av lemma för ett mönster: förfallna svaga först, sedan osedda i frekvensordning
   (poolen växer med antalet sedda – de vanligaste orden först), sist allt annat. */
function chooseLemma(p) {
  const pool = p.pool(L);
  const t = today();
  const seenKeys = new Set();
  const due = [], fresh = [], rest = [];
  for (const x of pool) {
    const k = itemKey(p.id, p.key(x));
    const it = P.items[k];
    if (it) { seenKeys.add(k); if (it.due <= t) due.push({ x, w: 1 + (6 - Math.min(6, it.box)) }); else rest.push(x); }
    else fresh.push(x);
  }
  const activeFresh = fresh.slice(0, 20 + Math.floor(seenKeys.size * 0.5));
  const r = Math.random();
  if (due.length && r < .6) { // viktat mot svaga lådor
    const tot = due.reduce((s, d) => s + d.w, 0); let a = Math.random() * tot;
    for (const d of due) { a -= d.w; if (a <= 0) return d.x; }
    return due[0].x;
  }
  if (activeFresh.length && r < .9) return pick(activeFresh);
  if (due.length) return pick(due).x;
  if (activeFresh.length) return pick(activeFresh);
  return pick(rest.length ? rest : pool);
}
function dueCount() {
  const t = today(); let n = 0;
  for (const k in P.items) if (P.items[k].due <= t) n++;
  return n;
}

/* ============================================================
   Skärmar & hjälp
   ============================================================ */
let activeScreen = "s-home";
function show(id) { $$(".screen").forEach((s) => s.classList.toggle("on", s.id === id)); activeScreen = id; window.scrollTo(0, 0); maybeReloadForUpdate(); }
$$("[data-go]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.go === "s-home") renderHome(); show(b.dataset.go); }));

let toastT = null;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 2600); }

/* ---- Uppläsning: bara om enheten har en röst för språket (annars döljs 🔊) ---- */
let voiceOk = false;
function findVoice() {
  if (!("speechSynthesis" in window)) return null;
  const vs = speechSynthesis.getVoices();
  const want = LANG.tts.toLowerCase();
  return vs.find((v) => v.lang.replace("_", "-").toLowerCase() === want) ||
         vs.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(want.slice(0, 2))) || null;
}
function updateVoice() {
  const vs = ("speechSynthesis" in window) ? speechSynthesis.getVoices() : [];
  voiceOk = vs.length ? !!findVoice() : ("speechSynthesis" in window); // tom lista = inte laddad än → visa tills vidare
  document.body.classList.toggle("no-tts", !voiceOk || !SET.tts);
}
function speak(text) {
  if (!SET.tts || !("speechSynthesis" in window)) return;
  const v = findVoice();
  if (!v) { updateVoice(); return; } // ingen rumänsk röst → läs inte upp med fel röst
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\/.*$/, ""));
    u.lang = LANG.tts; u.voice = v; u.rate = .9;
    speechSynthesis.speak(u);
  } catch (_) {}
}
if ("speechSynthesis" in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = updateVoice; }
function bindSpeak(root) { $$(".spk", root).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); speak(b.dataset.say); })); }

const lvlHtml = (id) => { const l = level(id); return `<span class="lvl l${l.n}">${l.t}</span>`; };
const gloss = (x) => x.sv || x.en || "";

/* ---- Hem ---- */
function renderHome() {
  const act = active(); const nn = nextNew(); const due = dueCount();
  const passLen = SET.passLen;
  let h, facts;
  if (!act.length) {
    h = `Börja med ${nn.name.toLowerCase()}`;
    facts = `<div class="fact"><b>${passLen}</b><span>övningar</span></div><div class="fact"><b>1</b><span>nytt mönster</span></div>`;
  } else {
    h = nn && canIntroduce() ? `Repetition + nytt mönster: ${nn.name}` : due ? "Blandad repetition" : "Blandad gnuggning";
    facts = `<div class="fact"><b>${passLen}</b><span>övningar</span></div><div class="fact"><b>${act.length}</b><span>mönster att blanda</span></div>` +
      (due ? `<div class="fact"><b>${due}</b><span>förfallna</span></div>` : "") +
      (nn && canIntroduce() ? `<div class="fact"><b>1</b><span>nytt mönster</span></div>` : "");
  }
  $("#today").innerHTML = `<div class="eyebrow">Dagens gnugg</div><h2>${h}</h2><div class="facts">${facts}</div>
    <button class="cta" id="start-today">Gnugga nu · ca ${Math.round(passLen / 4)} min</button>
    <div class="small muted">${act.length > 1 ? "Blandat pass: mönstren växlar, så du måste välja regel varje gång. Det känns lite jobbigare än ett mönster i taget – och det är då det fastnar." : "Första passen kör ett mönster i taget. När du kan grunden börjar appen blanda."}</div>`;
  $("#start-today").addEventListener("click", () => startSession({}));

  // Veckoprickar
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(today(), -i));
  const names = ["S", "M", "T", "O", "T", "F", "L"];
  const n7 = days.filter((d) => P.days[d]).length;
  $("#week").innerHTML = `<div class="dots">${days.map((d) => `<span class="dot ${P.days[d] ? "on" : ""} ${d === today() ? "today" : ""}">${names[new Date(d + "T12:00:00").getDay()]}</span>`).join("")}</div><span>${n7 ? `${n7} av 7 dagar` : "Inga pass den här veckan än"}</span>`;

  const groups = {}; for (const p of PATTERNS) (groups[p.area] ||= []).push(p);
  $("#pattern-groups").innerHTML = Object.entries(groups).map(([area, ps]) => `<div class="group"><div class="eyebrow">${area}</div>` +
    ps.map((p) => `<button class="row" data-p="${p.id}"><div class="body"><div class="name">${p.name}</div><div class="bar"><i style="width:${pct(p.id)}%"></i></div></div>${nn && nn.id === p.id ? `<span class="lvl due">Nästa</span>` : lvlHtml(p.id)}<span class="chev">›</span></button>`).join("") + `</div>`).join("");
  $$(".row[data-p]").forEach((b) => b.addEventListener("click", () => openPattern(b.dataset.p)));
  $("#lang-chip").textContent = `${LANG.flag} ${LANG.name}`;
  $("#version-tag").textContent = `Gnugga ${APP_VERSION} · böjningsdata från Wiktionary (CC BY-SA)`;
}
/* Nytt mönster introduceras när inget introducerats idag och de aktiva har åtminstone lite på fötterna */
function canIntroduce() {
  const nn = nextNew(); if (!nn) return false;
  const act = active(); if (!act.length) return true;
  const introToday = act.some((p) => P.pat[p.id].intro === today());
  if (introToday) return false;
  const weakest = Math.min(...act.map((p) => P.pat[p.id].seen));
  return weakest >= 10;
}

/* ---- Mönsterskärm ---- */
function ruleCard(p) {
  return `<div class="card rule"><h3>Regeln</h3><p>${p.rule}</p></div>
    <div class="card"><h3>Exempel</h3><div class="ex">${p.examples.map(([f, t, sv]) => `<div class="exrow"><span class="from">${esc(f)}</span><span class="arrow">→</span><span class="to">${esc(t)}</span><span class="sv">${esc(sv)}</span><button class="spk" data-say="${esc(t)}" title="Lyssna">🔊</button></div>`).join("")}</div></div>
    <div class="card"><details><summary>Fördjupning</summary><div class="more">${p.more}</div></details></div>`;
}
function openPattern(id) {
  const p = byId[id]; const s = P.pat[id];
  $("#p-title").textContent = p.name;
  const lv = $("#p-lvl"); const l = level(id); lv.className = `lvl l${l.n}`; lv.textContent = l.t;
  // ordlista: svaga/starka lemman i mönstret
  const items = Object.entries(P.items).filter(([k]) => k.startsWith(id + "|")).map(([k, v]) => ({ key: k.split("|")[1], ...v }));
  const weak = items.filter((i) => i.box <= 1).slice(0, 12), strong = items.filter((i) => i.box >= 4).slice(0, 12);
  $("#p-body").innerHTML = ruleCard(p) +
    (s.seen ? `<div class="card"><h3>Din nivå</h3><div class="small muted">${s.seen} övningar · ${Math.round(100 * s.right / s.seen)} % rätt · ${s.fast} rätt på tid · ${items.length} ord gnuggade</div><div class="bar" style="height:8px"><i style="width:${pct(id)}%"></i></div><div class="small muted">Automatiskt = minst 40 övningar, 85 % rätt och 15 rätt på tid.</div>
      ${weak.length ? `<div class="small muted" style="margin-top:6px">Svagast just nu</div><div class="wordlist">${weak.map((i) => `<span class="weak">${esc(i.key)}</span>`).join("")}</div>` : ""}
      ${strong.length ? `<div class="small muted" style="margin-top:6px">Sitter bra</div><div class="wordlist">${strong.map((i) => `<span class="strong">${esc(i.key)}</span>`).join("")}</div>` : ""}</div>` : "") +
    `<button class="cta" id="p-only">${s.intro ? "Gnugga bara det här mönstret" : "Börja med det här mönstret"} · ${Math.min(SET.passLen, 12)} övningar</button>
    ${active().length > 1 ? `<button class="cta sec" id="p-mixed">Blandat pass med alla aktiva</button>` : ""}
    <div class="note">${s.intro ? "Blandat pass är bäst när du kan grunden. \"Bara det här\" passar när ett mönster känns nytt eller skakigt." : "Första gången: läs regeln, sedan kör du övningar på bara det här mönstret."}</div>`;
  $("#p-only").addEventListener("click", () => startSession({ focus: id }));
  const m = $("#p-mixed"); if (m) m.addEventListener("click", () => startSession({}));
  bindSpeak($("#p-body"));
  show("s-pattern");
}

/* ============================================================
   Pass
   ============================================================ */
let S = null, timer = null;
function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

/* Passplan: lista av {pid,type} eller {intro:pid}.
   Typer: valj (igenkänning, bara intro), boj (skriv), sag (muntligt), rattfel (tidspressat) */
function planSession({ focus }) {
  const items = []; const add = (pid, type) => items.push({ pid, type });
  const n = SET.passLen;
  if (focus) {
    const isNew = !P.pat[focus].intro;
    const cnt = Math.min(n, 12);
    if (isNew) items.push({ intro: focus });
    for (let i = 0; i < cnt; i++) {
      let t = "boj";
      if (isNew && i < 3) t = "valj";
      else if (i % 5 === 4) t = "sag";
      else if (!isNew && i % 6 === 3 && level(focus).n >= 2) t = "rattfel";
      add(focus, t);
    }
    return items;
  }
  const act = active(); const nn = canIntroduce() ? nextNew() : null;
  if (!act.length && nn) { // allra första passet
    items.push({ intro: nn.id });
    for (let i = 0; i < Math.min(n, 12); i++) add(nn.id, i < 3 ? "valj" : i % 5 === 4 ? "sag" : "boj");
    return items;
  }
  const introBlock = nn ? 7 : 0;             // regel + 2 välj + 5 böj blockade
  const warm = Math.min(5, Math.max(0, Math.round((n - introBlock) * .3)));
  const mix = Math.max(0, n - introBlock - warm);
  // 1) uppvärmning: blandad repetition, svagast mönster viktade
  const weighted = act.map((p) => ({ p, w: 1 + (3 - Math.min(3, level(p.id).n)) }));
  const wpick = () => { const tot = weighted.reduce((s, x) => s + x.w, 0); let a = Math.random() * tot; for (const x of weighted) { a -= x.w; if (a <= 0) return x.p; } return weighted[0].p; };
  for (let i = 0; i < warm; i++) { const p = wpick(); add(p.id, i === warm - 1 && level(p.id).n >= 2 ? "rattfel" : "boj"); }
  // 2) nytt mönster
  if (nn) { items.push({ intro: nn.id }); add(nn.id, "valj"); add(nn.id, "valj"); for (let i = 0; i < 4; i++) add(nn.id, "boj"); }
  // 3) blandning av allt aktivt (+ det nya), aldrig samma mönster tre gånger i rad
  const pool = act.concat(nn ? [nn] : []);
  let last = null, run = 0;
  for (let i = 0; i < mix; i++) {
    let p = pool.length > 1 ? wpick() : pool[0];
    if (nn && Math.random() < .35) p = nn;
    if (p === last) { run++; if (run >= 2 && pool.length > 1) { p = pick(pool.filter((x) => x !== last)); run = 0; } } else run = 0;
    last = p;
    const lv = level(p.id).n;
    const t = i % 5 === 2 ? "sag" : (i % 6 === 4 && lv >= 2) ? "rattfel" : "boj";
    add(p.id, t);
  }
  return items;
}
function startSession(opts) {
  S = { items: planSession(opts), i: -1, right: 0, total: 0, before: {}, log: [], focus: opts.focus || null };
  for (const p of PATTERNS) S.before[p.id] = pct(p.id);
  track("pass-start");
  show("s-session"); next();
}
$("#quit").addEventListener("click", () => { clearTimer(); hideFb(); if (S && S.total > 0) finish(); else { S = null; renderHome(); show("s-home"); } });

function next() {
  hideFb(); clearTimer();
  S.i++;
  if (S.i >= S.items.length) return finish();
  const it = S.items[S.i];
  const n = S.items.filter((x) => !x.intro).length; const done = S.items.slice(0, S.i).filter((x) => !x.intro).length;
  $("#prog-i").style.width = (100 * done / n) + "%"; $("#counter").textContent = `${done}/${n}`;
  if (it.intro) return renderIntro(byId[it.intro]);
  const p = byId[it.pid];
  const lemma = chooseLemma(p);
  const ex = p.gen(lemma, L);
  ex.key = p.key(lemma);
  S.cur = { p, ex, type: it.type, attempts: 0, t0: performance.now() };
  const TYPE = { valj: "Välj", boj: "Böj", sag: "Säg det", rattfel: "Rätt eller fel?" };
  $("#tags").innerHTML = `<span class="tag">${p.short}</span><span class="tag type ${it.type === "sag" ? "say" : ""}">${TYPE[it.type]}</span>${it.type === "rattfel" ? `<span class="tag">på tid</span>` : ""}<button class="tag rulebtn" id="rule-peek">Regeln</button>`;
  $("#rule-peek").addEventListener("click", () => openModal(`<div class="mh"><h2>${p.name}</h2><button class="ib" id="m-close">✕</button></div>${ruleCard(p)}`));
  ({ valj: renderValj, boj: renderBoj, sag: renderSag, rattfel: renderRattfel })[it.type](p, ex);
}
function renderIntro(p) {
  $("#tags").innerHTML = `<span class="tag type">Nytt mönster</span>`;
  const st = $("#stage"); st.className = "intro";
  st.innerHTML = `<div class="eyebrow">${p.area}</div><div class="big-t">${p.name}</div>${ruleCard(p)}
    <div class="note">Läs en gång – max en halv minut. Resten lär du dig genom att göra. Regeln finns alltid ett tryck bort under passet.</div>
    <button class="cta" id="intro-go">Kör</button>`;
  P.pat[p.id].intro = today(); save();
  bindSpeak(st);
  $("#intro-go").addEventListener("click", next);
}
const taskHtml = (ex) => `<div class="task"><div class="q">${ex.q}</div><div class="big">${ex.big}</div>${ex.sub ? `<div class="sub">${esc(ex.sub)}</div>` : ""}${ex.gloss ? `<div class="gloss">${esc(ex.gloss)}</div>` : ""}</div>`;

function renderValj(p, ex) {
  const st = $("#stage"); st.className = "stage";
  const opts = shuffle([ex.answer, ...ex.distractors].slice(0, 4));
  st.innerHTML = taskHtml(ex) + `<div class="answer"><div class="opts">${opts.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>`;
  $$(".opt").forEach((b) => b.addEventListener("click", () => {
    const ok = b.dataset.v === ex.answer;
    $$(".opt").forEach((o) => { o.disabled = true; if (o.dataset.v === ex.answer) o.classList.add("ok"); else if (o === b) o.classList.add("bad"); else o.classList.add("dim"); });
    grade(ok, { final: true });
  }));
}
function renderBoj(p, ex) {
  const st = $("#stage"); st.className = "stage";
  st.innerHTML = taskHtml(ex) + `<div class="answer"><input class="inp" id="inp" type="text" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="skriv formen" />
    <div class="keys">${LANG.keys.map((c) => `<button type="button" data-c="${c}">${c}</button>`).join("")}</div>
    <button class="cta" id="check">Kolla</button></div>`;
  const inp = $("#inp");
  $$(".keys button").forEach((b) => b.addEventListener("click", () => { const s = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, s) + b.dataset.c + inp.value.slice(s); inp.focus(); inp.setSelectionRange(s + 1, s + 1); }));
  const check = () => {
    const v = norm(inp.value); if (!v) { inp.focus(); return; }
    const accepted = [ex.answer, ...(ex.alts || []), ...(ex.acceptFull && ex.full ? [ex.full] : [])].map(norm);
    const ok = accepted.includes(v);
    inp.classList.remove("ok", "bad"); inp.classList.add(ok ? "ok" : "bad");
    grade(ok, { final: ok || S.cur.attempts >= 1 });
  };
  $("#check").addEventListener("click", check);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); check(); } });
  setTimeout(() => inp.focus(), 60);
}
function renderSag(p, ex) {
  const st = $("#stage"); st.className = "stage";
  st.innerHTML = `<div class="task"><div class="q">Säg det högt på ${LANG.name.toLowerCase()}</div><div class="big">${esc(ex.say.sv)}</div><div class="sub">${esc(plain(ex.big))} · ${esc(ex.sub || "")}</div></div>
    <div class="answer"><button class="cta sec" id="reveal">Visa svaret</button></div>`;
  $("#reveal").addEventListener("click", () => {
    $(".answer").innerHTML = `<div class="reveal">${esc(ex.say.ro)} <button class="spk" data-say="${esc(ex.say.ro)}">🔊</button></div>
      <div class="note">Sa du så? Var ärlig – det är bara du som ser.</div>
      <div class="selfgrade"><button class="y" id="sg-y">Ja, rätt</button><button class="n" id="sg-n">Nej / osäker</button></div>`;
    speak(ex.say.ro); bindSpeak($(".answer"));
    $("#sg-y").addEventListener("click", () => grade(true, { final: true, silent: true }));
    $("#sg-n").addEventListener("click", () => grade(false, { final: true }));
  });
}
function renderRattfel(p, ex) {
  const st = $("#stage"); st.className = "stage";
  const truth = Math.random() < .5;
  const full = ex.full || ex.answer;
  const shown = truth ? full : (ex.full ? ex.full.replace(ex.answer, pick(ex.distractors)) : pick(ex.distractors));
  S.cur.truth = truth; S.cur.shown = shown;
  const ctx = ex.q.replace(/ av$/, "").replace("Sätt adjektivet i rätt form", "Adjektivform");
  st.innerHTML = `<div class="task"><div class="q">${esc(ctx)} · ${esc(plain(ex.big))} · ${esc((ex.sub || "").split("·")[0])}</div><div class="big">${esc(shown)}</div><div class="gloss">Stämmer det?</div></div>
    <div class="answer"><div class="timer run"><i></i></div><div class="tf"><button id="tf-y">✓ Rätt</button><button id="tf-n">✗ Fel</button></div></div>`;
  const answer = (said) => {
    clearTimer(); const ok = said === truth;
    $("#tf-y").disabled = $("#tf-n").disabled = true;
    $(truth ? "#tf-y" : "#tf-n").classList.add("ok"); if (!ok && said !== null) $(said ? "#tf-y" : "#tf-n").classList.add("bad");
    grade(ok, { final: true, timeout: said === null });
  };
  $("#tf-y").addEventListener("click", () => answer(true));
  $("#tf-n").addEventListener("click", () => answer(false));
  timer = setTimeout(() => answer(null), 4000);
}

/* ---- Bedömning + feedback i två steg ---- */
function grade(ok, { final, silent, timeout } = {}) {
  const c = S.cur; c.attempts++;
  const ms = performance.now() - c.t0;
  const full = c.ex.full || c.ex.answer;
  if (ok) {
    S.right++; S.total++;
    const s = P.pat[c.p.id]; s.seen++; s.right++; s.last = today();
    const fast = c.type === "rattfel" || (c.type === "boj" && ms < 7000 && c.attempts === 1);
    if (fast) s.fast++;
    bumpItem(c.p.id, c.ex.key, true, c.attempts === 1 && fast);
    logDay(true); save();
    S.log.push({ pid: c.p.id, ok: true });
    const praise = c.attempts > 1 ? "Rätt på andra försöket" : pick(["Rätt", "Precis", "Ja", "Snyggt", "Just det"]);
    const extra = c.type === "rattfel" ? `<div class="why">${c.truth ? "Formen stämde." : `Rätt form är <span class="ro">${esc(full)}</span>.`} ${c.ex.why}</div>` :
      (c.attempts > 1 || silent) ? "" : `<div class="why muted small">${c.ex.why}</div>`;
    showFb("good", `<div class="h">✓ ${praise}</div><div class="ans">${esc(full)} <button class="spk" data-say="${esc(c.ex.say.ro)}">🔊</button></div>${extra}<div class="acts"><button class="cta good" id="fb-next">Fortsätt</button></div>`);
  } else if (!final) {
    showFb("hint", `<div class="h">Inte riktigt – en ledtråd</div><div class="why">${c.ex.hint}</div><div class="acts"><button class="cta hint" id="fb-retry">Försök igen</button><button class="cta ghost" id="fb-giveup">Visa svaret</button></div>`);
    $("#fb-retry").addEventListener("click", () => { hideFb(); const inp = $("#inp"); if (inp) { inp.classList.remove("bad"); inp.select(); inp.focus(); } });
    $("#fb-giveup").addEventListener("click", () => grade(false, { final: true }));
    return;
  } else {
    S.total++;
    const s = P.pat[c.p.id]; s.seen++; s.last = today();
    bumpItem(c.p.id, c.ex.key, false, false);
    logDay(false); save();
    S.log.push({ pid: c.p.id, ok: false });
    const head = timeout ? "Tiden gick ut" : c.type === "rattfel" ? (c.truth ? "Den var faktiskt rätt" : "Den var fel") : "Inte den här gången";
    showFb("bad", `<div class="h">✗ ${head}</div><div class="ans">${esc(full)} <button class="spk" data-say="${esc(c.ex.say.ro)}">🔊</button></div><div class="why">${c.ex.why}</div>
      <div><button class="linkish" id="fb-rule">Visa hela regeln</button></div><div class="acts"><button class="cta bad" id="fb-next">Fortsätt</button></div>`);
    $("#fb-rule").addEventListener("click", () => { $("#fb .why").innerHTML = c.p.rule; $("#fb-rule").remove(); });
  }
  $("#fb-next").addEventListener("click", next);
  bindSpeak($("#fb"));
}
/* Leitner per (mönster × lemma): rätt → +1 låda (+2 om snabbt första försöket), fel → låda 0 */
function bumpItem(pid, key, ok, fast) {
  const k = itemKey(pid, key);
  const it = P.items[k] || { box: 0, due: today(), seen: 0, right: 0 };
  it.seen++;
  if (ok) { it.right++; it.box = Math.min(6, it.box + (fast && it.box >= 1 ? 2 : 1)); }
  else it.box = 0;
  it.due = addDays(today(), INTERVALS[it.box]);
  P.items[k] = it;
}
function logDay(ok) { const d = P.days[today()] || { n: 0, right: 0 }; d.n++; if (ok) d.right++; P.days[today()] = d; }
function showFb(kind, html) { const fb = $("#fb"); fb.className = `fb show ${kind}`; fb.innerHTML = html; }
function hideFb() { const fb = $("#fb"); fb.className = "fb"; fb.innerHTML = ""; }

/* ---- Klar ---- */
const TIPS = [
  "Blandade övningar känns svårare än ett mönster i taget. Det är meningen: du tvingas välja regel, inte bara följa den.",
  "Fel svar är inte slöseri. Ledtråd före facit gör att du själv rättar – det fastnar bättre än att bara se rätt svar.",
  "Att säga formen högt ger en annan väg in i minnet än att skriva den. Hoppa inte över Säg det.",
  "Ett nytt mönster behöver flera pass de första dagarna. Sedan glesare – appen sköter det.",
  "Rätt på tid är det som räknas som automatiskt. Det är målet: att inte behöva tänka.",
  "Kan du regeln men fastnar på ordet? Då är det glosan som saknas – lägg in den i Flippa.",
];
function finish() {
  clearTimer(); hideFb();
  if (!S) return;
  const touched = [...new Set(S.log.map((l) => l.pid))];
  const acc = S.total ? Math.round(100 * S.right / S.total) : 0;
  track("pass-klar");
  $("#done-body").innerHTML = `<div style="text-align:center;font-size:2.6rem">${acc >= 80 ? "🧽✨" : "🧽"}</div><h2>${acc >= 80 ? "Blankt!" : "Gnuggat"}</h2>
    <div class="stats"><div class="stat"><b>${S.total}</b><span>övningar</span></div><div class="stat"><b>${S.right}</b><span>rätt</span></div><div class="stat"><b>${acc} %</b><span>träffsäkerhet</span></div></div>
    ${touched.length ? `<div class="eyebrow">Mönster i passet</div><div style="display:flex;flex-direction:column;gap:8px">${touched.map((pid) => { const b = S.before[pid], a = pct(pid); const d = a - b; return `<div class="delta"><div class="n">${byId[pid].name}</div>${lvlHtml(pid)}<div class="d ${d > 0 ? "up" : ""}">${d > 0 ? "+" : ""}${d} %</div></div>`; }).join("")}</div>` : ""}
    <div class="tip"><b>Grundtanke.</b> ${pick(TIPS)}</div>
    <button class="cta" id="done-home">Klart</button>`;
  $("#done-home").addEventListener("click", () => { S = null; renderHome(); show("s-home"); });
  S = null;
  show("s-done");
}

/* ============================================================
   Modaler: inställningar, hjälp, vad är nytt
   ============================================================ */
function openModal(html) {
  const root = $("#modal-root"); $("#modal").innerHTML = html; root.classList.remove("hidden");
  const c = $("#m-close"); if (c) c.addEventListener("click", closeModal);
  bindSpeak($("#modal"));
}
function closeModal() { $("#modal-root").classList.add("hidden"); $("#modal").innerHTML = ""; }
$("#modal-back").addEventListener("click", closeModal);

function openSettings() {
  const totalItems = Object.keys(P.items).length;
  openModal(`<div class="mh"><h2>Inställningar</h2><button class="ib" id="m-close">✕</button></div>
    <div class="set">
      <div class="set-row"><span class="set-body"><span class="set-t">Övningar per pass</span><span class="set-d">Ungefär 15 sekunder per övning</span></span>
        <div class="seg" id="seg-len">${[12, 20, 30].map((n) => `<button data-n="${n}" class="${SET.passLen === n ? "on" : ""}">${n}</button>`).join("")}</div></div>
      <div class="set-row"><span class="set-body"><span class="set-t">Uppläsning</span><span class="set-d">${voiceOk ? `Röst för ${LANG.name.toLowerCase()} finns på enheten` : `Ingen röst för ${LANG.name.toLowerCase()} på den här enheten – 🔊 döljs`}</span></span>
        <button class="toggle ${SET.tts ? "on" : ""}" id="tg-tts" aria-label="Uppläsning"></button></div>
    </div>
    <div class="eyebrow">Om appen</div>
    <div class="set">
      <button class="set-row" id="open-help"><span class="set-body"><span class="set-t">Hjälp & grundtankar</span><span class="set-d">Hur Gnugga är tänkt att användas – och varför</span></span><span class="chev">›</span></button>
      <button class="set-row" id="open-cl"><span class="set-body"><span class="set-t">Vad är nytt</span><span class="set-d">Gnugga ${APP_VERSION}</span></span><span class="chev">›</span></button>
      <div class="set-row"><span class="set-body"><span class="set-t">Innehåll</span><span class="set-d">${L.nouns.length} substantiv · ${L.verbs.length} verb · ${L.adjs.length} adjektiv. Böjningsformer från Wiktionary via kaikki.org, CC BY-SA 4.0. Frekvens: OpenSubtitles.</span></span></div>
    </div>
    <div class="eyebrow">Dina framsteg</div>
    <div class="set">
      <button class="set-row" id="exp"><span class="set-body"><span class="set-t">Exportera framsteg</span><span class="set-d">${totalItems} ord gnuggade. Sparas som JSON – ta med till ny telefon</span></span><span class="chev">›</span></button>
      <button class="set-row" id="imp"><span class="set-body"><span class="set-t">Importera framsteg</span><span class="set-d">Klistra in en tidigare export</span></span><span class="chev">›</span></button>
      <button class="set-row" id="reset"><span class="set-body"><span class="set-t" style="color:var(--fail)">Nollställ allt</span><span class="set-d">Raderar framsteg på den här enheten</span></span></button>
    </div>`);
  $$("#seg-len button").forEach((b) => b.addEventListener("click", () => { SET.passLen = +b.dataset.n; save(); $$("#seg-len button").forEach((x) => x.classList.toggle("on", x === b)); renderHome(); }));
  $("#tg-tts").addEventListener("click", () => { SET.tts = !SET.tts; save(); $("#tg-tts").classList.toggle("on", SET.tts); updateVoice(); });
  $("#open-help").addEventListener("click", openHelp);
  $("#open-cl").addEventListener("click", openChangelog);
  $("#exp").addEventListener("click", async () => {
    const txt = JSON.stringify({ app: "gnugga", lang: LANG.code, ver: APP_VERSION, date: today(), progress: P, settings: SET });
    try { if (navigator.share) { await navigator.share({ title: "Gnugga-framsteg", text: txt }); } else { await navigator.clipboard.writeText(txt); toast("Kopierat till urklipp"); } }
    catch (_) { try { await navigator.clipboard.writeText(txt); toast("Kopierat till urklipp"); } catch (e) { toast("Kunde inte exportera"); } }
  });
  $("#imp").addEventListener("click", () => {
    const txt = prompt("Klistra in din export:"); if (!txt) return;
    try { const d = JSON.parse(txt); if (d.app !== "gnugga" || !d.progress || !d.progress.pat) throw 0; P = d.progress; if (d.settings) SET = Object.assign(SET, d.settings); loadProgress(); localStorage.setItem(KEY, JSON.stringify(P)); save(); closeModal(); renderHome(); toast("Framsteg importerade"); }
    catch (_) { toast("Det där såg inte ut som en Gnugga-export"); }
  });
  $("#reset").addEventListener("click", () => { if (confirm("Nollställa alla framsteg på den här enheten?")) { localStorage.removeItem(KEY); loadProgress(); closeModal(); renderHome(); toast("Nollställt"); } });
}
$("#settings-btn").addEventListener("click", openSettings);
$("#lang-chip").addEventListener("click", () => toast(`${LANG.name} är enda språket än så länge`));

function openHelp() {
  openModal(`<div class="mh"><h2>Hjälp & grundtankar</h2><button class="ib" id="m-close">✕</button></div>
    <div class="help">
      <details open><summary>Vad Gnugga är</summary><div class="more"><p>Ett komplement till Flippa. Flippa nöter <i>ord</i>; Gnugga nöter <i>formerna</i>: bestämd form, plural, verbböjning, adjektiv som ska stämma. ${LANG.intro}</p></div></details>
      <details><summary>Ett pass</summary><div class="more"><p>Tryck <b>Gnugga nu</b>. Passet börjar med repetition, introducerar ibland ett nytt mönster (kort regel, sedan övningar på bara det), och avslutar med allt blandat.</p><p><b>Böj</b>: skriv formen. Knapparna ă â î ș ț finns under fältet. <b>Välj</b>: bara i början av ett nytt mönster. <b>Säg det</b>: säg formen högt, visa, bedöm dig själv. <b>Rätt eller fel?</b>: fyra sekunder – mäter om det sitter automatiskt.</p><p>Regeln finns alltid under knappen <b>Regeln</b> uppe till höger.</p></div></details>
      <details><summary>Fel svar</summary><div class="more"><p>Först får du en <b>ledtråd</b> utan facit och ett nytt försök. Går det inte får du facit och <b>varför</b>. Forskningen är tydlig: bara rött/grönt lär nästan ingenting, en förklaring lär mycket, och att rätta sig själv lär mest.</p></div></details>
      <details><summary>Varför det blandas</summary><div class="more"><p>När du kan grunden i flera mönster blandar appen dem. Det känns svårare än att köra ett i taget – och de flesta tror att blockat är bättre. Men mätt en vecka senare lär man sig mer av blandat, för då måste man <i>välja</i> regel, inte bara följa den.</p></div></details>
      <details><summary>Nivåerna</summary><div class="more"><p><b>Nytt</b> → <b>Lärt</b> (du har börjat) → <b>Övat</b> (minst 15 övningar, 70 % rätt) → <b>Automatiskt</b> (40 övningar, 85 % rätt och 15 rätt på tid). Automatiskt är målet: att formen kommer utan att du tänker.</p><p>Varje ord du gnuggat i ett mönster har en egen låda (som i Flippa). Fel → tillbaka till start och dags igen idag; rätt → längre intervall.</p></div></details>
      <details><summary>Läsa eller göra?</summary><div class="more"><p>Båda, men mest göra. Regeln är max en skärm och läses en gång. Sedan är det övningarna som bygger färdigheten – ungefär 10 % läsa, 90 % göra. Fördjupningen under varje mönster är för när du blir nyfiken, inte ett krav.</p></div></details>
      <details><summary>Facit och källor</summary><div class="more"><p>Böjningsformerna kommer från Wiktionary (via kaikki.org), inte från en AI som gissar. Frekvensordningen kommer från undertexter (OpenSubtitles), så de vanligaste orden kommer först. Data: CC BY-SA 4.0.</p></div></details>
    </div>`);
}
function openChangelog() {
  openModal(`<div class="mh"><h2>Vad är nytt</h2><button class="ib" id="m-close">✕</button></div>
    ${CHANGELOG.map((d) => `<div class="cl-day"><div class="cl-h"><span>${d.date}</span><span>${d.ver}</span></div>${d.items.map((i) => `<div class="cl-item"><span class="t ${i.type}">${{ new: "Nytt", improved: "Bättre", fixed: "Fixat" }[i.type]}</span><span>${i.t}${i.desc ? `<div class="small muted" style="margin-top:4px">${i.desc}</div>` : ""}</span></div>`).join("")}</div>`).join("")}`);
}
$("#version-tag").addEventListener("click", openChangelog);

/* ============================================================
   PWA: service worker + uppdatering vid säkert tillfälle (som Flippa)
   ============================================================ */
let pendingReload = false, swReloading = false;
function maybeReloadForUpdate() {
  if (!pendingReload || swReloading) return;
  if (activeScreen !== "s-home" || S) return;
  swReloading = true;
  try { sessionStorage.setItem("gnugga-updated", "1"); } catch (_) {}
  location.reload();
}
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!hadController) return; pendingReload = true; maybeReloadForUpdate(); });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
    reg.update();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update(); });
    setInterval(() => reg.update(), 60000);
  }).catch(() => {});
}

/* ============================================================
   Start
   ============================================================ */
async function boot() {
  loadProgress();
  try {
    const r = await fetch(`data/${LANG.code}/lexikon.json`);
    L = await r.json();
  } catch (e) {
    $("#splash-note").textContent = "Kunde inte läsa in innehållet. Öppna appen med nät en gång.";
    return;
  }
  updateVoice();
  renderHome();
  const splash = $("#splash");
  try { if (sessionStorage.getItem("gnugga-updated")) { $("#splash-note").textContent = `Uppdaterad till ${APP_VERSION}`; sessionStorage.removeItem("gnugga-updated"); } } catch (_) {}
  setTimeout(() => { splash.classList.add("hide"); setTimeout(() => splash.remove(), 450); }, 250);
}
boot();
