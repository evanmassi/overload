import {state, notify, persistSessions} from "./state.js";
import {loggedCount} from "./progression.js";
import {migrateDayKeys} from "./storage.js";
import {loadDate, iso} from "./session.js";

let statusHandler = () => {};
export function onBackupStatus(fn){ statusHandler = fn; }

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
  migrateDayKeys(state.sessions);
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
    catch(e){ statusHandler("bad file"); return; }
    if(!incoming || typeof incoming !== "object"){ statusHandler("bad file"); return; }

    const merged = mergeSessions(incoming);
    persistSessions();
    loadDate(state.current.date);
    notify();
    statusHandler(`merged ${merged}`);
  };
  reader.onerror = () => statusHandler("read failed");
  reader.readAsText(file);
}
