export function setSummary(sets, suffix){
  const parts = (sets || []).filter(set => set && set.r)
    .map(set => set.w ? `${set.w}×${set.r}${suffix}` : `${set.r}${suffix}`);

  const runs = [];
  for(const part of parts){
    const last = runs[runs.length - 1];
    if(last && last.part === part) last.count++;
    else runs.push({part, count: 1});
  }
  return runs.map(run => run.count > 1 ? `${run.count} × ${run.part}` : run.part)
    .join(" · ");
}

export function elapsedLabel(startedAt, endedAt){
  if(startedAt == null || endedAt == null) return null;
  const minutes = Math.floor((endedAt - startedAt) / 60000);
  if(minutes < 1) return null;
  if(minutes < 60) return minutes + " min";
  return Math.floor(minutes / 60) + "h " + String(minutes % 60).padStart(2, "0") + "m";
}

export function unitSuffix(exercise){ return exercise.unit === "sec" ? "s" : ""; }
