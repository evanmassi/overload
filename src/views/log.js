import {BLOCKS, DAY_KEYS, CROSS_KEYS, DAYS, TREND_ICON, DEFAULT_REST, RECENT_DAYS, LIFTING_LABEL, CROSS_LABEL} from "../data/constants.js";
import {findExercise} from "../rules/exercises.js";
import {workoutOf, corePairs} from "../rules/workouts.js";
import {recentDays, previousOf} from "../rules/rotation.js";
import {daysAgoLabel} from "../rules/format.js";
import {state} from "../store/state.js";
import {exerciseName} from "../store/customs.js";
import {resolveSlot, resolvedExercises, strayIds} from "../store/slots.js";
import {loadDate, chooseBlock, setDay, setNotes, isAway, setTravel, resetSwaps} from "../store/session.js";
import {makeField} from "../ui/field.js";
import {makePanel} from "../ui/panel.js";
import {el} from "./dom.js";
import {choiceRow, groupedRow, confirmButton} from "./controls.js";
import {exerciseCard, corePairCard} from "./exerciseCard.js";

export function renderLog(main){
  const current = state.current;
  const workout = workoutOf(current);

  const date = el("input", "date-input");
  date.type = "date";
  date.value = current.date;
  date.addEventListener("change", () => { if(date.value) loadDate(date.value); });
  const blocks = choiceRow("blockset", BLOCKS.map(letter => ({
    label: letter,
    key: "block:" + letter,
    title: "Version " + letter,
    chosen: letter === current.block,
    onPick: () => chooseBlock(letter)
  })));
  const bar = el("div", "daybar");
  bar.append(makeField(date, {steady: true}), blocks);
  main.appendChild(bar);

  const recent = recentDays(state.sessions, new Date());
  main.append(groupedRow(LIFTING_LABEL, dayRow("blockset lifting", DAY_KEYS, recent)),
    groupedRow(CROSS_LABEL, dayRow("blockset cross", CROSS_KEYS, recent)));

  const head = el("div", "dayhead");
  head.innerHTML = `<div class="dayhead-text"><p class="eyebrow"><b>Version ${current.block}</b>${lastTimeNote()}</p><h2 data-text="${workout.focus}">${workout.focus}</h2></div>`;
  if(workout.travel) head.appendChild(placeSwitch(workout));
  main.appendChild(head);

  const legend = el("div", "legend");
  legend.innerHTML = `<span><em class="ghost">45</em> last time</span><span><em class="up">${TREND_ICON.up}</em> beat it</span><span><em class="same">${TREND_ICON.same}</em> matched</span><span><em class="down">${TREND_ICON.down}</em> below</span>`;
  main.appendChild(legend);

  let position = 0;
  let pairIndex = 0;
  const resolve = slot => resolveSlot(slot, current.swaps);
  workout.sections.forEach(section => {
    const label = SECTION_LABEL[section.kind](section);
    if(label) main.appendChild(el("p", "section-label", label));
    if(section.kind === "core")
      corePairs(section).forEach(pair => main.appendChild(corePairCard(pair.map(resolve), pairIndex++, pair)));
    else
      section.ex.forEach(slot => main.appendChild(exerciseCard(resolve(slot), ++position, slot)));
  });

  const strays = strayExercises(workout);
  if(strays.length){
    main.appendChild(el("p", "section-label", "Not in this session"));
    strays.forEach(exercise => main.appendChild(exerciseCard(exercise, null, null)));
  }

  main.appendChild(notesCard());
  const swapped = resolvedExercises(workout, current.swaps).filter(exercise => exercise.swappedFrom).length;
  if(swapped) main.appendChild(resetRow(swapped));
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
    if(!done.has(day)) return;
    const mark = el("i", "icon day-done", "check");
    mark.title = `Done in the last ${RECENT_DAYS} days`;
    row.children[i].appendChild(mark);
  });
  return row;
}

function lastTimeNote(){
  const current = state.current;
  const previous = previousOf(state.sessions, current.day, current.key);
  return previous ? ` · last time ${previous.block}, ${daysAgoLabel(previous.date, current.date)}` : "";
}

const SECTION_LABEL = {
  straight: () => null,
  core: section => `${section.name} · ${section.ex.length / 2} supersets, ${section.rounds} rounds each`,
  interval: section => `${section.name} · ${section.rounds} rounds · ${section.on}s on, ${section.off}s off`,
  circuit: section => `${section.name} · ${section.rounds} rounds`,
  finish: section => section.name
};

function placeSwitch(workout){
  const away = isAway(workout);
  const wrap = el("div", "place-wrap");
  wrap.append(el("p", "eyebrow", "Location"), choiceRow("blockset place", [
    {label: "gym", key: "place:gym", title: "The gym versions", chosen: !away,
     onPick: () => { if(away) setTravel(workout, false); }},
    {label: "away", key: "place:away", title: "No-equipment versions for travel", chosen: away,
     onPick: () => { if(!away) setTravel(workout, true); }}
  ], {ghost: true}));
  return wrap;
}

function resetRow(swapped){
  const row = el("div", "swap-reset");
  row.append(el("p", "eyebrow", `${swapped} swapped from the program`),
    confirmButton("reset", "sure?", {tone: "secondary", ghost: true, key: "swap-reset"}, resetSwaps));
  return row;
}

function strayExercises(workout){
  const entries = state.current.entries;
  return strayIds(state.current, workout)
    .map(id => Object.assign(
      {id, n: exerciseName(id), s: entries[id].length, r: "", rest: DEFAULT_REST, restAfter: DEFAULT_REST},
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
  area.placeholder = "How it felt, what was occupied, anything worth remembering next time.";
  const save = () => setNotes(area.value);
  area.addEventListener("change", save);
  area.addEventListener("blur", save);
  box.append(label, makeField(area));
  return box;
}
