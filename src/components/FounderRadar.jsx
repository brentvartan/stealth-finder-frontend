import React, { useState, useEffect, useRef, useCallback } from 'react';
import { admin as adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ExternalLink, Upload, Search, RefreshCw, Linkedin, ChevronDown, ChevronUp, Save, CheckCheck } from 'lucide-react';

// ─── Tier badge config ────────────────────────────────────────────────────────

const TIER_CONFIG = {
  DEPARTURE: { label: 'DEPARTURE', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  CONVICTION: { label: 'CONVICTION', bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  ALUMNI:     { label: 'ALUMNI', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  EXEC:       { label: 'EXEC', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
};

const STATUS_CONFIG = {
  building:       { label: 'BUILDING',        icon: '🔥', bg: '#EFF6FF', color: '#052EF0', border: '#052EF0' },
  advisory:       { label: 'ADVISORY',         icon: '★',  bg: '#FFFBEB', color: '#B45309', border: '#D97706' },
  quiet:          { label: 'QUIET',            icon: '○',  bg: '#F9FAFB', color: '#6B7280', border: '#D1D5DB' },
  still_at_brand: { label: 'STILL AT BRAND',  icon: '👁', bg: '#F0FDFA', color: '#0F766E', border: '#0F766E' },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, count, borderColor, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[120px] flex flex-col items-start gap-1 p-4 rounded-lg bg-white transition-all text-left"
      style={{
        border: `2px solid ${active ? borderColor : '#E5E7EB'}`,
        boxShadow: active ? `0 0 0 3px ${borderColor}22` : 'none',
      }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-2xl font-bold" style={{ color: active ? borderColor : '#020A52' }}>
        {count ?? '—'}
      </span>
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
    </button>
  );
}

// ─── Tier / status pill ───────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || { label: tier || '—', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status, knownBrand }) {
  const cfg = STATUS_CONFIG[status] || { label: status || '—', icon: '?', bg: '#F9FAFB', color: '#6B7280', border: '#D1D5DB' };
  const label = status === 'still_at_brand' && knownBrand
    ? `STILL AT ${knownBrand.toUpperCase()}`
    : cfg.label;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.icon} {label}
    </span>
  );
}

// ─── Outreach stage config ────────────────────────────────────────────────────

const OUTREACH_STAGES = [
  { value: 'cold',            label: 'Cold',           color: '#9CA3AF', bg: '#F9FAFB' },
  { value: 'email_sent',      label: 'Email Sent',     color: '#052EF0', bg: '#EFF6FF' },
  { value: 'connected',       label: 'Connected',      color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'had_call',        label: 'Had a Call',     color: '#D97706', bg: '#FFFBEB' },
  { value: 'in_their_corner', label: 'In Their Corner',color: '#16a34a', bg: '#F0FDF4' },
];

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile, onUpdate }) {
  const [outreachStatus, setOutreachStatus] = useState(profile.outreach_status || 'cold');
  const [notes,       setNotes]       = useState(profile.outreach_notes || '');
  const [nextAction,  setNextAction]  = useState(profile.next_action || '');
  const [lastContact, setLastContact] = useState(profile.last_contact || '');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [crmOpen,     setCrmOpen]     = useState(false);

  const isBuilding = profile.status === 'building';
  const currentStage = OUTREACH_STAGES.find(s => s.value === outreachStatus) || OUTREACH_STAGES[0];
  const isDirty = notes !== (profile.outreach_notes || '') ||
                  nextAction !== (profile.next_action || '') ||
                  lastContact !== (profile.last_contact || '');

  const linkedinSearch = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(profile.name + (profile.known_brand ? ' ' + profile.known_brand : ''))}`;

  const handleStatusChange = async (newStatus) => {
    setOutreachStatus(newStatus);
    try {
      await adminApi.updateFounderProfile(profile.id, { outreach_status: newStatus });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleSaveCRM = async () => {
    setSaving(true);
    try {
      await adminApi.updateFounderProfile(profile.id, {
        outreach_notes: notes,
        last_contact:   lastContact || null,
        next_action:    nextAction,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('CRM save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-neutral-200 transition-shadow hover:shadow-md overflow-hidden flex flex-col"
      style={isBuilding ? { borderLeftWidth: 3, borderLeftColor: '#052EF0' } : {}}
    >
      {/* ── Profile section ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-bold text-base leading-tight" style={{ color: '#020A52' }}>
            {profile.name}
          </span>
          <TierBadge tier={profile.tier} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={profile.status} knownBrand={profile.known_brand} />
          {profile.known_brand && (
            <span className="text-xs text-neutral-400">
              ex-<span className="text-neutral-600 font-medium">{profile.known_brand}</span>
            </span>
          )}
        </div>

        {profile.current_company && profile.status !== 'still_at_brand' && (
          <div className="text-sm font-semibold" style={{ color: '#020A52' }}>
            {profile.current_company}
          </div>
        )}

        {profile.bio && (
          <div className="text-xs text-neutral-500 leading-relaxed">
            {profile.bio.slice(0, 90)}{profile.bio.length > 90 ? '…' : ''}
          </div>
        )}

        <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-neutral-100">
          <div className="flex items-center gap-2">
            {profile.follower_count != null && (
              <span className="text-[10px] text-neutral-400">
                {profile.follower_count >= 1000
                  ? `${(profile.follower_count / 1000).toFixed(1)}k`
                  : profile.follower_count} followers
              </span>
            )}
          </div>
          <a
            href={linkedinSearch}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium transition-colors"
            style={{ color: '#0077B5' }}
          >
            <Linkedin className="w-3 h-3" />
            LinkedIn
          </a>
        </div>
      </div>

      {/* ── Relationship CRM ── */}
      <div className="border-t border-neutral-100" style={{ backgroundColor: '#FAFAF8' }}>

        {/* Stage row — always visible */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {OUTREACH_STAGES.map(stage => (
              <button
                key={stage.value}
                onClick={() => handleStatusChange(stage.value)}
                className="px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border leading-none"
                style={outreachStatus === stage.value
                  ? { backgroundColor: stage.color, color: '#fff', borderColor: stage.color }
                  : { backgroundColor: '#fff', color: '#9CA3AF', borderColor: '#E5E7EB' }
                }
              >
                {stage.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCrmOpen(o => !o)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
            title={crmOpen ? 'Close notes' : 'Add notes / next action'}
          >
            {crmOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable notes + next action */}
        {crmOpen && (
          <div className="px-4 pb-3 space-y-2 border-t border-neutral-100 pt-2.5">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes — intro via, context, last conversation..."
              className="w-full text-xs text-neutral-600 bg-white border border-neutral-200 rounded px-2.5 py-2 resize-none focus:outline-none focus:border-[#052EF0] transition-colors placeholder-neutral-300 leading-relaxed"
              rows={notes ? Math.max(2, notes.split('\n').length + 1) : 2}
            />
            <div className="flex gap-2">
              <div className="flex flex-col gap-0.5 flex-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Last Contact</label>
                <input
                  type="date"
                  value={lastContact}
                  onChange={e => setLastContact(e.target.value)}
                  className="text-xs border border-neutral-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#052EF0] transition-colors text-neutral-600 w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Next Action</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={e => setNextAction(e.target.value)}
                  placeholder="e.g. Check in Q3..."
                  className="text-xs border border-neutral-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#052EF0] transition-colors placeholder-neutral-300 text-neutral-600 w-full"
                />
              </div>
            </div>
            {isDirty && (
              <button
                onClick={handleSaveCRM}
                disabled={saving}
                className="w-full py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors text-white"
                style={{ backgroundColor: saving ? '#93C5FD' : '#052EF0' }}
              >
                {saved
                  ? <><CheckCheck className="w-3 h-3" /> Saved</>
                  : saving
                    ? 'Saving...'
                    : <><Save className="w-3 h-3" /> Save Notes</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter pills ─────────────────────────────────────────────────────────────

function Pills({ options, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(isActive ? null : opt.value)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
            style={isActive
              ? { backgroundColor: '#020A52', color: '#F5F0EB', borderColor: '#020A52' }
              : { backgroundColor: 'white', color: '#6B7280', borderColor: '#D1D5DB' }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Import banner ────────────────────────────────────────────────────────────

function ImportBanner({ onImported }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // Accept either { profiles: [...] } or a raw array
      const profiles = Array.isArray(json) ? json : (json.profiles || json.results || []);
      if (!profiles.length) {
        setError('No profiles found in file. Expected a JSON array or { profiles: [...] }.');
        setImporting(false);
        return;
      }

      const res = await adminApi.importFounderProfiles(profiles);
      const { imported, updated } = res.data;
      setResult({ imported, updated, total: profiles.length });
      onImported();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Import failed');
    } finally {
      setImporting(false);
      // Reset file input so same file can be re-imported
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      className="rounded-lg p-4 border-2 border-dashed flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ borderColor: '#052EF0', backgroundColor: '#EFF6FF' }}
    >
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: '#020A52' }}>
          Import Founder Pull
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">
          Upload a <code className="font-mono bg-white px-1 rounded">founder_pull_results.json</code> file to populate Founder Radar.
          Supports raw arrays or <code className="font-mono bg-white px-1 rounded">{"{ profiles: [...] }"}</code>.
        </div>
        {error && (
          <div className="text-xs text-red-600 mt-1 font-medium">{error}</div>
        )}
        {result && (
          <div className="text-xs text-green-700 mt-1 font-medium">
            Done — {result.imported} imported, {result.updated} updated ({result.total} total)
          </div>
        )}
      </div>
      <label
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors shrink-0"
        style={{ backgroundColor: importing ? '#93C5FD' : '#052EF0', color: 'white' }}
      >
        {importing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload JSON
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          disabled={importing}
          onChange={handleFile}
        />
      </label>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TIER_OPTIONS = [
  { value: null,        label: 'ALL' },
  { value: 'DEPARTURE', label: 'DEPARTURE' },
  { value: 'CONVICTION',label: 'CONVICTION' },
  { value: 'ALUMNI',    label: 'ALUMNI' },
  { value: 'EXEC',      label: 'EXEC' },
];

const STATUS_OPTIONS = [
  { value: null,             label: 'ALL' },
  { value: 'building',       label: 'BUILDING' },
  { value: 'advisory',       label: 'ADVISORY' },
  { value: 'quiet',          label: 'QUIET' },
  { value: 'still_at_brand', label: 'MONITORING' },
];

const OUTREACH_OPTIONS = [
  { value: null,              label: 'ALL' },
  { value: 'cold',            label: 'COLD' },
  { value: 'email_sent',      label: 'EMAIL SENT' },
  { value: 'connected',       label: 'CONNECTED' },
  { value: 'had_call',        label: 'HAD A CALL' },
  { value: 'in_their_corner', label: 'IN THEIR CORNER' },
];

export default function FounderRadar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profiles,       setProfiles]       = useState([]);
  const [summary,        setSummary]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [tierFilter,     setTierFilter]     = useState(null);
  const [statusFilter,   setStatusFilter]   = useState(null);
  const [outreachFilter, setOutreachFilter] = useState(null);
  const [searchQ,        setSearchQ]        = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tierFilter)     params.tier             = tierFilter;
      if (statusFilter)   params.status           = statusFilter;
      if (outreachFilter) params.outreach_status  = outreachFilter;
      if (searchQ.trim()) params.q                = searchQ.trim();

      const [profilesRes, summaryRes] = await Promise.all([
        adminApi.getFounderProfiles(params),
        adminApi.getFounderProfilesSummary(),
      ]);
      setProfiles(profilesRes.data.profiles || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('FounderRadar fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [tierFilter, statusFilter, outreachFilter, searchQ]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter, statusFilter, outreachFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ]);

  const handleStatCardClick = (status) => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  const isEmpty = !loading && profiles.length === 0 && !summary?.total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ color: '#020A52' }}>

      {/* ── Header ── */}
      <div className="mb-6">
        <h1
          className="font-display font-bold tracking-tight text-3xl sm:text-4xl uppercase"
          style={{ color: '#020A52' }}
        >
          Founder Radar
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          The operator universe — everyone who built the 97 Bullish-tracked brands. This is your pattern-recognition database: who they are, where they came from, and what they're doing now. When someone shows up 🔥 Building, that's the signal. Add them to Watchlist to actively track.
        </p>
      </div>

      {/* ── Import banner (admin only) ── */}
      {isAdmin && (
        <div className="mb-6">
          <ImportBanner onImported={fetchAll} />
        </div>
      )}

      {/* ── Signal stat cards ── */}
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard icon="🔥" label="Building"   count={summary?.building}      borderColor="#052EF0" active={statusFilter === 'building'}       onClick={() => handleStatCardClick('building')} />
        <StatCard icon="★"  label="Advisory"   count={summary?.advisory}      borderColor="#B45309" active={statusFilter === 'advisory'}       onClick={() => handleStatCardClick('advisory')} />
        <StatCard icon="○"  label="Quiet"      count={summary?.quiet}         borderColor="#9CA3AF" active={statusFilter === 'quiet'}          onClick={() => handleStatCardClick('quiet')} />
        <StatCard icon="👁" label="Monitoring" count={summary?.still_at_brand} borderColor="#0F766E" active={statusFilter === 'still_at_brand'} onClick={() => handleStatCardClick('still_at_brand')} />
      </div>

      {/* ── Outreach pipeline stat cards ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'cold',            label: 'Cold',            icon: '○', color: '#9CA3AF' },
          { value: 'email_sent',      label: 'Email Sent',      icon: '✉', color: '#052EF0' },
          { value: 'connected',       label: 'Connected',       icon: '⚡', color: '#7C3AED' },
          { value: 'had_call',        label: 'Had a Call',      icon: '☎', color: '#D97706' },
          { value: 'in_their_corner', label: 'In Their Corner', icon: '★', color: '#16a34a' },
        ].map(s => {
          const count = summary?.outreach?.[s.value] ?? '—';
          const isActive = outreachFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setOutreachFilter(prev => prev === s.value ? null : s.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border transition-all text-left"
              style={{
                borderColor: isActive ? s.color : '#E5E7EB',
                boxShadow: isActive ? `0 0 0 2px ${s.color}33` : 'none',
              }}
            >
              <span className="text-sm">{s.icon}</span>
              <div>
                <div className="text-sm font-bold leading-none" style={{ color: isActive ? s.color : '#020A52' }}>{count}</div>
                <div className="text-[9px] font-medium text-neutral-400 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-neutral-200 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 w-14">Tier</span>
          <Pills options={TIER_OPTIONS} active={tierFilter} onChange={setTierFilter} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 w-14">Status</span>
          <Pills options={STATUS_OPTIONS} active={statusFilter} onChange={setStatusFilter} />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm border border-neutral-200 rounded-md outline-none focus:border-[#052EF0] focus:ring-1 focus:ring-[#052EF0] transition-colors bg-neutral-50"
          />
        </div>
      </div>

      {/* ── Profile grid / states ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mb-3"
            style={{ borderColor: '#052EF0' }}
          />
          <p className="text-sm text-neutral-400">Loading profiles…</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">📡</div>
          <div className="text-base font-semibold text-neutral-600 mb-1">No profiles imported yet</div>
          <div className="text-sm text-neutral-400">
            {isAdmin
              ? 'Import from the pull JSON above to populate Founder Radar.'
              : 'Ask an admin to import the founder pull.'}
          </div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <div className="text-base font-semibold text-neutral-600 mb-1">No results</div>
          <div className="text-sm text-neutral-400">Try adjusting your filters or search.</div>
        </div>
      ) : (
        <>
          <div className="text-xs text-neutral-400 mb-3">
            {profiles.length} founder{profiles.length !== 1 ? 's' : ''}
            {tierFilter || statusFilter || searchQ ? ' (filtered)' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map(fp => (
              <ProfileCard key={fp.id} profile={fp} onUpdate={fetchAll} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
