import { writable } from "svelte/store"

// Create writable stores
export const user = writable({
  name: "Gebruiker",
  introduction: true,
})
export const treeGrid = writable([])
export const currency = writable({
  stappen: 12500,
})
export const currentYear = writable(35)
export const dialogue = writable(undefined)
export const selectedTile = writable(undefined)

export function resetData() {
  user.set({
    name: "Gebruiker",
    introduction: true,
  })
  treeGrid.set([])
  currency.set({
    stappen: 12500,
  });
  currentYear.set(35);
  dialogue.set(undefined);
  selectedTile.set(undefined);
}

// Prevent negative currency values
currency.subscribe(value => {
  for (const currency of Object.keys(value)) {
    if (value[currency] < 0) {
      value[currency] = 0;
    }
  }
  return value;
})
