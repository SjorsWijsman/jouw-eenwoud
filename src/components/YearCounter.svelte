<script>
import { currentYear } from "../data/appData.js";
</script>

<style>
.currentMoment {
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  border-radius: 1rem;
}

h2 {
  font-size: 1.6rem;
  font-weight: 500;
  margin-bottom: 0;
}
</style>

<div class="currentMoment">
  <span>Huidig Jaar:</span>
  <h2>{$currentYear}</h2>
</div>
