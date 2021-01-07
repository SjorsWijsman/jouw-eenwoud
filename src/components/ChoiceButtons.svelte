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
</script>

<style>
  .choices {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
  }

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

<div class="choices">
  {#each Object.keys($currentChoice.choices) as choice}
    <div class="choiceButton">
      {#each $currentChoice.choices[choice].effect as effect}
      <p class:negative="{effect[1] < 0}">
        <img src={"./resources/icons/" + effect[0] + ".svg"} alt="munten icon">
        {effect[1]}
      </p>
      {/each}
      <button type="button" name="button" on:click={() => makeChoice(choice)}>{choice}</button>
    </div>
  {/each}
</div>
