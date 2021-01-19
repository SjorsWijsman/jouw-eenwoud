<script>
import Tree from "./Tree.svelte";
import Icon from "./Icon.svelte";
import Health from "./Health.svelte";
import {
  user,
  treeGrid,
  selectedTile,
} from "../data/appData.js";
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

.tree-container {
  height: 15rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform: rotateX(60deg) rotateY(0) rotateZ(45deg);
}

.health-container {
  height: 2.5rem;
  width: 100%;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

footer {
  height: 2rem;
  width: 100%;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>

{#if $treeGrid[$selectedTile].tree}
<div class="container">
  <header>
    {#if $treeGrid[$selectedTile].tree.owner === $user.name}
      <h2>Jouw boom</h2>
    {:else}
      <h2>{$treeGrid[$selectedTile].tree.owner}'s boom</h2>
    {/if}
    <p class="capitalize">
      <Icon type={"bomen"}/>
      {$treeGrid[$selectedTile].tree.type}
    </p>
  </header>
  <div class="tree-container">
    <Tree tileInfo={$treeGrid[$selectedTile]}/>
  </div>
  <div class="health-container">
    <span>{$treeGrid[$selectedTile].tree.health * 100}%</span>
    <Health health={$treeGrid[$selectedTile].tree.health}/>
  </div>
  <footer>
    <p>{$treeGrid[$selectedTile].tree.age} jaar oud</p>
  </footer>
</div>
{/if}
