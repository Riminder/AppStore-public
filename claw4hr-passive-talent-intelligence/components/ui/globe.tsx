"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function WireframeSphere({ speed = 0.003 }: { speed?: number }) {
  const meshRef = useRef<Mesh>(null!);

  useFrame(() => {
    meshRef.current.rotation.y += speed;
    meshRef.current.rotation.x += speed * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 36, 36]} />
      <meshBasicMaterial
        color="#6366F1"
        transparent
        opacity={0.12}
        wireframe
      />
    </mesh>
  );
}

export default function Globe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      style={{ pointerEvents: "none" }}
      gl={{ alpha: true, antialias: true }}
    >
      <WireframeSphere />
    </Canvas>
  );
}
