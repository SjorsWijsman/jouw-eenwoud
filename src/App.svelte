<script>
import { fly, fade } from 'svelte/transition';
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
import Tree from "./components/Tree.svelte";
import TreeGrid from "./components/TreeGrid.svelte";
import TreeDetails from "./components/TreeDetails.svelte";
import PlantTree from "./components/PlantTree.svelte";
import DialogueBox from "./components/DialogueBox.svelte";
import Introduction from "./components/Introduction.svelte";
import {
  currency,
  currentYear,
  dialogue,
  selectedTile,
  user,
} from "./data/appData.js";
</script>

<style>
.logo {
  position: fixed;
  height: 2.5rem;
}

.header-container {
  max-width: var(--max-content-width);
  padding: 0 1.2rem;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>

{#if $user.introduction}
  <Introduction/>
{:else}
  <header transition:fly="{{ y: -100, duration: 800 }}">
    <div class="header-container">
      <div on:click={() => currency.update(value => {
        value.stappen += 800;
        return value;
      })}>
        <Currency displayCurrency="stappen"/>
      </div>
      <span>profiel</span>
    </div>
    <img class="logo" src="./resources/icons/eenwoud.svg" alt="Eenwoud Logo">
  </header>
  <main transition:fade="{{ duration: 800 }}">
    <TreeGrid/>
    {#if $dialogue === "plantTree"}
      <DialogueBox>
        <PlantTree/>
      </DialogueBox>
    {:else if $dialogue === "treeDetails"}
      <DialogueBox>
        <TreeDetails/>
      </DialogueBox>
    {/if}
  </main>
  <footer transition:fly="{{ y: 100, duration: 800 }}">
    <div on:click={() => currentYear.set($currentYear + 1)}>
      <YearCounter/>
    </div>
  </footer>
{/if}
