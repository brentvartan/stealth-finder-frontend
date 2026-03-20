import React, { useState } from 'react';
import {
  Award, Building2, Globe, Camera, ShoppingBag, Linkedin,
  ChevronDown, ChevronUp, ExternalLink, Pencil
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

export default function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);

  const isHigh   = match.score >= 50;
  const isMedium = match.score >= 30;

  const sortedSignals = [...(match.signals || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div
      className="bg-white rounded-lg overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: '1px solid #E5E5E0' }}
    >
      {/* ── Main row ── */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Score badge */}
          <div
            className="w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0"
            style={{
              backgroundColor: isHigh ? '#052EF0' : isMedium ? '#000' : '#F5F0EB',
              color: isHigh || isMedium ? '#fff' : '#333',
            }}
          >
            <span className="font-display font-bold text-xl leading-none">{match.score}</span>
            <span className="text-[8px] font-medium opacity-60 tracking-wide mt-0.5">PTS</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h3 className="font-display font-bold text-lg uppercase tracking-wide text-black leading-none">
                {match.name}
              </h3>
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                {match.category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Signal type badges */}
              {SIGNAL_TYPE_ORDER.map(type => {
                const key = `has${type.charAt(0).toUpperCase()}${type.slice(1)}`;
                if (!match[key]) return null;
                const config = SIGNAL_CONFIG[type];
                return (
                  <span
                    key={type}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#052EF0', color: '#fff' }}
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
          </div>

          {/* Expand chevron */}
          <div className="shrink-0 text-neutral-300">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ── Expanded timeline ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #E5E5E0', backgroundColor: '#FAFAF8' }} className="p-4">
          <h4
            className="font-display font-semibold text-xs uppercase tracking-widest text-neutral-400 mb-3"
          >
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
                        month: 'short', day: 'numeric', year: 'numeric'
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
      )}
    </div>
  );
}
