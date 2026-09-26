import {APP_VERSION} from "../data/constants.js";
import {state} from "../store/state.js";
import {exportSessions, importSessions} from "../store/backup.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {soundOn, setSoundOn, testTone, audioState} from "./sound.js";

function backupControls(){
  const picker = el("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.hidden = true;
  picker.addEventListener("change", importSessions);

  const box = el("div", "backup");
  box.append(
    actionButton("Export backup", {tone: "primary", steady: true}, exportSessions),
    actionButton("Import backup", {tone: "primary", steady: true}, () => picker.click()),
    picker,
    el("span", "backup-result", state.backupResult));
  return box;
}

function soundControls(){
  const toggle = actionButton("Sound off", {tone: "secondary"}, () => { setSoundOn(!soundOn()); paint(); });
  const paint = () => {
    toggle.setLabel(soundOn() ? "Sound on" : "Sound off");
    toggle.setChosen(soundOn());
  };
  paint();

  const note = el("p", "sound-result");
  const test = actionButton("Test sound", {tone: "primary", steady: true}, () => {
    const played = testTone();
    note.textContent = played
      ? "Played. Heard nothing? Check the ring/silent switch."
      : audioState() === "unsupported"
        ? "This browser has no Web Audio."
        : "Blocked by the browser. Tap once more.";
  });

  const box = el("div", "soundrow");
  box.append(toggle, test, note);
  return box;
}

export function settingsPanel(){
  return [
    soundControls(),
    el("p", "sound-note", "Three short beeps, then a long one when the rest is up. They may not play while you're in another app."),
    backupControls(),
    el("p", "backup-note", "Your log lives on this device. Export before clearing browser data."),
    el("p", "app-version", "v" + APP_VERSION)
  ];
}
