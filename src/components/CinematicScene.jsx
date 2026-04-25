import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { synesthesiaColor, intensityMultiplier, isEngineReady } from '../store/synesthesiaStore';

/* ══════════════════════════════════════════════════════════════════════════════
   VELOUR Cinematic 3D Engine — "Obsidian Glass" Architecture
   ──────────────────────────────────────────────────────────────────────────────
   This engine uses ZERO FBO/Environment Map dependencies.
   All visual effects (gradients, reflections, fresnel glow) are computed
   entirely in custom vertex/fragment shaders for 100% hardware compatibility.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── Custom Smoked Glass ShaderMaterial ── */
class SmokedGlassMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color('#0a0318') },
        uGlowColorTop: { value: new THREE.Color('#4a00e0') },
        uGlowColorBottom: { value: new THREE.Color('#ff0055') },
        uGlowColorEdge: { value: new THREE.Color('#d4a574') },
        uOpacity: { value: 0.92 },
        uFresnelPower: { value: 2.5 },
        uFresnelIntensity: { value: 0.7 },
        uGradientShift: { value: 0.0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        varying float vFresnel;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vViewDirection = normalize(cameraPosition - worldPos.xyz);

          // Fresnel: bright at edges, dark in center — classic glass behavior
          float fresnel = 1.0 - abs(dot(vNormal, vViewDirection));
          vFresnel = fresnel;

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uGlowColorTop;
        uniform vec3 uGlowColorBottom;
        uniform vec3 uGlowColorEdge;
        uniform float uOpacity;
        uniform float uFresnelPower;
        uniform float uFresnelIntensity;
        uniform float uGradientShift;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        varying float vFresnel;

        void main() {
          // ── 1. Fresnel edge glow (the "glass rim" effect) ──
          float fresnel = pow(vFresnel, uFresnelPower) * uFresnelIntensity;

          // ── 2. Vertical gradient: purple at top → magenta at bottom ──
          float gradientY = smoothstep(-2.0, 3.0, vWorldPosition.y + uGradientShift);
          vec3 gradientColor = mix(uGlowColorBottom, uGlowColorTop, gradientY);

          // ── 3. Subtle animated iridescence (very slow color shift) ──
          float iridescence = sin(vWorldPosition.y * 3.0 + uTime * 0.3) * 0.5 + 0.5;
          vec3 iriColor = mix(uGlowColorTop, uGlowColorEdge, iridescence * 0.3);

          // ── 4. Simulated specular highlight (fake reflection) ──
          vec3 lightDir1 = normalize(vec3(-0.3, 0.8, 0.5));
          vec3 lightDir2 = normalize(vec3(0.5, -0.3, 0.6));
          vec3 halfDir1 = normalize(vViewDirection + lightDir1);
          vec3 halfDir2 = normalize(vViewDirection + lightDir2);
          float spec1 = pow(max(dot(vNormal, halfDir1), 0.0), 64.0) * 0.4;
          float spec2 = pow(max(dot(vNormal, halfDir2), 0.0), 32.0) * 0.2;

          // ── 5. Compose final color ──
          // Deep dark base
          vec3 color = uBaseColor;
          // Add gradient glow — strongest at edges (fresnel-modulated)
          color += gradientColor * fresnel * 1.2;
          // Add subtle iridescence across the body
          color += iriColor * 0.08;
          // Add specular highlights
          color += vec3(1.0) * spec1;
          color += gradientColor * spec2;
          // Edge glow (golden rim at extreme angles)
          color += uGlowColorEdge * pow(vFresnel, 4.0) * 0.15;

          // ── 6. Alpha: more transparent in center, more opaque at edges ──
          float alpha = uOpacity + fresnel * 0.08;
          alpha = clamp(alpha, 0.0, 1.0);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
    });
  }
}

/* Register the custom material with R3F's extend system */
extend({ SmokedGlassMaterial });

/* ── Custom Inner Core ShaderMaterial ── */
class InnerCoreMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color('#110a22') },
        uGlowColor: { value: new THREE.Color('#2a1050') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDirection = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uGlowColor;
        
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 3.0);
          vec3 color = mix(uBaseColor, uGlowColor, fresnel * 0.5);
          
          // Subtle inner shimmer
          float shimmer = sin(vUv.y * 20.0 + uTime * 0.5) * 0.5 + 0.5;
          color += uGlowColor * shimmer * 0.03;
          
          gl_FragColor = vec4(color, 0.5 + fresnel * 0.2);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }
}

extend({ InnerCoreMaterial });

/* ── Scroll-Driven Camera Controller with Cinematic Rush ── */
function CameraRig() {
  const { camera } = useThree();
  const scrollRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 5, z: 38 }); // Start VERY far away
  const lookRef = useRef({ x: 0, y: 0, z: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const introPhaseRef = useRef(0); // 0 = intro playing, 1 = intro done
  const introTimeRef = useRef(0);
  const hasSignaledRef = useRef(false);

  // Set initial camera position at extreme distance
  useEffect(() => {
    camera.position.set(0, 5, 38);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    const handleMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  useFrame((state, delta) => {
    const t = scrollRef.current;
    const time = state.clock.getElapsedTime();

    // Clamp delta to prevent tab-switch time jumps from breaking the intro
    const safeDelta = Math.min(delta, 0.05);

    // ── CINEMATIC RUSH: 3-phase sigmoid camera approach (3.2 seconds) ──
    const INTRO_DURATION = 3.2;
    if (introPhaseRef.current < 1) {
      introTimeRef.current += safeDelta;
      const progress = Math.min(introTimeRef.current / INTRO_DURATION, 1);

      // ── Sigmoid S-Curve: slow → FAST → slow ──
      // Maps linear 0→1 into an S-curve with dramatic midpoint acceleration
      const sigmoid = (x) => {
        const k = 8; // Steepness: higher = sharper rush
        return 1 / (1 + Math.exp(-k * (x - 0.45)));
      };
      // Normalize sigmoid to exactly 0→1 range
      const s0 = sigmoid(0);
      const s1 = sigmoid(1);
      const ease = (sigmoid(progress) - s0) / (s1 - s0);

      // ── Camera Position: [0, 5, 38] → [0, 0.5, 8] with downward arc ──
      // X: lateral arc that peaks mid-rush then returns to center (0) at end
      //    sin(ease * PI) = 0 at both ease=0 and ease=1, peaks at ease=0.5
      const introPx = Math.sin(ease * Math.PI) * 1.2;
      
      // Y: starts high (5), swoops DOWN through the arc, settles at 0.5
      //    The arc dip is strongest at midpoint and vanishes at both ends
      const arcDip = Math.sin(ease * Math.PI) * 1.5;
      const introPy = THREE.MathUtils.lerp(5, 0.5, ease) - arcDip * (1 - ease) * ease * 4;
      
      // Z: the main rush axis — 38 → 8 (30 units of dramatic travel)
      const introPz = THREE.MathUtils.lerp(38, 8, ease);

      // ── Look Target: smoothly transition from distant gaze to bottle center ──
      const lookY = THREE.MathUtils.lerp(1.5, 0, ease);

      targetRef.current.x = introPx;
      targetRef.current.y = introPy;
      targetRef.current.z = introPz;
      lookRef.current.x = 0;
      lookRef.current.y = lookY;
      lookRef.current.z = 0;

      camera.position.set(targetRef.current.x, targetRef.current.y, targetRef.current.z);
      camera.lookAt(lookRef.current.x, lookRef.current.y, lookRef.current.z);

      if (progress >= 1) {
        introPhaseRef.current = 1;
        // Handoff: set targetRef to camera's ACTUAL final position
        // At ease=1: introPx=0, introPy=0.5, introPz=8 (mathematically exact)
        targetRef.current.x = camera.position.x;
        targetRef.current.y = camera.position.y;
        targetRef.current.z = camera.position.z;
        lookRef.current.x = 0;
        lookRef.current.y = 0;
        lookRef.current.z = 0;
        if (!hasSignaledRef.current) {
          hasSignaledRef.current = true;
          isEngineReady.set(true);
        }
      }
      return; // Skip scroll-based camera during intro
    }

    // ── PHASE 1: Normal scroll-driven camera ──
    let px, py, pz, lx, ly, lz;

    if (t < 0.12) {
      const s = t / 0.12;
      px = Math.sin(time * 0.15) * 0.3;
      py = 0.5 + Math.sin(time * 0.2) * 0.1;
      pz = 8 - s * 1.5;
      lx = 0; ly = 0; lz = 0;
    } else if (t < 0.28) {
      const s = (t - 0.12) / 0.16;
      const angle = s * Math.PI * 0.35;
      px = Math.sin(angle) * 5;
      py = 0.5 + s * 1.0;
      pz = Math.cos(angle) * 6.5;
      lx = 0; ly = 0; lz = 0;
    } else if (t < 0.45) {
      const s = (t - 0.28) / 0.17;
      px = 4 - s * 6;
      py = 1.5 + s * 1.0;
      pz = 5 + s * 2;
      lx = 0; ly = 0; lz = 0;
    } else if (t < 0.58) {
      const s = (t - 0.45) / 0.13;
      px = -2 + s * 2;
      py = 2.5 - s * 2.0;
      pz = 7 - s * 3.5;
      lx = 0; ly = 0.5; lz = 0;
    } else if (t < 0.72) {
      const s = (t - 0.58) / 0.14;
      const angle = Math.PI * 0.35 + s * Math.PI * 0.65;
      px = Math.sin(angle) * 5.5;
      py = 0.5 + s * 1.2;
      pz = Math.cos(angle) * 4.5;
      lx = 0; ly = 0.5; lz = 0;
    } else if (t < 0.88) {
      const s = (t - 0.72) / 0.16;
      px = -3 + s * 3;
      py = 1.7 - s * 0.5;
      pz = 5 + s * 2;
      lx = 0; ly = 0; lz = 0;
    } else {
      const s = (t - 0.88) / 0.12;
      px = 0;
      py = 1.2 - s * 0.7;
      pz = 7 - s * 1.5;
      lx = 0; ly = 0.5; lz = 0;
    }

    px += mouseRef.current.x * 0.4;
    py += mouseRef.current.y * 0.2;

    targetRef.current.x = THREE.MathUtils.lerp(targetRef.current.x, px, delta * 1.8);
    targetRef.current.y = THREE.MathUtils.lerp(targetRef.current.y, py, delta * 1.8);
    targetRef.current.z = THREE.MathUtils.lerp(targetRef.current.z, pz, delta * 1.8);
    lookRef.current.x = THREE.MathUtils.lerp(lookRef.current.x, lx, delta * 2);
    lookRef.current.y = THREE.MathUtils.lerp(lookRef.current.y, ly, delta * 2);
    lookRef.current.z = THREE.MathUtils.lerp(lookRef.current.z, lz, delta * 2);

    camera.position.set(targetRef.current.x, targetRef.current.y, targetRef.current.z);
    camera.lookAt(lookRef.current.x, lookRef.current.y, lookRef.current.z);
  });

  return null;
}

/* ── Hardware-Agnostic Cinematic Fog Shader ── */
function CinematicFog() {
  const materialRef = useRef();
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ; m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // Calculate spherical coordinates for seamless noise
      vec3 dir = normalize(vPosition);
      vec2 noiseUv = vec2(atan(dir.z, dir.x), asin(dir.y));
      
      float noise = snoise(noiseUv * 2.0 + uTime * 0.1) * 0.5 + 0.5;
      float noise2 = snoise(noiseUv * 4.0 - uTime * 0.05) * 0.5 + 0.5;
      float combined = (noise + noise2) * 0.5;
      
      // We want the purple fog to be concentrated at the back (-Z)
      // and fade smoothly to pitch black as we orbit to the front (+Z).
      // dir.z goes from -1.0 (back) to +1.0 (front).
      float zFade = smoothstep(0.2, -0.6, dir.z);
      
      // Fade out towards the top and bottom poles
      float yFade = smoothstep(0.8, 0.3, abs(dir.y));
      float vignette = zFade * yFade;
      
      vec3 color1 = vec3(0.0, 0.0, 0.0);    // Pure Black for the dark side
      vec3 color2 = vec3(0.15, 0.05, 0.2);  // Purple Fog
      
      vec3 ambient = mix(color1, vec3(0.02, 0.01, 0.03), zFade);
      vec3 finalColor = ambient + mix(vec3(0.0), color2, combined * vignette);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh scale={40}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        depthWrite={false}
        side={THREE.BackSide}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

/* ── Direct Lighting with Cinematic Ignition (no FBO, no Environment map) ── */
function DirectLightingMatrix() {
  const colorHex = useStore(synesthesiaColor);
  const ready = useStore(isEngineReady);
  const topLightRef = useRef();
  const bottomLightRef = useRef();
  const ambientRef = useRef();
  const fillLight1Ref = useRef();
  const fillLight2Ref = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });
  const ignitionRef = useRef(0); // 0 → 1 over ~1.5s after engine ready

  useEffect(() => {
    const handler = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame((state, delta) => {
    if (!topLightRef.current || !bottomLightRef.current) return;

    // ── Ignition: fade all lights from 0 → full over 1.5s ──
    if (ignitionRef.current < 1) {
      ignitionRef.current = Math.min(ignitionRef.current + delta * 0.7, 1);
    }
    const ign = ignitionRef.current;
    const ignEased = 1 - Math.pow(1 - ign, 2.5); // Ease-out curve
    
    topLightRef.current.position.x = THREE.MathUtils.lerp(topLightRef.current.position.x, mouseRef.current.x * 2, 0.05);
    bottomLightRef.current.position.x = THREE.MathUtils.lerp(bottomLightRef.current.position.x, -mouseRef.current.x * 2, 0.05);

    // Apply ignition multiplier to all light intensities
    topLightRef.current.intensity = 2 * ignEased;
    bottomLightRef.current.intensity = 2 * ignEased;
    if (ambientRef.current) ambientRef.current.intensity = 0.3 * ignEased;
    if (fillLight1Ref.current) fillLight1Ref.current.intensity = 0.8 * ignEased;
    if (fillLight2Ref.current) fillLight2Ref.current.intensity = 0.8 * ignEased;

    const baseTopColor = new THREE.Color('#4a00e0'); 
    const baseBottomColor = new THREE.Color('#ff0055'); 

    if (colorHex !== '#d4a574') {
      const aiColor = new THREE.Color(colorHex);
      baseTopColor.lerp(aiColor, 0.8);
      baseBottomColor.lerp(aiColor, 0.8);
    }

    topLightRef.current.color.lerp(baseTopColor, delta * 2);
    bottomLightRef.current.color.lerp(baseBottomColor, delta * 2);
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0} color="#111122" />
      <spotLight ref={topLightRef} position={[-2, 6, 4]} angle={0.6} penumbra={0.5} intensity={0} distance={20} decay={1.5} color="#4a00e0" castShadow />
      <spotLight ref={bottomLightRef} position={[2, -5, 4]} angle={0.8} penumbra={0.5} intensity={0} distance={20} decay={1.5} color="#ff0055" />
      <pointLight ref={fillLight1Ref} position={[-5, 0, -2]} intensity={0} color="#ffffff" distance={15} />
      <pointLight ref={fillLight2Ref} position={[5, 0, -2]} intensity={0} color="#ffffff" distance={15} />
    </>
  );
}

/* ── "Obsidian Glass" Perfume Bottle (100% Custom Shader — Zero FBO) ── */
function PerfumeBottle() {
  const groupRef = useRef();
  const intensity = useStore(intensityMultiplier);
  const colorHex = useStore(synesthesiaColor);

  // Create custom shader materials via useMemo (bypasses R3F extend issues)
  const outerGlassMat = useMemo(() => new SmokedGlassMaterial(), []);
  const innerCoreMat = useMemo(() => new InnerCoreMaterial(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.1 * intensity;
    
    const time = state.clock.getElapsedTime();

    // Update outer glass shader uniforms
    outerGlassMat.uniforms.uTime.value = time;
    if (colorHex !== '#d4a574') {
      const aiColor = new THREE.Color(colorHex);
      outerGlassMat.uniforms.uGlowColorTop.value.lerp(aiColor, delta * 2);
    }

    // Update inner core shader uniforms
    innerCoreMat.uniforms.uTime.value = time;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Outer Glass Body (Custom Smoked Glass Shader) ── */}
      <RoundedBox
        args={[2.8, 3.6, 1.2]}
        radius={0.1}
        smoothness={8}
        castShadow
        position={[0, -0.5, 0]}
        material={outerGlassMat}
      />

      {/* ── Inner Core (Custom Inner Glow Shader) ── */}
      <RoundedBox
        args={[2.5, 3.2, 0.9]}
        radius={0.05}
        smoothness={4}
        position={[0, -0.6, 0]}
        material={innerCoreMat}
      />

      {/* ── Liquid Level Indicator (subtle inner line) ── */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[2.3, 0.02, 0.7]} />
        <meshBasicMaterial color="#2a1050" transparent opacity={0.3} />
      </mesh>

      {/* ── Internal Tube/Straw ── */}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.03, 0.03, 3.2, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>

      {/* ── Matte Black Cap Assembly ── */}
      <group position={[0, 1.9, 0]}>
        {/* Cap base ring */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.2, 32]} />
          <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Cap body */}
        <mesh>
          <cylinderGeometry args={[0.68, 0.68, 1.0, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </mesh>
        {/* Cap top */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.66, 0.68, 0.05, 32]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Gold Brand Text Band ── */}
      <mesh position={[0, 0.2, 0.61]}>
        <planeGeometry args={[1.8, 0.15]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ── Golden Dust Particles ── */
function GoldenDust() {
  const count = 150;
  const meshRef = useRef();
  const intensity = useStore(intensityMultiplier);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return pos;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => Array.from({ length: count }, () => 0.1 + Math.random() * 0.2), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3] + Math.sin(time * speeds[i] * intensity + i) * 0.5;
      const y = positions[i * 3 + 1] + Math.cos(time * speeds[i] * 0.8 * intensity + i * 0.5) * 0.5;
      const z = positions[i * 3 + 2];
      dummy.position.set(x, y, z);
      const s = 0.01 + Math.sin(time * 2 + i) * 0.01;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#cca366" transparent opacity={0.8} />
    </instancedMesh>
  );
}

/* ── Fallback ── */
function Fallback() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at center 30%, #0a030d 0%, #000000 100%)'
    }}>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>INITIALIZING ENGINE...</p>
    </div>
  );
}

/* ── Main Export ── */
export default function CinematicScene() {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      if (!c.getContext('webgl2') && !c.getContext('webgl')) setOk(false);
    } catch { setOk(false); }
  }, []);

  if (!ok) return <Fallback />;

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 40 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%', background: '#000000' }}
    >
      <Suspense fallback={null}>
        <CinematicFog />
        <GoldenDust />
        <DirectLightingMatrix />
        <PerfumeBottle />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
