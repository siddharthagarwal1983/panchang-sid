import { useId } from "react";

/** Moon disc shaded for a lunation phase (0 = new, 0.5 = full). */
export function MoonGlyph({ phase, size = 96 }: { phase: number; size?: number }) {
  const uid = useId().replace(/[:]/g, "");
  const r = 46;
  const k = Math.cos(2 * Math.PI * phase); // +1 new, -1 full
  const waxing = phase < 0.5;
  const rx = Math.abs(k) * r;
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0;

  const litPath = `M 60 ${60 - r} A ${r} ${r} 0 0 ${sweepOuter} 60 ${60 + r} A ${rx} ${r} 0 0 ${sweepInner} 60 ${60 - r} Z`;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id={`lit-${uid}`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="var(--color-marigold)" />
          <stop offset="62%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.72" />
        </radialGradient>
        <radialGradient id={`dark-${uid}`} cx="62%" cy="70%" r="80%">
          <stop offset="0%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="var(--color-background)" />
        </radialGradient>
        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="var(--color-gold)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`disc-${uid}`}>
          <circle cx="60" cy="60" r={r} />
        </clipPath>
      </defs>

      {/* soft glow */}
      <circle cx="60" cy="60" r="58" fill={`url(#halo-${uid})`} />

      {/* dark side */}
      <circle cx="60" cy="60" r={r} fill={`url(#dark-${uid})`} />

      {/* lit crescent / gibbous */}
      <path d={litPath} fill={`url(#lit-${uid})`} />

      {/* maria — subtle craters, clipped to the disc */}
      <g clipPath={`url(#disc-${uid})`} fill="var(--color-ink, #000)" opacity="0.1">
        <ellipse cx="48" cy="46" rx="11" ry="9" />
        <ellipse cx="72" cy="62" rx="8" ry="7" />
        <ellipse cx="55" cy="78" rx="6.5" ry="5" />
        <circle cx="78" cy="42" r="4" />
        <circle cx="42" cy="70" r="3" />
      </g>

      {/* rim + orbit ring */}
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-gold)" strokeOpacity="0.45" strokeWidth="1" />
      <circle
        cx="60"
        cy="60"
        r={r + 9}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="1.5 7"
        strokeLinecap="round"
      />
    </svg>
  );
}