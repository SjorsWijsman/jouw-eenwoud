<script>
import NextButton from "./NextButton.svelte";
import {
  currency,
  currentState,
  currentChoice,
  currentYear,
  currentDay,
  choiceMade,
} from "../data/appData.js";

const choiceEffect = $currentChoice.choices[$choiceMade].effect;

function nextDay() {
  if ($currency.bomen <= 0) {
    currentState.set("gameOver")
  }
  else {
    if ($currentDay === 5) {
      currentState.set("endOfYear")
    } else {
      currentState.set("choice")
      currentDay.update(value => value += 1)
    }
  }
}
</script>

<style>
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .effects {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .effects img {
    height: 1.5rem;
    width: 1.5rem;
    margin-right: 0.4rem;
  }

  .negative {
    color: var(--color-red);
  }
</style>

<div class="container">
  <div class="text">
    <h1>{$currentChoice.title}</h1>
    <p>{$currentChoice.choices[$choiceMade].resultText}</p>
  </div>
  {#each choiceEffect as effect}
    <p class="effects" class:negative="{effect[1] < 0}">
      <img src={"./resources/icons/" + effect[0] + ".svg"} alt="munten icon">
      {effect[1]}
    </p>
  {/each}

  <NextButton parentFunction={nextDay}>
    {#if $currentDay >= 5}
      Beeindig jaar 1
    {:else}
      Volgende dag
    {/if}
  </NextButton>
</div>
