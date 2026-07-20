import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const TOP_CATEGORIES = 8;
const VELOCITY_WEEKS = 8;

// ─── Signal Velocity ──────────────────────────────────────────────────────────
// Weekly HOT + WARM signal count over the last 8 weeks, stacked.

function VelocityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const hot  = payload.find(p => p.dataKey === 'hot')?.value  || 0;
  const warm = payload.find(p => p.dataKey === 'warm')?.value || 0;
  const hotBrands  = payload[0]?.payload?._hotBrands  || [];
  const warmBrands = payload[0]?.payload?._warmBrands || [];
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E5E0', borderRadius: 8,
      padding: '10px 14px', fontSize: 12, maxWidth: 220,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#000' }}>{label}</div>
      {hot > 0 && (
        <>
          <div style={{ color: '#052EF0', fontWeight: 600, marginBottom: 2 }}>
            {hot} HOT
          </div>
          {hotBrands.slice(0, 4).map(b => (
            <div key={b} style={{ color: '#374151', paddingLeft: 8, fontSize: 11 }}>{b}</div>
          ))}
        </>
      )}
      {warm > 0 && (
        <>
          <div style={{ color: '#555', fontWeight: 600, marginTop: hot > 0 ? 4 : 0, marginBottom: 2 }}>
            {warm} WARM
          </div>
          {warmBrands.slice(0, 4).map(b => (
            <div key={b} style={{ color: '#374151', paddingLeft: 8, fontSize: 11 }}>{b}</div>
          ))}
        </>
      )}
    </div>
  );
}

function HotVelocityChart({ signals }) {
  const data = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let i = VELOCITY_WEEKS - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks.push({ label, start, end, hotBrands: new Set(), warmBrands: new Set() });
    }

    signals.forEach(s => {
      const level = s.enrichment?.watch_level;
      if (level !== 'hot' && level !== 'warm') return;
      const d = new Date(s.savedAt || s.timestamp);
      if (isNaN(d.getTime())) return;
      const bucket = weeks.find(w => d >= w.start && d < w.end);
      if (bucket) {
        const name = s.companyName || s.name || 'Unknown';
        bucket[level === 'hot' ? 'hotBrands' : 'warmBrands'].add(name);
      }
    });

    return weeks.map(w => ({
      label:       w.label,
      hot:         w.hotBrands.size,
      warm:        w.warmBrands.size,
      _hotBrands:  [...w.hotBrands],
      _warmBrands: [...w.warmBrands],
    }));
  }, [signals]);

  const maxVal = Math.max(...data.map(d => d.hot + d.warm), 1);

  // Summary stats
  const totals = useMemo(() => {
    const hot  = signals.filter(s => s.enrichment?.watch_level === 'hot').length;
    const warm = signals.filter(s => s.enrichment?.watch_level === 'warm').length;
    return { hot, warm };
  }, [signals]);

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
        Signal Velocity — Last 8 Weeks
      </p>
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxVal + 1]}
          />
          <Tooltip content={<VelocityTooltip />} cursor={{ fill: 'rgba(5,46,240,0.04)' }} />
          <Bar dataKey="hot"  stackId="a" fill="#052EF0" radius={[0, 0, 0, 0]} maxBarSize={28} />
          <Bar dataKey="warm" stackId="a" fill="#000"    radius={[3, 3, 0, 0]} maxBarSize={28} fillOpacity={0.18} />
        </BarChart>
      </ResponsiveContainer>
      </div>
      {/* Legend + totals */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#052EF0' }} />
          <span className="text-[10px] text-neutral-400">HOT</span>
          <span className="text-[10px] font-bold text-neutral-600">{totals.hot}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#000', opacity: 0.35 }} />
          <span className="text-[10px] text-neutral-400">WARM</span>
          <span className="text-[10px] font-bold text-neutral-600">{totals.warm}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Category Distribution ────────────────────────────────────────────────────
// HOT + WARM brands by category, horizontal bars.

function CategoryChart({ signals }) {
  const data = useMemo(() => {
    const counts = {};
    const seen = new Set();

    signals.forEach(s => {
      const level = s.enrichment?.watch_level;
      if (level !== 'hot' && level !== 'warm') return;
      const name = s.companyName || s.name || '';
      const cat  = s.category || 'Other';
      const key  = `${name}__${cat}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!counts[cat]) counts[cat] = { hot: 0, warm: 0 };
      counts[cat][level]++;
    });

    return Object.entries(counts)
      .map(([cat, { hot, warm }]) => ({ cat, hot, warm, total: hot + warm }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_CATEGORIES);
  }, [signals]);

  if (!data.length) return null;

  const max = Math.max(...data.map(d => d.total), 1);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
        Category Breakdown — HOT + WARM
      </p>
      <div className="space-y-2">
        {data.map(({ cat, hot, warm, total }) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-neutral-700 truncate" style={{ maxWidth: '60%' }}>{cat}</span>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 shrink-0">
                {hot > 0 && <span style={{ color: '#052EF0', fontWeight: 700 }}>{hot} HOT</span>}
                {warm > 0 && <span style={{ color: '#555', fontWeight: 600 }}>{warm} WARM</span>}
              </div>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-l-full"
                style={{ width: `${(hot / max) * 100}%`, backgroundColor: '#052EF0' }}
              />
              <div
                className="h-full"
                style={{
                  width: `${(warm / max) * 100}%`,
                  backgroundColor: '#000',
                  borderRadius: hot > 0 ? '0 4px 4px 0' : '4px',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#052EF0' }} />
          <span className="text-[10px] text-neutral-400">HOT (≥70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#000' }} />
          <span className="text-[10px] text-neutral-400">WARM (50–69)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Signal Source Mix ────────────────────────────────────────────────────────
// How many HOT/WARM signals came from each source.

const SOURCE_LABELS = {
  trademark:    { label: 'Trademark', color: '#052EF0' },
  delaware:     { label: 'SEC Form D', color: '#020A52' },
  press_stealth:{ label: 'Press Intel', color: '#0E7490' },
  ctlogs:       { label: 'CT Log', color: '#6B7280' },
  newswire:     { label: 'Newswire', color: '#87B4F8' },
  producthunt:  { label: 'Product Hunt', color: '#3B82F6' },
  app_store:    { label: 'App Store', color: '#3B82F6' },
  domain:       { label: 'Domain', color: '#6B7280' },
  manual:       { label: 'Manual', color: '#D1D5DB' },
};

function SourceMixChart({ signals }) {
  const data = useMemo(() => {
    const counts = {};
    const seen = new Set();

    signals.forEach(s => {
      const level = s.enrichment?.watch_level;
      if (level !== 'hot' && level !== 'warm') return;
      const type = s.signal_type || 'manual';
      const name = s.companyName || s.name || '';
      const key  = `${name}__${type}`;
      if (seen.has(key)) return;
      seen.add(key);
      counts[type] = (counts[type] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / total) * 100),
        ...(SOURCE_LABELS[type] || { label: type, color: '#D1D5DB' }),
      }));
  }, [signals]);

  // Avg Bullish score per source (all scored signals)
  const scoreBySource = useMemo(() => {
    const acc = {};
    signals.forEach(s => {
      const score = s.enrichment?.bullish_score;
      if (score == null) return;
      const type = s.signal_type || 'manual';
      if (!acc[type]) acc[type] = { total: 0, count: 0 };
      acc[type].total += score;
      acc[type].count++;
    });
    return Object.entries(acc)
      .filter(([, v]) => v.count >= 2)
      .map(([type, { total, count }]) => ({
        type,
        avg: Math.round(total / count),
        ...(SOURCE_LABELS[type] || { label: type, color: '#D1D5DB' }),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [signals]);

  if (!data.length) return null;

  const maxAvg = Math.max(...scoreBySource.map(d => d.avg), 100);

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
        Signal Source Mix
      </p>
      <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-3">
        {data.map(({ type, pct, color }) => (
          <div key={type} style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 3 ? undefined : 4 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
        {data.map(({ type, label, count, pct, color }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-neutral-500">{label}</span>
            <span className="text-[10px] font-bold text-neutral-700">{count}</span>
            <span className="text-[10px] text-neutral-300">({pct}%)</span>
          </div>
        ))}
      </div>

      {scoreBySource.length >= 2 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
            Avg Bullish Score by Source
          </p>
          <div className="space-y-2 flex-1">
            {scoreBySource.map(({ type, label, avg, color }) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-neutral-600">{label}</span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: avg >= 70 ? '#052EF0' : avg >= 50 ? '#374151' : '#9CA3AF' }}
                  >
                    {avg}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(avg / maxAvg) * 100}%`,
                      backgroundColor: avg >= 70 ? '#052EF0' : avg >= 50 ? '#374151' : '#D1D5DB',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PipelineChart({ signals = [] }) {
  const hasHot = signals.some(s => s.enrichment?.watch_level === 'hot');
  const hasScored = signals.some(s => s.enrichment?.watch_level);

  if (!hasScored) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* HOT velocity */}
      <div className="bg-white rounded-lg p-5 md:col-span-1 flex flex-col" style={{ border: '1px solid #E5E5E0' }}>
        <HotVelocityChart signals={signals} />
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-lg p-5 md:col-span-1" style={{ border: '1px solid #E5E5E0' }}>
        <CategoryChart signals={signals} />
      </div>

      {/* Source mix */}
      <div className="bg-white rounded-lg p-5 md:col-span-1" style={{ border: '1px solid #E5E5E0' }}>
        <SourceMixChart signals={signals} />
      </div>
    </div>
  );
}
