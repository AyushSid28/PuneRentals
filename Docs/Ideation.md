> **Source of truth for building:** [README.md](./README.md) · [VERSIONS.md](./VERSIONS.md) · [Architecture.md](./Architecture.md)  
> This file is a **long-form reference PRD**. UX is now **one-page map** (not multi-page society site). V1 = intelligence MVP + Bachelor Reality Score + seed.

# Product Requirements Document (PRD)

# Pune.rent

## Community-Driven Rental Intelligence Platform for Pune

| Field | Value |
| --- | --- |
| Version | 0.3 |
| Status | Reference PRD (see README / VERSIONS for current V1) |
| Last updated | 2026-07-17 |
| Primary inspiration | [bengaluru.rent](https://bengaluru.rent/) |
| Positioning | Map-first rental intelligence — **not** a NoBroker clone |

---

# 0. Document Notes

This PRD separates three kinds of claims:

1. **Observed** — what Bengaluru.rent publicly does / says on the live product
2. **Inferred** — likely implementation choices based on privacy policy, FAQ, and UX
3. **Recommended for Pune.rent** — what we should build, including where we deliberately diverge

We do **not** have private access to Bengaluru.rent analytics, source code, or internal match rates. Numbers below (visitors, pins, matches) are from their public UI / FAQ and may change.

---

# 1. Product Vision

## One-line vision

> Build the most trusted rental intelligence layer for Pune by collecting real tenant experiences, rent data, society information, and neighbourhood insights — then optionally connect seekers and listers without brokerage.

## Product thesis

Pune.rent should **not** become a NoBroker competitor.

| NoBroker owns | Pune.rent should own |
| --- | --- |
| Listings at scale | Trust |
| Transactions | Data quality |
| Broker workflows | Society intelligence |
| Lead generation | Tenant experience |

**Moat:**

> The largest database of what it is actually like to rent in Pune.

**First goal (not “build a company”):**

> Make 1,000 Pune renters say: “I wish I had this before searching for my flat.”

---

# 2. Problem Statement

Current platforms (NoBroker, Housing.com, MagicBricks, 99acres) solve:

> “Find available flats”

They do **not** solve:

> “Should I live here?”

Before renting, people need:

- Is this society bachelor-friendly?
- Is the rent fair for this area / furnishing / BHK?
- How is owner / society behaviour?
- Is maintenance high? Water reliable?
- Is commute manageable (esp. Hinjewadi / Kharadi)?
- Hidden restrictions (guests, cooking, couples)?
- Is the broker inflating prices vs what tenants actually pay?

Today that knowledge lives in WhatsApp groups, Reddit, colleagues, and security guards — fragmented and unverifiable.

---

# 3. Competitive Teardown: Bengaluru.rent (Observed)

## 3.1 Positioning

Bengaluru.rent is a **map-first rental intelligence + matching tool**, not a classic listing marketplace.

Public framing (approx.):

- Thousands of real rents pinned anonymously by renters
- Direct flat listings / seeker pins with **zero brokerage**
- No mandatory signup for browsing / pinning anonymous rent
- Contact shared **only via match emails**, never shown on the map

Mental model:

```
Google Maps (spatial)
+ Glassdoor (crowd truth)
+ Zillow-like ranges (price transparency)
+ lightweight Craigslist matching (email intro)
```

## 3.2 Top navigation / primary actions

Observed toolbar / CTAs:

| Control | What it does |
| --- | --- |
| **How to use** | Product tour / onboarding |
| **Avlb Flats** | Shows available flats / rooms currently listed |
| **List My Flat** | Owner / roommate flow: drop pin + list whole flat or room |
| **Find a Flat** | Seeker flow: drop seeker pin with budget + prefs |
| **Superheroes** | Leaderboard of users who spot To-Let boards |
| **Live Stats** | City / near-you averages, leaderboards |
| **FAQ** | How matching, anonymity, fake data, ads work |
| **Filters** | Whole flat / room, BHK, rent range, neighbourhood, furnishing, gated, recency, To-Let boards, near metro |
| **Green Cover** | Sentinel-2 vegetation overlay |
| **Hide pins** | Clear rent pins to see base map / neighbourhood |
| **MyVibe** | Amenity preference quiz (schools, etc.) with walk/drive distance |
| **Spot a To-Let** | Upload board photo + location; AI rejects faces / number plates |
| **Area stats** | Draw a box → average rent by BHK for that polygon |
| **Locate me** | Centre map on user GPS |
| **Metro** | Overlay Namma Metro lines / stations; filter near metro |
| **Flat Hunt** | Toggle view of seekers + available listings |
| **Report an issue / Request a feature** | Feedback to creator |

## 3.3 Pin types (map legend)

| Pin / tag | Meaning |
| --- | --- |
| Anonymous rent pin | “What I pay” transparency data (not necessarily for rent) |
| **WHOLE AVBL** | Entire flat listed |
| **ROOM AVBL** | Room listed; looking for flatmate |
| Seeker pin | Person hunting for flat / room |
| Seeker cluster | Multiple seekers in an area |
| Gated vs non-gated colour | Society type signal |
| Community flagged | 1+ reports — review before trusting |
| Above avg warning | Rent is 2×+ area median |
| Your pin | Pin you created (edit / delete) |
| To-Let board pin | Crowdsourced street board + photo |

## 3.4 Anonymous rent pin fields (observed)

Required / common:

- BHK, monthly rent, furnishing, gated vs not, parking count
- Society / building name
- Optional: deposit months, pets, sq.ft, who lives here (family / bachelor), one-liner, includes maintenance
- Optional email (for flatmate interest / alerts — not shown publicly)

UX copy emphasises: you are sharing **what you pay**, to map real prices.

## 3.5 Listing flows

### A) List whole flat

- Available from: ASAP / next month / flexible
- Parking, email, phone (private — shared only with matches)
- Photos optional (up to 6, auto-check)

### B) Find a flatmate (room)

- Rent per room
- Gender preference (male / female / any)
- Smoking OK? Food preference (veg / non-veg / any)
- Parking, email, phone

### C) Seeker pin

- Looking for: whole flat **or** room
- Budget, BHK preference, move-in timeline
- Lifestyle prefs: food, smoking, own gender, preferred flatmate gender, parking
- Free-text lifestyle note
- Email + phone required for matching
- Edge UX: warns that 1BHKs are usually whole flats, not shared

## 3.6 How flatmate / flat matching works (observed + privacy policy)

### Core loop

```
1. User drops pin (listing OR seeker) with budget, BHK, prefs, contact
2. Daily (periodic) matcher scans nearby pins
3. Compatible pairs get ONE email each with the other's email + phone
4. Contacts NEVER appear on the map
5. Room seekers also match OTHER seekers nearby (team-up to rent together)
```

### Match criteria (as stated)

| Dimension | Rule |
| --- | --- |
| Distance | ~2–2.5 km (UI copy varies slightly: 2 km / 2.5 km / “within 3 km” in one explainer) |
| Budget | Compatible (listing rent vs seeker budget) |
| BHK | Compatible |
| Room listings only | Gender, smoking, food preferences |
| Contact delivery | Single match email to both sides; team CC’d for abuse review |
| First match latency | Typically within 24 hours (claimed) |
| Brokerage | Zero |

### Privacy / retention (important product decisions)

- No accounts / passwords (identity ≈ IP + pin creator token)
- Coordinates rounded (~100 m) in API responses
- Seeker pins auto-expire (~30 days)
- Rent pins stay until delete or 3+ community reports
- Match emails cannot be “recalled” once sent
- Multiple active pins per email/phone → archive flow before adding new

### Interest without full listing

On a rent-transparency pin that is **not** for rent:

- “I’m interested” / “Not for rent” clarification
- “Watch this area” — email when a flat opens within 1 km (cap: ~1 email/day)

## 3.7 Fake / abuse prevention (claimed)

Five layers from FAQ:

1. Plausible rent range by BHK
2. Statistical outliers (e.g. 3× above/below area median) flagged; excluded from averages
3. Community reports → auto-hide after 3 strikes
4. IP rate limits + junk email / phone filters
5. Report-bomb detection for coordinated spam

Also observed:

- “Looks sus — not used in averages”
- Double-check modal before pinning unusual rents
- Photo AI rejects faces / number plates on To-Let snaps

## 3.8 Adjacent features worth noting

- **Green Cover** satellite layer (livability signal)
- **MyVibe** amenity proximity scoring
- **Area stats** polygon analysis
- **Live Stats** / leaderboards
- **Superheroes** gamification for To-Let spotting
- Ratings: locality + built quality
- Comments on pins
- Google AdSense monetisation (keep product free, no broker money)
- Stack hints from privacy policy: Google Maps, **Supabase**, ipify, Copernicus, AdSense

## 3.9 What Bengaluru.rent does NOT emphasise (gap for Pune)

- Deep **society pages** (reviews, bachelor score, maintenance, water)
- Explicit **owner behaviour** / society rule intelligence
- Strong **verification identity** (Google login) — they optimise for frictionless no-login
- Structured commute intelligence to IT parks (Pune-specific need)

**Pune.rent opportunity:** lead with society intelligence + bachelor friendliness; treat matching as Phase 2 if we want differentiation beyond a clone.

---

# 4. Pune.rent Product Strategy

## 4.1 Initial audience

**Primary:** Pune bachelors / young professionals / students relocating for IT / colleges.

**Secondary:** Families researching rent fairness and societies.

## 4.2 Phase-1 geography

```
Hinjewadi
Wakad
Baner
Balewadi
Kharadi
Viman Nagar
Magarpatta / Hadapsar
```

Expand only after density (pins per sq km) is useful.

## 4.3 Strategic sequencing (important)

To avoid becoming a thin Bengaluru.rent clone with empty map:

| Phase | Focus | Why |
| --- | --- | --- |
| **MVP (Days 1–45)** | Society pages + rent observations + bachelor score | Trust & SEO before matching volume |
| **Phase 1.5** | Area rent map + filters + area stats | Visual discovery once enough observations |
| **Phase 2** | Flat / flatmate matching (email intros) | Needs supply + demand density |
| **Phase 3** | To-Let spotting, commute layers, richer reviews | Growth / differentiation |

**Decision:** Matching is in PRD scope, but **not** Day-1 MVP. Ship intelligence first.

---

# 5. Personas & Jobs-to-be-Done

## Persona A — Relocating SWE (Hinjewadi)

- Job: “Find a fair-priced 2BHK near Phase 1 that allows bachelors.”
- Fear: Broker quote 40% above real rents; society rejects after deposit talk.

## Persona B — Flatmate seeker

- Job: “Find a room / teammate with compatible gender / food / smoking prefs near Baner.”
- Fear: Wasted WhatsApp spam; unsafe contact sharing.

## Persona C — Existing tenant contributor

- Job: “Share what I pay so friends don’t get fleeced.”
- Fear: Landlord finds out; data used against me.

## Persona D — Owner / outgoing roommate

- Job: “Fill my room without brokerage.”
- Fear: Fake seekers; endless calls.

---

# 6. MVP Scope — Pune.rent

## 6.1 In scope (MVP)

1. **Society pages** (canonical entity)
2. **Rent observation submission** (anonymous-ish, authenticated lightly)
3. **Bachelor Score** + restriction signals
4. **Aggregated rent ranges** by society / area / BHK / furnishing
5. **Admin seeding** of ~100 societies with sourced estimates
6. **Basic search** (society, area)
7. **Report incorrect data**
8. **SEO area pages** (`/areas/wakad`, `/societies/blue-ridge`)

## 6.2 Explicitly out of MVP

- Full flatmate matching emails
- To-Let board spotting
- Satellite green cover
- Metro overlays (Pune Metro can be Phase 2+)
- In-app chat
- Payments / brokerage
- Owner CRM / lead packs

## 6.3 Phase 2 (matching) — specified now so architecture doesn’t block it

See §9.

---

# 7. Feature Specs (MVP)

## 7.1 Society pages

### Purpose

Single place for “Should I live in Blue Ridge?”

### Display fields

```
Society name
Area / locality
Map pin / approximate location
Rent Intelligence by BHK (median + IQR / range)
  - Unfurnished / Semi / Fully split when n ≥ threshold
Deposit range
Maintenance (typical monthly)
Bachelor Score (0–100) + breakdown
Internet / Security / Water / Power backup ratings (when enough reviews)
Sample of recent anonymised observations (no exact flat identity)
Confidence label: Low / Medium / High
Source mix: Community X · Admin Y · Public listing Z
```

### Empty state

If < 3 community observations: show admin estimate clearly labelled + CTA “Add what you pay”.

## 7.2 Rent observation collection

### Fields

| Field | Required | Notes |
| --- | --- | --- |
| Society (or free-text + area) | Yes | Prefer select from DB |
| Area | Yes | |
| BHK | Yes | 1 / 2 / 3 / 4 / 5+ |
| Monthly rent | Yes | INR |
| Deposit | Optional | Amount or months |
| Furnishing | Yes | Unfurnished / Semi / Fully |
| Maintenance | Optional | Included? Amount? |
| Move-in / as-of date | Yes | Defaults to “currently paying” |
| Bachelor allowed | Optional but prompted | Yes / No / Depends |
| Comment | Optional | Short, moderated |
| Source type | System | Community / Admin / Owner / Public listing |

### Aggregation rules

- Store **observations**, never a single “society rent”
- Display **median ± IQR** or percentile band (p25–p75)
- Never show fake precision (`₹27,342`)
- Exclude flagged outliers from headline stats (still stored)

## 7.3 Bachelor Score

Pune-critical differentiator.

### Inputs (votes / reviews)

- Are bachelors allowed? (Yes / No / Depends)
- Couples / unmarried partners?
- Guest / visitor restrictions?
- Timing restrictions (entry after 10pm)?
- Gender-specific policies?
- Cooking / non-veg restrictions?

### Output

```
Bachelor Score: 0–100
Confidence based on # of responses + recency + agreement
```

### Edge: conflicting answers

If 40% Yes / 40% No / 20% Depends → show **Depends** prominently + quote themes (“tower A strict, tower B OK”) rather than a misleading single number. Cap score confidence.

## 7.4 Furnishing intelligence

When enough data:

```
2BHK Wakad
Unfurnished: ₹22k median (n=…)
Semi: ₹27k
Fully: ₹35k
```

## 7.5 Commute intelligence (MVP-light)

MVP: static / curated commute notes for Phase-1 areas to major hubs (Hinjewadi Phase 1/2, Magarpatta, Kharadi).

Phase 2: distance + peak/off-peak estimates (Maps API) from society → workplace pin.

---

# 8. Data Model Principles

## 8.1 Observations over entities

Same society can have 2BHK at ₹25k and ₹35k (floor, facing, furnishing, owner). Correct unit of truth = **observation**.

## 8.2 Provenance & confidence

Every datapoint:

```
source: community | admin | owner | public_listing
confidence: low | medium | high
created_at, updated_at
verification_level: none | email | google | phone
```

Default trust order for display weighting:

`verified community > community > admin estimate > scraped public listing`

## 8.3 Manual admin seed vs later community data

Conflict is expected. Solution: show both in the “Based on” breakdown; never silently overwrite community with admin.

---

# 9. Phase 2 — Flat & Flatmate Matching (Spec)

Inspired by Bengaluru.rent; adapted for Pune and our auth posture.

## 9.1 Product principle

- Contacts **never** on map / society pages
- Matching via **email (and optional WhatsApp deep-link later)**
- Zero brokerage forever for peer matching
- Prefer **Google login** before collecting phone (reduce spam vs Bengaluru’s no-login model)

## 9.2 Pin / listing types

1. **Whole flat listing**
2. **Room / flatmate listing**
3. **Seeker (whole flat)**
4. **Seeker (room)** — also matches other room seekers for team-up

## 9.3 Match algorithm (v1)

Run on cron (e.g. hourly or daily):

```
FOR each active seeker S:
  candidates = pins within R km (default 2.5)
    AND overlapping BHK
    AND budget_compatible(S.budget, L.rent)
    AND preference_compatible for room matches:
         gender, smoking, food
  IF not already matched / emailed this pair:
    send mutual intro email
    log match_event
```

### Budget compatibility (define explicitly)

```
listing.rent <= seeker.budget_max * 1.05
AND listing.rent >= seeker.budget_min * 0.8   (if min provided)
```

### Preference compatibility

Hard filters (must pass): gender if specified ≠ Any  
Soft filters (score only in v2): lifestyle free text, sleep schedule

## 9.4 Lifecycle

| Object | TTL / rules |
| --- | --- |
| Seeker pin | Auto-expire 30 days; renew CTA email at day 25 |
| Listing | Manual delete; remind after 45 days “still available?” |
| Match email | One email per pair; rate-limit per user (e.g. max 5 intros/day) |
| Multiple pins same identity | Force archive flow before new pin |

## 9.5 Flatmate-specific UX

Room seeker matched with:

1. Room listings nearby
2. Other room seekers nearby (team-up)

Warn on 1BHK + “looking for room” (same as Bengaluru).

---

# 10. Edge Cases & Product Rules

## 10.1 Data quality / rents

| Edge case | Rule |
| --- | --- |
| Rent 50–70% below area median | Soft flag + confirm modal; exclude from averages until confirmed / verified |
| Rent ≥ 2× area median | Show “above avg” badge; exclude from median if ≥ 3× |
| Maintenance included vs excluded | Normalise field; don’t mix in averages without flag |
| Deposit in months vs rupees | Store both; convert using rent for display |
| User submits for wrong society (similar names) | Typeahead + map confirm; allow community “wrong society” report |
| Society renamed / dual names | Alias table (`Blue Ridge` ≈ `Blue Ridge Township`) |
| Only 1 observation | Show as “single report” — never as “average” |
| Stale data (>12 months) | Down-weight; badge “may be outdated” |
| User moved out but pin remains | “As of” date required; prompt yearly refresh |
| PG / hostel entered as flat | Property type field; exclude from BHK flat medians |
| Shared room rent vs whole flat rent | Separate listing types; never mix in “2BHK society rent” |
| Broker posts fake low rent | No public phone on map; require auth; velocity limits; ban patterns |

## 10.2 Bachelor / society rules

| Edge case | Rule |
| --- | --- |
| Conflicting bachelor policies by wing | Score = “Depends” + qualitative notes |
| Policy changed after committee meeting | Recency weighting; “reports from last 6 months” |
| Owner OK but society not | Capture both dimensions |
| Only male bachelors allowed | Gender-scoped bachelor score |

## 10.3 Matching edge cases

| Edge case | Rule |
| --- | --- |
| Seeker budget far below all listings | No spam emails; send “no matches yet” digest weekly |
| One listing matches 200 seekers | Cap intros/day; prioritise preference fit + recency |
| User wants contact but listing deleted mid-day | Skip send; don’t expose stale contact |
| Harassment after intro | Block / report; revoke future matches for offender identity |
| Same person lists + seeks to fish contacts | Detect dual role abuse; delay second-side contact |
| Couples looking for 1 room | Allow “2 people” occupancy on seeker |
| Gender preference legal/ethics | User preference filters OK; no discriminatory ads targeting beyond match prefs |
| International number / VoIP | Flag low trust; optional phone OTP in Phase 2 |
| Pin outside Pune metro (~50–100 km) | Reject with “Pune only” (mirror Bengaluru geo fence) |

## 10.4 Map / UX edge cases

| Edge case | Rule |
| --- | --- |
| Many pins same building | Cluster; show count + median; expand on zoom |
| Exact flat doxxing | Round coordinates; never store wing/flat number in public fields |
| Mobile GPS inaccurate | Allow manual pin adjust |
| Offline / weak network | Optimistic local draft for submission |

## 10.5 Trust / safety

| Edge case | Rule |
| --- | --- |
| Revenge reviews | Require observation or verified stay signal for harsh claims; moderation queue |
| Fake Google accounts | Phone OTP for matching; device / IP velocity for submissions |
| Report bombing | Rate-limit reports per IP; ignore coordinated bursts |
| Minors | Block under-18 in ToS; no targeting students under 18 for matching |

## 10.6 Ops / admin

| Edge case | Rule |
| --- | --- |
| Admin seed wrong | Label source; easy correct; audit log |
| Duplicate society pages | Merge tool with redirect |
| SEO thin pages | Noindex societies with zero useful data |

---

# 11. Fake User & Broker Prevention (Pune.rent)

## Layer 1 — Friction where it matters

- Browse: open
- Contribute rent: Google login (MVP)
- Matching (Phase 2): Google + phone OTP

## Layer 2 — Statistical

- Outlier detection vs area/BHK/furnishing cohort
- Confidence scores
- Never trust n=1 for headlines

## Layer 3 — Behaviour

Flag if:

- Same user floods submissions across cities / areas
- Identical comments
- Listing velocity inconsistent with human behaviour

## Layer 4 — Community

- “Incorrect data” reports
- Auto-hide after threshold (e.g. 3) with admin review

## Layer 5 — Incentive design

- No public phones on intelligence layer
- No lead marketplace in MVP → brokers gain little

---

# 12. Information Architecture & Key Screens

## MVP IA

```
/
  /areas/:slug                 SEO + aggregated rents
  /societies/:slug             Society intelligence page
  /submit                      Add rent observation
  /search                      Society / area search
  /about                       Mission, how data works
  /faq
```

## Phase 2 additions

```
/map                           Rent + availability map
/list                          List flat / room
/seek                          Seeker pin
/matches (email-driven; minimal web UI)
```

## Primary CTAs (MVP)

1. Search society / area  
2. Submit your rent  
3. Browse Phase-1 areas  

Avoid Day-1 overload of Green Cover / Superheroes / MyVibe clones.

---

# 13. Technology Architecture (Recommended)

## Frontend

- Next.js (App Router) + TypeScript
- Map: Google Maps or Mapbox (Phase 1.5+)

## Backend

- Next.js route handlers **or** FastAPI
- Background jobs: cron for aggregations + matching

## Database

- PostgreSQL + PostGIS (nearby societies, radius match)
- Suggested core tables:

```
users
societies (aliases, geom)
areas
rent_observations
society_reviews / restriction_votes
reports
listings (phase 2)
seekers (phase 2)
match_events (phase 2)
```

## Cache

- Redis for hot area stats / society aggregates

## Storage

- S3-compatible for images (Phase 2 listings / To-Let)

## Auth

- MVP: Google OAuth  
- Phase 2: Phone OTP for matching

## Email

- Transactional provider (Resend / SES / Postmark) for match intros

---

# 14. Data Collection Strategy

## Phase 1 — Seed

- Manually create ~100 societies in Phase-1 areas
- Admin estimates clearly labelled
- Scrape **public** listing sites only as weak prior (low confidence) — never present as tenant truth

## Phase 2 — Contribution loop

```
Land on useful society/area page
        →
See gap / unlock deeper analytics after submit
        →
Submit rent
        →
Data improves
        →
Share in Reddit / college / company groups
```

**Reward:** unlock detailed breakdowns after contributing (Bengaluru uses social share prompts; we can gate advanced charts).

## Phase 3 — Partnerships

- College groups, company relocation channels, Pune Reddit, Telegram housing groups

---

# 15. 90-Day Plan

## Days 1–15 — Foundation

- Next.js app, DB schema, auth
- Society pages + submit flow
- Seed 100 societies

**Exit:** usable pages for Blue Ridge, Kohinoor, etc.

## Days 15–45 — Density

- Target 1,000 observations
- Reddit / LinkedIn / college outreach
- Bachelor score live
- Report + moderation basics

## Days 45–90 — Map + matching prep

- Map of observations / aggregates
- Area stats
- Matching v1 behind feature flag if supply exists
- SEO landing pages ranking for “Wakad rent”, “Hinjewadi bachelor PG/society”

---

# 16. Success Metrics

## North star

```
Number of rental decisions helped
```

Proxies:

- Society page views with ≥30s engagement
- Searches
- Qualified contributions (non-outlier observations)

## Month 3 targets

```
5,000 visitors / month
1,000 rent submissions
500 society pages (many thin OK if Phase-1 dense)
```

## Quality metrics

- % observations passing outlier filters
- Median observations per Phase-1 society
- Report rate < X%
- (Phase 2) match email send → reply proxy / “found place” survey

## Do not optimise for

- App downloads
- Raw pin count without quality
- Broker listings volume

---

# 17. Privacy, Legal, Trust Copy (MVP requirements)

Must state clearly:

- Data is user-reported; verify independently
- Approximate locations only
- No sale of data to brokers
- How to delete your submission
- Matching contact sharing consent (Phase 2) — mirror Bengaluru clarity
- Moderation & ban rights

---

# 18. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Empty-map cold start | Society pages + admin seed first; matching later |
| Clone perception vs Bengaluru.rent | Bachelor score, society intelligence, Pune commute |
| Broker infiltration | No lead gen; auth; behavioural flags |
| Defamation / angry owners | Moderation, factual framing, ToS |
| Google Maps cost | Aggregate views; cache; defer map until density |
| Privacy backlash | Rounding, no flat numbers, clear anonymity UX |

---

# 19. Open Decisions (resolve before build)

1. **Domain:** `pune.rent` vs `.in` / alternate if unavailable  
2. **Auth friction:** Google-required on first contribution vs anonymous-first like Bengaluru  
3. **Matching in 90 days or strictly post-density?** (PRD recommends post-density)  
4. **Monetisation:** ads only vs optional “boost listing” later (default: free + ads later, never broker leads in MVP)  
5. **Property types:** include PG/hostel in MVP or flats-only?

---

# 20. Final Product Thesis (unchanged, sharper)

Pune.rent wins if a relocating renter can open a society page and leave more confident than after a week of WhatsApp folklore.

Bengaluru.rent proves the **map + anonymous rents + email matching** loop works. Pune.rent should steal the loop — but **win on society-level trust**, especially bachelor realities, before chasing feature parity on satellite layers and gamified To-Let hunting.

---

# Appendix A — Bengaluru.rent → Pune.rent Feature Matrix

| Feature | Bengaluru.rent | Pune.rent MVP | Pune.rent Phase 2+ |
| --- | --- | --- | --- |
| Anonymous rent pins | Yes | Yes (via society + optional map) | Yes |
| Society intelligence pages | Weak / absent | **Core** | Deeper reviews |
| Bachelor score | Light (family/bachelor tag) | **Core** | Gender-scoped |
| Flat listing | Yes | No | Yes |
| Seeker pins | Yes | No | Yes |
| Flatmate preference match | Yes | No | Yes |
| Seeker↔seeker team-up | Yes | No | Yes |
| Contact via email only | Yes | N/A | Yes |
| Community reports | Yes | Yes | Yes |
| Outlier flagging | Yes | Yes | Yes |
| Area draw stats | Yes | No | Yes |
| To-Let spotting | Yes | No | Maybe |
| Green cover / MyVibe | Yes | No | Maybe |
| Metro layer | Yes | No | When useful |
| No login browsing | Yes | Yes | Yes |
| Login to contribute | No | **Yes (Google)** | Google + OTP |

---

# Appendix B — Matching Email (Phase 2 draft)

**Subject:** Pune.rent match: 2BHK room near Wakad

**Body (both sides):**

- Why matched (distance, budget, prefs)
- Other party email + phone
- Safety tip: meet in public; never pay token without visit
- Link to disable pin / stop matching
- Note: Pune.rent is CC’d for abuse monitoring

---

# Appendix C — Glossary

| Term | Meaning |
| --- | --- |
| Observation | One rent datapoint from a user/admin |
| Listing | Flat/room currently available (Phase 2) |
| Seeker | User looking for flat/room (Phase 2) |
| Bachelor Score | Composite of society policy signals for unmarried tenants |
| Confidence | Meta-score on how much to trust an aggregate |
