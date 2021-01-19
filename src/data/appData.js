import { writable } from "svelte/store"

// Create writable stores
export const user = writable({
  name: "Gebruiker"
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
    name: "Gebruiker"
  })
  treeGrid.set([])
  currency.set({
    stappen: 12500,
  });
  currentYear.set(35);
  dialogue.set(undefined);
  selectedTile.set(undefined);
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
