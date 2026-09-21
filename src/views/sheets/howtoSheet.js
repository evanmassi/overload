import {HOWTO} from "../../data/howto.js";
import {musclesOf} from "../../rules/exercises.js";
import {el} from "../dom.js";
import {openSheet} from "./sheet.js";

function youtubeLink(name){
  const link = el("a", "howto-link", "Watch it on YouTube");
  link.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " proper form");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function labelled(className, label, text){
  const line = el("p", className);
  line.appendChild(el("b", null, label));
  line.appendChild(document.createTextNode(text));
  return line;
}

export function openHowTo(exercise){
  const guide = HOWTO[exercise.id];
  const body = openSheet(exercise.n);

  const worked = musclesOf(exercise.id);
  if(worked)
    body.appendChild(labelled("howto-works", "Works",
      worked.p.join(", ") + (worked.s.length ? " · also " + worked.s.join(", ") : "")));

  if(guide){
    const steps = el("ol", "howto-steps");
    guide.s.forEach(step => steps.appendChild(el("li", null, step)));
    body.append(steps, labelled("howto-watch", "Watch out", guide.w));
  } else {
    body.appendChild(el("p", "howto-watch", "No write-up for this one yet."));
  }

  body.appendChild(youtubeLink(exercise.n));
}
