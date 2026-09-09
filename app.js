"use strict";
/* Gnugga – grammatikdrill. Språkoberoende motor; allt språkspecifikt bor i data/<lang>/monster.js
   (regler, generatorer) och data/<lang>/lexikon.json (böjningsformer från Wiktionary).

   Pedagogiken (se docs/plan.md):
   - kort regel → övning (≈10/90), regeln alltid ett tryck bort under passet
   - produktion före igenkänning: Välj bara i intro, sedan Böj/Säg det
   - interleaving: blockat bara första repen av nytt mönster, sedan blandas allt aktivt
   - feedback i två steg: ledtråd utan facit → nytt försök → facit + varför
   - SRS: Leitner-lådor per (mönster × lemma), som Flippa; mönsternivå Nytt→Lärt→Övat→Automatiskt */

const APP_VERSION = "v21";
// AI-stjärnor (samma som Flippas "AI-kontext")
const AI_STARS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M10 5 L11.7 10.3 L17 12 L11.7 13.7 L10 19 L8.3 13.7 L3 12 L8.3 10.3 Z"/><path d="M18 4 L18.8 6.2 L21 7 L18.8 7.8 L18 10 L17.2 7.8 L15 7 L17.2 6.2 Z"/></svg>';
const ICON_X = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
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
let SET = { passLen: 12, tts: true, name: "" };

function loadProgress() {
  try { P = JSON.parse(localStorage.getItem(KEY)) || null; } catch (_) { P = null; }
  if (!P || !P.pat) P = { pat: {}, items: {}, days: {}, v: 1 };
  for (const p of PATTERNS) { P.pat[p.id] = P.pat[p.id] || { seen: 0, right: 0, fast: 0, intro: null, last: null }; P.pat[p.id].dayList = P.pat[p.id].dayList || (P.pat[p.id].last ? [P.pat[p.id].last] : []); }
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
  // Automatiskt kräver också spridning över tid: minst tre olika dagar (en kvälls drill räcker inte)
  if (s.seen >= 40 && s.fast >= 15 && acc >= .85 && (s.dayList || []).length >= 3) return { n: 3, t: "Automatiskt" };
  if (s.seen >= 15 && acc >= .7) return { n: 2, t: "Övat" };
  return { n: 1, t: "Lärt" };
}
function pct(id) {
  const s = P.pat[id];
  if (!s.seen) return 0;
  const acc = s.right / s.seen;
  const days = Math.min(1, (s.dayList || []).length / 3);
  return Math.min(100, Math.round(20 + Math.min(1, s.seen / 40) * 40 * acc + Math.min(1, s.fast / 15) * 25 + days * 15));
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
const TABS = ["s-home", "s-stats", "s-help"];
function show(id) {
  $$(".screen").forEach((s) => s.classList.toggle("on", s.id === id)); activeScreen = id; window.scrollTo(0, 0);
  document.body.classList.toggle("tabbar-on", TABS.includes(id));
  $$(".tab-btn").forEach((b) => b.classList.toggle("on", b.dataset.tab === id));
  maybeReloadForUpdate();
}
$$(".tab-btn").forEach((b) => b.addEventListener("click", () => {
  const id = b.dataset.tab;
  if (id === "s-home") renderHome(); else if (id === "s-stats") renderStats(); else renderHelp();
  show(id);
}));
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

  const groups = {}; for (const p of PATTERNS) (groups[p.area] ||= []).push(p);
  $("#pattern-groups").innerHTML = Object.entries(groups).map(([area, ps]) => `<div class="group"><div class="eyebrow">${area}</div>` +
    ps.map((p) => `<button class="row" data-p="${p.id}"><div class="body"><div class="name">${p.name}</div><div class="bar"><i style="width:${pct(p.id)}%"></i></div></div>${nn && nn.id === p.id ? `<span class="lvl due">Nästa</span>` : lvlHtml(p.id)}<span class="chev">›</span></button>`).join("") + `</div>`).join("");
  $$(".row[data-p]").forEach((b) => b.addEventListener("click", () => openPattern(b.dataset.p)));
  $("#lang-chip").textContent = `${LANG.flag} ${LANG.name}`;
  $("#version-tag").textContent = `Gnugga ${APP_VERSION}`;
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
    (s.seen ? `<div class="card"><h3>Din nivå</h3><div class="small muted">${s.seen} övningar · ${Math.round(100 * s.right / s.seen)} % rätt · ${s.fast} rätt på tid · ${(s.dayList || []).length} dagar · ${items.length} ord gnuggade</div><div class="bar" style="height:8px"><i style="width:${pct(id)}%"></i></div><div class="small muted">Automatiskt = minst 40 övningar, 85 % rätt, 15 rätt på tid och övat minst tre olika dagar.</div>
      ${weak.length ? `<div class="small muted" style="margin-top:6px">Svagast just nu</div><div class="wordlist">${weak.map((i) => `<span class="weak">${esc(i.key)}</span>`).join("")}</div>` : ""}
      ${strong.length ? `<div class="small muted" style="margin-top:6px">Sitter bra</div><div class="wordlist">${strong.map((i) => `<span class="strong">${esc(i.key)}</span>`).join("")}</div>` : ""}</div>` : "") +
    `<button class="cta" id="p-only">${s.intro ? "Gnugga bara det här mönstret" : "Börja med det här mönstret"} · ${Math.min(SET.passLen, 12)} övningar</button>
    ${active().length > 1 ? `<button class="cta sec" id="p-mixed">Blandat pass med alla aktiva</button>` : ""}
    <div class="links center">${aiBtn(`Förklara ${p.name.toLowerCase()} i rumänsk grammatik för en svensktalande nybörjare: regeln, de vanligaste undantagen, och fem exempel med översättning. Jämför gärna med svenskan.`, "p-ai")}</div>
    <div class="note">${s.intro ? "Blandat pass är bäst när du kan grunden. \"Bara det här\" passar när ett mönster känns nytt eller skakigt." : "Första gången: läs regeln, sedan kör du övningar på bara det här mönstret."}</div>`;
  $("#p-only").addEventListener("click", () => startSession({ focus: id }));
  const m = $("#p-mixed"); if (m) m.addEventListener("click", () => startSession({}));
  bindSpeak($("#p-body")); bindAi($("#p-body"));
  show("s-pattern");
}

/* ============================================================
   Pass
   ============================================================ */
let S = null, timer = null;
function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

/* Passplan: lista av {pid,type} eller {intro:pid}.
   Typer: valj (igenkänning, bara intro), boj (skriv), sag (muntligt), rattfel (tidspressat) */
function planSession({ focus, picks }) {
  const items = []; const add = (pid, type) => items.push({ pid, type });
  const n = SET.passLen;
  if (picks && picks.length) { // "Gnugga just dessa": bara Böj på utvalda ord, två varv om få
    const list = picks.length < 6 ? picks.concat(picks) : picks;
    for (const pk of shuffle(list)) items.push({ pid: pk.pid, type: "boj", key: pk.key });
    return items;
  }
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
  S = { items: planSession(opts), i: -1, right: 0, total: 0, before: {}, log: [], focus: opts.focus || null, picks: !!opts.picks };
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
  const lemma = (it.key && p.pool(L).find((x) => p.key(x) === it.key)) || chooseLemma(p);
  const ex = p.gen(lemma, L);
  ex.key = p.key(lemma);
  S.cur = { p, ex, type: it.type, attempts: 0, t0: performance.now() };
  const TYPE = { valj: "Välj", boj: "Böj", sag: "Säg det", rattfel: "Rätt eller fel?" };
  $("#tags").innerHTML = `<span class="tag">${p.short}</span><span class="tag type ${it.type === "sag" ? "say" : ""}">${TYPE[it.type]}</span>${it.type === "rattfel" ? `<span class="tag">på tid</span>` : ""}<button class="tag rulebtn" id="rule-peek">Regeln</button>`;
  $("#rule-peek").addEventListener("click", () => openModal(`<div class="mh"><h2>${p.name}</h2><button class="ib" id="m-close" aria-label="Stäng">${ICON_X}</button></div>${ruleCard(p)}`));
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
  st.innerHTML = taskHtml(ex) + `<div class="answer"><input class="inp" id="inp" type="text" lang="${LANG.code}" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="skriv formen" />
    <div class="keys">${LANG.keys.map((c) => `<button type="button" data-c="${c}">${c}</button>`).join("")}</div>
    <button class="cta" id="check">Kolla</button></div>`;
  const inp = $("#inp");
  $$(".keys button").forEach((b) => b.addEventListener("click", () => { const s = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, s) + b.dataset.c + inp.value.slice(s); inp.focus(); inp.setSelectionRange(s + 1, s + 1); }));
  const check = () => {
    const v = norm(inp.value); if (!v) { inp.focus(); return; }
    const accepted = [ex.answer, ...(ex.alts || []), ...(ex.acceptFull && ex.full ? [ex.full] : [])].map(norm);
    const ok = accepted.includes(v);
    inp.classList.remove("ok", "bad"); inp.classList.add(ok ? "ok" : "bad");
    S.cur.diag = ok ? null : diagnose(v, ex); S.cur.lastInput = v; if (!ok && !S.cur.diagCat) S.cur.diagCat = lastDiagCat;
    inp.blur();
    $("#check").classList.add("hidden"); $(".keys").classList.add("hidden");
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
    <div class="answer"><div class="timer run"><i></i></div><div class="tf"><button id="tf-y" class="yes"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg> Rätt</button><button id="tf-n" class="no"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg> Fel</button></div></div>`;
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

/* ---- Feldiagnos: vad blev egentligen fel? Körs före mönstrets generella ledtråd. ----
   Ordning: annan riktig form → bara diakriter → felskrivning (1 tecken) → rätt ändelse men
   fel stam → (annars) ändelseledtråden från mönstret. */
const stripDia = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function markDiff(input, answer) { // markera tecken i inmatningen som skiljer sig (utan att visa facit)
  return Array.from(input).map((ch, i) => ch === answer[i] ? esc(ch) : `<mark>${esc(ch)}</mark>`).join("");
}
let lastDiagCat = null; // sätts av diagnose(), läses av renderBoj
function diagnose(input, ex) {
  const ans = norm(ex.answer); const inp = norm(input);
  lastDiagCat = "ending";
  if (!inp || inp === ans) return null;
  if (ex.forms && ex.forms[inp] && ex.forms[inp] !== ex.forms[ans]) {
    lastDiagCat = "form";
    return `<b>${esc(inp)}</b> är en riktig form av ordet – men det är <b>${ex.forms[inp]}</b>. Här ska det vara ${ex.target || "en annan form"}.`;
  }
  if (stripDia(inp) === stripDia(ans)) {
    lastDiagCat = "dia";
    const pos = inp.length === ans.length ? markDiff(inp, ans) : esc(inp);
    return `Nästan! Bokstäverna är rätt – det är bara krumelurerna. Kolla det markerade: ${pos}. Använd knapparna ă â î ș ț.`;
  }
  const tail = Math.min(2, ans.length - 1);
  const sameEnding = tail > 0 && inp.endsWith(ans.slice(-tail));
  if (lev(inp, ans) === 1 && !sameEnding) return `Ett tecken ifrån – ser ut som en felskrivning eller fel ändelse. Kolla slutet: ${markDiff(inp, ans)}.`;
  if (sameEnding && ex.stemHint) { lastDiagCat = "stem"; return `Ändelsen <b>-${esc(ans.slice(-tail))}</b> stämmer. ${ex.stemHint}`; }
  if (lev(inp, ans) === 1) return `Ett tecken ifrån: ${markDiff(inp, ans)}. ${ex.hint}`;
  return null; // → mönstrets ledtråd
}

/* ---- AI-kontext: öppnar Googles AI-läge med en färdig fråga om just den här övningen
   (som Flippa). Dynamiskt komplement till den statiska regeln. ---- */
function aiQuestion(ex) {
  if (ex.ai) return ex.ai;
  const base = plain(ex.big);
  return `${ex.q} "${base}"${ex.sub ? ` (${ex.sub})` : ""} på ${LANG.name.toLowerCase()} är "${ex.full || ex.answer}" – varför? Förklara regeln bakom, vanliga undantag, och ge tre liknande exempel.`;
}
function aiUrl(q) { return `https://www.google.com/search?udm=50&q=${encodeURIComponent(q)}`; }
function openExternal(url) {
  try { const l = document.createElement("a"); l.href = url; l.target = "_blank"; l.rel = "noopener noreferrer"; l.style.display = "none"; document.body.appendChild(l); l.click(); setTimeout(() => l.remove(), 0); }
  catch (_) { window.open(url, "_blank"); }
}
const aiBtn = (q, id) => `<button class="aibtn" id="${id}" data-q="${esc(q)}">${AI_STARS} AI-kontext</button>`;
function bindAi(root) { $$(".aibtn", root).forEach((b) => b.addEventListener("click", () => { track("ai-kontext"); openExternal(aiUrl(b.dataset.q)); })); }

/* ---- Bedömning + feedback i två steg ---- */
function grade(ok, { final, silent, timeout } = {}) {
  const c = S.cur; c.attempts++;
  const ms = performance.now() - c.t0;
  const full = c.ex.full || c.ex.answer;
  if (ok) {
    S.right++; S.total++;
    const s = P.pat[c.p.id]; s.seen++; s.right++; s.last = today(); touchDay(s);
    const fast = c.type === "rattfel" || (c.type === "boj" && ms < 7000 && c.attempts === 1);
    if (fast) s.fast++;
    bumpItem(c.p.id, c.ex.key, true, c.attempts === 1 && fast);
    logDay(true, fast); save();
    S.log.push({ pid: c.p.id, ok: true });
    if (!silent) speak(c.ex.say.ro); // inskärp formen med örat varje gång den sitter
    const praise = c.attempts > 1 ? "Rätt på andra försöket" : pick(["Rätt", "Precis", "Ja", "Snyggt", "Just det"]);
    const extra = c.type === "rattfel" ? `<div class="why">${c.truth ? "Formen stämde." : `Rätt form är <span class="ro">${esc(full)}</span>.`} ${c.ex.why}</div>` :
      (c.attempts > 1 || silent) ? "" : `<div class="why muted small">${c.ex.why}</div>`;
    showFb("good", `<div class="h">✓ ${praise}</div><div class="ans">${esc(full)} <button class="spk" data-say="${esc(c.ex.say.ro)}">🔊</button></div>${extra}<div class="links">${aiBtn(aiQuestion(c.ex), "fb-ai")}</div><div class="acts"><button class="cta good" id="fb-next">Fortsätt</button></div>`);
  } else if (!final) {
    showFb("hint", `<div class="h">Inte riktigt – en ledtråd</div><div class="why">${c.diag || c.ex.hint}</div><div class="acts"><button class="cta hint" id="fb-retry">Försök igen</button><button class="cta ghost" id="fb-giveup">Visa svaret</button></div>`);
    $("#fb-retry").addEventListener("click", () => { hideFb(); const inp = $("#inp"); if (inp) { inp.classList.remove("bad"); $("#check").classList.remove("hidden"); $(".keys").classList.remove("hidden"); inp.select(); inp.focus(); } });
    $("#fb-giveup").addEventListener("click", () => grade(false, { final: true }));
    return;
  } else {
    S.total++;
    const s = P.pat[c.p.id]; s.seen++; s.last = today(); touchDay(s);
    bumpItem(c.p.id, c.ex.key, false, false);
    logDay(false); if (c.type === "boj") logErr(c.diagCat || "ending"); save();
    S.log.push({ pid: c.p.id, ok: false });
    const head = timeout ? "Tiden gick ut" : c.type === "rattfel" ? (c.truth ? "Den var faktiskt rätt" : "Den var fel") : "Inte den här gången";
    showFb("bad", `<div class="h">✗ ${head}</div><div class="ans">${esc(full)} <button class="spk" data-say="${esc(c.ex.say.ro)}">🔊</button></div>${c.type === "boj" && c.lastInput && c.diag && stripDia(norm(c.lastInput)) === stripDia(norm(c.ex.answer)) ? `<div class="why muted small">Du skrev <b>${esc(c.lastInput)}</b> – bara diakriterna skilde.</div>` : ""}<div class="why">${c.ex.why}</div>
      <div class="links"><button class="linkish" id="fb-rule">Visa hela regeln</button>${aiBtn(aiQuestion(c.ex), "fb-ai")}</div><div class="acts"><button class="cta bad" id="fb-next">Fortsätt</button></div>`);
    $("#fb-rule").addEventListener("click", () => { $("#fb .why").innerHTML = c.p.rule; $("#fb-rule").remove(); });
  }
  $("#fb-next").addEventListener("click", next);
  bindSpeak($("#fb")); bindAi($("#fb"));
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
function touchDay(s) { s.dayList = s.dayList || []; if (!s.dayList.includes(today())) { s.dayList.push(today()); if (s.dayList.length > 60) s.dayList.shift(); } }
function logDay(ok, fast) { const d = P.days[today()] || { n: 0, right: 0 }; d.n++; if (ok) d.right++; if (fast) d.fast = (d.fast || 0) + 1; P.days[today()] = d; }
/* Feltyper (för statistiken): dia = bara diakriter, form = riktig form men fel form,
   stem = rätt ändelse fel stam, ending = fel ändelse / övrigt */
function logErr(cat) { if (!cat) return; P.errs = P.errs || {}; const d = P.errs[today()] || {}; d[cat] = (d[cat] || 0) + 1; P.errs[today()] = d; }
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
// Samma firande-ord som Flippa vid bra pass; lugnare rubrik annars
const DONE_LABELS = ["Grymt!", "Nice!", "Hell yeah!", "Snyggt!", "Kanon!", "Toppen!", "Bra jobbat!", "Yes!", "Så ska det se ut!", "Mästerligt!"];
function finish() {
  clearTimer(); hideFb();
  if (!S) return;
  const touched = [...new Set(S.log.map((l) => l.pid))];
  const acc = S.total ? Math.round(100 * S.right / S.total) : 0;
  if (S.total) { const d = P.days[today()] || { n: 0, right: 0 }; d.pass = (d.pass || 0) + 1; P.days[today()] = d; save(); }
  track("pass-klar");
  $("#done-body").innerHTML = `<div style="text-align:center;font-size:2.6rem">${acc >= 80 ? "🧽✨" : "🧽"}</div><h2>${acc >= 80 ? pick(DONE_LABELS) : "Gnuggat"}</h2>
    <div class="stats"><div class="stat"><b>${S.total}</b><span>övningar</span></div><div class="stat"><b>${S.right}</b><span>rätt</span></div><div class="stat"><b>${acc} %</b><span>träffsäkerhet</span></div></div>
    ${touched.length ? `<div class="eyebrow">Mönster i passet</div><div style="display:flex;flex-direction:column;gap:8px">${touched.map((pid) => { const b = S.before[pid], a = pct(pid); const d = a - b; return `<div class="delta"><div class="n">${byId[pid].name}</div>${lvlHtml(pid)}<div class="d ${d > 0 ? "up" : ""}">${d > 0 ? "+" : ""}${d} %</div></div>`; }).join("")}</div>` : ""}
    <div class="tip"><b>Grundtanke.</b> ${pick(TIPS)}</div>
    <button class="cta" id="done-home">Klart</button>`;
  $("#done-home").addEventListener("click", () => { S = null; cancelAnimationFrame(cfRaf); renderHome(); show("s-home"); });
  S = null;
  show("s-done");
  requestAnimationFrame(() => launchConfetti(acc >= 80 ? 90 : 45));
}

/* Fysik-konfetti på canvas (portad från Flippa): skjuts ut från mitten, faller med
   gravitation, studsar mot sidokanterna och försvinner ut i skärmens nederkant. */
const prefersReducedMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
let cfRaf = null;
function launchConfetti(count) {
  const screen = $("#s-done"), canvas = $("#done-canvas"), btnEl = $("#done-home");
  if (!canvas || !btnEl) return;
  cancelAnimationFrame(cfRaf);
  const ctx = canvas.getContext("2d");
  const W = screen.clientWidth, H = screen.clientHeight;
  if (prefersReducedMotion || !W) { canvas.width = W; canvas.height = H; return; }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const COLS = ["#5b8cff", "#8fbf5a", "#ffd24a", "#ff8a3d", "#e05a4f", "#b06bf0", "#fff"]; // samma glada palett som Flippa
  const rp = (a, b) => a + Math.random() * (b - a);
  let parts = [];
  // Skur från övre mitten: kraftig sidofart så bitarna sprätter ut mot väggarna och
  // studsar (Flippa får samma effekt av ringen runt emojin – Gnugga har ingen ring).
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    parts.push({ x: W / 2 + rp(-30, 30), y: rp(-40, 60), vx: side * rp(1.5, 5.5), vy: rp(-3.5, 1.0),
      w: rp(6, 11), h: rp(5, 9), rot: rp(0, 6.28), vr: rp(-0.3, 0.3), col: COLS[i % COLS.length], rest: false, dead: false });
  }
  const G = 0.16, REST = 0.55, WALL = 0.78, AIR = 0.992, M = 5;
  let frames = 0;
  function step() {
    frames++;
    ctx.clearRect(0, 0, W, H);
    let moving = 0;
    for (const p of parts) {
      if (!p.rest) {
        p.vy += G; p.vx *= AIR; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.x < M) { p.x = M; p.vx = Math.abs(p.vx) * WALL; p.vr += rp(-0.2, 0.2); }
        else if (p.x > W - M) { p.x = W - M; p.vx = -Math.abs(p.vx) * WALL; p.vr += rp(-0.2, 0.2); }
        if (p.y - 12 > H) p.dead = true; // ut i botten (ingen landning på Klart)
        if (!p.dead) moving++;
      }
      if (!p.dead) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
    }
    parts = parts.filter((p) => !p.dead);
    if (parts.length && moving > 0 && frames < 900) cfRaf = requestAnimationFrame(step);
  }
  step();
}

/* ============================================================
   Modaler: inställningar, hjälp, vad är nytt
   ============================================================ */
let lockedY = 0;
function openModal(html) {
  const root = $("#modal-root"); $("#modal").innerHTML = html; root.classList.remove("hidden");
  // lås bakgrunden: iOS scrollar annars sidan bakom modalen
  if (!document.body.classList.contains("modal-open")) { lockedY = window.scrollY; document.body.style.top = `-${lockedY}px`; document.body.classList.add("modal-open"); }
  const c = $("#m-close"); if (c) c.addEventListener("click", closeModal);
  bindSpeak($("#modal"));
}
function closeModal() { $("#modal-root").classList.add("hidden"); $("#modal").innerHTML = ""; document.body.classList.remove("modal-open"); document.body.style.top = ""; window.scrollTo(0, lockedY); }
$("#modal-back").addEventListener("click", closeModal);

function openSettings() {
  const totalItems = Object.keys(P.items).length;
  openModal(`<div class="mh"><h2>Inställningar <span class="muted small" style="font-weight:600">· Gnugga ${APP_VERSION}</span></h2><button class="ib" id="m-close" aria-label="Stäng">${ICON_X}</button></div>
    <div class="set">
      <div class="set-row"><span class="set-body"><span class="set-t">Övningar per pass</span><span class="set-d">Ungefär 15 sekunder per övning</span></span>
        <div class="seg" id="seg-len">${[8, 12, 20].map((n) => `<button data-n="${n}" class="${SET.passLen === n ? "on" : ""}">${n}</button>`).join("")}</div></div>
      <div class="set-row"><span class="set-body"><span class="set-t">Uppläsning</span><span class="set-d">${voiceOk ? `Röst för ${LANG.name.toLowerCase()} finns på enheten` : `Ingen röst för ${LANG.name.toLowerCase()} på den här enheten – 🔊 döljs`}</span></span>
        <button class="toggle ${SET.tts ? "on" : ""}" id="tg-tts" aria-label="Uppläsning"></button></div>
    </div>
    <div class="eyebrow">Dina framsteg</div>
    <div class="set">
      <button class="set-row" id="exp"><span class="set-body"><span class="set-t">Exportera framsteg</span><span class="set-d">${totalItems} ord gnuggade. Sparas som JSON – ta med till ny telefon</span></span><span class="chev">›</span></button>
      <button class="set-row" id="imp"><span class="set-body"><span class="set-t">Importera framsteg</span><span class="set-d">Klistra in en tidigare export</span></span><span class="chev">›</span></button>
      <button class="set-row" id="reset"><span class="set-body"><span class="set-t" style="color:var(--fail)">Nollställ allt</span><span class="set-d">Raderar framsteg på den här enheten</span></span></button>
    </div>`);
  $$("#seg-len button").forEach((b) => b.addEventListener("click", () => { SET.passLen = +b.dataset.n; save(); $$("#seg-len button").forEach((x) => x.classList.toggle("on", x === b)); renderHome(); }));
  $("#tg-tts").addEventListener("click", () => { SET.tts = !SET.tts; save(); $("#tg-tts").classList.toggle("on", SET.tts); updateVoice(); });
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

function renderHelp() {
  $("#help-body").innerHTML = `<div class="help">
      <details open><summary>Vad Gnugga är</summary><div class="more"><p>Ett komplement till Flippa. Flippa nöter <i>ord</i>; Gnugga nöter <i>formerna</i>: bestämd form, plural, verbböjning, adjektiv som ska stämma. ${LANG.intro}</p></div></details>
      <details><summary>Ett pass</summary><div class="more"><p>Tryck <b>Gnugga nu</b>. Passet börjar med repetition, introducerar ibland ett nytt mönster (kort regel, sedan övningar på bara det), och avslutar med allt blandat.</p><p><b>Böj</b>: skriv formen. Knapparna ă â î ș ț finns under fältet. <b>Välj</b>: bara i början av ett nytt mönster. <b>Säg det</b>: säg formen högt, visa, bedöm dig själv. <b>Rätt eller fel?</b>: fyra sekunder – mäter om det sitter automatiskt.</p><p>Regeln finns alltid under knappen <b>Regeln</b> uppe till höger.</p></div></details>
      <details><summary>Fel svar</summary><div class="more"><p>Först får du en <b>ledtråd</b> utan facit och ett nytt försök. Går det inte får du facit och <b>varför</b>. Forskningen är tydlig: bara rött/grönt lär nästan ingenting, en förklaring lär mycket, och att rätta sig själv lär mest.</p></div></details>
      <details><summary>Varför det blandas</summary><div class="more"><p>När du kan grunden i flera mönster blandar appen dem. Det känns svårare än att köra ett i taget – och de flesta tror att blockat är bättre. Men mätt en vecka senare lär man sig mer av blandat, för då måste man <i>välja</i> regel, inte bara följa den.</p></div></details>
      <details><summary>Nivåerna</summary><div class="more"><p><b>Nytt</b> → <b>Lärt</b> (du har börjat) → <b>Övat</b> (minst 15 övningar, 70 % rätt) → <b>Automatiskt</b> (40 övningar, 85 % rätt, 15 rätt på tid och minst tre olika dagar). Automatiskt är målet: att formen kommer utan att du tänker.</p><p>Varje ord du gnuggat i ett mönster har en egen låda (som i Flippa). Fel → tillbaka till start och dags igen idag; rätt → längre intervall.</p></div></details>
      <details><summary>Läsa eller göra?</summary><div class="more"><p>Båda, men mest göra. Regeln är max en skärm och läses en gång. Sedan är det övningarna som bygger färdigheten – ungefär 10 % läsa, 90 % göra. Fördjupningen under varje mönster är för när du blir nyfiken, inte ett krav.</p></div></details>
      <details><summary>Statistiken</summary><div class="more"><p><b>Rätt på tid</b> är Gnuggas eget mått: andelen svar som var både rätt och snabba (under sju sekunder på första försöket, eller rätt i "Rätt eller fel?"). Det är måttet på att en form börjar sitta automatiskt.</p><p><b>Vad du gör fel</b> bygger på feldiagnosen: är det bara krumelurerna, fel ändelse, fel stam eller en riktig form fast fel form? Är det mest krumelurer är det tangentbordet, inte grammatiken.</p></div></details>
    </div>
    <div class="eyebrow" style="margin-top:6px">Om appen</div>
    <div class="set">
      <button class="set-row" id="help-cl"><span class="set-body"><span class="set-t">Vad är nytt</span><span class="set-d">Gnugga ${APP_VERSION} · senast ${CHANGELOG[0].date}</span></span><span class="chev">›</span></button>
      <div class="set-row"><span class="set-body"><span class="set-t">Innehåll & källor</span><span class="set-d">${L.nouns.length} substantiv · ${L.verbs.length} verb · ${L.adjs.length} adjektiv. Böjningsformer från Wiktionary via kaikki.org (CC BY-SA 4.0). Frekvens: OpenSubtitles. Regler och svenska glosor skrivna för Gnugga.</span></span></div>
      <div class="set-row"><span class="set-body"><span class="set-t">Grundtankarna i korthet</span><span class="set-d">Kort regel, sedan mest övning. Skriv eller säg formen, känn inte bara igen den. Blanda mönster när grunden sitter. Ledtråd före facit. Facit ur riktig data.</span></span></div>
    </div>
`;
  $("#help-cl").addEventListener("click", openChangelog);
}
/* Flera versioner samma dag → en post per dag med dagens senaste versionsnummer (som Flippa) */
function mergeDays(log) {
  const out = [];
  for (const d of log) { const last = out[out.length - 1]; if (last && last.date === d.date) last.items.push(...d.items); else out.push({ date: d.date, ver: d.ver, items: d.items.slice() }); }
  return out;
}
function openChangelog() {
  openModal(`<div class="mh"><h2>Vad är nytt</h2><button class="ib" id="m-close" aria-label="Stäng">${ICON_X}</button></div>
    ${mergeDays(CHANGELOG).map((d) => `<div class="cl-day"><div class="cl-h"><span>${d.date}</span><span>${d.ver}</span></div>${d.items.map((i) => `<div class="cl-item"><span class="t ${i.type}">${{ new: "Nytt", improved: "Bättre", fixed: "Fixat" }[i.type]}</span><span>${i.t}${i.desc ? `<div class="small muted" style="margin-top:4px">${i.desc}</div>` : ""}</span></div>`).join("")}</div>`).join("")}`);
}
$("#version-tag").addEventListener("click", () => { renderHelp(); show("s-help"); });

/* ============================================================
   Statistik (flik): A vecka & heatmap · B period & KPI · E svagaste orden · F feltyper
   ============================================================ */
let statsPeriod = "month";
const DIA_LABEL = { dia: ["Bara krumelurerna (ă â î ș ț)", "var(--warm)"], ending: ["Fel ändelse eller annat", "var(--fail)"], stem: ["Rätt ändelse, fel stam", "#9b6dff"], form: ["Riktig form, men fel form", "#5b8cff"] };
function sumDays(from, to) { // [from, to] inkl., ISO-datum
  const r = { n: 0, right: 0, fast: 0, pass: 0, days: 0 };
  for (const d in P.days) { if (d >= from && d <= to) { const x = P.days[d]; r.n += x.n || 0; r.right += x.right || 0; r.fast += x.fast || 0; r.pass += x.pass || 0; r.days++; } }
  return r;
}
function longestStreak() {
  const ds = Object.keys(P.days).sort(); let best = 0, cur = 0, prev = null;
  for (const d of ds) { cur = prev && addDays(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
}
function renderStats() {
  $("#stats-lang").textContent = `${LANG.flag} ${LANG.name}`;
  const t = today();
  // A
  const week = []; for (let i = 6; i >= 0; i--) week.push(addDays(t, -i));
  const n7 = week.filter((d) => P.days[d]).length;
  const totalDays = Object.keys(P.days).length;
  const names = ["S", "M", "T", "O", "T", "F", "L"];
  let heat = ""; const start = addDays(t, -(18 * 7 - 1 + new Date(t + "T12:00:00").getDay()));
  for (let i = 0; i < 18 * 7 + 7; i++) { const d = addDays(start, i); if (d > t) break; const x = P.days[d]; const n = x ? x.n : 0;
    heat += `<span class="d ${n >= 40 ? "l4" : n >= 25 ? "l3" : n >= 12 ? "l2" : n > 0 ? "l1" : ""} ${d === t ? "now" : ""}" title="${d}: ${n}"></span>`; }
  // B
  const spans = { week: 7, month: 30, all: 36500 };
  const len = spans[statsPeriod];
  const cur = sumDays(addDays(t, -(len - 1)), t), prev = sumDays(addDays(t, -(2 * len - 1)), addDays(t, -len));
  const pct100 = (a, b) => b ? Math.round(100 * a / b) : 0;
  const acc = pct100(cur.right, cur.n), accPrev = pct100(prev.right, prev.n), fast = pct100(cur.fast, cur.n), fastPrev = pct100(prev.fast, prev.n);
  const delta = (v, p) => statsPeriod === "all" || !prev.n ? "" : `<span class="delta ${v - p < 0 ? "neg" : ""}">${v - p >= 0 ? "+" : ""}${v - p}</span>`;
  // E
  const weak = Object.entries(P.items).map(([k, v]) => ({ pid: k.split("|")[0], key: k.split("|")[1], ...v })).filter((i) => i.box <= 1 && i.seen >= 1)
    .sort((x, y) => (x.box - y.box) || ((y.seen - y.right) - (x.seen - x.right)) || (y.seen - x.seen)).slice(0, 10).filter((i) => byId[i.pid]);
  // F
  const errs = {}; let errTot = 0;
  for (const d in (P.errs || {})) { if (d >= addDays(t, -29)) for (const c in P.errs[d]) { errs[c] = (errs[c] || 0) + P.errs[d][c]; errTot += P.errs[d][c]; } }
  const errOrder = Object.keys(DIA_LABEL).sort((x, y) => (errs[y] || 0) - (errs[x] || 0));

  $("#stats-body").innerHTML = `
    <div class="st-hero"><div class="big">${n7}<span> av 7 dagar</span></div><div class="cap">den här veckan · ${totalDays} gnuggdag${totalDays === 1 ? "" : "ar"} totalt${totalDays > 1 ? ` · längsta svit ${longestStreak()}` : ""}</div></div>
    <div class="week"><div class="dots">${week.map((d) => `<span class="dot ${P.days[d] ? "on" : ""} ${d === t ? "now" : ""}">${names[new Date(d + "T12:00:00").getDay()]}</span>`).join("")}</div></div>
    <div class="eyebrow">Senaste 18 veckorna</div>
    <div class="heat">${heat}</div>
    <div class="legend">mindre <span class="d"></span><span class="d l1"></span><span class="d l2"></span><span class="d l3"></span><span class="d l4"></span> mer</div>

    <div class="seg wide" id="st-period">${[["week", "Vecka"], ["month", "Månad"], ["all", "Allt"]].map(([v, l]) => `<button data-v="${v}" class="${statsPeriod === v ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="kpis">
      <div class="kpi"><b>${cur.pass}</b><span>pass</span></div>
      <div class="kpi"><b>${cur.n}</b><span>övningar</span></div>
      <div class="kpi"><b>${acc} %${delta(acc, accPrev)}</b><span>träffsäkerhet</span></div>
      <div class="kpi"><b>${fast} %${delta(fast, fastPrev)}</b><span>rätt på tid</span></div>
    </div>

    <div class="card"><h3>Fastnar oftast</h3>
      ${weak.length ? `<div class="wl">${weak.map((i) => `<span>${esc(i.key)}<em>${esc(byId[i.pid].short.toLowerCase())}</em></span>`).join("")}</div>
      <button class="cta sec" id="st-weak">Gnugga just dessa · ${weak.length < 6 ? weak.length * 2 : weak.length} övningar</button>` : `<div class="muted small">Inga svaga ord just nu – allt du gnuggat ligger i högre lådor.</div>`}
    </div>

    <div class="card"><h3>Vad du gör fel · senaste 30 dagarna</h3>
      ${errTot ? `<div class="stack">${errOrder.map((c) => `<i style="width:${100 * (errs[c] || 0) / errTot}%;background:${DIA_LABEL[c][1]}"></i>`).join("")}</div>
      <div class="flist">${errOrder.filter((c) => errs[c]).map((c) => `<div><span class="sw" style="background:${DIA_LABEL[c][1]}"></span>${DIA_LABEL[c][0]}<b>${Math.round(100 * errs[c] / errTot)} %</b></div>`).join("")}</div>
      <div class="muted small">${errs.dia && errs.dia / errTot >= .4 ? "Mest krumelurer: det är tangentbordet, inte grammatiken. Använd knapparna under fältet." : errs.stem && errs.stem / errTot >= .35 ? "Många stamfel: vokalväxlingen (fată → fete) är det som behöver nötas." : errs.form && errs.form / errTot >= .35 ? "Du kan formerna men blandar ihop dem – läs uppgiften en gång till innan du skriver." : `${errTot} fel svar i Böj-övningar analyserade.`}</div>` : `<div class="muted small">Byggs upp när du svarat fel i några Böj-övningar. Fel är råmaterialet här.</div>`}
    </div>`;
  $$("#st-period button").forEach((b) => b.addEventListener("click", () => { statsPeriod = b.dataset.v; renderStats(); }));
  const w = $("#st-weak"); if (w) w.addEventListener("click", () => startSession({ picks: weak.map((i) => ({ pid: i.pid, key: i.key })) }));
}

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
  renderHome(); show("s-home");
  // Splashen ligger kvar minst SPLASH_MIN_MS (som Flippa) så den inte bara flimrar till –
  // och längre vid uppdatering så man hinner läsa vad som händer.
  const splash = $("#splash");
  const minMs = splashUpdated ? SPLASH_MIN_UPDATE_MS : SPLASH_MIN_MS;
  setTimeout(() => { splash.classList.add("hide"); setTimeout(() => splash.remove(), 450); }, Math.max(0, minMs - (performance.now() - bootT0)));
}
const SPLASH_MIN_MS = 700, SPLASH_MIN_UPDATE_MS = 1800;
const bootT0 = performance.now();
let splashUpdated = false;
$("#splash-ver").textContent = APP_VERSION;
try {
  if (sessionStorage.getItem("gnugga-updated")) {
    sessionStorage.removeItem("gnugga-updated"); splashUpdated = true;
    $("#splash-note").textContent = "Uppdaterar till senaste versionen…";
    $("#splash-ver").textContent = ""; // versionsnumret är brus i det läget – det står i Hjälp
  }
} catch (_) {}
boot();
