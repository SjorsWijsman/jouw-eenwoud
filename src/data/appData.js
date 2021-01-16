import { writable } from "svelte/store"

// Create writable stores for each data point
/*
States:
- choice
- choiceResult
- endOfYear
- gameOver
*/
export const currency = writable()
export const currentYear = writable()
resetData()

export function resetData() {
  currency.set({
    stappen: 0,
  });
  currentYear.set(1);
}

// Prevent negative values
currency.subscribe(value => {
  for (const currency of Object.keys(value)) {
    if (value[currency] < 0) {
      value[currency] = 0;
    }
  }
  return value;
})
