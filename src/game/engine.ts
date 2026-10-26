import * as THREE from "three";
import coverUrl from "./cover.jpg";
import { chapter, type Gender, type Nearby } from "./content";
import {
  allCorridors,
  allSpots,
  faceYaw,
  groundY,
  isOpen,
  spotById,
  type Corridor,
  type Spot,
} from "./world";

export type Sim = {
  playing: boolean;
  locked: boolean;
  ix: number;
  iy: number;
  progress: number;
  codeOk: boolean;
  gender: Gender;
  name: string;
  spawnId: string;
};

type Hooks = {
  getSim: () => Sim;
  onNearby: (n: Nearby | null) => void;
  onInteract: (n: Nearby) => void;
  onFail: (message: string) => void;
};

type Marker = {
  near: Nearby;
  x: number;
  y: number;
  z: number;
  r: number;
  shut?: (sim: Sim) => boolean;
};

export function createGame(canvas: HTMLCanvasElement, hooks: Hooks) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch {
    hooks.onFail("Este navegador no pudo abrir la montaña en 3D.");
    return { destroy() {}, autopilotTo() {}, placeAt() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#6a8198");
  scene.fog = new THREE.Fog("#6a8198", 38, 128);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 240);

  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];
  const trackG = (g: THREE.BufferGeometry) => {
    geos.push(g);
    return g;
  };
  const trackM = <T extends THREE.Material>(m: T) => {
    mats.push(m);
    return m;
  };

  const stone = trackM(new THREE.MeshStandardMaterial({ color: "#4c5d72", roughness: 0.94 }));
  const pathMat = trackM(new THREE.MeshStandardMaterial({ color: "#e0b98a", roughness: 0.74 }));
  const rockMat = trackM(
    new THREE.MeshStandardMaterial({ color: "#9aafc2", roughness: 0.92, flatShading: true }),
  );
  const crystalMat = trackM(
    new THREE.MeshStandardMaterial({
      color: "#9fd4ea",
      emissive: "#1f4e79",
      emissiveIntensity: 0.75,
      roughness: 0.28,
      flatShading: true,
    }),
  );
  const lockMat = trackM(
    new THREE.MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.45, metalness: 0.25 }),
  );
  const codeMat = trackM(
    new THREE.MeshStandardMaterial({
      color: "#7c2d3a",
      emissive: "#7c2d3a",
      emissiveIntensity: 0.55,
      roughness: 0.4,
    }),
  );
  const poleMat = trackM(new THREE.MeshStandardMaterial({ color: "#3e4c5e", roughness: 0.8 }));

  scene.add(new THREE.HemisphereLight("#f7fbff", "#c4b09a", 1.55));
  const sun = new THREE.DirectionalLight("#fff8ef", 2.05);
  sun.position.set(-18, 36, -10);
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#d5e6f6", 0.85);
  fill.position.set(12, 8, 20);
  scene.add(fill);
  const coreLight = new THREE.PointLight("#d7eefe", 10, 42, 2);
  scene.add(coreLight);
  const dayLight = new THREE.PointLight("#fff6e8", 12, 48, 2);
  dayLight.position.set(0, 6.5, -24);
  scene.add(dayLight);

  const layoutSpots = allSpots();
  const farZ = Math.max(...layoutSpots.map((s) => s.z));
  const nearZ = Math.min(...layoutSpots.map((s) => s.z));
  const shellLen = farZ - nearZ + 64;
  const shellZ = (farZ + nearZ) / 2;
  const shell = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(58, 38, shellLen)),
    trackM(new THREE.MeshStandardMaterial({ color: "#627892", roughness: 0.9, side: THREE.BackSide })),
  );
  shell.position.set(0, 12, shellZ);
  scene.add(shell);

  const basin = new THREE.Mesh(
    trackG(new THREE.CircleGeometry(32, 10)),
    trackM(new THREE.MeshStandardMaterial({ color: "#3a4e62", roughness: 1 })),
  );
  basin.rotation.x = -Math.PI / 2;
  basin.position.set(0, -2.2, shellZ);
  basin.scale.set(1.15, shellLen / 56, 1);
  scene.add(basin);

  const daylight = new THREE.Mesh(
    trackG(new THREE.CircleGeometry(7.5, 28)),
    trackM(new THREE.MeshBasicMaterial({ color: "#f7f1e6" })),
  );
  daylight.position.set(0, 4.2, -23);
  scene.add(daylight);

  const discGeo = trackG(new THREE.CylinderGeometry(1, 1.06, 0.32, 6));
  const discs = new THREE.InstancedMesh(discGeo, stone, allSpots().length);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  allSpots().forEach((s, i) => {
    dummy.position.set(s.x, s.y - 0.16, s.z);
    dummy.rotation.set(0, s.chapter * 0.35, 0);
    dummy.scale.set(s.radius, 1, s.radius);
    dummy.updateMatrix();
    discs.setMatrixAt(i, dummy.matrix);
    tint.set(s.kind === "cave" ? "#7ea4c4" : s.kind === "alcove" ? "#7a6e72" : s.kind === "summit" ? "#8eb4d0" : "#97b0c6");
    discs.setColorAt(i, tint);
  });
  if (discs.instanceColor) discs.instanceColor.needsUpdate = true;
  scene.add(discs);

  const gates: { id: string; bars: THREE.Group }[] = [];
  const markers: Marker[] = [];
  const crystals: THREE.Object3D[] = [];

  const paint = (title: string, kicker: string) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    const g = c.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#f4efe4";
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = "#1f4e79";
    g.fillRect(0, 0, 512, 12);
    g.font = "700 26px Georgia";
    g.fillStyle = "#7c2d3a";
    g.fillText(kicker, 28, 58);
    g.font = "600 38px Georgia";
    g.fillStyle = "#1c2430";
    const words = title.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > 450 && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((ln, i) => g.fillText(ln, 28, 118 + i * 48));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    texs.push(tex);
    return tex;
  };

  const addSign = (c: Corridor, text: string, kicker: string) => {
    const tex = paint(text, kicker);
    if (!tex) return;
    const a = spotById(c.from);
    const b = spotById(c.to);
    const t = 0.34;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;
    const sign = new THREE.Mesh(
      trackG(new THREE.PlaneGeometry(1.85, 1.05)),
      trackM(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide })),
    );
    sign.position.set(x, y + 1.35, z);
    sign.rotation.y = Math.atan2(a.x - x, a.z - z);
    const pole = new THREE.Mesh(trackG(new THREE.CylinderGeometry(0.045, 0.045, 1.2, 5)), poleMat);
    pole.position.y = -0.95;
    sign.add(pole);
    scene.add(sign);
  };

  const railMat = trackM(
    new THREE.MeshStandardMaterial({ color: "#f0d7b0", roughness: 0.45, metalness: 0.42 }),
  );
  const postMat = trackM(
    new THREE.MeshStandardMaterial({ color: "#4d5c6e", roughness: 0.62, metalness: 0.48 }),
  );
  const lampMat = trackM(
    new THREE.MeshStandardMaterial({
      color: "#ffe1b0",
      emissive: "#ffb15a",
      emissiveIntensity: 1.35,
      roughness: 0.32,
    }),
  );
  const postGeo = trackG(new THREE.CylinderGeometry(0.048, 0.06, 1.02, 6));
  const lampGeo = trackG(new THREE.SphereGeometry(0.075, 8, 6));

  const addRailings = (mesh: THREE.Mesh, width: number, len: number, insetA: number, insetB: number) => {
    const zStart = len / 2 - insetA;
    const zEnd = -len / 2 + insetB;
    const span = zStart - zEnd;
    if (span < 1.4) return;
    const half = width / 2 + 0.08;
    const midZ = (zStart + zEnd) / 2;
    for (const side of [-1, 1]) {
      const top = new THREE.Mesh(trackG(new THREE.BoxGeometry(0.07, 0.06, span)), railMat);
      top.position.set(side * half, 1.08, midZ);
      mesh.add(top);
      const mid = new THREE.Mesh(trackG(new THREE.BoxGeometry(0.045, 0.04, span)), railMat);
      mid.position.set(side * half, 0.62, midZ);
      mesh.add(mid);
      const count = Math.max(2, Math.round(span / 2.35) + 1);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(side * half, 0.64, zStart + (zEnd - zStart) * t);
        if (i % 2 === 0) {
          const glow = new THREE.Mesh(lampGeo, lampMat);
          glow.position.set(0, 0.56, 0);
          post.add(glow);
        }
        mesh.add(post);
      }
    }
  };

  for (const c of allCorridors()) {
    const a = spotById(c.from);
    const b = spotById(c.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const mesh = new THREE.Mesh(trackG(new THREE.BoxGeometry(c.width, 0.26, Math.max(0.2, len))), pathMat);
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 - 0.12, (a.z + b.z) / 2);
    mesh.lookAt(b.x, b.y - 0.12, b.z);
    scene.add(mesh);
    addRailings(mesh, c.width, len, Math.min(a.radius * 0.78, len * 0.32), Math.min(b.radius * 0.78, len * 0.32));

    if (c.role === "forward" || c.role === "exit") {
      const bars = new THREE.Group();
      const mat = c.code ? codeMat : lockMat;
      for (let i = 0; i < 4; i++) {
        const bar = new THREE.Mesh(trackG(new THREE.BoxGeometry(0.1, 2.05, 0.1)), mat);
        bar.position.set(-0.85 + i * 0.56, 1.05, 0);
        bars.add(bar);
      }
      const lintel = new THREE.Mesh(trackG(new THREE.BoxGeometry(2.15, 0.14, 0.14)), mat);
      lintel.position.y = 2.12;
      bars.add(lintel);
      bars.position.set(0, 0.15, -len / 2 + Math.min(a.radius - 0.25, len * 0.42));
      mesh.add(bars);
      gates.push({ id: c.id, bars });
    }

    if (c.role === "false") addSign(c, chapter(c.chapter).falseSign, "UN SENDERO");
    if (c.id.startsWith("to-cave-")) addSign(c, chapter(c.chapter).clue, "UN SENDERO");
  }

  const coverTex = new THREE.TextureLoader().load(coverUrl);
  coverTex.colorSpace = THREE.SRGBColorSpace;
  coverTex.anisotropy = 4;
  texs.push(coverTex);
  const coverMat = trackM(
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.58, metalness: 0.05 }),
  );
  const frameMat = trackM(new THREE.MeshStandardMaterial({ color: "#1b2430", roughness: 0.72 }));
  const coverGeo = trackG(new THREE.PlaneGeometry(1.5, 2.14));
  const frameGeo = trackG(new THREE.PlaneGeometry(1.74, 2.4));
  const floorGeo = trackG(new THREE.PlaneGeometry(1.7, 2.42));

  const hangCover = (x: number, y: number, z: number, faceX: number, faceZ: number) => {
    const board = new THREE.Group();
    const sheet = new THREE.Mesh(coverGeo, coverMat);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.04;
    board.add(frame, sheet);
    board.position.set(x, y, z);
    board.lookAt(x + faceX, y, z + faceZ);
    scene.add(board);
  };

  for (const c of allCorridors()) {
    if (!c.id.startsWith("to-cave-")) continue;
    const a = spotById(c.from);
    const b = spotById(c.to);
    const tile = new THREE.Mesh(floorGeo, coverMat);
    tile.rotation.x = -Math.PI / 2;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const inset = Math.min(a.radius, len * 0.35);
    const t = inset / Math.max(len, 0.01);
    tile.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + 0.04, a.z + (b.z - a.z) * t);
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    tile.rotation.z = -yaw;
    scene.add(tile);
  }

  const label = (text: string) => {
    const c = document.createElement("canvas");
    c.width = 384;
    c.height = 128;
    const g = c.getContext("2d");
    if (!g) return null;
    g.clearRect(0, 0, 384, 128);
    g.fillStyle = "rgba(246,240,230,0.94)";
    g.beginPath();
    g.roundRect(8, 12, 368, 104, 18);
    g.fill();
    g.fillStyle = "#7c2d3a";
    g.font = "700 28px Georgia";
    g.textAlign = "center";
    g.fillText("Cueva del libro", 192, 48);
    g.fillStyle = "#1f4e79";
    g.font = "700 36px Georgia";
    g.fillText(text, 192, 96);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    texs.push(tex);
    return tex;
  };

  for (const s of allSpots()) {
    if (s.kind === "cave") {
      const gem = new THREE.Mesh(trackG(new THREE.CylinderGeometry(0.22, 0.34, 1.35, 6)), crystalMat);
      const dir = new THREE.Vector3(s.x - spotById(`j-${s.chapter}`).x, 0, s.z - spotById(`j-${s.chapter}`).z).normalize();
      gem.position.set(s.x + dir.x * 1.35, s.y + 0.85, s.z + dir.z * 1.35);
      gem.userData.baseY = gem.position.y;
      scene.add(gem);
      crystals.push(gem);
      const tex = label(`Capítulo ${s.chapter}`);
      if (tex) {
        const sprite = new THREE.Sprite(trackM(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })));
        sprite.position.set(s.x, s.y + 2.7, s.z);
        sprite.scale.set(2.8, 0.94, 1);
        scene.add(sprite);
      }
      markers.push({ near: { kind: "cave", n: s.chapter }, x: s.x, y: s.y, z: s.z, r: 2.7 });
      const j = spotById(`j-${s.chapter}`);
      const wx = s.x - j.x;
      const wz = s.z - j.z;
      const wlen = Math.hypot(wx, wz) || 1;
      const ux = wx / wlen;
      const uz = wz / wlen;
      const floor = new THREE.Mesh(floorGeo, coverMat);
      floor.rotation.x = -Math.PI / 2;
      floor.rotation.z = -Math.atan2(ux, uz);
      floor.position.set(s.x - ux * 0.35, s.y + 0.05, s.z - uz * 0.35);
      scene.add(floor);
      hangCover(s.x + ux * 2.15, s.y + 1.85, s.z + uz * 2.15, ux, uz);
    }
    if (s.kind === "alcove") {
      markers.push({ near: { kind: "false", n: s.chapter }, x: s.x, y: s.y, z: s.z, r: 2.45 });
    }
    if (s.kind === "summit") {
      markers.push({ near: { kind: "summit" }, x: s.x, y: s.y, z: s.z, r: 3.2 });
    }
  }

  type Walker = {
    group: THREE.Group;
    legs: THREE.Object3D[];
    arms: THREE.Object3D[];
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    span: number;
    t: number;
    dir: number;
    speed: number;
    phase: number;
  };
  const walkers: Walker[] = [];
  const coatMats = ["#1f4e79", "#2f6b4f", "#7c2d3a", "#8a5a32", "#3a4e86", "#5c3d6e"].map((color) =>
    trackM(new THREE.MeshStandardMaterial({ color, roughness: 0.55 })),
  );
  const npcSkin = trackM(new THREE.MeshStandardMaterial({ color: "#e2b08f", roughness: 0.62 }));
  const npcInk = trackM(new THREE.MeshStandardMaterial({ color: "#243246", roughness: 0.7 }));
  const npcHair = trackM(new THREE.MeshStandardMaterial({ color: "#2a1c14", roughness: 0.55 }));
  const bodyGeo = trackG(new THREE.CapsuleGeometry(0.16, 0.34, 3, 6));
  const headGeo = trackG(new THREE.SphereGeometry(0.14, 10, 8));
  const limbGeo = trackG(new THREE.CapsuleGeometry(0.048, 0.2, 2, 5));

  const makeWalker = (coat: THREE.Material, run: boolean) => {
    const group = new THREE.Group();
    const torso = new THREE.Mesh(bodyGeo, coat);
    torso.position.y = 0.92;
    group.add(torso);
    const head = new THREE.Mesh(headGeo, npcSkin);
    head.position.y = 1.38;
    group.add(head);
    const hair = new THREE.Mesh(headGeo, npcHair);
    hair.scale.set(1.05, 0.55, 1.05);
    hair.position.y = 1.48;
    group.add(hair);
    const legs: THREE.Object3D[] = [];
    const arms: THREE.Object3D[] = [];
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.09, 0.62, 0);
      const leg = new THREE.Mesh(limbGeo, npcInk);
      leg.position.y = -0.18;
      hip.add(leg);
      group.add(hip);
      legs.push(hip);
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.2, 1.12, 0);
      const arm = new THREE.Mesh(limbGeo, coat);
      arm.position.y = -0.16;
      pivot.add(arm);
      group.add(pivot);
      arms.push(pivot);
    }
    group.scale.setScalar(run ? 0.96 : 0.9);
    scene.add(group);
    return { group, legs, arms };
  };

  let walkerN = 0;
  for (const c of allCorridors()) {
    if (c.role !== "forward") continue;
    const onBridge = c.id.startsWith("to-j-");
    const onCave = c.id.startsWith("to-cave-") && c.chapter % 2 === 0;
    if (!onBridge && !onCave) continue;
    const a = spotById(c.from);
    const b = spotById(c.to);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const flat = Math.hypot(dx, dz) || 1;
    const side = walkerN % 2 === 0 ? 0.78 : -0.78;
    const px = (-dz / flat) * side;
    const pz = (dx / flat) * side;
    const t0 = 0.2;
    const t1 = 0.8;
    const run = onCave || c.chapter % 3 === 0;
    const body = makeWalker(coatMats[walkerN % coatMats.length], run);
    const ax = a.x + dx * t0 + px;
    const az = a.z + dz * t0 + pz;
    const bx = a.x + dx * t1 + px;
    const bz = a.z + dz * t1 + pz;
    walkers.push({
      ...body,
      ax,
      ay: a.y + (b.y - a.y) * t0,
      az,
      bx,
      by: a.y + (b.y - a.y) * t1,
      bz,
      span: Math.hypot(bx - ax, bz - az) || 1,
      t: (walkerN * 0.17) % 1,
      dir: walkerN % 2 === 0 ? 1 : -1,
      speed: run ? 2.45 : 1.15,
      phase: walkerN,
    });
    walkerN += 1;
  }

  const rockGeo = trackG(new THREE.DodecahedronGeometry(0.8, 0));
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 60);
  let ri = 0;
  const putRock = (x: number, y: number, z: number, s: number, rot: number) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rot, rot * 0.6, 0.2);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    rocks.setMatrixAt(ri, dummy.matrix);
    ri += 1;
  };
  for (let c = 1; c <= 13; c++) {
    const j = spotById(`j-${c}`);
    const a = spotById(`false-${c}`);
    const dx = a.x - j.x;
    const dz = a.z - j.z;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    for (let k = 0; k < 3; k++) {
      const spread = (k - 1) * 1.25;
      putRock(
        a.x + ux * (a.radius + 0.15) - uz * spread,
        a.y + 0.65,
        a.z + uz * (a.radius + 0.15) + ux * spread,
        0.75 + (k % 2) * 0.3,
        k + c,
      );
    }
  }
  rocks.count = ri;
  scene.add(rocks);

  const pillarGeo = trackG(new THREE.CylinderGeometry(0.5, 0.62, 1, 6));
  const pillars = new THREE.InstancedMesh(
    pillarGeo,
    trackM(new THREE.MeshStandardMaterial({ color: "#3d5168", roughness: 0.95, flatShading: true })),
    26,
  );
  allSpots()
    .filter((s) => s.kind === "junction")
    .forEach((s, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      dummy.position.set(side * 16.2, s.y + 2.2, s.z);
      dummy.rotation.set(0, i, 0);
      dummy.scale.set(1.3, 5.2, 1.3);
      dummy.updateMatrix();
      pillars.setMatrixAt(i, dummy.matrix);
    });
  scene.add(pillars);

  const summit = spotById("summit");
  const nucleus = new THREE.Group();
  nucleus.position.set(summit.x, summit.y + 2.15, summit.z + 1.6);
  const ico = new THREE.Mesh(trackG(new THREE.IcosahedronGeometry(1.15, 1)), crystalMat);
  nucleus.add(ico);
  const heart = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(0.28, 16, 12)),
    trackM(new THREE.MeshStandardMaterial({ color: "#f7f1e6", emissive: "#f0ddb8", emissiveIntensity: 0.9 })),
  );
  nucleus.add(heart);
  const arms: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    const rod = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 5)),
      trackM(new THREE.MeshStandardMaterial({ color: "#d5e6f2" })),
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.x = 1.15;
    arm.add(rod);
    const moon = new THREE.Mesh(trackG(new THREE.IcosahedronGeometry(0.22, 0)), crystalMat);
    moon.position.x = 2.05;
    arm.add(moon);
    arm.rotation.y = (i / 4) * Math.PI * 2;
    arm.rotation.z = (i - 1.5) * 0.42;
    nucleus.add(arm);
    arms.push(arm);
  }
  scene.add(nucleus);
  coreLight.position.copy(nucleus.position);

  scene.updateMatrixWorld(true);
  const tmp = new THREE.Vector3();
  for (const gate of gates) {
    const corr = allCorridors().find((c) => c.id === gate.id);
    if (!corr) continue;
    gate.bars.getWorldPosition(tmp);
    if (corr.code) {
      markers.push({
        near: { kind: "code" },
        x: tmp.x,
        y: tmp.y,
        z: tmp.z,
        r: 4.8,
        shut: (sim) => sim.codeOk,
      });
    } else {
      const n = corr.chapter >= 1 && corr.chapter <= 13 ? corr.chapter : 13;
      markers.push({
        near: { kind: "locked", n },
        x: tmp.x,
        y: tmp.y,
        z: tmp.z,
        r: 2.15,
        shut: (sim) => isOpen(corr, sim.progress, sim.codeOk),
      });
    }
  }

  const pos = new THREE.Vector3(0, 0, -12);
  let yaw = 0;
  let spawned = false;
  let snap = false;
  let phase = 0;
  let actualSpeed = 0;
  let pilot: { x: number; z: number } | null = null;
  let tour = 0;
  let nearNow: Nearby | null = null;
  let nearKey = "";
  let prevE = false;
  const keys = new Set<string>();
  let override: Set<string> | null = null;
  const camDesired = new THREE.Vector3();
  const avatar = new THREE.Group();
  let nameSprite: THREE.Sprite | null = null;
  const lamp = new THREE.PointLight("#ffe7c8", 2.4, 18, 1.7);
  lamp.position.set(0, 1.5, 0.2);

  const skin = trackM(new THREE.MeshStandardMaterial({ color: "#e2b08f", roughness: 0.62 }));
  const coat = trackM(new THREE.MeshStandardMaterial({ color: "#7c2d3a", roughness: 0.55 }));
  const ink = trackM(new THREE.MeshStandardMaterial({ color: "#243246", roughness: 0.7 }));
  const cloth = trackM(new THREE.MeshStandardMaterial({ color: "#f3ecdf", roughness: 0.6 }));

  const legs: THREE.Object3D[] = [];
  const armPivots: THREE.Object3D[] = [];

  function nameTexture(name: string) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const g = c.getContext("2d");
    if (!g) return null;
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = "rgba(246,240,230,0.94)";
    g.beginPath();
    g.roundRect(16, 18, 480, 92, 28);
    g.fill();
    g.fillStyle = "#7c2d3a";
    g.font = "700 48px Georgia";
    g.textAlign = "center";
    g.fillText(name.slice(0, 22), 256, 78);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    texs.push(tex);
    return tex;
  }

  function buildAvatar(gender: Gender, name: string) {
    while (avatar.children.length) avatar.remove(avatar.children[0]);
    legs.length = 0;
    armPivots.length = 0;
    const shoulder = gender === "mujer" ? 0.2 : 0.25;
    const torso = new THREE.Mesh(trackG(new THREE.CapsuleGeometry(shoulder, 0.48, 4, 8)), coat);
    torso.position.y = 1.12;
    avatar.add(torso);
    const collar = new THREE.Mesh(trackG(new THREE.TorusGeometry(0.16, 0.045, 6, 12)), cloth);
    collar.position.y = 1.42;
    collar.rotation.x = Math.PI / 2;
    avatar.add(collar);
    const head = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.2, 16, 12)), skin);
    head.position.y = 1.68;
    avatar.add(head);
    const hairMat = trackM(
      new THREE.MeshStandardMaterial({ color: gender === "mujer" ? "#3a2418" : "#241c16", roughness: 0.5 }),
    );
    if (gender === "mujer") {
      const hair = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.22, 16, 12)), hairMat);
      hair.scale.set(1, 1.12, 1.12);
      hair.position.set(0, 1.74, -0.02);
      avatar.add(hair);
      const tail = new THREE.Mesh(trackG(new THREE.CapsuleGeometry(0.07, 0.28, 3, 6)), hairMat);
      tail.position.set(0, 1.42, -0.16);
      avatar.add(tail);
    } else {
      const hair = new THREE.Mesh(trackG(new THREE.SphereGeometry(0.21, 16, 12)), hairMat);
      hair.scale.set(1.05, 0.62, 1.05);
      hair.position.y = 1.82;
      avatar.add(hair);
    }
    const cape = new THREE.Mesh(trackG(new THREE.BoxGeometry(0.42, 0.46, 0.06)), coat);
    cape.position.set(0, 1.12, -0.22);
    avatar.add(cape);
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.12, 0.78, 0);
      const leg = new THREE.Mesh(trackG(new THREE.CapsuleGeometry(0.075, 0.28, 3, 6)), ink);
      leg.position.y = -0.26;
      hip.add(leg);
      avatar.add(hip);
      legs.push(hip);
      const pivot = new THREE.Group();
      pivot.position.set(side * (shoulder + 0.02), 1.38, 0);
      const arm = new THREE.Mesh(trackG(new THREE.CapsuleGeometry(0.055, 0.28, 3, 6)), coat);
      arm.position.y = -0.22;
      pivot.add(arm);
      avatar.add(pivot);
      armPivots.push(pivot);
    }
    avatar.add(lamp);
    const tex = nameTexture(name || "Explorador");
    if (tex) {
      nameSprite = new THREE.Sprite(
        trackM(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })),
      );
      nameSprite.scale.set(1.7, 0.42, 1);
      scene.add(nameSprite);
    }
    if (!avatar.parent) scene.add(avatar);
  }

  function removeAvatar() {
    scene.remove(avatar);
    if (nameSprite) scene.remove(nameSprite);
    nameSprite = null;
  }

  const blob = new THREE.Mesh(
    trackG(new THREE.CircleGeometry(0.42, 12)),
    trackM(new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28, depthWrite: false })),
  );
  blob.rotation.x = -Math.PI / 2;
  scene.add(blob);

  function wrap(a: number) {
    let x = a;
    while (x > Math.PI) x -= Math.PI * 2;
    while (x < -Math.PI) x += Math.PI * 2;
    return x;
  }

  function tryMove(nx: number, nz: number, sim: Sim) {
    const y = groundY(nx, nz, sim.progress, sim.codeOk, pos.y);
    if (y === null) return false;
    pos.x = nx;
    pos.z = nz;
    pos.y = y;
    return true;
  }

  function held() {
    return override ?? keys;
  }

  function findNear(sim: Sim): Nearby | null {
    let best: Marker | null = null;
    let bestD = 1e9;
    for (const m of markers) {
      if (m.shut?.(sim)) continue;
      if (Math.abs(pos.y - m.y) > 4) continue;
      const d = Math.hypot(pos.x - m.x, pos.z - m.z);
      if (d < m.r && d < bestD) {
        best = m;
        bestD = d;
      }
    }
    return best ? best.near : null;
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  let raf = 0;
  let last = performance.now();

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sim = hooks.getSim();

    for (const gate of gates) {
      const corr = allCorridors().find((c) => c.id === gate.id);
      if (!corr) continue;
      gate.bars.visible = !isOpen(corr, sim.progress, sim.codeOk);
    }
    codeMat.emissiveIntensity = 0.35 + Math.sin(now * 0.004) * 0.25;

    if (sim.playing && !spawned) {
      buildAvatar(sim.gender, sim.name);
      const spot = spotById(sim.spawnId || "entrance");
      pos.set(spot.x, spot.y, spot.z);
      yaw = faceYaw(sim.spawnId || "entrance");
      spawned = true;
      snap = true;
      pilot = null;
    }
    if (!sim.playing && spawned) {
      removeAvatar();
      spawned = false;
      pilot = null;
    }

    const beforeX = pos.x;
    const beforeZ = pos.z;
    const ks = held();
    let ix = sim.ix;
    let iy = sim.iy;
    if (Math.abs(ix) < 0.12) ix = 0;
    if (Math.abs(iy) < 0.12) iy = 0;
    if (ks.has("KeyA") || ks.has("ArrowLeft")) ix -= 1;
    if (ks.has("KeyD") || ks.has("ArrowRight")) ix += 1;
    if (ks.has("KeyW") || ks.has("ArrowUp")) iy += 1;
    if (ks.has("KeyS") || ks.has("ArrowDown")) iy -= 1;
    ix = Math.max(-1, Math.min(1, ix));
    iy = Math.max(-1, Math.min(1, iy));

    if (pilot && (Math.abs(ix) > 0.2 || Math.abs(iy) > 0.2)) pilot = null;

    if (spawned && !sim.locked) {
      if (pilot) {
        const dx = pilot.x - pos.x;
        const dz = pilot.z - pos.z;
        const mag = Math.hypot(dx, dz);
        if (mag < 0.45) pilot = null;
        else {
          yaw = Math.atan2(-dx, -dz);
          const step = Math.min(mag, 6.2 * dt);
          tryMove(pos.x + (dx / mag) * step, pos.z + (dz / mag) * step, sim);
        }
      } else {
        // Character-relative wish. Chase cam sits behind, so A (ix < 0) yaws left on screen.
        const fx = -Math.sin(yaw);
        const fz = -Math.cos(yaw);
        const rx = Math.cos(yaw);
        const rz = -Math.sin(yaw);
        let wx = fx * iy + rx * ix;
        let wz = fz * iy + rz * ix;
        let mag = Math.hypot(wx, wz);
        if (mag > 1) {
          wx /= mag;
          wz /= mag;
          mag = 1;
        }
        if (mag > 0.08) {
          const target = Math.atan2(-wx, -wz);
          const maxTurn = 4.2 * dt;
          const turn = Math.max(-maxTurn, Math.min(maxTurn, wrap(target - yaw)));
          yaw += turn;
          const step = 5.7 * mag * dt;
          const dirx = wx / mag;
          const dirz = wz / mag;
          if (!tryMove(pos.x + dirx * step, pos.z + dirz * step, sim)) {
            if (!tryMove(pos.x + dirx * step, pos.z, sim)) tryMove(pos.x, pos.z + dirz * step, sim);
          }
        }
      }
      const gy = groundY(pos.x, pos.z, sim.progress, sim.codeOk, pos.y);
      if (gy !== null) pos.y = gy;
    }

    actualSpeed = dt > 0 ? Math.hypot(pos.x - beforeX, pos.z - beforeZ) / dt : 0;
    const moving = actualSpeed > 0.2;
    if (moving) phase += actualSpeed * dt * 7.5;
    const swing = moving ? Math.sin(phase) * 0.62 : 0;
    legs.forEach((leg, i) => {
      leg.rotation.x = i === 0 ? swing : -swing;
    });
    armPivots.forEach((arm, i) => {
      arm.rotation.x = i === 0 ? -swing * 0.7 : swing * 0.7;
    });

    if (spawned) {
      avatar.position.set(pos.x, pos.y, pos.z);
      avatar.rotation.y = yaw + Math.PI;
      if (nameSprite) nameSprite.position.set(pos.x, pos.y + 2.22, pos.z);
      blob.position.set(pos.x, pos.y + 0.05, pos.z);
      blob.visible = true;
    } else blob.visible = false;

    nucleus.rotation.y += dt * 0.35;
    arms.forEach((arm, i) => {
      arm.rotation.y += dt * (0.25 + i * 0.04);
    });
    crystals.forEach((gem, i) => {
      gem.rotation.y += dt * 0.6;
      gem.position.y = Number(gem.userData.baseY) + Math.sin(now * 0.002 + i) * 0.08;
    });
    for (const w of walkers) {
      w.t += (w.dir * w.speed * dt) / w.span;
      if (w.t >= 1) {
        w.t = 1;
        w.dir = -1;
      } else if (w.t <= 0) {
        w.t = 0;
        w.dir = 1;
      }
      w.group.position.set(
        w.ax + (w.bx - w.ax) * w.t,
        w.ay + (w.by - w.ay) * w.t,
        w.az + (w.bz - w.az) * w.t,
      );
      const face = w.dir >= 0 ? 1 : -1;
      w.group.rotation.y = Math.atan2((w.bx - w.ax) * face, (w.bz - w.az) * face);
      w.phase += dt * (w.speed > 1.8 ? 12 : 7);
      const swing = Math.sin(w.phase) * (w.speed > 1.8 ? 0.9 : 0.52);
      w.legs.forEach((leg, i) => {
        leg.rotation.x = i === 0 ? swing : -swing;
      });
      w.arms.forEach((arm, i) => {
        arm.rotation.x = i === 0 ? -swing * 0.8 : swing * 0.8;
      });
    }

    if (!spawned) {
      tour += dt * 0.18;
      const e = spotById("entrance");
      camera.position.set(e.x + Math.sin(tour) * 2.4, e.y + 3.6, e.z - 1.2);
      camera.lookAt(e.x, e.y + 1.4, e.z + 16);
    } else {
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      camDesired.set(pos.x - fx * 6.3, pos.y + 3.05, pos.z - fz * 6.3);
      if (snap) {
        camera.position.copy(camDesired);
        snap = false;
      } else {
        const k = 1 - Math.exp(-5 * dt);
        camera.position.lerp(camDesired, k);
      }
      camera.lookAt(pos.x, pos.y + 1.35, pos.z);
    }

    const near = spawned ? findNear(sim) : null;
    const key = near ? (near.kind === "cave" || near.kind === "false" || near.kind === "locked" ? `${near.kind}-${near.n}` : near.kind) : "";
    if (key !== nearKey) {
      nearKey = key;
      nearNow = near;
      hooks.onNearby(near);
    }
    const eNow = ks.has("KeyE");
    if (eNow && !prevE && nearNow && !sim.locked) hooks.onInteract(nearNow);
    prevE = eNow;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  window.__controlsTest = {
    getYaw: () => yaw,
    getSpeed: () => actualSpeed,
    setKeys: (codes: string[]) => {
      override = new Set(codes);
    },
  };

  return {
    destroy() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      delete window.__controlsTest;
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      renderer.dispose();
    },
    autopilotTo(id: string) {
      const s = spotById(id);
      pilot = { x: s.x, z: s.z };
    },
    placeAt(id: string) {
      const s = spotById(id);
      pos.set(s.x, s.y, s.z);
      yaw = faceYaw(id);
      pilot = null;
      snap = true;
    },
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}
