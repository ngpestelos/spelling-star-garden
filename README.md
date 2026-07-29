# Spelling Star Garden

A calm, touch-first spelling game for early readers. Short sessions, letter tiles, speech, soft help when stuck.

**Family practice tool.** Separate in-browser profiles per player (no real names in the UI). No cloud accounts. No ads.

## Run (required: HTTP, not file://)

Chrome/Safari block `localStorage` on `file://`. Always serve:

```bash
cd ~/src/spelling-star-garden
python3 -m http.server 8788 --directory public
```

Open: [http://localhost:8788](http://localhost:8788)

### iPad on the same Wi‑Fi

1. On the Mac, note the LAN IP: `ipconfig getifaddr en0` (or System Settings → Network).
2. On the iPad Safari: `http://<that-ip>:8788`
3. Keep the Mac awake and on the same network while playing.

## Deployment (CLI-first — no Workers web UI)

Static files under `public/` only. Root `wrangler.jsonc` has `assets.directory: "./public"`.

**GitHub:** [ngpestelos/spelling-star-garden](https://github.com/ngpestelos/spelling-star-garden) (public)

### One-time auth (pick one)

**A — OAuth (simplest once):**

```bash
cd ~/src/spelling-star-garden
npx wrangler login
# completes in the browser; after that, all deploys are pure CLI
npx wrangler whoami
```

**B — API token (no browser after the token exists):**

1. Create a token with **Workers Scripts:Edit** + **Account:Read** (or use an existing CF token).
2. Export for the shell (or put in a local, untracked env file):

```bash
export CLOUDFLARE_API_TOKEN=…   # never commit
```

### Deploy (every time)

```bash
cd ~/src/spelling-star-garden
./scripts/deploy.sh
# or:
npx wrangler deploy --dry-run --outdir /tmp/ssg-dry-run   # expect ~5 public files
npx wrangler deploy
```

Wrangler prints a `*.workers.dev` URL. Open that on the iPad — no Mac server, no Connect-to-Git.

**Custom domain (live):** [https://spelling.ngpcloud.org](https://spelling.ngpcloud.org)  
Configured in `wrangler.jsonc` as `routes: [{ pattern: "spelling.ngpcloud.org", custom_domain: true }]` plus `workers_dev: true`. Redeploy with `npx wrangler deploy` — DNS is auto-managed on the Cloudflare `ngpcloud.org` zone.

### Optional: Git auto-deploy (skip if you prefer CLI only)

Cloudflare → Workers → Connect to Git → this repo. Same `wrangler.jsonc`. Reject bot PRs that set `assets.directory: "."`. Not required if you always run `./scripts/deploy.sh`.

### Local serve (dev)

```bash
python3 -m http.server 8788 --directory public
```

### Notes

- Profiles/stickers are **per browser** `localStorage` (not synced iPad ↔ Mac).
- Don’t open `file://` — use local HTTP or the workers.dev URL.

## How to play

1. Pick a player (**Star** or **Rainbow**) — separate stickers, gardens, and settings.
2. Tap **Play** (unlocks speech on many tablets).
3. Tap **Hear word**, then tap letters **in order**.
4. After two mistakes on a letter, the right tile glows once.
5. Fill the stars → **Done**. Stickers are cosmetic only.
6. **Switch player** on Home when handing the device over.

### Profiles

| Player | Default word length | Notes |
|--------|---------------------|--------|
| Star | Long (teacher, school, …) | Any old single-player progress migrates here once |
| Rainbow | Medium (apple, happy, …) | Own garden from zero |

Parent settings and **Reset** apply to the **current player only**.

### Parent settings

Tap the ⚙️ gear on Home (player already selected):

| Setting | Purpose |
|---------|---------|
| Words per garden | 3 / 5 / 8 |
| Word length | Short / Medium / Long / Mix |
| Speech | On/off |
| Reduce motion | Less animation |
| Show word (cheat) | Print the word for adult help |
| Reset this player only | Clear that player's stickers & gardens |

If speech fails: the app shows **Ask a grown-up to say the word**. It does **not** flash the spelling unless cheat is on.

## Cold probe (learning check)

After a session, wait ~2 minutes. Dictate **three words they just spelled** without the game. Mark Y/N. That is the real spelling signal; “finished the garden” alone is not.

## Tests

```bash
# with server running
open http://localhost:8788/test.html
```

## Stack

Vanilla HTML/CSS/JS. No build step. Logic in `public/words.js`; UI + profiles in `public/app.js`.

## Phase notes

- Short/medium/long word banks, anagram tiles, scaffold, same-session requeue, bonus check every 3rd word
- Two built-in profiles (Star / Rainbow) — no real personal names

Not included yet: add/rename custom profiles, cross-session practice bag, sight-word mode, custom word lists.
