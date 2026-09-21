const FIRE_WINDOW_MS = 1000;
const CLICK_GUARD_MS = 300;
const LAYERS = ["side-l", "side-r", "plate", "glow", "bloom", "frame", "fill", "stripe", "halo", "hair", "hair-echo"];
const CORNERS = ["tl", "tr", "bl", "br"];
const HOLD_KEYS = new Set(["Enter", " "]);

const PHASE_STEP_MS = 3646;

const recentFires = new Map();

let phase = 0;

function make(name){
  const span = document.createElement("span");
  span.className = "btn-" + name;
  return span;
}

function layer(host, name){
  return host.appendChild(make(name));
}

function brackets(host){
  [true, false].forEach(echo => CORNERS.forEach(corner => {
    const span = layer(host, "bracket");
    span.dataset.corner = corner;
    if(echo) span.dataset.echo = "";
  }));
}

function wire(el, key){
  let hover = false;
  let held = false;
  let fired = false;
  let clear = null;
  let lastFire = 0;

  const paint = () => {
    el.dataset.state = held ? "held" : hover ? "hover" : "idle";
    if(fired) el.dataset.fired = "";
    else el.removeAttribute("data-fired");
  };

  const expire = ms => {
    clearTimeout(clear);
    clear = setTimeout(() => { fired = false; paint(); }, ms);
  };

  const fire = () => {
    lastFire = Date.now();
    if(key) recentFires.set(key, lastFire);
    if(fired){
      el.removeAttribute("data-fired");
      void el.offsetWidth;
    }
    fired = true;
    held = false;
    paint();
    expire(FIRE_WINDOW_MS);
  };

  el.addEventListener("pointerenter", () => { hover = true; paint(); });
  el.addEventListener("pointerleave", () => { hover = false; held = false; paint(); });
  el.addEventListener("pointerdown", () => { held = true; paint(); });
  el.addEventListener("pointerup", event => {
    if(event.pointerType === "touch") hover = false;
    if(held) fire();
  });
  el.addEventListener("click", () => { if(Date.now() - lastFire > CLICK_GUARD_MS) fire(); });
  el.addEventListener("keydown", event => {
    if(!HOLD_KEYS.has(event.key) || event.repeat) return;
    event.preventDefault();
    held = true;
    paint();
  });
  el.addEventListener("keyup", event => { if(HOLD_KEYS.has(event.key) && held) fire(); });

  const replay = key ? FIRE_WINDOW_MS - (Date.now() - (recentFires.get(key) || 0)) : 0;
  if(replay > 0 && replay <= FIRE_WINDOW_MS){ fired = true; expire(replay); }
  paint();
}

export function makeButton(el, options = {}){
  const {tone = "primary", ghost = false, key} = options;
  const text = options.label === undefined ? el.textContent : options.label;
  el.textContent = "";
  el.type = "button";
  el.classList.add("btn");
  el.dataset.tone = tone;
  el.style.setProperty("--s-lag", -(phase++ * PHASE_STEP_MS) + "ms");
  if(ghost) el.dataset.ghost = "";
  LAYERS.forEach(name => layer(el, name));
  brackets(el);
  const word = layer(el, "word");
  const label = layer(el, "label");
  layer(el, "face");
  el.setLabel = value => {
    word.textContent = value;
    label.textContent = value;
    el.dataset.label = value;
  };
  el.setChosen = on => {
    el.dataset.chosen = on ? "on" : "off";
    el.setAttribute(el.getAttribute("role") === "tab" ? "aria-selected" : "aria-pressed", String(on));
  };
  el.setLabel(text);
  if(options.chosen !== undefined) el.setChosen(options.chosen);
  wire(el, key);
  return el;
}

export function makeIconButton(el, options = {}){
  const {icon, label, size, glyph: glyphSize} = options;
  makeButton(el, Object.assign({}, options, {label: ""}));
  const marks = [layer(el.querySelector(".btn-word"), "glyph"), layer(el.querySelector(".btn-label"), "glyph")];
  el.classList.add("btn-icon");
  if(size) el.style.setProperty("--s-size", size + "px");
  if(glyphSize) el.style.setProperty("--s-glyph", glyphSize + "px");
  el.setLabel = value => {
    marks.forEach(mark => { mark.textContent = value; });
    el.dataset.label = value;
  };
  el.setLabel(icon);
  el.setAttribute("aria-label", label || icon);
  return el;
}
