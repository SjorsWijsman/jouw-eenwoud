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
      currentYear.update(value => value += 1);
      currentDay.set(1);
    } else {
      currentState.set("choice")
      currentDay.update(value => value += 1)
    }
  }
}
</script>

<h1>{$currentChoice.title}</h1>
<p>{$currentChoice.choices[$choiceMade].resultText}</p>

{#each choiceEffect as effect}
<p>{effect}</p>
{/each}

<NextButton parentFunction={nextDay}>Volgende dag</NextButton>
