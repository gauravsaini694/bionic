# Content Migration Audit — bionicpo.com (old Wix) → new Hugo site

Checked: 6 Oct 2026. Source: old site `sitemap.xml` (253 URLs). Every old page was fetched and its text blocks were matched against the mapped new page.
"Coverage" = % of old text blocks found word-for-word on the new page.

## 1. Are all pages built?

| Old section | Old URLs | New site | Status |
|---|---|---|---|
| Main pages | 23 | all mapped (see table 3) | ✅ built |
| Blog posts `/post/*` | 25 | `/resources/blog/*` | ✅ all 25 exist |
| Blog categories | 4 | `/categories/*` | ✅ |
| Clinics `/clinics/*` | 48 | `/locations/<state>/<city>/` | ✅ all 48 exist (`ft.-myers`→`fort-myers`, `madison,-in`→`madison-in`, `madison,-wi`→`madison-wi`) |
| State pages `/locations/*` | 12 | `/locations/<state>/` | ✅ all 12 |
| Team `/team/*` | 57 | `/about/clinical-team/*` | ⚠️ 56/57 — `michael-k-keene` maps to `/michael-keene/` (exists) but check slug; new site also has `jacob-mccleary` (not on old sitemap) |
| **Team `/team1/*`** | **57** | — | ❌ **DUPLICATE — do not migrate** (see §2) |
| **Executive team `/executive-team/*`** | **5** | — | ❌ **MISSING**: Rani Kriplani, Brad Watson, Dheeraj Bhambani, Tony Gutierrez, Michael Poynter |
| `/shadowingopportunities` | 1 | `/careers/shadowing-opportunities/` | ✅ (needs redirect) |

## 2. `/team1/` — confirmed duplicate
- Same 57 slugs as `/team/`, same title tags, same bio text.
- `/team1/` is a **stripped copy**: it is missing the "Back to All Clinicians" link and the clinician's **clinic list (addresses, phones, clinic emails)**.
- Each `/team1/` page has its own canonical (`/team1/...`) → Google sees 57 duplicate pages.
- **Action:** do NOT create `/team1/` pages. Add 301 redirects `/team1/* → /about/clinical-team/*` (Netlify `_redirects`).

## 3. Content that was NOT carried over (copy was rewritten/shortened)

| Area | Avg coverage | What is missing |
|---|---|---|
| **Blog posts (25)** | **~16%** | Posts were **summarized/rewritten**. Original full articles (intro paragraphs, statistics with source links, sub-sections, lists, images) are gone. Example: "What Is a Prosthetic Arm?" — 39 of ~40 original paragraphs missing. |
| **Clinic pages (48)** | **~7%** | Old page had: full address format, **clinic email** (e.g. indianapolis@bionicpo.com), "About Bionic" paragraph, "Click here to view the full list of clinicians", clinicians at this clinic. |
| **State pages (12)** | **0%** | Old state pages had intro paragraph, "Schedule Your Consultation Today!" block, and a **state-specific FAQ** (referral, services, what to bring, insurance…). All missing. |
| **Team profiles (57)** | **~20%** | Job title line (e.g. "Resident Prosthetic & Orthotic"), **first bio paragraph** often missing, staff **email**, and full clinic list with addresses/phones. |
| Home `/` | 41% | 26 blocks missing |
| `/about-us` → `/about/` | 6% | 17 blocks |
| `/careers` | 12% | 66 blocks |
| `/grow` | 0% | 22 blocks |
| `/residency-program` | 0% | 23 blocks |
| `/inquiry-services-page` → `/contact/` | 0% | 5 blocks |
| `/book-appointment-pay-bill` → `/resources/pay-bill/` | 7% | 14 blocks |
| `/prosthetics` | 28% | 43 blocks |
| `/orthotics` | 26% | 49 blocks |
| `/lower-extremity` | 14% | 6 blocks |
| `/upper-extremity` | 20% | 4 blocks |
| `/cranial-spinal` | 33% | 10 blocks |
| `/diabetic-foot` | 33% | 4 blocks |
| `/patient-resources` | 37% | 19 blocks |
| `/faqs` | 50% | 8 blocks (some Q&As missing/reworded) |
| `/locations` | 20% | 8 blocks |
| `/success-stories` | 40% | 3 blocks |
| `/upper-limb` | 54% | 6 blocks |
| `/lower-limb` | 60% | 6 blocks |
| `/team` → `/about/clinical-team/` | 75% | 10 blocks |
| `/blog` | 78% | 2 blocks |
| `/bionic-beats` | 100% | ✅ |

Note: numbers are approximate (Wix markup splits some text), but every low score that was spot-checked was a real content loss, not a matching error.

## 4. Required redirects (old URL → new URL)
All old URLs must 301 to the new ones to keep Google rankings:
- `/about-us` → `/about/` · `/team` → `/about/clinical-team/` · `/team/<slug>` and `/team1/<slug>` → `/about/clinical-team/<clean-slug>/`
- `/post/<slug>` → `/resources/blog/<slug>/` · `/blog` → `/resources/blog/` · `/blog/categories/<c>` → `/categories/<c>/`
- `/clinics/<slug>` → `/locations/<state>/<clean-slug>/` · `/locations/<state>` → `/locations/<state>/`
- `/executive-team/<slug>` → new executive profile pages
- `/lower-limb`, `/upper-limb` → `/prosthetics/...` · `/lower-extremity`, `/upper-extremity`, `/cranial-spinal`, `/diabetic-foot` → `/orthotics/...`
- `/grow`, `/residency-program`, `/shadowingopportunities` → `/careers/...`
- `/patient-resources`, `/faqs`, `/book-appointment-pay-bill`, `/bionic-beats` → `/resources/...` · `/inquiry-services-page` → `/contact/`
