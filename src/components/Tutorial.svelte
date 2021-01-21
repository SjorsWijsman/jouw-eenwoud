<script>
import { fly } from 'svelte/transition';
import Icon from "./Icon.svelte";
import {
  tutorialStep,
  currency,
} from "../data/appData.js";

let totalSteps = 3;
</script>

<style>
.container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tutorial-container {
  background-color: var(--color-cyan-dark);
  padding: 0.6rem 0.8rem;
  border-radius: 2rem;
}

.tutorial-container span {
  font-weight: 500;
}
</style>

<div class="container">
{#if $tutorialStep == 1}
  <div class="tutorial-container" out:fly="{{ y: 50, duration: 300 }}">
    <span>{$tutorialStep}.</span> Plant je eerste boom
  </div>
{:else if $tutorialStep == 2}
  <div class="tutorial-container" in:fly="{{ delay: 300, y: -50, duration: 300 }}" out:fly="{{ y: 50, duration: 300 }}">
    <span>{$tutorialStep}.</span> Geef je boom voeding
  </div>
{:else if $tutorialStep == 3}
  <div class="tutorial-container" in:fly="{{ delay: 300, y: -50, duration: 300 }}" out:fly="{{ y: 50, duration: 300 }}">
    <span>{$tutorialStep}.</span> Voltooi een gebeurtenis
  </div>
{:else}
  <div in:fly="{{ delay: 300, y: -50, duration: 300 }}">
    <Icon type={"eenwoud"} size={2.3}/>
  </div>
{/if}
</div>
