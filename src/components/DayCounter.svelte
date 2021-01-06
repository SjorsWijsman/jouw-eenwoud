<script>
import { currentDay } from "../data/appData.js";
</script>

<style>
.daycounter {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100px;
}

.dot {
  height: 10px;
  width: 10px;
  margin: 5px;
  background-color: var(--color-gray);
  border-radius: 50%;
  display: inline-block;
}

.dot.current {
  height: 16px;
  width: 16px;
  margin: 2px;
  background-color: var(--color-yellow);
}
</style>

<div class="daycounter">
  {#each Array(5) as _, i}
    <span class="dot" class:current="{i === $currentDay-1}"></span>
  {/each}
</div>
