import React, { useState, useEffect, useRef } from 'react';
import {
  X, TrendingUp, TrendingDown, AlertCircle, Sparkles,
  HelpCircle, CheckCircle2, ShieldAlert, Users, BarChart2,
  Calendar, ChevronDown, ChevronUp, ExternalLink, Clock, Zap, Target
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ─── Tooltip helper ───────────────────────────────────────────────
function Tip({ text, position = 'top' }) {
  return (
    <span className="info-tooltip-wrapper" style={{ marginLeft: '4px', cursor: 'help' }}>
      <HelpCircle size={13} style={{ color: 'hsl(var(--text-muted))', opacity: 0.7 }} />
      <span className={`info-tooltip-text tooltip-${position}`}>{text}</span>
    </span>
  );
}

// ─── Probability Hero ──────────────────────────────────────────────
function ProbabilityHero({ market, yesPrice, noPrice }) {
  const yesPct = Math.round(yesPrice);
  const noPct = Math.round(noPrice);
  const labelA = market.option_a_label || 'SÍ';
  const labelB = market.option_b_label || 'NO';

  return (
    <div style={{
      background: 'linear-gradient(135deg, hsl(var(--bg-elevated) / 0.6), hsl(var(--bg-card) / 0.4))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.875rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Target size={14} style={{ color: 'hsl(var(--brand))' }} />
        ¿Qué dice el mercado hoy?
        <Tip text="Esta estimación representa la probabilidad calculada en base a las transacciones de todos los participantes. A mayor porcentaje, mayor probabilidad percibida." />
      </div>

      {/* Main numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{
          background: 'hsl(var(--yes-bg) / 0.15)',
          border: '2px solid hsl(var(--yes-color) / 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--yes-color))', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            {labelA}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'hsl(var(--yes-color))', lineHeight: 1 }}>
            {yesPct}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
            de probabilidad
          </div>
        </div>
        <div style={{
          background: 'hsl(var(--no-bg) / 0.15)',
          border: '2px solid hsl(var(--no-color) / 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--no-color))', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            {labelB}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'hsl(var(--no-color))', lineHeight: 1 }}>
            {noPct}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
            de probabilidad
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div>
        <div style={{ height: '12px', borderRadius: '999px', overflow: 'hidden', background: 'hsl(var(--border))', display: 'flex' }}>
          <div style={{
            width: `${yesPct}%`,
            height: '100%',
            background: 'hsl(var(--yes-color))',
            transition: 'width 0.5s ease'
          }} />
          <div style={{
            width: `${noPct}%`,
            height: '100%',
            background: 'hsl(var(--no-color))',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.35rem', fontWeight: 600 }}>
          <span>← {labelA} ({yesPct}%)</span>
          <span>({noPct}%) {labelB} →</span>
        </div>
      </div>

      {/* Explanatory text */}
      <div style={{
        fontSize: '0.75rem',
        color: 'hsl(var(--text-muted))',
        lineHeight: '1.4',
        textAlign: 'center',
        padding: '0.5rem 0.75rem',
        background: 'hsl(var(--bg-app))',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed hsl(var(--border))'
      }}>
        Esto significa que los inversores creen que hay un <strong style={{ color: 'hsl(var(--yes-color))' }}>{yesPct}%</strong> de probabilidad de que ocurra <strong style={{ color: 'hsl(var(--yes-color))' }}>{labelA}</strong>.
      </div>
    </div>
  );
}

// ─── Activity Block ────────────────────────────────────────────────
function ActivityBlock({ market, participantCount }) {
  const volumeNum = parseFloat(market.volume || 0);
  const createdAt = market.created_at ? new Date(market.created_at) : null;
  const daysAgo = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div style={{
      background: 'hsl(var(--bg-app))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <BarChart2 size={13} style={{ color: 'hsl(var(--brand))' }} />
        Actividad de esta pregunta
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} style={{ color: 'hsl(var(--brand))' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{participantCount}</div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>participantes</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} style={{ color: 'hsl(var(--brand))' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{volumeNum.toLocaleString()}</div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>créditos en juego</div>
          </div>
        </div>
        {daysAgo !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'hsl(var(--brand))' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{daysAgo === 0 ? 'Hoy' : `Hace ${daysAgo}d`}</div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>publicada</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
export default function MarketDetailModal({ market, initialOutcome, isOpen, onClose, userProfile, onTradeComplete, allUserPositions = [], onRequestLogin }) {
  const dialogRef = useRef(null);
  const [outcome, setOutcome] = useState('YES');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [historyPoints, setHistoryPoints] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);
  const [timeframe, setTimeframe] = useState('Todo el período');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  // Calculate participant counts dynamically from props
  const marketPos = allUserPositions.filter(p => p.market_id === market?.id);
  const yesInvestors = marketPos.filter(p => parseFloat(p.yes_shares) > 0).length;
  const noInvestors = marketPos.filter(p => parseFloat(p.no_shares) > 0).length;
  const participantCount = yesInvestors + noInvestors;

  // Limit order states (advanced)
  const [limitPrice, setLimitPrice] = useState(50);
  const [limitContracts, setLimitContracts] = useState('100');
  const [orderType, setOrderType] = useState('market');

  // Claim/dispute states
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [justification, setJustification] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [claimedOutcome, setClaimedOutcome] = useState('YES');
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [hasPendingClaim, setHasPendingClaim] = useState(false);

  useEffect(() => {
    if (isOpen && market) {
      dialogRef.current?.showModal();
      setOutcome(initialOutcome || 'YES');
      setAmount('');
      setErrorMsg('');
      setIsConfirming(false);
      setActiveHoverIdx(null);
      setOrderType('market');
      setShowAdvanced(false);
      setLimitPrice(Math.round(initialOutcome === 'NO' ? market.no_price : market.yes_price));
      setLimitContracts('100');
      setTimeframe('Todo el período');
      setShowClaimForm(false);
      setJustification('');
      setEvidenceUrl('');
      setClaimedOutcome('YES');
      setClaimSubmitted(false);
      setHasPendingClaim(false);
      if (userProfile) {
        checkPendingClaim(userProfile.id, market.id);
      }
    } else if (!isOpen) {
      dialogRef.current?.close();
    }
  }, [isOpen, initialOutcome, market, userProfile]);

  useEffect(() => {
    if (market) {
      setLimitPrice(Math.round(outcome === 'YES' ? market.yes_price : market.no_price));
    }
  }, [outcome, market]);

  useEffect(() => {
    if (isOpen && market) {
      fetchPriceHistory();
    }
  }, [isOpen, market]);

  const checkPendingClaim = async (profileId, marketId) => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('profile_id', profileId)
        .eq('market_id', marketId)
        .eq('status', 'pending');
      if (!error && data && data.length > 0) setHasPendingClaim(true);
    } catch (e) {
      console.error('Error checking pending claim:', e);
    }
  };

  const handleSaveClaim = async (e) => {
    e.preventDefault();
    if (!userProfile || !market) return;
    if (!justification.trim()) {
      setErrorMsg('Por favor ingresa una justificación para tu reclamación.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const { error } = await supabase.from('claims').insert({
        profile_id: userProfile.id,
        username: userProfile.username,
        market_id: market.id,
        market_title: market.title,
        justification,
        evidence_url: evidenceUrl,
        claimed_outcome: claimedOutcome,
        status: 'pending',
        admin_notes: '',
        created_at: new Date().toISOString(),
        resolved_at: null
      });
      if (error) throw error;
      setClaimSubmitted(true);
      setHasPendingClaim(true);
      setShowClaimForm(false);
    } catch (err) {
      console.error('Error submitting claim:', err);
      setErrorMsg('Error al enviar la reclamación. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('market_price_history')
        .select('*')
        .eq('market_id', market.id)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setHistoryPoints(data);
      } else {
        const seed = market.id.charCodeAt(0) || 42;
        const yp = market.yes_price;
        const pts = [
          Math.min(90, Math.max(10, yp - (seed % 15) + 5)),
          Math.min(90, Math.max(10, yp - (seed % 15) + 5 + (seed % 10) - 5)),
          Math.min(90, Math.max(10, yp - (seed % 15) + 5 + (seed % 10) - 5 - (seed % 12) + 6)),
          Math.min(90, Math.max(10, yp - (seed % 15) + 5 + (seed % 10) - 5 - (seed % 12) + 6 + (seed % 8) - 3)),
          yp
        ].map((val, idx) => {
          const d = new Date();
          d.setDate(d.getDate() - (4 - idx));
          return { created_at: d.toISOString(), yes_price: val, no_price: 100 - val };
        });
        setHistoryPoints(pts);
      }
    } catch (e) {
      console.error('Error fetching price history:', e);
    }
  };

  if (!market) return null;

  const yesPrice = market.yes_price;
  const noPrice = market.no_price;
  const currentPrice = outcome === 'YES' ? yesPrice : noPrice;
  const totalInv = yesInvestors + noInvestors;
  const yesPct = totalInv > 0 ? Math.round((yesInvestors / totalInv) * 100) : Math.round(yesPrice);
  const noPct = totalInv > 0 ? 100 - yesPct : Math.round(noPrice);
  const labelA = market.option_a_label || 'SÍ';
  const labelB = market.option_b_label || 'NO';

  const parseDate = (d, fallback) => {
    if (!d) return fallback;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };
  const now = new Date();
  const startDate = parseDate(market.start_date, new Date(market.created_at || now));
  const endDate = parseDate(market.end_date, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  const hasStarted = now >= startDate;
  const hasEnded = now >= endDate;
  const isTradingAllowed = hasStarted && !hasEnded && market.status === 'active';

  const sharePrice = currentPrice / 100;
  const sharesToReceive = amount ? parseFloat(amount) / sharePrice : 0;
  const potentialPayout = sharesToReceive;
  const potentialProfit = amount ? potentialPayout - parseFloat(amount) : 0;

  const poolWeight = parseFloat(market.volume) + 2000;
  const priceImpact = amount ? (parseFloat(amount) / poolWeight) * 45 : 0;

  const getScaledHistory = (rawHistory, targetYes) => {
    if (!rawHistory || rawHistory.length === 0) return [];
    const lastRawYes = parseFloat(rawHistory[rawHistory.length - 1].yes_price || 50);
    
    if (targetYes >= 50) {
      if (lastRawYes === 0) {
        return rawHistory.map(pt => ({ ...pt, yes_price: targetYes, no_price: 100 - targetYes }));
      }
      const factor = targetYes / lastRawYes;
      return rawHistory.map((pt, idx) => {
        if (idx === rawHistory.length - 1) {
          return { ...pt, yes_price: targetYes, no_price: 100 - targetYes };
        }
        const scaledYes = Math.min(100, Math.max(0, parseFloat(pt.yes_price) * factor));
        return { ...pt, yes_price: scaledYes, no_price: 100 - scaledYes };
      });
    } else {
      const targetNo = 100 - targetYes;
      const lastRawNo = 100 - lastRawYes;
      if (lastRawNo === 0) {
        return rawHistory.map(pt => ({ ...pt, yes_price: targetYes, no_price: 100 - targetYes }));
      }
      const factor = targetNo / lastRawNo;
      return rawHistory.map((pt, idx) => {
        if (idx === rawHistory.length - 1) {
          return { ...pt, yes_price: targetYes, no_price: 100 - targetYes };
        }
        const scaledNo = Math.min(100, Math.max(0, (100 - parseFloat(pt.yes_price)) * factor));
        return { ...pt, yes_price: 100 - scaledNo, no_price: scaledNo };
      });
    }
  };

  const scaledHistoryPoints = getScaledHistory(historyPoints, yesPct);

  const getFilteredHistory = () => {
    if (scaledHistoryPoints.length === 0) return [];
    const currTime = new Date();
    return scaledHistoryPoints.filter(pt => {
      const ptDate = new Date(pt.created_at);
      if (timeframe === 'Día') return (currTime - ptDate) <= 24 * 60 * 60 * 1000;
      if (timeframe === 'Semana') return (currTime - ptDate) <= 7 * 24 * 60 * 60 * 1000;
      return true; // Todo el período
    });
  };

  const filteredHistory = getFilteredHistory();

  const svgWidth = 450;
  const svgHeight = 120;
  const graphHeight = 100;

  const pathYesD = filteredHistory.map((pt, idx) => {
    const denom = filteredHistory.length > 1 ? filteredHistory.length - 1 : 1;
    const x = 40 + (idx / denom) * 400;
    const y = graphHeight - (parseFloat(pt.yes_price) / 100) * graphHeight;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const pathNoD = filteredHistory.map((pt, idx) => {
    const denom = filteredHistory.length > 1 ? filteredHistory.length - 1 : 1;
    const x = 40 + (idx / denom) * 400;
    const y = graphHeight - (parseFloat(pt.no_price) / 100) * graphHeight;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const getXAxisLabels = () => {
    if (filteredHistory.length === 0) return [];
    
    const formatDateLabel = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      if (timeframe === 'Día') {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        const formatted = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        return formatted.replace('.', '');
      }
    };

    if (filteredHistory.length <= 6) {
      return filteredHistory.map((pt, idx) => ({
        x: 40 + (idx / (filteredHistory.length - 1 || 1)) * 400,
        text: formatDateLabel(pt.created_at)
      }));
    }
    
    const indices = [];
    const step = (filteredHistory.length - 1) / 4;
    for (let i = 0; i < 5; i++) {
      indices.push(Math.round(i * step));
    }
    return indices.map(idx => {
      const pt = filteredHistory[idx];
      return {
        x: 40 + (idx / (filteredHistory.length - 1)) * 400,
        text: formatDateLabel(pt?.created_at)
      };
    });
  };

  const getTrendStats = () => {
    if (!filteredHistory || filteredHistory.length < 2) return { yesChange: '0.0', noChange: '0.0', yesUp: true, noUp: false };
    const firstPt = filteredHistory[0];
    const lastPt = filteredHistory[filteredHistory.length - 1];
    const yesDiff = parseFloat(lastPt.yes_price) - parseFloat(firstPt.yes_price);
    const noDiff = parseFloat(lastPt.no_price) - parseFloat(firstPt.no_price);
    return {
      yesChange: Math.abs(yesDiff).toFixed(1),
      noChange: Math.abs(noDiff).toFixed(1),
      yesUp: yesDiff >= 0,
      noUp: noDiff >= 0
    };
  };
  const stats = getTrendStats();

  const getTimeframeLabel = (tf) => {
    if (tf === 'Día') return 'hoy';
    if (tf === 'Semana') return 'esta semana';
    return 'en el período';
  };

  // Limit order
  const limitCost = (parseFloat(limitPrice) * parseFloat(limitContracts)) / 100;
  const isLimitInsufficient = limitCost > userProfile?.orc_balance;

  const handleTrade = async (e) => {
    e.preventDefault();

    if (orderType === 'limit') {
      if (!limitPrice || !limitContracts || isSubmitting) return;
      const lp = parseFloat(limitPrice);
      const lc = parseFloat(limitContracts);
      if (isNaN(lp) || lp < 1 || lp > 99) { setErrorMsg('El precio debe estar entre 1 y 99.'); return; }
      if (isNaN(lc) || lc <= 0) { setErrorMsg('Indica una cantidad de contratos válida.'); return; }
      if (isLimitInsufficient) { setErrorMsg('Saldo insuficiente para esta orden.'); return; }
      if (!isConfirming) { setIsConfirming(true); setErrorMsg(''); return; }
      setIsSubmitting(true);
      setErrorMsg('');
      try {
        const { error: limitError } = await supabase.from('limit_orders').insert({
          profile_id: userProfile.id,
          market_id: market.id,
          outcome,
          limit_price: lp,
          contract_count: lc,
          status: 'pending'
        });
        if (limitError) throw limitError;
        await onTradeComplete({ market_id: market.id, type: 'limit' });
        setIsConfirming(false);
        onClose();
      } catch (err) {
        console.error(err);
        setErrorMsg('Error al colocar la orden. Reintenta.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Market order
    if (!amount || isSubmitting) return;
    const points = parseFloat(amount);
    if (isNaN(points) || points <= 0) { setErrorMsg('Por favor ingresa un monto válido.'); return; }
    if (points > userProfile.orc_balance) { setErrorMsg('Saldo insuficiente de créditos.'); return; }
    if (!isConfirming) { setIsConfirming(true); setErrorMsg(''); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const sharesCount = points / (currentPrice / 100);
      const yesChange = outcome === 'YES' ? priceImpact : -priceImpact;
      const newYesPrice = Math.min(99, Math.max(1, yesPrice + yesChange));
      const newNoPrice = 100 - newYesPrice;
      await onTradeComplete({
        market_id: market.id,
        outcome,
        type: 'buy',
        shares_count: sharesCount,
        points_paid: points,
        new_yes_price: newYesPrice,
        new_no_price: newNoPrice,
        new_volume: parseFloat(market.volume) + points
      });
      setIsConfirming(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al procesar la predicción. Reintenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge
  const getStatusBadge = () => {
    if (market.status === 'resolved_yes' || market.status === 'resolved_no') {
      return { label: '✅ Resuelta', bg: 'hsl(var(--yes-bg) / 0.2)', color: 'hsl(var(--yes-color))' };
    }
    if (!isTradingAllowed && hasEnded) {
      return { label: '🔒 Cerrada', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    }
    if (!hasStarted) {
      return { label: '⏳ Próximamente', bg: 'hsl(var(--bg-elevated))', color: 'hsl(var(--text-muted))' };
    }
    return { label: '🟢 Activa', bg: 'hsl(var(--yes-bg) / 0.15)', color: 'hsl(var(--yes-color))' };
  };
  const badge = getStatusBadge();

  const QUICK_AMOUNTS = [50, 100, 250, 500];

  return (
    <dialog ref={dialogRef} className="trading-modal" onClose={onClose} style={{ maxWidth: '860px', width: '95%' }}>
      {/* ── Header ── */}
      <div className="modal-header" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: badge.bg,
              color: badge.color,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap'
            }}>{badge.label}</span>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} />
              Cierra: {endDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              <Tip text="Esta es la fecha en que se conocerá el resultado oficial y se distribuirán las ganancias a quienes acertaron." position="bottom" />
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.3 }}>{market.title}</h2>
        </div>
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="detail-split-layout">

        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Probability Hero */}
          <ProbabilityHero market={market} yesPrice={yesPct} noPrice={noPct} />

          {/* Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <TrendingUp size={13} style={{ color: 'hsl(var(--brand))' }} />
                Evolución de probabilidades
                <Tip text="Cómo ha cambiado la opinión del mercado a lo largo del tiempo. Una línea que sube indica que más personas creen que ese resultado ocurrirá." />
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['Día', 'Semana', 'Todo el período'].map(tf => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    style={{
                      background: timeframe === tf ? 'hsl(var(--brand))' : 'hsl(var(--bg-app))',
                      color: timeframe === tf ? 'white' : 'hsl(var(--text-muted))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >{tf}</button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              {activeHoverIdx !== null && filteredHistory[activeHoverIdx] && (
                <div style={{
                  position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                  background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.5rem',
                  fontSize: '0.65rem', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', gap: '0.75rem', pointerEvents: 'none', zIndex: 10,
                  fontWeight: 'bold', color: 'hsl(var(--text-main))'
                }}>
                  <span style={{ color: 'hsl(var(--yes-color))' }}>{labelA}: {Math.round(filteredHistory[activeHoverIdx].yes_price)}%</span>
                  <span style={{ color: 'hsl(var(--no-color))' }}>{labelB}: {Math.round(filteredHistory[activeHoverIdx].no_price)}%</span>
                </div>
              )}
              <div className="chart-container" style={{ margin: '0.5rem 0' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                     <linearGradient id="yes-mdl-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--yes-color))" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="hsl(var(--yes-color))" stopOpacity="0.01" />
                    </linearGradient>
                    <linearGradient id="no-mdl-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--no-color))" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="hsl(var(--no-color))" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines and Y-Axis Labels */}
                  <line x1="40" y1="0" x2="440" y2="0" stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.4" strokeWidth="1" />
                  <line x1="40" y1="25" x2="440" y2="25" stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.4" strokeWidth="1" />
                  <line x1="40" y1="50" x2="440" y2="50" stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.7" strokeWidth="1" />
                  <line x1="40" y1="75" x2="440" y2="75" stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.4" strokeWidth="1" />
                  <line x1="40" y1="100" x2="440" y2="100" stroke="hsl(var(--border))" strokeDasharray="3 3" opacity="0.4" strokeWidth="1" />
                  <line x1="40" y1="0" x2="40" y2="100" stroke="hsl(var(--border))" strokeWidth="1" />
                  
                  <text x="5" y="10" fontSize="8.5" fill="hsl(var(--text-muted))" fontWeight="bold">100%</text>
                  <text x="5" y="28" fontSize="8" fill="hsl(var(--text-light))">75%</text>
                  <text x="5" y="53" fontSize="8" fill="hsl(var(--text-light))">50%</text>
                  <text x="5" y="78" fontSize="8" fill="hsl(var(--text-light))">25%</text>
                  <text x="5" y="98" fontSize="8.5" fill="hsl(var(--text-muted))" fontWeight="bold">0%</text>

                  {/* X-Axis Baseline */}
                  <line x1="40" y1="100" x2="440" y2="100" stroke="hsl(var(--border))" strokeWidth="1" />

                  {/* X-Axis Ticks & Labels */}
                  {getXAxisLabels().map((label, idx) => (
                    <g key={idx}>
                      <line x1={label.x} y1="100" x2={label.x} y2="104" stroke="hsl(var(--border))" strokeWidth="1" />
                      <text x={label.x} y="115" fontSize="8" fill="hsl(var(--text-muted))" textAnchor="middle" fontWeight="600">{label.text}</text>
                    </g>
                  ))}

                  {pathYesD.trim() && (
                    <>
                      <path d={`${pathYesD} L 440 ${graphHeight} L 40 ${graphHeight} Z`} fill="url(#yes-mdl-g)" />
                      <path d={pathYesD} fill="none" stroke="hsl(var(--yes-color))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                  <g>
                    {/* Ring 1: Large slow pulse */}
                    <circle cx="440" cy={graphHeight - (yesPct / 100) * graphHeight} r="7" fill="hsl(var(--yes-color))" opacity="0.25">
                      <animate attributeName="r" values="6;13;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Ring 2: Medium faster pulse */}
                    <circle cx="440" cy={graphHeight - (yesPct / 100) * graphHeight} r="5" fill="hsl(var(--yes-color))" opacity="0.4">
                      <animate attributeName="r" values="4;9;4" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    {/* Core dot */}
                    <circle cx="440" cy={graphHeight - (yesPct / 100) * graphHeight} r="4" fill="hsl(var(--yes-color))" stroke="white" strokeWidth="1.5" />
                  </g>
                  {pathNoD.trim() && (
                    <>
                      <path d={`${pathNoD} L 440 ${graphHeight} L 40 ${graphHeight} Z`} fill="url(#no-mdl-g)" />
                      <path d={pathNoD} fill="none" stroke="hsl(var(--no-color))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                  <g>
                    {/* Ring 1: Large slow pulse */}
                    <circle cx="440" cy={graphHeight - (noPct / 100) * graphHeight} r="7" fill="hsl(var(--no-color))" opacity="0.25">
                      <animate attributeName="r" values="6;13;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Ring 2: Medium faster pulse */}
                    <circle cx="440" cy={graphHeight - (noPct / 100) * graphHeight} r="5" fill="hsl(var(--no-color))" opacity="0.4">
                      <animate attributeName="r" values="4;9;4" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    {/* Core dot */}
                    <circle cx="440" cy={graphHeight - (noPct / 100) * graphHeight} r="4" fill="hsl(var(--no-color))" stroke="white" strokeWidth="1.5" />
                  </g>
                  {filteredHistory.map((_, idx) => {
                    const denom = filteredHistory.length > 1 ? filteredHistory.length - 1 : 1;
                    const x = 40 + (idx / denom) * 400;
                    return (
                      <g key={idx}>
                        {activeHoverIdx === idx && (
                          <line x1={x} y1={0} x2={x} y2={graphHeight} stroke="hsl(var(--text-muted))" strokeDasharray="2 2" strokeWidth="1.2" />
                        )}
                        <rect x={x - 15} y={0} width={30} height={graphHeight} fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setActiveHoverIdx(idx)}
                          onMouseLeave={() => setActiveHoverIdx(null)} />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Chart legend — simplified */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem', fontWeight: 700, justifyContent: 'center', marginTop: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--yes-color))' }}>
                {stats.yesUp ? '📈' : '📉'} {labelA} {stats.yesUp ? 'subió' : 'bajó'} {stats.yesChange}% {getTimeframeLabel(timeframe)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--no-color))' }}>
                {stats.noUp ? '📈' : '📉'} {labelB} {stats.noUp ? 'subió' : 'bajó'} {stats.noChange}% {getTimeframeLabel(timeframe)}
              </span>
            </div>
          </div>

          {/* Activity block */}
          <ActivityBlock market={market} participantCount={participantCount} />

          {/* Rules — friendly language */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowHowItWorks(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.25rem 0'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                📋 ¿Cómo se decide el resultado?
                <Tip text="Aquí explicamos qué tiene que pasar para que una opción gane, y de dónde viene la información oficial." />
              </span>
              {showHowItWorks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHowItWorks && (
              <div style={{
                background: 'hsl(var(--bg-app))',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid hsl(var(--border))',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ fontSize: '0.825rem', lineHeight: 1.5, color: 'hsl(var(--text-main))' }}>
                  {market.description}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.75rem' }}>
                  {market.resolution_source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem' }}>
                      <span style={{ marginRight: '0.25rem' }}>🌐</span>
                      <strong style={{ color: 'hsl(var(--text-main))' }}>Fuente oficial:</strong>
                      <a href={market.resolution_source} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'hsl(var(--brand))', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {(() => {
                          try {
                            return new URL(market.resolution_source).hostname;
                          } catch (e) {
                            return 'Ver sitio oficial';
                          }
                        })()} <ExternalLink size={11} />
                      </a>
                      <Tip text="Esta es la página o entidad oficial de donde se tomarán los datos finales para determinar el resultado." />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'hsl(var(--text-muted))' }}>
                    <span style={{ marginRight: '0.25rem' }}>📅</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>Se cierra el:</strong>
                    <span>{endDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <Tip text="Fecha límite en la que se detiene la predicción y se espera el resultado definitivo." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'hsl(var(--text-muted))' }}>
                    <span style={{ marginRight: '0.25rem' }}>🟢</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>Si aciertas:</strong>
                    <span>ganas 1.00 Crédito (100¢) por cada contrato (comprado hoy a 🪙 {currentPrice}¢)</span>
                    <Tip text="Cada predicción correcta te paga 1.00 Crédito (100¢) al finalizar el mercado. Tu ganancia neta es la diferencia entre el 1.00 Crédito y lo que pagaste hoy." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'hsl(var(--text-muted))' }}>
                    <span style={{ marginRight: '0.25rem' }}>🔴</span>
                    <strong style={{ color: 'hsl(var(--text-main))' }}>Si no aciertas:</strong>
                    <span>no recuperas lo invertido (el contrato vale 0.00 Créditos)</span>
                    <Tip text="Si tu predicción resulta incorrecta, los contratos comprados pierden todo su valor y recibirás 0.00 créditos." />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="modal-right-col">

          {!userProfile ? (
            /* Guest mode: show CTA to sign in */
            <div className="trading-interface" style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              padding: '2.5rem 1.5rem',
              background: 'linear-gradient(145deg, hsl(var(--brand) / 0.08), hsl(var(--bg-elevated) / 0.2))',
              border: '1px solid hsl(var(--brand) / 0.25)', borderRadius: 'var(--radius-lg)',
              textAlign: 'center', gap: '1.25rem', minHeight: '320px'
            }}>
              <div style={{
                background: 'hsl(var(--brand) / 0.12)', color: 'hsl(var(--brand))',
                width: '72px', height: '72px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid hsl(var(--brand) / 0.3)',
                fontSize: '2rem'
              }}>
                🔮
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '280px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'hsl(var(--text-main))', lineHeight: 1.3 }}>
                  ¡Predice y gana créditos!
                </span>
                <p style={{ fontSize: '0.83rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.55 }}>
                  Crea una cuenta gratuita o inicia sesión para participar en este mercado y ganar créditos con tus predicciones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); onRequestLogin && onRequestLogin(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: 'hsl(var(--brand))',
                  color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 2rem',
                  fontWeight: 800, fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px hsl(var(--brand) / 0.4)',
                  transition: 'transform 0.15s, opacity 0.15s',
                  width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                🚀 Iniciar Sesión / Registrarse
              </button>
              <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                Es gratis. Empiezas con 1,000 créditos.
              </span>
            </div>
          ) : userProfile?.role === 'admin' ? (
            /* Admin view */
            <div className="trading-interface" style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              padding: '2.5rem 1.5rem', background: 'hsl(var(--bg-elevated) / 0.15)',
              border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius-lg)',
              textAlign: 'center', gap: '1.25rem', minHeight: '320px'
            }}>
              <div style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsl(var(--brand) / 0.2)' }}>
                <ShieldAlert size={32} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'hsl(var(--text-main))' }}>Modo de Supervisión</span>
                <p style={{ fontSize: '0.825rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.5 }}>
                  Como administrador, actúas como auditor y curador. No participas en la compraventa de posiciones.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTrade} className="trading-interface">

              {/* Resolved market banner */}
              {(market.status === 'resolved_yes' || market.status === 'resolved_no') && (
                <div style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', padding: '1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.8rem', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '1rem', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>Esta pregunta ya fue resuelta</span>
                  </div>
                  <span>El resultado oficial fue:{' '}
                    <strong style={{ background: market.status === 'resolved_yes' ? 'hsl(var(--yes-bg))' : 'hsl(var(--no-bg))', color: market.status === 'resolved_yes' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', padding: '0.15rem 0.5rem', borderRadius: '4px', marginLeft: '0.25rem', fontSize: '0.75rem' }}>
                      {market.status === 'resolved_yes' ? labelA : labelB}
                    </strong>
                  </span>
                  {userProfile && (
                    <div style={{ borderTop: '1px solid rgba(245,158,11,0.15)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      {hasPendingClaim || claimSubmitted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(var(--yes-color))', fontWeight: 700, fontSize: '0.75rem' }}>
                          <CheckCircle2 size={14} />
                          <span>Ya tienes una reclamación pendiente. Visita la pestaña "Reclamaciones" para seguir su estado.</span>
                        </div>
                      ) : !showClaimForm ? (
                        <button type="button" onClick={() => setShowClaimForm(true)} style={{ width: '100%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                          Impugnar Resolución
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '0.25rem' }}>¿Cuál debió ser la opción ganadora?</label>
                            <select value={claimedOutcome} onChange={(e) => setClaimedOutcome(e.target.value)} style={{ width: '100%', padding: '0.4rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <option value="YES">{labelA}</option>
                              <option value="NO">{labelB}</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '0.25rem' }}>¿Por qué crees que el resultado es incorrecto?</label>
                            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Describe los hechos y aporta la fuente que contradice la resolución..." rows={3} style={{ width: '100%', padding: '0.4rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.75rem', resize: 'vertical' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '0.25rem' }}>Enlace a la fuente oficial (opcional)</label>
                            <input type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.4rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.75rem' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowClaimForm(false)} style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))', padding: '0.3rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button type="button" onClick={handleSaveClaim} disabled={isSubmitting} style={{ background: '#f59e0b', color: 'hsl(var(--bg-app))', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}>
                              {isSubmitting ? 'Enviando...' : 'Enviar Impugnación'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Not yet open / closed banner */}
              {market.status === 'active' && !isTradingAllowed && (
                <div style={{ background: 'hsl(var(--no-bg) / 0.1)', color: 'hsl(var(--no-color))', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid hsl(var(--no-color) / 0.15)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{!hasStarted ? `Esta pregunta aún no está abierta. Las predicciones inician el ${startDate.toLocaleString()}.` : `Esta pregunta ya cerró el ${endDate.toLocaleString()}.`}</span>
                </div>
              )}

              {/* Outcome selector */}
              {(() => {
                const displayLabelA = (labelA.toUpperCase() === 'SÍ' || labelA.toUpperCase() === 'YES') ? 'SÍ ocurre' : `"${labelA}"`;
                const displayLabelB = (labelB.toUpperCase() === 'NO' || labelB.toUpperCase() === 'NO') ? 'NO ocurre' : `"${labelB}"`;
                
                return (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      ¿Cuál crees que va a ocurrir?
                      <Tip text="Elige la opción que crees que va a ocurrir cuando se cierre la pregunta." position="right" />
                    </div>
                    <div className="outcome-selector">
                      <button
                        type="button"
                        className={outcome === 'YES' ? 'selected-yes' : ''}
                        onClick={() => setOutcome('YES')}
                        disabled={!isTradingAllowed || isConfirming}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.75rem 0.5rem' }}
                      >
                        <span style={{ fontSize: '0.825rem', fontWeight: 800 }}>🟢 Apostar que {displayLabelA}</span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>Probabilidad: {yesPct}%</span>
                      </button>
                      <button
                        type="button"
                        className={outcome === 'NO' ? 'selected-no' : ''}
                        onClick={() => setOutcome('NO')}
                        disabled={!isTradingAllowed || isConfirming}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.75rem 0.5rem' }}
                      >
                        <span style={{ fontSize: '0.825rem', fontWeight: 800 }}>🔴 Apostar que {displayLabelB}</span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>Probabilidad: {noPct}%</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Amount input */}
              <div className="trade-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="amount" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ¿Cuánto quieres invertir?
                    <Tip text="Esta es la cantidad de créditos que arriesgas en esta predicción. Solo se descuenta si confirmas." />
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                    Tu saldo: <strong style={{ color: 'hsl(var(--text-main))' }}>{userProfile?.orc_balance?.toLocaleString()} Créditos</strong>
                  </span>
                </div>
                {/* Quick chips */}
                <div style={{ display: 'flex', gap: '0.4rem', margin: '0.4rem 0' }}>
                  {QUICK_AMOUNTS.map(q => (
                    <button
                      key={q}
                      type="button"
                      disabled={!isTradingAllowed || isConfirming || q > userProfile?.orc_balance}
                      onClick={() => setAmount(String(q))}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: amount === String(q) ? 'hsl(var(--brand))' : 'hsl(var(--bg-app))',
                        color: amount === String(q) ? 'white' : 'hsl(var(--text-muted))',
                        border: `1px solid ${amount === String(q) ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        opacity: q > (userProfile?.orc_balance || 0) ? 0.4 : 1
                      }}
                    >{q}</button>
                  ))}
                </div>
                <div className="input-wrapper">
                  <input
                    id="amount"
                    type="number"
                    placeholder="0"
                    min="1"
                    max={userProfile?.orc_balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={!isTradingAllowed || isConfirming}
                  />
                  <span className="input-suffix">Créditos</span>
                </div>
              </div>

              {/* Simple summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="trade-summary-card">
                  <div className="summary-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      💰 Si aciertas, recibirás
                      <Tip text={`Si el resultado es "${outcome === 'YES' ? labelA : labelB}", recibes esta cantidad de créditos de vuelta. Cada contrato se pagará a 100 Créditos.`} position="top" />
                    </span>
                    <span className="return-value" style={{ color: 'hsl(var(--yes-color))', fontWeight: 800 }}>
                      {sharesToReceive.toFixed(0)} Créditos
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      📈 Ganancia neta si aciertas
                      <Tip text="La ganancia neta estimada que obtendrás si tu predicción resulta correcta (valor a recibir menos monto invertido)." position="top" />
                    </span>
                    <span className="value" style={{ color: 'hsl(var(--yes-color))', fontWeight: 700 }}>
                      +{potentialProfit.toFixed(0)} Créditos
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      📊 Probabilidad actual
                      <Tip text="El porcentaje actual de probabilidad implícita del mercado para tu opción elegida." position="top" />
                    </span>
                    <span className="value">{Math.round(currentPrice)}%</span>
                  </div>
                  <div className="summary-row" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                      📅 Resultado final
                      <Tip text="La fecha en la que se cierra el mercado y se distribuyen los créditos a las predicciones acertadas." position="top" />
                    </span>
                    <span className="value">{endDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--no-color))', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isConfirming ? (
                <button
                  type="submit"
                  className={`submit-trade-btn ${outcome === 'YES' ? 'buy-yes' : 'buy-no'}`}
                  disabled={isSubmitting || !isTradingAllowed || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > userProfile?.orc_balance}
                >
                  {isSubmitting ? 'Procesando...' : `✅ Confirmar mi predicción — ${outcome === 'YES' ? labelA : labelB}`}
                </button>
              ) : (
                <div className="confirm-trade-card" style={{ marginTop: '1rem' }}>
                  <div className="confirm-trade-header">
                    <Sparkles size={16} style={{ color: 'hsl(var(--brand))' }} className="animate-pulse" />
                    <span>¿Confirmas tu predicción?</span>
                  </div>
                  <div className="confirm-details-list">
                    <div className="confirm-detail-row">
                      <span className="confirm-detail-label">Tu apuesta:</span>
                      <span className={`confirm-detail-value ${outcome === 'YES' ? 'probability-bar-yes' : 'probability-bar-no'}`} style={{ fontWeight: 'bold' }}>
                        {outcome === 'YES' ? labelA : labelB}
                      </span>
                    </div>
                    <div className="confirm-detail-row">
                      <span className="confirm-detail-label">Inviertes:</span>
                      <span className="confirm-detail-value">{parseFloat(amount).toLocaleString()} Créditos</span>
                    </div>
                    <div className="confirm-detail-row">
                      <span className="confirm-detail-label">Si aciertas, recibes:</span>
                      <span className="confirm-detail-value" style={{ color: 'hsl(var(--yes-color))', fontWeight: 'bold' }}>
                        {sharesToReceive.toFixed(0)} Créditos (+{potentialProfit.toFixed(0)})
                      </span>
                    </div>
                  </div>
                  <div className="confirm-actions">
                    <button type="submit" className="confirm-btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Procesando...' : 'Sí, confirmar predicción'}
                    </button>
                    <button type="button" className="confirm-btn-secondary" onClick={() => setIsConfirming(false)} disabled={isSubmitting}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced — Limit Order */}
              {isTradingAllowed && !isConfirming && (
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowAdvanced(v => !v); setOrderType(showAdvanced ? 'market' : 'limit'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600, padding: '0.1rem 0' }}
                  >
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Opciones avanzadas (Orden Límite)
                    <Tip text="Una orden límite te permite especificar el precio máximo que pagas por contrato. Solo se ejecuta si el mercado llega a ese precio. Recomendado para usuarios con experiencia." position="top" />
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ background: 'hsl(var(--bg-elevated) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                        💡 Establece el precio máximo que estás dispuesto a pagar. Si el mercado llega a ese precio, la orden se ejecuta automáticamente.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="trade-input-group">
                          <label htmlFor="limitPrice">Precio máximo (1–99)</label>
                          <div className="input-wrapper">
                            <input id="limitPrice" type="number" placeholder="50" min="1" max="99" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} required disabled={!isTradingAllowed || isConfirming} />
                          </div>
                        </div>
                        <div className="trade-input-group">
                          <label htmlFor="limitContracts">Cantidad de contratos</label>
                          <div className="input-wrapper">
                            <input id="limitContracts" type="number" placeholder="100" min="1" value={limitContracts} onChange={(e) => setLimitContracts(e.target.value)} required disabled={!isTradingAllowed || isConfirming} />
                          </div>
                        </div>
                      </div>
                      <div className="trade-summary-card">
                        <div className="summary-row">
                          <span className="label">Costo total de la orden</span>
                          <span className="value" style={{ fontWeight: 700 }}>{limitCost.toFixed(2)} Créditos</span>
                        </div>
                        <div className="summary-row">
                          <span className="label">Si se ejecuta y aciertas</span>
                          <span className="return-value" style={{ color: 'hsl(var(--yes-color))', fontWeight: 700 }}>
                            {parseFloat(limitContracts || 0).toFixed(0)} Créditos
                          </span>
                        </div>
                      </div>
                      {isLimitInsufficient && (
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--no-color))', fontWeight: 600 }}>⚠️ Saldo insuficiente para esta orden.</div>
                      )}
                      {!isConfirming ? (
                        <button
                          type="submit"
                          className={`submit-trade-btn ${outcome === 'YES' ? 'buy-yes' : 'buy-no'}`}
                          disabled={isSubmitting || !isTradingAllowed || !limitPrice || !limitContracts || isLimitInsufficient}
                        >
                          {isSubmitting ? 'Procesando...' : `Colocar Orden Límite — ${outcome === 'YES' ? labelA : labelB}`}
                        </button>
                      ) : (
                        <div className="confirm-trade-card" style={{ marginTop: '0.5rem' }}>
                          <div className="confirm-trade-header">
                            <Sparkles size={16} style={{ color: 'hsl(var(--brand))' }} />
                            <span>¿Confirmar orden límite?</span>
                          </div>
                          <div className="confirm-details-list">
                            <div className="confirm-detail-row">
                              <span className="confirm-detail-label">Tipo:</span>
                              <span className="confirm-detail-value" style={{ fontWeight: 700 }}>ORDEN LÍMITE</span>
                            </div>
                            <div className="confirm-detail-row">
                              <span className="confirm-detail-label">Apuesta:</span>
                              <span className={`confirm-detail-value ${outcome === 'YES' ? 'probability-bar-yes' : 'probability-bar-no'}`} style={{ fontWeight: 700 }}>{outcome === 'YES' ? labelA : labelB}</span>
                            </div>
                            <div className="confirm-detail-row">
                              <span className="confirm-detail-label">Precio límite:</span>
                              <span className="confirm-detail-value">{parseFloat(limitPrice)}¢</span>
                            </div>
                            <div className="confirm-detail-row">
                              <span className="confirm-detail-label">Créditos bloqueados:</span>
                              <span className="confirm-detail-value" style={{ color: 'hsl(var(--no-color))', fontWeight: 700 }}>{limitCost.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="confirm-actions">
                            <button type="submit" className="confirm-btn-primary" disabled={isSubmitting}>
                              {isSubmitting ? 'Procesando...' : 'Confirmar Orden Límite'}
                            </button>
                            <button type="button" className="confirm-btn-secondary" onClick={() => setIsConfirming(false)} disabled={isSubmitting}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 600px) {
          .detail-split-layout { grid-template-columns: 1.2fr 1fr !important; }
        }
      `}</style>
    </dialog>
  );
}
