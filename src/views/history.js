import {DAY_KEYS, OFF_KEYS, DAYS, ICON_SWAP, TREND_ICON} from "../data/constants.js";
import {workoutFor, findExercise, isOffDay} from "../rules/exercises.js";
import {loggedCount, sessionVolume, trend, topSet, priorSets, loggedAsBodyweight} from "../rules/progression.js";
import {blockIndexOf, cycleNumber} from "../rules/rotation.js";
import {isLogged} from "../rules/sets.js";
import {setSummary, elapsedLabel, unitSuffix} from "../rules/format.js";
import {state, notify} from "../store/state.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, strayIds} from "../store/slots.js";
import {loadSession, deleteSession} from "../store/session.js";
import {makePanel} from "../ui/panel.js";
import {el, escapeHtml} from "./dom.js";
import {actionButton, choiceRow, confirmButton} from "./controls.js";
import {openRelabelSheet} from "./sheets/relabelSheet.js";
import {settingsPanel} from "./settings.js";

const TREND_WORD = {up: "Beat", same: "Matched", down: "Below"};

function deltaMark(key, id, sets, isBodyweight){
  const prior = priorSets(state.sessions, id, key, state.sessions[key].day);
  if(!prior) return `<i class="hist-delta up" title="First time logged">new</i>`;
  const direction = trend(topSet(sets, isBodyweight), topSet(prior.sets, isBodyweight), isBodyweight);
  return `<i class="hist-delta ${direction}" title="${TREND_WORD[direction]} ${prior.date}">${TREND_ICON[direction]}</i>`;
}

function exerciseLine(key, id, sets, name, exercise, extraClass, mark){
  const line = el("div", "hist-line" + (extraClass ? " " + extraClass : ""));
  const isBodyweight = loggedAsBodyweight(exercise, sets);
  const summary = setSummary(sets, exercise ? unitSuffix(exercise) : "");
  line.innerHTML = `<span>${escapeHtml(name)}${mark || ""}</span><b>${escapeHtml(summary)}</b>${deltaMark(key, id, sets, isBodyweight)}`;
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

function sessionActions(key){
  const actions = el("div", "hist-actions");
  const edit = actionButton("edit", {tone: "secondary", ghost: true, key: "hist-edit:" + key}, event => {
    event.stopPropagation();
    loadSession(key);
    state.view = "log";
    notify();
    window.scrollTo(0, 0);
  });
  edit.title = "Open this session on the Log tab";
  const relabel = actionButton("relabel", {tone: "secondary", ghost: true, key: "hist-relabel:" + key}, event => {
    event.stopPropagation();
    openRelabelSheet(key);
  });
  relabel.title = "File this session under a different workout";
  const remove = confirmButton("delete", "sure?", {tone: "danger", ghost: true, key: "hist-delete:" + key},
    () => deleteSession(key));
  actions.append(edit, relabel, remove);
  return actions;
}

function sessionBody(key, session, plan){
  const body = el("div", "hist-body");

  (plan.sections || [{ex: plan.ex}]).forEach(section => {
    const lines = section.ex.map(slot => slotLine(key, session, slot)).filter(Boolean);
    if(!lines.length) return;
    if(section.name) body.appendChild(el("p", "hist-sub", section.name));
    lines.forEach(line => body.appendChild(line));
  });

  const supersets = (plan.core || [])
    .map(pair => pair.map(slot => slotLine(key, session, slot)).filter(Boolean))
    .filter(lines => lines.length);
  if(supersets.length){
    body.appendChild(el("p", "hist-sub", "Core finisher"));
    supersets.forEach(lines => {
      const group = el("div", "hist-super");
      lines.forEach(line => group.appendChild(line));
      body.appendChild(group);
    });
  }

  const strays = strayIds(session, plan);
  if(strays.length){
    body.appendChild(el("p", "hist-sub", "Not in this session"));
    strays.forEach(id =>
      body.appendChild(exerciseLine(key, id, session.entries[id], exerciseName(id), findExercise(id), "hist-stray")));
  }

  if(session.notes) body.appendChild(el("p", "hist-notes", session.notes));
  body.appendChild(sessionActions(key));
  return body;
}

function sessionCard(key, session, plan){
  const date = session.date;
  const open = state.historyOpen.has(key);
  const card = el("div", "hist-day" + (open ? " hist-expanded" : ""));
  makePanel(card);

  const row = el("div", "hist-row");
  row.setAttribute("role", "button");
  row.setAttribute("aria-expanded", String(open));
  const top = el("div", "hist-top");
  top.innerHTML = `<h3>${plan.focus}</h3><span class="chip live">${session.block}</span><span class="chip" title="${date}">${date.slice(5)}</span>`;
  const foot = el("div", "hist-foot");
  const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
  foot.innerHTML = `<b>${sessionVolume(session).toLocaleString()} lb</b>`
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
  return choiceRow(className, keys.map(day => ({
    label: day ? DAYS[day].short : "All",
    key: "filter:" + day,
    chosen: day === state.historyDay,
    onPick: () => { state.historyDay = day; notify(); }
  })), {ghost: true});
}

export function renderHistory(main){
  const keys = Object.keys(state.sessions).sort().reverse();
  if(!keys.length){
    main.append(el("p", "empty", "Nothing logged yet. Fill in a set on the Log tab and it shows up here."), ...settingsPanel());
    return;
  }

  main.appendChild(filterBar("blockset hist-filter", [null, ...DAY_KEYS]));
  main.appendChild(filterBar("blockset hist-filter-off", OFF_KEYS));

  const shown = keys.filter(key => !state.historyDay || state.sessions[key].day === state.historyDay);
  if(!shown.length){
    main.append(el("p", "empty", `No ${DAYS[state.historyDay].label} sessions yet.`), ...settingsPanel());
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
      main.appendChild(el("p", "section-label hist-cycle", `Cycle ${cycle}`));
      lastCycle = cycle;
    }
    main.appendChild(sessionCard(key, session, plan));
  });

  main.append(...settingsPanel());
}
