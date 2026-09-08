"use strict";
/* Användarvänlig versionshistorik (visas i appen: Hjälp → "Vad är nytt" och via
   versionsraden i Inställningar). Kurerade höjdpunkter, INTE varje liten fix.

   VID DEPLOY: när APP_VERSION bumpas för en användarsynlig ändring – lägg till en post
   här överst (nyast först) med en kort, vardaglig rad. Rena interna ändringar behöver
   ingen post. Samma konvention som Flippa.

   Post: { date:"7 september 2026", ver:"v1", items:[ {t, type, hi, ico, desc} ] }
   type: "new" | "improved" | "fixed"   ·   hi: true = höjdpunkt */
const CHANGELOG = [
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
