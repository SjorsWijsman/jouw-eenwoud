<script>
import Icon from "./Icon.svelte";
import {
  currentYear,
  currentActivities,
  activeActivity,
  dialogue,
  currency,
} from "../data/appData.js";
import { activitiesList } from "../data/activities.js";

const activity = activitiesList[$currentActivities[$activeActivity.toString()].activity];
const reward = $currentActivities[$activeActivity.toString()].reward;

let correct = undefined;
let chosenOption;

// Remove activity if answered
$: correct, currentActivities.update(value => {
  if (correct !== undefined) {
    delete value[$activeActivity.toString()];
  }
  return value;
})

// Add reward
$: correct, currency.update(value => {
  if (correct === true) {
    value[reward[0]] += reward[1];
  }
  return value;
})
</script>

<style>
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  padding-top: 1.5rem;
  text-align: center;
}

header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

header h2 {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

p {
  display: flex;
  align-items: center;
}

.options {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.options button {
  margin: 1rem 2rem;
}

footer {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.reward {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
</style>

<div class="container">
  <header>
    <h2>{activity.type}</h2>
    <p class="activity">{activity.text}</p>
  </header>
  {#if correct === true}
    <div>
      <p>
        {activity.choices[chosenOption].resultText}
      </p>
      <div class="reward">
        <div>+{reward[1]}</div>
        <Icon type={reward[0]}/>
      </div>
    </div>
  {:else if correct === false}
    <div>
      <p>
        {activity.choices[chosenOption].resultText}
      </p>
    </div>
  {:else}
    <div class="options">
      {#each Object.keys(activity.choices) as option}
        <button type="button" name="button" on:click={() => {
          correct = activity.choices[option].correct;
          chosenOption = option;
        }}>{option}</button>
      {/each}
    </div>
  {/if}
  {#if correct === undefined}
    <footer>
      <div class="reward">
        <div>+{reward[1]}</div>
        <Icon type={reward[0]}/>
      </div>
    </footer>
  {:else}
    <footer>
      <button type="button" name="button" on:click={() => dialogue.set("")}>Sluiten</button>
    </footer>
  {/if}
</div>
