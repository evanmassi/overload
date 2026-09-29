import {PHASE_STEP_MS} from "./phase.js";

const LAYERS = ["plate", "frame", "wash"];
const GOLDEN = 0.6180339887;
const CLOCK_MIN_MS = 19000;
const CLOCK_SPREAD_MS = 12000;

let phase = 0;

export function makeField(input, options = {}){
  const {steady = false} = options;
  const host = document.createElement("span");
  host.className = "field";
  host.dataset.tone = "primary";
  if(steady) host.dataset.steady = "";
  const index = phase++;
  host.style.setProperty("--f-clock", Math.round(CLOCK_MIN_MS + (index * GOLDEN % 1) * CLOCK_SPREAD_MS) + "ms");
  host.style.setProperty("--f-lag", -(index * PHASE_STEP_MS) + "ms");
  LAYERS.forEach(name => {
    const span = document.createElement("span");
    span.className = "field-" + name;
    host.appendChild(span);
  });
  input.classList.add("field-input");
  host.appendChild(input);

  let hover = false;
  let focused = false;
  const paint = () => { host.dataset.state = focused ? "focus" : hover ? "hover" : "idle"; };

  host.addEventListener("pointerenter", () => { hover = true; paint(); });
  host.addEventListener("pointerleave", () => { hover = false; paint(); });
  input.addEventListener("focus", () => { focused = true; paint(); });
  input.addEventListener("blur", () => { focused = false; paint(); });
  paint();
  return host;
}
