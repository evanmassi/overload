import {
  section, check, equal, report, reset, logged, setsOf, everyMovement, clearStorage,
  state, hydrate, constants, movements, progression, rotation, swaps, backup,
  HOWTO, PATTERNS, LOAD, PER
} from "./harness.mjs";

const {BLOCKS, DAY_KEYS, IMPLEMENTS_PER_LOAD} = constants;
const {activeBlockIndex, nextSessionIn, sessionsDoneIn, blockLetter, cycleNumber} = rotation;
const {suggestTarget, sessionVolume, loggedCount, priorSets} = progression;

const hasStalledFor = exercise => progression.hasStalled(state.sessions, exercise, "2026-09-01");
const prescribedCountFor = (block, day) => progression.prescribedCount(block, day);

section("Program data");
{
  const moves = everyMovement();
  equal("three week blocks", Object.keys(movements.PROGRAM), BLOCKS);
  check("92 distinct movements", moves.size === 92, moves.size);

  const untagged = [...moves.keys()].filter(id => !movements.PATTERN_OF[id]);
  equal("every movement belongs to a pattern", untagged, []);

  const missingHowTo = [...moves.keys()].filter(id => !HOWTO[id]);
  equal("every movement has a how-to", missingHowTo, []);

  const badSteps = Object.keys(HOWTO).filter(id => !HOWTO[id].s || HOWTO[id].s.length < 3 || !HOWTO[id].w);
  equal("every how-to has 3+ steps and a watch-out", badSteps, []);

  const ghosts = Object.keys(HOWTO).filter(id => !moves.has(id));
  equal("no how-to for a movement that does not exist", ghosts, []);

  const unfactored = [...moves.values()].filter(e => !e.sides || !e.implements || !e.load);
  equal("every movement carries load and side factors", unfactored.map(e => e.id), []);

  const bwMismatch = [...moves.values()].filter(e => !!e.bw !== LOAD.bw.includes(e.id));
  equal("bodyweight flag agrees with the bodyweight load tag", bwMismatch.map(e => e.id), []);

  const perIds = new Set(Object.values(PER).flat());
  const perMismatch = [...moves.values()].filter(e => !!e.per !== perIds.has(e.id));
  equal("per-side flag agrees with the per-side table", perMismatch.map(e => e.id), []);

  let dupes = [];
  const seen = new Set();
  for(const kind in LOAD) for(const id of LOAD[kind]){ if(seen.has(id)) dupes.push(id); seen.add(id); }
  equal("no movement carries two load tags", dupes, []);

  for(const block of BLOCKS) for(const day of DAY_KEYS){
    const plan = movements.workoutFor(block, day);
    check(`${block}/${day} has 8 main moves`, plan.ex.length === 8, plan.ex.length);
    check(`${block}/${day} has 3 core supersets of 2`, plan.core.length === 3 && plan.core.every(p => p.length === 2));
  }
}

section("Rotation follows work done, not the calendar");
{
  reset();
  equal("a fresh app opens Week A, Chest", [activeBlockIndex(state.sessions), nextSessionIn(state.sessions, 0)], [0, "chest"]);

  state.sessions = {"2026-09-01": logged("2026-09-01", "chest", 0)};
  equal("after Chest it offers Legs", nextSessionIn(state.sessions, activeBlockIndex(state.sessions)), "legs");

  state.sessions["2026-09-04"] = logged("2026-09-04", "arms", 0);
  equal("skipping Legs for Arms still leaves Legs queued",
    [activeBlockIndex(state.sessions), nextSessionIn(state.sessions, 0)], [0, "legs"]);

  state.sessions["2026-09-06"] = logged("2026-09-06", "legs", 0);
  equal("finishing all three advances to Week B, Chest",
    [activeBlockIndex(state.sessions), blockLetter(1), nextSessionIn(state.sessions, 1)], [1, "B", "chest"]);

  reset();
  state.sessions = {};
  let day = 1;
  for(const blockIndex of [0, 1, 2]) for(const key of DAY_KEYS){
    const date = `2026-09-${String(day++).padStart(2, "0")}`;
    state.sessions[date] = logged(date, key, blockIndex);
  }
  equal("a full cycle wraps to Week A of cycle 2",
    [activeBlockIndex(state.sessions), blockLetter(3), cycleNumber(3)], [3, "A", 2]);

  reset();
  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "chest", blockIndex: 0, block: "A", entries: {}}};
  equal("an opened but empty session does not count as done", activeBlockIndex(state.sessions), 0);

  state.sessions = {"2026-09-01": {date: "2026-09-01", day: "chest", block: "B", entries: {x: [{w: "1", r: "1"}]}}};
  equal("a session with no blockIndex infers it from its letter", activeBlockIndex(state.sessions), 1);
}

section("Progression targets");
{
  equal("a hyphenated rep range parses", movements.repRange("8-10"), {min: 8, max: 10});
  equal("a single rep count parses", movements.repRange("12"), {min: 12, max: 12});
  equal("AMRAP has no range", movements.repRange("AMRAP"), null);

  const press = {r: "8-10", bw: 0};
  const target = (ex, pairs) => {
    const t = suggestTarget(ex, {date: "2026-09-01", sets: setsOf(pairs)});
    return t && t.label;
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
    target({r: "AMRAP", bw: 1}, [["", 8], ["", 7]]), "9 reps");
  equal("a weighted bodyweight move keeps its weight",
    target({r: "6-8", bw: 1}, [[25, 6], [25, 5]]), "25×7");
  equal("a timed hold progresses on seconds",
    target({r: "45", unit: "sec", bw: 1}, [["", 45], ["", 45]]), "46s");
}

section("Session volume counts implements and sides");
{
  const volume = (day, block, entries) => sessionVolume({day, block, entries}, block, day);

  equal("a pair of dumbbells doubles the load",
    volume("chest", "A", {flat_db_press: setsOf([[50, 10]])}), 1000);
  equal("one dumbbell counts once",
    volume("legs", "A", {goblet_squat: setsOf([[50, 10]])}), 500);
  equal("a per-leg move with a pair counts four times",
    volume("legs", "A", {walking_lunge: setsOf([[40, 12]])}), 1920);
  equal("a per-arm move with one dumbbell counts twice",
    volume("legs", "A", {single_arm_row: setsOf([[60, 10]])}), 1200);
  equal("a bar counts its total once",
    volume("arms", "A", {ez_curl: setsOf([[60, 10]])}), 600);
  equal("bodyweight contributes no tonnage",
    volume("chest", "A", {pullup: setsOf([["", 10]])}), 0);

  equal("implement factors", IMPLEMENTS_PER_LOAD, {pair: 2, single: 1, bar: 1, stack: 1, bw: 1});
}

section("Custom exercises keep one identity");
{
  reset();
  const first = swaps.customIdFor("lateral push ups");
  equal("a new name mints a custom id", first, "custom_lateral_push_ups");

  state.customNames = {custom_lateral_push_ups: "lateral push ups"};
  for(const variant of ["lateral push ups", "Lateral Push Ups", "lateral pushups", "lateral push-ups", "Lateral Push-Ups!"])
    equal(`"${variant}" resolves to the same exercise`, swaps.customIdFor(variant), first);

  equal("a genuinely different name does not", swaps.customIdFor("lateral raises"), "custom_lateral_raises");

  state.customNames = {};
  equal("typing a program move's name resolves to that move", swaps.customIdFor("Face Pull"), "face_pull");
  equal("punctuation variance still resolves", swaps.customIdFor("bench dips"), "bench_dip");
  equal("empty input yields nothing", swaps.customIdFor("   "), null);
}

section("Swapping keeps history with the movement");
{
  reset();
  const slot = movements.findExercise("leg_curl");
  equal("no swap returns the slot untouched", swaps.resolveSlot(slot).id, "leg_curl");

  state.current.swaps = {leg_curl: "db_rdl"};
  const resolved = swaps.resolveSlot(slot);
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
  equal("its sets are counted before removal", swaps.setsLoggedFor("custom_sled_push"), 1);

  swaps.removeCustom("custom_sled_push");
  equal("the name is gone", state.customNames.custom_sled_push, undefined);
  equal("its sets are gone", state.sessions["2026-09-01"].entries.custom_sled_push, undefined);
  equal("the swap pointing at it is gone", state.sessions["2026-09-01"].swaps.leg_curl, undefined);
  check("unrelated sets in that session survive", !!state.sessions["2026-09-01"].entries.goblet_squat);

  state.sessions = {"2026-09-02": {date: "2026-09-02", day: "legs", block: "A", entries: {custom_only: setsOf([[10, 10]])}}};
  state.customNames = {custom_only: "only move"};
  swaps.removeCustom("custom_only");
  equal("a session left with nothing is dropped", state.sessions["2026-09-02"], undefined);
}

section("Rest comes from the movement, not its place in the list");
{
  const {restFor} = movements;
  const rest = (block, day, name) =>
    movements.workoutFor(block, day).ex.find(e => e.n === name).rest;

  equal("a heavy five gets the long rest", rest("C", "chest", "Flat DB Bench Press"), 180);
  equal("the day's lead compound gets two minutes", rest("A", "chest", "Flat DB Bench Press"), 120);
  equal("an isolation raise gets one minute", rest("A", "arms", "DB Lateral Raise"), 60);
  equal("calves are isolation wherever they sit", rest("A", "legs", "Standing DB Calf Raise"), 60);

  equal("the same move as a 3-set accessory rests 90s",
    rest("A", "legs", "Bulgarian Split Squat"), 90);
  equal("and as a 4-set lead rests 120s",
    rest("C", "legs", "Bulgarian Split Squat"), 120);

  equal("an AMRAP lead is still a lead", rest("A", "chest", "Pull-ups"), 120);
  equal("an AMRAP finisher is not", rest("A", "chest", "Push-ups to Failure"), 90);

  const slot = movements.findExercise("hip_thrust");
  equal("restFor reads the prescription, not the program", restFor(slot), 120);
  equal("dropping it to three sets drops the rest",
    restFor({id: slot.id, s: 3, r: slot.r}), 90);

  const positional = movements.workoutFor("C", "chest").ex
    .map((e, i) => e.rest === (i < 2 ? 120 : 60));
  check("the old positional rule no longer describes the day",
    positional.some(same => !same));
}

section("The progress card reads the best estimate, not the biggest pile");
{
  const {bestEstimate, estimateFor} = progression;

  const sets = [{w: "50", r: "20"}, {w: "65", r: "10"}];
  equal("volume would pick the lighter, longer set",
    sets.reduce((a, b) => progression.score(b, false) > progression.score(a, false) ? b : a),
    {w: "50", r: "20"});
  equal("the estimate picks the heavier one", bestEstimate(sets, false), {w: "65", r: "10"});
  equal("65x10 estimates to 87", Math.round(estimateFor({w: "65", r: "10"}, false)), 87);
  equal("50x20 only estimates to 83", Math.round(estimateFor({w: "50", r: "20"}, false)), 83);

  equal("a bodyweight move is scored on reps",
    bestEstimate([{w: "", r: "12"}, {w: "", r: "18"}], true), {w: "", r: "18"});
  equal("and its value is the rep count",
    estimateFor({w: "", r: "18"}, true), 18);

  equal("no logged sets means no best", bestEstimate([{w: "50", r: ""}], false), null);
  equal("an empty list too", bestEstimate([], false), null);
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
  clearStorage();
  localStorage.setItem("ironledger.v1", JSON.stringify({
    "2026-08-30": {date: "2026-08-30", day: "mon", block: "A", entries: {pullup: setsOf([["", 8]])}}
  }));
  hydrate();
  equal("a session saved under the old app name still loads", state.sessions["2026-08-30"].day, "chest");

  clearStorage();
  state.sessions = {"2026-09-01": logged("2026-09-01", "chest", 0)};
  const {saveSessions, loadSessions} = await import("../src/storage.js");
  saveSessions(state.sessions);
  equal("sessions survive a save and load", loadSessions()["2026-09-01"].day, "chest");
}

section("Effort tunes the next target");
{
  const {topSet, exposures, hasStalled, prescribedCount} = progression;
  const press = {id: "flat_db_press", r: "8-10", bw: 0};
  const at = (pairs, effort) =>
    suggestTarget(press, {date: "2026-09-01", sets: setsOf(pairs), effort});

  equal("no effort recorded behaves as medium",
    at([[45, 10], [45, 10]]).label, at([[45, 10], [45, 10]], "medium").label);
  equal("medium adds one step of weight",
    at([[45, 10], [45, 10]], "medium").label, "50×8");
  equal("easy adds two steps",
    at([[45, 10], [45, 10]], "easy").label, "55×8");
  equal("hard repeats the same set",
    at([[45, 10], [45, 10]], "hard").label, "45×10");
  equal("hard says so", at([[45, 10], [45, 10]], "hard").why, "repeat it");
  equal("easy mid-range adds two reps",
    at([[45, 8], [45, 8]], "easy").label, "45×10");
  equal("easy cannot push reps past the top of the range",
    at([[45, 9], [45, 9]], "easy").label, "45×10");

  const pullup = {id: "pullup", r: "AMRAP", bw: 1};
  equal("bodyweight easy adds two reps",
    suggestTarget(pullup, {sets: setsOf([["", 8]]), effort: "easy"}).label, "10 reps");

  equal("the top set is the one with the most weight x reps",
    topSet(setsOf([[40, 10], [60, 10], [45, 9]]), false).w, "60");
  equal("a heavy short set does not beat a lighter long one",
    topSet(setsOf([[50, 3], [45, 9]]), false).w, "45");
  equal("a set with no reps is not a top set", topSet(setsOf([["", ""]]), false), null);
}

section("Stall detection");
{
  reset();
  const press = movements.findExercise("flat_db_press");
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
}

section("Prescribed set counts");
{
  for(const block of BLOCKS) for(const day of DAY_KEYS){
    const total = prescribedCountFor(block, day);
    check(`${block}/${day} prescribes 35-39 sets`, total >= 35 && total <= 39, total);
  }
  equal("main work plus core makes up the total",
    prescribedCountFor("A", "chest"),
    movements.workoutFor("A", "chest").ex.reduce((n, e) => n + e.s, 0) + 12);
}

process.exit(report() ? 0 : 1);
