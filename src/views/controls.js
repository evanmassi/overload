import {CONFIRM_WINDOW_MS, DAY_KEYS, CROSS_KEYS, DAYS, STRENGTH_LABEL, CROSS_LABEL} from "../data/constants.js";
import {changes} from "../store/state.js";
import {makeButton} from "../ui/button.js";
import {el} from "./dom.js";

export function actionButton(label, options, onPress){
  const button = makeButton(el("button"), Object.assign({label}, options));
  button.addEventListener("click", onPress);
  return button;
}

export function choiceRow(className, choices, style = {}){
  const row = el("div", className);
  if(style.label) row.appendChild(el("span", null, style.label));
  choices.forEach(({label, key, title, chosen, onPick}) => {
    const button = actionButton(label, {tone: "secondary", ghost: style.ghost, key, chosen}, onPick);
    if(title) button.title = title;
    row.appendChild(button);
  });
  return row;
}

export function groupedRow(label, row){
  const group = el("div", "day-group");
  group.append(el("span", "day-group-label", label), row);
  return group;
}

export function workoutFilters(picked, keyPrefix){
  const row = (className, days) => choiceRow(className, days.map(day => ({
    label: DAYS[day].short,
    key: keyPrefix + day,
    chosen: picked.has(day),
    onPick: () => {
      picked.has(day) ? picked.delete(day) : picked.add(day);
      changes.notify();
    }
  })), {ghost: true});
  return [groupedRow(STRENGTH_LABEL, row("blockset strength", DAY_KEYS)), groupedRow(CROSS_LABEL, row("blockset cross", CROSS_KEYS))];
}

export function confirmButton(label, prompt, options, onConfirm){
  const button = actionButton(label, options, event => {
    event.stopPropagation();
    if(button.dataset.armed){ onConfirm(); return; }
    button.dataset.armed = "1";
    button.setLabel(prompt);
    setTimeout(() => {
      delete button.dataset.armed;
      button.setLabel(label);
    }, CONFIRM_WINDOW_MS);
  });
  return button;
}
