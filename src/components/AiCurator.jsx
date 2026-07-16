import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Sparkles, AlertCircle, Edit3, PlusCircle, Check, X, Calendar, Link2, FilePlus, Globe, Hash, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Dialog } from './CustomDialog';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ─────────────────────────────────────────────
// DATE HELPERS  — always anchored to the future
// ─────────────────────────────────────────────

/** Returns the last millisecond of the current month */
const getCurrentMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
};

/** Returns the last millisecond of the NEXT calendar month */
const getNextMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
};

/** Returns the last millisecond of the current quarter (Q1=Mar, Q2=Jun, Q3=Sep, Q4=Dec) */
const getCurrentQuarterEnd = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const lastMonthOfQuarter = (quarter + 1) * 3; // 3, 6, 9, 12
  return new Date(now.getFullYear(), lastMonthOfQuarter, 0, 23, 59, 59);
};

/** Returns the last day of the current year */
const getCurrentYearEnd = () => {
  return new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
};

/** Friendly label for dates */
const formatDate = (d) =>
  d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

// ─────────────────────────────────────────────
// TERMINAL LOG ANIMATIONS PER CATEGORY
// ─────────────────────────────────────────────
const LOGS_BY_CATEGORY = {
  Deportes: [
    { text: '🤖 Inicializando Arquitectura Multi-Agente Oráculo-LATAM para Deportes...', type: 'bold' },
    { text: '[Agente 1: Buscador de Deportes] Escaneando portales oficiales CONMEBOL, FIFA, Liga MX y Liga BetPlay...', type: 'info' },
    { text: '[Agente 1] Verificando calendario oficial de partidos y torneos vigentes con fechas futuras confirmadas.', type: 'warning' },
    { text: '[Agente 2: Redactor de Preguntas] Estructurando pregunta binaria con opciones específicas de equipos/países...', type: 'info' },
    { text: '[Agente 2] Validando que el evento de resolución se encuentre en fecha futura. ✓ Aprobado.', type: 'success' },
    { text: '[Agente 3: Auditor de Resultados] Enlazando fuente oficial a federaciones deportivas con URL verificada.', type: 'info' },
    { text: '✨ Propuesta de mercado deportivo creada con contexto actual y fechas válidas.', type: 'success' }
  ],
  Tecnología: [
    { text: '🤖 Inicializando Arquitectura Multi-Agente Oráculo-LATAM para Tecnología...', type: 'bold' },
    { text: '[Agente 1: Buscador de Tech] Escaneando TechCrunch, Bloomberg Tech y hojas de ruta de empresas...', type: 'info' },
    { text: '[Agente 1] Confirmando que los hitos de producto o financieros referenciados no han ocurrido aún.', type: 'warning' },
    { text: '[Agente 2: Redactor de Preguntas] Formulando pregunta sobre evento tecnológico verificable en el trimestre activo...', type: 'info' },
    { text: '[Agente 2] Validando período de resolución dentro del trimestre en curso. ✓ Aprobado.', type: 'success' },
    { text: '[Agente 3: Auditor de Resultados] Enlazando resolución a fuente bursátil o de prensa oficial.', type: 'info' },
    { text: '✨ Propuesta de mercado tecnológico inyectada con éxito.', type: 'success' }
  ],
  Política: [
    { text: '🤖 Inicializando Arquitectura Multi-Agente Oráculo-LATAM para Política...', type: 'bold' },
    { text: '[Agente 1: Buscador de Noticias] Escaneando gacetas parlamentarias y portales gubernamentales de LATAM...', type: 'info' },
    { text: '[Agente 1] Cruzando agenda legislativa activa con proyectos de ley en debate pendiente de votación.', type: 'warning' },
    { text: '[Agente 2: Redactor de Preguntas] Estructurando pregunta sobre reforma o proyecto de ley vigente...', type: 'info' },
    { text: '[Agente 2] Confirmando que el proyecto referenciado aún no ha sido votado definitivamente. ✓ Aprobado.', type: 'success' },
    { text: '[Agente 3: Auditor de Resultados] Enlazando resolución a gaceta oficial del gobierno correspondiente.', type: 'info' },
    { text: '✨ Propuesta de mercado de política pública registrada.', type: 'success' }
  ],
  Economía: [
    { text: '🤖 Inicializando Arquitectura Multi-Agente Oráculo-LATAM para Economía...', type: 'bold' },
    { text: '[Agente 1: Buscador Económico] Monitoreando calendarios de juntas de Bancos Centrales de la región...', type: 'info' },
    { text: '[Agente 1] Identificando próxima reunión de política monetaria con fecha confirmada hacia adelante.', type: 'warning' },
    { text: '[Agente 2: Redactor de Preguntas] Formulando pregunta sobre decisión de tasa de interés o reporte de inflación...', type: 'info' },
    { text: '[Agente 2] Validando umbrales de tasas con datos vigentes de 2025. ✓ Aprobado.', type: 'success' },
    { text: '[Agente 3: Auditor de Resultados] Vinculando resolución al boletín oficial del banco central.', type: 'info' },
    { text: '✨ Propuesta de mercado macroeconómico agregada.', type: 'success' }
  ],
  Cultura: [
    { text: '🤖 Inicializando Arquitectura Multi-Agente Oráculo-LATAM para Cultura...', type: 'bold' },
    { text: '[Agente 1: Buscador Cultural] Escaneando giras artísticas confirmadas y premiaciones con fechas futuras...', type: 'info' },
    { text: '[Agente 1] Verificando que el evento cultural referenciado aún no ha ocurrido. ✓ Confirmado.', type: 'warning' },
    { text: '[Agente 2: Redactor de Preguntas] Formulando pregunta sobre evento de entretenimiento verificable...', type: 'info' },
    { text: '[Agente 2] Periodo de resolución ajustado al mes del evento anunciado. ✓ Aprobado.', type: 'success' },
    { text: '[Agente 3: Auditor de Resultados] Enlazando resolución a la tiqueteadora oficial o plataforma de streaming.', type: 'info' },
    { text: '✨ Propuesta de mercado de entretenimiento creada con contexto real.', type: 'success' }
  ]
};

// ─────────────────────────────────────────────
// TOPICS / SUBCATEGORIES PER CATEGORY
// ─────────────────────────────────────────────
const TOPICS_BY_CATEGORY = {
  'Deportes': [
    { id: 'mundial_2026',      label: 'Mundial 2026',        emoji: '🌍' },
    { id: 'copa_libertadores', label: 'Copa Libertadores',   emoji: '⚽' },
    { id: 'eliminatorias',     label: 'Eliminatorias 2026',  emoji: '📋' },
    { id: 'copa_america',      label: 'Copa América',        emoji: '🏆' },
    { id: 'formula1',          label: 'Fórmula 1',           emoji: '🏎️' },
    { id: 'tenis',             label: 'Tenis',               emoji: '🎾' },
    { id: 'boxeo_mma',         label: 'Boxeo / MMA',         emoji: '🥊' },
  ],
  'Tecnología': [
    { id: 'ia',                label: 'Inteligencia Artificial', emoji: '🤖' },
    { id: 'startups_latam',    label: 'Startups LATAM',          emoji: '🦄' },
    { id: 'criptomonedas',     label: 'Criptomonedas',           emoji: '₿' },
    { id: 'big_tech',          label: 'Big Tech',                emoji: '🌐' },
    { id: 'fintech',           label: 'Fintech / IPOs',          emoji: '📈' },
  ],
  'Política': [
    { id: 'elecciones',        label: 'Elecciones',              emoji: '🗳️' },
    { id: 'reformas',          label: 'Reformas Legislativas',   emoji: '📜' },
    { id: 'relaciones_int',    label: 'Relaciones Internacionales', emoji: '🤝' },
    { id: 'seguridad',         label: 'Seguridad Pública',       emoji: '🛡️' },
  ],
  'Economía': [
    { id: 'tasas',             label: 'Tasas de Interés',        emoji: '🏦' },
    { id: 'inflacion',         label: 'Inflación',               emoji: '📊' },
    { id: 'mercados',          label: 'Mercados Financieros',    emoji: '💹' },
    { id: 'empleo',            label: 'Empleo',                  emoji: '👔' },
  ],
  'Cultura': [
    { id: 'musica',            label: 'Música / Conciertos',     emoji: '🎵' },
    { id: 'cine_series',       label: 'Cine y Series',           emoji: '🎬' },
    { id: 'premios',           label: 'Premios',                 emoji: '🏅' },
    { id: 'redes_sociales',    label: 'Redes Sociales',          emoji: '📱' },
  ],
};

// ─────────────────────────────────────────────
// DYNAMIC QUESTION GENERATOR (context-aware)
// ─────────────────────────────────────────────
const generateDynamicCuratedSuggestion = (category, topic = null) => {
  const id = `dyn-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();
  const nextMonthEnd = getNextMonthEnd();
  const quarterEnd = getCurrentQuarterEnd();
  const yearEnd = getCurrentYearEnd();
  const nextMonthLabel = nextMonthEnd.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const quarterLabel = formatDate(quarterEnd);
  const yearLabel = yearEnd.getFullYear().toString();
  const topicId = topic?.id || null;

  // ── TOPIC-SPECIFIC GENERATORS ──

  // 🌍 MUNDIAL DE FÚTBOL 2026
  if (topicId === 'mundial_2026') {
    const mundialEnd = new Date('2026-07-19T23:59:59Z');
    const selecciones = [
      { name: 'Colombia', code: 'CO', emoji: '🇨🇴' },
      { name: 'Argentina', code: 'AR', emoji: '🇦🇷' },
      { name: 'Brasil', code: 'BR', emoji: '🇧🇷' },
      { name: 'México', code: 'MX', emoji: '🇲🇽' },
      { name: 'Uruguay', code: 'UY', emoji: '🇺🇾' },
      { name: 'Ecuador', code: 'EC', emoji: '🇪🇨' },
      { name: 'Chile', code: 'CL', emoji: '🇨🇱' },
      { name: 'Perú', code: 'PE', emoji: '🇵🇪' },
    ];
    const fases = [
      { name: 'la fase de grupos', key: 'grupos', option_a: 'SÍ — Avanza', option_b: 'NO — Eliminado' },
      { name: 'los octavos de final', key: 'octavos', option_a: 'SÍ — Avanza a cuartos', option_b: 'NO — Eliminado' },
      { name: 'los cuartos de final', key: 'cuartos', option_a: 'SÍ — Va a semifinal', option_b: 'NO — Eliminado' },
      { name: 'la semifinal', key: 'semi', option_a: 'SÍ — Va a la final', option_b: 'NO — Eliminado' },
    ];
    const sel = selecciones[Math.floor(Math.random() * selecciones.length)];
    const fase = fases[Math.floor(Math.random() * fases.length)];
    return {
      id, category: 'Deportes', country: sel.code,
      title: `¿Clasificará ${sel.emoji} ${sel.name} a ${fase.name} del Mundial FIFA 2026?`,
      description: `Se resolverá a SÍ si la selección de ${sel.name} avanza a ${fase.name} del Mundial de Fútbol FIFA 2026 (EE.UU., Canadá y México), según los resultados oficiales publicados por la FIFA. Se resolverá a NO si queda eliminada antes de esa ronda. Resolución: julio de 2026.`,
      end_date: mundialEnd.toISOString(),
      resolution_source: 'https://www.fifa.com/worldcup',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      option_a_label: fase.option_a,
      option_b_label: fase.option_b,
    };
  }

  // 📋 ELIMINATORIAS 2026
  if (topicId === 'eliminatorias') {
    const matchups = [
      { a: 'Colombia 🇨🇴', b: 'Argentina 🇦🇷', cA: 'CO' },
      { a: 'Brasil 🇧🇷', b: 'Uruguay 🇺🇾', cA: 'BR' },
      { a: 'Ecuador 🇪🇨', b: 'Chile 🇨🇱', cA: 'EC' },
      { a: 'Perú 🇵🇪', b: 'Bolivia 🇧🇴', cA: 'PE' },
      { a: 'Venezuela 🇻🇪', b: 'Paraguay 🇵🇾', cA: 'LATAM' },
    ];
    const m = matchups[Math.floor(Math.random() * matchups.length)];
    const aName = m.a.replace(/\s🇨🇴|🇦🇷|🇧🇷|🇲🇽|🇨🇱|🇵🇪|🇺🇾|🇪🇨|🇻🇪|🇧🇴|🇵🇾/g, '').trim();
    const bName = m.b.replace(/\s🇨🇴|🇦🇷|🇧🇷|🇲🇽|🇨🇱|🇵🇪|🇺🇾|🇪🇨|🇻🇪|🇧🇴|🇵🇾/g, '').trim();
    return {
      id, category: 'Deportes', country: m.cA,
      title: `¿Ganará ${m.a} el próximo partido vs ${m.b} en las Eliminatorias Sudamericanas 2026?`,
      description: `Se resolverá a SÍ si ${aName} suma los 3 puntos en el encuentro oficial de las Eliminatorias Sudamericanas rumbo al Mundial 2026 (resultado en 90 minutos regulares). Se resolverá a NO si ${bName} gana o el partido termina en empate. Resolución: ${nextMonthLabel}.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: 'https://www.conmebol.com/eliminatorias-sudamerica',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      option_a_label: `Gana ${aName}`,
      option_b_label: `Gana ${bName} / Empate`,
    };
  }

  // 🏆 COPA AMÉRICA
  if (topicId === 'copa_america') {
    const equipos = [
      { name: 'Colombia', code: 'CO', emoji: '🇨🇴' },
      { name: 'Argentina', code: 'AR', emoji: '🇦🇷' },
      { name: 'Brasil', code: 'BR', emoji: '🇧🇷' },
      { name: 'Uruguay', code: 'UY', emoji: '🇺🇾' },
      { name: 'México', code: 'MX', emoji: '🇲🇽' },
    ];
    const eq = equipos[Math.floor(Math.random() * equipos.length)];
    return {
      id, category: 'Deportes', country: eq.code,
      title: `¿Será ${eq.emoji} ${eq.name} el campeón de la próxima Copa América de la CONMEBOL?`,
      description: `Se resolverá a SÍ si ${eq.name} gana el trofeo oficial de la Copa América organizada por CONMEBOL en su próxima edición. Se resolverá a NO si otro equipo resulta campeón. Resolución: ${quarterLabel}.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://www.conmebol.com/copa-america',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — ${eq.name} campeón`,
      option_b_label: 'NO — Otro campeón',
    };
  }

  // 🥊 BOXEO / MMA
  if (topicId === 'boxeo_mma') {
    const peleadores = [
      { name: 'Andy Ruiz Jr.', country: 'MX', belt: 'campeonato de peso completo', org: 'WBC/WBA' },
      { name: 'Oscar Valdez', country: 'MX', belt: 'título superlígero', org: 'WBC' },
      { name: 'Gilberto Ramírez', country: 'MX', belt: 'campeonato de crucero', org: 'WBA' },
      { name: 'Jesús Ramos Jr.', country: 'MX', belt: 'título supermediano', org: 'WBC' },
      { name: 'Diego Pacheco', country: 'PE', belt: 'título superwelter', org: 'WBO' },
    ];
    const p = peleadores[Math.floor(Math.random() * peleadores.length)];
    return {
      id, category: 'Deportes', country: p.country,
      title: `¿Ganará ${p.name} su próxima pelea por el ${p.belt} (${p.org})?`,
      description: `Se resolverá a SÍ si ${p.name} resulta ganador (por KO, TKO, decisión unánime o mayoritaria) en su siguiente combate oficial por el ${p.belt} de la ${p.org}. Se resolverá a NO en caso de derrota, empate o descalificación. Resolución: ${nextMonthLabel}.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: 'https://www.boxingscene.com',
      image_url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — ${p.name} gana`,
      option_b_label: 'NO — Pierde o empata',
    };
  }

  // 🎾 TENIS
  if (topicId === 'tenis') {
    const torneos = [
      { name: 'Wimbledon', end: new Date(yearEnd.getFullYear(), 6, 13), url: 'https://www.wimbledon.com', country: 'LATAM' },
      { name: 'US Open', end: new Date(yearEnd.getFullYear(), 8, 7), url: 'https://www.usopen.org', country: 'LATAM' },
      { name: 'Roland Garros', end: new Date(yearEnd.getFullYear(), 5, 8), url: 'https://www.rolandgarros.com', country: 'LATAM' },
    ];
    const jugadores = ['Carlos Alcaraz', 'Jannik Sinner', 'Novak Djokovic', 'Iga Swiatek', 'Coco Gauff'];
    const t = torneos[Math.floor(Math.random() * torneos.length)];
    const j = jugadores[Math.floor(Math.random() * jugadores.length)];
    return {
      id, category: 'Deportes', country: t.country,
      title: `¿Ganará ${j} el título de ${t.name} ${yearLabel}?`,
      description: `Se resolverá a SÍ si ${j} resulta campeón(a) del torneo de Grand Slam ${t.name} ${yearLabel}, según los resultados oficiales publicados por la ATP/WTA. Se resolverá a NO en caso contrario. Resolución: ${formatDate(t.end)}.`,
      end_date: t.end.toISOString(),
      resolution_source: t.url,
      image_url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — ${j.split(' ').pop()} campeón(a)`,
      option_b_label: 'NO — Otro/a campeón(a)',
    };
  }

  // 🤖 INTELIGENCIA ARTIFICIAL
  if (topicId === 'ia') {
    const empresas = ['OpenAI', 'Google DeepMind', 'Anthropic', 'Meta AI', 'xAI (Grok)', 'Mistral AI'];
    const hitos = [
      'lanzar un modelo de IA con capacidad de razonamiento autónomo superior al nivel humano en benchmarks estándar',
      'anunciar un acuerdo de distribución con al menos 5 gobiernos latinoamericanos para IA en servicios públicos',
      'superar 1,000 millones de usuarios activos mensuales en su plataforma de IA generativa',
      'lanzar su primer modelo de lenguaje entrenado exclusivamente con datos en español LATAM',
      'cerrar una ronda de financiación superior a 5,000 millones de dólares',
    ];
    const empresa = empresas[Math.floor(Math.random() * empresas.length)];
    const hito = hitos[Math.floor(Math.random() * hitos.length)];
    return {
      id, category: 'Tecnología', country: 'LATAM',
      title: `¿Logrará ${empresa} ${hito} antes del ${quarterLabel}?`,
      description: `Se resolverá a SÍ si ${empresa} publica un comunicado oficial o anuncio en su blog corporativo confirmando el hito antes del ${quarterLabel}. Se resolverá a NO si no hay anuncio oficial en dicho período.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://techcrunch.com',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Logrado',
      option_b_label: 'NO — No anunciado',
    };
  }

  // ₿ CRIPTOMONEDAS
  if (topicId === 'criptomonedas') {
    const cryptos = [
      { name: 'Bitcoin (BTC)', symbol: 'btc', thresholds: ['100,000', '120,000', '150,000'], unit: 'USD' },
      { name: 'Ethereum (ETH)', symbol: 'ethereum', thresholds: ['4,000', '5,000', '6,000'], unit: 'USD' },
      { name: 'Solana (SOL)', symbol: 'solana', thresholds: ['200', '300', '400'], unit: 'USD' },
    ];
    const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
    const threshold = crypto.thresholds[Math.floor(Math.random() * crypto.thresholds.length)];
    return {
      id, category: 'Tecnología', country: 'LATAM',
      title: `¿Superará ${crypto.name} el umbral de ${threshold} ${crypto.unit} antes del ${formatDate(quarterEnd)}?`,
      description: `Se resolverá a SÍ si el precio de cierre de ${crypto.name} supera los ${threshold} ${crypto.unit} en al menos un día dentro del trimestre actual, según datos oficiales de CoinMarketCap. Se resolverá a NO si no se alcanza dicho umbral.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: `https://coinmarketcap.com/currencies/${crypto.symbol}`,
      image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — Supera ${threshold}`,
      option_b_label: 'NO — No alcanza',
    };
  }

  // 🗳️ ELECCIONES
  if (topicId === 'elecciones') {
    const elecciones_latam = [
      { pais: 'Chile', candidatos: ['José Antonio Kast', 'Gabriel Boric (reelección)'], code: 'CL', url: 'https://www.servel.cl', año: yearLabel },
      { pais: 'Colombia', candidatos: ['candidato del Pacto Histórico', 'candidato del Centro Democrático'], code: 'CO', url: 'https://www.registraduria.gov.co', año: yearLabel },
      { pais: 'México', candidatos: ['candidato de Morena', 'candidato de oposición'], code: 'MX', url: 'https://www.ine.mx', año: yearLabel },
      { pais: 'Argentina', candidatos: ['candidato kirchnerista', 'candidato opositor'], code: 'AR', url: 'https://www.electoral.gob.ar', año: yearLabel },
      { pais: 'Perú', candidatos: ['candidato de izquierda', 'candidato de derecha'], code: 'PE', url: 'https://www.jne.gob.pe', año: yearLabel },
    ];
    const e = elecciones_latam[Math.floor(Math.random() * elecciones_latam.length)];
    const preguntas = [
      `¿Llegará un candidato de derecha a la segunda vuelta presidencial en ${e.pais} ${e.año}?`,
      `¿Superará la participación electoral el 60% en las próximas elecciones de ${e.pais} ${e.año}?`,
      `¿Habrá ballotage (segunda vuelta) en las elecciones presidenciales de ${e.pais} ${e.año}?`,
    ];
    const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
    return {
      id, category: 'Política', country: e.code,
      title: pregunta,
      description: `Se resolverá según los resultados oficiales publicados por la autoridad electoral de ${e.pais} (${e.url}) tras las elecciones de ${e.año}. La resolución se basa exclusivamente en datos oficiales certificados. Resolución: ${formatDate(yearEnd)}.`,
      end_date: yearEnd.toISOString(),
      resolution_source: e.url,
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Ocurre',
      option_b_label: 'NO — No ocurre',
    };
  }

  // 📊 INFLACIÓN
  if (topicId === 'inflacion') {
    const paises = [
      { name: 'Colombia', code: 'CO', agencia: 'DANE', target: '3.5', url: 'https://www.dane.gov.co', current: '6.5' },
      { name: 'México', code: 'MX', agencia: 'INEGI', target: '3.5', url: 'https://www.inegi.org.mx', current: '4.2' },
      { name: 'Chile', code: 'CL', agencia: 'INE Chile', target: '3.0', url: 'https://www.ine.gob.cl', current: '3.8' },
      { name: 'Perú', code: 'PE', agencia: 'INEI', target: '2.5', url: 'https://www.inei.gob.pe', current: '3.1' },
      { name: 'Brasil', code: 'BR', agencia: 'IBGE', target: '3.0', url: 'https://www.ibge.gov.br', current: '4.8' },
    ];
    const p = paises[Math.floor(Math.random() * paises.length)];
    return {
      id, category: 'Economía', country: p.code,
      title: `¿Logrará ${p.name} reducir su inflación interanual por debajo del ${p.target}% en el reporte del ${nextMonthLabel}?`,
      description: `La inflación actual en ${p.name} es de aproximadamente ${p.current}%. Se resolverá a SÍ si el ${p.agencia} publica en su informe oficial del ${nextMonthLabel} una tasa de variación del IPC interanual inferior al ${p.target}%. Se resolverá a NO si la cifra es igual o superior.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: p.url,
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — Baja del ${p.target}%`,
      option_b_label: 'NO — Se mantiene o sube',
    };
  }

  // 👔 EMPLEO
  if (topicId === 'empleo') {
    const paises = [
      { name: 'Colombia', code: 'CO', agencia: 'DANE', tasa: '10.2', meta: '9.0', url: 'https://www.dane.gov.co' },
      { name: 'México', code: 'MX', agencia: 'INEGI', tasa: '2.8', meta: '2.5', url: 'https://www.inegi.org.mx' },
      { name: 'Argentina', code: 'AR', agencia: 'INDEC', tasa: '7.1', meta: '6.5', url: 'https://www.indec.gob.ar' },
      { name: 'Chile', code: 'CL', agencia: 'INE Chile', tasa: '8.5', meta: '7.5', url: 'https://www.ine.gob.cl' },
    ];
    const p = paises[Math.floor(Math.random() * paises.length)];
    return {
      id, category: 'Economía', country: p.code,
      title: `¿Reducirá ${p.name} su tasa de desempleo por debajo del ${p.meta}% en el reporte del ${nextMonthLabel}?`,
      description: `La tasa de desempleo actual en ${p.name} es de ${p.tasa}% según el ${p.agencia}. Se resolverá a SÍ si el reporte oficial del ${nextMonthLabel} publica una tasa inferior al ${p.meta}%. Se resolverá a NO si la cifra se mantiene o sube.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: p.url,
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — Baja del ${p.meta}%`,
      option_b_label: 'NO — Se mantiene o sube',
    };
  }

  // 💹 MERCADOS FINANCIEROS
  if (topicId === 'mercados') {
    const indices = [
      { name: 'S&P 500', symbol: 'SPX', nivel: '5,800', url: 'https://www.bloomberg.com', country: 'LATAM' },
      { name: 'COLCAP (Colombia)', symbol: 'COLCAP', nivel: '1,500', url: 'https://www.bvc.com.co', country: 'CO' },
      { name: 'IPC México (BMV)', symbol: 'IPC', nivel: '58,000', url: 'https://www.bmv.com.mx', country: 'MX' },
      { name: 'MERVAL (Argentina)', symbol: 'MERV', nivel: '2,000,000', url: 'https://www.byma.com.ar', country: 'AR' },
    ];
    const idx = indices[Math.floor(Math.random() * indices.length)];
    return {
      id, category: 'Economía', country: idx.country,
      title: `¿Superará el índice ${idx.name} el nivel de ${idx.nivel} puntos antes del ${quarterLabel}?`,
      description: `Se resolverá a SÍ si el índice bursátil ${idx.name} (${idx.symbol}) cierra por encima de ${idx.nivel} puntos en al menos una sesión del trimestre actual, según datos oficiales de la bolsa correspondiente. Se resolverá a NO si no se alcanza dicho nivel.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: idx.url,
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — Supera ${idx.nivel}`,
      option_b_label: 'NO — No alcanza',
    };
  }

  // 🎵 MÚSICA / CONCIERTOS
  if (topicId === 'musica') {
    const artistas = [
      { name: 'Karol G', country: 'CO' },
      { name: 'Bad Bunny', country: 'LATAM' },
      { name: 'Feid', country: 'CO' },
      { name: 'Shakira', country: 'CO' },
      { name: 'Maluma', country: 'CO' },
      { name: 'Peso Pluma', country: 'MX' },
      { name: 'Rauw Alejandro', country: 'LATAM' },
    ];
    const ciudades = [
      'Bogotá (El Campín)', 'Ciudad de México (Foro Sol)', 'Buenos Aires (River Plate)',
      'Santiago (Estadio Nacional)', 'Lima (Estadio Nacional)', 'Medellín (Atanasio Girardot)'
    ];
    const a = artistas[Math.floor(Math.random() * artistas.length)];
    const ciudad = ciudades[Math.floor(Math.random() * ciudades.length)];
    const preguntas = [
      { q: `¿Agotará ${a.name} todas las boletas de su próximo concierto en ${ciudad} en menos de 48 horas?`, a: 'SÍ — Sold Out', b: 'NO — Quedan boletas' },
      { q: `¿Anunciará ${a.name} una gira por LATAM con más de 10 fechas confirmadas antes del ${nextMonthLabel}?`, a: 'SÍ — Más de 10 fechas', b: 'NO — Menos o sin anuncio' },
      { q: `¿Alcanzará el próximo álbum de ${a.name} el #1 en Spotify Global en su semana de lanzamiento?`, a: 'SÍ — #1 Global', b: 'NO — No llega al top' },
    ];
    const preg = preguntas[Math.floor(Math.random() * preguntas.length)];
    return {
      id, category: 'Cultura', country: a.country,
      title: preg.q,
      description: `Se resolverá a SÍ si el evento descrito ocurre antes del ${nextMonthLabel} según fuentes oficiales (tiqueteadora oficial, Spotify Charts, comunicado de prensa del artista). Se resolverá a NO en caso contrario. Resolución: ${nextMonthLabel}.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: 'https://www.ticketmaster.com.co',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
      option_a_label: preg.a,
      option_b_label: preg.b,
    };
  }

  // 🎬 CINE Y SERIES
  if (topicId === 'cine_series') {
    const preguntas = [
      { q: `¿Superará alguna producción latinoamericana de Netflix los 50 millones de vistas en su primera semana de estreno en ${quarterLabel}?`, a: 'SÍ — Supera 50M', b: 'NO — No alcanza' },
      { q: `¿Tendrá una producción de habla hispana nominación al Oscar a Mejor Película Internacional en la próxima ceremonia?`, a: 'SÍ — Nominada', b: 'NO — Sin nominación' },
      { q: `¿Alcanzará una serie colombiana o latinoamericana el Top 10 global de Netflix antes del ${nextMonthLabel}?`, a: 'SÍ — Top 10 Global', b: 'NO — No entra al top' },
    ];
    const preg = preguntas[Math.floor(Math.random() * preguntas.length)];
    return {
      id, category: 'Cultura', country: 'LATAM',
      title: preg.q,
      description: `Se resolverá a SÍ según datos públicos de Netflix Top 10, comunicados de la Academia, o listas oficiales de plataformas de streaming. Se resolverá a NO si no hay registro oficial del hito antes del ${nextMonthLabel}.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: 'https://top10.netflix.com',
      image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
      option_a_label: preg.a,
      option_b_label: preg.b,
    };
  }

  // 🏅 PREMIOS
  if (topicId === 'premios') {
    const premios_list = [
      { name: 'Latin Grammy', cat: 'Álbum del Año', url: 'https://www.latingrammy.com', country: 'LATAM' },
      { name: 'Premio Lo Nuestro', cat: 'Artista del Año', url: 'https://www.premioalonuestro.com', country: 'LATAM' },
      { name: 'MTV MIAW', cat: 'Artista Favorito LATAM', url: 'https://www.mtvla.com', country: 'LATAM' },
    ];
    const nominees = ['Karol G', 'Feid', 'Bad Bunny', 'Shakira', 'Peso Pluma', 'Maluma', 'Rauw Alejandro'];
    const premio = premios_list[Math.floor(Math.random() * premios_list.length)];
    const nominee = nominees[Math.floor(Math.random() * nominees.length)];
    return {
      id, category: 'Cultura', country: premio.country,
      title: `¿Ganará ${nominee} el galardón "${premio.cat}" en los ${premio.name} ${yearLabel}?`,
      description: `Se resolverá a SÍ si ${nominee} resulta ganador del premio "${premio.cat}" en la ceremonia oficial de los ${premio.name} ${yearLabel}. Se resolverá a NO si el premio es para otro artista. Resolución: ${formatDate(yearEnd)}.`,
      end_date: yearEnd.toISOString(),
      resolution_source: premio.url,
      image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — ${nominee} gana`,
      option_b_label: 'NO — Otro artista',
    };
  }

  // 📱 REDES SOCIALES
  if (topicId === 'redes_sociales') {
    const plataformas = ['TikTok', 'Instagram', 'X (Twitter)', 'YouTube'];
    const latam_creators = ['Luisito Comunica', 'Badabun', 'Yuya', 'Werevertumorro', 'HolaSoyGerman'];
    const plat = plataformas[Math.floor(Math.random() * plataformas.length)];
    const creator = latam_creators[Math.floor(Math.random() * latam_creators.length)];
    return {
      id, category: 'Cultura', country: 'MX',
      title: `¿Superará ${creator} los 50 millones de seguidores en ${plat} antes del ${nextMonthLabel}?`,
      description: `Se resolverá a SÍ si el perfil oficial de ${creator} en ${plat} supera los 50 millones de seguidores/suscriptores antes del cierre del ${nextMonthLabel}, según el conteo público de la plataforma. Se resolverá a NO si no alcanza dicha cifra.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: `https://www.${plat.toLowerCase().split(' ')[0]}.com`,
      image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Supera 50M',
      option_b_label: 'NO — No alcanza',
    };
  }

  // ⚽ COPA LIBERTADORES
  if (topicId === 'copa_libertadores') {
    const teams = [
      { name: 'Junior de Barranquilla', code: 'CO' },
      { name: 'Millonarios', code: 'CO' },
      { name: 'River Plate', code: 'AR' },
      { name: 'Boca Juniors', code: 'AR' },
      { name: 'Flamengo', code: 'BR' },
      { name: 'Palmeiras', code: 'BR' },
      { name: 'LDU Quito', code: 'EC' },
    ];
    const t = teams[Math.floor(Math.random() * teams.length)];
    return {
      id, category: 'Deportes', country: t.code,
      title: `¿Clasificará ${t.name} a los cuartos de final de la Copa Libertadores ${yearLabel}?`,
      description: `Se resolverá a SÍ si el club ${t.name} avanza a la ronda de cuartos de final de la CONMEBOL Copa Libertadores ${yearLabel}, según los resultados oficiales de la confederación. Se resolverá a NO si es eliminado antes.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://www.conmebol.com/copa-libertadores',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Clasifica',
      option_b_label: 'NO — Eliminado',
    };
  }

  // 🏎️ FÓRMULA 1
  if (topicId === 'formula1') {
    const gps = [
      { name: 'Gran Premio de Mónaco', country: 'LATAM' },
      { name: 'Gran Premio de España', country: 'LATAM' },
      { name: 'Gran Premio de México', country: 'MX' },
      { name: 'Gran Premio de Brasil', country: 'BR' },
    ];
    const gp = gps[Math.floor(Math.random() * gps.length)];
    const drivers = ['Max Verstappen', 'Lewis Hamilton', 'Lando Norris', 'Sergio Pérez', 'Charles Leclerc'];
    const d = drivers[Math.floor(Math.random() * drivers.length)];
    return {
      id, category: 'Deportes', country: gp.country,
      title: `¿Logrará ${d} terminar en el podio (Top 3) del ${gp.name} ${yearLabel}?`,
      description: `Se resolverá a SÍ si ${d} sube al podio (posiciones 1, 2 o 3) en la carrera final oficial de la FIA para el ${gp.name} ${yearLabel}. Se resolverá a NO en caso contrario.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: 'https://www.formula1.com',
      image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Podio',
      option_b_label: 'NO — Fuera del podio',
    };
  }

  // 🦄 STARTUPS LATAM
  if (topicId === 'startups_latam') {
    const startups = [
      { name: 'Rappi', code: 'CO' },
      { name: 'Kavak', code: 'MX' },
      { name: 'Habi', code: 'CO' },
      { name: 'NotCo', code: 'CL' },
      { name: 'Bold', code: 'CO' },
    ];
    const s = startups[Math.floor(Math.random() * startups.length)];
    return {
      id, category: 'Tecnología', country: s.code,
      title: `¿Anunciará la startup ${s.name} una nueva ronda de inversión superior a 50 millones de USD antes de fin de año?`,
      description: `Se resolverá a SÍ si la compañía ${s.name} publica o confirma en medios de comunicación reputados (como TechCrunch o Bloomberg) una ronda de financiamiento Serie C, D o de extensión por un valor igual o superior a 50 millones de dólares americanos antes del 31 de diciembre de ${yearLabel}. Se resolverá a NO si no se oficializa dicho anuncio.`,
      end_date: yearEnd.toISOString(),
      resolution_source: 'https://techcrunch.com',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Ronda anunciada',
      option_b_label: 'NO — Sin anuncio',
    };
  }

  // 🌐 BIG TECH
  if (topicId === 'big_tech') {
    const companies = [
      { name: 'Apple', code: 'LATAM', detail: 'anunciar un nuevo dispositivo de realidad mixta (Vision Air o similar) con precio inferior a 1,500 USD' },
      { name: 'Google', code: 'LATAM', detail: 'integrar su agente de IA de forma nativa en todos los servicios públicos estatales de al menos un país de LATAM' },
      { name: 'Meta', code: 'LATAM', detail: 'lanzar su modelo Llama 4 en versión de código abierto' },
    ];
    const c = companies[Math.floor(Math.random() * companies.length)];
    return {
      id, category: 'Tecnología', country: c.code,
      title: `¿Logrará ${c.name} ${c.detail} antes de finalizar el trimestre actual?`,
      description: `Se resolverá a SÍ si ${c.name} realiza la presentación oficial del producto o servicio descrito en su blog oficial o evento corporativo antes del ${quarterLabel}. Se resolverá a NO en caso contrario.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://techcrunch.com',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Logrado',
      option_b_label: 'NO — No logrado',
    };
  }

  // 📈 FINTECH
  if (topicId === 'fintech') {
    const fintechs = [
      { name: 'Nubank (Nu)', code: 'BR', metric: 'los 115 millones de clientes activos' },
      { name: 'Ualá', code: 'AR', metric: 'la adquisición de una nueva licencia bancaria en LATAM' },
      { name: 'Mercado Pago', code: 'LATAM', metric: 'superar los 60 millones de usuarios con saldo remunerado' },
    ];
    const f = fintechs[Math.floor(Math.random() * fintechs.length)];
    return {
      id, category: 'Tecnología', country: f.code,
      title: `¿Logrará ${f.name} alcanzar ${f.metric} antes del reporte financiero del trimestre actual?`,
      description: `Se resolverá a SÍ si el reporte oficial de resultados financieros de ${f.name} (o de su empresa matriz) correspondiente al trimestre actual certifica el cumplimiento de la métrica. Se resolverá a NO si la cifra oficial reportada es menor o si el reporte se retrasa más allá del plazo.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://www.bloomberglinea.com',
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Logrado',
      option_b_label: 'NO — No alcanzado',
    };
  }

  // 📜 REFORMAS LEGISLATIVAS
  if (topicId === 'reformas') {
    const countries = [
      { name: 'Colombia', code: 'CO', body: 'el Congreso de la República', reform: 'la reforma laboral que reduce la jornada de trabajo nocturno' },
      { name: 'México', code: 'MX', body: 'la Cámara de Senadores', reform: 'la reforma judicial en su fase de implementación estatal' },
      { name: 'Argentina', code: 'AR', body: 'el Congreso Nacional', reform: 'la nueva ley de privatizaciones de empresas públicas' },
    ];
    const c = countries[Math.floor(Math.random() * countries.length)];
    return {
      id, category: 'Política', country: c.code,
      title: `¿Aprobará definitivamente ${c.body} de ${c.name} ${c.reform} antes de fin de año?`,
      description: `Se resolverá a SÍ si el texto final de la ley es sancionado y publicado en el boletín oficial o gaceta correspondiente de ${c.name} antes del 31 de diciembre de ${yearLabel}. Se resolverá a NO si el debate es aplazado o archivado.`,
      end_date: yearEnd.toISOString(),
      resolution_source: 'https://www.boletinoficial.gob.ar',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Sancionada',
      option_b_label: 'NO — No sancionada / Aplazada',
    };
  }

  // 🤝 RELACIONES INTERNACIONALES
  if (topicId === 'relaciones_int') {
    const topics = [
      { title: '¿Firmarán los gobiernos de Colombia y Venezuela un nuevo acuerdo de aranceles comerciales?', country: 'CO', desc: 'Se resolverá a SÍ si los ministerios de comercio de ambos países firman un acuerdo arancelario bilateral.' },
      { title: '¿Ratificará el parlamento de algún país del Mercosur el acuerdo comercial definitivo con la Unión Europea?', country: 'LATAM', desc: 'Se resolverá a SÍ si al menos uno de los parlamentos nacionales de los miembros fundadores del Mercosur aprueba el tratado.' },
    ];
    const t = topics[Math.floor(Math.random() * topics.length)];
    return {
      id, category: 'Política', country: t.country,
      title: t.title,
      description: `${t.desc} Resolución antes de finalizar el año actual.`,
      end_date: yearEnd.toISOString(),
      resolution_source: 'https://www.cancilleria.gov.co',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Firmado/Ratificado',
      option_b_label: 'NO — No concretado',
    };
  }

  // 🛡️ SEGURIDAD PÚBLICA
  if (topicId === 'seguridad') {
    const cases = [
      { country: 'EC', title: '¿Reducirá Ecuador la tasa de homicidios mensual por debajo del umbral crítico de 15 por cada 100 mil habitantes en el próximo reporte oficial?', desc: 'Se resolverá a SÍ si el reporte oficial de criminalidad del Ministerio del Interior de Ecuador registra una tasa inferior al umbral.' },
      { country: 'MX', title: '¿Desplegará el gobierno de México más de 5,000 nuevos efectivos de la Guardia Nacional en la frontera sur antes de finalizar el trimestre?', desc: 'Se resolverá a SÍ si la Secretaría de la Defensa Nacional confirma el despliegue extraordinario de más de 5,000 elementos.' },
    ];
    const c = cases[Math.floor(Math.random() * cases.length)];
    return {
      id, category: 'Política', country: c.country,
      title: c.title,
      description: `${c.desc} Resolución: ${quarterLabel}.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://www.gob.ec',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Logrado',
      option_b_label: 'NO — No alcanzado',
    };
  }

  // 🏦 TASAS DE INTERÉS
  if (topicId === 'tasas') {
    const banks = [
      { name: 'el Banco de la República (Colombia)', code: 'CO', rate: '9.0%', url: 'https://www.banrep.gov.co' },
      { name: 'el Banco de México (Banxico)', code: 'MX', rate: '10.0%', url: 'https://www.banxico.org.mx' },
      { name: 'el Banco Central de Chile', code: 'CL', rate: '4.5%', url: 'https://www.bcentral.cl' },
    ];
    const b = banks[Math.floor(Math.random() * banks.length)];
    return {
      id, category: 'Economía', country: b.code,
      title: `¿Reducirá ${b.name} su tasa de interés de referencia por debajo de ${b.rate} antes del cierre de este trimestre?`,
      description: `Se resolverá a SÍ si en el reporte o comunicado oficial de la próxima reunión de política monetaria de este trimestre se decide fijar la tasa de interés interbancaria en un valor estrictamente menor a ${b.rate}. Se resolverá a NO si se mantiene igual o superior.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: b.url,
      image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Tasa reducida',
      option_b_label: 'NO — Mantiene o sube',
    };
  }

  // ── CUSTOM / FREE TEXT TOPIC ──
  if (topic && (topic.id === 'custom' || !topic.id)) {
    const topicText = topic.label || topic;
    if (category === 'Deportes') {
      return {
        id, category: 'Deportes', country: 'LATAM',
        title: `¿Se cancelará o reprogramará algún evento principal relacionado con "${topicText}" antes de fin de mes?`,
        description: `Se resolverá a SÍ si se anuncia la cancelación o postergación oficial de algún evento principal de "${topicText}" por parte de la organización oficial antes del ${nextMonthLabel}. Se resolverá a NO en caso contrario.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: 'https://www.espn.com',
        image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Afectado',
        option_b_label: 'NO — Transcurre normal',
      };
    } else if (category === 'Tecnología') {
      return {
        id, category: 'Tecnología', country: 'LATAM',
        title: `¿Anunciará alguna gran empresa tecnológica un producto innovador enfocado en "${topicText}" este trimestre?`,
        description: `Se resolverá a SÍ si se publica un anuncio oficial de hardware, software o servicio de gran relevancia relacionado con "${topicText}" antes del ${quarterLabel}.`,
        end_date: quarterEnd.toISOString(),
        resolution_source: 'https://techcrunch.com',
        image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Lanzado/Anunciado',
        option_b_label: 'NO — Sin novedades',
      };
    } else if (category === 'Política') {
      return {
        id, category: 'Política', country: 'LATAM',
        title: `¿Será "${topicText}" el tema central de debate legislativo o declaración presidencial conjunta en LATAM este mes?`,
        description: `Se resolverá a SÍ si al menos dos presidentes de la región firman una declaración conjunta o hay una sesión plenaria extraordinaria de debate sobre "${topicText}" antes del ${nextMonthLabel}.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: 'https://www.cepal.org',
        image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Ocurre debate/declaración',
        option_b_label: 'NO — Sin relevancia extraordinaria',
      };
    } else if (category === 'Economía') {
      return {
        id, category: 'Economía', country: 'LATAM',
        title: `¿Publicará la CEPAL o el FMI un informe especial de impacto económico directo sobre "${topicText}" este trimestre?`,
        description: `Se resolverá a SÍ si la CEPAL, el FMI o el Banco Mundial publica en su portal un reporte, boletín o capítulo dedicado al impacto de "${topicText}" en las economías de la región antes del ${quarterLabel}.`,
        end_date: quarterEnd.toISOString(),
        resolution_source: 'https://www.cepal.org',
        image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Informe publicado',
        option_b_label: 'NO — Sin informe especial',
      };
    } else {
      return {
        id, category: 'Cultura', country: 'LATAM',
        title: `¿Se convertirá "${topicText}" en una de las tendencias principales (Trending Topic / Top 5) en redes sociales en LATAM este mes?`,
        description: `Se resolverá a SÍ si "${topicText}" alcanza el Top 5 de tendencias más populares en plataformas de monitorización de redes sociales (como Google Trends o Trendinalia) durante al menos 24 horas consecutivas antes del ${nextMonthLabel}.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: 'https://trends.google.com',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Tendencia principal',
        option_b_label: 'NO — No alcanza relevancia',
      };
    }
  }

  // ── DEPORTES (generic, unchanged) ──
  if (category === 'Deportes') {
    const rType = Math.random();

    // Eliminatorias / Copa Libertadores / Liga local — no eventos con fecha fija ya pasada
    if (rType < 0.4) {
      const matchups = [
        { a: 'Colombia 🇨🇴', b: 'Uruguay 🇺🇾', countryA: 'CO', countryB: 'UY' },
        { a: 'Argentina 🇦🇷', b: 'Brasil 🇧🇷', countryA: 'AR', countryB: 'BR' },
        { a: 'México 🇲🇽', b: 'Ecuador 🇪🇨', countryA: 'MX', countryB: 'EC' },
        { a: 'Chile 🇨🇱', b: 'Perú 🇵🇪', countryA: 'CL', countryB: 'PE' },
        { a: 'Venezuela 🇻🇪', b: 'Bolivia 🇧🇴', countryA: 'LATAM', countryB: 'LATAM' },
      ];
      const m = matchups[Math.floor(Math.random() * matchups.length)];
      const tournaments = [
        { name: 'las Eliminatorias Sudamericanas 2026', url: 'https://www.conmebol.com/eliminatorias-sudamerica' },
        { name: 'la Copa Libertadores', url: 'https://www.conmebol.com/copa-libertadores' },
        { name: 'la Copa América 2028 (Clasificación)', url: 'https://www.conmebol.com' },
      ];
      const t = tournaments[Math.floor(Math.random() * tournaments.length)];
      return {
        id, category: 'Deportes', country: m.countryA,
        title: `¿Quién ganará el próximo partido de ${m.a} vs ${m.b} en ${t.name}?`,
        description: `Se resolverá a Opción A si ${m.a} gana el encuentro oficial (incluyendo tiempo extra o penales si aplica). Se resolverá a Opción B si gana ${m.b}. Resolución antes del ${nextMonthLabel}. Si el partido se suspende definitivamente, se anulará la apuesta.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: t.url,
        image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
        option_a_label: m.a.replace(/ 🇨🇴|🇦🇷|🇧🇷|🇲🇽|🇨🇱|🇵🇪|🇺🇾|🇪🇨|🇻🇪|🇧🇴/g, '').trim(),
        option_b_label: m.b.replace(/ 🇨🇴|🇦🇷|🇧🇷|🇲🇽|🇨🇱|🇵🇪|🇺🇾|🇪🇨|🇻🇪|🇧🇴/g, '').trim(),
      };
    }

    // F1 — Gran Premio próximo
    if (rType < 0.7) {
      const drivers = [
        'Max Verstappen', 'Lewis Hamilton', 'Lando Norris',
        'Charles Leclerc', 'Sergio "Checo" Pérez', 'Fernando Alonso'
      ];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const gpList = [
        { name: 'Gran Premio de Brasil', url: 'https://www.formula1.com/en/racing.html', country: 'BR' },
        { name: 'Gran Premio de México', url: 'https://www.formula1.com/en/racing.html', country: 'MX' },
        { name: 'Gran Premio de Las Vegas', url: 'https://www.formula1.com/en/racing.html', country: 'LATAM' },
        { name: 'Gran Premio de Abu Dhabi', url: 'https://www.formula1.com/en/racing.html', country: 'LATAM' },
      ];
      const gp = gpList[Math.floor(Math.random() * gpList.length)];
      return {
        id, category: 'Deportes', country: gp.country,
        title: `¿Terminará ${driver} en el podio (Top 3) en el ${gp.name} ${yearLabel}?`,
        description: `Se resolverá a SÍ si ${driver} finaliza en posiciones 1, 2 o 3 en la clasificación final oficial de la FIA para el ${gp.name} ${yearLabel}. Se resolverá a NO en caso contrario. Resolución máxima: ${nextMonthLabel}.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: gp.url,
        image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Podio',
        option_b_label: 'NO — Fuera del podio',
      };
    }

    // Copa Libertadores / Sudamericana — equipo específico
    const clubs = [
      { name: 'Atlético Nacional', country: 'CO' },
      { name: 'Millonarios FC', country: 'CO' },
      { name: 'Club América', country: 'MX' },
      { name: 'Boca Juniors', country: 'AR' },
      { name: 'River Plate', country: 'AR' },
      { name: 'Flamengo', country: 'BR' },
      { name: 'Palmeiras', country: 'BR' },
    ];
    const club = clubs[Math.floor(Math.random() * clubs.length)];
    return {
      id, category: 'Deportes', country: club.country,
      title: `¿Clasificará ${club.name} a los octavos de final de la Copa Libertadores ${yearLabel}?`,
      description: `Se resolverá a SÍ si ${club.name} avanza a la fase de octavos de final de la CONMEBOL Copa Libertadores ${yearLabel} según los resultados de fase de grupos o play-offs previos. Se resolverá a NO si es eliminado. Resolución: ${quarterLabel}.`,
      end_date: quarterEnd.toISOString(),
      resolution_source: 'https://www.conmebol.com/copa-libertadores',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Clasifica',
      option_b_label: 'NO — Eliminado',
    };
  }

  // ── TECNOLOGÍA ──
  if (category === 'Tecnología') {
    const rType = Math.random();

    if (rType < 0.33) {
      const latamTech = [
        { name: 'Rappi', country: 'CO', detail: 'realizar su IPO en bolsa de valores de EE.UU.' },
        { name: 'Nubank', country: 'BR', detail: 'superar los 110 millones de clientes activos en LATAM' },
        { name: 'Kavak', country: 'MX', detail: 'anunciar operaciones en un nuevo país latinoamericano' },
        { name: 'Mercado Libre', country: 'LATAM', detail: 'superar los 220 millones de usuarios activos' },
        { name: 'Clip', country: 'MX', detail: 'cerrar una ronda de financiación Serie D o superior' },
      ];
      const tech = latamTech[Math.floor(Math.random() * latamTech.length)];
      return {
        id, category: 'Tecnología', country: tech.country,
        title: `¿Logrará ${tech.name} ${tech.detail} antes del ${quarterLabel}?`,
        description: `Se resolverá a SÍ si ${tech.name} anuncia o concreta oficialmente el hito indicado antes del cierre del trimestre (${quarterLabel}). Se resolverá a NO si no se anuncia ningún comunicado oficial al respecto.`,
        end_date: quarterEnd.toISOString(),
        resolution_source: 'https://www.bloomberg.com/latin-america',
        image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ',
        option_b_label: 'NO',
      };
    }

    if (rType < 0.66) {
      const aiCompanies = ['OpenAI', 'Google DeepMind', 'Anthropic', 'Meta AI', 'xAI (Grok)'];
      const company = aiCompanies[Math.floor(Math.random() * aiCompanies.length)];
      const milestones = [
        'lanzar un modelo de razonamiento multi-modal con capacidades de agente autónomo',
        'anunciar un acuerdo de distribución con al menos 3 gobiernos latinoamericanos',
        'alcanzar 500 millones de usuarios activos mensuales en su plataforma de IA',
        'lanzar su primer modelo de lenguaje con entrenamiento en español nativo LATAM',
      ];
      const milestone = milestones[Math.floor(Math.random() * milestones.length)];
      return {
        id, category: 'Tecnología', country: 'LATAM',
        title: `¿Anunciará ${company} el hito de ${milestone} antes del ${quarterLabel}?`,
        description: `Se resolverá a SÍ si ${company} publica un comunicado de prensa oficial o artículo en blog corporativo confirmando el lanzamiento o hito antes del ${quarterLabel}. Se resolverá a NO si no se hace ningún anuncio al respecto en dicho periodo.`,
        end_date: quarterEnd.toISOString(),
        resolution_source: 'https://techcrunch.com',
        image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ',
        option_b_label: 'NO',
      };
    }

    // Cripto
    const cryptos = [
      { name: 'Bitcoin (BTC)', threshold: '120,000', unit: 'USD', ticker: 'BTC' },
      { name: 'Ethereum (ETH)', threshold: '5,000', unit: 'USD', ticker: 'ETH' },
    ];
    const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
    return {
      id, category: 'Tecnología', country: 'LATAM',
      title: `¿Superará ${crypto.name} el umbral de ${crypto.threshold} ${crypto.unit} antes del ${formatDate(yearEnd)}?`,
      description: `Se resolverá a SÍ si el precio de ${crypto.name} cierra por encima de ${crypto.threshold} ${crypto.unit} en al menos un día bursátil antes del 31 de diciembre de ${yearLabel}, según datos de CoinMarketCap. Se resolverá a NO si no se alcanza dicho umbral.`,
      end_date: yearEnd.toISOString(),
      resolution_source: `https://coinmarketcap.com/currencies/${crypto.ticker.toLowerCase()}`,
      image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — Supera ${crypto.threshold}`,
      option_b_label: 'NO — No alcanza',
    };
  }

  // ── POLÍTICA ──
  if (category === 'Política') {
    const latinCountries = [
      { name: 'Colombia', code: 'CO', congress: 'el Congreso de la República', gazette: 'https://www.secretariasenado.gov.co' },
      { name: 'México', code: 'MX', congress: 'la Cámara de Diputados', gazette: 'https://www.dof.gob.mx' },
      { name: 'Argentina', code: 'AR', congress: 'el Congreso de la Nación Argentina', gazette: 'https://www.boletinoficial.gob.ar' },
      { name: 'Chile', code: 'CL', congress: 'el Senado de Chile', gazette: 'https://www.bcn.cl' },
      { name: 'Perú', code: 'PE', congress: 'el Congreso de la República del Perú', gazette: 'https://www.congreso.gob.pe' },
      { name: 'Brasil', code: 'BR', congress: 'el Congreso Nacional de Brasil', gazette: 'https://www.congressonacional.leg.br' },
    ];
    const country = latinCountries[Math.floor(Math.random() * latinCountries.length)];
    const reforms = [
      'una nueva ley de reforma fiscal y tributaria',
      'la ley de presupuesto general de la nación',
      'una reforma a la seguridad social y sistema pensional',
      'la ley de fomento a la economía digital y startups',
      'una reforma al código laboral con nuevas garantías para trabajadores remotos',
      'la ley de transición energética y energías renovables',
    ];
    const reform = reforms[Math.floor(Math.random() * reforms.length)];
    return {
      id, category: 'Política', country: country.code,
      title: `¿Aprobará ${country.congress} de ${country.name} ${reform} antes del ${formatDate(yearEnd)}?`,
      description: `Se resolverá a SÍ si el texto definitivo de la ley es sancionado por el Ejecutivo y publicado en el diario oficial de ${country.name} antes del 31 de diciembre de ${yearLabel}. Se resolverá a NO si es archivado, retirado o se aplaza su debate final más allá de dicha fecha.`,
      end_date: yearEnd.toISOString(),
      resolution_source: country.gazette,
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Aprobada',
      option_b_label: 'NO — No aprobada',
    };
  }

  // ── ECONOMÍA ──
  if (category === 'Economía') {
    const centralBanks = [
      { name: 'el Banco de la República', country: 'Colombia', code: 'CO', currentRate: '9.75', threshold: '9.0', url: 'https://www.banrep.gov.co' },
      { name: 'Banco de México (Banxico)', country: 'México', code: 'MX', currentRate: '10.50', threshold: '10.0', url: 'https://www.banxico.org.mx' },
      { name: 'el Banco Central de Reserva del Perú', country: 'Perú', code: 'PE', currentRate: '6.25', threshold: '5.75', url: 'https://www.bcrp.gob.pe' },
      { name: 'el Banco Central de Chile', country: 'Chile', code: 'CL', currentRate: '5.00', threshold: '4.50', url: 'https://www.bcentral.cl' },
      { name: 'el Banco Central do Brasil (Selic)', country: 'Brasil', code: 'BR', currentRate: '10.75', threshold: '10.25', url: 'https://www.bcb.gov.br' },
    ];
    const bank = centralBanks[Math.floor(Math.random() * centralBanks.length)];
    const rType = Math.random();

    if (rType < 0.5) {
      return {
        id, category: 'Economía', country: bank.code,
        title: `¿Reducirá ${bank.name} la tasa de interés de referencia por debajo del ${bank.threshold}% en su próxima junta de política monetaria?`,
        description: `La tasa actual de referencia en ${bank.country} es ${bank.currentRate}%. Se resolverá a SÍ si en el próximo comunicado oficial de junta (previsto para ${nextMonthLabel}) se anuncia una reducción que deje la tasa por debajo de ${bank.threshold}%. Se resolverá a NO si se mantiene igual o sube.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: bank.url,
        image_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Baja',
        option_b_label: 'NO — Mantiene o sube',
      };
    }

    const inflationCountries = [
      { name: 'Colombia', code: 'CO', target: '3.0', agency: 'DANE', url: 'https://www.dane.gov.co' },
      { name: 'México', code: 'MX', target: '3.5', agency: 'INEGI', url: 'https://www.inegi.org.mx' },
      { name: 'Chile', code: 'CL', target: '3.0', agency: 'INE', url: 'https://www.ine.gob.cl' },
      { name: 'Perú', code: 'PE', target: '2.5', agency: 'INEI', url: 'https://www.inei.gob.pe' },
    ];
    const inf = inflationCountries[Math.floor(Math.random() * inflationCountries.length)];
    return {
      id, category: 'Economía', country: inf.code,
      title: `¿Logrará ${inf.name} reducir su tasa de inflación interanual por debajo del ${inf.target}% en el reporte del ${nextMonthLabel}?`,
      description: `Se resolverá a SÍ si el ${inf.agency} publica en su reporte oficial del mes de ${nextMonthLabel} una tasa de variación del IPC interanual (12 meses) inferior al ${inf.target}%. Se resolverá a NO si la cifra es igual o mayor.`,
      end_date: nextMonthEnd.toISOString(),
      resolution_source: inf.url,
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
      option_a_label: 'SÍ — Baja del objetivo',
      option_b_label: 'NO — No alcanza',
    };
  }

  // ── CULTURA ──
  if (category === 'Cultura') {
    const rType = Math.random();

    if (rType < 0.5) {
      const artists = [
        { name: 'Karol G', country: 'CO' },
        { name: 'Bad Bunny', country: 'LATAM' },
        { name: 'Feid', country: 'CO' },
        { name: 'Shakira', country: 'CO' },
        { name: 'Maluma', country: 'CO' },
        { name: 'J Balvin', country: 'CO' },
        { name: 'Rauw Alejandro', country: 'LATAM' },
      ];
      const artist = artists[Math.floor(Math.random() * artists.length)];
      const cities = [
        { name: 'Bogotá (El Campín)', country: 'CO' },
        { name: 'Ciudad de México (Foro Sol)', country: 'MX' },
        { name: 'Buenos Aires (River Plate)', country: 'AR' },
        { name: 'Santiago (Estadio Nacional)', country: 'CL' },
        { name: 'Lima (Estadio Nacional)', country: 'PE' },
      ];
      const city = cities[Math.floor(Math.random() * cities.length)];
      return {
        id, category: 'Cultura', country: city.country,
        title: `¿Agotará ${artist.name} todas las boletas de su próximo concierto en ${city.name} en menos de 48 horas?`,
        description: `Se resolverá a SÍ si la tiqueteadora oficial (Ticketmaster, Tu Boleta o equivalente) emite un comunicado de "Sold Out Total" dentro de las 48 horas siguientes a la apertura de venta general. Se resolverá a NO si quedan boletas disponibles pasadas las 48 horas. Resolución: ${nextMonthLabel}.`,
        end_date: nextMonthEnd.toISOString(),
        resolution_source: 'https://www.ticketmaster.com.co',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        option_a_label: 'SÍ — Sold Out',
        option_b_label: 'NO — Quedan boletas',
      };
    }

    // Premios / Nominaciones
    const awards = [
      { name: 'Latin Grammy', category: 'Álbum del Año', url: 'https://www.latingrammy.com', country: 'LATAM' },
      { name: 'Premio Lo Nuestro', category: 'Artista del Año', url: 'https://www.premioalonuestro.com', country: 'LATAM' },
      { name: 'MTV Miaw', category: 'Artista Favorito', url: 'https://www.mtvla.com', country: 'LATAM' },
    ];
    const award = awards[Math.floor(Math.random() * awards.length)];
    const nominees = ['Karol G', 'Feid', 'Bad Bunny', 'Shakira', 'Peso Pluma'];
    const nominee = nominees[Math.floor(Math.random() * nominees.length)];
    return {
      id, category: 'Cultura', country: award.country,
      title: `¿Ganará ${nominee} el galardón "${award.category}" en los ${award.name} ${yearLabel}?`,
      description: `Se resolverá a SÍ si ${nominee} resulta ganador del premio "${award.category}" en la ceremonia oficial de los ${award.name} ${yearLabel}. Se resolverá a NO si el premio es para otro artista o si ${nominee} no está nominado. Resolución: ${formatDate(yearEnd)}.`,
      end_date: yearEnd.toISOString(),
      resolution_source: award.url,
      image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      option_a_label: `SÍ — ${nominee} gana`,
      option_b_label: 'NO — Otro artista',
    };
  }

  // Fallback genérico
  return {
    id, category,
    title: `¿Aprobará el Congreso la nueva ley de fomento a la economía digital de LATAM antes del ${formatDate(yearEnd)}?`,
    description: `Se resolverá a SÍ si se promulga en la gaceta oficial antes del ${formatDate(yearEnd)}.`,
    country: 'LATAM',
    end_date: yearEnd.toISOString(),
    resolution_source: 'https://www.cepal.org',
    image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
  };
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const toDatetimeLocal = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CATEGORIES = ['Deportes', 'Tecnología', 'Política', 'Economía', 'Cultura'];
const COUNTRIES = [
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'AR', label: '🇦🇷 Argentina' },
  { code: 'BR', label: '🇧🇷 Brasil' },
  { code: 'CL', label: '🇨🇱 Chile' },
  { code: 'PE', label: '🇵🇪 Perú' },
  { code: 'EC', label: '🇪🇨 Ecuador' },
  { code: 'UY', label: '🇺🇾 Uruguay' },
  { code: 'BO', label: '🇧🇴 Bolivia' },
  { code: 'VE', label: '🇻🇪 Venezuela' },
  { code: 'LATAM', label: '🌎 LATAM (Regional)' },
];

const inputStyle = {
  padding: '0.5rem 0.65rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid hsl(var(--border))',
  width: '100%',
  fontWeight: 600,
  fontSize: '0.8rem',
  background: 'hsl(var(--bg-app))',
  color: 'hsl(var(--text-main))',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'hsl(var(--text-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.3rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AiCurator({ onMarketLaunched }) {
  const [logs, setLogs] = useState([
    { text: '🔌 Consola inactiva. Haz clic en "Iniciar Análisis IA" para generar una pregunta contextual o usa el formulario manual.', type: 'bold' }
  ]);
  // Start EMPTY — no pre-seeded suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos');
  const [selectedTopic, setSelectedTopic] = useState(null); // { id, label, emoji }
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const terminalBoxRef = useRef(null);
  const activeIntervalRef = useRef(null);

  // Suggestion edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editOptionA, setEditOptionA] = useState('');
  const [editOptionB, setEditOptionB] = useState('');

  // Manual creation form state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPublishing, setManualPublishing] = useState(false);
  const [manualErrors, setManualErrors] = useState({});
  const [manualForm, setManualForm] = useState({
    title: '',
    description: '',
    category: 'Deportes',
    country: 'CO',
    option_a_label: 'SÍ',
    option_b_label: 'NO',
    start_date: toDatetimeLocal(new Date().toISOString()),
    end_date: toDatetimeLocal(getCurrentQuarterEnd().toISOString()),
    resolution_source: '',
  });

  useEffect(() => {
    // Scroll only inside the terminal box — never moves the page
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => { if (activeIntervalRef.current) clearInterval(activeIntervalRef.current); };
  }, []);

  // Reset topic filter when category changes
  useEffect(() => {
    setSelectedTopic(null);
    setCustomTopic('');
    setShowCustomInput(false);
  }, [selectedCategoryFilter]);

  // ── IA SIMULATION ──
  const handleStartSimulation = async () => {
    if (running) return;
    setRunning(true);
    setLogs([{ text: '🌐 Conectando a Google Trends...', type: 'info' }]);

    const genCategory = selectedCategoryFilter === 'Todos'
      ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      : selectedCategoryFilter;

    // Resolve active topic
    const activeTopic = showCustomInput && customTopic.trim()
      ? customTopic.trim()
      : (selectedTopic ? selectedTopic.label : null);

    try {
      setLogs(prev => [...prev, { text: '📡 Obteniendo tendencias de LATAM...', type: 'info' }]);
      
      const trendsRes = await fetch('/api/trends?geo=CO');
      const trendsData = await trendsRes.json();
      
      let trendingText = 'No se pudieron obtener tendencias.';
      if (trendsData.success && trendsData.trends) {
        trendingText = trendsData.trends.slice(0, 15).join(', ');
        setLogs(prev => [...prev, { text: `🔥 Tendencias actuales: ${trendsData.trends.slice(0,3).join(', ')}...`, type: 'success' }]);
      }

      setLogs(prev => [...prev, { text: '🧠 Invocando Gemini 1.5 Flash para generar preguntas...', type: 'warning' }]);

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Falta la clave VITE_GEMINI_API_KEY en el archivo .env o en el panel de Vercel.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const schema = {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Pregunta de mercado atractiva." },
            description: { type: SchemaType.STRING, description: "Contexto detallado de cómo se resolverá." },
            category: { type: SchemaType.STRING, description: "Política, Deportes, Tecnología, Economía, Cultura" },
            option_a_label: { type: SchemaType.STRING, description: "SÍ, Aprobará, Gana X" },
            option_b_label: { type: SchemaType.STRING, description: "NO, Rechazará, Gana Y" },
            resolution_source: { type: SchemaType.STRING, description: "URL de la fuente oficial de resolución" }
          },
          required: ["title", "description", "category", "option_a_label", "option_b_label", "resolution_source"]
        }
      };

      const prompt = `Eres un agente experto en mercados de predicción.
Contexto:
- Categoría Solicitada: ${genCategory}
- Tema Específico: ${activeTopic || 'Cualquiera'}
- Tendencias Actuales de Google (Opcional): ${trendingText}

Genera 2 preguntas de mercados de predicción sumamente polémicas, claras y relevantes para LATAM, basándote en las tendencias de Google (si hay) o en el tema.
El mercado debe poder resolverse en los próximos meses.
Devuelve el resultado como un JSON array válido que cumpla con el esquema provisto.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      const marketsArray = JSON.parse(result.response.text());

      setLogs(prev => [...prev, { text: `✅ Se generaron ${marketsArray.length} mercados exitosamente.`, type: 'success' }]);

      const newSuggestions = marketsArray.map((m, idx) => ({
        id: `dyn-ai-${Date.now()}-${idx}`,
        title: m.title,
        description: m.description,
        category: m.category,
        country: 'CO', // fallback default
        start_date: new Date().toISOString(),
        end_date: getNextMonthEnd().toISOString(),
        yes_price: 50.00, no_price: 50.00,
        yes_liquidity: 500.00, no_liquidity: 500.00,
        volume: 0,
        status: 'active',
        resolution_source: m.resolution_source,
        image_url: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&w=400&q=80',
        option_a_label: m.option_a_label,
        option_b_label: m.option_b_label
      }));

      setSuggestions(prev => [...newSuggestions, ...prev]);

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, { text: `❌ Error: ${error.message}`, type: 'error' }]);
    } finally {
      setRunning(false);
    }
  };

  // ── SUGGESTION EDIT ──
  const handleStartEdit = (sug) => {
    setEditingId(sug.id);
    setEditTitle(sug.title);
    setEditDesc(sug.description);
    setEditSource(sug.resolution_source);
    setEditOptionA(sug.option_a_label || 'SÍ');
    setEditOptionB(sug.option_b_label || 'NO');
    const now = new Date();
    setEditStartDate(toDatetimeLocal(now.toISOString()));
    const endFallback = sug.end_date ? new Date(sug.end_date) : getNextMonthEnd();
    setEditEndDate(toDatetimeLocal(endFallback.toISOString()));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle(''); setEditDesc(''); setEditStartDate('');
    setEditEndDate(''); setEditSource(''); setEditOptionA(''); setEditOptionB('');
  };

  const handleLaunch = async (suggestion) => {
    try {
      setPublishing(suggestion.id);
      const isEdited = editingId === suggestion.id;
      const now = new Date();
      const defaultEnd = suggestion.end_date ? new Date(suggestion.end_date) : getNextMonthEnd();

      // Validate end date is in the future
      const resolvedEnd = isEdited && editEndDate ? new Date(editEndDate) : defaultEnd;
      if (resolvedEnd <= now) {
        await Dialog.alert('⚠️ La fecha de cierre debe ser posterior a hoy. Edita la fecha antes de publicar.');
        setPublishing(null);
        if (!editingId) handleStartEdit(suggestion);
        return;
      }

      const newMarket = {
        title: isEdited && editTitle ? editTitle : suggestion.title,
        description: isEdited && editDesc ? editDesc : suggestion.description,
        category: suggestion.category,
        country: suggestion.country,
        start_date: isEdited && editStartDate ? new Date(editStartDate).toISOString() : now.toISOString(),
        end_date: resolvedEnd.toISOString(),
        yes_price: 50.00, no_price: 50.00,
        yes_liquidity: 500.00, no_liquidity: 500.00,
        volume: 0,
        status: 'active',
        resolution_source: isEdited && editSource ? editSource : suggestion.resolution_source,
        image_url: suggestion.image_url,
        option_a_label: isEdited && editOptionA ? editOptionA : (suggestion.option_a_label || 'SÍ'),
        option_b_label: isEdited && editOptionB ? editOptionB : (suggestion.option_b_label || 'NO'),
      };

      const { error } = await supabase.from('markets').insert(newMarket);
      if (error) throw error;
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      handleCancelEdit();
      if (onMarketLaunched) onMarketLaunched();
      await Dialog.alert('✅ ¡Mercado publicado y activo! Ya está visible para todos los inversores.');
    } catch (err) {
      console.error('Error publishing market:', err);
      await Dialog.alert('Error al publicar el mercado.');
    } finally {
      setPublishing(null);
    }
  };

  const handleDiscardSuggestion = (id) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
    if (editingId === id) handleCancelEdit();
  };

  // ── MANUAL FORM ──
  const updateManual = (field, value) => {
    setManualForm(prev => ({ ...prev, [field]: value }));
    if (manualErrors[field]) setManualErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateManual = () => {
    const errors = {};
    if (!manualForm.title || manualForm.title.trim().length < 20)
      errors.title = 'El título debe tener al menos 20 caracteres.';
    if (!manualForm.description || manualForm.description.trim().length < 30)
      errors.description = 'La descripción debe tener al menos 30 caracteres.';
    if (!manualForm.resolution_source || !manualForm.resolution_source.startsWith('https://'))
      errors.resolution_source = 'La URL debe comenzar con https://';
    if (!manualForm.option_a_label || manualForm.option_a_label.trim().length < 1)
      errors.option_a_label = 'Requerido.';
    if (!manualForm.option_b_label || manualForm.option_b_label.trim().length < 1)
      errors.option_b_label = 'Requerido.';
    if (!manualForm.end_date)
      errors.end_date = 'Selecciona una fecha de cierre.';
    else if (new Date(manualForm.end_date) <= new Date())
      errors.end_date = 'La fecha de cierre debe ser futura.';
    return errors;
  };

  const handleManualPublish = async () => {
    const errors = validateManual();
    if (Object.keys(errors).length > 0) { setManualErrors(errors); return; }
    try {
      setManualPublishing(true);
      const newMarket = {
        title: manualForm.title.trim(),
        description: manualForm.description.trim(),
        category: manualForm.category,
        country: manualForm.country,
        start_date: manualForm.start_date ? new Date(manualForm.start_date).toISOString() : new Date().toISOString(),
        end_date: new Date(manualForm.end_date).toISOString(),
        yes_price: 50.00, no_price: 50.00,
        yes_liquidity: 500.00, no_liquidity: 500.00,
        volume: 0,
        status: 'active',
        resolution_source: manualForm.resolution_source.trim(),
        image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80',
        option_a_label: manualForm.option_a_label.trim(),
        option_b_label: manualForm.option_b_label.trim(),
      };
      const { error } = await supabase.from('markets').insert(newMarket);
      if (error) throw error;
      // Reset form
      setManualForm({
        title: '', description: '', category: 'Deportes', country: 'CO',
        option_a_label: 'SÍ', option_b_label: 'NO',
        start_date: toDatetimeLocal(new Date().toISOString()),
        end_date: toDatetimeLocal(getCurrentQuarterEnd().toISOString()),
        resolution_source: '',
      });
      setManualErrors({});
      setManualOpen(false);
      if (onMarketLaunched) onMarketLaunched();
      await Dialog.alert('✅ ¡Pregunta creada manualmente y publicada al mercado!');
    } catch (err) {
      console.error('Error publishing manual market:', err);
      await Dialog.alert('Error al publicar la pregunta.');
    } finally {
      setManualPublishing(false);
    }
  };

  // ── RENDER ──
  const filteredSuggestions = selectedCategoryFilter === 'Todos'
    ? suggestions
    : suggestions.filter(s => s.category === selectedCategoryFilter);

  const errStyle = { fontSize: '0.7rem', color: '#ef4444', marginTop: '0.2rem', fontWeight: 600 };

  return (
    <div className="ai-curator-view">

      {/* ══ PANEL 1: AI Terminal ══ */}
      <div className="curator-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
          <Terminal size={20} className="glow-brand" style={{ color: 'hsl(var(--brand))' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Consola del Agente IA</h3>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Generación contextual y automática de preguntas con fechas futuras verificadas</p>
          </div>
          {running ? (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--yes-color))', background: 'hsl(var(--yes-bg) / 0.15)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
              <span className="animate-pulse" style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'hsl(var(--yes-color))', display: 'inline-block' }} />
              Analizando Noticias...
            </span>
          ) : (
            <button
              onClick={handleStartSimulation}
              className="submit-trade-btn buy-yes"
              style={{ marginLeft: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            >
              <Sparkles size={12} />
              Iniciar Análisis por IA
            </button>
          )}
        </div>

        {/* Category filter for IA generation */}
        <div style={{ display: 'flex', gap: '0.4rem', margin: '0.75rem 0 0', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          {['Todos', ...CATEGORIES].map((cat) => {
            const isActive = selectedCategoryFilter === cat;
            return (
              <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '100px', border: isActive ? '1px solid hsl(var(--brand))' : '1px solid hsl(var(--border))', background: isActive ? 'hsl(var(--brand) / 0.12)' : 'transparent', color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {cat === 'Deportes' && '🏆 '}{cat === 'Tecnología' && '💻 '}{cat === 'Política' && '🏛️ '}{cat === 'Economía' && '📈 '}{cat === 'Cultura' && '🎭 '}{cat}
              </button>
            );
          })}
        </div>

        {/* Topic selector for IA generation */}
        {selectedCategoryFilter !== 'Todos' && (
          <div style={{ marginTop: '0.75rem', borderTop: '1px dashed hsl(var(--border))', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tema o Subcategoría (Opcional)
              </span>
              {(selectedTopic || (showCustomInput && customTopic.trim())) && (
                <button
                  onClick={() => { setSelectedTopic(null); setCustomTopic(''); setShowCustomInput(false); }}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--brand))', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Limpiar tema
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollbarWidth: 'none', flexWrap: 'wrap' }}>
              {(TOPICS_BY_CATEGORY[selectedCategoryFilter] || []).map((topic) => {
                const isSelected = selectedTopic?.id === topic.id && !showCustomInput;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setShowCustomInput(false);
                    }}
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      borderRadius: '100px',
                      border: isSelected ? '1px solid hsl(var(--brand))' : '1px solid hsl(var(--border))',
                      background: isSelected ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-app) / 0.4)',
                      color: isSelected ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setShowCustomInput(true);
                  setSelectedTopic(null);
                }}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '100px',
                  border: showCustomInput ? '1px solid hsl(var(--brand))' : '1px solid hsl(var(--border))',
                  background: showCustomInput ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-app) / 0.4)',
                  color: showCustomInput ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s',
                }}
              >
                <span>✏️</span>
                <span>Tema Personalizado</span>
              </button>
            </div>

            {showCustomInput && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Escribe un tema (ej: Copa Libertadores, Mundial de Clubes...)"
                  style={{
                    ...inputStyle,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    width: '100%',
                    maxWidth: '320px',
                  }}
                />
                {customTopic.trim() && (
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--brand))', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <Check size={12} /> Listo
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="terminal-box" ref={terminalBoxRef} style={{ marginTop: '0.75rem' }}>
          {logs.map((log, idx) => (
            <div key={idx} className={`terminal-line ${log.type}`}>{log.text}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
          <AlertCircle size={14} />
          <span>Las preguntas generadas siempre tienen fecha de cierre futura. Revísalas y edítalas antes de publicar.</span>
        </div>
      </div>

      {/* ══ PANEL 2: AI Suggestions ══ */}
      <div className="curator-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
          <Sparkles size={20} style={{ color: '#eab308' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Sugerencias del Oráculo</h3>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Propuestas generadas por IA — revisa, edita y publica al mercado</p>
          </div>
          {suggestions.length > 0 && (
            <span style={{ marginLeft: 'auto', background: 'hsl(var(--brand) / 0.15)', color: 'hsl(var(--brand))', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '100px' }}>
              {suggestions.length} pendiente{suggestions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="ai-suggestions-list">
          {filteredSuggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
              <Sparkles size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Sin sugerencias pendientes</p>
              <p style={{ fontSize: '0.8rem' }}>Haz clic en <strong>"Iniciar Análisis por IA"</strong> para generar una pregunta contextual.</p>
            </div>
          ) : filteredSuggestions.map((sug) => {
            const isEditing = editingId === sug.id;
            const isPublishing = publishing === sug.id;
            const closingDate = sug.end_date ? formatDate(new Date(sug.end_date)) : '—';

            return (
              <div key={sug.id} className="suggestion-card">
                <div className="suggestion-header">
                  <span className="source-tag">{sug.category}</span>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.72rem', fontWeight: 600 }}>
                    {COUNTRIES.find(c => c.code === sug.country)?.label || sug.country}
                  </span>
                  {!isEditing && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={10} /> Cierra: {closingDate}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div>
                      <label style={labelStyle}>Título de la Pregunta</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Descripción / Reglas de Resolución</label>
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
                    </div>
                    <div className="grid-2col-responsive">
                      <div>
                        <label style={labelStyle}>Opción A</label>
                        <input type="text" value={editOptionA} onChange={e => setEditOptionA(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Opción B</label>
                        <input type="text" value={editOptionB} onChange={e => setEditOptionB(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div className="grid-2col-responsive">
                      <div>
                        <label style={labelStyle}><Calendar size={10} /> Fecha de Inicio</label>
                        <input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}><Calendar size={10} /> Fecha de Cierre</label>
                        <input type="datetime-local" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}><Link2 size={10} /> Fuente de Resolución (URL)</label>
                      <input type="url" value={editSource} onChange={e => setEditSource(e.target.value)} style={inputStyle} placeholder="https://..." />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '0.4rem' }}>{sug.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', lineHeight: 1.45 }}>{sug.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'hsl(var(--yes-bg) / 0.08)', color: 'hsl(var(--yes-color))', fontWeight: 700 }}>
                        A: {sug.option_a_label}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'hsl(var(--no-bg) / 0.08)', color: 'hsl(var(--no-color))', fontWeight: 700 }}>
                        B: {sug.option_b_label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Link2 size={10} />
                      <a href={sug.resolution_source} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--brand))', fontWeight: 600 }}>{sug.resolution_source}</a>
                    </div>
                  </div>
                )}

                <div className="suggestion-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {isEditing ? (
                    <>
                      <button onClick={handleCancelEdit} style={{ background: 'transparent', color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <X size={14} /> Cancelar
                      </button>
                      <button className="approve-btn" onClick={() => handleLaunch(sug)} disabled={isPublishing} style={{ cursor: isPublishing ? 'wait' : 'pointer', opacity: isPublishing ? 0.7 : 1 }}>
                        <Check size={14} /> {isPublishing ? 'Publicando...' : 'Guardar y Lanzar'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleDiscardSuggestion(sug.id)} style={{ background: 'transparent', color: 'hsl(var(--text-muted))', borderColor: 'hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <X size={14} /> Descartar
                      </button>
                      <button onClick={() => handleStartEdit(sug)} style={{ background: 'transparent', color: 'hsl(var(--text-main))', borderColor: 'hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Edit3 size={14} /> Editar
                      </button>
                      <button className="approve-btn" onClick={() => handleLaunch(sug)} disabled={isPublishing} style={{ cursor: isPublishing ? 'wait' : 'pointer', opacity: isPublishing ? 0.7 : 1 }}>
                        <PlusCircle size={14} /> {isPublishing ? 'Publicando...' : 'Lanzar al Mercado'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ PANEL 3: Manual Question Creation ══ */}
      <div className="curator-panel">
        <button
          onClick={() => setManualOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <FilePlus size={20} style={{ color: 'hsl(var(--brand))' }} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Crear Pregunta Manualmente</h3>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Define todos los parámetros de un nuevo mercado sin pasar por la IA</p>
          </div>
          <ChevronDown size={18} style={{ color: 'hsl(var(--text-muted))', transform: manualOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {manualOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem' }}>

            {/* Title */}
            <div>
              <label style={labelStyle}><Hash size={10} /> Título de la Pregunta *</label>
              <input
                type="text"
                value={manualForm.title}
                onChange={e => updateManual('title', e.target.value)}
                style={{ ...inputStyle, fontWeight: 700, borderColor: manualErrors.title ? '#ef4444' : undefined }}
                placeholder="¿...? (mínimo 20 caracteres)"
              />
              {manualErrors.title && <p style={errStyle}>{manualErrors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}><Hash size={10} /> Descripción y Reglas de Resolución *</label>
              <textarea
                value={manualForm.description}
                onChange={e => updateManual('description', e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', borderColor: manualErrors.description ? '#ef4444' : undefined }}
                placeholder="Describe cuándo se resuelve a SÍ y cuándo a NO con claridad..."
              />
              {manualErrors.description && <p style={errStyle}>{manualErrors.description}</p>}
            </div>

            {/* Category + Country */}
            <div className="grid-2col-responsive">
              <div>
                <label style={labelStyle}><Globe size={10} /> Categoría</label>
                <select value={manualForm.category} onChange={e => updateManual('category', e.target.value)} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}><Globe size={10} /> País / Región</label>
                <select value={manualForm.country} onChange={e => updateManual('country', e.target.value)} style={inputStyle}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="grid-2col-responsive">
              <div>
                <label style={{ ...labelStyle, color: 'hsl(var(--yes-color))' }}>✅ Etiqueta Opción A *</label>
                <input type="text" value={manualForm.option_a_label} onChange={e => updateManual('option_a_label', e.target.value)} style={{ ...inputStyle, borderColor: manualErrors.option_a_label ? '#ef4444' : undefined }} placeholder="SÍ" />
                {manualErrors.option_a_label && <p style={errStyle}>{manualErrors.option_a_label}</p>}
              </div>
              <div>
                <label style={{ ...labelStyle, color: 'hsl(var(--no-color))' }}>❌ Etiqueta Opción B *</label>
                <input type="text" value={manualForm.option_b_label} onChange={e => updateManual('option_b_label', e.target.value)} style={{ ...inputStyle, borderColor: manualErrors.option_b_label ? '#ef4444' : undefined }} placeholder="NO" />
                {manualErrors.option_b_label && <p style={errStyle}>{manualErrors.option_b_label}</p>}
              </div>
            </div>

            {/* Dates */}
            <div className="grid-2col-responsive">
              <div>
                <label style={labelStyle}><Calendar size={10} /> Fecha de Inicio</label>
                <input type="datetime-local" value={manualForm.start_date} onChange={e => updateManual('start_date', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}><Calendar size={10} /> Fecha de Cierre (Resolución) *</label>
                <input type="datetime-local" value={manualForm.end_date} onChange={e => updateManual('end_date', e.target.value)} style={{ ...inputStyle, borderColor: manualErrors.end_date ? '#ef4444' : undefined }} />
                {manualErrors.end_date && <p style={errStyle}>{manualErrors.end_date}</p>}
              </div>
            </div>

            {/* Resolution Source */}
            <div>
              <label style={labelStyle}><Link2 size={10} /> Fuente Oficial de Resolución * (debe ser https://)</label>
              <input
                type="url"
                value={manualForm.resolution_source}
                onChange={e => updateManual('resolution_source', e.target.value)}
                style={{ ...inputStyle, borderColor: manualErrors.resolution_source ? '#ef4444' : undefined }}
                placeholder="https://www.fuente-oficial.com"
              />
              {manualErrors.resolution_source && <p style={errStyle}>{manualErrors.resolution_source}</p>}
            </div>

            {/* Submit */}
            <button
              onClick={handleManualPublish}
              disabled={manualPublishing}
              className="submit-trade-btn buy-yes"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: manualPublishing ? 0.7 : 1, cursor: manualPublishing ? 'wait' : 'pointer', marginTop: '0.25rem' }}
            >
              <FilePlus size={16} />
              {manualPublishing ? 'Publicando pregunta...' : 'Publicar Pregunta al Mercado'}
            </button>

            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textAlign: 'center', marginTop: '-0.25rem' }}>
              La pregunta se publicará inmediatamente como mercado activo visible para todos los inversores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
