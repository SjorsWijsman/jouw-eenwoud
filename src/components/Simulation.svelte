<script>
import {
  treeTypes,
  stepsPerDay,
} from "../data/gameData.js";
import {
  treeGrid,
  currentYear,
  user,
  currency,
  activities,
} from "../data/appData.js";

// Randomly plant trees on grid to simulate other users
treeGrid.update(grid => randomlyPlantTrees(grid));
function randomlyPlantTrees(grid) {
  for (const tile of grid) {
    const hasATree = Math.random() < 0.6;
    if (hasATree && tile.ground.growModifier > 0) {
      const maxHealth = stepsPerDay * (1 + (1 - tile.ground.growModifier)) * 5
      tile.tree = {
        type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
        age: Math.floor(Math.random() * 35) - 1,
        xOffset: Math.floor(Math.random() * 26) - 12.5,
        yOffset: Math.floor(Math.random() * 26) - 12.5,
        owner: "Henk",
        maxHealth: maxHealth,
        health: Math.floor(Math.random() * maxHealth + 1),
      }
    }
  }
  return grid;
}

currentYear.subscribe(() => {
  // Age trees & reduce health on year pass
  treeGrid.update(value => {
    for (const tile of value) {
      if (tile.tree) {
        tile.tree.age += 1;
        if (tile.tree.owner === $user.name) {
          tile.tree.health -= (stepsPerDay * (1 + (1 - tile.ground.growModifier)));
          if (tile.tree.health <= 0) {
            currency.update(value => {
              value.bomen -= 1;
              return value;
            })
            delete tile.tree;
          }
        }
      }
    }
    return value;
  })
  // Place random activity on a tree every year
  activities.update(value => {
    value = {};
    if ($currentYear !== 35) {
      for (let i = 0; i < 999; i++) {
        const randomTile = Math.floor(Math.random() * $treeGrid.length);
        if ($treeGrid[randomTile].tree) {
          value[randomTile] = {
            acitivity: "hallo",
            reward: ["stappen", 500]
          }
          break;
        }
      }
    }
    return value;
  });
})
</script>
