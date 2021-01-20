<script>
import Tree from "./Tree.svelte";
import Simulation from "./Simulation.svelte";
import { onMount } from 'svelte';
import { fade, fly } from 'svelte/transition';
import {
  groundTypes,
} from "../data/gameData.js";
import {
  treeGrid,
  dialogue,
  selectedTile,
} from "../data/appData.js";
import { draggable } from "../scripts/draggable.js";

onMount(async() => {
  draggable()
})

const gridSize = 10;

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

let selected = false;

// Reset dialogue when selection changes
$: selected, dialogue.set("");
// Set selected tile value to selectedTile store
$: if (selected !== false) selectedTile.set(selected);
</script>

<style>
h3 {
  text-transform: capitalize;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

#container {
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  transition: all .3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

#dragItem {
  position: relative;
  top: 0;
  transition: top .3s;
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

#dragItem.selected-container {
  top: 2rem;
}
</style>

<Simulation/>
<div id="container" transition:fly="{{ y: 100, duration: 800 }}">
  <div id="dragItem" class:selected-container="{selected !== false}">
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
</div>
