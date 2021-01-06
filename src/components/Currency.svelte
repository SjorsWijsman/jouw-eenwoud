<script>
import { currency } from "../data/appData.js";
</script>

<style>
  p {
    margin: 0;
  }
</style>

<div class="currency">
  {#each Object.keys($currency) as currencyItem}
  <p>{currencyItem} {$currency[currencyItem]}</p>
  {/each}
</div>
