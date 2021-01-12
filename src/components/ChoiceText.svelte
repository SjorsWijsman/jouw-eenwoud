<script>
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
  p {
    height:7rem;
  }
</style>

<div class="text">
  <h1>{$currentChoice.title}</h1>
  <p>{$currentChoice.description}</p>
</div>
