import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Ticket, Sparkles, HelpCircle, Gift, Plus, Edit3, Trash2, X, Check, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Dialog } from './CustomDialog';

export default function RewardShop({ userProfile, onProfileUpdate }) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemedItem, setRedeemedItem] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Admin Configuración Alianzas states
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [rewTitle, setRewTitle] = useState('');
  const [rewProvider, setRewProvider] = useState('');
  const [rewCost, setRewCost] = useState('');
  const [rewStock, setRewStock] = useState('');
  const [rewDesc, setRewDesc] = useState('');
  const [rewImgUrl, setRewImgUrl] = useState('');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('rewards').select('*');
      if (error) throw error;
      setRewards(data || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (!userProfile) return;
    if (userProfile.orc_balance < reward.cost) {
      await Dialog.alert('No tienes suficientes créditos para adquirir este premio.');
      return;
    }

    try {
      const newBalance = userProfile.orc_balance - reward.cost;

      // 1. Register redemption (PostgreSQL trigger process_redemption_balance will handle deduction on backend)
      const { error: redeemError } = await supabase
        .from('redemptions')
        .insert({
          profile_id: userProfile.id,
          reward_id: reward.id,
          status: 'completed'
        });

      if (redeemError) throw redeemError;

      // 2. Update stock of reward
      const { error: rewardError } = await supabase
        .from('rewards')
        .update({ stock: Math.max(0, reward.stock - 1) })
        .eq('id', reward.id);

      if (rewardError) throw rewardError;

      // 3. Fetch updated profile to ensure sync with database (real/mock)
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (!fetchError && updatedProfile) {
        onProfileUpdate(updatedProfile);
      } else {
        onProfileUpdate({ ...userProfile, orc_balance: newBalance });
      }
      setRedeemedItem(reward);
      setShowCelebration(true);
      
      // Update local rewards stock state
      setRewards(rewards.map(r => r.id === reward.id ? { ...r, stock: Math.max(0, r.stock - 1) } : r));

    } catch (err) {
      console.error('Error in redemption:', err);
      await Dialog.alert('Hubo un error al procesar el canje. Reintenta.');
    }
  };

  // Admin CRUD Functions
  const handleSaveReward = async (e) => {
    e.preventDefault();
    if (!rewTitle.trim() || !rewProvider.trim() || !rewCost || !rewStock || !rewDesc.trim()) {
      await Dialog.alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    const rewardData = {
      title: rewTitle.trim(),
      provider: rewProvider.trim(),
      cost: parseFloat(rewCost),
      stock: parseInt(rewStock, 10),
      description: rewDesc.trim(),
      image_url: rewImgUrl.trim() || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80'
    };

    try {
      if (editingRewardId) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingRewardId);

        if (error) throw error;
        await Dialog.alert('¡Alianza actualizada con éxito!');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(rewardData);

        if (error) throw error;
        await Dialog.alert('¡Alianza agregada con éxito!');
      }

      // Reset form states
      setRewTitle('');
      setRewProvider('');
      setRewCost('');
      setRewStock('');
      setRewDesc('');
      setRewImgUrl('');
      setEditingRewardId(null);
      await fetchRewards();
    } catch (err) {
      console.error('Error saving reward:', err);
      await Dialog.alert('Error al guardar la alianza.');
    }
  };

  const handleEditRewardClick = (reward) => {
    setEditingRewardId(reward.id);
    setRewTitle(reward.title);
    setRewProvider(reward.provider);
    setRewCost(reward.cost);
    setRewStock(reward.stock);
    setRewDesc(reward.description);
    setRewImgUrl(reward.image_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditReward = () => {
    setEditingRewardId(null);
    setRewTitle('');
    setRewProvider('');
    setRewCost('');
    setRewStock('');
    setRewDesc('');
    setRewImgUrl('');
  };

  const handleDeleteReward = async (rewardId) => {
    if (!await Dialog.confirm('¿Deseas eliminar esta alianza y su premio correspondiente de la tienda?')) return;
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;
      await Dialog.alert('¡Alianza eliminada con éxito!');
      await fetchRewards();
    } catch (err) {
      console.error('Error deleting reward:', err);
      await Dialog.alert('Error al eliminar la alianza.');
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>Cargando tienda...</div>;
  }

  return (
    <div className="reward-shop-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Admin Panel: Configuración Alianzas */}
      {isAdmin && (
        <div className="leaderboard-view" style={{ padding: '1.5rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-main))' }}>
            <Gift size={20} style={{ color: 'hsl(var(--brand))' }} />
            Configuración Alianzas
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
            Panel exclusivo de administración para crear, editar o dar de baja las alianzas corporativas y los premios redimibles por analistas.
          </p>

          {/* Form */}
          <form onSubmit={handleSaveReward} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem', padding: '1.25rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', background: 'hsl(var(--bg-app))' }}>
            <h4 style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {editingRewardId ? <Edit3 size={14} style={{ color: 'hsl(var(--brand))' }} /> : <Plus size={14} style={{ color: 'hsl(var(--brand))' }} />}
              {editingRewardId ? 'Editar Alianza Seleccionada' : 'Configurar Nueva Alianza'}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="sponsor-form-grid-responsive">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="sponsor-form-cols">
                <div className="trade-input-group">
                  <label htmlFor="rewTitle" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Título del Premio</label>
                  <input 
                    id="rewTitle" 
                    type="text" 
                    placeholder="Ej. Suscripción Platzi Premium 1 Mes" 
                    value={rewTitle} 
                    onChange={(e) => setRewTitle(e.target.value)} 
                    required 
                    style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="trade-input-group">
                  <label htmlFor="rewProvider" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Aliado / Empresa</label>
                  <input 
                    id="rewProvider" 
                    type="text" 
                    placeholder="Ej. Platzi, Bloomberg" 
                    value={rewProvider} 
                    onChange={(e) => setRewProvider(e.target.value)} 
                    required 
                    style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="sponsor-form-cols-three">
                <div className="trade-input-group">
                  <label htmlFor="rewCost" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Costo (Créditos)</label>
                  <input 
                    id="rewCost" 
                    type="number" 
                    placeholder="Ej. 5000" 
                    value={rewCost} 
                    onChange={(e) => setRewCost(e.target.value)} 
                    min="10"
                    required 
                    style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="trade-input-group">
                  <label htmlFor="rewStock" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Unidades Disponibles</label>
                  <input 
                    id="rewStock" 
                    type="number" 
                    placeholder="Ej. 10" 
                    value={rewStock} 
                    onChange={(e) => setRewStock(e.target.value)} 
                    min="0"
                    required 
                    style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="trade-input-group">
                  <label htmlFor="rewImgUrl" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>URL Imagen Cover (Opcional)</label>
                  <input 
                    id="rewImgUrl" 
                    type="url" 
                    placeholder="Ej. https://images.unsplash.com/..." 
                    value={rewImgUrl} 
                    onChange={(e) => setRewImgUrl(e.target.value)} 
                    style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="trade-input-group">
              <label htmlFor="rewDesc" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Descripción del Beneficio de Alianza</label>
              <textarea 
                id="rewDesc" 
                placeholder="Escribe las especificaciones del premio y las condiciones de canje..." 
                value={rewDesc} 
                onChange={(e) => setRewDesc(e.target.value)} 
                required 
                style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', padding: '0.6rem', borderRadius: 'var(--radius-sm)', width: '100%', height: '70px', resize: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              {editingRewardId && (
                <button 
                  type="button" 
                  onClick={handleCancelEditReward}
                  style={{ padding: '0.6rem 1.25rem', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <X size={14} /> Cancelar
                </button>
              )}
              <button 
                type="submit" 
                className="submit-trade-btn buy-yes" 
                style={{ width: 'fit-content', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                {editingRewardId ? <Check size={14} /> : <Plus size={14} />}
                {editingRewardId ? 'Guardar Cambios' : 'Crear Alianza'}
              </button>
            </div>
          </form>

          {/* List Table for Admins */}
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Imagen</th>
                  <th>Alianza / Beneficio</th>
                  <th>Aliado</th>
                  <th>Costo</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '1.5rem' }}>
                      No hay alianzas configuradas en la base de datos.
                    </td>
                  </tr>
                ) : (
                  rewards.map(reward => (
                    <tr key={reward.id}>
                      <td>
                        <img 
                          src={reward.image_url} 
                          alt={reward.title} 
                          style={{ width: '44px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid hsl(var(--border))' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold', color: 'hsl(var(--text-main))', fontSize: '0.85rem' }}>{reward.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                            {reward.description.length > 70 ? reward.description.substring(0, 70) + '...' : reward.description}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'hsl(var(--text-main))', fontWeight: 600, fontSize: '0.85rem' }}>{reward.provider}</td>
                      <td style={{ color: 'hsl(var(--brand))', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {parseInt(reward.cost).toLocaleString()} Créditos
                      </td>
                      <td style={{ color: reward.stock > 0 ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {reward.stock} uds
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            onClick={() => handleEditRewardClick(reward)}
                            style={{ padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteReward(reward.id)}
                            style={{ padding: '0.25rem 0.5rem', background: 'hsl(var(--no-bg) / 0.15)', color: 'hsl(var(--no-color))', border: '1px solid hsl(var(--no-color) / 0.15)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Shop Section */}
      <div>
        <div style={{ marginBottom: '2rem', borderBottom: isAdmin ? '1px solid hsl(var(--border))' : 'none', paddingBottom: isAdmin ? '1.5rem' : '0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-main))' }}>
            {isAdmin ? (
              <>
                <Eye size={20} style={{ color: 'hsl(var(--brand))' }} />
                Vista Previa de la Tienda (Analistas)
              </>
            ) : (
              <>
                Tienda de Alianzas y Premios
              </>
            )}
            {!isAdmin && (
              <span className="info-tooltip-wrapper" style={{ display: 'inline-flex' }}>
                <HelpCircle size={16} />
                <span className="info-tooltip-text tooltip-right" style={{ fontWeight: 'normal' }}>
                  Canjea tus créditos por licencias y beneficios oficiales patrocinados por las alianzas de Oráculo-LATAM.
                </span>
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
            {isAdmin 
              ? 'Verifica cómo ven los analistas la disposición, imágenes y costos de los canjes que configuras en la sección superior.'
              : 'Utiliza tus créditos acumulados para adquirir suscripciones premium y licencias de servicios provistos directamente por nuestros aliados corporativos estratégicos.'
            }
          </p>
        </div>

        <div className="rewards-grid">
          {rewards.map((reward) => {
            const canAfford = userProfile && userProfile.orc_balance >= reward.cost;
            const hasStock = reward.stock > 0;

            return (
              <div key={reward.id} className="reward-card">
                <div className="reward-img-wrapper">
                  <img src={reward.image_url} alt={reward.title} />
                  <span className="provider-badge">🤝 {reward.provider}</span>
                </div>
                <div className="reward-body">
                  <h3>{reward.title}</h3>
                  <p>{reward.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem', fontWeight: 600 }}>
                    <span>Disponibles: {reward.stock} uds</span>
                    <span style={{ color: 'hsl(var(--brand))' }}>Alianza Oficial ⚡</span>
                  </div>
                  <div className="reward-footer">
                    <div className="cost-value">
                      <span>COSTO DE CANJE</span>
                      <span>{parseInt(reward.cost).toLocaleString()} Créditos</span>
                    </div>
                    {isAdmin ? (
                      <button
                        className="redeem-btn"
                        disabled
                        style={{ background: 'hsl(var(--text-muted) / 0.15)', color: 'hsl(var(--text-muted))' }}
                      >
                        Administrador
                      </button>
                    ) : (
                      <button
                        className="redeem-btn"
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || !hasStock}
                        style={(!canAfford || !hasStock) ? { background: 'hsl(var(--text-muted) / 0.15)', color: 'hsl(var(--text-muted))' } : {}}
                      >
                        {!hasStock ? 'Agotado' : !canAfford ? 'Insuficiente' : 'Redimir'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebration Modal Overlay */}
      {showCelebration && redeemedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(10, 11, 15, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'scaleUp 0.3s ease-out'
          }}>
            <div style={{
              background: 'hsl(var(--yes-bg) / 0.15)',
              color: 'hsl(var(--yes-color))',
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
              ¡Canje Exitoso!
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.5' }}>
              Has redimido tu saldo por el premio: <strong>{redeemedItem.title}</strong> de la alianza con <strong>{redeemedItem.provider}</strong>. El código de activación y los pasos de acceso se han generado con éxito.
            </p>

            <div style={{
              background: 'hsl(var(--bg-app))',
              border: '1px dashed hsl(var(--border))',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Código de Activación</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--brand))', fontSize: '1.1rem' }}>
                ORC-LTM-{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </span>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                setRedeemedItem(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: 'none',
                background: 'hsl(var(--brand))',
                color: 'white',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              Volver a la Tienda
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .sponsor-form-cols {
            grid-template-columns: 1fr 1fr !important;
          }
          .sponsor-form-cols-three {
            grid-template-columns: 1fr 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
