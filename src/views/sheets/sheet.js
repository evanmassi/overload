import {SHEET_PICK_MS, SHEET_CLOSE_MS} from "../../data/constants.js";
import {makeIconButton} from "../../ui/button.js";
import {makeField} from "../../ui/field.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";

let sheet, title, body, closing = null;

export function mountSheet(sheetEl, titleEl, bodyEl, closeEl, backdropEl){
  sheet = sheetEl;
  title = titleEl;
  body = bodyEl;
  sheet.style.setProperty("--sheet-close", SHEET_CLOSE_MS + "ms");
  makeIconButton(closeEl, {icon: "close", label: "Close", tone: "secondary", ghost: true, size: 30, glyph: 18});
  closeEl.addEventListener("click", closeSheet);
  backdropEl.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !sheet.hidden) closeSheet(); });
}

export function closeSheet(){
  if(sheet.hidden || closing) return;
  sheet.dataset.closing = "";
  closing = setTimeout(() => {
    sheet.hidden = true;
    delete sheet.dataset.closing;
    closing = null;
  }, SHEET_CLOSE_MS);
}

export function closeAfterPick(item){
  item.classList.add("picked");
  setTimeout(closeSheet, SHEET_PICK_MS);
}

export function openSheet(heading, kicker = null){
  title.textContent = kicker ? "" : heading;
  if(kicker) title.append(el("small", "sheet-kicker", kicker), el("span", null, heading));
  body.innerHTML = "";
  clearTimeout(closing);
  closing = null;
  delete sheet.dataset.closing;
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
