/**
 * ParticleField — web version using HTML5 Canvas (no Three.js/R3F dependency).
 * Renders teal, magenta, and gold drifting particles on a 2D canvas.
 */
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;          // depth 0..1 — affects size + opacity
  vx: number;
  vy: number;
  color: string;
  baseOpacity: number;
  size: number;
  twinkle: number;    // phase offset for twinkle
  twinkleSpeed: number;
}

const COLORS = [
  '#00D4FF',  // teal
  '#00D4FF',  // teal (more weight)
  '#FF00AA',  // magenta
  '#D4AF5A',  // gold
  '#FFFFFF',  // white
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function buildParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: randomBetween(0, w),
    y: randomBetween(0, h),
    z: randomBetween(0, 1),
    vx: randomBetween(-0.12, 0.12),
    vy: randomBetween(-0.08, 0.08),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    baseOpacity: randomBetween(0.15, 0.75),
    size: randomBetween(0.8, 2.4),
    twinkle: randomBetween(0, Math.PI * 2),
    twinkleSpeed: randomBetween(0.008, 0.025),
  }));
}

interface Props {
  count?: number;
  style?: object;
}

export function ParticleField({ count = 500 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;

    function resize() {
      if (!canvas) return;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width  = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
      particles.current = buildParticles(count, w, h);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const now = performance.now() * 0.001;

      for (const p of particles.current) {
        // drift
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;

        // wrap around
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        if (p.y < -4) p.y = h + 4;
        if (p.y > h + 4) p.y = -4;

        const opacity = p.baseOpacity * (0.55 + 0.45 * Math.sin(p.twinkle));
        const size    = p.size * (0.85 + 0.15 * p.z);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fill();

        // soft glow for larger particles
        if (size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.5);
          grad.addColorStop(0, p.color + '44');
          grad.addColorStop(1, p.color + '00');
          ctx.fillStyle = grad;
          ctx.globalAlpha = opacity * 0.5;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
