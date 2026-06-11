import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  User, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

export default function ClaimsTab({ userProfile }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, pending, approved, rejected
  const [filterScope, setFilterScope] = useState('ALL'); // ALL, MINE

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClaims(data || []);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClaims = () => {
    return claims.filter(c => {
      // Scope Filter (Mine vs All)
      if (filterScope === 'MINE' && userProfile && c.profile_id !== userProfile.id) {
        return false;
      }
      
      // Status Filter
      if (filterStatus !== 'ALL' && c.status !== filterStatus) {
        return false;
      }

      // Search Query Filter (Market title, claimant, justification)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          c.market_title.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query) ||
          c.justification.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  const filteredClaims = getFilteredClaims();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return {
          text: 'Aprobada',
          bg: 'hsl(var(--yes-bg))',
          color: 'hsl(var(--yes-color))',
          icon: <CheckCircle2 size={14} />
        };
      case 'rejected':
        return {
          text: 'Rechazada',
          bg: 'hsl(var(--no-bg))',
          color: 'hsl(var(--no-color))',
          icon: <XCircle size={14} />
        };
      case 'pending':
      default:
        return {
          text: 'Pendiente',
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          icon: <Clock size={14} />
        };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
        Cargando historial de reclamaciones...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pilar de Transparencia: Reclamaciones</h2>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
          Registro público de impugnaciones presentadas por la comunidad. Los inversores pueden apelar resoluciones de mercados adjuntando evidencias oficiales de resolución.
        </p>
      </div>

      {/* Control panel & filters */}
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Scope Chips */}
          <button 
            className={`filter-chip ${filterScope === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterScope('ALL')}
            style={filterScope === 'ALL' ? { background: 'hsl(var(--brand))', color: 'white' } : {}}
          >
            Todas las Disputas
          </button>
          {userProfile && (
            <button 
              className={`filter-chip ${filterScope === 'MINE' ? 'active' : ''}`}
              onClick={() => setFilterScope('MINE')}
              style={filterScope === 'MINE' ? { background: 'hsl(var(--brand))', color: 'white' } : {}}
            >
              Mis Reclamaciones
            </button>
          )}

          <div style={{ width: '1px', background: 'hsl(var(--border))', margin: '0 0.5rem' }} />

          {/* Status Selectors */}
          {['ALL', 'pending', 'approved', 'rejected'].map(status => {
            const label = status === 'ALL' ? 'Todos' : status === 'pending' ? 'Pendientes' : status === 'approved' ? 'Aprobadas' : 'Rechazadas';
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  background: isActive ? 'hsl(var(--border))' : 'transparent',
                  color: isActive ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                  border: '1px solid hsl(var(--border))',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="search-box" style={{ maxWidth: '280px', width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por mercado o usuario..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Disputes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredClaims.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)' }}>
            <FileText size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '1rem', opacity: 0.6 }} />
            <h3>No se encontraron reclamaciones</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>No existen disputas registradas que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const statusCfg = getStatusLabel(claim.status);
            return (
              <div 
                key={claim.id} 
                className="position-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem', 
                  background: 'hsl(var(--bg-card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'default'
                }}
              >
                {/* Top header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'hsl(var(--text-main))', margin: 0 }}>
                      {claim.market_title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                        <User size={12} /> {claim.username}
                      </span>
                      <span>•</span>
                      <span>Presentada el {new Date(claim.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {statusCfg.icon}
                    {statusCfg.text}
                  </span>
                </div>

                {/* Justification & evidence block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Justificación del Reclamante</span>
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', lineHeight: 1.45, margin: 0 }}>
                      {claim.justification}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Resultado Reclamado:</span>
                      <strong className={`accuracy-badge ${claim.claimed_outcome === 'YES' ? 'yes-badge' : 'no-badge'}`} style={{
                        background: claim.claimed_outcome === 'YES' ? 'hsl(var(--yes-bg))' : 'hsl(var(--no-bg))',
                        color: claim.claimed_outcome === 'YES' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.7rem',
                        borderRadius: '4px'
                      }}>
                        {claim.claimed_outcome === 'YES' ? 'Opción A / SÍ' : 'Opción B / NO'}
                      </strong>
                    </div>

                    {claim.evidence_url && (
                      <a 
                        href={claim.evidence_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'hsl(var(--brand))',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={12} /> Ver Evidencia Oficial
                      </a>
                    )}
                  </div>
                </div>

                {/* Admin notes if processed */}
                {claim.status !== 'pending' && claim.admin_notes && (
                  <div style={{ 
                    background: 'hsl(var(--bg-app))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.85rem 1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.35rem', 
                    marginTop: '0.5rem' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: claim.status === 'approved' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', fontWeight: 800, textTransform: 'uppercase' }}>
                      <ShieldCheck size={12} /> Resolución Administrativa
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4, margin: 0 }}>
                      {claim.admin_notes}
                    </p>
                    {claim.resolved_at && (
                      <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                        Resuelta el {new Date(claim.resolved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Extra Notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span>Cualquier intento de impugnación con enlaces de evidencia maliciosos o justificantes falsos será penalizado con una deducción de 100 puntos de Reputación en el perfil del usuario.</span>
      </div>
    </div>
  );
}
