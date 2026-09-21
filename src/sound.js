import {BEEP_COUNTDOWN, BEEP_GO, BEEP_PULSE_GAP_SECONDS, BEEP_RELEASE_SECONDS, FINAL_COUNTDOWN_SECONDS,
        BEEP_LATE_TOLERANCE_SECONDS} from "./constants.js";
import {loadSoundOn, saveSoundOn} from "./storage.js";

let ctx = null;
let on = true;
let restEndsAt = 0;
let placed = [];

const AudioCtor = () =>
  typeof window === "undefined" ? null : (window.AudioContext || window.webkitAudioContext || null);

export function soundOn(){ return on; }

export function loadSoundPreference(){
  on = loadSoundOn();
  return on;
}

export function setSoundOn(value){
  on = !!value;
  saveSoundOn(on);
  if(on){ if(unlockAudio() && restEndsAt) place(); }
  else dropPlaced();
  return on;
}

export function audioState(){
  if(!AudioCtor()) return "unsupported";
  return ctx ? ctx.state : "idle";
}

const running = () => !!ctx && ctx.state === "running";
const needsResume = () => ctx.state !== "running" && ctx.state !== "closed";

function onStateChange(){
  if(running()){ if(restEndsAt) place(); }
  else dropPlaced();
}

export function unlockAudio(){
  const Ctor = AudioCtor();
  if(!Ctor) return false;
  if(!ctx){
    try{ ctx = new Ctor(); }
    catch(e){ return false; }
    ctx.onstatechange = onStateChange;
  }
  // PITFALL: Safari reports "interrupted", not "suspended", after a lock or another app's audio, and only resume() clears it.
  if(needsResume()) ctx.resume().catch(() => {});
  return running();
}

function schedule({wave, volume, pulses}, startAt){
  let at = startAt;
  const nodes = [];
  for(const {freq, seconds} of pulses){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
    gain.gain.setValueAtTime(volume, at + seconds - Math.min(BEEP_RELEASE_SECONDS, seconds / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + seconds + 0.02);
    nodes.push(osc);
    at += seconds + BEEP_PULSE_GAP_SECONDS;
  }
  return nodes;
}

const silence = groups => groups.forEach(group => group.nodes.forEach(osc => { try{ osc.stop(); }catch(e){} }));

function dropPlaced(){
  silence(placed);
  placed = [];
}

function dropPending(){
  const now = ctx.currentTime;
  silence(placed.filter(group => group.at > now));
  placed = placed.filter(group => group.at <= now);
}

function place(){
  dropPending();
  const untilEnd = (restEndsAt - Date.now()) / 1000;
  for(let left = FINAL_COUNTDOWN_SECONDS; left >= 0; left--){
    const offset = untilEnd - left;
    if(offset < -BEEP_LATE_TOLERANCE_SECONDS) continue;
    const at = ctx.currentTime + Math.max(0, offset);
    placed.push({at, nodes: schedule(left ? BEEP_COUNTDOWN : BEEP_GO, at)});
  }
}

export function scheduleRest(endsAt){
  restEndsAt = endsAt;
  if(!on) return false;
  if(!unlockAudio()) return false;
  place();
  return true;
}

export function cancelRest(){
  restEndsAt = 0;
  dropPlaced();
}

export function testTone(){
  if(!unlockAudio()) return false;
  schedule(BEEP_GO, ctx.currentTime);
  return true;
}
