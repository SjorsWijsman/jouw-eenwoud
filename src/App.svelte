<script>
import Choices from "./components/Choices.svelte";
import CollectionButton from "./components/CollectionButton.svelte";
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
import { currentState } from "./data/appData.js";
</script>

<style>
  header {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
</style>

<header>
  <Currency/>
  <CollectionButton/>
</header>
<main>
  {#if $currentState === "choice"}
    <Choices/>
  {:else if $currentState === "choiceResult"}
    <p>Choice Result component</p>
  {:else if $currentState === "endOfYear"}
    <p>End of year component</p>
  {:else if $currentState === "gameOver"}
    <p>Game Over component</p>
  {/if}
</main>
<footer>
  <YearCounter/>
</footer>
