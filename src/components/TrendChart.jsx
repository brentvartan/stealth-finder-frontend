import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * Theme Tracker
 * Tracks 3 core cultural tensions over the last 6 months (~180 days).
 * Y-axis = unique brand count per theme per month (not score sum).
 * Hover tooltip lists brand names; confluence brands (2+ signal types) are bolded.
 *
 * Tensions (from Bullish 2026 Cultural Themes deck):
 *   - Ubiquitous Wellness  ($7.3T) — health optimisation, GLP-1, longevity, Presently Offline,
 *                                    Healthy Hedonism, Long Live Longevity
 *   - Uncompromising Self  ($2.7T) — identity expression, beauty, Visible Values,
 *                                    Technically Natural, Boldly Intimate
 *   - Individuals > Institutions ($3.5T) — Communal Crafting, Micro Moguls,
 *                                          Creator Legitimacy, DTC empowerment
 */

const THEMES = {
  wellness:     { label: 'Ubiquitous Wellness',        color: '#87B4F8' },
  self:         { label: 'Uncompromising Self',         color: '#052EF0' },
  individuals:  { label: 'Individuals > Institutions', color: '#020A52' },
};

// ── Keyword lists ──────────────────────────────────────────────────────────────

const WELLNESS_KEYS = [
  'wellness', 'health', 'glp', 'glp-1', 'weight', 'longevity', 'healthspan',
  'nutrition', 'supplement', 'vitamin', 'diet', 'dietary', 'food', 'beverage',
  'drink', 'gut', 'sleep', 'mental', 'anxiety', 'stress', 'fitness',
  'functional', 'medical', 'clinical', 'therapeutic', 'pet',
  'biohack', 'recovery', 'immune', 'metabolic', 'hormone',
  'offline', 'detox', 'mindful', 'mindfulness', 'meditation', 'breathwork',
  'sauna', 'cold plunge', 'spa', 'retreat', 'unplugged', 'screen-free',
  'hedonism', 'permissive', 'indulge', 'guilt-free', 'pleasure', 'moderat',
  'anti-aging', 'anti-ageing', 'peptide', 'lifespan', 'biomarker',
  'wearable', 'optimize', 'optimis', 'performance', 'protocol',
];

const SELF_KEYS = [
  'beauty', 'skin', 'skincare', 'cosmetic', 'makeup', 'grooming', 'personal care',
  'haircare', 'fragrance', 'self', 'identity', 'expression', 'style', 'fashion',
  'apparel', 'authentic', 'unapologetic', 'gen alpha', 'genz', 'gen z',
  'transparency', 'clean label', 'sustainable', 'climate', 'body care', 'intimate',
  'values', 'purpose', 'ethical', 'conscious', 'cause', 'advocacy', 'empowerment',
  'self-care', 'statement',
  'natural', 'science-backed', 'retinol', 'serum', 'derma', 'formul',
  'ingredient', 'efficacy', 'biotech', 'actives',
  'taboo', 'femcare', 'femtech', 'period', 'menstrual', 'libido',
  'body positive', 'bold', 'confidence', 'sexual wellness',
];

const INDIVIDUALS_KEYS = [
  'individual', 'institution', 'community', 'creator', 'indie', 'craft', 'local',
  'independent', 'decentrali', 'direct', 'dtc', 'analog', 'revival', 'physical',
  'third place', 'third-place', 'running', 'sport', 'outdoor', 'finance', 'banking',
  'education', 'media', 'social', 'connection', 'rebellion', 'anti-corporate',
  'small batch', 'maker', 'handcraft',
  'communal', 'collective', 'niche', 'artisan', 'micro-community', 'gathering',
  'club', 'hobby', 'workshop', 'co-op',
  'entrepreneur', 'founder', 'startup', 'solopreneur', 'side hustle',
  'micro-brand', 'mogul', 'brand builder',
  'gatekeeper', 'influencer', 'podcast', 'newsletter', 'substack',
  'audience', 'subscriber', 'legitimacy', 'platform independence',
];

function classifyTension(match) {
  const e = match.enrichment || {};

  if (e.tension && ['wellness', 'self', 'individuals'].includes(e.tension)) {
    return e.tension;
  }

  const combined = [
    e.cultural_theme || '',
    match.category || '',
    e.one_line_thesis || '',
    match.companyName || match.name || '',
  ].join(' ').toLowerCase();

  const w = WELLNESS_KEYS.filter(k => combined.includes(k)).length;
  const s = SELF_KEYS.filter(k => combined.includes(k)).length;
  const i = INDIVIDUALS_KEYS.filter(k => combined.includes(k)).length;

  if (w === 0 && s === 0 && i === 0) return 'individuals';
  if (w >= s && w >= i) return 'wellness';
  if (s >= i) return 'self';
  return 'individuals';
}

/** Returns true if a signal has 2+ distinct signal types (trademark + EDGAR, etc.) */
function isConfluence(brandSignals) {
  const types = new Set(brandSignals.map(s => s.signalType || s.signal_type || s.category || ''));
  return types.size >= 2;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function BrandTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  // Gather brand lists from the data point
  const point = payload[0]?.payload || {};

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #E5E5E0',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      maxWidth: 260,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#000' }}>{label}</div>

      {Object.values(THEMES).map(({ label: themeLabel, color }) => {
        const brands = point[`_brands_${themeLabel}`] || [];
        if (brands.length === 0) return null;
        return (
          <div key={themeLabel} style={{ marginBottom: 8 }}>
            <div style={{ color, fontWeight: 600, marginBottom: 3, fontSize: 11 }}>
              {themeLabel} — {brands.length} brand{brands.length !== 1 ? 's' : ''}
            </div>
            {brands.map(({ name, confluence }) => (
              <div key={name} style={{
                paddingLeft: 8,
                color: confluence ? '#052EF0' : '#374151',
                fontWeight: confluence ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 1,
              }}>
                {confluence && (
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#052EF0',
                    flexShrink: 0,
                  }} />
                )}
                {name}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 6, borderTop: '1px solid #F3F4F6', paddingTop: 6 }}>
        ● = 2+ signal types
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TrendChart({ signals = [] }) {
  const chartData = useMemo(() => {
    const now = new Date();

    // Build 6 monthly buckets: current month + 5 prior months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({
        label,
        year:  d.getFullYear(),
        month: d.getMonth(),          // 0-indexed
        // theme key → Map<brandName, signal[]>
        wellness:    new Map(),
        self:        new Map(),
        individuals: new Map(),
      });
    }

    // Bucket each signal by month + theme, keyed by brand name
    signals.forEach(signal => {
      const date = new Date(signal.savedAt);
      if (isNaN(date.getTime())) return;

      const y = date.getFullYear();
      const m = date.getMonth();
      const bucket = months.find(b => b.year === y && b.month === m);
      if (!bucket) return;

      const tension = classifyTension(signal);
      const brandName = signal.companyName || signal.name || signal.title || 'Unknown';

      if (!bucket[tension].has(brandName)) {
        bucket[tension].set(brandName, []);
      }
      bucket[tension].get(brandName).push(signal);
    });

    // Convert to Recharts-friendly rows
    return months.map(bucket => {
      const row = { label: bucket.label };

      for (const themeKey of ['wellness', 'self', 'individuals']) {
        const themeLabel = THEMES[themeKey].label;
        const brandMap   = bucket[themeKey];
        const count      = brandMap.size;

        // Build sorted brand list: confluence brands first, then alpha
        const brands = [...brandMap.entries()].map(([name, sigs]) => ({
          name,
          confluence: isConfluence(sigs),
        })).sort((a, b) => {
          if (a.confluence !== b.confluence) return b.confluence - a.confluence;
          return a.name.localeCompare(b.name);
        });

        row[themeLabel] = count || null;           // null keeps the line gap (no false 0s)
        row[`_brands_${themeLabel}`] = brands;     // hidden key for tooltip
      }

      return row;
    });
  }, [signals]);

  const hasData = chartData.some(d =>
    d[THEMES.wellness.label] || d[THEMES.self.label] || d[THEMES.individuals.label]
  );

  if (!hasData) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
          label={{
            value: 'brands',
            angle: -90,
            position: 'insideLeft',
            offset: 16,
            style: { fontSize: 9, fill: '#D1D5DB' },
          }}
        />
        <Tooltip content={<BrandTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        {Object.values(THEMES).map(({ label, color }) => (
          <Line
            key={label}
            type="monotone"
            dataKey={label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
