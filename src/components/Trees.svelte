<script>
import { currency } from "../data/appData.js";

let gridSize = 3;

currency.subscribe(value => {
  setGridSize(value.bomen)
});

function setGridSize(trees) {
  for (var i = 1; i < 100; i++) {
    gridSize = i;
    if (i * i >= trees) break;
  }
}

let treeGridList = createTreeGridList()

function createTreeGridList() {
  const list = [];
  for (var i = 0; i < gridSize; i++) {
    list.push({
      occupied: false,
    })
  }
  return list;
}

</script>

<style>
  .tree-grid {
    --color-grass: #B9C95E;
    --color-ground: #B17F4A;
    --color-ground-dark: #936037;
    background-color: var(--color-grass);
    max-width: calc(var(--max-content-width) * 0.6);
    max-height: calc(var(--max-content-width) * 0.6);
    margin: 0 auto;
    display: grid;
    -webkit-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -moz-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -ms-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -o-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    perspective: none;
  }

  .tree-grid::before {
    content: "";
    position: absolute;
    width: 6rem;
    height: 100%;
    left: 100%;
    background-color: var(--color-ground-dark);
    transform: skewY(45deg) translateY(calc(6rem * 0.5));
  }

  .tree-grid::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 6rem;
    top: 100%;
    background-color: var(--color-ground);
    transform: skewX(45deg) translateX(calc(6rem * 0.5));
  }

  .tree-cell {
    max-width: 5rem;
    max-height: 5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tree-cell img {
    height: 200%;
    -webkit-transform: rotate(-45deg) translateY(-80%) scaleY(1.8);
    -moz-transform: rotate(-45deg) translateY(-80%) scaleY(1.8);
    -ms-transform: rotate(-45deg) translateY(-80%) scaleY(1.8);
    -o-transform: rotate(-45deg) translateY(-80%) scaleY(1.8);
    transform:  rotate(-45deg) translateY(-80%) scaleY(1.8);
  }
</style>

<div class="tree-grid" style="
  grid-template-columns: repeat({gridSize},minmax(0,1fr));
  grid-template-rows: repeat({gridSize},minmax(0,1fr));
">
  {#each Array(gridSize * gridSize) as _, i}
    <div class="tree-cell">
      <img src="resources/boom.svg" alt="boom" class="scale">
    </div>
  {/each}
</div>
