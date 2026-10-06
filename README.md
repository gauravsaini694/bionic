First copy

## Adding a clinic location

Create `content/locations/<state>/<city>/index.md`. A new state is a new folder with `_index.md` containing `title: "<State>"`, `type: "state"`, `cascade: {type: "clinic"}`. Front matter:

- `title` (city/clinic name), `state`, `address` (put the 5-digit ZIP at the end), `phone`, `description`
- `lat`, `lng` (decimal degrees; required for the map pin and ZIP/nearby search)
- optional: `zip` (overrides the ZIP parsed from `address`), `city`, `hours`, `image`

State cards, counts, map pins, search, the navbar "Find a Clinic" menu and `/locations/index.json` are all generated from these files.
