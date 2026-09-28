import {loggedCount} from "./progression.js";
import {isCrossTraining} from "./workouts.js";

export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

export const mondayOf = date => addDays(date, -((date.getDay() + 6) % 7));

export function trainingDays(sessions){
  const days = {};
  Object.values(sessions).filter(loggedCount).forEach(s => {
    const day = days[s.date] = days[s.date] || {count: 0, isStrength: false};
    day.count++;
    if(!isCrossTraining(s.day)) day.isStrength = true;
  });
  return days;
}
