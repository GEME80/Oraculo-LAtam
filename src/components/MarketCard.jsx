import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Flame, Sparkles, Clock } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

/* ── helpers ─────────────────────────────────────── */

function getCountdown(closesAt) {
  if (!closesAt) return null;
  const diff = new Date(closesAt) - Date.now();
  if (diff <= 0) return { label: 'Cerrado', urgent: true };
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0)  return { label: `${days}d ${hours}h`, urgent: days < 2 };
  return { label: `${hours}h`, urgent: true };
}

/** Build a smooth area-chart path from an array of 0-1 values */
function buildAreaPath(values, w, h, pad = 4) {
  if (!values || values.length < 2) return { line: '', area: '' };
  const n  = values.length - 1;
  const xs = values.map((_, i) => pad + (i / n) * (w - pad * 2));
  const ys = values.map(v  => h - pad - v * (h - pad * 2));

  // Catmull-Rom → cubic bezier for smooth curve
  let line = `M ${xs[0]},${ys[0]}`;
  for (let i = 0; i < values.length - 1; i++) {
    const x0 = i > 0 ? xs[i - 1] : xs[0];
    const y0 = i > 0 ? ys[i - 1] : ys[0];
    const x1 = xs[i], y1 = ys[i];
    const x2 = xs[i + 1], y2 = ys[i + 1];
    const x3 = i < values.length - 2 ? xs[i + 2] : xs[i + 1];
    const y3 = i < values.length - 2 ? ys[i + 2] : ys[i + 1];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    line += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }

  const area = `${line} L ${xs[xs.length - 1]},${h - pad} L ${xs[0]},${h - pad} Z`;
  return { line, area, lastX: xs[xs.length - 1], lastY: ys[ys.length - 1] };
}

/** Seed deterministic mini history from market id (fallback when no DB data) */
function seedHistory(marketId, yesPriceNow) {
  const base = parseInt(marketId?.replace(/\D/g, '').slice(0, 6) || '42') % 30;
  return Array.from({ length: 8 }, (_, i) => {
    const noise = Math.sin(base + i * 0.9) * 12 + Math.cos(i * 1.3) * 8;
    return Math.min(95, Math.max(5, yesPriceNow + noise - i * 0.5));
  }).reverse();
}

/* ── component ───────────────────────────────────── */

export default function MarketCard({ market, onSelect }) {
  const {
    id, title, category, country, volume, yes_price, no_price, closes_at,
    created_at
  } = market;

  // Probabilities
  const sum     = (yes_price || 0) + (no_price || 0);
  const yesProb = sum > 0 ? Math.round((yes_price / sum) * 100) : 50;
  const noProb  = 100 - yesProb;

  // Countdown
  const countdown = getCountdown(closes_at);

  // Hot / New badges
  const isHot = volume > 15000;
  const isNew = created_at && (Date.now() - new Date(created_at)) < 48 * 3600000;

  // Mini chart history (seeded from market id, normalized 0-1)
  const history = useMemo(() => {
    const raw = seedHistory(id, yes_price);
    const mn = Math.min(...raw), mx = Math.max(...raw);
    return mx > mn ? raw.map(v => (v - mn) / (mx - mn)) : raw.map(() => 0.5);
  }, [id]);

  const rawHistory = useMemo(() => seedHistory(id, yes_price), [id]);

  // Trend: compare last two points
  const trendUp  = rawHistory[rawHistory.length - 1] >= rawHistory[rawHistory.length - 2];
  const changePct = rawHistory.length >= 2
    ? Math.abs(rawHistory[rawHistory.length - 1] - rawHistory[rawHistory.length - 2]).toFixed(1)
    : '0.0';

  // Price flash effect
  const prevYesRef = useRef(yes_price);
  const prevNoRef  = useRef(no_price);
  const [yesFlash, setYesFlash] = useState('');
  const [noFlash,  setNoFlash]  = useState('');

  useEffect(() => {
    const prev = prevYesRef.current;
    if (prev !== yes_price) {
      setYesFlash(yes_price > prev ? 'text-flash-up' : 'text-flash-down');
      const t = setTimeout(() => setYesFlash(''), 900);
      prevYesRef.current = yes_price;
      return () => clearTimeout(t);
    }
  }, [yes_price]);

  useEffect(() => {
    const prev = prevNoRef.current;
    if (prev !== no_price) {
      setNoFlash(no_price > prev ? 'text-flash-up' : 'text-flash-down');
      const t = setTimeout(() => setNoFlash(''), 900);
      prevNoRef.current = no_price;
      return () => clearTimeout(t);
    }
  }, [no_price]);

  // SVG chart
  const chartW = 260, chartH = 52;
  const { line, area, lastX, lastY } = buildAreaPath(history, chartW, chartH);
  const chartColor = trendUp ? 'hsl(155 75% 48%)' : 'hsl(355 82% 62%)';
  const gradId = `cg-${id}`;

  return (
    <div className="market-card-wrapper">
      <div className="market-card" onClick={() => onSelect(market, null)}>

        {/* ── Header row ── */}
        <div className="card-header">
          <div className="card-meta">
            <span className="country-flag" title={country}>{
              { CO: '🇨🇴', MX: '🇲🇽', AR: '🇦🇷', BR: '🇧🇷', CL: '🇨🇱', PE: '🇵🇪', LATAM: '🌎' }[country] || '🌎'
            }</span>
            <CategoryIcon category={category} showLabel={true} iconSize={11} size="sm" />
          </div>

          {/* Right side badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {isHot && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.65rem', fontWeight: 700, color: '#f97316',
                background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
                padding: '0.15rem 0.45rem', borderRadius: '9999px'
              }}>
                <Flame size={9} /> HOT
              </span>
            )}
            {isNew && !isHot && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa',
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
                padding: '0.15rem 0.45rem', borderRadius: '9999px'
              }}>
                <Sparkles size={9} /> NUEVO
              </span>
            )}
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: `hsl(var(--yes-color))`,
              background: 'hsl(var(--yes-bg))',
              border: '1px solid hsl(var(--yes-color) / 0.2)',
              padding: '0.15rem 0.45rem', borderRadius: '9999px',
              display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
            }}>
              <TrendingUp size={9} />
              {volume.toLocaleString()} Créditos
            </span>
          </div>
        </div>

        {/* ── Title ── */}
        <h3 className="card-title">{title}</h3>

        {/* ── Mini area trend chart ── */}
        <div style={{ width: '100%', marginBottom: '0.6rem', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ width: '100%', height: '52px', display: 'block', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={chartColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            {area && (
              <path d={area} fill={`url(#${gradId})`} />
            )}

            {/* Line */}
            {line && (
              <path
                d={line}
                fill="none"
                stroke={chartColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Animated pulse dot at last point */}
            {lastX != null && (
              <g>
                <circle cx={lastX} cy={lastY} r="5" fill={chartColor} opacity="0.15">
                  <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={lastX} cy={lastY} r="3.5" fill={chartColor} />
                <circle cx={lastX} cy={lastY} r="3.5" fill="none" stroke="hsl(var(--bg-card))" strokeWidth="1.5" />
              </g>
            )}
          </svg>

          {/* Trend badge top-right of chart */}
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.68rem',
            fontWeight: 800,
            color: trendUp ? 'hsl(155 75% 48%)' : 'hsl(355 82% 62%)',
            background: trendUp ? 'rgba(29,217,122,0.12)' : 'rgba(240,71,106,0.12)',
            border: `1px solid ${trendUp ? 'rgba(29,217,122,0.25)' : 'rgba(240,71,106,0.25)'}`,
            padding: '0.1rem 0.4rem',
            borderRadius: '9999px',
          }}>
            {trendUp
              ? <TrendingUp size={10} strokeWidth={2.5} />
              : <TrendingDown size={10} strokeWidth={2.5} />
            }
            {trendUp ? '+' : '-'}{changePct}%
          </span>
        </div>

        {/* ── Probability bar ── */}
        <div className="probability-bar-container" style={{ marginBottom: '0.7rem' }}>
          <div className="probability-bar-label">
            <span className="probability-bar-yes" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>{market.option_a_label || 'SÍ'} {yesProb}%</span>
            <span className="probability-bar-no" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>{market.option_b_label || 'NO'} {noProb}%</span>
          </div>
          <div className="probability-track">
            <div className="probability-fill-yes" style={{ width: `${yesProb}%` }} />
            <div className="probability-fill-no"  style={{ width: `${noProb}%` }} />
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="card-action-panel">
          <button
            className="odds-btn yes-btn"
            onClick={e => { e.stopPropagation(); onSelect(market, 'YES'); }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{market.option_a_label || 'SÍ'}</span>
            <span className={yesFlash} style={{ display: 'inline-block', minWidth: '34px', textAlign: 'center', flexShrink: 0 }}>
              {Math.round(yes_price)}¢
            </span>
          </button>

          <button
            className="odds-btn no-btn"
            onClick={e => { e.stopPropagation(); onSelect(market, 'NO'); }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{market.option_b_label || 'NO'}</span>
            <span className={noFlash} style={{ display: 'inline-block', minWidth: '34px', textAlign: 'center', flexShrink: 0 }}>
              {Math.round(no_price)}¢
            </span>
          </button>
        </div>

        {/* ── Countdown footer ── */}
        {countdown && (
          <div style={{
            marginTop: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: countdown.urgent ? 'hsl(30 95% 58%)' : 'hsl(var(--text-muted))',
          }}>
            <Clock size={11} strokeWidth={2} />
            Vence en {countdown.label}
            {countdown.urgent && (
              <span style={{
                display: 'inline-block',
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: 'hsl(30 95% 58%)',
                animation: 'countdownPulse 1.4s ease-in-out infinite',
                marginLeft: '2px'
              }} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
