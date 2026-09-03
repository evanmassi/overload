import {CONSISTENCY_WEEKS} from "./constants.js";
import {findExercise} from "./movements.js";
import {state} from "./state.js";
import {loggedCount, bestEstimate, estimateFor} from "./progression.js";
import {iso} from "./session.js";

export function renderProgress(main){
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

function consistencyGrid(){
  const wrap = document.createElement("div");
  wrap.className = "grid-wrap";

  const weeks = CONSISTENCY_WEEKS;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const grid = document.createElement("div");
  grid.className = "grid";
  let trained = 0;

  for(let i = 0; i < weeks * 7; i++){
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const key = iso(day);
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
  caption.textContent = `${trained} session${trained === 1 ? "" : "s"} in the last ${weeks} weeks`;

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
