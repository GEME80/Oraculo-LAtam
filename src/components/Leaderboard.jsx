import React, { useState, useEffect } from 'react';
import { Award, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const COUNTRY_FLAGS = {
  CO: '🇨🇴',
  MX: '🇲🇽',
  AR: '🇦🇷',
  BR: '🇧🇷',
  CL: '🇨🇱',
  PE: '🇵🇪',
  LATAM: '🌎'
};

export default function Leaderboard({ userProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [userProfile]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Fetch profiles ordered by reputation or balance, excluding admins
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('reputation_points', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>Cargando clasificaciones...</div>;
  }

  // Split into top 3 and others
  const topThree = profiles.slice(0, 3);
  const remainder = profiles.slice(3);

  // Position names mapping
  const podiumOrder = [
    topThree[1], // 2nd (left)
    topThree[0], // 1st (center)
    topThree[2]  // 3rd (right)
  ].filter(Boolean);

  return (
    <div className="leaderboard-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Clasificación de Temporada</h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
            Los mejores analistas de América Latina compitiendo por reputación y premios mensuales.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--brand-light))', color: 'hsl(var(--brand))', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700 }}>
          <Sparkles size={16} />
          <span>Fin de Temporada: En 14 días</span>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="podium-container">
          {podiumOrder.map((user, idx) => {
            const isFirst = user.id === topThree[0].id;
            const isSecond = topThree[1] && user.id === topThree[1].id;
            const isThird = topThree[2] && user.id === topThree[2].id;
            
            let rankClass = 'third';
            let rankNum = '3';
            if (isFirst) { rankClass = 'first'; rankNum = '1'; }
            else if (isSecond) { rankClass = 'second'; rankNum = '2'; }

            return (
              <div key={user.id} className={`podium-item ${rankClass}`}>
                <div className="podium-avatar-wrapper">
                  <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} />
                  <div className="badge-medal">{rankNum}</div>
                </div>
                <div className="podium-username">
                  {COUNTRY_FLAGS[user.country] || '🌎'} {user.username}
                </div>
                <div className="podium-points">{user.reputation_points} pts</div>
                <div className="podium-bar">
                  <span>{rankNum}º</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Leaderboard Table */}
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-col">Puesto</th>
              <th>Analista</th>
              <th className="hide-mobile">Predicciones</th>
              <th>Efectividad</th>
              <th>Reputación</th>
              <th className="hide-mobile">Balance</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((user, index) => {
              const isCurrentUser = userProfile && user.id === userProfile.id;
              return (
                <tr key={user.id} className={isCurrentUser ? 'self' : ''}>
                  <td className="rank-col">{index + 1}º</td>
                  <td className="user-col">
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} />
                    <div className="user-details">
                      <span className="name">
                        {user.username} {isCurrentUser && ' (Tú)'}
                      </span>
                      <span className="country">
                        {COUNTRY_FLAGS[user.country] || '🌎'} {user.country}
                      </span>
                    </div>
                  </td>
                  <td className="hide-mobile">{user.predictions_count || 0}</td>
                  <td>
                    <span className="accuracy-badge">
                      {parseFloat(user.accuracy_rate).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                    {user.reputation_points} pts
                  </td>
                  <td className="hide-mobile" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                    {parseFloat(user.orc_balance).toLocaleString()} Créditos
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
