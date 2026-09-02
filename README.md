# Overload

A strength training log built to answer one question at the rack: what did I do last time, and can I beat it?

Live at **https://evanmassi.github.io/overload/**

## The program

Three sessions, rotating through three weeks (A → B → C → A) so nothing repeats inside a cycle.

| | Chest | Legs | Arms |
|---|---|---|---|
| **Trains** | Chest & Back | Legs & Back | Shoulders & Arms |
| **Week A** | volume, flat-press lead | hip hinge + unilateral | strict form, high rep |
| **Week B** | incline lead | unilateral bias | standing press |
| **Week C** | heavy, 5×5 lead | heavy single-leg | explosive press |

Sessions are identified by what they train, not by day of week. The week letter advances once all three sessions in it are logged, whenever that happens — miss a Wednesday and you do Legs on Thursday instead. Nothing gets skipped, and every lift keeps a fair comparison against its own last performance.

Every session is 8 main moves (23-27 sets) plus a core finisher of 3 supersets run for 2 rounds each. Roughly 75 minutes including warmup.

Weekly set volume per muscle: chest 12.3, back 16.7, quads 10, hams 8, delts 13, bis 7, tris 7, calves 3.7.

Equipment assumed: dumbbells, EZ bar, pull-up bar, adjustable bench, cable stack. No specialty machines beyond a lat pulldown, seated row, and leg curl.

## Using it

Type weight and reps into each set. The greyed-out placeholder is what you did that same set last time, so an empty box already tells you the number to beat. A ▲ appears when you beat it, `=` when you match it.

Because of the A/B/C rotation, "last time" for most lifts is a full cycle ago. Lifts that appear in more than one week come back sooner.

**What weight to write** is stated on every card. `PER DUMBBELL` means the number stamped on one bell, not the pair (two 50s is 50). `ONE DUMBBELL` is a single bell held in both hands. `TOTAL W/ BAR` is the EZ bar plus plates. `STACK` is the pin number. `BODYWEIGHT +` means leave it blank unless you added weight. A `PER LEG` / `PER ARM` / `PER SIDE` tag marks the 20 unilateral moves, where the reps shown are what each side does.

Session volume accounts for both: a walking lunge holding two 40s for 12 per leg counts 40 × 2 dumbbells × 12 reps × 2 legs.

**Tap an exercise name** for a how-to: 3-4 numbered steps and the one thing people get wrong, for all 92 movements. It ships in the page, so it opens instantly with no signal. A YouTube search link sits at the bottom of the sheet for when you want to see it moving.

The write-ups are plain-language descriptions of standard technique, not a trainer's instruction. For the fussier moves (Copenhagen plank, Z-press, ab wheel) watch a video the first time and use the steps as a reminder afterwards.

**Swap any exercise** with the `swap` button on its card. You get moves that train the same pattern first, then everything else in the program, then a free-text box for anything not in it. A swap applies to that session only; the next cycle prescribes the original again. History follows the movement, not the slot, so a substitute is compared against the last time you did *that* move.

Exercises you type yourself are saved and listed under **Your exercises** at the top of the swap sheet, with rename and remove. Names are matched loosely, so `lateral push ups`, `Lateral Push-Ups` and `lateral pushups` are all the same exercise and keep one shared history; typing the name of a move already in the program resolves to that move rather than creating a duplicate. Removing a custom exercise also deletes its logged sets, and says how many before it does.

**The target line** on each card reads `GO FOR 50×8 · ADD WEIGHT`. It suggests more weight once you have topped the prescribed rep range on every set, and one more rep otherwise.

**Session notes** at the bottom of the log. They show on the History tab.

**Fixing a mistake**: tap any card on the History tab to open that session in the Log tab, where every field is editable. `delete` on a history card removes the session; it asks once before it does.

**Tap the repeat icon** beside a set to carry the set above it down: same weight, same reps, then edit whatever changed. On set 1 there is no row above, so it pulls set 1 from last session instead. The button stays dark until there is something to copy.

**A finished exercise collapses** to a one-line summary of what you lifted. Tap the chevron to open it again. The page shrinks as you work, so the remaining scroll is the remaining work.

**The ring in the save bar** counts logged sets against the session total, and the footer shows how long you have been at it.

**After each exercise, say how it felt** — easy, medium or hard. Easy doubles next week's jump, medium takes the normal step, hard repeats the same numbers instead of pushing. That turns a fixed +5 rule into something that answers to the day you actually had.

**A lift that has not improved in three sessions** gets flagged with a note to swap it or drop 10% and build back.

**The Progress tab** opens with a 26-week consistency grid, one square per day, shaded by how much you logged.
**Rest timer** starts itself when you enter reps and picks its own length: 120s between sets of the day's first two heavy compounds, 60s between sets of everything else, 90s moving to the next exercise, 15s between the two moves in a superset, 45s between superset rounds.

The session buttons mark which of the three you have already logged in the current week. **Tabs** — Log is the working screen. History lists past sessions with per-exercise numbers and total volume. Progress charts estimated 1RM per lift over time.

## Storage

Everything is written to `localStorage` on the device, immediately, as you leave each field, plus a flush when you switch apps or close the tab. No account, no server, works with no signal.

That means the log lives on one device. Use **Export backup** on the History tab to save a JSON file, and **Import backup** to merge it into another device. Import merges rather than overwrites: for any date present in both, the copy with more logged sets wins.

The header carries no sync indicator: on GitHub Pages there is no cloud to sync with, so a chip that always reads the same thing is noise. The save status in the bottom bar is the live one.

The page also looks for a `claude.use("db")` runtime and will sync through it when one exists. On GitHub Pages it doesn't, so it stays local and the header chip reads `this device`.

## Type

Two families, no more. **Lato** for everything written (titles, labels, buttons, prose). **IBM Plex Mono** for anything numeric or technical: weights, reps, set numbers, rest times, tags, dates. If a value is something you read as data, it is mono; if it is something you read as language, it is Lato.

## Layout

Static files, ES modules, no build step.

| | |
|---|---|
| `src/program.js` | the nine workouts |
| `src/howto.js` | 92 movement write-ups |
| `src/taxonomy.js` | movement patterns, load conventions, per-side table |
| `src/movements.js` | derives rest times and load factors onto the program |
| `src/constants.js` | every tunable number |
| `src/state.js` | shared state and a subscribe/notify pair |
| `src/storage.js` | localStorage read and write |
| `src/rotation.js` | which week and which session comes next |
| `src/progression.js` | scoring, volume, target suggestions |
| `src/swaps.js` | substitutions and custom exercises |
| `src/session.js` | the session being edited, autosave |
| `src/render.js` | the three views |
| `src/sheet.js` | swap and how-to sheets |
| `src/timer.js` | rest timer |
| `src/backup.js` | JSON export and import |

Nothing imports `render.js` except `main.js`. State changes call `notify()`, and `main.js` subscribes `render` to it. That keeps the view out of the logic and the module graph free of cycles.

## Tests

```
node test/all.mjs
```

Three suites, 181 assertions, no dependencies.

- `modules.mjs` loads every module against a DOM stub and fails on a dead export.
- `run.mjs` covers the data (every movement patterned, tagged and written up) and the logic that can silently corrupt history: rotation, progression targets, volume factors, custom-name matching, swap identity, backup merging.
- `render.mjs` boots the real views against a fake DOM and asserts what renders, including the sheet's hidden state.

Blocks must not inherit state from each other; each opens with `fresh()`.

## Development

Static files, no build step. Serve the directory over HTTP and open it:

```
python -m http.server 8000
```

Service workers need HTTPS or localhost, so opening `index.html` as a `file://` URL will work but won't install or cache offline.

`sw.js` caches with stale-while-revalidate: the app launches instantly from cache and picks up a new deploy on the next launch. Bump `CACHE` only to recover from a bad cache, not per deploy.

Session keys in `PROGRAM` are `chest` / `legs` / `arms`; sessions carry a `blockIndex` that drives the A/B/C rotation, and `block` is derived from it.

Exercise how-tos live in `src/howto.js`, keyed by exercise id: `s` is the step array, `w` is the watch-out line. A move with no entry still opens the sheet and shows the YouTube link.

Editing the program means editing `src/program.js`. Exercise `id` values are what link a lift to its history, so renaming an id orphans its past data; changing the display name `n` is safe.
