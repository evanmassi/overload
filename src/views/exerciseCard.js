import {LOAD_LABEL, TREND_ICON, EFFORT_LEVELS, STALL_EXPOSURES} from "../data/constants.js";
import {restAfterSet} from "../rules/exercises.js";
import {state, notify} from "../store/state.js";
import {priorSets, suggestTarget, hasStalled, trend, backoffWeight} from "../rules/progression.js";
import {isHeld, holdLift, releaseLift} from "../store/holds.js";
import {MUSCLES} from "../data/muscles.js";
import {isLogged} from "../rules/sets.js";
import {setsFor, setEffort, logSet, swapSlot, nextRest} from "../store/session.js";
import {setRuns, setSummary, unitSuffix, unitName} from "../rules/format.js";
import {openSwapSheet} from "./sheets/swapSheet.js";
import {openHowTo} from "./sheets/howtoSheet.js";
import {start as startTimer, startWork, setIdleRest} from "./timer.js";
import {strandButton, strandIconButton} from "../strand/button.js";
import {strandField} from "../strand/field.js";
import {strandPanel} from "../strand/panel.js";
import {byId} from "./dom.js";
import {updateSaveBar} from "./saveBar.js";

let restAlreadyRunningFor = null;

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
    .map(run => `<b>${run.count > 1 ? `<i>${run.count}×</i>` : ""}${run.part}</b>`);
  const effort = (state.current.effort || {})[exercise.id];
  if(effort) chips.push(`<em>${effort}</em>`);
  return chips.join("");
}

function syncCard(exercise){
  const card = byId("main").querySelector("#card-" + exercise.id) ||
    document.getElementById("card-" + exercise.id);
  if(card && card.classList){
    const folded = isFolded(exercise);
    card.classList.toggle("done", folded);
    const summary = card.querySelector(".ex-summary");
    if(summary) summary.innerHTML = summaryFor(exercise);
    const fold = card.querySelector(".ex-fold");
    if(fold) fold.strandLabel(folded ? "expand_more" : "expand_less");
    if(card.panel) markDim(card.panel);
  }
}

function isComplete(exercise){
  const sets = state.current.entries[exercise.id];
  if(!sets) return false;
  let done = 0;
  for(let i = 0; i < exercise.s; i++) if(isLogged(sets[i])) done++;
  return done >= exercise.s;
}

function moveBlock(exercise, position, slot, notch){
  const move = document.createElement("div");
  move.className = "ex-move";
  move.id = "card-" + exercise.id;
  fillCard(move, exercise, position, slot, notch || (position ? String(position).padStart(2, "0") : ""));
  if(isFolded(exercise)) move.classList.add("done");
  return move;
}

function markDim(panel){
  panel.dataset.dim = panel.moves.every(move => move.classList.contains("done")) ? "on" : "off";
}

function ownMove(panel, move){
  move.panel = panel;
  (panel.moves = panel.moves || []).push(move);
  panel.appendChild(move);
}

export function exerciseCard(exercise, position, slot){
  const card = document.createElement("section");
  card.className = "ex";
  strandPanel(card);
  ownMove(card, moveBlock(exercise, position, slot));
  markDim(card);
  return card;
}

export function corePairCard(pair, index, slots){
  const card = document.createElement("section");
  card.className = "ex core";
  strandPanel(card);
  card.id = "card-core-" + index;
  pair.forEach((exercise, i) => {
    if(i) card.appendChild(Object.assign(document.createElement("div"), {className: "rule"}));
    ownMove(card, moveBlock(exercise, null, slots[i], i ? '<i class="icon">call_merge</i>' : "S" + (index + 1)));
  });
  markDim(card);
  return card;
}

function fillCard(card, exercise, position, slot, notch){
  slot = slot || exercise;
  const prior = priorSets(state.sessions, exercise.id, state.current.key, state.current.day);
  const unit = unitName(exercise);
  const suffix = unitSuffix(exercise);

  const head = document.createElement("div");
  head.className = "ex-head";
  head.innerHTML = `${notch ? `<span class="ex-num"><i class="ex-echo">${notch}</i>${notch}</span>` : ""}<h3 class="ex-name">${exercise.n}</h3>`;
  head.querySelector(".ex-name").addEventListener("click", () => openHowTo(exercise));

  const summary = document.createElement("span");
  summary.className = "ex-summary";
  summary.innerHTML = summaryFor(exercise);
  head.appendChild(summary);

  const swap = document.createElement("button");
  swap.className = "ex-swap";
  swap.title = exercise.swappedFrom ? "Undo swap" : "Swap exercise";
  strandIconButton(swap, {
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

  const fold = document.createElement("button");
  fold.className = "ex-fold";
  strandIconButton(fold, {
    icon: isFolded(exercise) ? "expand_more" : "expand_less",
    label: "Show or hide sets", tone: "secondary", ghost: true, size: 30, glyph: 18,
    key: "fold:" + exercise.id
  });
  fold.addEventListener("click", () => flipFold(exercise));
  head.appendChild(fold);
  card.appendChild(head);

  const meta = document.createElement("div");
  meta.className = "meta";
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
    const band = document.createElement("div");
    band.className = "target";
    band.innerHTML = `<span>go for</span><b>${target.label}</b><i>${target.why}</i>`;
    card.appendChild(band);
  }

  if(held) card.appendChild(holdNotice(exercise));
  else if(!exercise.stray && hasStalled(state.sessions, exercise, state.current.key, state.current.day))
    card.appendChild(stallPrompt(exercise, slot, prior));

  const sets = document.createElement("div");
  sets.className = "sets";
  const logged = setsFor(exercise.id);

  const columns = document.createElement("div");
  columns.className = "set head";
  columns.innerHTML = `<div>${exercise.core || exercise.win ? "rd" : "#"}</div><div>${exercise.load === "level" ? "level" : "weight (lbs)"}</div><div></div><div>${unit}</div>`;
  const timeCell = document.createElement("div");
  const windowSeconds = workWindowSeconds(exercise);
  if(windowSeconds) timeCell.appendChild(workWindowButton(exercise, windowSeconds));
  columns.append(timeCell, document.createElement("div"));
  sets.appendChild(columns);

  const refreshers = [];
  const refreshRepeats = () => refreshers.forEach(fn => fn());
  for(let i = 0; i < exercise.s; i++)
    sets.appendChild(setRow(exercise, i, logged, prior, refreshers, refreshRepeats));
  card.appendChild(sets);
  if(position) card.appendChild(effortRow(exercise));

  if(prior){
    const foot = document.createElement("p");
    foot.className = "ex-cue prior";
    foot.textContent = `${prior.date} — ${setSummary(prior.sets, suffix)}`;
    card.appendChild(foot);
  }
}

function workWindowSeconds(exercise){
  if(exercise.win) return exercise.win;
  return exercise.unit === "sec" ? Number(exercise.r) || 0 : 0;
}

function liveRows(exercise){
  const card = byId("main").querySelector("#card-" + exercise.id) || document.getElementById("card-" + exercise.id);
  if(!card || !card.querySelectorAll) return [];
  return [...card.querySelectorAll(".set")].filter(row => row.logSeconds);
}

function workWindowButton(exercise, seconds){
  const button = document.createElement("button");
  button.className = "ex-time";
  const label = `Time ${seconds}s`;
  strandIconButton(button, {
    icon: "timer", label, tone: "primary", ghost: true, size: 30, glyph: 18,
    key: "time:" + exercise.id
  });
  button.title = label;
  button.addEventListener("click", () => {
    const index = liveRows(exercise).findIndex(row => !row.hasReps());
    if(index < 0) return;
    restAlreadyRunningFor = null;
    startWork(seconds, () => {
      if(!exercise.win){ logSecondsInto(exercise, index, seconds); return; }
      restAlreadyRunningFor = exercise.id + ":" + index;
      startTimer(restAfterSet(exercise, index));
    });
  });
  return button;
}

function logSecondsInto(exercise, index, seconds){
  const row = liveRows(exercise)[index];
  if(row){ row.logSeconds(seconds); return; }
  const existing = (state.current.entries[exercise.id] || [])[index];
  if(isLogged(existing)) return;
  logSet(exercise, index, {w: (existing && existing.w) || "", r: String(seconds)});
  notify();
  startTimer(restAfterSet(exercise, index));
}

function stallAction(label, key, act){
  const button = document.createElement("button");
  strandButton(button, {label, tone: "secondary", ghost: true, key});
  button.addEventListener("click", act);
  return button;
}

function callout(tone, icon, title, body, actions){
  const box = document.createElement("div");
  box.className = "callout stall";
  box.dataset.tone = tone;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if(text) node.textContent = text;
    return node;
  };
  const inner = make("div", "callout-in");
  const text = make("span", "callout-text");
  const row = make("div", "stall-actions");
  actions.forEach(button => row.appendChild(button));
  text.append(make("span", "callout-title", title), make("span", "callout-body", body), row);
  inner.append(make("span", "callout-fill"), make("i", "icon callout-icon", icon), text);
  box.append(make("span", "callout-echo"), inner);
  return box;
}

function stallPrompt(exercise, slot, prior){
  const actions = [stallAction("swap", "stall-swap:" + exercise.id, () => openSwapSheet(slot))];
  const dropped = backoffWeight(prior.sets, exercise.bw);
  if(dropped){
    actions.push(stallAction(`drop to ${dropped}`, "stall-drop:" + exercise.id, () => {
      const first = (state.current.entries[exercise.id] || [])[0];
      logSet(exercise, 0, {w: String(dropped), r: (first && first.r) || ""});
      notify();
    }));
  }
  actions.push(stallAction("hold", "stall-hold:" + exercise.id, () => { holdLift(exercise.id); notify(); }));
  return callout("warning", "warning", "Stalled", `Same numbers ${STALL_EXPOSURES} sessions running.`, actions);
}

function holdNotice(exercise){
  const release = stallAction("push", "stall-release:" + exercise.id, () => { releaseLift(exercise.id); notify(); });
  return callout("secondary", "anchor", "Holding", "Match it. Beat it by 10% and the push comes back.", [release]);
}

function setRow(exercise, index, logged, prior, refreshers, refreshRepeats){
  const row = document.createElement("div");
  row.className = "set";
  const last = prior && prior.sets[index];
  const unit = unitName(exercise);

  const number = document.createElement("div");
  number.className = "set-n";
  number.textContent = exercise.core || exercise.win ? "R" + (index + 1) : index + 1;

  const weight = document.createElement("input");
  weight.type = "text";
  weight.inputMode = "decimal";
  weight.placeholder = last && last.w ? last.w : exercise.load === "level" ? "LVL" : exercise.bw ? "BW" : "WT";
  weight.value = (logged[index] && logged[index].w) || "";
  weight.setAttribute("aria-label", `${exercise.n} set ${index + 1} weight`);

  const times = document.createElement("div");
  times.className = "x";
  times.textContent = "×";

  const reps = document.createElement("input");
  reps.type = "text";
  reps.inputMode = "numeric";
  reps.placeholder = last && last.r ? last.r : unit.toUpperCase();
  reps.value = (logged[index] && logged[index].r) || "";
  reps.setAttribute("aria-label", `${exercise.n} set ${index + 1} ${unit}`);

  const delta = document.createElement("div");
  delta.className = "delta";

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
    const wasComplete = isComplete(exercise);
    const newlyLogged = logSet(exercise, index, {w: weight.value.trim(), r: reps.value.trim()});
    if(isComplete(exercise) !== wasComplete) state.foldFlips.delete(exercise.id);
    paint();
    syncCard(exercise);
    updateSaveBar();
    setIdleRest(nextRest());
    refreshRepeats();
    if(!newlyLogged) return;
    const restRunning = restAlreadyRunningFor === exercise.id + ":" + index;
    restAlreadyRunningFor = null;
    if(!restRunning) startTimer(restAfterSet(exercise, index));
  };

  row.hasReps = () => !!reps.value.trim();
  row.logSeconds = seconds => { reps.value = String(seconds); commit(); };

  [weight, reps].forEach(input => {
    input.addEventListener("input", paint);
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
  });

  const carryFrom = () => index === 0
    ? last
    : (state.current.entries[exercise.id] || [])[index - 1];

  const repeat = document.createElement("button");
  repeat.className = "repeat";
  strandIconButton(repeat, {
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
  row.append(number, strandField(weight), times, strandField(reps), repeat, delta);
  return row;
}

function effortRow(exercise){
  const row = document.createElement("div");
  row.className = "effort";
  const chosen = (state.current.effort || {})[exercise.id];
  const label = document.createElement("span");
  label.textContent = "How did that feel?";
  row.appendChild(label);
  EFFORT_LEVELS.forEach(level => {
    const button = document.createElement("button");
    button.addEventListener("click", () => setEffort(exercise.id, level));
    strandButton(button, {label: level, tone: "secondary", key: "effort:" + exercise.id + ":" + level});
    button.dataset.chosen = chosen === level ? "on" : "off";
    row.appendChild(button);
  });
  return row;
}
