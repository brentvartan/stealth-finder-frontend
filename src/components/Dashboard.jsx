import React, { useState, useEffect, useCallback } from 'react';
import { items } from '../api/client';
import MatchCard from './MatchCard';
import {
  Search, RefreshCw, Award, ShoppingBag, CheckCircle, TrendingUp
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CONSUMER_CATEGORIES = [
  'Consumer AI', 'Home/Lifestyle', 'CPG/Food/Drink', 'Apparel', 'Beauty',
  'Health/Wellness', 'Fitness', 'Education', 'Finance', 'Entertainment', 'Sports',
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
    const signalDate = new Date(signal.timestamp);
    return signalDate >= cutoffDate && filters.categories.includes(signal.category);
  });

  const groups = {};
  filtered.forEach(signal => {
    const key = normalizeCompanyName(signal.companyName);
    if (!key) return;

    if (!groups[key]) {
      groups[key] = { name: signal.companyName, signals: [], category: signal.category };
    }
    groups[key].signals.push(signal);
  });

  return Object.values(groups)
    .map(group => {
      const hasTrademark = group.signals.some(s => s.signal_type === 'trademark');
      const hasDelaware  = group.signals.some(s => s.signal_type === 'delaware');
      const hasDomain    = group.signals.some(s => s.signal_type === 'domain');
      const hasInstagram = group.signals.some(s => s.signal_type === 'instagram');
      const hasShopify   = group.signals.some(s => s.signal_type === 'shopify');
      const hasSocial    = group.signals.some(s => s.signal_type === 'social');

      let score = group.signals.reduce(
        (sum, s) => sum + (SCORE_BOOSTS[s.signal_type] || 5), 0
      );
      if (hasTrademark && (hasDelaware || hasDomain)) score += 20;
      if (hasDelaware && hasDomain && hasSocial)       score += 10;
      if (hasShopify && hasInstagram)                  score += 15;

      return {
        ...group,
        score,
        hasTrademark, hasDelaware, hasDomain,
        hasInstagram, hasShopify, hasSocial,
        latestSignal: new Date(Math.max(...group.signals.map(s => new Date(s.timestamp)))),
      };
    })
    .filter(m => m.signals.length >= filters.minSignals)
    .sort((a, b) => b.score - a.score);
}

// ─── Parse items from backend ─────────────────────────────────────────────────

function parseSignalsFromItems(allItems) {
  return allItems.flatMap(item => {
    try {
      const meta = JSON.parse(item.description || '{}');
      if (meta._type === 'signal') {
        return [{
          id: item.id,
          companyName: meta.company_name || item.title,
          signal_type: meta.signal_type || 'manual',
          category: meta.category || 'Consumer AI',
          description: meta.description || '',
          url: meta.url || '',
          notes: meta.notes || '',
          timestamp: meta.timestamp || item.created_at,
        }];
      }
    } catch (e) { /* not a signal item */ }
    return [];
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    green:  'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    blue:   'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minSignals: 1,
    dateRange: 90,
    categories: CONSUMER_CATEGORIES,
    search: '',
  });

  // Load signals from backend
  const loadSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await items.getAll({ per_page: 200 });
      const allItems = response.data.items || [];
      setSignals(parseSignalsFromItems(allItems));
    } catch (err) {
      setError('Failed to load signals. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  // Recompute matches whenever signals or filters change
  useEffect(() => {
    setMatches(buildMatches(signals, filters));
  }, [signals, filters]);

  // Apply search filter on top of matches
  const displayMatches = filters.search.trim()
    ? matches.filter(m =>
        m.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        m.category.toLowerCase().includes(filters.search.toLowerCase())
      )
    : matches;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Award}        label="With Trademark" value={matches.filter(m => m.hasTrademark).length}                          color="purple" />
        <StatCard icon={ShoppingBag}  label="DTC Ready"      value={matches.filter(m => m.hasShopify && m.hasInstagram).length}         color="green"  />
        <StatCard icon={CheckCircle}  label="Perfect Match"  value={matches.filter(m => m.hasTrademark && m.hasDelaware && m.hasDomain).length} color="blue"   />
        <StatCard icon={TrendingUp}   label="High Score 50+" value={matches.filter(m => m.score >= 50).length}                          color="yellow" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <button
            onClick={loadSignals}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Min signals */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 whitespace-nowrap">Min Signals:</span>
            <select
              value={filters.minSignals}
              onChange={e => setFilters(f => ({ ...f, minSignals: parseInt(e.target.value) }))}
              className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
            >
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+ (Strong)</option>
            </select>
          </label>

          {/* Date range */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 whitespace-nowrap">Time Range:</span>
            <select
              value={filters.dateRange}
              onChange={e => setFilters(f => ({ ...f, dateRange: parseInt(e.target.value) }))}
              className="border border-slate-300 rounded-lg px-2 py-2 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
        </div>

        {/* Category toggles */}
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          <button
            onClick={() => setFilters(f => ({ ...f, categories: CONSUMER_CATEGORIES }))}
            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium"
          >
            All
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, categories: [] }))}
            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"
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
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                filters.categories.includes(cat)
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Match List ── */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading signals...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 flex items-center gap-3">
          <span>{error}</span>
          <button onClick={loadSignals} className="underline text-sm ml-auto">Retry</button>
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <TrendingUp className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {signals.length === 0 ? 'No Signals Yet' : 'No Matches Found'}
          </h3>
          <p className="text-slate-500 mb-5">
            {signals.length === 0
              ? 'Run a scan or manually add a signal to get started'
              : 'Try adjusting your filters or time range'}
          </p>
          <p className="text-sm text-slate-400">
            {signals.length} signal{signals.length !== 1 ? 's' : ''} in your database
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{displayMatches.length}</span> match{displayMatches.length !== 1 ? 'es' : ''} from{' '}
            <span className="font-semibold text-slate-700">{signals.length}</span> signals
          </p>
          {displayMatches.map(match => (
            <MatchCard key={`${match.name}-${match.category}`} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
