"use strict";
/* Gnugga – rumänska: grammatikmönster.
   Varje mönster har en regel (≤ 1 skärm), exempel, fördjupning och en generator som gör
   en övning av ett lemma ur lexikonet (data/ro/lexikon.json). Motorn (app.js) är
   språkoberoende; allt rumänskt bor här. Ett nytt språk = ny monster.js + lexikon.json.

   Övning (returneras av gen): {
     q         rubrikrad ("Bestämd form av")
     big       det som ska böjas (html tillåten)
     sub       hjälprad (genus, person, svensk glosa …)
     answer    rätt svar (jämförs normaliserat)
     alts      [] andra godtagbara svar
     full      hela frasen om svaret bara är en del (adjektiv: "case mari")
     say       {sv, ro} för Säg det-övningar
     hint      steg 1-feedback: ledtråd UTAN facit
     why       steg 2-feedback: facit + varför
     distractors  minst 3 fel alternativ (för Välj / Rätt eller fel)
   } */

const RO = (() => {
  const PERS = [
    { ro: "eu", sv: "jag" }, { ro: "tu", sv: "du" }, { ro: "el / ea", sv: "han / hon" },
    { ro: "noi", sv: "vi" }, { ro: "voi", sv: "ni" }, { ro: "ei / ele", sv: "de" },
  ];
  const AUX = ["am", "ai", "a", "am", "ați", "au"];
  const GRP = {
    a: "-a-gruppen (som a cânta: cânt, cânți, cântă…)",
    "a-ez": "-ez-gruppen (som a lucra: lucrez, lucrezi, lucrează…)",
    "i-esc": "-esc-gruppen (som a vorbi: vorbesc, vorbești, vorbește…)",
    i: "-i-gruppen utan -esc (som a dormi: dorm, dormi, doarme…)",
    e: "-e-gruppen (som a merge: merg, mergi, merge…)",
    ea: "-ea-gruppen (som a vedea: văd, vezi, vede…)",
    "î": "-î-gruppen (som a coborî: cobor, cobori, coboară…)",
    irr: "oregelbundet",
  };
  const GENUS = { f: "feminint", m: "maskulint", n: "neutrum" };
  const GENUS_PL = { f: "feminina", m: "maskulina", n: "neutrala" };
  const ART = { f: "o", m: "un", n: "un" };
  const KEYS = ["ă", "â", "î", "ș", "ț"];

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = (arr, not) => { const out = []; for (const x of arr) { if (x && x !== not && !out.includes(x)) out.push(x); } return out; };
  const ro = (s) => `<span class="ro">${s}</span>`;
  const gl = (x) => x.sv || x.en || "";
  const pad3 = (cands, fallback, ans) => { const c = uniq(cands, ans); let i = 0; while (c.length < 3 && i < fallback.length) { if (fallback[i] !== ans && !c.includes(fallback[i])) c.push(fallback[i]); i++; } return shuffle(c).slice(0, 3); };

  /* ---- substantiv: regeltexter per ord ---- */
  function defRule(n) {
    const w = n.w, d = n.f.sgd;
    if (n.g === "f") {
      if (w.endsWith("ă")) return `Feminina på ${ro("-ă")} byter -ă mot ${ro("-a")}: ${w} → ${ro(d)}.`;
      if (w.endsWith("ie")) return `Feminina på ${ro("-ie")} får ${ro("-ia")}: ${w} → ${ro(d)}.`;
      if (w.endsWith("e")) return `Feminina på ${ro("-e")} får ${ro("-ea")}: ${w} → ${ro(d)}.`;
      return `Feminina på ${ro("-a/-ea/-i")} får ${ro("-ua")}: ${w} → ${ro(d)}.`;
    }
    const gn = n.g === "n" ? "Neutrum böjs som maskulint i singular. " : "";
    if (w.endsWith("e")) return `${gn}Maskulina på ${ro("-e")} får ${ro("-le")}: ${w} → ${ro(d)}.`;
    if (w.endsWith("u")) return `${gn}Maskulina på ${ro("-u")} får bara ${ro("-l")}: ${w} → ${ro(d)}.`;
    if (w.endsWith("ă")) return `${gn}Några maskulina slutar på -ă och tar ${ro("-a")} som feminina: ${w} → ${ro(d)}.`;
    return `${gn}Maskulina på konsonant får ${ro("-ul")}: ${w} → ${ro(d)}.`;
  }
  function vowelShift(n) {
    const a = n.w.replace(/.$/, ""), b = n.f.pl.replace(/.$/, "");
    return a !== b && !n.f.pl.startsWith(n.w) && !n.f.pl.startsWith(a);
  }
  function plRule(n) {
    const v = vowelShift(n) ? ` Notera att stammen ändras (${n.w} → ${n.f.pl}) – vokalväxling är vanligt.` : "";
    if (n.g === "f") return `Feminina får oftast ${ro("-e")} eller ${ro("-i")}: ${n.w} → ${ro(n.f.pl)}.${v}`;
    if (n.g === "m") return `Maskulina får ${ro("-i")}: ${n.w} → ${ro(n.f.pl)}.${v}`;
    return `Neutrum får ${ro("-e")} eller ${ro("-uri")} (och beter sig som feminint i plural): ${n.w} → ${ro(n.f.pl)}.${v}`;
  }
  function plDefRule(n) {
    const p = n.f.pl;
    const end = p.endsWith("uri") ? "-uri → -urile" : p.endsWith("e") ? "-e → -ele" : n.g === "f" ? "-i → -ile" : "-i → -ii";
    return `Utgå från pluralen ${ro(p)} och häng på artikeln: ${end} → ${ro(n.f.pld)}.`;
  }
  function gdRule(n) {
    if (n.g === "f") return `Feminina: genitiv-dativ singular ser ut som ${ro("pluralen + -i")}: ${n.f.pl} → ${ro(n.f.gsd)} (${n.f.gsd} = ${gl(n)}ets / till ${gl(n)}et).`;
    return `Maskulina och neutrum: bestämd form ${ro(n.f.sgd)} + ${ro("-ui")} → ${ro(n.f.gsd)} (${gl(n)}ets / till ${gl(n)}et).`;
  }
  function adjForm(a, g, num) { // neutrum: maskulint i sg, feminint i pl
    const fem = g === "f" || (g === "n" && num === "pl");
    return num === "sg" ? (fem ? a.fs : a.ms) : (fem ? a.fp : a.mp);
  }
  const persLabel = (pi) => `${PERS[pi].ro} · ${PERS[pi].sv}`;
  /* Alla riktiga former av lemmat med etikett – motorn använder dem för att säga
     "det är en riktig form, men fel form" i stället för en generell ledtråd. */
  const nounForms = (n) => { const f = {}; f[n.w] = "grundformen (obestämd singular)"; f[n.f.sgd] = "bestämd singular"; f[n.f.pl] = "obestämd plural"; f[n.f.pld] = "bestämd plural"; if (n.f.gsd) f[n.f.gsd] = "genitiv-dativ singular"; if (n.f.gpd) f[n.f.gpd] = "genitiv-dativ plural"; return f; };
  const verbForms = (v) => { const f = {}; v.pres.forEach((x, i) => { if (!f[x]) f[x] = `presens för ${PERS[i].ro}`; else f[x] += ` och ${PERS[i].ro}`; }); f[v.part] = "participet"; f[v.inf.slice(2)] = "infinitiven"; return f; };
  const adjForms = (a) => { const f = {}; f[a.ms] = "maskulin singular"; if (!f[a.fs]) f[a.fs] = "feminin singular"; if (!f[a.mp]) f[a.mp] = "maskulin plural"; if (!f[a.fp]) f[a.fp] = "feminin plural"; return f; };
  const STEM_HINT_N = "Kolla stammen: växlar en vokal (som fată → fete, masă → mese)?";
  const paradigm = (v, pi) => v.pres.map((f, i) => i === pi ? ro(f) : f).join(" · ");
  const svVerb = (v) => gl(v).split(/[,;(]/)[0].trim();
  const svPers = (pi, v) => `${PERS[pi].sv} ${svVerb(v)}`;

  /* ---- mönster ---- */
  const PATTERNS = [
    { id: "n-def", area: "Substantiv", name: "Bestämd form singular", short: "Bestämd form", order: 1,
      rule: `Rumänskan gör som svenskan: <span class="sv">artikeln hängs på slutet</span> av ordet – hus → hus<b>et</b>, casă → cas<b>a</b>.<br><br>
        ${ro("Feminint:")} -ă → -a (casă → casa) · -e → -ea (carte → cartea) · -ie → -ia (familie → familia) · -a → -ua (cafea → cafeaua)<br>
        ${ro("Maskulint & neutrum:")} konsonant → +ul (băiat → băiatul) · -e → +le (frate → fratele) · -u → +l (muzeu → muzeul)`,
      examples: [["casă", "casa", "huset"], ["băiat", "băiatul", "pojken"], ["frate", "fratele", "brodern"]],
      more: `<p>Lär in genus tillsammans med ordet – artikeln avgörs av det. Flippa-tips: skriv <i>casă [f]</i> så syns genuset på kortet utan att läsas upp.</p>
        <p><b>Neutrum</b> är rumänskans specialitet: ordet beter sig som maskulint i singular (<i>un oraș, orașul</i>) men som feminint i plural (<i>două orașe, orașele</i>).</p>
        <p>Bestämd form används oftare än i svenskan. Efter <i>cu</i> ("med") står ordet ofta bestämt, men efter <i>la, în, pe</i> obestämt om inget bestämmer det närmare: <i>la hotel</i>, men <i>la hotelul nostru</i>.</p>`,
      pool: (L) => L.nouns,
      key: (n) => n.w,
      gen(n) {
        const w = n.w, st = w.slice(0, -1);
        const cands = [w + "ul", w + "l", w + "le", st + "a", st + "ea", w + "ua", st + "ia", st + "ul"].filter((x) => x !== w);
        return { q: "Bestämd form av", big: w, sub: `${ART[n.g]} ${w} · ${gl(n)}`, answer: n.f.sgd,
          say: { sv: `${gl(n).split(/[,;]/)[0]} (bestämd form)`, ro: n.f.sgd },
          hint: `Ordet är <b>${GENUS[n.g]}</b> (${ART[n.g]} ${w}). Vilken ändelse får ${GENUS_PL[n.g]} ord som slutar på <b>-${w.endsWith("ie") ? "ie" : w.slice(-1)}</b>?`,
          why: defRule(n), distractors: pad3(cands, [w + "ei", w + "lui"], n.f.sgd), forms: nounForms(n), target: "bestämd singular", stemHint: STEM_HINT_N };
      } },

    { id: "n-pl", area: "Substantiv", name: "Plural obestämd", short: "Plural", order: 2,
      rule: `Pluraländelsen beror på genus:<br><br>
        ${ro("Feminint:")} -ă → -e (casă → case) eller -i (țară → țări)<br>
        ${ro("Maskulint:")} → -i (băiat → băieți, prieten → prieteni)<br>
        ${ro("Neutrum:")} → -e (oraș → orașe) eller -uri (tren → trenuri)<br><br>
        <span class="sv">Se upp för vokalväxling</span> i stammen: fată → f<b>e</b>te, masă → m<b>e</b>se, băiat → băi<b>e</b>ți.`,
      examples: [["casă", "case", "hus (flera)"], ["băiat", "băieți", "pojkar"], ["tren", "trenuri", "tåg (flera)"]],
      more: `<p>Vokalväxlingen (<i>a → e</i>, <i>oa → o</i>, <i>ă → e</i>) är regelbunden men måste nötas per ord. Lär in pluralen som en del av glosan, som tyskans <i>der Mann, die Männer</i>.</p>
        <p>Räkneord: efter 1 står singular (<i>un tren</i>), efter 2–19 plural (<i>două trenuri</i>), från 20 kommer <i>de</i> emellan (<i>douăzeci de trenuri</i>).</p>`,
      pool: (L) => L.nouns,
      key: (n) => n.w,
      gen(n) {
        const w = n.w, st = w.slice(0, -1);
        const cands = [st + "e", st + "i", w + "uri", w + "e", w + "i", st + "uri"].filter((x) => x !== w);
        return { q: "Plural av", big: w, sub: `${ART[n.g]} ${w} · ${gl(n)}`, answer: n.f.pl,
          say: { sv: `flera ${gl(n).split(/[,;]/)[0]}`, ro: n.f.pl },
          hint: `Ordet är <b>${GENUS[n.g]}</b>. ${n.g === "f" ? "Feminina får -e eller -i." : n.g === "m" ? "Maskulina får -i." : "Neutrum får -e eller -uri."}${vowelShift(n) ? " Och kolla om en vokal i stammen växlar." : ""}`,
          why: plRule(n), distractors: pad3(cands, [w + "ă", st + "uri"], n.f.pl), forms: nounForms(n), target: "obestämd plural", stemHint: STEM_HINT_N };
      } },

    { id: "n-pldef", area: "Substantiv", name: "Bestämd form plural", short: "Bestämd plural", order: 3,
      rule: `Ta pluralen och häng på artikeln:<br><br>
        ${ro("-i → -ii")} (băieți → băieții, oameni → oamenii)<br>
        ${ro("-e → -ele")} (case → casele, orașe → orașele)<br>
        ${ro("-uri → -urile")} (trenuri → trenurile)<br>
        ${ro("-i (fem.) → -ile")} (cărți → cărțile, țări → țările)`,
      examples: [["case", "casele", "husen"], ["băieți", "băieții", "pojkarna"], ["trenuri", "trenurile", "tågen"]],
      more: `<p>Två steg: först rätt plural, sedan rätt artikel. Kan du pluralen är bestämd plural nästan mekanisk – därför kommer detta mönster efter Plural.</p>`,
      pool: (L) => L.nouns,
      key: (n) => n.w,
      gen(n) {
        const p = n.f.pl;
        const cands = [p + "le", p + "i", p + "ile", p + "ele", p.slice(0, -1) + "ile", p + "ul"].filter((x) => x !== p);
        return { q: "Bestämd form plural av", big: n.w, sub: `plural: ${p} · ${gl(n)}`, answer: n.f.pld,
          say: { sv: `${gl(n).split(/[,;]/)[0]} (bestämd plural)`, ro: n.f.pld },
          hint: `Utgå från pluralen <b>${p}</b>. Den slutar på <b>-${p.endsWith("uri") ? "uri" : p.slice(-1)}</b> – vilken artikel hör dit?`,
          why: plDefRule(n), distractors: pad3(cands, [p + "lor"], n.f.pld), forms: nounForms(n), target: "bestämd plural", stemHint: `Utgå från pluralen <b>${p}</b> – stammen ska vara som där.` };
      } },

    { id: "v-pres", area: "Verb", name: "Presens – de regelbundna grupperna", short: "Presens", order: 4,
      rule: `Infinitivens slut avgör gruppen, gruppen avgör ändelserna. De fyra vanligaste:<br><br>
        ${ro("-a")} (a cânta): cânt · cânți · cântă · cântăm · cântați · cântă<br>
        ${ro("-a med -ez")} (a lucra): lucrez · lucrezi · lucrează · lucrăm · lucrați · lucrează<br>
        ${ro("-i med -esc")} (a vorbi): vorbesc · vorbești · vorbește · vorbim · vorbiți · vorbesc<br>
        ${ro("-e")} (a merge): merg · mergi · merge · mergem · mergeți · merg<br><br>
        <span class="sv">Genväg:</span> "vi" slutar alltid på <b>-m</b>, "ni" på <b>-ți</b>, och "de" är oftast = "jag".`,
      examples: [["a vorbi, eu", "vorbesc", "jag pratar"], ["a merge, noi", "mergem", "vi går"], ["a lucra, tu", "lucrezi", "du arbetar"]],
      more: `<p>Om ett <i>-a</i>-verb tar <i>-ez</i> eller inte, och om ett <i>-i</i>-verb tar <i>-esc</i>, syns inte på infinitiven – det lärs per verb. Tumregel: nyare och längre verb tar oftast <i>-ez/-esc</i>.</p>
        <p>Personliga pronomen (<i>eu, tu…</i>) utelämnas normalt, som i italienska och spanska. Ändelsen bär personen.</p>
        <p><i>-ea</i>-verb (<i>a vedea</i>) och <i>-i</i>-verb utan <i>-esc</i> (<i>a dormi</i>) finns också men är färre. Flera <i>-e</i>-verb har vokalväxling i 3:e person (<i>a putea: pot – poate</i>).</p>`,
      pool: (L) => L.verbs.filter((v) => v.grp !== "irr"),
      key: (v) => v.inf,
      gen(v) {
        const pi = Math.floor(Math.random() * 6);
        return { q: "Presens av", big: v.inf, sub: persLabel(pi), gloss: gl(v), answer: v.pres[pi],
          alts: pi === 2 && v.inf === "a fi" ? ["e"] : [],
          say: { sv: svPers(pi, v), ro: v.pres[pi] },
          hint: `Verbet hör till <b>${GRP[v.grp]}</b>. Vilken ändelse får <b>${PERS[pi].ro}</b> där?`,
          why: `${v.inf} (${GRP[v.grp].split(" (")[0]}): ${paradigm(v, pi)}`,
          distractors: pad3(v.pres, [v.pres[pi] + "i", v.pres[pi] + "m"], v.pres[pi]), forms: verbForms(v), target: `presens för ${PERS[pi].ro}`, stemHint: "Ändelsen stämmer, men stammen är inte riktigt rätt – flera verb växlar vokal i stammen (a putea: pot – poate)." };
      } },

    { id: "v-irr", area: "Verb", name: "Oregelbundna kärnverb", short: "Oregelbundna", order: 5,
      rule: `Verb du behöver hela tiden och som inte följer mönstren. Lär dem som helheter:<br><br>
        ${ro("a fi")} (vara): sunt · ești · este · suntem · sunteți · sunt<br>
        ${ro("a avea")} (ha): am · ai · are · avem · aveți · au<br>
        ${ro("a vrea")} (vilja): vreau · vrei · vrea · vrem · vreți · vor<br>
        ${ro("a putea")} (kunna): pot · poți · poate · putem · puteți · pot<br>
        ${ro("a lua")} (ta) · ${ro("a da")} (ge) · ${ro("a sta")} (stå, bo) · ${ro("a bea")} (dricka) · ${ro("a ști")} (veta) · ${ro("a veni")} (komma) · ${ro("a mânca")} (äta)`,
      examples: [["a fi, eu", "sunt", "jag är"], ["a avea, noi", "avem", "vi har"], ["a vrea, eu", "vreau", "jag vill"]],
      more: `<p><i>a avea</i> är dubbelt viktigt: det är också hjälpverbet i perfekt (<i>am mâncat</i> = jag har ätit / jag åt).</p>
        <p>Chunks värda att kunna utantill: <i>aș vrea</i> (jag skulle vilja), <i>nu știu</i> (jag vet inte), <i>pot să…?</i> (kan jag…?), <i>mi-e foame</i> (jag är hungrig – bokstavligen "mig är hunger").</p>`,
      pool: (L) => L.verbs.filter((v) => ["a fi", "a avea", "a vrea", "a putea", "a lua", "a da", "a sta", "a bea", "a ști", "a veni", "a mânca", "a duce", "a zice", "a scrie", "a trebui"].includes(v.inf) || v.grp === "irr"),
      key: (v) => v.inf,
      gen(v) {
        let pi = Math.floor(Math.random() * 6);
        if (v.inf === "a trebui") pi = 2; // opersonligt: bara "trebuie"
        return { q: "Presens av", big: v.inf, sub: persLabel(pi), gloss: gl(v), answer: v.pres[pi],
          alts: pi === 2 && v.inf === "a fi" ? ["e"] : [],
          say: { sv: svPers(pi, v), ro: v.pres[pi] },
          hint: `Oregelbundet – ingen ändelseregel hjälper. Tänk på hela raden för <b>${v.inf}</b> och plocka <b>${PERS[pi].ro}</b>.`,
          why: `${v.inf} (${gl(v)}): ${paradigm(v, pi)}`,
          distractors: pad3(v.pres, [v.pres[pi] + "i", v.pres[pi] + "m", v.pres[pi] + "ți"], v.pres[pi]), forms: verbForms(v), target: `presens för ${PERS[pi].ro}`, stemHint: "Slutet stämmer men inte början – oregelbundna verb byter ofta stam helt." };
      } },

    { id: "v-perf", area: "Verb", name: "Perfekt – am făcut", short: "Perfekt", order: 6,
      rule: `Rumänskans vanligaste förflutna tid byggs som svenskans perfekt: <span class="sv">hjälpverb + particip</span>. Hjälpverbet är en kortform av <i>a avea</i>:<br><br>
        ${ro("am · ai · a · am · ați · au")} + particip<br><br>
        am lucrat (jag har arbetat / jag arbetade) · ai mers · a văzut · am fost · ați vorbit · au făcut<br><br>
        Participet: -a → -at (lucrat) · -i → -it (vorbit) · -e/-ea → oregelbundet men lärbart (mers, făcut, văzut).`,
      examples: [["a face, eu", "am făcut", "jag gjorde"], ["a merge, voi", "ați mers", "ni gick"], ["a fi, ei", "au fost", "de var"]],
      more: `<p>Till skillnad från svenskan används perfekt för nästan allt förflutet i talspråk: "jag åt igår" är <i>am mâncat ieri</i>. Du behöver inte imperfekt för att klara resan.</p>
        <p>"Jag" och "vi" har båda <i>am</i>: <i>am fost</i> kan vara både "jag var" och "vi var". Sammanhanget avgör.</p>`,
      pool: (L) => L.verbs,
      key: (v) => v.inf,
      gen(v) {
        let pi = Math.floor(Math.random() * 6);
        if (v.inf === "a trebui") pi = 2;
        const ans = `${AUX[pi]} ${v.part}`;
        return { q: "Perfekt av", big: v.inf, sub: persLabel(pi), gloss: gl(v), answer: ans,
          say: { sv: `${PERS[pi].sv} har ${svVerb(v)} (perfekt)`, ro: ans },
          hint: `Hjälpverbet är <i>a avea</i> i kortform – vilken form hör till <b>${PERS[pi].ro}</b>? Participet av ${v.inf} är <b>${v.part}</b>.`,
          why: `am · ai · a · am · ați · au + <b>${v.part}</b> → ${ro(ans)}`,
          distractors: pad3(AUX.map((a) => `${a} ${v.part}`), [`${AUX[pi]} ${v.inf.slice(2)}`], ans), forms: Object.fromEntries(AUX.map((a, i) => [`${a} ${v.part}`, `perfekt för ${PERS[i].ro}`])), target: `perfekt för ${PERS[pi].ro}`, stemHint: `Hjälpverbet stämmer – kolla participet. Participet av ${v.inf} är <b>${v.part}</b>.` };
      } },

    { id: "adj", area: "Adjektiv", name: "Adjektivet följer med", short: "Adjektiv", order: 7,
      rule: `Adjektivet står <span class="sv">efter</span> substantivet och böjs efter dess genus och numerus – som svenskans <i>stor / stort / stora</i>, men med fyra rutor:<br><br>
        ${ro("bun")} (m sg) · ${ro("bună")} (f sg) · ${ro("buni")} (m pl) · ${ro("bune")} (f pl)<br><br>
        un băiat bun · o fată bună · băieți buni · fete bune<br><br>
        Vissa har färre former: <i>mic · mică · mici · mici</i> (tre) · <i>mare · mare · mari · mari</i> (två).<br>
        <span class="sv">Neutrum</span> tar maskulin form i singular och feminin i plural: <i>un oraș mare, orașe mari</i>; <i>un vin bun, vinuri bune</i>.`,
      examples: [["fete + bun", "fete bune", "bra flickor"], ["oraș + frumos", "oraș frumos", "vacker stad"], ["orașe + frumos", "orașe frumoase", "vackra städer"]],
      more: `<p>Bestämd artikel hamnar på substantivet, inte adjektivet: <i>casa mare</i> (det stora huset), <i>băiatul bun</i>. Sätter man adjektivet först flyttar artikeln dit (<i>marea casă</i>) – ovanligt i vardagligt tal, hoppa över tills vidare.</p>
        <p>Adjektiv på <i>-e</i> (<i>mare, rece, verde</i>) har bara två former. Adjektiv på <i>-esc</i> (<i>românesc</i>) har <i>românească</i> i f sg och <i>românești</i> i plural.</p>`,
      pool: (L) => L.adjs,
      key: (a) => a.ms,
      gen(a, L) {
        const n = pick(L.nouns.slice(0, 250));
        const num = Math.random() < .5 ? "sg" : "pl";
        const nounForm = num === "sg" ? n.w : n.f.pl;
        const ans = adjForm(a, n.g, num);
        const fem = n.g === "f" || (n.g === "n" && num === "pl");
        const forms = [a.ms, a.fs, a.mp, a.fp];
        return { q: "Sätt adjektivet i rätt form", big: `${nounForm} <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>`,
          sub: `(${a.ms}) · ${num === "sg" ? "" : "flera "}${gl(n).split(/[,;]/)[0]}, ${gl(a).split(/[,;]/)[0]}`,
          answer: ans, full: `${nounForm} ${ans}`, acceptFull: true,
          say: { sv: `${num === "sg" ? "" : "flera "}${gl(a).split(/[,;]/)[0]} ${gl(n).split(/[,;]/)[0]}`, ro: `${nounForm} ${ans}` },
          hint: `Substantivet är <b>${GENUS[n.g]}</b>, <b>${num === "sg" ? "singular" : "plural"}</b>.${n.g === "n" ? " Neutrum: maskulint i singular, feminint i plural." : ""} Vilken av adjektivets fyra rutor är det?`,
          why: `${a.ms} har formerna ${forms.join(" · ")}. <b>${nounForm}</b> är ${fem ? "feminin" : "maskulin"} form i ${num === "sg" ? "singular" : "plural"} → ${ro(nounForm + " " + ans)}.`,
          ai: `Varför heter det "${nounForm} ${ans}" på rumänska? Förklara hur adjektivet "${a.ms}" böjs efter substantivet "${n.w}" (${GENUS[n.g]}, ${num === "sg" ? "singular" : "plural"}), och ge tre liknande exempel.`,
          distractors: pad3(forms, [a.ms + "ă", a.ms + "i", a.ms + "e", a.ms.slice(0, -1) + "ă", a.ms.slice(0, -1) + "i"], ans), forms: adjForms(a), target: `${fem ? "feminin" : "maskulin"} ${num === "sg" ? "singular" : "plural"}`, stemHint: `Ändelsen stämmer men stammen ändras – ${a.ms} har formerna ${forms.join(" · ")}.` };
      } },

    { id: "n-gd", area: "Substantiv", name: "Genitiv-dativ – casei, băiatului", short: "Genitiv-dativ", order: 8,
      rule: `Rumänskan har ett kasus för "någons" och "till någon" – <span class="sv">genitiv-dativ</span>. Det syns bara på bestämd form:<br><br>
        ${ro("Maskulint & neutrum:")} bestämd form + -ui: băiatul → băiat<b>ului</b> (pojkens / till pojken), orașul → oraș<b>ului</b><br>
        ${ro("Feminint:")} ser ut som pluralen + -i: casă → case → cas<b>ei</b> (husets / till huset), fată → fete → fet<b>ei</b><br>
        ${ro("Plural (alla):")} -lor: băieți<b>lor</b>, case<b>lor</b><br><br>
        Vardagsanvändning: <i>casa prietenului</i> (vännens hus), <i>îi dau cartea fetei</i> (jag ger boken till flickan).`,
      examples: [["băiat", "băiatului", "pojkens / till pojken"], ["casă", "casei", "husets / till huset"], ["case", "caselor", "husens / till husen"]],
      more: `<p>På en resa kommer du långt med <i>la</i> + bestämd form ("till") och <i>lui/ei</i>. Men skyltar, menyer och namn använder genitiv hela tiden: <i>Piața Unirii</i> (Enighetens torg), <i>Muzeul Satului</i> (Byns museum).</p>
        <p>Före ett namn eller ett obestämt ord används <i>lui</i> i stället: <i>cartea lui Ion</i>, <i>casa lui Maria</i> (i talspråk).</p>`,
      pool: (L) => L.nouns.filter((n) => n.f.gsd && n.f.gpd),
      key: (n) => n.w,
      gen(n) {
        const pl = Math.random() < .3;
        const ans = pl ? n.f.gpd : n.f.gsd;
        const base = pl ? n.f.pld : n.f.sgd;
        const cands = pl ? [n.f.pld + "r", n.f.pl + "lui", n.f.pl + "i", n.f.pld] : [n.f.sgd + "i", n.f.sgd + "lui", n.f.pl + "i", n.f.pl + "ei", n.f.sgd + "ui", n.f.pld];
        const svg = gl(n).split(/[,;]/)[0];
        return { q: pl ? "Genitiv-dativ plural av" : "Genitiv-dativ singular av", big: n.w, sub: `${ART[n.g]} ${n.w} · ${svg} · ${GENUS[n.g]}`,
          answer: ans, say: { sv: `${pl ? "till/av flera " + svg : "till/av " + svg + " (bestämd)"}`, ro: ans },
          ai: `Varför är genitiv-dativ ${pl ? "plural" : "singular"} av "${n.w}" på rumänska "${ans}"? Förklara hur genitiv-dativ bildas för ${GENUS_PL[n.g]} substantiv, när kasuset används i vardagsspråk, och ge tre exempel i meningar.`,
          hint: pl ? `Plural får alltid <b>-lor</b>. Utgå från pluralen <b>${n.f.pl}</b>.` : n.g === "f" ? `Feminint: utgå från <b>pluralen ${n.f.pl}</b> och lägg på -i.` : `${GENUS[n.g]}: utgå från bestämd form <b>${n.f.sgd}</b> och lägg på -ui.`,
          why: pl ? `Plural i genitiv-dativ: ${n.f.pl} + -lor → ${ro(ans)}.` : gdRule(n), distractors: pad3(cands, [n.w + "ului", n.w + "ei"], ans), forms: nounForms(n), target: pl ? "genitiv-dativ plural" : "genitiv-dativ singular", stemHint: n.g === "f" && !pl ? `Utgå från pluralen <b>${n.f.pl}</b> – stammen ska vara som där.` : STEM_HINT_N };
      } },
  ];


  /* ---- Pronomen (obetonade former, före verbet) ---- */
  const PRON_ACC = [
    { k: "mă", sv: "mig", who: "1:a person singular" }, { k: "te", sv: "dig", who: "2:a person singular" },
    { k: "îl", sv: "honom", who: "3:e person singular maskulinum" }, { k: "o", sv: "henne", who: "3:e person singular femininum" },
    { k: "ne", sv: "oss", who: "1:a person plural" }, { k: "vă", sv: "er", who: "2:a person plural" },
    { k: "îi", sv: "dem (männen)", who: "3:e person plural maskulinum" }, { k: "le", sv: "dem (kvinnorna)", who: "3:e person plural femininum" },
  ];
  const PRON_DAT = [
    { k: "îmi", sv: "mig", who: "1:a person singular" }, { k: "îți", sv: "dig", who: "2:a person singular" },
    { k: "îi", sv: "honom / henne", who: "3:e person singular" }, { k: "ne", sv: "oss", who: "1:a person plural" },
    { k: "vă", sv: "er", who: "2:a person plural" }, { k: "le", sv: "dem", who: "3:e person plural" },
  ];
  const SUBJ = [["Maria", "Maria"], ["Ion", "Ion"], ["Chelnerul", "Kyparen"], ["Profesoara", "Läraren"], ["Ghidul", "Guiden"], ["Mama", "Mamma"]];
  const ACC_VERBS = [["vede", "ser"], ["ajută", "hjälper"], ["cunoaște", "känner"], ["așteaptă", "väntar på"], ["caută", "letar efter"], ["sună", "ringer"], ["înțelege", "förstår"], ["cheamă", "ropar på"], ["iubește", "älskar"]];
  // {X} = mottagaren på svenska ("ger {X} boken" → "ger mig boken")
  const DAT_VERBS = [["dă cartea", "ger {X} boken"], ["spune adevărul", "säger {X} sanningen"], ["arată drumul", "visar {X} vägen"], ["trimite un mesaj", "skickar {X} ett meddelande"], ["aduce cafeaua", "kommer med kaffet till {X}"], ["cumpără un bilet", "köper en biljett till {X}"], ["scrie o scrisoare", "skriver ett brev till {X}"], ["explică regula", "förklarar regeln för {X}"]];
  const pronForms = (list) => Object.fromEntries(list.map((p) => [p.k, `${p.sv} (${p.who})`]));

  PATTERNS.push(
    { id: "pron-acc", area: "Pronomen", name: "Objektspronomen – mă, te, îl, o", short: "Ackusativ", order: 9,
      rule: `"Mig, dig, honom, henne…" som objekt har <span class="sv">korta obetonade former som står före verbet</span>:<br><br>
        ${ro("mă")} mig · ${ro("te")} dig · ${ro("îl")} honom · ${ro("o")} henne · ${ro("ne")} oss · ${ro("vă")} er · ${ro("îi")} dem (m) · ${ro("le")} dem (f)<br><br>
        Maria <b>mă</b> vede (Maria ser mig) · Te <b>ajut</b> (jag hjälper dig) · <b>Îl</b> cunosc (jag känner honom) · <b>O</b> aștept (jag väntar på henne)<br><br>
        <span class="sv">Svenskan sätter objektet efter verbet, rumänskan före.</span> Tänk "Maria mig-ser".`,
      examples: [["Maria ___ vede (mig)", "Maria mă vede", "Maria ser mig"], ["Ion ___ cunoaște (henne)", "Ion o cunoaște", "Ion känner henne"], ["Ghidul ___ așteaptă (oss)", "Ghidul ne așteaptă", "Guiden väntar på oss"]],
      more: `<p>De här är de <i>obetonade</i> formerna, de som används nästan alltid. Vill man betona finns långa former med <i>pe</i>: <i>pe mine, pe tine, pe el, pe ea, pe noi, pe voi, pe ei, pe ele</i> – och då står ofta båda: <i>Pe mine mă vede</i> (det är MIG hon ser).</p>
        <p>I perfekt hamnar <i>o</i> efter verbet: <i>am văzut-o</i> (jag såg henne), medan de andra står före: <i>l-am văzut</i> (îl → l- före vokal), <i>te-am sunat</i>. Det drillas inte här ännu.</p>
        <p>Personer som objekt får dessutom <i>pe</i> före namnet: <i>O văd pe Maria</i>. Pronomenet står kvar – rumänskan säger objektet två gånger.</p>`,
      pool: () => PRON_ACC, key: (p) => p.k,
      gen(p) {
        const [s, ssv] = pick(SUBJ), [v, vsv] = pick(ACC_VERBS);
        const full = `${s} ${p.k} ${v}.`;
        return { q: "Fyll i pronomenet", big: `${s} <span class="blank">&nbsp;&nbsp;&nbsp;</span> ${v}.`, sub: `(${p.sv}) · ${ssv} ${vsv} ${p.sv}`,
          answer: p.k, full, acceptFull: true, say: { sv: `${ssv} ${vsv} ${p.sv}`, ro: full },
          hint: `Objektet är <b>${p.sv}</b> – ${p.who}. Den korta ackusativformen står före verbet.`,
          why: `${p.sv} som objekt = ${ro(p.k)} (${p.who}): ${ro(full)}`,
          ai: `Varför är det "${p.k}" i "${full}" på rumänska (${p.sv})? Förklara de obetonade ackusativpronomenen, var de står i satsen, och hur de ändras i perfekt.`,
          distractors: pad3(PRON_ACC.map((x) => x.k).concat(PRON_DAT.map((x) => x.k)), [], p.k), forms: pronForms(PRON_ACC), target: `${p.sv} i ackusativ`, stemHint: "" };
      } },

    { id: "pron-dat", area: "Pronomen", name: "Dativpronomen – îmi, îți, îi", short: "Dativ", order: 10,
      rule: `"Till mig, till dig, till honom…" – den som får något – har egna korta former, också <span class="sv">före verbet</span>:<br><br>
        ${ro("îmi")} mig · ${ro("îți")} dig · ${ro("îi")} honom/henne · ${ro("ne")} oss · ${ro("vă")} er · ${ro("le")} dem<br><br>
        Ion <b>îmi</b> dă cartea (Ion ger mig boken) · <b>Îți</b> spun adevărul (jag säger dig sanningen) · <b>Îi</b> arăt drumul (jag visar honom vägen)<br><br>
        <span class="sv">Vardagens viktigaste:</span> <b>îmi place</b> = jag gillar (bokstavligen "mig behagar"). <i>Îmi place cafeaua. Îți place România?</i><br>
        Obs: <i>ne</i> och <i>vă</i> är samma i ackusativ och dativ. <i>îi</i> är dativ singular men ackusativ plural maskulinum.`,
      examples: [["Ion ___ dă cartea (mig)", "Ion îmi dă cartea", "Ion ger mig boken"], ["Maria ___ spune adevărul (dig)", "Maria îți spune adevărul", "Maria säger dig sanningen"], ["Ghidul ___ arată drumul (dem)", "Ghidul le arată drumul", "Guiden visar dem vägen"]],
      more: `<p>Betonade former: <i>mie, ție, lui, ei, nouă, vouă, lor</i> – används för emfas och ofta tillsammans med den korta: <i>Mie îmi place</i> (JAG gillar det).</p>
        <p>Före ett verb som börjar på vokal, och i perfekt, dras formerna ihop med bindestreck: <i>mi-a dat</i> (han gav mig), <i>ți-am spus</i> (jag sa till dig), <i>i-am arătat</i>. Samma logik, kortare form.</p>
        <p>Känsloutrycken bygger på dativ: <i>mi-e foame</i> (jag är hungrig), <i>mi-e frig</i> (jag är kall), <i>mi-e dor de tine</i> (jag längtar efter dig). Bra chunks för Flippa.</p>`,
      pool: () => PRON_DAT, key: (p) => p.k,
      gen(p) {
        const [s, ssv] = pick(SUBJ), [v, vsv] = pick(DAT_VERBS);
        const full = `${s} ${p.k} ${v}.`;
        const svs = `${ssv} ${vsv.replace("{X}", p.sv)}`;
        return { q: "Fyll i pronomenet", big: `${s} <span class="blank">&nbsp;&nbsp;&nbsp;</span> ${v}.`, sub: `(till ${p.sv}) · ${svs}`,
          answer: p.k, full, acceptFull: true, say: { sv: svs, ro: full },
          hint: `Den som <b>får</b> något är ${p.sv} – ${p.who}. Dativformen står före verbet.`,
          why: `till ${p.sv} = ${ro(p.k)} (dativ, ${p.who}): ${ro(full)}`,
          ai: `Varför är det "${p.k}" i "${full}" på rumänska (till ${p.sv})? Förklara de obetonade dativpronomenen, skillnaden mot ackusativ, och uttryck som "îmi place" och "mi-e foame".`,
          distractors: pad3(PRON_DAT.map((x) => x.k).concat(PRON_ACC.map((x) => x.k)), [], p.k), forms: pronForms(PRON_DAT), target: `${p.sv} i dativ`, stemHint: "" };
      } },
  );

  /* ---- Räkneord + substantiv ---- */
  const NUM = { 3: "trei", 4: "patru", 5: "cinci", 6: "șase", 7: "șapte", 8: "opt", 9: "nouă", 10: "zece", 11: "unsprezece", 13: "treisprezece", 14: "paisprezece", 15: "cincisprezece", 16: "șaisprezece", 17: "șaptesprezece", 18: "optsprezece", 19: "nouăsprezece" };
  const TENS = { 2: "douăzeci", 3: "treizeci", 4: "patruzeci", 5: "cincizeci", 6: "șaizeci", 7: "șaptezeci", 8: "optzeci", 9: "nouăzeci" };
  // fem = substantivet tar feminina räkneordsformer (feminint alltid; neutrum i plural)
  function numPhrase(n, noun) {
    const femPl = noun.g === "f" || noun.g === "n";
    if (n === 1) return `${noun.g === "f" ? "o" : "un"} ${noun.w}`;
    if (n === 2) return `${femPl ? "două" : "doi"} ${noun.f.pl}`;
    if (n === 12) return `${femPl ? "douăsprezece" : "doisprezece"} ${noun.f.pl}`;
    if (n < 20) return `${NUM[n]} ${noun.f.pl}`;
    if (n === 100) return `o sută de ${noun.f.pl}`;
    const t = Math.floor(n / 10), u = n % 10;
    let w = TENS[t];
    if (u === 1) w += ` și ${noun.g === "f" ? "una" : "unu"}`;
    else if (u === 2) w += ` și ${noun.g === "f" ? "două" : "doi"}`;
    else if (u) w += ` și ${NUM[u]}`;
    return `${w} de ${noun.f.pl}`;
  }
  function numWhy(n, noun) {
    const g = GENUS[noun.g];
    if (n === 1) return `Ett = obestämd artikel: ${ro(noun.g === "f" ? "o" : "un")} + singular. Ordet är ${g}.`;
    if (n === 2) return `Två böjs efter genus: ${ro("doi")} för maskulint, ${ro("două")} för feminint – och för neutrum, som är feminint i plural. ${noun.w} är ${g} → ${ro(numPhrase(2, noun))}.`;
    if (n === 12) return `Tolv är "två-mot-tio" och böjs som två: ${ro("doisprezece")} (m) / ${ro("douăsprezece")} (f och neutrum). ${noun.w} är ${g}.`;
    if (n < 20) return `3–19: räkneordet + plural, inget emellan: ${ro(numPhrase(n, noun))}. (11–19 byggs som "x-spre-zece" = x mot tio.)`;
    if (n === 100) return `Hundra är ett substantiv (o sută) och tar ${ro("de")} + plural: ${ro(numPhrase(n, noun))}.`;
    const u = n % 10;
    return `Från 20 kommer ${ro("de")} mellan räkneordet och pluralen: ${ro(numPhrase(n, noun))}.${u === 1 || u === 2 ? ` Slutsiffran ${u} böjs efter genus (${u === 1 ? "unu/una" : "doi/două"}).` : ""}`;
  }
  const NUM_POOL = [1, 1, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 15, 16, 18, 19, 20, 21, 22, 25, 30, 32, 40, 45, 50, 60, 71, 80, 99, 100];

  PATTERNS.push(
    { id: "num", area: "Räkneord", name: "Räkneord + substantiv", short: "Räkneord", order: 11,
      rule: `Tre zoner:<br><br>
        ${ro("1")} = obestämd artikel: <b>un</b> băiat · <b>o</b> fată<br>
        ${ro("2")} böjs efter genus: <b>doi</b> băieți · <b>două</b> fete · <b>două</b> orașe (neutrum är feminint i plural). Samma för 12: doisprezece / douăsprezece<br>
        ${ro("3–19")} + plural, inget emellan: trei case · zece lei · unsprezece copii<br>
        ${ro("20 och uppåt")} + <span class="sv">de</span> + plural: douăzeci <b>de</b> trenuri · treizeci și cinci <b>de</b> lei · o sută <b>de</b> kilometri<br><br>
        11–19 byggs "x mot tio": un-spre-zece, doi-spre-zece … Tiotalen: douăzeci, treizeci, patruzeci, cincizeci, șaizeci, șaptezeci, optzeci, nouăzeci.`,
      examples: [["2 + fată", "două fete", "två flickor"], ["3 + casă", "trei case", "tre hus"], ["25 + tren", "douăzeci și cinci de trenuri", "tjugofem tåg"]],
      more: `<p>Grundtalen 1–10 lär du bäst i Flippa: unu, doi, trei, patru, cinci, șase, șapte, opt, nouă, zece. Gnugga tränar det som kräver en regel: genus på 2 och 12, plural efter 3, och <i>de</i> från 20.</p>
        <p>Ett tal på egen hand (utan substantiv) heter <i>unu</i> och <i>doi/două</i>: <i>Câți? – Doi.</i> Med substantiv blir ett till artikeln <i>un/o</i>.</p>
        <p>Priser: <i>cincisprezece lei</i> (15 lei), <i>douăzeci de lei</i> (20 lei), <i>o sută de lei</i>. <i>Leu</i> (lejon) är valutan – plural <i>lei</i>.</p>
        <p>Klockan använder femininum: <i>ora două</i>, <i>la ora douăsprezece</i>, eftersom <i>oră</i> är feminint.</p>`,
      pool: (L) => L.nouns.slice(0, 250).filter((n) => n.f.pl && !n.f.pl.includes(" ")), key: (n) => n.w,
      gen(n) {
        const num = pick(NUM_POOL);
        const ans = numPhrase(num, n);
        const alt = { ...n, g: n.g === "f" ? "m" : "f" };
        const cands = [numPhrase(num, alt), num >= 20 && num !== 100 ? ans.replace(" de ", " ") : numPhrase(num < 20 ? num + 20 : num - 10 > 2 ? num - 10 : 3, n), num > 1 ? ans.replace(n.f.pl, n.w) : `${n.g === "f" ? "un" : "o"} ${n.w}`, numPhrase(num === 2 ? 12 : num === 12 ? 2 : num === 1 ? 2 : 1, n)];
        return { q: "Skriv talet med substantivet", big: `${num} ${n.w}`, sub: `${ART[n.g]} ${n.w} · ${gl(n)} · ${GENUS[n.g]}`, answer: ans,
          say: { sv: `${num} ${gl(n).split(/[,;]/)[0]}`, ro: ans },
          hint: num === 1 ? `Ett är samma som obestämd artikel. Ordet är <b>${GENUS[n.g]}</b>.` : num === 2 || num === 12 ? `Två (och tolv) böjs efter genus. Ordet är <b>${GENUS[n.g]}</b>${n.g === "n" ? " – och neutrum är feminint i plural" : ""}. Och substantivet ska stå i plural: <b>${n.f.pl}</b>.` : num < 20 ? `Under 20: räkneord + plural, inget emellan. Pluralen av ${n.w} är <b>${n.f.pl}</b>.` : `Från 20 behövs ett litet ord mellan räkneordet och pluralen (<b>${n.f.pl}</b>).${num % 10 === 1 || num % 10 === 2 ? " Slutsiffran böjs efter genus." : ""}`,
          ai: `Varför säger man "${ans}" för ${num} ${gl(n).split(/[,;]/)[0]} på rumänska? Förklara räkneordens regler: un/o, doi/două, plural, och "de" från 20.`,
          why: numWhy(num, n), distractors: pad3(cands, [`${num} ${n.f.pl}`], ans), target: "räkneord + substantiv", stemHint: `Räkneordet stämmer – kolla substantivets form. Pluralen av ${n.w} är <b>${n.f.pl}</b>.` };
      } },
  );

  return { code: "ro", name: "Rumänska", flag: "🇷🇴", tts: "ro-RO", keys: KEYS, patterns: PATTERNS,
    intro: "Rumänska är ett romanskt språk – som italienska och spanska – men med några drag som känns hemma för en svensk: bestämd artikel på slutet av ordet och ett genus (neutrum) som växlar." };
})();
window.GNUGGA_LANG = RO;
