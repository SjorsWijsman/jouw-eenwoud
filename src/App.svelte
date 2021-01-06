<script>
import Choices from "./components/Choices.svelte";
import CollectionButton from "./components/CollectionButton.svelte";
import Currency from "./components/Currency.svelte";
import YearCounter from "./components/YearCounter.svelte";
</script>

<style>
  header {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
</style>

<header>
  <Currency/>
  <CollectionButton/>
</header>
<main>
  <Choices/>
</main>
<footer>
  <YearCounter/>
</footer>
