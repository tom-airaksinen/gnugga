# Öppna frågor – Gnugga

## Pedagogik
- [x] Ska det finnas läsmaterial eller bara övningar? → **Svar:** Ja, kort regel (≤ 1 skärm) före övning; ~10 % läsa / 90 % göra. Metaanalyserna ger explicit undervisning övertaget för vuxna, men effekten kommer ur övningen. (2026-09-07)
- [x] Blocka eller blanda övningar? → **Svar:** Blocka bara första ~10–15 repen av nytt mönster, sedan interleaving som default (Nakata & Suzuki 2019). (2026-09-07)
- [ ] Hur många övningar per pass känns "lagom" på riktigt – 20? 25? Testa med prototypen.
- [ ] Ska "Säg det" bedömas med taligenkänning (Web Speech API `SpeechRecognition` har ro-RO på iOS?) eller självbedömning räcker?
- [ ] Hur ska "Automatiskt"-läget definieras exakt (90 % rätt på tid i snabbläget, senaste 20 svar)? Behöver kalibreras.
- [ ] Ska passet blanda in Flippa-glosor (kända ord) som bas för böjningarna redan i v1?

## Innehåll
- [x] Vilka lemman i v1-lexikonet? → **Svar:** 700 substantiv, 300 verb, 220 adjektiv efter frekvens i OpenSubtitles (summa minus största formen, för att slippa homografer). Flippa-orden som prioritering är kvar som idé (2026-09-07)
- [ ] Hur hanteras variantformer (căpșuni/căpșune, mânc/mănânc) – acceptera båda, visa den normerade?
- [x] Behöver v1 genitiv-dativ? → **Svar:** Med som åttonde och sista mönster – datan finns ändå och skyltar/namn använder genitiv hela tiden (2026-09-07)

## Teknik
- [x] Firebase eller statiskt innehåll? → **Svar:** Statiskt i repot; innehållet är kurerat, bara progress är personlig. (2026-09-07)
- [x] Egen repo `gnugga` under tom-airaksinen på GitHub Pages? → **Svar:** Ja, publik repo som Flippa, live på tom-airaksinen.github.io/gnugga (2026-09-07). Egen domän (gnugga.tomairaksinen.se) är fortfarande öppen.
- [ ] Rumänsk TTS på iOS: verifiera att Ioana faktiskt finns på din telefon och att `ș`/`ț` läses rätt. (På Mac saknades röst → prototypen läste med engelsk röst. Appen läser nu bara upp om en rumänsk röst finns, annars döljs 🔊.)
- [ ] Är kaikki:s språkspecifika dump (markerad DEPRECATED) stabil nog, eller ska pipelinen läsa den stora rådumpen? (Fungerade 2026-09-07, 311 MB.)

## Design
- [x] Färgtema? → **Svar:** Mint-accent (#3fcfa8) på mörk botten, så apparna går att skilja på hemskärmen (2026-09-07)
- [ ] Ska Gnugga ha profiler som Flippa (Hedvig/Harry), eller är det bara din app?

## Efter v1 (nytt 2026-09-07)
- [ ] GoatCounter för Gnugga (egen sajt gnugga.goatcounter.com) när appen delas med andra. `track()` finns som stubb i app.js.
- [ ] Flippa-koppling: länk "Gnugga grammatiken" från rumänska ämnet, och prioritera Flippa-orden i Gnuggas lemma-val.
- [ ] Verifiera på iPhone: tangentbordets ă â î ș ț-knappar vs iOS rumänska tangentbord, och att `enterkeyhint="done"` funkar.
- [ ] Rätt eller fel?-övningen: 4 sekunder – för kort/långt? Ska den mätas som "på tid" även för Böj under 7 s?
- [ ] Alternativa former: `e` för `este` accepteras; fler behövs? (t.ex. `mânc/mănânc`, `căpșuni/căpșune`)
- [ ] Konjunktiv med `să` (sub3 finns redan i lexikonet) och framtid `o să` som mönster 9–10.
- [ ] Kvalitetssäkring av rumänskan: granskningssidan (`granskning.html`) skickad till någon? Anmärkningar tillbaka → rätta i `sv-gloss.json`, `monster.js`, blocklistan i pipelinen.

## Språkligt innehåll (upptäckt 2026-09-10)
- [x] Svenska ledtrådar böjdes maskinellt och blev fel ("flera timme", "jag göra")? → **Svar:** Lexikonet har bara grundformer, så appen slutade böja svenska. Nu visas grundform + etikett: "timme (plural)", "jag + göra (presens)". Naturlig svenska kräver svensk morfologi (t.ex. SALDO från Språkbanken, CC BY) i pipelinen (2026-09-10)
- [ ] Ska vi hämta svenska böjningsformer (SALDO) så ledtrådarna kan bli "flera timmar" i stället för "timme (plural)"?
- [ ] Adjektivövningen parar ihop slumpmässiga ord och ger orimliga fraser ("telefonisk fågel", "tät son"). Begränsa adjektivpoolen till egenskapsadjektiv?
- [ ] Glosor som är fraser eller fragment ("telefon-", "slant; pl. pengar") ser skräpiga ut i övningarna. Städa i sv-gloss.json?
- [ ] Dativmeningarna blir stela för tredje person ("Läraren säger honom / henne sanningen"). Egna svenska mallar per pronomen?
- [ ] Pluralövningen böjer även mängdord (întuneric → întunericurile). Formerna finns i Wiktionary men känns konstiga – spärra även i plural?
