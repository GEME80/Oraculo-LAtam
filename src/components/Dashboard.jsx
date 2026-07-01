import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Dialog } from './CustomDialog';
import { 
  TrendingUp, 
  Coins, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Layers,
  Percent,
  Activity,
  Compass,
  ArrowRight,
  Users,
  ShieldAlert,
  Edit3,
  Check,
  Globe,
  Newspaper,
  CheckCircle2,
  PieChart,
  Target,
  Zap,
  Trophy,
  Hash
} from 'lucide-react';

const COUNTRY_FLAGS = {
  CO: '🇨🇴',
  MX: '🇲🇽',
  AR: '🇦🇷',
  BR: '🇧🇷',
  CL: '🇨🇱',
  PE: '🇵🇪',
  LATAM: '🌎'
};

export default function Dashboard({ userProfile, setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [markets, setMarkets] = useState([]);
  
  // KPIs
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [netPnl, setNetPnl] = useState(0);
  const [roi, setRoi] = useState(0);
  
  // Chart states
  const [consumptionTrend, setConsumptionTrend] = useState([]);
  const [pnlTrend, setPnlTrend] = useState([]);
  const [categoryShares, setCategoryShares] = useState([]);
  const [outcomeProportion, setOutcomeProportion] = useState({ yes: 0, no: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  
  // Dashboard Sub-tabs
  const [subTab, setSubTab] = useState('general');
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [marketHistory, setMarketHistory] = useState([]);

  // Admin Portal states
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingBalance, setEditingBalance] = useState('');

  useEffect(() => {
    if (userProfile) {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (userProfile?.role === 'admin') {
        const [profilesRes, posRes, marketsRes, transRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('user_positions').select('*'),
          supabase.from('markets').select('*'),
          supabase.from('transactions').select('*')
        ]);
        
        if (profilesRes.error) throw profilesRes.error;
        if (posRes.error) throw posRes.error;
        if (marketsRes.error) throw marketsRes.error;
        
        setUsers(profilesRes.data || []);
        setPositions(posRes.data || []);
        setMarkets(marketsRes.data || []);
        setAdminTransactions(transRes.data || []);
      } else {
        // Fetch all required tables
        const [transRes, payoutRes, marketsRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('profile_id', userProfile.id),
          supabase.from('resolved_payouts').select('*').eq('profile_id', userProfile.id),
          supabase.from('markets').select('*')
        ]);

        if (transRes.error) throw transRes.error;
        if (payoutRes.error) throw payoutRes.error;
        if (marketsRes.error) throw marketsRes.error;

        const trans = transRes.data || [];
        const pays = payoutRes.data || [];
        const mkts = marketsRes.data || [];

        setTransactions(trans);
        setPayouts(pays);
        setMarkets(mkts);

        calculateMetrics(trans, pays, mkts);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId) => {
    const amount = parseFloat(editingBalance);
    if (isNaN(amount) || amount < 0) {
      await Dialog.alert('Ingresa un monto válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ orc_balance: amount })
        .eq('id', userId);

      if (error) throw error;
      setEditingUserId(null);
      setEditingBalance('');
      await loadData();
      await Dialog.alert('¡Saldo de usuario actualizado!');
    } catch (err) {
      console.error(err);
      await Dialog.alert('Error al actualizar el saldo del usuario.');
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', user.id);

      if (error) throw error;
      await loadData();
      await Dialog.alert('¡Rol del usuario actualizado!');
    } catch (err) {
      console.error(err);
      await Dialog.alert('Error al cambiar el rol del usuario.');
    }
  };

  const calculateMetrics = (trans, pays, mkts) => {
    let spent = 0;
    let earned = 0;
    let yesCount = 0;
    let noCount = 0;
    const catMap = {};

    trans.forEach(t => {
      const amt = parseFloat(t.points_paid);
      if (t.type === 'buy') {
        spent += amt;
        
        // SÍ/NO proportion
        if (t.outcome === 'YES') yesCount += amt;
        else if (t.outcome === 'NO') noCount += amt;

        // Category breakdown
        const m = mkts.find(market => market.id === t.market_id);
        const cat = m ? m.category : 'Otros';
        catMap[cat] = (catMap[cat] || 0) + amt;
      } else if (t.type === 'sell') {
        earned += amt;
      }
    });

    pays.forEach(p => {
      earned += parseFloat(p.payout_amount);
    });

    const pnl = earned - spent;
    const calculatedRoi = spent > 0 ? (pnl / spent) * 100 : 0;

    setTotalSpent(spent);
    setTotalEarned(earned);
    setNetPnl(pnl);
    setRoi(calculatedRoi);
    setOutcomeProportion({ yes: yesCount, no: noCount });

    // Category breakdown list
    const categoriesArray = Object.keys(catMap).map(cat => ({
      name: cat,
      value: catMap[cat]
    })).sort((a, b) => b.value - a.value);
    setCategoryShares(categoriesArray);

    // Process trends
    const allEvents = [];
    trans.forEach(t => {
      allEvents.push({
        date: new Date(t.created_at),
        type: t.type,
        amount: parseFloat(t.points_paid),
        pnlEffect: t.type === 'buy' ? -parseFloat(t.points_paid) : parseFloat(t.points_paid)
      });
    });

    pays.forEach(p => {
      allEvents.push({
        date: new Date(p.created_at),
        type: 'payout',
        amount: parseFloat(p.payout_amount),
        pnlEffect: parseFloat(p.payout_amount)
      });
    });

    // Sort by date ascending
    allEvents.sort((a, b) => a.date - b.date);

    // Compute monthly statistics (move getMonthKey up)
    const getMonthKey = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Historial';
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Group by date (Month Day)
    const dailyMap = {};
    allEvents.forEach(e => {
      const dayKey = e.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const monthStr = getMonthKey(e.date);
      const uniqueKey = `${dayKey}-${monthStr}`;
      
      if (!dailyMap[uniqueKey]) {
        dailyMap[uniqueKey] = { day: dayKey, monthKey: monthStr, spent: 0, returned: 0, pnlEffect: 0 };
      }
      if (e.type === 'buy') {
        dailyMap[uniqueKey].spent += e.amount;
      } else {
        dailyMap[uniqueKey].returned += e.amount;
      }
      dailyMap[uniqueKey].pnlEffect += e.pnlEffect;
    });

    const dailyList = Object.values(dailyMap);
    
    // Line chart 1: Credit Consumption (Cumulative spent)
    let runningSpent = 0;
    const spentTrend = dailyList.map(item => {
      runningSpent += item.spent;
      return {
        label: item.day,
        monthKey: item.monthKey,
        value: runningSpent,
        raw: item.spent
      };
    });

    // Seeding Day 0 for cleaner visuals if only 1 data point is present
    if (spentTrend.length === 1) {
      spentTrend.unshift({ label: 'Inicio', monthKey: spentTrend[0].monthKey, value: 0, raw: 0 });
    }
    setConsumptionTrend(spentTrend);

    // Line chart 2: Cumulative P&L Evolution
    let runningPnl = 0;
    const pnlEvolution = dailyList.map(item => {
      runningPnl += item.pnlEffect;
      return {
        label: item.day,
        monthKey: item.monthKey,
        value: runningPnl
      };
    });

    if (pnlEvolution.length === 1) {
      pnlEvolution.unshift({ label: 'Inicio', monthKey: pnlEvolution[0].monthKey, value: 0 });
    }
    setPnlTrend(pnlEvolution);

    const monthlyGroups = {};

    trans.forEach(t => {
      const month = getMonthKey(t.created_at);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = { month, spent: 0, returned: 0 };
      }
      const amt = parseFloat(t.points_paid);
      if (t.type === 'buy') {
        monthlyGroups[month].spent += amt;
      } else if (t.type === 'sell') {
        monthlyGroups[month].returned += amt;
      }
    });

    pays.forEach(p => {
      const month = getMonthKey(p.created_at);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = { month, spent: 0, returned: 0 };
      }
      monthlyGroups[month].returned += parseFloat(p.payout_amount);
    });

    const statsArray = Object.values(monthlyGroups).map(g => {
      const pnlVal = g.returned - g.spent;
      return {
        ...g,
        pnl: pnlVal,
        roi: g.spent > 0 ? (pnlVal / g.spent) * 100 : 0
      };
    });
    setMonthlyStats(statsArray);

    // Historical market PnL
    const marketPnlMap = {};
    
    trans.forEach(t => {
      const mId = t.market_id;
      if (!marketPnlMap[mId]) {
        const m = mkts.find(market => market.id === mId);
        marketPnlMap[mId] = {
          marketId: mId,
          question: m ? m.title : 'Mercado Desconocido',
          spent: 0,
          returned: 0,
          status: m ? m.status : 'unknown'
        };
      }
      const amt = parseFloat(t.points_paid);
      if (t.type === 'buy') {
        marketPnlMap[mId].spent += amt;
      } else if (t.type === 'sell') {
        marketPnlMap[mId].returned += amt;

      }
    });

    pays.forEach(p => {
      const mId = p.market_id;
      if (marketPnlMap[mId]) {
        marketPnlMap[mId].returned += parseFloat(p.payout_amount);
      }
    });

    const historyArray = Object.values(marketPnlMap).map(m => {
      return {
        ...m,
        net: m.returned - m.spent,
      };
    }).sort((a, b) => b.net - a.net);
    
    setMarketHistory(historyArray);
  };

  const renderLineChart = (data, isPnl = false) => {
    if (data.length === 0) return null;
    
    const width = 450;
    const height = 160;
    const padding = 25;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 10);
    const minVal = isPnl ? Math.min(...values, -10) : 0;
    const valRange = maxVal - minVal || 1;

    // Generate path points
    const points = data.map((d, idx) => {
      const x = padding + (idx / (data.length - 1 || 1)) * chartW;
      const y = padding + chartH - ((d.value - minVal) / valRange) * chartH;
      return { x, y, label: d.label, val: d.value };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Area path (closes at the bottom for area fill)
    const bottomY = padding + chartH;
    const areaD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

    const strokeColor = isPnl 
      ? (data[data.length - 1].value >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))')
      : 'hsl(var(--brand))';

    const fillGradId = isPnl ? 'pnlGrad' : 'consumeGrad';
    const gradColor = isPnl 
      ? (data[data.length - 1].value >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))')
      : 'hsl(var(--brand))';

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={gradColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <line x1={padding} y1={padding + chartH / 2} x2={width - padding} y2={padding + chartH / 2} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <line x1={padding} y1={padding + chartH} x2={width - padding} y2={padding + chartH} stroke="hsl(var(--border))" />

        {/* 0 Line for PNL */}
        {isPnl && minVal < 0 && maxVal > 0 && (
          <line 
            x1={padding} 
            y1={padding + chartH - ((0 - minVal) / valRange) * chartH} 
            x2={width - padding} 
            y2={padding + chartH - ((0 - minVal) / valRange) * chartH} 
            stroke="hsl(var(--text-muted))" 
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        )}

        {/* Area and Line */}
        <path d={areaD} fill={`url(#${fillGradId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4.5" 
              fill={strokeColor} 
              stroke="white" 
              strokeWidth="1.5"
            />
            {/* Show value label on hover or if end/start point */}
            {(idx === 0 || idx === points.length - 1 || points.length <= 6) && (
              <text 
                x={p.x} 
                y={p.y - 8} 
                textAnchor="middle" 
                fontSize="9" 
                fontWeight="800" 
                fill="hsl(var(--text-main))"
              >
                {Math.round(p.val).toLocaleString()}
              </text>
            )}
            {/* X-axis labels */}
            {(idx === 0 || idx === points.length - 1 || (idx % Math.ceil(points.length / 4) === 0)) && (
              <text 
                x={p.x} 
                y={padding + chartH + 16} 
                textAnchor="middle" 
                fontSize="9" 
                fontWeight="700" 
                fill="hsl(var(--text-muted))"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  const renderCategoryBreakdown = () => {
    const totalCatSpent = categoryShares.reduce((acc, curr) => acc + curr.value, 0) || 1;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
        {categoryShares.map((cat, idx) => {
          const pct = (cat.value / totalCatSpent) * 100;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>{cat.name}</span>
                <span style={{ color: 'hsl(var(--text-muted))' }}>
                  {Math.round(cat.value).toLocaleString()} Créditos ({Math.round(pct)}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${pct}%`, 
                    height: '100%', 
                    background: `hsl(var(--brand) / ${1 - idx * 0.16})`, 
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOutcomeProportion = () => {
    const total = outcomeProportion.yes + outcomeProportion.no || 1;
    const yesPct = (outcomeProportion.yes / total) * 100;
    const noPct = 100 - yesPct;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800 }}>
          <span className="probability-bar-yes">Opción A (SÍ): {Math.round(yesPct)}%</span>
          <span className="probability-bar-no">Opción B (NO): {Math.round(noPct)}%</span>
        </div>
        <div style={{ width: '100%', height: '16px', background: 'hsl(var(--border))', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${yesPct}%`, background: 'hsl(var(--yes-color))', transition: 'width 0.3s' }} />
          <div style={{ width: `${noPct}%`, background: 'hsl(var(--no-color))', transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>
          <span>{Math.round(outcomeProportion.yes).toLocaleString()} Créditos en Opción A (SÍ)</span>
          <span>{Math.round(outcomeProportion.no).toLocaleString()} Créditos en Opción B (NO)</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'hsl(var(--text-muted))' }}>
        <Activity className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'hsl(var(--brand))' }} />
        <span>Cargando análisis del Dashboard...</span>
      </div>
    );
  }

  if (transactions.length === 0 && payouts.length === 0 && userProfile?.role !== 'admin') {
    return (
      <div className="leaderboard-view" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto', borderRadius: 'var(--radius-lg)' }}>
        <Activity size={48} style={{ color: 'hsl(var(--brand))', marginBottom: '1.25rem', opacity: 0.8 }} className="animate-pulse" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'hsl(var(--text-main))' }}>Tu Dashboard de Rendimiento</h2>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '1.75rem' }}>
          Una vez que realices tus primeras predicciones y resuelvas mercados, aquí se consolidarán tus consumos de créditos, evolución del P&L en el tiempo y desglose de efectividad.
        </p>
        <button 
          className="submit-trade-btn buy-yes" 
          onClick={() => setActiveTab('markets')}
          style={{ maxWidth: '240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <span>Explorar Mercados Activos</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (userProfile?.role === 'admin') {
    // ═══════════════════════ ADMIN METRICS CALCULATIONS ═══════════════════════
    const totalUsers = users.length;
    const circulatingPoints = users.reduce((acc, u) => acc + parseFloat(u.orc_balance || 0), 0);
    const totalVolume = markets.reduce((acc, m) => acc + parseFloat(m.volume || 0), 0);
    const activeMarketsCount = markets.filter(m => m.status === 'active').length;
    const resolvedMarketsCount = markets.filter(m => m.status === 'resolved').length;
    const pendingMarketsCount = markets.filter(m => m.status === 'pending').length;

    const openInterest = positions.reduce((acc, pos) => {
      const market = markets.find(m => m.id === pos.market_id);
      if (market) {
        const yesVal = parseFloat(pos.yes_shares || 0) * (parseFloat(market.yes_price) / 100);
        const noVal = parseFloat(pos.no_shares || 0) * (parseFloat(market.no_price) / 100);
        return acc + yesVal + noVal;
      }
      return acc;
    }, 0);

    const creditsInBalances = circulatingPoints;
    const creditsInPlay = openInterest;

    const averageAccuracy = totalUsers > 0
      ? users.reduce((acc, u) => acc + parseFloat(u.accuracy_rate || 0), 0) / totalUsers
      : 0;

    const avgCreditsPerUser = totalUsers > 0 ? circulatingPoints / totalUsers : 0;

    // Users with at least one position
    const usersWithPositions = new Set(positions.map(p => p.profile_id)).size;
    const participationRate = totalUsers > 0 ? (usersWithPositions / totalUsers) * 100 : 0;

    // Top 3 markets by volume
    const topMarkets = [...markets].sort((a, b) => parseFloat(b.volume || 0) - parseFloat(a.volume || 0)).slice(0, 3);

    // Country distribution
    const countryMap = {};
    users.forEach(u => {
      const c = u.country || 'LATAM';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const countryDistribution = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);

    // ── Monthly news chart data ──
    const getMonthKey = (dateStr) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const newsMonthlyMap = {};
    markets.forEach(m => {
      const key = getMonthKey(m.created_at);
      if (!key) return;
      if (!newsMonthlyMap[key]) newsMonthlyMap[key] = { month: key, generated: 0, live: 0, resolved: 0 };
      newsMonthlyMap[key].generated += 1;
      if (m.status === 'active') newsMonthlyMap[key].live += 1;
      if (m.status === 'resolved') newsMonthlyMap[key].resolved += 1;
    });
    const newsMonthlyData = Object.values(newsMonthlyMap);

    // ── Monthly volume chart data ──
    const volumeMonthlyMap = {};
    adminTransactions.forEach(t => {
      const key = getMonthKey(t.created_at);
      if (!key) return;
      if (!volumeMonthlyMap[key]) volumeMonthlyMap[key] = { month: key, volume: 0 };
      volumeMonthlyMap[key].volume += parseFloat(t.points_paid || 0);
    });
    const volumeMonthlyData = Object.values(volumeMonthlyMap);

    // ── Demographics ──
    const maleCount = users.filter(u => u.gender === 'MASCULINO').length;
    const femaleCount = users.filter(u => u.gender === 'FEMENINO').length;
    const otherGenderCount = users.filter(u => !u.gender || u.gender === 'OTRO').length;
    const malePercent = totalUsers > 0 ? (maleCount / totalUsers) * 100 : 0;
    const femalePercent = totalUsers > 0 ? (femaleCount / totalUsers) * 100 : 0;
    const otherGenderPercent = totalUsers > 0 ? (otherGenderCount / totalUsers) * 100 : 0;

    const youthCount = users.filter(u => u.age && u.age >= 13 && u.age <= 25).length;
    const adultCount = users.filter(u => u.age && u.age >= 26 && u.age <= 45).length;
    const seniorCount = users.filter(u => u.age && u.age >= 46).length;
    const unknownAgeCount = users.filter(u => !u.age).length;
    const youthPercent = totalUsers > 0 ? (youthCount / totalUsers) * 100 : 0;
    const adultPercent = totalUsers > 0 ? (adultCount / totalUsers) * 100 : 0;
    const seniorPercent = totalUsers > 0 ? (seniorCount / totalUsers) * 100 : 0;
    const unknownAgePercent = totalUsers > 0 ? (unknownAgeCount / totalUsers) * 100 : 0;

    // ═══════════════════════ CHART RENDER HELPERS ═══════════════════════

    const renderDonutChart = (inBalances, inPlay) => {
      const total = inBalances + inPlay || 1;
      const balPct = (inBalances / total) * 100;
      const playPct = (inPlay / total) * 100;
      const r = 60;
      const cx = 80;
      const cy = 80;
      const circumference = 2 * Math.PI * r;
      const balStroke = (balPct / 100) * circumference;
      const playStroke = (playPct / 100) * circumference;

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="18" />
            <circle
              cx={cx} cy={cy} r={r} fill="none"
              stroke="hsl(var(--brand))"
              strokeWidth="18"
              strokeDasharray={`${balStroke} ${circumference - balStroke}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <circle
              cx={cx} cy={cy} r={r} fill="none"
              stroke="hsl(var(--yes-color))"
              strokeWidth="18"
              strokeDasharray={`${playStroke} ${circumference - playStroke}`}
              strokeDashoffset={circumference * 0.25 - balStroke}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="hsl(var(--text-main))">
              {Math.round(total).toLocaleString()}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--text-muted))">
              Total Créditos
            </text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--brand))' }} />
              <span style={{ fontWeight: 700 }}>En Saldos: <span style={{ color: 'hsl(var(--brand))' }}>{Math.round(inBalances).toLocaleString()}</span> ({balPct.toFixed(1)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--yes-color))' }} />
              <span style={{ fontWeight: 700 }}>En Juego: <span style={{ color: 'hsl(var(--yes-color))' }}>{Math.round(inPlay).toLocaleString()}</span> ({playPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      );
    };

    const renderBarChart = (data) => {
      if (data.length === 0) return <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Sin datos disponibles</div>;

      const maxVal = Math.max(...data.map(d => Math.max(d.generated || 0, d.live || 0)), 1);
      const barWidth = Math.min(36, (400 / data.length) - 12);

      return (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '0.5rem 0', minHeight: '160px', justifyContent: data.length < 4 ? 'center' : 'flex-start' }}>
            {data.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '120px' }}>
                  {/* Generated bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '2px' }}>{d.generated}</span>
                    <div style={{
                      width: `${barWidth}px`,
                      height: `${Math.max(4, (d.generated / maxVal) * 100)}px`,
                      background: 'linear-gradient(to top, hsl(var(--brand) / 0.6), hsl(var(--brand)))',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }} />
                  </div>
                  {/* Live bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '2px' }}>{d.live}</span>
                    <div style={{
                      width: `${barWidth}px`,
                      height: `${Math.max(4, (d.live / maxVal) * 100)}px`,
                      background: 'linear-gradient(to top, hsl(var(--yes-color) / 0.6), hsl(var(--yes-color)))',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(var(--brand))' }} />
              <span>Generadas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(var(--yes-color))' }} />
              <span>Live (Activas)</span>
            </div>
          </div>
        </div>
      );
    };

    const renderVolumeLineChart = (data) => {
      if (data.length === 0) return <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Sin transacciones registradas</div>;

      const width = 450;
      const height = 160;
      const padding = 30;
      const chartW = width - padding * 2;
      const chartH = height - padding * 2;
      const values = data.map(d => d.volume);
      const maxVal = Math.max(...values, 10);

      const points = data.map((d, idx) => {
        const x = padding + (idx / (data.length - 1 || 1)) * chartW;
        const y = padding + chartH - (d.volume / maxVal) * chartH;
        return { x, y, label: d.month, val: d.volume };
      });

      const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const bottomY = padding + chartH;
      const areaD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <line x1={padding} y1={padding + chartH / 2} x2={width - padding} y2={padding + chartH / 2} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <line x1={padding} y1={bottomY} x2={width - padding} y2={bottomY} stroke="hsl(var(--border))" />
          <path d={areaD} fill="url(#volGrad)" />
          <path d={pathD} fill="none" stroke="hsl(var(--brand))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="hsl(var(--brand))" stroke="white" strokeWidth="1.5" />
              {(idx === 0 || idx === points.length - 1 || points.length <= 6) && (
                <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="800" fill="hsl(var(--text-main))">
                  {Math.round(p.val).toLocaleString()}
                </text>
              )}
              {(idx === 0 || idx === points.length - 1 || (idx % Math.ceil(points.length / 4) === 0)) && (
                <text x={p.x} y={bottomY + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="hsl(var(--text-muted))">
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      );
    };

    // ═══════════════════════ ADMIN RENDER ═══════════════════════
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Title */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} style={{ color: 'hsl(var(--brand))' }} />
            Dashboard General del Servicio
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
            Centro de comando con indicadores operacionales, tendencias y salud de la plataforma.
          </p>
        </div>

        {/* ═══════ 8 KPI Cards ═══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {/* 1. Total Usuarios */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Users size={12} /> Total Usuarios
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem' }}>{totalUsers}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Hash size={10} /> Analistas registrados
            </span>
          </div>

          {/* 2. Créditos Circulantes */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Coins size={12} /> Créditos Circulantes
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem', color: 'hsl(var(--brand))' }}>{Math.round(circulatingPoints).toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Zap size={10} /> Total en la plataforma
            </span>
          </div>

          {/* 3. Créditos en Juego */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Target size={12} /> Créditos en Juego
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem', color: 'hsl(var(--yes-color))' }}>{Math.round(creditsInPlay).toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Activity size={10} /> Bloqueados en posiciones
            </span>
          </div>

          {/* 4. Créditos en Saldos */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Coins size={12} /> Créditos en Saldos
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem' }}>{Math.round(creditsInBalances).toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ArrowUpRight size={10} style={{ color: 'hsl(var(--yes-color))' }} /> Disponibles en wallets
            </span>
          </div>

          {/* 5. Volumen Total Operado */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <TrendingUp size={12} /> Volumen Operado
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem' }}>{Math.round(totalVolume).toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Layers size={10} /> Total histórico
            </span>
          </div>

          {/* 6. Noticias Live */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Newspaper size={12} /> Noticias Live
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem', color: 'hsl(var(--yes-color))' }}>{activeMarketsCount}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Activity size={10} /> Mercados activos ahora
            </span>
          </div>

          {/* 7. Noticias Resueltas */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <CheckCircle2 size={12} /> Noticias Resueltas
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem' }}>{resolvedMarketsCount}</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Check size={10} /> Mercados cerrados
            </span>
          </div>

          {/* 8. Precisión Promedio */}
          <div className="stat-card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Percent size={12} /> Precisión Promedio
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, display: 'block', margin: '0.35rem 0 0.15rem' }}>{averageAccuracy.toFixed(1)}%</span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Trophy size={10} /> Efectividad global
            </span>
          </div>
        </div>

        {/* ═══════ CHARTS GRID ═══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="admin-charts-layout">

          {/* Chart 1: Credit Distribution Donut */}
          <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={16} style={{ color: 'hsl(var(--brand))' }} />
              Distribución de Créditos
              <span className="info-tooltip-wrapper" style={{ marginLeft: '4px' }}>
                <HelpCircle size={12} />
                <span className="info-tooltip-text tooltip-right" style={{ fontWeight: 'normal' }}>
                  Proporción de créditos que están disponibles en los saldos de los usuarios vs los que están bloqueados en posiciones de mercado abiertas.
                </span>
              </span>
            </h3>
            {renderDonutChart(creditsInBalances, creditsInPlay)}
          </div>

          {/* Chart 2: News Live vs Generated by Month */}
          <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Newspaper size={16} style={{ color: 'hsl(var(--brand))' }} />
              Noticias Generadas vs Live por Mes
            </h3>
            {renderBarChart(newsMonthlyData)}
          </div>

          {/* Chart 3: Volume Line Chart */}
          <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'hsl(var(--brand))' }} />
              Volumen de Operaciones por Mes
            </h3>
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
              {renderVolumeLineChart(volumeMonthlyData)}
            </div>
          </div>
        </div>

        {/* ═══════ SYSTEM HEALTH TABLE ═══════ */}
        <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'hsl(var(--brand))' }} />
            Salud del Sistema
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="system-health-layout">
            {/* Key Metrics */}
            <div style={{ background: 'hsl(var(--bg-app))', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Métricas Clave</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600 }}>Tasa de Participación</span>
                  <span style={{ fontWeight: 800, color: participationRate > 50 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))' }}>{participationRate.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(participationRate, 100)}%`, height: '100%', background: participationRate > 50 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>Promedio Créditos por Usuario</span>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--brand))' }}>{Math.round(avgCreditsPerUser).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>Mercados Pendientes de Aprobación</span>
                  <span style={{ fontWeight: 800, color: pendingMarketsCount > 0 ? '#f59e0b' : 'hsl(var(--text-muted))' }}>{pendingMarketsCount}</span>
                </div>
              </div>
            </div>

            {/* Top 3 Markets */}
            <div style={{ background: 'hsl(var(--bg-app))', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top 3 Mercados por Volumen</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topMarkets.map((m, idx) => {
                  const maxVol = topMarkets[0] ? parseFloat(topMarkets[0].volume || 0) : 1;
                  const pct = (parseFloat(m.volume || 0) / maxVol) * 100;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{medals[idx]} {m.title?.substring(0, 50)}{m.title?.length > 50 ? '...' : ''}</span>
                        <span style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }}>{parseFloat(m.volume || 0).toLocaleString()} Cr.</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: `hsl(var(--brand) / ${1 - idx * 0.25})`, borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country Distribution */}
            <div style={{ background: 'hsl(var(--bg-app))', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribución por País</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {countryDistribution.map(([country, count], idx) => {
                  const pct = (count / totalUsers) * 100;
                  const colors = ['hsl(var(--brand))', 'hsl(var(--yes-color))', '#f59e0b', 'hsl(var(--no-color))', '#8b5cf6', '#06b6d4'];
                  return (
                    <div key={country} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>{COUNTRY_FLAGS[country] || '🌎'} {country}</span>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: colors[idx % colors.length], borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ DEMOGRAPHICS (preserved) ═══════ */}
        <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'hsl(var(--brand))' }} />
            Demografía de Usuarios Registrados
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="demographics-layout">
            {/* Gender Distribution */}
            <div style={{ background: 'hsl(var(--bg-app))', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribución por Género</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Femenino</span>
                    <span>{femaleCount} ({femalePercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${femalePercent}%`, height: '100%', background: 'hsl(var(--no-color))' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Masculino</span>
                    <span>{maleCount} ({malePercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${malePercent}%`, height: '100%', background: 'hsl(var(--brand))' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Otro / No especificado</span>
                    <span>{otherGenderCount} ({otherGenderPercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${otherGenderPercent}%`, height: '100%', background: 'hsl(var(--text-muted) / 0.4)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div style={{ background: 'hsl(var(--bg-app))', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid hsl(var(--border))' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribución por Edad</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Jóvenes (18-25 años)</span>
                    <span>{youthCount} ({youthPercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${youthPercent}%`, height: '100%', background: '#f59e0b' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Adultos (26-45 años)</span>
                    <span>{adultCount} ({adultPercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${adultPercent}%`, height: '100%', background: 'hsl(var(--yes-color))' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    <span>Mayores (46+ años)</span>
                    <span>{seniorCount} ({seniorPercent.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${seniorPercent}%`, height: '100%', background: '#ef4444' }} />
                  </div>
                </div>
                {unknownAgeCount > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      <span>Sin especificar edad</span>
                      <span>{unknownAgeCount} ({unknownAgePercent.toFixed(1)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${unknownAgePercent}%`, height: '100%', background: 'hsl(var(--text-muted) / 0.4)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ USER AUDIT TABLE (preserved) ═══════ */}
        <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'hsl(var(--brand))' }} />
            Base de Datos de Usuarios y Auditoría
          </h3>

          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>País</th>
                  <th>Rol</th>
                  <th>Predicciones</th>
                  <th>Efectividad</th>
                  <th>Balance</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditing = editingUserId === user.id;
                  return (
                    <tr key={user.id}>
                      <td className="user-col">
                        <img 
                          src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username || 'user')}`} 
                          alt={user.username} 
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username || 'user')}`;
                          }}
                        />
                        <span className="name" style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>{user.username}</span>
                      </td>
                      <td style={{ color: 'hsl(var(--text-main))' }}>{COUNTRY_FLAGS[user.country] || '🌎'} {user.country}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          background: user.role === 'admin' ? 'hsl(var(--no-bg) / 0.15)' : 'hsl(var(--yes-bg) / 0.15)', 
                          color: user.role === 'admin' ? 'hsl(var(--no-color))' : 'hsl(var(--yes-color))',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {(user.role || 'user').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: 'hsl(var(--text-main))' }}>{user.predictions_count || 0}</td>
                      <td>
                        <span className="accuracy-badge">
                          {parseFloat(user.accuracy_rate).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editingBalance} 
                            onChange={(e) => setEditingBalance(e.target.value)} 
                            style={{ 
                              width: '90px', 
                              padding: '0.2rem 0.4rem', 
                              border: '1px solid hsl(var(--border))', 
                              borderRadius: '4px', 
                              fontWeight: 'bold',
                              background: 'hsl(var(--bg-app))',
                              color: 'hsl(var(--text-main))'
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'hsl(var(--brand))' }}>
                            {parseFloat(user.orc_balance).toLocaleString()} Créditos
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isEditing ? (
                            <button 
                              onClick={() => handleUpdateBalance(user.id)}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                background: 'hsl(var(--yes-color))', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}
                            >
                              Guardar
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditingBalance(user.orc_balance);
                              }}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                border: '1px solid hsl(var(--border))', 
                                background: 'hsl(var(--bg-card))', 
                                color: 'hsl(var(--text-main))',
                                borderRadius: '4px', 
                                cursor: 'pointer', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}
                            >
                              Modificar Saldo
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleRole(user)}
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              border: '1px solid hsl(var(--border))', 
                              background: 'hsl(var(--bg-card))', 
                              color: 'hsl(var(--text-main))',
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '0.75rem', 
                              fontWeight: 700 
                            }}
                          >
                            Toggle Rol
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Styles */}
        <style>{`
          @media (min-width: 600px) {
            .demographics-layout {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (min-width: 800px) {
            .admin-charts-layout {
              grid-template-columns: 1fr 1fr !important;
            }
            .system-health-layout {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Summary */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={22} style={{ color: 'hsl(var(--brand))' }} />
          Dashboard del Inversor
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
          Monitorea y analiza el historial de consumo de tus créditos, ganancias, y trayectoria de inversiones.
        </p>
      </div>

      {/* SUB-TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setSubTab('general')}
          style={{ 
            padding: '0.6rem 1.25rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem', 
            fontWeight: 800,
            background: subTab === 'general' ? 'hsl(var(--brand) / 0.15)' : 'transparent',
            color: subTab === 'general' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}>
          <PieChart size={16} /> Visión General
        </button>
        <button 
          onClick={() => setSubTab('daily')}
          style={{ 
            padding: '0.6rem 1.25rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem', 
            fontWeight: 800,
            background: subTab === 'daily' ? 'hsl(var(--brand) / 0.15)' : 'transparent',
            color: subTab === 'daily' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}>
          <Calendar size={16} /> Histórico Diario
        </button>
      </div>

      {subTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
          {/* KPI Cards Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            <div className="stat-card" style={{ position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Consumido
                <span className="info-tooltip-wrapper">
                  <HelpCircle size={12} />
                  <span className="info-tooltip-text tooltip-right" style={{ fontWeight: 'normal' }}>
                    Créditos totales que has gastado al comprar contratos de predicción (SÍ y NO).
                  </span>
                </span>
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block', margin: '0.5rem 0 0.25rem 0' }}>
                {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })} Créditos
              </span>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Coins size={10} /> En {transactions.filter(t => t.type === 'buy').length} compras de mercado
              </span>
            </div>

            <div className="stat-card" style={{ position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Retornos Recibidos
                <span className="info-tooltip-wrapper">
                  <HelpCircle size={12} />
                  <span className="info-tooltip-text tooltip-right" style={{ fontWeight: 'normal' }}>
                    Créditos obtenidos a partir de tus ventas anticipadas y los pagos de dividendos de mercados resueltos.
                  </span>
                </span>
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block', margin: '0.5rem 0 0.25rem 0' }}>
                {totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })} Créditos
              </span>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpRight size={10} style={{ color: 'hsl(var(--yes-color))' }} /> Incluye {payouts.length} resoluciones de mercado
              </span>
            </div>

            <div className="stat-card" style={{ position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resultado Neto (PnL)
                <span className="info-tooltip-wrapper">
                  <HelpCircle size={12} />
                  <span className="info-tooltip-text tooltip-left" style={{ fontWeight: 'normal' }}>
                    Tu balance consolidado (Retornos recibidos - Total consumido). Mide tus ganancias o pérdidas totales.
                  </span>
                </span>
              </span>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                display: 'block', 
                margin: '0.5rem 0 0.25rem 0',
                color: netPnl >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))'
              }}>
                {netPnl >= 0 ? '+' : ''}{netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} Créditos
              </span>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700,
                color: netPnl >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {netPnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} 
                {netPnl >= 0 ? 'Balance de Ganancias' : 'Balance de Pérdidas'}
              </span>
            </div>

            <div className="stat-card" style={{ position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Retorno de Inversión (ROI)
                <span className="info-tooltip-wrapper">
                  <HelpCircle size={12} />
                  <span className="info-tooltip-text tooltip-left" style={{ fontWeight: 'normal' }}>
                    Rentabilidad porcentual obtenida en relación al volumen de créditos que has inyectado en el sistema.
                  </span>
                </span>
              </span>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                display: 'block', 
                margin: '0.5rem 0 0.25rem 0',
                color: roi >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))'
              }}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
              </span>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Percent size={10} /> Rendimiento de capital inyectado
              </span>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="dashboard-charts-layout">
            <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} style={{ color: 'hsl(var(--brand))' }} />
                Distribución de Preferencias por Categorías
              </h3>
              {categoryShares.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                  No hay categorías registradas.
                </div>
              ) : (
                renderCategoryBreakdown()
              )}
            </div>

            <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} style={{ color: 'hsl(var(--brand))' }} />
                Proporción de Resultados Apostados (SÍ vs NO)
              </h3>
              {renderOutcomeProportion()}
            </div>
          </div>
        </div>
      )}

      {subTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
          
          {/* Header Controls for Daily Tab */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'hsl(var(--brand))' }} />
              Estadísticas Diarias
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Filtrar por Mes:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--text-main))',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Todos">Histórico Completo</option>
                {monthlyStats.map(m => (
                  <option key={m.month} value={m.month}>{m.month}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="dashboard-charts-layout">
            <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Coins size={16} style={{ color: 'hsl(var(--brand))' }} />
                Consumo Diario (Créditos gastados)
              </h3>
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                {renderLineChart(
                  selectedMonth === 'Todos' ? consumptionTrend : consumptionTrend.filter(d => d.monthKey === selectedMonth || d.label === 'Inicio'), 
                  false
                )}
              </div>
            </div>

            <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} style={{ color: 'hsl(var(--brand))' }} />
                Trayectoria de P&L Diario
              </h3>
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                {renderLineChart(
                  selectedMonth === 'Todos' ? pnlTrend : pnlTrend.filter(d => d.monthKey === selectedMonth || d.label === 'Inicio'), 
                  true
                )}
              </div>
            </div>
          </div>

          <div className="leaderboard-view" style={{ padding: '1.5rem', marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={18} style={{ color: 'hsl(var(--brand))' }} />
              Historial de Resultados por Pregunta
            </h3>

            {marketHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                <Activity size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <span>No has participado en ninguna pregunta aún.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid hsl(var(--border))', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Pregunta (Mercado)</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Invertido</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Retornado</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Resultado Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketHistory.map((m) => {
                      const isPending = m.status === 'active' || m.status === 'pending';
                      let resultLabel = '';
                      let resultColor = '';
                      
                      if (isPending) {
                        resultLabel = 'EN JUEGO';
                        resultColor = 'hsl(var(--brand))';
                      } else {
                        if (m.net > 0) {
                          resultLabel = 'GANASTE';
                          resultColor = 'hsl(var(--yes-color))';
                        } else if (m.net < 0) {
                          resultLabel = 'PERDISTE';
                          resultColor = 'hsl(var(--no-color))';
                        } else {
                          resultLabel = 'EMPATE';
                          resultColor = 'hsl(var(--text-muted))';
                        }
                      }

                      return (
                        <tr key={m.marketId} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                          <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'hsl(var(--text-main))' }} title={m.question}>
                            {m.question}
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', color: 'hsl(var(--text-muted))' }}>{m.spent.toLocaleString()}</td>
                          <td style={{ padding: '0.85rem 0.5rem', color: 'hsl(var(--text-muted))' }}>{m.returned.toLocaleString()}</td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 800 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                              <span style={{ color: resultColor, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                {resultLabel}
                              </span>
                              {!isPending && m.net !== 0 && (
                                <span style={{ color: m.net > 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', fontSize: '0.8rem' }}>
                                  {m.net > 0 ? '+' : ''}{m.net.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .dashboard-charts-layout {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
