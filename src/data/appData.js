import { writable } from "svelte/store"

// Create writable stores
export const user = writable()
export const treeGrid = writable()
export const currency = writable()
export const currentYear = writable()
export const dialogue = writable()
export const selectedTile = writable()
resetData()

export function resetData() {
  user.set({
    name: "Gebruiker"
  })
  treeGrid.set([])
  currency.set({
    stappen: 12000,
  });
  currentYear.set(1);
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
