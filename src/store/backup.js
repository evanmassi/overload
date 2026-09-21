import {state, changes, persistSessions} from "./state.js";
import {loggedCount} from "../rules/progression.js";
import {migrateLegacySessions} from "./storage.js";
import {loadDate} from "./session.js";
import {iso} from "../rules/format.js";

function showResult(text){
  state.backupResult = text;
  changes.notify();
}

export function exportSessions(){
  const blob = new Blob([JSON.stringify(state.sessions, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `overload-${iso(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function mergeSessions(incoming){
  let merged = 0;
  for(const date in incoming){
    const session = incoming[date];
    if(!session || !session.entries || !session.day || !session.block) continue;
    if(!state.sessions[date] || loggedCount(session) > loggedCount(state.sessions[date])){
      state.sessions[date] = session;
      merged++;
    }
  }
  migrateLegacySessions(state.sessions);
  return merged;
}

export function importSessions(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let incoming;
    try{ incoming = JSON.parse(reader.result); }
    catch(e){ showResult("bad file"); return; }
    if(!incoming || typeof incoming !== "object"){ showResult("bad file"); return; }

    const merged = mergeSessions(incoming);
    persistSessions();
    state.backupResult = `merged ${merged}`;
    loadDate(state.current.date);
  };
  reader.onerror = () => showResult("read failed");
  reader.readAsText(file);
}
