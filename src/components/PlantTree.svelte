<script>
import Tree from "./Tree.svelte";
import Icon from "./Icon.svelte";
import {
  treeTypes,
} from "../data/gameData.js";
import {
  user,
  treeGrid,
  currency,
  dialogue,
  selectedTile,
} from "../data/appData.js";

let ground = $treeGrid[$selectedTile].ground;
let selectedTree = treeTypes[0];

function plantTree() {
  $treeGrid[$selectedTile].tree = {
    owner: $user.name,
    type: selectedTree,
    age: 1,
    health: .8,
  };
  currency.update(value => {
    value.stappen -= 10000;
    return value
  });
  dialogue.set("treeDetails");
}
</script>

<style>
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

h2 {
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

.ground-info {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warning {
  margin-right: 0.5rem;
  margin-top: 0.3rem;
}

footer {
  margin-top: 1rem;
}

button {
  margin: 1rem 0;
}
</style>


<div class="container">
  <header>
    <h2>Plant een boom</h2>
    <p>
      <span class="warning">
        {#if $currency.stappen < 10000}
          <Icon type={"warning"}/>
        {/if}
      </span>
      Benodigd: 10.000
      <Icon type={"stappen"}/>
    </p>
  </header>
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
  <div class="ground-info">
    <p>
      <Icon type={"stappen"}/>
      per dag om de boom gezond te houden: {2000 * (1 + (1 - ground.growModifier))}
    </p>
  </div>
  <footer>
    <button type="button" name="button" disabled={$currency.stappen < 10000} on:click={() => plantTree()}>Plant boom</button>
  </footer>
</div>
