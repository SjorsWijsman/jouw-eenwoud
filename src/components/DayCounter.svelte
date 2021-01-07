<script>
import { currentDay } from "../data/appData.js";
</script>

<style>
.daycounter {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 20px;
  width: 100px;
}

.dotcontainer {
  height: 20px;
  width: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  transition: all .3s;
  height: 10px;
  width: 10px;
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
      <div class="dotcontainer">
        <span class="dot" class:current="{i === $currentDay-1}"></span>
      </div>
    {/each}
</div>
