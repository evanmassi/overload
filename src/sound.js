import {BEEP_COUNTDOWN, BEEP_GO, BEEP_PULSE_GAP_SECONDS, BEEP_RESUME_TIMEOUT_MS} from "./constants.js";
import {loadSoundOn, saveSoundOn} from "./storage.js";

let ctx = null;
let on = true;

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
  if(on) unlockAudio();
  return on;
}

export function audioState(){
  if(!AudioCtor()) return "unsupported";
  return ctx ? ctx.state : "idle";
}

const needsResume = () => ctx.state !== "running" && ctx.state !== "closed";

export function unlockAudio(){
  const Ctor = AudioCtor();
  if(!Ctor) return false;
  if(!ctx){
    try{ ctx = new Ctor(); }
    catch(e){ return false; }
  }
  // PITFALL: Safari reports "interrupted", not "suspended", after a lock or another app's audio, and only resume() clears it.
  if(needsResume()) ctx.resume().catch(() => {});
  return ctx.state === "running";
}

function schedule({wave, volume, pulses}){
  let at = ctx.currentTime;
  for(const {freq, seconds} of pulses){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
    gain.gain.setValueAtTime(volume, at + seconds - 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + seconds + 0.02);
    at += seconds + BEEP_PULSE_GAP_SECONDS;
  }
}

function tone(spec){
  if(unlockAudio()){
    schedule(spec);
    return true;
  }
  if(!ctx || !needsResume()) return false;
  const askedAt = Date.now();
  ctx.resume()
    .then(() => { if(Date.now() - askedAt <= BEEP_RESUME_TIMEOUT_MS) schedule(spec); })
    .catch(() => {});
  return false;
}

export function beepCountdown(){ return on ? tone(BEEP_COUNTDOWN) : false; }
export function beepGo(){ return on ? tone(BEEP_GO) : false; }

export function testTone(){
  return tone(BEEP_GO);
}
