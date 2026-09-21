import {HOWTO} from "../../data/howto.js";
import {MUSCLES} from "../../data/muscles.js";
import {openSheet} from "./sheet.js";

function youtubeLink(name){
  const link = document.createElement("a");
  link.className = "howto-link";
  link.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " proper form");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Watch it on YouTube";
  return link;
}

export function openHowTo(exercise){
  const guide = HOWTO[exercise.id];
  const body = openSheet(exercise.n);

  const worked = MUSCLES[exercise.id];
  if(worked){
    const works = document.createElement("p");
    works.className = "howto-works";
    works.innerHTML = "<b>Works</b>";
    works.appendChild(document.createTextNode(worked.p.join(", ") + (worked.s.length ? " · also " + worked.s.join(", ") : "")));
    body.appendChild(works);
  }

  if(guide){
    const steps = document.createElement("ol");
    steps.className = "howto-steps";
    guide.s.forEach(step => {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    });
    body.appendChild(steps);

    const watch = document.createElement("p");
    watch.className = "howto-watch";
    watch.innerHTML = "<b>Watch out</b>";
    watch.appendChild(document.createTextNode(guide.w));
    body.appendChild(watch);
  } else {
    const none = document.createElement("p");
    none.className = "howto-watch";
    none.textContent = "No write-up for this one yet.";
    body.appendChild(none);
  }

  body.appendChild(youtubeLink(exercise.n));
}
