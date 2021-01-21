<script>
import { fade, fly } from 'svelte/transition';
import { user } from "../data/appData.js";

let currentStep = 1;
const totalSteps = 5;
$: if (currentStep > totalSteps) {
  currentStep = totalSteps;
  user.update(value => {
    value.introduction = false;
    return value;
  })
}
</script>

<style>
.step-counter {
  display: flex;
}

.step {
  width: 0.6rem;
  height: 0.6rem;
  background-color: var(--color-gray-dark);
  opacity: 0.4;
  border-radius: 50%;
  margin: 0 .2rem;
}

.active {
  opacity: 1;
  background-color: var(--color-yellow);
}

main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

.introduction-container {
  position: fixed;
  max-width: calc(var(--max-content-width) - 18rem);
  width: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.introduction-container img {
  position: relative;
  min-width: 100%;
  height: 100%;
}

.eenwoud-logo-container {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: scale(1);
}

img.eenwoud-logo {
  margin-top: 0.4rem;
  width: 20rem;
  top: 0;
}

span.next-text {
  margin-bottom: 1rem;
  margin-top: calc(2vh);
  font-size: 1rem;
  opacity: 0.8;
}

button.next-button {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  margin-bottom: 1.2rem;
}
</style>

<header transition:fade="{{ duration: 300 }}">
  <div class="step-counter">
    {#each Array(totalSteps) as _, i}
      <span class="step" class:active="{currentStep == i+1}" on:click={() => currentStep = i+1}></span>
    {/each}
  </div>
</header>
<main transition:fade="{{ duration: 300 }}">
{#if currentStep == 1}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <div class="eenwoud-logo-container">
      <div>Welkom bij</div>
      <img class="eenwoud-logo" src={"./resources/introduction/eenwoud-logo.svg"} alt="Eenwoud">
    </div>
  </div>
{:else if currentStep == 2}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/eenwoud-example.svg"} alt="Maak deel uit van een gezamelijk, virtueel bos met dezelfde waarden en principes van het echte Eenwoud.">
  </div>
{:else if currentStep == 3}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/tree-example.svg"} alt="Verzorg en groei je eigen boom door zelf gezond te leven.">
  </div>
{:else if currentStep == 4}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/health.svg"} alt="Iconen wandelingen, water, recyclen">
  </div>
{:else if currentStep == 5}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/tree.svg"} alt="Boom">
  </div>
{/if}
</main>
<footer transition:fade="{{ duration: 300 }}">
  <span class="next-text">
    {#if currentStep === totalSteps}
      Start het spel
    {:else}
      Klik om verder te gaan
    {/if}
  </span>
  <button type="button" name="button" class="next-button" on:click={() => currentStep += 1}></button>
</footer>
