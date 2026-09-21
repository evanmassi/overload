import {BLOCKS, DAY_KEYS, OFF_KEYS, DAYS, TREND_ICON, DEFAULT_REST} from "../data/constants.js";
import {workoutFor, findExercise, isOffDay} from "../rules/exercises.js";
import {cycleNumber, cycleStart, sessionsDoneIn} from "../rules/rotation.js";
import {state} from "../store/state.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, strayIds} from "../store/slots.js";
import {loadDate, chooseBlock, setDay, setNotes, isAway, setTravel} from "../store/session.js";
import {makeField} from "../ui/field.js";
import {makePanel} from "../ui/panel.js";
import {el} from "./dom.js";
import {choiceRow} from "./controls.js";
import {exerciseCard, corePairCard} from "./exerciseCard.js";

export function renderLog(main){
  const current = state.current;
  const offDay = isOffDay(current.day);
  const plan = workoutFor(current.block, current.day);

  const date = el("input", "date-input");
  date.type = "date";
  date.value = current.date;
  date.addEventListener("change", () => { if(date.value) loadDate(date.value); });
  const start = cycleStart(current.blockIndex);
  const blocks = choiceRow("blockset", BLOCKS.map((letter, i) => ({
    label: letter,
    key: "block:" + letter,
    title: `${offDay ? "Version" : "Week"} ${letter}`,
    chosen: letter === current.block,
    onPick: () => chooseBlock(start + i)
  })));
  const bar = el("div", "daybar");
  bar.append(makeField(date), blocks);
  main.appendChild(bar);

  const done = offDay ? new Set() : sessionsDoneIn(state.sessions, current.blockIndex);
  main.append(dayRow("blockset sessions", DAY_KEYS, done), dayRow("blockset offdays", OFF_KEYS, new Set()));

  const head = el("div", "dayhead");
  head.innerHTML = `<div class="dayhead-text"><p class="eyebrow"><b>${offDay ? "Version" : "Week"} ${current.block}</b> · Cycle ${cycleNumber(current.blockIndex)}</p><h2 data-text="${plan.focus}">${plan.focus}</h2></div>`;
  if(plan.travel) head.appendChild(placeSwitch(plan));
  main.appendChild(head);

  const legend = el("div", "legend");
  legend.innerHTML = `<span><em class="ghost">45</em> last time</span><span><em class="up">${TREND_ICON.up}</em> beat it</span><span><em class="same">${TREND_ICON.same}</em> matched</span><span><em class="down">${TREND_ICON.down}</em> below</span>`;
  main.appendChild(legend);

  let position = 0;
  const addCards = slots => slots.forEach(slot =>
    main.appendChild(exerciseCard(resolveSlot(slot, current.swaps), ++position, slot)));
  if(plan.sections){
    plan.sections.forEach(section => {
      main.appendChild(el("p", "section-label", sectionLabel(section)));
      addCards(section.ex);
    });
  } else {
    addCards(plan.ex);
  }

  if(plan.core){
    main.appendChild(el("p", "section-label", "Core finisher · 3 supersets, 2 rounds each"));
    plan.core.forEach((pair, i) =>
      main.appendChild(corePairCard(pair.map(slot => resolveSlot(slot, current.swaps)), i, pair)));
  }

  const strays = strayExercises(plan);
  if(strays.length){
    main.appendChild(el("p", "section-label", "Not in this session"));
    strays.forEach(exercise => main.appendChild(exerciseCard(exercise, null, null)));
  }

  main.appendChild(notesCard());
}

function dayRow(className, keys, done){
  const current = state.current;
  const row = choiceRow(className, keys.map(day => ({
    label: DAYS[day].short,
    key: "day:" + day,
    chosen: day === current.day,
    onPick: () => setDay(day)
  })), {ghost: true});
  keys.forEach((day, i) => {
    if(!done.has(day) || day === current.day) return;
    const mark = el("i", "icon day-done", "check");
    mark.title = "Logged this week";
    row.children[i].appendChild(mark);
  });
  return row;
}

function sectionLabel(section){
  if(section.on) return `${section.name} · ${section.rounds} rounds · ${section.on}s on, ${section.off}s off`;
  if(section.rounds) return `${section.name} · ${section.rounds} rounds`;
  return section.name;
}

function placeSwitch(plan){
  const away = isAway(plan);
  const wrap = el("div", "place-wrap");
  wrap.append(el("p", "eyebrow", "Location"), choiceRow("blockset place", [
    {label: "gym", key: "place:gym", title: "The gym versions", chosen: !away,
     onPick: () => { if(away) setTravel(plan, false); }},
    {label: "away", key: "place:away", title: "No-equipment versions for travel", chosen: away,
     onPick: () => { if(!away) setTravel(plan, true); }}
  ], {ghost: true}));
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
  const box = el("div", "notes");
  makePanel(box);
  const label = el("label", null, "Notes");
  label.setAttribute("for", "notes");
  const area = el("textarea");
  area.id = "notes";
  area.value = state.current.notes || "";
  area.placeholder = "How it felt, what was occupied, anything worth remembering next cycle.";
  const save = () => setNotes(area.value);
  area.addEventListener("change", save);
  area.addEventListener("blur", save);
  box.append(label, makeField(area));
  return box;
}
