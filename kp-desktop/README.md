# KP Stellar — Local Desktop KP Astrology App with AI Search

A self-contained desktop application for **Krishnamurti Paddhati (KP)** astrology.
It computes accurate charts with the Swiss Ephemeris, stores them in a local
SQLite database, and lets you find charts by **natural-language queries** such as:

> *"Find clients who have Jupiter as the 11th house sub-lord and Mars connected to the 6th house."*

Everything runs locally on Windows/macOS. No cloud account is required to compute
or search charts; an LLM API key is optional and only enriches the search parser.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  app.py  —  CustomTkinter GUI                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐ │
│  │ Add Profile│  │ Chart View │  │ AI Chart Search console  │ │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬──────────────┘ │
└────────┼───────────────┼───────────────────-┼────────────────┘
         │ compute()     │ get_chart_rows()    │ run(query)
         ▼               ▼                     ▼
   ┌───────────┐   ┌──────────────┐     ┌────────────────┐
   │ engine.py │   │ database.py  │◄────│  ai_agent.py   │
   │ Swiss Eph │   │ SQLite + safe│     │ NL → JSON spec │
   │ KP lords  │──►│ structured   │     │ (Claude or     │
   │           │   │ search       │     │  rule-based)   │
   └───────────┘   └──────────────┘     └────────────────┘
```

**Data flow.** `engine.py` turns birth data into a structured `KPChart`
(no SQL, no UI knowledge). `database.py` persists it into three tables and
exposes a **parameterised, read-only** search. `ai_agent.py` converts a user's
sentence into a *typed, validated* search spec — never raw SQL — which
`database.search()` executes. `app.py` is the only module that imports all three.

**Separation of concerns** keeps each file independently testable: the lord-chain
math, the storage layer, and the NL parser were each verified on their own.

---

## Section 1 — KP calculation logic (`engine.py`)

| Quantity | How it is computed |
|---|---|
| **Julian Day (UT)** | Local civil time → UTC via the timezone offset → `swe.julday`. |
| **Ayanamsa** | `KP_OLD` = Swiss Ephemeris built-in `SIDM_KRISHNAMURTI`; `KP_NEWCOMB` = custom `SIDM_USER` pinned with the Newcomb precession rate (50.2388475″/yr, zero-epoch 291.273). For 25-Nov-1990 this yields **23° 43′ 07″**, matching published KP software. |
| **Placidus cusps** | `swe.houses_ex(jd, lat, lon, b'P', FLG_SIDEREAL)` returns all 12 sidereal cusps directly; degree/min/sec via `_dms`. |
| **Planet longitudes** | `swe.calc_ut(jd, body, FLG_SWIEPH \| FLG_SIDEREAL)`. **Rahu/Ketu use the MEAN node** (`swe.MEAN_NODE`) — the KP convention; Ketu = Rahu + 180°. |
| **Lord chain** | For any sidereal longitude: Sign → Sign Lord → Nakshatra (★) Lord → Sub → Sub-Sub (→ Sub-Sub-Sub). The nakshatra is sub-divided in **Vimshottari proportions**, and critically the sub-sequence **starts from the star lord**, not from Ketu. |

The sub-lord subdivision (`_subdivide` / `_lord_chain`) is the heart of KP and was
validated against a professional reference chart: **all nine grahas match on
sign, nakshatra, pada, star lord and sub lord**, and the ascendant matches to
~1 arc-second.

---

## Section 2 — Database schema (`database.py`)

Three tables, one SQLite file (`kp_charts.db`):

- **`profiles`** — name, dob, tob, place, latitude, longitude, timezone, ayanamsa.
- **`planet_positions`** — one row per (profile, planet): longitude, dms, sign,
  sign_lord, nakshatra, pada, star_lord, sub_lord, sub_sub_lord.
- **`cusp_positions`** — one row per (profile, house 1–12): the same lord columns.

Lords are stored as **full planet names** (`"Jupiter"`), giving the AI layer and
UI one shared vocabulary. Composite indexes on `(planet, sub_lord)`,
`(house, sub_lord)`, etc. make the common KP searches O(log n). `PRAGMA
foreign_keys` + `ON DELETE CASCADE` keep a profile and its rows consistent.

---

## Section 3 — AI search without SQL-injection risk (`ai_agent.py`)

**Why not raw text-to-SQL?** An LLM emitting SQL against a user's DB can
hallucinate columns, leak whole tables, or be prompt-injected into destructive
statements. For a fixed domain we get better safety *and* accuracy by
constraining the model to emit a small **typed JSON search spec**:

```json
{
  "match": "all",
  "conditions": [
    {"kind": "cusp",   "house": 11, "field": "sub_lord", "value": "Jupiter"},
    {"kind": "planet", "entity": "Mars", "field": "star_lord", "value": "..."}
  ]
}
```

`validate_spec()` then checks every `entity`, `field`, `house`, and `value`
against fixed allow-lists (nine planets, four lord fields, houses 1–12). Only a
clean spec reaches `database.search()`, which builds a **parameterised**
`INTERSECT`/`UNION` query — user text is *bound*, never concatenated. The LLM
never sees or writes SQL, so injection is structurally impossible.

**Two interchangeable backends** (same return type):
- `AnthropicParser` — Claude with a strict JSON system prompt (set
  `ANTHROPIC_API_KEY`; the model id is configurable).
- `RuleBasedParser` — dependency-free regex parser for the common phrasings, so
  the app works offline and with no key. `AIChartSearch` auto-selects the LLM
  when a key is present, else the rule-based one.

*(A LangChain `SQLDatabaseToolkit` SQL-agent is a valid alternative; if you use
it, open the DB read-only (`mode=ro`), restrict it to these three tables, and
keep the structured-spec path as the default — it is both safer and faster.)*

---

## Section 4 — Modular code

| File | Role |
|---|---|
| `engine.py` | Swiss Ephemeris calculations → structured `KPChart`. |
| `database.py` | SQLite init, save profiles, safe structured search. |
| `ai_agent.py` | NL query → validated spec → matching records. |
| `app.py` | CustomTkinter GUI: Add Profile · Chart View · AI Search. |

Each module runs as a script for a quick self-test (`python engine.py`,
`python ai_agent.py`).

---

## Setup & run

```bash
cd kp-desktop
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Optional — enable LLM query understanding:
export ANTHROPIC_API_KEY=sk-ant-...                 # Windows: set ANTHROPIC_API_KEY=...

python app.py
```

On Windows, `pip install pyswisseph` uses a prebuilt wheel. On macOS with Apple
Silicon, if a wheel is unavailable, install the Xcode command-line tools first
(`xcode-select --install`) so it can build.

### Accuracy note
`pyswisseph` ships with the Moshier analytical ephemeris (good to a few
arc-seconds), which needs no data files. For maximum precision, download the
Swiss Ephemeris `.se1` files and pass the folder to `KPEngine(ephemeris_path=...)`.

### Validation
`engine.py`'s lord-chain logic was checked against a published professional KP
chart (A. Devaraj, ref 41291): exact agreement on sign, nakshatra, pada, star
lord and sub lord for all nine planets; ayanamsa 23° 43′ 07″; ascendant to the
arc-second.
