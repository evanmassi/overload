import {BEEP_COUNTDOWN, BEEP_GO} from "./constants.js";
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

export function unlockAudio(){
  const Ctor = AudioCtor();
  if(!Ctor) return false;
  if(!ctx){
    try{ ctx = new Ctor(); }
    catch(e){ return false; }
  }
  if(ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx.state === "running";
}

function tone({freq, seconds, volume}){
  if(!ctx || ctx.state !== "running") return false;
  const at = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + seconds + 0.03);
  return true;
}

export function beepCountdown(){ return on ? tone(BEEP_COUNTDOWN) : false; }
export function beepGo(){ return on ? tone(BEEP_GO) : false; }

export function testTone(){
  unlockAudio();
  return tone(BEEP_GO);
}
