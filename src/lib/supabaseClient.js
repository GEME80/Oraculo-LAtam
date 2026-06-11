import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' &&
  !supabaseAnonKey.includes('PEGA_AQUI_TU_ANON_KEY');

export const isMock = !isValidCredentials;

// Seed Data for LocalStorage Simulation
// Seed IDs for the market healer — used to reset volumes to 0
const SEED_MARKET_IDS = [
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e001',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e002',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e003',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e004',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e005',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e006',
  'c2c1f4e1-27d1-447b-a320-c7be0ad0e007'
];

const initialMarkets = [
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e001',
    title: '¿Aprobará el Congreso de Colombia la reforma de salud antes de fin de año?',
    description: 'Se resolverá a SÍ si el Congreso de la República de Colombia aprueba en último debate el proyecto de ley de la reforma a la salud antes del 31 de diciembre. Se resolverá a NO en caso contrario.',
    category: 'Política',
    country: 'CO',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), 11, 31).toISOString(),
    yes_price: 64.00,
    no_price: 36.00,
    yes_liquidity: 640.00,
    no_liquidity: 360.00,
    volume: 0,
    status: 'active',
    resolution_source: 'https://www.senado.gov.co',
    image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e002',
    title: '¿Crecimiento del PIB de México superará el 2.5% anual en el reporte de Q3?',
    description: 'Se resolverá a SÍ si el INEGI publica que el crecimiento acumulado del PIB real supera el 2.5% anual para el tercer trimestre de este año. Se resolverá a NO si el crecimiento es de 2.5% o menos.',
    category: 'Economía',
    country: 'MX',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), 10, 15).toISOString(),
    yes_price: 42.00,
    no_price: 58.00,
    yes_liquidity: 420.00,
    no_liquidity: 580.00,
    volume: 0,
    status: 'active',
    resolution_source: 'https://www.inegi.org.mx',
    image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e003',
    title: '¿Alcanzará la inflación anual en Argentina menos del 80% en diciembre?',
    description: 'Se resolverá a SÍ si el INDEC reporta una tasa de inflación interanual acumulada menor al 80.0% en su informe de diciembre. Se resolverá a NO si es igual o superior.',
    category: 'Economía',
    country: 'AR',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), 11, 15).toISOString(),
    yes_price: 55.00,
    no_price: 45.00,
    yes_liquidity: 550.00,
    no_liquidity: 450.00,
    volume: 0,
    status: 'active',
    resolution_source: 'https://www.indec.gob.ar',
    image_url: 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e004',
    title: '¿Llegará una startup chilena a convertirse en Unicornio este semestre?',
    description: 'Se resolverá a SÍ si alguna startup con sede principal en Chile anuncia una ronda de inversión que eleve su valoración a 1,000 millones de USD o más antes de que termine el semestre en curso.',
    category: 'Tecnología',
    country: 'CL',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), 5, 30).toISOString(),
    yes_price: 18.00,
    no_price: 82.00,
    yes_liquidity: 180.00,
    no_liquidity: 820.00,
    volume: 0,
    status: 'active',
    resolution_source: 'https://www.corfo.cl',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e005',
    title: '¿Ganará Brasil la Copa América en la próxima edición?',
    description: 'Se resolverá a SÍ si la selección masculina absoluta de fútbol de Brasil se consagra campeona oficial de la Copa América. Se resolverá a NO en caso contrario.',
    category: 'Deportes',
    country: 'BR',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), 6, 15).toISOString(),
    yes_price: 72.00,
    no_price: 28.00,
    yes_liquidity: 720.00,
    no_liquidity: 280.00,
    volume: 0,
    status: 'active',
    resolution_source: 'https://www.conmebol.com',
    image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: new Date().toISOString()
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e006',
    title: '¿Se coronó Argentina campeón de la Copa América 2024?',
    description: 'Se resolverá a SÍ si la selección masculina absoluta de fútbol de Argentina se consagra campeona oficial de la Copa América 2024. Se resolverá a NO en caso contrario.',
    category: 'Deportes',
    country: 'AR',
    start_date: '2024-06-20T00:00:00Z',
    end_date: '2024-07-14T23:59:59Z',
    yes_price: 100.00,
    no_price: 0.00,
    yes_liquidity: 1000.00,
    no_liquidity: 0.00,
    volume: 0,
    status: 'resolved_yes',
    resolution_source: 'https://www.conmebol.com',
    image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: '2024-05-01T00:00:00Z'
  },
  {
    id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e007',
    title: '¿Superó la inflación de Colombia el 10% en el año 2024?',
    description: 'Se resolverá a SÍ si el DANE reporta una tasa de inflación anual acumulada mayor al 10.0% para diciembre de 2024. Se resolverá a NO en caso contrario.',
    category: 'Economía',
    country: 'CO',
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2025-01-05T23:59:59Z',
    yes_price: 0.00,
    no_price: 100.00,
    yes_liquidity: 0.00,
    no_liquidity: 1000.00,
    volume: 0,
    status: 'resolved_no',
    resolution_source: 'https://www.dane.gov.co',
    image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Rewards: empty for production — admin creates them from the panel
const initialRewards = [];

// IDs of dummy rewards to purge from any cached localStorage
const DUMMY_REWARD_IDS = [
  'a3c1f4e1-27d1-447b-a320-c7be0ad0e101',
  'a3c1f4e1-27d1-447b-a320-c7be0ad0e102',
  'a3c1f4e1-27d1-447b-a320-c7be0ad0e103',
  'a3c1f4e1-27d1-447b-a320-c7be0ad0e104'
];

// IDs of dummy sponsors to purge from any cached localStorage
const DUMMY_SPONSOR_IDS = ['spon-platzi', 'spon-rappi', 'spon-meli'];

// IDs of dummy profiles to purge from any cached localStorage
const DUMMY_PROFILE_IDS = [
  '00000000-0000-0000-0000-000000000000', // Inversor LATAM (defaultProfile)
  'mock-user-2', // OráculoMX
  'mock-user-3', // GauchoPredicts
  'mock-user-4', // PaulistaTrader
  'mock-user-5'  // ChaskiPredictor
];
const DUMMY_USERNAMES = ['Inversor LATAM', 'OráculoMX', 'GauchoPredicts', 'PaulistaTrader', 'ChaskiPredictor', 'gerkof@gmail.com', 'gerkof', 'Analista Oráculo'];
const DUMMY_EMAILS = ['analista@oraculo.com', 'gerkof@gmail.com', 'germanmoralesconsulting@gmail.com'];

// Helper to generate a realistic price history for seed markets
const generateInitialPriceHistory = () => {
  const history = [];
  initialMarkets.forEach(m => {
    const seed = m.id.charCodeAt(0) || 42;
    const basePrice = m.yes_price;
    // Generate 6 historical points over the last 5 days
    for (let i = 5; i >= 0; i--) {
      const fluctuation = ((seed + i) % 15) - 7;
      const pointYes = Math.min(99, Math.max(1, basePrice - (i * 2) + fluctuation));
      const pointNo = 100 - pointYes;
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      history.push({
        id: `hist-${m.id}-${i}`,
        market_id: m.id,
        yes_price: pointYes,
        no_price: pointNo,
        created_at: date.toISOString()
      });
    }
  });
  return history;
};

const initialPriceHistory = generateInitialPriceHistory();

// AI Agent Cost audit — empty for production (real data populates on use)
const initialAiCosts = [];

// Initialize LocalStorage Data if not present
const getOrSetLocalStorage = (key, defaultValue) => {
  const value = localStorage.getItem(key);
  if (!value) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(value);
};

if (isMock) {
  // --- Production-ready test accounts (only 2 users) ---
  const adminProfile = {
    id: 'admin-uuid-0000-0000-0000-000000000000',
    username: 'Administrador Oráculo',
    email: 'germanmoralesconsulting@gmail.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    country: 'CO',
    orc_balance: 0,
    reputation_points: 0,
    accuracy_rate: 0,
    predictions_count: 0,
    role: 'admin',
    age: 35,
    gender: 'MASCULINO',
    created_at: new Date().toISOString()
  };

  const investorProfile = {
    id: 'investor-uuid-0000-0000-0000-000000000001',
    username: 'Inversor de Prueba',
    email: 'inversor@oraculo.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inversor',
    country: 'CO',
    orc_balance: 1000.00,
    reputation_points: 0,
    accuracy_rate: 0,
    predictions_count: 0,
    role: 'user',
    age: 30,
    gender: 'MASCULINO',
    created_at: new Date().toISOString()
  };

  // Only the 2 real test users — no dummy leaderboard data
  const initialProfiles = [
    adminProfile,
    investorProfile
  ];

  // Sponsors: empty for production — admin creates them from the panel
  const initialSponsors = [];

  getOrSetLocalStorage('oraculo_profiles', initialProfiles);
  getOrSetLocalStorage('oraculo_markets', initialMarkets);
  getOrSetLocalStorage('oraculo_transactions', []);
  getOrSetLocalStorage('oraculo_positions', []);
  getOrSetLocalStorage('oraculo_rewards', initialRewards);
  getOrSetLocalStorage('oraculo_redemptions', []);
  getOrSetLocalStorage('oraculo_ai_costs', initialAiCosts);
  getOrSetLocalStorage('oraculo_price_history', initialPriceHistory);
  getOrSetLocalStorage('oraculo_sponsors', initialSponsors);
  getOrSetLocalStorage('oraculo_sponsor_claims', []);
  getOrSetLocalStorage('oraculo_resolved_payouts', []);
  getOrSetLocalStorage('oraculo_limit_orders', []);

  // Production: no seed claims — start empty
  getOrSetLocalStorage('oraculo_claims', []);

  getOrSetLocalStorage('oraculo_auth_users', [
    { email: 'germanmoralesconsulting@gmail.com', password: 'password123', id: adminProfile.id },
    { email: 'inversor@oraculo.com', password: 'password123', id: investorProfile.id }
  ]);

  // Self-healing / Migration — purges ALL dummy data from browser cache on every load
  const healProfiles = () => {
    const profilesRaw = localStorage.getItem('oraculo_profiles');
    if (profilesRaw) {
      try {
        let profiles = JSON.parse(profilesRaw);
        let changed = false;

        // Purge all dummy/obsolete profiles by ID and by username
        const lengthBefore = profiles.length;
        profiles = profiles.filter(p =>
          !DUMMY_PROFILE_IDS.includes(p.id) &&
          !DUMMY_USERNAMES.includes(p.username)
        );
        if (profiles.length !== lengthBefore) {
          changed = true;
          console.log('[Oraculo-LATAM] Purged', lengthBefore - profiles.length, 'dummy profile(s) from cache.');
        }

        // Auto-assign missing properties to any remaining legacy records
        profiles = profiles.map(p => {
          let updated = { ...p };
          let updatedItem = false;
          if (!p.role) { updated.role = 'user'; updatedItem = true; }
          if (!p.age) { updated.age = Math.floor(20 + Math.random() * 35); updatedItem = true; }
          if (!p.gender) {
            updated.gender = ['MASCULINO', 'FEMENINO', 'OTRO'][Math.floor(Math.random() * 3)];
            updatedItem = true;
          }
          if (updatedItem) { changed = true; return updated; }
          return p;
        });

        // Ensure admin exists with correct data
        if (!profiles.some(p => p.id === adminProfile.id)) {
          profiles.unshift(adminProfile);
          changed = true;
        } else {
          // Fix admin balance — admin should never have credits
          const adminIdx = profiles.findIndex(p => p.id === adminProfile.id);
          if (adminIdx > -1 && parseFloat(profiles[adminIdx].orc_balance) !== 0) {
            profiles[adminIdx] = { ...profiles[adminIdx], orc_balance: 0 };
            changed = true;
          }
        }

        // Ensure test investor exists
        if (!profiles.some(p => p.id === investorProfile.id)) {
          profiles.push(investorProfile);
          changed = true;
        }

        if (changed) {
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
          console.log('[Oraculo-LATAM Migration] Profiles healed and persisted.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing profiles:', e);
      }
    }
  };
  healProfiles();

  const healAuthUsers = () => {
    const authUsersRaw = localStorage.getItem('oraculo_auth_users');
    if (authUsersRaw) {
      try {
        let authUsers = JSON.parse(authUsersRaw);
        let changed = false;

        // Remove obsolete dummy auth entries
        const lengthBefore = authUsers.length;
        authUsers = authUsers.filter(u => !DUMMY_EMAILS.includes(u.email));
        if (authUsers.length !== lengthBefore) {
          changed = true;
          console.log('[Oraculo-LATAM] Purged', lengthBefore - authUsers.length, 'dummy auth user(s) from cache.');
        }

        // Heal existing records: add email_confirmed: true if undefined
        authUsers = authUsers.map(u => {
          if (u.email_confirmed === undefined) {
            u.email_confirmed = true;
            changed = true;
          }
          return u;
        });

        // Ensure only the 2 real test accounts exist
        const requiredUsers = [
          { email: 'germanmoralesconsulting@gmail.com', password: 'password123', id: adminProfile.id, email_confirmed: true },
          { email: 'inversor@oraculo.com', password: 'password123', id: investorProfile.id, email_confirmed: true }
        ];

        requiredUsers.forEach(reqUser => {
          if (!authUsers.some(u => u.email === reqUser.email)) {
            authUsers.push(reqUser);
            changed = true;
          }
        });

        if (changed) {
          localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));
          console.log('[Oraculo-LATAM Migration] Auth users healed and persisted.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing auth users:', e);
      }
    }
  };
  healAuthUsers();

  // Clean up invalid sessions if profile was purged
  const currentUserId = localStorage.getItem('oraculo_current_user_id');
  if (currentUserId) {
    const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
    if (!profiles.some(p => p.id === currentUserId)) {
      localStorage.removeItem('oraculo_current_user_id');
    }
  }

  // Purge claims from deleted dummy users
  const healClaims = () => {
    const claimsRaw = localStorage.getItem('oraculo_claims');
    if (claimsRaw) {
      try {
        let claims = JSON.parse(claimsRaw);
        const lengthBefore = claims.length;
        claims = claims.filter(c => !DUMMY_PROFILE_IDS.includes(c.profile_id));
        if (claims.length !== lengthBefore) {
          localStorage.setItem('oraculo_claims', JSON.stringify(claims));
          console.log('[Oraculo-LATAM] Purged', lengthBefore - claims.length, 'dummy claim(s) from cache.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing claims:', e);
      }
    }
  };
  healClaims();

  // Purge dummy AI cost entries
  const healAiCosts = () => {
    const costsRaw = localStorage.getItem('oraculo_ai_costs');
    if (costsRaw) {
      try {
        const costs = JSON.parse(costsRaw);
        // If ALL entries are the 3 known dummy ones (by name), wipe them
        const dummyNames = new Set(['Buscador de Noticias', 'Redactor de Preguntas', 'Auditor de Cierres']);
        const allDummy = costs.every(c => dummyNames.has(c.agent_name));
        if (allDummy && costs.length > 0) {
          localStorage.setItem('oraculo_ai_costs', JSON.stringify([]));
          console.log('[Oraculo-LATAM] Purged dummy AI cost entries from cache.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing AI costs:', e);
      }
    }
  };
  healAiCosts();

  const healMarkets = () => {
    const marketsRaw = localStorage.getItem('oraculo_markets');
    if (marketsRaw) {
      try {
        let markets = JSON.parse(marketsRaw);
        let changed = false;

        // Ensure the 2 resolved seed markets exist (needed for dispute demo flow)
        const resolvedSeeds = [
          {
            id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e006',
            title: '¿Se coronó Argentina campeón de la Copa América 2024?',
            description: 'Se resolverá a SÍ si la selección masculina absoluta de fútbol de Argentina se consagra campeona oficial de la Copa América 2024. Se resolverá a NO en caso contrario.',
            category: 'Deportes',
            country: 'AR',
            start_date: '2024-06-20T00:00:00Z',
            end_date: '2024-07-14T23:59:59Z',
            yes_price: 100.00,
            no_price: 0.00,
            yes_liquidity: 1000.00,
            no_liquidity: 0.00,
            volume: 35200.00,
            status: 'resolved_yes',
            resolution_source: 'https://www.conmebol.com',
            image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
            option_a_label: 'SÍ',
            option_b_label: 'NO',
            created_at: '2024-05-01T00:00:00Z'
          },
          {
            id: 'c2c1f4e1-27d1-447b-a320-c7be0ad0e007',
            title: '¿Superó la inflación de Colombia el 10% en el año 2024?',
            description: 'Se resolverá a SÍ si el DANE reporta una tasa de inflación anual acumulada mayor al 10.0% para diciembre de 2024. Se resolverá a NO en caso contrario.',
            category: 'Economía',
            country: 'CO',
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2025-01-05T23:59:59Z',
            yes_price: 0.00,
            no_price: 100.00,
            yes_liquidity: 0.00,
            no_liquidity: 1000.00,
            volume: 18200.00,
            status: 'resolved_no',
            resolution_source: 'https://www.dane.gov.co',
            image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
            option_a_label: 'SÍ',
            option_b_label: 'NO',
            created_at: '2024-01-01T00:00:00Z'
          }
        ];

        resolvedSeeds.forEach(seed => {
          if (!markets.some(m => m.id === seed.id)) {
            markets.push(seed);
            changed = true;
          }
        });

        if (changed) {
          localStorage.setItem('oraculo_markets', JSON.stringify(markets));
          console.log('[Oraculo-LATAM Migration] Added resolved seed markets.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing markets:', e);
      }
    }
  };
  healMarkets();

  // Purge dummy rewards from cache
  const healRewards = () => {
    const rewardsRaw = localStorage.getItem('oraculo_rewards');
    if (rewardsRaw) {
      try {
        let rewards = JSON.parse(rewardsRaw);
        const lengthBefore = rewards.length;
        rewards = rewards.filter(r => !DUMMY_REWARD_IDS.includes(r.id));
        if (rewards.length !== lengthBefore) {
          localStorage.setItem('oraculo_rewards', JSON.stringify(rewards));
          console.log('[Oraculo-LATAM] Purged', lengthBefore - rewards.length, 'dummy reward(s) from cache.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing rewards:', e);
      }
    }
  };
  healRewards();

  // Purge dummy sponsors from cache
  const healSponsors = () => {
    const sponsorsRaw = localStorage.getItem('oraculo_sponsors');
    if (sponsorsRaw) {
      try {
        let sponsors = JSON.parse(sponsorsRaw);
        const lengthBefore = sponsors.length;
        sponsors = sponsors.filter(s => !DUMMY_SPONSOR_IDS.includes(s.id));
        if (sponsors.length !== lengthBefore) {
          localStorage.setItem('oraculo_sponsors', JSON.stringify(sponsors));
          console.log('[Oraculo-LATAM] Purged', lengthBefore - sponsors.length, 'dummy sponsor(s) from cache.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing sponsors:', e);
      }
    }
  };
  healSponsors();

  // Reset inflated volumes on seed markets to 0
  const healMarketVolumes = () => {
    const marketsRaw = localStorage.getItem('oraculo_markets');
    if (marketsRaw) {
      try {
        let markets = JSON.parse(marketsRaw);
        let changed = false;
        markets = markets.map(m => {
          if (SEED_MARKET_IDS.includes(m.id) && parseFloat(m.volume) > 0) {
            changed = true;
            return { ...m, volume: 0 };
          }
          return m;
        });
        if (changed) {
          localStorage.setItem('oraculo_markets', JSON.stringify(markets));
          console.log('[Oraculo-LATAM] Reset dummy market volumes to 0.');
        }
      } catch (e) {
        console.error('[Oraculo-LATAM Migration] Error healing market volumes:', e);
      }
    }
  };
  healMarketVolumes();
}

// Local Storage Helper Client simulating real Auth states
const mockSupabaseClient = {
  auth: {
    getUser: async () => {
      const currentUserId = localStorage.getItem('oraculo_current_user_id');
      if (!currentUserId) {
        return { data: { user: null }, error: null };
      }
      const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
      const found = profiles.find(p => p.id === currentUserId);
      if (found) {
        const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
        const authUser = authUsers.find(u => u.id === currentUserId);
        const email = authUser ? authUser.email : `${found.username.toLowerCase()}@oraculo.com`;
        return { data: { user: { id: found.id, email } }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    // getSession: mirrors getUser for mock mode — returns session wrapper
    getSession: async () => {
      const currentUserId = localStorage.getItem('oraculo_current_user_id');
      if (!currentUserId) {
        return { data: { session: null }, error: null };
      }
      const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
      const found = profiles.find(p => p.id === currentUserId);
      if (found) {
        const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
        const authUser = authUsers.find(u => u.id === currentUserId);
        const email = authUser ? authUser.email : `${found.username.toLowerCase()}@oraculo.com`;
        return { data: { session: { user: { id: found.id, email } } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    signUp: async ({ email, password, options }) => {
      const username = options?.data?.username || email.split('@')[0];
      const country = options?.data?.country || 'CO';
      
      // Basic validations
      if (!email || !email.includes('@')) {
        return { data: { user: null }, error: { message: 'Por favor ingresa un correo electrónico válido.' } };
      }
      if (!password || password.length < 6) {
        return { data: { user: null }, error: { message: 'La contraseña debe tener al menos 6 caracteres.' } };
      }

      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      if (authUsers.some(u => u.email.trim().toLowerCase() === email.trim().toLowerCase())) {
        return { data: { user: null }, error: { message: 'El correo electrónico ya está registrado.' } };
      }

      const id = crypto.randomUUID();
      const role = email.includes('admin') ? 'admin' : 'user';

      const newUser = {
        id,
        username,
        email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        country,
        orc_balance: 1000.00,
        reputation_points: 0,
        accuracy_rate: 0.00,
        predictions_count: 0,
        role,
        created_at: new Date().toISOString()
      };

      // Add to Auth users DB (unconfirmed by default)
      authUsers.push({ email, password, id, email_confirmed: false });
      localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));

      // Add to public profiles DB
      const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
      profiles.push(newUser);
      localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));

      // SECURE: No auto-login after sign up. User must verify email first.
      return { data: { user: { id, email, email_confirmed: false } }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      const found = authUsers.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password);
      
      if (!found) {
        return { data: { user: null }, error: { message: 'Correo o contraseña incorrectos.' } };
      }

      if (found.email_confirmed === false) {
        return { data: { user: null }, error: { message: 'Debes verificar tu correo electrónico antes de iniciar sesión. Por favor revisa tu bandeja de entrada.' } };
      }

      // Log session
      localStorage.setItem('oraculo_current_user_id', found.id);
      return { data: { user: { id: found.id, email } }, error: null };
    },

    mockConfirmEmail: async (email) => {
      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      const idx = authUsers.findIndex(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
      if (idx > -1) {
        authUsers[idx].email_confirmed = true;
        localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));
        console.log(`[Simulación] Correo ${email} verificado con éxito.`);
        return { data: { success: true }, error: null };
      }
      return { data: null, error: { message: 'El correo electrónico no está registrado.' } };
    },

    signInWithOAuth: async ({ provider, options }) => {
      if (provider === 'google') {
        return new Promise((resolve) => {
          const width = 500;
          const height = 650;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const popup = window.open("", "Google Login", `width=${width},height=${height},top=${top},left=${left}`);
          
          if (popup) {
            popup.document.write(`
              <html>
              <head>
                <meta charset="utf-8">
                <title>Iniciar sesión: Cuentas de Google</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1.5rem; }
                  .card { background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); width: 100%; max-width: 380px; padding: 2.25rem 2rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; text-align: center; box-sizing: border-box; }
                  .logo { margin-bottom: 1rem; }
                  h1 { font-size: 1.35rem; color: #0f172a; margin: 0 0 0.5rem; font-weight: 600; letter-spacing: -0.01em; }
                  p { font-size: 0.85rem; color: #64748b; margin: 0 0 2rem; line-height: 1.4; }
                  .accounts-list { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
                  .account-btn { display: flex; align-items: center; gap: 0.875rem; width: 100%; padding: 0.75rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; text-align: left; box-sizing: border-box; }
                  .account-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }
                  .avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: white; flex-shrink: 0; }
                  .info { display: flex; flex-direction: column; line-height: 1.3; }
                  .name { font-weight: 600; font-size: 0.875rem; color: #1e293b; }
                  .email { font-size: 0.75rem; color: #64748b; }
                </style>
              </head>
              <body>
                <div class="card">
                  <svg class="logo" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.61 -0.05,-1.2 -0.16,-1.7z" fill="#4285F4" />
                    <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.57c-0.9,0.61 -2.07,0.98 -3.32,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.88v2.65c1.5,2.98 4.6,5.03 8.24,5.03z" fill="#34A853" />
                    <path d="M6.96,13.12c-0.18,-0.55 -0.28,-1.13 -0.28,-1.73s0.1,-1.19 0.28,-1.73V7.02H2.88c-0.62,1.25 -0.98,2.67 -0.98,4.18s0.36,2.93 0.98,4.18l4.08,-3.26z" fill="#FBBC05" />
                    <path d="M12,6.72c1.33,0 2.52,0.46 3.46,1.35l2.6,-2.6C16.46,3.87 14.43,3 12,3c-3.64,0 -6.74,2.05 -8.24,5.03l4.08,3.26c0.71,-2.13 2.7,-3.71 5.04,-3.71z" fill="#EA4335" />
                  </svg>
                  <h1>Elige una cuenta</h1>
                  <p>para continuar a Oráculo-LATAM</p>
                  
                  <div class="accounts-list">
                    <button class="account-btn" onclick="login('inversor@oraculo.com', 'Inversor de Prueba', 'CO')">
                      <div class="avatar" style="background: #10b981;">IP</div>
                      <div class="info">
                        <span class="name">Inversor de Prueba</span>
                        <span class="email">inversor@oraculo.com</span>
                      </div>
                    </button>

                    <button class="account-btn" onclick="login('germanmoralesconsulting@gmail.com', 'Administrador Oráculo', 'CO')">
                      <div class="avatar" style="background: #6366f1;">AO</div>
                      <div class="info">
                        <span class="name">Administrador Oráculo</span>
                        <span class="email">germanmoralesconsulting@gmail.com</span>
                      </div>
                    </button>

                    <button class="account-btn" onclick="showCustomForm()">
                      <div class="avatar" style="background: #64748b;">+</div>
                      <div class="info">
                        <span class="name">Usar otra cuenta</span>
                        <span class="email">Simular otra cuenta de Google</span>
                      </div>
                    </button>
                  </div>

                  <div id="custom-form-container" style="display: none; width: 100%; text-align: left; margin-top: 0.5rem;">
                    <form onsubmit="handleCustomSubmit(event)">
                      <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.75rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.25rem;">Correo de Google</label>
                        <input type="email" id="custom-email" required placeholder="ejemplo@gmail.com" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; outline: none; box-sizing: border-box;" />
                      </div>
                      <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.75rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.25rem;">Nombre Completo</label>
                        <input type="text" id="custom-name" required placeholder="Juan Pérez" style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; outline: none; box-sizing: border-box;" />
                      </div>
                      <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.75rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.25rem;">País de Residencia</label>
                        <select id="custom-country" required style="width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; outline: none; box-sizing: border-box; background: white;">
                          <option value="CO">Colombia 🇨🇴</option>
                          <option value="MX">México 🇲🇽</option>
                          <option value="AR">Argentina 🇦🇷</option>
                          <option value="BR">Brasil 🇧🇷</option>
                          <option value="CL">Chile 🇨🇱</option>
                          <option value="PE">Perú 🇵🇪</option>
                        </select>
                      </div>
                      <div style="display: flex; gap: 0.5rem;">
                        <button type="button" onclick="hideCustomForm()" style="flex: 1; padding: 0.6rem; border: 1px solid #cbd5e1; background: white; color: #475569; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;">Volver</button>
                        <button type="submit" style="flex: 1; padding: 0.6rem; border: none; background: #4285F4; color: white; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;">Siguiente</button>
                      </div>
                    </form>
                  </div>
                </div>
                
                <script>
                  function login(email, name, country) {
                    window.opener.postMessage({ 
                      type: 'GOOGLE_LOGIN_SUCCESS', 
                      email: email, 
                      name: name,
                      country: country
                    }, window.location.origin);
                    window.close();
                  }

                  function showCustomForm() {
                    document.querySelector('.accounts-list').style.display = 'none';
                    document.querySelector('h1').innerText = 'Usar otra cuenta';
                    document.querySelector('p').innerText = 'Ingresa los datos para simular Google';
                    document.getElementById('custom-form-container').style.display = 'block';
                  }

                  function hideCustomForm() {
                    document.getElementById('custom-form-container').style.display = 'none';
                    document.querySelector('h1').innerText = 'Elige una cuenta';
                    document.querySelector('p').innerText = 'para continuar a Oráculo-LATAM';
                    document.querySelector('.accounts-list').style.display = 'flex';
                  }

                  function handleCustomSubmit(e) {
                    e.preventDefault();
                    const email = document.getElementById('custom-email').value;
                    const name = document.getElementById('custom-name').value;
                    const country = document.getElementById('custom-country').value;
                    login(email, name, country);
                  }
                </script>
              </body>
              </html>
            `);
            popup.document.close();
          }

          const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data && event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
              window.removeEventListener('message', handleMessage);
              
              const { email, name, country } = event.data;
              const username = name;
              const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
              const role = email === 'germanmoralesconsulting@gmail.com' ? 'admin' : 'user';
              
              // Find or create profile
              const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
              let found = profiles.find(p => p.username === username);
              
              if (!found) {
                found = {
                  id: crypto.randomUUID(),
                  username,
                  email,
                  avatar_url,
                  country,
                  orc_balance: 1000.00,
                  reputation_points: role === 'admin' ? 500 : 150,
                  accuracy_rate: 75.00,
                  predictions_count: 8,
                  role,
                  created_at: new Date().toISOString()
                };
                profiles.push(found);
                localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
              }
              
              // Ensure OAuth user is registered in simulated auth database too
              const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
              if (!authUsers.some(u => u.id === found.id)) {
                authUsers.push({
                  email,
                  password: 'oauth_dummy_password',
                  id: found.id,
                  email_confirmed: true
                });
                localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));
              }
              
              localStorage.setItem('oraculo_current_user_id', found.id);
              resolve({ data: { user: { id: found.id, email } }, error: null });
            }
          };
          
          window.addEventListener('message', handleMessage);
        });
      }
      return { data: { url: '' }, error: null };
    },

    resetPasswordForEmail: async (email, options) => {
      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      const found = authUsers.some(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        return { data: null, error: { message: 'El correo electrónico no está registrado.' } };
      }
      console.log(`[Simulación] Enlace de recuperación de contraseña enviado a ${email}. Redireccionando a ${options?.redirectTo}`);
      return { data: {}, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('oraculo_current_user_id');
      return { error: null };
    },
    updateUser: async ({ password }) => {
      const currentUserId = localStorage.getItem('oraculo_current_user_id');
      if (!currentUserId) return { error: { message: 'Sesión no encontrada.' } };
      
      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      const userIdx = authUsers.findIndex(u => u.id === currentUserId);
      if (userIdx > -1) {
        authUsers[userIdx].password = password;
        localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));
      }
      return { data: { user: { id: currentUserId } }, error: null };
    },

    // No-op stub for mock mode (real Supabase uses this for OAuth/recovery redirects)
    onAuthStateChange: (callback) => {
      // In mock mode, no auth state changes happen automatically
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table) => {
    const keyMap = {
      profiles: 'oraculo_profiles',
      markets: 'oraculo_markets',
      transactions: 'oraculo_transactions',
      user_positions: 'oraculo_positions',
      rewards: 'oraculo_rewards',
      redemptions: 'oraculo_redemptions',
      ai_costs: 'oraculo_ai_costs',
      market_price_history: 'oraculo_price_history',
      sponsors: 'oraculo_sponsors',
      sponsor_claims: 'oraculo_sponsor_claims',
      resolved_payouts: 'oraculo_resolved_payouts',
      limit_orders: 'oraculo_limit_orders',
      claims: 'oraculo_claims'
    };
    
    const storageKey = keyMap[table];
    const getData = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
    const setData = (data) => localStorage.setItem(storageKey, JSON.stringify(data));

    return {
      select: (query = '*') => {
        const filters = [];
        let orderField = null;
        let orderAscending = false;
        let isSingle = false;

        const chain = {
          eq: (field, value) => {
            filters.push({ type: 'eq', field, value });
            return chain;
          },
          neq: (field, value) => {
            filters.push({ type: 'neq', field, value });
            return chain;
          },
          order: (field, { ascending = false } = {}) => {
            orderField = field;
            orderAscending = ascending;
            return chain;
          },
          single: () => {
            isSingle = true;
            return chain;
          },
          then: (resolve) => {
            let result = getData();
            filters.forEach(f => {
              if (f.type === 'eq') {
                result = result.filter(item => item[f.field] === f.value);
              } else if (f.type === 'neq') {
                result = result.filter(item => item[f.field] !== f.value);
              }
            });
            if (orderField) {
              result.sort((a, b) => {
                const valA = a[orderField];
                const valB = b[orderField];
                if (valA === undefined || valA === null) return orderAscending ? 1 : -1;
                if (valB === undefined || valB === null) return orderAscending ? -1 : 1;
                if (typeof valA === 'string') {
                  return orderAscending ? valA.localeCompare(valB || '') : (valB || '').localeCompare(valA);
                }
                return orderAscending ? (valA - valB) : (valB - valA);
              });
            }
            if (isSingle) {
              resolve({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } });
            } else {
              resolve({ data: result, error: null });
            }
          }
        };
        return chain;
      },
      insert: (record) => {
        const data = getData();
        const records = Array.isArray(record) ? record : [record];
        const newRecords = records.map(r => ({ id: r.id || crypto.randomUUID(), ...r }));

        // Simulate PostgreSQL default column values on markets inserts
        if (table === 'markets') {
          newRecords.forEach(m => {
            if (!m.start_date) m.start_date = new Date().toISOString();
            if (!m.created_at) m.created_at = new Date().toISOString();
          });
        }

        // Simulate balance lock when limit order is inserted (pending)
        if (table === 'limit_orders') {
          const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
          newRecords.forEach(order => {
            const profileIdx = profiles.findIndex(p => p.id === order.profile_id);
            if (profileIdx > -1) {
              const profile = profiles[profileIdx];
              if (order.status === 'pending') {
                const totalCost = parseFloat(order.limit_price) * parseFloat(order.contract_count) / 100.0;
                profile.orc_balance = Math.max(0, parseFloat(profile.orc_balance) - totalCost);
              }
              profiles[profileIdx] = profile;
            }
          });
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
        }

        // Simulate PostgreSQL process_transaction_balance trigger
        if (table === 'transactions') {
          const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
          newRecords.forEach(transaction => {
            const profileIdx = profiles.findIndex(p => p.id === transaction.profile_id);
            if (profileIdx > -1) {
              const profile = profiles[profileIdx];
              if (transaction.type === 'buy') {
                profile.orc_balance = Math.max(0, parseFloat(profile.orc_balance) - parseFloat(transaction.points_paid));
                profile.predictions_count = (profile.predictions_count || 0) + 1;
                profile.reputation_points = (profile.reputation_points || 0) + Math.round(parseFloat(transaction.points_paid) / 10);
              } else if (transaction.type === 'sell') {
                profile.orc_balance = parseFloat(profile.orc_balance) + parseFloat(transaction.points_paid);
              }
              profiles[profileIdx] = profile;
            }
          });
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
        }

        // Simulate PostgreSQL process_redemption_balance trigger
        if (table === 'redemptions') {
          const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
          const rewards = JSON.parse(localStorage.getItem('oraculo_rewards') || '[]');
          newRecords.forEach(redemption => {
            const profileIdx = profiles.findIndex(p => p.id === redemption.profile_id);
            if (profileIdx > -1) {
              const profile = profiles[profileIdx];
              const reward = rewards.find(r => r.id === redemption.reward_id);
              if (reward) {
                profile.orc_balance = Math.max(0, parseFloat(profile.orc_balance) - parseFloat(reward.cost));
              }
              profiles[profileIdx] = profile;
            }
          });
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
        }

        // Simulate PostgreSQL process_sponsor_claim_balance trigger
        if (table === 'sponsor_claims') {
          const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
          newRecords.forEach(claim => {
            const profileIdx = profiles.findIndex(p => p.id === claim.profile_id);
            if (profileIdx > -1) {
              const profile = profiles[profileIdx];
              profile.orc_balance = parseFloat(profile.orc_balance) + parseFloat(claim.reward_amount);
              profiles[profileIdx] = profile;
            }
          });
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
        }

        // Simulate PostgreSQL process_resolved_payout_balance trigger
        if (table === 'resolved_payouts') {
          const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
          newRecords.forEach(payout => {
            const profileIdx = profiles.findIndex(p => p.id === payout.profile_id);
            if (profileIdx > -1) {
              const profile = profiles[profileIdx];
              profile.orc_balance = parseFloat(profile.orc_balance) + parseFloat(payout.payout_amount);
              profiles[profileIdx] = profile;
            }
          });
          localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
        }

        setData([...data, ...newRecords]);
        return { data: newRecords, error: null };
      },
      update: (updates) => {
        const filters = [];
        const chain = {
          eq: (field, value) => {
            filters.push({ field, value });
            return chain;
          },
          then: (resolve) => {
            const data = getData();
            const updated = data.map(item => {
              const matches = filters.every(f => item[f.field] === f.value);
              if (matches) {
                // If this is the markets table and yes_price is updated, record history (trigger simulation)
                if (table === 'markets' && updates.yes_price !== undefined && parseFloat(item.yes_price) !== parseFloat(updates.yes_price)) {
                  const history = JSON.parse(localStorage.getItem('oraculo_price_history') || '[]');
                  history.push({
                    id: crypto.randomUUID(),
                    market_id: item.id,
                    yes_price: parseFloat(updates.yes_price),
                    no_price: parseFloat(updates.no_price || (100 - updates.yes_price)),
                    created_at: new Date().toISOString()
                  });
                  localStorage.setItem('oraculo_price_history', JSON.stringify(history));
                }
                // If this is the limit_orders table and status changes, handle balance refunds
                if (table === 'limit_orders' && updates.status !== undefined && item.status === 'pending' && updates.status !== 'pending') {
                  const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
                  const profileIdx = profiles.findIndex(p => p.id === item.profile_id);
                  if (profileIdx > -1) {
                    const profile = profiles[profileIdx];
                    const orderCost = (parseFloat(item.limit_price) * parseFloat(item.contract_count)) / 100.0;
                    profile.orc_balance = parseFloat(profile.orc_balance) + orderCost;
                    profiles[profileIdx] = profile;
                    localStorage.setItem('oraculo_profiles', JSON.stringify(profiles));
                  }
                }
                return { ...item, ...updates };
              }
              return item;
            });
            setData(updated);
            const affected = updated.filter(item => filters.every(f => item[f.field] === f.value));
            resolve({ data: affected, error: null });
          }
        };
        return chain;
      },
      upsert: (record) => {
        const data = getData();
        const records = Array.isArray(record) ? record : [record];
        
        records.forEach(rec => {
          const idx = data.findIndex(item => 
            (rec.id && item.id === rec.id) || 
            (rec.profile_id && rec.market_id && item.profile_id === rec.profile_id && item.market_id === rec.market_id)
          );
          if (idx > -1) {
            data[idx] = { ...data[idx], ...rec };
          } else {
            data.push(rec);
          }
        });
        setData(data);
        return { data: records, error: null };
      },
      delete: () => {
        const filters = [];
        const chain = {
          eq: (field, value) => {
            filters.push({ field, value });
            return chain;
          },
          then: (resolve) => {
            const data = getData();
            const filtered = data.filter(item => {
              return !filters.every(f => item[f.field] === f.value);
            });
            setData(filtered);
            resolve({ data: [], error: null });
          }
        };
        return chain;
      }
    };
  },
  rpc: async (functionName, params) => {
    if (functionName === 'delete_own_user') {
      const currentUserId = localStorage.getItem('oraculo_current_user_id');
      if (!currentUserId) return { data: null, error: { message: 'No authenticated session found.' } };
      
      // Delete user profile
      const profiles = JSON.parse(localStorage.getItem('oraculo_profiles') || '[]');
      const updatedProfiles = profiles.filter(p => p.id !== currentUserId);
      localStorage.setItem('oraculo_profiles', JSON.stringify(updatedProfiles));

      // Delete auth user
      const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
      const updatedAuth = authUsers.filter(u => u.id !== currentUserId);
      localStorage.setItem('oraculo_auth_users', JSON.stringify(updatedAuth));

      // Remove session
      localStorage.removeItem('oraculo_current_user_id');
      return { data: null, error: null };
    }
    return { data: null, error: { message: `Function ${functionName} not implemented in mock.` } };
  },
  storage: {
    from: (bucketName) => ({
      upload: async (path, file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result;
            const storageCache = JSON.parse(localStorage.getItem('oraculo_mock_storage') || '{}');
            storageCache[`${bucketName}/${path}`] = base64;
            localStorage.setItem('oraculo_mock_storage', JSON.stringify(storageCache));
            resolve({ data: { path }, error: null });
          };
          reader.onerror = () => {
            resolve({ data: null, error: { message: 'Error al leer el archivo en la simulación.' } });
          };
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path) => {
        const storageCache = JSON.parse(localStorage.getItem('oraculo_mock_storage') || '{}');
        const publicUrl = storageCache[`${bucketName}/${path}`] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';
        return { data: { publicUrl } };
      }
    })
  }
};

export const supabase = isValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : mockSupabaseClient;

console.log(`[Oraculo-LATAM DB Mode] Running in ${isMock ? 'SIMULATION (LocalStorage)' : 'PRODUCTION (Supabase)'} mode.`);
