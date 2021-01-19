<script>
import {
  treeTypes,
  stepsPerDay,
} from "../data/gameData.js";
import {
  treeGrid,
  currentYear,
  user,
} from "../data/appData.js";

// Randomly plant trees on grid to simulate other users
treeGrid.update(grid => randomlyPlantTrees(grid));
function randomlyPlantTrees(grid) {
  for (const tile of grid) {
    const hasATree = Math.random() < 0.6;
    if (hasATree && tile.ground.growModifier > 0) {
      tile.tree = {
        type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
        age: Math.floor(Math.random() * 35) - 1,
        xOffset: Math.floor(Math.random() * 26) - 12.5,
        yOffset: Math.floor(Math.random() * 26) - 12.5,
        owner: "Henk",
        health: Math.floor(Math.random() * 5 * (stepsPerDay * (1 + (1 - tile.ground.growModifier)))),
      }
    }
  }
  return grid;
}

// Age trees & reduce health on year pass
currentYear.subscribe(() => {
  treeGrid.update(value => {
    for (const tile of value) {
      if (tile.tree) {
        tile.tree.age += 1;
        if (tile.tree.owner === $user.name) {
          tile.tree.health -= (stepsPerDay * (1 + (1 - tile.ground.growModifier)));
          if (tile.tree.health <= 0) tile.tree = undefined;
        }
      }
    }
    return value;
  })
})
</script>
