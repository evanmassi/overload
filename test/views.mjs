import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

const els = installDom();
installStorage();

const {state} = await import("../src/store/state.js");
const {render} = await import("../src/views/app.js");
const {mountSheet} = await import("../src/views/sheets/sheet.js");
const {openSwapSheet} = await import("../src/views/sheets/swapSheet.js");
const {openHowTo} = await import("../src/views/sheets/howtoSheet.js");
const {openTimerSheet} = await import("../src/views/sheets/timerSheet.js");
const {mountTimer} = await import("../src/views/timer.js");
const {mountSaveStatus} = await import("../src/views/saveStatus.js");
const {findExercise} = await import("../src/rules/exercises.js");
const {loadDate, setDay, chooseBlock, followToday} = await import("../src/store/session.js");
const {clockFace, iso} = await import("../src/rules/format.js");

mountTimer(els.timer, {onHold: openTimerSheet});
mountSaveStatus(els.status);
mountSheet(els.sheet, els.sheettitle, els.sheetbody, els.sheetclose, els.sheetback);

const cell = (row, i) => row.children[i].find("field-input")[0] || row.children[i];
const wt = row => cell(row, 1);
const rp = row => cell(row, 3);

const sheetClosed = () => els.sheet.hidden || "closing" in els.sheet.dataset;

function fresh(){
  localStorage.clear();
  els.sheet.hidden = true;
  delete els.sheet.dataset.closing;
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
  check("footer waits for the first set", els.sessiontime.textContent === "—" && els.timenote.textContent === "starts with your first set", els.timenote.textContent);
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
  check("the first set starts the session clock", els.sessiontime.textContent === "under 1 min", els.sessiontime.textContent);
  check("the rest timer started", /^\d+:\d\d$/.test(els.timer.dataset.label), els.timer.dataset.label);

  const panel = els.main.find("ex")[0];
  check("a card with sets still open is not dimmed", panel.dataset.dim === "off", panel.dataset.dim);
  panel.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  check("finishing the sets leaves it open for a difficulty", panel.dataset.dim === "off", panel.dataset.dim);
  panel.find("effort")[0].find("btn")[1].fire("click");
  render();
  check("picking one then folds and dims it", els.main.find("ex")[0].dataset.dim === "on", els.main.find("ex")[0].dataset.dim);
}

section("A backup result is shown from state and survives a redraw");
{
  fresh();
  state.backupResult = "merged 3";
  state.view = "history";
  render();
  render();
  check("it reads under the backup buttons",
    els.main.find("backup-result")[0].textContent === "merged 3", els.main.find("backup-result")[0].textContent);
  state.backupResult = "";
  state.view = "log";
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
  chooseBlock("A");
  render();

  check("a target band appears", els.main.find("target").length >= 1);
  const band = els.main.find("target")[0];
  check("it asks for more weight after topping the range",
    band.innerHTML.includes("<b>50<small class=\"unit-tag\">lbs</small></b>") && band.innerHTML.includes("<b>8<small class=\"unit-tag\">reps</small></b>") && band.innerHTML.includes("+5 lb"), band.innerHTML);
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
  check("close sends it away", sheetClosed());
  const {SHEET_CLOSE_MS} = await import("../src/data/constants.js");
  await new Promise(resolve => setTimeout(resolve, SHEET_CLOSE_MS + 20));
  check("and hides it once it has slid out", els.sheet.hidden === true && !("closing" in els.sheet.dataset));

  openSwapSheet(findExercise("leg_curl"));
  check("the swap sheet opens", els.sheet.hidden === false);
  equal("its title puts instead of above the exercise",
    els.sheettitle.children.map(c => c.textContent), ["Instead of", findExercise("leg_curl").n]);
  check("it offers same-pattern alternatives", els.sheetbody.find("sheet-item").length > 1);
  check("it offers a custom entry box", els.sheetbody.find("sheet-custom").length === 1);
  els.sheetback.fire("click");
  check("tapping the backdrop closes it", sheetClosed());

  openSwapSheet(findExercise("flat_db_press"));
  const offered = els.sheetbody.find("sheet-item").map(item => item.innerHTML);
  check("it never offers a move the session already has", !offered.some(html => html.includes(">Pull-ups<")));
  check("but still lists the slot's own move", offered.some(html => html.includes(">Flat DB Bench Press<")));
  const own = els.sheetbody.find("sheet-item").find(item => item.innerHTML.includes(">Flat DB Bench Press<"));
  check("the move in the workout is tagged in use", own.classList.contains("in-use") && own.innerHTML.includes("in use"), own.innerHTML);
  const before = els.sheetbody.find("sheet-item").length;
  els.sheetbody.find("sheet-browse")[0].fire("click");
  check("other movements stay folded until browsed", els.sheetbody.find("sheet-item").length > before + 20,
    els.sheetbody.find("sheet-item").length);
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
    els.main.find("hist-actions")[0].children.map(b => b.dataset.label).join() === "edit,relabel,delete",
    els.main.find("hist-actions")[0].children.map(b => b.dataset.label).join());
  openHistoryCard(0);
  check("tapping again closes it", els.main.find("hist-body").length === 0);
  check("backup controls render", els.main.find("backup").length === 1);

  const feet = els.main.find("hist-foot");
  check("every card gets a totals strip", feet.length === 2, feet.length);
  equal("the strip reads sets and time, no pound total", feet.map(f => f.textContent), ["1 set · 1h 04m", "1 set"]);
  check("totals are no longer exercise rows",
    !els.main.find("hist-line").some(l => /volume|first set to last/.test(l.innerHTML)));

  state.view = "progress";
  render();
  check("a progress card renders", els.main.find("prog").length === 1);
  check("the number is labelled an estimate, not a weight",
    els.main.find("prog")[0].innerHTML.includes("est. 1RM"),
    els.main.find("prog")[0].innerHTML);
  check("two data points draw a sparkline", els.main.find("prog-chart").length === 1 && els.main.find("prog-dot").length === 2);
  check("cards sit under their workout", els.main.find("section-label").some(l => l.textContent === "Chest & Back"));
  check("the headline is the latest top set", els.main.find("prog")[0].innerHTML.includes("45<small class=\"unit-tag\">lbs</small> × 10"),
    els.main.find("prog")[0].innerHTML);
  check("with the change since the first session", els.main.find("prog")[0].innerHTML.includes("+5 lb"));
}

section("Collapsing and the set bar");
{
  fresh();
  render();
  check("the set bar starts empty", els.tally.textContent === "0/41", els.tally.textContent);
  check("and draws one tick per prescribed set",
    els.setbar.children.length === 41, els.setbar.children.length);
  check("with none lit", els.setbar.children.every(t => t.dataset.state !== "on"));

  els.main.find("ex-item")[0].find("effort")[0].find("btn")[1].fire("click");
  render();
  const card = els.main.find("ex-item")[0];
  check("a difficulty picked early keeps the card open", !card.classList.contains("done"));
  const rows = card.find("set").filter(r => !r.classList.contains("head"));
  rows.forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  render();

  check("then finishing every set collapses the card", els.main.find("ex-item")[0].classList.contains("done"));
  check("its summary is populated", els.main.find("ex-summary")[0].textContent.includes("50"));
  check("the tally counts the logged sets", els.tally.textContent === "4/41", els.tally.textContent);
  check("and four ticks light up",
    els.setbar.children.filter(t => t.dataset.state === "on").length === 4);
  check("the sets still to come on the move in hand read as pending",
    els.setbar.children.filter(t => t.dataset.state === "now").length > 0);

  els.main.find("ex-fold")[0].fire("click");
  render();
  check("tapping the chevron expands it again", !els.main.find("ex-item")[0].classList.contains("done"));

  const blocks = els.main.find("ex-item");
  check("a block per main move plus two per superset", blocks.length === 15, blocks.length);

  const coreMove = blocks[9];
  coreMove.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    rp(row).value = "12";
    rp(row).fire("change");
  });
  render();
  const after = els.main.find("ex-item");
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
  chooseBlock("A");
  render();

  const rows = els.main.find("ex-item")[0].find("set").filter(r => !r.classList.contains("head"));
  const first = rows[0].children[4];
  const second = rows[1].children[4];
  check("a set with history offers repeat", first.disabled === false);
  check("a set with none does not", second.disabled === true);

  const cue = els.main.find("ex-item")[0].find("prior")[0];
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
    (state.sessions[state.current.key] || {}).effort, {flat_db_press: "hard"});

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
  const {holdExercise, isHeld} = await import("../src/store/holds.js");
  state.holds = {};
  ["2026-08-04", "2026-08-11", "2026-08-18"].forEach(date => {
    state.sessions[date] = {date, day: "arms", block: "A", blockIndex: 0, entries: {ez_curl: [{w: "60", r: "10"}, {w: "60", r: "10"}]}};
  });
  loadDate("2026-09-01");
  setDay("arms");
  chooseBlock("A");
  render();
  const curl = els.main.find("ex-item").find(m => m.id === "card-ez_curl");
  check("the stall prompt shows as a warning callout", curl.find("stall").length === 1 && curl.find("stall")[0].dataset.tone === "warning");
  const actions = curl.find("stall-actions")[0].children.map(b => b.dataset.label);
  equal("with three ways out", actions, ["swap", "drop to 55", "hold"]);

  curl.find("stall-actions")[0].children[2].fire("click");
  render();
  const heldCurl = els.main.find("ex-item").find(m => m.id === "card-ez_curl");
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
  const dropRow = els.main.find("ex-item").find(m => m.id === "card-ez_curl");
  const dropButton = dropRow.find("stall-actions")[0] && dropRow.find("stall-actions")[0].children[1];
  check("with the hold gone the stall prompt is back", !!dropButton && dropButton.dataset.label === "drop to 55");
  dropButton.fire("click");
  render();
  const droppedRow = els.main.find("ex-item").find(m => m.id === "card-ez_curl").find("set").filter(r => !r.classList.contains("head"))[0];
  check("drop fills set 1 with 10% less, rounded to the plate", wt(droppedRow).value === "55", wt(droppedRow).value);
}

section("Consistency grid");
{
  fresh();
  state.view = "progress";
  render();
  check("the grid renders with no data", els.main.find("grid").length === 1);
  equal("twelve weeks of days", els.main.find("cell").length, 84);
  check("none are lit", els.main.find("cell").every(c => !/lift|off/.test(c._class)));
  equal("rows are weekdays, Monday first", els.main.find("grid-label").slice(1, 4).map(l => l.textContent), ["M", "", "W"]);

  const today = iso(new Date());
  state.sessions[today + "T08:00:00"] = {date: today, day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: [{w: "50", r: "10"}]}};
  state.sessions[today + "T18:00:00"] = {date: today, day: "mobility", block: "A", blockIndex: 0, entries: {pigeon: [{w: "", r: "45"}]}};
  render();
  const lit = els.main.find("cell").filter(c => /lift|off/.test(c._class));
  equal("today lights as lifting, twice over", lit.map(c => c._class), ["cell lift double"]);
  check("the note counts this week by kind", els.main.find("grid-note")[0].textContent.startsWith("This week: 1 lifting · 1 cross-training"),
    els.main.find("grid-note")[0].textContent);

  lit[0].fire("click");
  equal("tapping a day opens it in history", [state.view, [...state.historyOpen].length], ["history", 2]);
  state.view = "log";
}

section("Logging updates the page without a re-render");
{
  fresh();
  state.current.effort.flat_db_press = "medium";
  render();
  const card = els.main.find("ex-item")[0];
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
  const {elapsedLabel} = await import("../src/rules/format.js");
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
  const setRows = () => els.main.find("ex-item")[0].find("set").filter(r => !r.classList.contains("head"));
  logSet(setRows()[0], "50", "10");

  check("logging stamps a start", !!state.current.startedAt);
  check("and a last-logged moment", !!state.current.lastLoggedAt);

  state.current.startedAt = state.current.lastLoggedAt - minutes(52);
  render();
  check("the footer shows the gap between them",
    els.sessiontime.textContent === "52 min", els.sessiontime.textContent);

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
  state.current.effort.flat_db_press = "medium";
  render();
  const card = els.main.find("ex-item")[0];
  card.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    wt(row).value = "50";
    rp(row).value = "10";
    rp(row).fire("change");
  });
  els.main.find("ex-fold")[0].fire("click");
  render();
  check("the card is expanded on this session", !els.main.find("ex-item")[0].classList.contains("done"));

  setDay("legs");
  render();
  setDay("chest");
  render();
  check("switching away and back collapses it again",
    els.main.find("ex-item")[0].classList.contains("done"));
}

section("The countdown escalates in its last seconds");
{
  const {start, stop} = await import("../src/views/timer.js");
  const {WARN_COUNTDOWN_SECONDS} = await import("../src/data/constants.js");

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
  const {stop} = await import("../src/views/timer.js");
  fresh();
  render();
  stop();
  check("it opens on the lead lift's rest",
    els.timer.dataset.label === "2:00", els.timer.dataset.label);

  const rows = els.main.find("ex-item")[0].find("set").filter(r => !r.classList.contains("head"));
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
  const {setNotes} = await import("../src/store/session.js");
  fresh();
  render();
  setNotes("");
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
    foot.textContent.startsWith("20 sets"), foot.textContent);
  check("and reports the duration", foot.textContent.endsWith(" · 1h 04m"), foot.textContent);

  state.view = "log";
  render();
}

section("Each button is its own workout for the day");
{
  const {loggedCount} = await import("../src/rules/progression.js");
  fresh();
  render();
  const firstRow = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  wt(firstRow).value = "50"; rp(firstRow).value = "10"; rp(firstRow).fire("change");
  const chestKey = state.current.key;
  check("the session key carries the date", chestKey.startsWith("2026-09-01"), chestKey);

  setDay("functional");
  render();
  check("switching type with sets logged opens a fresh workout", state.current.key !== chestKey && state.current.day === "functional");
  check("with nothing in it", loggedCount(state.current) === 0);
  check("and no stray bench press on the page", els.main.find("section-label").every(l => l.textContent !== "Not in this session"));
  const funcRow = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  wt(funcRow).value = "40"; rp(funcRow).value = "30"; rp(funcRow).fire("change");
  const funcKey = state.current.key;

  setDay("chest");
  render();
  check("tapping back returns to the same chest workout", state.current.key === chestKey);
  check("with its sets intact", state.current.entries.flat_db_press[0].r === "10");
  check("both workouts are saved for the date", !!state.sessions[chestKey] && !!state.sessions[funcKey]);
  check("both carry the same date", state.sessions[chestKey].date === "2026-09-01" && state.sessions[funcKey].date === "2026-09-01");

  setDay("legs");
  render();
  check("a type with no sets yet is a new empty workout", state.current.key !== chestKey && state.current.key !== funcKey);
  setDay("arms");
  check("an untouched empty workout just relabels", state.current.day === "arms" && Object.keys(state.sessions).length === 2);

  state.view = "history";
  render();
  check("history shows a card per workout", els.main.find("hist-day").length === 2, els.main.find("hist-day").length);
  const card = openHistoryCard(0);
  card.find("hist-actions")[0].children[1].fire("click");
  check("relabel opens a chooser", els.sheet.hidden === false && els.sheetbody.find("sheet-item").length === 6);
  const choice = els.sheetbody.find("sheet-item")[2];
  choice.fire("click");
  const relabelled = Object.keys(state.sessions).map(k => state.sessions[k].day);
  check("picking one refiles the session", relabelled.includes("arms"), relabelled.join());
  check("and lights the row before the sheet closes", choice.classList.contains("picked") && els.sheet.hidden === false);
  const {SHEET_PICK_MS} = await import("../src/data/constants.js");
  await new Promise(resolve => setTimeout(resolve, SHEET_PICK_MS + 20));
  check("then the sheet closes", sheetClosed());
}

section("Two sessions of the same lift on one day compare in order");
{
  fresh();
  state.sessions["2026-09-01T08:00:00"] = {date: "2026-09-01", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: [{w: "50", r: "10"}]}};
  state.sessions["2026-09-01T18:00:00"] = {date: "2026-09-01", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: [{w: "55", r: "10"}]}};
  const {priorSets} = await import("../src/rules/progression.js");
  const prior = priorSets(state.sessions, "flat_db_press", "2026-09-01T18:00:00");
  check("the evening compares against the morning", prior && prior.sets[0].w === "50" && prior.date === "2026-09-01");
  const earlier = priorSets(state.sessions, "flat_db_press", "2026-09-01T08:00:00");
  check("the morning has nothing before it", earlier === null);
  state.sessions["2026-08-30"] = {date: "2026-08-30", day: "chest", block: "A", blockIndex: 0, entries: {flat_db_press: [{w: "45", r: "10"}]}};
  check("an old date-keyed session still counts as prior", priorSets(state.sessions, "flat_db_press", "2026-09-01T08:00:00").sets[0].w === "45");
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
    card.find("hist-foot")[0].textContent === "4 sets",
    card.find("hist-foot")[0].textContent);

  state.view = "log";
  render();
}

section("History filters by workout and marks deltas");
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
  const sound = await import("../src/views/sound.js");
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
  const buttons = row.find("btn");
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

  const sound = await import("../src/views/sound.js");
  const {start, stop} = await import("../src/views/timer.js");
  const {BEEP_COUNTDOWN, BEEP_GO} = await import("../src/data/constants.js");
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

  const blocks = els.main.find("ex-item");
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

const realNow = Date.now;
const comeBackAfter = ms => {
  Date.now = () => realNow() + ms;
  document.visibilityState = "visible";
  document.fire("visibilitychange");
  Date.now = realNow;
};
const timedCards = () => els.main.find("ex-item").filter(card => card.find("ex-time").length);
const longPress = async () => {
  const {LONG_PRESS_MS} = await import("../src/data/constants.js");
  els.timer.fire("pointerdown");
  await new Promise(resolve => setTimeout(resolve, LONG_PRESS_MS + 60));
  els.timer.fire("pointerup");
  els.timer.fire("click");
};

section("A timed hold counts up, pauses, and waits for the second side");
{
  const {stop} = await import("../src/views/timer.js");
  fresh();
  render();
  stop();
  const cardFor = id => { render(); return els.main.find("ex-item").find(move => move.id === "card-" + id); };
  const rowsOf = id => cardFor(id).find("set").filter(r => !r.classList.contains("head"));
  const later = (ms, act) => { Date.now = () => realNow() + ms; act(); Date.now = realNow; };
  const tapHold = (id, ms = 0) => later(ms, () => cardFor(id).find("ex-time")[0].fire("click"));
  const tapClock = ms => later(ms, () => els.timer.fire("click"));

  check("only seconds-based cards get a timer button", timedCards().length > 0 &&
    timedCards().every(card => /\d+s<\/span>/.test(card.find("meta")[0].innerHTML)), timedCards().length);

  tapHold("plank");
  equal("the clock counts up from zero", els.timer.dataset.label, "0:00");
  equal("on the secondary tone", els.timer.dataset.tone, "secondary");
  equal("the card button turns into a stop", cardFor("plank").find("ex-time")[0].dataset.label, "stop");
  tapHold("plank", 50000);
  equal("stopping logs the time held, past the target", rp(rowsOf("plank")[0]).value, "50");
  equal("and starts the rest", els.timer.dataset.tone, "primary");
  stop();

  tapHold("plank");
  tapClock(10000);
  equal("tapping the clock pauses the hold", els.timer.dataset.paused, "on");
  tapClock(40000);
  equal("and again resumes it", els.timer.dataset.paused, "off");
  tapHold("plank", 70000);
  equal("the pause does not count", rp(rowsOf("plank")[1]).value, "40");
  stop();

  tapHold("side_plank");
  tapHold("side_plank", 35000);
  equal("the first side fills the box", rp(rowsOf("side_plank")[0]).value, "35");
  equal("and the clock waits for side two", els.timer.dataset.label, "side 2");
  tapHold("side_plank", 60000);
  tapHold("side_plank", 90000);
  equal("the second side keeps the lower time", rp(rowsOf("side_plank")[0]).value, "30");
  equal("in the same set", rp(rowsOf("side_plank")[1]).value, "");
  equal("then the rest starts", els.timer.dataset.tone, "primary");
  stop();
}

section("A conditioning round runs the window then the rest without a restart");
{
  const {stop} = await import("../src/views/timer.js");
  fresh();
  setDay("conditioning");
  render();
  stop();
  const card = timedCards()[0];
  const rows = card.find("set").filter(r => !r.classList.contains("head"));
  card.find("ex-time")[0].fire("click");
  check("go runs the 40s window", els.timer.dataset.label === "0:40", els.timer.dataset.label);
  comeBackAfter(41000);
  check("the window rolls into the 20s off", els.timer.dataset.label === "0:20", els.timer.dataset.label);
  check("and leaves the reps box for you", rp(rows[0]).value === "", rp(rows[0]).value);
  comeBackAfter(46000);
  check("five seconds into the rest", els.timer.dataset.label === "0:15", els.timer.dataset.label);
  rp(rows[0]).value = "14";
  rp(rows[0]).fire("change");
  check("typing the count does not restart the rest", els.timer.dataset.label === "0:15", els.timer.dataset.label);
  rp(rows[1]).value = "13";
  rp(rows[1]).fire("change");
  check("logging the next round by hand still starts its own rest", els.timer.dataset.label === "0:20", els.timer.dataset.label);
  stop();
}

section("Long-pressing the clock opens a picker with presets and a stopwatch");
{
  const {stop} = await import("../src/views/timer.js");
  const {LONG_PRESS_MS, TIMER_PRESETS} = await import("../src/data/constants.js");
  fresh();
  render();
  stop();
  const idle = els.timer.dataset.label;

  els.timer.fire("pointerdown");
  els.timer.fire("pointerup");
  await new Promise(resolve => setTimeout(resolve, LONG_PRESS_MS + 60));
  check("a short tap does not open the picker", els.sheet.hidden === true);

  await longPress();
  check("a long press opens it", els.sheet.hidden === false);
  check("titled Timer", els.sheettitle.textContent === "Timer", els.sheettitle.textContent);
  check("the click that follows the press is swallowed", els.timer.dataset.label === idle, els.timer.dataset.label);
  await new Promise(resolve => setTimeout(resolve, LONG_PRESS_MS + 60));
  els.timer.fire("click");
  comeBackAfter(1000);
  check("a later tap is not swallowed even if no click followed the press", els.timer.dataset.label === "1:59", els.timer.dataset.label);
  stop();
  els.sheet.hidden = false;

  const presets = els.sheetbody.find("sheet-presets")[0].children;
  equal("the presets read as clock faces", presets.map(b => b.dataset.label), TIMER_PRESETS.map(clockFace));
  presets[1].fire("click");
  check("tapping one starts that countdown", els.timer.dataset.label === clockFace(TIMER_PRESETS[1]), els.timer.dataset.label);
  check("and closes the sheet", sheetClosed());
  stop();

  const {parseClock} = await import("../src/rules/format.js");
  equal("a typed length reads seconds, m:ss or a unit",
    ["90", "1:30", "1.30", "2m", "45s", "2 min", "1.75", "abc", ""].map(parseClock), [90, 90, 90, 120, 45, 120, 0, 0, 0]);
  await longPress();
  const custom = els.sheetbody.find("sheet-custom")[0];
  const box = custom.find("field-input")[0] || custom.children[0];
  box.value = "nope";
  custom.find("btn")[0].fire("click");
  check("a bad entry keeps the sheet open", els.sheet.hidden === false);
  check("clears the box", box.value === "", box.value);
  check("and hints at the format", box.placeholder === "Try 90 or 1.30", box.placeholder);
  box.value = "7.30";
  box.fire("keydown", {key: "Enter"});
  check("a typed length starts on Enter", els.timer.dataset.label === "7:30", els.timer.dataset.label);
  check("and closes the sheet", sheetClosed());
  stop();

  await longPress();
  els.sheetbody.find("sheet-item")[0].fire("click");
  check("the stopwatch starts at zero", els.timer.dataset.label === "0:00", els.timer.dataset.label);
  check("on the secondary tone", els.timer.dataset.tone === "secondary", els.timer.dataset.tone);
  comeBackAfter(65000);
  check("and counts up", els.timer.dataset.label === "1:05", els.timer.dataset.label);
  Date.now = () => realNow() + 65000;
  els.timer.fire("click");
  Date.now = realNow;
  check("tapping the clock stops it on the elapsed time", els.timer.dataset.label === "1:05", els.timer.dataset.label);
  check("in the success tone", els.timer.dataset.tone === "success", els.timer.dataset.tone);
  stop();
}

section("Typed names and numbers reach the page as text, not markup");
{
  fresh();
  state.customNames = {custom_curl_3: "Curl <3"};
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    entries: {custom_curl_3: [{w: "<b>20", r: "10"}]}
  };

  state.view = "history";
  render();
  const line = openHistoryCard(0).find("hist-line").find(l => l.innerHTML.includes("Curl"));
  check("a custom name is escaped in history",
    line && line.innerHTML.includes("Curl &lt;3") && !line.innerHTML.includes("Curl <3"), line && line.innerHTML);
  check("so is a typed weight", line && line.innerHTML.includes("&lt;b&gt;20×10"), line && line.innerHTML);

  state.view = "progress";
  render();
  const card = els.main.find("prog")[0];
  check("and the progress card",
    card && card.innerHTML.includes("Curl &lt;3") && !card.innerHTML.includes("<b>20"), card && card.innerHTML);

  state.view = "log";
  loadDate("2026-08-25");
  render();
  const head = els.main.find("ex-head").find(h => h.innerHTML.includes("Curl"));
  check("and the exercise card", head && head.innerHTML.includes("Curl &lt;3"), head && head.innerHTML);
}

section("Workouts done in the last week carry a check, and relabelling picks a version");
{
  fresh();
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  state.sessions[daysAgo(2)] = {date: daysAgo(2), day: "legs", block: "A", blockIndex: 0, entries: {goblet_squat: [{w: "60", r: "10"}]}};
  state.sessions[daysAgo(3)] = {date: daysAgo(3), day: "mobility", block: "A", blockIndex: 0, entries: {pigeon: [{w: "", r: "45"}]}};
  state.sessions[daysAgo(10)] = {date: daysAgo(10), day: "arms", block: "A", blockIndex: 0, entries: {ez_curl: [{w: "60", r: "10"}]}};
  render();
  const marked = [...els.main.find("sessions")[0].children, ...els.main.find("cross")[0].children]
    .filter(button => button.find("day-done").length).map(button => button.dataset.label);
  equal("legs and mobility this week, not arms from ten days ago", marked, ["Legs", "Mobility"]);
  loadDate(iso(new Date()));
  setDay("legs");
  render();
  check("the open workout keeps its check", els.main.find("sessions")[0].children[1].find("day-done").length === 1);
  equal("the next version is picked", state.current.block, "B");
  check("and the header says what came last", els.main.find("dayhead")[0].innerHTML.includes("last time A, 2 days ago"),
    els.main.find("dayhead")[0].innerHTML);

  state.view = "history";
  render();
  openHistoryCard(1).find("hist-actions")[0].children[1].fire("click");
  const versions = els.sheetbody.find("blockset")[0].children;
  equal("the chooser offers the three versions", versions.map(b => b.dataset.label), ["A", "B", "C"]);
  versions[2].fire("click");
  els.sheetbody.find("sheet-item")[0].fire("click");
  const refiled = state.sessions[daysAgo(3)];
  equal("picking C then Chest files it as Chest C", [refiled.day, refiled.block], ["chest", "C"]);
  state.view = "log";
}

section("The date, clock, backup and test sound controls hold still");
{
  fresh();
  render();
  check("the date field", "steady" in els.main.find("date-input")[0].parentNode.dataset);
  check("the clock", "steady" in els.timer.dataset);
  state.view = "history";
  render();
  const steady = els.main.find("btn").filter(b => "steady" in b.dataset).map(b => b.dataset.label);
  equal("the backup and test sound buttons, nothing else", steady, ["Test sound", "Export backup", "Import backup"]);
  state.view = "log";
}

section("Coming back on a new day opens today unless something is logged");
{
  fresh();
  followToday("2026-09-01");
  followToday("2026-09-02");
  equal("an empty session moves to the new day", state.current.date, "2026-09-02");

  render();
  const row = els.main.find("ex-item")[0].find("set").filter(r => !r.classList.contains("head"))[0];
  wt(row).value = "50";
  rp(row).value = "10";
  rp(row).fire("change");
  followToday("2026-09-03");
  equal("a started session stays on its day", state.current.date, "2026-09-02");

  loadDate("2026-08-20");
  followToday("2026-09-03");
  equal("a date picked by hand stays put the same day", state.current.date, "2026-08-20");
  followToday("2026-09-04");
  equal("and the next day too", state.current.date, "2026-08-20");
}

process.exit(report() ? 0 : 1);
