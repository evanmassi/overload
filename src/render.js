import {BLOCKS, DAY_KEYS, DAYS, LOAD_LABEL, ICON_SWAP, ICON_UNDO, ICON_REPEAT,
        CONFIRM_WINDOW_MS, EFFORT_LEVELS} from "./constants.js";
import {workoutFor, allExercises, findExercise} from "./movements.js";
import {state, notify} from "./state.js";
import {num, score, loggedCount, priorSets, sessionVolume, suggestTarget,
        prescribedCount, hasStalled, bestEstimate, estimateFor} from "./progression.js";
import {cycleNumber, cycleStart, sessionsDoneIn} from "./rotation.js";
import {resolveSlot, exerciseName} from "./swaps.js";
import {loadDate, setBlockIndex, setDay, setsFor, queueSave, deleteSession, previousSameWorkout,
        setEffort, markLogged} from "./session.js";
import {openSwapSheet, openHowTo} from "./sheet.js";
import {start as startTimer, setIdleRest} from "./timer.js";
import {exportSessions, importSessions, onBackupStatus} from "./backup.js";
import {soundOn, setSoundOn, testTone, audioState} from "./sound.js";

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
  return (state.current.entries[exercise.id] || [])
    .filter(set => set && set.r)
    .map(set => (set.w ? set.w + "\u00d7" : "") + set.r)
    .join("  ");
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
  const suffix = exercise.unit === "sec" ? "s" : "";

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
    flag.textContent = "Stuck here three sessions running. Swap it, or drop 10% and build back up.";
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
    foot.className = "ex-cue";
    foot.style.paddingTop = "0";
    const summary = prior.sets.filter(set => set && set.r)
      .map(set => set.w ? `${set.w}×${set.r}${suffix}` : `${set.r}${suffix}`).join("  ");
    foot.textContent = `${prior.date} — ${summary}`;
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

function backupControls(){
  const box = document.createElement("div");
  box.className = "backup";

  const save = document.createElement("button");
  save.className = "btn";
  save.textContent = "Export backup";
  save.addEventListener("click", exportSessions);

  const load = document.createElement("label");
  load.className = "btn";
  load.textContent = "Import backup";
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.hidden = true;
  picker.addEventListener("change", importSessions);
  load.appendChild(picker);

  const result = document.createElement("span");
  result.className = "backup-result";
  onBackupStatus(text => { result.textContent = text; });

  box.append(save, load, result);
  return box;
}

function soundControls(){
  const box = document.createElement("div");
  box.className = "soundrow";

  const toggle = document.createElement("button");
  toggle.className = "btn";
  const paint = () => {
    toggle.textContent = soundOn() ? "Sound on" : "Sound off";
    toggle.classList.toggle("on", soundOn());
    toggle.setAttribute("aria-pressed", String(soundOn()));
  };
  toggle.addEventListener("click", () => { setSoundOn(!soundOn()); paint(); });
  paint();

  const note = document.createElement("p");
  note.className = "sound-result";

  const test = document.createElement("button");
  test.className = "btn";
  test.textContent = "Test sound";
  test.addEventListener("click", () => {
    const played = testTone();
    const state = audioState();
    note.textContent = played
      ? "Played. Heard nothing? Check the ring/silent switch."
      : state === "unsupported"
        ? "This browser has no Web Audio."
        : "Blocked by the browser. Tap once more.";
  });

  box.append(toggle, test, note);
  return box;
}

function soundNote(){
  const note = document.createElement("p");
  note.className = "sound-note";
  note.textContent = "Three short beeps in the last seconds, one long one when the rest is up. iOS suspends audio when the screen locks, so keep the app in front.";
  return note;
}

function backupNote(){
  const note = document.createElement("p");
  note.className = "backup-note";
  note.textContent = "Your log lives on this device. Export before clearing browser data.";
  return note;
}

function setSummary(sets, suffix){
  const parts = sets.filter(set => set && set.r)
    .map(set => set.w ? `${set.w}×${set.r}${suffix}` : `${set.r}${suffix}`);

  const runs = [];
  for(const part of parts){
    const last = runs[runs.length - 1];
    if(last && last.part === part) last.count++;
    else runs.push({part, count: 1});
  }
  return runs.map(run => run.count > 1 ? `${run.count} × ${run.part}` : run.part)
    .join(" · ");
}

function historyLine(session, slot){
  const swapped = session.swaps && session.swaps[slot.id];
  const id = swapped || slot.id;
  const sets = (session.entries || {})[id];
  if(!sets || !sets.some(set => set && set.r)) return null;

  const line = document.createElement("div");
  line.className = "hist-line";
  const name = swapped ? exerciseName(id) : slot.n;
  const mark = swapped
    ? `<i class="hist-swap" title="Swapped in for ${slot.n}" aria-label="Swapped in for ${slot.n}">${ICON_SWAP}</i>`
    : "";
  line.innerHTML = `<span>${name}${mark}</span><b>${setSummary(sets, slot.unit === "sec" ? "s" : "")}</b>`;
  return line;
}

function renderHistory(main){
  const dates = Object.keys(state.sessions).sort().reverse();
  if(!dates.length){
    main.innerHTML = `<p class="empty">Nothing logged yet. Fill in a set on the Log tab and it shows up here.</p>`;
    main.append(soundControls(), soundNote(), backupControls(), backupNote());
    return;
  }

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = `${dates.length} sessions`;
  main.appendChild(label);

  dates.forEach(date => {
    const session = state.sessions[date];
    const plan = workoutFor(session.block, session.day);
    if(!plan) return;

    const card = document.createElement("div");
    card.className = "hist-day hist-open";
    card.title = "Open this session to fix it";
    card.addEventListener("click", () => {
      loadDate(date);
      state.view = "log";
      notify();
      window.scrollTo(0, 0);
    });
    card.innerHTML = `<div class="hist-top"><h3>${plan.focus}</h3><span class="chip live">${session.block}</span><span class="chip">${date}</span></div>`;

    const remove = document.createElement("button");
    remove.textContent = "delete";
    remove.addEventListener("click", event => {
      event.stopPropagation();
      if(remove.dataset.armed){ deleteSession(date); return; }
      remove.dataset.armed = "1";
      remove.textContent = "sure?";
      setTimeout(() => { delete remove.dataset.armed; remove.textContent = "delete"; }, CONFIRM_WINDOW_MS);
    });
    card.querySelector(".hist-top").appendChild(remove);

    plan.ex.forEach(slot => {
      const line = historyLine(session, slot);
      if(line) card.appendChild(line);
    });

    const supersets = (plan.core || [])
      .map(pair => pair.map(slot => historyLine(session, slot)).filter(Boolean))
      .filter(lines => lines.length);

    if(supersets.length){
      const label = document.createElement("p");
      label.className = "hist-sub";
      label.textContent = "Core finisher";
      card.appendChild(label);
      supersets.forEach(lines => {
        const group = document.createElement("div");
        group.className = "hist-super";
        lines.forEach(line => group.appendChild(line));
        card.appendChild(group);
      });
    }

    const foot = document.createElement("div");
    foot.className = "hist-foot";
    const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
    foot.innerHTML = [
      `<b>${sessionVolume(session, session.block, session.day).toLocaleString()} lb</b>`,
      `<span>${loggedCount(session)} sets</span>`,
      took ? `<span>${took}</span>` : ""
    ].join("");
    card.appendChild(foot);

    if(session.notes){
      const note = document.createElement("p");
      note.className = "hist-notes";
      note.textContent = session.notes;
      card.appendChild(note);
    }

    main.appendChild(card);
  });

  main.append(soundControls(), soundNote(), backupControls(), backupNote());
}

function renderProgress(main){
  const byExercise = {};
  Object.keys(state.sessions).sort().forEach(date => {
    const session = state.sessions[date];
    for(const id in (session.entries || {})){
      const sets = session.entries[id].filter(set => set && set.r);
      if(!sets.length) continue;
      const exercise = findExercise(id);
      if(!exercise) continue;
      const top = bestEstimate(sets, exercise.bw);
      const value = Math.round(estimateFor(top, exercise.bw));
      (byExercise[id] = byExercise[id] || {name: exercise.n, bw: exercise.bw, points: []})
        .points.push({date, value, top});
    }
  });

  const ids = Object.keys(byExercise).sort((a, b) => byExercise[b].points.length - byExercise[a].points.length);
  if(!ids.length){
    main.innerHTML = `<p class="empty">Log two sessions of the same lift and the trend line shows up here.</p>`;
    const consistency = document.createElement("p");
    consistency.className = "section-label";
    consistency.textContent = "Consistency";
    main.append(consistency, consistencyGrid());
    return;
  }

  const consistency = document.createElement("p");
  consistency.className = "section-label";
  consistency.textContent = "Consistency";
  main.append(consistency, consistencyGrid());

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = "Top set trend · est. 1RM";
  main.appendChild(label);

  ids.forEach(id => {
    const entry = byExercise[id];
    const latest = entry.points[entry.points.length - 1];
    const best = entry.points.reduce((a, b) => b.value > a.value ? b : a);
    const qualifier = entry.bw ? "best reps" : "est. 1RM";
    const sessions = `${entry.points.length} session${entry.points.length === 1 ? "" : "s"}`;
    const history = entry.points.length > 1 ? `${sessions} · best ${best.value}` : sessions;

    const card = document.createElement("div");
    card.className = "prog";
    card.innerHTML = `<h3>${entry.name}</h3>
      <div class="best">${latest.value}<em>${qualifier}</em></div>
      <div class="meta">${history}</div>
      <div class="meta" style="text-align:right">${latest.top.w ? latest.top.w + "×" : ""}${latest.top.r} on ${latest.date.slice(5)}</div>`;
    if(entry.points.length > 1) card.appendChild(sparkline(entry.points.map(p => p.value)));
    main.appendChild(card);
  });
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

export function elapsedLabel(startedAt, endedAt){
  if(startedAt == null || endedAt == null) return null;
  const minutes = Math.floor((endedAt - startedAt) / 60000);
  if(minutes < 1) return null;
  if(minutes < 60) return minutes + " min";
  return Math.floor(minutes / 60) + "h " + String(minutes % 60).padStart(2, "0") + "m";
}

function consistencyGrid(){
  const wrap = document.createElement("div");
  wrap.className = "grid-wrap";

  const weeks = 26;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const grid = document.createElement("div");
  grid.className = "grid";
  let trained = 0;

  for(let i = 0; i < weeks * 7; i++){
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const key = day.getFullYear() + "-" +
      String(day.getMonth() + 1).padStart(2, "0") + "-" +
      String(day.getDate()).padStart(2, "0");
    const session = state.sessions[key];
    const sets = session ? loggedCount(session) : 0;
    const cell = document.createElement("i");
    cell.className = "cell" + (sets ? " lit" + Math.min(3, Math.ceil(sets / 10)) : "");
    cell.title = key + (sets ? " · " + sets + " sets" : "");
    grid.appendChild(cell);
    if(sets) trained++;
  }

  const caption = document.createElement("p");
  caption.className = "grid-note";
  caption.textContent = trained + " sessions in the last " + weeks + " weeks";

  wrap.append(grid, caption);
  return wrap;
}

function sparkline(values){
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 36");
  svg.setAttribute("preserveAspectRatio", "none");

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, i) => [(i / (values.length - 1)) * 100, 32 - ((value - min) / span) * 28]);
  const path = points.map(p => p.join(",")).join(" ");

  const area = document.createElementNS(ns, "polygon");
  area.setAttribute("points", `0,36 ${path} 100,36`);
  area.setAttribute("fill", "var(--accent-soft)");

  const line = document.createElementNS(ns, "polyline");
  line.setAttribute("points", path);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "var(--accent)");
  line.setAttribute("stroke-width", "1.5");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");

  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", points[points.length - 1][0]);
  dot.setAttribute("cy", points[points.length - 1][1]);
  dot.setAttribute("r", "2.5");
  dot.setAttribute("fill", "var(--accent)");
  dot.setAttribute("vector-effect", "non-scaling-stroke");

  svg.append(area, line, dot);
  return svg;
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
