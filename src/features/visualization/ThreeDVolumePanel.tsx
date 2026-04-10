"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = {
  name: string;
  volume: unknown[][][];
  prevVolume?: unknown[][][] | null;
  focusIndex?: number;
  bitmaskMode?: boolean;
  bitWidth?: number;
};

const cameraStateByName = new Map<string, {
  position: [number, number, number];
  target: [number, number, number];
}>();

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function createTextSprite(text: string, color = "#e6edf3") {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(8,12,20,0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(120,160,220,0.85)";
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  ctx.fillStyle = color;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.88, 0.34, 1);
  sprite.renderOrder = 999;
  sprite.frustumCulled = false;
  return sprite;
}

function createAxisSprite(text: string, color: string) {
  const sprite = createTextSprite(text, color);
  if (!sprite) return null;
  sprite.scale.set(1.15, 0.42, 1);
  sprite.renderOrder = 1000;
  return sprite;
}

function buildTickIndices(length: number, maxTicks = 12) {
  if (length <= 0) return [] as number[];
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const step = Math.max(1, Math.ceil((length - 1) / (maxTicks - 1)));
  const out: number[] = [];
  for (let i = 0; i < length; i += step) out.push(i);
  if (out[out.length - 1] !== length - 1) out.push(length - 1);
  return out;
}

function getLayerWindow(totalLayers: number, focusIndex: number, maxLayers = 24) {
  if (totalLayers <= maxLayers) return { start: 0, end: totalLayers - 1 };
  const half = Math.floor(maxLayers / 2);
  let start = Math.max(0, focusIndex - half);
  let end = Math.min(totalLayers - 1, start + maxLayers - 1);
  if (end - start + 1 < maxLayers) start = Math.max(0, end - maxLayers + 1);
  return { start, end };
}

function toBinary(value: number, bitmaskMode: boolean, bitWidth: number) {
  if (!(bitmaskMode && Number.isInteger(value) && value >= 0)) return String(value);
  return value.toString(2).padStart(Math.max(1, bitWidth), "0");
}

export function ThreeDVolumePanel({ name, volume, prevVolume, focusIndex = 0, bitmaskMode = false, bitWidth = 1 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const dims = useMemo(
    () => [volume.length, volume[0]?.length ?? 0, volume[0]?.[0]?.length ?? 0] as const,
    [volume],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1117");

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 2000);
    const saved = cameraStateByName.get(name);
    if (saved) {
      camera.position.set(saved.position[0], saved.position[1], saved.position[2]);
    } else {
      camera.position.set(0, 26, 42);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor("#0d1117", 1);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.95;
    controls.panSpeed = 0.7;

    scene.add(new THREE.AmbientLight("#9bbcff", 0.6));
    const keyLight = new THREE.DirectionalLight("#c9d1d9", 0.85);
    keyLight.position.set(16, 30, 18);
    scene.add(keyLight);

    const rows = dims[0];
    const cols = dims[1];
    const layers = dims[2];
    const clampedFocus = Math.max(0, Math.min(Math.trunc(focusIndex), Math.max(0, layers - 1)));
    const { start: layerStart, end: layerEnd } = getLayerWindow(layers, clampedFocus, 24);

    const cellSize = 1;
    const layerSpacing = 1.25;
    const xSpan = cols * cellSize;
    const ySpan = rows * cellSize;
    const layerCount = layerEnd - layerStart + 1;
    const zSpan = Math.max(1, layerCount * layerSpacing);
    const zOffsetBase = -((layerCount - 1) * layerSpacing) / 2;
    const center = new THREE.Vector3(0, 0, 0);
    const zMin = zOffsetBase;

    const gridLineMaterial = new THREE.LineBasicMaterial({ color: "#2f3b4f", transparent: true, opacity: 0.62 });
    const layerTint = new THREE.MeshBasicMaterial({
      color: "#111b2a",
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const changedMaterial = new THREE.MeshStandardMaterial({
      color: "#f2cc60",
      emissive: "#785700",
      emissiveIntensity: 0.45,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const valueMaterial = new THREE.MeshStandardMaterial({
      color: "#58a6ff",
      emissive: "#143661",
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.86,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const focusLayerMaterial = new THREE.LineBasicMaterial({ color: "#8ecbff", transparent: true, opacity: 0.92 });

    const textCandidates: Array<{
      r: number;
      c: number;
      k: number;
      changed: boolean;
      value: number;
      x: number;
      y: number;
      z: number;
    }> = [];

    for (let k = layerStart; k <= layerEnd; k += 1) {
      const local = k - layerStart;
      const z = zOffsetBase + local * layerSpacing;

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(xSpan, ySpan), layerTint);
      plane.position.set(0, 0, z);
      scene.add(plane);

      const points: number[] = [];
      for (let x = 0; x <= cols; x += 1) {
        const px = -xSpan / 2 + x * cellSize;
        points.push(px, -ySpan / 2, z, px, ySpan / 2, z);
      }
      for (let y = 0; y <= rows; y += 1) {
        const py = -ySpan / 2 + y * cellSize;
        points.push(-xSpan / 2, py, z, xSpan / 2, py, z);
      }
      const gridGeometry = new THREE.BufferGeometry();
      gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const gridLines = new THREE.LineSegments(gridGeometry, k === clampedFocus ? focusLayerMaterial : gridLineMaterial);
      scene.add(gridLines);

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const value = toNumber(volume[r]?.[c]?.[k]);
          const prev = toNumber(prevVolume?.[r]?.[c]?.[k]);
          const changed = !!prevVolume && value !== prev;
          if (value === 0 && !changed) continue;
          const h = Math.min(0.72, 0.18 + Math.min(Math.abs(value), 1_000_000) / 1_000_000);
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(cellSize * 0.78, cellSize * 0.78, h),
            changed ? changedMaterial : valueMaterial,
          );
          box.position.set(
            -xSpan / 2 + c * cellSize + cellSize / 2,
            -ySpan / 2 + r * cellSize + cellSize / 2,
            z + h / 2 + 0.02,
          );
          scene.add(box);
          textCandidates.push({
            r,
            c,
            k,
            changed,
            value,
            x: -xSpan / 2 + c * cellSize + cellSize / 2,
            y: -ySpan / 2 + r * cellSize + cellSize / 2,
            z: z + h + 0.18,
          });
        }
      }
    }

    // Axis guides and index labels in 3D space.
    const axisOrigin = new THREE.Vector3(-xSpan / 2 - 1.2, -ySpan / 2 - 1.2, zMin - 0.9);
    const xAxisLen = xSpan + 1.6;
    const yAxisLen = ySpan + 1.6;
    const zAxisLen = zSpan + 1.8;
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), axisOrigin, xAxisLen, 0x7dd3fc, 0.42, 0.2));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), axisOrigin, yAxisLen, 0x86efac, 0.42, 0.2));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), axisOrigin, zAxisLen, 0xfde68a, 0.42, 0.2));

    const axisXLabel = createAxisSprite("c (x)", "#7dd3fc");
    if (axisXLabel) {
      axisXLabel.position.set(axisOrigin.x + xAxisLen + 0.65, axisOrigin.y, axisOrigin.z);
      scene.add(axisXLabel);
    }
    const axisYLabel = createAxisSprite("r (y)", "#86efac");
    if (axisYLabel) {
      axisYLabel.position.set(axisOrigin.x, axisOrigin.y + yAxisLen + 0.65, axisOrigin.z);
      scene.add(axisYLabel);
    }
    const axisZLabel = createAxisSprite("k (z)", "#fde68a");
    if (axisZLabel) {
      axisZLabel.position.set(axisOrigin.x, axisOrigin.y, axisOrigin.z + zAxisLen + 0.65);
      scene.add(axisZLabel);
    }

    const xTicks = buildTickIndices(cols, 11);
    xTicks.forEach((c) => {
        const label = createAxisSprite(toBinary(c, bitmaskMode, bitWidth), "#93c5fd");
      if (!label) return;
      const x = -xSpan / 2 + c * cellSize + cellSize / 2;
      label.position.set(x, -ySpan / 2 - 0.8, zMin - 0.55);
      scene.add(label);
    });

    const yTicks = buildTickIndices(rows, 11);
    yTicks.forEach((r) => {
      const label = createAxisSprite(toBinary(r, bitmaskMode, bitWidth), "#86efac");
      if (!label) return;
      const y = -ySpan / 2 + r * cellSize + cellSize / 2;
      label.position.set(-xSpan / 2 - 0.95, y, zMin - 0.55);
      scene.add(label);
    });

    const zTicks = buildTickIndices(layerCount, 10);
    zTicks.forEach((localIdx) => {
      const k = layerStart + localIdx;
      const label = createAxisSprite(toBinary(k, bitmaskMode, bitWidth), "#fde68a");
      if (!label) return;
      const z = zOffsetBase + localIdx * layerSpacing;
      label.position.set(-xSpan / 2 - 0.95, -ySpan / 2 - 0.95, z);
      scene.add(label);
    });

    textCandidates
      .sort((a, b) => {
        const scoreA = (a.changed ? 10_000 : 0) + (a.k === clampedFocus ? 1_000 : 0) + Math.abs(a.value);
        const scoreB = (b.changed ? 10_000 : 0) + (b.k === clampedFocus ? 1_000 : 0) + Math.abs(b.value);
        return scoreB - scoreA;
      })
      .filter((cell) => cell.changed || cell.k === clampedFocus)
      .slice(0, 36)
      .forEach((cell) => {
        const sprite = createTextSprite(toBinary(cell.value, bitmaskMode, bitWidth), cell.changed ? "#ffcf6e" : "#dbe9ff");
        if (!sprite) return;
        sprite.position.set(cell.x, cell.y, cell.z);
        scene.add(sprite);
      });

    const bbox = new THREE.Box3(
      new THREE.Vector3(-xSpan / 2, -ySpan / 2, zOffsetBase - 0.2),
      new THREE.Vector3(xSpan / 2, ySpan / 2, zOffsetBase + (layerCount - 1) * layerSpacing + 0.2),
    );
    const helper = new THREE.Box3Helper(bbox, new THREE.Color("#4b5563"));
    scene.add(helper);

    if (saved) {
      controls.target.set(saved.target[0], saved.target[1], saved.target[2]);
    } else {
      controls.target.copy(center);
    }
    controls.update();

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(() => {
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(mount);

    return () => {
      cameraStateByName.set(name, {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
      });
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [volume, prevVolume, dims, focusIndex, name, bitmaskMode, bitWidth]);

  const layerCount = dims[2];
  const clampedFocus = Math.max(0, Math.min(Math.trunc(focusIndex), Math.max(0, layerCount - 1)));
  const windowInfo = getLayerWindow(layerCount, clampedFocus, 24);

  return (
    <div className="flex-1 min-h-[360px] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-prova-muted font-mono">
        <span>{name} [{dims[0]} x {dims[1]} x {dims[2]}]</span>
        <span>k-layer {windowInfo.start}..{windowInfo.end} (focus {clampedFocus})</span>
      </div>
      <div className="text-[11px] text-[#9fb3c8] font-mono">
        파랑=값 존재, 노랑=직전 step 대비 변경, 셀 위 숫자=해당 좌표의 실제 값
      </div>
      <div ref={mountRef} className="w-full h-full min-h-[320px] rounded border border-[#1f2937] overflow-hidden" />
    </div>
  );
}

