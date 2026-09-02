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
const {loadDate, setDay} = await import("../src/session.js");

mountTimer(els.timer, els.clock);
mountSaveState(els.status);
mountSheet(els.sheet, els.sheettitle, els.sheetbody, els.sheetclose, els.sheetback);

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
  setDay("chest");
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

section("Collapsing and the progress ring");
{
  fresh();
  render();
  check("the ring starts empty", els.ringtext.textContent === "0", els.ringtext.textContent);

  const card = els.main.find("ex-move")[0];
  const rows = card.find("set").filter(r => !r.classList.contains("head"));
  rows.forEach(row => {
    row.children[1].value = "50";
    row.children[3].value = "10";
    row.children[3].fire("change");
  });
  render();

  check("finishing every set collapses the card", els.main.find("ex-move")[0].classList.contains("done"));
  check("its summary is populated", els.main.find("ex-summary")[0].textContent.includes("50"));
  check("the ring counts the logged sets", els.ringtext.textContent === "4", els.ringtext.textContent);
  check("the footer shows elapsed time", els.volnote.textContent.includes("just started"), els.volnote.textContent);

  els.main.find("ex-fold")[0].fire("click");
  render();
  check("tapping the chevron expands it again", !els.main.find("ex-move")[0].classList.contains("done"));

  const blocks = els.main.find("ex-move");
  check("a block per main move plus two per superset", blocks.length === 14, blocks.length);

  const coreMove = blocks[8];
  coreMove.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    row.children[3].value = "12";
    row.children[3].fire("change");
  });
  render();
  const after = els.main.find("ex-move");
  check("a finished superset move collapses too", after[8].classList.contains("done"));
  check("its partner stays open", !after[9].classList.contains("done"));
  check("its summary is populated", after[8].find("ex-summary")[0].textContent.includes("12"));
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

  first.fire("click");
  equal("set 1 fills in last time's numbers",
    state.current.entries.flat_db_press[0], {w: "45", r: "9"});
  check("filling set 1 wakes the button on set 2", second.disabled === false);

  rows[1].children[1].value = "50";
  rows[1].children[3].value = "8";
  rows[1].children[3].fire("change");

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
  check("every main move asks how it felt", rows.length === 8, rows.length);

  const buttons = rows[0].children.filter(c => c.tag === "button");
  equal("three levels", buttons.map(b => b.textContent), ["easy", "medium", "hard"]);
  buttons[2].fire("click");
  equal("tapping one records it", state.current.effort.flat_db_press, "hard");

  render();
  const again = els.main.find("effort")[0].children.filter(c => c.tag === "button");
  check("the chosen level is marked", again[2].classList.contains("on"));
  again[2].fire("click");
  equal("tapping it again clears it", state.current.effort.flat_db_press, undefined);
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
    row.children[1].value = "50";
    row.children[3].value = "10";
    row.children[3].fire("change");
  });
  check("a partly finished card stays open", !card.classList.contains("done"));

  const lastRow = rows[3];
  lastRow.children[1].value = "50";
  lastRow.children[3].value = "9";
  lastRow.children[3].fire("change");

  check("finishing the last set collapses it there and then",
    card.classList.contains("done"));
  check("the summary fills in without a re-render",
    card.find("ex-summary")[0].textContent.includes("50"),
    card.find("ex-summary")[0].textContent);
  check("the ring updates", els.ringtext.textContent === "4", els.ringtext.textContent);
  check("the clock appears on the first logged set",
    els.volnote.textContent.includes("just started"), els.volnote.textContent);
}

section("Expansion does not leak between sessions");
{
  fresh();
  render();
  const card = els.main.find("ex-move")[0];
  card.find("set").filter(r => !r.classList.contains("head")).forEach(row => {
    row.children[1].value = "50";
    row.children[3].value = "10";
    row.children[3].fire("change");
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
  const {WARN_COUNTDOWN_SECONDS, FINAL_COUNTDOWN_SECONDS} = await import("../src/constants.js");

  fresh();
  render();
  stop();
  check("an idle timer shows the rest the next set will get",
    els.clock.textContent === "120s", els.clock.textContent);
  check("and carries no state classes",
    !els.timer.classList.contains("running") && !els.timer.classList.contains("ending"));

  start(90);
  check("starting marks it running", els.timer.classList.contains("running"));
  check("with plenty left it neither warns nor escalates",
    !els.timer.classList.contains("warn") && !els.timer.classList.contains("ending"));

  start(WARN_COUNTDOWN_SECONDS);
  check("inside ten seconds it warns", els.timer.classList.contains("warn"));
  check("but does not yet escalate", !els.timer.classList.contains("ending"));

  start(FINAL_COUNTDOWN_SECONDS);
  check("inside the final seconds it escalates", els.timer.classList.contains("ending"));
  check("and drops the warn tier", !els.timer.classList.contains("warn"));

  start(WARN_COUNTDOWN_SECONDS + 30);
  check("a fresh longer rest drops both tiers",
    !els.timer.classList.contains("warn") && !els.timer.classList.contains("ending"));

  stop();
  check("stopping clears every state class",
    !els.timer.classList.contains("running") &&
    !els.timer.classList.contains("warn") &&
    !els.timer.classList.contains("ending") &&
    !els.timer.classList.contains("up"));
  check("and restores the idle reading", els.clock.textContent.endsWith("s"), els.clock.textContent);
}

section("The idle countdown tracks the next unlogged set");
{
  const {stop} = await import("../src/timer.js");
  fresh();
  render();
  stop();
  check("it opens on the lead lift's rest", els.clock.textContent === "120s", els.clock.textContent);

  const rows = els.main.find("ex-move")[0].find("set").filter(r => !r.classList.contains("head"));
  rows.slice(0, 3).forEach(row => {
    row.children[1].value = "50";
    row.children[3].value = "10";
    row.children[3].fire("change");
  });
  stop();
  check("with one set left it shows the walk to the next move",
    els.clock.textContent === "90s", els.clock.textContent);

  rows[3].children[1].value = "50";
  rows[3].children[3].value = "10";
  rows[3].children[3].fire("change");
  stop();
  check("finishing the move shows the next move's rest",
    els.clock.textContent === "120s", els.clock.textContent);
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

section("Sound is optional, remembered and testable");
{
  const sound = await import("../src/sound.js");
  fresh();

  check("with no Web Audio the state says so", sound.audioState() === "unsupported");
  check("unlocking a browser without it fails quietly", sound.unlockAudio() === false);
  check("a beep with no context is a no-op, not a throw", sound.beepGo() === false);

  check("sound defaults to on", sound.soundOn() === true);
  sound.setSoundOn(false);
  check("turning it off sticks", sound.soundOn() === false);
  check("and it stops beeping", sound.beepCountdown() === false);
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
    buttons[0].textContent === "Sound on", buttons[0].textContent);

  buttons[0].fire("click");
  check("tapping it flips the label", buttons[0].textContent === "Sound off", buttons[0].textContent);
  buttons[0].fire("click");

  buttons[1].fire("click");
  check("the test button reports what happened",
    row.find("sound-result")[0].textContent.length > 0,
    row.find("sound-result")[0].textContent);

  state.view = "log";
  render();
}

section("The countdown beeps once a second, then once at zero");
{
  const played = [];
  window.AudioContext = function(){
    this.state = "running";
    this.currentTime = 0;
    this.destination = {};
    this.resume = () => Promise.resolve();
    this.createGain = () => ({
      connect(){},
      gain: {setValueAtTime(){}, exponentialRampToValueAtTime(){}}
    });
    this.createOscillator = () => {
      const osc = {
        type: "",
        connect(){},
        stop(){},
        frequency: {setValueAtTime(hz){ osc.hz = hz; }},
        start(){ played.push(osc.hz); }
      };
      return osc;
    };
  };

  const sound = await import("../src/sound.js");
  const {start, stop} = await import("../src/timer.js");
  const {BEEP_COUNTDOWN, BEEP_GO} = await import("../src/constants.js");

  check("a real context unlocks", sound.unlockAudio() === true);
  check("and reports itself running", sound.audioState() === "running", sound.audioState());

  played.length = 0;
  check("a go beep plays", sound.beepGo() === true);
  equal("at the go pitch", played, [BEEP_GO.freq]);

  played.length = 0;
  sound.setSoundOn(false);
  check("muted, nothing plays", sound.beepCountdown() === false);
  equal("and no tone reaches the context", played, []);
  sound.setSoundOn(true);

  played.length = 0;
  start(1);
  await new Promise(done => setTimeout(done, 1400));
  stop();
  equal("one second of rest beeps once then goes",
    played, [BEEP_COUNTDOWN.freq, BEEP_GO.freq]);

  played.length = 0;
  start(5);
  equal("a fresh five-second rest is silent to begin with", played, []);
  const frozenUntil = Date.now() + 5600;
  while(Date.now() < frozenUntil);
  await new Promise(done => setTimeout(done, 400));
  equal("a rest that ended while the app was frozen makes no sound", played, []);
  check("and it does not flash a stale go",
    !els.timer.classList.contains("up"), els.timer._class);
  check("it just falls back to the idle reading",
    els.clock.textContent.endsWith("s"), els.clock.textContent);
  stop();
}

section("A superset reads as an alternating pair");
{
  fresh();
  render();
  const badge = els.main.find("superset")[0];
  check("the badge says to alternate", badge.innerHTML.includes("alternate"), badge.innerHTML);

  const blocks = els.main.find("ex-move");
  const first = blocks[8], second = blocks[9];
  const firstMeta = first.find("meta")[0].innerHTML;
  const secondMeta = second.find("meta")[0].innerHTML;
  check("the first move points at its partner", /straight into \w/.test(firstMeta), firstMeta);
  check("it counts rounds, not sets", firstMeta.includes("rounds"), firstMeta);
  check("the second move states the round rest",
    secondMeta.includes("rest 45s between rounds"), secondMeta);
  check("no core move claims a 15s rest", !firstMeta.includes("rest 15s"), firstMeta);

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
  equal("eight prompts, not fourteen", els.main.find("effort").length, 8);
  const coreCards = els.main.find("core");
  check("no core superset asks", coreCards.every(c => c.find("effort").length === 0));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
