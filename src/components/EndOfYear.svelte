<script>
import NextButton from "./NextButton.svelte";
import { currentState, currentYear, currentDay } from "../data/appData.js";

function nextYear() {
  currentYear.update(value => value += 1);
  currentDay.set(1);
  currentState.set("choice");
}
</script>

<h1>Einde van jaar {$currentYear}</h1>
<NextButton parentFunction={nextYear}>Begin jaar {$currentYear + 1}</NextButton>
