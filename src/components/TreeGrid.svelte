<script>
import Tree from "./Tree.svelte";
import { fade, fly } from 'svelte/transition';
import {
  groundTypes,
  treeTypes,
} from "../data/gameData.js";
import {
  treeGrid,
  dialogue,
  selectedTile,
} from "../data/appData.js";

const gridSize = 10;
let selected = false;

// Reset dialogue when selection changes
$: selected, dialogue.set("");
// Set selected tile value to selectedTile store
$: if (selected !== false) selectedTile.set(selected);

// Create grid according to grid size with random groundtypes
treeGrid.set(createGrid());
function createGrid() {
  const grid = []
  for (var i = 0; i < gridSize * gridSize; i++) {
    const groundType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
    grid.push({
      ground: groundType,
    })
  }
  return grid;
}

// Randomly plant trees on grid to simulate other users
treeGrid.update(grid => randomlyPlantTrees(grid));
function randomlyPlantTrees(grid) {
  for (const tile of grid) {
    const hasATree = Math.random() < 0.6;
    if (hasATree && tile.ground.growModifier > 0) {
      tile.tree = {
        type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
        age: Math.floor(Math.random() * 3) + 1,
        xOffset: Math.floor(Math.random() * 26) - 12.5,
        yOffset: Math.floor(Math.random() * 26) - 12.5,
        owner: "Henk",
        health: 1,
      }
    }
  }
  return grid;
}

</script>

<style>
  h3 {
    text-transform: capitalize;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .container {
    position: fixed;
    overflow: hidden;
    top: 0;
    left: 0;
    min-width: 100%;
    min-height: 100%;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    transition: all .3s;
  }

  .tree-grid {
    position: relative;
    display: grid;
    transform: rotateX(60deg) rotateY(0) rotateZ(45deg);
  }

  .tile-container {
    transition: all .3s;
  }

  .info-container {
    z-index: 2;
    position: absolute;
    transform: rotate(-45deg) scale(1.2, 2.2);
    text-shadow: 0 0 2rem var(--color-gray-dark);
    pointer-events: none;
    user-select: none;
  }

  .info-tile {
    transform: translate(1.4rem, -6rem);
    width: 8rem;
    text-align: center;
  }

  .tile-button {
    position: absolute;
    transform: translate(10rem, -3rem);
    width: 6rem;
    pointer-events: all;
  }

  .selected {
    transform: translate(-10.5rem, -10.5rem);
  }

  .selected-container {
    transform: translateY(2rem);
  }
</style>

<div class="container" class:selected-container="{selected !== false}">
  <div class="tree-grid" style="
    grid-template-columns: repeat({gridSize},5rem);
    grid-template-rows: repeat({gridSize},5rem);">
    {#each $treeGrid as tile, i}
      <div class="tile-container" class:selected="{selected === i}" style="z-index: {i};">
        <div on:click="{() => selected === i ? selected = false : selected = i}">
          <Tree tileInfo={tile}/>
        </div>
        {#if selected === i}
          <div class="info-container" transition:fade="{{duration: 300}}">
            {#if tile.tree}
              <div class="info-tile" transition:fly="{{y: 100, duration: 300}}">
                <h3>{tile.tree.type}</h3>
                <span>{tile.tree.age} jaar oud</span>
              </div>
            {:else}
              <div class="info-tile" transition:fly="{{y: 100, duration: 300}}">
                <h3>{tile.ground.type}</h3>
                <span>{tile.ground.growModifier * 100}%</span>
              </div>
            {/if}
            {#if tile.tree}
              <button class="tile-button" type="button" name="button"
                transition:fly="{{x: -100, duration: 300}}"
                on:click={() => dialogue.set("treeDetails")}>
                Bekijk boom
              </button>
            {:else if tile.ground.growModifier > 0}
              <button class="tile-button green" type="button" name="button"
                transition:fly="{{x: -100, duration: 300}}"
                on:click={() => dialogue.set("plantTree")}>
                Plant boom
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
