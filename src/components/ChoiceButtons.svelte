<script>
import {
  currentState,
  currentChoice,
  currency,
  choiceMade,
} from "../data/appData.js";

function makeChoice(choice) {
  for (const effect of $currentChoice.choices[choice].effect) {
    currency.update(value => {
      value[effect[0]] += effect[1]
      return {...value};
    })
  }
  choiceMade.set(choice);
  currentState.set("choiceResult");
}

// https://stackoverflow.com/a/46545530
const choices = Object.keys($currentChoice.choices)
  .map((a) => ({sort: Math.random(), value: a}))
  .sort((a, b) => a.sort - b.sort)
  .map((a) => a.value);
</script>

<style>
  .choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 3rem;
  }

  .choiceButton {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

<div class="choices">
  {#each choices as choice}
    <div class="choiceButton">
      <button class="glowing" type="button" name="button" on:click={() => makeChoice(choice)}>{choice}</button>
    </div>
  {/each}
</div>
