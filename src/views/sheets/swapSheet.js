import {PATTERNS} from "../../data/taxonomy.js";
import {CONFIRM_WINDOW_MS} from "../../data/constants.js";
import {PATTERN_OF, workoutFor} from "../../rules/exercises.js";
import {priorSets} from "../../rules/progression.js";
import {state, notify} from "../../store/state.js";
import {exerciseName, registerCustom, renameCustom, removeCustom, setsLoggedFor} from "../../store/customs.js";
import {idsTakenElsewhere} from "../../store/slots.js";
import {swapSlot} from "../../store/session.js";
import {openSheet, closeSheet, sheetGroup} from "./sheet.js";
import {strandButton} from "../../strand/button.js";
import {strandField} from "../../strand/field.js";

let openSlot = null;

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

function pick(slot, id){
  if(!swapSlot(slot, id)) return false;
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
  const body = openSheet("Instead of " + slot.n);
  const taken = idsTakenElsewhere(slot, workoutFor(state.current.block, state.current.day), state.current.swaps);
  const offer = ids => ids.filter(id => !taken.has(id)).forEach(id => body.appendChild(movementRow(slot, id)));

  const mine = Object.keys(state.customNames)
    .sort((a, b) => state.customNames[a].localeCompare(state.customNames[b]));
  if(mine.length){
    sheetGroup("Your exercises");
    mine.forEach(id => body.appendChild(customRow(slot, id, taken)));
  }

  const pattern = PATTERN_OF[slot.id];
  if(pattern){
    sheetGroup("Same movement · " + pattern);
    offer(PATTERNS[pattern]);
  }

  sheetGroup("Type your own");
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

  sheetGroup("Everything else");
  Object.keys(PATTERNS).filter(p => p !== pattern).forEach(other => {
    sheetGroup(other);
    offer(PATTERNS[other]);
  });
}
