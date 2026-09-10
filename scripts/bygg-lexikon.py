#!/usr/bin/env python3
"""Bygger data/ro/lexikon.json ur kaikki.org:s Wiktionary-extraktion för rumänska.

Indata (scripts/raw/, ej i git):
  kaikki-ro.jsonl   https://kaikki.org/dictionary/Romanian/kaikki.org-dictionary-Romanian.jsonl
  ro_50k.txt        https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ro/ro_50k.txt
  sv-gloss.json     (valfri) handskrivna svenska glosor {"casă":"hus", "a merge":"gå, åka", ...}

Utdata: data/ro/lexikon.json – kompakt, bara det appen behöver.
Licens: Wiktionary-innehåll är CC BY-SA; attribution finns i appen och i LICENSE-data.md.

Kör:  python3 scripts/bygg-lexikon.py
"""
import json, re, os, sys, datetime
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "..", "data", "ro", "lexikon.json")

N_NOUNS, N_VERBS, N_ADJS = 700, 300, 220

# ---------- frekvens (ordformer → summeras per lemma) ----------
freq = {}
with open(os.path.join(RAW, "ro_50k.txt"), encoding="utf-8") as f:
    for line in f:
        parts = line.split()
        if len(parts) == 2:
            freq[parts[0]] = int(parts[1])

def lemma_freq(forms):
    """Summa över lemmats distinkta former MINUS den största. Ett riktigt lemma har flera
    frekventa former (casă/casa/case/casele); en homograf med ett funktionsord (verbet
    "a la" vs prepositionen "la") bärs av en enda form och faller då bort."""
    fs = sorted((freq.get(x, 0) for x in set(forms) if x), reverse=True)
    if len([x for x in fs if x > 0]) < 2:
        return 0
    return sum(fs[1:])

# Verbgrupper: kaikki-mallnamn → appens grupper
GRP = {"a": "a", "a-ez": "a-ez", "i-esc": "i-esc", "i": "i", "e": "e", "e-ut": "e", "e-s": "e", "e-t": "e", "e-pt": "e",
       "2": "ea", "ea": "ea", "ea-ut": "ea", "î": "î", "î-ăsc": "î"}

# Particip som också är riktiga adjektiv (behålls trots att de är verbformer)
ADJ_PARTICIP_OK = {"mort", "trecut", "deschis", "închis", "obosit", "căsătorit", "cunoscut", "interesat",
                   "plăcut", "mulțumit", "îngrijorat", "pierdut", "ocupat", "supărat", "grăbit", "bolnav",
                   "îndrăgostit", "speriat", "rezervat", "fript", "copt", "prăjit", "umplut", "răcit"}

# Homografer/varianter som frekvenslistan ändå lyfter fram fel
BLOCK = {"jur", "oară", "seamă",  # lever bara i fasta uttryck (în jur, prima oară, a-și da seama)
         "fie", "ie", "ziuă", "ara", "par", "car", "mai", "dar", "mină", "undă", "eră", "voie", "și", "in",
         "mi", "do", "mic", "mică", "haină", "ală", "problem", "imagină", "steauă", "suroră", "politie", "arat",
         "scap", "sef", "actă", "stelă", "fost", "cec", "următor", "strigă", "normală", "dragă", "prim", "accept",
         "rahat", "penis", "porcărie", "nenorocit", "nenorocită", "sex", "sân", "vită", "tară", "moară", "duce",
         "flor", "dac", "căsătoresc", "fuga", "cura", "alega", "fericita", "făta", "secreta", "mâna", "dura",
         "descurca", "certa", "paria", "mărita", "preface", "americană", "tipă", "mută", "albă", "militară",
         "posibil", "bun", "rău", "drept", "întreg", "tânăr", "personal", "negru", "alb", "general", "criminal",
         "iubit", "iubită", "fericită", "proastă", "frumoasă", "tânără", "bătrână", "copilă", "nebună", "sfântă",
         "asistentă", "prietenă", "bunică", "regină", "colegiu", "ton", "pas", "post", "vie", "primă", "medie",
         "parcă", "apar", "discută", "privată", "bilă", "sculă"}
# Ordklassvisa undantag: ord som blockeras som substantiv men är fina adjektiv/verb (hanteras nedan)
BLOCK_POS = {"noun": BLOCK, "adj": BLOCK - {"bun", "rău", "drept", "întreg", "tânăr", "personal", "negru", "alb",
                                             "general", "criminal", "posibil", "iubit", "mic", "următor", "fost", "prim"},
             "verb": BLOCK - {"duce"}}
GLOSS_SKIP = ("female equivalent", "alternative form", "alternative spelling", "obsolete")

svgloss = {}
p = os.path.join(RAW, "sv-gloss.json")
if os.path.exists(p):
    svgloss = json.load(open(p, encoding="utf-8"))

WORD_RE = re.compile(r"^[a-zăâîșț]+$")

def gloss_of(d):
    for s in d.get("senses", []):
        tags = s.get("tags") or []
        if any(t in tags for t in ("obsolete", "archaic", "dated", "rare", "regional", "vulgar", "slang")):
            continue
        g = (s.get("glosses") or [""])[0]
        if g:
            g = re.sub(r"\([^)]*\)", "", g).strip(" ,;")
            g = re.sub(r"^to ", "", g)
            g = g.split(";")[0].strip()
            if len(g) > 40:
                g = g[:37].rsplit(" ", 1)[0] + "…"
            return g
    return ""

def has_bad_sense_tag(d, bad):
    tags = set()
    for s in d.get("senses", []):
        for t in s.get("tags") or []:
            tags.add(t)
    return bool(tags & bad)

nouns, verbs, adjs = {}, {}, {}

with open(os.path.join(RAW, "kaikki-ro.jsonl"), encoding="utf-8") as f:
    for line in f:
        d = json.loads(line)
        w = d.get("word", "")
        pos = d.get("pos")
        if pos not in ("noun", "verb", "adj"):
            continue
        if not WORD_RE.match(w) or w in BLOCK_POS.get(pos, BLOCK):
            continue
        if has_bad_sense_tag(d, {"obsolete", "archaic", "vulgar", "offensive", "derogatory"}) and len(d.get("senses", [])) <= 1:
            continue
        infl = d.get("inflection_templates") or []
        forms = d.get("forms") or []
        raw_gloss = ((d.get("senses") or [{}])[0].get("glosses") or [""])[0].lower()
        if raw_gloss.startswith(GLOSS_SKIP):
            continue

        if pos == "noun":
            if w in nouns:
                continue
            head = (d.get("head_templates") or [{}])[0].get("args", {})
            g = head.get("1", "")
            if g not in ("m", "f", "n"):
                continue
            args = next((t.get("args", {}) for t in infl if t.get("name") == "ro-decl-noun"), None)
            if not args:
                continue
            nsi, nsd, npi, npd = args.get("nsi"), args.get("nsd"), args.get("npi"), args.get("npd")
            gsd, gpd = args.get("gsd"), args.get("gpd")
            if not (nsi and nsd and npi and npd and nsi == w):
                continue
            if any(" " in x or "/" in x or "-" in x for x in (nsd, npi, npd)):
                continue
            nouns[w] = {"w": w, "g": g, "en": gloss_of(d),
                        "f": {"sgd": nsd, "pl": npi, "pld": npd, "gsd": gsd or "", "gpd": gpd or ""},
                        "_fq": lemma_freq([nsi, nsd, npi, npd, gsd, gpd])}

        elif pos == "verb":
            if w in verbs:
                continue
            tmpl = next((t.get("name", "") for t in infl if t.get("name", "").startswith("ro-conj")), "")
            if not tmpl:
                continue
            grp = GRP.get(tmpl.replace("ro-conj-", ""), "irr")
            # Ta första förekomsten av varje tagg-kombination = primära tabellen
            first = {}
            for fm in forms:
                if fm.get("source") != "conjugation":
                    continue
                key = tuple(sorted(fm.get("tags") or []))
                if key not in first:
                    first[key] = fm["form"]
            def pick(*tags):
                key = tuple(sorted(tags))
                return first.get(key)
            pres = [pick("first-person", "indicative", "present", "singular"),
                    pick("indicative", "present", "second-person", "singular"),
                    pick("indicative", "present", "singular", "third-person"),
                    pick("first-person", "indicative", "plural", "present"),
                    pick("indicative", "plural", "present", "second-person"),
                    pick("indicative", "plural", "present", "third-person")]
            part = pick("participle", "past")
            if not all(pres) or not part:
                continue
            sub3 = pick("present", "singular", "subjunctive", "third-person") or ""
            imp2 = pick("imperative", "second-person", "singular") or ""
            ger = pick("gerund") or ""
            inf = "a " + w
            verbs[w] = {"inf": inf, "grp": grp, "tmpl": tmpl, "en": gloss_of(d), "pres": pres, "part": part,
                        "sub3": sub3.replace("să ", ""), "imp2": imp2, "ger": ger,
                        "_fq": lemma_freq(pres + [part, sub3.replace("să ", ""), ger, w])}

        elif pos == "adj":
            if w in adjs:
                continue
            first = {}
            for fm in forms:
                if fm.get("source") not in ("declension", "inflection"):
                    continue
                tags = set(fm.get("tags") or [])
                tags.discard("error-unrecognized-form")
                key = tuple(sorted(tags))
                if key not in first:
                    first[key] = fm["form"]
            def pa(*tags):
                return first.get(tuple(sorted(tags)))
            ms = pa("indefinite", "masculine", "neuter", "singular") or pa("indefinite", "masculine", "singular")
            fs = pa("feminine", "indefinite", "singular")
            mp = pa("indefinite", "masculine", "plural")
            fp = pa("feminine", "indefinite", "neuter", "plural") or pa("feminine", "indefinite", "plural")
            if not (ms and fs and mp and fp) or ms != w:
                continue
            if ms == fs == mp == fp:
                continue  # oböjligt – inget att gnugga
            adjs[w] = {"ms": ms, "fs": fs, "mp": mp, "fp": fp, "en": gloss_of(d),
                       "_fq": lemma_freq([ms, fs, mp, fp])}

participles = {v["part"] for v in verbs.values()}
for w in list(adjs):
    if w in participles and w not in ADJ_PARTICIP_OK:
        del adjs[w]

def top(dct, n, key, pos_name):
    items = sorted(dct.values(), key=lambda x: -x["_fq"])
    items = [x for x in items if x["_fq"] > 0][:n]
    for i, x in enumerate(items):
        x["rank"] = i + 1
        k = x.get(key)
        # ordklass-specifik glosa först ("noun:mare" = hav), annars gemensam ("mare" = stor)
        for kk in (f"{pos_name}:{k}", k):
            if kk in svgloss:
                x["sv"] = svgloss[kk]
                break
        del x["_fq"]
    return items

out = {
    "lang": "ro",
    "built": datetime.date.today().isoformat(),
    "source": "Wiktionary via kaikki.org (CC BY-SA 4.0); frekvens: hermitdave/FrequencyWords (OpenSubtitles)",
    "nouns": top(nouns, N_NOUNS, "w", "noun"),
    "verbs": top(verbs, N_VERBS, "inf", "verb"),
    "adjs": top(adjs, N_ADJS, "ms", "adj"),
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

print(f"kandidater: {len(nouns)} substantiv, {len(verbs)} verb, {len(adjs)} adjektiv")
print(f"skrev {len(out['nouns'])} substantiv, {len(out['verbs'])} verb, {len(out['adjs'])} adjektiv → {OUT} ({os.path.getsize(OUT)//1024} kB)")
print("verbgrupper:", dict(sorted(defaultdict(int, {g: sum(1 for v in out['verbs'] if v['grp']==g) for g in set(v['grp'] for v in out['verbs'])}).items(), key=lambda kv: -kv[1])))
print("topp-substantiv:", [n["w"] for n in out["nouns"][:25]])
print("topp-verb:", [v["inf"] for v in out["verbs"][:25]])
print("topp-adjektiv:", [a["ms"] for a in out["adjs"][:20]])
sv_missing = [x for x in out["nouns"] + out["verbs"] + out["adjs"] if "sv" not in x]
print(f"saknar svensk glosa: {len(sv_missing)}")
