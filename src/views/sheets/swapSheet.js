import {findExercise, IDS_BY_PATTERN} from "../../rules/exercises.js";
import {workoutOf} from "../../rules/workouts.js";
import {state, changes} from "../../store/state.js";
import {exerciseName, registerCustom, renameCustom, removeCustom, setsLoggedFor} from "../../store/customs.js";
import {idsTakenElsewhere} from "../../store/slots.js";
import {swapSlot, lastTimeFor} from "../../store/session.js";
import {el, escapeHtml} from "../dom.js";
import {actionButton, confirmButton} from "../controls.js";
import {openSheet, closeSheet, sheetGroup, sheetEntry} from "./sheet.js";

let openSlot = null;

function pick(slot, id){
  if(!swapSlot(slot, id)) return false;
  closeSheet();
  return true;
}

function lastDate(id){
  const last = lastTimeFor(id);
  return last ? last.date.slice(5) : "";
}

function exerciseRow(slot, id){
  const button = el("button", "sheet-item" + (id === slot.id ? " current" : ""));
  const when = lastDate(id);
  button.innerHTML = `<span>${escapeHtml(exerciseName(id))}</span>${when ? `<em>${when}</em>` : ""}`;
  button.addEventListener("click", () => pick(slot, id));
  return button;
}

function customRow(slot, id, taken){
  const use = el("button", "pick" + (id === slot.id ? " current" : ""), state.customNames[id]);
  use.disabled = taken.has(id);
  if(use.disabled) use.title = "Already in this session";
  use.addEventListener("click", () => pick(slot, id));

  const rename = actionButton("rename", {tone: "secondary", ghost: true, key: "rename:" + id}, () => {
    const next = prompt("Rename this exercise", state.customNames[id] || "");
    if(next !== null && renameCustom(id, next)){ changes.notify(); openSwapSheet(openSlot); }
  });

  const count = setsLoggedFor(id);
  const remove = confirmButton("remove", count ? `drop ${count} sets?` : "sure?",
    {tone: "danger", ghost: true, key: "remove:" + id}, () => {
      removeCustom(id);
      changes.notify();
      openSwapSheet(openSlot);
    });

  const row = el("div", "sheet-mine");
  row.append(use, el("em", null, lastDate(id)), rename, remove);
  return row;
}

export function openSwapSheet(slot){
  openSlot = slot;
  const body = openSheet(slot.n, "Instead of");
  const taken = idsTakenElsewhere(slot, workoutOf(state.current), state.current.swaps);
  const offer = ids => ids.filter(id => !taken.has(id)).forEach(id => body.appendChild(exerciseRow(slot, id)));

  const mine = Object.keys(state.customNames)
    .sort((a, b) => state.customNames[a].localeCompare(state.customNames[b]));
  if(mine.length){
    sheetGroup("Your exercises");
    mine.forEach(id => body.appendChild(customRow(slot, id, taken)));
  }

  const pattern = (findExercise(slot.id) || {}).pattern;
  if(pattern){
    sheetGroup("Same movement · " + pattern);
    offer(IDS_BY_PATTERN[pattern]);
  }

  sheetGroup("Type your own");
  body.appendChild(sheetEntry("Exercise name", "Use", input => {
    const id = registerCustom(input.value.trim());
    if(id && !pick(slot, id)){
      input.value = "";
      input.placeholder = "Already in this session";
    }
  }));

  sheetGroup("Everything else");
  Object.keys(IDS_BY_PATTERN).filter(p => p !== pattern).forEach(other => {
    sheetGroup(other);
    offer(IDS_BY_PATTERN[other]);
  });
}
