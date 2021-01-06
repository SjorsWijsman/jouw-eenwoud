<script>
import {
  currentState,
  currentChoice,
  currency,
  choiceMade,
} from "../data/appData.js";

export let choice;

const choiceEffect = $currentChoice.choices[choice].effect;

function makeChoice() {
  for (const effect of choiceEffect) {
    $currency[effect[0]] += effect[1]
  }
  choiceMade.set(choice);
  currentState.set("choiceResult");
}

</script>

<style>
  .choiceButton {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem;
  }

  .choiceButton button {
    min-width: 10rem;
  }

  .choiceButton p {
    display: flex;
    flex-direction: row;
  }

  .choiceButton p img {
    height: 1.5rem;
    width: 1.5rem;
    margin-right: 0.4rem;
  }

  .negative {
    color: var(--color-red);
  }
</style>

<div class="choiceButton">
  {#each choiceEffect as effect}
  <p class:negative="{effect[1] < 0}">
    <img src={"./resources/icons/" + effect[0] + ".svg"} alt="munten icon">
    {effect[1]}
  </p>
  {/each}
  <button type="button" name="button" on:click={makeChoice}>{choice}</button>
</div>
