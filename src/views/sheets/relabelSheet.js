import {BLOCKS, DAY_KEYS, CROSS_KEYS, DAYS} from "../../data/constants.js";
import {state} from "../../store/state.js";
import {relabelSession} from "../../store/session.js";
import {el} from "../dom.js";
import {choiceRow} from "../controls.js";
import {openSheet, closeAfterPick} from "./sheet.js";

export function openRelabelSheet(key, letter){
  const session = state.sessions[key];
  if(!session) return;
  const body = openSheet("File this session as");
  body.appendChild(choiceRow("blockset", BLOCKS.map(option => ({
    label: option,
    key: "relabel:" + option,
    title: "Version " + option,
    chosen: option === letter,
    onPick: () => openRelabelSheet(key, option)
  }))));
  [...DAY_KEYS, ...CROSS_KEYS].forEach(day => {
    const isCurrent = day === session.day && letter === session.block;
    const button = el("button", "sheet-item" + (isCurrent ? " in-use" : ""));
    button.innerHTML = `<span>${DAYS[day].label} ${letter}</span>`;
    button.addEventListener("click", () => { relabelSession(key, day, letter); closeAfterPick(button); });
    body.appendChild(button);
  });
}
