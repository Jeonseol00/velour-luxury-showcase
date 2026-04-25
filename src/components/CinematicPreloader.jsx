import { useEffect, useState, useRef } from 'react';

/* ══════════════════════════════════════════════════════════════════════════════
   VELOUR Cinematic Preloader — "The Ignition Sequence"
   ──────────────────────────────────────────────────────────────────────────────
   TIMING: Exits on its OWN 2-second timer (independent of isEngineReady).
   This ensures the preloader clears MID-RUSH, so the user sees the camera
   accelerating dramatically toward the bottle as the flash fades.
   ══════════════════════════════════════════════════════════════════════════════ */

export default function CinematicPreloader() {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'flash' | 'done'
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);

  // Breathing glow animation
  useEffect(() => {
    let frame;
    const tick = () => {
      setBreathCycle(prev => prev + 0.025);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Simulated progress — fills to 100% over ~2 seconds
  useEffect(() => {
    let frame;
    let current = 0;
    const startTime = performance.now();
    const FILL_DURATION = 1800; // ms to reach 100%

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / FILL_DURATION, 1);
      // Ease-in-out curve for organic feel
      current = t < 0.5
        ? 2 * t * t * 100
        : (1 - Math.pow(-2 * t + 2, 2) / 2) * 100;
      setSimulatedProgress(current);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-exit on fixed timer: flash at 2s, done at 2.8s
  useEffect(() => {
    const flashTimer = setTimeout(() => {
      setPhase('flash');
    }, 2000);

    const doneTimer = setTimeout(() => {
      setPhase('done');
    }, 2800); // 2000ms + 800ms flash

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  const breathValue = Math.sin(breathCycle) * 0.5 + 0.5;
  const breathGlow = 0.15 + breathValue * 0.4;
  const breathScale = 1.0 + breathValue * 0.02;
  const letterSpacingPx = 12 + breathValue * 4;

  return (
    <>
      {/* ── Main Preloader Overlay ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#030105',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: phase === 'flash' ? 0 : 1,
          transition: phase === 'flash' ? 'opacity 0.35s ease-in' : 'none',
          pointerEvents: phase === 'flash' ? 'none' : 'auto',
        }}
      >
        {/* Radial aura behind the logo */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(38, 65%, 55%, ${breathGlow * 0.12}) 0%, hsla(38, 65%, 55%, ${breathGlow * 0.04}) 40%, transparent 70%)`,
          transform: `scale(${breathScale * 1.5})`,
          transition: 'transform 0.3s ease-out',
          pointerEvents: 'none',
        }} />

        {/* VELOUR brand logo */}
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 600,
          color: `hsla(38, 65%, 55%, ${0.5 + breathValue * 0.5})`,
          letterSpacing: `${letterSpacingPx}px`,
          textTransform: 'uppercase',
          transform: `scale(${breathScale})`,
          transition: 'transform 0.5s ease-out',
          position: 'relative',
          zIndex: 1,
          textShadow: `0 0 ${30 + breathValue * 40}px hsla(38, 65%, 55%, ${breathGlow * 0.5}), 
                       0 0 ${60 + breathValue * 60}px hsla(38, 65%, 55%, ${breathGlow * 0.2})`,
        }}>
          VELOUR
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(0.65rem, 1.5vw, 0.8rem)',
          fontStyle: 'italic',
          color: `hsla(30, 15%, 70%, ${0.2 + breathValue * 0.3})`,
          letterSpacing: '0.25em',
          marginTop: '1.2rem',
          position: 'relative',
          zIndex: 1,
        }}>
          Where memory meets molecule
        </div>

        {/* Tracking line */}
        <div style={{
          width: '160px',
          height: '1px',
          backgroundColor: 'rgba(204, 163, 102, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '2.5rem',
          zIndex: 1,
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            backgroundColor: `hsla(38, 65%, 55%, ${0.6 + breathValue * 0.4})`,
            width: `${simulatedProgress}%`,
            transition: 'width 0.12s ease-out',
            boxShadow: `0 0 8px hsla(38, 65%, 55%, ${breathGlow * 0.6})`,
          }} />
        </div>

        {/* Percentage */}
        <div style={{
          marginTop: '1rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          color: `rgba(255, 255, 255, ${0.15 + breathValue * 0.15})`,
          letterSpacing: '0.15em',
          zIndex: 1,
        }}>
          {Math.round(simulatedProgress)}%
        </div>
      </div>

      {/* ── The Golden Flash (Cinematic Hard Cut) ── */}
      {phase === 'flash' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'radial-gradient(ellipse at center, hsla(38, 80%, 75%, 0.95) 0%, hsla(38, 65%, 55%, 0.6) 30%, hsla(30, 20%, 10%, 0.3) 60%, transparent 100%)',
            animation: 'goldenFlash 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        @keyframes goldenFlash {
          0% { opacity: 0; transform: scale(0.8); }
          15% { opacity: 1; transform: scale(1.0); }
          40% { opacity: 0.9; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(2.0); }
        }
      `}</style>
    </>
  );
}
