import {isLogged} from "./sets.js";

export const iso = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function setRuns(sets, suffix){
  const parts = (sets || []).filter(isLogged)
    .map(set => set.w ? `${set.w}×${set.r}${suffix}` : `${set.r}${suffix}`);

  const runs = [];
  for(const part of parts){
    const last = runs[runs.length - 1];
    if(last && last.part === part) last.count++;
    else runs.push({part, count: 1});
  }
  return runs;
}

export function setSummary(sets, suffix){
  return setRuns(sets, suffix).map(run => run.count > 1 ? `${run.count} × ${run.part}` : run.part)
    .join(" · ");
}

export function elapsedLabel(startedAt, endedAt){
  if(startedAt == null || endedAt == null) return null;
  const minutes = Math.floor((endedAt - startedAt) / 60000);
  if(minutes < 1) return null;
  if(minutes < 60) return minutes + " min";
  return Math.floor(minutes / 60) + "h " + String(minutes % 60).padStart(2, "0") + "m";
}

const UNIT_SUFFIX = {sec: "s", min: "m"};
const UNIT_NAME = {sec: "sec", min: "min"};

export function unitSuffix(exercise){ return UNIT_SUFFIX[exercise.unit] || ""; }
export function unitName(exercise){ return UNIT_NAME[exercise.unit] || "reps"; }

const dayNumber = dateStr => Date.UTC(...dateStr.split("-").map((part, i) => Number(part) - (i === 1 ? 1 : 0))) / 86400000;

export function daysAgoLabel(fromDate, toDate){
  const days = Math.round(dayNumber(toDate) - dayNumber(fromDate));
  return days <= 0 ? "earlier today" : days === 1 ? "yesterday" : `${days} days ago`;
}

export const clockFace = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function parseClock(text){
  const clean = String(text || "").trim();
  const clock = clean.match(/^(\d+)[:.,]([0-5]?\d)$/);
  if(clock) return +clock[1] * 60 + +clock[2];
  const plain = clean.match(/^(\d+)\s*(s|m|min|sec)?$/i);
  if(!plain) return 0;
  const unit = (plain[2] || "").toLowerCase();
  return +plain[1] * (unit.startsWith("m") ? 60 : 1);
}
