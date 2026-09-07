"use strict";
/* Användarvänlig versionshistorik (visas i appen: Hjälp → "Vad är nytt" och via
   versionsraden i Inställningar). Kurerade höjdpunkter, INTE varje liten fix.

   VID DEPLOY: när APP_VERSION bumpas för en användarsynlig ändring – lägg till en post
   här överst (nyast först) med en kort, vardaglig rad. Rena interna ändringar behöver
   ingen post. Samma konvention som Flippa.

   Post: { date:"7 september 2026", ver:"v1", items:[ {t, type, hi, ico, desc} ] }
   type: "new" | "improved" | "fixed"   ·   hi: true = höjdpunkt */
const CHANGELOG = [
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
