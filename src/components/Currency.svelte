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
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.2rem 0;
  }

  .negative {
    color: var(--color-red);
  }

  img {
    height: 1.5rem;
    width: 1.5rem;
    margin-right: 0.4rem;
  }
</style>

<div class="currency">
  <p class:negative="{$munten < 0}">
    <img src="./resources/icons/munten.svg" alt="munten icon">
    {Math.floor($munten)}
  </p>
  <p class:negative="{$bomen < 0}">
    <img src="./resources/icons/bomen.svg" alt="bomen icon">
    {Math.floor($bomen)}
  </p>
</div>
