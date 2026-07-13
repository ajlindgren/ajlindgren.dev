<script lang="ts">
  import { onMount } from 'svelte';
  import { T, useTask, useThrelte } from '@threlte/core';
  import { RigidBody, AutoColliders, useRapier } from '@threlte/rapier';
  import { interactivity, type IntersectionEvent } from '@threlte/extras';
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
  const FLOOR_TOP = 0;
  // Clamp user-imparted throw so a fast flick can't inject a wild velocity.
  const MAX_LINVEL = 9;
  const MAX_ANGVEL = 22;
  const DRAG_LIFT = 0.45;

  let rigidBody: RapierRigidBody | undefined = $state();
  let dieMaterial: THREE.MeshPhysicalMaterial | undefined = $state();
  let mapping: FaceMapping = buildFaceMapping(RADIUS);

  // Resting pose: rotate face 1's normal to world-up so its opposite face lies
  // flat on the floor, then sit the body so that bottom face rests at FLOOR_TOP.
  // The face-centroid distance from center is the dodecahedron inradius.
  const INRADIUS = mapping.centroids[0].length();
  const restQuat = new THREE.Quaternion().setFromUnitVectors(
    mapping.normals[0],
    new THREE.Vector3(0, 1, 0)
  );
  const REST_POS: [number, number, number] = [0, FLOOR_TOP + INRADIUS + 0.001, 0];
  const REST_QUAT: [number, number, number, number] = [
    restQuat.x,
    restQuat.y,
    restQuat.z,
    restQuat.w
  ];

  const { camera, renderer } = useThrelte();
  const { world, rapier } = useRapier();

  let dragging = $state(false);
  let hovering = $state(false);
  // Physics stays inert until the first grab; navigation only fires after a
  // genuine throw so the at-rest die on load never auto-resolves a face.
  let hasBeenThrown = false;
  const dragOffset = new THREE.Vector3();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const targetPoint = new THREE.Vector3();
  const flickVel = new THREE.Vector3();

  type Sample = { t: number; x: number; y: number; z: number };
  const pointerHistory: Sample[] = [];
  const HISTORY_MS = 100;

  let restStartedAt: number | null = null;
  let hasNavigated = false;
  const quat = new THREE.Quaternion();

  onMount(() => {
    initClatter();
  });

  function setCursor(v: string) {
    if (renderer) renderer.domElement.style.cursor = v;
  }

  function screenToWorld(clientX: number, clientY: number, out: THREE.Vector3): boolean {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera.current);
    return raycaster.ray.intersectPlane(dragPlane, out) !== null;
  }

  function onPointerEnter() {
    hovering = true;
    if (!dragging && !hasNavigated) setCursor('grab');
  }

  function onPointerLeave() {
    hovering = false;
    if (!dragging) setCursor('');
  }

  // The mesh's pointerdown is delivered by @threlte/extras `interactivity()` as
  // an IntersectionEvent, so client coords / pointerId live on `nativeEvent`,
  // not the event itself — reading them off `e` directly yields NaN and bails.
  function onPointerDown(e: IntersectionEvent<PointerEvent>) {
    if (!rigidBody || hasNavigated) return;
    const ev = e.nativeEvent;
    const rbPos = rigidBody.translation();
    // Drag on a horizontal plane lifted above the die's current height.
    dragPlane.constant = -(rbPos.y + DRAG_LIFT);
    if (!screenToWorld(ev.clientX, ev.clientY, targetPoint)) return;

    // Grab is a kinematic hold: no gravity, follows the pointer exactly.
    rigidBody.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

    dragOffset.set(rbPos.x - targetPoint.x, 0, rbPos.z - targetPoint.z);
    dragging = true;
    restStartedAt = null;
    setCursor('grabbing');
    pointerHistory.length = 0;
    pointerHistory.push({ t: performance.now(), x: rbPos.x, y: rbPos.y + DRAG_LIFT, z: rbPos.z });
    // Capture on the canvas so drag survives the pointer leaving the die/canvas;
    // window-level pointerup/pointercancel still backstop release if capture is lost.
    renderer?.domElement?.setPointerCapture?.(ev.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !rigidBody) return;
    if (!screenToWorld(e.clientX, e.clientY, targetPoint)) return;
    const x = targetPoint.x + dragOffset.x;
    const y = targetPoint.y;
    const z = targetPoint.z + dragOffset.z;
    rigidBody.setNextKinematicTranslation({ x, y, z });
    pointerHistory.push({ t: performance.now(), x, y, z });
    while (pointerHistory.length > 2 && performance.now() - pointerHistory[0].t > HISTORY_MS) {
      pointerHistory.shift();
    }
  }

  function onPointerUp() {
    if (!dragging || !rigidBody) return;
    dragging = false;
    setCursor(hovering ? 'grab' : '');

    // Release into a live dynamic body, then impart the flick velocity + spin.
    rigidBody.setBodyType(rapier.RigidBodyType.Dynamic, true);
    rigidBody.wakeUp();

    flickVel.set(0, 0, 0);
    if (pointerHistory.length >= 2) {
      const last = pointerHistory[pointerHistory.length - 1];
      const first = pointerHistory[0];
      const dt = Math.max(0.001, (last.t - first.t) / 1000);
      flickVel.set((last.x - first.x) / dt, (last.y - first.y) / dt, (last.z - first.z) / dt);
    }
    clampLength(flickVel, MAX_LINVEL);
    rigidBody.setLinvel({ x: flickVel.x, y: flickVel.y, z: flickVel.z }, true);

    // Spin: tumble about the axis perpendicular to the throw, plus a random
    // component so even a straight drag produces varied, non-deterministic rolls.
    const spinAxis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), flickVel);
    const spinMag = Math.min(MAX_ANGVEL, flickVel.length() * 2.5);
    if (spinAxis.lengthSq() > 1e-6) spinAxis.normalize().multiplyScalar(spinMag);
    const jitter = () => (Math.random() - 0.5) * 6;
    const angvel = new THREE.Vector3(spinAxis.x + jitter(), spinAxis.y + jitter(), spinAxis.z + jitter());
    clampLength(angvel, MAX_ANGVEL);
    rigidBody.setAngvel({ x: angvel.x, y: angvel.y, z: angvel.z }, true);

    hasBeenThrown = true;
    pointerHistory.length = 0;
  }

  function clampLength(v: THREE.Vector3, max: number) {
    const len = v.length();
    if (len > max) v.multiplyScalar(max / len);
  }

  useTask(() => {
    if (!rigidBody || hasNavigated || dragging) return;

    // Idle cue: gentle emissive pulse while the die waits to be grabbed. Purely
    // visual — it must never touch the rigid body, or "at rest" is a lie.
    if (dieMaterial && !hasBeenThrown) {
      dieMaterial.emissiveIntensity = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(performance.now() / 600));
    } else if (dieMaterial) {
      dieMaterial.emissiveIntensity = 0;
    }

    // Rest detection only matters after a real throw.
    if (!hasBeenThrown) return;

    const linvel = rigidBody.linvel();
    const angvel = rigidBody.angvel();
    const lin = Math.hypot(linvel.x, linvel.y, linvel.z);
    const ang = Math.hypot(angvel.x, angvel.y, angvel.z);

    const q = rigidBody.rotation();
    quat.set(q.x, q.y, q.z, q.w);

    const nearlyStopped = lin < REST_LINVEL && ang < REST_ANGVEL;
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
          setCursor('');
          goto(`/faces/${face}`);
        }
      }
    } else {
      restStartedAt = null;
    }
  });

  // Collision audio: sample events from Rapier's narrow-phase.
  useTask(() => {
    if (!rigidBody || !hasBeenThrown) return;
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

<T.Group position={REST_POS} quaternion={REST_QUAT}>
  <RigidBody
    bind:rigidBody
    type="fixed"
    linearDamping={0.2}
    angularDamping={0.15}
  >
    <AutoColliders shape="convexHull" restitution={0.15} friction={0.6} mass={0.4}>
      <T.Mesh
        castShadow
        receiveShadow
        onpointerdown={onPointerDown}
        onpointerenter={onPointerEnter}
        onpointerleave={onPointerLeave}
      >
        <T.DodecahedronGeometry args={[RADIUS, 0]} />
        <T.MeshPhysicalMaterial
          bind:ref={dieMaterial}
          color="#e9dcc3"
          roughness={0.38}
          metalness={0.0}
          clearcoat={0.6}
          clearcoatRoughness={0.35}
          emissive="#ffcf8a"
          emissiveIntensity={0}
        />
      </T.Mesh>
    </AutoColliders>
  </RigidBody>
</T.Group>
