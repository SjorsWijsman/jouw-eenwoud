<script>
export let parentFunction;
</script>

<style>
  button {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: transparent;
    color: var(--color-text);
    margin: 0 auto;
    font-family: 'Merriweather Sans', sans-serif;
    font-style: italic;
    margin-bottom: 1rem;
  }

  button:focus, button:hover {
    transition: 0s;
    transform: scale(1);
  }

  .nextButton {
    position: relative;
    color: var(--color-white);
    background-color: var(--color-yellow);
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    box-shadow: 0 0.4rem 0 var(--color-yellow-dark);
  }

  button:focus .nextButton, button:hover .nextButton {
    transition: 0.2s;
    transform: translateY(0.3rem);
    box-shadow: 0 0 0 var(--color-yellow-dark);
  }

  button span {
    position: absolute;
    bottom: 0;
    transform: translateY(100%);
    opacity: 0.9;
  }
</style>

<button type="button" name="button" on:click={parentFunction}>
  <div class="nextButton glowing"></div>
  <span><slot/></span>
</button>
