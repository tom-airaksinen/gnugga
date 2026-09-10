#!/usr/bin/env python3
"""Lägger svenska böjningsformer i data/ro/lexikon.json (fältet svf).

Varför: de svenska glosorna är grundformer (infinitiv, singular). Appen får aldrig
böja dem själv – "flera timme" och "jag göra" blev fel. Här hämtas riktiga former
ur SALDO:s morfologi i stället, så ledtrådarna kan säga "flera timmar" och "jag gör".

Indata (scripts/raw/, ej i git):
  saldom.xml    https://svn.spraakbanken.gu.se/sb-arkiv/pub/lmf/saldom/saldom.xml
                SALDO:s morfologi, Språkbanken Text, CC BY 4.0
  sv-morf.json  (valfri, i git) handrättade former som vinner över SALDO:
                {"nouns": {"timme": {"pl": "timmar", ...}}, "verbs": {...}, "adjs": {...}}

Utdata: data/ro/lexikon.json uppdaterad på plats + scripts/raw/sv-morf-todo.txt
        (ord som saknas eller är tvetydiga, för handpåläggning).

Kör:  python3 scripts/bygg-svenska.py
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
LEX = os.path.join(HERE, "..", "data", "ro", "lexikon.json")
SALDO = os.path.join(RAW, "saldom.xml")
OVERRIDE = os.path.join(RAW, "sv-morf.json")
TODO = os.path.join(RAW, "sv-morf-todo.txt")

# Glosan kan vara "middag (kvällsmat)" eller "dam, fru" – appen visar första betydelsen.
PAREN = re.compile(r"\s*\([^)]*\)")
def head(sv):
    """Första betydelsen, utan parentes: 'middag (kvällsmat)' → 'middag'."""
    if not sv: return ""
    first = re.split(r"[,;/]", sv)[0]
    return PAREN.sub("", first).strip()

def usable(w, allow_space=False):
    if not w or w.endswith("-") or w != w.lower(): return False
    if " " in w and not allow_space: return False
    return bool(re.fullmatch(r"[a-zåäöéèüA-Z ]+", w))

# ---------- vilka ord behöver vi? ----------
lex = json.load(open(LEX, encoding="utf-8"))
need = {"nn": set(), "vb": set(), "av": set()}
for n in lex["nouns"]:
    h = head(n.get("sv"))
    if usable(h): need["nn"].add(h)
for v in lex["verbs"]:
    h = head(v.get("sv"))
    if usable(h, allow_space=True):
        need["vb"].add(h.split(" ")[0])          # partikelverb: böj huvudordet ("ta med" → "ta")
for a in lex["adjs"]:
    h = head(a.get("sv"))
    if usable(h): need["av"].add(h)

# ---------- msd-taggar vi plockar ----------
NN = {"sg indef nom": "sg", "sg def nom": "def", "sg def gen": "defg",
      "pl indef nom": "pl", "pl def nom": "pldef", "pl def gen": "pldefg"}
VB = {"pres ind aktiv": "pres", "sup aktiv": "sup",
      "pres ind s-form": "pres_s", "sup s-form": "sup_s"}   # deponens: hoppas, andas
AV = {"pos indef sg u nom": "u", "pos indef sg n nom": "n", "pos indef pl nom": "pl",
      "pos def sg no_masc nom": "defsg", "invar": "invar"}   # invar: levande, främmande
PICK = {"nn": NN, "vb": VB, "av": AV}
# Genus ligger i paradigmnamnets mittsegment: nn_2u_vinge → u, nn_on_öga → n, nn_0v_blod → varierar
PARADIGM = re.compile(r"^nn_([a-z0-9]+)_")

def noun_gender(paradigm, forms):
    m = PARADIGM.match(paradigm or "")
    g = m.group(1)[-1] if m else ""
    if g in ("u", "n"): return g
    d = forms.get("def", "")                      # varierande genus: läs av bestämd form
    if d.endswith(("et", "t")): return "n"
    if d.endswith(("en", "n")): return "u"
    return ""

# ---------- läs SALDO ----------
found = {"nn": {}, "vb": {}, "av": {}}   # ord → {lemgram: {form-nyckel: värde}}
n_entries = 0
for _, el in ET.iterparse(SALDO, events=("end",)):
    if el.tag != "LexicalEntry":
        continue
    n_entries += 1
    fr = el.find("./Lemma/FormRepresentation")
    if fr is None:
        el.clear(); continue
    d = {f.get("att"): f.get("val") for f in fr.findall("feat")}
    pos, word = d.get("partOfSpeech"), d.get("writtenForm")
    if pos in need and word in need[pos]:
        want = PICK[pos]
        got = {}
        for wf in el.findall("WordForm"):
            fs = {f.get("att"): f.get("val") for f in wf.findall("feat")}
            k = want.get(fs.get("msd"))
            if k and k not in got and fs.get("writtenForm"):
                got[k] = fs["writtenForm"]
        if pos == "nn":
            if got.get("g") is None:
                # varierande genus (blod: bloden/blodet) – föredra neutrum, den vanligare formen
                defs = [f.find("feat[@att='writtenForm']").get("val") for f in el.findall("WordForm")
                        if f.find("feat[@att='msd']").get("val") == "sg def nom"]
                for cand in defs:
                    if cand.endswith(("et", "t")): got["def"] = cand; break
            g = noun_gender(d.get("paradigm"), got)
            if g: got["g"] = g
        if got:
            found[pos].setdefault(word, {})[d.get("lemgram") or "?"] = got
    el.clear()
print(f"SALDO: {n_entries} uppslagsord lästa", file=sys.stderr)

# ---------- välj form per ord, notera tvetydigheter ----------
def lg_index(lg):
    m = re.search(r"\.(\d+)$", lg or "")
    return int(m.group(1)) if m else 99

ambiguous, missing = [], []
def resolve(pos, word, keys):
    cands = found[pos].get(word)
    if not cands:
        missing.append(f"{pos}\t{word}")
        return None
    order = sorted(cands.items(), key=lambda kv: lg_index(kv[0]))
    best = order[0][1]
    if len(order) > 1:
        alts = {tuple(sorted((k, v) for k, v in c.items() if k in keys)) for _, c in order}
        if len(alts) > 1:
            ambiguous.append(f"{pos}\t{word}\t" + " || ".join(
                f"{lg}: " + " ".join(f"{k}={c[k]}" for k in keys if k in c) for lg, c in order))
    return best

def need_keys(cand, keys):
    """Saknade nycklar – tomt betyder att formen duger."""
    return [k for k in keys if k not in cand]

ov = json.load(open(OVERRIDE, encoding="utf-8")) if os.path.exists(OVERRIDE) else {}
stat = {"nouns": 0, "verbs": 0, "adjs": 0}

# Plural är valfritt: mängdord (blod, musik) har ingen – då faller appen tillbaka på etikett.
NKEYS = ["sg", "def", "defg", "pl", "pldef", "pldefg", "g"]
NMUST = ["sg", "def", "defg", "g"]
for n in lex["nouns"]:
    n.pop("svf", None)
    h = head(n.get("sv"))
    man = (ov.get("nouns") or {}).get(n["w"])
    if man:
        n["svf"] = man; stat["nouns"] += 1; continue
    if not usable(h): continue
    r = resolve("nn", h, NKEYS)
    if not r: continue
    lack = need_keys(r, NMUST)
    if lack:
        missing.append(f"nn\t{h}\t(saknar {' '.join(lack)})"); continue
    n["svf"] = {k: r[k] for k in NKEYS if k in r}; stat["nouns"] += 1
    if need_keys(r, ["pl", "pldef", "pldefg"]):
        missing.append(f"nn\t{h}\t(utan plural – ok för mängdord)")

for v in lex["verbs"]:
    v.pop("svf", None)
    h = head(v.get("sv"))
    man = (ov.get("verbs") or {}).get(v["inf"])
    if man:
        v["svf"] = man; stat["verbs"] += 1; continue
    if not usable(h, allow_space=True): continue
    parts = h.split(" ")
    r = resolve("vb", parts[0], ["pres", "sup"])
    if not r: continue
    pres, sup = r.get("pres") or r.get("pres_s"), r.get("sup") or r.get("sup_s")
    if not (pres and sup):
        missing.append(f"vb\t{parts[0]}\t(saknar presens/supinum)"); continue
    tail = ("" if len(parts) == 1 else " " + " ".join(parts[1:]))
    v["svf"] = {"inf": h, "pres": pres + tail, "sup": sup + tail}; stat["verbs"] += 1

for a in lex["adjs"]:
    a.pop("svf", None)
    man = (ov.get("adjs") or {}).get(a["ms"])
    if man:
        a["svf"] = man; stat["adjs"] += 1; continue
    h = head(a.get("sv"))
    if not usable(h): continue
    r = resolve("av", h, ["u", "n", "pl"])
    if not r: continue
    if r.get("invar"):                                   # levande, främmande: en form för allt
        f = r["invar"]; a["svf"] = {"u": f, "n": f, "pl": f}; stat["adjs"] += 1; continue
    if not r.get("u") and not r.get("n") and r.get("pl"): # ordningstal: andra, nästa, sista
        f = r["pl"]; a["svf"] = {"u": f, "n": f, "pl": f}; stat["adjs"] += 1; continue
    lack = need_keys(r, ["u", "n", "pl"])
    if lack:
        missing.append(f"av\t{h}\t(saknar {' '.join(lack)})"); continue
    a["svf"] = {"u": r["u"], "n": r["n"], "pl": r["pl"]}; stat["adjs"] += 1

lex["svSource"] = "SALDO (Språkbanken Text), CC BY 4.0"
json.dump(lex, open(LEX, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

tot = {"nouns": len(lex["nouns"]), "verbs": len(lex["verbs"]), "adjs": len(lex["adjs"])}
for k in stat:
    print(f"{k}: svenska former för {stat[k]}/{tot[k]}")
with open(TODO, "w", encoding="utf-8") as f:
    f.write("# Saknas i SALDO (eller ofullständigt) – fyll i scripts/raw/sv-morf.json vid behov\n")
    f.write("\n".join(sorted(set(missing))) + "\n\n")
    f.write("# Tvetydiga (flera lemgram med olika former; lägsta indexet valdes)\n")
    f.write("\n".join(sorted(set(ambiguous))) + "\n")
print(f"saknas: {len(set(missing))} · tvetydiga: {len(set(ambiguous))} → {TODO}")
