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

**A history card** reads as three things, not one flat list:

```
Chest & Back              A   2026-09-01   delete
Flat DB Bench Press        65×10 · 65×10 · 65×9
Incline DB Press                    3 × 50×12
Cable Crossover ⇄                   3 × 30×15
CORE FINISHER
│ Hanging Knee Raise                   2 × 12
│ Plank                               2 × 45s
────────────────────────────────────────────
9,680 lb          16 sets            1h 04m
```

Sets that are identical collapse to a count, so `50×12 · 50×12 · 50×12` becomes `3 × 50×12`; anything that varies stays spelled out, because that variation is the interesting part. Core moves sit under their own label with each superset bracketed, which replaces the `◦` that used to mark them one at a time and never showed which two went together. A swapped move carries the same glyph as the Log tab's swap button, and says what it replaced. Session totals live in a footer strip rather than pretending to be two more exercises.

**Fixing a mistake**: tap any card on the History tab to open that session in the Log tab, where every field is editable. `delete` on a history card removes the session; it asks once before it does.

**Tap the repeat icon** beside a set to carry the set above it down: same weight, same reps, then edit whatever changed. On set 1 there is no row above, so it pulls set 1 from last session instead. The button stays dark until there is something to copy.

**A finished exercise collapses** to a one-line summary of what you lifted, including each of the two moves inside a superset, which collapse on their own. Tap the chevron to open one again. The page shrinks as you work, so the remaining scroll is the remaining work.

**A segmented bar spans the bottom of the screen**, one tick per prescribed set, filling left to right as you log. The tally beside it reads `12/38`, and the line under the volume carries your time and how the session compares to the last one:

```
████████████··························
6,240 lb                          12/38
52 min · +1,180 vs 08-25
```

**Time in the gym is measured first log to last log**, not first log to now. It used to count against the current clock, so opening a finished session hours later reported a three-hour workout. The consequence of the honest version is that the number only advances when you log something, so mid-rest it sits still.

Each History card carries the same number as `first set to last`, which is the point: you can see whether the same session took 64 minutes or 81.

**The idle countdown reads the rest your next set will actually get**, not a fixed default. It walks the session for the first set with no reps and shows what logging it would start, so before your first set of Week C chest it reads `180s`. Tapping it starts that length by hand.

**The countdown sits in the header**, not the bottom bar, because the number keyboard covers the bottom of the screen the moment you tap a weight or reps box. The header is sticky, so it stays in view while you type. It escalates in three steps, readable at arm's length with the phone on the floor:

| | |
|---|---|
| running | rust, small |
| 10s left | amber, larger — rack up and get back |
| 3s left | amber, larger still, pulsing once a second |
| 0 | green `GO` for three seconds, then back to the idle reading |

Ten seconds is the "get ready" signal and three is the "go" one, so the picture and the sound say the same thing.

**Beeps** ride along with the last tier: a short 880Hz tone at 3, 2 and 1, then a longer 1320Hz one when the rest is up. **Sound on** and **Test sound** live on the History tab, and the setting is remembered.

The caveats are iOS ones, and the reason the visual tiers exist rather than relying on sound:

- Web Audio needs a real tap to start, so the context unlocks on your first `pointerdown` of the session and resumes on later taps if iOS suspended it.
- **The hardware silent switch mutes Web Audio**, AirPods or not, since it mutes by audio session category rather than by output route. Tap **Test sound** on your phone to find out what yours does.
- **iOS suspends JS timers when the screen locks or you leave the app**, so a beep scheduled for the last seconds never fires if the phone is in your pocket. The clock itself is computed from an `endsAt` timestamp, so the reading is correct again the moment you come back; only the sound is lost. If the rest ended entirely while you were away, the timer notices the gap between ticks and resets quietly rather than announcing a `GO` for a rest that finished two minutes ago.
- `navigator.vibrate` does nothing on iOS Safari. The call is still there for Android, where it works.

**After each exercise, say how it felt** — easy, medium or hard. Easy doubles next week's jump, medium takes the normal step, hard repeats the same numbers instead of pushing. That turns a fixed +5 rule into something that answers to the day you actually had.

**A lift that has not improved in three sessions** gets flagged with a note to swap it or drop 10% and build back.

**The Progress tab** opens with a 26-week consistency grid, one square per day, shaded by how much you logged.

Below it, one card per lift. The big number is an **estimated one-rep max**, not a weight you lifted: Epley, `weight × (1 + reps/30)`, so 65×10 reads 87. The card labels it `EST. 1RM` for that reason. Bodyweight moves have no weight to extrapolate from, so they show best reps instead.

The set behind the estimate is the one with the **highest estimate**, not the one with the most weight × reps. Those disagree: 50×20 is more total work than 65×10 but estimates to 83 against 87, so ranking by volume would report the lower number as your best.
**The core finisher is supersets, so you alternate**: first move, second move, first move, second move. The badge says `alternate the two moves`, the set rows read `R1` / `R2` rather than `1` / `2`, and the first move's card says `straight into <partner>` instead of quoting a rest. Doing both rounds of one move and then both of the other is straight sets, which is fine training but slower and not what the rest timings assume.

**Rest timer** starts itself when you enter reps and picks its own length from what the movement is and what the prescription asks of it, not from where it sits in the list:

| | |
|---|---|
| compound, top of the rep range 6 or under | 180s |
| compound prescribed 4+ sets | 120s |
| compound prescribed 3 sets | 90s |
| isolation and core | 60s |

So Bulgarian Split Squat rests 90s as a 3×10 accessory in Week A and 120s as a 4×8 lead in Week C. A 4×AMRAP of pull-ups is a lead and gets 120s; a 3×AMRAP of push-ups is a finisher and gets 90s. Moving to the next exercise is always 90s. Inside the core finisher: 15s walking to the other half of a superset, 45s between rounds, 60s leaving one superset for the next.

The session buttons mark which of the three you have already logged in the current week. **Tabs** — Log is the working screen. History lists past sessions with per-exercise numbers and total volume. Progress charts estimated 1RM per lift over time.

## Storage

Everything is written to `localStorage` on the device, immediately, as you leave each field, plus a flush when you switch apps or close the tab. No account, no server, works with no signal.

The sound preference lives in `overload.sound.v1`; the log itself is untouched by it. That means the log lives on one device. Use **Export backup** on the History tab to save a JSON file, and **Import backup** to merge it into another device. Import merges rather than overwrites: for any date present in both, the copy with more logged sets wins.

**Save state is a single dot in the header**, green when written and amber while writing. It was a line of text in the bottom bar, but the text changed width as it changed state, which shoved the countdown sideways on every autosave. Backup results (`merged 3`, `bad file`) print under the Export and Import buttons instead, where the action happened.

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
| `src/movements.js` | derives rest times and load factors onto the program, and parses rep ranges |
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
| `src/savestate.js` | the header save dot |
| `src/sound.js` | countdown beeps and the sound preference |
| `src/backup.js` | JSON export and import |

Nothing imports `render.js` except `main.js`. State changes call `notify()`, and `main.js` subscribes `render` to it. That keeps the view out of the logic and the module graph free of cycles.

## Tests

```
node test/all.mjs
```

Three suites, 286 assertions, no dependencies.

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
