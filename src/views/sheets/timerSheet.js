import {TIMER_PRESETS} from "../../data/constants.js";
import {clockFace, parseClock} from "../../rules/format.js";
import {start as startTimer, startStopwatch} from "../timer.js";
import {openSheet, closeSheet, sheetGroup} from "./sheet.js";
import {makeButton} from "../../ui/button.js";
import {makeField} from "../../ui/field.js";

function customCountdown(){
  const row = document.createElement("div");
  row.className = "sheet-custom";
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.placeholder = "Seconds or m.ss";
  const use = document.createElement("button");
  makeButton(use, {label: "Start", tone: "primary"});
  const submit = () => {
    const seconds = parseClock(input.value);
    if(!seconds){ input.value = ""; input.placeholder = "Try 90 or 1.30"; return; }
    startTimer(seconds);
    closeSheet();
  };
  use.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if(e.key === "Enter") submit(); });
  row.append(makeField(input), use);
  return row;
}

export function openTimerSheet(){
  const body = openSheet("Timer");
  sheetGroup("Count down");
  const presets = document.createElement("div");
  presets.className = "sheet-presets";
  TIMER_PRESETS.forEach(seconds => {
    const button = document.createElement("button");
    makeButton(button, {label: clockFace(seconds), tone: "primary", key: "preset:" + seconds});
    button.addEventListener("click", () => { startTimer(seconds); closeSheet(); });
    presets.appendChild(button);
  });
  body.appendChild(presets);
  body.appendChild(customCountdown());
  sheetGroup("Count up");
  const watch = document.createElement("button");
  watch.className = "sheet-item";
  watch.innerHTML = "<span>Stopwatch</span><em>tap the clock to stop</em>";
  watch.addEventListener("click", () => { startStopwatch(); closeSheet(); });
  body.appendChild(watch);
}
