import {CONFIRM_WINDOW_MS, DAY_KEYS, DAYS, ICON_SWAP, ICON_UP, ICON_SAME, ICON_DOWN} from "./constants.js";
import {workoutFor, allExercises, findExercise} from "./movements.js";
import {state, notify} from "./state.js";
import {loggedCount, sessionVolume, score, topSet, priorSets} from "./progression.js";
import {blockIndexOf, cycleNumber} from "./rotation.js";
import {exerciseName} from "./swaps.js";
import {loadDate, deleteSession} from "./session.js";
import {setSummary, elapsedLabel, unitSuffix} from "./format.js";
import {exportSessions, importSessions, onBackupStatus} from "./backup.js";
import {soundOn, setSoundOn, testTone, audioState} from "./sound.js";
import {strandButton} from "./strand/button.js";

function deltaMark(date, id, sets, isBodyweight){
  const prior = priorSets(state.sessions, id, date);
  if(!prior) return `<i class="hist-delta up" title="First time logged">new</i>`;
  const now = score(topSet(sets, isBodyweight), isBodyweight);
  const then = score(topSet(prior.sets, isBodyweight), isBodyweight);
  if(now > then) return `<i class="hist-delta up" title="Beat ${prior.date}">${ICON_UP}</i>`;
  if(now === then) return `<i class="hist-delta same" title="Matched ${prior.date}">${ICON_SAME}</i>`;
  return `<i class="hist-delta down" title="Below ${prior.date}">${ICON_DOWN}</i>`;
}

function exerciseLine(date, id, sets, name, exercise, extraClass, mark){
  const line = document.createElement("div");
  line.className = "hist-line" + (extraClass ? " " + extraClass : "");
  const isBodyweight = exercise ? !!exercise.bw : !sets.some(set => set.w);
  line.innerHTML = `<span>${name}${mark || ""}</span><b>${setSummary(sets, exercise ? unitSuffix(exercise) : "")}</b>${deltaMark(date, id, sets, isBodyweight)}`;
  return line;
}

function slotLine(date, session, slot){
  const swapped = session.swaps && session.swaps[slot.id];
  const id = swapped || slot.id;
  const sets = (session.entries || {})[id];
  if(!sets || !sets.some(set => set && set.r)) return null;
  const mark = swapped
    ? `<i class="hist-swap" title="Swapped in for ${slot.n}" aria-label="Swapped in for ${slot.n}">${ICON_SWAP}</i>`
    : "";
  return exerciseLine(date, id, sets, swapped ? exerciseName(id) : slot.n, (swapped && findExercise(id)) || slot, "", mark);
}

function subLabel(text){
  const label = document.createElement("p");
  label.className = "hist-sub";
  label.textContent = text;
  return label;
}

function armedDelete(date){
  const remove = document.createElement("button");
  remove.addEventListener("click", event => {
    event.stopPropagation();
    if(remove.dataset.armed){ deleteSession(date); return; }
    remove.dataset.armed = "1";
    remove.strandLabel("sure?");
    setTimeout(() => { delete remove.dataset.armed; remove.strandLabel("delete"); }, CONFIRM_WINDOW_MS);
  });
  return strandButton(remove, {label: "delete", tone: "danger", ghost: true, key: "hist-delete:" + date});
}

function sessionBody(date, session, plan){
  const body = document.createElement("div");
  body.className = "hist-body";

  plan.ex.forEach(slot => {
    const line = slotLine(date, session, slot);
    if(line) body.appendChild(line);
  });

  const supersets = (plan.core || [])
    .map(pair => pair.map(slot => slotLine(date, session, slot)).filter(Boolean))
    .filter(lines => lines.length);
  if(supersets.length){
    body.appendChild(subLabel("Core finisher"));
    supersets.forEach(lines => {
      const group = document.createElement("div");
      group.className = "hist-super";
      lines.forEach(line => group.appendChild(line));
      body.appendChild(group);
    });
  }

  const planned = new Set(allExercises(plan).map(slot => (session.swaps && session.swaps[slot.id]) || slot.id));
  const strays = Object.keys(session.entries || {})
    .filter(id => !planned.has(id))
    .filter(id => session.entries[id].some(set => set && set.r));
  if(strays.length){
    body.appendChild(subLabel("Not in this session"));
    strays.forEach(id =>
      body.appendChild(exerciseLine(date, id, session.entries[id], exerciseName(id), findExercise(id), "hist-stray")));
  }

  if(session.notes){
    const note = document.createElement("p");
    note.className = "hist-notes";
    note.textContent = session.notes;
    body.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "hist-actions";
  const edit = document.createElement("button");
  edit.title = "Open this session on the Log tab";
  strandButton(edit, {label: "edit", tone: "secondary", ghost: true, key: "hist-edit:" + date});
  edit.addEventListener("click", event => {
    event.stopPropagation();
    loadDate(date);
    state.view = "log";
    notify();
    window.scrollTo(0, 0);
  });
  actions.append(edit, armedDelete(date));
  body.appendChild(actions);
  return body;
}

function sessionCard(date, session, plan){
  const open = state.historyOpen.has(date);
  const card = document.createElement("div");
  card.className = "hist-day" + (open ? " hist-expanded" : "");

  const row = document.createElement("div");
  row.className = "hist-row";
  row.setAttribute("role", "button");
  row.setAttribute("aria-expanded", String(open));
  const top = document.createElement("div");
  top.className = "hist-top";
  top.innerHTML = `<h3>${plan.focus}</h3><span class="chip live">${session.block}</span><span class="chip" title="${date}">${date.slice(5)}</span>`;
  const foot = document.createElement("div");
  foot.className = "hist-foot";
  const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
  foot.innerHTML = `<b>${sessionVolume(session, session.block, session.day).toLocaleString()} lb</b>`
    + `<span>${loggedCount(session)} sets</span>${took ? `<span>${took}</span>` : ""}`;
  row.append(top, foot);
  row.addEventListener("click", () => {
    open ? state.historyOpen.delete(date) : state.historyOpen.add(date);
    notify();
  });
  card.appendChild(row);

  if(open) card.appendChild(sessionBody(date, session, plan));
  return card;
}

function filterBar(){
  const bar = document.createElement("div");
  bar.className = "blockset hist-filter";
  [null, ...DAY_KEYS].forEach(day => {
    const button = document.createElement("button");
    strandButton(button, {
      label: day ? DAYS[day].short : "All",
      tone: "secondary", ghost: true, key: "filter:" + day
    });
    button.dataset.chosen = day === state.historyDay ? "on" : "off";
    button.setAttribute("aria-pressed", String(day === state.historyDay));
    button.addEventListener("click", () => { state.historyDay = day; notify(); });
    bar.appendChild(button);
  });
  return bar;
}

function settings(){
  return [soundControls(), soundNote(), backupControls(), backupNote()];
}

export function renderHistory(main){
  const dates = Object.keys(state.sessions).sort().reverse();
  if(!dates.length){
    main.innerHTML = `<p class="empty">Nothing logged yet. Fill in a set on the Log tab and it shows up here.</p>`;
    main.append(...settings());
    return;
  }

  main.appendChild(filterBar());

  const shown = dates.filter(date => !state.historyDay || state.sessions[date].day === state.historyDay);
  if(!shown.length){
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = `No ${DAYS[state.historyDay].label} sessions yet.`;
    main.append(empty, ...settings());
    return;
  }

  let lastCycle = null;
  shown.forEach(date => {
    const session = state.sessions[date];
    const plan = workoutFor(session.block, session.day);
    if(!plan) return;

    const cycle = cycleNumber(blockIndexOf(session));
    if(cycle !== lastCycle){
      const label = document.createElement("p");
      label.className = "section-label hist-cycle";
      label.textContent = `Cycle ${cycle}`;
      main.appendChild(label);
      lastCycle = cycle;
    }
    main.appendChild(sessionCard(date, session, plan));
  });

  main.append(...settings());
}

function backupControls(){
  const box = document.createElement("div");
  box.className = "backup";

  const save = document.createElement("button");
  save.addEventListener("click", exportSessions);
  strandButton(save, {label: "Export backup", tone: "primary"});

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.hidden = true;
  picker.addEventListener("change", importSessions);

  const load = document.createElement("button");
  load.addEventListener("click", () => picker.click());
  strandButton(load, {label: "Import backup", tone: "primary"});

  const result = document.createElement("span");
  result.className = "backup-result";
  onBackupStatus(text => { result.textContent = text; });

  box.append(save, load, picker, result);
  return box;
}

function backupNote(){
  const note = document.createElement("p");
  note.className = "backup-note";
  note.textContent = "Your log lives on this device. Export before clearing browser data.";
  return note;
}

function soundControls(){
  const box = document.createElement("div");
  box.className = "soundrow";

  const toggle = document.createElement("button");
  const paint = () => {
    toggle.strandLabel(soundOn() ? "Sound on" : "Sound off");
    toggle.dataset.chosen = soundOn() ? "on" : "off";
    toggle.setAttribute("aria-pressed", String(soundOn()));
  };
  toggle.addEventListener("click", () => { setSoundOn(!soundOn()); paint(); });
  strandButton(toggle, {label: "Sound off", tone: "secondary"});
  paint();

  const note = document.createElement("p");
  note.className = "sound-result";

  const test = document.createElement("button");
  strandButton(test, {label: "Test sound", tone: "primary"});
  test.addEventListener("click", () => {
    const played = testTone();
    const state = audioState();
    note.textContent = played
      ? "Played. Heard nothing? Check the ring/silent switch."
      : state === "unsupported"
        ? "This browser has no Web Audio."
        : "Blocked by the browser. Tap once more.";
  });

  box.append(toggle, test, note);
  return box;
}

function soundNote(){
  const note = document.createElement("p");
  note.className = "sound-note";
  note.textContent = "Three short beeps in the last seconds, a rising three-note one when the rest is up. The screen stays awake while a rest runs. Switching apps pauses the clock; come back and it shows GO.";
  return note;
}
