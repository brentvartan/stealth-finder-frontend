import React, { useState, useEffect, useCallback } from 'react';
import { items as itemsApi, enrich } from '../api/client';
import MatchCard from './MatchCard';
import { Search, RefreshCw, Award, ShoppingBag, CheckCircle, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CONSUMER_CATEGORIES = [
  'Consumer AI', 'Home/Lifestyle', 'CPG/Food/Drink', 'Apparel', 'Beauty',
  'Health/Wellness', 'Fitness', 'Education', 'Finance', 'Entertainment', 'Sports',
];

export const BULLISH_THEMES = [
  'GLP-1 / Weight Management Adjacent',
  'Women\'s Health Renaissance',
  'Longevity / Healthspan',
  'Functional Beverages',
  'Men\'s Personal Care Awakening',
  'Third-Place Fitness',
  'GenAlpha Beauty',
  'Premium Pet',
  'Analog Revival',
  'Dietary / Food Identity',
  'Climate-Positive Consumer',
  'AI-Personalized Care',
];

const SCORE_BOOSTS = {
  trademark: 15, delaware: 5, domain: 3, instagram: 8, shopify: 10, social: 2, manual: 5,
};

// ─── Matching logic ────────────────────────────────────────────────────────────

function normalizeCompanyName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+(inc|llc|corp|corporation|company|co|ltd)\.?$/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function buildMatches(signals, filters) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - filters.dateRange);

  const filtered = signals.filter(signal => {
    // Filter by when WE saved the signal (savedAt), not the original filing date.
    // A 6-month-old Form D we just discovered is still a fresh find.
    const discoveryDate = new Date(signal.savedAt || signal.timestamp);
    return discoveryDate >= cutoffDate && filters.categories.includes(signal.category);
  });

  const groups = {};
  filtered.forEach(signal => {
    const key = normalizeCompanyName(signal.companyName);
    if (!key) return;
    if (!groups[key]) groups[key] = { name: signal.companyName, signals: [], category: signal.category };
    groups[key].signals.push(signal);
  });

  const TIER_ORDER = { hot: 0, warm: 1, cold: 2, null: 3 };

  return Object.values(groups)
    .map(group => {
      const hasTrademark = group.signals.some(s => s.signal_type === 'trademark');
      const hasDelaware  = group.signals.some(s => s.signal_type === 'delaware');
      const hasDomain    = group.signals.some(s => s.signal_type === 'domain');
      const hasInstagram = group.signals.some(s => s.signal_type === 'instagram');
      const hasShopify   = group.signals.some(s => s.signal_type === 'shopify');
      const hasSocial    = group.signals.some(s => s.signal_type === 'social');

      let score = group.signals.reduce((sum, s) => sum + (SCORE_BOOSTS[s.signal_type] || 5), 0);
      if (hasTrademark && (hasDelaware || hasDomain)) score += 20;
      if (hasDelaware && hasDomain && hasSocial)       score += 10;
      if (hasShopify && hasInstagram)                  score += 15;

      // Best enrichment: prefer trademark signal's enrichment, then any other
      const tmEnriched  = group.signals.find(s => s.signal_type === 'trademark' && s.enrichment?.enriched);
      const anyEnriched = group.signals.find(s => s.enrichment?.enriched);
      const enrichment  = (tmEnriched || anyEnriched)?.enrichment || null;

      const primarySignal = tmEnriched || anyEnriched || group.signals[0];

      return {
        ...group, score, enrichment,
        hasTrademark, hasDelaware, hasDomain, hasInstagram, hasShopify, hasSocial,
        latestSignal: new Date(Math.max(...group.signals.map(s => new Date(s.timestamp)))),
        primarySignalId: primarySignal?.id ?? null,
        team_notes: primarySignal?.team_notes || '',
      };
    })
    .filter(m => m.signals.length >= filters.minSignals)
    .sort((a, b) => {
      // Primary: HOT → WARM → COLD → unenriched
      const aTier = TIER_ORDER[a.enrichment?.watch_level ?? 'null'] ?? 3;
      const bTier = TIER_ORDER[b.enrichment?.watch_level ?? 'null'] ?? 3;
      if (aTier !== bTier) return aTier - bTier;
      // Secondary: higher Bullish score first (or signal score if unenriched)
      const aScore = a.enrichment?.bullish_score ?? a.score;
      const bScore = b.enrichment?.bullish_score ?? b.score;
      return bScore - aScore;
    });
}

function parseSignalsFromItems(allItems) {
  return allItems.flatMap(item => {
    try {
      const meta = JSON.parse(item.description || '{}');
      if (meta._type === 'signal') {
        return [{
          id:          item.id,
          companyName: meta.company_name || item.title,
          signal_type: meta.signal_type || 'manual',
          category:    meta.category || 'Consumer AI',
          description: meta.description || '',
          url:         meta.url || '',
          notes:       meta.notes || '',
          timestamp:   meta.timestamp || item.created_at,
          savedAt:     item.created_at,   // when WE discovered it (used for date filter)
          enrichment:  meta.enrichment || null,
          team_notes:  meta.team_notes || '',
          fp:          meta.fp || '',
        }];
      }
    } catch (e) {}
    return [];
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, sublabel, value, total, topColor = '#E5E5E0', valueColor = '#000', onClick, active }) {
  return (
    <div
      className={`bg-white rounded-lg p-5 flex flex-col gap-2 transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${active ? 'shadow-md' : ''}`}
      style={{ borderTop: `3px solid ${topColor}`, outline: active ? `2px solid ${topColor}` : 'none', outlineOffset: '2px' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</span>
        {onClick && (
          <span className="text-[9px] text-neutral-300 uppercase tracking-wide shrink-0 mt-0.5">
            {active ? 'Clear ×' : 'Filter'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display font-bold text-4xl leading-none" style={{ color: valueColor }}>
          {value}
        </span>
        {total > 0 && (
          <span className="text-xs text-neutral-300 font-medium">of {total} scored</span>
        )}
      </div>
      {sublabel && (
        <p className="text-[10px] text-neutral-300 leading-snug mt-1">{sublabel}</p>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { setNewHotCount } = useAuth();
  const [signals,    setSignals]    = useState([]);
  const [matches,    setMatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [enriching,  setEnriching]  = useState(false);
  const [enrichMsg,  setEnrichMsg]  = useState('');
  const [tierFilter, setTierFilter] = useState(null); // null | 'hot' | 'warm' | 'cold'
  const [filters,    setFilters]    = useState({
    minSignals: 1,
    dateRange:  180,
    categories: CONSUMER_CATEGORIES,
    search:     '',
    minScore:   0,
    theme:      '',
  });

  const loadSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsApi.getAll({ per_page: 1000 });
      const allItems = response.data.items || [];
      setSignals(parseSignalsFromItems(allItems));

      // Update "new since last login" HOT badge in nav
      const prevLogin = localStorage.getItem('prev_login_at');
      if (prevLogin) {
        const cutoff = new Date(prevLogin);
        const parsedSignals = parseSignalsFromItems(allItems);
        const hotNew = parsedSignals.filter(s =>
          s.enrichment?.watch_level === 'hot' && new Date(s.savedAt) > cutoff
        ).length;
        setNewHotCount(hotNew);
      }
    } catch (err) {
      setError('Failed to load signals. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [setNewHotCount]);

  const runEnrichment = useCallback(async () => {
    setEnriching(true);
    setEnrichMsg('');
    try {
      const resp = await enrich.batch({ unenrichedOnly: true, limit: 5 });
      const { enriched, total_processed } = resp.data;
      setEnrichMsg(
        enriched > 0
          ? `${enriched} signal${enriched !== 1 ? 's' : ''} analysed by Bullish AI`
          : total_processed === 0
            ? 'All signals already enriched'
            : 'No new signals to enrich'
      );
      await loadSignals();
    } catch (err) {
      setEnrichMsg('Enrichment failed — check ANTHROPIC_API_KEY is set');
    } finally {
      setEnriching(false);
    }
  }, [loadSignals]);

  useEffect(() => { loadSignals(); }, [loadSignals]);
  useEffect(() => { setMatches(buildMatches(signals, filters)); }, [signals, filters]);

  const displayMatches = matches
    .filter(m => !tierFilter || (m.enrichment?.watch_level === tierFilter))
    .filter(m =>
      !filters.search.trim() ||
      m.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      m.category.toLowerCase().includes(filters.search.toLowerCase())
    )
    .filter(m => !filters.minScore || (m.enrichment?.bullish_score || 0) >= filters.minScore)
    .filter(m => !filters.theme || m.enrichment?.cultural_theme === filters.theme);

  const toggleTier = (tier) => setTierFilter(prev => prev === tier ? null : tier);

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
          Matches
        </h1>
        <div className="flex items-center gap-3">
          {enrichMsg && (
            <span className="text-xs text-neutral-400">{enrichMsg}</span>
          )}
          <button
            onClick={runEnrichment}
            disabled={enriching || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold tracking-wider uppercase text-white rounded transition-all disabled:opacity-40"
            style={{ backgroundColor: enriching ? '#999' : '#052EF0' }}
            title="Score signals against Bullish investment thesis using Claude AI"
          >
            <Sparkles className={`w-3.5 h-3.5 ${enriching ? 'animate-pulse' : ''}`} />
            {enriching ? 'Scoring...' : 'Score'}
          </button>
          <button
            onClick={loadSignals}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-black disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Bullish Hot"
          sublabel="Score ≥ 70 · Strong consumer signal, cultural tension, repeat potential"
          value={matches.filter(m => m.enrichment?.watch_level === 'hot').length}
          total={matches.filter(m => m.enrichment?.enriched).length}
          topColor="#052EF0"
          valueColor="#052EF0"
          onClick={() => toggleTier('hot')}
          active={tierFilter === 'hot'}
        />
        <StatCard
          label="Bullish Warm"
          sublabel="Score 50–69 · Interesting thesis, needs more signal or founder context"
          value={matches.filter(m => m.enrichment?.watch_level === 'warm').length}
          total={matches.filter(m => m.enrichment?.enriched).length}
          topColor="#000"
          valueColor="#000"
          onClick={() => toggleTier('warm')}
          active={tierFilter === 'warm'}
        />
        <StatCard
          label="Cold"
          sublabel="Score < 50 · Pass at this stage — generic name, no consumer signal, B2B-likely"
          value={matches.filter(m => m.enrichment?.watch_level === 'cold').length}
          total={matches.filter(m => m.enrichment?.enriched).length}
          topColor="#E5E5E0"
          valueColor="#999"
          onClick={() => toggleTier('cold')}
          active={tierFilter === 'cold'}
        />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg p-5">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
            <input
              type="text"
              placeholder="Search companies..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-9 pr-3 py-2 border border-neutral-200 rounded text-sm focus:outline-none focus:border-[#052EF0] transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400 whitespace-nowrap text-xs uppercase tracking-wide font-medium">Min Signals</span>
            <select
              value={filters.minSignals}
              onChange={e => setFilters(f => ({ ...f, minSignals: parseInt(e.target.value) }))}
              className="border border-neutral-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
            >
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+ (Strong)</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400 whitespace-nowrap text-xs uppercase tracking-wide font-medium">Time Range</span>
            <select
              value={filters.dateRange}
              onChange={e => setFilters(f => ({ ...f, dateRange: parseInt(e.target.value) }))}
              className="border border-neutral-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 180 days</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400 whitespace-nowrap text-xs uppercase tracking-wide font-medium">Min Score</span>
            <select
              value={filters.minScore}
              onChange={e => setFilters(f => ({ ...f, minScore: parseInt(e.target.value) }))}
              className="border border-neutral-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
            >
              <option value="0">Any</option>
              <option value="50">50+</option>
              <option value="60">60+</option>
              <option value="70">70+ (HOT)</option>
              <option value="80">80+</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400 whitespace-nowrap text-xs uppercase tracking-wide font-medium">Theme</span>
            <select
              value={filters.theme}
              onChange={e => setFilters(f => ({ ...f, theme: e.target.value }))}
              className="border border-neutral-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
              style={{ maxWidth: '200px' }}
            >
              <option value="">All Themes</option>
              {BULLISH_THEMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          <button
            onClick={() => setFilters(f => ({ ...f, categories: CONSUMER_CATEGORIES }))}
            className="text-xs px-3 py-1 font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
          >
            All
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, categories: [] }))}
            className="text-xs px-3 py-1 text-neutral-400 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
          >
            None
          </button>
          {CONSUMER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({
                ...f,
                categories: f.categories.includes(cat)
                  ? f.categories.filter(c => c !== cat)
                  : [...f.categories, cat],
              }))}
              className="text-xs px-3 py-1 rounded-full transition-colors font-medium"
              style={
                filters.categories.includes(cat)
                  ? { backgroundColor: '#052EF0', color: '#fff' }
                  : { backgroundColor: '#EEEEEE', color: '#666' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Match List ── */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#052EF0' }} />
          <p className="text-neutral-400 text-sm">Loading signals...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-700 flex items-center gap-3 text-sm">
          <span>{error}</span>
          <button onClick={loadSignals} className="underline ml-auto">Retry</button>
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="bg-white rounded-lg p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 opacity-10">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="1.5" width="33" height="33" stroke="#000" strokeWidth="3" />
              <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="#000" />
              <polygon points="8.5,22 27,22 26,25 8.5,25" fill="#000" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl uppercase tracking-wide text-black mb-2">
            {signals.length === 0 ? 'No Signals Yet' : 'No Matches Found'}
          </h3>
          <p className="text-neutral-400 text-sm mb-4">
            {signals.length === 0
              ? 'Run a scan or manually add a signal to get started'
              : 'Try adjusting your filters or time range'}
          </p>
          <p className="text-xs text-neutral-300">
            {signals.length} signal{signals.length !== 1 ? 's' : ''} in your database
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
            <span className="text-black">{displayMatches.length}</span> match{displayMatches.length !== 1 ? 'es' : ''} ·{' '}
            <span className="text-black">{signals.length}</span> signals
          </p>
          {displayMatches.map(match => (
            <MatchCard key={`${match.name}-${match.category}`} match={match} onUpdate={loadSignals} />
          ))}
        </div>
      )}
    </div>
  );
}
