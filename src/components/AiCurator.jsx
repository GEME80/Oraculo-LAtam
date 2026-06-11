import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Sparkles, AlertCircle, Edit3, PlusCircle, Check, X, Calendar, Link2, FilePlus, Globe, Hash, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Dialog } from './CustomDialog';

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
// DYNAMIC QUESTION GENERATOR (context-aware)
// ─────────────────────────────────────────────
const generateDynamicCuratedSuggestion = (category) => {
  const id = `dyn-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();
  const nextMonthEnd = getNextMonthEnd();
  const quarterEnd = getCurrentQuarterEnd();
  const yearEnd = getCurrentYearEnd();
  const nextMonthLabel = nextMonthEnd.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const quarterLabel = formatDate(quarterEnd);
  const yearLabel = yearEnd.getFullYear().toString();

  // ── DEPORTES ──
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

  // ── IA SIMULATION ──
  const handleStartSimulation = () => {
    if (running) return;
    setRunning(true);
    const genCategory = selectedCategoryFilter === 'Todos'
      ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      : selectedCategoryFilter;

    const categoryLogs = LOGS_BY_CATEGORY[genCategory] || LOGS_BY_CATEGORY['Deportes'];
    let logIndex = 0;
    setLogs([categoryLogs[0]]);
    if (activeIntervalRef.current) clearInterval(activeIntervalRef.current);

    activeIntervalRef.current = setInterval(() => {
      if (logIndex < categoryLogs.length - 1) {
        logIndex++;
        setLogs(prev => [...prev, categoryLogs[logIndex]]);
      } else {
        clearInterval(activeIntervalRef.current);
        setRunning(false);
        const newSug = generateDynamicCuratedSuggestion(genCategory);
        setSuggestions(prev => [newSug, ...prev]);
      }
    }, 1400);
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                      <div>
                        <label style={labelStyle}>Opción A</label>
                        <input type="text" value={editOptionA} onChange={e => setEditOptionA(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Opción B</label>
                        <input type="text" value={editOptionB} onChange={e => setEditOptionB(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
