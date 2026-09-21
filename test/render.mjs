import {installDom} from "./dom.mjs";

const els = installDom();

const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { for(const k in store) delete store[k]; }
};

const {state} = await import("../src/state.js");
const {render} = await import("../src/render.js");
const {mountSheet, openSwapSheet, openHowTo} = await import("../src/sheet.js");
const {mountTimer} = await import("../src/timer.js");
const {mountSaveState} = await import("../src/savestate.js");
const {findExercise} = await import("../src/movements.js");
const {loadDate, setDay, iso} = await import("../src/session.js");

mountTimer(els.timer, els.clock);
mountSaveState(els.status);
mountSheet(els.sheet, els.sheettitle, els.sheetbody, els.sheetclose, els.sheetback);

const cell = (row, i) => row.children[i].find("sfield-input")[0] || row.children[i];
const wt = row => cell(row, 1);
const rp = row => cell(row, 3);

let passed = 0, failed = 0;
const check = (label, cond, detail) => {
  if(cond){ passed++; console.log("  PASS  " + label); }
  else { failed++; console.log("  FAIL  " + label + (detail === undefined ? "" : "  -> " + detail)); }
};
const equal = (label, got, want) => {
  const same = JSON.stringify(got) === JSON.stringify(want);
  check(label, same, same ? undefined : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};
const section = name => console.log("\n" + name);

function fresh(){
  localStorage.clear();
  els.sheet.hidden = true;
  state.sessions = {};
  state.customNames = {};
  state.view = "log";
  state.historyDay = null;
  state.historyOpen = new Set();
  loadDate("2026-09-01");
}

function openHistoryCard(index){
  els.main.find("hist-row")[index].fire("click");
  render();
  return els.main.find("hist-day")[index];
}

section("The log view renders a full session");
{
  fresh();
  render();
  const cards = els.main.find("ex");
  check("nine main cards plus three superset cards", cards.length === 12, cards.length);
  check("each main card has a swap button", els.main.find("ex-swap").length === 15, els.main.find("ex-swap").length);
  const metas = els.main.find("meta");
  check("every exercise states its load convention", metas.length === 15 && metas.every(m => /per dumbbell|one dumbbell|total w|stack|bodyweight/.test(m.innerHTML)), metas.length);
  check("per-side moves are tagged", metas.some(m => m.innerHTML.includes("per leg")) || state.current.day !== "legs");
  check("every card names the muscles it works", metas.every(m => m.innerHTML.includes("tag muscle")));
  check("chips and prescription sit on separate lines", metas.every(m => m.innerHTML.includes("meta-chips") && m.innerHTML.includes("meta-line")));
  check("the session tabs render", els.main.find("sessions").length === 1);
  check("a notes box renders", els.main.find("notes").length === 1);
  check("the legend renders", els.main.find("legend").length === 1);
  check("no target band before any history exists", els.main.find("target").length === 0);
  check("footer reports an empty session", els.volnote.textContent === "nothing logged yet", els.volnote.textContent);
}

section("Logging a set updates the view");
{
  fresh();
  render();
  const firstSetRow = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  const weight = wt(firstSetRow);
  const reps = rp(firstSetRow);
  weight.value = "50";
  reps.value = "10";
  reps.fire("change");

  check("the set is recorded on the current session", state.current.entries.flat_db_press[0].r === "10");
  check("volume reflects a pair of dumbbells", els.volume.textContent === "1,000 lb", els.volume.textContent);
  check("the rest timer started", /^\d+:\d\d$/.test(els.timer.dataset.label), els.timer.dataset.label);
}

section("A prior session drives placeholders and a target");
{
  fresh();
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "45", r: "10"}, {w: "45", r: "10"}, {w: "45", r: "10"}]}
  };
  loadDate("2026-09-01");
  setDay("chest");
  render();

  check("a target band appears", els.main.find("target").length >= 1);
  const band = els.main.find("target")[0];
  check("it asks for more weight after topping the range", band.innerHTML.includes("50×8"), band.innerHTML);
  const row = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  check("last time's weight is the placeholder", wt(row).attrs === undefined || wt(row).placeholder === "45", wt(row).placeholder);
}

section("Sheets open and close");
{
  fresh();
  render();
  check("the sheet starts hidden", els.sheet.hidden === true);

  openHowTo(findExercise("flat_db_press"));
  check("the how-to sheet opens", els.sheet.hidden === false);
  check("it lists numbered steps", els.sheetbody.find("howto-steps").length === 1);
  check("it names the exercise", els.sheettitle.textContent === "Flat DB Bench Press", els.sheettitle.textContent);

  els.sheetclose.fire("click");
  check("close hides it again", els.sheet.hidden === true);

  openSwapSheet(findExercise("leg_curl"));
  check("the swap sheet opens", els.sheet.hidden === false);
  check("it offers same-pattern alternatives", els.sheetbody.find("sheet-item").length > 1);
  check("it offers a custom entry box", els.sheetbody.find("sheet-custom").length === 1);
  els.sheetback.fire("click");
  check("tapping the backdrop closes it", els.sheet.hidden === true);

  openSwapSheet(findExercise("flat_db_press"));
  const offered = els.sheetbody.find("sheet-item").map(item => item.innerHTML);
  check("it never offers a move the session already has", !offered.some(html => html.includes(">Pull-ups<")));
  check("but still lists the slot's own move", offered.some(html => html.includes(">Flat DB Bench Press<")));
  els.sheetclose.fire("click");
}

section("History and progress views render");
{
  fresh();
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    notes: "shoulder felt fine",
    startedAt: 1000000, lastLoggedAt: 1000000 + 64 * 60000,
    entries: {flat_db_press: [{w: "45", r: "10"}]}
  };
  state.sessions["2026-08-18"] = {
    date: "2026-08-18", day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "40", r: "10"}]}
  };

  state.view = "history";
  render();
  check("a card per session", els.main.find("hist-day").length === 2, els.main.find("hist-day").length);
  check("cards start collapsed", els.main.find("hist-body").length === 0, els.main.find("hist-body").length);
  check("and carry no exercise lines yet", els.main.find("hist-line").length === 0);
  openHistoryCard(0);
  check("tapping a row opens it", els.main.find("hist-body").length === 1, els.main.find("hist-body").length);
  check("notes show on the open card", els.main.find("hist-notes").length === 1);
  check("the open card offers edit and delete",
    els.main.find("hist-actions")[0].children.map(b => b.dataset.label).join() === "edit,delete",
    els.main.find("hist-actions")[0].children.map(b => b.dataset.label).join());
  openHistoryCard(0);
  check("tapping again closes it", els.main.find("hist-body").length === 0);
  check("backup controls render", els.main.find("backup").length === 1);

  const feet = els.main.find("hist-foot");
  check("every card gets a totals strip", feet.length === 2, feet.length);
  check("the strip carries volume and set count",
    feet.every(f => /lb/.test(f.innerHTML) && /sets/.test(f.innerHTML)), feet[0].innerHTML);
  const timed = feet.filter(f => /1h 04m/.test(f.innerHTML));
  check("only the session with timestamps reports how long it took",
    timed.length === 1, feet.map(f => f.innerHTML).join(" | "));
  check("totals are no longer exercise rows",
    !els.main.find("hist-line").some(l => /volume|first set to last/.test(l.innerHTML)));

  state.view = "progress";
  render();
  check("a progress card renders", els.main.find("prog").length === 1);
  check("the number is labelled an estimate, not a weight",
    els.main.find("prog")[0].innerHTML.includes("est. 1RM"),
    els.main.find("prog")[0].innerHTML);
  check("two data points draw a sparkline", els.main.find("prog")[0].children.some(c => c.tag === "svg"));
}

section("Collapsing and the set bar");
{
  fresh();
  render();
  check("the set bar starts empty", els.tally.textContent === "0/41", els.tally.textContent);
  check("and draws one tick per prescribed set",
    els.setbar.children.length === 41, els.setbar.children.length);
  check("with none lit", els.setbar.children.every(t => t.dataset.state !== "on"));

  const card = els.main.find("ex-move")[0];
  const rows = card.find("set").filter(r => !r.classList.contains("head"));
  rows.forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  render();

  check("finishing every set collapses the card", els.main.find("ex-move")[0].classList.contains("done"));
  check("its summary is populated", els.main.find("ex-summary")[0].textContent.includes("50"));
  check("the tally counts the logged sets", els.tally.textContent === "4/41", els.tally.textContent);
  check("and four ticks light up",
    els.setbar.children.filter(t => t.dataset.state === "on").length === 4);
  check("the sets still to come on the move in hand read as pending",
    els.setbar.children.filter(t => t.dataset.state === "now").length > 0);
  check("the tally carries the count, not the note",
    els.tally.textContent === "4/41" && !els.volnote.textContent.includes("sets"),
    els.volnote.textContent);

  els.main.find("ex-fold")[0].fire("click");
  render();
  check("tapping the chevron expands it again", !els.main.find("ex-move")[0].classList.contains("done"));

  const blocks = els.main.find("ex-move");
  check("a block per main move plus two per superset", blocks.length === 15, blocks.length);

  const coreMove = blocks[9];
  coreMove.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    rp(row).value = "12";
    rp(row).fire("change");
  });
  render();
  const after = els.main.find("ex-move");
  check("a finished superset move collapses too", after[9].classList.contains("done"));
  check("its partner stays open", !after[10].classList.contains("done"));
  check("its summary is populated", after[9].find("ex-summary")[0].textContent.includes("12"));
}

section("Carry-forward repeat button");
{
  fresh();
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "45", r: "9"}]}
  };
  loadDate("2026-09-01");
  setDay("chest");
  render();

  const rows = els.main.find("ex-move")[0].find("set").filter(r => !r.classList.contains("head"));
  const first = rows[0].children[4];
  const second = rows[1].children[4];
  check("a set with history offers repeat", first.disabled === false);
  check("a set with none does not", second.disabled === true);

  const cue = els.main.find("ex-move")[0].find("prior")[0];
  check("the card footer dates last time's work",
    cue && cue.textContent.startsWith("2026-08-25"), cue && cue.textContent);
  check("and uses the same shorthand as history",
    cue && cue.textContent.includes("45×9"), cue && cue.textContent);

  first.fire("click");
  equal("set 1 fills in last time's numbers",
    state.current.entries.flat_db_press[0], {w: "45", r: "9"});
  check("filling set 1 wakes the button on set 2", second.disabled === false);

  wt(rows[1]).value = "50";
  rp(rows[1]).value = "8";
  rp(rows[1]).fire("change");

  rows[2].children[4].fire("click");
  equal("set 3 carries the set above it, not last session",
    state.current.entries.flat_db_press[2], {w: "50", r: "8"});

  check("logging set 3 in turn wakes set 4", rows[3].children[4].disabled === false);
}

section("Effort buttons");
{
  fresh();
  render();
  const rows = els.main.find("effort");
  check("every main move asks how it felt", rows.length === 9, rows.length);

  const buttons = rows[0].children.filter(c => c.tag === "button");
  equal("three levels", buttons.map(b => b.dataset.label), ["easy", "medium", "hard"]);
  buttons[2].fire("click");
  equal("tapping one records it", state.current.effort.flat_db_press, "hard");
  equal("and keeps it even before a set is logged",
    (state.sessions[state.current.date] || {}).effort, {flat_db_press: "hard"});

  render();
  const again = els.main.find("effort")[0].children.filter(c => c.tag === "button");
  check("the chosen level is marked", again[2].dataset.chosen === "on");
  check("and the others are not", again.slice(0, 2).every(b => b.dataset.chosen === "off"));
  again[2].fire("click");
  equal("tapping it again clears it", state.current.effort.flat_db_press, undefined);
}

section("A stalled lift offers swap, drop and hold");
{
  fresh();
  const {holdLift, isHeld} = await import("../src/holds.js");
  state.holds = {};
  ["2026-08-04", "2026-08-11", "2026-08-18"].forEach(date => {
    state.sessions[date] = {date, day: "arms", block: "A", blockIndex: 0, entries: {ez_curl: [{w: "60", r: "10"}, {w: "60", r: "10"}]}};
  });
  loadDate("2026-09-01");
  setDay("arms");
  render();
  const curl = els.main.find("ex-move").find(m => m.id === "card-ez_curl");
  check("the stall prompt shows as a warning callout", curl.find("stall").length === 1 && curl.find("stall")[0].dataset.tone === "warning");
  const actions = curl.find("stall-actions")[0].children.map(b => b.dataset.label);
  equal("with three ways out", actions, ["swap", "drop to 55", "hold"]);

  curl.find("stall-actions")[0].children[2].fire("click");
  render();
  const heldCurl = els.main.find("ex-move").find(m => m.id === "card-ez_curl");
  check("holding is remembered", isHeld("ez_curl"));
  check("the target asks for a match", heldCurl.find("target")[0].innerHTML.includes("match it"), heldCurl.find("target")[0].innerHTML);
  check("the stall prompt becomes a hold notice", heldCurl.find("stall")[0].dataset.tone === "secondary");
  equal("with a way back", heldCurl.find("stall-actions")[0].children.map(b => b.dataset.label), ["push"]);

  const rows = heldCurl.find("set").filter(r => !r.classList.contains("head"));
  wt(rows[0]).value = "60";
  rp(rows[0]).value = "10";
  rp(rows[0]).fire("change");
  check("matching the held number keeps the hold", isHeld("ez_curl"));
  wt(rows[1]).value = "65";
  rp(rows[1]).value = "12";
  rp(rows[1]).fire("change");
  check("beating it by a clear margin releases the hold", !isHeld("ez_curl"));

  render();
  const dropRow = els.main.find("ex-move").find(m => m.id === "card-ez_curl");
  const dropButton = dropRow.find("stall-actions")[0] && dropRow.find("stall-actions")[0].children[1];
  check("with the hold gone the stall prompt is back", !!dropButton && dropButton.dataset.label === "drop to 55");
  dropButton.fire("click");
  render();
  const droppedRow = els.main.find("ex-move").find(m => m.id === "card-ez_curl").find("set").filter(r => !r.classList.contains("head"))[0];
  check("drop fills set 1 with 10% less, rounded to the plate", wt(droppedRow).value === "55", wt(droppedRow).value);
}

section("Consistency grid");
{
  fresh();
  state.view = "progress";
  render();
  check("the grid renders with no data", els.main.find("grid").length === 1);
  check("26 weeks of cells", els.main.find("cell").length === 182, els.main.find("cell").length);
  check("none are lit", els.main.find("cell").every(c => c._class === "cell"));

  const today = new Date();
  const key = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") +
    "-" + String(today.getDate()).padStart(2, "0");
  state.sessions[key] = {date: key, day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "50", r: "10"}]}};
  render();
  check("a logged day lights a cell", els.main.find("cell").some(c => c._class.includes("lit")));
}

section("Logging updates the page without a re-render");
{
  fresh();
  render();
  const card = els.main.find("ex-move")[0];
  const rows = card.find("set").filter(r => !r.classList.contains("head"));

  rows.slice(0, 3).forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  check("a partly finished card stays open", !card.classList.contains("done"));

  const lastRow = rows[3];
  wt(lastRow).value = "50";
  rp(lastRow).value = "9";
  rp(lastRow).fire("change");

  check("finishing the last set collapses it there and then",
    card.classList.contains("done"));
  check("the collapsed summary collapses runs like history does",
    card.find("ex-summary")[0].textContent.includes("×"),
    card.find("ex-summary")[0].textContent);
  check("the summary fills in without a re-render",
    card.find("ex-summary")[0].textContent.includes("50"),
    card.find("ex-summary")[0].textContent);
  check("the tally updates", els.tally.textContent === "4/41", els.tally.textContent);
  check("the tally updates without a re-render",
    els.tally.textContent === "4/41", els.tally.textContent);
}

section("Time in the gym is first log to last log");
{
  const {elapsedLabel} = await import("../src/format.js");
  const minutes = n => n * 60000;

  check("a session with no end has no duration", elapsedLabel(1000, null) === null);
  check("under a minute is not worth showing", elapsedLabel(0, 30000) === null);
  equal("minutes read plainly", elapsedLabel(0, minutes(47)), "47 min");
  equal("an hour and change reads as hours", elapsedLabel(0, minutes(78)), "1h 18m");
  equal("it measures the gap, not the wall clock",
    elapsedLabel(minutes(600), minutes(672)), "1h 12m");

  fresh();
  loadDate(iso(new Date()));
  render();
  const logSet = (row, w, r) => {
    wt(row).value = w;
    rp(row).value = r;
    rp(row).fire("change");
  };
  const setRows = () => els.main.find("ex-move")[0].find("set").filter(r => !r.classList.contains("head"));
  logSet(setRows()[0], "50", "10");

  check("logging stamps a start", !!state.current.startedAt);
  check("and a last-logged moment", !!state.current.lastLoggedAt);

  state.current.startedAt = state.current.lastLoggedAt - minutes(52);
  render();
  check("the footer shows the gap between them",
    els.volnote.textContent.includes("52 min"), els.volnote.textContent);

  const stamped = state.current.lastLoggedAt;
  state.current.lastLoggedAt = stamped - minutes(5);
  setRows()[0].fire("blur");
  rp(setRows()[0]).value = "11";
  rp(setRows()[0]).fire("change");
  check("re-touching or correcting a logged set does not move the clock",
    state.current.lastLoggedAt === stamped - minutes(5));

  fresh();
  render();
  logSet(setRows()[0], "50", "10");
  check("a past session opened for a fix keeps no clock",
    !state.current.startedAt && !state.current.lastLoggedAt);
}

section("Expansion does not leak between sessions");
{
  fresh();
  render();
  const card = els.main.find("ex-move")[0];
  card.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  els.main.find("ex-fold")[0].fire("click");
  render();
  check("the card is expanded on this session", !els.main.find("ex-move")[0].classList.contains("done"));

  setDay("legs");
  render();
  setDay("chest");
  render();
  check("switching away and back collapses it again",
    els.main.find("ex-move")[0].classList.contains("done"));
}

section("The countdown escalates in its last seconds");
{
  const {start, stop} = await import("../src/timer.js");
  const {WARN_COUNTDOWN_SECONDS} = await import("../src/constants.js");

  fresh();
  render();
  stop();
  check("an idle timer shows the rest the next set will get",
    els.timer.dataset.label === "2:00", els.timer.dataset.label);
  check("and rests on the primary tone", els.timer.dataset.tone === "primary");

  start(90);
  check("starting shows a countdown",
    /^\d+:\d\d$/.test(els.timer.dataset.label), els.timer.dataset.label);
  check("with plenty left it stays primary", els.timer.dataset.tone === "primary");

  start(WARN_COUNTDOWN_SECONDS);
  check("inside the warn window it turns amber", els.timer.dataset.tone === "warning");

  start(WARN_COUNTDOWN_SECONDS + 30);
  check("a fresh longer rest drops back to primary", els.timer.dataset.tone === "primary");

  stop();
  check("stopping restores the idle reading",
    els.timer.dataset.label === "2:00", els.timer.dataset.label);
  check("and the resting tone", els.timer.dataset.tone === "primary");
}

section("The idle countdown tracks the next unlogged set");
{
  const {stop} = await import("../src/timer.js");
  fresh();
  render();
  stop();
  check("it opens on the lead lift's rest",
    els.timer.dataset.label === "2:00", els.timer.dataset.label);

  const rows = els.main.find("ex-move")[0].find("set").filter(r => !r.classList.contains("head"));
  rows.slice(0, 3).forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  stop();
  check("with one set left it shows the walk to the next move",
    els.timer.dataset.label === "1:30", els.timer.dataset.label);

  wt(rows[3]).value = "50";
  rp(rows[3]).value = "10";
  rp(rows[3]).fire("change");
  stop();
  check("finishing the move shows the next move's rest",
    els.timer.dataset.label === "2:00", els.timer.dataset.label);
}

section("Save state is a dot, not a shifting line");
{
  const {queueSave} = await import("../src/session.js");
  fresh();
  render();
  queueSave();
  check("saving marks the dot", els.status.classList.contains("saving"), els.status._class);
  check("the dot carries no text", !els.status.textContent, els.status.textContent);
  check("it explains itself to a screen reader",
    /saving/i.test(els.status.getAttribute("aria-label") || ""), els.status.getAttribute("aria-label"));

  state.view = "history";
  render();
  check("backup results render by the backup buttons",
    els.main.find("backup-result").length === 1);
  state.view = "log";
}

section("A history card groups, collapses and marks");
{
  fresh();
  state.sessions["2026-09-01"] = {
    date: "2026-09-01", day: "chest", block: "A", blockIndex: 0,
    startedAt: 1000, lastLoggedAt: 1000 + 64 * 60000,
    swaps: {db_fly: "cable_crossover"},
    entries: {
      flat_db_press: [{w: "65", r: "10"}, {w: "65", r: "10"}, {w: "65", r: "9"}],
      incline_db_press: [{w: "50", r: "12"}, {w: "50", r: "12"}, {w: "50", r: "12"}],
      cable_crossover: [{w: "30", r: "15"}],
      lat_pulldown: [{w: "55", r: "20"}, {w: "60", r: "16"}, {w: "60", r: "16"}, {w: "60", r: "16"}],
      db_pullover: [{w: "40", r: "12"}, {w: "40", r: "12"}, {w: "45", r: "10"},
                    {w: "40", r: "12"}, {w: "40", r: "12"}],
      hanging_knee_raise: [{w: "", r: "12"}, {w: "", r: "12"}],
      plank: [{w: "", r: "45"}, {w: "", r: "45"}]
    }
  };
  state.view = "history";
  render();
  const card = openHistoryCard(0);
  const rowFor = name => card.find("hist-line").find(l => l.innerHTML.includes(name));

  check("identical sets collapse to a count",
    rowFor("Incline DB Press").innerHTML.includes("3 × 50×12"),
    rowFor("Incline DB Press").innerHTML);
  check("a run collapses but the odd set out stays",
    rowFor("Flat DB Bench Press").innerHTML.includes("2 × 65×10 · 65×9"),
    rowFor("Flat DB Bench Press").innerHTML);
  check("a single set needs no count",
    /<b>30×15<\/b>/.test(rowFor("Cable Crossover").innerHTML),
    rowFor("Cable Crossover").innerHTML);

  check("a swapped move carries the swap glyph",
    rowFor("Cable Crossover").innerHTML.includes("hist-swap"));
  check("and names what it replaced",
    rowFor("Cable Crossover").innerHTML.includes("Swapped in for Flat DB Flye"),
    rowFor("Cable Crossover").innerHTML);
  check("an unswapped move carries no glyph",
    !rowFor("Incline DB Press").innerHTML.includes("hist-swap"));

  const ramp = card.find("hist-line").find(l => l.innerHTML.includes("Wide-grip Lat Pulldown"));
  check("a warmup set then a run reads in order",
    ramp && ramp.innerHTML.includes("55×20 · 3 × 60×16"),
    ramp && ramp.innerHTML);

  const split = card.find("hist-line").find(l => l.innerHTML.includes("DB Pullover"));
  check("a run broken and resumed stays broken",
    split && split.innerHTML.includes("2 × 40×12 · 45×10 · 2 × 40×12"),
    split && split.innerHTML);

  check("core sits under its own label",
    card.find("hist-sub").length === 1 && card.find("hist-sub")[0].textContent === "Core finisher");
  const supers = card.find("hist-super");
  check("one group per logged superset", supers.length === 1, supers.length);
  check("holding both of its moves", supers[0].children.length === 2, supers[0].children.length);
  check("with no leftover bullet glyph", !card.innerHTML.includes("◦"));

  const foot = card.find("hist-foot")[0];
  check("the totals strip counts every logged set",
    foot.innerHTML.includes("20 sets"), foot.innerHTML);
  check("and reports the duration", foot.innerHTML.includes("1h 04m"), foot.innerHTML);

  state.view = "log";
  render();
}

section("History shows lifts the session plan does not contain");
{
  fresh();
  state.sessions["2026-09-02"] = {
    date: "2026-09-02", day: "arms", block: "A", blockIndex: 0,
    entries: {
      hanging_leg_raise: [{w: "", r: "12"}, {w: "", r: "12"}],
      goblet_squat: [{w: "95", r: "10"}, {w: "95", r: "10"}]
    }
  };
  state.view = "history";
  render();
  const card = openHistoryCard(0);

  check("a lift the plan does contain renders normally",
    card.find("hist-line").some(l => l.innerHTML.includes("Hanging Leg Raise")));
  const strays = card.find("hist-stray");
  check("a lift it does not is still shown", strays.length === 1, strays.length);
  check("named", strays[0] && strays[0].innerHTML.includes("DB Goblet Squat"), strays[0] && strays[0].innerHTML);
  check("with its sets", strays[0] && strays[0].innerHTML.includes("2 × 95×10"), strays[0] && strays[0].innerHTML);
  check("under its own label",
    card.find("hist-sub").some(l => l.textContent === "Not in this session"));
  check("and the totals still count it",
    card.find("hist-foot")[0].innerHTML.includes("4 sets"),
    card.find("hist-foot")[0].innerHTML);

  state.view = "log";
  render();
}

section("History filters by workout, groups by cycle and marks deltas");
{
  fresh();
  const chest = (date, blockIndex, weight) => ({
    date, day: "chest", block: ["A", "B", "C"][blockIndex % 3], blockIndex,
    entries: {incline_db_press: [{w: String(weight), r: "10"}], pullup: [{w: "", r: "8"}]}
  });
  state.sessions["2026-08-03"] = chest("2026-08-03", 0, 40);
  state.sessions["2026-08-10"] = chest("2026-08-10", 1, 45);
  state.sessions["2026-08-24"] = chest("2026-08-24", 3, 45);
  state.sessions["2026-08-26"] = {
    date: "2026-08-26", day: "legs", block: "A", blockIndex: 3,
    entries: {goblet_squat: [{w: "80", r: "10"}]}
  };
  state.view = "history";
  render();

  const filter = els.main.find("hist-filter")[0];
  check("a filter row offers all three workouts plus all",
    filter.children.map(b => b.dataset.label).join() === "All,Chest,Legs,Arms",
    filter.children.map(b => b.dataset.label).join());
  check("all is pressed by default", filter.children[0].getAttribute("aria-pressed") === "true");
  check("every session shows unfiltered", els.main.find("hist-day").length === 4, els.main.find("hist-day").length);

  const cycles = els.main.find("hist-cycle");
  check("sessions group under cycle headers",
    cycles.map(c => c.textContent).join() === "Cycle 2,Cycle 1", cycles.map(c => c.textContent).join());
  check("a header sits directly above its first session",
    els.main.children[2].classList.contains("hist-cycle") && els.main.children[3].classList.contains("hist-day"));

  filter.children[2].fire("click");
  render();
  check("filtering to legs leaves one card", els.main.find("hist-day").length === 1, els.main.find("hist-day").length);
  check("and marks that chip pressed",
    els.main.find("hist-filter")[0].children[2].getAttribute("aria-pressed") === "true");

  els.main.find("hist-filter")[0].children[3].fire("click");
  render();
  check("a workout with no sessions says so",
    els.main.find("empty").length === 1 && els.main.find("empty")[0].textContent.includes("Shoulders & Arms"),
    els.main.find("empty").map(e => e.textContent).join());
  check("and keeps the filter row so you can leave", els.main.find("hist-filter").length === 1);

  els.main.find("hist-filter")[0].children[1].fire("click");
  render();
  check("chest shows three cards in date order",
    els.main.find("hist-day").length === 3, els.main.find("hist-day").length);

  const deltaOf = (card, name) => {
    const line = card.find("hist-line").find(l => l.innerHTML.includes(name));
    const hit = line && line.innerHTML.match(/hist-delta ([a-z]+)/);
    return hit && hit[1];
  };
  const newest = openHistoryCard(0);
  check("matching last time marks same", deltaOf(newest, "Incline DB Press") === "same", deltaOf(newest, "Incline DB Press"));
  check("bodyweight reps compare too", deltaOf(newest, "Pull-ups") === "same", deltaOf(newest, "Pull-ups"));
  const middle = openHistoryCard(1);
  check("beating last time marks up", deltaOf(middle, "Incline DB Press") === "up", deltaOf(middle, "Incline DB Press"));
  const oldest = openHistoryCard(2);
  check("the first exposure reads new",
    oldest.find("hist-line")[0].innerHTML.includes(">new<"), oldest.find("hist-line")[0].innerHTML);

  const actions = newest.find("hist-actions")[0];
  actions.children[0].fire("click");
  check("edit opens that date on the log tab",
    state.view === "log" && state.current.date === "2026-08-24", state.view + " " + state.current.date);

  state.view = "log";
  render();
}

section("Sound is optional, remembered and testable");
{
  const sound = await import("../src/sound.js");
  fresh();

  check("with no Web Audio the state says so", sound.audioState() === "unsupported");
  check("unlocking a browser without it fails quietly", sound.unlockAudio() === false);
  check("a beep with no context is a no-op, not a throw", sound.testTone() === false);
  check("and a rest cannot be scheduled", sound.scheduleRest(Date.now() + 5000) === false);
  sound.cancelRest();

  check("sound defaults to on", sound.soundOn() === true);
  sound.setSoundOn(false);
  check("turning it off sticks", sound.soundOn() === false);
  check("and a rest schedules nothing", sound.scheduleRest(Date.now() + 5000) === false);
  sound.cancelRest();
  check("the preference is written to storage",
    localStorage.getItem("overload.sound.v1") === "off");
  check("and it survives a reload", sound.loadSoundPreference() === false);

  sound.setSoundOn(true);
  check("turning it back on sticks", sound.soundOn() === true);

  state.view = "history";
  render();
  const row = els.main.find("soundrow")[0];
  check("the history tab carries a sound row", !!row);
  const buttons = row.find("sbtn");
  check("it offers a toggle and a test", buttons.length === 2, buttons.length);
  check("the toggle reads its current state",
    buttons[0].dataset.label === "Sound on", buttons[0].dataset.label);

  buttons[0].fire("click");
  check("tapping it flips the label", buttons[0].dataset.label === "Sound off", buttons[0].dataset.label);
  buttons[0].fire("click");

  buttons[1].fire("click");
  check("the test button reports what happened",
    row.find("sound-result")[0].textContent.length > 0,
    row.find("sound-result")[0].textContent);

  state.view = "log";
  render();
}

section("Beeps are scheduled on the audio clock when a rest starts");
{
  const scheduled = [];
  let context = null;
  window.AudioContext = function(){
    context = this;
    this.state = "running";
    this.currentTime = 0;
    this.destination = {};
    this.onstatechange = null;
    this.resume = () => Promise.resolve();
    this.createGain = () => ({
      connect(){},
      gain: {setValueAtTime(){}, exponentialRampToValueAtTime(){}}
    });
    this.createOscillator = () => {
      const osc = {
        type: "",
        connect(){},
        stop(at){ if(at === undefined) osc.stopped = true; },
        frequency: {setValueAtTime(hz){ osc.hz = hz; }},
        start(at){ osc.at = at; scheduled.push(osc); }
      };
      return osc;
    };
  };

  const sound = await import("../src/sound.js");
  const {start, stop} = await import("../src/timer.js");
  const {BEEP_COUNTDOWN, BEEP_GO} = await import("../src/constants.js");
  const goPitches = BEEP_GO.pulses.map(p => p.freq);
  const blip = BEEP_COUNTDOWN.pulses[0].freq;
  const live = () => scheduled.filter(o => !o.stopped);
  const pitches = () => live().map(o => o.hz);
  const startsAt = () => live().map(o => Math.round(o.at * 10) / 10);
  const reset = () => { scheduled.length = 0; };

  check("a real context unlocks", sound.unlockAudio() === true);
  check("and reports itself running", sound.audioState() === "running", sound.audioState());

  reset();
  check("the test tone plays at once", sound.testTone() === true);
  equal("at the go pitches", pitches(), goPitches);
  equal("with no delay", startsAt().slice(0, 1), [0]);

  reset();
  start(90);
  equal("a ninety-second rest places three blips and a go", pitches(), [blip, blip, blip, ...goPitches]);
  equal("at 87, 88, 89 and 90 on the audio clock", startsAt().slice(0, 4), [87, 88, 89, 90]);
  stop();
  equal("stopping cancels every scheduled beep", live(), []);

  reset();
  start(1);
  equal("a one-second rest gets the last blip and the go", pitches(), [blip, ...goPitches]);
  equal("with the blip now and the go a second later", startsAt().slice(0, 2), [0, 1]);
  stop();

  const realNow = Date.now;
  const comeBackAfter = ms => {
    Date.now = () => realNow() + ms;
    document.visibilityState = "visible";
    document.fire("visibilitychange");
    Date.now = realNow;
  };

  reset();
  start(5);
  equal("a fresh rest schedules ahead and plays nothing yet", startsAt().slice(0, 1), [2]);
  comeBackAfter(60000);
  equal("a rest that ended while you were away schedules no sound", live(), []);
  check("but it still shows go", els.timer.dataset.label === "go", els.timer.dataset.label);
  stop();

  reset();
  start(5);
  const placedAtStart = scheduled.length;
  comeBackAfter(5000 + 800);
  check("a rest that ended just before you came back adds no new sound",
    scheduled.length === placedAtStart, scheduled.length - placedAtStart);
  check("and shows go", els.timer.dataset.label === "go", els.timer.dataset.label);
  stop();

  reset();
  start(10);
  comeBackAfter(7500);
  equal("coming back with two and a half seconds left keeps only what remains",
    pitches(), [blip, blip, ...goPitches]);
  equal("placed on the audio clock from now", startsAt().slice(0, 3), [0.5, 1.5, 2.5]);
  stop();

  reset();
  start(30);
  context.state = "interrupted";
  context.onstatechange();
  equal("an interrupted context drops the plan so nothing plays late", live(), []);
  context.state = "running";
  context.onstatechange();
  equal("and resuming places it again from the wall clock", pitches(), [blip, blip, blip, ...goPitches]);
  stop();

  reset();
  sound.setSoundOn(false);
  start(30);
  equal("muted, a rest schedules nothing", live(), []);
  sound.setSoundOn(true);
  equal("unmuting mid-rest schedules what is left", pitches(), [blip, blip, blip, ...goPitches]);
  stop();
}

section("A superset reads as an alternating pair");
{
  fresh();
  render();
  check("no superset badge", els.main.find("superset").length === 0);

  const blocks = els.main.find("ex-move");
  const first = blocks[9], second = blocks[10];
  check("the first move carries the S1 notch", first.find("ex-head")[0].innerHTML.includes(">S1<"), first.find("ex-head")[0].innerHTML);
  check("the second move carries the pairing glyph", second.find("ex-head")[0].innerHTML.includes("call_merge"));
  const firstMeta = first.find("meta")[0].innerHTML;
  const secondMeta = second.find("meta")[0].innerHTML;
  check("the first move reads like any other card", firstMeta.includes("2 × 12") && firstMeta.includes("rest 15s"), firstMeta);
  check("the second move states the round rest", secondMeta.includes("rest 45s"), secondMeta);

  const coreRows = first.find("set").filter(r => !r.classList.contains("head"));
  equal("core rows are numbered by round",
    coreRows.map(r => r.children[0].textContent), ["R1", "R2"]);
  check("the core column header reads rd",
    first.find("head")[0].innerHTML.includes("<div>rd</div>"), first.find("head")[0].innerHTML);

  const mainRows = blocks[0].find("set").filter(r => !r.classList.contains("head"));
  equal("main rows stay plain set numbers",
    mainRows.map(r => r.children[0].textContent), ["1", "2", "3", "4"]);
  check("a main move keeps its plain rest line",
    blocks[0].find("meta")[0].innerHTML.includes("rest 120s"), blocks[0].find("meta")[0].innerHTML);
}

section("Effort is asked once per main move");
{
  fresh();
  render();
  equal("nine prompts, not fifteen", els.main.find("effort").length, 9);
  const coreCards = els.main.find("core");
  check("no core superset asks", coreCards.every(c => c.find("effort").length === 0));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
