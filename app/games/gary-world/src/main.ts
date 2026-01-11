import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 8, 40);

const camera = new THREE.OrthographicCamera(-9, 9, 9, -9, 0.1, 200);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
sunLight.position.set(10, 18, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 60;
sunLight.shadow.camera.left = -20;
sunLight.shadow.camera.right = 20;
sunLight.shadow.camera.top = 20;
sunLight.shadow.camera.bottom = -20;
scene.add(sunLight);

const groundGeometry = new THREE.PlaneGeometry(200, 24);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x334155 });
const track = new THREE.Mesh(new THREE.BoxGeometry(200, 0.2, 4), trackMaterial);
track.position.set(0, 0.1, 0);
track.receiveShadow = true;
scene.add(track);

const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, 0);
scene.add(playerGroup);

const placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316 });
const placeholder = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1), placeholderMaterial);
placeholder.castShadow = true;
placeholder.position.y = 1.2;
playerGroup.add(placeholder);

const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
const overheadMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a });
const obstacleGeometry = new THREE.BoxGeometry(1, 1.4, 1);
const overheadGeometry = new THREE.BoxGeometry(2.6, 2.6, 2.6);

type Obstacle = {
  mesh: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  rootBones?: { bone: THREE.Bone; position: THREE.Vector3 }[];
  type: "ground" | "overhead";
};

const obstacles: Obstacle[] = [];

let playerMixer: THREE.AnimationMixer | null = null;
let playerAction: THREE.AnimationAction | null = null;
let playerModel: THREE.Object3D | null = null;
let playerBaseOffset = 0;
let playerRootBones: { bone: THREE.Bone; position: THREE.Vector3 }[] = [];

type EnemyTemplate = {
  object: THREE.Object3D;
  clip: THREE.AnimationClip | null;
  height: number;
};

const enemyTemplates: EnemyTemplate[] = [];

const state = {
  speed: 0.24,
  jumpVelocity: 0,
  isGrounded: true,
  isSliding: false,
  slideTimer: 0,
  slideHeld: false,
  jumpCount: 0,
  score: 0,
  best: Number(localStorage.getItem("garyWorldBest") || 0),
  running: false,
};

const physics = {
  gravity: 3.0,
  jumpVelocity: 0.6,
  maxJumps: 2,
  slideDuration: 0.4,
};

const collider = {
  width: 1.2,
  height: 2.4,
  slideHeight: 1.4,
  depth: 1,
};

const loader = new GLTFLoader();

function assetUrl(path: string) {
  return new URL(`./assets/${path}`, window.location.href).toString();
}

type EnvironmentTemplate = {
  object: THREE.Object3D;
  targetHeight: number;
};

type EnvironmentInstance = {
  mesh: THREE.Object3D;
};

const environmentTemplates: EnvironmentTemplate[] = [];
const environmentInstances: EnvironmentInstance[] = [];
const environmentGroup = new THREE.Group();
scene.add(environmentGroup);

const environmentDefs = [
  { path: "Nature/glTF/CommonTree_4.gltf", height: 6 },
  { path: "Nature/glTF/Pine_2.gltf", height: 7 },
  { path: "Nature/glTF/Bush_Common_Flowers.gltf", height: 2 },
  { path: "Nature/glTF/Grass_Wispy_Tall.gltf", height: 1 },
  { path: "Nature/glTF/Pebble_Round_3.gltf", height: 0.7 },
];

const enemyDefs = [
  { path: "Enemies/glTF/Demon.gltf", height: 2.4 },
  { path: "Enemies/glTF/Giant.gltf", height: 3.2 },
  { path: "Enemies/glTF/Goblin.gltf", height: 2.1 },
  { path: "Enemies/glTF/Hedgehog.gltf", height: 1.4 },
  { path: "Enemies/glTF/Skeleton.gltf", height: 2.2 },
  { path: "Enemies/glTF/Skeleton_Armor.gltf", height: 2.3 },
  { path: "Enemies/glTF/Wizard.gltf", height: 2.4 },
  { path: "Enemies/glTF/Yeti.gltf", height: 3 },
  { path: "Enemies/glTF/Zombie.gltf", height: 2.4 },
];

function applyShadow(model: THREE.Object3D) {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
}

function loadEnvironmentAssets() {
  const promises = environmentDefs.map(
    (def) =>
      new Promise<EnvironmentTemplate | null>((resolve) => {
        loader.load(
          assetUrl(def.path),
          (gltf) => {
            applyShadow(gltf.scene);
            normalizeModel(gltf.scene, def.height);
            resolve({ object: gltf.scene, targetHeight: def.height });
          },
          undefined,
          () => resolve(null),
        );
      }),
  );

  Promise.all(promises).then((results) => {
    results.forEach((result) => {
      if (result) environmentTemplates.push(result);
    });
    if (environmentTemplates.length > 0) {
      populateEnvironment();
    }
  });
}

function randomEnvironmentTemplate() {
  return environmentTemplates[Math.floor(Math.random() * environmentTemplates.length)];
}

function randomEnvironmentZ() {
  return Math.random() > 0.5 ? -6 - Math.random() * 2 : 6 + Math.random() * 2;
}

function populateEnvironment() {
  environmentInstances.forEach((instance) => environmentGroup.remove(instance.mesh));
  environmentInstances.length = 0;

  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const template = randomEnvironmentTemplate();
    const mesh = SkeletonUtils.clone(template.object);
    applyShadow(mesh);
    mesh.position.set(-10 + i * 4, 0, randomEnvironmentZ());
    environmentGroup.add(mesh);
    environmentInstances.push({ mesh });
  }
}

function updateEnvironment(delta: number) {
  if (!state.running || environmentInstances.length === 0) return;
  const moveSpeed = state.speed * 60 * delta * 0.6;
  environmentInstances.forEach((instance) => {
    instance.mesh.position.x -= moveSpeed;
    if (instance.mesh.position.x < -18) {
      instance.mesh.position.x = 40 + Math.random() * 20;
      instance.mesh.position.z = randomEnvironmentZ();
    }
  });
}

function normalizeModel(model: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = targetHeight / size.y;
  model.scale.setScalar(scale);
  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;
}

function captureRootBones(model: THREE.Object3D) {
  const roots: { bone: THREE.Bone; position: THREE.Vector3 }[] = [];
  model.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      const bone = child as THREE.Bone;
      const parentIsBone = bone.parent && (bone.parent as THREE.Bone).isBone;
      if (!parentIsBone) {
        roots.push({ bone, position: bone.position.clone() });
      }
    }
  });
  return roots;
}

function lockRootBones(roots: { bone: THREE.Bone; position: THREE.Vector3 }[]) {
  roots.forEach((root) => {
    root.bone.position.copy(root.position);
    root.bone.updateMatrixWorld(true);
  });
}

function sanitizeClip(clip: THREE.AnimationClip) {
  const tracks = clip.tracks.filter((track) => !track.name.endsWith(".position"));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function loadPlayer() {
  loader.load(
    assetUrl("Characters/glTF/Character_Male_1.gltf"),
    (gltf) => {
      playerGroup.clear();
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      normalizeModel(gltf.scene, 2.6);
      playerBaseOffset = gltf.scene.position.y;
      playerModel = gltf.scene;
      playerRootBones = captureRootBones(gltf.scene);
      playerGroup.add(gltf.scene);

      playerMixer = null;
      playerAction = null;

      if (gltf.animations.length > 0) {
        const clip = sanitizeClip(gltf.animations[0]);
        playerMixer = new THREE.AnimationMixer(gltf.scene);
        playerAction = playerMixer.clipAction(clip);
        playerAction.loop = THREE.LoopOnce;
        playerAction.clampWhenFinished = true;
        playerAction.enabled = true;
        playerAction.paused = true;
      }
    },
    undefined,
    () => {
      playerGroup.clear();
      playerModel = null;
      playerBaseOffset = 0;
      playerRootBones = [];
      playerMixer = null;
      playerAction = null;
      playerGroup.add(placeholder);
    },
  );
}

function loadEnemyAssets() {
  const promises = enemyDefs.map(
    (def) =>
      new Promise<EnemyTemplate | null>((resolve) => {
        loader.load(
          assetUrl(def.path),
          (gltf) => {
            applyShadow(gltf.scene);
            normalizeModel(gltf.scene, def.height);
            resolve({
              object: gltf.scene,
              clip: gltf.animations[0] ? sanitizeClip(gltf.animations[0]) : null,
              height: def.height,
            });
          },
          undefined,
          () => resolve(null),
        );
      }),
  );

  Promise.all(promises).then((results) => {
    results.forEach((result) => {
      if (result) enemyTemplates.push(result);
    });
  });
}

function randomEnemyTemplate() {
  return enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];
}

const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.inset = "24px";
hud.style.display = "flex";
hud.style.justifyContent = "space-between";
hud.style.fontFamily = "Segoe UI, sans-serif";
hud.style.fontWeight = "600";
hud.style.color = "#0f172a";
hud.style.pointerEvents = "none";
hud.style.fontSize = "18px";
const hudScore = document.createElement("div");
const hudBest = document.createElement("div");
hud.append(hudScore, hudBest);
document.body.appendChild(hud);

const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.inset = "0";
overlay.style.display = "flex";
overlay.style.alignItems = "center";
overlay.style.justifyContent = "center";
overlay.style.background = "rgba(15, 23, 42, 0.65)";
overlay.style.color = "#f8fafc";
overlay.style.fontFamily = "Segoe UI, sans-serif";
overlay.style.textAlign = "center";
overlay.style.padding = "24px";
overlay.innerHTML = `
  <div style="display: grid; gap: 12px; max-width: 360px;">
    <h1 style="margin:0; font-size: 32px;">Gary World</h1>
    <p style="margin:0; font-size: 16px;">Run, jump, and dodge the obstacles.</p>
    <p style="margin:0; font-size: 14px; opacity: 0.8;">Space/tap to jump (double jump). Down or swipe down to slide.</p>
    <button id="startButton" style="border:none; border-radius: 999px; padding: 12px 18px; font-weight:700; background:#fbbf24; color:#0f172a; cursor:pointer;">Start</button>
  </div>
`;

document.body.appendChild(overlay);

const startButton = overlay.querySelector("#startButton") as HTMLButtonElement;

function setOverlayVisible(isVisible: boolean) {
  overlay.style.display = isVisible ? "flex" : "none";
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  const aspect = width / height;
  const viewSize = 9;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

function spawnObstacle() {
  let obstacleMesh: THREE.Object3D;
  let mixer: THREE.AnimationMixer | undefined;
  let rootBones: { bone: THREE.Bone; position: THREE.Vector3 }[] | undefined;
  let type: "ground" | "overhead" = Math.random() < 0.65 ? "ground" : "overhead";

  if (type === "ground" && enemyTemplates.length > 0) {
    const template = randomEnemyTemplate();
    obstacleMesh = SkeletonUtils.clone(template.object);
    applyShadow(obstacleMesh);
    normalizeModel(obstacleMesh, Math.min(template.height, 2.2));
    rootBones = captureRootBones(obstacleMesh);

    if (template.clip) {
      mixer = new THREE.AnimationMixer(obstacleMesh);
      mixer.clipAction(template.clip).play();
    }
  } else if (type === "overhead") {
    const overhead = new THREE.Mesh(overheadGeometry, overheadMaterial);
    overhead.castShadow = true;
    overhead.receiveShadow = true;
    obstacleMesh = overhead;
  } else {
    const fallback = new THREE.Mesh(obstacleGeometry, platformMaterial);
    fallback.castShadow = true;
    obstacleMesh = fallback;
  }

  if (type === "overhead") {
    obstacleMesh.position.set(12 + Math.random() * 6, 3.1, 0);
  } else {
    obstacleMesh.position.set(12 + Math.random() * 6, 0, 0);
  }

  obstacleMesh.userData.baseOffset = obstacleMesh.position.y;
  scene.add(obstacleMesh);
  obstacles.push({ mesh: obstacleMesh, mixer, rootBones, type });
}

let spawnTimer = 0;

function resetGame() {
  state.speed = 0.24;
  state.jumpVelocity = 0;
  state.isGrounded = true;
  state.isSliding = false;
  state.slideTimer = 0;
  state.slideHeld = false;
  state.jumpCount = 0;
  state.score = 0;
  state.running = true;
  playerGroup.position.set(0, 0, 0);
  playerGroup.scale.set(1, 1, 1);
  obstacles.forEach((obstacle) => scene.remove(obstacle.mesh));
  obstacles.length = 0;
  spawnTimer = 0;
  if (environmentTemplates.length > 0 && environmentInstances.length === 0) {
    populateEnvironment();
  }
  setOverlayVisible(false);
}

function endGame() {
  state.running = false;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("garyWorldBest", state.best.toString());
  }
  overlay.querySelector("h1")!.textContent = "Game Over";
  overlay.querySelector("p")!.textContent = `Score: ${state.score} • Best: ${state.best}`;
  setOverlayVisible(true);
}

function updateHud() {
  hudScore.textContent = `Score: ${state.score}`;
  hudBest.textContent = `Best: ${state.best}`;
}

function jump() {
  if (!state.running) {
    resetGame();
    return;
  }
  if (state.jumpCount < physics.maxJumps) {
    state.jumpVelocity = physics.jumpVelocity;
    state.isGrounded = false;
    state.jumpCount += 1;
    state.isSliding = false;
    state.slideTimer = 0;
    if (playerAction) {
      playerAction.reset();
      playerAction.paused = false;
      playerAction.play();
    }
  }
}

function slide() {
  if (!state.running) return;
  if (!state.isGrounded) return;
  state.isSliding = true;
  state.slideHeld = true;
  state.slideTimer = physics.slideDuration;
}

function stopSlide() {
  state.slideHeld = false;
  if (state.isSliding) {
    state.isSliding = false;
    state.slideTimer = 0;
  }
}

function updatePlayer(delta: number) {
  if (!state.running) return;
  const wasGrounded = state.isGrounded;
  state.jumpVelocity -= physics.gravity * delta;
  playerGroup.position.y += state.jumpVelocity;

  if (playerGroup.position.y <= 0) {
    playerGroup.position.y = 0;
    state.jumpVelocity = 0;
    state.isGrounded = true;
    state.jumpCount = 0;
  }

  if (state.isSliding) {
    if (!state.slideHeld) {
      state.isSliding = false;
      state.slideTimer = 0;
    } else {
      state.slideTimer -= delta;
      if (state.slideTimer <= 0) {
        state.isSliding = false;
        state.slideHeld = false;
      }
    }
  }

  if (!state.isGrounded && playerMixer) {
    playerMixer.update(delta);
  }

  if (state.isGrounded && !wasGrounded && playerAction) {
    playerAction.stop();
    playerAction.reset();
    playerAction.paused = true;
  }

  playerGroup.scale.y = state.isSliding ? 0.65 : 1;

  if (playerModel) {
    playerModel.position.y = playerBaseOffset;
    playerModel.position.z = 0;
    lockRootBones(playerRootBones);
  }
}

function updateObstacles(delta: number) {
  if (!state.running) return;
  spawnTimer += delta;
  if (spawnTimer > 1.4) {
    spawnTimer = 0;
    spawnObstacle();
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.mesh.position.x -= state.speed * 60 * delta;

    obstacle.mixer?.update(delta);

    if (typeof obstacle.mesh.userData.baseOffset === "number") {
      obstacle.mesh.position.y = obstacle.mesh.userData.baseOffset;
      obstacle.mesh.position.z = 0;
    }

    if (obstacle.rootBones) {
      lockRootBones(obstacle.rootBones);
    }

    if (obstacle.mesh.position.x < -12) {
      obstacles.splice(i, 1);
      scene.remove(obstacle.mesh);
      state.score += 5;
      continue;
    }

    const playerHeight = state.isSliding ? collider.slideHeight : collider.height;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + playerHeight / 2, 0),
      new THREE.Vector3(collider.width, playerHeight, collider.depth),
    );

    const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
    const obstacleCenter = new THREE.Vector3();
    const obstacleSize = new THREE.Vector3();
    obstacleBox.getCenter(obstacleCenter);
    obstacleBox.getSize(obstacleSize);
    obstacleSize.y *= 0.85;
    obstacleBox.setFromCenterAndSize(obstacleCenter, obstacleSize);

    if (playerBox.intersectsBox(obstacleBox)) {
      endGame();
    }
  }

  state.speed = Math.min(0.36, state.speed + delta * 0.005);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (state.running) {
    state.score += Math.floor(delta * 60);
  }

  updatePlayer(delta);
  updateObstacles(delta);
  updateEnvironment(delta);
  updateHud();

  camera.position.set(playerGroup.position.x + 6, 5, 12);
  camera.lookAt(playerGroup.position.x + 4, 2, 0);

  renderer.render(scene, camera);
}

startButton.addEventListener("click", resetGame);
window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
  if (event.code === "ArrowDown" || event.code === "KeyS") {
    event.preventDefault();
    slide();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowDown" || event.code === "KeyS") {
    event.preventDefault();
    stopSlide();
  }
});

let touchStartY: number | null = null;
let touchStartX: number | null = null;

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    touchStartY = event.clientY;
    touchStartX = event.clientX;
    return;
  }
  jump();
});

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch" || touchStartY === null || touchStartX === null) {
    return;
  }
  const deltaY = event.clientY - touchStartY;
  const deltaX = event.clientX - touchStartX;
  const absY = Math.abs(deltaY);
  const absX = Math.abs(deltaX);

  if (Math.max(absY, absX) < 20) {
    jump();
  } else if (absY > absX && deltaY > 20) {
    slide();
    stopSlide();
  } else if (absY > absX && deltaY < -20) {
    jump();
  }

  touchStartY = null;
  touchStartX = null;
});

canvas.addEventListener("pointercancel", () => {
  touchStartY = null;
  touchStartX = null;
  stopSlide();
});

loadPlayer();
loadEnemyAssets();
loadEnvironmentAssets();
resize();
updateHud();
setOverlayVisible(true);
animate();
