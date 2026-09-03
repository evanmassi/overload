import {BLOCKS, DAY_KEYS, DAYS, LOAD_LABEL, ICON_SWAP, ICON_UNDO, ICON_REPEAT,
        EFFORT_LEVELS, STALL_EXPOSURES, STALL_BACKOFF_PERCENT} from "./constants.js";
import {workoutFor, allExercises} from "./movements.js";
import {state, notify} from "./state.js";
import {score, loggedCount, priorSets, sessionVolume, suggestTarget,
        prescribedCount, hasStalled} from "./progression.js";
import {cycleNumber, cycleStart, sessionsDoneIn} from "./rotation.js";
import {resolveSlot} from "./swaps.js";
import {loadDate, setBlockIndex, setDay, setsFor, queueSave, previousSameWorkout,
        setEffort, markLogged} from "./session.js";
import {setSummary, elapsedLabel, unitSuffix} from "./format.js";
import {renderHistory} from "./history.js";
import {renderProgress} from "./progress.js";
import {openSwapSheet, openHowTo} from "./sheet.js";
import {start as startTimer, setIdleRest} from "./timer.js";
const el = id => document.getElementById(id);

function toggleExpanded(id){
  state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
}

export function render(){
  const main = el("main");
  main.innerHTML = "";
  if(state.view === "log") renderLog(main);
  else if(state.view === "history") renderHistory(main);
  else renderProgress(main);
  updateFooter();
  document.querySelectorAll(".tab").forEach(tab =>
    tab.setAttribute("aria-selected", String(tab.dataset.view === state.view)));
}

function renderLog(main){
  const current = state.current;

  const bar = document.createElement("div");
  bar.className = "daybar";
  const date = document.createElement("input");
  date.type = "date";
  date.className = "date-input";
  date.value = current.date;
  date.addEventListener("change", () => { if(date.value) loadDate(date.value); });

  const blocks = document.createElement("div");
  blocks.className = "blockset";
  const start = cycleStart(current.blockIndex);
  BLOCKS.forEach((letter, i) => {
    const button = document.createElement("button");
    button.textContent = letter;
    button.title = `Week ${letter}`;
    button.setAttribute("aria-pressed", String(letter === current.block));
    button.addEventListener("click", () => { setBlockIndex(start + i); queueSave(); notify(); });
    blocks.appendChild(button);
  });
  bar.append(date, blocks);
  main.appendChild(bar);

  const done = sessionsDoneIn(state.sessions, current.blockIndex);
  const days = document.createElement("div");
  days.className = "blockset sessions";
  DAY_KEYS.forEach(day => {
    const button = document.createElement("button");
    const isDone = done.has(day) && day !== current.day;
    button.innerHTML = `<span>${DAYS[day].short}</span><small class="${isDone ? "done" : ""}">${isDone ? "done" : ""}</small>`;
    button.setAttribute("aria-pressed", String(day === current.day));
    button.addEventListener("click", () => { setDay(day); queueSave(); notify(); });
    days.appendChild(button);
  });
  main.appendChild(days);

  const plan = workoutFor(current.block, current.day);
  const remaining = DAY_KEYS.length - done.size;
  const head = document.createElement("div");
  head.className = "dayhead";
  head.innerHTML = `<p class="eyebrow"><b>Week ${current.block}</b> · Cycle ${cycleNumber(current.blockIndex)} · ${remaining > 0 ? `${remaining} left this week` : "week complete"}</p><h2>${plan.focus}</h2><p>${plan.cue}</p>`;
  main.appendChild(head);

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `<span><em class="ghost">45</em> last time</span><span><em class="up">▲</em> beat it</span><span><em class="same">=</em> matched</span>`;
  main.appendChild(legend);

  plan.ex.forEach((slot, i) => main.appendChild(exerciseCard(resolveSlot(slot), i + 1, slot)));

  if(plan.core){
    const label = document.createElement("p");
    label.className = "section-label";
    label.textContent = "Core finisher · 3 supersets, 2 rounds each";
    main.appendChild(label);
    plan.core.forEach((pair, i) => main.appendChild(corePairCard(pair.map(resolveSlot), i, pair)));
  }

  main.appendChild(notesCard());
}

function summaryFor(exercise){
  return setSummary(state.current.entries[exercise.id], unitSuffix(exercise));
}

function syncCard(exercise){
  const card = el("main").querySelector("#card-" + exercise.id) ||
    document.getElementById("card-" + exercise.id);
  if(card && card.classList){
    card.classList.toggle("done", isComplete(exercise) && !state.expanded.has(exercise.id));
    const summary = card.querySelector(".ex-summary");
    if(summary) summary.textContent = summaryFor(exercise);
  }
}

function isComplete(exercise){
  const sets = state.current.entries[exercise.id];
  if(!sets) return false;
  let done = 0;
  for(let i = 0; i < exercise.s; i++) if(sets[i] && sets[i].r) done++;
  return done >= exercise.s;
}

function moveBlock(exercise, position, slot, partnerName){
  const move = document.createElement("div");
  move.className = "ex-move";
  move.id = "card-" + exercise.id;
  fillCard(move, exercise, position, slot, partnerName);
  if(isComplete(exercise) && !state.expanded.has(exercise.id)) move.classList.add("done");
  return move;
}

function exerciseCard(exercise, position, slot){
  const card = document.createElement("section");
  card.className = "ex";
  card.appendChild(moveBlock(exercise, position, slot));
  return card;
}

function corePairCard(pair, index, slots){
  const card = document.createElement("section");
  card.className = "ex core";
  card.id = "card-core-" + index;
  const badge = document.createElement("div");
  badge.className = "superset";
  badge.innerHTML = `<b>Superset ${index + 1}</b><span>alternate the two moves</span>`;
  card.appendChild(badge);
  pair.forEach((exercise, i) => {
    if(i) card.appendChild(Object.assign(document.createElement("div"), {className: "rule"}));
    card.appendChild(moveBlock(exercise, null, slots[i], i ? null : pair[1].n));
  });
  return card;
}

function fillCard(card, exercise, position, slot, partnerName){
  slot = slot || exercise;
  const prior = priorSets(state.sessions, exercise.id, state.current.date);
  const unit = exercise.unit === "sec" ? "sec" : "reps";
  const suffix = unitSuffix(exercise);

  const head = document.createElement("div");
  head.className = "ex-head";
  head.innerHTML = `${position ? `<span class="ex-num">${String(position).padStart(2, "0")}</span>` : ""}<h3 class="ex-name">${exercise.n}</h3>`;
  head.querySelector(".ex-name").addEventListener("click", () => openHowTo(exercise));

  const summary = document.createElement("span");
  summary.className = "ex-summary";
  summary.textContent = summaryFor(exercise);
  head.appendChild(summary);

  const fold = document.createElement("button");
  fold.className = "ex-fold";
  fold.setAttribute("aria-label", "Show or hide sets");
  fold.addEventListener("click", () => { toggleExpanded(exercise.id); notify(); });
  head.appendChild(fold);

  const swap = document.createElement("button");
  swap.className = "ex-swap";
  swap.title = exercise.swappedFrom ? "Undo swap" : "Swap exercise";
  swap.setAttribute("aria-label", swap.title);
  swap.innerHTML = exercise.swappedFrom ? ICON_UNDO : ICON_SWAP;
  swap.addEventListener("click", () => {
    if(exercise.swappedFrom){
      delete state.current.swaps[exercise.swappedFrom];
      queueSave();
      notify();
    } else openSwapSheet(slot);
  });
  head.appendChild(swap);
  if(exercise.swappedFrom) card.classList.add("ex-swapped");
  card.appendChild(head);

  const meta = document.createElement("div");
  meta.className = "meta";
  if(exercise.per) meta.innerHTML += `<span class="tag side">per ${exercise.per}</span>`;
  meta.innerHTML += `<span class="tag">${LOAD_LABEL[exercise.load]}</span>`;
  meta.innerHTML += exercise.core
    ? `<span>${exercise.s} rounds × ${exercise.r}${suffix}</span><span class="dot">·</span><span>${partnerName ? "straight into " + partnerName : `rest ${exercise.rest}s between rounds`}</span>`
    : `<span>${exercise.s} × ${exercise.r}${suffix}</span><span class="dot">·</span><span>rest ${exercise.rest}s</span>`;
  card.appendChild(meta);

  const target = suggestTarget(exercise, prior);
  if(target){
    const band = document.createElement("div");
    band.className = "target";
    band.innerHTML = `<span>go for</span><b>${target.label}</b><i>${target.why}</i>`;
    card.appendChild(band);
  }

  if(hasStalled(state.sessions, exercise, state.current.date)){
    const flag = document.createElement("p");
    flag.className = "stall";
    flag.textContent = `Stuck here ${STALL_EXPOSURES} sessions running. Swap it, or drop ${STALL_BACKOFF_PERCENT}% and build back up.`;
    card.appendChild(flag);
  }

  const sets = document.createElement("div");
  sets.className = "sets";
  const logged = setsFor(exercise.id);

  const columns = document.createElement("div");
  columns.className = "set head";
  columns.innerHTML = `<div>${exercise.core ? "rd" : "#"}</div><div>weight (lbs)</div><div></div><div>${unit}</div><div></div><div></div>`;
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

function setRow(exercise, index, logged, prior, refreshers, refreshRepeats){
  const row = document.createElement("div");
  row.className = "set";
  const last = prior && prior.sets[index];
  const unit = exercise.unit === "sec" ? "sec" : "reps";

  const number = document.createElement("div");
  number.className = "set-n";
  number.textContent = exercise.core ? "R" + (index + 1) : index + 1;

  const weight = document.createElement("input");
  weight.type = "text";
  weight.inputMode = "decimal";
  weight.placeholder = last && last.w ? last.w : (exercise.bw ? "BW" : "wt");
  weight.value = (logged[index] && logged[index].w) || "";
  weight.setAttribute("aria-label", `${exercise.n} set ${index + 1} weight`);

  const times = document.createElement("div");
  times.className = "x";
  times.textContent = "×";

  const reps = document.createElement("input");
  reps.type = "text";
  reps.inputMode = "numeric";
  reps.placeholder = last && last.r ? last.r : unit;
  reps.value = (logged[index] && logged[index].r) || "";
  reps.setAttribute("aria-label", `${exercise.n} set ${index + 1} ${unit}`);

  const delta = document.createElement("div");
  delta.className = "delta";

  const paint = () => {
    weight.classList.toggle("filled", !!weight.value);
    reps.classList.toggle("filled", !!reps.value);
    number.classList.toggle("done", !!reps.value);
    const entered = {w: weight.value.trim(), r: reps.value.trim()};
    if(!entered.r){ delta.className = "delta none"; delta.textContent = last ? "—" : ""; return; }
    if(!last || !last.r){ delta.className = "delta up"; delta.textContent = "new"; return; }
    const now = score(entered, exercise.bw);
    const then = score(last, exercise.bw);
    if(now > then){ delta.className = "delta up"; delta.textContent = "▲"; }
    else if(now === then){ delta.className = "delta same"; delta.textContent = "="; }
    else { delta.className = "delta down"; delta.textContent = "▼"; }
  };

  const commit = () => {
    const sets = setsFor(exercise.id);
    while(sets.length <= index) sets.push({w: "", r: ""});
    const hadReps = !!sets[index].r;
    sets[index] = {w: weight.value.trim(), r: reps.value.trim()};
    if(sets[index].r) markLogged();
    paint();
    syncCard(exercise);
    updateFooter();
    refreshRepeats();
    queueSave();
    if(!hadReps && sets[index].r)
      startTimer(index + 1 >= exercise.s ? exercise.restAfter : exercise.rest);
  };

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
  repeat.innerHTML = ICON_REPEAT;

  const refreshRepeat = () => {
    const source = carryFrom();
    repeat.disabled = !source || !source.r;
    repeat.title = repeat.disabled
      ? (index === 0 ? "Nothing logged last time" : `Log set ${index} first`)
      : "Fill with " + (source.w ? source.w + " \u00d7 " : "") + source.r;
    repeat.setAttribute("aria-label", repeat.title);
  };

  repeat.addEventListener("click", () => {
    const source = carryFrom();
    if(!source || !source.r) return;
    weight.value = source.w || "";
    reps.value = source.r;
    commit();
  });

  refreshers.push(refreshRepeat);
  refreshRepeat();
  paint();
  row.append(number, weight, times, reps, repeat, delta);
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
    button.textContent = level;
    button.className = chosen === level ? "on" : "";
    button.addEventListener("click", () => setEffort(exercise.id, level));
    row.appendChild(button);
  });
  return row;
}

function notesCard(){
  const box = document.createElement("div");
  box.className = "notes";
  const label = document.createElement("label");
  label.textContent = "Session notes";
  label.setAttribute("for", "notes");
  const area = document.createElement("textarea");
  area.id = "notes";
  area.value = state.current.notes || "";
  area.placeholder = "How it felt, what was occupied, anything worth remembering next cycle.";
  const save = () => { state.current.notes = area.value; queueSave(); };
  area.addEventListener("change", save);
  area.addEventListener("blur", save);
  box.append(label, area);
  return box;
}

function updateSetBar(done, total){
  const bar = el("setbar");
  if(!bar) return;
  if(bar.children.length !== total){
    bar.innerHTML = "";
    for(let i = 0; i < total; i++)
      bar.appendChild(Object.assign(document.createElement("i"), {className: "tick"}));
  }
  for(let i = 0; i < total; i++)
    if(bar.children[i]) bar.children[i].classList.toggle("on", i < done);
  bar.setAttribute("aria-valuemax", String(total));
  bar.setAttribute("aria-valuenow", String(done));
  bar.setAttribute("aria-label", `${done} of ${total} sets logged`);
}

function nextRestSeconds(){
  const plan = workoutFor(state.current.block, state.current.day);
  if(!plan) return null;
  for(const exercise of allExercises(plan).map(resolveSlot)){
    const sets = state.current.entries[exercise.id] || [];
    for(let i = 0; i < exercise.s; i++)
      if(!(sets[i] && sets[i].r))
        return i + 1 >= exercise.s ? exercise.restAfter : exercise.rest;
  }
  return null;
}

function updateFooter(){
  const current = state.current;
  const pending = nextRestSeconds();
  if(pending) setIdleRest(pending);

  const total = prescribedCount(current.block, current.day);
  const count = loggedCount(current);
  const volume = sessionVolume(current, current.block, current.day);
  updateSetBar(count, total);

  el("volume").textContent = volume ? `${volume.toLocaleString()} lb` : (count ? `${count} sets` : "0");
  el("tally").textContent = `${count}/${total}`;

  if(!count){ el("volnote").textContent = "nothing logged yet"; return; }

  const parts = [];
  const elapsed = elapsedLabel(current.startedAt, current.lastLoggedAt);
  if(elapsed) parts.push(elapsed);

  const previous = previousSameWorkout();
  if(previous){
    const before = sessionVolume(previous.session, previous.session.block, previous.session.day);
    if(before) parts.push(`${volume - before >= 0 ? "+" : ""}${(volume - before).toLocaleString()} vs ${previous.date.slice(5)}`);
  }
  el("volnote").textContent = parts.length ? parts.join(" · ") : "first set in";
}
