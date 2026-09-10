"use strict";
/* Användarvänlig versionshistorik (visas i appen: Hjälp → "Vad är nytt" och via
   versionsraden i Inställningar). Kurerade höjdpunkter, INTE varje liten fix.

   VID DEPLOY: när APP_VERSION bumpas för en användarsynlig ändring – lägg till en post
   här överst (nyast först) med en kort, vardaglig rad. Rena interna ändringar behöver
   ingen post. Samma konvention som Flippa.

   Post: { date:"7 september 2026", ver:"v1", items:[ {t, type, hi, ico, desc} ] }
   type: "new" | "improved" | "fixed"   ·   hi: true = höjdpunkt */
const CHANGELOG = [
  { date: "10 september 2026", ver: "v25", items: [
    { t: "Mer luft under ikonerna i flikraden, så de inte sitter tätt mot skärmkanten på iPhone.", type: "fixed" },
  ] },
  { date: "10 september 2026", ver: "v24", items: [
    { t: "Ledtrådarna säger riktig svenska igen: \"flera timmar\", \"jag gör\", \"timmens / till timmen\", \"stort hus\". Formerna kommer ur SALDO (Språkbanken) i stället för att appen böjer svenska själv.", type: "improved", hi: true, ico: "🇸🇪", desc: "Alla 700 substantiv, 300 verb och 220 adjektiv har nu svenska böjningsformer. Där en form saknas visas grundformen med etikett, till exempel \"mörker (plural)\"." },
  ] },
  { date: "10 september 2026", ver: "v23", items: [
    { t: "Bort med felaktig svenska i övningarna: det stod \"flera timme\" och \"jag göra\". Nu visas grundformen med en etikett för formen som efterfrågas, till exempel \"timme (plural)\" och \"jag + göra (presens)\".", type: "fixed" },
    { t: "Knappen heter AI-förklaring i stället för AI-kontext.", type: "improved" },
    { t: "Räkneordsövningen räknar inte längre sådant man inte räknar (blod, musik) eller talord (\"1 hundra\").", type: "fixed" },
  ] },
  { date: "9 september 2026", ver: "v22", items: [
    { t: "Nivåerna heter nu Nytt → Övat → Lärt → Automatiskt: Övat betyder att du tränat, Lärt att det sitter.", type: "improved", hi: true, ico: "🎯", desc: "Procent rätt räknas på dina senaste 20 svar i mönstret, så gamla fel drar inte ner dig när du kan det nu." },
    { t: "Startsidan är renare: veckoöversikten (\"3 av 7 dagar\") finns nu bara under Statistik.", type: "improved" },
  ] },
  { date: "8 september 2026", ver: "v19", items: [
    { t: "AI-kontext efter varje svar, som i Flippa: en knapp öppnar Googles AI-läge med en färdig fråga om just den formen – \"Plural av grijă på rumänska är griji – varför?\". Finns även på mönsterskärmen för hela regeln", type: "new", hi: true, ico: "✨",
      desc: "Den statiska regeln räcker oftast, men ibland vill man veta mer: undantag, historia, liknande ord. Frågan är färdigformulerad med ordet, formen och sammanhanget, så det är ett tryck." },
  ]},
  { date: "8 september 2026", ver: "v18", items: [
    { t: "Statistik: dagens ruta i heatmapen klipptes i kanten, och periodvalet Vecka/Månad/Allt syntes knappt mot bakgrunden", type: "fixed" },
    { t: "Mer luft längst ner på alla flikar så det går att scrolla förbi innehållet", type: "improved" },
  ]},
  { date: "8 september 2026", ver: "v17", items: [
    { t: "Tre flikar längst ner som i Flippa: Gnugga, Statistik och Hjälp", type: "new", hi: true, ico: "📊",
      desc: "Statistik visar dagar den här veckan och en heatmap över 18 veckor, pass/övningar/träffsäkerhet/rätt på tid per vecka, månad eller allt, de ord som fastnar oftast med en knapp för att gnugga just dem – och vad du faktiskt gör fel: krumelurer, ändelse, stam eller fel form." },
    { t: "Hjälp har blivit en egen flik, och Vad är nytt samt Innehåll & källor har flyttat dit från Inställningar", type: "improved" },
    { t: "Appen loggar nu feltyp vid varje fel svar i Böj-övningar (grunden för \"Vad du gör fel\")", type: "new" },
  ]},
  { date: "8 september 2026", ver: "v16", items: [
    { t: "Tre nya mönster: objektspronomen (mă, te, îl, o…), dativpronomen (îmi, îți, îi…) och räkneord med substantiv (două fete, trei case, douăzeci de trenuri)", type: "new", hi: true, ico: "🔢",
      desc: "Pronomenen övas i korta meningar med lucka – 'Maria ___ vede (mig)' – eftersom rätt form beror på rollen i satsen. Räkneorden tränar det som kräver en regel: genus på 2 och 12, plural från 3 och 'de' från 20. Själva siffrorna 1–10 lär du bäst i Flippa." },
  ]},
  { date: "8 september 2026", ver: "v15", items: [
    { t: "Konfettin har Flippas glada färger och faller ut i botten i stället för att lägga sig på Klart-knappen", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v14", items: [
    { t: "Mer luft i Säg det-övningen mellan svaret och knapparna", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v13", items: [
    { t: "Konfettin skjuts ut från mitten och studsar mot sidorna i stället för att falla rakt ner", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v12", items: [
    { t: "Knapparna i \"Rätt eller fel?\" är gröna respektive röda med tydliga bock- och krysstecken", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v11", items: [
    { t: "Vid uppdatering ligger startbilden kvar lite längre med texten \"Uppdaterar till …\" så man hinner se vad som händer, i stället för att flimra till", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v10", items: [
    { t: "Ledtråden efter ett fel svar tittar nu på vad som faktiskt blev fel: bara krumelurerna (ă â î ș ț), ett felskrivet tecken, rätt ändelse men fel stam, eller en riktig form av ordet fast fel form", type: "new", hi: true, ico: "🔍",
      desc: "Tidigare kom alltid samma tips om ändelsen, även när ändelsen var rätt och det var ett â som saknades. Nu markeras det tecken som skiljer, utan att facit avslöjas." },
    { t: "Nivån Automatiskt kräver nu också att mönstret övats minst tre olika dagar – en kvälls drill räcker inte, det är spridningen över tid som gör att det sitter", type: "improved" },
    { t: "Klart-knappen på klar-skärmen ligger längst ner, så det blir luftigare (och konfettin får något att landa på)", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v9", items: [
    { t: "Inställningsknappen är ett tydligare kugghjul (såg ut som en sol)", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v8", items: [
    { t: "Konfetti på klar-skärmen, samma fysik som i Flippa: bitarna faller, studsar mot kanterna och lägger sig på Klart-knappen. Mer konfetti när passet gick bra", type: "new", hi: true, ico: "🎉",
      desc: "Ett litet firande gör att man vill komma tillbaka. Följer telefonens inställning för minskad rörelse – då visas ingen konfetti." },
  ]},
  { date: "7 september 2026", ver: "v7", items: [
    { t: "Vad är nytt: jämna marginaler, och flera versioner samma dag visas som en dag", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v6", items: [
    { t: "Klar-skärmen firar med samma ord som Flippa (Grymt!, Nice!, Kanon! …) i stället för \"Blankt!\"", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v5", items: [
    { t: "Kolla-knappen och specialtecknen försvinner när svaret är avgjort, så att bara Fortsätt är kvar. Vid \"Försök igen\" kommer de tillbaka", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v4", items: [
    { t: "Större och tydligare knappar för tillbaka, inställningar och stäng", type: "improved" },
    { t: "Fixat: sidan bakom Inställningar kunde scrolla när man drog i rutan", type: "fixed" },
    { t: "Versionsnumret syns nu på startskärmen, i Inställningar och på splashen", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v3", items: [
    { t: "Standardpasset är nu 12 övningar (var 20). Välj 8, 12 eller 20 i Inställningar – valet sparas på telefonen", type: "improved" },
  ]},
  { date: "7 september 2026", ver: "v2", items: [
    { t: "Det rumänska svaret läses nu upp varje gång du svarar rätt, så att formen fastnar även i örat (kräver rumänsk röst på enheten)", type: "new" },
    { t: "Fixat: dagens prick i veckoraden blev en stor cirkel", type: "fixed" },
  ]},
  { date: "7 september 2026", ver: "v1", items: [
    { t: "Första versionen: rumänsk grammatik med sju mönster – bestämd form, plural, bestämd plural, presens, oregelbundna verb, perfekt och adjektivkongruens", type: "new", hi: true, ico: "🧽",
      desc: "Böjningsformerna kommer från Wiktionary (1 200 ord), så facit är riktigt. Korta regler att läsa, sedan övningar där du skriver eller säger formen själv. Fel svar ger först en ledtråd, sedan facit med förklaring." },
  ]},
];
