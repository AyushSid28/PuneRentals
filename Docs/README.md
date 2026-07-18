# Pune.rent

**Map-first rental intelligence for Pune** — not another NoBroker.

> Open the map. See what people actually pay. Know if bachelors are really allowed. Decide before you visit a single flat.

| | |
| --- | --- |
| **Shape** | One-page map (like [bengaluru.rent](https://bengaluru.rent/)) |
| **Status** | V1 planning → build |
| **City** | Pune (Phase-1: Hinjewadi, Wakad, Baner, Kharadi, Viman Nagar, Magarpatta) |

---

## The problem

Someone moving to Pune (student, SWE, new hire) does not mainly need “another listing site.” They need answers **before** they waste weekends on visits:

- Is this rent fair for this society?
- Are bachelors *actually* allowed — or will security stop me after I pay token?
- How much deposit / maintenance should I expect?
- Is the owner / society strict?
- What do tenants say about water, power, internet?

Today that knowledge is stuck in WhatsApp groups, Reddit, colleagues, and brokers who quote different numbers to different people.

**NoBroker / Housing / 99acres answer:** *What flats are available?*  
**Pune.rent answers:** *What should I know before renting here?*

---

## What we are solving (for Pune)

| Pain | How Pune.rent helps |
| --- | --- |
| Information asymmetry | Crowdsourced + seeded rent ranges (median, not one fake number) |
| Wasted visits (bachelor bans) | **Bachelor Reality Score** with confidence (“82% based on 43 responses”) |
| Inflated broker quotes | Map of what tenants report they pay |
| Conflicting flat rents in one society | Store **many observations** → show range + count |
| Empty “community” product | **Seed estimated data** so day-1 map is useful |

---

## How we solve it

### 1. One-page map (not a website maze)

User opens `pune.rent` → full-screen map → tap pin → **intelligence sheet** (rent ranges, deposit, maintenance, bachelor score, tenant notes). Buttons open sheets — no Area → Society page hopping.

### 2. Cold start: seed, then community

Launch with curated society-level estimates for key IT corridors. Every estimate shows:

- Source: **Estimated** (admin research / public listings)
- Confidence: **Low** until tenants confirm

Real submissions raise confidence and replace folklore with data.

### 3. Observations, not one “society rent”

Blue Ridge might have ₹25k semi, ₹28k semi, ₹35k fully furnished. We store each observation and show **median + range + n submissions** — never fake precision.

### 4. Bachelor Reality Score (Pune wedge)

Not just Allowed / Not allowed. Structured score from tenant votes (allowed, guests, rules, owner behaviour) + confidence from sample size and agreement.

### 5. Trust layer (V1)

- Google login to contribute  
- Outlier detection (e.g. ₹10k where area is ₹25–35k → flag, don’t poison stats)  
- Report incorrect data  
- Source + confidence on every aggregate  

### 6. Success metric

Not “listings created.”  
**Rental decisions helped** — map interactions, pin sheet views, submissions, bachelor votes, return visits.

First milestone: a relocator can open the map and answer:

> Where should I live, what should I pay, and what problems should I expect — before visiting a single flat?

---

## Versions (short)

| Version | What ships |
| --- | --- |
| **V1** | Map + seeded pins + intelligence sheet + contribute + Bachelor Reality Score + trust basics |
| **V2** | Stronger filters, area stats, clustering, full outlier jobs |
| **V3** | List / find flat, email matching (contacts never on map) |

Detail + build checklists → **[VERSIONS.md](./VERSIONS.md)**  
Tech + flows → **[Architecture.md](./Architecture.md)**

---

## Docs in this folder (keep these)

| File | Why it exists |
| --- | --- |
| **README.md** | Problem, solution, Pune pitch (this file) |
| **VERSIONS.md** | V1/V2/V3 scope + LLM build continuity |
| **Architecture.md** | Stack, schema, user flows, map architecture |
| **Ideation.md** | Long-form PRD / edge cases (reference) |
| **BengaluruRent-Research.md** | Competitor teardown |

---

## Not this product

- Not a brokerage / lead marketplace  
- Not “list 10,000 flats” on day one  
- Not multi-page Glassdoor clone as primary UX  

The moat is **trusted rental intelligence for Pune**, starting with bachelor reality + fair rent on a map.
