import {section, check, equal, report} from "./checks.mjs";
import {
  reset, logged, setsOf, everyExercise, prescribedExercises, crossTrainingExercises, awayExercises,
  state, hydrate, constants, exercises, workouts, progression, rotation, customs, slots, backup,
  HOWTO, CATALOG, PATTERNS, PROGRAM
} from "./fixtures.mjs";

const {BLOCKS, DAY_KEYS, CROSS_KEYS, LOAD_LABEL} = constants;
const {nextBlockIndex, nextLiftingDay, recentDays, previousOf, blockLetter, withLetter} = rotation;
const {suggestTarget, loggedCount, priorSets} = progression;
const aimed = target => (target.w ? target.w + "×" : "") + target.r;

const hasStalledFor = exercise => progression.hasStalled(state.sessions, exercise, "2026-09-01", undefined, []);
const prescribedCountFor = (block, day, isAway) => progression.prescribedCount(workouts.workoutFor(block, day, isAway));

section("Program data");
{
  const known = everyExercise();
  equal("three week blocks", Object.keys(PROGRAM), BLOCKS);
  check("192 catalogued exercises", known.size === 192, known.size);

  const prescribed = prescribedExercises();
  check("9 lifting sessions prescribe 92 of them", prescribed.size === 92, prescribed.size);
  const crossTraining = crossTrainingExercises();
  check("9 cross-training sessions prescribe 73", crossTraining.size === 73, crossTraining.size);

  const away = awayExercises();
  check("18 away sessions prescribe 64", away.size === 64, away.size);

  const uncatalogued = [...prescribed.keys(), ...crossTraining.keys(), ...away.keys()].filter(id => !CATALOG[id]);
  equal("every slot names a catalogued exercise", uncatalogued, []);
  const swapOnly = [...known.keys()].filter(id => !prescribed.has(id) && !crossTraining.has(id) && !away.has(id));
  check("15 exercises are only offered as swaps", swapOnly.length === 15, swapOnly.length);
  const equipped = [...away.values()].filter(e => e.load !== "bw").map(e => e.id);
  equal("every away move is bodyweight", equipped, []);
  const jumping = [...away.values()].filter(e => e.pattern === "Plyometrics").map(e => e.id);
  equal("no away move is a jump", jumping, []);

  const unpatterned = Object.keys(CATALOG).filter(id => !PATTERNS[CATALOG[id].pattern]);
  equal("every exercise belongs to a known pattern", unpatterned, []);

  const missingHowTo = [...known.keys()].filter(id => !HOWTO[id]);
  equal("every exercise has a how-to", missingHowTo, []);

  const badSteps = Object.keys(HOWTO).filter(id => !HOWTO[id].s || HOWTO[id].s.length < 3 || !HOWTO[id].w);
  equal("every how-to has 3+ steps and a watch-out", badSteps, []);

  const ghosts = Object.keys(HOWTO).filter(id => !known.has(id));
  equal("no how-to for an exercise that does not exist", ghosts, []);

  const unworked = Object.keys(CATALOG).filter(id => !CATALOG[id].muscles.p.length);
  equal("every exercise names what it works", unworked, []);

  const longNames = [...known.values()].map(e => e.n).filter(n => n.length > 22);
  equal("every display name fits on one line", longNames, []);

  const unknownLoad = Object.keys(CATALOG).filter(id => !(CATALOG[id].load in LOAD_LABEL));
  equal("every exercise has a known load", unknownLoad, []);

  const badSide = Object.keys(CATALOG).filter(id => CATALOG[id].per && !["leg", "arm", "side"].includes(CATALOG[id].per));
  equal("a per-side exercise names leg, arm or side", badSide, []);

  const untargeted = Object.keys(CATALOG).filter(id => !CATALOG[id].target);
  equal("every exercise has a default target for swaps", untargeted, []);

  for(const block of BLOCKS) for(const day of DAY_KEYS) for(const isAway of [false, true]){
    const workout = workouts.workoutFor(block, day, isAway);
    const name = `${block}/${day}${isAway ? " away" : ""}`;
    equal(`${name} is lifts then a core superset`, workout.sections.map(section => section.kind), ["straight", "core"]);
    const main = workout.sections[0].ex;
    check(`${name} has 8 or 9 main exercises`, main.length === 8 || main.length === 9, main.length);
    const pairs = workouts.corePairs(workout.sections[1]);
    check(`${name} has 3 core supersets of 2`, pairs.length === 3 && pairs.every(pair => pair.length === 2));
    const ids = workouts.workoutSlots(workout).map(e => e.id);
    equal(`${name} lists no move twice`, ids.filter((id, i) => ids.indexOf(id) !== i), []);
  }
}

section("Each workout rotates through its own versions");
{
  reset();
  equal("a fresh app opens Chest, version A", [nextLiftingDay(state.sessions), nextBlockIndex(state.sessions, "chest")], ["chest", 0]);

  state.sessions = {"2026-09-01": logged("2026-09-01", "chest", 0)};
  equal("after Chest it offers Legs", nextLiftingDay(state.sessions), "legs");
  equal("and Chest moves on to B while Legs stays on A",
    [blockLetter(nextBlockIndex(state.sessions, "chest")), blockLetter(nextBlockIndex(state.sessions, "legs"))], ["B", "A"]);

  state.sessions["2026-09-04"] = logged("2026-09-04", "arms", 0);
  equal("skipping Legs for Arms still leaves Legs next", nextLiftingDay(state.sessions), "legs");
  state.sessions["2026-09-06"] = logged("2026-09-06", "legs", 0);
  equal("with all three done the oldest comes round again", nextLiftingDay(state.sessions), "chest");

  state.sessions["2026-09-08"] = logged("2026-09-08", "chest", 1);
  state.sessions["2026-09-10"] = logged("2026-09-10", "chest", 2);
  equal("after C a workout wraps to A", blockLetter(nextBlockIndex(state.sessions, "chest")), "A");

  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "chest", blockIndex: 0, block: "A", entries: {}}};
  equal("an opened but empty session does not count", nextBlockIndex(state.sessions, "chest"), 0);
  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "chest", block: "B", entries: {x: [{w: "1", r: "1"}]}}};
  equal("a session with no blockIndex infers it from its letter", nextBlockIndex(state.sessions, "chest"), 2);

  equal("picking a letter stays in the same round", [withLetter(4, "A"), withLetter(4, "C")], [3, 5]);

  state.sessions = {
    "2026-09-01": logged("2026-09-01", "chest", 0),
    "2026-09-08T09:00:00": logged("2026-09-08", "chest", 1),
    "2026-09-15T09:00:00": logged("2026-09-15", "chest", 2)
  };
  equal("last time is the one before the open session",
    previousOf(state.sessions, "chest", "2026-09-15T09:00:00").date, "2026-09-08");
  equal("an older date-keyed session still counts", previousOf(state.sessions, "chest", "2026-09-08T09:00:00").date, "2026-09-01");
  equal("and the first has none", previousOf(state.sessions, "chest", "2026-09-01"), null);
  const {daysAgoLabel} = await import("../src/rules/format.js");
  equal("days ago reads plainly",
    [daysAgoLabel("2026-09-22", "2026-09-22"), daysAgoLabel("2026-09-21", "2026-09-22"), daysAgoLabel("2026-08-28", "2026-09-02")],
    ["earlier today", "yesterday", "5 days ago"]);
}

section("The calendar counts weeks from Monday");
{
  const {mondayOf, weekTally, weekStreak, trainingDays} = await import("../src/rules/calendar.js");
  const {iso} = await import("../src/rules/format.js");
  reset();
  equal("a Wednesday's week starts on Monday", iso(mondayOf(new Date(2026, 8, 23))), "2026-09-21");
  equal("a Sunday belongs to the week before", iso(mondayOf(new Date(2026, 8, 27))), "2026-09-21");
  const week = (monday, days) => days.forEach((day, i) => {
    const date = iso(new Date(2026, 8, monday + i));
    state.sessions[date] = logged(date, day, 0);
  });
  week(7, ["chest", "legs", "arms"]);
  week(14, ["chest", "mobility", "legs"]);
  week(21, ["chest"]);
  const wednesday = new Date(2026, 8, 23);
  equal("this week so far", weekTally(state.sessions, wednesday), {lifting: 1, cross: 0});
  equal("an unfinished week does not break the streak", weekStreak(state.sessions, wednesday), 2);
  equal("cross-training is marked apart from lifting", trainingDays(state.sessions)["2026-09-15"], {count: 1, isLifting: false});
}

section("A workout done in the last seven days is marked");
{
  reset();
  state.sessions = {
    "2026-09-15": logged("2026-09-15", "chest", 0),
    "2026-09-16": logged("2026-09-16", "legs", 0),
    "2026-09-21": logged("2026-09-21", "mobility", 0),
    "2026-09-22": {date: "2026-09-22", day: "arms", block: "A", blockIndex: 0, entries: {}}
  };
  equal("counting today as one of the seven", [...recentDays(state.sessions, new Date(2026, 8, 22))].sort(), ["legs", "mobility"]);
}

section("Progression targets");
{
  equal("a hyphenated rep range parses", workouts.repRange("8-10"), {min: 8, max: 10});
  equal("a single rep count parses", workouts.repRange("12"), {min: 12, max: 12});
  equal("AMRAP has no range", workouts.repRange("AMRAP"), null);

  const press = {r: "8-10", bw: 0};
  const target = (ex, pairs) => {
    const t = suggestTarget(ex, {date: "2026-09-01", sets: setsOf(pairs)});
    return t && aimed(t);
  };

  equal("topping the range on every set asks for weight",
    target(press, [[45, 10], [45, 10], [45, 10]]), "50×8");
  equal("mid range asks for one more rep",
    target(press, [[45, 9], [45, 8], [45, 8]]), "45×10");
  equal("one set topped is not enough to add weight",
    target(press, [[45, 10], [45, 8], [45, 7]]), "45×10");
  equal("a single set at the top does not jump the weight",
    target(press, [[45, 10]]), "45×10");
  equal("overshooting the range asks for weight",
    target(press, [[45, 12], [45, 11]]), "50×8");
  equal("no history means no suggestion", suggestTarget(press, null), null);
  equal("bodyweight progresses on reps",
    target({r: "AMRAP", bw: 1}, [["", 8], ["", 7]]), "9");
  equal("a weighted bodyweight move keeps its weight",
    target({r: "6-8", bw: 1}, [[25, 6], [25, 5]]), "25×7");
  equal("a timed hold progresses on seconds",
    target({r: "45", unit: "sec", bw: 1}, [["", 45], ["", 45]]), "46");
  const changeOf = (ex, pairs) => suggestTarget(ex, {date: "2026-09-01", sets: setsOf(pairs)}).change;
  equal("the change says what moved",
    [changeOf(press, [[45, 10], [45, 10]]), changeOf(press, [[45, 9], [45, 8]]), changeOf({r: "45", unit: "sec", bw: 1}, [["", 45]])],
    ["+5 lb", "+1 rep", "+1s"]);
  equal("a top set already at the ceiling asks for it on every set", changeOf(press, [[45, 10], [45, 8], [45, 7]]), "every set");
  const {progressSince} = progression;
  const set = (w, r) => ({w: String(w), r: String(r)});
  equal("progress reads the weight gained first", progressSince(press, set(45, 10), set(55, 9), false), {text: "+10 lb", direction: "up"});
  equal("and its arrow follows the strength estimate, like the graph",
    progressSince(press, set(45, 10), set(55, 8), false).direction, "up");
  equal("then reps at the same weight", progressSince(press, set(45, 8), set(45, 10), false), {text: "+2 reps", direction: "up"});
  equal("and a drop says so", progressSince({r: "45", unit: "sec", bw: 1}, set("", 45), set("", 40), true), {text: "−5s", direction: "down"});
}

section("Custom exercises keep one identity");
{
  reset();
  const first = customs.customIdFor("sledgehammer slams");
  equal("a new name mints a custom id", first, "custom_sledgehammer_slams");

  state.customNames = {custom_sledgehammer_slams: "sledgehammer slams"};
  for(const variant of ["sledgehammer slams", "Sledgehammer Slams", "sledgehammer slam", "sledge-hammer slams", "Sledgehammer Slams!"])
    equal(`"${variant}" resolves to the same exercise`, customs.customIdFor(variant), first);

  equal("a genuinely different name does not", customs.customIdFor("tyre flips"), "custom_tyre_flips");

  state.customNames = {};
  equal("typing a program move's name resolves to that move", customs.customIdFor("Face Pull"), "face_pull");
  equal("punctuation variance still resolves", customs.customIdFor("bench dips"), "bench_dip");
  equal("empty input yields nothing", customs.customIdFor("   "), null);

  equal("a nickname resolves to the move it names", customs.customIdFor("lateral push ups"), "archer_pushup");
  equal("so does a nickname for a move you described", customs.customIdFor("weighted shoulder rotations"), "shoulder_circles");
  equal("a custom name you already own beats a nickname",
    (state.customNames = {custom_arm_circles: "arm circles"}, customs.customIdFor("arm circles")), "custom_arm_circles");
}

section("Swapping keeps history with the movement");
{
  reset();
  const slot = prescribedExercises().get("leg_curl");
  equal("no swap returns the slot untouched", slots.resolveSlot(slot, state.current.swaps).id, "leg_curl");

  state.current.swaps = {leg_curl: "db_rdl"};
  const resolved = slots.resolveSlot(slot, state.current.swaps);
  equal("a swap adopts the substitute's identity", resolved.id, "db_rdl");
  equal("the substitute records where it came from", resolved.swappedFrom, "leg_curl");
  equal("the slot's prescription is kept", [resolved.s, resolved.r], [slot.s, slot.r]);

  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "legs", block: "A", entries: {db_rdl: setsOf([[95, 10]])}}};
  const history = priorSets(state.sessions, resolved.id, "2026-09-08");
  check("the substitute is compared against its own history", history && history.sets[0].w === "95");
  equal("and not against the slot it replaced", priorSets(state.sessions, "leg_curl", "2026-09-08"), null);
}

section("Removing a custom exercise takes its sets with it");
{
  reset();
  state.customNames = {custom_sled_push: "sled push"};
  state.sessions = {
    "2026-09-01": {date: "2026-09-01", day: "legs", block: "A", blockIndex: 0,
      entries: {custom_sled_push: setsOf([[200, 5]]), goblet_squat: setsOf([[50, 10]])},
      swaps: {leg_curl: "custom_sled_push"}}
  };
  equal("its sets are counted before removal", customs.setsLoggedFor("custom_sled_push"), 1);

  customs.removeCustom("custom_sled_push");
  equal("the name is gone", state.customNames.custom_sled_push, undefined);
  equal("its sets are gone", state.sessions["2026-09-01"].entries.custom_sled_push, undefined);
  equal("the swap pointing at it is gone", state.sessions["2026-09-01"].swaps.leg_curl, undefined);
  check("unrelated sets in that session survive", !!state.sessions["2026-09-01"].entries.goblet_squat);

  state.sessions = {"2026-09-02": {date: "2026-09-02", day: "legs", block: "A", entries: {custom_only: setsOf([[10, 10]])}}};
  state.customNames = {custom_only: "only move"};
  customs.removeCustom("custom_only");
  equal("a session left with nothing is dropped", state.sessions["2026-09-02"], undefined);
}

section("Rest comes from the movement, not its place in the list");
{
  const {restFor} = workouts;
  const rest = (block, day, name) =>
    workouts.workoutSlots(workouts.workoutFor(block, day)).find(e => e.n === name).rest;

  equal("a heavy five gets the long rest", rest("C", "chest", "Flat DB Bench Press"), 180);
  equal("the day's lead compound gets two minutes", rest("A", "chest", "Flat DB Bench Press"), 120);
  equal("an isolation raise gets one minute", rest("A", "arms", "DB Lateral Raise"), 60);
  equal("calves are isolation wherever they sit", rest("A", "legs", "Standing DB Calf Raise"), 60);

  equal("the same move as a 3-set accessory rests 90s",
    rest("A", "legs", "Bulgarian Split Squat"), 90);
  equal("and as a 4-set lead rests 120s",
    rest("C", "legs", "Bulgarian Split Squat"), 120);

  equal("an AMRAP lead is still a lead", rest("A", "chest", "Pull-ups"), 120);
  equal("an AMRAP finisher is not", rest("A", "chest", "Push-ups"), 90);

  const slot = prescribedExercises().get("hip_thrust");
  equal("restFor reads the prescription, not the program", restFor(slot), 120);
  equal("dropping it to three sets drops the rest",
    restFor({id: slot.id, s: 3, r: slot.r}), 90);

  const positional = workouts.workoutFor("C", "chest").sections[0].ex
    .map((e, i) => e.rest === (i < 2 ? 120 : 60));
  check("the old positional rule no longer describes the day",
    positional.some(same => !same));
}

section("Every comparison scores a set by its strength estimate, not the biggest pile");
{
  const {topSet, score, trend} = progression;

  const sets = [{w: "50", r: "20"}, {w: "65", r: "10"}];
  equal("the top set is the heavier one, not the longer", topSet(sets, false), {w: "65", r: "10"});
  equal("65x10 estimates to 87", Math.round(score({w: "65", r: "10"}, false)), 87);
  equal("50x20 only estimates to 83", Math.round(score({w: "50", r: "20"}, false)), 83);
  equal("more weight at the bottom of the range counts as up", trend({w: "55", r: "8"}, {w: "50", r: "10"}, false), "up");

  equal("a bodyweight move is scored on reps",
    topSet([{w: "", r: "12"}, {w: "", r: "18"}], true), {w: "", r: "18"});
  equal("and its value is the rep count", score({w: "", r: "18"}, true), 18);
  equal("added weight on a bodyweight move counts, as it does on the log",
    topSet([{w: "", r: "15"}, {w: "45", r: "8"}], true), {w: "45", r: "8"});

  equal("no logged sets means no best", topSet([{w: "50", r: ""}], false), null);
  equal("an empty list too", topSet([], false), null);
}

section("One formatter serves both views");
{
  const {setSummary, elapsedLabel, unitSuffix} = await import("../src/rules/format.js");

  equal("a run folds", setSummary([{w: "50", r: "12"}, {w: "50", r: "12"}], ""), "2 × 50×12");
  equal("a lone set does not", setSummary([{w: "50", r: "12"}], ""), "50×12");
  equal("no sets is empty", setSummary([], ""), "");
  equal("undefined sets is empty", setSummary(undefined, ""), "");
  equal("unlogged sets are skipped",
    setSummary([{w: "50", r: ""}, {w: "50", r: "12"}], ""), "50×12");
  equal("a bodyweight hold carries its unit",
    setSummary([{w: "", r: "45"}, {w: "", r: "45"}], "s"), "2 × 45s");

  equal("seconds moves get an s", unitSuffix({unit: "sec"}), "s");
  equal("everything else gets nothing", unitSuffix({}), "");

  check("elapsedLabel needs both ends", elapsedLabel(1000, null) === null);
}

section("Backup import merges rather than overwrites");
{
  reset();
  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "chest", block: "A", entries: {pullup: setsOf([["", 8]])}}};
  const merged = backup.mergeSessions({
    "2026-09-01": {date: "2026-09-01", day: "chest", block: "A", entries: {pullup: setsOf([["", 8], ["", 7]])}},
    "2026-09-03": {date: "2026-09-03", day: "legs", block: "A", entries: {goblet_squat: setsOf([[50, 10]])}}
  });
  equal("both an update and a new date merge", merged, 2);
  equal("the fuller copy of a shared date wins", loggedCount(state.sessions["2026-09-01"]), 2);

  backup.mergeSessions({"2026-09-01": {date: "2026-09-01", day: "chest", block: "A", entries: {pullup: setsOf([["", 8]])}}});
  equal("a thinner copy does not overwrite", loggedCount(state.sessions["2026-09-01"]), 2);

  backup.mergeSessions({"2026-09-05": {date: "2026-09-05"}});
  equal("a malformed record is ignored", state.sessions["2026-09-05"], undefined);
}

section("Storage round trip and legacy migration");
{
  localStorage.clear();
  localStorage.setItem("ironledger.v1", JSON.stringify({
    "2026-08-30": {date: "2026-08-30", day: "mon", block: "A", entries: {pullup: setsOf([["", 8]])}}
  }));
  hydrate();
  equal("a session saved under the old app name still loads", state.sessions["2026-08-30"].day, "chest");

  localStorage.clear();
  localStorage.setItem("overload.v1", JSON.stringify({"2026-07-01": {day: "legs", block: "A", entries: {}}}));
  hydrate();
  equal("a session keyed by date alone gets that date on load", state.sessions["2026-07-01"].date, "2026-07-01");

  localStorage.clear();
  state.sessions = {"2026-09-01": logged("2026-09-01", "chest", 0)};
  const {saveSessions, loadSessions} = await import("../src/store/storage.js");
  saveSessions(state.sessions);
  equal("sessions survive a save and load", loadSessions()["2026-09-01"].day, "chest");
}

section("Rules the views share live below them");
{
  reset();
  const {trend, backoffWeight} = progression;
  equal("more weight reads as up", trend({w: "50", r: "10"}, {w: "45", r: "10"}, false), "up");
  equal("the same set reads as same", trend({w: "45", r: "10"}, {w: "45", r: "10"}, false), "same");
  equal("fewer reps reads as down", trend({w: "45", r: "8"}, {w: "45", r: "10"}, false), "down");
  equal("the back-off drops 10% to the nearest plate", backoffWeight(setsOf([[60, 10]]), false), 55);
  equal("a lift with no weight has no back-off", backoffWeight(setsOf([["", 12]]), true), null);

  const press = prescribedExercises().get("flat_db_press");
  equal("rest between sets is the move's own", workouts.restAfterSet(press, 0), press.rest);
  equal("the last set rests into the next move", workouts.restAfterSet(press, press.s - 1), press.restAfter);

  const workout = workouts.workoutFor("A", "chest");
  const session = {
    swaps: {flat_db_press: "db_rdl"},
    entries: {db_rdl: setsOf([[95, 10]]), leg_curl: setsOf([[40, 12]]), hammer_curl: [{w: "", r: ""}]}
  };
  equal("only a logged move the plan does not hold is a stray", slots.strayIds(session, workout), ["leg_curl"]);

  const incline = prescribedExercises().get("incline_db_press");
  const taken = slots.idsTakenElsewhere(incline, workout, {flat_db_press: "db_rdl"});
  check("another slot's substitute counts as taken", taken.has("db_rdl") && !taken.has("flat_db_press"));
  check("the slot's own move does not", !taken.has("incline_db_press"));

  const {logSet, swapSlot, flushNow} = await import("../src/store/session.js");
  check("reps logged for the first time count as a new set", logSet(press, 0, {w: "50", r: "10"}));
  check("editing a logged set does not", !logSet(press, 0, {w: "55", r: "10"}));
  equal("the set is written in its place", state.current.entries.flat_db_press, [{w: "55", r: "10"}]);
  check("a move already in the session cannot fill another slot", !swapSlot(incline, "flat_db_press"));
  check("a free move can", swapSlot(incline, "squeeze_press") && state.current.swaps.incline_db_press === "squeeze_press");
  check("choosing the slot's own move undoes the swap",
    swapSlot(incline, "incline_db_press") && !state.current.swaps.incline_db_press);
  flushNow();
}

section("Effort tunes the next target");
{
  const {topSet, exposures, hasStalled, prescribedCount} = progression;
  const press = {id: "flat_db_press", r: "8-10", bw: 0};
  const at = (pairs, effort) =>
    suggestTarget(press, {date: "2026-09-01", sets: setsOf(pairs), effort});

  equal("no effort recorded behaves as medium",
    aimed(at([[45, 10], [45, 10]])), aimed(at([[45, 10], [45, 10]], "medium")));
  equal("medium adds one step of weight",
    aimed(at([[45, 10], [45, 10]], "medium")), "50×8");
  equal("easy adds two steps",
    aimed(at([[45, 10], [45, 10]], "easy")), "55×8");
  equal("hard repeats the same set",
    aimed(at([[45, 10], [45, 10]], "hard")), "45×10");
  equal("hard says so", at([[45, 10], [45, 10]], "hard").change, "repeat it");
  equal("a held lift asks only for a match",
    suggestTarget(press, {sets: setsOf([[60, 12], [60, 10]]), effort: "easy"}, true), {w: "60", r: "12", change: "match it", isPush: false});
  equal("easy mid-range adds two reps",
    aimed(at([[45, 8], [45, 8]], "easy")), "45×10");
  equal("easy cannot push reps past the top of the range",
    aimed(at([[45, 9], [45, 9]], "easy")), "45×10");

  const pullup = {id: "pullup", r: "AMRAP", bw: 1};
  equal("bodyweight easy adds two reps",
    aimed(suggestTarget(pullup, {sets: setsOf([["", 8]]), effort: "easy"})), "10");

  equal("the top set is the one with the most weight x reps",
    topSet(setsOf([[40, 10], [60, 10], [45, 9]]), false).w, "60");
  equal("a heavy short set does not beat a lighter long one",
    topSet(setsOf([[50, 3], [45, 9]]), false).w, "45");
  equal("a set with no reps is not a top set", topSet(setsOf([["", ""]]), false), null);
}

section("Holding a lift");
{
  reset();
  const {isHeld, holdExercise, releaseExercise, releaseIfBeaten} = await import("../src/store/holds.js");
  const {loadHolds} = await import("../src/store/storage.js");
  const curl = {id: "ez_curl", bw: 0};
  const last = {sets: setsOf([[60, 10], [60, 10]])};
  holdExercise("ez_curl");
  check("a hold is remembered", isHeld("ez_curl") && loadHolds().ez_curl === 1);
  releaseIfBeaten(curl, setsOf([[60, 10]]), last);
  check("matching last time keeps it", isHeld("ez_curl"));
  releaseIfBeaten(curl, setsOf([[55, 10]]), last);
  check("dropping the weight keeps it", isHeld("ez_curl"));
  releaseIfBeaten(curl, setsOf([[60, 10], [60, 11]]), last);
  check("one more rep on any set releases it", !isHeld("ez_curl") && !loadHolds().ez_curl);
  holdExercise("ez_curl");
  releaseExercise("ez_curl");
  check("released", !isHeld("ez_curl") && !loadHolds().ez_curl);

  state.customNames = {custom_x: "x"};
  holdExercise("custom_x");
  customs.removeCustom("custom_x");
  check("removing a custom exercise drops its hold", !isHeld("custom_x"));
}

section("Stall detection");
{
  reset();
  const press = prescribedExercises().get("flat_db_press");
  const flat = {};
  ["2026-08-04", "2026-08-11", "2026-08-18"].forEach(date => {
    flat[date] = {date, day: "chest", block: "A", blockIndex: 0,
      entries: {flat_db_press: setsOf([[45, 10]])}};
  });
  state.sessions = flat;
  check("three flat sessions is a stall", hasStalledFor(press));

  state.sessions["2026-08-18"].entries.flat_db_press = setsOf([[50, 10]]);
  check("an improvement clears it", !hasStalledFor(press));

  delete state.sessions["2026-08-04"];
  state.sessions["2026-08-18"].entries.flat_db_press = setsOf([[45, 10]]);
  check("two exposures is not enough to call it", !hasStalledFor(press));

  reset();
  check("no history is not a stall", !hasStalledFor(press));

  state.sessions = {
    "2026-08-04": {date: "2026-08-04", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: setsOf([[50, 10]])}},
    "2026-08-11": {date: "2026-08-11", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: setsOf([[45, 10]])}},
    "2026-08-18": {date: "2026-08-18", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: setsOf([[45, 10]])}}
  };
  check("dropping the weight starts the count over", !hasStalledFor(press));

  state.sessions["2026-08-04"].entries.flat_db_press = setsOf([[45, 10]]);
  const stalledToday = today => progression.hasStalled(state.sessions, press, "2026-09-01", undefined, today);
  check("matching it today is still a stall", stalledToday(setsOf([[45, 10]])));
  check("one more rep today clears it", !stalledToday(setsOf([[45, 10], [45, 11]])));
  check("a new weight typed today clears it", !stalledToday([{w: "40", r: ""}]));
}

section("Cross-training sits beside the program, not inside it");
{
  for(const block of BLOCKS) for(const day of CROSS_KEYS) for(const isAway of [false, true]){
    const workout = workouts.workoutFor(block, day, isAway);
    const name = `${block}/${day}${isAway ? " away" : ""}`;
    const total = prescribedCountFor(block, day, isAway);
    check(`${name} has three sections`, workout.sections.length === 3, workout.sections.length);
    check(`${name} prescribes 15-36 sets`, total >= 15 && total <= 36, total);
    const ids = workouts.workoutSlots(workout).map(e => e.id);
    equal(`${name} lists no move twice`, ids.filter((id, i) => ids.indexOf(id) !== i), []);
  }

  const thruster = workouts.workoutFor("A", "conditioning").sections[0].ex[0];
  equal("an interval move takes its shape from its section",
    [thruster.s, thruster.r, thruster.win, thruster.rest, thruster.restAfter], [4, "AMRAP", 40, 20, 20]);
  const hang = workouts.workoutFor("A", "functional").sections[2].ex[0];
  equal("a finisher keeps its own set count", [hang.s, hang.r, hang.unit, hang.rest], [2, "30", "sec", 60]);
  const stairs = workouts.workoutFor("A", "conditioning").sections[2].ex[0];
  equal("a machine finisher logs level and minutes", [stairs.load, stairs.unit, !!stairs.bw], ["level", "min", true]);

  const liftingGoblet = prescribedExercises().get("goblet_squat");
  equal("a lift reused in cross-training keeps its lifting definition", [liftingGoblet.r, liftingGoblet.win], ["10-12", undefined]);

  equal("a machine finisher that hit its minutes goes up a level",
    suggestTarget(stairs, {sets: setsOf([[8, 8]])}), {w: "9", r: "8", change: "+1 level", isPush: true});
  equal("one that fell short keeps the level and adds a minute",
    aimed(suggestTarget(stairs, {sets: setsOf([[8, 6]])})), "8×7");

  reset();
  state.sessions = {"2026-09-01": logged("2026-09-01", "chest", 0)};
  state.sessions["2026-09-05"] = logged("2026-09-05", "conditioning", 0);
  state.sessions["2026-09-06"] = logged("2026-09-06", "mobility", 0);
  equal("cross-training does not move the lifting rotation", nextLiftingDay(state.sessions), "legs");
  equal("each cross-training type rotates on its own", [
    nextBlockIndex(state.sessions, "conditioning"),
    nextBlockIndex(state.sessions, "mobility"),
    nextBlockIndex(state.sessions, "functional")
  ], [1, 1, 0]);

  const {setDay, chooseBlock} = await import("../src/store/session.js");
  state.current = {key: "2026-09-20T09:00:00", date: "2026-09-20", day: "legs", block: "A", blockIndex: 0, isAway: false, entries: {}, swaps: {}, notes: "", effort: {}};
  setDay("conditioning");
  equal("switching an empty session picks up that type's next version", state.current.block, "B");
  setDay("chest");
  equal("and back to lifting picks up that workout's next", state.current.block, "B");

  state.current.entries = {flat_db_press: [{w: "50", r: "10"}]};
  const firstKey = state.current.key;
  chooseBlock("A");
  check("a version picked after logging opens its own workout", state.current.key !== firstKey && state.current.block === "A");
  check("and leaves the logged one whole", state.sessions[firstKey].block === "B" && !!state.sessions[firstKey].entries.flat_db_press);
  check("with nothing carried over", !state.current.entries.flat_db_press);
  chooseBlock("B");
  equal("picking the first version again returns to it", state.current.key, firstKey);
}

section("Swaps carry forward to the next time");
{
  reset();
  const {setDay, chooseBlock, resetSwaps} = await import("../src/store/session.js");
  state.sessions = {
    "2026-09-01T09:00:00": Object.assign(logged("2026-09-01", "chest", 0), {swaps: {incline_db_press: "squeeze_press"}}),
    "2026-09-08T09:00:00": Object.assign(logged("2026-09-08", "chest", 0),
      {swaps: {db_fly: "cable_crossover", db_step_up: "lateral_lunge", cs_db_row: "flat_db_press"}}),
    "2026-09-10T09:00:00": Object.assign(logged("2026-09-10", "chest", 1), {swaps: {db_fly: "db_pullover"}})
  };
  state.current = {key: "2026-09-20T09:00:00", date: "2026-09-20", day: "legs", block: "A", blockIndex: 0, isAway: false, entries: {}, swaps: {}, notes: "", effort: {}};
  setDay("chest");
  chooseBlock("A");
  equal("a new session keeps the last swaps of that workout, minus any that no longer fit",
    state.current.swaps, {db_fly: "cable_crossover"});
  chooseBlock("C");
  equal("another version of the day keeps its own", state.current.swaps, {});
  chooseBlock("A");
  resetSwaps();
  equal("reset returns to the program", state.current.swaps, {});
}

section("Away carries forward and keeps its own swaps");
{
  reset();
  const {loadDate, setDay, chooseBlock, setAway} = await import("../src/store/session.js");
  state.sessions = {
    "2026-09-01T09:00:00": Object.assign(logged("2026-09-01", "chest", 0), {swaps: {db_fly: "cable_crossover"}}),
    "2026-09-03T09:00:00": Object.assign(logged("2026-09-03", "chest", 0), {isAway: true, swaps: {wide_pushup: "diamond_pushup"}})
  };
  loadDate("2026-09-10");
  check("after an away session the next one opens away", state.current.isAway);
  setDay("chest");
  chooseBlock("A");
  equal("the away workout replaces the gym one", workouts.workoutOf(state.current).sections[0].ex[0].id, "archer_pushup");
  equal("away keeps its own swaps", state.current.swaps, {wide_pushup: "diamond_pushup"});
  setAway(false);
  equal("back at the gym, the gym swaps return", state.current.swaps, {db_fly: "cable_crossover"});
  equal("and the gym workout", workouts.workoutOf(state.current).sections[0].ex[0].id, "flat_db_press");
}

section("Prescribed set counts");
{
  for(const block of BLOCKS) for(const day of DAY_KEYS) for(const isAway of [false, true]){
    const total = prescribedCountFor(block, day, isAway);
    check(`${block}/${day}${isAway ? " away" : ""} prescribes 35-42 sets`, total >= 35 && total <= 42, total);
  }
  equal("main work plus core makes up the total",
    prescribedCountFor("A", "chest"),
    workouts.workoutFor("A", "chest").sections[0].ex.reduce((n, e) => n + e.s, 0) + 12);
}

section("Last time is looked up within the same kind of session");
{
  reset();
  state.sessions["2026-08-20"] = logged("2026-08-20", "arms", 2, {push_press: setsOf([[40, 8], [40, 8]])});
  state.sessions["2026-08-30"] = logged("2026-08-30", "conditioning", 0, {push_press: setsOf([[20, 22]])});
  const onArms = priorSets(state.sessions, "push_press", "2026-09-01", "arms");
  check("an arms card looks past the conditioning interval", onArms && onArms.date === "2026-08-20", onArms && onArms.date);
  const onConditioning = priorSets(state.sessions, "push_press", "2026-09-01", "conditioning");
  check("a conditioning card sees the interval", onConditioning && onConditioning.date === "2026-08-30", onConditioning && onConditioning.date);
  const unscoped = priorSets(state.sessions, "push_press", "2026-09-01");
  check("without a day it still finds the latest of either", unscoped && unscoped.date === "2026-08-30", unscoped && unscoped.date);
  const heavy = {id: "push_press", bw: 0};
  ["2026-08-01", "2026-08-08", "2026-08-15"].forEach(date => {
    state.sessions[date] = logged(date, "arms", 1, {push_press: setsOf([[40, 8]])});
  });
  state.sessions["2026-08-20"].entries.push_press = setsOf([[40, 8]]);
  check("a stall counts only lifting sessions", progression.hasStalled(state.sessions, heavy, "2026-09-01", "arms", []));
}

section("Relabelling a session sets its workout and version");
{
  const {relabelSession} = await import("../src/store/session.js");
  reset();
  state.sessions["2026-08-08"] = logged("2026-08-08", "conditioning", 7);
  relabelSession("2026-08-08", "chest", "A");
  const refiled = state.sessions["2026-08-08"];
  check("it takes the day and letter asked for", refiled.day === "chest" && refiled.block === "A" && refiled.blockIndex === 6, refiled.blockIndex);
  relabelSession("2026-08-08", "chest", "C");
  check("a new letter stays in the same round", refiled.block === "C" && refiled.blockIndex === 8, refiled.blockIndex);
}

process.exit(report() ? 0 : 1);
