import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TOP_CATEGORIES = 8;
const VELOCITY_WEEKS = 8;

// ─── HOT Velocity ─────────────────────────────────────────────────────────────
// Weekly HOT signal count over the last 8 weeks.

function VelocityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value || 0;
  const brands = payload[0]?.payload?._brands || [];
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E5E0', borderRadius: 8,
      padding: '10px 14px', fontSize: 12, maxWidth: 220,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#000' }}>{label}</div>
      <div style={{ color: '#052EF0', fontWeight: 600, marginBottom: 4 }}>
        {count} HOT signal{count !== 1 ? 's' : ''}
      </div>
      {brands.slice(0, 6).map(b => (
        <div key={b} style={{ color: '#374151', paddingLeft: 8, fontSize: 11 }}>{b}</div>
      ))}
      {brands.length > 6 && (
        <div style={{ color: '#9CA3AF', paddingLeft: 8, fontSize: 10 }}>+{brands.length - 6} more</div>
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
      weeks.push({ label, start, end, brands: [] });
    }

    signals.forEach(s => {
      if (s.enrichment?.watch_level !== 'hot') return;
      const d = new Date(s.savedAt || s.timestamp);
      if (isNaN(d.getTime())) return;
      const bucket = weeks.find(w => d >= w.start && d < w.end);
      if (bucket) {
        const name = s.companyName || s.name || 'Unknown';
        if (!bucket.brands.includes(name)) bucket.brands.push(name);
      }
    });

    return weeks.map(w => ({
      label: w.label,
      count: w.brands.length,
      _brands: w.brands,
    }));
  }, [signals]);

  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
        HOT Signal Velocity — Last 8 Weeks
      </p>
      <ResponsiveContainer width="100%" height={120}>
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
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count > 0 ? '#052EF0' : '#E5E5E0'}
                fillOpacity={entry.count > 0 ? (0.4 + (entry.count / maxVal) * 0.6) : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
  trademark:   { label: 'Trademark', color: '#052EF0' },
  delaware:    { label: 'SEC Form D', color: '#020A52' },
  producthunt: { label: 'Product Hunt', color: '#87B4F8' },
  app_store:   { label: 'App Store', color: '#3B82F6' },
  domain:      { label: 'Domain', color: '#6B7280' },
  manual:      { label: 'Manual', color: '#D1D5DB' },
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

  if (!data.length) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
        Signal Source Mix
      </p>
      <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-3">
        {data.map(({ type, pct, color }) => (
          <div key={type} style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 3 ? undefined : 4 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map(({ type, label, count, pct, color }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-neutral-500">{label}</span>
            <span className="text-[10px] font-bold text-neutral-700">{count}</span>
            <span className="text-[10px] text-neutral-300">({pct}%)</span>
          </div>
        ))}
      </div>
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
      <div className="bg-white rounded-lg p-5 md:col-span-1" style={{ border: '1px solid #E5E5E0' }}>
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
