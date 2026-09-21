import {CONFIRM_WINDOW_MS, DAY_KEYS, OFF_KEYS, DAYS, ICON_SWAP, TREND_ICON} from "../data/constants.js";
import {workoutFor, findExercise, isOffDay} from "../rules/exercises.js";
import {state, notify} from "../store/state.js";
import {loggedCount, sessionVolume, trend, topSet, priorSets, loggedAsBodyweight} from "../rules/progression.js";
import {blockIndexOf, cycleNumber} from "../rules/rotation.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, strayIds} from "../store/slots.js";
import {isLogged} from "../rules/sets.js";
import {loadSession, deleteSession} from "../store/session.js";
import {openRelabelSheet} from "./sheets/relabelSheet.js";
import {settingsPanel} from "./settings.js";
import {setSummary, elapsedLabel, unitSuffix} from "../rules/format.js";
import {makeButton} from "../ui/button.js";
import {makePanel} from "../ui/panel.js";

const TREND_WORD = {up: "Beat", same: "Matched", down: "Below"};

function deltaMark(key, id, sets, isBodyweight){
  const prior = priorSets(state.sessions, id, key, state.sessions[key].day);
  if(!prior) return `<i class="hist-delta up" title="First time logged">new</i>`;
  const direction = trend(topSet(sets, isBodyweight), topSet(prior.sets, isBodyweight), isBodyweight);
  return `<i class="hist-delta ${direction}" title="${TREND_WORD[direction]} ${prior.date}">${TREND_ICON[direction]}</i>`;
}

function exerciseLine(key, id, sets, name, exercise, extraClass, mark){
  const line = document.createElement("div");
  line.className = "hist-line" + (extraClass ? " " + extraClass : "");
  const isBodyweight = loggedAsBodyweight(exercise, sets);
  line.innerHTML = `<span>${name}${mark || ""}</span><b>${setSummary(sets, exercise ? unitSuffix(exercise) : "")}</b>${deltaMark(key, id, sets, isBodyweight)}`;
  return line;
}

function slotLine(key, session, slot){
  const exercise = resolveSlot(slot, session.swaps);
  const sets = (session.entries || {})[exercise.id];
  if(!sets || !sets.some(isLogged)) return null;
  const mark = exercise.swappedFrom
    ? `<i class="hist-swap" title="Swapped in for ${slot.n}" aria-label="Swapped in for ${slot.n}">${ICON_SWAP}</i>`
    : "";
  return exerciseLine(key, exercise.id, sets, exercise.n, exercise, "", mark);
}

function subLabel(text){
  const label = document.createElement("p");
  label.className = "hist-sub";
  label.textContent = text;
  return label;
}

function armedDelete(key){
  const remove = document.createElement("button");
  remove.addEventListener("click", event => {
    event.stopPropagation();
    if(remove.dataset.armed){ deleteSession(key); return; }
    remove.dataset.armed = "1";
    remove.setLabel("sure?");
    setTimeout(() => { delete remove.dataset.armed; remove.setLabel("delete"); }, CONFIRM_WINDOW_MS);
  });
  return makeButton(remove, {label: "delete", tone: "danger", ghost: true, key: "hist-delete:" + key});
}

function sessionBody(key, session, plan){
  const body = document.createElement("div");
  body.className = "hist-body";

  (plan.sections || [{ex: plan.ex}]).forEach(section => {
    const lines = section.ex.map(slot => slotLine(key, session, slot)).filter(Boolean);
    if(!lines.length) return;
    if(section.name) body.appendChild(subLabel(section.name));
    lines.forEach(line => body.appendChild(line));
  });

  const supersets = (plan.core || [])
    .map(pair => pair.map(slot => slotLine(key, session, slot)).filter(Boolean))
    .filter(lines => lines.length);
  if(supersets.length){
    body.appendChild(subLabel("Core finisher"));
    supersets.forEach(lines => {
      const group = document.createElement("div");
      group.className = "hist-super";
      lines.forEach(line => group.appendChild(line));
      body.appendChild(group);
    });
  }

  const strays = strayIds(session, plan);
  if(strays.length){
    body.appendChild(subLabel("Not in this session"));
    strays.forEach(id =>
      body.appendChild(exerciseLine(key, id, session.entries[id], exerciseName(id), findExercise(id), "hist-stray")));
  }

  if(session.notes){
    const note = document.createElement("p");
    note.className = "hist-notes";
    note.textContent = session.notes;
    body.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "hist-actions";
  const edit = document.createElement("button");
  edit.title = "Open this session on the Log tab";
  makeButton(edit, {label: "edit", tone: "secondary", ghost: true, key: "hist-edit:" + key});
  edit.addEventListener("click", event => {
    event.stopPropagation();
    loadSession(key);
    state.view = "log";
    notify();
    window.scrollTo(0, 0);
  });
  const relabel = document.createElement("button");
  relabel.title = "File this session under a different workout";
  makeButton(relabel, {label: "relabel", tone: "secondary", ghost: true, key: "hist-relabel:" + key});
  relabel.addEventListener("click", event => { event.stopPropagation(); openRelabelSheet(key); });
  actions.append(edit, relabel, armedDelete(key));
  body.appendChild(actions);
  return body;
}

function sessionCard(key, session, plan){
  const date = session.date;
  const open = state.historyOpen.has(key);
  const card = document.createElement("div");
  card.className = "hist-day" + (open ? " hist-expanded" : "");
  makePanel(card);

  const row = document.createElement("div");
  row.className = "hist-row";
  row.setAttribute("role", "button");
  row.setAttribute("aria-expanded", String(open));
  const top = document.createElement("div");
  top.className = "hist-top";
  top.innerHTML = `<h3>${plan.focus}</h3><span class="chip live">${session.block}</span><span class="chip" title="${date}">${date.slice(5)}</span>`;
  const foot = document.createElement("div");
  foot.className = "hist-foot";
  const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
  foot.innerHTML = `<b>${sessionVolume(session, session.block, session.day).toLocaleString()} lb</b>`
    + `<span>${loggedCount(session)} sets</span>${took ? `<span>${took}</span>` : ""}`;
  row.append(top, foot);
  row.addEventListener("click", () => {
    open ? state.historyOpen.delete(key) : state.historyOpen.add(key);
    notify();
  });
  card.appendChild(row);

  if(open) card.appendChild(sessionBody(key, session, plan));
  return card;
}

function filterBar(className, keys){
  const bar = document.createElement("div");
  bar.className = className;
  keys.forEach(day => {
    const button = document.createElement("button");
    makeButton(button, {
      label: day ? DAYS[day].short : "All",
      tone: "secondary", ghost: true, key: "filter:" + day
    });
    button.dataset.chosen = day === state.historyDay ? "on" : "off";
    button.setAttribute("aria-pressed", String(day === state.historyDay));
    button.addEventListener("click", () => { state.historyDay = day; notify(); });
    bar.appendChild(button);
  });
  return bar;
}

export function renderHistory(main){
  const keys = Object.keys(state.sessions).sort().reverse();
  if(!keys.length){
    main.innerHTML = `<p class="empty">Nothing logged yet. Fill in a set on the Log tab and it shows up here.</p>`;
    main.append(...settingsPanel());
    return;
  }

  main.appendChild(filterBar("blockset hist-filter", [null, ...DAY_KEYS]));
  main.appendChild(filterBar("blockset hist-filter-off", OFF_KEYS));

  const shown = keys.filter(key => !state.historyDay || state.sessions[key].day === state.historyDay);
  if(!shown.length){
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = `No ${DAYS[state.historyDay].label} sessions yet.`;
    main.append(empty, ...settingsPanel());
    return;
  }

  let lastCycle = null;
  shown.forEach(key => {
    const session = state.sessions[key];
    const plan = workoutFor(session.block, session.day);
    if(!plan) return;

    const cycle = cycleNumber(blockIndexOf(session));
    const ownRotation = !isOffDay(session.day) || state.historyDay === session.day;
    if(ownRotation && cycle !== lastCycle){
      const label = document.createElement("p");
      label.className = "section-label hist-cycle";
      label.textContent = `Cycle ${cycle}`;
      main.appendChild(label);
      lastCycle = cycle;
    }
    main.appendChild(sessionCard(key, session, plan));
  });

  main.append(...settingsPanel());
}
