import {DAY_KEYS, OFF_KEYS, DAYS} from "../../data/constants.js";
import {state} from "../../store/state.js";
import {relabelSession} from "../../store/session.js";
import {openSheet, closeSheet} from "./sheet.js";

export function openRelabelSheet(key){
  const session = state.sessions[key];
  if(!session) return;
  const body = openSheet("File this session as");
  [...DAY_KEYS, ...OFF_KEYS].forEach(day => {
    const button = document.createElement("button");
    button.className = "sheet-item" + (day === session.day ? " current" : "");
    button.innerHTML = `<span>${DAYS[day].label}</span>`;
    button.addEventListener("click", () => { relabelSession(key, day); closeSheet(); });
    body.appendChild(button);
  });
}
