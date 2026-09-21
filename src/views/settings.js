import {exportSessions, importSessions, onBackupStatus} from "../store/backup.js";
import {soundOn, setSoundOn, testTone, audioState} from "./sound.js";
import {strandButton} from "../strand/button.js";

function backupControls(){
  const box = document.createElement("div");
  box.className = "backup";

  const save = document.createElement("button");
  save.addEventListener("click", exportSessions);
  strandButton(save, {label: "Export backup", tone: "primary"});

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.hidden = true;
  picker.addEventListener("change", importSessions);

  const load = document.createElement("button");
  load.addEventListener("click", () => picker.click());
  strandButton(load, {label: "Import backup", tone: "primary"});

  const result = document.createElement("span");
  result.className = "backup-result";
  onBackupStatus(text => { result.textContent = text; });

  box.append(save, load, picker, result);
  return box;
}

function backupNote(){
  const note = document.createElement("p");
  note.className = "backup-note";
  note.textContent = "Your log lives on this device. Export before clearing browser data.";
  return note;
}

function soundControls(){
  const box = document.createElement("div");
  box.className = "soundrow";

  const toggle = document.createElement("button");
  const paint = () => {
    toggle.strandLabel(soundOn() ? "Sound on" : "Sound off");
    toggle.dataset.chosen = soundOn() ? "on" : "off";
    toggle.setAttribute("aria-pressed", String(soundOn()));
  };
  toggle.addEventListener("click", () => { setSoundOn(!soundOn()); paint(); });
  strandButton(toggle, {label: "Sound off", tone: "secondary"});
  paint();

  const note = document.createElement("p");
  note.className = "sound-result";

  const test = document.createElement("button");
  strandButton(test, {label: "Test sound", tone: "primary"});
  test.addEventListener("click", () => {
    const played = testTone();
    const state = audioState();
    note.textContent = played
      ? "Played. Heard nothing? Check the ring/silent switch."
      : state === "unsupported"
        ? "This browser has no Web Audio."
        : "Blocked by the browser. Tap once more.";
  });

  box.append(toggle, test, note);
  return box;
}

function soundNote(){
  const note = document.createElement("p");
  note.className = "sound-note";
  note.textContent = "Three short beeps in the last seconds, one long high one when the rest is up. The screen stays awake while a rest runs. Switching apps pauses the clock; come back and it shows GO.";
  return note;
}

export function settingsPanel(){
  return [soundControls(), soundNote(), backupControls(), backupNote()];
}
