/**
 * Spelling Star Garden — word bank + pure helpers (no DOM).
 * Multiset-aware anagram tiles. Levels: short | medium | long.
 */
(function (global) {
  "use strict";

  /**
   * level:
   *   short  — 3–4 letters (CVC / simple) — beginner default; hard max 4
   *   medium — 5–6 letters; hard max 6
   *   long   — multi-syllable (teacher, children, …); not for beginners
   *   mix    — short + medium only (never long / 7+ letter words)
   * Default level when omitted: short (beginner confidence).
   */
  const LEVEL_MAX_LEN = { short: 4, medium: 6 };
  const WORD_BANK = [
    // short
    { word: "cat", emoji: "🐱", level: "short" },
    { word: "dog", emoji: "🐶", level: "short" },
    { word: "sun", emoji: "☀️", level: "short" },
    { word: "hat", emoji: "🎩", level: "short" },
    { word: "bed", emoji: "🛏️", level: "short" },
    { word: "pig", emoji: "🐷", level: "short" },
    { word: "cup", emoji: "🥤", level: "short" },
    { word: "bus", emoji: "🚌", level: "short" },
    { word: "fox", emoji: "🦊", level: "short" },
    { word: "map", emoji: "🗺️", level: "short" },
    { word: "box", emoji: "📦", level: "short" },
    { word: "fish", emoji: "🐟", level: "short" },
    { word: "bird", emoji: "🐦", level: "short" },
    { word: "frog", emoji: "🐸", level: "short" },
    { word: "tree", emoji: "🌳", level: "short" },
    { word: "moon", emoji: "🌙", level: "short" },
    { word: "star", emoji: "⭐", level: "short" },
    { word: "book", emoji: "📖", level: "short" },
    { word: "hand", emoji: "✋", level: "short" },
    { word: "milk", emoji: "🥛", level: "short" },
    // medium
    { word: "apple", emoji: "🍎", level: "medium" },
    { word: "happy", emoji: "😊", level: "medium" },
    { word: "water", emoji: "💧", level: "medium" },
    { word: "house", emoji: "🏠", level: "medium" },
    { word: "plant", emoji: "🪴", level: "medium" },
    { word: "tiger", emoji: "🐯", level: "medium" },
    { word: "horse", emoji: "🐴", level: "medium" },
    { word: "bread", emoji: "🍞", level: "medium" },
    { word: "chair", emoji: "🪑", level: "medium" },
    { word: "cloud", emoji: "☁️", level: "medium" },
    { word: "smile", emoji: "😄", level: "medium" },
    { word: "music", emoji: "🎵", level: "medium" },
    { word: "pizza", emoji: "🍕", level: "medium" },
    { word: "train", emoji: "🚆", level: "medium" },
    { word: "grape", emoji: "🍇", level: "medium" },
    { word: "lemon", emoji: "🍋", level: "medium" },
    { word: "beach", emoji: "🏖️", level: "medium" },
    { word: "candy", emoji: "🍬", level: "medium" },
    { word: "queen", emoji: "👑", level: "medium" },
    { word: "sleep", emoji: "😴", level: "medium" },
    // long — includes teacher and similar multi-syllable words
    { word: "teacher", emoji: "👩‍🏫", level: "long" },
    { word: "school", emoji: "🏫", level: "long" },
    { word: "friend", emoji: "🤝", level: "long" },
    { word: "sister", emoji: "👧", level: "long" },
    { word: "brother", emoji: "👦", level: "long" },
    { word: "mother", emoji: "👩", level: "long" },
    { word: "father", emoji: "👨", level: "long" },
    { word: "family", emoji: "👨‍👩‍👧", level: "long" },
    { word: "garden", emoji: "🌺", level: "long" },
    { word: "flower", emoji: "🌸", level: "long" },
    { word: "window", emoji: "🪟", level: "long" },
    { word: "animal", emoji: "🐾", level: "long" },
    { word: "banana", emoji: "🍌", level: "long" },
    { word: "orange", emoji: "🍊", level: "long" },
    { word: "purple", emoji: "🟣", level: "long" },
    { word: "yellow", emoji: "🟡", level: "long" },
    { word: "people", emoji: "👥", level: "long" },
    { word: "morning", emoji: "🌅", level: "long" },
    { word: "evening", emoji: "🌆", level: "long" },
    { word: "birthday", emoji: "🎂", level: "long" },
    { word: "butterfly", emoji: "🦋", level: "long" },
    { word: "elephant", emoji: "🐘", level: "long" },
    { word: "computer", emoji: "💻", level: "long" },
    { word: "rainbow", emoji: "🌈", level: "long" },
    { word: "picture", emoji: "🖼️", level: "long" },
    { word: "because", emoji: "💭", level: "long" },
    { word: "together", emoji: "🤗", level: "long" },
    { word: "beautiful", emoji: "✨", level: "long" },
    { word: "children", emoji: "🧒", level: "long" },
    { word: "classroom", emoji: "📚", level: "long" },
    { word: "spelling", emoji: "✏️", level: "long" },
  ];

  function filterBankByLevel(level, bank) {
    const source = bank || WORD_BANK;
    const lv = level || "short";

    function withinCap(entry, maxLen) {
      if (!entry || !entry.word) return false;
      return entry.word.length <= maxLen;
    }

    if (lv === "mix") {
      /* Short + medium only — never 7+ letter long words (e.g. children). */
      return source.filter(function (e) {
        return (
          (e.level === "short" && withinCap(e, LEVEL_MAX_LEN.short)) ||
          (e.level === "medium" && withinCap(e, LEVEL_MAX_LEN.medium))
        );
      });
    }
    if (lv === "short" || lv === "medium") {
      const maxLen = LEVEL_MAX_LEN[lv];
      return source.filter(function (e) {
        return e.level === lv && withinCap(e, maxLen);
      });
    }
    if (lv === "long") {
      return source.filter(function (e) {
        return e.level === "long";
      });
    }
    /* Unknown level → beginner short (fail safe). */
    return source.filter(function (e) {
      return e.level === "short" && withinCap(e, LEVEL_MAX_LEN.short);
    });
  }

  /** Fisher–Yates; does not mutate input. */
  function shuffle(arr, rng) {
    const a = arr.slice();
    const random = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /**
   * Multiset anagram tiles for a word (no extra distractors).
   * Returns array of { id, letter } so duplicate letters are distinct tiles.
   */
  function buildTiles(word, rng) {
    const letters = String(word).toLowerCase().split("");
    const tiles = letters.map(function (letter, index) {
      return {
        id: letter + "-" + index + "-" + Math.floor((rng || Math.random)() * 1e9),
        letter: letter,
      };
    });
    return shuffle(tiles, rng);
  }

  function expectedLetter(word, filledCount) {
    if (filledCount >= word.length) return null;
    return word[filledCount].toLowerCase();
  }

  function scoreTap(word, filledCount, tileLetter) {
    const need = expectedLetter(word, filledCount);
    if (need === null) {
      return { correct: false, complete: true, nextFilled: filledCount };
    }
    const ok = String(tileLetter).toLowerCase() === need;
    const next = ok ? filledCount + 1 : filledCount;
    return {
      correct: ok,
      complete: ok && next >= word.length,
      nextFilled: next,
    };
  }

  function updateMisses(positionMisses, wasCorrect) {
    if (wasCorrect) {
      return { showScaffold: false, missesAfter: 0 };
    }
    const missesAfter = positionMisses + 1;
    return { showScaffold: missesAfter >= 2, missesAfter: missesAfter };
  }

  /**
   * @param length session size
   * @param bank optional full bank
   * @param rng optional
   * @param level short|medium|long|mix
   */
  function pickSessionWords(length, bank, rng, level) {
    const pool = shuffle(filterBankByLevel(level, bank || WORD_BANK), rng);
    const n = Math.min(Math.max(1, length), pool.length);
    return pool.slice(0, n).map(function (entry) {
      return {
        word: entry.word.toLowerCase(),
        emoji: entry.emoji,
        level: entry.level,
        isBonusCheck: false,
      };
    });
  }

  function maybeRequeue(queue, item, requeuedSet) {
    const w = item.word.toLowerCase();
    if (requeuedSet.has(w) || item.isBonusCheck) {
      return { queue: queue.slice(), requeuedSet: requeuedSet };
    }
    const nextSet = new Set(requeuedSet);
    nextSet.add(w);
    const clone = queue.slice();
    const insertAt =
      clone.length <= 1 ? clone.length : 1 + Math.floor(Math.random() * clone.length);
    const copy = {
      word: item.word,
      emoji: item.emoji,
      level: item.level,
      isBonusCheck: false,
      isRequeue: true,
    };
    clone.splice(Math.min(insertAt, clone.length), 0, copy);
    return { queue: clone, requeuedSet: nextSet };
  }

  /** Longer words get a higher miss budget before auto-requeue. */
  function shouldRequeueWord(neededScaffold, totalMisses, word) {
    const len = word && word.length ? word.length : 3;
    const missLimit = Math.max(3, Math.floor(len / 2) + 1);
    return neededScaffold || totalMisses > missLimit;
  }

  function maybeBonusCheck(completedStarIndex, item) {
    if (item.isBonusCheck) return null;
    if (completedStarIndex % 3 !== 0) return null;
    return {
      word: item.word,
      emoji: item.emoji,
      level: item.level,
      isBonusCheck: true,
    };
  }

  const STICKERS = [
    { id: "seedling", emoji: "🌱", label: "Seedling" },
    { id: "tulip", emoji: "🌷", label: "Tulip" },
    { id: "mushroom", emoji: "🍄", label: "Mushroom" },
    { id: "cactus", emoji: "🌵", label: "Cactus" },
    { id: "blossom", emoji: "🌼", label: "Blossom" },
  ];

  global.SSG = {
    WORD_BANK: WORD_BANK,
    STICKERS: STICKERS,
    shuffle: shuffle,
    filterBankByLevel: filterBankByLevel,
    buildTiles: buildTiles,
    expectedLetter: expectedLetter,
    scoreTap: scoreTap,
    updateMisses: updateMisses,
    pickSessionWords: pickSessionWords,
    maybeRequeue: maybeRequeue,
    shouldRequeueWord: shouldRequeueWord,
    maybeBonusCheck: maybeBonusCheck,
  };
})(typeof window !== "undefined" ? window : globalThis);
