import {state, changes, hydrate} from "./store/state.js";
import {followToday, flushNow} from "./store/session.js";
import {iso} from "./rules/format.js";
import {render} from "./views/app.js";
import {mountSheet} from "./views/sheets/sheet.js";
import {openTimerSheet} from "./views/sheets/timerSheet.js";
import {mountTimer} from "./views/timer.js";
import {mountSaveStatus} from "./views/saveStatus.js";
import {loadSoundPreference, unlockAudio} from "./views/sound.js";
import {byId} from "./views/dom.js";
import {makeButton} from "./ui/button.js";

loadSoundPreference();
document.addEventListener("pointerdown", unlockAudio);

mountSaveStatus(byId("status"));
mountTimer(byId("timer"), {onHold: openTimerSheet});
mountSheet(byId("sheet"), byId("sheettitle"), byId("sheetbody"), byId("sheetclose"), byId("sheetback"));

byId("tabs").querySelectorAll(".tab").forEach(tab =>
  makeButton(tab, {tone: "secondary", ghost: true}));

byId("tabs").addEventListener("click", event => {
  const tab = event.target.closest(".tab");
  if(!tab) return;
  state.view = tab.dataset.view;
  changes.notify();
});

document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden") flushNow();
  else {
    unlockAudio();
    followToday(iso(new Date()));
  }
});
window.addEventListener("pagehide", flushNow);

changes.subscribe(render);
hydrate();
followToday(iso(new Date()));

const LOCAL_HOST = /^(localhost|127\.|\[?::1\]?$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
const isLocalDev = LOCAL_HOST.test(location.hostname);

if("serviceWorker" in navigator){
  if(isLocalDev){
    navigator.serviceWorker.getRegistrations()
      .then(all => all.forEach(one => one.unregister())).catch(() => {});
    if(window.caches) caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
  } else {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}
