<script>
import Tree from "./Tree.svelte";
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
  margin-right: 0.5rem;
}
</style>

<div class="container">
  <header>
    <h2>{$treeGrid[$selectedTile].tree.owner}'s boom</h2>
    <p>{$treeGrid[$selectedTile].tree.age} jaar oud</p>
    <p>
      <img class="icon" src={`./resources/icons/bomen.svg`} alt="stappen icoon">
      {$treeGrid[$selectedTile].tree.type}
    </p>
  </header>
  <div class="tree-container">
    <Tree tileInfo={$treeGrid[$selectedTile]}/>
  </div>
</div>
