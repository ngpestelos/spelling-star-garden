# Spelling Star Garden — product notes

Family practice tool for early readers. Calm sessions, letter tiles, speech. No accounts, no ads, no real names in the UI.

## Goals

1. **Confidence first** — beginners get short words (≤4 letters) by default.
2. **Short sessions** — a “garden” is one play-through (3 / 5 / 8 words), then rest.
3. **Cosmetic progress only** — stickers and gardens feel rewarding; they are **not** a learning metric.

## Profiles

| Player | Default word length | Intent |
|--------|---------------------|--------|
| **Star** | Short | Younger / beginner path |
| **Rainbow** | Medium | Slightly longer words |

- Separate stickers, gardens, and settings per player (per browser `localStorage`).
- Display names only (Star / Rainbow) — no real personal names.
- Parent ⚙️ and Reset apply to the **current player only**.

## Gardens

- A **garden** = one completed session (all target stars lit, or session finished).
- **Gardens: N** on Home = `sessionsCompleted` for that player.
- Leaving mid-session does not count a garden.

## Stickers

Cosmetic garden plants unlocked after finishing a garden. They do **not**:

- Gate gameplay or word choice  
- Reflect spelling accuracy  
- Replace a cold probe (see below)

### Unlock order

| # | Id | Label | Emoji |
|---|-----|--------|-------|
| 1 | seedling | Seedling | 🌱 |
| 2 | tulip | Tulip | 🌷 |
| 3 | mushroom | Mushroom | 🍄 |
| 4 | cactus | Cactus | 🌵 |
| 5 | blossom | Blossom | 🌼 |

- First five gardens unlock one new sticker each (in order).
- Further gardens may re-show a sticker in the “complete” UI; unique sticker count stays at most 5.
- Home shows collected sticker emojis in the garden preview.
- Reset this player clears stickers and garden count for that profile only.

## Word difficulty

| Setting | Pool |
|---------|------|
| **Short** | ≤4 letters (beginner default) |
| **Medium** | ≤6 letters |
| **Long** | Multi-syllable stretch (e.g. teacher, children) — parent opt-in |
| **Mix** | Short + medium only (never 7+ letter long words) |

Hard length caps apply even if a bank entry is mis-tagged. Long words like *children* must not appear on short/medium/mix.

## Learning signal (cold probe)

After a session, wait ~2 minutes. Dictate **three words they just spelled** without the game. Mark Y/N.

That is the real spelling signal. “Finished the garden” / sticker unlock alone is **not**.

## Non-goals (for now)

- Cloud accounts or cross-device sync  
- Real names in UI  
- Stickers as achievement scores or leaderboards  
- Sight-word mode / custom lists as first-class product surfaces (may come later)

## Related

- Play and parent settings: [README.md](../README.md)  
- Sticker catalog in code: `public/words.js` (`STICKERS`)  
- Award + home preview: `public/app.js` (`finishSession`, home render)
