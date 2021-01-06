import { writable } from "svelte/store"

// Create writable stores for each data point
export const currentChoice = writable()
export const currency = writable()
export const currentYear = writable()
export const currentDay = writable()
resetData()

export function resetData() {
  currentChoice.set({})
  currency.set({
    munten: 400,
    bomen: 30,
  })
  currentYear.set(1);
  currentDay.set(1);
}
