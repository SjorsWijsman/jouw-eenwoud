<script>
import { currency, currentDay } from "../data/appData.js";

const minGridSize = 4;

let trees = $currency.bomen;
let gridSize = minGridSize;
let treeList = [];
let treeGrid = [];
let lastYear = 1;

currency.subscribe(value => {
  trees = value.bomen;
});

currentDay.subscribe(value => {
  ageTrees();
})

// Update minimum grid size according to trees amount
$: gridSize = minimumGridSize(trees);
// Create new grid if grid size changes
$: treeGrid = createTreeGrid(gridSize);
// Update tree list according to trees amount
$: treeGrid, updateTreeList(trees);

/*
  Decides grid size according to amount of trees (gridSize * gridSize)
*/
function minimumGridSize(trees) {
  for (var i = minGridSize; i < 100; i++) {
    if (i * i >= trees) return i;
  }
}

/*
  Creates a list of unoccupied tiles according to grid size
  and populates this list with trees from treeList
*/
function createTreeGrid(gridSize) {
  const list = [];
  for (var i = 0; i < gridSize * gridSize; i++) {
    list.push({
      occupied: false,
    })
  }
  return list;
}

/*
  Create, remove and move trees around in treesList & subsequently treesGrid
*/
function updateTreeList(trees) {
  if (trees > treeList.length) {
    moveTrees()
    createTrees(trees - treeList.length);
  }
  else if (trees < treeList.length) {
    removeTrees(treeList.length - trees);
    moveTrees()
  }
}

function createTrees(amount) {
  for (let i = 0; i < amount; i++) {
    addTreeToList()
  }
}

/*
  Adds a tree to treeList, if tree is left empty it creates a new random tree
*/
function addTreeToList(tree) {
  const freeTiles = findFreeTiles();
  const randomTile = freeTiles[Math.floor(Math.random() * freeTiles.length)];
  if (!tree) tree = {
    type: "boom",
    age: 1,
  };
  treeList.push({
    ...tree,
    location: randomTile,
  });
  if (treeGrid[randomTile]) treeGrid[randomTile] = tree;
}

/*
  Removes amount of random trees from treeList & treeGrid
*/
function removeTrees(amount) {
  for (let i = 0; i < amount; i++) {
    const randomTileIndex = Math.floor(Math.random() * treeList.length);
    if (treeList.length > 0) {
      if (treeGrid[treeList[randomTileIndex].location]) {
        treeGrid[treeList[randomTileIndex].location] = {
          occupied: false,
        }
      }
    }
    treeList.splice(randomTileIndex, 1).filter(tile => tile !== null);
  }
}

/*
  Moves trees in treeList if their location is out of bounds on the
  current grid size.
*/
function moveTrees() {
  for (const tree of treeList) {
    const freeTiles = findFreeTiles();
    if (tree.location >= gridSize * gridSize) {
      const randomTileIndex = Math.floor(Math.random() * freeTiles.length);
      tree.location = freeTiles[randomTileIndex];
      treeGrid[freeTiles[randomTileIndex]].occupied = true;
    } else {
      treeGrid[tree.location].occupied = true;
    }
  }
}

/*
  Returns a list of all free tiles in treeGrid
*/
function findFreeTiles() {
  const freeTiles = []
  for (const [i, tile] of treeGrid.entries()) {
    if (!tile.occupied) freeTiles.push(i);
  }
  return freeTiles;
}

function ageTrees() {
  const chance = 0.05;
  for (const tree of treeGrid) {
    if (tree.occupied) {
      const random = Math.random()
      if (chance > random) {
        if (tree.age < 3) tree.age += 1;
      }
    }
  }
}

</script>

<style>
  .tree-grid {
    --color-grass-light: #CED67B;
    --color-grass: #B9C95E;
    --color-grass-dark: #A5AE44;
    --color-ground-light: #B17F4A;
    --color-ground-dark: #936037;
    --grass-height: 30%;
    --ground-height: 7rem;
    background-color: var(--color-grass);
    width: calc(var(--max-content-width) * 0.6);
    height: calc(var(--max-content-width) * 0.6);
    margin: 0 auto;
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateX(60deg) rotateY(0deg) rotateZ(45deg);
  }

  .tree-grid::before {
    content: "";
    position: absolute;
    width: var(--ground-height);
    height: 100%;
    left: 100%;
    background-color: var(--color-ground-light);
    background: linear-gradient(90deg, var(--color-grass-light) 0%, var(--color-grass-light) var(--grass-height), var(--color-ground-light) var(--grass-height), var(--color-ground-light) 100%);
    transform: skewY(45deg) translateY(calc(var(--ground-height) * 0.5));
  }

  .tree-grid::after {
    content: "";
    position: absolute;
    width: 100%;
    height: var(--ground-height);
    top: 100%;
    background-color: var(--color-ground-dark);
    background: linear-gradient(-180deg, var(--color-grass-dark) 0%, var(--color-grass-dark) var(--grass-height), var(--color-ground-dark) var(--grass-height), var(--color-ground-dark) 100%);
    transform: skewX(45deg) translateX(calc(var(--ground-height) * 0.5));
  }

  .tree-tile {
    max-width: 5rem;
    max-height: 5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tree {
    z-index: 1;
    height: 160%;
    transform: rotate(-45deg) translateY(-80%) scale(1.2, 2.2);
  }

  .placeholder {
    opacity: 0;
  }
</style>

<div class="tree-grid" style="
  grid-template-columns: repeat({gridSize},minmax(0,1fr));
  grid-template-rows: repeat({gridSize},minmax(0,1fr));
">
  {#each treeGrid as tile}
    <div class="tree-tile">
      {#if tile.occupied}
        <img src={`resources/eik-${tile.age}.svg`} alt="boom" class="tree">
      {:else}
        <img src={`resources/eik-1.svg`} class="tree placeholder">
      {/if}
    </div>
  {/each}
</div>
