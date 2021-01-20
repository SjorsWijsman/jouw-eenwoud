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
  overflow: hidden;
  pointer-events: none;
}

.dialogue {
  position: relative;
  width: 100%;
  max-width: calc(var(--max-content-width) - 17rem);
  background-color: var(--color-cyan-dark);
  border-radius: 1rem;
  pointer-events: all;
  overflow: hidden;
}

.close-button {
  position: relative;
  top: -0.3rem;
  right: calc(-100% + 2.3rem);
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  pointer-events: all;
}
</style>

<div class="dialogue-container">
  <button type="button" name="button" class="close-button" on:click={() => dialogue.set("")}></button>
  <div class="dialogue" transition:fly="{{y: 200, duration: 300}}">
    <slot/>
  </div>
</div>
