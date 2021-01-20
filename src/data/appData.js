import { writable } from "svelte/store"

// Create writable stores
export const user = writable({
  name: "Gebruiker",
  introduction: true,
});
export const treeGrid = writable([]);
export const currency = writable({
  stappen: 12500,
  bomen: 0,
});
export const currentYear = writable(35);
export const dialogue = writable(undefined);
export const selectedTile = writable(undefined);
export const tutorialStep = writable(1);
export const currentActivities = writable({});
export const activeActivity = writable();

// Prevent negative currency values
currency.subscribe(value => {
  for (const currency of Object.keys(value)) {
    if (value[currency] < 0) {
      value[currency] = 0;
    }
  }
  return value;
});
