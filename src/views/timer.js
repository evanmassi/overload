import {DEFAULT_REST, TIMER_TICK_MS, TIMER_RESET_DELAY_MS, LIVE_FINISH_MS, VIBRATE_PATTERN,
        WARN_COUNTDOWN_SECONDS, FINAL_COUNTDOWN_SECONDS, LONG_PRESS_MS} from "../data/constants.js";
import {scheduleRest, cancelRest} from "./sound.js";
import {makeButton} from "../ui/button.js";
import {clockFace} from "../rules/format.js";

const RUNNING_TONE = {rest: "primary", work: "secondary", stopwatch: "secondary"};

const timer = {mode: null, endsAt: 0, startedAt: 0, tick: null, settle: null, idle: DEFAULT_REST, onDone: null, forSet: null};
const awake = {lock: null, requesting: false};
const press = {timer: null, expire: null, fired: false};

let button = null;

function face(label, tone, urgent){
  if(!button) return;
  button.setLabel(label);
  button.dataset.tone = tone;
  button.dataset.urgent = urgent ? "on" : "off";
}

export function mountTimer(buttonEl, options = {}){
  button = makeButton(buttonEl, {tone: "primary", steady: true});
  button.addEventListener("click", () => {
    if(press.fired){ press.fired = false; return; }
    timer.mode ? stop() : start(timer.idle);
  });
  if(options.onHold) wireLongPress(options.onHold);
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState !== "visible" || !timer.mode) return;
    holdScreen();
    tick();
    if(timer.endsAt) scheduleRest(timer.endsAt);
  });
  showIdle();
}

function wireLongPress(onHold){
  const arm = () => {
    clearTimeout(press.timer);
    clearTimeout(press.expire);
    press.fired = false;
    press.timer = setTimeout(() => { press.fired = true; onHold(); }, LONG_PRESS_MS);
  };
  const disarm = () => {
    clearTimeout(press.timer);
    clearTimeout(press.expire);
    if(press.fired) press.expire = setTimeout(() => { press.fired = false; }, LONG_PRESS_MS);
  };
  button.addEventListener("pointerdown", arm);
  ["pointerup", "pointerleave", "pointercancel"].forEach(type => button.addEventListener(type, disarm));
  button.addEventListener("contextmenu", event => event.preventDefault());
}

function showIdle(){
  face(clockFace(timer.idle), "primary");
}

export function setIdleRest(seconds){
  if(!seconds) return;
  timer.idle = seconds;
  if(!timer.mode) showIdle();
}

const wakeLock = () => (typeof navigator === "undefined" ? null : navigator.wakeLock) || null;

function holdScreen(){
  if(!wakeLock() || awake.lock || awake.requesting) return;
  awake.requesting = true;
  wakeLock().request("screen")
    .then(lock => {
      if(!timer.mode){ lock.release().catch(() => {}); return; }
      awake.lock = lock;
      lock.addEventListener("release", () => { if(awake.lock === lock) awake.lock = null; });
    })
    .catch(() => {})
    .finally(() => { awake.requesting = false; });
}

function releaseScreen(){
  if(awake.lock) awake.lock.release().catch(() => {});
  awake.lock = null;
}

function run(kind, seconds, onDone, forSet){
  clearTimeout(timer.settle);
  clearInterval(timer.tick);
  timer.mode = kind;
  timer.onDone = onDone || null;
  timer.forSet = forSet || null;
  timer.startedAt = Date.now();
  timer.endsAt = seconds ? timer.startedAt + seconds * 1000 : 0;
  if(timer.endsAt) scheduleRest(timer.endsAt);
  else cancelRest();
  holdScreen();
  timer.tick = setInterval(tick, TIMER_TICK_MS);
  tick();
}

export function start(seconds, forSet){ run("rest", seconds || DEFAULT_REST, null, forSet); }

export function restRunningFor(forSet){ return timer.mode === "rest" && timer.forSet === forSet; }

export function startWork(seconds, onDone){ run("work", seconds, onDone); }

export function startStopwatch(){ run("stopwatch", 0); }

function clear(){
  clearInterval(timer.tick);
  timer.mode = null;
  timer.endsAt = 0;
  timer.onDone = null;
  timer.forSet = null;
  releaseScreen();
}

export function stop(){
  clearTimeout(timer.settle);
  const elapsed = timer.mode === "stopwatch" ? Math.floor((Date.now() - timer.startedAt) / 1000) : null;
  clear();
  cancelRest();
  if(elapsed === null) showIdle();
  else settle(clockFace(elapsed), "success");
}

function settle(label, tone){
  face(label, tone);
  timer.settle = setTimeout(() => {
    if(timer.mode) return;
    cancelRest();
    showIdle();
  }, TIMER_RESET_DELAY_MS);
}

function tick(){
  const now = Date.now();
  if(timer.mode === "stopwatch"){
    face(clockFace(Math.floor((now - timer.startedAt) / 1000)), RUNNING_TONE.stopwatch);
    return;
  }
  const left = Math.max(0, Math.round((timer.endsAt - now) / 1000));
  face(clockFace(left), left > 0 && left <= WARN_COUNTDOWN_SECONDS ? "warning" : RUNNING_TONE[timer.mode],
    left > 0 && left <= FINAL_COUNTDOWN_SECONDS);
  if(left > 0) return;

  const overdueMs = now - timer.endsAt;
  const onDone = timer.onDone;
  clear();
  if(overdueMs > LIVE_FINISH_MS) cancelRest();
  else if(typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(VIBRATE_PATTERN);
  settle("go", "success");
  if(onDone) onDone();
}
