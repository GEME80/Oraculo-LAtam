import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Bot, 
  Newspaper, 
  PenTool, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  HelpCircle, 
  AlertCircle, 
  TrendingUp, 
  Settings 
} from 'lucide-react';

export default function AiCostControl() {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Gemini token rates state (USD per 1,000,000 tokens)
  const [flashInput, setFlashInput] = useState(() => {
    return parseFloat(localStorage.getItem('rates_flash_input') || '0.075');
  });
  const [flashOutput, setFlashOutput] = useState(() => {
    return parseFloat(localStorage.getItem('rates_flash_output') || '0.300');
  });
  const [proInput, setProInput] = useState(() => {
    return parseFloat(localStorage.getItem('rates_pro_input') || '1.250');
  });
  const [proOutput, setProOutput] = useState(() => {
    return parseFloat(localStorage.getItem('rates_pro_output') || '5.000');
  });

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('ai_costs').select('*');
      if (error) throw error;
      setCosts(data || []);
    } catch (err) {
      console.error('Error fetching AI cost audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = (fi, fo, pi, po) => {
    setFlashInput(fi);
    setFlashOutput(fo);
    setProInput(pi);
    setProOutput(po);
    localStorage.setItem('rates_flash_input', fi.toString());
    localStorage.setItem('rates_flash_output', fo.toString());
    localStorage.setItem('rates_pro_input', pi.toString());
    localStorage.setItem('rates_pro_output', po.toString());
  };

  const handleResetRates = () => {
    handleSaveRates(0.075, 0.300, 1.250, 5.000);
  };

  // Group and dynamically calculate costs by agent name
  const getAgentBreakdown = () => {
    const agents = {
      'Buscador de Noticias': { 
        name: 'Buscador de Noticias (News Finder)', 
        model: 'Gemini 1.5 Flash', 
        runs: 0, 
        input: 0, 
        output: 0, 
        cost: 0, 
        desc: 'Escanea noticias y alertas en feeds de periódicos latinoamericanos.',
        icon: <Newspaper size={18} />,
        color: '#10b981' // emerald green
      },
      'Redactor de Preguntas': { 
        name: 'Redactor de Preguntas (Formulator)', 
        model: 'Gemini 1.5 Pro', 
        runs: 0, 
        input: 0, 
        output: 0, 
        cost: 0, 
        desc: 'Genera preguntas binarias objetivas y formula las reglas del contrato.',
        icon: <PenTool size={18} />,
        color: '#8b5cf6' // purple
      },
      'Auditor de Cierres': { 
        name: 'Auditor de Cierres (Auditor/Resolver)', 
        model: 'Google Search API + Flash', 
        runs: 0, 
        input: 0, 
        output: 0, 
        cost: 0, 
        desc: 'Inspecciona gacetas oficiales y sitios web públicos para auditar los resultados.',
        icon: <ShieldCheck size={18} />,
        color: '#3b82f6' // blue
      }
    };

    costs.forEach(item => {
      const name = item.agent_name;
      if (agents[name]) {
        agents[name].runs += item.runs;
        agents[name].input += item.tokens_input;
        agents[name].output += item.tokens_output;
        
        // Calculate dynamically based on user-configured token pricing
        const inputRate = name === 'Redactor de Preguntas' ? proInput : flashInput;
        const outputRate = name === 'Redactor de Preguntas' ? proOutput : flashOutput;
        const cost = (item.tokens_input * inputRate / 1000000) + (item.tokens_output * outputRate / 1000000);
        agents[name].cost += cost;
      }
    });

    return Object.values(agents);
  };

  // Group and dynamically calculate costs by day to draw the SVG Bar Chart
  const getDailyCosts = () => {
    const dayMap = {};
    costs.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      if (!dayMap[date]) {
        dayMap[date] = 0;
      }
      
      const inputRate = item.agent_name === 'Redactor de Preguntas' ? proInput : flashInput;
      const outputRate = item.agent_name === 'Redactor de Preguntas' ? proOutput : flashOutput;
      const cost = (item.tokens_input * inputRate / 1000000) + (item.tokens_output * outputRate / 1000000);
      
      dayMap[date] += cost;
    });

    return Object.entries(dayMap).map(([day, cost]) => ({ day, cost })).slice(-7);
  };

  const agentBreakdown = getAgentBreakdown();
  const dailyCosts = getDailyCosts();

  // Aggregate totals dynamically
  const totalCost = agentBreakdown.reduce((acc, item) => acc + item.cost, 0);
  const totalRuns = agentBreakdown.reduce((acc, item) => acc + item.runs, 0);
  const totalTokens = agentBreakdown.reduce((acc, item) => acc + item.input + item.output, 0);

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 160;
  const barPadding = 12;
  const barWidth = dailyCosts.length > 0 ? (chartWidth / dailyCosts.length) - barPadding : 0;
  const maxCost = dailyCosts.length > 0 ? Math.max(...dailyCosts.map(d => d.cost)) * 1.15 : 0.01;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>Cargando auditoría de costos de IA...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Control de Costos de IA (Multi-Agente)</h2>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
          Auditoría de transparencia financiera para el consumo de tokens de los modelos de Gemini y APIs externas.
        </p>
      </div>

      {/* Pricing Config Panel */}
      <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSettings(!showSettings)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            <Settings size={18} style={{ color: 'hsl(var(--brand))' }} />
            <span>Configurar Tarifas de Modelos Gemini (Google AI Studio)</span>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'hsl(var(--brand))', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            {showSettings ? 'Ocultar Panel' : 'Mostrar Panel'}
          </button>
        </div>

        {showSettings && (
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
              {/* Gemini 1.5 Flash Pricing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bot size={16} /> Gemini 1.5 Flash (News & Audit)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: 'hsl(var(--text-muted))' }}>Tarifa Entrada ($ USD / 1M tokens)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={flashInput} 
                      onChange={(e) => handleSaveRates(parseFloat(e.target.value) || 0, flashOutput, proInput, proOutput)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontWeight: 'bold', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: 'hsl(var(--text-muted))' }}>Tarifa Salida ($ USD / 1M tokens)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={flashOutput} 
                      onChange={(e) => handleSaveRates(flashInput, parseFloat(e.target.value) || 0, proInput, proOutput)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontWeight: 'bold', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                    />
                  </div>
                </div>
              </div>

              {/* Gemini 1.5 Pro Pricing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bot size={16} /> Gemini 1.5 Pro (Formulator)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: 'hsl(var(--text-muted))' }}>Tarifa Entrada ($ USD / 1M tokens)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={proInput} 
                      onChange={(e) => handleSaveRates(flashInput, flashOutput, parseFloat(e.target.value) || 0, proOutput)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontWeight: 'bold', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: 'hsl(var(--text-muted))' }}>Tarifa Salida ($ USD / 1M tokens)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={proOutput} 
                      onChange={(e) => handleSaveRates(flashInput, flashOutput, proInput, parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontWeight: 'bold', background: 'hsl(var(--bg-app))', color: 'hsl(var(--text-main))' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.75rem' }}>
              <button 
                onClick={handleResetRates}
                style={{ padding: '0.4rem 0.8rem', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--text-main))', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Restablecer Tarifas Oficiales
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="portfolio-header">
        <div className="stat-card">
          <span className="stat-label">Costo Total Acumulado</span>
          <span className="stat-val" style={{ color: 'hsl(var(--brand))' }}>
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD
          </span>
          <span className="stat-sub">Modelos de Google + API Search</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tokens Totales Procesados</span>
          <span className="stat-val">{totalTokens.toLocaleString()} tokens</span>
          <span className="stat-sub">Tokens de entrada y salida</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ejecuciones de Agentes</span>
          <span className="stat-val">{totalRuns.toLocaleString()} corridas</span>
          <span className="stat-sub">Ciclos autónomos de auditoría</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Costo Medio por Corrida</span>
          <span className="stat-val" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
            ${totalRuns > 0 ? (totalCost / totalRuns).toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '0.00'} USD
          </span>
          <span className="stat-sub">Eficiencia por iteración</span>
        </div>
      </div>

      {/* SVG Bar Chart Panel */}
      <div className="leaderboard-view" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: 'hsl(var(--brand))' }} />
          Historial de Costos Diarios (USD)
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto', padding: '1rem 0' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: `${chartWidth}px`, height: `${chartHeight + 40}px` }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="hsl(var(--border))" />

              {dailyCosts.map((d, idx) => {
                const height = (d.cost / maxCost) * chartHeight;
                const x = idx * (barWidth + barPadding) + barPadding / 2;
                const y = chartHeight - height;

                return (
                  <g key={idx}>
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 8} 
                      textAnchor="middle" 
                      fill="hsl(var(--text-main))" 
                      fontSize="9" 
                      fontWeight="bold"
                    >
                      ${d.cost.toFixed(4)}
                    </text>
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={height} 
                      fill="url(#barGrad)" 
                      rx="4" 
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text 
                      x={x + barWidth / 2} 
                      y={chartHeight + 20} 
                      textAnchor="middle" 
                      fill="hsl(var(--text-muted))" 
                      fontSize="10" 
                      fontWeight="600"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Agents breakdown cards */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>Desglose por Agente de IA</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {agentBreakdown.map((agent) => (
          <div key={agent.name} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  background: `${agent.color}10`, 
                  color: agent.color, 
                  padding: '0.6rem', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  border: `1px solid ${agent.color}25`
                }}>
                  <Bot size={20} />
                  <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>+</span>
                  {agent.icon}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, color: 'hsl(var(--text-main))', fontSize: '1.05rem' }}>{agent.name}</h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Modelo: {agent.model}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Costo Acumulado</span>
                <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'hsl(var(--brand))', fontFamily: 'var(--font-heading)' }}>
                  ${agent.cost.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })} USD
                </h4>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.45 }}>{agent.desc}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Corridas</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>{agent.runs.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Tokens Entrada</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>{agent.input.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Tokens Salida</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>{agent.output.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Costo/Ejecución</span>
                <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                  ${agent.runs > 0 ? (agent.cost / agent.runs).toLocaleString(undefined, { minimumFractionDigits: 5 }) : '0.00'} USD
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border))', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <AlertCircle size={16} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
        <span>Los precios de tokens se calculan dinámicamente según las tarifas configuradas en el panel superior. La recolección de noticias y auditoría de resolución se ejecutan automáticamente cada hora.</span>
      </div>
    </div>
  );
}
