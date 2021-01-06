<script>
import { currency } from "../data/appData.js";
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

const munten = tweened($currency.munten, {
	duration: 400,
	easing: cubicOut
});

const bomen = tweened($currency.bomen, {
	duration: 400,
	easing: cubicOut
});

currency.subscribe(value => {
  munten.set(value.munten)
  bomen.set(value.bomen)
})

</script>

<style>
  p {
    margin: 0;
  }

  .negative {
    color: var(--color-red);
  }
</style>

<div class="currency">
  <p class:negative="{$munten < 0}">Munten: {Math.floor($munten)}</p>
  <p class:negative="{$bomen < 0}">Bomen: {Math.floor($bomen)}</p>
</div>
