<script>
import ChoiceText from "./components/ChoiceText.svelte";
import ChoiceButtons from "./components/ChoiceButtons.svelte";
import ChoiceResult from "./components/ChoiceResult.svelte";
import NextButton from "./components/NextButton.svelte";
import EndOfYear from "./components/EndOfYear.svelte";
import CollectionButton from "./components/CollectionButton.svelte";
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
import DayCounter from "./components/DayCounter.svelte";
import Trees from "./components/Trees.svelte";
import GameOver from "./components/GameOver.svelte";
import {
  currency,
  currentState,
  currentYear,
  currentDay,
  resetData,
} from "./data/appData.js";

function nextDay() {
  if ($currency.bomen > 0) {
    if ($currentDay === 5) {
      currentState.set("endOfYear")
    } else {
      currentState.set("choice")
      currentDay.update(value => value += 1)
    }
  } else {
    // currentState.set("gameOver")
  }
}

function nextYear() {
  currentYear.update(value => value += 1);
  currentDay.set(1);
  currentState.set("choice");
}
</script>

<style>
  * {
    --max-content-width: 35rem;
    --height-header: 5rem;
    --height-footer: 7rem;
  }

  header {
    position: fixed;
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
    height: calc(100vh - var(--height-footer) - var(--height-header));
    margin-top: var(--height-header);
    margin-bottom: var(--height-footer);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    overflow-x: visible;
  }

  footer {
    padding: 1.2rem;
    position: fixed;
    bottom: 0;
    height: var(--height-footer);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .game-over {
    filter: grayscale(100%);
  }
</style>

<header>
  <div>
    <Currency displayCurrency="bomen"/>
    <img src="./resources/icons/eenwoud.svg" alt="Eenwoud Logo">
    <Currency displayCurrency="zaden"/>
  </div>
</header>
<main class:game-over="{$currentState === 'gameOver'}">
  {#if $currentState === "choice"}
    <ChoiceText/>
  {:else if $currentState === "choiceResult"}
    <ChoiceResult/>
  {:else if $currentState === "endOfYear"}
    <EndOfYear/>
  {:else if $currentState === "gameOver"}
    <GameOver/>
  {/if}

  <Trees/>

  {#if $currentState === "choice"}
    <ChoiceButtons/>
  {:else if $currentState === "choiceResult"}
    <NextButton parentFunction={nextDay}>
      {#if $currentDay >= 5}
        Beeindig jaar 1
      {:else}
        Volgende dag
      {/if}
    </NextButton>
  {:else if $currentState === "endOfYear"}
    <NextButton parentFunction={nextYear}>
      Begin jaar {$currentYear + 1}
    </NextButton>
  {:else if $currentState === "gameOver"}
    <NextButton parentFunction={resetData}>
      Herstart het spel
    </NextButton>
  {/if}
</main>
<footer>
  <YearCounter/>
  <DayCounter/>
</footer>
