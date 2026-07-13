<script lang="ts">
  import Scene from '$lib/components/Scene.svelte';
</script>

<main>
  <Scene />
</main>

<style>
  main {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(ellipse at center, #2b1c0e 0%, #0e0805 90%);
  }
</style>
