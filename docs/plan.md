# 🧽 Gnugga – plan & spec

Syskonapp till Flippa för att **gnugga grammatik**: böja verb, sätta substantiv i bestämd
form och plural, få adjektiv att stämma. Mobil-först PWA på GitHub Pages, ren HTML/CSS/JS,
inga ramverk. Första språk: **rumänska** (Rumänien-resa höstlovet v44, 26 okt–1 nov 2026).
Byggd så att fler språk är data, inte kod.

> **Lokal mapp:** `Projekt/gnugga`. **Underlag:** `docs/research-grammatikinlarning.md`
> (vad forskningen säger) och `docs/research-datakallor.md` (data, API:er, licenser).
> **Öppna frågor:** `docs/oppna-fragor.md`. **Prototyp:** `mockups/gnugga-prototyp.html`.

---

## 1. Vad forskningen säger – och vad det betyder för appen

Sammanfattning av `research-grammatikinlarning.md`. Det ovanliga är hur samstämmig
litteraturen är på huvudfrågan.

### 1.1 Läsa regler eller bara mönsterigenkänning? → Kort regel, sedan massiv övning

Din instinkt håller. Alla stora metaanalyser (Norris & Ortega 2000, Spada & Tomita 2010,
Goo m.fl. 2015, Li & Sun 2024) ger **explicit undervisning** (regel + riktad övning) övertaget
för vuxna, och Spada & Tomita visar att effekten når även spontan användning, inte bara
testresultat. "Bara pattern recognition som barn" har svagt stöd för vuxna; Schmidts
noticing-hypotes säger att vuxna behöver *märka* formen medvetet.

Men två nyanser som styr designen:

- **Regeln ger inte effekten – övningen gör det.** VanPatten & Oikkenon (1996) tog bort
  förklaringen och fick samma resultat av bara övningarna. DeKeysers skill acquisition theory:
  deklarativ kunskap (kan regeln) → procedural (kan tillämpa, långsamt) → automatiserad
  (snabbt, utan att tänka). Övergången kräver hundratals reps. **Tumregel: ~10 % läsa, ~90 %
  göra.** Så: ja, läsmaterial – men max en skärm per regel, och alltid ett tryck bort under
  övningen.
- **Igenkänning ger inte produktion** (DeKeyser 1997). Tränar man "välj rätt form" blir man
  bra på att välja rätt form. Vill man kunna *säga* "casa" måste man *producera* "casa".
  Därför är flervalsfrågor bara ett intro-format i Gnugga; huvudformatet är att skriva/säga
  formen själv.

### 1.2 Kognitionsprinciper med starkt stöd

| Princip | Evidens | I Gnugga |
|---|---|---|
| **Retrieval practice** – hämta fram slår läsa om | Roediger & Karpicke 2006, Pan & Rickard 2018 | Alla övningar kräver att man producerar formen, inte läser den |
| **Interleaving** – blanda mönster i stället för att blocka | Nakata & Suzuki 2019 (grammatik!), Pan 2024 (verbböjning), Rohrer | Blocka bara de första ~10–15 repen av ett nytt mönster, sedan blandas alla aktiva mönster. Användaren måste *välja* regel, inte bara utföra den |
| **Spacing** – tätt först, glesare sedan | Suzuki & DeKeyser 2017, Rogers 2015 | Flera pass första dagarna för ett nytt mönster, sedan expanderande intervall (Leitner som i Flippa) |
| **Feedback i två steg** – prompt före facit | Lyster & Saito 2010, Van der Kleij 2015: rätt/fel d=0,05, förklaring d=0,49 | Fel svar → ledtråd ("substantivet är feminint") → nytt försök → facit + *varför* |
| **Omedelbar feedback** | Fu & Li 2022 | Direkt efter varje svar |
| **Desirable difficulties** | Bjork; Kornell & Bjork 2008: 78 % tror blockat är bättre, 78 % lär sig mer av blandat | Blandat pass är default. Onboarding säger rakt ut: "Det ska kännas lite jobbigt" |
| **Muntligt + skriftligt bäst** | Goo m.fl. 2015; Loewen 2019 (appar underutvecklar tal) | "Säg det"-format: säg formen högt, visa, bedöm dig själv |
| **Kontrast mot L1** | Laufer & Girsai 2008 | Svenska och rumänska har båda **efterställd bestämd artikel** (hus→huset, casă→casa) – utnyttja likheten. Kasus och kongruens är skillnader – peka ut dem |
| **Chunks + regel** | Nation, Boers & Lindstromberg 2012 | Varje regel har 2–3 färdigböjda högfrekventa fraser som exempel och som drillas som helheter |
| **Tidspress mäter automatisering** | Ellis 2005, Suzuki | "Snabbläge": rätt/fel på tid. Progress = korrekthet *och* hastighet |

### 1.3 Duolingo-stil vs lärobok

Appstudierna (Loewen 2019, Loewen m.fl. 2023, Kim m.fl. 2026) visar att apparna fungerar
för nybörjare, men ingen visar att implicit drill slår explicit för grammatik, och kritiken
är konsekvent: för lite förklaring, för lite kontext, för lite tal. Duolingo har själva lagt
till grammatiktips. Nischen som saknas: **riktad drill per grammatiskt fenomen med facit ur
riktig böjningsdata, SRS och offline** – det är Gnugga.

### 1.4 Gamification

Sailer & Homner 2020: poäng/badges är svagast, utmaning + meningsfulla mål starkast. Streaks
ökar retention via förlustaversion men ger ångest och "performativt lärande" (göra lättaste
lektionen för siffran). **Gamifiera kompetens, inte närvaro:** visa hur mycket per mönster
som är automatiserat. Om streak: förlåtande (5 av 7 dagar). Lagom, som Flippa.

### 1.5 Var evidensen är svag

Direkta jämförelser av övningstyper, optimalt spacing för grammatik, feedback-timing.
Rumänska är i praktiken obeforskat; allt är generalisering. Så: bygg mätning in i appen
(fördröjd, tidspressad korrekthet per mönster) och justera efter egna data.

---

## 2. Pedagogisk modell

### 2.1 Innehållsstruktur

```
Språk                 Rumänska
  └─ Område           Substantiv · Verb · Adjektiv · Pronomen · Fraser
       └─ Mönster     t.ex. "Bestämd form: feminina på -ă → -a"
            ├─ Regel          ≤ 1 skärm, 3–5 rader + kontrast mot svenska
            ├─ Exempel        3 ord/fraser med 🔊
            ├─ Fördjupning    valfri, utfällbar (undantag, varför, historik)
            └─ Övningar       genereras ur lexikonet + mönstrets generator
```

Ett **mönster** är den minsta enheten för SRS. Flippas "lektion" motsvarar ungefär ett område;
Flippas "ord" motsvarar ett mönster × ett lexem.

### 2.2 Fem övningsformat (v1)

| Format | Typ | När | Exempel |
|---|---|---|---|
| **Välj** | igenkänning | bara intro (första ~5 repen) | casă → bestämd form? `casa` / `casă` / `casei` |
| **Böj** | produktion | huvudformat | "a merge, vi" → skriv `mergem` |
| **Transformera** | produktion | huvudformat | "o casă mare" → plural → `case mari` |
| **Rätt eller fel?** | tidspressad GJT | snabbläge, mätning | "băiatul frumoasă" – 3 sek – ✗ |
| **Säg det** | muntlig cover-and-recall | 1 av 5 övningar | "Säg: vi pratar" → visa `vorbim` → rätt/fel själv |

Senare (v2+): strukturerad input à la VanPatten för kasus och klitiska pronomen
("Vem ger vad till vem?"), diktamen med TTS, översättning av korta meningar.

### 2.3 Ett pass (~5 min, 20–25 övningar)

1. **Uppvärmning** (5): blandad repetition av förfallna mönster.
2. **Nytt mönster** (om något är dags): regel (30 sek) → 5 Välj → 8 Böj blockade.
3. **Blandning** (10): alla aktiva mönster blandade, mest Böj/Transformera, 2 Säg det.
4. **Klar-skärm**: per mönster vad som stärktes, nytt automatiseringsläge, ett tips.

Feedback: rätt → grönt + ev. kort "bra, och notera att…". Fel → **steg 1** ledtråd utan facit
→ nytt försök → **steg 2** facit + regelrad + knapp "Visa regeln".

### 2.4 SRS: Leitner per mönster × lexem, plus mönsternivå

- **Per uppgift (mönster × lexem):** Leitner-lådor som i Flippa; fel → låda 1.
- **Per mönster:** aggregerat läge **Nytt → Lärt → Övat → Automatiskt**, där Automatiskt
  kräver ≥ 90 % rätt *i snabbläget* de senaste 20 svaren. Det är det som visas som progress.
- **Introduktion:** nytt mönster dag 0, repeteras dag 1, 2, 4, 8… (tätt först).
- **Blandning:** passet väljer uppgifter ur alla aktiva mönster, viktat mot förfallna och
  svaga. Användaren kan välja "bara detta mönster", men default är blandat och appen säger
  varför.

---

## 3. Arkitektur

| Lager | Var | Kommentar |
|---|---|---|
| App-kod | GitHub Pages, ren HTML/CSS/JS, PWA | Samma stack och konventioner som Flippa (sw.js-cache, `APP_VERSION`, changelog, GoatCounter) |
| **Lexikon per språk** | `data/ro/lexikon.json`, statiskt i repot | Genereras offline ur kaikki.org (Wiktionary) – se §4. ~1–2 MB för 2 000 lemman |
| **Mönster + regeltexter** | `data/ro/monster.js` | Handskrivna på svenska, med generator-funktion per mönster |
| Progress (SRS) | localStorage | Som Flippa. Export/import som JSON |
| Synk mellan enheter | – i v1 | Behövs inte: innehållet är statiskt i repot, bara progress är personlig. Firebase kan läggas till senare för synk |
| TTS | Web Speech API `ro-RO` | iOS har rösten Ioana. Fallback: dölj 🔊 |
| LLM | **inte i appen** i v1 | Används offline i byggsteget (§4.3). Ev. "Förklara mer"-knapp via Cloudflare Worker i v2 |

**Skillnad mot Flippa:** Flippa behöver Firebase för att innehållet är användarskapat och
delat. I Gnugga är innehållet kurerat och versionshanterat i git – enklare, offline från
start, inga kvoter.

**Flerspråkighet:** övningsmotorn är språkoberoende och jobbar på normaliserade taggar
(`def`, `pl`, `1sg`, `pres`, `m/f/n`…). Ett nytt språk = ny lexikonfil ur kaikki (finns för
alla Wiktionary-språk) + ny mönsterfil. Italienska är naturligt språk nr 2 (finns redan i
Flippa).

---

## 4. Data

### 4.1 Böjningsformer – kaikki.org (Wiktionary) → eget kompakt JSON

- Källa: `https://kaikki.org/dictionary/Romanian/` (JSONL, 297 MB, ~125 000 former).
  Verifierat format: varje ord har `forms[]` med `{form, tags[], source}` samt
  `inflection_templates` med paradigmnamn (`ro-conj-a-ez`, `ro-conj-i-esc` …) – det ger
  gratis klassificering av verb i böjningsgrupper.
- Pipeline (Python, `scripts/bygg-lexikon.py`): filtrera på frekvenslista (2 000 vanligaste),
  ta bara `source in {declension, conjugation}`, normalisera taggar, skriv `lexikon.json`.
- Andra källa/facit: **UniMorph ron** (84 673 rader, 4 406 lemman) för korsvalidering.
- Licens **CC BY-SA** → attribution i appen ("Böjningsdata från Wiktionary via kaikki.org")
  och `LICENSE-data.md`.

### 4.2 Exempelmeningar – Tatoeba

CC BY 2.0 FR, custom export ro↔en (ro↔sv är tunt). Tagga med MULTEXT-East (CC BY-SA) för
att hitta meningar som innehåller en viss form. v1.5, inte v1.

### 4.3 LLM: offline, verifierat, aldrig som facit

LLM:er är mätbart sämre på rumänska än engelska och hallucinerar särskilt genitiv-dativ,
oregelbundna pluraler och konjunktiv. Därför:

- Regeltexter, ledtrådar och förklaringar skrivs **med Claude i byggsteget** och läses
  igenom av dig.
- Luckmeningar genereras med placeholder (`{{casă:def}}`) och formen sätts in **programmatiskt
  ur lexikonet**. Varje ordform i en mening valideras mot kaikki/UniMorph; annars kastas
  meningen.
- Live-LLM bara för ev. "Förklara mer om just det här felet" i v2, via Cloudflare Worker
  (gratis 100 000 req/dag) med Gemini Flash-Lite free tier eller Haiku 4.5.

### 4.4 Läsmaterial

Egna svenska texter, med Wikipedia *Romanian nouns/verbs/grammar* (CC BY-SA), Wiktionary-
appendix och Peace Corps *Romanian Grammar Workbook* (public domain) som källor.

---

## 5. Innehåll v1 – rumänska inför v44

Prioriterat efter vad du behöver för att *prata* på resan.

**Substantiv**
1. Bestämd form singular: m/n på konsonant → *-ul* (băiat→băiatul), på -u → *-l*, på -e → *-le*
   (frate→fratele); f på -ă → *-a* (casă→casa), på -e → *-ea* (carte→cartea), på -a/-ea → *-ua*
2. Plural obestämd: f -ă→-e/-i (casă→case, țară→țări), m -i (băiat→băieți), n -e/-uri
   (oraș→orașe, tren→trenuri) – inklusive vokalväxlingar (fată→fete, masă→mese)
3. Bestämd plural: -ii / -ele / -urile / -ile
4. (v1.5) Genitiv-dativ: casei, băiatului, caselor

**Verb**
5. Presens: fyra huvudgrupper *-a* (cânt), *-a/-ez* (lucrez), *-i/-esc* (vorbesc), *-e* (merg)
   + *-ea* (văd), *-i* (dorm)
6. Oregelbundna kärnverb: a fi, a avea, a vrea, a putea, a lua, a da, a sta, a ști, a bea
7. Perfekt (perfectul compus): am/ai/a/am/ați/au + particip
8. (v1.5) Konjunktiv med *să*, framtid med *o să*/*voi*

**Adjektiv**
9. Kongruens: 4-forms (bun/bună/buni/bune), 3-forms (mic/mică/mici), 2-forms (mare/mari)
10. Placering efter substantivet + bestämd artikel på substantivet (*casa mare*, *băiatul bun*)

**Fraser (chunks)** som exemplifierar varje regel: *mi-e foame*, *cât costă?*, *aș vrea*…

---

## 6. Etapper

| Etapp | Innehåll | Klar |
|---|---|---|
| **0. Prototyp** | Klickbar mock med 6 mönster och alla fem övningsformat, riktig rumänska, localStorage. Testa känslan på iPhone | ✅ 7 sep (denna session) |
| **1. Datapipeline** | kaikki → `lexikon.json` för ~800 lemman (de i din Flippa-rumänska + frekvenslista). UniMorph-validering | v38 |
| **2. Riktig app v1** | Egen repo `gnugga`, PWA-skal från Flippa (sw, version, changelog, GoatCounter), motor + SRS, mönster 1–3 & 5–6 & 9–10, TTS | v39–40 |
| **3. Innehåll v1 klart** | Mönster 7, fraser, snabbläge, Klar-skärm, hjälp/"Grundtankar" | v41–42 |
| **4. Använd på riktigt** | Daglig gnuggning inför resan; justera intervall och blandning efter egna data | v42–44 |
| **v1.5** | Genitiv-dativ, konjunktiv, Tatoeba-meningar, Flippa-koppling (§7) | efter resan |
| **v2** | Strukturerad input, diktamen, "Förklara mer" via Worker, språk nr 2 (italienska) | 2027 |

---

## 7. Koppling till Flippa

- **Länk från Flippa:** "Gnugga grammatiken" på ämnesskärmen för språkämnen.
- **Gnugga orden du redan kan:** exportera rumänska ord ur Flippa (finns i Firebase) och
  låt Gnugga prioritera dem i övningarna. Känt ordförråd → all kognitiv kraft på böjningen.
  Det är en riktig pedagogisk poäng, inte bara integration.
- **Gemensam SRS-schemaläggare:** samma Leitner-intervall så beteendet känns igen.
- **Två appar, inte en flik.** Olika mentalt läge (nöta ord vs gnugga regler), olika datamodell,
  och Flippa har redan 310 kB app.js. Delad känsla via tema och konventioner.

---

## 8. Att distribuera till andra

Samma resonemang som för Flippa: innehåll statiskt → inga driftkostnader, ingen inloggning,
GoatCounter för att se om någon använder det. Attribution CC BY-SA för Wiktionary-data.
Rumänska grammatikdrill på svenska med riktigt facit finns inte – nischen är tom
(Clozemaster kan inte filtrera på grammatik, Cooljugator har ingen progression, Duolingo är
implicit).
