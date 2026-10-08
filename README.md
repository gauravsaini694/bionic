First copy

## Adding a clinic location

Create `content/locations/<state>/<city>/index.md`. A new state is a new folder with `_index.md` containing `title: "<State>"`, `type: "state"`, `cascade: {type: "clinic"}`. Front matter:

- `title` (city/clinic name), `state`, `address` (put the 5-digit ZIP at the end), `phone`, `description`
- `lat`, `lng` (decimal degrees; required for the map pin and ZIP/nearby search)
- optional: `zip` (overrides the ZIP parsed from `address`), `city`, `hours`, `image`

State cards, counts, map pins, search, the navbar "Find a Clinic" menu and `/locations/index.json` are all generated from these files.

## Content Manager (Decap CMS) — /admin/

The client edits the site at **https://www.bionicpo.com/admin/** (email + password via Netlify Identity; changes are committed to the `main` branch by Git Gateway and Netlify rebuilds the site).

- Config: `static/admin/config.yml` (Decap CMS 3.x, pinned in `static/admin/index.html`).
- Editable content: every page (section by section), blog posts, clinical team, executive team, clinics/states, and global settings (`data/site.yaml` phone/email/social/header/footer texts, `data/navigation.yaml` menus, `data/cta.yaml` shared bottom banners).
- Uploaded images go to `static/images/uploads/`.
- **Local testing:** run `npx decap-server` in the project root and `hugo server`, then open `http://localhost:1313/admin/` (config has `local_backend: true`, which only applies on localhost).
- New state: create `content/locations/<state>/_index.md` (copy an existing one) and add a "State: …" entry to `config.yml` (clinics and counts then appear automatically).

### Netlify setup (one time)
1. Netlify dashboard → site → **Site configuration → Identity → Enable Identity**.
2. Identity → **Registration preferences → Invite only**.
3. Identity → **Services → Git Gateway → Enable** (authorize GitHub; branch `main`).
4. Identity → **Invite users** → enter the client's email. They click the link in the email, set a password, and are taken to `/admin/`.
5. (Optional) Identity → Registration → **External providers** for Google/GitHub login.

If Netlify Identity is not available, use the GitHub backend: change `backend:` in `config.yml` to
`name: github`, `repo: gauravsaini694/bionic`, `branch: main`, and register a GitHub OAuth App with an OAuth proxy (e.g. Netlify's "Site settings → Access control → OAuth → GitHub" provider; the editor then logs in with a GitHub account that has write access to the repo).
