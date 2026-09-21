import {SESSIONS_KEY, CUSTOM_KEY, SOUND_KEY, HOLD_KEY, LEGACY_DAY_KEYS} from "./constants.js";

const LEGACY_SESSIONS_KEY = "ironledger.v1";

function readJson(key, fallbackKey){
  try{
    const raw = localStorage.getItem(key) || (fallbackKey && localStorage.getItem(fallbackKey));
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}

function writeJson(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch(e){ return false; }
}

export function migrateLegacySessions(store){
  for(const key in store){
    const session = store[key];
    if(!session) continue;
    if(LEGACY_DAY_KEYS[session.day]) session.day = LEGACY_DAY_KEYS[session.day];
    if(!session.date) session.date = key;
  }
  return store;
}

export function loadSessions(){ return migrateLegacySessions(readJson(SESSIONS_KEY, LEGACY_SESSIONS_KEY)); }
export function saveSessions(sessions){ return writeJson(SESSIONS_KEY, sessions); }

export function loadCustomNames(){ return readJson(CUSTOM_KEY); }
export function saveCustomNames(names){ return writeJson(CUSTOM_KEY, names); }

export function loadHolds(){ return readJson(HOLD_KEY); }
export function saveHolds(holds){ return writeJson(HOLD_KEY, holds); }

export function loadSoundOn(){
  try{ return localStorage.getItem(SOUND_KEY) !== "off"; }
  catch(e){ return true; }
}

export function saveSoundOn(value){
  try{ localStorage.setItem(SOUND_KEY, value ? "on" : "off"); return true; }
  catch(e){ return false; }
}
