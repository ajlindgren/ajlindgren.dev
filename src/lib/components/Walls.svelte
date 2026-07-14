<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { RigidBody, Collider } from '@threlte/rapier';
  import * as THREE from 'three';

  // Floor plane height + surface material, mirrored from Floor.svelte so the die
  // bounces off the walls exactly as it does off the ground.
  const FLOOR_Y = 0;
  const RESTITUTION = 0.15;
  const FRICTION = 0.6;

  // Thin but not razor-thin (paired with die CCD to avoid tunneling); tall so a
  // bouncing die can't clear them. Half-extents used directly by the colliders.
  const HALF_THICKNESS = 0.25;
  const HALF_HEIGHT = 2;

  const { camera, size } = useThrelte();

  // Unproject the four viewport corners onto the floor plane and take the
  // axis-aligned bounding rectangle of the hits. The camera is tilted, so the
  // real footprint is a trapezoid; the AABB is a close-enough approximation
  // ("roughly the size of the viewport" per the design goal).
  const NDC_CORNERS: Array<[number, number]> = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1]
  ];
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
  const ray = new THREE.Ray();
  const corner = new THREE.Vector3();
  const hit = new THREE.Vector3();

  type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
  let bounds = $state<Bounds | null>(null);

  function recompute(width: number, height: number) {
    const cam = camera.current;
    if (!cam || width === 0 || height === 0) return;
    cam.updateMatrixWorld();

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const [nx, ny] of NDC_CORNERS) {
      corner.set(nx, ny, 0.5).unproject(cam);
      ray.origin.copy(cam.position);
      ray.direction.copy(corner.sub(cam.position).normalize());
      if (!ray.intersectPlane(plane, hit)) return;
      minX = Math.min(minX, hit.x);
      maxX = Math.max(maxX, hit.x);
      minZ = Math.min(minZ, hit.z);
      maxZ = Math.max(maxZ, hit.z);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minZ) || !Number.isFinite(maxZ)) {
      return;
    }
    bounds = { minX, maxX, minZ, maxZ };
  }

  $effect(() => {
    recompute($size.width, $size.height);
  });
</script>

{#if bounds}
  {@const cx = (bounds.minX + bounds.maxX) / 2}
  {@const cz = (bounds.minZ + bounds.maxZ) / 2}
  {@const halfX = (bounds.maxX - bounds.minX) / 2}
  {@const halfZ = (bounds.maxZ - bounds.minZ) / 2}
  {@const wallY = FLOOR_Y + HALF_HEIGHT}
  <!-- Collider-only, no meshes: invisible and outside pointer raycasting. -->
  <!-- +X edge -->
  <T.Group position={[bounds.maxX + HALF_THICKNESS, wallY, cz]}>
    <RigidBody type="fixed">
      <Collider shape="cuboid" args={[HALF_THICKNESS, HALF_HEIGHT, halfZ]} restitution={RESTITUTION} friction={FRICTION} />
    </RigidBody>
  </T.Group>
  <!-- -X edge -->
  <T.Group position={[bounds.minX - HALF_THICKNESS, wallY, cz]}>
    <RigidBody type="fixed">
      <Collider shape="cuboid" args={[HALF_THICKNESS, HALF_HEIGHT, halfZ]} restitution={RESTITUTION} friction={FRICTION} />
    </RigidBody>
  </T.Group>
  <!-- +Z edge -->
  <T.Group position={[cx, wallY, bounds.maxZ + HALF_THICKNESS]}>
    <RigidBody type="fixed">
      <Collider shape="cuboid" args={[halfX, HALF_HEIGHT, HALF_THICKNESS]} restitution={RESTITUTION} friction={FRICTION} />
    </RigidBody>
  </T.Group>
  <!-- -Z edge -->
  <T.Group position={[cx, wallY, bounds.minZ - HALF_THICKNESS]}>
    <RigidBody type="fixed">
      <Collider shape="cuboid" args={[halfX, HALF_HEIGHT, HALF_THICKNESS]} restitution={RESTITUTION} friction={FRICTION} />
    </RigidBody>
  </T.Group>
{/if}
