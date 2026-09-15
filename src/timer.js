import {DEFAULT_REST, TIMER_TICK_MS, TIMER_RESET_DELAY_MS, RESUME_GO_GRACE_MS, VIBRATE_PATTERN,
        WARN_COUNTDOWN_SECONDS, FINAL_COUNTDOWN_SECONDS} from "./constants.js";
import {beepCountdown, beepGo, unlockAudio} from "./sound.js";

const timer = {endsAt: 0, tick: null, seconds: DEFAULT_REST, idle: DEFAULT_REST, beepedAt: 0};
const awake = {lock: null, requesting: false};

let button = null;
let clock = null;

export function mountTimer(buttonEl, clockEl){
  button = buttonEl;
  clock = clockEl;
  button.addEventListener("click", () => { timer.endsAt ? stop() : start(timer.idle); });
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState !== "visible" || !timer.endsAt) return;
    holdScreen();
    tick();
  });
  showIdle();
}

function showIdle(){
  if(clock) clock.textContent = `${timer.idle}s`;
  if(button) button.classList.remove("warn", "ending");
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
  timer.beepedAt = 0;
  if(button){ button.classList.add("running"); button.classList.remove("warn", "ending", "up"); }
  unlockAudio();
  holdScreen();
  clearInterval(timer.tick);
  timer.tick = setInterval(tick, TIMER_TICK_MS);
  tick();
}

export function stop(){
  clearInterval(timer.tick);
  timer.endsAt = 0;
  releaseScreen();
  if(button) button.classList.remove("running", "warn", "ending", "up");
  showIdle();
}

function tick(){
  const now = Date.now();
  const left = Math.max(0, Math.round((timer.endsAt - now) / 1000));
  if(clock) clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  if(button){
    button.classList.toggle("warn",
      left > FINAL_COUNTDOWN_SECONDS && left <= WARN_COUNTDOWN_SECONDS);
    button.classList.toggle("ending", left > 0 && left <= FINAL_COUNTDOWN_SECONDS);
  }
  if(left > 0 && left <= FINAL_COUNTDOWN_SECONDS && timer.beepedAt !== left){
    timer.beepedAt = left;
    beepCountdown();
  }
  if(left > 0) return;

  clearInterval(timer.tick);
  const overdueMs = now - timer.endsAt;
  timer.endsAt = 0;
  releaseScreen();
  if(button){ button.classList.remove("running", "warn", "ending"); button.classList.add("up"); }
  if(clock) clock.textContent = "go";
  if(overdueMs <= RESUME_GO_GRACE_MS){
    if(typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(VIBRATE_PATTERN);
    beepGo();
  }
  setTimeout(() => {
    if(timer.endsAt) return;
    if(button) button.classList.remove("up");
    showIdle();
  }, TIMER_RESET_DELAY_MS);
}
