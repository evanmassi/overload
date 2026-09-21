import {strandButton} from "../../strand/button.js";

let sheet, title, body;

export function mountSheet(sheetEl, titleEl, bodyEl, closeEl, backdropEl){
  sheet = sheetEl;
  title = titleEl;
  body = bodyEl;
  strandButton(closeEl, {tone: "secondary", ghost: true});
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
  const heading = document.createElement("p");
  heading.className = "sheet-group";
  heading.textContent = text;
  body.appendChild(heading);
}
