import {CONFIRM_WINDOW_MS} from "../data/constants.js";
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

export function confirmButton(label, prompt, options, onConfirm){
  const button = makeButton(el("button"), Object.assign({label}, options));
  button.addEventListener("click", event => {
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
