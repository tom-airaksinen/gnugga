# 🧽 Gnugga

Syskonapp till [Flippa](https://github.com/tom-airaksinen/flippa) för att **gnugga grammatik**:
böja verb, sätta substantiv i bestämd form och plural, få adjektiv att stämma. Mobil-först PWA,
ren HTML/CSS/JS utan ramverk eller byggsteg, driftad på GitHub Pages. Första språk **rumänska**;
fler språk är data, inte kod.

**Live:** https://tom-airaksinen.github.io/gnugga/

## Grundtankar

1. **Kort regel före övning, men ~90 % av tiden är övning.** Regeln är max en skärm och alltid ett tryck bort.
2. **Producera formen, känn inte bara igen den.** Flerval bara som intro till ett nytt mönster; sedan skriver eller säger du formen.
3. **Blanda mönster** när grunden sitter (interleaving). Det känns svårare, och det är meningen.
4. **Feedback i två steg:** ledtråd utan facit → nytt försök → facit + varför.
5. **Säg det högt.** Muntligt + skriftligt slår skriftligt ensamt.
6. **Gamifiera kompetens, inte närvaro:** nivå per mönster (Nytt → Lärt → Övat → Automatiskt) och en förlåtande veckoöversikt i stället för streak.
7. **Facit ur riktig böjningsdata** (Wiktionary), aldrig ur en språkmodell.

Forskningsunderlaget finns i `docs/research-grammatikinlarning.md`, planen i `docs/plan.md`.

## Innehåll (rumänska v1)

| Område | Mönster |
|---|---|
| Substantiv | Bestämd form singular · Plural · Bestämd plural · Genitiv-dativ |
| Verb | Presens (regelbundna grupper) · Oregelbundna kärnverb · Perfekt |
| Adjektiv | Kongruens (adjektivet följer med) |

Lexikon: 700 substantiv, 300 verb, 220 adjektiv med fullständiga böjningsformer, valda efter
frekvens i undertexter. Svenska glosor för alla.

## Övningsformat

| Format | Vad | När |
|---|---|---|
| Välj | flerval | bara första repen av ett nytt mönster |
| Böj | skriv formen (knappar för ă â î ș ț) | huvudformat |
| Säg det | säg högt, visa, bedöm dig själv | var femte övning |
| Rätt eller fel? | fyra sekunder, mäter automatisering | när mönstret är Övat |

## Arkitektur

| Lager | Var |
|---|---|
| App-kod | `index.html`, `style.css`, `app.js` (språkoberoende motor), `sw.js`, `manifest.json` |
| Språk | `data/ro/monster.js` (regler, exempel, generatorer, ledtrådar) + `data/ro/lexikon.json` (böjningsformer) |
| Progress | localStorage per enhet: Leitner-låda per (mönster × ord), nivå per mönster, dagar. Export/import som JSON i Inställningar |
| Changelog | `data/changelog.js`, visas under Inställningar → Vad är nytt |

Ingen backend, ingen inloggning, ingen Firebase: innehållet är kurerat och versionshanterat här.

## Granskning

`granskning.html` (live: https://tom-airaksinen.github.io/gnugga/granskning.html) visar allt språkligt
innehåll för en mänsklig granskare: regeltexter, exempel, 12 genererade övningar per mönster med
ledtrådar och förklaringar, samt hela lexikonet med former och svenska glosor. Granskaren flaggar
rader, skriver anmärkningar och kopierar dem som text (sparas i webbläsaren, ingen server).

## Data-pipeline

```
scripts/bygg-lexikon.py     kaikki.org (Wiktionary) + frekvenslista + scripts/raw/sv-gloss.json → data/ro/lexikon.json
scripts/smoke.sh            rökprov i headless Chrome: spelar igenom pass, rapporterar JS-fel
```

Rådata (`scripts/raw/kaikki-ro.jsonl`, 300 MB, och `ro_50k.txt`) ligger utanför git; URL:er i skriptets docstring.
Licens för data: CC BY-SA 4.0, se `LICENSE-data.md`.

## Publicera uppdateringar

1. Bumpa `APP_VERSION` i `app.js` och `CACHE` i `sw.js`.
2. Användarsynlig ändring? Lägg en post överst i `data/changelog.js`.
3. `bash scripts/smoke.sh` → inga JS-fel.
4. `git add -A && git commit -m "..." && git push` – GitHub Pages uppdateras automatiskt.

## Mappar

- `docs/` – plan, forskningsunderlag, datakällor, öppna frågor
- `mockups/` – den första klickbara prototypen (ersatt av appen)
- `scripts/` – pipeline, ikon-SVG, rökprov
