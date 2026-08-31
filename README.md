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

**Rest timer** starts itself when you enter reps and picks its own length: 120s between sets of the day's first two heavy compounds, 60s between sets of everything else, 90s moving to the next exercise, 15s between the two moves in a superset, 45s between superset rounds.

The session buttons mark which of the three you have already logged in the current week. **Tabs** — Log is the working screen. History lists past sessions with per-exercise numbers and total volume. Progress charts estimated 1RM per lift over time.

## Storage

Everything is written to `localStorage` on the device, immediately, as you leave each field, plus a flush when you switch apps or close the tab. No account, no server, works with no signal.

That means the log lives on one device. Use **Export backup** on the History tab to save a JSON file, and **Import backup** to merge it into another device. Import merges rather than overwrites: for any date present in both, the copy with more logged sets wins.

The page also looks for a `claude.use("db")` runtime and will sync through it when one exists. On GitHub Pages it doesn't, so it stays local and the header chip reads `this device`.

## Development

Static files, no build step. Serve the directory over HTTP and open it:

```
python -m http.server 8000
```

Service workers need HTTPS or localhost, so opening `index.html` as a `file://` URL will work but won't install or cache offline.

`sw.js` caches with stale-while-revalidate: the app launches instantly from cache and picks up a new deploy on the next launch. Bump `CACHE` only to recover from a bad cache, not per deploy.

Session keys in `PROGRAM` are `chest` / `legs` / `arms`; sessions carry a `blockIndex` that drives the A/B/C rotation, and `block` is derived from it.

Editing the program means editing the `PROGRAM` object at the top of the script in `index.html`. Exercise `id` values are what link a lift to its history, so renaming an id orphans its past data; changing the display name `n` is safe.
