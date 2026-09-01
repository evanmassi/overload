import {SESSIONS_KEY, CUSTOM_KEY, LEGACY_DAY_KEYS} from "./constants.js";

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

export function migrateDayKeys(store){
  for(const date in store){
    const session = store[date];
    if(session && LEGACY_DAY_KEYS[session.day]) session.day = LEGACY_DAY_KEYS[session.day];
  }
  return store;
}

export function loadSessions(){ return migrateDayKeys(readJson(SESSIONS_KEY, LEGACY_SESSIONS_KEY)); }
export function saveSessions(sessions){ return writeJson(SESSIONS_KEY, sessions); }

export function loadCustomNames(){ return readJson(CUSTOM_KEY); }
export function saveCustomNames(names){ return writeJson(CUSTOM_KEY, names); }
