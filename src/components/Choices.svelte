<script>
import ChoiceButton from "./ChoiceButton.svelte";
import { choices } from "../data/choices.js";
import {
  currentChoice,
  currentDay,
} from "../data/appData.js";

currentDay.subscribe(value => {
  randomChoice()
})

function randomChoice() {
  const randomIndex = Math.floor(Math.random() * choices.length)
  currentChoice.set(choices[randomIndex])
}
</script>

<style>
  .choices {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
  }
</style>

<div class="text">
  <h1>{$currentChoice.title}</h1>
  <p>{$currentChoice.description}</p>
</div>
<div class="choices">
  {#each Object.keys($currentChoice.choices) as choice}
    <ChoiceButton {choice}/>
  {/each}
</div>
