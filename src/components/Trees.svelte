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
</script>

<style>
  .tree-container {
    display: grid;
    background-color: #B9C95E;
    margin: 0 auto;
    -webkit-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -moz-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -ms-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    -o-transform: rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    transform:  rotateX(60deg) rotateY(0deg) rotateZ(45deg);
    perspective: none
  }

  .tree-cell {
    max-width: 2rem;
    width: 100%;
    max-height: 2rem;
    height: 100%;
    border: 1px solid var(--color-green);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tree-cell img {
    height: 200%;
    -webkit-transform: rotate(-45deg) translateY(-1.5rem);
    -moz-transform: rotate(-45deg) translateY(-1.5rem);
    -ms-transform: rotate(-45deg) translateY(-1.5rem);
    -o-transform: rotate(-45deg) translateY(-1.5rem);
    transform:  rotate(-45deg) translateY(-1.5rem);
  }
</style>

<div class="tree-container" style="
  grid-template-columns: repeat({gridSize},1fr);
  grid-template-rows: repeat({gridSize},1fr);
">
  {#each Array(gridSize * gridSize) as _, i}
    <div class="tree-cell">
      <img src="resources/boom.svg" alt="boom" class="scale">
    </div>
  {/each}
</div>
