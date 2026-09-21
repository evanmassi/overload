# Overload - Agent Development Guide

Overload is a phone-first strength training log. It answers one question at the rack: what did I do last time, and
can I beat it? `README.md` is the product spec. This file is how to change the code.

## Architecture Overview

A static PWA served from GitHub Pages. Plain ES modules, no build step, no dependencies, no `package.json`. Everything
lives on the device in `localStorage`.

```
overload/
├── index.html        # The shell: header, tabs, sheet, save bar. One module entry: src/main.js
├── sw.js             # Service worker: precache list + stale-while-revalidate
├── manifest.json
├── src/
│   ├── main.js       # Entry: mounts the views, subscribes the app view, registers the service worker
│   ├── data/         # The program, off days, extras, how-tos, taxonomy, muscles, constants
│   ├── rules/        # Pure rules over exercises and sets: scoring, rotation, formatting
│   ├── store/        # Saved state and every edit to it: storage, sessions, custom exercises, holds, backup
│   ├── views/        # DOM and audio: one file per screen or piece of one
│   │   └── sheets/   # The pop-up frame and one file per pop-up
│   ├── styles/       # app.css: app styles, built on the design tokens
│   └── ui/           # Design system: each primitive's JS and CSS side by side, tokens/ for colors,
│                     # type, motion and space. Imports nothing from the app
├── test/             # Node suites, no dependencies
└── refs/             # Untracked design references. Read them, never ship from them
```

---

## Layers

The folder is the layer. A file imports only from its own layer or the ones listed before it, and
`test/guards.mjs` fails on anything else.

| Layer | May import | Role |
|-------|------------|------|
| `data/` | `data/` | Plain literals, no logic |
| `rules/` | `data/`, `rules/` | Pure functions: no DOM, no storage, no saved state |
| `store/` | `data/`, `rules/`, `store/` | Saved state and every edit to it. `storage.js` is the only file that touches `localStorage` |
| `ui/` | `ui/` | Design system primitives, no app knowledge |
| `views/` | everything above | DOM and audio. Read rules and the store, never reimplement them |
| `main.js` | everything above | Mounts the views, nothing else |

- Nothing imports `views/app.js` except `main.js`. It picks the screen for the current tab and refreshes the save bar.
- A view that needs a number (score, volume, rotation, target) gets it from `rules/` or `store/`. A rule written
  inside a view is a second copy waiting to drift.
- `store/slots.js` resolves which move fills a slot. It sits in `store/` because naming a custom move reads your saved
  names.

### State and rendering

- One `state` object in `store/state.js`. Change it, then call `notify()`; `main.js` subscribes the app view to it. A
  full re-render is the default.
- The one exception is typing in a set row. A full render would drop focus and the keyboard, so the set field commit
  updates its own card in place (`syncCard` in `views/exerciseCard.js`, `updateSaveBar`). Keep that path narrow.
- `store/session.js` owns the session being edited. Views change it only through its functions (`logSet`,
  `swapSlot`, `setTravel`, `setDay`, `chooseBlock`, `setEffort`, `setNotes`), and each one saves. `logSet` does not
  re-render, because the set row updates in place; the rest do. `flushNow()` runs on hide and pagehide. Views never
  write `state.current` or `state.sessions` directly.
- `persistSessions`, `persistCustomNames`, `persistHolds` in `state.js` are the only save calls. `storage.js` is the
  only reader and writer behind them.

---

## Data Contracts

**Exercise `id` is identity.** History, holds, swaps, how-tos and muscles all key on it. Renaming an id orphans every
logged set. Changing the display name `n` is safe; names are capped at 22 characters so card text never wraps.

**Adding a movement touches four places.** `test/logic.mjs` fails when the pattern, how-to or muscles are missing:
1. The workout or `data/extras.js` entry (`id`, `n`, `s`, `r`, plus `bw` or `unit` when they apply)
2. `taxonomy.js`: its pattern; its load kind unless it is a single dumbbell or `bw`; its side if it is unilateral
3. `howto.js`: 3+ steps and a watch-out line
4. `muscles.js`: primary movers, secondary if any

**Stored session shape** comes from `snapshot()` in `session.js`: `date`, `day`, `block`, `blockIndex`, `entries`
(`{id: [{w, r}]}`, strings as typed), and optional `notes`, `effort`, `startedAt`, `lastLoggedAt`, `swaps`. Keys are
`YYYY-MM-DDTHH:MM:SS` with a `.n` suffix on a collision; older logs are keyed by date alone and must keep sorting
and comparing correctly. Every session has a `date` once loaded, so code reads `session.date` and never the key.

**Storage keys** are `overload.<name>.v1`, defined once in `constants.js`. Legacy shapes are converted at read time
inside `storage.js` (see `migrateLegacySessions` and the legacy key fallback). No migration system until a second
version of a key exists.

**Backup import merges, never overwrites.** For a key present on both sides, the copy with more logged sets wins.

---

## UI

- **Every button goes through `makeButton` or `makeIconButton`**, every text or date input through
  `makeField`, every framed surface through `makePanel`. Never hand-build the layered spans.
- **Colors come from the tokens** in `src/ui/tokens/`. Need a new color, add a token first.
- **Two type families.** Lato for language, IBM Plex Mono for data (weights, reps, times, tags, dates).
- **Phone first, 390px wide.** The number keyboard covers the bottom of the screen while typing, so anything needed
  mid-set lives in the sticky header. Card text never wraps.
- **Every class the code renders needs a rule.** `test/guards.mjs` fails otherwise. Before deleting CSS, search
  `src/` and `index.html` for the class.
- **Evan judges how it looks.** Make the change and say what it does. For a layout bug, measure; do not guess from a
  screenshot.

---

## Service Worker

`ASSETS` in `sw.js` lists every file the app loads. A new module, stylesheet or icon goes into that list in the same
change; `test/guards.mjs` fails otherwise. Bump `CACHE` only to recover from a bad cache, never per deploy. On
localhost, `main.js` unregisters the worker and clears caches so development always sees fresh files.

---

## Agent Instructions

### Mandatory Rules

- **No bandaid solutions.** Fix the cause at the layer that owns it.
- **No zombie code.** Delete unused code immediately.
- **No redundant systems.** One way to do each thing.
- **No breaking changes.** `node test/all.mjs` passes before every commit.
- **All code must be simple and pragmatic.**
- **Never delete files without explicit confirmation.**
- **Never execute, create, or modify anything until told to proceed.** A floated idea is discussion, not a go.

### Pre-Implementation Checklist

1. **Read the data** the change touches (`program.js`, `offdays.js`, the session shape above) before writing code.
2. **Verify exact field names.** Sets are `{w, r}`, a workout's moves are `ex`, sections are `sections[].ex`.
3. **Find the owner.** Search for the module that already does the job before writing a new function.
4. **Check the README section** for the behavior you are changing. It records decisions and why they were made.

### Write-Time Discipline

**1. End-to-end field trace.** A new session field goes through the `state.current` default, `openSession`,
`snapshot()`, backup merge if it matters there, and the view that reads it, all in one change. If nothing reads it at
the end, do not add it.

**2. Overwrite vs intersect.** `Object.assign({}, saved, {field: value})` silently discards the saved value. Decide
explicitly: preserve, intersect, or replace. Replacement needs a `PITFALL:` line saying why.

**3. One shape per concept.** A session, a set, an exercise each have one shape. Never build a parallel object that
carries the same data under different names.

**4. Caller-first: no speculative exports.** No export, constant, storage key or CSS rule without a real caller in the
same change. `test/guards.mjs` fails on an export nothing imports.

**5. No unused parameters.** Every declared parameter is read by at least one caller.

---

## Code Style

Match the surrounding code. It is consistent, and a new file should be indistinguishable from an old one.

| Rule | Do | Don't |
|------|-----|-------|
| Modules | Named exports, relative `./x.js` imports | Default exports, bare specifiers, a bundler |
| Dependencies | Browser and Node built-ins | npm packages, CDN scripts (fonts excepted) |
| Syntax | Two spaces, double quotes, `if(x){`, `}catch(e){` | Reformatting lines you did not change |
| Functions | Plain functions and arrow helpers | Classes (the tests' fake DOM excepted) |
| Absent values | `null`, matching existing state and returns | Mixing in `undefined` for the same meaning |
| Numbers | Named in `constants.js` | Tunable literals inline |
| Async | `.catch(() => {})` only where failure truly does not matter | Floating promises |

### Naming

| Category | Convention | Example |
|----------|------------|---------|
| Folders | lowercase, named for the layer | `rules/`, `views/sheets/` |
| Files | named for the concern; lowercase for one word, camelCase for more | `rotation.js`, `saveBar.js` |
| Functions | camelCase, verb first | `activeBlockIndex`, `openSwapSheet` |
| Constants | UPPER_CASE | `AUTOSAVE_DELAY_MS` |
| Booleans | is/has prefix | `isOffDay`, `hasStalled` |
| Design system primitives | `make` + primitive | `makeButton`, `makeField` |
| CSS classes | lowercase-hyphen; a primitive's parts carry its prefix | `.ex-summary`, `.btn-glyph` |

- **Generic filenames are banned**: no `utils.js`, `helpers.js`, `misc.js`. Name the file after what it contains.
- **One file, one concern.** A new concern gets a new file and a line in the README layout table.
- **A pop-up is a file** in `views/sheets/`, named for what it shows plus `Sheet`: `swapSheet.js`.

---

## Comment Standards

**Zero comments.** No file headers, no JSDoc, no section banners, no line narration, no TODOs, in JS, CSS, HTML or
tests. The code documents itself through naming. If a comment feels needed, rename something.

**Sole exception**: one line containing `PITFALL:` for something a reader cannot infer from the code (a Safari quirk,
a silent failure, an intentional overwrite). See `views/sound.js` for the model.

The design token files keep the group labels they came with. Add none.

---

## Anti-Patterns

### No Speculative Code

Only what a real caller needs now. No stubs, no placeholder functions, no settings for features that do not exist,
no storage key before something writes it.

### No Parallel Systems

| Concern | Use this | Not this |
|---------|----------|----------|
| Persistence | `storage.js` via `persist*` in `state.js` | `localStorage` anywhere else |
| Re-rendering | `notify()` | Calling `render` or a view directly |
| Editing the open session | `session.js` functions | Writing `state.current` from a view |
| Tunable numbers, storage keys, labels | `constants.js` | Inline literals |
| Set summaries, durations, clock text | `format.js` | Per-view formatting |
| Scoring, volume, targets, stalls, back-off | `progression.js` | Math inside a view |
| Beat, match or below | `trend` in `progression.js` | Comparing scores in a view |
| Whether a set counts as logged | `isLogged` in `sets.js` | `set && set.r` |
| Rest after a set | `restAfterSet` in `rules/exercises.js` | Rewriting the ternary |
| Which move fills a slot, and strays | `resolveSlot(slot, swaps)`, `strayIds` in `store/slots.js` | Reading `swaps` by hand |
| Week and version rotation | `rotation.js` | Counting sessions in a view |
| Exercise lookup and derived fields | `rules/exercises.js` (`findExercise`, `workoutFor`) | Walking `PROGRAM` by hand |
| Buttons, inputs, panels | `ui/` | Hand-built markup |
| Opening a pop-up | `openSheet` in `views/sheets/sheet.js` | Touching the sheet elements directly |
| Colors | design tokens | Hex or rgba literals |

### No Convenience Wrappers

No helper that only forwards to another. Callers use `findExercise(id).n`, not a `nameOf(id)` that does the same.

### DRY

Before writing something familiar, search for the existing home. Before extracting, confirm two real callers; a helper
with one caller gets inlined. Watch for:

- The same logic in two views: move it down to a logic module.
- Repeated literals (keys, labels, rest times, class strings): one named home.
- Near-duplicate card or row builders with a small variant: one builder with a parameter.
- Test setup copied between suites: it belongs in the shared test files listed under Tests.

### Docs Follow the Code

A behavior change updates `README.md` in the same commit. The README explains decisions and the reasons for them;
keep those reasons when editing. A README claim with no code behind it is dead code in prose: delete it.

---

## Tests

```bash
node test/all.mjs
```

Three suites, no dependencies, all must pass before a commit.

- `guards.mjs` loads every module against the fake DOM and fails on a dead export, an import from a layer above,
  a rendered class with no CSS rule, or a precache list that disagrees with the files on disk.
- `logic.mjs` covers the data (every movement patterned, tagged, written up) and the logic that can silently corrupt
  history: rotation, targets, volume, name matching, swap identity, backup merging.
- `views.mjs` boots the real views against the fake DOM in `dom.mjs` and asserts what renders.

Shared pieces, never redefined inside a suite: browser fakes (`installDom`, `installStorage`) in `dom.mjs`,
assertions (`section`, `check`, `equal`, `report`) in `checks.mjs`, `logic.mjs` fixtures in `fixtures.mjs`.

Rules:
- New logic gets a test in `logic.mjs`; new rendering gets one in `views.mjs`.
- Every `views.mjs` block opens with `fresh()`. Blocks never inherit state from each other.
- When a decision changes, delete the tests that pinned the old decision. Do not bend them to pass.

---

## Commits

Commit only when asked. The subject is one plain sentence about what changed, as the user would see it: `Each
session button is its own workout for the day`. No prefix, no co-author footer. A body only when the change spans
more than one idea.

---

## Windows Environment

- Shell is PowerShell. Quote paths or use forward slashes.
- **Never use `2>nul`** in Bash. It creates a literal file named `nul`.
- Prefer dedicated tools: Read, Glob, Grep. Use the shell for node, python, git.

---

## Commands

```bash
python -m http.server 8000   # Serve locally, open http://localhost:8000
node test/all.mjs            # All three suites
```
