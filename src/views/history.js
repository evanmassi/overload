import {DAYS, ICON_SWAP, TREND_ICON} from "../data/constants.js";
import {findExercise} from "../rules/exercises.js";
import {workoutOf, corePairs} from "../rules/workouts.js";
import {loggedCount, trend, topSet, priorSets, loggedAsBodyweight} from "../rules/progression.js";
import {isLogged} from "../rules/sets.js";
import {setSummary, elapsedLabel, unitSuffix} from "../rules/format.js";
import {state, changes} from "../store/state.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, strayIds} from "../store/slots.js";
import {loadSession, deleteSession} from "../store/session.js";
import {makePanel} from "../ui/panel.js";
import {el, escapeHtml} from "./dom.js";
import {actionButton, confirmButton, workoutFilters} from "./controls.js";
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
    changes.notify();
    window.scrollTo(0, 0);
  });
  edit.title = "Open this session on the Log tab";
  const relabel = actionButton("relabel", {tone: "secondary", ghost: true, key: "hist-relabel:" + key}, event => {
    event.stopPropagation();
    openRelabelSheet(key, state.sessions[key].block);
  });
  relabel.title = "File this session under a different workout";
  const remove = confirmButton("delete", "sure?", {tone: "danger", ghost: true, key: "hist-delete:" + key},
    () => deleteSession(key));
  actions.append(edit, relabel, remove);
  return actions;
}

function sessionBody(key, session, workout){
  const body = el("div", "hist-body");

  const linesOf = slots => slots.map(slot => slotLine(key, session, slot)).filter(Boolean);
  workout.sections.forEach(section => {
    const core = section.kind === "core";
    const groups = (core ? corePairs(section) : [section.ex]).map(linesOf).filter(lines => lines.length);
    if(!groups.length) return;
    if(section.name) body.appendChild(el("p", "hist-sub", section.name));
    groups.forEach(lines => {
      const holder = core ? body.appendChild(el("div", "hist-super")) : body;
      lines.forEach(line => holder.appendChild(line));
    });
  });

  const strays = strayIds(session, workout);
  if(strays.length){
    body.appendChild(el("p", "hist-sub", "Not in this session"));
    strays.forEach(id =>
      body.appendChild(exerciseLine(key, id, session.entries[id], exerciseName(id), findExercise(id), "hist-stray")));
  }

  if(session.notes) body.appendChild(el("p", "hist-notes", session.notes));
  body.appendChild(sessionActions(key));
  return body;
}

function sessionCard(key, session, workout){
  const date = session.date;
  const open = state.historyOpen.has(key);
  const card = el("div", "hist-day" + (open ? " hist-expanded" : ""));
  makePanel(card);

  const row = el("div", "hist-row");
  row.setAttribute("role", "button");
  row.setAttribute("aria-expanded", String(open));
  const top = el("div", "hist-top");
  top.innerHTML = `<h3>${workout.focus}</h3><span class="chip live">${session.block}</span><span class="chip" title="${date}">${date.slice(5)}</span>`;
  const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
  const count = loggedCount(session);
  const foot = el("div", "hist-foot", `${count} set${count === 1 ? "" : "s"}${took ? " · " + took : ""}`);
  row.append(top, foot);
  row.addEventListener("click", () => {
    open ? state.historyOpen.delete(key) : state.historyOpen.add(key);
    changes.notify();
  });
  card.appendChild(row);

  if(open) card.appendChild(sessionBody(key, session, workout));
  return card;
}

export function renderHistory(main){
  const keys = Object.keys(state.sessions).sort().reverse();
  if(!keys.length){
    main.append(el("p", "empty", "Nothing logged yet. Fill in a set on the Log tab and it shows up here."), ...settingsPanel());
    return;
  }

  main.append(...workoutFilters(state.historyDays, "filter:"));

  const picked = state.historyDays;
  const shown = keys.filter(key => !picked.size || picked.has(state.sessions[key].day));
  if(!shown.length){
    const names = [...picked].map(day => DAYS[day].label).join(" or ");
    main.append(el("p", "empty", `No ${names} sessions yet.`), ...settingsPanel());
    return;
  }

  shown.forEach(key => {
    const session = state.sessions[key];
    const workout = workoutOf(session);
    if(!workout) return;
    main.appendChild(sessionCard(key, session, workout));
  });

  main.append(...settingsPanel());
}
