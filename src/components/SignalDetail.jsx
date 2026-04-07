import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Flame, TrendingUp, Minus, User, Linkedin, ExternalLink,
  Sparkles, Bookmark, BookmarkCheck, MessageCircle, StickyNote, Save,
  Award, Building2, Globe, Camera, ShoppingBag, Pencil, Rocket, Copy, CheckCheck,
} from 'lucide-react';
import { enrich, items as itemsApi } from '../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripYearPrefix(theme) {
  if (!theme) return theme;
  return theme.replace(/^\d{4}\s*(Theme:?\s*)?/i, '').trim();
}

const WATCH_CONFIG = {
  hot:  { label: 'HOT',  bg: '#052EF0', text: '#fff', Icon: Flame      },
  warm: { label: 'WARM', bg: '#000',    text: '#fff', Icon: TrendingUp },
  cold: { label: 'COLD', bg: '#E8E8E8', text: '#999', Icon: Minus      },
};

const SIGNAL_CONFIG = {
  trademark: { icon: Award,       label: 'Trademark Filing', badge: 'TM'     },
  delaware:  { icon: Building2,   label: 'Delaware Corp',    badge: 'DE'     },
  domain:       { icon: Globe,       label: 'Domain Registration', badge: 'URL'  },
  instagram:    { icon: Camera,      label: 'Instagram',           badge: 'IG'   },
  shopify:      { icon: ShoppingBag, label: 'Shopify Store',       badge: 'SHOP' },
  social:       { icon: Pencil,      label: 'Social Signal',       badge: 'SOC'  },
  producthunt:  { icon: Rocket,      label: 'Product Hunt',        badge: 'PH'   },
  app_store:    { icon: Rocket,      label: 'App Store',           badge: 'APP'  },
  manual:       { icon: Pencil,      label: 'Manual Signal',       badge: 'MAN'  },
};

function buildBrief(match) {
  const e   = match.enrichment || {};
  const lvl = e.watch_level?.toUpperCase() || 'UNSCORED';
  const founder = e.founder?.name && e.founder.confidence !== 'unknown' ? e.founder.name : null;
  const founderBio = e.founder?.background || null;
  const linkedinSearch = founder
    ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(founder + ' ' + match.name)}`
    : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(match.name + ' founder')}`;

  const lines = [
    `STEALTH SIGNAL — ${match.name}`,
    `Category: ${match.category}`,
    e.bullish_score ? `Bullish Score: ${e.bullish_score}/100 (${lvl})` : `Status: ${lvl}`,
    e.cultural_theme ? `Theme: ${stripYearPrefix(e.cultural_theme)}` : null,
    e.one_line_thesis ? `\nThesis: ${e.one_line_thesis}` : null,
    founder ? `\nFounder: ${founder}` : '\nFounder: Unknown (confirmed stealth)',
    founderBio ? `Background: ${founderBio}` : null,
    `LinkedIn: ${linkedinSearch}`,
    e.comparable_portfolio ? `Comp: ${e.comparable_portfolio}` : null,
    `\nSignals: ${match.signals?.map(s => s.signal_type.toUpperCase()).join(', ') || '—'}`,
    match.team_notes ? `\nTeam Notes: ${match.team_notes}` : null,
    `\n— Stealth Finder · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
  ];
  return lines.filter(Boolean).join('\n');
}

// ─── Founder score card ───────────────────────────────────────────────────────

const FOUNDER_TIER_CONFIG = {
  HIGH_PRIORITY: { label: 'High Priority', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  WATCH_LIST:    { label: 'Watch List',    color: '#052EF0', bg: '#EEF2FF', border: '#C7D2FE' },
  WEAK_SIGNAL:   { label: 'Weak Signal',   color: '#87B4F8', bg: '#EEF2FF', border: '#C7D2FE' },
  PASS:          { label: 'Pass',          color: '#DC2626', bg: '#fef2f2', border: '#fecaca' },
};

const FOUNDER_SIGNAL_LABELS = {
  chip_on_shoulder:   { label: 'Chip-on-Shoulder',   max: 30 },
  category_proximity: { label: 'Category Proximity', max: 25 },
  magnetic_signal:    { label: 'Magnetic Signal',    max: 20 },
  pedigree:           { label: 'Pedigree',           max: 15 },
  thesis_clarity:     { label: 'Thesis Clarity',     max: 10 },
};

function FounderScoreCard({ founderScore }) {
  if (!founderScore) return null;

  if (!founderScore.gate_passed) {
    return (
      <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
        <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-2">Founder Score</h3>
        <p className="text-xs text-neutral-400 italic">Category does not pass the Bullish consumer gate — founder scoring skipped.</p>
      </div>
    );
  }

  const tierCfg = FOUNDER_TIER_CONFIG[founderScore.tier] || null;

  return (
    <div className="bg-white rounded-lg p-5 space-y-4" style={{ border: '1px solid #E5E5E0' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">Founder Score</h3>
        {tierCfg && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.border}` }}
          >
            {founderScore.total}/100 · {tierCfg.label}
          </span>
        )}
      </div>

      {/* 5 signal bars */}
      <div className="space-y-3">
        {Object.entries(FOUNDER_SIGNAL_LABELS).map(([key, { label, max }]) => {
          const sig = founderScore.breakdown?.[key];
          if (!sig) return null;
          const pct = Math.round((sig.score / max) * 100);
          const barColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#D97706' : '#E5E5E0';
          const CONF_COLOR = { high: '#16a34a', medium: '#D97706', low: '#9CA3AF' };
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-neutral-700">{label}</span>
                <span className="text-xs text-neutral-400">
                  {sig.score}/{max}
                  <span className="ml-1.5 text-[10px] font-medium" style={{ color: CONF_COLOR[sig.confidence] || '#9CA3AF' }}>
                    {sig.confidence}
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              {sig.flags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {sig.flags.map((f, i) => (
                    <span key={i} className="text-[10px] text-neutral-400 italic">{f}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action */}
      {founderScore.action && tierCfg && (
        <p className="text-xs font-medium" style={{ color: tierCfg.color }}>
          → {founderScore.action}
        </p>
      )}

      {/* Human review flags */}
      {founderScore.human_review_flags?.length > 0 && (
        <div className="pt-1 border-t border-neutral-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 mb-1.5">Needs Human Review</p>
          <ul className="space-y-1">
            {founderScore.human_review_flags.map((f, i) => (
              <li key={i} className="text-xs text-neutral-500 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5 text-amber-400">⚑</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, watchLevel }) {
  const cfg = WATCH_CONFIG[watchLevel];
  if (!cfg) return null;

  const radius  = 36;
  const stroke  = 5;
  const norm    = radius - stroke / 2;
  const circ    = 2 * Math.PI * norm;
  const pct     = (score || 0) / 100;
  const dash    = circ * pct;
  const gap     = circ - dash;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={norm} fill="none" stroke="#E5E5E0" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={norm} fill="none"
          stroke={cfg.bg} strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-2xl leading-none" style={{ color: cfg.bg }}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: cfg.bg }}>{cfg.label}</span>
      </div>
    </div>
  );
}

const FOUNDER_TIER_COLORS = {
  HIGH_PRIORITY: '#16a34a',
  WATCH_LIST:    '#052EF0',
  WEAK_SIGNAL:   '#87B4F8',
  PASS:          '#DC2626',
};

function DualScoreBadge({ enrichment, watchLevel }) {
  const founderScore = enrichment?.founder_score;
  const founderTotal = founderScore?.gate_passed && founderScore?.total != null ? founderScore.total : null;
  const founderColor = founderTotal != null ? (FOUNDER_TIER_COLORS[founderScore?.tier] || '#9CA3AF') : '#D1D5DB';

  return (
    <div className="flex items-center gap-4 shrink-0">
      {/* Brand score ring */}
      <div className="flex flex-col items-center gap-1">
        <ScoreRing score={enrichment?.bullish_score} watchLevel={watchLevel} />
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Brand</span>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-neutral-200 my-1" />

      {/* Founder score */}
      <div className="flex flex-col items-center justify-center gap-1" style={{ width: 72, height: 108 }}>
        <span className="font-display font-bold text-2xl leading-none" style={{ color: founderColor }}>
          {founderTotal ?? '—'}
        </span>
        {founderTotal != null && (
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: founderColor }}>
            {FOUNDER_TIER_CONFIG[founderScore?.tier]?.label || ''}
          </span>
        )}
        {founderTotal == null && (
          <span className="text-[9px] text-neutral-400 text-center leading-tight">Unknown</span>
        )}
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Founder</span>
      </div>
    </div>
  );
}

// ─── Team notes ──────────────────────────────────────────────────────────────

function TeamNotes({ match, onSaved }) {
  const [text,   setText]   = useState(match.team_notes || '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const isDirty = text !== (match.team_notes || '');

  const handleSave = async () => {
    if (!match.primarySignalId) return;
    setSaving(true);
    try {
      const primary = match.signals.find(s => s.id === match.primarySignalId) || match.signals[0];
      if (!primary) return;
      const meta = {
        _type: 'signal',
        company_name: primary.companyName,
        signal_type:  primary.signal_type,
        category:     primary.category,
        description:  primary.description,
        url:          primary.url,
        notes:        primary.notes,
        timestamp:    primary.timestamp,
        enrichment:   primary.enrichment,
        team_notes:   text,
      };
      if (primary.fp) meta.fp = primary.fp;
      await itemsApi.update(primary.id, { description: JSON.stringify(meta) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved({ ...match, team_notes: text });
    } catch (e) {
      console.error('Save note failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
          <StickyNote className="w-3.5 h-3.5" /> Team Notes
        </h3>
        {saved && <span className="text-xs text-green-500 font-medium">Saved ✓</span>}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Meeting notes, contact info, thesis thoughts, follow-up actions..."
        className="w-full text-sm text-neutral-700 bg-transparent resize-none focus:outline-none placeholder-neutral-300 leading-relaxed min-h-[80px]"
        rows={Math.max(3, (text.split('\n').length || 1) + 1)}
      />
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
          style={{ backgroundColor: saving ? '#EEE' : '#052EF0', color: saving ? '#999' : '#fff' }}
        >
          <Save className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SignalDetail() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signalId } = useParams();
  const match     = location.state?.match;

  const [currentMatch, setCurrentMatch] = useState(match);
  const [reenriching,  setReenriching]  = useState(false);
  const [watchlisted,  setWatchlisted]  = useState(false);
  const [watchlisting, setWatchlisting] = useState(false);
  const [briefCopied,  setBriefCopied]  = useState(false);
  const [fetching,     setFetching]     = useState(false);
  const [fetchError,   setFetchError]   = useState('');

  // When navigated directly by URL (no router state), fetch from API
  useEffect(() => {
    if (!match && signalId) {
      setFetching(true);
      setFetchError('');
      itemsApi.getAll({ per_page: 1000 })
        .then(response => {
          const allItems = response.data.items || [];
          const item = allItems.find(i => i.id === parseInt(signalId));
          if (!item) {
            setFetchError('Signal not found.');
            return;
          }
          let meta = {};
          try { meta = JSON.parse(item.description || '{}'); } catch (e) {}
          const constructedMatch = {
            name:            meta.company_name || item.title,
            category:        meta.category,
            signals: [{
              id:          item.id,
              companyName: meta.company_name,
              signal_type: meta.signal_type,
              category:    meta.category,
              description: meta.description,
              url:         meta.url,
              notes:       meta.notes,
              timestamp:   meta.timestamp,
              enrichment:  meta.enrichment,
              team_notes:  meta.team_notes,
            }],
            enrichment:      meta.enrichment || null,
            primarySignalId: item.id,
            team_notes:      meta.team_notes || '',
            hasTrademark:    meta.signal_type === 'trademark',
            hasDelaware:     meta.signal_type === 'delaware',
            hasDomain:       meta.signal_type === 'domain',
            hasInstagram:    meta.signal_type === 'instagram',
            hasShopify:      meta.signal_type === 'shopify',
            hasSocial:       meta.signal_type === 'social',
            score:           0,
          };
          setCurrentMatch(constructedMatch);
        })
        .catch(() => {
          setFetchError('Failed to load signal. Please check your connection.');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [match, signalId]);

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(buildBrief(currentMatch));
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2500);
    } catch {}
  };

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#052EF0' }} />
        <p className="text-neutral-400 text-sm">Loading signal...</p>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-neutral-400 text-sm mb-4">{fetchError || 'Signal not found.'}</p>
        <Link to="/" className="text-xs text-[#052EF0] hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const { enrichment, name, category, signals, primarySignalId } = currentMatch;
  const isEnriched  = enrichment?.enriched;
  const watchLevel  = enrichment?.watch_level || (isEnriched ? 'cold' : null);
  const cfg         = WATCH_CONFIG[watchLevel] || null;

  const sortedSignals = [...(signals || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleReenrich = async () => {
    if (!primarySignalId) return;
    setReenriching(true);
    try {
      await enrich.signal(primarySignalId);
      // After re-enriching, navigate back to dashboard to reload data
      navigate('/', { replace: false });
    } catch (e) {
      console.error('Re-enrich failed:', e);
    } finally {
      setReenriching(false);
    }
  };

  const handleAddToWatchlist = async () => {
    setWatchlisting(true);
    try {
      const founder     = enrichment?.founder;
      const founderName = (founder?.name && founder.confidence !== 'unknown') ? founder.name : '';
      const meta = {
        _type:    'watchlist',
        name:     founderName || name,
        company:  name,
        linkedin: '',
        twitter:  '',
        notes:    enrichment?.one_line_thesis
          ? `From Stealth Finder — ${enrichment.one_line_thesis}`
          : `From Stealth Finder — ${category}`,
        added_at: new Date().toISOString(),
      };
      await itemsApi.create(founderName || name, JSON.stringify(meta));
      setWatchlisted(true);
    } catch (e) {
      console.error('Add to watchlist failed:', e);
    } finally {
      setWatchlisting(false);
    }
  };

  const handleAskFinder = () => {
    const thesis = enrichment?.one_line_thesis ? ` The current thesis is: "${enrichment.one_line_thesis}".` : '';
    navigate('/ask', {
      state: {
        prefill: `Tell me more about ${name} — what makes it a compelling consumer brand signal?${thesis}`,
      },
    });
  };

  const e = enrichment || {};
  const founder = e.founder;
  const isUnknownFounder = !founder || founder.confidence === 'unknown' || !founder.name;

  const linkedinSearch = founder?.name
    ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(founder.name + ' ' + name)}`
    : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name + ' founder')}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-7 space-y-6">

      {/* ── Back + actions bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors"
            style={{ borderColor: '#E5E5E0', color: briefCopied ? '#16a34a' : '#666' }}
            title="Copy lead brief — paste into Streak as new Lead"
          >
            {briefCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {briefCopied ? 'Copied!' : 'Copy Brief'}
          </button>
          <button
            onClick={handleAskFinder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors"
            style={{ borderColor: '#E5E5E0', color: '#052EF0' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Ask Finder
          </button>
          <button
            onClick={handleAddToWatchlist}
            disabled={watchlisting || watchlisted}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors"
            style={{ borderColor: '#E5E5E0', color: watchlisted ? '#052EF0' : '#666' }}
          >
            {watchlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {watchlisted ? 'Watchlisted' : watchlisting ? 'Adding...' : 'Watchlist'}
          </button>
          <button
            onClick={handleReenrich}
            disabled={reenriching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold tracking-wider uppercase rounded transition-all"
            style={{ backgroundColor: reenriching ? '#999' : '#052EF0', color: '#fff' }}
          >
            <Sparkles className={`w-3.5 h-3.5 ${reenriching ? 'animate-pulse' : ''}`} />
            {reenriching ? 'Scoring...' : 'Re-Score'}
          </button>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="bg-white rounded-lg p-6" style={{ border: `2px solid ${cfg?.bg || '#E5E5E0'}` }}>
        <div className="flex items-start gap-6">
          {isEnriched && cfg && (
            <DualScoreBadge enrichment={e} watchLevel={watchLevel} />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black leading-none mb-1">
              {name}
            </h1>
            <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider mb-3">{category}</p>

            {/* Signal type badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(SIGNAL_CONFIG).map(([type, config]) => {
                const key = `has${type.charAt(0).toUpperCase()}${type.slice(1)}`;
                if (!currentMatch[key]) return null;
                return (
                  <span key={type} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg?.bg || '#000', color: cfg?.text || '#fff' }}>
                    {config.badge}
                  </span>
                );
              })}
              <span className="text-xs text-neutral-300 ml-1">
                {signals.length} signal{signals.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isEnriched && e.one_line_thesis && (
              <p className="text-base font-editorial italic text-neutral-700 leading-snug border-l-3 pl-3"
                style={{ borderLeft: `3px solid ${cfg?.bg || '#052EF0'}` }}>
                {e.one_line_thesis}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Analysis grid ── */}
      {isEnriched && (
        <div className="grid grid-cols-2 gap-4">

          {/* Overview — signal strength, thesis, consumer brand, repeat, theme, whitespace */}
          <div className="col-span-2 bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-4">Overview</h3>

            {/* Signal strength + thesis */}
            {(e.bullish_score != null || e.one_line_thesis) && (
              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                {e.bullish_score != null && cfg && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">Signal Strength</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      {e.bullish_score} · {cfg.label}
                    </span>
                  </div>
                )}
                {e.one_line_thesis && (
                  <p className="text-sm font-editorial italic text-neutral-700 leading-snug"
                    style={{ borderLeft: `3px solid ${cfg?.bg || '#052EF0'}`, paddingLeft: '12px' }}>
                    {e.one_line_thesis}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">Consumer Brand</span>
                <p className="text-sm font-bold text-black mt-0.5">
                  {e.consumer_brand ? '✓ Yes' : '✗ Not clear'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">Repeat Potential</span>
                <p className="text-sm font-bold text-black mt-0.5 capitalize">{e.repeat_potential || '—'}</p>
                {e.repeat_reason && (
                  <p className="text-xs text-neutral-500 mt-1 leading-snug">{e.repeat_reason}</p>
                )}
              </div>
              {e.cultural_theme && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">Cultural Theme</span>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#052EF0' }}>{stripYearPrefix(e.cultural_theme)}</p>
                </div>
              )}
              {e.advocacy_deficiency && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">Category Whitespace</span>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-snug">{e.advocacy_deficiency}</p>
                </div>
              )}
            </div>
          </div>

          {/* Remarkability drivers */}
          {e.remarkability_drivers?.length > 0 && (
            <div className="col-span-2 bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-3">Remarkability Drivers</h3>
              <div className="flex flex-wrap gap-2">
                {e.remarkability_drivers.map(d => (
                  <span key={d} className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: '#000', color: '#fff' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio comp */}
          {e.comparable_portfolio && (
            <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-2">Portfolio Comp</h3>
              <p className="text-sm font-editorial italic text-neutral-700">{e.comparable_portfolio}</p>
            </div>
          )}

          {/* Red flags */}
          {e.red_flags?.length > 0 && (
            <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #FFD5D5' }}>
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-red-400 mb-2">Flags</h3>
              <ul className="space-y-1.5">
                {e.red_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">·</span>{flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Founder ── */}
      {isEnriched && (
        <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
              <User className="w-3.5 h-3.5" /> Founder
            </h3>
            <a href={linkedinSearch} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-[#0077B5] transition-colors">
              <Linkedin className="w-3.5 h-3.5" />
              Search LinkedIn
            </a>
          </div>
          {isUnknownFounder ? (
            <div>
              <p className="text-sm font-medium text-neutral-500 italic">Founder not yet public — confirmed stealth signal.</p>
              <p className="text-xs text-neutral-400 mt-1">Research manually via LinkedIn or AngelList before reaching out.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-lg text-black">{founder.name}</p>
                {founder.confidence === 'inferred' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium uppercase">
                    Verify
                  </span>
                )}
              </div>
              {founder.background && (
                <p className="text-sm text-neutral-600 leading-relaxed">{founder.background}</p>
              )}
              {founder.prior_companies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {founder.prior_companies.map((co, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                      {co}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Founder Score ── */}
      {isEnriched && e.founder_score && (
        <FounderScoreCard founderScore={e.founder_score} />
      )}

      {/* ── Team Notes ── */}
      <TeamNotes match={currentMatch} onSaved={setCurrentMatch} />

      {/* ── Signal Timeline ── */}
      <div>
        <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-3">
          Signal Timeline
        </h3>
        <div className="space-y-2">
          {sortedSignals.map((signal, idx) => {
            const config = SIGNAL_CONFIG[signal.signal_type] || SIGNAL_CONFIG.manual;
            const Icon   = config.icon;
            return (
              <div key={signal.id || idx} className="bg-white rounded-lg p-4" style={{ border: '1px solid #E5E5E0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 text-black">
                    <Icon className="w-3.5 h-3.5" style={{ color: '#052EF0' }} />
                    {config.label}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {new Date(signal.timestamp).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                {signal.description && (
                  <p className="text-sm text-neutral-600 leading-relaxed">{signal.description}</p>
                )}
                {signal.notes && (
                  <p className="text-xs text-neutral-400 mt-1 font-editorial italic">{signal.notes}</p>
                )}
                {signal.url && signal.url !== '#' && (
                  <a href={signal.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs mt-2 inline-flex items-center gap-1 font-medium transition-colors"
                    style={{ color: '#052EF0' }}>
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
