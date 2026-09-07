# Hur vuxna lär sig grammatik effektivt – forskningsunderlag för "Gnugga"

*Webbresearch 2026-09-07. Syfte: designunderlag för en mobil webbapp som drillar grammatik (verbböjning, bestämd form, adjektivkongruens, kasus), primärt rumänska, som komplement till en glosapp med spaced repetition.*

---

## 1. Explicit vs implicit undervisning för vuxna – vad säger metaanalyserna?

Bilden är ovanligt samstämmig för SLA-fältet: **för vuxna vinner explicit undervisning (regel + riktad övning) över ren implicit exponering**, åtminstone på de mått studierna använder.

- **Norris & Ortega (2000)**, 49 studier 1980–1998: fokuserad grammatikundervisning ger stora effekter; explicit d ≈ 1,13 mot implicit d ≈ 0,54. Effekten höll sig i fördröjda eftertest. Focus on Form (form i kommunikativt sammanhang) och Focus on Forms (isolerad form) gav likvärdiga effekter.
- **Spada & Tomita (2010)**, 41 studier: explicit > implicit för både *enkla* och *komplexa* strukturer – och, viktigt, explicit undervisning förbättrade **både kontrollerad kunskap och spontan användning**. Det motsäger idén att regelkunskap "bara" ger testkunskap.
- **Goo, Granena, Yilmaz & Novella (2015)**, uppdatering av Norris & Ortega med 34 studier: explicit fortfarande överlägset; kombinationen **muntlig + skriftlig** behandling fungerade bäst för båda typerna.
- **Kang, Sok & Han (2019)**, 54 studier, 5 051 inlärare, 1980–2015: total effekt g = 1,06, men här var skillnaden explicit/implicit **liten**; utfallsmåttets typ, startnivå, kontext och intensitet spelade större roll. Vissa sekundärkällor läser ut ett litet implicit-övertag på fördröjda test.
- **Li & Sun (2024)**, 67 samples, 3 754 deltagare: explicit undervisning d ≈ 0,8–1,1; effekten modereras av *typ av övning*, leveranssätt, längd/intensitet och mätmetod.

**Nyanser att ta på allvar:**
1. *Mätbias.* Norris & Ortega påpekade själva att många studier mäter med explicita, otidsbegränsade test som gynnar explicit undervisning. Ellis (2005) visade psykometriskt att otidsbegränsade grammatikalitetsbedömningar och metalingvistiska test laddar på "explicit kunskap", medan tidspressade GJT, elicited imitation och fri muntlig produktion laddar på "implicit/automatiserad kunskap". En app som bara mäter med lugna luckövningar överskattar därför sin egen effekt.
2. *Durabilitet.* Li (2010, om feedback) fann att implicita effekter bevarades bättre över tid än explicita, och Kang et al. (2019) antyder att gapet krymper på fördröjda test. Explicit kunskap som **inte övas in** förfaller.
3. *Barn vs vuxna.* Schmidts noticing-hypotes (1990) hävdar att vuxen grammatikinlärning i praktiken kräver medveten uppmärksamhet på formen; Krashens input-hypotes (att comprehensible input räcker) har svagt empiriskt stöd för vuxna – Lightbown & Spada sammanfattar att "considerable research and experience challenge the hypothesis that comprehensible input is enough". Swains output-hypotes bygger på immersionselever som efter år av input förstod nästan allt men producerade fel grammatik. Rod Ellis "weak interface"-position är den vanligaste mellanvägen: explicit kunskap blir inte direkt implicit, men **den hjälper inläraren att märka mönster i input och att jämföra sin egen output med målformen**.

**Slutsats för Gnugga:** "bara mönsterigenkänning som barn" är inte den effektivaste vägen för vuxna. Kort explicit regel + massiv, varierad övning med feedback är evidensbaserat. Men appen bör också inkludera tidspressade/produktiva format, annars tränas och mäts bara den ena kunskapstypen.

## 2. Skill acquisition theory: deklarativ → procedural → automatiserad

DeKeyser (1997, 2007; DeKeyser & Suzuki 2025) beskriver L2-inlärning som färdighetsinlärning i tre steg: **deklarativ** kunskap (man kan regeln), **procedural** (man kan tillämpa den, men långsamt och med ansträngning) och **automatiserad** (snabbt, korrekt, med lite uppmärksamhet). Övergången sker genom övning och följer samma potensfunktion som andra kognitiva färdigheter.

Tre fynd med direkta designkonsekvenser:

- **Skill-specificitet (DeKeyser 1997).** Deltagare lärde sig fyra morfosyntaktiska regler i ett konstgjort språk och övade sedan 8 veckor. Regler som övats i *förståelse* (välja bild till mening) blev snabba i förståelse men **inte** i produktion, och vice versa. Att träna igenkänning ger alltså inte automatiskt produktionsförmåga. En app som ska ge talförmåga måste låta användaren *producera* formen.
- **Regelläsning är en liten del.** I skill acquisition-paradigmet är deklarativ fas kort: regeln ska vara begriplig och tillgänglig, men den procedurala fasen kräver hundratals reps. Det bekräftas av VanPatten & Oikkenon (1996), som fann att effekten av processing instruction kom från de strukturerade övningarna, **inte** från regelförklaringen. Praktisk tumregel från litteraturen: ~10 % läsa/förstå, ~90 % göra.
- **Proceduralisering gynnas av tät övning, retention av gles.** Suzuki & DeKeyser (2017) tränade japansk morfologi med 1 dags respektive 7 dagars intervall: den täta gruppen blev **lika korrekt och snabbare** (bättre proceduralisering); Suzuki & DeKeyser (2017b) fann dessutom att analytisk förmåga predicerade utfall vid gles övning medan arbetsminne predicerade utfall vid tät. Rogers (2015) och Bird (2010) fann fördel för ≥7 dagar på retention; Kasprowicz, Marsden & Sephton (2019) fann ingen skillnad 3,5 vs 7 dagar hos barn – engagemang i övningen och språkanalytisk förmåga betydde mer. **Sammantaget:** intensiv övning inom en ny struktur de första dagarna, därefter expanderande intervall à la SRS.

**Sekvens för appen:** (1) mini-regel med 2–3 exempel (≤ 30 sek läsning), (2) strukturerad input/igenkänning som tvingar formfokus, (3) kontrollerad produktion (böj, transformera), (4) friare produktion med tidspress, (5) återkommande blandad repetition. Nations "fyra strängar" (2007) ger balansen: språkfokuserad inlärning är *en* av fyra lika stora delar; Gnugga bör explicit positioneras som den strängen och lämna meningsfokuserad input/output till annat material.

## 3. Kognitionspsykologiska principer

- **Retrieval practice / testeffekten.** Roediger & Karpicke (2006): upprepad självtestning slog upprepad läsning en vecka senare (61 % vs 40 %) trots att läsning kändes bättre och gav bättre resultat efter 5 minuter. Pan & Rickard (2018) visar i metaanalys att testeffekten överför till nya format och kontexter. För L2 visar Kang m.fl. att retrieval slår imitation för ordinlärning – och DeKeyser 1997 säger att man bör hämta fram i **det format man vill kunna** (produktion). Igenkänning (välj rätt form) är lättare men bygger mindre.
- **Spacing.** Robust i kognitionspsykologi; för L2-grammatik blandat (se avsnitt 2). Vad som *inte* fungerar är massad "cramming" utan återbesök.
- **Interleaving.** Här är evidensen för grammatik ovanligt stark. **Nakata & Suzuki (2019)**: 115 japanska inlärare, 5 engelska strukturer; interleaving gav flest fel under träning men var bäst på GJT en vecka senare; "blockat först, sedan blandat" låg däremellan. **Pan m.fl. (2019, 2024)**: interleaving förbättrade spanska/franska verbböjning för sju tempus, även olikartade. Rohrer (matematik): interleaving sänkte övningspoäng men tredubblade testpoäng – eftersom eleven måste **välja** strategi, inte bara utföra den. Kornell & Bjork (2008): 78 % av deltagarna trodde blockat var bättre, 78 % lärde sig faktiskt mer av blandat. **Designkonsekvens:** efter en kort introduktionsfas ska appen blanda böjningsmönster (t.ex. -a/-ea/-e/-i-verb, olika kasus, obestämd/bestämd) så att användaren måste identifiera vilket mönster som gäller.
- **Desirable difficulties & generation (Bjork 1994).** Ansträngning som lyckas (generera formen själv, fördröjd repetition, varierade kontexter) stärker minnet; lätta övningar skapar "illusion of competence". Baksidan: för hög felfrekvens hos nybörjare demotiverar – därav sekvensen ovan.
- **Feedback-timing.** Systematisk översikt (Fu & Li 2022, 20 studier): omedelbar feedback var lika bra eller bättre än fördröjd; i textbaserad/CALL-miljö favoriserades omedelbar eller ingen skillnad. För **konceptuell kunskap som grammatik** slog omedelbar fördröjd i experiment. Evidensen är dock svag och inkonsekvent. För en drill-app: ge feedback direkt.
- **Elaborerad feedback.** Van der Kleij m.fl. (2015), metaanalys av datorbaserad feedback: bara rätt/fel (KR) d = 0,05; visa rätt svar (KCR) d = 0,32; **förklaring (EF) d = 0,49**, störst fördel för komplexare kunskap. Inom SLA: Li (2010, 33 studier) medelstor effekt av korrektiv feedback som bestod över tid; Lyster & Saito (2010) – **prompts** (få eleven att själv rätta) gav större effekt än **recasts** (ge rätt svar), tydligast i fri produktion; Lyster & Ranta (1997) – recasts ledde sällan till egen reparation. Ellis m.fl. (2006): metalingvistisk feedback slog recasts. **Konsekvens:** vid fel – låt användaren försöka igen med ledtråd först (prompt), visa sedan rätt svar *och* varför (t.ex. "feminina substantiv på -ă får -a i bestämd form").

## 4. Övningstyper – vad vet vi?

Obs: få studier jämför övningstyper direkt mot varandra i grammatikinlärning; mycket är extrapolering från skill-specificitet och retrieval-forskning.

| Typ | Evidens/kommentar |
|---|---|
| **Luckövning (fill-in)** | Bra kontrollerad produktion om luckan kräver *böjning* (ge infinitiv → producera form), svag om den bara kräver igenkänning. Standardformat i de flesta effektstudier. |
| **Transformation** (sg→pl, presens→perfekt, obest→best) | Produktiv, tvingar tillämpning av regeln; central i skill-acquisition-studier (DeKeyser). Passar interleaving väl. |
| **Strukturerad input / processing instruction (VanPatten)** | Stark evidens för att tolkningsövningar som *tvingar* form-betydelse-koppling (t.ex. "vem gör vad?" när ordföljd/kasus avgör) förbättrar både tolkning och produktion; traditionell output-drill förbättrade bara produktion. Effekten låg i övningarna, inte förklaringen. Bra för kasus, klitiska pronomen och kongruens i rumänska. |
| **Output practice (Swain)** | Pushed output får inläraren att märka luckor och testa hypoteser. Nödvändig för produktionsautomatisering (DeKeyser 1997). |
| **Översättning från L1** | Laufer & Girsai (2008): kontrastiv analys + översättning slog både meningsfokuserad och icke-kontrastiv formfokuserad undervisning för ord/kollokationer. Rimlig att extrapolera till grammatik där L1 och L2 skiljer sig (svenska saknar kasus, har efterställd bestämd artikel precis som rumänska – vilket bör utnyttjas). |
| **Diktamen/transkribering** | Dikta­men korrelerar starkt med generell färdighet och kräver "analysis-by-synthesis" av grammatiken; dictogloss-studier (Yu, Boers & Tremblay 2025) visar att retrieval-momentet predicerar lärande. Bra för att koppla ändelser till ljud, men krävande på mobil. |
| **Grammaticality judgment** | Snabbt och bra som *tidspressat* mått på automatisering (Ellis 2005), men lär mindre än produktion. Använd med tidsgräns och som "felsök meningen"-variant. |
| **Sentence building / ordföljd** | Igenkänning-ish; bra för syntax, svagare för morfologi. Duolingo-formatet; Loewen m.fl. (2019) fann att Duolingo-användare utvecklade skrift bättre än tal. |
| **Chunks/formulaic sequences** (Nation; Boers & Lindstromberg 2012) | Stark koppling till flyt; att lära böjda fraser som helheter ("mi-e foame", "am fost") ger användbara "öar" men ersätter inte regelgeneralisering. Kombinera: frasen som exempel på regeln. |
| **Muntlig produktion** | Goo m.fl. (2015): muntligt + skriftligt bäst. Even tal-in-i-tomma-luften (utan ASR) tvingar snabb framhämtning. |
| **"Cover and recall"** | Klassisk retrieval-teknik; Nation rekommenderar den för deliberate learning. Fungerar för böjningstabeller om man hämtar fram *hela* paradigmet. |

## 5. Duolingo-stil vs lärobok – vad säger studierna?

- **Vesselinov & Grego (2012, Duolingo; 2016, Babbel)**: signifikanta framsteg på WebCAPE, "34 timmar ≈ en universitetstermin". Men: företagsfinansierade, stort bortfall, självselekterat urval, inget kontrollgrupp – svag evidens.
- **Loewen m.fl. (2019)**: 9 erfarna språkforskare lärde turkiska på Duolingo 12 veckor (~29 h). Framsteg korrelerade med tid, men **bara en klarade 70 % på terminstestet**; skriftlig > muntlig förmåga; deltagarna klagade på avsaknad av grammatikförklaringar och kontextlösa meningar.
- **Loewen, Isbell & Sporn (2020/2023)**, Babbel vs Duolingo: **ingen signifikant skillnad i lärande**, men Babbel-användare upplevde appen bättre för grammatik och tal; Duolingo-användare gillade gamification men tröttnade på repetitiva uppgifter. Babbel visade starkare tid-resultat-samband.
- **Jiang m.fl. (2021)**, Duolingo-finansierad: läs-/hörförståelse efter fem sektioner motsvarade ~fyra terminer universitet – mäter dock inte produktion/grammatik.
- **Kim, Payant, Skalicky & Namkung (2026, SSLA)**, 183 nybörjare i franska: klassrum, Duolingo och kombination gav **likvärdiga** framsteg inklusive felkorrigeringstest av grammatik; kombinationen vann endast på pragmatik.
- **Duolingo har sedan 2020-talet lagt till "Tips"/grammatikförklaringar** – appen är inte längre rent implicit, vilket i sig är ett tecken.

**Sammanfattning:** Apparna fungerar för nybörjare och ger mätbara vinster, men det finns **ingen studie som visar att implicit app-drill slår explicit undervisning för grammatik**, och den kvalitativa kritiken pekar konsekvent på brist på förklaringar, kontext och muntlig produktion. Anki-liknande SRS för grammatik saknar i stort sett egna effektstudier; evidensen är indirekt via retrieval- och spacing-litteraturen.

## 6. Motivation och gamification – vad har stöd?

- **Sailer & Homner (2020)**, metaanalys: gamification har små-medelstora positiva effekter på kognitiva och motivationella utfall; **beteendeutfall minst**; rena belöningsmekaniker (poäng, badges) är svagare än design med utmaning, meningsfulla mål och narrativ. Senare metaanalys (2023) fann ökad inre motivation och upplevd autonomi men minimal effekt på kompetens.
- **Streaks** bygger på förlustaversion och ökar retention (Duolingo rapporterar +14 % dag-14-retention av streak-satsningar), men dokumenterade nackdelar: ångest, "performativt lärande" där man gör den lättaste lektionen för att hålla siffran, och monetariserad streak-reparation. Loewen 2019-deltagarna beskrev just detta.
- **Vad som har stöd:** tydliga, självvalda mål (självbestämmandeteori: autonomi, kompetens), synlig **kompetensutveckling** (procent automatiserat per mönster) snarare än poäng, omedelbar informativ feedback, och att koppla övningen till innehåll användaren bryr sig om. Ryan & Deci-baserad forskning visar att kontrollerande belöningar kan underminera inre motivation.
- **Varning för konflikt med desirable difficulties:** gamification som optimerar för "känns bra" (höga träffsäkerhetstal, lätta lektioner) står i direkt motsats till interleaving och retrieval, som *sänker* träningsprestation men höjer lärande. Kornell & Bjork visar att användaren själv kommer föredra det som fungerar sämre.

## 7. Designrekommendationer för Gnugga (evidensbaserade)

1. **Kort explicit regel före övning – max en skärm, 2–3 exempel.** Regeln behövs (Norris & Ortega; Spada & Tomita) men ger inte effekten i sig (VanPatten & Oikkenon). Ha den alltid ett tryck bort under övningen.
2. **≥ 90 % av tiden är övning, inte läsning.** Skill acquisition theory (DeKeyser).
3. **Prioritera produktion över igenkänning.** Ge infinitiv/grundform + kontext, kräv böjd form. Igenkänning ger inte produktionsförmåga (DeKeyser 1997; Roediger & Karpicke).
4. **Inkludera strukturerad input för strukturer där tolkning är problemet** (kasus, klitiska pronomen, ordföljd): övningar där betydelsen bara kan avgöras via formen (VanPatten).
5. **Sekvens: block → ökande blandning → full interleaving.** Blocka bara de första ~10–20 reps av ett nytt mönster, blanda därefter alla aktiva mönster (Nakata & Suzuki 2019; Pan 2024; Rohrer). Låt inte användaren välja "träna bara -a-verb" som standard.
6. **Tät övning vid introduktion, expanderande intervall därefter.** Dag 0–3 flera pass; sedan SRS-intervall per *mönster/regel* och per *lexem* (Suzuki & DeKeyser 2017; Rogers 2015). Dela gärna schemaläggare med glosappen.
7. **Omedelbar feedback, i två steg:** först prompt ("fel ändelse – substantivet är feminint"), sedan rätt svar med kort förklaring (Lyster & Saito 2010; Van der Kleij 2015). Aldrig bara rött/grönt.
8. **Kontrastera med svenska där det hjälper.** Efterställd bestämd artikel (casa→casa, hus→huset) är en likhet att utnyttja; kasus och kongruens är skillnader att peka ut explicit (Laufer & Girsai 2008; Lightbown & Spada).
9. **Kombinera regel och chunk.** Varje regel exemplifieras med 2–3 högfrekventa, färdigböjda fraser som också drillas som helheter (Nation; Boers & Lindstromberg).
10. **Tidspressade läge som mått på automatisering.** Snabb GJT/"rätta felet" och produktion med timer; visa progress som *snabbhet + korrekthet*, inte bara korrekthet (Ellis 2005; Suzuki).
11. **Muntligt moment.** "Säg formen innan du visar" (självbedömning, cover-and-recall) eller ASR om möjligt (Goo m.fl. 2015: muntlig + skriftlig bäst; Loewen 2019: appar underutvecklar tal).
12. **Flera format per regel.** Luck-, transformations-, översättnings- och tolkningsövningar för samma struktur ger transfer (Pan & Rickard 2018) och motverkar mönsterinlärning av *formatet*.
13. **Gamifiera kompetens, inte närvaro.** Visa "automatiserat / proceduralt / nytt" per mönster; sätt självvalda veckomål; om streak används – gör den förlåtande (t.ex. 5 av 7 dagar) och utan betalda reparationer (Sailer & Homner 2020; SDT).
14. **Acceptera och förklara att blandad övning känns svårare.** En rad i onboarding: "Det ska kännas lite jobbigt – det är då det fastnar" (Bjork; Kornell & Bjork 2008).
15. **Mät i appen med både lätta och svåra format** och fatta beslut om innehåll på fördröjda, tidspressade resultat – inte på träffsäkerhet under övning (Norris & Ortega:s metodkritik).

**Var evidensen är svag:** direkta jämförelser av *övningstyper* för grammatik; optimalt spacing-intervall för grammatik (blandat); feedback-timing (få studier, inkonsekventa); appstudier (små urval, ofta företagsfinansierade, kort uppföljning); gamification-effekter på faktiskt lärande snarare än engagemang. Rumänska specifikt är i princip obeforskat – allt ovan är generalisering från engelska, spanska, franska, japanska och konstgjorda språk.

---

## Källor

1. Norris & Ortega (2000). Effectiveness of L2 Instruction. *Language Learning* 50. https://onlinelibrary.wiley.com/doi/abs/10.1111/0023-8333.00136
2. Spada & Tomita (2010). Interactions Between Type of Instruction and Type of Language Feature. *Language Learning* 60. https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-9922.2010.00562.x
3. Goo, Granena, Yilmaz & Novella (2015). Implicit and explicit instruction in L2 learning: Norris & Ortega revisited. https://benjamins.com/catalog/sibil.48.18goo
4. Kang, Sok & Han (2019). Thirty-five years of ISLA on form-focused instruction: A meta-analysis. *LTR* 23. https://journals.sagepub.com/doi/10.1177/1362168818776671
5. Li & Sun (2024). Effects of different forms of explicit instruction on L2 development: A meta-analysis. *FLA* 57. https://onlinelibrary.wiley.com/doi/10.1111/flan.12726
6. DeKeyser (1997). Beyond explicit rule learning: Automatizing L2 morphosyntax. *SSLA* 19. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/beyond-explicit-rule-learning/B71581638BF89873F61F03EA1E747E5A
7. DeKeyser & Suzuki (2025). Skill acquisition theory (preprint). https://yuichisuzuki.net/wp-content/uploads/2025/07/PreprintDeKeyser-R.-M.-Suzuki-Y.-2025.-Skill-acquisition-theory.-In-B.-VanPatten-G.-D.-Keating-S.-Wulff-Eds.-Theories-in-second-language-acquisition-An-introduction-4th-ed.-pp.-157-182-.pdf
8. Suzuki & DeKeyser (2017). Effects of distributed practice on the proceduralization of morphology. *LTR* 21. https://yuichisuzuki.net/wp-content/uploads/2023/04/Suzuki-DeKeyser-2017-LTR.pdf
9. Nakata & Suzuki (2019). Mixing grammar exercises facilitates long-term retention. *MLJ* 103. https://eric.ed.gov/?id=EJ1225042
10. Pan m.fl. (2024). Interleaved practice enhances grammar skill learning for similar and dissimilar tenses in Romance languages. *Learning and Instruction*. https://www.sciencedirect.com/science/article/abs/pii/S0959475224001725
11. Kornell & Bjork (2008). Learning concepts and categories: Is spacing the "enemy of induction"? https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Kornell.Bjork.2008a.pdf
12. Roediger & Karpicke (2006). Test-Enhanced Learning. *Psychological Science*. https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x
13. Pan & Rickard (2018). Transfer of test-enhanced learning: Meta-analytic review. https://pdf.retrievalpractice.org/transfer/Pan_Rickard_2018.pdf
14. Kasprowicz, Marsden & Sephton (2019). Distribution of practice effects for FL verb morphology. *MLJ*. https://onlinelibrary.wiley.com/doi/10.1111/modl.12586
15. Li (2010). The effectiveness of corrective feedback in SLA: A meta-analysis. *Language Learning* 60. https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-9922.2010.00561.x
16. Lyster & Saito (2010). Oral feedback in classroom SLA: A meta-analysis. *SSLA* 32. http://kazuyasaito.net/SSLA2010.pdf
17. Lyster & Ranta (1997). Corrective feedback and learner uptake. *SSLA* 19. https://eric.ed.gov/?id=EJ539354
18. Fu & Li (2022). Optimal timing of treatment for errors in L2 learning – systematic review. https://pmc.ncbi.nlm.nih.gov/articles/PMC9995700/
19. Van der Kleij, Feskens & Eggen (2015). Effects of feedback in a computer-based learning environment: A meta-analysis. *RER*. https://journals.sagepub.com/doi/abs/10.3102/0034654314564881
20. Ellis (2005). Measuring implicit and explicit knowledge of a second language. *SSLA*. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/measuring-implicit-and-explicit-knowledge-of-a-second-language-a-psychometric-study/0708428E45AEA716C06E47ED37785D4E
21. VanPatten & Oikkenon (1996). Explanation versus structured input in processing instruction. *SSLA*. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/explanation-versus-structured-input-in-processing-instruction/CADC0357472A2FF7A8195A3A58A8E602
22. Nation (2007). The Four Strands. https://www.victoria.ac.nz/__data/assets/pdf_file/0019/1626121/2007-Four-strands.pdf
23. Boers & Lindstromberg (2012). Experimental and intervention studies on formulaic sequences in a second language. *ARAL*. https://www.researchgate.net/publication/259428229
24. Laufer & Girsai (2008). Form-focused instruction in L2 vocabulary learning: A case for contrastive analysis and translation. *Applied Linguistics*. https://academic.oup.com/applij/article-abstract/29/4/694/183330
25. Schmidt – Noticing hypothesis (översikt). https://en.wikipedia.org/wiki/Noticing_hypothesis
26. Loewen m.fl. (2019). Mobile-assisted language learning: A Duolingo case study. *ReCALL*. https://eric.ed.gov/?id=EJ1226279
27. Loewen, Isbell & Sporn (2023). MALL with Babbel and Duolingo: comparing L2 learning gains and user experience. *CALL* 38. https://www.tandfonline.com/doi/abs/10.1080/09588221.2023.2215294
28. Kim, Payant, Skalicky & Namkung (2026). Duolingo vs classroom vs combined, beginner French. *SSLA*. https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/comparing-the-effectiveness-of-duolingo-classroom-instruction-and-classroom-duolingo-instruction-conditions-on-beginnerlevel-french-language-development/68C0E7E296669798089C84CDC7F3BB9E
29. Vesselinov & Grego (2012). Duolingo Effectiveness Study. https://theowlapp.health/wp-content/uploads/2022/04/DuolingoReport_Final-1.pdf ; (2016) Babbel Efficacy Study. https://comparelanguageapps.com/reports/Babbel2016study.pdf
30. Sailer & Homner (2020) via Frontiers-studie om gamification i online-språkinlärning (2024). https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1295709/full ; metaanalys 2023 om gamification och inre motivation: https://link.springer.com/article/10.1007/s11423-023-10337-7
31. Systematisk översikt av Duolingo-gamification 2012–2020. https://www.tandfonline.com/doi/full/10.1080/09588221.2021.1933540
32. Lightbown & Spada. *How Languages Are Learned* (4 uppl.). https://books.google.com/books/about/How_Languages_are_Learned_4th_edition_Ox.html?id=5PadBgAAQBAJ
