"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { clamp, DEG2RAD, normalizeAngleDeg } from "./imuMath";

export default function DroneModel({ telemetry, pointerParallax }) {
  const root = useRef();
  const target = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    target.current.x = clamp(normalizeAngleDeg(telemetry?.pitch), -80, 80) * DEG2RAD; // X
    target.current.y = normalizeAngleDeg(telemetry?.yaw) * DEG2RAD; // Y
    target.current.z = clamp(normalizeAngleDeg(telemetry?.roll), -80, 80) * DEG2RAD; // Z
  }, [telemetry?.pitch, telemetry?.yaw, telemetry?.roll]);

  useFrame((_, dt) => {
    if (!root.current) return;
    const d = clamp(dt, 0, 0.05);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, target.current.x, 8, d);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, target.current.y, 8, d);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, target.current.z, 8, d);
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, (pointerParallax?.x || 0) * 0.14, 5.5, d);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, 0.03 + (pointerParallax?.y || 0) * 0.09, 5.5, d);
  });

  return (
    <group ref={root} position={[0, 0.03, 0]}>
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <ringGeometry args={[0.2, 0.34, 48]} />
        <meshBasicMaterial color="#041322" transparent opacity={0.42} />
      </mesh>

      <mesh castShadow>
        <boxGeometry args={[0.26, 0.05, 0.18]} />
        <meshStandardMaterial color="#071223" metalness={0.3} roughness={0.45} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.62, 0.016, 0.016]} />
        <meshStandardMaterial color="#02070f" metalness={0.25} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} castShadow>
        <boxGeometry args={[0.62, 0.016, 0.016]} />
        <meshStandardMaterial color="#02070f" metalness={0.25} roughness={0.55} />
      </mesh>

      {[
        [-0.22, 0.014, -0.22],
        [0.22, 0.014, -0.22],
        [-0.22, 0.014, 0.22],
        [0.22, 0.014, 0.22],
      ].map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow>
            <cylinderGeometry args={[0.022, 0.03, 0.045, 20]} />
            <meshStandardMaterial color="#0a2438" metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.035, 0.1, 28]} />
            <meshBasicMaterial color="#25d8ff" transparent opacity={0.24} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

