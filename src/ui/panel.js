export function makePanel(el, options = {}){
  const {tone = "primary"} = options;
  el.classList.add("panel");
  el.dataset.tone = tone;
  const plate = document.createElement("span");
  plate.className = "panel-plate";
  el.appendChild(plate);
  return el;
}
