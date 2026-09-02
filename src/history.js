import {CONFIRM_WINDOW_MS, ICON_SWAP} from "./constants.js";
import {workoutFor} from "./movements.js";
import {state, notify} from "./state.js";
import {loggedCount, sessionVolume} from "./progression.js";
import {exerciseName} from "./swaps.js";
import {loadDate, deleteSession} from "./session.js";
import {setSummary, elapsedLabel, unitSuffix} from "./format.js";
import {exportSessions, importSessions, onBackupStatus} from "./backup.js";
import {soundOn, setSoundOn, testTone, audioState} from "./sound.js";

function historyLine(session, slot){
  const swapped = session.swaps && session.swaps[slot.id];
  const id = swapped || slot.id;
  const sets = (session.entries || {})[id];
  if(!sets || !sets.some(set => set && set.r)) return null;

  const line = document.createElement("div");
  line.className = "hist-line";
  const name = swapped ? exerciseName(id) : slot.n;
  const mark = swapped
    ? `<i class="hist-swap" title="Swapped in for ${slot.n}" aria-label="Swapped in for ${slot.n}">${ICON_SWAP}</i>`
    : "";
  line.innerHTML = `<span>${name}${mark}</span><b>${setSummary(sets, unitSuffix(slot))}</b>`;
  return line;
}

export function renderHistory(main){
  const dates = Object.keys(state.sessions).sort().reverse();
  if(!dates.length){
    main.innerHTML = `<p class="empty">Nothing logged yet. Fill in a set on the Log tab and it shows up here.</p>`;
    main.append(soundControls(), soundNote(), backupControls(), backupNote());
    return;
  }

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = `${dates.length} sessions`;
  main.appendChild(label);

  dates.forEach(date => {
    const session = state.sessions[date];
    const plan = workoutFor(session.block, session.day);
    if(!plan) return;

    const card = document.createElement("div");
    card.className = "hist-day hist-open";
    card.title = "Open this session to fix it";
    card.addEventListener("click", () => {
      loadDate(date);
      state.view = "log";
      notify();
      window.scrollTo(0, 0);
    });
    card.innerHTML = `<div class="hist-top"><h3>${plan.focus}</h3><span class="chip live">${session.block}</span><span class="chip">${date}</span></div>`;

    const remove = document.createElement("button");
    remove.textContent = "delete";
    remove.addEventListener("click", event => {
      event.stopPropagation();
      if(remove.dataset.armed){ deleteSession(date); return; }
      remove.dataset.armed = "1";
      remove.textContent = "sure?";
      setTimeout(() => { delete remove.dataset.armed; remove.textContent = "delete"; }, CONFIRM_WINDOW_MS);
    });
    card.querySelector(".hist-top").appendChild(remove);

    plan.ex.forEach(slot => {
      const line = historyLine(session, slot);
      if(line) card.appendChild(line);
    });

    const supersets = (plan.core || [])
      .map(pair => pair.map(slot => historyLine(session, slot)).filter(Boolean))
      .filter(lines => lines.length);

    if(supersets.length){
      const label = document.createElement("p");
      label.className = "hist-sub";
      label.textContent = "Core finisher";
      card.appendChild(label);
      supersets.forEach(lines => {
        const group = document.createElement("div");
        group.className = "hist-super";
        lines.forEach(line => group.appendChild(line));
        card.appendChild(group);
      });
    }

    const foot = document.createElement("div");
    foot.className = "hist-foot";
    const took = elapsedLabel(session.startedAt, session.lastLoggedAt);
    foot.innerHTML = [
      `<b>${sessionVolume(session, session.block, session.day).toLocaleString()} lb</b>`,
      `<span>${loggedCount(session)} sets</span>`,
      took ? `<span>${took}</span>` : ""
    ].join("");
    card.appendChild(foot);

    if(session.notes){
      const note = document.createElement("p");
      note.className = "hist-notes";
      note.textContent = session.notes;
      card.appendChild(note);
    }

    main.appendChild(card);
  });

  main.append(soundControls(), soundNote(), backupControls(), backupNote());
}

function backupControls(){
  const box = document.createElement("div");
  box.className = "backup";

  const save = document.createElement("button");
  save.className = "btn";
  save.textContent = "Export backup";
  save.addEventListener("click", exportSessions);

  const load = document.createElement("label");
  load.className = "btn";
  load.textContent = "Import backup";
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.hidden = true;
  picker.addEventListener("change", importSessions);
  load.appendChild(picker);

  const result = document.createElement("span");
  result.className = "backup-result";
  onBackupStatus(text => { result.textContent = text; });

  box.append(save, load, result);
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
  toggle.className = "btn";
  const paint = () => {
    toggle.textContent = soundOn() ? "Sound on" : "Sound off";
    toggle.classList.toggle("on", soundOn());
    toggle.setAttribute("aria-pressed", String(soundOn()));
  };
  toggle.addEventListener("click", () => { setSoundOn(!soundOn()); paint(); });
  paint();

  const note = document.createElement("p");
  note.className = "sound-result";

  const test = document.createElement("button");
  test.className = "btn";
  test.textContent = "Test sound";
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
  note.textContent = "Three short beeps in the last seconds, one long one when the rest is up. iOS suspends audio when the screen locks, so keep the app in front.";
  return note;
}
