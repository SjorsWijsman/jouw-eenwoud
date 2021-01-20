<script>
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export let health;
$: progress.set(health);
export let maxHealth;

const progress = tweened(0, {
	duration: 800,
	easing: cubicOut
});
</script>

<style>
progress {
	--color-health: #6ED34B;
	--color-health-dark: #59C633;
  -webkit-appearance: none;
  appearance: none;
	display: block;
	width: 100%;
}

progress[value]::-webkit-progress-bar {
	background-color: var(--color-gray-dark-transparent);
  border-radius: 2rem;
	border: 0.3rem solid transparent;
	height: 1.5rem;
}

progress[value]::-webkit-progress-value {
  background-color: var(--color-health);
	background: linear-gradient(90deg, var(--color-health-dark), var(--color-health));
  border-radius: 2rem;
}
</style>

<progress value={$progress} max={maxHealth}></progress>
