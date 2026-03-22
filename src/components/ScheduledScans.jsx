import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Trash2, Plus, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { scheduledScans as scansApi } from '../api/client';

// ─── Status badge ────────────────────────────────────────────────────────────

function LastRunBadge({ scan }) {
  if (!scan.last_run_at) {
    return <span className="text-xs text-neutral-400">Never run</span>;
  }
  const date = new Date(scan.last_run_at);
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <span className="text-xs text-neutral-400">
      Last run {label}
      {scan.last_run_new > 0 && (
        <span className="ml-1.5 text-black font-semibold">+{scan.last_run_new} new</span>
      )}
    </span>
  );
}

// ─── Single scan card ─────────────────────────────────────────────────────────

function ScanCard({ scan, onToggle, onRunNow, onDelete, running }) {
  return (
    <div
      className="bg-white rounded-lg p-5 flex items-center gap-4 transition-shadow hover:shadow-sm"
      style={{ border: `1px solid ${scan.enabled ? '#E5E5E0' : '#F0F0F0'}` }}
    >
      {/* Status dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: scan.enabled ? '#16a34a' : '#D1D5DB' }}
        title={scan.enabled ? 'Active' : 'Paused'}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-black truncate">
            {scan.name}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-300 shrink-0">
            {scan.frequency}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LastRunBadge scan={scan} />
          <span className="text-[10px] text-neutral-300">·</span>
          <span className="text-xs text-neutral-300">
            {scan.days_back}d window · {scan.max_results} max results
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Run Now */}
        <button
          onClick={() => onRunNow(scan)}
          disabled={running === scan.id}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide rounded transition-all disabled:opacity-40"
          style={{
            backgroundColor: running === scan.id ? '#E5E5E0' : '#000',
            color: running === scan.id ? '#999' : '#fff',
          }}
          title="Run this scan now"
        >
          {running === scan.id ? (
            <><Zap className="w-3 h-3 animate-pulse" /> Running...</>
          ) : (
            <><Play className="w-3 h-3" /> Run Now</>
          )}
        </button>

        {/* Toggle enabled */}
        <button
          onClick={() => onToggle(scan)}
          className="p-1.5 rounded transition-colors text-neutral-400 hover:text-black"
          title={scan.enabled ? 'Pause scan' : 'Enable scan'}
        >
          {scan.enabled
            ? <ToggleRight className="w-5 h-5 text-green-600" />
            : <ToggleLeft  className="w-5 h-5" />
          }
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(scan)}
          className="p-1.5 rounded transition-colors text-neutral-300 hover:text-red-500"
          title="Delete scan"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Add scan form ────────────────────────────────────────────────────────────

function AddScanForm({ onAdd, onCancel }) {
  const [name,       setName]       = useState('');
  const [daysBack,   setDaysBack]   = useState(7);
  const [maxResults, setMaxResults] = useState(200);
  const [frequency,  setFrequency]  = useState('daily');
  const [saving,     setSaving]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name, days_back: daysBack, max_results: maxResults, frequency });
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg p-5 space-y-4"
      style={{ border: '2px solid #000' }}
    >
      <h3 className="font-display font-bold text-sm uppercase tracking-widest text-black">New Scan</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">Scan Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly Beauty Scan"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">Scan Window</label>
          <select
            value={daysBack}
            onChange={e => setDaysBack(parseInt(e.target.value))}
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-white rounded disabled:opacity-40"
          style={{ backgroundColor: '#000' }}
        >
          <Plus className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Add Scan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs text-neutral-400 hover:text-black transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScheduledScans({ embedded = false }) {
  const [scans,      setScans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [running,    setRunning]    = useState(null);   // scan.id currently running
  const [runResult,  setRunResult]  = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scansApi.list();
      setScans(res.data.scans || []);
    } catch {
      setError('Failed to load scheduled scans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (scan) => {
    try {
      const res = await scansApi.update(scan.id, { enabled: !scan.enabled });
      setScans(prev => prev.map(s => s.id === scan.id ? res.data : s));
    } catch {
      setError('Failed to update scan.');
    }
  };

  const handleRunNow = async (scan) => {
    setRunning(scan.id);
    setRunResult(null);
    try {
      const res = await scansApi.runNow(scan.id);
      setRunResult(res.data);
      setScans(prev => prev.map(s => s.id === scan.id ? (res.data.scan || s) : s));
    } catch {
      setRunResult({ error: 'Scan failed. Please try again.' });
    } finally {
      setRunning(null);
    }
  };

  const handleAdd = async (data) => {
    try {
      const res = await scansApi.create(data);
      setScans(prev => [...prev, res.data]);
      setShowAdd(false);
    } catch {
      setError('Failed to create scan.');
    }
  };

  const handleDelete = async (scan) => {
    if (!window.confirm(`Delete "${scan.name}"?`)) return;
    try {
      await scansApi.delete(scan.id);
      setScans(prev => prev.filter(s => s.id !== scan.id));
    } catch {
      setError('Failed to delete scan.');
    }
  };

  return (
    <div className={embedded ? 'space-y-5' : 'max-w-7xl mx-auto px-6 py-7 space-y-6'}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          {!embedded && (
            <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
              Scheduled Scans
            </h1>
          )}
          <p className="text-sm text-neutral-400 mt-1">
            Automatically scan USPTO daily for new consumer brand signals · HOT signals trigger an immediate email alert
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide rounded transition-all text-white"
          style={{ backgroundColor: '#000' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Scan
        </button>
      </div>

      {/* ── How it works ── */}
      <div
        className="rounded-lg p-4 flex items-start gap-3"
        style={{ backgroundColor: '#F5F0EB', border: '1px solid #E5E5E0' }}
      >
        <Clock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
        <div className="text-xs text-neutral-500 leading-relaxed">
          <strong className="text-black">Daily at 6:00 AM UTC</strong> — enabled scans run automatically,
          new signals are enriched by Bullish AI, and any HOT brands trigger an immediate email alert.
          Use <strong className="text-black">Run Now</strong> to trigger a scan instantly.
        </div>
      </div>

      {/* ── Run result ── */}
      {runResult && (
        <div
          className="rounded-lg p-4 flex items-center gap-3 text-sm"
          style={{
            backgroundColor: runResult.error ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${runResult.error ? '#FECACA' : '#BBF7D0'}`,
          }}
        >
          {runResult.error
            ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            : <CheckCircle  className="w-4 h-4 text-green-600 shrink-0" />
          }
          {runResult.error ? (
            <span className="text-red-700">{runResult.error}</span>
          ) : (
            <span className="text-green-800">
              Scan complete — <strong>{runResult.new_saved}</strong> new signal{runResult.new_saved !== 1 ? 's' : ''} saved
              {runResult.hot_found > 0 && (
                <span className="ml-1 font-bold" style={{ color: '#052EF0' }}>
                  · 🔵 {runResult.hot_found} HOT brand{runResult.hot_found !== 1 ? 's' : ''} found
                  {runResult.alert_sent && ' — alert sent!'}
                </span>
              )}
            </span>
          )}
          <button onClick={() => setRunResult(null)} className="ml-auto text-neutral-400 hover:text-black text-xs">✕</button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* ── Add form ── */}
      {showAdd && (
        <AddScanForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
      )}

      {/* ── Scan list ── */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-3" style={{ borderColor: '#000' }} />
          <p className="text-neutral-400 text-sm">Loading scans…</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onToggle={handleToggle}
              onRunNow={handleRunNow}
              onDelete={handleDelete}
              running={running}
            />
          ))}
        </div>
      )}
    </div>
  );
}
