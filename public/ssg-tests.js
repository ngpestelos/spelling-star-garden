/**
 * Shared pure suites for Spelling Star Garden (words.js / SSG).
 * Browser: loaded by test.html after words.js.
 * CI/Node: loaded by scripts/run-tests.mjs.
 *
 * Expects global SSG. Exposes runSsgTests() → { pass, fail, lines }.
 */
(function (global) {
  "use strict";

  function runSsgTests() {
    const SSG = global.SSG;
    if (!SSG) {
      throw new Error("SSG not found — load words.js before ssg-tests.js");
    }

    let pass = 0;
    let fail = 0;
    const lines = [];

    function assert(cond, name) {
      if (cond) {
        pass++;
        lines.push("PASS  " + name);
      } else {
        fail++;
        lines.push("FAIL  " + name);
      }
    }

    function suite(name, fn) {
      lines.push("\n## " + name);
      fn();
    }

    /* deterministic rng factory */
    function seqRng(seq) {
      let i = 0;
      return function () {
        const v = seq[i % seq.length];
        i++;
        return v;
      };
    }

    suite("buildTiles multiset", function () {
      const tiles = SSG.buildTiles("mom", function () {
        return 0.5;
      });
      assert(tiles.length === 3, "mom has 3 tiles");
      const letters = tiles
        .map(function (t) {
          return t.letter;
        })
        .sort()
        .join("");
      assert(letters === "mmo", "mom multiset m,m,o");
      const ids = {};
      let unique = true;
      tiles.forEach(function (t) {
        if (ids[t.id]) unique = false;
        ids[t.id] = true;
      });
      assert(unique, "tile ids unique for duplicate letters");
    });

    suite("scoreTap sequential", function () {
      let f = 0;
      let r = SSG.scoreTap("cat", f, "c");
      assert(r.correct && r.nextFilled === 1 && !r.complete, "c first");
      f = r.nextFilled;
      r = SSG.scoreTap("cat", f, "x");
      assert(!r.correct && r.nextFilled === 1, "wrong stays");
      r = SSG.scoreTap("cat", f, "a");
      assert(r.correct && r.nextFilled === 2, "a second");
      f = r.nextFilled;
      r = SSG.scoreTap("cat", f, "t");
      assert(r.correct && r.complete, "t completes");
    });

    suite("updateMisses scaffold", function () {
      let m = SSG.updateMisses(0, false);
      assert(m.missesAfter === 1 && !m.showScaffold, "first miss no scaffold");
      m = SSG.updateMisses(1, false);
      assert(m.missesAfter === 2 && m.showScaffold, "second miss scaffolds");
      m = SSG.updateMisses(2, true);
      assert(m.missesAfter === 0 && !m.showScaffold, "correct resets misses");
    });

    suite("pickSessionWords", function () {
      const w = SSG.pickSessionWords(
        5,
        SSG.WORD_BANK,
        seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
      );
      assert(w.length === 5, "length 5");
      assert(
        w.every(function (x) {
          return x.word && x.emoji && !x.isBonusCheck;
        }),
        "shape ok"
      );
      const short = SSG.pickSessionWords(3, SSG.WORD_BANK.slice(0, 2));
      assert(short.length === 2, "caps at bank size");
    });

    suite("requeue once", function () {
      const item = { word: "cat", emoji: "🐱", isBonusCheck: false };
      const set = new Set();
      const q1 = SSG.maybeRequeue([{ word: "dog", emoji: "🐶" }], item, set);
      assert(q1.queue.length === 2, "requeued length");
      assert(q1.requeuedSet.has("cat"), "marked requeued");
      const q2 = SSG.maybeRequeue(q1.queue, item, q1.requeuedSet);
      assert(q2.queue.length === 2, "no double requeue");
      const bonus = { word: "cat", emoji: "🐱", isBonusCheck: true };
      const q3 = SSG.maybeRequeue([], bonus, new Set());
      assert(q3.queue.length === 0, "bonus not requeued");
    });

    suite("shouldRequeueWord", function () {
      assert(SSG.shouldRequeueWord(true, 0, "cat"), "scaffold → requeue");
      assert(SSG.shouldRequeueWord(false, 4, "cat"), "short: misses past limit");
      assert(!SSG.shouldRequeueWord(false, 2, "cat"), "easy short no requeue");
      assert(
        !SSG.shouldRequeueWord(false, 4, "teacher"),
        "long word allows more misses before requeue"
      );
      assert(
        SSG.shouldRequeueWord(false, 6, "teacher"),
        "long word still requeues after enough misses"
      );
    });

    suite("long words + filter", function () {
      const long = SSG.filterBankByLevel("long");
      assert(
        long.some(function (e) {
          return e.word === "teacher";
        }),
        "teacher in long bank"
      );
      assert(
        long.every(function (e) {
          return e.level === "long";
        }),
        "only long"
      );
      const tiles = SSG.buildTiles("teacher", function () {
        return 0.3;
      });
      assert(tiles.length === 7, "teacher has 7 tiles");
      let f = 0;
      "teacher".split("").forEach(function (ch) {
        const r = SSG.scoreTap("teacher", f, ch);
        assert(r.correct, "letter " + ch);
        f = r.nextFilled;
      });
      assert(f === 7, "teacher spelled");
      const session = SSG.pickSessionWords(3, SSG.WORD_BANK, null, "long");
      assert(session.length === 3, "long session size");
      assert(
        session.every(function (w) {
          return w.word.length >= 6;
        }),
        "long session words are long"
      );
    });

    suite("maybeBonusCheck every 3rd", function () {
      const item = { word: "sun", emoji: "☀️", isBonusCheck: false };
      assert(SSG.maybeBonusCheck(3, item).isBonusCheck, "3rd star bonus");
      assert(SSG.maybeBonusCheck(1, item) === null, "1st no bonus");
      assert(
        SSG.maybeBonusCheck(3, { word: "sun", isBonusCheck: true }) === null,
        "no bonus of bonus"
      );
    });

    suite("expectedLetter", function () {
      assert(SSG.expectedLetter("pig", 0) === "p", "first");
      assert(SSG.expectedLetter("pig", 3) === null, "done");
    });

    suite("WORD_BANK sanity", function () {
      assert(SSG.WORD_BANK.length >= 40, "enough words");
      assert(
        SSG.WORD_BANK.every(function (e) {
          return /^[a-z]{3,12}$/.test(e.word) && e.emoji && e.level;
        }),
        "words lowercase 3–12 letters with emoji + level"
      );
    });

    lines.push(
      "\n\n" +
        (fail === 0 ? "ALL PASSED" : "FAILURES") +
        " — pass=" +
        pass +
        " fail=" +
        fail
    );

    return { pass: pass, fail: fail, lines: lines };
  }

  global.runSsgTests = runSsgTests;
})(typeof window !== "undefined" ? window : globalThis);
