<script>
import { fly } from 'svelte/transition';
import { dialogue } from "../data/appData.js";
</script>

<style>
.dialogue {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: calc(var(--max-content-width) - 20rem);
  max-height: 100%;
  margin: 1rem;
  padding: 1rem;
  padding-top: 1.5rem;
  background-color: var(--color-cyan-dark);
  border-radius: 1rem;
}

.close-button {
  position: absolute;
  right: -1rem;
  top: -1rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

@media only screen and (max-width: 40rem) {
  .dialogue {
    position: relative;
    top: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .close-button {
    position: absolute;
    right: -50%;
    top: 100%;
    transform: translateX(-150%);
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }
}
</style>

<div class="dialogue" transition:fly="{{y: 200, duration: 300}}">
  <button type="button" name="button" class="close-button" on:click={() => dialogue.set("")}></button>
  <slot/>
</div>
