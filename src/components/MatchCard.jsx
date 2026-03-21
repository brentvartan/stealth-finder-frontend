import React, { useState } from 'react';
import {
  Award, Building2, Globe, Camera, ShoppingBag, Linkedin,
  ChevronDown, ChevronUp, ExternalLink, Pencil, Flame, TrendingUp, Minus,
} from 'lucide-react';

export const SIGNAL_CONFIG = {
  trademark: { icon: Award,       label: 'Trademark', badge: 'TM'     },
  delaware:  { icon: Building2,   label: 'Delaware',  badge: 'DE'     },
  domain:    { icon: Globe,       label: 'Domain',    badge: 'URL'    },
  instagram: { icon: Camera,      label: 'Instagram', badge: 'IG'     },
  shopify:   { icon: ShoppingBag, label: 'Shopify',   badge: 'SHOP'   },
  social:    { icon: Linkedin,    label: 'Social',    badge: 'SOCIAL' },
  manual:    { icon: Pencil,      label: 'Manual',    badge: 'MANUAL' },
};

const SIGNAL_TYPE_ORDER = ['trademark', 'delaware', 'domain', 'instagram', 'shopify', 'social'];

// ─── Watch-level helpers ────────────────────────────────────────────────────

const WATCH_CONFIG = {
  hot:  { label: 'HOT',  bg: '#052EF0', text: '#fff', pillBg: '#052EF0', pillText: '#fff', Icon: Flame      },
  warm: { label: 'WARM', bg: '#000',    text: '#fff', pillBg: '#000',    pillText: '#fff', Icon: TrendingUp },
  cold: { label: 'COLD', bg: '#E8E8E8', text: '#aaa', pillBg: '#EEEEEE', pillText: '#999', Icon: Minus      },
};

function WatchBadge({ level, score }) {
  const cfg = WATCH_CONFIG[level] || WATCH_CONFIG.cold;
  const { Icon } = cfg;
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display font-bold tracking-wider shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <Icon className="w-3 h-3" />
      <span>{score}</span>
      <span className="opacity-60">{cfg.label}</span>
    </div>
  );
}

// ─── Enrichment panel (expanded) ───────────────────────────────────────────

function EnrichmentPanel({ enrichment }) {
  if (!enrichment?.enriched) return null;

  const {
    bullish_score, watch_level, consumer_brand, repeat_potential, repeat_reason,
    cultural_theme, advocacy_deficiency, remarkability_drivers, one_line_thesis,
    red_flags, comparable_portfolio,
  } = enrichment;

  const watchCfg = WATCH_CONFIG[watch_level] || WATCH_CONFIG.cold;

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: '#F5F0EB', border: '1px solid #E5E5E0' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-neutral-400">
          Bullish AI Analysis
        </span>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold"
          style={{ backgroundColor: watchCfg.bg, color: watchCfg.text }}
        >
          <span className="text-lg font-display leading-none">{bullish_score}</span>
          <span className="text-[10px] tracking-wide opacity-70">/ 100</span>
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
            <span className="text-neutral-400 uppercase tracking-wider text-[9px] font-medium">2026 Cultural Theme</span>
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
    </div>
  );
}

// ─── Main card ──────────────────────────────────────────────────────────────

export default function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);

  const { enrichment } = match;
  const isEnriched  = enrichment?.enriched;
  const watchLevel  = enrichment?.watch_level || (isEnriched ? 'cold' : null);
  const bullishScore = enrichment?.bullish_score;
  const watchCfg    = WATCH_CONFIG[watchLevel] || null;

  const isCold      = watchLevel === 'cold';
  const isUnenriched = !isEnriched;

  const sortedSignals = [...(match.signals || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  // COLD and unenriched cards both render as slim single rows
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
          {/* Muted left badge */}
          <div
            className="w-8 h-8 rounded flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: '#F2F2F2', color: '#bbb' }}
          >
            <span className="font-display font-bold text-sm leading-none">{slimScore}</span>
          </div>
          {/* Name + category */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-neutral-400 leading-none truncate">
              {match.name}
            </h3>
            <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider shrink-0">
              {match.category}
            </span>
          </div>
          {/* COLD / PENDING label */}
          <span className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider shrink-0">{slimLabel}</span>
          <div className="text-neutral-200">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
        {/* Expandable detail */}
        {expanded && (
          <div style={{ borderTop: '1px solid #F0F0F0', backgroundColor: '#FAFAF8' }} className="p-4 space-y-3">
            {isCold && enrichment?.one_line_thesis && (
              <p className="text-xs font-editorial italic text-neutral-400 leading-snug">
                {enrichment.one_line_thesis}
              </p>
            )}
            {isCold && <EnrichmentPanel enrichment={enrichment} />}
            {isUnenriched && (
              <p className="text-xs text-neutral-400 italic">
                Not yet scored — click <strong>Bullish AI</strong> on the dashboard to analyse this brand.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // HOT / WARM / unenriched cards — full display
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
          {/* Watch-level badge (left) */}
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
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h3 className="font-display font-bold text-xl uppercase tracking-wide text-black leading-none">
                {match.name}
              </h3>
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                {match.category}
              </span>
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

            {/* One-line thesis visible without expanding */}
            {isEnriched && enrichment.one_line_thesis && (
              <p className="text-sm font-editorial italic text-neutral-600 mt-2 leading-snug">
                {enrichment.one_line_thesis}
              </p>
            )}
          </div>

          {/* Right: chevron only — watch level is already on the left badge */}
          <div className="text-neutral-300 shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #E5E5E0', backgroundColor: '#FAFAF8' }} className="p-4 space-y-4">

          {/* AI Analysis */}
          {isEnriched && <EnrichmentPanel enrichment={enrichment} />}

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
