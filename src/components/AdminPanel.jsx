import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Dialog } from './CustomDialog';
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Compass, 
  ShieldAlert,
  Edit3,
  Check,
  Percent,
  Play,
  Users,
  Activity,
  Trash2,
  X,
  Newspaper,
  ArrowLeft,
  Coins
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

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

export default function AdminPanel({ onMarketApproved, onMarketResolved }) {
  const [markets, setMarkets] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState('markets'); // 'markets' or 'claims'
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [resolvingMktId, setResolvingMktId] = useState(null);

  // Investor Management states
  const [investorProfiles, setInvestorProfiles] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [investorPositions, setInvestorPositions] = useState([]);
  const [investorRedemptions, setInvestorRedemptions] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [investorSearch, setInvestorSearch] = useState('');
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState('');
  const [repAdjustmentAmount, setRepAdjustmentAmount] = useState('');

  useEffect(() => {
    if (adminActiveTab === 'admins') {
      fetchAdminProfiles();
    } else if (adminActiveTab === 'investors') {
      fetchInvestorProfiles();
    }
  }, [adminActiveTab]);

  // Market editing states
  const [editingMktId, setEditingMktId] = useState(null);
  const [editMktTitle, setEditMktTitle] = useState('');
  const [editMktDesc, setEditMktDesc] = useState('');
  const [editMktStart, setEditMktStart] = useState('');
  const [editMktEnd, setEditMktEnd] = useState('');

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);

      // Fetch active/resolved markets
      const { data: marketData } = await supabase.from('markets').select('*');
      setMarkets(marketData || []);

      // Fetch positions to calculate participant counts & shares distribution
      const { data: posData } = await supabase.from('user_positions').select('*');
      setPositions(posData || []);

      // Fetch claims
      const { data: claimsData } = await supabase.from('claims').select('*');
      setClaims(claimsData || []);
    } catch (err) {
      console.error('Error loading admin panel system data:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const activeMarketsCount = markets.filter(m => m.status === 'active').length;
  const totalVolume = markets.reduce((acc, m) => acc + parseFloat(m.volume || 0), 0);
  
  const openInterest = positions.reduce((acc, pos) => {
    const market = markets.find(m => m.id === pos.market_id);
    if (market) {
      const yesVal = parseFloat(pos.yes_shares || 0) * (parseFloat(market.yes_price) / 100);
      const noVal = parseFloat(pos.no_shares || 0) * (parseFloat(market.no_price) / 100);
      return acc + yesVal + noVal;
    }
    return acc;
  }, 0);



  const handleSaveMarket = async (marketId) => {
    try {
      const { error } = await supabase
        .from('markets')
        .update({
          title: editMktTitle,
          description: editMktDesc,
          start_date: editMktStart,
          end_date: editMktEnd
        })
        .eq('id', marketId);

      if (error) throw error;
      setEditingMktId(null);
      await fetchSystemData();
      await Dialog.alert('¡Mercado actualizado correctamente!');
    } catch (err) {
      console.error(err);
      await Dialog.alert('Error al guardar los cambios del mercado.');
    }
  };

  const handleResolveMarket = async (marketId, outcome) => {
    const market = markets.find(m => m.id === marketId);
    const outcomeLabel = outcome === 'YES' 
      ? (market?.option_a_label || 'SÍ') 
      : (market?.option_b_label || 'NO');

    if (!await Dialog.confirm(`¿Estás seguro de que deseas resolver este mercado como ${outcomeLabel}? Esta acción es irreversible y acreditará los créditos correspondientes a todos los usuarios con posiciones ganadoras.`)) return;

    try {
      const nextStatus = outcome === 'YES' ? 'resolved_yes' : 'resolved_no';
      const { error: mktErr } = await supabase
        .from('markets')
        .update({ status: nextStatus })
        .eq('id', marketId);

      if (mktErr) throw mktErr;

      const { data: mktPositions, error: posErr } = await supabase
        .from('user_positions')
        .select('*')
        .eq('market_id', marketId);

      if (posErr) throw posErr;

      if (mktPositions && mktPositions.length > 0) {
        for (let pos of mktPositions) {
          const shares = outcome === 'YES' ? parseFloat(pos.yes_shares || 0) : parseFloat(pos.no_shares || 0);
          if (shares > 0) {
            const payout = shares; // 1 ORC per share
            await supabase.from('resolved_payouts').insert({
              profile_id: pos.profile_id,
              market_id: marketId,
              payout_amount: payout,
              outcome: outcome
            });
          }
        }
      }

      await supabase
        .from('user_positions')
        .delete()
        .eq('market_id', marketId);

      await Dialog.alert(`¡Mercado resuelto con éxito como ${outcomeLabel}! Las posiciones ganadoras han sido liquidadas.`);
      
      await fetchSystemData();
      if (onMarketResolved) {
        onMarketResolved();
      }
    } catch (err) {
      console.error(err);
      await Dialog.alert('Error al resolver el mercado.');
    }
  };

  const handleApproveClaim = async (claim) => {
    const confirmApprove = await Dialog.confirm(`¿Estás seguro de que deseas APROBAR esta reclamación? Esto cambiará la resolución del mercado a "${claim.claimed_outcome === 'YES' ? 'SÍ' : 'NO'}" y acreditará créditos a los nuevos ganadores.`);
    if (!confirmApprove) return;

    const notes = await Dialog.prompt("Ingresa una nota de resolución (opcional):", "Reclamación aprobada. Se valida la evidencia aportada y se re-resuelve el mercado.");
    if (notes === null) return;

    try {
      setLoading(true);

      const marketId = claim.market_id;
      const newOutcome = claim.claimed_outcome; // 'YES' or 'NO'
      const nextStatus = newOutcome === 'YES' ? 'resolved_yes' : 'resolved_no';

      // Update market status
      const { error: mktErr } = await supabase
        .from('markets')
        .update({ status: nextStatus })
        .eq('id', marketId);

      if (mktErr) throw mktErr;

      // Fetch transactions to reconstruct positions
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('market_id', marketId);

      if (txErr) throw txErr;

      const userShares = {};
      if (txs && txs.length > 0) {
        txs.forEach(tx => {
          const pid = tx.profile_id;
          if (!userShares[pid]) {
            userShares[pid] = { yes: 0, no: 0 };
          }
          const amt = parseFloat(tx.shares_count || 0);
          if (tx.type === 'buy') {
            if (tx.outcome === 'YES') userShares[pid].yes += amt;
            else userShares[pid].no += amt;
          } else if (tx.type === 'sell') {
            if (tx.outcome === 'YES') userShares[pid].yes -= amt;
            else userShares[pid].no -= amt;
          }
        });
      }

      // Check existing payouts
      const { data: existingPayouts, error: payErr } = await supabase
        .from('resolved_payouts')
        .select('*')
        .eq('market_id', marketId);

      if (payErr) throw payErr;

      // Credit new winners
      for (const pid of Object.keys(userShares)) {
        const shares = newOutcome === 'YES' ? userShares[pid].yes : userShares[pid].no;
        if (shares > 0) {
          const alreadyPaid = existingPayouts && existingPayouts.some(p => p.profile_id === pid && p.outcome === newOutcome);
          if (!alreadyPaid) {
            const payout = shares; // 1 ORC per share
            await supabase.from('resolved_payouts').insert({
              profile_id: pid,
              market_id: marketId,
              payout_amount: payout,
              outcome: newOutcome
            });
          }
        }
      }

      // Update claim status to approved
      await supabase
        .from('claims')
        .update({
          status: 'approved',
          admin_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      await Dialog.alert('¡Reclamación aprobada con éxito! El mercado fue re-resuelto y los créditos fueron dispersados.');
      await fetchSystemData();
      if (onMarketResolved) {
        onMarketResolved();
      }
    } catch (err) {
      console.error('Error approving claim:', err);
      await Dialog.alert('Ocurrió un error al procesar la aprobación de la reclamación.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClaim = async (claimId) => {
    const notes = await Dialog.prompt("Por favor ingresa la justificación del rechazo para la reclamación pública:");
    if (notes === null) return;
    if (!notes.trim()) {
      await Dialog.alert("Es necesario aportar una justificación para rechazar la reclamación.");
      return;
    }

    try {
      setLoading(true);
      await supabase
        .from('claims')
        .update({
          status: 'rejected',
          admin_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', claimId);

      await Dialog.alert('Reclamación rechazada. El ledger público de disputas ha sido actualizado.');
      await fetchSystemData();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      await Dialog.alert('Error al rechazar la reclamación.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      if (data) {
        setAdminProfiles(data.filter(p => p.role === 'admin'));
      }
    } catch (err) {
      console.error('Error fetching admin profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      if (data) {
        setInvestorProfiles(data.filter(p => p.role !== 'admin'));
      }
    } catch (err) {
      console.error('Error fetching investor profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectInvestor = async (investor) => {
    try {
      setLoading(true);
      setSelectedInvestor(investor);
      setCreditAdjustmentAmount('');
      setRepAdjustmentAmount('');

      // Fetch positions for the selected investor
      const { data: posData, error: posErr } = await supabase
        .from('user_positions')
        .select('*')
        .eq('profile_id', investor.id);
      if (posErr) throw posErr;
      setInvestorPositions(posData || []);

      // Fetch redemptions for the selected investor
      const { data: redData, error: redErr } = await supabase
        .from('redemptions')
        .select('*')
        .eq('profile_id', investor.id);
      if (redErr) throw redErr;
      setInvestorRedemptions(redData || []);

      // Fetch rewards list so we can resolve reward titles
      const { data: rewData, error: rewErr } = await supabase
        .from('rewards')
        .select('*');
      if (rewErr) throw rewErr;
      setRewardsList(rewData || []);

    } catch (err) {
      console.error('Error inspecting investor:', err);
      await Dialog.alert('Error al cargar la información detallada del inversionista.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;
    const amount = parseFloat(creditAdjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      await Dialog.alert('Por favor ingresa un monto válido (positivo o negativo) diferente de cero.');
      return;
    }

    const currentBalance = parseFloat(selectedInvestor.orc_balance || 0);
    const newBalance = Math.max(0, currentBalance + amount);

    const actionText = amount > 0 ? `sumar ${amount}` : `restar ${Math.abs(amount)}`;
    const confirm = await Dialog.confirm(`¿Estás seguro de que deseas ${actionText} créditos al saldo de ${selectedInvestor.username}? Nuevo saldo: ${newBalance} créditos.`);
    if (!confirm) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ orc_balance: newBalance })
        .eq('id', selectedInvestor.id);

      if (error) throw error;

      await Dialog.alert('¡Saldo ajustado correctamente!');
      setCreditAdjustmentAmount('');
      
      const updatedInvestor = { ...selectedInvestor, orc_balance: newBalance };
      setSelectedInvestor(updatedInvestor);
      setInvestorProfiles(prev => prev.map(p => p.id === selectedInvestor.id ? updatedInvestor : p));
    } catch (err) {
      console.error('Error adjusting balance:', err);
      await Dialog.alert('Error al ajustar el saldo del inversionista.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustReputation = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;
    const amount = parseInt(repAdjustmentAmount, 10);
    if (isNaN(amount) || amount === 0) {
      await Dialog.alert('Por favor ingresa una cantidad de puntos válida (positiva o negativa) diferente de cero.');
      return;
    }

    const currentRep = parseInt(selectedInvestor.reputation_points || 0, 10);
    const newRep = Math.max(0, currentRep + amount);

    const actionText = amount > 0 ? `sumar ${amount}` : `restar ${Math.abs(amount)}`;
    const confirm = await Dialog.confirm(`¿Estás seguro de que deseas ${actionText} puntos de reputación a ${selectedInvestor.username}? Nueva reputación: ${newRep} puntos.`);
    if (!confirm) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ reputation_points: newRep })
        .eq('id', selectedInvestor.id);

      if (error) throw error;

      await Dialog.alert('¡Puntos de reputación ajustados correctamente!');
      setRepAdjustmentAmount('');
      
      const updatedInvestor = { ...selectedInvestor, reputation_points: newRep };
      setSelectedInvestor(updatedInvestor);
      setInvestorProfiles(prev => prev.map(p => p.id === selectedInvestor.id ? updatedInvestor : p));
    } catch (err) {
      console.error('Error adjusting reputation:', err);
      await Dialog.alert('Error al ajustar la reputación del inversionista.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundPosition = async (pos) => {
    const market = markets.find(m => m.id === pos.market_id);
    const marketTitle = market ? market.title : 'Mercado Desconocido';
    const yesCost = (parseFloat(pos.yes_shares || 0) * parseFloat(pos.avg_price_yes || 0)) / 100.0;
    const noCost = (parseFloat(pos.no_shares || 0) * parseFloat(pos.avg_price_no || 0)) / 100.0;
    const refundAmount = yesCost + noCost;

    if (refundAmount <= 0) {
      await Dialog.alert('Esta posición no tiene un costo calculable para reembolsar.');
      return;
    }

    const confirm = await Dialog.confirm(`¿Estás seguro de que deseas reembolsar esta predicción en el mercado "${marketTitle}"?\nSe le reintegrarán ${refundAmount.toFixed(2)} créditos a ${selectedInvestor.username} y se eliminará su posición.`);
    if (!confirm) return;

    try {
      setLoading(true);

      const newBalance = parseFloat(selectedInvestor.orc_balance || 0) + refundAmount;
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ orc_balance: newBalance })
        .eq('id', selectedInvestor.id);

      if (profileErr) throw profileErr;

      const { error: deleteErr } = await supabase
        .from('user_positions')
        .delete()
        .eq('profile_id', selectedInvestor.id)
        .eq('market_id', pos.market_id);

      if (deleteErr) throw deleteErr;

      await Dialog.alert(`¡Posición reembolsada con éxito! Se acreditaron ${refundAmount.toFixed(2)} créditos.`);

      const updatedInvestor = { ...selectedInvestor, orc_balance: newBalance };
      setSelectedInvestor(updatedInvestor);
      setInvestorProfiles(prev => prev.map(p => p.id === selectedInvestor.id ? updatedInvestor : p));
      setInvestorPositions(prev => prev.filter(p => p.market_id !== pos.market_id));

    } catch (err) {
      console.error('Error refunding position:', err);
      await Dialog.alert('Error al procesar el reembolso de la posición.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRedemption = async (redemption) => {
    const reward = rewardsList.find(r => r.id === redemption.reward_id);
    const rewardTitle = reward ? reward.title : 'Premio Desconocido';

    const confirm = await Dialog.confirm(`¿Estás seguro de que deseas marcar como ENTREGADO el canje de "${rewardTitle}" para el usuario ${selectedInvestor.username}?`);
    if (!confirm) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('redemptions')
        .update({ status: 'completed' })
        .eq('id', redemption.id);

      if (error) throw error;

      await Dialog.alert('¡Canje marcado como entregado con éxito!');
      setInvestorRedemptions(prev => prev.map(r => r.id === redemption.id ? { ...r, status: 'completed' } : r));
    } catch (err) {
      console.error('Error completing redemption:', err);
      await Dialog.alert('Error al completar el canje.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRedemption = async (redemption) => {
    const reward = rewardsList.find(r => r.id === redemption.reward_id);
    const rewardTitle = reward ? reward.title : 'Premio Desconocido';
    const rewardCost = reward ? parseFloat(reward.cost || 0) : 0;

    const confirm = await Dialog.confirm(`¿Estás seguro de que deseas CANCELAR y REEMBOLSAR el canje de "${rewardTitle}" para ${selectedInvestor.username}?\nSe le reintegrarán ${rewardCost} créditos al usuario y se devolverá 1 unidad al stock del premio.`);
    if (!confirm) return;

    try {
      setLoading(true);

      const newBalance = parseFloat(selectedInvestor.orc_balance || 0) + rewardCost;
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ orc_balance: newBalance })
        .eq('id', selectedInvestor.id);

      if (profileErr) throw profileErr;

      if (reward) {
        const newStock = parseInt(reward.stock || 0, 10) + 1;
        const { error: rewardErr } = await supabase
          .from('rewards')
          .update({ stock: newStock })
          .eq('id', reward.id);
        if (rewardErr) throw rewardErr;
        setRewardsList(prev => prev.map(r => r.id === reward.id ? { ...r, stock: newStock } : r));
      }

      const { error: deleteErr } = await supabase
        .from('redemptions')
        .delete()
        .eq('id', redemption.id);

      if (deleteErr) throw deleteErr;

      await Dialog.alert(`¡Canje cancelado y reembolsado con éxito! Se reintegraron ${rewardCost} créditos.`);

      const updatedInvestor = { ...selectedInvestor, orc_balance: newBalance };
      setSelectedInvestor(updatedInvestor);
      setInvestorProfiles(prev => prev.map(p => p.id === selectedInvestor.id ? updatedInvestor : p));
      setInvestorRedemptions(prev => prev.filter(r => r.id !== redemption.id));

    } catch (err) {
      console.error('Error cancelling redemption:', err);
      await Dialog.alert('Error al cancelar el canje.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || addingAdmin) return;

    setAddingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newAdminEmail.trim().toLowerCase());

      if (error) throw error;

      if (!data || data.length === 0) {
        await Dialog.alert('No se encontró ningún usuario registrado con ese correo electrónico.');
        return;
      }

      const targetProfile = data[0];
      if (targetProfile.role === 'admin') {
        await Dialog.alert('Este usuario ya tiene permisos de administrador.');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', targetProfile.id);

      if (updateError) throw updateError;

      await Dialog.alert(`¡Usuario ${targetProfile.username} promovido a Administrador con éxito!`);
      setNewAdminEmail('');
      await fetchAdminProfiles();
    } catch (err) {
      console.error(err);
      await Dialog.alert('Ocurrió un error al intentar agregar al administrador.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (profile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === profile.id) {
        await Dialog.alert('No puedes quitarte los permisos de administrador a ti mismo.');
        return;
      }

      const confirm = await Dialog.confirm(`¿Estás seguro de que deseas retirar los permisos de administrador a ${profile.username} (${profile.email || 'sin correo'})?`);
      if (!confirm) return;

      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', profile.id);

      if (error) throw error;

      await Dialog.alert(`¡Permisos de administrador retirados a ${profile.username} con éxito!`);
      await fetchAdminProfiles();
    } catch (err) {
      console.error(err);
      await Dialog.alert('Ocurrió un error al intentar retirar los permisos.');
    }
  };


  const handleResetUserPassword = async (profile) => {
    const newPassword = await Dialog.prompt(`Ingresa la nueva contraseña para ${profile.username || 'este usuario'}:`, '', 'Actualizar Contraseña');
    if (!newPassword) return;

    if (newPassword.trim().length < 6) {
      await Dialog.alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const isClientMock = localStorage.getItem('supabase_is_mock') === 'true' || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (isClientMock) {
        const authUsers = JSON.parse(localStorage.getItem('oraculo_auth_users') || '[]');
        const userIdx = authUsers.findIndex(u => u.id === profile.id);
        if (userIdx > -1) {
          authUsers[userIdx].password = newPassword.trim();
          localStorage.setItem('oraculo_auth_users', JSON.stringify(authUsers));
          await Dialog.alert(`Contraseña de ${profile.username} actualizada con éxito en el simulador.`);
        } else {
          await Dialog.alert('No se encontró el registro de autenticación para este usuario en el simulador.');
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === profile.id) {
          const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
          if (error) throw error;
          await Dialog.alert('Tu propia contraseña ha sido actualizada con éxito en Supabase.');
        } else {
          await Dialog.alert(
            'Por motivos de seguridad en producción, Supabase impide que un administrador cambie la contraseña de otro usuario desde el frontend sin la clave privada de servicio.\n\nRecomendamos que el usuario utilice la opción de "¿Olvidaste tu contraseña?" o que la cambies directamente en la consola de Supabase Auth.'
          );
        }
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      await Dialog.alert('Error al intentar cambiar la contraseña: ' + (err.message || err));
    }
  };

  const handleResetToSeeds = async () => {
    if (!await Dialog.confirm('¿Estás seguro de que deseas restablecer todos los mercados a las 5 semillas oficiales y borrar cualquier mercado basura creado por la IA o manualmente?')) return;
    localStorage.removeItem('oraculo_markets');
    localStorage.removeItem('oraculo_market_drafts');
    localStorage.removeItem('oraculo_price_history');
    localStorage.removeItem('oraculo_positions');
    localStorage.removeItem('oraculo_transactions');
    localStorage.removeItem('oraculo_redemptions');
    
    await Dialog.alert('Base de datos restablecida. La página se recargará para inyectar las semillas oficiales.');
    window.location.reload();
  };

  const handlePurgeData = async () => {
    if (!await Dialog.confirm('¿Deseas purgar todas las transacciones, posiciones y el historial de cotizaciones de la simulación? Su balance de usuario permanecerá intacto.')) return;
    
    localStorage.setItem('oraculo_transactions', JSON.stringify([]));
    localStorage.setItem('oraculo_positions', JSON.stringify([]));
    localStorage.setItem('oraculo_redemptions', JSON.stringify([]));
    localStorage.setItem('oraculo_price_history', JSON.stringify([]));
    
    await Dialog.alert('Historial purgado con éxito. Recargando panel.');
    window.location.reload();
  };

  const filteredInvestors = investorProfiles.filter(p => {
    const search = investorSearch.toLowerCase();
    const usernameMatch = p.username && p.username.toLowerCase().includes(search);
    const emailMatch = p.email && p.email.toLowerCase().includes(search);
    return usernameMatch || emailMatch;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>Cargando panel de administrador...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={22} style={{ color: 'hsl(var(--brand))' }} />
          Panel de Control Administrativo
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
          Gestión de mercados publicados, resolución de resultados y herramientas del sistema.
        </p>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div style={{ 
        display: 'inline-flex', 
        gap: '0.25rem', 
        marginBottom: '2rem', 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid hsl(var(--border))', 
        padding: '0.35rem', 
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={() => setAdminActiveTab('markets')}
          style={{
            padding: '0.5rem 1.25rem',
            background: adminActiveTab === 'markets' ? 'hsl(var(--brand))' : 'transparent',
            color: adminActiveTab === 'markets' ? 'white' : 'hsl(var(--text-muted))',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: adminActiveTab === 'markets' ? '0 4px 12px hsl(var(--brand) / 0.25)' : 'none'
          }}
        >
          Gestión de Mercados
        </button>
        <button
          onClick={() => setAdminActiveTab('claims')}
          style={{
            padding: '0.5rem 1.25rem',
            background: adminActiveTab === 'claims' 
              ? (claims.filter(c => c.status === 'pending').length > 0 ? 'hsl(var(--no-color))' : 'hsl(var(--brand))') 
              : 'transparent',
            color: adminActiveTab === 'claims' ? 'white' : 'hsl(var(--text-muted))',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: adminActiveTab === 'claims' 
              ? `0 4px 12px ${claims.filter(c => c.status === 'pending').length > 0 ? 'hsl(var(--no-color) / 0.25)' : 'hsl(var(--brand) / 0.25)'}`
              : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          Gestión de Disputas
          {claims.filter(c => c.status === 'pending').length > 0 && (
            <span style={{
              background: adminActiveTab === 'claims' ? 'white' : 'hsl(var(--no-color))',
              color: adminActiveTab === 'claims' ? 'hsl(var(--no-color))' : 'white',
              padding: '0.1rem 0.4rem',
              borderRadius: '10px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {claims.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminActiveTab('admins')}
          style={{
            padding: '0.5rem 1.25rem',
            background: adminActiveTab === 'admins' ? 'hsl(var(--brand))' : 'transparent',
            color: adminActiveTab === 'admins' ? 'white' : 'hsl(var(--text-muted))',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: adminActiveTab === 'admins' ? '0 4px 12px hsl(var(--brand) / 0.25)' : 'none'
          }}
        >
          Gestión de Administradores
        </button>
        <button
          onClick={() => {
            setAdminActiveTab('investors');
            setSelectedInvestor(null);
          }}
          style={{
            padding: '0.5rem 1.25rem',
            background: adminActiveTab === 'investors' ? 'hsl(var(--brand))' : 'transparent',
            color: adminActiveTab === 'investors' ? 'white' : 'hsl(var(--text-muted))',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: adminActiveTab === 'investors' ? '0 4px 12px hsl(var(--brand) / 0.25)' : 'none'
          }}
        >
          Gestión de Inversores
        </button>
      </div>

      {adminActiveTab === 'markets' && (
        <>
          {/* Active Markets Management Section */}
          <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'hsl(var(--brand))' }} />
              Gestión de Mercados Activos y Participación
            </h3>

            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Mercado</th>
                    <th style={{ width: '15%' }}>Inicio</th>
                    <th style={{ width: '15%' }}>Vencimiento</th>
                    <th style={{ width: '20%' }}>Participación y Respuestas</th>
                    <th style={{ width: '10%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m) => {
                    const isEditing = editingMktId === m.id;

                    // Calculate active participation details (ignore 0 shares positions)
                    const marketPositions = positions.filter(pos => 
                      pos.market_id === m.id && 
                      (parseFloat(pos.yes_shares || 0) > 0 || parseFloat(pos.no_shares || 0) > 0)
                    );
                    const uniqueParticipants = new Set(marketPositions.map(pos => pos.profile_id)).size;

                    const totalYes = marketPositions.reduce((acc, pos) => acc + parseFloat(pos.yes_shares || 0), 0);
                    const totalNo = marketPositions.reduce((acc, pos) => acc + parseFloat(pos.no_shares || 0), 0);
                    const totalShares = totalYes + totalNo;

                    const yesPct = totalShares > 0 ? (totalYes / totalShares) * 100 : 0;
                    const noPct = totalShares > 0 ? (totalNo / totalShares) * 100 : 0;

                    return (
                      <tr key={m.id}>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                              <input 
                                type="text" 
                                value={editMktTitle} 
                                onChange={(e) => setEditMktTitle(e.target.value)} 
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid hsl(var(--border))', width: '100%', fontWeight: 'bold', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }} 
                                placeholder="Título"
                              />
                              <textarea 
                                value={editMktDesc} 
                                onChange={(e) => setEditMktDesc(e.target.value)} 
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid hsl(var(--border))', width: '100%', height: '60px', resize: 'none', fontSize: '0.8rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                                placeholder="Descripción"
                              />
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontWeight: 600, display: 'block', fontSize: '0.875rem', color: 'hsl(var(--text-main))' }}>{m.title}</span>
                              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '0.2rem' }}>
                                {m.description ? m.description.substring(0, 80) + '...' : 'Sin descripción'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input 
                              type="datetime-local" 
                              value={editMktStart ? editMktStart.substring(0, 16) : ''} 
                              onChange={(e) => setEditMktStart(e.target.value ? new Date(e.target.value).toISOString() : '')} 
                              style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid hsl(var(--border))', fontSize: '0.8rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-main))' }}>{formatDate(m.start_date)}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input 
                              type="datetime-local" 
                              value={editMktEnd ? editMktEnd.substring(0, 16) : ''} 
                              onChange={(e) => setEditMktEnd(e.target.value ? new Date(e.target.value).toISOString() : '')} 
                              style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid hsl(var(--border))', fontSize: '0.8rem', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-main))' }}>{formatDate(m.end_date)}</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 800, 
                                background: 'hsl(var(--brand) / 0.12)', 
                                color: 'hsl(var(--brand))', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: 'var(--radius-sm)' 
                              }}>
                                {uniqueParticipants} {uniqueParticipants === 1 ? 'Inversionista' : 'Inversionistas'}
                              </span>
                            </div>
                            {totalShares > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                  <span style={{ color: 'hsl(var(--yes-color))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '48%' }}>
                                    {m.option_a_label || 'SÍ'}: {Math.round(yesPct)}% ({totalYes.toFixed(0)} acc)
                                  </span>
                                  <span style={{ color: 'hsl(var(--no-color))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '48%' }}>
                                    {m.option_b_label || 'NO'}: {Math.round(noPct)}% ({totalNo.toFixed(0)} acc)
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border))', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                                  <div style={{ width: `${yesPct}%`, background: 'hsl(var(--yes-color))' }} />
                                  <div style={{ width: `${noPct}%`, background: 'hsl(var(--no-color))' }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Sin posiciones activas</span>
                            )}
                          </div>
                        </td>
                        <td style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            {isEditing ? (
                              <>
                                <button 
                                  onClick={() => handleSaveMarket(m.id)}
                                  style={{ padding: '0.25rem 0.5rem', background: 'hsl(var(--yes-color))', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  Guardar
                                </button>
                                <button 
                                  onClick={() => setEditingMktId(null)}
                                  style={{ padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button 
                                  onClick={() => {
                                    setEditingMktId(m.id);
                                    setEditMktTitle(m.title);
                                    setEditMktDesc(m.description || '');
                                    setEditMktStart(m.start_date || '');
                                    setEditMktEnd(m.end_date || '');
                                  }}
                                  style={{ padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  Editar
                                </button>
                                {m.status === 'active' ? (
                                  <>
                                    {resolvingMktId === m.id ? (
                                      <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '0.35rem', 
                                        background: 'hsl(var(--bg-app))', 
                                        padding: '0.5rem', 
                                        borderRadius: 'var(--radius-sm)', 
                                        border: '1px solid hsl(var(--border))', 
                                        position: 'absolute', 
                                        zIndex: 100, 
                                        right: '0.5rem', 
                                        bottom: '110%', 
                                        minWidth: '185px', 
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)' 
                                      }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>¿Qué opción ganó?</span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                          <button 
                                            onClick={() => {
                                              handleResolveMarket(m.id, 'YES');
                                              setResolvingMktId(null);
                                            }}
                                            style={{ padding: '0.3rem 0.5rem', background: 'hsl(var(--yes-color))', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                          >
                                            {m.option_a_label || 'SÍ'}
                                          </button>
                                          <button 
                                            onClick={() => {
                                              handleResolveMarket(m.id, 'NO');
                                              setResolvingMktId(null);
                                            }}
                                            style={{ padding: '0.3rem 0.5rem', background: 'hsl(var(--no-color))', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                          >
                                            {m.option_b_label || 'NO'}
                                          </button>
                                          <button 
                                            onClick={() => setResolvingMktId(null)}
                                            style={{ padding: '0.3rem 0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                          >
                                            X
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => setResolvingMktId(m.id)}
                                        style={{ padding: '0.25rem 0.5rem', background: 'hsl(var(--brand))', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                      >
                                        Resolver
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    fontWeight: 700, 
                                    background: m.status === 'resolved_yes' ? 'hsl(var(--yes-bg) / 0.15)' : 'hsl(var(--no-bg) / 0.15)', 
                                    color: m.status === 'resolved_yes' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    alignSelf: 'center'
                                  }}>
                                    RESUELTO ({m.status === 'resolved_yes' ? (m.option_a_label || 'SÍ') : (m.option_b_label || 'NO')})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Panel */}
          <div className="leaderboard-view" style={{ padding: '1.5rem', border: '1px solid hsl(var(--no-color) / 0.25)', background: 'hsl(var(--no-bg) / 0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--no-color))', borderBottom: '1px solid hsl(var(--no-color) / 0.2)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'hsl(var(--no-color))' }} />
              Herramientas de Mantenimiento (Simulación)
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '1.25rem' }}>
              Utilidades administrativas para restablecer y limpiar la base de datos local (localStorage) eliminando mercados de prueba basura y operaciones antiguas.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={handleResetToSeeds}
                style={{ padding: '0.5rem 1rem', background: 'hsl(var(--no-color))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Limpiar Mercados Basura (Reset a Semilla)
              </button>
              
              <button 
                onClick={handlePurgeData}
                style={{ padding: '0.5rem 1rem', background: 'hsl(var(--text-muted))', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Purgar Transacciones e Historial
              </button>
            </div>
          </div>
        </>
      )}

      {adminActiveTab === 'claims' && (
        /* Claims / Disputes Panel */
        <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'hsl(var(--brand))' }} />
            Consola de Gestión de Reclamaciones Pendientes
          </h3>

          <div className="leaderboard-table-container">
            {claims.filter(c => c.status === 'pending').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                🎉 No tienes reclamaciones pendientes de resolución.
              </div>
            ) : (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Reclamante</th>
                    <th style={{ width: '25%' }}>Mercado Impugnado</th>
                    <th style={{ width: '15%' }}>Opción Reclamada</th>
                    <th style={{ width: '30%' }}>Pruebas y Justificación</th>
                    <th style={{ width: '15%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.filter(c => c.status === 'pending').map((claim) => (
                    <tr key={claim.id}>
                      <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{claim.username}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{claim.market_title}</span>
                          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>ID: {claim.market_id}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: claim.claimed_outcome === 'YES' ? 'hsl(var(--yes-bg))' : 'hsl(var(--no-bg))',
                          color: claim.claimed_outcome === 'YES' ? 'hsl(var(--yes-color))' : 'hsl(var(--no-color))',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {claim.claimed_outcome === 'YES' ? 'Opción A / SÍ' : 'Opción B / NO'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <p style={{ margin: 0, fontStyle: 'italic', color: 'hsl(var(--text-muted))' }}>"{claim.justification}"</p>
                          {claim.evidence_url && (
                            <a 
                              href={claim.evidence_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: 'hsl(var(--brand))', fontWeight: 700, fontSize: '0.7rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              🔗 Enlace de Evidencia
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleApproveClaim(claim)}
                            style={{ padding: '0.35rem 0.5rem', background: 'hsl(var(--yes-bg))', color: 'hsl(var(--yes-color))', border: '1px solid hsl(var(--yes-color) / 0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Aprobar y Re-resolver
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            style={{ padding: '0.35rem 0.5rem', background: 'hsl(var(--no-bg))', color: 'hsl(var(--no-color))', border: '1px solid hsl(var(--no-color) / 0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Rechazar Impugnación
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {adminActiveTab === 'admins' && (
        <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'hsl(var(--brand))' }} />
            Consola de Gestión de Administradores
          </h3>

          {/* Form to add/promote admins */}
          <form onSubmit={handleAddAdmin} style={{ marginBottom: '2rem', background: 'hsl(var(--bg-app))', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'hsl(var(--text-main))' }}>
              Promover nuevo Administrador
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
              El usuario ya debe estar registrado previamente en la plataforma para poder ser promovido.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-main))',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                disabled={addingAdmin}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'hsl(var(--brand))',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  opacity: addingAdmin ? 0.6 : 1
                }}
              >
                {addingAdmin ? 'Promoviendo...' : 'Promover a Admin'}
              </button>
            </div>
          </form>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'hsl(var(--text-main))' }}>
            Administradores Activos
          </h4>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Nombre de Usuario</th>
                  <th style={{ width: '35%' }}>Correo Electrónico</th>
                  <th style={{ width: '35%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {adminProfiles.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                      Cargando lista de administradores...
                    </td>
                  </tr>
                ) : (
                  adminProfiles.map((profile) => (
                    <tr key={profile.id}>
                      <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{profile.username || 'Usuario sin nombre'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>{profile.email || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleResetUserPassword(profile)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: 'hsl(var(--brand) / 0.12)',
                              color: 'hsl(var(--brand))',
                              border: '1px solid hsl(var(--brand) / 0.25)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            Actualizar Clave
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(profile)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: 'hsl(var(--no-bg))',
                              color: 'hsl(var(--no-color))',
                              border: '1px solid hsl(var(--no-color) / 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            Retirar Permisos
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

      {adminActiveTab === 'investors' && (
        <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
          {selectedInvestor === null ? (
            // LIST VIEW
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'hsl(var(--brand))' }} />
                Consola de Gestión de Inversores
              </h3>

              {/* Buscador */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Buscar inversor por nombre o correo..."
                  value={investorSearch}
                  onChange={(e) => setInvestorSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--text-main))',
                    fontSize: '0.85rem'
                  }}
                />
                {investorSearch && (
                  <button
                    onClick={() => setInvestorSearch('')}
                    style={{
                      padding: '0.6rem 1rem',
                      background: 'transparent',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      color: 'hsl(var(--text-muted))',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Tabla de Inversores */}
              <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Inversor</th>
                      <th style={{ width: '25%' }}>Correo Electrónico</th>
                      <th style={{ width: '15%' }}>Saldo (Créditos)</th>
                      <th style={{ width: '12%' }}>Reputación</th>
                      <th style={{ width: '13%' }}>Acierto / Total</th>
                      <th style={{ width: '10%' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvestors.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                          No se encontraron inversionistas.
                        </td>
                      </tr>
                    ) : (
                      filteredInvestors.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img 
                                src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.username || 'U'}`} 
                                alt={p.username} 
                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid hsl(var(--border))' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>
                                  {p.username || 'N/A'} {COUNTRY_FLAGS[p.country] || ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>{p.email || 'N/A'}</td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                            {parseFloat(p.orc_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ORC
                          </td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--yes-color))' }}>
                            {p.reputation_points || 0} pts
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                            {p.accuracy_rate || 0}% ({p.predictions_count || 0})
                          </td>
                          <td>
                            <button
                              onClick={() => handleInspectInvestor(p)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: 'hsl(var(--brand) / 0.12)',
                                color: 'hsl(var(--brand))',
                                border: '1px solid hsl(var(--brand) / 0.25)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              Inspeccionar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // DETAIL / INSPECTION VIEW
            <>
              {/* Back button and Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedInvestor(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.8rem',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <ArrowLeft size={16} /> Volver
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img 
                    src={selectedInvestor.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedInvestor.username}`} 
                    alt={selectedInvestor.username} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid hsl(var(--brand))' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'white' }}>
                      {selectedInvestor.username} {COUNTRY_FLAGS[selectedInvestor.country] || ''}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                      ID: {selectedInvestor.id} | Rol: {selectedInvestor.role} | {selectedInvestor.email || 'Sin correo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Layout for details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                
                {/* Adjustments Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Credits adjustment Form */}
                  <form onSubmit={handleAdjustBalance} style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid hsl(var(--border))', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Coins size={16} style={{ color: 'hsl(var(--brand))' }} />
                      Ajuste de Créditos Virtuales
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
                      Suma o resta créditos directamente al balance del inversor. Usa signo negativo (-) para restar.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ej. 100 o -50"
                        value={creditAdjustmentAmount}
                        onChange={(e) => setCreditAdjustmentAmount(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--bg-app))',
                          color: 'white',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'hsl(var(--brand))',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </form>

                  {/* Reputation adjustment Form */}
                  <form onSubmit={handleAdjustReputation} style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid hsl(var(--border))', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Activity size={16} style={{ color: 'hsl(var(--yes-color))' }} />
                      Ajuste de Reputación
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
                      Suma o resta puntos de reputación del inversor. Usa signo negativo (-) para restar.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="1"
                        placeholder="Ej. 10 o -5"
                        value={repAdjustmentAmount}
                        onChange={(e) => setRepAdjustmentAmount(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--bg-app))',
                          color: 'white',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'hsl(var(--yes-color))',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </form>

                </div>

                {/* Predictions History / refund positions */}
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid hsl(var(--border))', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                    Historial de Predicciones y Posiciones Activas
                  </h4>
                  <div className="leaderboard-table-container">
                    {investorPositions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                        No hay predicciones activas registradas para este usuario.
                      </div>
                    ) : (
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Mercado</th>
                            <th>Opción</th>
                            <th>Contratos</th>
                            <th>Precio Promedio</th>
                            <th>Costo Calculado</th>
                            <th>Estado</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investorPositions.flatMap((pos) => {
                            const market = markets.find(m => m.id === pos.market_id);
                            const marketTitle = market ? market.title : 'Mercado Desconocido';
                            const marketStatus = market ? market.status : 'unknown';
                            
                            const hasYes = parseFloat(pos.yes_shares || 0) > 0;
                            const hasNo = parseFloat(pos.no_shares || 0) > 0;
                            
                            const rows = [];
                            if (hasYes) {
                              const cost = (parseFloat(pos.yes_shares) * parseFloat(pos.avg_price_yes || 0)) / 100.0;
                              rows.push(
                                <tr key={`${pos.market_id}-YES`}>
                                  <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{marketTitle}</td>
                                  <td>
                                    <span style={{
                                      background: 'hsl(var(--yes-bg))',
                                      color: 'hsl(var(--yes-color))',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}>
                                      {market?.option_a_label || 'SÍ'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>{pos.yes_shares} acc</td>
                                  <td style={{ fontSize: '0.8rem' }}>{parseFloat(pos.avg_price_yes || 0).toFixed(1)}¢</td>
                                  <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                                    {cost.toFixed(2)} ORC
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>
                                    <span style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: marketStatus === 'active' ? 'hsl(var(--yes-color))' : 'hsl(var(--text-muted))'
                                    }}>
                                      {marketStatus === 'active' ? 'ACTIVO' : 'CERRADO'}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleRefundPosition(pos)}
                                      style={{
                                        padding: '0.35rem 0.5rem',
                                        background: 'hsl(var(--no-bg))',
                                        color: 'hsl(var(--no-color))',
                                        border: '1px solid hsl(var(--no-color) / 0.3)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      Reembolsar
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                            if (hasNo) {
                              const cost = (parseFloat(pos.no_shares) * parseFloat(pos.avg_price_no || 0)) / 100.0;
                              rows.push(
                                <tr key={`${pos.market_id}-NO`}>
                                  <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{marketTitle}</td>
                                  <td>
                                    <span style={{
                                      background: 'hsl(var(--no-bg))',
                                      color: 'hsl(var(--no-color))',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}>
                                      {market?.option_b_label || 'NO'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>{pos.no_shares} acc</td>
                                  <td style={{ fontSize: '0.8rem' }}>{parseFloat(pos.avg_price_no || 0).toFixed(1)}¢</td>
                                  <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                                    {cost.toFixed(2)} ORC
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>
                                    <span style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: marketStatus === 'active' ? 'hsl(var(--yes-color))' : 'hsl(var(--text-muted))'
                                    }}>
                                      {marketStatus === 'active' ? 'ACTIVO' : 'CERRADO'}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleRefundPosition(pos)}
                                      style={{
                                        padding: '0.35rem 0.5rem',
                                        background: 'hsl(var(--no-bg))',
                                        color: 'hsl(var(--no-color))',
                                        border: '1px solid hsl(var(--no-color) / 0.3)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      Reembolsar
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                            return rows;
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Shop Redemptions list */}
                <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid hsl(var(--border))', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                    Historial de Canjes de Tienda (Alianzas)
                  </h4>
                  <div className="leaderboard-table-container">
                    {investorRedemptions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                        No hay canjes de tienda registrados para este usuario.
                      </div>
                    ) : (
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Premio / Alianza</th>
                            <th>Costo</th>
                            <th>Fecha de Canje</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investorRedemptions.map((red) => {
                            const reward = rewardsList.find(r => r.id === red.reward_id);
                            const rewardTitle = reward ? reward.title : 'Premio Desconocido';
                            const rewardCost = reward ? reward.cost : 0;
                            return (
                              <tr key={red.id}>
                                <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{rewardTitle}</td>
                                <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                                  {rewardCost} ORC
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                                  {formatDate(red.created_at)}
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: red.status === 'completed' ? 'hsl(var(--yes-bg) / 0.15)' : 'rgba(255, 150, 0, 0.15)',
                                    color: red.status === 'completed' ? 'hsl(var(--yes-color))' : 'orange',
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '4px'
                                  }}>
                                    {red.status === 'completed' ? 'COMPLETADO' : 'PENDIENTE'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {red.status !== 'completed' && (
                                      <button
                                        onClick={() => handleCompleteRedemption(red)}
                                        style={{
                                          padding: '0.35rem 0.5rem',
                                          background: 'hsl(var(--yes-bg))',
                                          color: 'hsl(var(--yes-color))',
                                          border: '1px solid hsl(var(--yes-color) / 0.3)',
                                          borderRadius: 'var(--radius-sm)',
                                          cursor: 'pointer',
                                          fontSize: '0.7rem',
                                          fontWeight: 700
                                        }}
                                      >
                                        Entregar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleCancelRedemption(red)}
                                      style={{
                                        padding: '0.35rem 0.5rem',
                                        background: 'hsl(var(--no-bg))',
                                        color: 'hsl(var(--no-color))',
                                        border: '1px solid hsl(var(--no-color) / 0.3)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
