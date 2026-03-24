import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Building2, Globe, Camera, ShoppingBag, Linkedin, Rocket,
  ChevronDown, ChevronUp, ExternalLink, Pencil, Flame, TrendingUp, Minus, User,
  Sparkles, Bookmark, BookmarkCheck, StickyNote, Save, Copy, CheckCheck,
} from 'lucide-react';
import { enrich, items as itemsApi } from '../api/client';

export const SIGNAL_CONFIG = {
  trademark:    { icon: Award,       label: 'Trademark',    badge: 'TM'   },
  delaware:     { icon: Building2,   label: 'Delaware',     badge: 'DE'   },
  domain:       { icon: Globe,       label: 'Domain',       badge: 'URL'  },
  instagram:    { icon: Camera,      label: 'Instagram',    badge: 'IG'   },
  shopify:      { icon: ShoppingBag, label: 'Shopify',      badge: 'SHOP' },
  social:       { icon: Linkedin,    label: 'Social',       badge: 'SOC'  },
  producthunt:  { icon: Rocket,      label: 'Product Hunt', badge: 'PH'   },
  manual:       { icon: Pencil,      label: 'Manual',       badge: 'MAN'  },
};

const SIGNAL_TYPE_ORDER = ['trademark', 'delaware', 'domain', 'instagram', 'shopify', 'social'];

// ─── Watch-level helpers ─────────────────────────────────────────────────────

const WATCH_CONFIG = {
  hot:  { label: 'HOT',  bg: '#052EF0', text: '#fff', pillBg: '#052EF0', pillText: '#fff', Icon: Flame      },
  warm: { label: 'WARM', bg: '#000',    text: '#fff', pillBg: '#000',    pillText: '#fff', Icon: TrendingUp },
  cold: { label: 'COLD', bg: '#E8E8E8', text: '#aaa', pillBg: '#EEEEEE', pillText: '#999', Icon: Minus      },
};

// ─── Founder panel ───────────────────────────────────────────────────────────

const FOUNDER_TIER_BADGE = {
  HIGH_PRIORITY: { label: 'High Priority', color: '#16a34a', bg: '#f0fdf4' },
  WATCH_LIST:    { label: 'Watch List',    color: '#052EF0', bg: '#EEF2FF' },
  WEAK_SIGNAL:   { label: 'Weak Signal',   color: '#87B4F8', bg: '#EEF2FF' },
  PASS:          { label: 'Pass',          color: '#DC2626', bg: '#fef2f2' },
};

function FounderPanel({ founder, brandName, founderScore }) {
  const isUnknown = !founder || founder.confidence === 'unknown' || !founder.name;
  const tierCfg = founderScore?.gate_passed && founderScore?.tier ? FOUNDER_TIER_BADGE[founderScore.tier] : null;

  const linkedinSearch = founder?.name
    ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(founder.name + ' ' + brandName)}`
    : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(brandName + ' founder')}`;

  const MINI_SIGNAL_MAXES = { chip_on_shoulder: 30, category_proximity: 25, magnetic_signal: 20, pedigree: 15, thesis_clarity: 10 };

  return (
    <div className="rounded-lg p-4 space-y-2.5" style={{ backgroundColor: '#fff', border: '1px solid #E5E5E0' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
          <User className="w-3 h-3" /> Founder
        </span>
        <a
          href={linkedinSearch}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 hover:text-[#0077B5] transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <Linkedin className="w-3 h-3" />
          Search LinkedIn
        </a>
      </div>

      {/* Founder score block */}
      {tierCfg && founderScore?.breakdown && (
        <div
          className="rounded-lg px-3 py-2.5 flex items-center justify-between gap-3"
          style={{ backgroundColor: tierCfg.bg, border: `1px solid ${tierCfg.color}22` }}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" style={{ color: tierCfg.color }} />
            <div>
              <span className="text-base font-display font-bold leading-none" style={{ color: tierCfg.color }}>
                {founderScore.total}
              </span>
              <span className="text-[10px] font-medium ml-1 opacity-70" style={{ color: tierCfg.color }}>/100</span>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: tierCfg.color }}>
                {tierCfg.label}
              </p>
            </div>
          </div>
          {/* Mini 5-bar chart */}
          <div className="flex items-end gap-0.5 h-8">
            {Object.entries(MINI_SIGNAL_MAXES).map(([key, max]) => {
              const sig = founderScore.breakdown[key];
              if (!sig) return null;
              const pct = Math.max(8, Math.round((sig.score / max) * 100));
              return (
                <div
                  key={key}
                  className="w-2 rounded-sm"
                  style={{ height: `${pct}%`, backgroundColor: tierCfg.color, opacity: 0.5 }}
                  title={`${key.replace(/_/g, ' ')}: ${sig.score}/${max}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {isUnknown ? (
        <div>
          <p className="text-xs font-medium text-neutral-500 italic">Founder not yet public — confirmed stealth signal.</p>
          <p className="text-[10px] text-neutral-400 mt-1">Research manually via LinkedIn or AngelList before reaching out.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-display font-bold text-black">{founder.name}</p>
            {founder.confidence === 'inferred' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium uppercase tracking-wide">
                Verify
              </span>
            )}
          </div>
          {founder.background && (
            <p className="text-xs text-neutral-600 leading-snug">{founder.background}</p>
          )}
          {founder.prior_companies?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {founder.prior_companies.map((co, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                  {co}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Team notes panel ────────────────────────────────────────────────────────

function TeamNotesPanel({ match, onSaved }) {
  const [text, setText] = useState(match.team_notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const isDirty = text !== (match.team_notes || '');

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!match.primarySignalId) return;
    setSaving(true);
    try {
      const primarySignal = match.signals.find(s => s.id === match.primarySignalId) || match.signals[0];
      if (!primarySignal) return;
      const updatedMeta = {
        _type:        'signal',
        company_name: primarySignal.companyName,
        signal_type:  primarySignal.signal_type,
        category:     primarySignal.category,
        description:  primarySignal.description,
        url:          primarySignal.url,
        notes:        primarySignal.notes,
        timestamp:    primarySignal.timestamp,
        enrichment:   primarySignal.enrichment,
        team_notes:   text,
      };
      if (primarySignal.fp) updatedMeta.fp = primarySignal.fp;
      await itemsApi.update(primarySignal.id, { description: JSON.stringify(updatedMeta) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: '#fff', border: '1px solid #E5E5E0' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
          <StickyNote className="w-3 h-3" /> Team Notes
        </span>
        {saved && (
          <span className="text-[10px] text-green-500 font-medium">Saved ✓</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder="Add a note for the team — meeting notes, contact info, thesis thoughts..."
        className="w-full text-xs text-neutral-600 bg-transparent resize-none focus:outline-none placeholder-neutral-300 leading-relaxed"
        rows={text ? Math.max(2, text.split('\n').length + 1) : 2}
      />
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded transition-colors"
          style={{ backgroundColor: saving ? '#EEE' : '#052EF0', color: saving ? '#999' : '#fff' }}
        >
          <Save className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      )}
    </div>
  );
}

// ─── Enrichment panel ────────────────────────────────────────────────────────

function EnrichmentPanel({ enrichment, brandName }) {
  if (!enrichment?.enriched) return null;

  const {
    bullish_score, watch_level, consumer_brand, repeat_potential, repeat_reason,
    cultural_theme, advocacy_deficiency, remarkability_drivers, one_line_thesis,
    red_flags, comparable_portfolio, founder, founder_score,
  } = enrichment;

  const watchCfg = WATCH_CONFIG[watch_level] || WATCH_CONFIG.cold;

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: '#F5F0EB', border: '1px solid #E5E5E0' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-neutral-400">
          Investment Thesis Analysis
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {/* Brand score */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
            style={{ backgroundColor: watchCfg.bg, color: watchCfg.text }}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-70 font-medium">Brand</span>
            <span className="text-base font-display leading-none">{bullish_score}</span>
          </div>
          {/* Founder score */}
          {(() => {
            const fs = founder_score;
            const hasScore = fs?.gate_passed && fs?.total != null;
            const tierColors = {
              HIGH_PRIORITY: { bg: '#f0fdf4', text: '#16a34a' },
              WATCH_LIST:    { bg: '#EEF2FF', text: '#052EF0' },
              WEAK_SIGNAL:   { bg: '#EEF2FF', text: '#87B4F8' },
              PASS:          { bg: '#fef2f2', text: '#DC2626' },
            };
            const tc = hasScore ? (tierColors[fs.tier] || { bg: '#F5F5F5', text: '#9CA3AF' }) : { bg: '#F5F5F5', text: '#9CA3AF' };
            return (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.text}22` }}
              >
                <span className="text-[9px] uppercase tracking-wider opacity-70 font-medium">Founder</span>
                <span className="text-base font-display leading-none">{hasScore ? fs.total : '—'}</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Thesis */}
      {one_line_thesis && (
        <p className="text-sm font-editorial italic text-neutral-700 leading-snug border-l-2 pl-3"
           style={{ borderColor: watchCfg.bg }}>
          {one_line_thesis}
        </p>
      )}

      {/* Key signals grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Consumer Brand</span>
          <p className="font-medium text-black mt-0.5">{consumer_brand ? 'Yes ✓' : 'Not clear'}</p>
        </div>
        <div>
          <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Repeat Potential</span>
          <p className="font-medium text-black mt-0.5 capitalize">{repeat_potential || '—'}</p>
          {repeat_reason && <p className="text-neutral-400 text-[10px] leading-tight mt-0.5">{repeat_reason}</p>}
        </div>
        {cultural_theme && (
          <div className="col-span-2">
            <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Cultural Theme</span>
            <p className="font-medium mt-0.5" style={{ color: '#052EF0' }}>{cultural_theme}</p>
          </div>
        )}
        {advocacy_deficiency && (
          <div className="col-span-2">
            <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Category Whitespace</span>
            <p className="text-neutral-600 mt-0.5 leading-snug">{advocacy_deficiency}</p>
          </div>
        )}
      </div>

      {/* Remarkability drivers */}
      {remarkability_drivers?.length > 0 && (
        <div>
          <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Remarkability Drivers</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {remarkability_drivers.map(d => (
              <span
                key={d}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#000', color: '#fff' }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio comp */}
      {comparable_portfolio && (
        <div>
          <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Portfolio Comp</span>
          <p className="text-neutral-600 text-xs mt-0.5 font-editorial italic">{comparable_portfolio}</p>
        </div>
      )}

      {/* Red flags */}
      {red_flags?.length > 0 && (
        <div>
          <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">Flags</span>
          <ul className="mt-1 space-y-0.5">
            {red_flags.map((flag, i) => (
              <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                <span className="mt-0.5 shrink-0">·</span>{flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Founder */}
      <FounderPanel founder={founder} brandName={brandName} founderScore={founder_score} />
    </div>
  );
}

// ─── Copy brief helper ────────────────────────────────────────────────────────

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
    e.cultural_theme ? `Theme: ${e.cultural_theme}` : null,
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

// ─── Main card ───────────────────────────────────────────────────────────────

export default function MatchCard({ match, onUpdate }) {
  const [expanded,      setExpanded]      = useState(false);
  const [reenriching,   setReenriching]   = useState(false);
  const [watchlisted,   setWatchlisted]   = useState(false);
  const [watchlisting,  setWatchlisting]  = useState(false);
  const [briefCopied,   setBriefCopied]   = useState(false);

  const handleCopyBrief = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(buildBrief(match));
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2000);
    } catch {}
  };

  const { enrichment } = match;
  const isEnriched  = enrichment?.enriched;
  const watchLevel  = enrichment?.watch_level || (isEnriched ? 'cold' : null);
  const bullishScore = enrichment?.bullish_score;
  const watchCfg    = WATCH_CONFIG[watchLevel] || null;

  const isCold       = watchLevel === 'cold';
  const isUnenriched = !isEnriched;
  const isHotOrWarm  = watchLevel === 'hot' || watchLevel === 'warm';

  const primarySignalId = match.primarySignalId || match.signals?.[0]?.id;

  const sortedSignals = [...(match.signals || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  // ── Re-enrich ──
  const handleReenrich = async (e) => {
    e.stopPropagation();
    if (!primarySignalId) return;
    setReenriching(true);
    try {
      await enrich.signal(primarySignalId);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Re-enrich failed:', err);
    } finally {
      setReenriching(false);
    }
  };

  // ── Add to watchlist ──
  const handleAddToWatchlist = async (e) => {
    e.stopPropagation();
    setWatchlisting(true);
    try {
      const founder = enrichment?.founder;
      const founderName = (founder?.name && founder.confidence !== 'unknown') ? founder.name : '';
      const meta = {
        _type:    'watchlist',
        name:     founderName || match.name,
        company:  match.name,
        linkedin: '',
        twitter:  '',
        notes:    enrichment?.one_line_thesis
          ? `From Stealth Finder — ${enrichment.one_line_thesis}`
          : `From Stealth Finder — ${match.category}`,
        added_at: new Date().toISOString(),
      };
      await itemsApi.create(founderName || match.name, JSON.stringify(meta));
      setWatchlisted(true);
    } catch (err) {
      console.error('Add to watchlist failed:', err);
    } finally {
      setWatchlisting(false);
    }
  };

  // ── COLD / unenriched slim row ──
  if (isCold || isUnenriched) {
    const slimLabel = isCold ? 'COLD' : 'PENDING';
    const slimScore = isCold ? bullishScore : match.score;
    return (
      <div
        className="bg-white rounded-lg overflow-hidden transition-shadow hover:shadow-sm cursor-pointer"
        style={{ border: '1px solid #F0F0F0' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="px-4 py-2.5 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: '#F2F2F2', color: '#bbb' }}
          >
            <span className="font-display font-bold text-sm leading-none">{slimScore}</span>
          </div>
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-neutral-400 leading-none truncate">
              {match.name}
            </h3>
            <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider shrink-0">
              {match.category}
            </span>
          </div>
          <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider shrink-0">{slimLabel}</span>
          <div className="text-neutral-200">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
        {expanded && (
          <div style={{ borderTop: '1px solid #F0F0F0', backgroundColor: '#FAFAF8' }} className="p-4 space-y-3">
            {isCold && enrichment?.one_line_thesis && (
              <p className="text-xs font-editorial italic text-neutral-400 leading-snug">
                {enrichment.one_line_thesis}
              </p>
            )}
            {isCold && <EnrichmentPanel enrichment={enrichment} brandName={match.name} />}
            {isCold && <TeamNotesPanel match={match} onSaved={onUpdate} />}
            {isUnenriched && (
              <p className="text-xs text-neutral-400 italic">
                Not yet scored — click <strong>Score</strong> on the dashboard to analyse this brand.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── HOT / WARM full card ──
  const borderColor = watchLevel === 'hot' ? '#052EF0' : watchLevel === 'warm' ? '#000' : '#E5E5E0';
  const pillBg      = watchCfg?.pillBg  || '#052EF0';
  const pillText    = watchCfg?.pillText || '#fff';

  return (
    <div
      className="bg-white rounded-lg overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: `2px solid ${borderColor}` }}
    >
      {/* ── Main row ── */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Watch-level badge */}
          <div
            className="w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0"
            style={{
              backgroundColor: watchCfg?.bg || '#F5F0EB',
              color: watchCfg?.text || '#333',
            }}
          >
            {watchCfg?.Icon && <watchCfg.Icon className="w-4 h-4 mb-0.5 opacity-80" />}
            <span className="font-display font-bold text-lg leading-none">
              {isEnriched ? bullishScore : match.score}
            </span>
            <span className="text-[8px] font-medium opacity-60 tracking-wide mt-0.5">
              {isEnriched ? watchCfg?.label : 'SIG'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <Link
                  to={`/signal/${primarySignalId}`}
                  state={{ match }}
                  onClick={e => e.stopPropagation()}
                  className="font-display font-bold text-xl uppercase tracking-wide text-black leading-none hover:text-[#052EF0] transition-colors"
                >
                  {match.name}
                </Link>
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  {match.category}
                </span>
              </div>
              {(() => {
                const fs = enrichment?.founder_score;
                if (!fs?.gate_passed || !fs?.total || fs.total < 50) return null;
                return (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] text-white shrink-0"
                    style={{ backgroundColor: '#052EF0' }}
                    title={`Founder: ${fs.tier?.replace(/_/g, ' ')} · ${fs.total}/100`}
                  >
                    <User className="w-3 h-3" />
                    FOUNDER {fs.total}
                  </span>
                );
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SIGNAL_TYPE_ORDER.map(type => {
                const key = `has${type.charAt(0).toUpperCase()}${type.slice(1)}`;
                if (!match[key]) return null;
                const config = SIGNAL_CONFIG[type];
                return (
                  <span
                    key={type}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: pillBg, color: pillText }}
                  >
                    {config.badge}
                  </span>
                );
              })}
              <span className="text-xs text-neutral-300">·</span>
              <span className="text-xs text-neutral-400">
                {match.signals.length} signal{match.signals.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-neutral-300">·</span>
              <span className="text-xs text-neutral-400">
                {new Date(match.latestSignal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {isEnriched && enrichment.one_line_thesis && (
              <p className="text-sm font-editorial italic text-neutral-600 mt-2 leading-snug">
                {enrichment.one_line_thesis}
              </p>
            )}
          </div>

          {/* Right: action buttons + chevron */}
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {/* Copy Brief */}
            {isHotOrWarm && isEnriched && (
              <button
                onClick={handleCopyBrief}
                title="Copy lead brief to clipboard (paste into Streak)"
                className="p-1.5 rounded transition-colors"
                style={{ color: briefCopied ? '#16a34a' : '#CCC' }}
              >
                {briefCopied
                  ? <CheckCheck className="w-4 h-4" />
                  : <Copy className="w-4 h-4 hover:text-[#052EF0]" style={{ transition: 'color 0.15s' }} />
                }
              </button>
            )}
            {/* Add to Watchlist */}
            {isHotOrWarm && isEnriched && (
              <button
                onClick={handleAddToWatchlist}
                disabled={watchlisting || watchlisted}
                title={watchlisted ? 'Added to Watchlist' : 'Add founder to Watchlist'}
                className="p-1.5 rounded transition-colors"
                style={{ color: watchlisted ? '#052EF0' : '#CCC' }}
              >
                {watchlisted
                  ? <BookmarkCheck className="w-4 h-4" />
                  : watchlisting
                    ? <div className="animate-spin rounded-full h-4 w-4 border-b border-neutral-300" />
                    : <Bookmark className="w-4 h-4 hover:text-[#052EF0]" style={{ transition: 'color 0.15s' }} />
                }
              </button>
            )}
            {/* Re-enrich */}
            {isHotOrWarm && isEnriched && (
              <button
                onClick={handleReenrich}
                disabled={reenriching}
                title="Re-run analysis"
                className="p-1.5 rounded transition-colors"
                style={{ color: reenriching ? '#CCC' : '#CCC' }}
              >
                <Sparkles
                  className={`w-4 h-4 ${reenriching ? 'animate-pulse text-[#052EF0]' : 'hover:text-[#052EF0]'}`}
                  style={{ transition: 'color 0.15s' }}
                />
              </button>
            )}
          </div>

          <div className="text-neutral-300 shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #E5E5E0', backgroundColor: '#FAFAF8' }} className="p-4 space-y-4">

          {isEnriched && <EnrichmentPanel enrichment={enrichment} brandName={match.name} />}

          {/* Team Notes */}
          <TeamNotesPanel match={match} onSaved={onUpdate} />

          {/* Signal timeline */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-widest text-neutral-400 mb-3">
              Signal Timeline
            </h4>
            <div className="space-y-2">
              {sortedSignals.map((signal, idx) => {
                const config = SIGNAL_CONFIG[signal.signal_type] || SIGNAL_CONFIG.manual;
                const Icon   = config.icon;
                return (
                  <div
                    key={signal.id || idx}
                    className="bg-white rounded p-3 text-sm"
                    style={{ border: '1px solid #E5E5E0' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5 text-black">
                        <Icon className="w-3.5 h-3.5" style={{ color: '#052EF0' }} />
                        {config.label}
                      </span>
                      <span className="text-[10px] text-neutral-300 font-medium">
                        {new Date(signal.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                    {signal.description && (
                      <p className="text-neutral-600 mt-1 text-xs leading-relaxed">{signal.description}</p>
                    )}
                    {signal.notes && (
                      <p className="text-neutral-400 text-xs mt-1 font-editorial italic">{signal.notes}</p>
                    )}
                    {signal.url && signal.url !== '#' && (
                      <a
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs mt-2 inline-flex items-center gap-1 font-medium transition-colors"
                        style={{ color: '#052EF0' }}
                        onClick={e => e.stopPropagation()}
                      >
                        View Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
