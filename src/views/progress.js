import {CONSISTENCY_WEEKS, STREAK_WORKOUTS, WEEKDAY_LABELS, DAY_KEYS, CROSS_KEYS, DAYS, TREND_ICON} from "../data/constants.js";
import {findExercise} from "../rules/exercises.js";
import {state, changes} from "../store/state.js";
import {exerciseName} from "../store/customs.js";
import {topSet, score, loggedAsBodyweight, progressSince} from "../rules/progression.js";
import {iso, shortDate, monthLabel, unitSuffix, unitName, weightUnit} from "../rules/format.js";
import {addDays, mondayOf, trainingDays, weekTally, weekStreak} from "../rules/calendar.js";
import {isLogged} from "../rules/sets.js";
import {makePanel} from "../ui/panel.js";
import {byId, el, escapeHtml} from "./dom.js";

export function renderProgress(main){
  const byExercise = {};
  Object.keys(state.sessions).sort().forEach(key => {
    const session = state.sessions[key];
    for(const id in (session.entries || {})){
      const sets = session.entries[id].filter(isLogged);
      if(!sets.length) continue;
      const exercise = findExercise(id);
      const bw = loggedAsBodyweight(exercise, sets);
      const top = topSet(sets, bw);
      const entry = byExercise[id] = byExercise[id] || {name: exerciseName(id), exercise, bw, points: []};
      entry.day = session.day;
      entry.points.push({date: session.date, value: Math.round(score(top, bw)), top});
    }
  });

  const ids = Object.keys(byExercise).sort((a, b) => byExercise[b].points.length - byExercise[a].points.length);
  if(!ids.length) main.appendChild(el("p", "empty", "Log two sessions of the same lift and the trend line shows up here."));
  main.append(el("p", "section-label", "Consistency"), consistencyGrid());

  [...DAY_KEYS, ...CROSS_KEYS].forEach(day => {
    const inDay = ids.filter(id => byExercise[id].day === day);
    if(!inDay.length) return;
    main.appendChild(el("p", "section-label", DAYS[day].label));
    inDay.forEach(id => main.appendChild(progressCard(byExercise[id])));
  });
}

function progressCard(entry){
  const {points, exercise} = entry;
  const latest = points[points.length - 1];
  const bestIndex = points.reduce((best, point, i) => point.value > points[best].value ? i : best, 0);
  const best = points[bestIndex].top;
  const suffix = exercise ? unitSuffix(exercise) : "";
  const tag = text => `<small class="unit-tag">${text}</small>`;
  const weight = latest.top.w ? `${escapeHtml(latest.top.w)}${tag(weightUnit(exercise))} × ` : "";
  const reps = `${escapeHtml(latest.top.r)}${tag(exercise ? unitName(exercise) : "reps")}`;
  const change = points.length > 1 ? progressSince(exercise, points[0].top, latest.top, entry.bw) : null;

  const card = el("div", "prog panel-flat");
  makePanel(card);
  card.innerHTML = `<h3>${escapeHtml(entry.name)}</h3>`
    + (change ? `<i class="prog-change ${change.direction}">${TREND_ICON[change.direction]}${change.text}</i>` : "<i></i>")
    + `<div class="prog-top">${weight}${reps}</div>`
    + (entry.bw ? "" : `<div class="prog-est">est. 1RM<span>${latest.value}</span></div>`);
  if(points.length > 1) card.appendChild(sparkline(points.map(point => point.value), bestIndex));

  const count = `${points.length} session${points.length === 1 ? "" : "s"}`;
  const bestText = points.length > 1 ? ` · best ${best.w ? best.w + "×" : ""}${best.r}${suffix}` : "";
  card.appendChild(el("p", "prog-foot", `${count}${bestText} · last ${shortDate(latest.date)}`));
  return card;
}

function consistencyGrid(){
  const today = new Date();
  const todayKey = iso(today);
  const start = addDays(mondayOf(today), -7 * (CONSISTENCY_WEEKS - 1));
  const days = trainingDays(state.sessions);

  const grid = el("div", "grid");
  ["", ...WEEKDAY_LABELS].forEach(label => grid.appendChild(el("span", "grid-label", label)));
  for(let week = 0; week < CONSISTENCY_WEEKS; week++){
    const monday = addDays(start, week * 7);
    grid.appendChild(el("span", "grid-month", week === 0 || monday.getDate() <= 7 ? monthLabel(monday) : ""));
    for(let d = 0; d < 7; d++){
      const date = iso(addDays(monday, d));
      grid.appendChild(dayCell(date, days[date], date > todayKey));
    }
  }

  const tally = weekTally(state.sessions, today);
  const streak = weekStreak(state.sessions, today);
  const note = `This week: ${tally.lifting} lifting · ${tally.cross} cross-training`
    + (streak ? ` · ${streak} week${streak === 1 ? "" : "s"} in a row with ${STREAK_WORKOUTS}+` : "");
  const legend = el("p", "grid-legend");
  legend.innerHTML = '<span><i class="cell lift"></i>lifting</span><span><i class="cell cross"></i>cross-training</span>'
    + '<span><i class="cell lift double"></i>two in a day</span>';

  const wrap = el("div", "grid-wrap");
  wrap.append(grid, el("p", "grid-note", note), legend);
  return wrap;
}

function dayCell(date, day, isFuture){
  const kind = isFuture ? " future" : day ? (day.isLifting ? " lift" : " cross") + (day.count > 1 ? " double" : "") : "";
  const cell = el("i", "cell" + kind);
  cell.title = date + (day ? ` · ${day.count} workout${day.count === 1 ? "" : "s"}` : "");
  if(day) cell.addEventListener("click", () => openDay(date));
  return cell;
}

function openDay(date){
  state.view = "history";
  state.historyDay = null;
  state.historyOpen = new Set(Object.keys(state.sessions).filter(key => state.sessions[key].date === date));
  changes.notify();
  const open = byId("main").querySelector(".hist-expanded");
  if(open) open.scrollIntoView({block: "start"});
}

function sparkline(values, bestIndex){
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
  area.setAttribute("fill", "var(--ui-accent-soft)");

  const line = document.createElementNS(ns, "polyline");
  line.setAttribute("points", path);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "var(--ui-accent)");
  line.setAttribute("stroke-width", "1.5");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");

  const dots = points.map(([x, y], i) => {
    const dot = document.createElementNS(ns, "line");
    dot.setAttribute("x1", x);
    dot.setAttribute("y1", y);
    dot.setAttribute("x2", x);
    dot.setAttribute("y2", y);
    dot.setAttribute("stroke", i === bestIndex ? "var(--success)" : "var(--ui-accent)");
    dot.setAttribute("stroke-width", i === bestIndex ? "7" : "4");
    dot.setAttribute("stroke-linecap", "round");
    dot.setAttribute("vector-effect", "non-scaling-stroke");
    return dot;
  });

  svg.append(area, line, ...dots);
  return svg;
}
