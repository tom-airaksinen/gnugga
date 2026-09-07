# Öppna frågor – Gnugga

## Pedagogik
- [x] Ska det finnas läsmaterial eller bara övningar? → **Svar:** Ja, kort regel (≤ 1 skärm) före övning; ~10 % läsa / 90 % göra. Metaanalyserna ger explicit undervisning övertaget för vuxna, men effekten kommer ur övningen. (2026-09-07)
- [x] Blocka eller blanda övningar? → **Svar:** Blocka bara första ~10–15 repen av nytt mönster, sedan interleaving som default (Nakata & Suzuki 2019). (2026-09-07)
- [ ] Hur många övningar per pass känns "lagom" på riktigt – 20? 25? Testa med prototypen.
- [ ] Ska "Säg det" bedömas med taligenkänning (Web Speech API `SpeechRecognition` har ro-RO på iOS?) eller självbedömning räcker?
- [ ] Hur ska "Automatiskt"-läget definieras exakt (90 % rätt på tid i snabbläget, senaste 20 svar)? Behöver kalibreras.
- [ ] Ska passet blanda in Flippa-glosor (kända ord) som bas för böjningarna redan i v1?

## Innehåll
- [ ] Vilka ~800 lemman ska in i v1-lexikonet – frekvenslista, Flippa-orden, eller båda?
- [ ] Hur hanteras variantformer (căpșuni/căpșune, mânc/mănânc) – acceptera båda, visa den normerade?
- [ ] Behöver v1 genitiv-dativ alls för en resa, eller räcker "la + bestämd form"?

## Teknik
- [x] Firebase eller statiskt innehåll? → **Svar:** Statiskt i repot; innehållet är kurerat, bara progress är personlig. (2026-09-07)
- [ ] Egen repo `gnugga` under tom-airaksinen på GitHub Pages (`tom-airaksinen.github.io/gnugga`)? Egen domän som Flippa?
- [ ] Rumänsk TTS på iOS: verifiera att Ioana faktiskt finns på din telefon och att `ș`/`ț` läses rätt.
- [ ] Är kaikki:s språkspecifika dump (markerad DEPRECATED) stabil nog, eller ska pipelinen läsa den stora rådumpen?

## Design
- [ ] Färgtema: teal/mint som prototypen, eller närmare Flippas blå?
- [ ] Ska Gnugga ha profiler som Flippa (Hedvig/Harry), eller är det bara din app?
