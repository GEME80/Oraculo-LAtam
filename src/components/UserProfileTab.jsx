import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  Award, 
  Play, 
  RotateCw, 
  Briefcase, 
  Coins, 
  Check, 
  CheckCircle2,
  Tv,
  Calendar,
  HelpCircle,
  Camera,
  Upload,
  X
} from 'lucide-react';

export default function UserProfileTab({ userProfile, onProfileUpdate }) {
  // Account Form States
  const [username, setUsername] = useState(userProfile?.username || '');
  const [age, setAge] = useState(userProfile?.age || '');
  const [gender, setGender] = useState(userProfile?.gender || 'OTRO');
  const [password, setPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });



  // Avatar Customization States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar_url || '');
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('presets'); // presets, upload, url

  // Helper to create clean vector icon SVGs for a serious fintech feel
  const createSvgIcon = (c1, c2, iconPath) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${c1.replace('#', '')}-${c2.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#grad-${c1.replace('#', '')}-${c2.replace('#', '')})" />
      <g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(26, 26) scale(2)">
        ${iconPath}
      </g>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const presets = [
    {
      id: 'initials',
      name: 'Iniciales de Perfil',
      url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile?.username || 'user')}&backgroundColor=5a3eeb,10b981,0f172a,2563eb,db2777&fontSize=42&bold=true`
    },
    {
      id: 'icon-user',
      name: 'Inversor General',
      url: createSvgIcon('#3b82f6', '#1d4ed8', `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`)
    },
    {
      id: 'icon-analyst',
      name: 'Analista de Tendencias',
      url: createSvgIcon('#10b981', '#047857', `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />`)
    },
    {
      id: 'icon-portfolio',
      name: 'Gestor de Portafolio',
      url: createSvgIcon('#8b5cf6', '#6d28d9', `<rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />`)
    },
    {
      id: 'icon-target',
      name: 'Predicción Precisa',
      url: createSvgIcon('#ef4444', '#b91c1c', `<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />`)
    },
    {
      id: 'icon-globe',
      name: 'Estratega Global',
      url: createSvgIcon('#06b6d4', '#0891b2', `<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />`)
    },
    {
      id: 'icon-cpu',
      name: 'Especialista en Datos',
      url: createSvgIcon('#ec4899', '#be185d', `<rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />`)
    },
    {
      id: 'icon-shield',
      name: 'Gestor de Riesgos',
      url: createSvgIcon('#14b8a6', '#0f766e', `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`)
    },
    {
      id: 'icon-coins',
      name: 'Operador Financiero',
      url: createSvgIcon('#f59e0b', '#d97706', `<circle cx="8" cy="8" r="6" /><circle cx="18" cy="18" r="6" /><path d="M12 18a6 6 0 0 0-6-6" />`)
    },
    {
      id: 'icon-award',
      name: 'Líder del Tablero',
      url: createSvgIcon('#6366f1', '#4338ca', `<circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />`)
    },
    {
      id: 'icon-scale',
      name: 'Tomador de Decisiones',
      url: createSvgIcon('#64748b', '#475569', `<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="7" x2="19" y2="7" /><path d="M5 7v3a7 7 0 0 0 14 0V7" /><circle cx="12" cy="21" r="1" />`)
    },
    {
      id: 'icon-activity',
      name: 'Alta Frecuencia',
      url: createSvgIcon('#f43f5e', '#be123c', `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />`)
    }
  ];

  useEffect(() => {
    if (isModalOpen && userProfile) {
      setSelectedAvatar(userProfile.avatar_url || '');
      setCustomUrl('');
      setUploadError('');
      setActiveSubTab('presets');
    }
  }, [isModalOpen, userProfile]);

  const handleFileUpload = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('La imagen es demasiado grande. El límite es 1.5MB para asegurar el rendimiento.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido. Por favor selecciona un archivo de imagen (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAvatar(reader.result);
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo. Intenta de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (val) => {
    setCustomUrl(val);
    if (val.trim() && val.startsWith('http')) {
      setSelectedAvatar(val.trim());
      setUploadError('');
    } else if (val.trim()) {
      setUploadError('Por favor introduce un enlace válido que comience con http:// o https://');
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      setUploadError('Por favor selecciona o sube un avatar antes de guardar.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: selectedAvatar
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setProfileMsg({ text: '¡Avatar actualizado correctamente!', type: 'success' });
      setIsModalOpen(false);
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
    } catch (err) {
      console.error(err);
      setProfileMsg({ text: 'Error al actualizar el avatar.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setAge(userProfile.age || '');
      setGender(userProfile.gender || 'OTRO');
    }
  }, [userProfile]);



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({ text: '', type: '' });

    if (!username.trim()) {
      setProfileMsg({ text: 'El nombre de usuario es obligatorio.', type: 'error' });
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          age: age ? parseInt(age) : null,
          gender: gender
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setProfileMsg({ text: '¡Perfil actualizado correctamente!', type: 'success' });
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
    } catch (err) {
      console.error(err);
      setProfileMsg({ text: 'Error al actualizar el perfil. Quizá el nombre de usuario ya está tomado.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMsg({ text: '', type: '' });

    if (password.length < 6) {
      setPasswordMsg({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPasswordMsg({ text: '¡Contraseña actualizada con éxito!', type: 'success' });
      setPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMsg({ text: 'Error al actualizar la contraseña.', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };



  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="user-profile-tab" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {/* Grid container responsive */}
      <div 
        style={isAdmin ? {
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        } : { display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} 
        className={isAdmin ? "" : "profile-grid"}
      >
        
        {/* Left Column: Personal info & update account */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* Avatar and Balance Card */}
          <div className="leaderboard-view" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, hsl(var(--brand) / 0.05), hsl(var(--brand) / 0.1))', border: '1px solid hsl(var(--brand) / 0.15)' }}>
            <div 
              style={{ 
                position: 'relative', 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                cursor: 'pointer',
                overflow: 'hidden',
                border: '3px solid hsl(var(--brand))',
                padding: '2px',
                background: 'white',
                flexShrink: 0
              }}
              onClick={() => setIsModalOpen(true)}
              className="avatar-edit-container animate-pulse-glow"
              title="Cambiar avatar"
            >
              <img 
                src={userProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(15, 17, 23, 0.65)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  opacity: 0, 
                  transition: 'opacity 0.25s ease',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  gap: '2px'
                }}
                className="avatar-edit-overlay"
              >
                <Camera size={16} />
                <span>Cambiar</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="accuracy-badge" style={{ background: isAdmin ? 'hsl(var(--no-bg))' : 'hsl(var(--yes-bg))', color: isAdmin ? 'hsl(var(--no-color))' : 'hsl(var(--yes-color))', width: 'fit-content', fontSize: '0.7rem', fontWeight: 800 }}>
                ADMINISTRADOR
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{userProfile?.username}</h2>
              {!isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--brand))', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                  <Coins size={18} />
                  <span>{userProfile?.orc_balance?.toLocaleString()} Créditos</span>
                </div>
              )}
            </div>
          </div>

          {/* Form: Edit Profile Details */}
          <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} />
              Actualizar Datos Básicos
            </h3>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="trade-input-group">
                <label htmlFor="username">Nombre de Usuario</label>
                <input 
                  id="username"
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu alias o nombre de usuario"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="trade-input-group">
                  <label htmlFor="age">Edad</label>
                  <input 
                    id="age"
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej. 25"
                    min="13"
                    max="120"
                  />
                </div>
                
                <div className="trade-input-group">
                  <label htmlFor="gender">Género</label>
                  <select 
                    id="gender" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="OTRO">Otro / Prefiero no decir</option>
                  </select>
                </div>
              </div>

              {profileMsg.text && (
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: profileMsg.type === 'success' ? 'hsl(var(--yes-bg) / 0.3)' : 'hsl(var(--no-bg) / 0.3)',
                  color: profileMsg.type === 'success' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                  border: `1px solid ${profileMsg.type === 'success' ? 'hsl(var(--yes-color) / 0.15)' : 'hsl(var(--no-color) / 0.15)'}`
                }}>
                  <AlertCircle size={14} />
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="submit-trade-btn buy-yes" 
                disabled={isUpdatingProfile}
                style={{ marginTop: '0.5rem' }}
              >
                {isUpdatingProfile ? 'Guardando...' : 'Guardar Cambios de Perfil'}
              </button>
            </form>
          </div>

          {/* Form: Update Password */}
          <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} />
              Actualizar Contraseña
            </h3>
            
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="trade-input-group">
                <label htmlFor="password">Nueva Contraseña</label>
                <input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caracteres"
                  required
                />
              </div>

              {passwordMsg.text && (
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: passwordMsg.type === 'success' ? 'hsl(var(--yes-bg) / 0.3)' : 'hsl(var(--no-bg) / 0.3)',
                  color: passwordMsg.type === 'success' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                  border: `1px solid ${passwordMsg.type === 'success' ? 'hsl(var(--yes-color) / 0.15)' : 'hsl(var(--no-color) / 0.15)'}`
                }}>
                  <AlertCircle size={14} />
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="submit-trade-btn buy-no" 
                disabled={isUpdatingPassword}
                style={{ marginTop: '0.5rem' }}
              >
                {isUpdatingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Sponsors & KPIs */}
        {!isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Analyst Status & Metrics Section */}
            <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-main))' }}>
                <Award size={18} style={{ color: 'hsl(var(--brand))' }} />
                Estado del Analista
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', lineHeight: '1.45' }}>
                Estadísticas consolidadas de reputación, efectividad y balance disponibles en base a tu desempeño de predicciones.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Metric 1: Accuracy */}
                <div style={{ background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Tasa de Acierto</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Precisión de Predicción</span>
                  </div>
                  <span className="accuracy-badge" style={{ fontSize: '0.9rem', padding: '0.25rem 0.55rem' }}>
                    {parseFloat(userProfile?.accuracy_rate || 0).toFixed(1)}%
                  </span>
                </div>

                {/* Metric 2: Reputation */}
                <div style={{ background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Puntos de Reputación</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Prestigio en la Red</span>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'hsl(var(--brand))', fontFamily: 'var(--font-heading)' }}>
                    {userProfile?.reputation_points || 0} pts
                  </span>
                </div>

                {/* Metric 3: Predictions Count */}
                <div style={{ background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Mercados Participados</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Predicciones Totales</span>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'hsl(var(--text-main))', fontFamily: 'var(--font-heading)' }}>
                    {userProfile?.predictions_count || 0}
                  </span>
                </div>

                {/* Metric 4: Balance */}
                <div style={{ background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Balance de Créditos</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Créditos Disponibles</span>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'hsl(var(--yes-color))', fontFamily: 'var(--font-heading)' }}>
                    {parseFloat(userProfile?.orc_balance || 0).toLocaleString()} ¢
                  </span>
                </div>

                {/* Metric 5: Role */}
                <div style={{ background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Rol del Perfil</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Nivel de Autorización</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    background: userProfile?.role === 'admin' ? 'hsl(var(--no-bg) / 0.15)' : 'hsl(var(--yes-bg) / 0.15)', 
                    color: userProfile?.role === 'admin' ? 'hsl(var(--no-color))' : 'hsl(var(--yes-color))',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {(userProfile?.role || 'user').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
      
      {/* Avatar Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 11, 15, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 40px hsl(var(--brand) / 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '90vh',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'linear-gradient(to bottom, hsl(var(--bg-elevated) / 0.4), transparent)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-main))' }}>
                <Camera size={18} style={{ color: 'hsl(var(--brand))' }} />
                Personalizar tu Avatar
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                className="close-modal-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="custom-scrollbar">
              {/* Preview Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'hsl(var(--bg-elevated) / 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vista Previa</span>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '3px solid hsl(var(--brand))',
                    padding: '2px',
                    background: 'white',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(90, 62, 235, 0.2)'
                  }}>
                    <img 
                      src={selectedAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile?.username || 'user')}`;
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Elige una foto profesional o abstracta</span>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.4 }}>
                    Diseñado para la comunidad de Oráculo-LATAM. Selecciona entre presets ejecutivos/abstractos, sube un archivo local o provee un enlace directo.
                  </p>
                </div>
              </div>

              {/* Sub-tabs selector */}
              <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '2px' }}>
                <button 
                  onClick={() => { setActiveSubTab('presets'); setUploadError(''); }}
                  className={`tab-btn ${activeSubTab === 'presets' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Prediseñados
                </button>
                <button 
                  onClick={() => { setActiveSubTab('upload'); setUploadError(''); }}
                  className={`tab-btn ${activeSubTab === 'upload' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Subir Foto
                </button>
                <button 
                  onClick={() => { setActiveSubTab('url'); setUploadError(''); }}
                  className={`tab-btn ${activeSubTab === 'url' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Enlace URL
                </button>
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'hsl(var(--no-bg) / 0.3)',
                  color: 'hsl(var(--no-color))',
                  border: '1px solid hsl(var(--no-color) / 0.15)'
                }}>
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Panels */}
              <div style={{ minHeight: '180px' }}>
                {activeSubTab === 'presets' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                    {presets.map((preset) => {
                      const isSelected = selectedAvatar === preset.url;
                      return (
                        <div 
                          key={preset.id}
                          onClick={() => {
                            setSelectedAvatar(preset.url);
                            setUploadError('');
                          }}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            background: '#131722',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 12px hsl(var(--brand) / 0.4)' : 'none'
                          }}
                          className="preset-avatar-item"
                          title={preset.name}
                        >
                          <img 
                            src={preset.url} 
                            alt={preset.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(90, 62, 235, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                background: 'hsl(var(--brand))',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                              }}>
                                <Check size={12} strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeSubTab === 'upload' && (
                  <div 
                    style={{
                      border: '2px dashed hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.75rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'hsl(var(--bg-elevated) / 0.1)',
                      transition: 'border-color 0.2s'
                    }}
                    className="avatar-dropzone"
                  >
                    <Upload size={28} style={{ color: 'hsl(var(--brand))' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Subir imagen local</span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Soporta formatos JPG, PNG o WebP. Límite: 1.5MB</span>
                    </div>
                    
                    <label style={{
                      padding: '0.5rem 1rem',
                      background: 'hsl(var(--brand))',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 10px hsl(var(--brand) / 0.2)',
                      marginTop: '0.5rem'
                    }}
                    className="custom-file-label"
                    >
                      <Upload size={12} />
                      Examinar archivos
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                )}

                {activeSubTab === 'url' && (
                  <div className="trade-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="avatar-url-input" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enlace de la imagen</label>
                    <input 
                      id="avatar-url-input"
                      type="url"
                      value={customUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--bg-app))',
                        color: 'hsl(var(--text-main))',
                        fontSize: '0.85rem'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>
                      Pega la URL directa de una imagen pública. Se recomienda que la imagen sea cuadrada para evitar recortes extraños.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid hsl(var(--border))',
              background: 'linear-gradient(to top, hsl(var(--bg-elevated) / 0.4), transparent)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))',
                  background: 'transparent',
                  color: 'hsl(var(--text-main))',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                className="cancel-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAvatar}
                disabled={isUpdatingProfile || !selectedAvatar}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'hsl(var(--brand))',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: (isUpdatingProfile || !selectedAvatar) ? 0.6 : 1,
                  boxShadow: '0 4px 12px hsl(var(--brand) / 0.25)'
                }}
                className="save-btn"
              >
                {isUpdatingProfile ? 'Guardando...' : 'Aplicar Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Append responsive style wrapper */}
      <style>{`
        @media (min-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr 1.1fr !important;
          }
        }
        .avatar-edit-container:hover .avatar-edit-overlay {
          opacity: 1 !important;
        }
        .preset-avatar-item:hover {
          border-color: hsl(var(--brand) / 0.7) !important;
          transform: translateY(-2px);
        }
        .avatar-dropzone:hover {
          border-color: hsl(var(--brand) / 0.5) !important;
        }
        .close-modal-btn:hover {
          background-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
        .close-modal-btn {
          width: 28px;
          height: 28px;
        }
      `}</style>
    </div>
  );
}
