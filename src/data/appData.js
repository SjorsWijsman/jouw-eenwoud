import { writable } from "svelte/store"

// Create writable stores for each data point
/*
States:
- choice
- choiceResult
- endOfYear
- gameOver
*/
export const currentState = writable()
export const currentChoice = writable()
export const currency = writable()
export const currentYear = writable()
export const currentDay = writable()
export const choiceMade = writable()
resetData()

export function resetData() {
  currentState.set("choice")
  currentChoice.set({})
  currency.set({
    munten: 400,
    bomen: 9,
  });
  currentYear.set(1);
  currentDay.set(1);
  choiceMade.set("");
}
