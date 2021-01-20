<script>
import { fly } from 'svelte/transition';
import { treeStages } from "../data/gameData.js";
import { user, dialogue } from "../data/appData.js";

export let tileInfo;
export let activity = false;

let treeStage = 1;
let saturation = 1;

$: if (tileInfo.tree) {
  for (const stage of Object.keys(treeStages)) {
    if (tileInfo.tree.age >= stage) {
      treeStage = treeStages[stage];
    }
    else {
      break;
    }
  }
  if (tileInfo.tree.health > 0) {
    saturation = scaleValue(tileInfo.tree.health, [0, tileInfo.tree.maxHealth], [0.85, 1.1])
  }
}

// https://gist.github.com/fpillet/993002
function scaleValue(value, from, to) {
	var scale = (to[1] - to[0]) / (from[1] - from[0]);
	var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
	return (capped * scale + to[0]);
}
</script>

<style>
.tree-tile {
  --color-grass-light: #CED67B;
  --color-grass: #B9C95E;
  --color-grass-dark: #A5AE44;
  --color-sand-light: #EBE1A7;
  --color-sand: #E3D681;
  --color-sand-dark: #C7BA69;
  --color-water-light: #A7CFEBDD;
  --color-water: #81C8E3DD;
  --color-water-dark: #69A8C7DD;
  --color-ground-light: #B17F4A;
  --color-ground-dark: #936037;
  --grass-height: 2.5rem;
  --ground-height: 8rem;
  position: relative;
  width: 5rem;
  height: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-grass);
  transition: all .3s;
  transition: background 0s;
  cursor: pointer;
}

.tree-tile::before {
  content: "";
  position: absolute;
  width: var(--ground-height);
  height: calc(100% + 2px);
  left: 100%;
  transform: skewY(45deg) translateY(calc(var(--ground-height) * 0.5));
  background-color: var(--color-ground-light);
}

.tree-tile::after {
  content: "";
  position: absolute;
  width: calc(100% + 2px);
  height: var(--ground-height);
  top: 100%;
  transform: skewX(45deg) translateX(calc(var(--ground-height) * 0.5));
  background-color: var(--color-ground-dark);
}

.grass {
  background-color: var(--color-grass);
}

.grass.activity {
  background: radial-gradient(white, var(--color-yellow), var(--color-grass));
}

.grass::before {
  background: linear-gradient(90deg,
    var(--color-grass-light) 0%,
    var(--color-grass-light) var(--grass-height),
    var(--color-ground-light) var(--grass-height),
    var(--color-ground-light) 100%);
}

.grass::after {
  background: linear-gradient(-180deg,
    var(--color-grass-dark) 0%,
    var(--color-grass-dark) var(--grass-height),
    var(--color-ground-dark) var(--grass-height),
    var(--color-ground-dark) 100%);
}

.sand {
  background-color: var(--color-sand);
}

.sand.activity {
  background: radial-gradient(white, var(--color-yellow), var(--color-sand));
}

.sand::before {
  background: linear-gradient(90deg,
    var(--color-sand-light) 0%,
    var(--color-sand-light) var(--grass-height),
    var(--color-ground-light) var(--grass-height),
    var(--color-ground-light) 100%);
}

.sand::after {
  background: linear-gradient(-180deg,
    var(--color-sand-dark) 0%,
    var(--color-sand-dark) var(--grass-height),
    var(--color-ground-dark) var(--grass-height),
    var(--color-ground-dark) 100%);
}

.water {
  --height-offset: 0.4rem;
  background-color: var(--color-water);
  transform: translate(var(--height-offset), var(--height-offset));
}

.water::before {
  background: linear-gradient(90deg,
    var(--color-water-light) 0%,
    var(--color-water-light) calc(var(--grass-height) - var(--height-offset)),
    var(--color-ground-light) calc(var(--grass-height) - var(--height-offset)),
    var(--color-ground-light) calc(100% - var(--height-offset)),
    rgba(0, 0, 0, 0) calc(100% - var(--height-offset)),
    rgba(0, 0, 0, 0) 100%);
}

.water::after {
  background: linear-gradient(-180deg,
    var(--color-water-dark) 0%,
    var(--color-water-dark) calc(var(--grass-height) - var(--height-offset)),
    var(--color-ground-dark) calc(var(--grass-height) - var(--height-offset)),
    var(--color-ground-dark) calc(100% - var(--height-offset)),
    rgba(0, 0, 0, 0) calc(100% - var(--height-offset)),
    rgba(0, 0, 0, 0) 100%);
}

.tree {
  z-index: 1;
  height: 160%;
  transform: rotate(-45deg) translateY(-80%) scale(1.2, 2.2);
  pointer-events: none;
  user-select: none;
  position: relative;
}

@keyframes jump {
  from {
    width: 2rem;
    height: 2rem;
  }
  to {
    width: 2.2rem;
    height: 2.2rem;
  }
}

.activity-button {
  position: absolute;
  transform: rotate(-45deg) translateY(-900%) scale(1.1, 2.2);
  border-radius: 50%;
  animation-name: jump;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
}

.highlight {
  filter: brightness(110%);
}
</style>

<div class="tree-tile"
  class:grass="{tileInfo.ground.type === 'gras'}"
  class:sand="{tileInfo.ground.type === 'zand'}"
  class:water="{tileInfo.ground.type === 'water'}"
  class:highlight="{tileInfo.tree && tileInfo.tree.owner === $user.name}"
  class:activity>
  {#if tileInfo.tree}
    <img
      src={`resources/${tileInfo.tree.type}-${treeStage}.svg`}
      alt="boom"
      class="tree"
      style="top: {tileInfo.tree.yOffset}%; left: {tileInfo.tree.xOffset}%; filter: saturate({saturation})">
  {/if}
  {#if activity}
    <button type="button" name="button" class="activity-button"
    transition:fly="{{ y: 100, duration: 800 }}"
    on:click={() => dialogue.set("activity")}></button>
  {/if}
</div>
