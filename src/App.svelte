<script>
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
import Trees from "./components/Trees.svelte";
import {
  currency,
  currentYear,
} from "./data/appData.js";
</script>

<style>
  * {
    --max-content-width: 35rem;
    --height-header: 5rem;
    --height-footer: 7rem;
  }

  header {
    position: fixed;
    top: 0;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 100%;
    max-height: var(--height-header);
    z-index: 9999;
    user-select: none;
  }

  .logo {
    position: fixed;
    height: 2.5rem;
  }

  .header-container {
    max-width: var(--max-content-width);
    padding: 0 1.2rem;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  main {
    max-width: var(--max-content-width);
    padding: 1.5rem 1.2rem;
    height: calc(100vh - var(--height-footer) - var(--height-header));
    margin-top: var(--height-header);
    margin-bottom: var(--height-footer);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  footer {
    padding: 1.2rem;
    position: fixed;
    bottom: 0;
    height: var(--height-footer);
    width: 100%;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    z-index: 9999;
    user-select: none;
  }
</style>

<header>
  <div class="header-container">
    <Currency displayCurrency="stappen"/>
    <span>profiel</span>
  </div>
  <img class="logo" src="./resources/icons/eenwoud.svg" alt="Eenwoud Logo">
</header>
<main>
  <Trees/>
</main>
<footer>
  <YearCounter/>
</footer>
