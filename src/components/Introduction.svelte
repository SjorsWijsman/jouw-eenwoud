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
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

.introduction-container {
  position: fixed;
  max-width: calc(var(--max-content-width) - 20rem);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.introduction-container span, .introduction-container div {
  margin-top: 2rem;
  font-size: 1.1rem;
  text-align: center;
}

.introduction-container img {
  position: relative;
  width: 100%;
  max-height: 20rem;
}

.eenwoud-logo-container {
  transform: scale(1.1);
}

img.eenwoud-logo {
  margin-top: 0.4rem;
  width: 20rem;
  top: 0;
}

span.next-text {
  margin-bottom: 1rem;
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
      <span>Welkom bij</span>
      <img class="eenwoud-logo" src={"./resources/introduction/eenwoud-logo.svg"} alt="Eenwoud logo">
    </div>
  </div>
{:else if currentStep == 2}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/eenwoud-example.svg"} alt="Eenwoud voorbeeld">
    <span>Maak deel uit van een gezamelijk, virtueel bos met dezelfde principes en waarden van het echte Eenwoud</span>
  </div>
{:else if currentStep == 3}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/tree-example.svg"} alt="Boom voorbeeld">
    <span>Verzorg en groei je eigen boom door zelf gezond te leven</span>
  </div>
{:else if currentStep == 4}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/icons.svg"} alt="Iconen wandelingen, water, recyclen">
    <span>Doe dit door dagelijks een wandelingetje te maken, genoeg water te drinken en te recyclen</span>
  </div>
{:else if currentStep == 5}
  <div class="introduction-container" in:fly="{{ delay: 300, x: 100, duration: 300 }}" out:fly="{{ x: -100, duration: 300 }}">
    <img src={"./resources/introduction/tree.svg"} alt="Boom">
    <span>Kom meer te weten over bomen en het milleu door vragen te beantwoorden.</span>
    <span>Gebruik deze kennis en punten om de omgeving van jouw boom gezond te houden!</span>
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
