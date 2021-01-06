<script>
import { currentChoice } from "../data/appData.js";
import { currency } from "../data/appData.js";
import { currentYear } from "../data/appData.js";
import { currentDay } from "../data/appData.js";

export let choice;

let choiceEffect = $currentChoice.choices[choice];

function makeChoice() {
  for (const effect of choiceEffect) {
    $currency[effect[0]] += effect[1]
  }
  nextDay()
}

function nextDay() {
  if ($currentDay === 5) {
    currentYear.update(value => value += 1);
    currentDay.set(1);
  } else {
    currentDay.update(value => value += 1)
  }
}
</script>

<style media="screen">
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
