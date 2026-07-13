<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import { World } from '@threlte/rapier';
  import Floor from './Floor.svelte';
  import D12 from './D12.svelte';
  import ContactShadow from './ContactShadow.svelte';
</script>

<Canvas shadows toneMapping={2} colorManagementEnabled>
  <T.PerspectiveCamera makeDefault position={[0, 2.5, 3.5]} fov={45} near={0.1} far={100} oncreate={(cam) => cam.lookAt(0, 0.3, 0)} />

  <T.AmbientLight intensity={0.35} color="#ffe6c2" />
  <T.DirectionalLight
    position={[3, 6, 3]}
    intensity={2.2}
    castShadow
    shadow.mapSize.width={2048}
    shadow.mapSize.height={2048}
    shadow.camera.near={0.5}
    shadow.camera.far={20}
    shadow.camera.left={-5}
    shadow.camera.right={5}
    shadow.camera.top={5}
    shadow.camera.bottom={-5}
  />

  <World gravity={[0, -9.81, 0]}>
    <Floor />
    <ContactShadow />
    <D12 />
  </World>
</Canvas>
