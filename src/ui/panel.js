export function makePanel(el){
  el.classList.add("panel");
  el.dataset.tone = "primary";
  const plate = document.createElement("span");
  plate.className = "panel-plate";
  el.appendChild(plate);
  return el;
}
