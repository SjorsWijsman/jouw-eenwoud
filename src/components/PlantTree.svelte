<script>
import Tree from "./Tree.svelte";
import {
  treeTypes,
} from "../data/gameData.js";
import {
  treeGrid,
  currency,
  dialogue,
  selectedTile,
} from "../data/appData.js";

let ground = $treeGrid[$selectedTile].ground;
let selectedTree = treeTypes[0];

function plantTree() {
  $treeGrid[$selectedTile].tree = {
    owner: "user",
    type: selectedTree,
    age: 1,
  };
  currency.update(value => {
    value.stappen -= 10000;
    return value
  });
  dialogue.set(undefined);
}
</script>

<style>
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

header h2 {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

p {
  display: flex;
  align-items: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tree-preview {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.tree-container {
  width: 100%;
  height: 15rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform: rotateX(60deg) rotateY(0) rotateZ(45deg);
}

.icon {
  height: 1.5rem;
  width: 1.5rem;
}

button {
  margin: 1rem 0;
}
</style>

<header>
  <h2>Plant een boom</h2>
  <p>Kosten: 10.000
    <img class="icon" src={`./resources/icons/stappen.svg`} alt="stappen icoon">
  </p>
</header>
<div class="container">
  <select bind:value={selectedTree}>
		{#each treeTypes as type}
			<option value={type}>
				{type}
			</option>
		{/each}
	</select>
  <div class="tree-preview">
    {#each Array(3) as _, i}
      <div class="tree-container">
        <Tree tileInfo={{
          tree: {
            type: selectedTree,
            age: i + 1,
          },
          ground: ground,
        }}/>
      </div>
    {/each}
  </div>
  <button type="button" name="button" disabled={$currency.stappen < 10000} on:click={() => plantTree()}>Plant boom</button>
</div>
