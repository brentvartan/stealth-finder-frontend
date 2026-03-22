import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * Theme Tracker
 * Tracks the intensity of Bullish's 3 core cultural tensions over the last 12 weeks.
 * Intensity = sum of bullish_scores for all signals belonging to that tension that week.
 * (Unscored signals count as 30 — present but unvalidated.)
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
  wellness:     { label: 'Ubiquitous Wellness',        color: '#87B4F8' }, // VIS blue-light
  self:         { label: 'Uncompromising Self',         color: '#052EF0' }, // VIS blue
  individuals:  { label: 'Individuals > Institutions', color: '#020A52' }, // VIS navy
};

// Keywords that signal each tension — checked against cultural_theme + category + one_line_thesis
// Sourced from Bullish 2026 Cultural Themes deck + sub-theme language

// Ubiquitous Wellness: health optimisation, GLP-1, longevity protocols, Presently Offline
// (digital detox/analog self-care), Healthy Hedonism (permissive wellness, guilt-free
// indulgence), Long Live Longevity (biohacking, healthspan, performance tracking)
const WELLNESS_KEYS = [
  // Core wellness
  'wellness', 'health', 'glp', 'glp-1', 'weight', 'longevity', 'healthspan',
  'nutrition', 'supplement', 'vitamin', 'diet', 'dietary', 'food', 'beverage',
  'drink', 'gut', 'sleep', 'mental', 'anxiety', 'stress', 'fitness',
  'functional', 'medical', 'clinical', 'therapeutic', 'pet',
  'biohack', 'recovery', 'immune', 'metabolic', 'hormone',
  // Presently Offline sub-theme
  'offline', 'detox', 'mindful', 'mindfulness', 'meditation', 'breathwork',
  'sauna', 'cold plunge', 'spa', 'retreat', 'unplugged', 'screen-free',
  // Healthy Hedonism sub-theme
  'hedonism', 'permissive', 'indulge', 'guilt-free', 'pleasure', 'moderat',
  // Long Live Longevity sub-theme
  'anti-aging', 'anti-ageing', 'peptide', 'lifespan', 'biomarker',
  'wearable', 'optimize', 'optimis', 'performance', 'protocol',
];

// Uncompromising Self: identity expression, personal care as statement, Visible Values
// (purpose-led consumption), Technically Natural (science + natural amplifying the self),
// Boldly Intimate (taboo-breaking personal care, femtech, body positivity)
const SELF_KEYS = [
  // Core self/identity
  'beauty', 'skin', 'skincare', 'cosmetic', 'makeup', 'grooming', 'personal care',
  'haircare', 'fragrance', 'self', 'identity', 'expression', 'style', 'fashion',
  'apparel', 'authentic', 'unapologetic', 'gen alpha', 'genz', 'gen z',
  'transparency', 'clean label', 'sustainable', 'climate', 'body care', 'intimate',
  // Visible Values sub-theme
  'values', 'purpose', 'ethical', 'conscious', 'cause', 'advocacy', 'empowerment',
  'self-care', 'statement',
  // Technically Natural sub-theme
  'natural', 'science-backed', 'retinol', 'serum', 'derma', 'formul',
  'ingredient', 'efficacy', 'biotech', 'actives',
  // Boldly Intimate sub-theme
  'taboo', 'femcare', 'femtech', 'period', 'menstrual', 'libido',
  'body positive', 'bold', 'confidence', 'sexual wellness',
];

// Individuals > Institutions: micro-communities, bypassing gatekeepers, Communal Crafting
// (local/niche passion communities, third places), Micro Moguls (indie founders, DTC,
// solopreneurs), Creator Legitimacy (platform independence, audience ownership)
const INDIVIDUALS_KEYS = [
  // Core anti-institution
  'individual', 'institution', 'community', 'creator', 'indie', 'craft', 'local',
  'independent', 'decentrali', 'direct', 'dtc', 'analog', 'revival', 'physical',
  'third place', 'third-place', 'running', 'sport', 'outdoor', 'finance', 'banking',
  'education', 'media', 'social', 'connection', 'rebellion', 'anti-corporate',
  'small batch', 'maker', 'handcraft',
  // Communal Crafting sub-theme
  'communal', 'collective', 'niche', 'artisan', 'micro-community', 'gathering',
  'club', 'hobby', 'workshop', 'co-op',
  // Micro Moguls sub-theme
  'entrepreneur', 'founder', 'startup', 'solopreneur', 'side hustle',
  'micro-brand', 'mogul', 'brand builder',
  // Creator Legitimacy sub-theme
  'gatekeeper', 'influencer', 'podcast', 'newsletter', 'substack',
  'audience', 'subscriber', 'legitimacy', 'platform independence',
];

function classifyTension(match) {
  const e = match.enrichment || {};

  // Use server-side tension if available (set by Claude at enrichment time)
  if (e.tension && ['wellness', 'self', 'individuals'].includes(e.tension)) {
    return e.tension;
  }

  // Fallback: keyword matching for signals enriched before server-side tension was added
  const combined = [
    e.cultural_theme || '',
    match.category || '',
    e.one_line_thesis || '',
    match.name || '',
  ].join(' ').toLowerCase();

  const w = WELLNESS_KEYS.filter(k => combined.includes(k)).length;
  const s = SELF_KEYS.filter(k => combined.includes(k)).length;
  const i = INDIVIDUALS_KEYS.filter(k => combined.includes(k)).length;

  if (w === 0 && s === 0 && i === 0) return 'self'; // default: Uncompromising Self
  if (w >= s && w >= i) return 'wellness';
  if (s >= i) return 'self';
  return 'individuals';
}

export default function TrendChart({ signals = [] }) {
  const chartData = useMemo(() => {
    // Build last 12 Monday-anchored week buckets
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);

    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(lastMonday);
      weekStart.setDate(lastMonday.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks.push({ label, weekStart, weekEnd, wellness: 0, self: 0, individuals: 0 });
    }

    // Bucket each signal — intensity = bullish_score (default 30 if unscored)
    signals.forEach(signal => {
      const date = new Date(signal.savedAt);
      if (isNaN(date.getTime())) return;
      const tension = classifyTension(signal);
      const score = signal.enrichment?.bullish_score || 30;
      for (const week of weeks) {
        if (date >= week.weekStart && date < week.weekEnd) {
          week[tension] += score;
          break;
        }
      }
    });

    return weeks.map(({ label, wellness, self, individuals }) => ({
      label,
      [THEMES.wellness.label]:    wellness    || null,
      [THEMES.self.label]:        self        || null,
      [THEMES.individuals.label]: individuals || null,
    }));
  }, [signals]);

  const hasData = chartData.some(d =>
    d[THEMES.wellness.label] || d[THEMES.self.label] || d[THEMES.individuals.label]
  );

  if (!hasData) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
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
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E0',
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 600, color: '#000', marginBottom: 4 }}
        />
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
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
