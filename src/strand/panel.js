export function strandPanel(el, options = {}){
  const {tone = "primary"} = options;
  el.classList.add("spanel");
  el.dataset.tone = tone;
  const plate = document.createElement("span");
  plate.className = "spanel-plate";
  el.appendChild(plate);
  return el;
}
