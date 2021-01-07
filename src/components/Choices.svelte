<script>
import ChoiceButton from "./ChoiceButton.svelte";
import Trees from "./Trees.svelte";
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
  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .choices {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
  }
</style>

<div class="container">
  <div class="text">
    <h1>{$currentChoice.title}</h1>
    <p>{$currentChoice.description}</p>
  </div>
  <Trees/>
  <div class="choices">
    {#each Object.keys($currentChoice.choices) as choice}
      <ChoiceButton {choice}/>
    {/each}
  </div>
</div>
