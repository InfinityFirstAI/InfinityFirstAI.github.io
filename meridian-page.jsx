// InfinityFirst — Logo-centered design with blue→purple→magenta gradient palette
const { useState, useEffect, useRef, useMemo } = React;

/* ── Color helpers ── */
const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, str: `${r}, ${g}, ${b}` };
};

const lerpColor = (a, b, t) => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
});
const rgbStr = (c) => `${c.r}, ${c.g}, ${c.b}`;

/* Gradient palette from logo */
const PALETTE = {
  cyan:    '#38BDF8',
  blue:    '#2563EB',
  purple:  '#8B5CF6',
  magenta: '#D946EF',
};
const GRADIENT_STOPS = [
  hexToRgb(PALETTE.cyan),
  hexToRgb(PALETTE.blue),
  hexToRgb(PALETTE.purple),
  hexToRgb(PALETTE.magenta),
];

const sampleGradient = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (GRADIENT_STOPS.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  if (i >= GRADIENT_STOPS.length - 1) return GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
  return lerpColor(GRADIENT_STOPS[i], GRADIENT_STOPS[i + 1], f);
};

const bgColorMap = {
  White:   '#FFFFFF',
  Cream:   '#FAF7F0',
  Frost:   '#F0F2F8',
};
const densityMap = { Sparse: 40, Medium: 65, Dense: 95 };


/* ================================================
   GradientNetwork — Particle field with gradient colors
   ================================================ */
const GradientNetwork = ({ density, bgTone }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = densityMap[density] || 48;
    const hubCount = Math.max(4, Math.floor(count * 0.1));
    const particles = [];
    for (let i = 0; i < count; i++) {
      const isHub = i < hubCount;
      const gradPos = Math.random();
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * (isHub ? 0.12 : 0.22),
        vy: (Math.random() - 0.5) * (isHub ? 0.12 : 0.22),
        r: isHub ? 2.5 + Math.random() * 1.5 : Math.random() * 1.6 + 0.8,
        isHub, phase: Math.random() * Math.PI * 2,
        gradPos,
      });
    }

    const connDist = 160;

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;

      // Central gradient glow
      const grad1 = ctx.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, 420);
      grad1.addColorStop(0, 'rgba(37, 99, 235, 0.035)');
      grad1.addColorStop(0.4, 'rgba(139, 92, 246, 0.02)');
      grad1.addColorStop(0.7, 'rgba(217, 70, 239, 0.008)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Concentric rings with gradient colors
      const rings = [140, 260, 400];
      rings.forEach((r, ri) => {
        const c = sampleGradient(ri / (rings.length - 1));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgbStr(c)}, 0.06)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });

      // Cross axes
      ctx.save();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx - 500, cy); ctx.lineTo(cx + 500, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 350); ctx.lineTo(cx, cy + 350); ctx.stroke();
      ctx.restore();

      // Corner brackets
      const m = 24, bl = 18;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(m, m+bl); ctx.lineTo(m, m); ctx.lineTo(m+bl, m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w-m-bl, m); ctx.lineTo(w-m, m); ctx.lineTo(w-m, m+bl); ctx.stroke();
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.06)';
      ctx.beginPath(); ctx.moveTo(m, h-m-bl); ctx.lineTo(m, h-m); ctx.lineTo(m+bl, h-m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w-m-bl, h-m); ctx.lineTo(w-m, h-m); ctx.lineTo(w-m, h-m-bl); ctx.stroke();
      ctx.restore();

      // Particles with gradient colors
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        if (p.y < -30) p.y = h + 30;
        if (p.y > h + 30) p.y = -30;

        const pulse = p.isHub ? Math.sin(time * 0.0008 + p.phase) * 0.5 + 0.5 : 0;
        const radius = p.isHub ? p.r + pulse * 1.8 : p.r;
        const alpha = p.isHub ? 0.35 + pulse * 0.25 : 0.3;
        const shift = (Math.sin(time * 0.0002 + p.phase) * 0.5 + 0.5);
        const col = sampleGradient((p.gradPos + shift * 0.3) % 1);
        const colStr = rgbStr(col);

        if (p.isHub) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 12, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colStr}, ${0.03 + pulse * 0.04})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colStr}, ${alpha})`;
        ctx.fill();
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            const strength = 1 - dist / connDist;
            const boost = particles[i].isHub || particles[j].isHub ? 1.5 : 1;
            const mid = (particles[i].gradPos + particles[j].gradPos) / 2;
            const col = sampleGradient(mid);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgbStr(col)}, ${strength * 0.12 * boost})`;
            ctx.lineWidth = particles[i].isHub || particles[j].isHub ? 0.8 : 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [density]);

  return (
    <canvas ref={canvasRef} className="network-canvas"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    ></canvas>
  );
};


/* ================================================
   MeridianPage — Full viewport layout with logo
   ================================================ */
const MeridianPage = ({ tweaks }) => {
  const bg = bgColorMap[tweaks.bgTone] || '#FFFFFF';

  return (
    <div style={{
      width: '100vw', minHeight: '100vh', backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Manrope', sans-serif",
      transition: 'background-color 0.6s ease',
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(37, 99, 235, 0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none',
      }}></div>

      <GradientNetwork density={tweaks.density} bgTone={tweaks.bgTone} />

      {/* Central content */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div className="infinity-mark" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <img
            src="logo.png"
            alt="InfinityFirst Logo"
            style={{
              width: 'clamp(200px, 32vw, 340px)',
              height: 'auto',
              filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.08)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.06))',
            }}
          />
        </div>

        {/* Gradient accent line */}
        <div className="meridian-line" style={{
          width: '60px', height: '2px',
          background: 'linear-gradient(90deg, #38BDF8, #8B5CF6, #D946EF)',
          marginTop: '28px', marginBottom: '24px',
          borderRadius: '1px',
        }}></div>

        {/* Status text */}
        <p className="meridian-subtitle" style={{
          fontSize: '11px', fontWeight: 500,
          color: '#8B5CF6', letterSpacing: '0.35em',
          textTransform: 'uppercase',
        }}>Coming Soon</p>
      </div>

      {/* Footer */}
      <p className="meridian-footer" style={{
        position: 'absolute', bottom: '24px',
        fontSize: '9px', fontWeight: 400,
        color: 'rgba(0,0,0,0.2)', letterSpacing: '0.15em',
      }}>© 2026 InfinityFirst</p>
    </div>
  );
};

Object.assign(window, { MeridianPage, GradientNetwork });
