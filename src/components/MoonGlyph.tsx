/** Moon disc shaded for a lunation phase (0 = new, 0.5 = full). */
export function MoonGlyph({ phase, size = 96 }: { phase: number; size?: number }) {
  const r = 50;
  const k = Math.cos(2 * Math.PI * phase); // +1 new, -1 full
  const waxing = phase < 0.5;
  const rx = Math.abs(k) * r;
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0;

  const litPath = `M 60 10 A ${r} ${r} 0 0 ${sweepOuter} 60 110 A ${rx} ${r} 0 0 ${sweepInner} 60 10 Z`;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="moon-lit" cx="40%" cy="35%">
          <stop offset="0%" stopColor="var(--color-marigold)" />
          <stop offset="100%" stopColor="var(--color-gold)" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r={r} fill="var(--color-secondary)" />
      <path d={litPath} fill="url(#moon-lit)" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <circle
        cx="60"
        cy="60"
        r={r + 7}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="2 6"
      />
    </svg>
  );
}