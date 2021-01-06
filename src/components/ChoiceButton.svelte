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
</style>

<div class="choiceButton">
  <p>{choiceEffect}</p>
  <button type="button" name="button" on:click={makeChoice}>{choice}</button>
</div>
