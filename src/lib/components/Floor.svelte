<script lang="ts">
  import { T } from '@threlte/core';
  import { RigidBody, Collider } from '@threlte/rapier';
  import { browser } from '$app/environment';
  import * as THREE from 'three';
  import { generateWoodTextures } from '$lib/textures/proceduralWood';

  // Procedural hardwood — generated in-browser, no fetched assets. On the
  // server (SSR) there's no canvas, so fall back to a flat tone.
  let map: THREE.CanvasTexture | null = null;
  let roughnessMap: THREE.CanvasTexture | null = null;
  if (browser) {
    const tex = generateWoodTextures();
    map = tex.map;
    roughnessMap = tex.roughnessMap;
  }
</script>

<T.Group position={[0, -0.05, 0]}>
  <RigidBody type="fixed">
    <Collider shape="cuboid" args={[10, 0.05, 10]} restitution={0.15} friction={0.6} />
  </RigidBody>
</T.Group>
<T.Mesh receiveShadow rotation.x={-Math.PI / 2} position={[0, 0, 0]}>
  <T.PlaneGeometry args={[20, 20]} />
  <T.MeshStandardMaterial
    {map}
    {roughnessMap}
    color={map ? '#ffffff' : '#5a3a1e'}
    roughness={0.75}
    metalness={0.0}
  />
</T.Mesh>
