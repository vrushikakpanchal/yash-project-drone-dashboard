"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import DroneModel from "./DroneModel";

export default function DroneScene({ telemetry, resetNonce, pointerParallax }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0.85, 0.65, 0.95);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera, resetNonce]);

  return (
    <>
      <color attach="background" args={["#071328"]} />
      <fog attach="fog" args={["#071328", 1.2, 3.5]} />

      <ambientLight intensity={0.35} />
      <directionalLight castShadow intensity={0.85} position={[1.4, 1.6, 1.2]} color="#78d9ff" />
      <pointLight intensity={0.45} position={[-1.1, 0.8, -0.8]} color="#2acfff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[4.4, 4.4]} />
        <meshStandardMaterial color="#091a31" metalness={0.05} roughness={0.95} />
      </mesh>
      <gridHelper args={[4.4, 28, "#1f5377", "#13344f"]} position={[0, -0.109, 0]} />

      <DroneModel telemetry={telemetry} pointerParallax={pointerParallax} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        makeDefault
        minDistance={0.55}
        maxDistance={2.2}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

