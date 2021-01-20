<script>
import Icon from "./Icon.svelte";
import { currency } from "../data/appData.js";
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export let displayCurrency = "stappen";
export let inverted = false;

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

span {
	padding: 0 0.2rem;
}

.negative {
  color: var(--color-red);
}

.inverted {
	flex-direction: row-reverse;
}
</style>

<div class="currency">
  <p class:negative="{$amount < 0}" class:inverted>
		<Icon type={displayCurrency}/>
    <span>{Math.floor($amount).toLocaleString("NL-NL")}</span>
  </p>
</div>
