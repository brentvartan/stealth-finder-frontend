import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Trash2, Plus, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Zap, Pencil, X, Check, History } from 'lucide-react';
import { scheduledScans as scansApi } from '../api/client';

// ─── Constants ───────────────────────────────────────────────────────────────

const SCAN_TYPES = [
  { value: 'full',        label: 'All Sources'       },
  { value: 'trademark',   label: 'USPTO Only'        },
  { value: 'delaware',    label: 'Delaware + Form D' },
  { value: 'producthunt', label: 'Product Hunt'      },
];

const inputClass  = 'w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black';
const labelClass  = 'text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1';

// ─── Source label helper ──────────────────────────────────────────────────────

function formatSourcesRan(sources) {
  if (!sources) return 'All Sources';
  const map = {
    trademark: 'USPTO',
    delaware:  'Delaware',
    producthunt: 'Product Hunt',
  };
  return sources.split(',').map(s => map[s.trim()] || s.trim()).join(', ');
}

// ─── Run date helper ─────────────────────────────────────────────────────────

function formatRunDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Next run helper ─────────────────────────────────────────────────────────

function getNextRunLabel(scan) {
  if (!scan.enabled) return null;
  const now = new Date();
  const cooldownMs = scan.frequency === 'weekly' ? 140 * 3600000 : 20 * 3600000;
  const lastRun = scan.last_run_at ? new Date(scan.last_run_at) : new Date(0);
  const earliestNext = new Date(lastRun.getTime() + cooldownMs);
  // Roll forward to next 6 AM UTC at or after earliestNext
  let candidate = new Date(earliestNext);
  candidate.setUTCHours(6, 0, 0, 0);
  if (candidate < earliestNext) candidate.setUTCDate(candidate.getUTCDate() + 1);
  const diffMs = candidate - now;
  if (diffMs <= 0) return 'Soon';
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'In < 1 hour';
  if (diffH < 24) return `In ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? 'Tomorrow at 6am UTC' : `In ${diffD} days`;
}

// ─── Run History Panel ────────────────────────────────────────────────────────

function RunHistoryPanel({ scanId }) {
  const [runs,    setRuns]    = useState(null);   // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    scansApi.getRuns(scanId)
      .then(res => {
        if (!cancelled) {
          setRuns(res.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load history.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [scanId]);

  return (
    <div className="mt-3 rounded-b-lg bg-neutral-50 border-t border-neutral-100 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 mb-2">Run History</p>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-neutral-400 py-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-neutral-400" />
          Loading…
        </div>
      )}
      {!loading && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {!loading && !error && runs && runs.length === 0 && (
        <p className="text-xs text-neutral-400 py-1">No runs yet — click Run Now to start</p>
      )}
      {!loading && !error && runs && runs.length > 0 && (
        <ul className="space-y-1.5">
          {runs.map(run => (
            <li key={run.id} className="text-xs text-neutral-500 flex flex-wrap items-center gap-1.5 leading-relaxed">
              <span className="font-medium text-neutral-700">{formatRunDate(run.ran_at)}</span>
              <span className="text-neutral-300">·</span>
              <span className="font-semibold text-black">+{run.new_saved} new</span>
              {run.hot_found  > 0 && <span className="font-bold text-orange-500">🔥{run.hot_found}</span>}
              {run.warm_found > 0 && <span className="font-bold text-yellow-500">🌤{run.warm_found}</span>}
              {run.cold_found > 0 && <span className="text-neutral-400">❄{run.cold_found}</span>}
              {run.sources_ran && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-400">{formatSourcesRan(run.sources_ran)}</span>
                </>
              )}
              {run.alert_sent && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-green-600 font-medium">Alert sent ✓</span>
                </>
              )}
              {run.founders_queued > 0 && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-neutral-400">👤 {run.founders_queued} founder{run.founders_queued !== 1 ? 's' : ''} enriched</span>
                </>
              )}
              {run.error_message && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-yellow-600" title={run.error_message}>⚠ {run.error_message}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Inline EditPanel ────────────────────────────────────────────────────────

function EditPanel({ scan, onSave, onCancel, saving }) {
  const [name,      setName]      = useState(scan.name);
  const [frequency, setFrequency] = useState(scan.frequency || 'daily');
  const [daysBack,  setDaysBack]  = useState(scan.days_back  || 7);
  const [scanType,  setScanType]  = useState(scan.scan_type  || 'full');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), frequency, days_back: daysBack, scan_type: scanType });
  };

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="col-span-4">
          <label className={labelClass}>Scan Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Frequency</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputClass}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Scan Type</label>
          <select value={scanType} onChange={e => setScanType(e.target.value)} className={inputClass}>
            {SCAN_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={labelClass}>Window</label>
          <select value={daysBack} onChange={e => setDaysBack(parseInt(e.target.value))} className={inputClass}>
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wide text-white rounded disabled:opacity-40"
          style={{ backgroundColor: '#052EF0' }}
        >
          <Check className="w-3 h-3" />
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-black transition-colors rounded"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Single scan card ─────────────────────────────────────────────────────────

function ScanCard({ scan, onToggle, onRunNow, onDelete, onEditSave, running }) {
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [showHistory,  setShowHistory]  = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    await onEditSave(scan.id, data);
    setSaving(false);
    setEditing(false);
  };

  const scanTypeLabel = SCAN_TYPES.find(t => t.value === (scan.scan_type || 'full'))?.label || 'All Sources';
  const nextRunLabel  = getNextRunLabel(scan);

  // Last run line
  let lastRunLine = null;
  if (!scan.last_run_at) {
    lastRunLine = <span className="text-xs text-neutral-400">Never run</span>;
  } else {
    const date  = new Date(scan.last_run_at);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    lastRunLine = (
      <span className="text-xs text-neutral-400 flex flex-wrap items-center gap-1">
        Last run {label}
        {scan.last_run_new > 0 && (
          <span className="flex items-center gap-1">
            <span className="ml-0.5">
              <span className="text-black font-semibold">+{scan.last_run_new} new</span>
              {scan.last_run_hot  > 0 && <span className="ml-1 font-bold text-orange-500">🔥{scan.last_run_hot}</span>}
              {scan.last_run_warm > 0 && <span className="ml-1 font-bold text-yellow-500">🌤{scan.last_run_warm}</span>}
              {scan.last_run_cold > 0 && <span className="ml-1 text-neutral-400">❄{scan.last_run_cold}</span>}
            </span>
            {scan.last_founders_queued > 0 && (
              <span className="ml-2 text-xs text-neutral-400">
                · 👤 {scan.last_founders_queued} founder{scan.last_founders_queued > 1 ? 's' : ''} enriched
              </span>
            )}
            {scan.last_alert_sent && (
              <span className="ml-2 text-xs text-green-600 font-medium">
                · ✓ Alert sent
              </span>
            )}
            {scan.last_run_new > 0 && !scan.last_alert_sent && scan.last_run_hot === 0 && (
              <span className="ml-2 text-xs text-neutral-400">· No HOT found</span>
            )}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      className="bg-white rounded-lg transition-shadow hover:shadow-sm"
      style={{ border: `1px solid ${scan.enabled ? '#E5E5E0' : '#F0F0F0'}` }}
    >
      <div className="p-5">
        <div className="flex items-center gap-4">
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
              <span
                className="text-[10px] font-medium uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#F5F5F4', color: '#737373' }}
              >
                {scanTypeLabel}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3">
                {lastRunLine}
                <span className="text-[10px] text-neutral-300">·</span>
                <span className="text-xs text-neutral-300">
                  {scan.days_back}d window
                </span>
              </div>
              {nextRunLabel && (
                <span className="text-[10px] text-neutral-400">
                  Next: {nextRunLabel}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* History */}
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`p-1.5 rounded transition-colors ${showHistory ? 'text-black' : 'text-neutral-400 hover:text-black'}`}
              title="View run history"
            >
              <History className="w-3.5 h-3.5" />
            </button>

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

            {/* Edit */}
            <button
              onClick={() => setEditing(v => !v)}
              className={`p-1.5 rounded transition-colors ${editing ? 'text-black' : 'text-neutral-400 hover:text-black'}`}
              title="Edit scan"
            >
              <Pencil className="w-3.5 h-3.5" />
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

        {/* Cumulative stats bar */}
        {(scan.total_signals > 0) && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-4 text-xs text-neutral-400">
            <span>All-time:</span>
            <span className="font-medium text-neutral-600">{scan.total_signals.toLocaleString()} scanned</span>
            {scan.total_hot > 0 && <span className="text-orange-500 font-bold">🔥 {scan.total_hot} HOT</span>}
            {scan.total_warm > 0 && <span className="text-yellow-600">🌤 {scan.total_warm} WARM</span>}
          </div>
        )}

        {/* Inline edit panel */}
        {editing && (
          <EditPanel
            scan={scan}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        )}
      </div>

      {/* Run history panel */}
      {showHistory && (
        <RunHistoryPanel scanId={scan.id} />
      )}
    </div>
  );
}

// ─── Add scan form ────────────────────────────────────────────────────────────

function AddScanForm({ onAdd, onCancel }) {
  const [name,       setName]       = useState('');
  const [daysBack,   setDaysBack]   = useState(7);
  const [maxResults, setMaxResults] = useState(200);
  const [frequency,  setFrequency]  = useState('daily');
  const [scanType,   setScanType]   = useState('full');
  const [saving,     setSaving]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({ name, days_back: daysBack, max_results: maxResults, frequency, scan_type: scanType });
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
          <label className={labelClass}>Scan Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly Beauty Scan"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Frequency</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputClass}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Scan Type</label>
          <select value={scanType} onChange={e => setScanType(e.target.value)} className={inputClass}>
            {SCAN_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Scan Window</label>
          <select
            value={daysBack}
            onChange={e => setDaysBack(parseInt(e.target.value))}
            className={inputClass}
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
      const runData = res.data;
      setRunResult(runData);
      // Update the scan in the list, patching hot/warm/cold from run result
      setScans(prev => prev.map(s => {
        if (s.id !== scan.id) return s;
        const updatedScan = runData.scan || s;
        return {
          ...updatedScan,
          last_run_hot:  runData.hot_found  ?? updatedScan.last_run_hot,
          last_run_warm: runData.warm_found ?? updatedScan.last_run_warm,
          last_run_cold: runData.cold_found ?? updatedScan.last_run_cold,
        };
      }));
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

  const handleEditSave = async (scanId, data) => {
    try {
      const res = await scansApi.update(scanId, data);
      setScans(prev => prev.map(s => s.id === scanId ? res.data : s));
    } catch {
      setError('Failed to update scan.');
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
            Automatically scan for new consumer brand signals · HOT signals trigger an immediate email alert
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
              {runResult.warm_found > 0 && (
                <span className="ml-1 font-bold text-yellow-600">
                  · 🌤 {runResult.warm_found} WARM
                </span>
              )}
              {runResult.founders_queued > 0 && (
                <span className="ml-1 text-neutral-600">
                  · 👤 {runResult.founders_queued} founder{runResult.founders_queued !== 1 ? 's' : ''} enriched
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
      ) : scans.length === 0 ? (
        <div className="text-center py-16 px-8">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="font-display font-bold uppercase tracking-wide text-lg mb-2">
            Your Daily HOT Signal Feed
          </h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
            Set it once, never miss a brand. Scans run automatically at 6am UTC — new HOT signals trigger an immediate email alert to your team.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-6 py-3 text-white text-sm font-bold uppercase tracking-wide rounded"
            style={{ backgroundColor: '#052EF0' }}
          >
            + Add Your First Scan
          </button>
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
              onEditSave={handleEditSave}
              running={running}
            />
          ))}
        </div>
      )}
    </div>
  );
}
