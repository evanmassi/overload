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

Every session is 8 or 9 main moves (23-30 sets) plus a core finisher of 3 supersets run for 2 rounds each. Roughly 75 minutes including warmup.

Weekly set volume per muscle: chest 12.3, back 16.7, quads 10, hams 8, delts 13, bis 7, tris 7, calves 3.7.

Equipment assumed: dumbbells, EZ bar, pull-up bar, adjustable bench, cable stack. No specialty machines beyond a lat pulldown, seated row, and leg curl.

## Off days

Three more session types sit under the lifting buttons for the days between: **Cardio**, **Function** and **Mobility**. Each has its own A/B/C rotation that advances every time you log one, independent of the lifting week, so tapping Cardio on a Saturday gives you whichever version is next and never moves the lifting week along. Each version comes back every third time, so there is still a number to beat.

Every off-day session is three sections named for where you stand. You pick up a pair of dumbbells and stay in that corner, then move to the floor or the cables, then close on one machine or a pair of holds. Nothing asks you to run from the stair machine to the rack and back.

| | Dumbbells | Floor or cables | Finish |
|---|---|---|---|
| **Cardio** | 4 rounds, 40s on / 20s off | 3 rounds of 45s on, 1 min off | 8-10 min on the stairs |
| **Function** | 4-round circuit of carries, get-ups, single-arm work | 4-round cable circuit | hangs, holds, crawls |
| **Mobility** | 2 rounds of floor stretches | 2 rounds at the bar and bench | 12-15 min walk |

Cardio cards log **reps inside the window** and the set rows read `R1`..`R4`, so the comparison is how many thrusters you got in 40 seconds against last time. Machine finishers log **level × minutes**: hit the minutes and the target asks for one more level, fall short and it asks for another minute at the same level. They add nothing to the session's tonnage.

**Gym / Away** sits in the session header, gym lit by default. Tap Away and every move that needs equipment becomes a backpack, chair or bodyweight version; tap Gym to put them back. It uses the same swap mechanism as the `swap` button, so each card can still be undone on its own and history follows the movement: a backpack row is compared against the last backpack row, not the last cable row.

Off-day sessions show on the History tab under a second filter row and never interrupt the lifting `Cycle N` headers. Filter to one type and it gets its own cycle headers.

## Using it

Type weight and reps into each set. The greyed-out placeholder is what you did that same set last time, so an empty box already tells you the number to beat. A ▲ appears when you beat it, `=` when you match it.

Because of the A/B/C rotation, "last time" for most lifts is a full cycle ago. Lifts that appear in more than one week come back sooner.

**What weight to write** is stated on every card. `PER DUMBBELL` means the number stamped on one bell, not the pair (two 50s is 50). `ONE DUMBBELL` is a single bell held in both hands. `TOTAL W/ BAR` is the EZ bar plus plates. `STACK` is the pin number. `BODYWEIGHT +` means leave it blank unless you added weight. A `PER LEG` / `PER ARM` / `PER SIDE` tag marks the 20 unilateral moves, where the reps shown are what each side does.

Session volume accounts for both: a walking lunge holding two 40s for 12 per leg counts 40 × 2 dumbbells × 12 reps × 2 legs.

**Every card names the muscles it works** in a dotted grey-blue tag on the chip line, set apart from the tags that say how to log the numbers, primary movers only, so `PER DUMBBELL · CHEST · TRICEPS` reads as one glance. The how-to sheet lists the secondary ones too. Card text never wraps: display names are capped at 22 characters, and the meta is two fixed lines on every card, chips above and prescription below.

**Tap an exercise name** for a how-to: 3-4 numbered steps and the one thing people get wrong, for all 165 movements. It ships in the page, so it opens instantly with no signal. A YouTube search link sits at the bottom of the sheet for when you want to see it moving.

The write-ups are plain-language descriptions of standard technique, not a trainer's instruction. For the fussier moves (Copenhagen plank, Z-press, ab wheel) watch a video the first time and use the steps as a reminder afterwards.

**Swap any exercise** with the `swap` button on its card. You get moves that train the same pattern first, then everything else, then a free-text box for anything not in it. The list includes five moves the program never prescribes on its own: lateral (archer), wide and spiderman push-ups, weighted shoulder circles, and the DB twisting lunge. They are there to be swapped in when you want them, and they carry history like any other move. A swap applies to that session only; the next cycle prescribes the original again. Moves the session already contains are left off the list, since two cards for one lift would share one set of boxes. History follows the movement, not the slot, so a substitute is compared against the last time you did *that* move. It also stays inside its kind of session: a push press on Arms day compares against the last Arms-day push press, never against the 40-second interval version from Cardio, and the same holds for targets and stall detection.

Exercises you type yourself are saved and listed under **Your exercises** at the top of the swap sheet, with rename and remove. Names are matched loosely, so `sledgehammer slams`, `Sledgehammer Slams` and `sledgehammer slam` are all the same exercise and keep one shared history; typing the name of a move the app already knows resolves to that move rather than creating a duplicate. That includes common nicknames, so `lateral push ups` finds the archer push-up and `arm circles` finds the shoulder circles. Removing a custom exercise also deletes its logged sets, and says how many before it does.

**The target line** on each card reads `GO FOR 50×8 · ADD WEIGHT`. It suggests more weight once you have topped the prescribed rep range on every set, and one more rep otherwise.

**Session notes** at the bottom of the log. They show on the History tab.

**The History tab** is organised around the comparison that matters: the same workout, last time. A filter row at the top (All / Chest / Legs / Arms) narrows the list to one workout, so consecutive cards are direct progressive-overload comparisons. Sessions group under `Cycle N` headers, and each card starts collapsed to one row:

```
// CYCLE 2
Chest & Back                  A   09-01
9,680 lb   16 sets   1h 04m
```

Tap the row to open the exercise lines, and tap it again to close them. Each line carries a marker against the previous time that movement was logged, wherever it was logged: the same up / matched / down glyphs as the Log tab, or `new` for a first exposure. It compares top set to top set, using weight × reps for loaded moves and reps for bodyweight ones, so the log reads as a trend without opening Progress.

```
Flat DB Bench Press        65×10 · 65×10 · 65×9   ▲
Incline DB Press                    3 × 50×12   ●
Cable Crossover ⇄                   3 × 30×15   new
CORE FINISHER
│ Hanging Knee Raise                   2 × 12   ●
│ Plank                               2 × 45s   ▲
                                    edit  delete
```

Runs of identical sets collapse to a count, so `55×20 · 60×16 · 60×16 · 60×16` becomes `55×20 · 3 × 60×16`. Only consecutive sets fold together and the order never moves, so the shape of the session still reads: a warmup set, a working run, a drop at the end. A run that is broken and resumed stays broken, because going back down and back up is the part worth seeing. Core moves sit under their own label with each superset bracketed. A swapped move carries the same glyph as the Log tab's swap button, and says what it replaced.

**Fixing a mistake**: open a card on the History tab and tap `edit` to load that session in the Log tab, where every field is editable. `delete` removes the session; it asks once before it does.

**Tap the repeat icon** beside a set to carry the set above it down: same weight, same reps, then edit whatever changed. On set 1 there is no row above, so it pulls set 1 from last session instead. The button stays dark until there is something to copy.

**A finished exercise collapses** to a one-line summary of what you lifted, including each of the two moves inside a superset, which collapse on their own. Tap the chevron to open one again. The page shrinks as you work, so the remaining scroll is the remaining work.

**A segmented bar spans the bottom of the screen**, one tick per prescribed set, filling left to right as you log. The tally beside it reads `12/41`, and the line under the volume carries your time and how the session compares to the last one:

```
████████████··························
6,240 lb                          12/41
52 min · +1,180 vs 08-25
```

**Time in the gym is measured first log to last log**, not first log to now. It used to count against the current clock, so opening a finished session hours later reported a three-hour workout. The consequence of the honest version is that the number only advances when you log a new set, so mid-rest it sits still. Opening an old session from History to fix a number leaves its clock alone.

Each History row carries the same number as `first set to last`, which is the point: you can see whether the same session took 64 minutes or 81.

**The idle countdown reads the rest your next set will actually get**, not a fixed default. It walks the session for the first set with no reps and shows what logging it would start, so before your first set of Week C chest it reads `180s`. Tapping it starts that length by hand.

**The countdown sits in the header**, not the bottom bar, because the number keyboard covers the bottom of the screen the moment you tap a weight or reps box. The header is sticky, so it stays in view while you type. It escalates in three steps, readable at arm's length with the phone on the floor:

| | |
|---|---|
| running | rust, small |
| 10s left | amber, larger — rack up and get back |
| 3s left | amber, larger still, pulsing once a second |
| 0 | green `GO` for three seconds, then back to the idle reading |

Ten seconds is the "get ready" signal and three is the "go" one, so the picture and the sound say the same thing.

**Hold the clock for half a second** for a picker: nine presets from 15s to 10 min, a box to type any length as seconds or `m.ss` (the period stands in for the colon, since the phone keypad has no colon), and a stopwatch that counts up in the secondary colour until you tap the clock again, which parks the elapsed time on the face for three seconds. That covers warm-ups and anything a card does not time for you. A plain tap still starts the next rest.

**Cards prescribed in seconds carry a timer button** in the head: planks, hangs, carries, wall sits. Tap it and the clock runs the prescribed seconds in the secondary colour, with the same beeps at the end, then writes those seconds into the next open set and starts that set's rest, so a plank is one tap from start to rest. On cardio cards it runs the 40s window and rolls straight into the 20s off; you type the rep count during the rest and doing so does not restart it.

**Beeps** ride along with the last tier: a short 880Hz blip at 3, 2 and 1, then a single 1320Hz tone held for a full second when the rest is up. They are triangle waves at full gain: softer on the ear than a square wave, still loud enough for a phone speaker where a quiet sine disappears. All four are scheduled on the audio hardware clock the moment a rest starts, so they land on the exact second regardless of how often the page gets to run; they used to fire from the display tick, which Safari slows to once a second or worse the moment the page is not fully in front, so a 3-2-1 could come out as 3-1. Stopping the timer, starting a new rest, or muting cancels whatever is scheduled. **Sound on** and **Test sound** live on the History tab, and the setting is remembered.

The caveats are iOS ones, and the reason the visual tiers exist rather than relying on sound:

- Web Audio needs a real tap to start, so the context unlocks on your first `pointerdown` of the session. Locking the phone, switching apps or starting music afterwards puts Safari's context into a non-standard `interrupted` state, so the app resumes it on every later tap, every timer start and every return to the foreground. An interrupted context also stops its clock, so anything scheduled on it would play late once it wakes; the app drops the schedule the moment the context stops and rebuilds it from the wall clock when it runs again, keeping only beeps still in the future. A beep never waits for the context to wake and then plays late.
- **The hardware silent switch mutes Web Audio**, AirPods or not, since it mutes by audio session category rather than by output route. Tap **Test sound** on your phone to find out what yours does.
- **iOS suspends JS timers when the screen locks or you leave the app**, so a beep scheduled for the last seconds never fires if the phone is in your pocket. A screen wake lock keeps the phone from locking itself while a rest runs, which covers the common case; switching apps still pauses everything. The clock itself is computed from an `endsAt` timestamp, so the reading is correct again the moment you come back. If the rest ended while you were away, the timer shows `GO` and makes no sound at all. It used to play the full GO if you came back within ten seconds of the end, which at full gain is a fright, not a cue. Keeping beeps alive in the background would mean holding the audio session open like a music app, which pauses whatever you are listening to, so the app does not.
- `navigator.vibrate` does nothing on iOS Safari. The call is still there for Android, where it works.

**After each exercise, say how it felt** — easy, medium or hard. Easy doubles next week's jump, medium takes the normal step, hard repeats the same numbers instead of pushing. That turns a fixed +5 rule into something that answers to the day you actually had.

**A lift that has not improved in three sessions** gets flagged with three ways out: **swap it** opens the swap sheet, **drop to N** fills set 1 with 10% less rounded to the plate, and **hold here** says you are staying put on purpose. A held lift's target reads `match it`, the stall flag goes quiet, and the up / matched / down markers still show whether you slipped. The hold is remembered per lift across sessions, so an EZ-bar curl capped by the heaviest bar in the gym stays held until you tap **push again** or beat the held number by more than 10%, at which point the push comes back on its own.

**The Progress tab** opens with a 26-week consistency grid: 182 squares, one per day, seven rows deep and reading left to right by week. A day you logged nothing stays the background grey. A day you logged something is shaded by how much — up to 10 sets, up to 20, then anything above — so a light week and a heavy one look different at a glance. Each square names its date and set count on hover.

Below it, one card per lift. The big number is an **estimated one-rep max**, not a weight you lifted: Epley, `weight × (1 + reps/30)`, so 65×10 reads 87. The card labels it `EST. 1RM` for that reason. Bodyweight moves have no weight to extrapolate from, so they show best reps instead, and a set with added weight outranks a longer unweighted one the same way the Log tab scores it. Exercises you typed yourself get a card like any other.

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

**Each button is its own workout for the day.** Log three moves of Chest, tap Mobility and do the whole thing, tap Chest and add two more: that is two workouts, each saved on its own, each a card in History, each compared against the last time you did that workout. A button with nothing logged yet just switches, so browsing the plans costs nothing. Sessions are keyed by date plus the time you started them, and older logs keyed by date alone still sort and compare correctly. If you log under the wrong button, the History card has a **relabel** action beside edit and delete. Refiling across the lifting / off-day line also gives the session the right week or version number, so a Cardio session refiled as Chest joins the open week instead of dragging its version count in as a week count.

**History shows lifts the session plan does not contain**, under a `Not in this session` heading. It used to render only what the plan listed and silently drop the rest, so a mislabelled session showed one lift while the footer counted 39 sets and 33,880 lb of work that was nowhere on the card.

The session buttons mark which of the three you have already logged in the current week. **Tabs** — Log is the working screen. History lists past sessions with per-exercise numbers and total volume. Progress charts estimated 1RM per lift over time.

## Storage

Everything is written to `localStorage` on the device, immediately, as you leave each field, plus a flush when you switch apps or close the tab. No account, no server, works with no signal.

The sound preference lives in `overload.sound.v1` and held lifts in `overload.hold.v1`; the log itself is untouched by either. That means the log lives on one device. Use **Export backup** on the History tab to save a JSON file, and **Import backup** to merge it into another device. Import merges rather than overwrites: for any date present in both, the copy with more logged sets wins.

**Save state is a single dot in the header**, green when written and amber while writing. It was a line of text in the bottom bar, but the text changed width as it changed state, which shoved the countdown sideways on every autosave. Backup results (`merged 3`, `bad file`) print under the Export and Import buttons instead, where the action happened.

## Type

Two families, no more. **Lato** for everything written (titles, labels, buttons, prose). **IBM Plex Mono** for anything numeric or technical: weights, reps, set numbers, rest times, tags, dates. If a value is something you read as data, it is mono; if it is something you read as language, it is Lato.

## Layout

Static files, ES modules, no build step. The folder under `src/` is the layer, and a file only imports from its own
layer or the ones before it: `data`, `rules`, `store`, then `views`.

| | |
|---|---|
| `src/data/catalog.js` | all 165 exercises: name, pattern, load, sides, muscles, nicknames |
| `src/data/program.js` | the nine workouts, as exercise ids with sets and reps |
| `src/data/offdays.js` | the nine off-day workouts and their no-gym substitutes |
| `src/data/howto.js` | 165 exercise write-ups |
| `src/data/constants.js` | every tunable number |
| `src/rules/exercises.js` | finds an exercise and derives its load factors |
| `src/rules/workouts.js` | joins workouts to the catalog, derives rest times, parses rep ranges |
| `src/rules/sets.js` | whether a set counts as logged |
| `src/rules/format.js` | dates, set summaries and durations, shared by every view |
| `src/rules/progression.js` | scoring, volume, target suggestions, beat/match/below, stall back-off |
| `src/rules/rotation.js` | which week and which session comes next |
| `src/store/storage.js` | localStorage read and write |
| `src/store/state.js` | shared state, and the channel that tells views it changed |
| `src/store/session.js` | the session being edited: every edit to it, and autosave |
| `src/store/slots.js` | which move fills a slot once swaps apply, and moves logged outside the plan |
| `src/store/customs.js` | custom exercises and loose name matching |
| `src/store/holds.js` | lifts you are holding on purpose |
| `src/store/backup.js` | JSON export and import |
| `src/views/app.js` | picks the screen for the current tab and refreshes the save bar |
| `src/views/dom.js` | element builder, lookup by id, and escaping for typed text |
| `src/views/controls.js` | the shared button, row of options and tap-twice confirm |
| `src/views/log.js` | the log view |
| `src/views/exerciseCard.js` | an exercise card: set rows, target, stall and hold callouts, effort |
| `src/views/saveBar.js` | the bottom bar: set ticks, volume, tally |
| `src/views/saveStatus.js` | the header save dot |
| `src/views/history.js` | the history view |
| `src/views/settings.js` | sound and backup controls under the history list |
| `src/views/progress.js` | the progress view, consistency grid, sparkline |
| `src/views/timer.js` | rest timer |
| `src/views/sound.js` | countdown beeps and the sound preference |
| `src/views/sheets/` | the pop-up frame, and the swap, how-to, timer and relabel pop-ups |
| `src/styles/app.css` | app styles on top of the design tokens |
| `src/ui/` | the design system: button, field and panel, each with its CSS beside it, and the tokens |

Nothing imports `views/app.js` except `main.js`. State changes call `changes.notify()`, and `main.js` subscribes the app view
to it. That keeps the view out of the logic and the module graph free of cycles.

## Tests

```
node test/all.mjs
```

Three suites, no dependencies.

- `guards.mjs` loads every module against a DOM stub, fails on a dead export, fails when a file imports from a layer above its own, and fails on any class the renderers emit that has no stylesheet rule. That last check exists because a stylesheet edit once deleted the consistency grid's rules along with the ones it meant to remove, and every DOM test still passed while the grid rendered invisible. It also fails when a shipped file is missing from the `sw.js` precache list, or the list names a file that no longer exists; the whole design system once shipped outside that list without any test noticing.
- `logic.mjs` covers the data (every movement patterned, tagged and written up) and the logic that can silently corrupt history: rotation, progression targets, volume factors, custom-name matching, swap identity, backup merging.
- `views.mjs` boots the real views against a fake DOM and asserts what renders, including the sheet's hidden state.

`guards.mjs` also fails the build on an export nothing imports, which is why there is no dead code to find by hand.

Blocks must not inherit state from each other; each opens with `fresh()`.

## Development

Static files, no build step. Serve the directory over HTTP and open it:

```
python -m http.server 8000
```

Service workers need HTTPS or localhost, so opening `index.html` as a `file://` URL will work but won't install or cache offline.

`sw.js` caches with stale-while-revalidate: the app launches instantly from cache and picks up a new deploy on the next launch. Bump `CACHE` only to recover from a bad cache, not per deploy. A new file the page loads goes into its `ASSETS` list in the same change.

Session keys in `PROGRAM` are `chest` / `legs` / `arms`; sessions carry a `blockIndex` that drives the A/B/C rotation, and `block` is derived from it.

Exercise how-tos live in `src/data/howto.js`, keyed by exercise id: `s` is the step array, `w` is the watch-out line. A move with no entry still opens the sheet and shows the YouTube link.

Editing the program means editing `src/data/program.js`, which lists exercise ids with sets and reps. Everything about an exercise itself lives once in `src/data/catalog.js`. Exercise `id` values are what link a lift to its history, so renaming an id orphans its past data; changing the display name `n` in the catalog is safe.
