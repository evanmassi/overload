import {findExercise, IDS_BY_PATTERN} from "../../rules/exercises.js";
import {workoutOf} from "../../rules/workouts.js";
import {state, changes} from "../../store/state.js";
import {exerciseName, registerCustom, renameCustom, removeCustom, setsLoggedFor} from "../../store/customs.js";
import {idsTakenElsewhere, resolveSlot} from "../../store/slots.js";
import {swapSlot, lastTimeFor} from "../../store/session.js";
import {shortDate} from "../../rules/format.js";
import {el, escapeHtml} from "../dom.js";
import {actionButton, confirmButton} from "../controls.js";
import {openSheet, closeSheet, closeAfterPick, sheetGroup, sheetEntry} from "./sheet.js";

let openSlot = null;

function pick(slot, id, item = null){
  if(!swapSlot(slot, id)) return false;
  if(item) closeAfterPick(item);
  else closeSheet();
  return true;
}

function lastDate(id){
  const last = lastTimeFor(id);
  return last ? "last " + shortDate(last.date) : "";
}

function slotTag(slot, id){
  if(id === resolveSlot(slot, state.current.swaps).id) return '<b class="tag sheet-tag in-use">in use</b>';
  return id === slot.id ? '<b class="tag sheet-tag">program</b>' : "";
}

const inUseClass = (slot, id) => id === resolveSlot(slot, state.current.swaps).id ? " in-use" : "";

function exerciseRow(slot, id){
  const button = el("button", "sheet-item" + inUseClass(slot, id));
  const when = lastDate(id);
  button.innerHTML = `<span>${escapeHtml(exerciseName(id))}</span>${slotTag(slot, id)}${when ? `<em>${when}</em>` : ""}`;
  button.addEventListener("click", () => pick(slot, id, button));
  return button;
}

function customRow(slot, id, taken){
  const use = el("button", "pick" + inUseClass(slot, id));
  use.innerHTML = `${escapeHtml(state.customNames[id])}${slotTag(slot, id)}`;
  use.disabled = taken.has(id);
  if(use.disabled) use.title = "Already in this session";
  use.addEventListener("click", () => pick(slot, id, use));

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

  const browse = el("button", "sheet-item sheet-browse");
  browse.innerHTML = '<span>Browse all exercises</span><i class="icon">expand_more</i>';
  browse.addEventListener("click", () => {
    browse.hidden = true;
    Object.keys(IDS_BY_PATTERN).filter(p => p !== pattern).forEach(other => {
      sheetGroup(other);
      offer(IDS_BY_PATTERN[other]);
    });
  });
  body.appendChild(browse);
}
