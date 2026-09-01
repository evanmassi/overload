import {state, hydrate, subscribe, notify} from "./state.js";
import {loadDate, iso, onStatus, flushNow} from "./session.js";
import {render} from "./render.js";
import {mountSheet} from "./sheet.js";
import {mountTimer} from "./timer.js";
import {onBackupStatus} from "./backup.js";

const el = id => document.getElementById(id);

function setStatus(text){
  const node = el("status");
  node.textContent = text === "saving" ? "…" : text === "saved" ? "saved on device" : text;
  node.className = text === "saving" ? "status saving" : "status";
}

onStatus(setStatus);
onBackupStatus(setStatus);

mountTimer(el("timer"), el("clock"));
mountSheet(el("sheet"), el("sheettitle"), el("sheetbody"), el("sheetclose"), el("sheetback"));

el("tabs").addEventListener("click", event => {
  const tab = event.target.closest(".tab");
  if(!tab) return;
  state.view = tab.dataset.view;
  notify();
});

document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden") flushNow();
});
window.addEventListener("pagehide", flushNow);

subscribe(render);
hydrate();
loadDate(iso(new Date()));

if("serviceWorker" in navigator)
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
