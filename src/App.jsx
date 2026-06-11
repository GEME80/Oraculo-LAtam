import React, { useState, useEffect } from 'react';
import { supabase, isMock } from './lib/supabaseClient';
import MarketCard from './components/MarketCard';
import MarketDetailModal from './components/MarketDetailModal';
import Leaderboard from './components/Leaderboard';
import RewardShop from './components/RewardShop';
import AiCurator from './components/AiCurator';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import AiCostControl from './components/AiCostControl';
import UserProfileTab from './components/UserProfileTab';
import Dashboard from './components/Dashboard';
import CategoryIcon, { CATEGORY_CONFIG } from './components/CategoryIcon';
import ClaimsTab from './components/ClaimsTab';
import { Dialog, DialogProvider } from './components/CustomDialog';

import { 
  Compass, 
  Briefcase, 
  BarChart3, 
  ShoppingBag, 
  Cpu, 
  Coins, 
  User, 
  Search, 
  LogOut, 
  LineChart, 
  Sparkles,
  DollarSign,
  ShieldAlert,
  HelpCircle,
  LayoutDashboard,
  Trash2
} from 'lucide-react';

const CATEGORIES = ['Todos', 'Política', 'Economía', 'Tecnología', 'Deportes', 'Cultura'];

// Mini sparkline component for real-time portfolio charts
function PositionSparkline({ marketId }) {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('market_price_history')
          .select('*')
          .eq('market_id', marketId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setHistory(data.map(d => parseFloat(d.yes_price)));
        }
      } catch (e) {
        console.error('Error fetching position history:', e);
      }
    };
    fetchHistory();
  }, [marketId]);

  if (history.length === 0) return null;

  const svgWidth = 80;
  const svgHeight = 30;
  
  const pathD = history.map((val, idx) => {
    const denom = history.length > 1 ? history.length - 1 : 1;
    const x = 5 + (idx / denom) * 70;
    const y = svgHeight - 5 - (val / 100) * (svgHeight - 10);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', marginLeft: 'auto', marginRight: '1rem', alignSelf: 'center' }}>
      <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
        <path d={pathD} fill="none" stroke="hsl(var(--brand))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={5 + 70} cy={svgHeight - 5 - (history[history.length - 1] / 100) * (svgHeight - 10)} r="2.5" fill="hsl(var(--brand))" />
      </svg>
      <span style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Trayectoria</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('markets');
  const [userProfile, setUserProfile] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [positions, setPositions] = useState([]);
  const [limitOrders, setLimitOrders] = useState([]);
  const [allUserPositions, setAllUserPositions] = useState([]);

  const fetchAllUserPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_positions')
        .select('*');
      if (!error && data) {
        setAllUserPositions(data);
      }
    } catch (e) {
      console.error('Error fetching all user positions:', e);
    }
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [initialOutcome, setInitialOutcome] = useState('YES');
  const [resetPasswordMode, setResetPasswordMode] = useState(false);

  // Load user profile and initial markets
  useEffect(() => {
    // Check if redirected from password recovery link
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setResetPasswordMode(true);
    }
    initializeSession();
  }, []);

  // Periodic Matching Engine loop for Rest Limit Orders
  useEffect(() => {
    if (userProfile) {
      simulateMatchingEngine();
      const interval = setInterval(() => {
        simulateMatchingEngine();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [userProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setPositions([]);
    setLimitOrders([]);
  };

  const handleDeleteAccount = async () => {
    try {
      const confirm1 = await Dialog.confirm(
        '¿Estás seguro de que deseas eliminar tu cuenta de forma permanente? Esta acción no se puede deshacer y perderás todos tus créditos y posiciones.'
      );
      if (!confirm1) return;

      const confirm2 = await Dialog.confirm(
        '¿Confirmas la eliminación definitiva al 100%? Se borrará tu usuario y perfil de manera permanente.'
      );
      if (!confirm2) return;

      const { error } = await supabase.rpc('delete_own_user');
      if (error) throw error;

      await Dialog.alert('Tu cuenta ha sido eliminada correctamente.');
      
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Sign out warning after deletion:', signOutErr);
      }
      
      setUserProfile(null);
      setPositions([]);
      setLimitOrders([]);
      window.location.reload();
    } catch (err) {
      console.error('Error deleting account:', err);
      await Dialog.alert('Hubo un error al intentar eliminar tu cuenta: ' + (err.message || err));
    }
  };

  useEffect(() => {
    filterMarkets();
  }, [markets, searchQuery, selectedCategory, positions]);

  const initializeSession = async () => {
    try {
      // Get user from Supabase auth (mock or real)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch or create profile
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          // Create default profile for the user, extracting Google user metadata if available
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
          const defaultProf = {
            id: user.id,
            username: googleName || (isMock ? 'Inversor LATAM' : `Usuario_${user.id.substring(0, 5)}`),
            avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            country: 'CO',
            orc_balance: 1000.00,
            reputation_points: 0,
            accuracy_rate: 0.00,
            predictions_count: 0
          };
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProf);
          
          profile = defaultProf;
        }

        setUserProfile(profile);
        fetchMarkets();
        fetchPositions(profile.id);
        fetchLimitOrders(profile.id);
      }
    } catch (err) {
      console.error('Session initialization error:', err);
    }
  };

  const fetchUserProfile = async () => {
    if (!userProfile) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };

  const fetchPositions = async (profileId) => {
    try {
      const { data, error } = await supabase
        .from('user_positions')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;
      setPositions(data || []);
      fetchAllUserPositions();
    } catch (err) {
      console.error('Error fetching user positions:', err);
    }
  };

  const fetchLimitOrders = async (profileId) => {
    try {
      const { data, error } = await supabase
        .from('limit_orders')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;
      setLimitOrders(data || []);
    } catch (err) {
      console.error('Error fetching limit orders:', err);
    }
  };

  const simulateMatchingEngine = async () => {
    try {
      const { data: pendingOrders, error: orderError } = await supabase
        .from('limit_orders')
        .select('*')
        .eq('status', 'pending');

      if (orderError || !pendingOrders || pendingOrders.length === 0) return;

      const { data: latestMarkets } = await supabase
        .from('markets')
        .select('*');
      if (!latestMarkets) return;

      let didFillAny = false;

      for (const order of pendingOrders) {
        const market = latestMarkets.find(m => m.id === order.market_id);
        if (!market || market.status !== 'active') continue;

        const currentPrice = order.outcome === 'YES' ? parseFloat(market.yes_price) : parseFloat(market.no_price);
        const limitPrice = parseFloat(order.limit_price);

        if (currentPrice <= limitPrice) {
          const cost = (limitPrice * parseFloat(order.contract_count)) / 100.0;
          
          await supabase
            .from('limit_orders')
            .update({ status: 'filled' })
            .eq('id', order.id);

          await supabase
            .from('transactions')
            .insert({
              profile_id: order.profile_id,
              market_id: order.market_id,
              outcome: order.outcome,
              type: 'buy',
              shares_count: parseFloat(order.contract_count),
              points_paid: cost
            });

          const { data: existingPos } = await supabase
            .from('user_positions')
            .select('*')
            .eq('profile_id', order.profile_id)
            .eq('market_id', order.market_id)
            .single();

          let updatedPos = {
            profile_id: order.profile_id,
            market_id: order.market_id,
            yes_shares: existingPos ? parseFloat(existingPos.yes_shares) : 0,
            no_shares: existingPos ? parseFloat(existingPos.no_shares) : 0,
            avg_price_yes: existingPos ? parseFloat(existingPos.avg_price_yes) : 0,
            avg_price_no: existingPos ? parseFloat(existingPos.avg_price_no) : 0
          };

          if (order.outcome === 'YES') {
            const currentShares = updatedPos.yes_shares;
            const currentAvg = updatedPos.avg_price_yes;
            const nextShares = currentShares + parseFloat(order.contract_count);
            const nextAvg = nextShares > 0 ? ((currentShares * currentAvg) + (parseFloat(order.contract_count) * limitPrice)) / nextShares : 0;
            updatedPos.yes_shares = nextShares;
            updatedPos.avg_price_yes = nextAvg;
          } else {
            const currentShares = updatedPos.no_shares;
            const currentAvg = updatedPos.avg_price_no;
            const nextShares = currentShares + parseFloat(order.contract_count);
            const nextAvg = nextShares > 0 ? ((currentShares * currentAvg) + (parseFloat(order.contract_count) * limitPrice)) / nextShares : 0;
            updatedPos.no_shares = nextShares;
            updatedPos.avg_price_no = nextAvg;
          }

          await supabase
            .from('user_positions')
            .upsert(updatedPos);

          await supabase
            .from('markets')
            .update({
              volume: parseFloat(market.volume) + cost
            })
            .eq('id', market.id);

          didFillAny = true;
          console.log(`[Matching Engine] Order ${order.id} filled at ${limitPrice}¢`);
        }
      }

      if (didFillAny) {
        await initializeSession();
      }
    } catch (e) {
      console.error('Error in simulateMatchingEngine:', e);
    }
  };

  const handleCashOut = async (pos, market) => {
    if (!userProfile) return;
    const hasYes = parseFloat(pos.yes_shares) > 0;
    const outcome = hasYes ? 'YES' : 'NO';
    const shares = hasYes ? parseFloat(pos.yes_shares) : parseFloat(pos.no_shares);
    const price = hasYes ? parseFloat(market.yes_price) : parseFloat(market.no_price);
    const liquidationValue = shares * (price / 100);

    const confirmClose = await Dialog.confirm(`¿Estás seguro de vender tus ${shares.toFixed(2)} contratos por un total de ${liquidationValue.toFixed(2)} créditos?`);
    if (!confirmClose) return;

    try {
      const { error: sellError } = await supabase
        .from('transactions')
        .insert({
          profile_id: userProfile.id,
          market_id: market.id,
          outcome,
          type: 'sell',
          shares_count: shares,
          points_paid: liquidationValue
        });

      if (sellError) throw sellError;

      const { error: posError } = await supabase
        .from('user_positions')
        .upsert({
          profile_id: userProfile.id,
          market_id: market.id,
          yes_shares: 0,
          no_shares: 0,
          avg_price_yes: 0,
          avg_price_no: 0
        });

      if (posError) throw posError;

      const poolWeight = parseFloat(market.volume) + 2000;
      const priceImpact = (liquidationValue / poolWeight) * 45;
      const originalYesPrice = parseFloat(market.yes_price);
      
      let newYesPrice;
      if (outcome === 'YES') {
        newYesPrice = Math.max(1, originalYesPrice - priceImpact);
      } else {
        newYesPrice = Math.min(99, originalYesPrice + priceImpact);
      }
      const newNoPrice = 100 - newYesPrice;

      const { error: marketError } = await supabase
        .from('markets')
        .update({
          yes_price: newYesPrice,
          no_price: newNoPrice,
          volume: parseFloat(market.volume) + liquidationValue
        })
        .eq('id', market.id);

      if (marketError) throw marketError;

      await initializeSession();
      await Dialog.alert(`Venta completada. Se han acreditado ${liquidationValue.toFixed(2)} créditos a tu balance.`);
    } catch (err) {
      console.error('Error on Cash Out:', err);
      await Dialog.alert('Hubo un error al vender tu posición.');
    }
  };

  const filterMarkets = () => {
    let result = [...markets];

    // Only active markets should be listed as options for prediction
    result = result.filter(m => m.status === 'active');

    // Filter out markets where user already has active position shares
    result = result.filter(m => !positions.some(p => p.market_id === m.id && (parseFloat(p.yes_shares) > 0 || parseFloat(p.no_shares) > 0)));

    // Search query filter
    if (searchQuery.trim() !== '') {
      result = result.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'Todos') {
      result = result.filter(m => m.category === selectedCategory);
    }

    setFilteredMarkets(result);
  };

  const handleSelectMarket = (market, outcome) => {
    setSelectedMarket(market);
    setInitialOutcome(outcome || 'YES');
    setIsModalOpen(true);
  };

  // Process trading transaction: buy YES or buy NO shares
  const handleTradeComplete = async (tradeDetails) => {
    if (!userProfile) return;

    if (tradeDetails.type === 'limit') {
      await initializeSession();
      return;
    }

    const { 
      market_id, 
      outcome, 
      type, 
      shares_count, 
      points_paid, 
      new_yes_price, 
      new_no_price, 
      new_volume 
    } = tradeDetails;

    try {
      // 1. Insert transaction history row (PostgreSQL trigger process_transaction_balance handles profile update on backend)
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          profile_id: userProfile.id,
          market_id,
          outcome,
          type,
          shares_count,
          points_paid
        });

      if (transError) throw transError;

      // 3. Upsert User Positions
      const existingPos = positions.find(p => p.market_id === market_id);
      let updatedPos = {
        profile_id: userProfile.id,
        market_id,
        yes_shares: existingPos ? parseFloat(existingPos.yes_shares) : 0,
        no_shares: existingPos ? parseFloat(existingPos.no_shares) : 0,
        avg_price_yes: existingPos ? parseFloat(existingPos.avg_price_yes) : 0,
        avg_price_no: existingPos ? parseFloat(existingPos.avg_price_no) : 0
      };

      if (outcome === 'YES') {
        const currentShares = updatedPos.yes_shares;
        const currentAvg = updatedPos.avg_price_yes;
        const nextShares = currentShares + shares_count;
        const nextAvg = nextShares > 0 ? ((currentShares * currentAvg) + (shares_count * (new_yes_price))) / nextShares : 0;
        
        updatedPos.yes_shares = nextShares;
        updatedPos.avg_price_yes = nextAvg;
      } else {
        const currentShares = updatedPos.no_shares;
        const currentAvg = updatedPos.avg_price_no;
        const nextShares = currentShares + shares_count;
        const nextAvg = nextShares > 0 ? ((currentShares * currentAvg) + (shares_count * (new_no_price))) / nextShares : 0;
        
        updatedPos.no_shares = nextShares;
        updatedPos.avg_price_no = nextAvg;
      }

      const { error: posError } = await supabase
        .from('user_positions')
        .upsert(updatedPos);

      if (posError) throw posError;

      // 4. Update Market values (price pool, volume)
      const { error: marketError } = await supabase
        .from('markets')
        .update({
          yes_price: new_yes_price,
          no_price: new_no_price,
          volume: new_volume
        })
        .eq('id', market_id);

      if (marketError) throw marketError;

      // 5. Refresh States
      await initializeSession();
      
    } catch (err) {
      console.error('Error executing trade transaction:', err);
      throw err;
    }
  };

  // Calculate stats for Portfolio View
  const getPortfolioValuation = () => {
    let totalVal = 0;
    positions.forEach(pos => {
      const market = markets.find(m => m.id === pos.market_id);
      if (market) {
        // Valuation based on current market probability price: shares * price_cents
        const yesVal = parseFloat(pos.yes_shares) * (parseFloat(market.yes_price) / 100);
        const noVal = parseFloat(pos.no_shares) * (parseFloat(market.no_price) / 100);
        totalVal += yesVal + noVal;
      }
    });
    return totalVal;
  };

  const getPortfolioCost = () => {
    let totalCost = 0;
    positions.forEach(pos => {
      const yesCost = parseFloat(pos.yes_shares) * (parseFloat(pos.avg_price_yes) / 100);
      const noCost = parseFloat(pos.no_shares) * (parseFloat(pos.avg_price_no) / 100);
      totalCost += yesCost + noCost;
    });
    return totalCost;
  };

  if (!userProfile) {
    return (
      <AuthScreen 
        onAuthSuccess={initializeSession} 
        forceResetPassword={resetPasswordMode} 
        onPasswordResetComplete={() => {
          setResetPasswordMode(false);
          // Clear hash to prevent reload loop
          window.location.hash = '';
          initializeSession();
        }}
      />
    );
  }

  const portfolioValue = getPortfolioValuation();
  const portfolioCost = getPortfolioCost();

  const netReturn = portfolioValue - portfolioCost;
  const netReturnPercent = portfolioCost > 0 ? (netReturn / portfolioCost) * 100 : 0;

  return (
    <div className="app-container">
      <DialogProvider />
      {/* Top sticky header bar */}
      <header className="app-header">
        <div className="brand-wrapper" onClick={() => setActiveTab('markets')}>
          <div className="brand-logo">
            <LineChart size={24} />
          </div>
          <h1>Oráculo-LATAM</h1>
        </div>

        <div className="header-actions">
          {userProfile && userProfile.role !== 'admin' && (
            <div className="user-balance-badge" title="Tus créditos virtuales">
              <Coins size={16} />
              <span>{parseFloat(userProfile.orc_balance).toLocaleString()} Créditos</span>
            </div>
          )}
          {userProfile && (
            <div 
              className={`user-profile-summary clickable-avatar ${activeTab === 'profile' ? 'active-avatar' : ''}`}
              onClick={() => setActiveTab('profile')}
              style={{ 
                cursor: 'pointer', 
                transition: 'opacity 0.2s', 
                border: activeTab === 'profile' ? '2px solid hsl(var(--brand))' : '2px solid transparent', 
                borderRadius: 'var(--radius-md)', 
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Ver Mi Perfil"
            >
              <img 
                src={userProfile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.username || 'user')}`} 
                alt={userProfile.username} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.username || 'user')}`;
                }}
              />
              <div className="profile-meta">
                <span className="username">{userProfile.username}</span>
                {userProfile.role === 'admin' ? (
                  <span className="rep" style={{ color: 'hsl(var(--no-color))', background: 'hsl(var(--no-bg) / 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>Administrador</span>
                ) : (
                  <span className="rep">{userProfile.reputation_points} Rep</span>
                )}
              </div>
            </div>
          )}
          {userProfile && (
            <button 
              onClick={handleSignOut} 
              className="tab-btn" 
              style={{ 
                padding: '0.4rem', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'transparent', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                color: 'hsl(var(--text-muted))',
                marginLeft: '0.5rem'
              }} 
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Tabs navigation */}
      <nav className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('markets')}
        >
          <Compass size={16} />
          Mercados
        </button>
        {userProfile?.role !== 'admin' && (
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <Briefcase size={16} />
            Portafolio
          </button>
        )}
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <BarChart3 size={16} />
          Leaderboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          <ShoppingBag size={16} />
          Alianzas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          <ShieldAlert size={16} />
          Reclamaciones
        </button>
        {userProfile?.role === 'admin' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'curator' ? 'active' : ''}`}
              onClick={() => setActiveTab('curator')}
            >
              <Cpu size={16} />
              Generador de Preguntas IA
            </button>
            <button 
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldAlert size={16} />
              Admin Panel
            </button>
            <button 
              className={`tab-btn ${activeTab === 'costs' ? 'active' : ''}`}
              onClick={() => setActiveTab('costs')}
            >
              <DollarSign size={16} />
              Costos IA
            </button>
          </>
        )}
      </nav>

      {/* Main dashboard content area */}
      <main className="main-content">
        
        {activeTab === 'markets' && (
          <div className="markets-container">
            {/* Filter and search panel */}
            <div className="filters-bar">
              <div className="category-filters">
                {CATEGORIES.map(cat => {
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Todos'];
                  const Icon = cfg.Icon;
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={`filter-chip ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={isActive ? {
                        background: cfg.bg,
                        color: cfg.color,
                        borderColor: cfg.border,
                        boxShadow: `0 0 12px ${cfg.glow || 'rgba(255,255,255,0.05)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      } : {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? cfg.color : 'inherit' }} />
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar mercados..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Markets Grid */}
            {filteredMarkets.length === 0 ? (
              <div className="empty-state">
                <Compass size={48} />
                <h3>No se encontraron mercados</h3>
                <p>Intenta buscando con otra palabra o selecciona una categoría diferente.</p>
              </div>
            ) : (
              <div className="markets-grid">
                {filteredMarkets.map((market) => (
                  <MarketCard 
                    key={market.id} 
                    market={market} 
                    onSelect={handleSelectMarket}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Mi Portafolio de Predicciones</h2>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                  Monitorea el valor actual de tus posiciones adquiridas en base a las probabilidades de mercado en vivo.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'hsl(var(--no-bg))',
                  color: 'hsl(var(--no-color))',
                  border: '1px solid hsl(var(--no-color) / 0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--no-color))';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--no-bg))';
                  e.currentTarget.style.color = 'hsl(var(--no-color))';
                }}
              >
                <Trash2 size={14} />
                Eliminar Cuenta
              </button>
            </div>

            {/* Stats Summary Panel */}
            <div className="portfolio-header">
              <div className="stat-card">
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Valor en Créditos
                  <span className="info-tooltip-wrapper">
                    <HelpCircle size={12} />
                    <span className="info-tooltip-text tooltip-right" style={{ fontWeight: 'normal' }}>
                      La suma de tus créditos disponibles en el balance más el valor de mercado estimado de todas tus posiciones activas.
                    </span>
                  </span>
                </span>
                <span className="stat-val">{(parseFloat(userProfile?.orc_balance) + portfolioValue).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Valor de Acciones</span>
                <span className="stat-val">{portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 2})} Créditos</span>
              </div>
              <div className="stat-card">
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Retorno Neto
                  <span className="info-tooltip-wrapper">
                    <HelpCircle size={12} />
                    <span className="info-tooltip-text tooltip-left" style={{ fontWeight: 'normal' }}>
                      Tus ganancias o pérdidas no realizadas en base a la diferencia entre el precio de compra promedio y el precio actual del mercado.
                    </span>
                  </span>
                </span>
                <span className={`stat-val ${netReturn >= 0 ? 'yes-color' : 'no-color'}`} style={{ color: netReturn >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))' }}>
                  {netReturn >= 0 ? '+' : ''}{netReturn.toLocaleString(undefined, {maximumFractionDigits: 2})} Créditos
                </span>
                <span className={`stat-sub ${netReturn >= 0 ? 'positive' : 'negative'}`}>
                  {netReturn >= 0 ? '▲' : '▼'} {netReturnPercent.toFixed(2)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Efectividad Global
                  <span className="info-tooltip-wrapper">
                    <HelpCircle size={12} />
                    <span className="info-tooltip-text tooltip-left" style={{ fontWeight: 'normal' }}>
                      Tu porcentaje de acierto histórico. Mide cuántas de tus predicciones finalizadas resultaron ganadoras.
                    </span>
                  </span>
                </span>
                <span className="stat-val">{userProfile?.accuracy_rate}%</span>
                <span className="stat-sub">{userProfile?.predictions_count} predicciones</span>
              </div>
            </div>

            {/* Positions list */}
            {(() => {
              const renderPositionCard = (pos) => {
                const market = markets.find(m => m.id === pos.market_id);
                if (!market) return null;

                const hasYes = parseFloat(pos.yes_shares) > 0;
                const shareOutcome = hasYes ? (market.option_a_label || 'SÍ') : (market.option_b_label || 'NO');
                const shares = hasYes ? pos.yes_shares : pos.no_shares;
                const avgPrice = hasYes ? pos.avg_price_yes : pos.avg_price_no;
                
                const currentMktPrice = hasYes ? market.yes_price : market.no_price;
                const currentVal = parseFloat(shares) * (parseFloat(currentMktPrice) / 100);
                const costBasis = parseFloat(shares) * (parseFloat(avgPrice) / 100);
                const pnl = currentVal - costBasis;
                const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                const parseDate = (d, fallback) => {
                  if (!d) return fallback;
                  const parsed = new Date(d);
                  return isNaN(parsed.getTime()) ? fallback : parsed;
                };
                const now = new Date();
                const createdDate = parseDate(market.created_at, now);
                const startDate = parseDate(market.start_date, createdDate);
                const endDate = parseDate(market.end_date, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
                const hasStarted = now >= startDate;
                const hasEnded = now >= endDate;

                const statusLabel = !hasStarted 
                  ? { text: 'Próximamente', bg: 'hsl(var(--brand-light))', color: 'hsl(var(--brand))' }
                  : hasEnded 
                    ? { text: 'Cerrado', bg: '#f1f5f9', color: '#64748b' }
                    : { text: 'Abierto', bg: 'hsl(var(--yes-bg))', color: 'hsl(var(--yes-color))' };

                const marketPos = allUserPositions.filter(p => p.market_id === market.id);
                const yesInvestors = marketPos.filter(p => parseFloat(p.yes_shares) > 0).length;
                const noInvestors = marketPos.filter(p => parseFloat(p.no_shares) > 0).length;
                const totalInvestors = yesInvestors + noInvestors;

                const yesPct = totalInvestors > 0 ? Math.round((yesInvestors / totalInvestors) * 100) : 50;
                const noPct = totalInvestors > 0 ? 100 - yesPct : 50;

                return (
                  <div key={pos.market_id} className="position-card" onClick={() => handleSelectMarket(market, shareOutcome)} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="pos-details" style={{ flex: '1', minWidth: '220px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{market.title}</h4>
                      <div className="pos-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem' }}>
                        <span className={`accuracy-badge ${shareOutcome === 'SÍ' ? 'yes-badge' : 'no-badge'}`} style={{
                          background: shareOutcome === 'SÍ' ? 'hsl(var(--yes-bg))' : 'hsl(var(--no-bg))',
                          color: shareOutcome === 'SÍ' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                        }}>
                          Acciones de {shareOutcome}
                        </span>
                        <span style={{
                          background: statusLabel.bg,
                          color: statusLabel.color,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {statusLabel.text}
                        </span>
                        <CategoryIcon category={market.category} showLabel={true} iconSize={10} size="sm" />
                      </div>

                      <div className="probability-bar-container" style={{ maxWidth: '320px', margin: '0.5rem 0 0 0' }}>
                        <div className="probability-bar-label" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.7rem' }}>
                          <span className="probability-bar-yes" style={{ whiteSpace: 'nowrap' }}>{market.option_a_label || 'SÍ'}: {yesPct}% ({yesInvestors} {yesInvestors === 1 ? 'analista' : 'analistas'})</span>
                          <span className="probability-bar-no" style={{ whiteSpace: 'nowrap' }}>{market.option_b_label || 'NO'}: {noPct}% ({noInvestors} {noInvestors === 1 ? 'analista' : 'analistas'})</span>
                        </div>
                        <div className="probability-track">
                          <div className="probability-fill-yes" style={{ width: `${yesPct}%` }} />
                          <div className="probability-fill-no" style={{ width: `${noPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <PositionSparkline marketId={pos.market_id} />
                    
                    <div className="pos-stats" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div className="pos-stat-item">
                        <span>Acciones</span>
                        <span>{parseFloat(shares).toFixed(2)}</span>
                      </div>
                      <div className="pos-stat-item">
                        <span>Precio Compra</span>
                        <span>{Math.round(avgPrice)}¢</span>
                      </div>
                      <div className="pos-stat-item">
                        <span>Precio Actual</span>
                        <span>{Math.round(currentMktPrice)}¢</span>
                      </div>
                      <div className="pos-stat-item">
                        <span>Valor Total</span>
                        <span style={{ fontWeight: 700 }}>{currentVal.toFixed(2)} Créditos</span>
                      </div>
                      <div className="pos-stat-item">
                        <span>P&L</span>
                        <span style={{ color: pnl >= 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', fontWeight: 'bold' }}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="pos-stat-item" style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCashOut(pos, market);
                          }}
                          disabled={market.status !== 'active' || hasEnded}
                          className="cashout-btn"
                          style={{
                            background: 'hsl(var(--no-bg))',
                            color: 'hsl(var(--no-color))',
                            border: '1px solid hsl(var(--no-color) / 0.3)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s ease',
                            opacity: (market.status !== 'active' || hasEnded) ? 0.5 : 1
                          }}
                        >
                          Vender Posición
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              if (positions.length === 0) {
                return (
                  <div className="empty-state">
                    <Briefcase size={48} />
                    <h3>Aún no tienes posiciones</h3>
                    <p>Explora la pestaña de "Mercados" y realiza tu primera predicción.</p>
                  </div>
                );
              }

              const activePos = positions.filter(pos => {
                const market = markets.find(m => m.id === pos.market_id);
                return market && market.status === 'active';
              });

              const resolvedPos = positions.filter(pos => {
                const market = markets.find(m => m.id === pos.market_id);
                return market && (market.status === 'resolved_yes' || market.status === 'resolved_no');
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {activePos.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💼 Posiciones Activas</span>
                      </h3>
                      <div className="portfolio-positions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activePos.map(pos => renderPositionCard(pos))}
                      </div>
                    </div>
                  )}

                  {resolvedPos.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-muted))' }}>
                        <span>📜 Historial de Predicciones (Resueltas)</span>
                      </h3>
                      <div className="portfolio-positions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {resolvedPos.map(pos => renderPositionCard(pos))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Limit Orders list */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2.5rem', marginBottom: '1rem' }}>Órdenes Límite Pendientes</h3>
            {limitOrders.filter(o => o.status === 'pending').length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>No tienes órdenes límite pendientes de ejecución.</p>
              </div>
            ) : (
              <div className="portfolio-positions-list">
                {limitOrders.filter(o => o.status === 'pending').map(order => {
                  const market = markets.find(m => m.id === order.market_id);
                  if (!market) return null;

                  const orderCost = (parseFloat(order.limit_price) * parseFloat(order.contract_count)) / 100.0;
                  const currentMktPrice = order.outcome === 'YES' ? market.yes_price : market.no_price;

                  return (
                    <div key={order.id} className="position-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid hsl(var(--brand))' }}>
                      <div style={{ flex: '1', minWidth: '220px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{market.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          <span className={`accuracy-badge ${order.outcome === 'YES' ? 'yes-badge' : 'no-badge'}`} style={{
                            background: order.outcome === 'YES' ? 'hsl(var(--yes-bg))' : 'hsl(var(--no-bg))',
                            color: order.outcome === 'YES' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                          }}>
                            Límite de {order.outcome === 'YES' ? (market.option_a_label || 'SÍ') : (market.option_b_label || 'NO')}
                          </span>
                          <span>Fijado a: <strong>{Math.round(order.limit_price)}¢</strong></span>
                          <span>Actual: {Math.round(currentMktPrice)}¢</span>
                        </div>
                      </div>

                      <div className="pos-stats" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="pos-stat-item">
                          <span>Contratos</span>
                          <span>{parseFloat(order.contract_count).toFixed(2)}</span>
                        </div>
                        <div className="pos-stat-item">
                          <span>Precio Límite</span>
                          <span>{Math.round(order.limit_price)}¢</span>
                        </div>
                        <div className="pos-stat-item">
                          <span>Costo Bloqueado</span>
                          <span style={{ fontWeight: 700 }}>{orderCost.toFixed(2)} Créditos</span>
                        </div>
                        <div className="pos-stat-item" style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmCancel = await Dialog.confirm('¿Deseas cancelar esta orden límite y recuperar los créditos bloqueados?');
                              if (!confirmCancel) return;
                              try {
                                await supabase
                                  .from('limit_orders')
                                  .update({ status: 'cancelled' })
                                  .eq('id', order.id);
                                await initializeSession();
                              } catch (err) {
                                console.error('Error cancelling order:', err);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              color: 'hsl(var(--no-color))',
                              border: '1px solid hsl(var(--no-color) / 0.3)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Cancelar Orden
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard userProfile={userProfile} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard userProfile={userProfile} />
        )}

        {activeTab === 'shop' && (
          <RewardShop 
            userProfile={userProfile} 
            onProfileUpdate={(profile) => setUserProfile(profile)} 
          />
        )}

        {activeTab === 'claims' && (
          <ClaimsTab 
            userProfile={userProfile} 
          />
        )}

        {activeTab === 'curator' && userProfile?.role === 'admin' && (
          <AiCurator onMarketLaunched={fetchMarkets} />
        )}

        {activeTab === 'admin' && userProfile?.role === 'admin' && (
          <AdminPanel onMarketApproved={fetchMarkets} onMarketResolved={() => { fetchMarkets(); initializeSession(); }} />
        )}

        {activeTab === 'costs' && userProfile?.role === 'admin' && (
          <AiCostControl />
        )}

        {activeTab === 'profile' && (
          <UserProfileTab 
            userProfile={userProfile} 
            onProfileUpdate={fetchUserProfile} 
          />
        )}
      </main>

      {/* Trading dialog modal */}
      <MarketDetailModal 
        market={selectedMarket}
        initialOutcome={initialOutcome}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userProfile={userProfile}
        onTradeComplete={handleTradeComplete}
        allUserPositions={allUserPositions}
      />
    </div>
  );
}
