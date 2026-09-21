import {makeButton} from "../../ui/button.js";
import {makeField} from "../../ui/field.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";

let sheet, title, body;

export function mountSheet(sheetEl, titleEl, bodyEl, closeEl, backdropEl){
  sheet = sheetEl;
  title = titleEl;
  body = bodyEl;
  makeButton(closeEl, {tone: "secondary", ghost: true});
  closeEl.addEventListener("click", closeSheet);
  backdropEl.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !sheet.hidden) closeSheet(); });
}

export function closeSheet(){ sheet.hidden = true; }

export function openSheet(heading){
  title.textContent = heading;
  body.innerHTML = "";
  sheet.hidden = false;
  body.scrollTop = 0;
  return body;
}

export function sheetGroup(text){
  body.appendChild(el("p", "sheet-group", text));
}

export function sheetEntry(placeholder, buttonLabel, onSubmit, inputMode = "text"){
  const input = el("input");
  input.type = "text";
  input.inputMode = inputMode;
  input.placeholder = placeholder;
  const submit = () => onSubmit(input);
  input.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
  const row = el("div", "sheet-custom");
  row.append(makeField(input), actionButton(buttonLabel, {tone: "primary"}, submit));
  return row;
}
