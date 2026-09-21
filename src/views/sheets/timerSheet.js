import {TIMER_PRESETS} from "../../data/constants.js";
import {clockFace, parseClock} from "../../rules/format.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";
import {start as startTimer, startStopwatch} from "../timer.js";
import {openSheet, closeSheet, sheetGroup, sheetEntry} from "./sheet.js";

function customCountdown(){
  return sheetEntry("Seconds or m.ss", "Start", input => {
    const seconds = parseClock(input.value);
    if(!seconds){ input.value = ""; input.placeholder = "Try 90 or 1.30"; return; }
    startTimer(seconds);
    closeSheet();
  }, "decimal");
}

export function openTimerSheet(){
  const body = openSheet("Timer");
  sheetGroup("Count down");
  const presets = el("div", "sheet-presets");
  TIMER_PRESETS.forEach(seconds => presets.appendChild(
    actionButton(clockFace(seconds), {tone: "primary", key: "preset:" + seconds}, () => { startTimer(seconds); closeSheet(); })));
  body.append(presets, customCountdown());
  sheetGroup("Count up");
  const watch = el("button", "sheet-item");
  watch.innerHTML = "<span>Stopwatch</span><em>tap the clock to stop</em>";
  watch.addEventListener("click", () => { startStopwatch(); closeSheet(); });
  body.appendChild(watch);
}
