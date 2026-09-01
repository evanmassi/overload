import {PATTERNS} from "./taxonomy.js";
import {PATTERN_OF} from "./movements.js";
import {HOWTO} from "./howto.js";
import {CONFIRM_WINDOW_MS} from "./constants.js";
import {state, notify} from "./state.js";
import {priorSets} from "./progression.js";
import {exerciseName, registerCustom, renameCustom, removeCustom, setsLoggedFor} from "./swaps.js";
import {queueSave} from "./session.js";

let sheet, title, body;
let openSlot = null;

export function mountSheet(sheetEl, titleEl, bodyEl, closeEl, backdropEl){
  sheet = sheetEl;
  title = titleEl;
  body = bodyEl;
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

export function openHowTo(exercise){
  const guide = HOWTO[exercise.id];
  title.textContent = exercise.n;
  body.innerHTML = "";

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
    const original = button.textContent;
    button.textContent = prompt;
    button.classList.add("armed");
    setTimeout(() => {
      delete button.dataset.armed;
      button.textContent = original;
      button.classList.remove("armed");
    }, CONFIRM_WINDOW_MS);
  });
}

function pick(slot, id){
  if(id === slot.id) delete state.current.swaps[slot.id];
  else state.current.swaps[slot.id] = id;
  queueSave();
  notify();
  closeSheet();
}

function movementRow(slot, id){
  const button = document.createElement("button");
  button.className = "sheet-item" + (id === slot.id ? " current" : "");
  const last = priorSets(state.sessions, id, state.current.date);
  button.innerHTML = `<span>${exerciseName(id)}</span>${last ? `<em>${last.date.slice(5)}</em>` : ""}`;
  button.addEventListener("click", () => pick(slot, id));
  return button;
}

function customRow(slot, id){
  const row = document.createElement("div");
  row.className = "sheet-mine";

  const use = document.createElement("button");
  use.className = "pick" + (id === slot.id ? " current" : "");
  use.textContent = state.customNames[id];
  use.addEventListener("click", () => pick(slot, id));

  const last = priorSets(state.sessions, id, state.current.date);
  const when = document.createElement("em");
  when.textContent = last ? last.date.slice(5) : "";

  const rename = document.createElement("button");
  rename.className = "mini";
  rename.textContent = "rename";
  rename.addEventListener("click", () => {
    const next = prompt("Rename this exercise", state.customNames[id] || "");
    if(next !== null && renameCustom(id, next)){ notify(); openSwapSheet(openSlot); }
  });

  const drop = document.createElement("button");
  drop.className = "mini";
  const count = setsLoggedFor(id);
  armConfirm(drop, count ? `drop ${count} sets?` : "sure?", () => {
    removeCustom(id);
    notify();
    openSwapSheet(openSlot);
  });
  drop.textContent = "remove";

  row.append(use, when, rename, drop);
  return row;
}

export function openSwapSheet(slot){
  openSlot = slot;
  title.textContent = "Instead of " + slot.n;
  body.innerHTML = "";

  const mine = Object.keys(state.customNames)
    .sort((a, b) => state.customNames[a].localeCompare(state.customNames[b]));
  if(mine.length){
    group("Your exercises");
    mine.forEach(id => body.appendChild(customRow(slot, id)));
  }

  const pattern = PATTERN_OF[slot.id];
  if(pattern){
    group("Same movement · " + pattern);
    PATTERNS[pattern].forEach(id => body.appendChild(movementRow(slot, id)));
  }

  group("Type your own");
  const row = document.createElement("div");
  row.className = "sheet-custom";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Exercise name";
  const use = document.createElement("button");
  use.textContent = "Use";
  const submit = () => {
    const id = registerCustom(input.value.trim());
    if(id) pick(slot, id);
  };
  use.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
  row.append(input, use);
  body.appendChild(row);

  group("Everything else");
  Object.keys(PATTERNS).filter(p => p !== pattern).forEach(other => {
    group(other);
    PATTERNS[other].forEach(id => body.appendChild(movementRow(slot, id)));
  });

  show();
}
