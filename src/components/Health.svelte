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
  -webkit-appearance: none;
  appearance: none;
	display: block;
	width: 100%;
}

progress[value]::-webkit-progress-bar {
  background-color: var(--color-cyan);
  border-radius: 2rem;
}

progress[value]::-webkit-progress-value {
  background-color: var(--color-yellow);
  border-radius: 2rem;
}
</style>

<progress value={$progress} max={maxHealth}></progress>
