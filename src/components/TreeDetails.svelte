<script>
import Tree from "./Tree.svelte";
import Icon from "./Icon.svelte";
import Health from "./Health.svelte";
import {
  stepsPerDay,
} from "../data/gameData.js";
import {
  user,
  treeGrid,
  selectedTile,
  currency,
  tutorialStep,
  currentActivities,
} from "../data/appData.js";


let showTreeInfo = false;

let treeHealth;
let maxTreeHealth;
$: [treeHealth, maxTreeHealth] = getTreeHealth($treeGrid[$selectedTile].tree);
const maxAddHealthAmount = 1000;
let addHealthAmount = maxAddHealthAmount;
$: treeHealth, $currency, setAddHealthAmount();

function getTreeHealth(tree) {
  if (tree) {
    return [tree.health, tree.maxHealth];
  } else return [null,null]
}

function setAddHealthAmount() {
  addHealthAmount = maxAddHealthAmount;
  if (maxAddHealthAmount > $currency.stappen) {
    addHealthAmount = $currency.stappen;
  }
  if (treeHealth + addHealthAmount > maxTreeHealth) {
    addHealthAmount = maxTreeHealth - treeHealth;
  }
}

function addHealth(amount) {
  currency.update(value => {
    value.stappen -= amount;
    return value;
  });
  $treeGrid[$selectedTile].tree.health += amount;
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
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  padding-top: 1.5rem;
}

.container > * {
  z-index: 1;
}

.sub-container {
  width: 100%;
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
  height: 3rem;
  width: 100%;
  margin-top: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.health-container span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-health {
  font-weight: 500;
}

.add-health-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.add-health-container button {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

footer {
  height: 2rem;
  width: 100%;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tree-rings {
  z-index: 0;
  position: relative;
  pointer-events: none;
  width: 100%;
  top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
}

.tree-rings img {
  position: absolute;
}

.tree-info-button {
  background-color: var(--color-gray-dark-transparent);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-radius: 2rem;
  box-shadow: none;
  text-shadow: none;
  font-weight: lighter;
}

.info-img {
  margin: 1rem 0;
  max-width: 80%;
  width: 100%;
}
</style>

{#if $treeGrid[$selectedTile].tree}
<div class="container">
  {#if !showTreeInfo}
    <div class="sub-container">
      <header>
        {#if $treeGrid[$selectedTile].tree.owner === $user.name}
          <h2>Jouw boom</h2>
        {:else}
          <h2>{$treeGrid[$selectedTile].tree.owner}'s boom</h2>
        {/if}
        <button type="button" name="button" class="tree-info-button capitalize green" on:click={() => showTreeInfo = true}>
          <Icon type={"bomen"}/>
          {$treeGrid[$selectedTile].tree.type}
        </button>
      </header>
      <div class="tree-container">
        <Tree tileInfo={$treeGrid[$selectedTile]} activity={Object.keys($currentActivities).includes($selectedTile.toString())}/>
      </div>
      <div class="health-container">
        <span>
          <span class="current-health">{treeHealth.toLocaleString("NL-NL")}</span>/{maxTreeHealth.toLocaleString("NL-NL")}
          <Icon type={"stappen"}/>
        </span>
        <Health health={treeHealth} maxHealth={maxTreeHealth}/>
      </div>
      {#if $treeGrid[$selectedTile].tree.owner === $user.name}
        <div class="add-health-container">
          <button type="button" name="button" disabled={addHealthAmount <= 0}
            on:click={() => addHealth(addHealthAmount)}
            on:click|once={() => tutorialStep.set(3)}>
            <Icon type={"stappen"}/>
            <span>+{addHealthAmount}</span>
          </button>
        </div>
      {/if}
      <footer>
        <p>{$treeGrid[$selectedTile].tree.age} jaar oud</p>
      </footer>
    </div>
  {:else}
    <div class="sub-container">
      <button type="button" name="button" class="tree-info-button capitalize green" on:click={() => showTreeInfo = false}>
        <Icon type={"bomen"}/>
        Sluiten
      </button>
      <img src="./resources/info/info-{$treeGrid[$selectedTile].tree.type}.svg" alt="{$treeGrid[$selectedTile].tree.type} info" class="info-img">
    </div>
  {/if}
  <div class="tree-rings" style="transform: rotate({Math.floor(Math.random() * 361)}deg)">
  {#each Array($treeGrid[$selectedTile].tree.age + 1) as _, i}
    <img src="./resources/treering.svg" style="transform: scale({0.3 * i})" alt="tree ring">
  {/each}
  </div>
</div>
{/if}
