import React from 'react';

// A gentle leaf-vein motif used as ambient background decoration.
export function LeafDecor({ className = '', style }) {
  return (
    <svg
      className={`decor-leaf ${className}`}
      style={style}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M100 10C40 40 20 100 40 160C60 190 140 190 160 160C180 100 160 40 100 10Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.35"
      />
      <path d="M100 15V185" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M100 40C80 55 65 70 55 90" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <path d="M100 70C80 85 65 100 55 120" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <path d="M100 100C80 115 68 128 60 145" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <path d="M100 40C120 55 135 70 145 90" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <path d="M100 70C120 85 135 100 145 120" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <path d="M100 100C120 115 132 128 140 145" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
    </svg>
  );
}

// A slowly-rotating DNA helix, purely decorative, evokes the biology theme
// without looking like a generic tech icon.
export function HelixDecor({ className = '', style }) {
  const rungs = Array.from({ length: 7 });
  return (
    <svg
      className={`decor-helix ${className}`}
      style={style}
      viewBox="0 0 120 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 10 C 20 45, 100 45, 100 90 C 100 135, 20 135, 20 180 C 20 215, 100 215, 100 250"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M100 10 C 100 45, 20 45, 20 90 C 20 135, 100 135, 100 180 C 100 215, 20 215, 20 250"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
      {rungs.map((_, i) => {
        const y = 25 + i * 33;
        return <line key={i} x1="26" y1={y} x2="94" y2={y} stroke="currentColor" strokeWidth="1.4" opacity="0.35" />;
      })}
    </svg>
  );
}

// A drifting biological cell, used as extra ambient decoration on richer
// sections (stats strip, CTA banner) so the page doesn't feel like a single
// repeated motif.
export function CellDecor({ className = '', style }) {
  return (
    <svg
      className={`decor-cell ${className}`}
      style={style}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="86" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="100" cy="100" r="34" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <circle cx="72" cy="70" r="10" fill="currentColor" opacity="0.18" />
      <circle cx="132" cy="120" r="14" fill="currentColor" opacity="0.14" />
      <circle cx="60" cy="130" r="7" fill="currentColor" opacity="0.16" />
      <circle cx="140" cy="66" r="6" fill="currentColor" opacity="0.16" />
    </svg>
  );
}

// A small molecule / bond diagram, used as a lightweight accent icon.
export function MoleculeDecor({ className = '', style }) {
  return (
    <svg
      className={`decor-molecule ${className}`}
      style={style}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="30" y1="30" x2="70" y2="70" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <line x1="70" y1="70" x2="115" y2="45" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <line x1="70" y1="70" x2="80" y2="115" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <line x1="70" y1="70" x2="25" y2="105" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <circle cx="30" cy="30" r="9" fill="currentColor" opacity="0.5" />
      <circle cx="70" cy="70" r="12" fill="currentColor" opacity="0.6" />
      <circle cx="115" cy="45" r="7" fill="currentColor" opacity="0.5" />
      <circle cx="80" cy="115" r="8" fill="currentColor" opacity="0.5" />
      <circle cx="25" cy="105" r="6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// A soft, blurred gradient blob used behind hero/CTA sections to add depth
// and motion without competing with the botanical line-art.
export function GlowBlob({ className = '', style }) {
  return <div className={`glow-blob ${className}`} style={style} aria-hidden="true" />;
}

export function Monogram({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="var(--green-900)" />
      <path
        d="M32 12C20 20 15 32 20 44C24 53 40 53 44 44C49 32 44 20 32 12Z"
        fill="none"
        stroke="var(--gold-400)"
        strokeWidth="1.6"
      />
      <path d="M32 16V50" stroke="var(--gold-400)" strokeWidth="1.2" opacity="0.8" />
      <text
        x="32"
        y="60"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontSize="9"
        fill="var(--cream-100)"
        opacity="0.9"
      >
        SB
      </text>
    </svg>
  );
}
