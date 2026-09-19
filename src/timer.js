import {DEFAULT_REST, TIMER_TICK_MS, TIMER_RESET_DELAY_MS, LIVE_FINISH_MS, VIBRATE_PATTERN,
        WARN_COUNTDOWN_SECONDS, FINAL_COUNTDOWN_SECONDS} from "./constants.js";
import {scheduleRest, cancelRest} from "./sound.js";
import {strandButton} from "./strand/button.js";

const timer = {endsAt: 0, tick: null, seconds: DEFAULT_REST, idle: DEFAULT_REST};
const awake = {lock: null, requesting: false};

let button = null;

const clockFace = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function face(label, tone, urgent){
  if(!button) return;
  button.strandLabel(label);
  button.dataset.tone = tone;
  button.dataset.urgent = urgent ? "on" : "off";
}

export function mountTimer(buttonEl){
  button = strandButton(buttonEl, {tone: "primary"});
  button.addEventListener("click", () => { timer.endsAt ? stop() : start(timer.idle); });
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState !== "visible" || !timer.endsAt) return;
    holdScreen();
    tick();
    if(timer.endsAt) scheduleRest(timer.endsAt);
  });
  showIdle();
}

function showIdle(){
  face(clockFace(timer.idle), "primary");
}

export function setIdleRest(seconds){
  timer.idle = seconds || DEFAULT_REST;
  if(!timer.endsAt) showIdle();
}

const wakeLock = () => (typeof navigator === "undefined" ? null : navigator.wakeLock) || null;

function holdScreen(){
  if(!wakeLock() || awake.lock || awake.requesting) return;
  awake.requesting = true;
  wakeLock().request("screen")
    .then(lock => {
      if(!timer.endsAt){ lock.release().catch(() => {}); return; }
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

export function start(seconds){
  timer.seconds = seconds || DEFAULT_REST;
  timer.endsAt = Date.now() + timer.seconds * 1000;
  scheduleRest(timer.endsAt);
  holdScreen();
  clearInterval(timer.tick);
  timer.tick = setInterval(tick, TIMER_TICK_MS);
  tick();
}

export function stop(){
  clearInterval(timer.tick);
  timer.endsAt = 0;
  cancelRest();
  releaseScreen();
  showIdle();
}

function tick(){
  const now = Date.now();
  const left = Math.max(0, Math.round((timer.endsAt - now) / 1000));
  face(clockFace(left), left > 0 && left <= WARN_COUNTDOWN_SECONDS ? "warning" : "primary",
    left > 0 && left <= FINAL_COUNTDOWN_SECONDS);
  if(left > 0) return;

  clearInterval(timer.tick);
  const overdueMs = now - timer.endsAt;
  timer.endsAt = 0;
  releaseScreen();
  face("go", "success");
  if(overdueMs > LIVE_FINISH_MS) cancelRest();
  else if(typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(VIBRATE_PATTERN);
  setTimeout(() => {
    if(timer.endsAt) return;
    cancelRest();
    showIdle();
  }, TIMER_RESET_DELAY_MS);
}
