import {STREAK_WORKOUTS} from "../data/constants.js";
import {loggedCount} from "./progression.js";
import {isCrossTraining} from "./workouts.js";
import {iso} from "./format.js";

export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

export const mondayOf = date => addDays(date, -((date.getDay() + 6) % 7));

function loggedSessions(sessions){
  return Object.keys(sessions).map(key => sessions[key]).filter(s => s && loggedCount(s));
}

function sessionsInWeek(sessions, monday){
  const from = iso(monday);
  const to = iso(addDays(monday, 7));
  return loggedSessions(sessions).filter(s => s.date >= from && s.date < to);
}

export function trainingDays(sessions){
  const days = {};
  loggedSessions(sessions).forEach(s => {
    const day = days[s.date] = days[s.date] || {count: 0, isStrength: false};
    day.count++;
    if(!isCrossTraining(s.day)) day.isStrength = true;
  });
  return days;
}

export function weekTally(sessions, today){
  const week = sessionsInWeek(sessions, mondayOf(today));
  const strength = week.filter(s => !isCrossTraining(s.day)).length;
  return {strength, cross: week.length - strength};
}

export function weekStreak(sessions, today){
  const isFull = monday => sessionsInWeek(sessions, monday).length >= STREAK_WORKOUTS;
  let monday = mondayOf(today);
  if(!isFull(monday)) monday = addDays(monday, -7);
  let streak = 0;
  for(; isFull(monday); monday = addDays(monday, -7)) streak++;
  return streak;
}
