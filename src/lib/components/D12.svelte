<script lang="ts">
  import { onMount } from 'svelte';
  import { T, useTask, useThrelte } from '@threlte/core';
  import { RigidBody, AutoColliders, useRapier } from '@threlte/rapier';
  import { interactivity } from '@threlte/extras';
  import { goto } from '$app/navigation';
  import * as THREE from 'three';
  import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
  import { buildFaceMapping, detectUpFace, type FaceMapping } from '$lib/physics/faceDetection';
  import { playRandomHit, initClatter } from '$lib/audio/clatter';

  interactivity();

  const RADIUS = 0.5;
  const REST_LINVEL = 0.05;
  const REST_ANGVEL = 0.1;
  const REST_HOLD_MS = 500;
  const ALIGNMENT_MIN = 0.85;
  const NUDGE_IMPULSE = 0.2;

  let rigidBody: RapierRigidBody | undefined = $state();
  let mapping: FaceMapping = buildFaceMapping(RADIUS);

  const { camera, renderer } = useThrelte();
  const { world } = useRapier();

  let dragging = $state(false);
  let dragOffset = new THREE.Vector3();
  let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0);
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const targetPoint = new THREE.Vector3();

  type Sample = { t: number; x: number; y: number; z: number };
  const pointerHistory: Sample[] = [];
  const HISTORY_MS = 100;

  let restStartedAt: number | null = null;
  let hasNavigated = false;
  let settled = $state(false);
  const quat = new THREE.Quaternion();

  onMount(() => {
    initClatter();
  });

  function screenToWorld(clientX: number, clientY: number, out: THREE.Vector3): boolean {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera.current);
    return raycaster.ray.intersectPlane(dragPlane, out) !== null;
  }

  function onPointerDown(e: PointerEvent) {
    if (!rigidBody || hasNavigated) return;
    const rbPos = rigidBody.translation();
    dragPlane.constant = -rbPos.y;
    if (!screenToWorld(e.clientX, e.clientY, targetPoint)) return;
    dragOffset.set(rbPos.x - targetPoint.x, 0, rbPos.z - targetPoint.z);
    dragging = true;
    restStartedAt = null;
    pointerHistory.length = 0;
    pointerHistory.push({ t: performance.now(), x: rbPos.x, y: rbPos.y, z: rbPos.z });
    (e.target as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !rigidBody) return;
    if (!screenToWorld(e.clientX, e.clientY, targetPoint)) return;
    const desired = new THREE.Vector3(
      targetPoint.x + dragOffset.x,
      Math.max(RADIUS * 1.1, targetPoint.y + 0.6),
      targetPoint.z + dragOffset.z
    );
    const cur = rigidBody.translation();
    const spring = 20;
    rigidBody.setLinvel(
      { x: (desired.x - cur.x) * spring, y: (desired.y - cur.y) * spring, z: (desired.z - cur.z) * spring },
      true
    );
    pointerHistory.push({ t: performance.now(), x: desired.x, y: desired.y, z: desired.z });
    while (pointerHistory.length > 2 && performance.now() - pointerHistory[0].t > HISTORY_MS) {
      pointerHistory.shift();
    }
  }

  function onPointerUp() {
    if (!dragging || !rigidBody) return;
    dragging = false;
    if (pointerHistory.length >= 2) {
      const last = pointerHistory[pointerHistory.length - 1];
      const first = pointerHistory[0];
      const dt = Math.max(0.001, (last.t - first.t) / 1000);
      const vx = (last.x - first.x) / dt;
      const vy = (last.y - first.y) / dt;
      const vz = (last.z - first.z) / dt;
      rigidBody.setLinvel({ x: vx, y: vy, z: vz }, true);
      const kick = 4;
      rigidBody.applyTorqueImpulse(
        { x: (Math.random() - 0.5) * kick, y: (Math.random() - 0.5) * kick, z: (Math.random() - 0.5) * kick },
        true
      );
    }
    pointerHistory.length = 0;
  }

  useTask(() => {
    if (!rigidBody || hasNavigated) return;

    const linvel = rigidBody.linvel();
    const angvel = rigidBody.angvel();
    const lin = Math.hypot(linvel.x, linvel.y, linvel.z);
    const ang = Math.hypot(angvel.x, angvel.y, angvel.z);

    const q = rigidBody.rotation();
    quat.set(q.x, q.y, q.z, q.w);

    const nearlyStopped = !dragging && lin < REST_LINVEL && ang < REST_ANGVEL;
    if (nearlyStopped) {
      if (restStartedAt === null) restStartedAt = performance.now();
      else if (performance.now() - restStartedAt >= REST_HOLD_MS) {
        const { face, alignment } = detectUpFace(mapping, quat);
        if (alignment < ALIGNMENT_MIN) {
          restStartedAt = null;
          rigidBody.applyTorqueImpulse(
            { x: (Math.random() - 0.5) * NUDGE_IMPULSE, y: 0, z: (Math.random() - 0.5) * NUDGE_IMPULSE },
            true
          );
        } else {
          hasNavigated = true;
          settled = true;
          goto(`/faces/${face}`);
        }
      }
    } else {
      restStartedAt = null;
    }
  });

  // Collision audio: sample events from Rapier's narrow-phase.
  useTask(() => {
    if (!rigidBody) return;
    world.contactPairsWith(rigidBody.collider(0), (_other) => {
      const linvel = rigidBody!.linvel();
      const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
      if (speed > 0.5) {
        playRandomHit(Math.min(1, speed / 4));
      }
    });
  });
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} onpointercancel={onPointerUp} />

<T.Group position={[0, 3, 0]}>
  <RigidBody
    bind:rigidBody
    type="dynamic"
    linearDamping={0.2}
    angularDamping={0.15}
  >
    <AutoColliders shape="convexHull" restitution={0.15} friction={0.6} mass={0.4}>
      <T.Mesh castShadow receiveShadow onpointerdown={onPointerDown}>
        <T.DodecahedronGeometry args={[RADIUS, 0]} />
        <T.MeshStandardMaterial color="#efe6d5" roughness={0.45} metalness={0.05} />
      </T.Mesh>
    </AutoColliders>
  </RigidBody>
</T.Group>
