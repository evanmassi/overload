import {workoutOf} from "../rules/workouts.js";
import {state} from "../store/state.js";
import {loggedCount, sessionVolume, prescribedCount} from "../rules/progression.js";
import {resolvedExercises} from "../store/slots.js";
import {isLogged} from "../rules/sets.js";
import {previousSameWorkout, currentSets} from "../store/session.js";
import {elapsedLabel} from "../rules/format.js";
import {byId, el} from "./dom.js";

function setBarGroups(){
  const workout = workoutOf(state.current);
  if(!workout) return [];
  let reached = false;
  return resolvedExercises(workout, state.current.swaps).map(exercise => {
    const sets = currentSets(exercise.id);
    const marks = [];
    for(let i = 0; i < exercise.s; i++) marks.push(isLogged(sets[i]) ? "on" : "off");
    const here = !reached && marks.includes("off");
    if(here){
      reached = true;
      return marks.map(mark => mark === "off" ? "now" : mark);
    }
    return marks;
  });
}

function updateSetBar(groups, done, total){
  const bar = byId("setbar");
  if(!bar) return;
  const marks = groups.flat();
  const shape = groups.map(group => group.length).join(",");
  if(bar.dataset.shape !== shape){
    bar.innerHTML = "";
    marks.forEach(() => bar.appendChild(el("i", "tick")));
    bar.dataset.shape = shape;
  }
  const lead = marks.indexOf("now");
  marks.forEach((mark, i) => {
    const tick = bar.children[i];
    tick.dataset.state = mark;
    if(i === lead) tick.dataset.lead = "";
    else tick.removeAttribute("data-lead");
  });
  bar.setAttribute("aria-valuemax", String(total));
  bar.setAttribute("aria-valuenow", String(done));
  bar.setAttribute("aria-label", `${done} of ${total} sets logged`);
}

export function updateSaveBar(){
  const current = state.current;
  const total = prescribedCount(workoutOf(current));
  const count = loggedCount(current);
  const volume = sessionVolume(current);
  updateSetBar(setBarGroups(), count, total);

  byId("volume").textContent = volume ? `${volume.toLocaleString()} lb` : (count ? `${count} sets` : "0");
  byId("tally").textContent = `${count}/${total}`;

  if(!count){ byId("volnote").textContent = "nothing logged yet"; return; }

  const parts = [];
  const elapsed = elapsedLabel(current.startedAt, current.lastLoggedAt);
  if(elapsed) parts.push(elapsed);

  const previous = previousSameWorkout();
  if(previous){
    const before = sessionVolume(previous.session);
    if(before) parts.push(`${volume - before >= 0 ? "+" : ""}${(volume - before).toLocaleString()} vs ${previous.date.slice(5)}`);
  }
  byId("volnote").textContent = parts.length ? parts.join(" · ") : "first set in";
}
