import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ── Procedural Perfume Bottle ── */
function PerfumeBottle({ mouse }) {
  const groupRef = useRef(null);
  const bottleRef = useRef(null);

  // Idle rotation + mouse follow
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle idle rotation
    groupRef.current.rotation.y += delta * 0.15;

    // Mouse influence (subtle tilt)
    if (mouse.current) {
      const targetX = mouse.current.y * 0.15;
      const targetZ = -mouse.current.x * 0.15;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.02);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ, 0.02);
    }
  });

  // Bottle body shape — custom lathe geometry
  const bottleProfile = useMemo(() => {
    const points = [];
    // Bottom flat
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.8, 0));
    // Bottom curve
    points.push(new THREE.Vector2(0.85, 0.1));
    points.push(new THREE.Vector2(0.9, 0.3));
    // Sides
    points.push(new THREE.Vector2(0.9, 2.0));
    // Shoulder curve
    points.push(new THREE.Vector2(0.85, 2.2));
    points.push(new THREE.Vector2(0.7, 2.4));
    // Neck taper
    points.push(new THREE.Vector2(0.35, 2.6));
    points.push(new THREE.Vector2(0.3, 2.7));
    points.push(new THREE.Vector2(0.3, 3.0));
    // Neck top
    points.push(new THREE.Vector2(0.25, 3.0));
    points.push(new THREE.Vector2(0, 3.0));
    return points;
  }, []);

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      {/* Glass Bottle Body */}
      <mesh ref={bottleRef} castShadow>
        <latheGeometry args={[bottleProfile, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.5}
          chromaticAberration={0.15}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          ior={1.5}
          color="#d4a574"
          attenuationColor="#c9956b"
          attenuationDistance={0.6}
          roughness={0.02}
          transmission={1}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* Liquid inside */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.78, 0.82, 1.6, 32]} />
        <meshPhysicalMaterial
          color="#8b5e3c"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Cap */}
      <Float speed={0} floatIntensity={0}>
        <group position={[0, 3.2, 0]}>
          {/* Cap base ring */}
          <mesh>
            <cylinderGeometry args={[0.38, 0.35, 0.15, 32]} />
            <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Cap body */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.55, 6]} />
            <meshStandardMaterial color="#d4b054" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Cap top */}
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d4b054" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

/* ── Scene Content ── */
function SceneContent() {
  const mouse = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / size.width) * 2 - 1;
      mouse.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 8, 5]}
        angle={0.4}
        penumbra={0.8}
        intensity={2}
        color="#f5deb3"
        castShadow
      />
      <spotLight
        position={[-4, 6, -3]}
        angle={0.5}
        penumbra={1}
        intensity={1.2}
        color="#c9956b"
      />
      <pointLight position={[0, -2, 4]} intensity={0.5} color="#d4a574" />

      {/* Environment for reflections */}
      <Environment preset="studio" environmentIntensity={0.4} />

      {/* The Bottle */}
      <PerfumeBottle mouse={mouse} />

      {/* Gold Sparkles */}
      <Sparkles
        count={80}
        scale={[8, 10, 8]}
        size={2}
        speed={0.3}
        opacity={0.4}
        color="#d4a574"
      />
    </>
  );
}

/* ── Fallback Component ── */
function Fallback() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, hsl(30, 20%, 10%) 0%, hsl(30, 10%, 5%) 100%)',
    }}>
      <img
        src="/images/perfume-nocturne.png"
        alt="VELOUR Perfume"
        style={{ maxHeight: '60vh', objectFit: 'contain', opacity: 0.7 }}
      />
    </div>
  );
}

/* ── Main Export ── */
export default function HeroScene() {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) return <Fallback />;

  return (
    <Canvas
      camera={{ position: [0, 1.5, 6], fov: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      dpr={[1, 1.5]}
      fallback={<Fallback />}
    >
      <color attach="background" args={['#0f0d0b']} />
      <fog attach="fog" args={['#0f0d0b', 8, 18]} />
      <SceneContent />
    </Canvas>
  );
}
