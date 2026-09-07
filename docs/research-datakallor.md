# Research: datakällor, API:er och TTS för en rumänsk grammatikdrill-PWA

*Datum: 2026-09-07. Underlag: ca 17 webbsökningar samt direkta kontroller (curl/HEAD) av filer och API:er.*

## Sammanfattning / rekommendation för v1

1. **Böjningsdata:** Bygg en **offline-pipeline** (Python-skript) som filtrerar **kaikki.org:s Wiktionary-extraktion** till ett kompakt eget JSON (ett par MB) som checkas in i repot och levereras statiskt från GitHub Pages. Komplettera med **UniMorph ron** som andra källa/facit. Licens: **CC BY-SA** → attribuera Wiktionary + kaikki i appen.
2. **Exempelmeningar:** Tatoeba (CC BY 2.0 FR) via custom export ro↔en/ro↔sv, förbearbetat offline. API:et `api.tatoeba.org/v1/sentences` finns för uppslag on-demand.
3. **LLM:** Använd LLM **endast offline** i byggsteget för att generera förklaringar/luckmeningar, och **verifiera varje böjd form mot kaikki/UniMorph** innan den hamnar i appen. Om live-anrop ändå behövs: Gemini Flash-Lite free tier eller OpenRouter via **Cloudflare Worker** (gratis, 100 000 req/dag) så att nyckeln inte ligger i klienten.
4. **TTS:** Web Speech API med `lang="ro-RO"` (iOS har rösten *Ioana*), med fallback-knapp "ingen röst tillgänglig".
5. **Läsmaterial:** Wikipedia *Romanian nouns / Romanian verbs / Romanian grammar* (CC BY-SA 4.0), Wiktionary-appendix (CC BY-SA) och Peace Corps *Romanian Grammar Workbook* (public domain, 11 enheter med övningar).

---

## A) Datakällor för böjningsformer

### A1. kaikki.org / wiktextract (REKOMMENDERAD PRIMÄRKÄLLA)

- **URL:** https://kaikki.org/dictionary/Romanian/index.html → fil `kaikki.org-dictionary-Romanian.jsonl` (**297 MB** okomprimerad JSONL, en JSON-post per rad). Extraherad 2026-09-06 ur enwiktionary-dump 2026-09-02, uppdateras löpande. Per-ord-JSON finns också, t.ex. `https://kaikki.org/dictionary/Romanian/meaning/c/ca/casă.jsonl` (5 kB).
- **Obs:** de språkspecifika filerna är markerade *DEPRECATED* och kan försvinna; alternativet är den fullständiga `raw-wiktextract-data.jsonl.gz` (2,7 GB gz / 23 GB) som filtreras på `lang_code == "ro"`. Skriv pipeline-skriptet så att det klarar båda. (`/dictionary/downloads/ro/ro-extract.jsonl.gz` som rawdata-sidan antyder ger idag 404.)
- **Omfattning rumänska:** 125 224 ordformer; ~75 000 substantivbetydelser, ~20 600 adjektiv, ~17 200 verb.
- **Dataformat (verifierat):** varje post har `word`, `pos`, `lang_code`, `senses[]` (glosses på engelska), `head_templates[]`, `inflection_templates[]` och `forms[]`. Varje form är `{"form": "casei", "tags": ["dative","definite","genitive","singular"], "source": "declension"}`. Exempel *casă*: 19 forms (casă/casa/case/casele/casei/caselor/caso med taggar för kasus, bestämdhet, numerus, vokativ). Verbet *merge*: 46 forms, taggar som `first-person`, `present`, `imperfect`, `simple perfect` (pluperfect), `subjunctive`, `imperative`, `negative`, `participle`, `gerund`. Alternativa pluraler ligger som separata forms (`căși`, `căsi`, `căsuri`) – filtrera på `source: declension` för att bara ta tabellformerna.
- **Bonus:** `inflection_templates.args` innehåller de "råa" paradigmparametrarna (`nsi/nsd/npi/npd/gsi/gsd/gpi/gpd/vs/vp` för substantiv; `ro-conj-e` med stam för verb) → enkelt att bygga egen 8-cells-tabell och att klassificera verb i konjugationsgrupper (templates `ro-conj-a-ez`, `ro-conj-i-esc`, `ro-conj-e`, `ro-conj-ea-ut` …). Se https://en.wiktionary.org/wiki/Appendix:Romanian_verb_conjugation.
- **Licens:** Wiktionary-innehåll = **CC BY-SA 3.0/4.0 + GFDL**; wiktextract-koden MIT. Kravet: nämn Wiktionary/kaikki.org och länka licensen; egna datafiler som avleds måste också vara CC BY-SA.
- **Storleksuppskattning för appen:** ca 2 000 vanligaste lemman × ~30 former ≈ 60 000 former → **~1–2 MB JSON (200–400 kB gzip)**. Ryms lätt i en PWA-cache.

### A2. UniMorph ron (SEKUNDÄR / FACIT)

- **URL:** https://github.com/unimorph/ron (fil `ron`, TSV `lemma \t form \t taggar`). Verifierat: **84 673 rader, 4 406 lemman** – 1 216 verb (42 560 finita former + particip + gerundium), 2 314 substantiv (21 903 former), 875 adjektiv (13 371 former). Taggar i UniMorph-schema, t.ex. `N;NOM/ACC;SG;DEF`, `V;IND;PST;1;SG;PRF`, `V;SBJV;PRS;2;SG` (formen innehåller `să`), `V;NEG;IMP;2;SG` (`nu …`).
- **Källa** är Wiktionary, **licens CC BY-SA 3.0**. Utmärkt som andra källa för att korsvalidera kaikki och LLM-utdata; nackdel: gammal (5 commits), känd förväxling av genus i adjektivtaggarna (se `gravat` där FEM/NEUT ser omkastade ut) – lita på kaikki vid konflikt.

### A3. Apertium apertium-ron

- **URL:** https://github.com/apertium/apertium-ron – `apertium-ron.ron.dix` (**3,4 MB XML**), enligt Apertium-wikin 22 230 poster och 909 paradigm (2018). **Licens GPL** – går att använda som generator i ett *offline*-skript utan att smitta appen, men att kompilera lttoolbox till JS/WASM (Emscripten) för klientkörning är dåligt dokumenterat och drar GPL in i frontend-koden. **Rekommendation:** hoppa över i v1; ev. senare för att generera former för ord som saknar tabell i Wiktionary. Alternativ FST: https://github.com/giellalt/lang-ron (HFST, GPLv3), samma invändningar.

### A4. Dexonline

- Databasdump: https://dexonline.ro/static/download/dex-database.sql.gz (**~379 MB**, uppdateras dagligen – verifierat 2026-09-07). MySQL-dump med tabellerna `Lexeme`, `InflectedForm`, `Inflection`; det finns även ett XML-exportprotokoll (wiki.dexonline.ro, "Protocol de exportare a datelor v5"). **Licens GPL** för definitionerna och stora delar av databasen. Inget officiellt REST-API; tredjepartsskrapare finns. Bästa och mest kompletta rumänska böjningsdatan (bl.a. DOOM-normerad) men GPL + storlek + rumänskspråkig ontologi gör den till **v2-kandidat** för kvalitetskontroll snarare än v1-källa.

### A5. Övriga

- **MULTEXT-East 4.0**: https://www.clarin.si/repository/xmlui/handle/11356/1041 – `wfl-ro.txt.gz`, **2,13 MB, 428 194 rader** (form / lemma / MSD-kod), **CC BY-SA 4.0**. Kompakt "ordform → lemma + MSD"-lexikon; bra för att automatiskt tagga Tatoeba-meningar och välja luckor. MSD-koderna kräver en avkodningstabell.
- **UD_Romanian-RRT** (RoRefTrees): https://github.com/UniversalDependencies/UD_Romanian-RRT – 9 523 meningar, 218 511 tokens, CC BY-SA 4.0, FEATS med Case/Definite/Gender/Number. Genrer: litteratur, juridik, medicin – för svåra meningar för nybörjardrill, men bra för att hitta autentiska exempel på t.ex. genitiv-dativ.
- **Tatoeba**: nedladdning https://tatoeba.org/en/downloads (custom export "alla meningar i språk A med översättning till språk B", TSV). API: https://api.tatoeba.org (OpenAPI på `/openapi.json`), stabil endpoint `GET /v1/sentences?lang=ron&trans:lang=swe&q=...&sort=relevance&limit=…`, filter `is_native`, `has_audio`, `word_count`. **Licens CC BY 2.0 FR** (del av korpusen CC0) → visa attribution per mening (användarnamn) om ni återpublicerar. Ro–sv-paren är få; ro–en är flera tiotusen.
- **Wiktionary-API direkt från browsern:** fungerar med `origin=*` (`https://en.wiktionary.org/w/api.php?action=parse&page=casă&prop=wikitext&format=json&origin=*`), behandlas som anonym. Nya globala ratelimits 2026: oidentifierade requests 10 req/min, **browserrequests 200 req/min**. Går för enstaka uppslag men inte för bulk – därav offline-pipeline.

---

## B) LLM-API för att generera övningar/förklaringar

**Priser sept 2026 (USD per miljon tokens, in/ut):**

| Modell | In | Ut | Gratisnivå | Direkt från browser? |
|---|---|---|---|---|
| Claude Haiku 4.5 | 1,00 | 5,00 | nej (batch −50 %, cache −90 %) | Ja, med header `anthropic-dangerous-direct-browser-access: true` |
| Gemini 2.5 Flash-Lite | 0,10 | 0,40 (pensioneras 2026-10-16; 3.1 Flash-Lite 0,25/1,50) | **Ja: Flash-Lite 15 RPM / 1 000 req/dag, Flash 10 RPM / 250 req/dag** (försvinner om man slår på fakturering) | Nej (CORS blockerat) |
| GPT-5 mini / nano | 0,25 / 0,05 | 2,00 / 0,40 | nej | Ja |
| Mistral Small 3/4 | 0,10–0,15 | 0,30–0,60 | begränsad free tier | osäkert |
| Groq (Llama etc.) | ~0,05+ | – | **30 RPM, 6 000 TPM, 14 400 req/dag** | SDK kräver `dangerouslyAllowBrowser` |
| OpenRouter `openrouter/free` | 0 | 0 | ja, roterande gratismodeller | **Ja**, CORS tillåtet |

**CORS/nyckelhantering:** Allt som anropas direkt från en GitHub Pages-sida exponerar API-nyckeln. Två rimliga mönster: (a) "bring your own key" – användaren klistrar in egen nyckel (lagras i localStorage), funkar med OpenAI/Anthropic/OpenRouter; (b) **Cloudflare Worker** som proxy (gratis: 100 000 req/dag, 10 ms CPU) med nyckeln som secret + enkel ratelimit per IP. (b) är rätt val om appen ska delas.

**Kvalitet på rumänsk morfologi:** Forskning (OpenLLM-Ro, RoLLM, GMTW-Ro-benchmarken) visar att generella LLM:er är märkbart svagare på rumänska än engelska (specialtränade rumänska modeller vinner 3–9 %), och GMTW-Ro tvingades bygga en **regelbaserad morfologigenerator** för att alls kunna matcha genitiv/dativ-former i modellsvar. Erfarenhetsmässigt hallucinerar små modeller särskilt: genitiv-dativ på feminina substantiv (*casei* vs *casii*), oregelbundna pluraler (*ouă*, *căpșuni/căpșune*), perfectul simplu och konjunktiv 3:e person. **Rekommendation:** förgenerera **offline** med en starkare modell (Sonnet/GPT-5-klass, batch-API), låt modellen bara producera *lemma + grammatisk beskrivning + mening med placeholder*, och sätt in själva formen från kaikki-data programmatiskt; kör dessutom en valideringspass som kastar meningar där någon ordform inte finns i kaikki/UniMorph/MULTEXT-East. Live-LLM bara för "förklara varför jag hade fel"-funktionen, via Worker.

---

## C) TTS för rumänska

- **Web Speech API på iOS Safari:** iOS levererar rösten **Ioana (ro-RO)** (Nuance-baserad, finns i Default- och Enhanced-kvalitet under Inställningar → Hjälpmedel → Uppläst innehåll). I Safari räcker `new SpeechSynthesisUtterance(text); u.lang = "ro-RO"` – systemet väljer Ioana. Fällor: `getVoices()` kan returnera tomt/ofullständigt tills `voiceschanged` fyrar; enbart förinstallerade röster exponeras; uppläsning stoppar när Safari går till bakgrunden; måste triggas av användarinteraktion. Kvalitet: fullt begriplig, något robotisk i Default; bra nog för drill.
- Android/Chrome: Google TTS har ro-RO om språkpaketet är installerat; desktop Chrome saknar ofta rumänska → visa hjälptext.
- **Gratis moln-alternativ** (om enhetens röst saknas): Google Cloud TTS (1 M tecken/mån gratis standardröster, ro-RO Wavenet finns – kräver nyckel → via Worker), Microsoft Edge/Azure neural *ro-RO-AlinaNeural/EmilNeural* (0,5 M tecken/mån gratis). Förgenerera hellre MP3 för de ~2 000 lemman offline och lägg i repot (~10–20 MB) än att anropa live.

---

## D) Öppna grammatikkällor för läsmaterial

| Källa | URL | Licens | Kommentar |
|---|---|---|---|
| Wikipedia *Romanian grammar*, *Romanian nouns*, *Romanian verbs* | https://en.wikipedia.org/wiki/Romanian_nouns m.fl. | CC BY-SA 4.0 | Bästa fria översikten av kasus, artiklar, plural, konjugationer. Kan skrivas om till svenska, kräver attribution + samma licens. |
| Wiktionary-appendix | https://en.wiktionary.org/wiki/Appendix:Romanian_nouns (+ /Masculine, /Feminine, /Neuter), Appendix:Romanian_adjectives, Appendix:Romanian_verb_conjugation | CC BY-SA | Konkreta paradigmtabeller som matchar kaikki-taggarna. |
| Wikibooks *Romanian* | https://en.wikibooks.org/wiki/Romanian | CC BY-SA 4.0 | I praktiken stub (uttal, fraser, siffror); litet värde. |
| Wikiversity *Romanian Language/Grammar* | https://en.wikiversity.org/wiki/Romanian_Language/Grammar | CC BY-SA | Tunn. |
| Peace Corps *Romanian Grammar Workbook* (1996) + FSI/DLI Romanian | https://www.livelingua.com/course/peace-corps/Romanian_Grammar_Workbook | **Public domain** (US-myndighet) | 11 enheter med förklaringar och övningar – kan användas fritt, även som mall för övningstyper. |
| romanianpod101, learnro.com, Talkpal, mylanguages | – | proprietära | Endast inspiration, kopiera ej. |

---

## E) Befintliga appar – lärdomar

- **Cooljugator** (https://cooljugator.com/ro): bygger på Wiktionary (CC BY-SA), automatgenererat, erkänner själva fel; har ett enkelt konjugationsspel. Bra: exempelmeningar per form, engelska glossor. Dåligt: ingen progression/SRS.
- **Verbix**: rena textabeller, anekdotiska fel (*a trebui*). Bara uppslag, ingen drill.
- **Reverso Conjugator**: har inte rumänska bland de 10 språken.
- **Clozemaster**: Tatoeba-baserade luckmeningar med TTS; gratis 30 meningar/dag; bra flow men ingen grammatisk styrning (man kan inte välja "bara genitiv-dativ") och riktar sig till medel/avancerad nivå.
- **Duolingo/Mondly** har rumänska men grammatik är implicit. **Nischen som saknas:** riktad drill per grammatiskt fenomen (bestämd artikel, G-D, plural, konjunktiv), med facit från Wiktionary-data, SRS och gratis offline – precis vad en PWA kan fylla.

## Konkret v1-paket

- `data/ro-forms.json` (~1–2 MB): 2 000 lemman från kaikki, filtrerat på `source in {declension, conjugation}`, normaliserade taggar, `template`-namn för att gruppera övningar. Licensfil `LICENSE-data.md` (CC BY-SA, attribution Wiktionary + kaikki.org).
- `data/ro-sentences.json`: Tatoeba ro–en (+ ro–sv där det finns) taggat med MULTEXT-East för luckval; attribution per mening.
- `data/explanations/*.md`: egna texter på svenska, med Wikipedia/Wiktionary som källa (CC BY-SA) och PC Workbook (PD).
- Valfritt: Cloudflare Worker `llm-proxy` för "förklara"-knappen (Gemini Flash-Lite free tier eller OpenRouter free), ratelimit per IP.
