<script>
import { fly } from 'svelte/transition';
import { dialogue } from "../data/appData.js";
</script>

<style>
.dialogue-container {
  position: fixed;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.dialogue {
  position: relative;
  width: 100%;
  max-width: calc(var(--max-content-width) - 20rem);
  padding: 1rem;
  padding-top: 1.5rem;
  background-color: var(--color-cyan-dark);
  border-radius: 1rem;
}

.close-button {
  position: relative;
  top: -2.5rem;
  right: -100%;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

@media only screen and (max-width: 35rem) {
  .close-button {
    top: -0.3rem;
    right: calc(-100% + 2.3rem);
  }
}
</style>

<div class="dialogue-container">
  <div class="dialogue" transition:fly="{{y: 200, duration: 300}}">
    <button type="button" name="button" class="close-button" on:click={() => dialogue.set("")}></button>
    <slot/>
  </div>
</div>
