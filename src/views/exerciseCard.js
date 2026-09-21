import {LOAD_LABEL, TREND_ICON, EFFORT_LEVELS, STALL_EXPOSURES} from "../data/constants.js";
import {MUSCLES} from "../data/muscles.js";
import {restAfterSet} from "../rules/exercises.js";
import {priorSets, suggestTarget, hasStalled, trend, backoffWeight} from "../rules/progression.js";
import {isLogged} from "../rules/sets.js";
import {setRuns, setSummary, unitSuffix, unitName} from "../rules/format.js";
import {state, changes} from "../store/state.js";
import {isHeld, holdExercise, releaseExercise} from "../store/holds.js";
import {setsFor, setEffort, logSet, swapSlot, nextRest, openSetIndex} from "../store/session.js";
import {makeIconButton} from "../ui/button.js";
import {makeField} from "../ui/field.js";
import {makePanel} from "../ui/panel.js";
import {byId, el, escapeHtml} from "./dom.js";
import {actionButton, choiceRow} from "./controls.js";
import {openSwapSheet} from "./sheets/swapSheet.js";
import {openHowTo} from "./sheets/howtoSheet.js";
import {start as startTimer, startWork, setIdleRest, restRunningFor} from "./timer.js";
import {updateSaveBar} from "./saveBar.js";

function isFolded(exercise){
  return isComplete(exercise) !== state.foldFlips.has(exercise.id);
}

function flipFold(exercise){
  const flips = state.foldFlips;
  flips.has(exercise.id) ? flips.delete(exercise.id) : flips.add(exercise.id);
  syncCard(exercise);
}

function summaryFor(exercise){
  const chips = setRuns(state.current.entries[exercise.id], unitSuffix(exercise))
    .map(run => `<b>${run.count > 1 ? `<i>${run.count}×</i>` : ""}${escapeHtml(run.part)}</b>`);
  const effort = (state.current.effort || {})[exercise.id];
  if(effort) chips.push(`<em>${effort}</em>`);
  return chips.join("");
}

function syncCard(exercise){
  const move = byId("main").querySelector("#card-" + exercise.id);
  if(!move) return;
  const folded = isFolded(exercise);
  move.classList.toggle("done", folded);
  move.querySelector(".ex-summary").innerHTML = summaryFor(exercise);
  move.querySelector(".ex-fold").setLabel(folded ? "expand_more" : "expand_less");
  markDim(move.closest(".ex"));
}

function isComplete(exercise){ return openSetIndex(exercise) < 0; }

const setTag = (exercise, index) => exercise.id + ":" + index;

function recordSet(exercise, index, set){
  const wasComplete = isComplete(exercise);
  const newlyLogged = logSet(exercise, index, set);
  if(isComplete(exercise) !== wasComplete) state.foldFlips.delete(exercise.id);
  return newlyLogged;
}

function startRestAfter(exercise, index){
  const tag = setTag(exercise, index);
  if(!restRunningFor(tag)) startTimer(restAfterSet(exercise, index), tag);
}

function exerciseItem(exercise, position, slot, notch){
  const move = el("div", "ex-item");
  move.id = "card-" + exercise.id;
  fillCard(move, exercise, position, slot, notch || (position ? String(position).padStart(2, "0") : ""));
  if(isFolded(exercise)) move.classList.add("done");
  return move;
}

function markDim(panel){
  panel.dataset.dim = [...panel.querySelectorAll(".ex-item")].every(move => move.classList.contains("done")) ? "on" : "off";
}

export function exerciseCard(exercise, position, slot){
  const card = el("section", "ex");
  makePanel(card);
  card.appendChild(exerciseItem(exercise, position, slot));
  markDim(card);
  return card;
}

export function corePairCard(pair, index, slots){
  const card = el("section", "ex core");
  makePanel(card);
  card.id = "card-core-" + index;
  pair.forEach((exercise, i) => {
    if(i) card.appendChild(el("div", "rule"));
    card.appendChild(exerciseItem(exercise, null, slots[i], i ? '<i class="icon">call_merge</i>' : "S" + (index + 1)));
  });
  markDim(card);
  return card;
}

function fillCard(card, exercise, position, slot, notch){
  slot = slot || exercise;
  const prior = priorSets(state.sessions, exercise.id, state.current.key, state.current.day);
  const unit = unitName(exercise);
  const suffix = unitSuffix(exercise);

  const head = el("div", "ex-head");
  head.innerHTML = `${notch ? `<span class="ex-num"><i class="ex-echo">${notch}</i>${notch}</span>` : ""}<h3 class="ex-name">${escapeHtml(exercise.n)}</h3>`;
  head.querySelector(".ex-name").addEventListener("click", () => openHowTo(exercise));

  const summary = el("span", "ex-summary");
  summary.innerHTML = summaryFor(exercise);
  head.appendChild(summary);

  const swap = el("button", "ex-swap");
  swap.title = exercise.swappedFrom ? "Undo swap" : "Swap exercise";
  makeIconButton(swap, {
    icon: exercise.swappedFrom ? "undo" : "swap_horiz",
    label: swap.title, tone: "primary", ghost: true, size: 30, glyph: 18,
    key: "swap:" + exercise.id
  });
  swap.addEventListener("click", () => {
    if(exercise.swappedFrom) swapSlot(slot, slot.id);
    else openSwapSheet(slot);
  });
  if(!exercise.stray) head.appendChild(swap);
  if(exercise.swappedFrom) card.classList.add("ex-swapped");

  const fold = el("button", "ex-fold");
  makeIconButton(fold, {
    icon: isFolded(exercise) ? "expand_more" : "expand_less",
    label: "Show or hide sets", tone: "secondary", ghost: true, size: 30, glyph: 18,
    key: "fold:" + exercise.id
  });
  fold.addEventListener("click", () => flipFold(exercise));
  head.appendChild(fold);
  card.appendChild(head);

  const meta = el("div", "meta");
  let chips = "";
  if(exercise.per) chips += `<span class="tag side">per ${exercise.per}</span>`;
  if(LOAD_LABEL[exercise.load]) chips += `<span class="tag">${LOAD_LABEL[exercise.load]}</span>`;
  const worked = MUSCLES[exercise.id];
  if(worked) chips += `<span class="tag muscle">${worked.p.join(" · ")}</span>`;
  const prescription = exercise.r ? `${exercise.s} × ${exercise.r}${suffix}` : `${exercise.s} logged`;
  const line = exercise.win
      ? `<span>${exercise.s} rounds × ${exercise.win}s on</span><span class="dot">·</span><span>${exercise.rest}s off</span>`
      : `<span>${prescription}</span><span class="dot">·</span><span>rest ${exercise.rest}s</span>`;
  meta.innerHTML = `<div class="meta-chips">${chips}</div><div class="meta-line">${line}</div>`;
  card.appendChild(meta);

  const held = isHeld(exercise.id);
  const target = suggestTarget(exercise, prior, held);
  if(target){
    const band = el("div", "target");
    band.innerHTML = `<span>go for</span><b>${target.label}</b><i>${target.why}</i>`;
    card.appendChild(band);
  }

  if(held) card.appendChild(holdNotice(exercise));
  else if(!exercise.stray && hasStalled(state.sessions, exercise, state.current.key, state.current.day))
    card.appendChild(stallPrompt(exercise, slot, prior));

  const sets = el("div", "sets");
  const logged = setsFor(exercise.id);

  const columns = el("div", "set head");
  columns.innerHTML = `<div>${exercise.core || exercise.win ? "rd" : "#"}</div><div>${exercise.load === "level" ? "level" : "weight (lbs)"}</div><div></div><div>${unit}</div>`;
  const timeCell = el("div");
  const windowSeconds = workWindowSeconds(exercise);
  if(windowSeconds) timeCell.appendChild(workWindowButton(exercise, windowSeconds));
  columns.append(timeCell, el("div"));
  sets.appendChild(columns);

  const refreshers = [];
  const refreshRepeats = () => refreshers.forEach(fn => fn());
  for(let i = 0; i < exercise.s; i++)
    sets.appendChild(setRow(exercise, i, logged, prior, refreshers, refreshRepeats));
  card.appendChild(sets);
  if(position) card.appendChild(effortRow(exercise));

  if(prior){
    card.appendChild(el("p", "ex-cue prior", `${prior.date} — ${setSummary(prior.sets, suffix)}`));
  }
}

function workWindowSeconds(exercise){
  if(exercise.win) return exercise.win;
  return exercise.unit === "sec" ? Number(exercise.r) || 0 : 0;
}

function workWindowButton(exercise, seconds){
  const button = el("button", "ex-time");
  const label = `Time ${seconds}s`;
  makeIconButton(button, {
    icon: "timer", label, tone: "primary", ghost: true, size: 30, glyph: 18,
    key: "time:" + exercise.id
  });
  button.title = label;
  button.addEventListener("click", () => {
    const index = openSetIndex(exercise);
    if(index < 0) return;
    startWork(seconds, () => {
      if(exercise.win) startRestAfter(exercise, index);
      else logTimedSet(exercise, index, seconds);
    });
  });
  return button;
}

function logTimedSet(exercise, index, seconds){
  const existing = (state.current.entries[exercise.id] || [])[index];
  if(isLogged(existing)) return;
  recordSet(exercise, index, {w: (existing && existing.w) || "", r: String(seconds)});
  changes.notify();
  startRestAfter(exercise, index);
}

function stallAction(label, key, act){
  return actionButton(label, {tone: "secondary", ghost: true, key}, act);
}

function callout(tone, icon, title, body, actions){
  const box = el("div", "callout stall");
  box.dataset.tone = tone;
  const inner = el("div", "callout-in");
  const text = el("span", "callout-text");
  const row = el("div", "stall-actions");
  actions.forEach(button => row.appendChild(button));
  text.append(el("span", "callout-title", title), el("span", "callout-body", body), row);
  inner.append(el("span", "callout-fill"), el("i", "icon callout-icon", icon), text);
  box.append(el("span", "callout-echo"), inner);
  return box;
}

function stallPrompt(exercise, slot, prior){
  const actions = [stallAction("swap", "stall-swap:" + exercise.id, () => openSwapSheet(slot))];
  const dropped = backoffWeight(prior.sets, exercise.bw);
  if(dropped){
    actions.push(stallAction(`drop to ${dropped}`, "stall-drop:" + exercise.id, () => {
      const first = (state.current.entries[exercise.id] || [])[0];
      logSet(exercise, 0, {w: String(dropped), r: (first && first.r) || ""});
      changes.notify();
    }));
  }
  actions.push(stallAction("hold", "stall-hold:" + exercise.id, () => { holdExercise(exercise.id); changes.notify(); }));
  return callout("warning", "warning", "Stalled", `Same numbers ${STALL_EXPOSURES} sessions running.`, actions);
}

function holdNotice(exercise){
  const release = stallAction("push", "stall-release:" + exercise.id, () => { releaseExercise(exercise.id); changes.notify(); });
  return callout("secondary", "anchor", "Holding", "Match it. Beat it by 10% and the push comes back.", [release]);
}

function setRow(exercise, index, logged, prior, refreshers, refreshRepeats){
  const row = el("div", "set");
  const last = prior && prior.sets[index];
  const unit = unitName(exercise);

  const number = el("div", "set-n", exercise.core || exercise.win ? "R" + (index + 1) : index + 1);

  const weight = el("input");
  weight.type = "text";
  weight.inputMode = "decimal";
  weight.placeholder = last && last.w ? last.w : exercise.load === "level" ? "LVL" : exercise.bw ? "BW" : "WT";
  weight.value = (logged[index] && logged[index].w) || "";
  weight.setAttribute("aria-label", `${exercise.n} set ${index + 1} weight`);

  const times = el("div", "x", "×");

  const reps = el("input");
  reps.type = "text";
  reps.inputMode = "numeric";
  reps.placeholder = last && last.r ? last.r : unit.toUpperCase();
  reps.value = (logged[index] && logged[index].r) || "";
  reps.setAttribute("aria-label", `${exercise.n} set ${index + 1} ${unit}`);

  const delta = el("div", "delta");

  const paint = () => {
    weight.classList.toggle("filled", !!weight.value);
    reps.classList.toggle("filled", !!reps.value);
    number.classList.toggle("done", !!reps.value);
    const entered = {w: weight.value.trim(), r: reps.value.trim()};
    if(!isLogged(entered)){ delta.className = "delta none"; delta.textContent = last ? "—" : ""; return; }
    if(!isLogged(last)){ delta.className = "delta up"; delta.textContent = "new"; return; }
    const direction = trend(entered, last, exercise.bw);
    delta.className = "delta " + direction;
    delta.innerHTML = TREND_ICON[direction];
  };

  const commit = () => {
    const newlyLogged = recordSet(exercise, index, {w: weight.value.trim(), r: reps.value.trim()});
    paint();
    syncCard(exercise);
    updateSaveBar();
    setIdleRest(nextRest());
    refreshRepeats();
    if(newlyLogged) startRestAfter(exercise, index);
  };

  [weight, reps].forEach(input => {
    input.addEventListener("input", paint);
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
  });

  const carryFrom = () => index === 0
    ? last
    : (state.current.entries[exercise.id] || [])[index - 1];

  const repeat = el("button", "repeat");
  makeIconButton(repeat, {
    icon: "replay", tone: "primary", ghost: true, size: 30, glyph: 18,
    key: "repeat:" + exercise.id + ":" + index
  });

  const refreshRepeat = () => {
    const source = carryFrom();
    repeat.disabled = !isLogged(source);
    repeat.title = repeat.disabled
      ? (index === 0 ? "Nothing logged last time" : `Log set ${index} first`)
      : "Fill with " + (source.w ? source.w + " \u00d7 " : "") + source.r;
    repeat.setAttribute("aria-label", repeat.title);
  };

  repeat.addEventListener("click", () => {
    const source = carryFrom();
    if(!isLogged(source)) return;
    weight.value = source.w || "";
    reps.value = source.r;
    commit();
  });

  refreshers.push(refreshRepeat);
  refreshRepeat();
  paint();
  row.append(number, makeField(weight), times, makeField(reps), repeat, delta);
  return row;
}

function effortRow(exercise){
  const chosen = (state.current.effort || {})[exercise.id];
  return choiceRow("effort", EFFORT_LEVELS.map(level => ({
    label: level,
    key: "effort:" + exercise.id + ":" + level,
    chosen: chosen === level,
    onPick: () => setEffort(exercise.id, level)
  })), {label: "How did that feel?"});
}
