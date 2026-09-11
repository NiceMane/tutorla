"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { useThemeVars } from "@/lib/hooks";
import { LOGO_ROLE_MARK, LOGO_W, logoSvgForThree } from "@/lib/logoPaths";

type Props = { progress: { current: number } };
type Role = "ink" | "mark";

/* Tema değişince malzeme renkleri CSS değişkenlerinden yeniden okunur */
function useThemeColors() {
  const key = useThemeVars(["--logo-ink", "--logo-mark"], "#22271A|#1F6E85");
  const [ink, mark] = key.split("|");
  return { ink: ink || "#22271A", mark: mark || "#1F6E85" };
}

/* SVG → shape → extrude. Kare işaret ve alt tire "mark", harfler "ink" rolünde. */
function buildParts() {
  const data = new SVGLoader().parse(logoSvgForThree());
  const geos: { geo: THREE.ExtrudeGeometry; role: Role }[] = [];
  for (const path of data.paths) {
    const style = (path.userData as { style?: { fill?: string } } | undefined)?.style;
    const role: Role = String(style?.fill ?? "").toLowerCase() === LOGO_ROLE_MARK ? "mark" : "ink";
    for (const shape of SVGLoader.createShapes(path)) {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 16,
        bevelEnabled: true,
        bevelThickness: 2.2,
        bevelSize: 1.6,
        bevelSegments: 3,
        curveSegments: 14,
      });
      geo.rotateX(Math.PI); // SVG y-aşağı → three y-yukarı; dönüş, ayna değil
      geos.push({ geo, role });
    }
  }
  const box = new THREE.Box3();
  for (const { geo } of geos) {
    geo.computeBoundingBox();
    box.union(geo.boundingBox as THREE.Box3);
  }
  const c = box.getCenter(new THREE.Vector3());
  for (const { geo } of geos) geo.translate(-c.x, -c.y, -c.z);
  return geos;
}

function LogoMesh({ progress }: Props) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const { viewport } = useThree();
  const colors = useThemeColors();
  const parts = useMemo(() => buildParts(), []);
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);

  useEffect(() => {
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.color.set(parts[i].role === "mark" ? colors.mark : colors.ink);
    });
  }, [colors.ink, colors.mark, parts]);

  const roll = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 1 / 30);
    const k = 1 - Math.exp(-8 * d);
    const p = progress.current;
    const t = state.clock.elapsedTime;
    const wide = viewport.aspect > 1.1;

    // imleci takip eden eğilme (yumuşatılmış)
    tilt.current.y += (state.pointer.x * 0.34 - tilt.current.y) * k;
    tilt.current.x += (-state.pointer.y * 0.2 - tilt.current.x) * k;

    // kaydırma: düzlem içinde tam tur yuvarlanma (hindistan cevizi gibi), kalkış, küçülme, solma
    roll.current += (p * Math.PI * 2 - roll.current) * k;
    const base = (wide ? Math.min(viewport.width * 0.58, 5.6) : viewport.width * 0.86) / LOGO_W;
    const s = base * (1 - p * 0.7);
    const x0 = wide ? viewport.width * 0.1 : 0;
    const y0 = wide ? -0.2 : 0.2;

    g.position.set(x0 * (1 - p), y0 + p * p * 2.6 + Math.sin(t * 1.1) * 0.05, 0);
    g.scale.setScalar(s);
    g.rotation.set(tilt.current.x, Math.sin(p * Math.PI) * 0.45 + tilt.current.y, roll.current + Math.sin(t * 0.7) * 0.02);

    const op = 1 - THREE.MathUtils.smoothstep(p, 0.7, 0.96);
    for (const m of mats.current) m?.setValues({ opacity: op });
    g.visible = op > 0.01;
  });

  return (
    <group ref={group}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geo}>
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color={p.role === "mark" ? colors.mark : colors.ink}
            roughness={p.role === "mark" ? 0.5 : 0.58}
            metalness={p.role === "mark" ? 0.08 : 0.04}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

export function Logo3D({ progress }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 35 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 6]} intensity={1.4} />
        <directionalLight position={[-4, -2, 3]} intensity={0.5} />
        <LogoMesh progress={progress} />
      </Canvas>
    </div>
  );
}
