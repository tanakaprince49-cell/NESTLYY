import React, { useMemo } from 'react';

type Teddy = {
  id: string;
  leftPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  opacity: number;
  blurPx: number;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FloatingTeddiesBackground: React.FC<{ count?: number }> = ({ count = 14 }) => {
  const teddies = useMemo(() => {
    const rand = mulberry32(26026);
    const items: Teddy[] = [];
    for (let i = 0; i < count; i++) {
      const r1 = rand();
      const r2 = rand();
      const r3 = rand();
      const r4 = rand();
      const r5 = rand();
      items.push({
        id: `teddy-${i}`,
        leftPct: Math.round(r1 * 1000) / 10, // 0..100 with 0.1 precision
        sizePx: Math.round(18 + r2 * 34), // 18..52
        durationSec: Math.round(16 + r3 * 18), // 16..34
        delaySec: Math.round(r4 * 20), // 0..20
        opacity: Math.round((0.06 + r5 * 0.16) * 100) / 100, // 0.06..0.22
        blurPx: Math.round(r2 * 1.4),
      });
    }
    return items;
  }, [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {teddies.map((t) => (
        <span
          key={t.id}
          className="absolute bottom-[-12%] teddy-float select-none"
          style={{
            left: `${t.leftPct}%`,
            fontSize: `${t.sizePx}px`,
            animationDuration: `${t.durationSec}s`,
            animationDelay: `${t.delaySec}s`,
            opacity: t.opacity,
            filter: t.blurPx ? `blur(${t.blurPx}px)` : undefined,
          }}
        >
          🧸
        </span>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_30%_20%,rgba(255,255,255,0.55),transparent_60%),radial-gradient(closest-side_at_80%_10%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(closest-side_at_60%_75%,rgba(255,255,255,0.28),transparent_55%)] opacity-80" />
    </div>
  );
};

