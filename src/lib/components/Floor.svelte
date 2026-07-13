<script lang="ts">
  import { T } from '@threlte/core';
  import { useTexture } from '@threlte/extras';
  import { RigidBody, Collider } from '@threlte/rapier';
  import * as THREE from 'three';

  const textures = useTexture({
    map: '/textures/hardwood_albedo.jpg',
    normalMap: '/textures/hardwood_normal.jpg',
    roughnessMap: '/textures/hardwood_roughness.jpg'
  }).catch(() => ({ map: null, normalMap: null, roughnessMap: null }));

  const applyRepeat = (tex: THREE.Texture | null) => {
    if (!tex) return null;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.anisotropy = 8;
    return tex;
  };
</script>

{#await textures then t}
  <T.Group position={[0, -0.05, 0]}>
    <RigidBody type="fixed">
      <Collider shape="cuboid" args={[10, 0.05, 10]} restitution={0.15} friction={0.6} />
    </RigidBody>
  </T.Group>
  <T.Mesh receiveShadow rotation.x={-Math.PI / 2} position={[0, 0, 0]}>
    <T.PlaneGeometry args={[20, 20]} />
    <T.MeshStandardMaterial
      map={applyRepeat(t.map ?? null)}
      normalMap={applyRepeat(t.normalMap ?? null)}
      roughnessMap={applyRepeat(t.roughnessMap ?? null)}
      color={t.map ? '#ffffff' : '#5a3a1e'}
      roughness={0.8}
      metalness={0.0}
    />
  </T.Mesh>
{/await}
