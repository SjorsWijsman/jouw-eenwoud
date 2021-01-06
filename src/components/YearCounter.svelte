<script>
import { currentYear } from "../data/appData.js";
import { currentDay } from "../data/appData.js";
</script>

<style>
  .currentMoment {
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }
</style>

<div class="currentMoment">
  <h2>Jaar: {$currentYear}</h2>
  <p>Dag: {$currentDay}</p>
</div>
