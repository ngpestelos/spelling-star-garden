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

## Deploy (Cloudflare — stable URL, no laptop)

Same pattern as `nowshowing`: static files in `public/`, config in `wrangler.jsonc`.

### One-time setup

1. **Cloudflare account** + logged-in Wrangler:

   ```bash
   cd ~/src/spelling-star-garden
   npx wrangler login
   ```

2. **Dry-run** (should report 5 files from `./public` only — not the whole repo):

   ```bash
   npx wrangler deploy --dry-run --outdir /tmp/ssg-dry-run
   ```

### Deploy

```bash
cd ~/src/spelling-star-garden
npx wrangler deploy
```

Wrangler prints a `*.workers.dev` URL. Open that on the iPad; no Mac server needed.

### Optional: custom domain

Cloudflare dashboard → Workers & Pages → **spelling-star-garden** → Settings → Domains → add e.g. `spelling.yourdomain.com`, then CNAME in DNS if not auto-added.

### Optional: Git-connected auto-deploy

```bash
cd ~/src/spelling-star-garden
git init
git add public wrangler.jsonc README.md
git commit -m "Spelling Star Garden"
gh repo create spelling-star-garden --private --source=. --push
```

Then: Cloudflare → Workers → Create → Connect to Git → this repo.  
Build command: empty. Deploy: `npx wrangler deploy` (default).  

**Do not merge** a bot PR that sets `assets.directory` to `"."` — that would publish the whole repo. Keep `./public`.

### Notes

- Profiles/stickers stay in **each device’s browser** `localStorage` (not synced across iPad/Mac).
- Prefer a **private** GitHub repo if the code is family-only; the game itself has no login.
- Don’t open `file://` — always HTTP or the workers.dev URL.

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
