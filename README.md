# ajlindgren.dev

A personal site whose landing page is a **photorealistic dodecahedron** (D12) resting on a hardwood floor. Grab it, flick it, watch it tumble. When it settles, the face pointing up decides which chapter of the site you visit.

The die has twelve faces; each is a route. Faces are carved one at a time.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes) + **TypeScript** (strict)
- **Vite 6** with `vite-plugin-wasm` + `vite-plugin-top-level-await` (required by Rapier)
- **Threlte v8** — Svelte 5 wrapper for Three.js
- **Rapier** via `@threlte/rapier` + `@dimforge/rapier3d-compat` (WASM physics)
- **`@sveltejs/adapter-cloudflare`** — deployed to **Cloudflare Pages**

## Local development

```bash
nvm use               # picks up .nvmrc → Node 20
pnpm install --frozen-lockfile
pnpm dev              # http://localhost:5173
pnpm check            # svelte-check + tsc
pnpm build            # emits .svelte-kit/cloudflare/
pnpm preview          # serve the production build locally
```

## Repo layout

```
src/
  app.html              SvelteKit shell
  app.css               Global reset + dark theme
  lib/
    faces.ts            THE FACES REGISTRY — the extension seam
    components/
      Scene.svelte      Canvas, world, camera, lighting
      Floor.svelte      Hardwood plane + fixed cuboid collider
      D12.svelte        Dodecahedron mesh + dynamic rigid body + interaction
      ContactShadow.svelte
    audio/
      clatter.ts        Preloaded hit samples + playRandomHit()
    physics/
      faceDetection.ts  Map dodecahedron face normals → face number 1..12
      grab.ts           Pointer raycast + spring drag + flick impulse
  routes/
    +layout.svelte
    +page.svelte        Landing — mounts <Scene>
    faces/[n]/
      +page.ts          load() guards n ∈ 1..12
      +page.svelte      Placeholder page — reads registry
static/
  favicon.svg
  textures/             hardwood_{albedo,normal,roughness}.jpg  (see below)
  audio/                clatter_01.mp3 .. clatter_06.mp3        (see below)
```

## Add a face

Twelve routes ship as placeholders with the copy *"This face has not yet been carved."* Carving one is a two-step ritual:

1. **Update the registry** — open `src/lib/faces.ts` and change the entry for the face you're carving. Update `display_name`, `description`, and (optionally) point `route` at a dedicated slug.
2. **Write the page** — either edit `src/routes/faces/[n]/+page.svelte` (the shared placeholder) with a conditional branch, or create a dedicated file like `src/routes/faces/on-solitude/+page.svelte` and point the registry's `route` at `/faces/on-solitude`.
3. **Commit + push.** Cloudflare Pages deploys automatically.

The `D12.svelte` component and the physics never need to be touched to add content. That is the whole design.

## Required binary assets (not in repo)

Two directories under `static/` need real assets. They are **not** committed because they're large and licensable:

### `static/textures/`
2K PBR hardwood textures. Any CC0 or licensed hardwood PBR pack works — one good source is [ambientCG](https://ambientcg.com/) (search "wood floor"). You need three files:

- `hardwood_albedo.jpg`
- `hardwood_normal.jpg`
- `hardwood_roughness.jpg`

### `static/audio/`
4–6 short (~300ms) dice-clatter samples, normalized and pre-trimmed:

- `clatter_01.mp3` through `clatter_06.mp3`

Freesound.org has good CC0 dice-hit samples. If you drop in fewer than 6, edit `src/lib/audio/clatter.ts` — it just enumerates files by index.

Until these files exist, the die will still render and tumble; textures fall back to a flat colour and audio silently no-ops.

## Deployment (Cloudflare Pages)

The Cloudflare adapter is preconfigured. Pages settings:

| Setting | Value |
|---|---|
| Framework preset | SvelteKit |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Build output directory | `.svelte-kit/cloudflare` |
| Root directory | `/` |
| Node version | `20` (set env var `NODE_VERSION=20`) |

## First-deploy checklist

- [ ] Push repo to `ajlindgren/ajlindgren.dev` on GitHub (public, MIT)
- [ ] Connect the repo in the Cloudflare Pages dashboard with the settings above
- [ ] Confirm the Production deploy on `main` completes green (~2 min)
- [ ] Verify the Pages URL renders the die (drop, drag, flick all work)
- [ ] Add the custom domain `ajlindgren.dev` in Pages → Custom domains
- [ ] Update DNS: CNAME `ajlindgren.dev` → `<project>.pages.dev` (or use Cloudflare-native domain routing)
- [ ] Force HTTPS on
- [ ] In DevTools → Network, confirm `.wasm` files are served with `Content-Type: application/wasm`
- [ ] Manually visit `/faces/1` through `/faces/12` — each renders its placeholder
- [ ] Visit `/faces/13` → 404
- [ ] Test on desktop Chrome, Safari, Firefox

## License

MIT. See [LICENSE](LICENSE).
