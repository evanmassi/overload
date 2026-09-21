import {BLOCKS, DAY_KEYS, OFF_KEYS, DAYS, TREND_ICON, DEFAULT_REST} from "../data/constants.js";
import {workoutFor, findExercise, isOffDay} from "../rules/exercises.js";
import {state} from "../store/state.js";
import {cycleNumber, cycleStart, sessionsDoneIn} from "../rules/rotation.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, strayIds} from "../store/slots.js";
import {loadDate, chooseBlock, setDay, setNotes, isAway, setTravel} from "../store/session.js";
import {strandButton} from "../strand/button.js";
import {strandField} from "../strand/field.js";
import {strandPanel} from "../strand/panel.js";
import {exerciseCard, corePairCard} from "./exerciseCard.js";

export function renderLog(main){
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
    strandButton(button, {label: letter, tone: "secondary", key: "block:" + letter});
    button.dataset.chosen = letter === current.block ? "on" : "off";
    button.setAttribute("aria-pressed", String(letter === current.block));
    button.addEventListener("click", () => chooseBlock(start + i));
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
  legend.innerHTML = `<span><em class="ghost">45</em> last time</span><span><em class="up">${TREND_ICON.up}</em> beat it</span><span><em class="same">${TREND_ICON.same}</em> matched</span><span><em class="down">${TREND_ICON.down}</em> below</span>`;
  main.appendChild(legend);

  if(plan.sections){
    let position = 0;
    plan.sections.forEach(section => {
      const label = document.createElement("p");
      label.className = "section-label";
      label.textContent = sectionLabel(section);
      main.appendChild(label);
      section.ex.forEach(slot => main.appendChild(exerciseCard(resolveSlot(slot, current.swaps), ++position, slot)));
    });
  } else {
    plan.ex.forEach((slot, i) => main.appendChild(exerciseCard(resolveSlot(slot, current.swaps), i + 1, slot)));
  }

  if(plan.core){
    const label = document.createElement("p");
    label.className = "section-label";
    label.textContent = "Core finisher · 3 supersets, 2 rounds each";
    main.appendChild(label);
    plan.core.forEach((pair, i) =>
      main.appendChild(corePairCard(pair.map(slot => resolveSlot(slot, current.swaps)), i, pair)));
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
    strandButton(button, {label: DAYS[day].short, tone: "secondary", ghost: true, key: "day:" + day});
    if(done.has(day) && day !== current.day){
      const mark = document.createElement("i");
      mark.className = "icon day-done";
      mark.textContent = "check";
      mark.title = "Logged this week";
      button.appendChild(mark);
    }
    button.dataset.chosen = day === current.day ? "on" : "off";
    button.setAttribute("aria-pressed", String(day === current.day));
    button.addEventListener("click", () => setDay(day));
    row.appendChild(button);
  });
  return row;
}

function sectionLabel(section){
  if(section.on) return `${section.name} · ${section.rounds} rounds · ${section.on}s on, ${section.off}s off`;
  if(section.rounds) return `${section.name} · ${section.rounds} rounds`;
  return section.name;
}

function placeSwitch(plan){
  const wrap = document.createElement("div");
  wrap.className = "place-wrap";
  const label = document.createElement("p");
  label.className = "eyebrow";
  label.textContent = "Location";
  const row = document.createElement("div");
  row.className = "blockset place";
  const away = isAway(plan);
  [["gym", !away], ["away", away]].forEach(([place, chosen]) => {
    const button = document.createElement("button");
    strandButton(button, {label: place, tone: "secondary", ghost: true, key: "place:" + place});
    button.dataset.chosen = chosen ? "on" : "off";
    button.setAttribute("aria-pressed", String(chosen));
    button.title = place === "gym" ? "The gym versions" : "No-equipment versions for travel";
    button.addEventListener("click", () => { if(!chosen) setTravel(plan, place === "away"); });
    row.appendChild(button);
  });
  wrap.append(label, row);
  return wrap;
}

function strayExercises(plan){
  const entries = state.current.entries;
  return strayIds(state.current, plan)
    .map(id => Object.assign(
      {id, n: exerciseName(id), s: entries[id].length, r: "", rest: DEFAULT_REST},
      findExercise(id) || {},
      {stray: true}
    ));
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
  const save = () => setNotes(area.value);
  area.addEventListener("change", save);
  area.addEventListener("blur", save);
  box.append(label, strandField(area));
  return box;
}
