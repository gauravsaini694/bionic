# Bionic Website – Full Audit & Redesign Brief

Audit date: 6 Oct 2026 · Site: Hugo (localhost) · 174 pages crawled, ~40 templates reviewed visually on desktop (1400px).

**Golden rules for every change**
- Everything must stay DYNAMIC (driven by `content/` + front matter + CMS). No hardcoded states, counts, clinics, team members, posts or links.
- Every new front-matter field must be added to the CMS config so CMS users can fill it. Empty field → section hides gracefully.
- Reuse partials. One component = one partial (clinic card, team card, post card, CTA, icon).
- Keep brand: navy `#283593`-ish, green `#8BC34A`-ish, serif headings, sans body. Must look good at 375px, 768px, 1440px.
- After all changes: run `hugo` build with zero errors/warnings, then re-crawl all pages for 404s.

---

## P0 – Broken (fix first)

1. **Giant icons bug (site-wide).** `<svg viewBox="0 0 24 24">` inside `<p>` has no width/height, so icons fill the whole card.
   - Clinic page → "Other <State> Clinics" cards (all 48 clinic pages) still use the OLD `.clinic-card` markup.
   - Team member pages (`/about/clinical-team/<name>/`) → `.team-location` icon is huge (all ~58 profiles).
   - Fix: global rule `svg:not([width]) { width:1em; height:1em; }` style safety net + `.icon-sm` (18px) everywhere. Replace old nearby-clinics markup with the new shared clinic-card partial used on the state page.

2. **7 broken links (404):**
   | Link | Where | Fix |
   |---|---|---|
   | `/pay-bill/` | Home hero chip "Pay My Bill" | → `/resources/pay-bill/` |
   | `/support-groups/` | Home hero chip "Find Support Group" | → `/resources/patient-resources/` (support orgs section anchor) |
   | `/prosthetics/pediatric/` | Home services card "Pediatric" | create page OR link to existing pediatric content |
   | `/prosthetics/technology/` | Home "Explore Technology" button | create Technology page (FES, microprocessor knees, 3D printing) |
   | `/privacy-policy/` | Footer | create page |
   | `/terms-of-use/` | Footer | create page |
   | `/accredited/` | Footer "Accredited — ABC" | create accreditation page or link to ABC |

3. **Footer "Quick Links" and "Services" columns are EMPTY** on every page. Populate from Hugo menus (`menus.footer_links`, `menus.footer_services`) so CMS/config controls them.

4. **No contact form anywhere** (`/contact/` and "Request Consultation" have 0 forms). Build a Request Consultation form (name, phone, email, preferred clinic dropdown generated from locations, message, consent) on `/contact/` and link every "Request Consultation" button to it. Use the site's form backend (Netlify Forms / Formspree / existing) — ask if unsure.

5. **Section order bug — list sections rendered AFTER the final CTA banner:**
   - `/resources/blog/` → "Latest from the Blog" grid appears below "Have a Question…" CTA.
   - `/about/clinical-team/` → "Our Clinicians" grid appears below CTA, and the CTA text says *"Individual clinician profiles… are coming soon"* even though ~58 profiles exist. Remove that text; grid goes before CTA.
   - Check every list page for the same pattern.

6. **Slug/title:** clinic title still shows "Ft. Myers" — use "Fort Myers" as display name (keep alias from old URL).

## P1 – Design looks unfinished

7. **Home → testimonial illustration** (half-circles + rays above "What Our Patients Say") looks cropped/placeholder. Replace with a real photo or remove.
8. **Home → testimonial avatars** are empty grey circles. Use patient initials in brand colors or photos; add a carousel if >3 testimonials (from data/CMS).
9. **Home → "Support Beyond the Clinic" cards** have empty grey image areas. Add images/illustrated icons per card (from front matter).
10. **Large empty white space** at the end of sections: About (after "Our Values"), Orthotics › Cranial & Spinal (before Spinal section), Contact (after "What to Expect"), Clinic page (About the Clinic). Normalize section padding (e.g. 96px desktop / 56px mobile).
11. **Same 3 stock photos reused on almost every page** (`clinical-team.png`, `about-empowering.png`, arm photo). Add an `image` front-matter field per page with sensible fallback, so each page can have its own image.
12. **Service/care cards layout:** Prosthetics has 2 cards in a 3/4-col grid (empty space right); Careers has 3 cards in a 4-col grid. Grid should auto-fit and center (`repeat(auto-fit, minmax(260px,1fr))`).
13. **Inconsistent icons:** Careers cards mix different icon styles (filled star vs outline). Use one icon set (outline, 24px, brand colors) via a single `icon.html` partial.
14. **Team member page:** letter avatar "A" when no photo → nicer placeholder (initials on brand gradient), layout as 2-col (photo + credentials/locations/specialties left, bio right), list clinics they work at as links.
15. **Blog post page:** add featured image, reading time, author, share buttons, related posts (same category), and a sticky table of contents for long posts.
16. **Blog listing:** card grid with image, category chip, date, excerpt; category filter; pagination.

## P2 – Polish & UX

17. Scroll "reveal" animation leaves cards semi-transparent (3rd card faded while others visible). Use IntersectionObserver with threshold 0.15 and stagger; respect `prefers-reduced-motion`.
18. Navbar: "Locations" is not a dropdown while other items are; keep "Find a Clinic" mega-menu as the single locations entry or make both consistent. Highlight active page.
19. Add breadcrumbs on all inner pages (already on clinic page) via one partial.
20. Accessibility: visible focus states, alt text on all images, 4.5:1 contrast for grey body text on grey backgrounds, `aria-expanded` on FAQ accordions and menus.
21. SEO: unique meta description per page from front matter, Open Graph image, `MedicalClinic` JSON-LD on clinic pages, `Person` on team pages, `Article` on blog posts, `FAQPage` on FAQs.
22. Performance: lazy-load images below the fold, Hugo image processing (WebP + srcset), defer Leaflet JS on pages without maps.
23. **Mobile (could not be tested from browser):** verify at 375px — hamburger menu, mega-menu, map heights, card grids, hero text sizes, sticky CTA "Call / Find a Clinic" bar on mobile.

---

## Suggested order of work
1. P0 items 1–6 → build → re-crawl for 404s.
2. Shared partials: icon, clinic-card, team-card, post-card, section-header, CTA.
3. P1 items page by page: Home → Locations (state + clinic) → About/Team → Prosthetics/Orthotics → Resources/Blog → Careers → Contact.
4. P2 polish, accessibility, SEO, performance.
5. Final report: files changed, new CMS fields, pages created.
