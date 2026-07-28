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

## Deployment (same pattern as [nowshowing](https://github.com/ngpestelos/nowshowing))

- Static files only under `public/`
- `wrangler.jsonc` → `assets.directory: ./public` (repo scripts/README never served)
- **GitHub repo (done):** [ngpestelos/spelling-star-garden](https://github.com/ngpestelos/spelling-star-garden) (private)
- **Cloudflare auto-deploys on every push to `master`** once the Worker is connected (below)

### One-time: connect Cloudflare to Git

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Workers**
2. **Connect to Git** → select `ngpestelos/spelling-star-garden`
3. Settings:
   - Build command: **leave empty**
   - Deploy command: `npx wrangler deploy` (default — reads `wrangler.jsonc`)
4. Deploy. You’ll get a `*.workers.dev` URL — open that on the iPad.

Optional custom domain: project → Settings → Domains → e.g. `spelling.ngpcloud.org` + DNS CNAME (same as nowshowing).

**Do not merge** a Cloudflare bot PR that sets `assets.directory` to `"."` — that would publish the whole repo. Keep `./public`.

### Day-to-day updates

```bash
cd ~/src/spelling-star-garden
# edit public/…
git add -A && git commit -m "…" && git push
```

Cloudflare redeploys from `master` in ~30–60s. No local `wrangler deploy` required after Git is connected.

### Local / dry-run (optional)

```bash
python3 -m http.server 8788 --directory public
npx wrangler deploy --dry-run --outdir /tmp/ssg-dry-run
# expect ~5 files from ./public only
```

### Notes

- Profiles/stickers are **per browser** `localStorage` (not synced iPad ↔ Mac).
- Don’t open `file://` — use local HTTP or the workers.dev / custom URL.

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

Hold the ⚙️ gear on Home for **2 seconds** (player already selected):

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
