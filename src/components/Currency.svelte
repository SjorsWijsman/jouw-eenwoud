<script>
import { currency } from "../data/appData.js";
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export let displayCurrency = "bomen";

const amount = tweened($currency[displayCurrency], {
	duration: 400,
	easing: cubicOut
});

currency.subscribe(value => {
  amount.set(value[displayCurrency])
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
  <p class:negative="{$amount < 0}">
    <img src={`./resources/icons/${displayCurrency}.svg`} alt="zaden icon">
    {Math.floor($amount)}
  </p>
</div>
