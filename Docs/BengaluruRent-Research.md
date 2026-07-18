# Bengaluru.rent — Product Research & Teardown

| Field | Value |
| --- | --- |
| Document type | Competitive research / product teardown |
| Last updated | 2026-07-17 |
| Sources | [bengaluru.rent](https://bengaluru.rent/) (live site, FAQ, Privacy Policy, Terms), [LinkedIn posts by Harshit Anand](https://www.linkedin.com/in/harshit-anand-63186b68/), third-party citations, public SEO estimates |
| Disclaimer | No access to private analytics, codebase, or internal ops. Claims marked **Observed**, **Founder-stated**, or **Inferred**. |

---

# 1. Executive Summary

**Bengaluru.rent** is a solo-built, map-first rental intelligence platform for Bangalore. It combines:

1. **Anonymous rent transparency** — tenants pin what they actually pay  
2. **Direct flat / flatmate matching** — email intros, zero brokerage  
3. **Community moderation + AI automation** — Claude agents for matching, comment moderation, inbox ops  

It is **not** a traditional listing marketplace. There is no signup wall, no in-app chat, and contact details never appear on the map.

**Origin story (founder-stated):** Harshit Anand built it in **April 2026** over a weekend after a broker quoted ₹38K for a flat where the existing tenant paid ₹26K. Same flat, same building — ₹12K “broker fairy dust.”

**Scale (public numbers, Jul 2026 — figures vary by page/date):**

| Metric | Approx. value |
| --- | --- |
| Unique visitors | 120k+ (site); 1.25 lakh+ (LinkedIn, 3-month post) |
| Rent pins | 5,400+ |
| Total rent value on map | ₹255 Cr+ |
| Flat listings (direct) | 130+ |
| Active seekers | 2,100+ |
| Match emails sent | 16,000+ |
| To-Let boards spotted | 8+ (early feature) |
| Google SEO | Rank #1 “bangalore rent”, #2 “rent in bangalore”, top-5 for several rent queries |
| Paid marketing | ₹0 (founder-stated) |

---

# 2. Founder & Build Story

## 2.1 Who built it

**Harshit Anand** — Product at Sahi.com (formerly Groww, Pillow, Deutsche Bank). Based in Bengaluru. Built and runs the product **solo**, no funding, no team (as stated on site FAQ).

## 2.2 How it was built (“vibe coding”)

Founder-stated stack wiring via Claude + MCPs:

```
Plain-English prompts
        ↓
Claude wires: Supabase, Netlify, Gmail, Google Maps, Sentinel-2
        ↓
Production product in ~1 week initial build
```

**Observed third-party services (Privacy Policy):**

| Service | Purpose |
| --- | --- |
| **Supabase** | Database (hosted on AWS) |
| **Netlify** | Hosting (inferred from founder posts; site IP on AWS/Netlify edge) |
| **Google Maps** | Map tiles, place search |
| **Gmail** | Match emails, support |
| **ipify.org** | IP lookup on page load |
| **Copernicus Sentinel-2** | Green Cover satellite vegetation layer |
| **Google AdSense** | Monetisation (added after scale) |

## 2.3 AI in production (founder-stated)

Beyond initial build, Claude runs operational workloads:

| Agent / job | What it does |
| --- | --- |
| **Nightly matcher** | Compares seeker + listing pins; sends consolidated match emails (~30 sec vs “6 hours grunt work”) |
| **Comment moderator** | Haiku moderates every comment |
| **Inbox agent** | Reads founder email, updates DB, replies in his voice |
| **Department memories** | Growth, ops, trust & safety, product — SOPs as “skills” |
| **Outlier / spam defence** | Community + server-side rejection (“199 pins from one IP in 2 hours” caught) |

Founder quote (Jul 2026): *“It runs almost hands-off.”* Also: **ChatGPT started referring to bengaluru.rent as a source** for Bangalore rents (AEO / answer-engine optimisation).

---

# 3. Product Model — What It Actually Is

## 3.1 Positioning

```
NOT: Listing marketplace / broker lead gen
IS:  Rental intelligence map + lightweight P2P matching
```

Comparable mental models:

- **Google Maps** — spatial discovery  
- **Glassdoor** — crowd-sourced truth about “what it’s really like”  
- **Craigslist-style email intro** — contact only after match, not browseable  

## 3.2 Three user modes

| Mode | User intent | Contact required? |
| --- | --- | --- |
| **Rent pin (transparency)** | “Here’s what I pay — help others” | No (optional email for flatmate interest) |
| **Listing pin** | “I have a flat / room to rent” | Yes (email + phone) |
| **Seeker pin** | “I’m looking for flat / room / flatmate” | Yes (email + phone) |

## 3.3 Core value props

1. See **real rents** vs broker-inflated listing prices  
2. **List or seek** without brokerage  
3. **Match by proximity + budget + prefs** via email  
4. **Free**, no login for browsing / anonymous pins  
5. **Community-defended** data quality  

---

# 4. Complete Feature Inventory

## 4.1 Primary navigation (toolbar)

| Button | Function |
| --- | --- |
| **How to use** | 5-step onboarding tour |
| **Avlb Flats** | Filter map to available whole flats + rooms |
| **List My Flat** | Owner / roommate listing flow |
| **Find a Flat** | Seeker pin flow |
| **Superheroes** | Leaderboard for To-Let board spotters |
| **Live Stats** | City-wide + “near you” rent averages, leaderboards |
| **FAQ** | Product, privacy, matching, fake data, ads |
| **By Harshit** | Creator profile, feature requests, about |

## 4.2 Map interactions

| Action | Behaviour |
| --- | --- |
| Tap map | Place pin / open “Add something here” menu |
| **Filters** | Whole flat / room, BHK, rent range, neighbourhood, furnishing, gated, posted within, To-Let boards, near metro |
| **Hide pins** | Clear overlay to see streets / amenities |
| **Green Cover** | Sentinel-2 vegetation heatmap |
| **MyVibe** | Amenity preference quiz (schools, etc.) with walk/drive distance tuning |
| **Area stats** | Draw rectangle → BHK rent breakdown for polygon |
| **Locate me** | GPS centre |
| **Metro** | Namma Metro lines + stations overlay; filter by distance |
| **Flat Hunt** | Toggle seekers + listings view |
| **Spot a To-Let** | Photo upload + GPS; AI rejects faces / number plates |

## 4.3 “Add something here” menu (tap map)

| Option | Purpose |
| --- | --- |
| 💰 What rent are you paying? | Anonymous rent data (~10 sec) |
| 🏠 List my flat | Reach seekers — whole flat or room |
| 🔍 I'm looking for a flat | Seeker pin — matches to inbox |
| 🪧 Spotted a To-Let board? | Crowdsource street boards |

## 4.4 Pin types & map legend

| Visual | Meaning |
| --- | --- |
| Gated vs non-gated colour | Society type |
| **WHOLE AVBL** | Entire flat for rent |
| **ROOM AVBL** | Room + flatmate search |
| Seeker pin | Person hunting |
| **8 seekers** cluster | Multiple seekers grouped |
| **AVLB 2** cluster | 2 listings grouped (shows avg rent) |
| **Your Pin** | Editable / deletable by creator |
| **1 report** | Community flagged |
| **⚠️ Above avg** | Rent ≥ 2× area median |
| To-Let pin | Board photo + phone from board |

## 4.5 Rent transparency pin — fields

**Required / common:**

- BHK, monthly rent, furnishing, gated vs not, parking count  
- Society / building name  

**Optional:**

- Deposit (months), pets, sq.ft, family vs bachelor, maintenance included, one-liner  
- Email (never public — flatmate connection only)  

**Post-submit UX:**

- Share on WhatsApp prompt  
- “Looks sus” flag if outlier — excluded from city averages  
- Double-check modal for unusual entries  

## 4.6 Listing flows

### Whole flat

- Available: ASAP / next month / flexible  
- Parking, email*, phone*  
- Photos optional (up to 6, auto-check)  

### Room / flatmate listing

- Rent per room  
- Gender preference, smoking OK?, food preference  
- Parking, email*, phone*  

### Seeker pin

- Whole flat **or** room  
- Budget, BHK, move-in timeline  
- Food, smoking, own gender, preferred flatmate gender, parking  
- Lifestyle free text  
- Email*, phone*  
- Warning if 1BHK + “looking for room”  

## 4.7 Secondary features

| Feature | Details |
| --- | --- |
| **Watch this area** | Email when flat opens within 1 km; max 1 email/day |
| **I'm interested in this flat** | On rent-only pins — intro email to owner |
| **Not for rent** | Clarifies transparency pins |
| **Community rating** | Locality + built quality (1–5 stars each) |
| **Comments** | On pins; AI-moderated |
| **Edit / Delete pin** | Creator-only (IP-linked) |
| **Report issue / Board gone** | Community moderation |
| **Request a feature** | Direct to founder |
| **Live Stats modal** | Medians by BHK, gated/unfurnished filters, leaderboard |
| **Geo fence** | Rejects pins >100 km from Bangalore |
| **Archive old pins** | When same email/phone adds new seeker pin |

---

# 5. Flat & Flatmate Matching — Deep Dive

## 5.1 High-level flow

```
User drops listing OR seeker pin
        ↓
Stored with lat/lng, budget, BHK, prefs, contact (private)
        ↓
Daily cron / Claude agent scans candidates
        ↓
Compatible pairs within ~2–2.5 km
        ↓
ONE email to each side with other's email + phone
        ↓
Team CC'd for abuse review
```

## 5.2 Match criteria (observed + privacy policy)

| Dimension | Rule |
| --- | --- |
| **Distance** | 2 km (privacy policy) / 2.5 km (FAQ & UI copy) / “3 km” in one explainer — treat as **~2.5 km** operational radius |
| **Budget** | Listing rent compatible with seeker budget |
| **BHK** | Must align |
| **Room listings** | Gender, smoking, food preferences — hard filters |
| **Seeker ↔ Seeker** | Room seekers also matched with other room seekers nearby to **team up** and rent a flat together |
| **Contact on map** | **Never** |
| **Delivery** | Single consolidated email per match |
| **Latency** | First match typically within 24 hours (claimed) |
| **Volume** | 16,000+ match emails sent (FAQ); 591 matches in 7 days (early LinkedIn post) |

## 5.3 What matching is NOT

- No swipe UI  
- No in-app chat  
- No broker middleman  
- No public phone numbers on listings  
- No account / password system  

## 5.4 Consent model

By listing or seeking, user **explicitly consents** to email + phone sharing with matched parties only while pin is active. Deleting pin stops future sharing; past emails cannot be recalled.

## 5.5 Photo moderation (listings)

Up to 6 photos; “quick auto-check” before display. To-Let uploads: AI rejects faces and number plates.

---

# 6. Fake Data & Abuse Prevention

## 6.1 Five layers (FAQ — observed)

| # | Layer | Mechanism |
| --- | --- | --- |
| 1 | **Plausibility gate** | Rent must fall within plausible range for BHK at submission |
| 2 | **Statistical outliers** | Daily job flags pins 3× above/below area median; excluded from averages |
| 3 | **Community reports** | 3+ reports → auto-hide pin |
| 4 | **Rate limits + junk filters** | IP rate limits; junk email / phone rejection at submit |
| 5 | **Report-bomb detection** | Coordinated spam flagging |

## 6.2 Additional defences (observed + founder-stated)

| Mechanism | Source |
| --- | --- |
| **“Looks sus” UI** | Pin marked unusual; user must confirm; excluded from averages |
| **Above avg badge** | Rent ≥ 2× area median shown on pin |
| **IP-based identity** | Pins, ratings, reports deduped by IP; bans possible |
| **Server-side pre-save rejection** | “199 pins from one IP in 2 hours” blocked before save |
| **Haiku comment moderation** | Every comment moderated |
| **Community defence** | “229 pins flagged in 2 weeks” (founder); users DM slips |
| **Coordinate rounding** | ~100 m in API — anti-scraping + privacy |
| **Geo fence** | Non-Bangalore pins rejected |
| **Seeker pin expiry** | 30 days auto-expire |
| **Rent pin removal** | 3+ reports OR manual delete |

## 6.3 Known vulnerabilities (public criticism — LinkedIn)

Early launch drew **security researcher criticism**:

- Supabase RLS potentially misconfigured (comments/ratings IP exposure risk)  
- No signup → easier fake pin floods (199-pin attack happened)  
- Remote users can pin anywhere in city without GPS proof  

**Founder response pattern:** rapid server-side hardening + community moderation + statistical exclusion rather than heavy identity verification upfront.

**Community suggestions not fully adopted:**

- Geofence: only allow pin at GPS location  
- Device UUID + max 1–2 pins per device  
- Mandatory auth + flat photos for listings  

## 6.4 Broker disincentives

| Design choice | Why it hurts brokers |
| --- | --- |
| No phone on map | Can’t harvest leads from browsing |
| Transparency pins ≠ listings | Low incentive to spam fake low rents for clicks |
| Match email only | No pay-per-lead model |
| No broker category | Listings framed as owner / tenant direct |
| CC to team on matches | Human review of abuse |

Brokers can still submit fake **transparency** pins — statistical + community layers are the defence.

---

# 7. User Acquisition — How They Got Users

## 7.1 Timeline (reconstructed from public sources)

| When | Event | Result |
| --- | --- | --- |
| **Apr 2026, weekend** | Initial build + launch | Product live |
| **Days 1–5** | Word of mouth | 2,200+ humans, ₹120 Cr+ rent pinned (LinkedIn) |
| **Apr 12** | Viral LinkedIn post | **917 comments**, 5,824 reactions — primary launch spike |
| **Apr 15** | Matching goes live | 100+ matches/day via cron |
| **Apr 21** | Second LinkedIn post | 591 matches in 7 days narrative |
| **~3 months** | SEO + AEO compound | 1.25 lakh+ people, 17,000+ connected, Google rank #1–5 |
| **Jul 2026** | Mature organic | ~235k monthly visits (third-party SEO estimate); ChatGPT citations |

## 7.2 Growth channels (ranked by evidence)

### 1. LinkedIn viral loop (primary)

- Founder’s “vibe coded over a weekend” post → massive engagement  
- Secondary posts document milestones (matches, SEO ranks, AI ops)  
- **917 comments** on launch post = organic amplification  
- Other creators reshared (e.g. Subhendu Panigrahi: “vibe coded using Claude over a weekend”)  
- Workshop offer (“comment interested”) created secondary engagement  

### 2. Word of mouth + in-product sharing

- Post-pin **Share on WhatsApp** + copy message prompts  
- “Share with one friend who rents in Bangalore” (FAQ / ads explanation)  
- **Org Slack / company channels** — user report: “Came across this in my org’s channel” (LinkedIn comment)  

### 3. SEO (became dominant by month 3)

Founder-stated rankings:

| Query | Rank |
| --- | --- |
| “bangalore rent” | #1 |
| “rent in bangalore” | #2 |
| “house for rent bangalore” | #4–5 |
| “flat for rent in bangalore” | #4–5 |

**SEO tactics (inferred + founder-stated):**

- Exact-match domain `bengaluru.rent` (EMD advantage)  
- FAQ page with rich area medians (HSR, Koramangala, etc.) — snippet bait  
- Area-specific content in Live Stats  
- Fast growth signals → temporary Google boost (SEO advisors warn sustainability risk)  

**SEO risk (LinkedIn comment):** Internal location pages may **cannibalise homepage** for queries like “rent in Koramangala” — founder advised to fix.

### 4. Answer Engine Optimisation (AEO)

- ChatGPT citing bengaluru.rent for Bangalore rent questions (founder-stated, Jul 2026)  
- Third-party blogs cite their medians (NestRiqo, InstaDwell) → backlink + authority loop  

### 5. Product-led loops

```
User searches rent on Google
        ↓
Lands on map / FAQ with area medians
        ↓
Finds value → pins own rent OR drops seeker pin
        ↓
More data → better SEO snippets + match quality
        ↓
Share prompt → new users
```

### 6. Reddit

**No major indexed Reddit threads found** (Jul 2026 search). Reddit is listed in generic growth hypotheses but **not evidenced** as a primary channel in available public data. Likely minor / organic mentions in r/bangalore rather than coordinated campaign.

### 7. Paid ads

**₹0 marketing spend** (founder-stated). Later: **Google AdSense on site** to fund infra — ads are revenue, not acquisition.

## 7.3 Retention hooks

| Hook | Mechanism |
| --- | --- |
| Match emails | Daily value for seekers / listers |
| Watch this area | Alert subscription |
| Seeker pin expiry | 30-day re-engagement |
| Live Stats | Return visits for area research |
| Milestone sharing | “Help us cross 2 lakh visitors” |

---

# 8. Monetisation & Economics

## 8.1 User pricing

- **Free** for tenants and owners  
- No paywall, no premium tier, no broker fees (stated policy)  

## 8.2 Revenue

- **Google AdSense** added after ~93k visitors + 1,000+ daily match emails drove infra costs  
- Founder: “Even ₹50/month per user covers the bills” via ads  
- Ad-blockers explicitly OK  

## 8.3 Cost drivers (inferred)

| Cost | Driver |
| --- | --- |
| Supabase / hosting | Pins, seekers, email volume |
| Google Maps API | Map loads, place search |
| Email delivery | 1,000+ match emails/day at scale |
| Claude tokens | Matching cron, moderation, inbox agent (~5k–10k/month estimated by commenters) |
| Sentinel-2 / Green Cover | Satellite tile processing |

---

# 9. Data & Privacy Model

## 9.1 Identity without accounts

| Identifier | Use |
| --- | --- |
| **IP address** | Pin ownership, spam prevention, bans — never shown publicly |
| **Email / phone** | Matching only — never on map |
| **Creator token** | Edit/delete own pins |

## 9.2 Retention

| Data type | Retention |
| --- | --- |
| Rent pins | Until delete or 3+ reports |
| Seeker pins | 30 days auto-expire |
| IP | Abuse prevention |
| Email / phone | Until deletion request or pin removed |

## 9.3 Location privacy

- API returns coordinates rounded to **~100 m**  
- Pin shows approximate location only  

---

# 10. Moderation & Ops Workflow

## 10.1 Automated

- Nightly outlier flagging (3× median)  
- Plausibility checks on submit  
- IP rate limits  
- Haiku comment moderation  
- Claude nightly matcher  
- Photo auto-check (faces / plates)  

## 10.2 Community

- Report pin / “incorrect data”  
- “Board gone / wrong” on To-Let pins  
- 3 strikes → hide  

## 10.3 Human (founder + AI assist)

- Match emails CC’d to team  
- Feature requests read by Harshit  
- Inbox handled by Claude agent in founder’s voice  
- Manual review of flagged pins  

---

# 11. Lessons for Pune.rent

## 11.1 What to copy

| Pattern | Why |
| --- | --- |
| **Statistical aggregation** | Don’t show single fake pin as truth |
| **Email-only matching** | Simple, no chat infra, no public phones |
| **Frictionless contribute** | Low barrier drives early data |
| **SEO-rich FAQ + area medians** | Free acquisition |
| **Share prompts after value moment** | WhatsApp-native growth |
| **Seeker ↔ seeker team-up** | Solves “can’t afford whole flat alone” |
| **Clear privacy copy** | Builds trust for contact sharing |

## 11.2 What to improve (their gaps = our wedge)

| Bengaluru.rent gap | Pune.rent opportunity |
| --- | --- |
| Weak society-level pages | **Society intelligence + bachelor score** |
| No real auth | **Google login** for contributions; OTP for matching |
| RLS / security issues reported | **Proper RLS, auth from day 1** |
| Remote fake pins | Geo hints + auth + velocity limits |
| No structured reviews | Restriction votes + ratings |
| Map-first cold start | **Society pages first**, map when dense |

## 11.3 Growth playbook for Pune (adapted)

```
Week 1–2:  Seed 100 societies + admin estimates (content exists before map)
Week 2–4:  LinkedIn / Reddit r/pune / company relocation groups
Week 4+:   SEO pages — "Wakad rent", "Hinjewadi bachelor societies"
Ongoing:   Contribution unlock + WhatsApp share after submit
Phase 2:   Matching only when seeker + listing density exists
```

---

# 12. Source Index

| Source | URL / note |
| --- | --- |
| Live product | https://bengaluru.rent/ |
| Launch LinkedIn post | https://www.linkedin.com/posts/harshit-anand-63186b68_i-vibe-coded-wwwbengalururent-over-a-weekend-activity-7448294220064296960-5xQI |
| Matching + moderation post | https://www.linkedin.com/posts/harshit-anand-63186b68_200-cr-of-rent-tracked-591-flat-flatmate-activity-7452295096013852673-FuDX |
| 3-month SEO post | https://www.linkedin.com/posts/harshit-anand-63186b68_three-months-ago-i-vibe-coded-wwwbengalururent-activity-7482282765179334658-XuQu |
| Reshare (Subhendu) | https://www.linkedin.com/posts/skipiit_last-weekend-i-randomly-came-across-a-tool-activity-7447183843888996353-OsM4 |
| Third-party SEO estimate | hypestat.com/info/bengaluru.rent (~235k monthly visits) |
| Citation example | nestriqo.com blog citing bengaluru.rent medians |
| Reddit | No significant indexed threads found as of Jul 2026 |

---

# 13. Appendix — Full User Journey Diagrams

## A. Anonymous rent pin

```
Tap map → "What rent are you paying?"
    → BHK, rent, furnishing, gated, society name, optional fields
    → Server: plausibility check + IP rate limit
    → Pin live (coords rounded)
    → If outlier: "Looks sus" / confirm modal
    → Share on WhatsApp prompt
    → Included in area stats unless flagged
```

## B. Seeker → match

```
Find a Flat → drop pin where you want to live
    → whole flat OR room, budget, BHK, prefs, email, phone
    → Seeker pin on map (no contact shown)
    → Nightly matcher: listings + other seekers within 2.5km
    → Email both parties with contacts
    → Pin expires in 30 days
```

## C. Owner → match

```
List My Flat → whole flat OR room
    → rent, prefs (if room), photos optional, email, phone
    → Listing pin tagged WHOLE AVBL or ROOM AVBL
    → Nightly matcher pairs with seekers
    → When rented: owner deletes listing pin
    → Rent transparency pin can remain for area data
```
