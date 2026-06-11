import React from 'react';
import {
  Landmark,    // Política
  TrendingUp,  // Economía
  Zap,         // Tecnología
  Trophy,      // Deportes
  Music2,      // Cultura
  LayoutGrid,  // Todos
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Política': {
    Icon: Landmark,
    color: '#60a5fa',       // azul real
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.25)',
    glow: 'rgba(96,165,250,0.15)',
  },
  'Economía': {
    Icon: TrendingUp,
    color: '#34d399',       // verde esmeralda
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.25)',
    glow: 'rgba(52,211,153,0.15)',
  },
  'Tecnología': {
    Icon: Zap,
    color: '#a78bfa',       // violeta
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.25)',
    glow: 'rgba(167,139,250,0.15)',
  },
  'Deportes': {
    Icon: Trophy,
    color: '#fbbf24',       // dorado/naranja
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.25)',
    glow: 'rgba(251,191,36,0.15)',
  },
  'Cultura': {
    Icon: Music2,
    color: '#f472b6',       // rosa
    bg: 'rgba(244,114,182,0.12)',
    border: 'rgba(244,114,182,0.25)',
    glow: 'rgba(244,114,182,0.15)',
  },
  'Todos': {
    Icon: LayoutGrid,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.2)',
    glow: 'rgba(148,163,184,0.10)',
  },
};

const DEFAULT = CATEGORY_CONFIG['Todos'];

/**
 * CategoryIcon — pill badge con ícono + etiqueta por categoría
 * @param {string}  category   — nombre de categoría
 * @param {boolean} showLabel  — mostrar texto junto al ícono (default: true)
 * @param {number}  iconSize   — tamaño del ícono en px (default: 13)
 * @param {'sm'|'md'} size     — tamaño del pill (default: 'sm')
 */
export default function CategoryIcon({ category, showLabel = true, iconSize = 13, size = 'sm' }) {
  const cfg = CATEGORY_CONFIG[category] || DEFAULT;
  const { Icon, color, bg, border } = cfg;

  const padding = size === 'md' ? '0.3rem 0.75rem' : '0.2rem 0.55rem';
  const fontSize = size === 'md' ? '0.8rem' : '0.72rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding,
        borderRadius: '9999px',
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
      {showLabel && category}
    </span>
  );
}

/** Export config so other components can use the accent colours */
export { CATEGORY_CONFIG };
