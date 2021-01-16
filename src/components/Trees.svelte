<script>
const treeGrid = [];
const gridSize = 10;

let selected;

const groundTypes = [
  {
    type: "gras",
    growModifier: 1,
  },
  {
    type: "water",
    growModifier: 0,
  },
  {
    type: "zand",
    growModifier: 0.3,
  },
]

const defaultTree = {
  type: "eik",
  age: 3,
  health: 100,
}

for (var i = 0; i < gridSize * gridSize; i++) {
  const hasATree = Math.random() < 0.6;
  const groundType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
  const tileObject = {
    ground: groundType,
  }
  if (hasATree) {
    tileObject.tree = {
      ...defaultTree,
      age: Math.floor(Math.random() * 3) + 1,
      xOffset: Math.floor(Math.random() * 26) - 12.5,
      yOffset: Math.floor(Math.random() * 26) - 12.5,
    }
  }
  treeGrid.push(tileObject)
}
</script>

<style>
  .container {
    position: fixed;
    overflow: hidden;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
  }

  .tree-grid {
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
    display: grid;
    transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
  }

  .tree-tile {
    position: relative;
    width: 5rem;
    height: 5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-grass);
    transition: all .3s
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

  .selected {
    transform: translate(-10rem, -10rem);
  }

  .unselected {
    filter: brightness(90%);
  }
</style>

<div class="container">
  <div class="tree-grid" style="
    grid-template-columns: repeat({gridSize},5rem);
    grid-template-rows: repeat({gridSize},5rem);">
    {#each treeGrid as tile, i}
      <div class="tree-tile"
        class:selected="{selected === i}"
        class:unselected="{selected && selected !== i}"
	      on:click="{() => selected === i ? selected = !i : selected = i}"
        class:grass="{tile.ground.type === 'gras'}"
        class:sand="{tile.ground.type === 'zand'}"
        class:water="{tile.ground.type === 'water'}"
        style="z-index: {i};">
        {#if tile.ground.growModifier > 0 && tile.tree}
          <img
            src={`resources/${tile.tree.type}-${tile.tree.age}.svg`}
            alt="boom"
            class="tree"
            style="top: {tile.tree.yOffset}%; left: {tile.tree.xOffset}%">
        {/if}
      </div>
    {/each}
  </div>
</div>
