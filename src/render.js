import {BLOCKS, DAY_KEYS, OFF_KEYS, DAYS, LOAD_LABEL, ICON_UP, ICON_SAME, ICON_DOWN,
        EFFORT_LEVELS, STALL_EXPOSURES, STALL_BACKOFF_PERCENT,
        DEFAULT_REST} from "./constants.js";
import {workoutFor, allExercises, findExercise, isOffDay} from "./movements.js";
import {state, notify} from "./state.js";
import {score, loggedCount, priorSets, sessionVolume, suggestTarget,
        prescribedCount, hasStalled} from "./progression.js";
import {cycleNumber, cycleStart, sessionsDoneIn} from "./rotation.js";
import {resolveSlot, exerciseName} from "./swaps.js";
import {loadDate, setBlockIndex, setDay, setsFor, queueSave, previousSameWorkout,
        setEffort, markLogged} from "./session.js";
import {setRuns, setSummary, elapsedLabel, unitSuffix, unitName} from "./format.js";
import {renderHistory} from "./history.js";
import {renderProgress} from "./progress.js";
import {openSwapSheet, openHowTo} from "./sheet.js";
import {start as startTimer, setIdleRest} from "./timer.js";
import {strandButton, strandIconButton} from "./strand/button.js";
import {strandField} from "./strand/field.js";
import {strandPanel} from "./strand/panel.js";
const el = id => document.getElementById(id);

function isFolded(exercise){
  return isComplete(exercise) !== state.foldFlips.has(exercise.id);
}

function flipFold(exercise){
  const flips = state.foldFlips;
  flips.has(exercise.id) ? flips.delete(exercise.id) : flips.add(exercise.id);
  syncCard(exercise);
}

export function render(){
  const main = el("main");
  main.innerHTML = "";
  if(state.view === "log") renderLog(main);
  else if(state.view === "history") renderHistory(main);
  else renderProgress(main);
  updateFooter();
  document.querySelectorAll(".tab").forEach(tab => {
    const here = tab.dataset.view === state.view;
    tab.setAttribute("aria-selected", String(here));
    tab.dataset.chosen = here ? "on" : "off";
  });
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
  const dateField = strandField(date);

  const blocks = document.createElement("div");
  blocks.className = "blockset";
  const start = cycleStart(current.blockIndex);
  const offDay = isOffDay(current.day);
  BLOCKS.forEach((letter, i) => {
    const button = document.createElement("button");
    button.title = `${offDay ? "Version" : "Week"} ${letter}`;
    strandButton(button, {label: letter, tone: "secondary", ghost: true, key: "block:" + letter});
    button.dataset.chosen = letter === current.block ? "on" : "off";
    button.setAttribute("aria-pressed", String(letter === current.block));
    button.addEventListener("click", () => {
      setBlockIndex(start + i);
      queueSave();
      notify();
    });
    blocks.appendChild(button);
  });
  bar.append(dateField, blocks);
  main.appendChild(bar);

  const done = offDay ? new Set() : sessionsDoneIn(state.sessions, current.blockIndex);
  main.appendChild(dayRow("blockset sessions", DAY_KEYS, done));
  main.appendChild(dayRow("blockset offdays", OFF_KEYS, new Set()));

  const plan = workoutFor(current.block, current.day);
  const head = document.createElement("div");
  head.className = "dayhead";
  head.innerHTML = `<div class="dayhead-text"><p class="eyebrow"><b>${offDay ? "Version" : "Week"} ${current.block}</b> · Cycle ${cycleNumber(current.blockIndex)}</p><h2 data-text="${plan.focus}">${plan.focus}</h2></div>`;
  if(plan.travel) head.appendChild(placeSwitch(plan));
  main.appendChild(head);

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `<span><em class="ghost">45</em> last time</span><span><em class="up">${ICON_UP}</em> beat it</span><span><em class="same">${ICON_SAME}</em> matched</span><span><em class="down">${ICON_DOWN}</em> below</span>`;
  main.appendChild(legend);

  if(plan.sections){
    let position = 0;
    plan.sections.forEach(section => {
      const label = document.createElement("p");
      label.className = "section-label";
      label.textContent = sectionLabel(section);
      main.appendChild(label);
      section.ex.forEach(slot => main.appendChild(exerciseCard(resolveSlot(slot), ++position, slot)));
    });
  } else {
    plan.ex.forEach((slot, i) => main.appendChild(exerciseCard(resolveSlot(slot), i + 1, slot)));
  }

  if(plan.core){
    const label = document.createElement("p");
    label.className = "section-label";
    label.textContent = "Core finisher · 3 supersets, 2 rounds each";
    main.appendChild(label);
    plan.core.forEach((pair, i) => main.appendChild(corePairCard(pair.map(resolveSlot), i, pair)));
  }

  const strays = strayExercises(plan);
  if(strays.length){
    const label = document.createElement("p");
    label.className = "section-label";
    label.textContent = "Not in this session";
    main.appendChild(label);
    strays.forEach(exercise => main.appendChild(exerciseCard(exercise, null, null)));
  }

  main.appendChild(notesCard());
}

function dayRow(className, keys, done){
  const current = state.current;
  const row = document.createElement("div");
  row.className = className;
  keys.forEach(day => {
    const button = document.createElement("button");
    const isDone = done.has(day) && day !== current.day;
    strandButton(button, {
      label: DAYS[day].short, meta: isDone ? "done" : "",
      tone: "secondary", ghost: true, key: "day:" + day
    });
    button.dataset.chosen = day === current.day ? "on" : "off";
    button.setAttribute("aria-pressed", String(day === current.day));
    button.addEventListener("click", () => {
      setDay(day);
      queueSave();
      notify();
    });
    row.appendChild(button);
  });
  return row;
}

function sectionLabel(section){
  if(section.on) return `${section.name} · ${section.rounds} rounds · ${section.on}s on, ${section.off}s off`;
  if(section.rounds) return `${section.name} · ${section.rounds} rounds`;
  return section.name;
}

function travelOn(plan){
  const ids = Object.keys(plan.travel);
  return ids.every(id => state.current.swaps[id] === plan.travel[id]);
}

function placeSwitch(plan){
  const wrap = document.createElement("div");
  wrap.className = "place-wrap";
  const label = document.createElement("p");
  label.className = "eyebrow";
  label.textContent = "Location";
  const row = document.createElement("div");
  row.className = "blockset place";
  const away = travelOn(plan);
  [["gym", !away], ["away", away]].forEach(([place, chosen]) => {
    const button = document.createElement("button");
    strandButton(button, {label: place, tone: "secondary", ghost: true, key: "place:" + place});
    button.dataset.chosen = chosen ? "on" : "off";
    button.setAttribute("aria-pressed", String(chosen));
    button.title = place === "gym" ? "The gym versions" : "No-equipment versions for travel";
    button.addEventListener("click", () => {
      if(chosen) return;
      for(const id in plan.travel){
        if(place === "gym") delete state.current.swaps[id];
        else state.current.swaps[id] = plan.travel[id];
      }
      queueSave();
      notify();
    });
    row.appendChild(button);
  });
  wrap.append(label, row);
  return wrap;
}

function strayExercises(plan){
  const planned = new Set(allExercises(plan).map(slot => resolveSlot(slot).id));
  const entries = state.current.entries;
  return Object.keys(entries)
    .filter(id => !planned.has(id) && entries[id].some(set => set && set.r))
    .map(id => Object.assign(
      {id, n: exerciseName(id), s: entries[id].length, r: "", rest: DEFAULT_REST},
      findExercise(id) || {},
      {stray: true}
    ));
}

function summaryFor(exercise){
  const chips = setRuns(state.current.entries[exercise.id], unitSuffix(exercise))
    .map(run => `<b>${run.count > 1 ? `<i>${run.count}×</i>` : ""}${run.part}</b>`);
  const effort = (state.current.effort || {})[exercise.id];
  if(effort) chips.push(`<em>${effort}</em>`);
  return chips.join("");
}

function syncCard(exercise){
  const card = el("main").querySelector("#card-" + exercise.id) ||
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
  for(let i = 0; i < exercise.s; i++) if(sets[i] && sets[i].r) done++;
  return done >= exercise.s;
}

function moveBlock(exercise, position, slot, partnerName){
  const move = document.createElement("div");
  move.className = "ex-move";
  move.id = "card-" + exercise.id;
  fillCard(move, exercise, position, slot, partnerName);
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

function exerciseCard(exercise, position, slot){
  const card = document.createElement("section");
  card.className = "ex";
  strandPanel(card);
  ownMove(card, moveBlock(exercise, position, slot));
  markDim(card);
  return card;
}

function corePairCard(pair, index, slots){
  const card = document.createElement("section");
  card.className = "ex core";
  strandPanel(card);
  card.id = "card-core-" + index;
  const badge = document.createElement("div");
  badge.className = "superset";
  badge.innerHTML = `<b>Superset ${index + 1}</b><span>alternate the two moves</span>`;
  card.appendChild(badge);
  pair.forEach((exercise, i) => {
    if(i) card.appendChild(Object.assign(document.createElement("div"), {className: "rule"}));
    ownMove(card, moveBlock(exercise, null, slots[i], i ? null : pair[1].n));
  });
  markDim(card);
  return card;
}

function fillCard(card, exercise, position, slot, partnerName){
  slot = slot || exercise;
  const prior = priorSets(state.sessions, exercise.id, state.current.date);
  const unit = unitName(exercise);
  const suffix = unitSuffix(exercise);

  const head = document.createElement("div");
  head.className = "ex-head";
  head.innerHTML = `${position ? `<span class="ex-num">${String(position).padStart(2, "0")}</span>` : ""}<h3 class="ex-name">${exercise.n}</h3>`;
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
    if(exercise.swappedFrom){
      delete state.current.swaps[exercise.swappedFrom];
      queueSave();
      notify();
    } else openSwapSheet(slot);
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
  if(exercise.per) meta.innerHTML += `<span class="tag side">per ${exercise.per}</span>`;
  if(LOAD_LABEL[exercise.load]) meta.innerHTML += `<span class="tag">${LOAD_LABEL[exercise.load]}</span>`;
  const prescription = exercise.r ? `${exercise.s} × ${exercise.r}${suffix}` : `${exercise.s} logged`;
  meta.innerHTML += exercise.core
    ? `<span>${exercise.s} rounds × ${exercise.r}${suffix}</span><span class="dot">·</span><span>${partnerName ? "straight into " + partnerName : `rest ${exercise.rest}s between rounds`}</span>`
    : exercise.win
      ? `<span>${exercise.s} rounds × ${exercise.win}s on</span><span class="dot">·</span><span>${exercise.rest}s off</span>`
      : `<span>${prescription}</span><span class="dot">·</span><span>rest ${exercise.rest}s</span>`;
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
  columns.innerHTML = `<div>${exercise.core || exercise.win ? "rd" : "#"}</div><div>${exercise.load === "level" ? "level" : "weight (lbs)"}</div><div></div><div>${unit}</div><div></div><div></div>`;
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
    if(!entered.r){ delta.className = "delta none"; delta.textContent = last ? "—" : ""; return; }
    if(!last || !last.r){ delta.className = "delta up"; delta.textContent = "new"; return; }
    const now = score(entered, exercise.bw);
    const then = score(last, exercise.bw);
    if(now > then){ delta.className = "delta up"; delta.innerHTML = ICON_UP; }
    else if(now === then){ delta.className = "delta same"; delta.innerHTML = ICON_SAME; }
    else { delta.className = "delta down"; delta.innerHTML = ICON_DOWN; }
  };

  const commit = () => {
    const sets = setsFor(exercise.id);
    while(sets.length <= index) sets.push({w: "", r: ""});
    const hadReps = !!sets[index].r;
    const wasComplete = isComplete(exercise);
    sets[index] = {w: weight.value.trim(), r: reps.value.trim()};
    if(isComplete(exercise) !== wasComplete) state.foldFlips.delete(exercise.id);
    if(!hadReps && sets[index].r) markLogged();
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
  strandIconButton(repeat, {
    icon: "replay", tone: "primary", ghost: true, size: 30, glyph: 18,
    key: "repeat:" + exercise.id + ":" + index
  });

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

function notesCard(){
  const box = document.createElement("div");
  box.className = "notes";
  strandPanel(box);
  const label = document.createElement("label");
  label.textContent = "Notes";
  label.setAttribute("for", "notes");
  const area = document.createElement("textarea");
  area.id = "notes";
  area.value = state.current.notes || "";
  area.placeholder = "How it felt, what was occupied, anything worth remembering next cycle.";
  const save = () => { state.current.notes = area.value; queueSave(); };
  area.addEventListener("change", save);
  area.addEventListener("blur", save);
  box.append(label, strandField(area));
  return box;
}

function setBarGroups(){
  const plan = workoutFor(state.current.block, state.current.day);
  if(!plan) return [];
  let reached = false;
  return allExercises(plan).map(resolveSlot).map(exercise => {
    const sets = state.current.entries[exercise.id] || [];
    const marks = [];
    for(let i = 0; i < exercise.s; i++) marks.push(sets[i] && sets[i].r ? "on" : "off");
    const here = !reached && marks.includes("off");
    if(here){
      reached = true;
      return marks.map(mark => mark === "off" ? "now" : mark);
    }
    return marks;
  });
}

function updateSetBar(groups, done, total){
  const bar = el("setbar");
  if(!bar) return;
  const marks = groups.flat();
  const shape = groups.map(group => group.length).join(",");
  if(bar.dataset.shape !== shape){
    bar.innerHTML = "";
    marks.forEach(() => bar.appendChild(Object.assign(document.createElement("i"), {className: "tick"})));
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
  updateSetBar(setBarGroups(), count, total);

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
