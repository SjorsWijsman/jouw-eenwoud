<script>
import Icon from "./Icon.svelte";
import { currency } from "../data/appData.js";
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export let displayCurrency = "stappen";

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
	min-width: 6ch;
}

.negative {
  color: var(--color-red);
}
</style>

<div class="currency">
  <p class:negative="{$amount < 0}">
		<Icon type={displayCurrency}/>
    {Math.floor($amount).toLocaleString("NL-NL")}
  </p>
</div>
