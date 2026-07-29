/**
 * Spelling Star Garden — UI + session controller + profiles.
 * Depends on words.js (window.SSG).
 */
(function () {
  "use strict";

  const STORAGE = {
    profiles: "ssg_profiles_v2",
    /* legacy single-player keys — migrated once into Zoey's profile */
    settings: "ssg_settings",
    stickers: "ssg_stickers",
    stats: "ssg_stats",
  };

  const DEFAULT_SETTINGS = {
    sessionLength: 5,
    wordLevel: "short",
    speech: true,
    reducedMotion: false,
    showWordCheat: false,
  };

  /** Built-in profiles — display names only (no real personal names). */
  const BUILTIN_PROFILES = [
    {
      id: "star",
      name: "Star",
      emoji: "🌟",
      settings: Object.assign({}, DEFAULT_SETTINGS, { wordLevel: "short" }),
    },
    {
      id: "rainbow",
      name: "Rainbow",
      emoji: "🌈",
      settings: Object.assign({}, DEFAULT_SETTINGS, { wordLevel: "medium" }),
    },
  ];

  /** Old storage ids → new ids (scrub real-name keys). */
  const PROFILE_ID_ALIASES = {
    zoey: "star",
    cali: "rainbow",
  };

  function emptyProgress() {
    return {
      stickers: [],
      stats: { sessionsCompleted: 0, lastPlayISO: null, lastWords: [] },
    };
  }

  function defaultProfileRecord(meta) {
    const progress = emptyProgress();
    return {
      id: meta.id,
      name: meta.name,
      emoji: meta.emoji || "🌱",
      settings: Object.assign({}, DEFAULT_SETTINGS, meta.settings || {}),
      stickers: progress.stickers,
      stats: progress.stats,
    };
  }

  /** @type {{ screen: string, session: object|null }} */
  let state = {
    screen: "profiles",
    session: null,
  };

  function loadRaw(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode / quota */
    }
  }

  function migrateLegacyInto(profile) {
    const legacySettings = loadRaw(STORAGE.settings);
    const legacyStickers = loadRaw(STORAGE.stickers);
    const legacyStats = loadRaw(STORAGE.stats);
    let touched = false;
    if (legacySettings && typeof legacySettings === "object") {
      profile.settings = Object.assign({}, profile.settings, legacySettings);
      touched = true;
    }
    if (Array.isArray(legacyStickers) && legacyStickers.length) {
      profile.stickers = legacyStickers.slice();
      touched = true;
    }
    if (legacyStats && typeof legacyStats === "object") {
      profile.stats = Object.assign({}, profile.stats, legacyStats);
      touched = true;
    }
    if (touched) {
      try {
        localStorage.removeItem(STORAGE.settings);
        localStorage.removeItem(STORAGE.stickers);
        localStorage.removeItem(STORAGE.stats);
      } catch (e) {
        /* ignore */
      }
    }
    return profile;
  }

  function remapLegacyProfileIds(store) {
    if (!store || !store.profiles) return store;
    Object.keys(PROFILE_ID_ALIASES).forEach(function (oldId) {
      const newId = PROFILE_ID_ALIASES[oldId];
      if (store.profiles[oldId] && !store.profiles[newId]) {
        const rec = store.profiles[oldId];
        rec.id = newId;
        /* Fix display name if still a real-name leftover */
        const builtin = BUILTIN_PROFILES.filter(function (b) {
          return b.id === newId;
        })[0];
        if (builtin) {
          rec.name = builtin.name;
          rec.emoji = rec.emoji || builtin.emoji;
        }
        store.profiles[newId] = rec;
        delete store.profiles[oldId];
      } else if (store.profiles[oldId]) {
        delete store.profiles[oldId];
      }
      if (store.activeId === oldId) {
        store.activeId = newId;
      }
    });
    return store;
  }

  /**
   * One-time: legacy default Long → Short for beginner confidence.
   * Sets difficultyMigrated on every path so intentional Long after upgrade is kept.
   * Does not touch medium / mix.
   * @returns {boolean} true if store was mutated (including flag only)
   */
  function applyDifficultyMigration(store) {
    if (!store || store.difficultyMigrated === true) {
      return false;
    }
    Object.keys(store.profiles || {}).forEach(function (id) {
      const p = store.profiles[id];
      if (p && p.settings && p.settings.wordLevel === "long") {
        p.settings.wordLevel = "short";
      }
    });
    store.difficultyMigrated = true;
    return true;
  }

  function loadStore() {
    let store = loadRaw(STORAGE.profiles);
    if (!store || !store.profiles) {
      store = { activeId: null, profiles: {} };
      BUILTIN_PROFILES.forEach(function (meta) {
        store.profiles[meta.id] = defaultProfileRecord(meta);
      });
      /* Give Star any pre-profile single-player progress */
      if (store.profiles.star) {
        migrateLegacyInto(store.profiles.star);
      }
      /* After legacy merge so old ssg_settings long is rewritten once */
      applyDifficultyMigration(store);
      saveRaw(STORAGE.profiles, store);
      return store;
    }
    store = remapLegacyProfileIds(store);
    /* Ensure builtins exist; refresh names from builtins (never keep real names) */
    BUILTIN_PROFILES.forEach(function (meta) {
      if (!store.profiles[meta.id]) {
        store.profiles[meta.id] = defaultProfileRecord(meta);
      } else {
        store.profiles[meta.id].name = meta.name;
        store.profiles[meta.id].id = meta.id;
        if (!store.profiles[meta.id].emoji) {
          store.profiles[meta.id].emoji = meta.emoji;
        }
      }
    });
    /* Drop any non-builtin profiles that still use real-name aliases */
    Object.keys(store.profiles).forEach(function (id) {
      const known = BUILTIN_PROFILES.some(function (b) {
        return b.id === id;
      });
      if (!known) {
        delete store.profiles[id];
        if (store.activeId === id) store.activeId = null;
      }
    });
    applyDifficultyMigration(store);
    saveRaw(STORAGE.profiles, store);
    return store;
  }

  function saveStore(store) {
    saveRaw(STORAGE.profiles, store);
  }

  function getStore() {
    return loadStore();
  }

  function getActiveProfile() {
    const store = getStore();
    if (!store.activeId || !store.profiles[store.activeId]) return null;
    return store.profiles[store.activeId];
  }

  function setActiveProfile(id) {
    const store = getStore();
    if (!store.profiles[id]) return null;
    store.activeId = id;
    saveStore(store);
    return store.profiles[id];
  }

  function updateActiveProfile(mutator) {
    const store = getStore();
    const id = store.activeId;
    if (!id || !store.profiles[id]) return null;
    mutator(store.profiles[id]);
    saveStore(store);
    return store.profiles[id];
  }

  function getSettings() {
    const p = getActiveProfile();
    if (!p) return Object.assign({}, DEFAULT_SETTINGS);
    return Object.assign({}, DEFAULT_SETTINGS, p.settings || {});
  }

  function setSettings(partial) {
    const next = Object.assign(getSettings(), partial);
    updateActiveProfile(function (p) {
      p.settings = next;
    });
    applyMotionClass(next);
    return next;
  }

  function getStickers() {
    const p = getActiveProfile();
    return p && Array.isArray(p.stickers) ? p.stickers.slice() : [];
  }

  function saveStickers(ids) {
    updateActiveProfile(function (p) {
      p.stickers = ids.slice();
    });
  }

  function getStats() {
    const p = getActiveProfile();
    return Object.assign(
      { sessionsCompleted: 0, lastPlayISO: null, lastWords: [] },
      (p && p.stats) || {}
    );
  }

  function setStats(partial) {
    const next = Object.assign(getStats(), partial);
    updateActiveProfile(function (p) {
      p.stats = next;
    });
    return next;
  }

  function applyMotionClass(settings) {
    document.body.classList.toggle(
      "reduce-motion",
      !!(settings && settings.reducedMotion)
    );
  }

  function el(id) {
    return document.getElementById(id);
  }

  function showScreen(name) {
    state.screen = name;
    document.querySelectorAll(".screen").forEach(function (node) {
      node.classList.toggle("active", node.id === "screen-" + name);
    });
  }

  function speechAvailable() {
    return (
      typeof window.speechSynthesis !== "undefined" &&
      !!window.SpeechSynthesisUtterance
    );
  }

  function speakWord(word) {
    const settings = getSettings();
    if (!settings.speech || !speechAvailable()) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.rate = 0.85;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderProfilePicker() {
    const store = getStore();
    const box = el("profile-list");
    box.textContent = "";
    const ids = Object.keys(store.profiles);
    ids.forEach(function (id) {
      const p = store.profiles[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-profile";
      btn.dataset.profileId = id;

      const emoji = document.createElement("span");
      emoji.className = "profile-emoji";
      emoji.textContent = p.emoji || "🌱";

      const label = document.createElement("span");
      label.className = "profile-name";
      label.textContent = p.name;

      const meta = document.createElement("span");
      meta.className = "profile-meta";
      const gardens = (p.stats && p.stats.sessionsCompleted) || 0;
      const stickers = (p.stickers && p.stickers.length) || 0;
      meta.textContent = gardens + " gardens · " + stickers + " stickers";

      btn.appendChild(emoji);
      btn.appendChild(label);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        selectProfile(id);
      });
      box.appendChild(btn);
    });
  }

  function selectProfile(id) {
    const p = setActiveProfile(id);
    if (!p) return;
    applyMotionClass(p.settings);
    updateHome();
    showScreen("home");
  }

  function switchPlayer() {
    if (state.session) {
      if (
        !window.confirm(
          "Leave this garden and switch player? Stars for this game will not be saved."
        )
      ) {
        return;
      }
      state.session = null;
    }
    const store = getStore();
    store.activeId = null;
    saveStore(store);
    renderProfilePicker();
    showScreen("profiles");
  }

  function updateHome() {
    const p = getActiveProfile();
    if (!p) {
      renderProfilePicker();
      showScreen("profiles");
      return;
    }
    const stickers = getStickers();
    const stats = getStats();
    el("player-name").textContent = p.name;
    el("player-emoji").textContent = p.emoji || "🌱";
    el("sticker-count").textContent = String(stickers.length);
    el("session-count").textContent = String(stats.sessionsCompleted || 0);
    const garden = el("garden-preview");
    garden.textContent = "";
    SSG.STICKERS.forEach(function (s) {
      if (stickers.indexOf(s.id) !== -1) {
        garden.textContent += s.emoji;
      }
    });
    if (!garden.textContent) garden.textContent = "🌱";
  }

  function startSession() {
    if (!getActiveProfile()) {
      renderProfilePicker();
      showScreen("profiles");
      return;
    }
    const settings = getSettings();
    const length = Number(settings.sessionLength) || 5;
    const level = settings.wordLevel || "short";
    const words = SSG.pickSessionWords(length, SSG.WORD_BANK, null, level);
    state.session = {
      queue: words.slice(1),
      current: words[0] || null,
      starsTarget: length,
      starsLit: 0,
      filled: 0,
      tiles: [],
      usedTileIds: {},
      positionMisses: 0,
      totalMisses: 0,
      neededScaffold: false,
      scaffoldShownForPosition: false,
      requeuedSet: new Set(),
      wordsCompletedForStars: 0,
      sessionWordLog: [],
      awaitingCelebrate: false,
    };
    if (!state.session.current) {
      alert("No words in the word bank.");
      return;
    }
    showScreen("session");
    loadCurrentWord(true);
  }

  function loadCurrentWord(fromPlayGesture) {
    const s = state.session;
    if (!s || !s.current) return;

    s.filled = 0;
    s.positionMisses = 0;
    s.totalMisses = 0;
    s.neededScaffold = false;
    s.scaffoldShownForPosition = false;
    s.usedTileIds = {};
    s.tiles = SSG.buildTiles(s.current.word);
    s.awaitingCelebrate = false;

    renderStars();
    renderWordUI();

    const settings = getSettings();
    if (fromPlayGesture && settings.speech) {
      speakWord(s.current.word);
    }
  }

  function renderStars() {
    const s = state.session;
    const box = el("stars");
    box.textContent = "";
    for (let i = 0; i < s.starsTarget; i++) {
      const span = document.createElement("span");
      span.className = "star" + (i < s.starsLit ? " lit" : "");
      span.textContent = "⭐";
      span.setAttribute("aria-hidden", "true");
      box.appendChild(span);
    }
  }

  function renderWordUI() {
    const s = state.session;
    const item = s.current;
    const settings = getSettings();
    const longWord = item.word.length >= 7;
    document.body.classList.toggle("long-word", longWord);

    const bonus = el("bonus-badge");
    bonus.classList.toggle("show", !!item.isBonusCheck);
    bonus.textContent = item.isBonusCheck ? "Bonus check — from memory!" : "";

    const pic = el("picture");
    pic.textContent = item.isBonusCheck ? "✨" : item.emoji;
    pic.classList.toggle("hidden-pic", false);

    const cheat = el("cheat-word");
    cheat.textContent = settings.showWordCheat ? item.word : "";

    const parentHint = el("parent-read-hint");
    if (!settings.speech || !speechAvailable()) {
      parentHint.textContent = "Ask a grown-up to say the word";
    } else {
      parentHint.textContent = "";
    }

    el("hint").textContent = item.isBonusCheck
      ? "Hear the word, then spell it again"
      : "Tap the letters in order";
    el("hint").classList.remove("soft-try");

    const slots = el("slots");
    slots.textContent = "";
    for (let i = 0; i < item.word.length; i++) {
      const slot = document.createElement("div");
      slot.className = "slot" + (i < s.filled ? " filled" : "");
      slot.textContent = i < s.filled ? item.word[i] : "";
      slots.appendChild(slot);
    }

    const tilesBox = el("tiles");
    tilesBox.textContent = "";
    const need = SSG.expectedLetter(item.word, s.filled);
    s.tiles.forEach(function (tile) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.textContent = tile.letter;
      btn.dataset.tileId = tile.id;
      btn.dataset.letter = tile.letter;
      if (s.usedTileIds[tile.id]) {
        btn.disabled = true;
      }
      if (
        s.scaffoldShownForPosition &&
        need &&
        tile.letter === need &&
        !s.usedTileIds[tile.id]
      ) {
        btn.classList.add("scaffold");
      }
      btn.addEventListener("click", onTileTap);
      tilesBox.appendChild(btn);
    });
  }

  function onTileTap(ev) {
    const s = state.session;
    if (!s || s.awaitingCelebrate) return;
    const btn = ev.currentTarget;
    if (btn.disabled) return;

    const tileId = btn.dataset.tileId;
    const letter = btn.dataset.letter;
    const result = SSG.scoreTap(s.current.word, s.filled, letter);

    if (!result.correct) {
      s.totalMisses += 1;
      const miss = SSG.updateMisses(s.positionMisses, false);
      s.positionMisses = miss.missesAfter;
      if (miss.showScaffold && !s.scaffoldShownForPosition) {
        s.scaffoldShownForPosition = true;
        s.neededScaffold = true;
      }
      el("hint").textContent = "Try again";
      el("hint").classList.add("soft-try");
      btn.classList.remove("shake");
      void btn.offsetWidth;
      btn.classList.add("shake");
      renderWordUI();
      return;
    }

    s.usedTileIds[tileId] = true;
    s.filled = result.nextFilled;
    s.positionMisses = 0;
    s.scaffoldShownForPosition = false;
    el("hint").classList.remove("soft-try");
    el("hint").textContent = "";

    if (result.complete) {
      onWordComplete();
    } else {
      renderWordUI();
    }
  }

  function onWordComplete() {
    const s = state.session;
    const item = s.current;
    s.awaitingCelebrate = true;

    const hard = SSG.shouldRequeueWord(
      s.neededScaffold,
      s.totalMisses,
      item.word
    );
    if (hard && !item.isBonusCheck) {
      const rq = SSG.maybeRequeue(s.queue, item, s.requeuedSet);
      s.queue = rq.queue;
      s.requeuedSet = rq.requeuedSet;
    }

    if (!item.isBonusCheck) {
      s.starsLit += 1;
      s.wordsCompletedForStars += 1;
      s.sessionWordLog.push(item.word);
      const bonus = SSG.maybeBonusCheck(s.wordsCompletedForStars, item);
      if (bonus) {
        s.queue.unshift(bonus);
      }
    }

    showCelebrate();
    renderStars();

    window.setTimeout(function () {
      advanceOrComplete();
    }, getSettings().reducedMotion ? 200 : 700);
  }

  function showCelebrate() {
    const c = el("celebrate");
    c.textContent = "✨";
    c.classList.remove("show");
    void c.offsetWidth;
    c.classList.add("show");
  }

  function advanceOrComplete() {
    const s = state.session;
    if (!s) return;

    if (s.starsLit >= s.starsTarget) {
      finishSession();
      return;
    }

    if (!s.queue.length) {
      finishSession();
      return;
    }

    s.current = s.queue.shift();
    loadCurrentWord(false);
  }

  function finishSession() {
    const s = state.session;
    const stickers = getStickers();
    let awarded = null;
    for (let i = 0; i < SSG.STICKERS.length; i++) {
      if (stickers.indexOf(SSG.STICKERS[i].id) === -1) {
        awarded = SSG.STICKERS[i];
        stickers.push(awarded.id);
        saveStickers(stickers);
        break;
      }
    }
    if (!awarded && SSG.STICKERS.length) {
      awarded = SSG.STICKERS[stickers.length % SSG.STICKERS.length];
    }

    setStats({
      sessionsCompleted: (getStats().sessionsCompleted || 0) + 1,
      lastPlayISO: new Date().toISOString(),
      lastWords: (s && s.sessionWordLog) || [],
    });

    const p = getActiveProfile();
    el("complete-stars").textContent = "⭐".repeat(
      s ? Math.min(s.starsLit, s.starsTarget) : 0
    );
    el("complete-msg").textContent =
      (p ? p.name + "'s " : "") + "garden complete!";
    el("rest-note").textContent = "Great job — rest your brain!";
    if (awarded) {
      el("sticker-award").textContent = awarded.emoji;
      el("sticker-label").textContent = "New sticker: " + awarded.label;
    } else {
      el("sticker-award").textContent = "🌟";
      el("sticker-label").textContent = "You grew more stars!";
    }

    state.session = null;
    showScreen("complete");
    el("btn-done").focus();
  }

  function exitSession() {
    if (!state.session) {
      showScreen("home");
      updateHome();
      return;
    }
    if (
      window.confirm(
        "Leave this garden? Stars for this game will not be saved."
      )
    ) {
      state.session = null;
      showScreen("home");
      updateHome();
    }
  }

  function openParent() {
    if (!getActiveProfile()) {
      alert("Pick a player first.");
      return;
    }
    const settings = getSettings();
    const p = getActiveProfile();
    el("parent-player-label").textContent =
      "Editing settings for " + p.name;
    el("setting-length").value = String(settings.sessionLength || 5);
    el("setting-level").value = settings.wordLevel || "short";
    el("setting-speech").checked = settings.speech !== false;
    el("setting-motion").checked = !!settings.reducedMotion;
    el("setting-cheat").checked = !!settings.showWordCheat;
    showScreen("parent");
  }

  function saveParent() {
    setSettings({
      sessionLength: Number(el("setting-length").value) || 5,
      wordLevel: el("setting-level").value || "short",
      speech: el("setting-speech").checked,
      reducedMotion: el("setting-motion").checked,
      showWordCheat: el("setting-cheat").checked,
    });
    showScreen("home");
    updateHome();
  }

  function resetProgress() {
    const p = getActiveProfile();
    if (!p) return;
    if (
      !window.confirm(
        "Reset stickers and gardens for " + p.name + " only?"
      )
    ) {
      return;
    }
    saveStickers([]);
    setStats({ sessionsCompleted: 0, lastPlayISO: null, lastWords: [] });
    updateHome();
  }

  function bind() {
    el("btn-play").addEventListener("click", function () {
      startSession();
    });
    el("btn-switch-player").addEventListener("click", switchPlayer);
    el("btn-hear").addEventListener("click", function () {
      if (state.session && state.session.current) {
        const ok = speakWord(state.session.current.word);
        if (!ok) {
          el("parent-read-hint").textContent =
            "Ask a grown-up to say the word";
        }
      }
    });
    el("btn-exit").addEventListener("click", exitSession);
    el("btn-done").addEventListener("click", function () {
      showScreen("home");
      updateHome();
    });
    el("btn-again").addEventListener("click", function () {
      startSession();
    });
    el("btn-parent-save").addEventListener("click", saveParent);
    el("btn-parent-back").addEventListener("click", function () {
      showScreen("home");
      updateHome();
    });
    el("btn-reset").addEventListener("click", resetProgress);

    el("btn-gear").addEventListener("click", openParent);
  }

  function init() {
    loadStore();
    bind();
    const active = getActiveProfile();
    if (active) {
      applyMotionClass(active.settings);
      updateHome();
      showScreen("home");
    } else {
      renderProfilePicker();
      showScreen("profiles");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
