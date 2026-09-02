import {state, hydrate, subscribe, notify} from "./state.js";
import {loadDate, iso, flushNow} from "./session.js";
import {render} from "./render.js";
import {mountSheet} from "./sheet.js";
import {mountTimer} from "./timer.js";
import {mountSaveState} from "./savestate.js";

const el = id => document.getElementById(id);

mountSaveState(el("status"));
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
