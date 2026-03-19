import React, { useState } from 'react';
import {
  Award, Building2, Globe, Camera, ShoppingBag, Linkedin,
  ChevronDown, ChevronUp, ExternalLink, Pencil
} from 'lucide-react';

export const SIGNAL_CONFIG = {
  trademark: { icon: Award, label: 'Trademark', bg: 'bg-purple-100', text: 'text-purple-700', badge: 'TM' },
  delaware:  { icon: Building2, label: 'Delaware', bg: 'bg-blue-100', text: 'text-blue-700', badge: 'DE' },
  domain:    { icon: Globe, label: 'Domain', bg: 'bg-green-100', text: 'text-green-700', badge: 'URL' },
  instagram: { icon: Camera, label: 'Instagram', bg: 'bg-pink-100', text: 'text-pink-700', badge: 'IG' },
  shopify:   { icon: ShoppingBag, label: 'Shopify', bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'Shop' },
  social:    { icon: Linkedin, label: 'Social', bg: 'bg-indigo-100', text: 'text-indigo-700', badge: 'Social' },
  manual:    { icon: Pencil, label: 'Manual', bg: 'bg-slate-100', text: 'text-slate-700', badge: 'Manual' },
};

const SIGNAL_TYPE_ORDER = ['trademark', 'delaware', 'domain', 'instagram', 'shopify', 'social'];

export default function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    match.score >= 50 ? 'bg-green-100 text-green-700' :
    match.score >= 30 ? 'bg-yellow-100 text-yellow-700' :
    'bg-slate-100 text-slate-600';

  const sortedSignals = [...(match.signals || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Main row — click to expand */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Company name + category + signal badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-900 truncate">{match.name}</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                {match.category}
              </span>
              <div className="flex flex-wrap gap-1">
                {SIGNAL_TYPE_ORDER.map(type => {
                  const key = `has${type.charAt(0).toUpperCase()}${type.slice(1)}`;
                  if (!match[key]) return null;
                  const config = SIGNAL_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <span
                      key={type}
                      className={`${config.bg} ${config.text} text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 whitespace-nowrap`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.badge}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Summary line */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span>{match.signals.length} signal{match.signals.length !== 1 ? 's' : ''}</span>
              <span>Score: <span className="font-semibold text-slate-700">{match.score}</span></span>
              <span>Last: {new Date(match.latestSignal).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Score badge + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${scoreColor}`}>
              {match.score}
            </div>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </div>
        </div>
      </div>

      {/* Expanded signal timeline */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Signal Timeline</h4>
          <div className="space-y-2">
            {sortedSignals.map((signal, idx) => {
              const config = SIGNAL_CONFIG[signal.signal_type] || SIGNAL_CONFIG.manual;
              const Icon = config.icon;
              return (
                <div
                  key={signal.id || idx}
                  className="bg-white rounded-lg p-3 text-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium flex items-center gap-1.5 ${config.text}`}>
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(signal.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>

                  {signal.description && (
                    <p className="text-slate-600 mt-1">{signal.description}</p>
                  )}
                  {signal.notes && (
                    <p className="text-slate-500 text-xs mt-1 italic">{signal.notes}</p>
                  )}

                  {signal.url && signal.url !== '#' && (
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs mt-2 inline-flex items-center gap-1"
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
