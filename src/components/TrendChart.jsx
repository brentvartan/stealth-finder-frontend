import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * TrendChart — Signal Velocity
 * Shows a stacked bar chart of signals discovered per week (last 12 weeks).
 * Buckets: HOT (#052EF0), WARM (#000000), COLD (#D1D5DB), Unscored (#F0F0ED)
 *
 * Props:
 *   signals — array of parsed signal objects with { savedAt, enrichment, signal_type }
 */
export default function TrendChart({ signals = [] }) {
  const chartData = useMemo(() => {
    // Build the last 12 Monday-anchored week buckets
    const weeks = [];
    const now = new Date();

    // Find the most recent Monday (or today if today is Monday)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(lastMonday);
      weekStart.setDate(lastMonday.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Label: "Jan 6" format
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      weeks.push({
        label,
        weekStart,
        weekEnd,
        hot: 0,
        warm: 0,
        cold: 0,
        unscored: 0,
      });
    }

    // Bucket each signal into the appropriate week
    signals.forEach(signal => {
      const date = new Date(signal.savedAt);
      if (isNaN(date.getTime())) return;

      for (const week of weeks) {
        if (date >= week.weekStart && date < week.weekEnd) {
          const watchLevel = signal.enrichment?.watch_level;
          if (watchLevel === 'hot') {
            week.hot += 1;
          } else if (watchLevel === 'warm') {
            week.warm += 1;
          } else if (watchLevel === 'cold') {
            week.cold += 1;
          } else {
            week.unscored += 1;
          }
          break;
        }
      }
    });

    return weeks.map(({ label, hot, warm, cold, unscored }) => ({
      label,
      HOT: hot,
      WARM: warm,
      COLD: cold,
      Unscored: unscored,
    }));
  }, [signals]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
          Signal Velocity
        </h2>
        <p className="text-[11px] text-neutral-300 mt-0.5">New signals discovered per week</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
            cursor={{ fill: '#F5F5F3' }}
          />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Bar dataKey="HOT"      stackId="a" fill="#052EF0" radius={[0, 0, 0, 0]} />
          <Bar dataKey="WARM"     stackId="a" fill="#000000" radius={[0, 0, 0, 0]} />
          <Bar dataKey="COLD"     stackId="a" fill="#D1D5DB" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Unscored" stackId="a" fill="#F0F0ED" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
