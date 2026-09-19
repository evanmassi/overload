const LAYERS = ["plate", "frame", "wash"];
const PHASE_STEP_MS = 3646;
const GOLDEN = 0.6180339887;
const CLOCK_MIN_MS = 19000;
const CLOCK_SPREAD_MS = 12000;

let phase = 0;

export function strandField(input, options = {}){
  const {tone = "primary"} = options;
  const host = document.createElement("span");
  host.className = "sfield";
  host.dataset.tone = tone;
  const index = phase++;
  host.style.setProperty("--f-clock", Math.round(CLOCK_MIN_MS + (index * GOLDEN % 1) * CLOCK_SPREAD_MS) + "ms");
  host.style.setProperty("--f-lag", -(index * PHASE_STEP_MS) + "ms");
  LAYERS.forEach(name => {
    const span = document.createElement("span");
    span.className = "sfield-" + name;
    host.appendChild(span);
  });
  input.classList.add("sfield-input");
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
