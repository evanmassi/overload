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
const {findExercise} = await import("../src/movements.js");
const {loadDate} = await import("../src/session.js");

mountTimer(els.timer, els.clock);
mountSheet(els.sheet, els.sheettitle, els.sheetbody, els.sheetclose, els.sheetback);

let passed = 0, failed = 0;
const check = (label, cond, detail) => {
  if(cond){ passed++; console.log("  PASS  " + label); }
  else { failed++; console.log("  FAIL  " + label + (detail === undefined ? "" : "  -> " + detail)); }
};
const section = name => console.log("\n" + name);

function fresh(){
  localStorage.clear();
  els.sheet.hidden = true;
  state.sessions = {};
  state.customNames = {};
  state.view = "log";
  loadDate("2026-09-01");
}

section("The log view renders a full session");
{
  fresh();
  render();
  const cards = els.main.find("ex");
  check("eight main cards plus three superset cards", cards.length === 11, cards.length);
  check("each main card has a swap button", els.main.find("ex-swap").length === 14, els.main.find("ex-swap").length);
  const metas = els.main.find("meta");
  check("every exercise states its load convention", metas.length === 14 && metas.every(m => /per dumbbell|one dumbbell|total w|stack|bodyweight/.test(m.innerHTML)), metas.length);
  check("per-side moves are tagged", metas.some(m => m.innerHTML.includes("per leg")) || state.current.day !== "legs");
  check("the session tabs render", els.main.find("sessions").length === 1);
  check("a notes box renders", els.main.find("notes").length === 1);
  check("the legend renders", els.main.find("legend").length === 1);
  check("no target band before any history exists", els.main.find("target").length === 0);
  check("footer reports an empty session", els.volnote.textContent === "no sets logged", els.volnote.textContent);
}

section("Logging a set updates the view");
{
  fresh();
  render();
  const firstSetRow = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  const [, weight, , reps] = firstSetRow.children;
  weight.value = "50";
  reps.value = "10";
  reps.fire("change");

  check("the set is recorded on the current session", state.current.entries.flat_db_press[0].r === "10");
  check("volume reflects a pair of dumbbells", els.volume.textContent === "1,000 lb", els.volume.textContent);
  check("the rest timer started", els.timer.classList.contains("running"));
}

section("A prior session drives placeholders and a target");
{
  fresh();
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "45", r: "10"}, {w: "45", r: "10"}, {w: "45", r: "10"}]}
  };
  loadDate("2026-09-01");
  state.current.day = "chest";
  render();

  check("a target band appears", els.main.find("target").length >= 1);
  const band = els.main.find("target")[0];
  check("it asks for more weight after topping the range", band.innerHTML.includes("50×8"), band.innerHTML);
  const row = els.main.find("set").filter(r => !r.classList.contains("head"))[0];
  check("last time's weight is the placeholder", row.children[1].attrs === undefined || row.children[1].placeholder === "45", row.children[1].placeholder);
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
}

section("History and progress views render");
{
  fresh();
  state.sessions["2026-08-25"] = {
    date: "2026-08-25", day: "chest", block: "A", blockIndex: 0,
    notes: "shoulder felt fine",
    entries: {flat_db_press: [{w: "45", r: "10"}]}
  };
  state.sessions["2026-08-18"] = {
    date: "2026-08-18", day: "chest", block: "A", blockIndex: 0,
    entries: {flat_db_press: [{w: "40", r: "10"}]}
  };

  state.view = "history";
  render();
  check("a card per session", els.main.find("hist-day").length === 2, els.main.find("hist-day").length);
  check("notes show on the card", els.main.find("hist-notes").length === 1);
  check("backup controls render", els.main.find("backup").length === 1);

  state.view = "progress";
  render();
  check("a progress card renders", els.main.find("prog").length === 1);
  check("two data points draw a sparkline", els.main.find("prog")[0].children.some(c => c.tag === "svg"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
