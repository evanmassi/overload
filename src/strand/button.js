const FIRE_WINDOW_MS = 1000;
const CLICK_GUARD_MS = 300;
const LAYERS = ["side-l", "side-r", "plate", "glow", "bloom", "frame", "fill", "stripe", "halo", "hair", "hair-echo"];
const CORNERS = ["tl", "tr", "bl", "br"];
const HOLD_KEYS = new Set(["Enter", " "]);

const recentFires = new Map();

function layer(host, name){
  const span = document.createElement("span");
  span.className = "sbtn-" + name;
  host.appendChild(span);
  return span;
}

function brackets(host){
  [true, false].forEach(echo => CORNERS.forEach(corner => {
    const span = layer(host, "bracket");
    span.dataset.corner = corner;
    if(echo) span.dataset.echo = "";
  }));
}

function glyph(host){
  const span = document.createElement("span");
  span.className = "sbtn-glyph";
  host.appendChild(span);
  return span;
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
    fired = true;
    held = false;
    paint();
    expire(FIRE_WINDOW_MS);
  };

  el.addEventListener("pointerenter", () => { hover = true; paint(); });
  el.addEventListener("pointerleave", () => { hover = false; held = false; paint(); });
  el.addEventListener("pointerdown", () => { held = true; paint(); });
  el.addEventListener("pointerup", () => { if(held) fire(); });
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

export function strandButton(el, options = {}){
  const {tone = "primary", ghost = false, key} = options;
  const text = options.label === undefined ? el.textContent : options.label;
  el.textContent = "";
  el.type = "button";
  el.classList.add("sbtn");
  el.dataset.tone = tone;
  if(ghost) el.dataset.ghost = "";
  LAYERS.forEach(name => layer(el, name));
  brackets(el);
  const word = layer(el, "word");
  const label = layer(el, "label");
  layer(el, "face");
  el.strandLabel = value => {
    word.textContent = value;
    label.textContent = value;
    el.dataset.label = value;
  };
  el.strandLabel(text);
  wire(el, key);
  return el;
}

export function strandIconButton(el, options = {}){
  const {icon, label, size, glyph: glyphSize} = options;
  strandButton(el, Object.assign({}, options, {label: ""}));
  const marks = [glyph(el.querySelector(".sbtn-word")), glyph(el.querySelector(".sbtn-label"))];
  el.classList.add("sbtn-icon");
  if(size) el.style.setProperty("--s-size", size + "px");
  if(glyphSize) el.style.setProperty("--s-glyph", glyphSize + "px");
  el.strandLabel = value => {
    marks.forEach(mark => { mark.textContent = value; });
    el.dataset.label = value;
  };
  el.strandLabel(icon);
  el.setAttribute("aria-label", label || icon);
  return el;
}
