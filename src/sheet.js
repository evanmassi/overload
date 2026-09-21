import {PATTERNS} from "./taxonomy.js";
import {PATTERN_OF, workoutFor, allExercises} from "./movements.js";
import {HOWTO} from "./howto.js";
import {MUSCLES} from "./muscles.js";
import {CONFIRM_WINDOW_MS, DAY_KEYS, OFF_KEYS, DAYS, TIMER_PRESETS} from "./constants.js";
import {state, notify} from "./state.js";
import {priorSets} from "./progression.js";
import {exerciseName, registerCustom, renameCustom, removeCustom, setsLoggedFor, resolveSlot} from "./swaps.js";
import {queueSave, relabelSession} from "./session.js";
import {start as startTimer, startStopwatch} from "./timer.js";
import {clockFace, parseClock} from "./format.js";
import {strandButton} from "./strand/button.js";
import {strandField} from "./strand/field.js";

let sheet, title, body;
let openSlot = null;

export function mountSheet(sheetEl, titleEl, bodyEl, closeEl, backdropEl){
  sheet = sheetEl;
  title = titleEl;
  body = bodyEl;
  strandButton(closeEl, {tone: "secondary", ghost: true});
  closeEl.addEventListener("click", closeSheet);
  backdropEl.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !sheet.hidden) closeSheet(); });
}

function closeSheet(){ sheet.hidden = true; }

function show(){
  sheet.hidden = false;
  body.scrollTop = 0;
}

function group(text){
  const heading = document.createElement("p");
  heading.className = "sheet-group";
  heading.textContent = text;
  body.appendChild(heading);
}

function youtubeLink(name){
  const link = document.createElement("a");
  link.className = "howto-link";
  link.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " proper form");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Watch it on YouTube";
  return link;
}

function customCountdown(){
  const row = document.createElement("div");
  row.className = "sheet-custom";
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.placeholder = "Seconds or m.ss";
  const use = document.createElement("button");
  strandButton(use, {label: "Start", tone: "primary"});
  const submit = () => {
    const seconds = parseClock(input.value);
    if(!seconds){ input.value = ""; input.placeholder = "Try 90 or 1.30"; return; }
    startTimer(seconds);
    closeSheet();
  };
  use.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
  row.append(strandField(input), use);
  return row;
}

export function openTimerSheet(){
  title.textContent = "Timer";
  body.innerHTML = "";
  group("Count down");
  const presets = document.createElement("div");
  presets.className = "sheet-presets";
  TIMER_PRESETS.forEach(seconds => {
    const button = document.createElement("button");
    strandButton(button, {label: clockFace(seconds), tone: "primary", key: "preset:" + seconds});
    button.addEventListener("click", () => { startTimer(seconds); closeSheet(); });
    presets.appendChild(button);
  });
  body.appendChild(presets);
  body.appendChild(customCountdown());
  group("Count up");
  const watch = document.createElement("button");
  watch.className = "sheet-item";
  watch.innerHTML = "<span>Stopwatch</span><em>tap the clock to stop</em>";
  watch.addEventListener("click", () => { startStopwatch(); closeSheet(); });
  body.appendChild(watch);
  show();
}

export function openRelabelSheet(key){
  const session = state.sessions[key];
  if(!session) return;
  title.textContent = "File this session as";
  body.innerHTML = "";
  [...DAY_KEYS, ...OFF_KEYS].forEach(day => {
    const button = document.createElement("button");
    button.className = "sheet-item" + (day === session.day ? " current" : "");
    button.innerHTML = `<span>${DAYS[day].label}</span>`;
    button.addEventListener("click", () => { relabelSession(key, day); closeSheet(); });
    body.appendChild(button);
  });
  show();
}

export function openHowTo(exercise){
  const guide = HOWTO[exercise.id];
  title.textContent = exercise.n;
  body.innerHTML = "";

  const worked = MUSCLES[exercise.id];
  if(worked){
    const works = document.createElement("p");
    works.className = "howto-works";
    works.innerHTML = "<b>Works</b>";
    works.appendChild(document.createTextNode(worked.p.join(", ") + (worked.s.length ? " · also " + worked.s.join(", ") : "")));
    body.appendChild(works);
  }

  if(guide){
    const steps = document.createElement("ol");
    steps.className = "howto-steps";
    guide.s.forEach(step => {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    });
    body.appendChild(steps);

    const watch = document.createElement("p");
    watch.className = "howto-watch";
    watch.innerHTML = "<b>Watch out</b>";
    watch.appendChild(document.createTextNode(guide.w));
    body.appendChild(watch);
  } else {
    const none = document.createElement("p");
    none.className = "howto-watch";
    none.textContent = "No write-up for this one yet.";
    body.appendChild(none);
  }

  body.appendChild(youtubeLink(exercise.n));
  show();
}

function armConfirm(button, prompt, act){
  button.addEventListener("click", event => {
    event.stopPropagation();
    if(button.dataset.armed){ act(); return; }
    button.dataset.armed = "1";
    const original = button.dataset.label;
    button.strandLabel(prompt);
    setTimeout(() => {
      delete button.dataset.armed;
      button.strandLabel(original);
    }, CONFIRM_WINDOW_MS);
  });
}

function idsElsewhereInSession(slot){
  const plan = workoutFor(state.current.block, state.current.day);
  const taken = new Set(allExercises(plan).map(resolveSlot).map(exercise => exercise.id));
  taken.delete(resolveSlot(slot).id);
  return taken;
}

function pick(slot, id){
  if(idsElsewhereInSession(slot).has(id)) return false;
  if(id === slot.id) delete state.current.swaps[slot.id];
  else state.current.swaps[slot.id] = id;
  queueSave();
  notify();
  closeSheet();
  return true;
}

function movementRow(slot, id){
  const button = document.createElement("button");
  button.className = "sheet-item" + (id === slot.id ? " current" : "");
  const last = priorSets(state.sessions, id, state.current.key, state.current.day);
  button.innerHTML = `<span>${exerciseName(id)}</span>${last ? `<em>${last.date.slice(5)}</em>` : ""}`;
  button.addEventListener("click", () => pick(slot, id));
  return button;
}

function customRow(slot, id, taken){
  const row = document.createElement("div");
  row.className = "sheet-mine";

  const use = document.createElement("button");
  use.className = "pick" + (id === slot.id ? " current" : "");
  use.textContent = state.customNames[id];
  use.disabled = taken.has(id);
  if(use.disabled) use.title = "Already in this session";
  use.addEventListener("click", () => pick(slot, id));

  const last = priorSets(state.sessions, id, state.current.key, state.current.day);
  const when = document.createElement("em");
  when.textContent = last ? last.date.slice(5) : "";

  const rename = document.createElement("button");
  strandButton(rename, {label: "rename", tone: "secondary", ghost: true, key: "rename:" + id});
  rename.addEventListener("click", () => {
    const next = prompt("Rename this exercise", state.customNames[id] || "");
    if(next !== null && renameCustom(id, next)){ notify(); openSwapSheet(openSlot); }
  });

  const drop = document.createElement("button");
  strandButton(drop, {label: "remove", tone: "danger", ghost: true, key: "remove:" + id});
  const count = setsLoggedFor(id);
  armConfirm(drop, count ? `drop ${count} sets?` : "sure?", () => {
    removeCustom(id);
    notify();
    openSwapSheet(openSlot);
  });

  row.append(use, when, rename, drop);
  return row;
}

export function openSwapSheet(slot){
  openSlot = slot;
  title.textContent = "Instead of " + slot.n;
  body.innerHTML = "";
  const taken = idsElsewhereInSession(slot);
  const offer = ids => ids.filter(id => !taken.has(id)).forEach(id => body.appendChild(movementRow(slot, id)));

  const mine = Object.keys(state.customNames)
    .sort((a, b) => state.customNames[a].localeCompare(state.customNames[b]));
  if(mine.length){
    group("Your exercises");
    mine.forEach(id => body.appendChild(customRow(slot, id, taken)));
  }

  const pattern = PATTERN_OF[slot.id];
  if(pattern){
    group("Same movement · " + pattern);
    offer(PATTERNS[pattern]);
  }

  group("Type your own");
  const row = document.createElement("div");
  row.className = "sheet-custom";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Exercise name";
  const use = document.createElement("button");
  strandButton(use, {label: "Use", tone: "primary"});
  const submit = () => {
    const id = registerCustom(input.value.trim());
    if(id && !pick(slot, id)){
      input.value = "";
      input.placeholder = "Already in this session";
    }
  };
  use.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
  row.append(strandField(input), use);
  body.appendChild(row);

  group("Everything else");
  Object.keys(PATTERNS).filter(p => p !== pattern).forEach(other => {
    group(other);
    offer(PATTERNS[other]);
  });

  show();
}
