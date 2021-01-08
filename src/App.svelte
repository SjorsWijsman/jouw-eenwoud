<script>
import Choices from "./components/Choices.svelte";
import ChoiceResult from "./components/ChoiceResult.svelte";
import EndOfYear from "./components/EndOfYear.svelte";
import CollectionButton from "./components/CollectionButton.svelte";
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
import DayCounter from "./components/DayCounter.svelte";
import { currentState, currentYear } from "./data/appData.js";
</script>

<style>
  * {
    --max-content-width: 35rem;
    --height-header: 5rem;
    --height-footer: 7rem;
  }

  header {
    position: fixed;
    background-color: var(--color-background);
    top: 0;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 100%;
    max-height: var(--height-header);
  }

  header div {
    max-width: var(--max-content-width);
    padding: 0 1.2rem;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  main {
    max-width: var(--max-content-width);
    padding: 1.5rem 1.2rem;
    height: calc(100vh - var(--height-footer) - 3rem * 2);
    margin-top: var(--height-header);
    margin-bottom: var(--height-footer);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: scroll;
  }

  footer {
    padding: 1.2rem;
    position: fixed;
    background-color: var(--color-background);
    bottom: 0;
    height: var(--height-footer);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<header>
  <div>
    <Currency/>
    {#if $currentYear > 1}
      <CollectionButton/>
    {/if}
  </div>
</header>
<main>
  {#if $currentState === "choice"}
    <Choices/>
  {:else if $currentState === "choiceResult"}
    <ChoiceResult/>
  {:else if $currentState === "endOfYear"}
    <EndOfYear/>
  {:else if $currentState === "gameOver"}
    <p>Game Over component</p>
  {/if}
</main>
<footer>
  <YearCounter/>
  <DayCounter/>
</footer>
