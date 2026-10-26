export type SpotKind = "entrance" | "junction" | "cave" | "alcove" | "summit";

export type Spot = {
  id: string;
  kind: SpotKind;
  chapter: number;
  x: number;
  y: number;
  z: number;
  radius: number;
};

export type Corridor = {
  id: string;
  from: string;
  to: string;
  width: number;
  need: number;
  code?: boolean;
  role: "forward" | "false" | "exit";
  chapter: number;
};

const spots: Spot[] = [];
const corridors: Corridor[] = [];

spots.push({ id: "entrance", kind: "entrance", chapter: 0, x: 0, y: 0, z: -20, radius: 5.1 });

const deltas = [2.15, -1.05, 1.85, 1.25, -0.75, 2.35, -1.15, 1.55, 1.05, -0.85, 1.9, 1.35, 2.45].map(
  (d) => d * 0.8,
);
let y = 1.55;
const pitch = 26;

for (let c = 1; c <= 13; c++) {
  y += deltas[c - 1];
  const side = c % 2 === 0 ? 1 : -1;
  const z = (c - 1) * pitch;
  const junction = { x: side * 1.4, y, z };
  const cave = { x: side * 12.2, y: y + (c % 2 === 0 ? -1.25 : 1.35), z: z + 14.5 };
  const alcove = { x: -side * 10.6, y: y - 1.05, z: z + 3.2 };
  spots.push({ id: `j-${c}`, kind: "junction", chapter: c, ...junction, radius: 4.15 });
  spots.push({ id: `cave-${c}`, kind: "cave", chapter: c, ...cave, radius: 3.65 });
  spots.push({ id: `false-${c}`, kind: "alcove", chapter: c, ...alcove, radius: 3.15 });

  corridors.push({
    id: `to-j-${c}`,
    from: c === 1 ? "entrance" : `cave-${c - 1}`,
    to: `j-${c}`,
    width: 3.45,
    need: c - 1,
    role: "forward",
    chapter: c,
  });
  corridors.push({
    id: `to-cave-${c}`,
    from: `j-${c}`,
    to: `cave-${c}`,
    width: 3.3,
    need: c - 1,
    code: c === 5,
    role: "forward",
    chapter: c,
  });
  corridors.push({
    id: `to-false-${c}`,
    from: `j-${c}`,
    to: `false-${c}`,
    width: 3.1,
    need: c - 1,
    role: "false",
    chapter: c,
  });
}

const lastCave = spots.find((s) => s.id === "cave-13")!;
spots.push({
  id: "summit",
  kind: "summit",
  chapter: 14,
  x: 0,
  y: lastCave.y + 2.3,
  z: lastCave.z + 18,
  radius: 5.3,
});
corridors.push({
  id: "to-summit",
  from: "cave-13",
  to: "summit",
  width: 3.6,
  need: 13,
  role: "exit",
  chapter: 14,
});

const byId = new Map(spots.map((s) => [s.id, s]));

export function spotById(id: string) {
  const spot = byId.get(id);
  if (!spot) throw new Error("No existe el lugar " + id);
  return spot;
}

export function allSpots() {
  return spots;
}

export function allCorridors() {
  return corridors;
}

export function isOpen(c: Corridor, progress: number, codeOk: boolean) {
  if (progress < c.need) return false;
  if (c.code && !codeOk) return false;
  return true;
}

export function spawnIdFor(progress: number) {
  if (progress <= 0) return "entrance";
  if (progress >= 13) return "summit";
  return `j-${progress + 1}`;
}

export function faceYaw(fromId: string) {
  const a = spotById(fromId);
  let b = { x: 0, z: a.z + 8 };
  if (fromId === "entrance") b = spotById("j-1");
  else if (fromId.startsWith("j-")) b = spotById(`cave-${fromId.slice(2)}`);
  else if (fromId === "cave-13") b = spotById("summit");
  else if (fromId.startsWith("cave-")) b = spotById(`j-${Number(fromId.slice(5)) + 1}`);
  else if (fromId === "summit") b = { x: 0, z: a.z + 4 };
  return Math.atan2(-(b.x - a.x), -(b.z - a.z));
}

export function corridorSurfaceY(c: Corridor, x: number, z: number) {
  const a = spotById(c.from);
  const b = spotById(c.to);
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const ab2 = abx * abx + abz * abz;
  if (ab2 < 1e-4) return null;
  const t = ((x - a.x) * abx + (z - a.z) * abz) / ab2;
  if (t < -0.03 || t > 1.03) return null;
  const px = a.x + abx * t;
  const pz = a.z + abz * t;
  if (Math.hypot(x - px, z - pz) > c.width * 0.5) return null;
  const clamped = Math.min(1, Math.max(0, t));
  return a.y + (b.y - a.y) * clamped;
}

function spotOpen(spot: Spot, progress: number, codeOk: boolean) {
  if (spot.id === "entrance") return true;
  return corridors.some((c) => (c.from === spot.id || c.to === spot.id) && isOpen(c, progress, codeOk));
}

export function groundY(x: number, z: number, progress: number, codeOk: boolean, refY: number) {
  let best: number | null = null;
  let bestDy = 1.9;
  const consider = (height: number | null) => {
    if (height === null) return;
    const dy = Math.abs(height - refY);
    if (dy <= bestDy) {
      bestDy = dy;
      best = height;
    }
  };
  for (const spot of spots) {
    if (!spotOpen(spot, progress, codeOk)) continue;
    if (Math.hypot(x - spot.x, z - spot.z) <= spot.radius) consider(spot.y);
  }
  for (const corridor of corridors) {
    if (!isOpen(corridor, progress, codeOk)) continue;
    consider(corridorSurfaceY(corridor, x, z));
  }
  return best;
}

function distPointSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abx = bx - ax;
  const abz = bz - az;
  const ab2 = abx * abx + abz * abz;
  if (ab2 < 1e-6) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * abx + (pz - az) * abz) / ab2;
  t = Math.min(1, Math.max(0, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

export function debugLayout() {
  const warnings: string[] = [];
  for (const c of corridors) {
    const a = spotById(c.from);
    const b = spotById(c.to);
    const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const run = Math.hypot(b.x - a.x, b.z - a.z);
    const slope = run < 0.01 ? 99 : Math.abs(b.y - a.y) / run;
    if (len < 8 || len > 32) warnings.push(`${c.id} largo ${len.toFixed(1)}`);
    if (slope > 0.4) warnings.push(`${c.id} pendiente ${slope.toFixed(2)}`);
    for (const s of spots) {
      if (s.id === c.from || s.id === c.to) continue;
      const d = distPointSeg(s.x, s.z, a.x, a.z, b.x, b.z);
      if (d < s.radius + 0.4 && Math.abs(s.y - (a.y + b.y) / 2) < 2.2) {
        warnings.push(`${c.id} roza ${s.id} (${d.toFixed(1)})`);
      }
    }
  }
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const a = spots[i];
      const b = spots[j];
      const gap = Math.hypot(a.x - b.x, a.z - b.z) - a.radius - b.radius;
      if (gap < 0.6 && Math.abs(a.y - b.y) < 2) warnings.push(`solape ${a.id} ${b.id} ${gap.toFixed(1)}`);
    }
  }
  const top = Math.max(...spots.map((s) => s.y));
  const far = Math.max(...spots.map((s) => s.z));
  warnings.push(`info y=${top.toFixed(1)} z=${far.toFixed(1)}`);
  return warnings;
}
