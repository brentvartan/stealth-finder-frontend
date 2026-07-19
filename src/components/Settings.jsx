import React, { useState, useEffect, useCallback, useRef } from 'react';
import { settings as settingsApi, admin as adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, Save, Bell, Slack, BarChart2, Clock, Users, CreditCard, RefreshCw, Linkedin, Zap, Search, Database, Mail, Globe, Trash2 } from 'lucide-react';
import ScheduledScans from './ScheduledScans';
import Team from './Team';

// ─── Scheduler health banner ─────────────────────────────────────────────────

function SchedulerHealthBanner() {
  const [status, setStatus] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    adminApi.getSchedulerStatus()
      .then(r => setStatus(r.data))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const healthy = status.is_healthy;
  const bg    = healthy ? 'bg-green-50 border-green-200'   : 'bg-amber-50 border-amber-300';
  const dot   = healthy ? 'bg-green-500'                   : 'bg-amber-500';
  const text  = healthy ? 'text-green-800'                 : 'text-amber-800';
  const sub   = healthy ? 'text-green-600'                 : 'text-amber-600';

  const lastRun = status.last_run
    ? new Date(status.last_run).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-4 ${bg}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>
          {healthy ? 'Scheduler healthy' : 'Scheduler may be lagging'}
        </span>
        <span className={`ml-2 text-xs ${sub}`}>
          Last run: {lastRun}
          {status.hours_since != null && ` · ${status.hours_since}h ago`}
        </span>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors disabled:bg-neutral-50 disabled:text-neutral-400';
const labelClass = 'block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider';

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: '#F2F2F2' }}>
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div>
        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-black">{title}</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Alerts tab ──────────────────────────────────────────────────────────────

function AlertsTab({ isAdmin }) {
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState('');
  const [alertEmails,   setAlertEmails]   = useState([]);
  const [newEmail,      setNewEmail]      = useState('');
  const [slackWebhook,  setSlackWebhook]  = useState('');
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [daysBack,      setDaysBack]      = useState(30);
  const [maxResults,    setMaxResults]    = useState(200);
  const [testingSlack,  setTestingSlack]  = useState(false);
  const [slackTestMsg,  setSlackTestMsg]  = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsApi.get();
      const d = res.data;
      setAlertEmails(d.alert_emails || []);
      setSlackWebhook(d.slack_webhook_url || '');
      setDigestEnabled(d.digest_enabled !== false);
      setDaysBack(d.scan_days_back || 30);
      setMaxResults(d.scan_max_results || 200);
    } catch {
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await settingsApi.update({
        alert_emails:      alertEmails,
        slack_webhook_url: slackWebhook,
        digest_enabled:    digestEnabled,
        scan_days_back:    daysBack,
        scan_max_results:  maxResults,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const e = newEmail.trim().toLowerCase();
    if (e && !alertEmails.includes(e)) {
      setAlertEmails(prev => [...prev, e]);
      setNewEmail('');
    }
  };

  const removeEmail = (email) => setAlertEmails(prev => prev.filter(e => e !== email));

  const handleTestSlack = async () => {
    if (!slackWebhook) return;
    setTestingSlack(true);
    setSlackTestMsg('');
    try {
      await settingsApi.testSlack(slackWebhook);
      setSlackTestMsg('✓ Test message sent');
    } catch (err) {
      setSlackTestMsg('✗ ' + (err.response?.data?.error || 'Failed to send'));
    } finally {
      setTestingSlack(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#052EF0' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
      )}
      {!isAdmin && (
        <div className="p-3 rounded text-xs text-neutral-500 bg-neutral-50 border border-neutral-200">
          You're viewing settings as read-only. Contact an admin to make changes.
        </div>
      )}

      {/* Alert Emails */}
      <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
        <SectionHeader icon={Bell} title="Alert Emails" subtitle="Recipients for HOT signal alerts and weekly digest" />

        <div className="flex flex-wrap gap-2 mb-3">
          {alertEmails.map(email => (
            <div
              key={email}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#F0F4FF', color: '#052EF0', border: '1px solid #C7D4FF' }}
            >
              {email}
              {isAdmin && (
                <button onClick={() => removeEmail(email)} className="hover:opacity-70 transition-opacity ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {alertEmails.length === 0 && (
            <p className="text-xs text-neutral-300 italic">No alert emails configured</p>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="partner@bullish.co"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEmail()}
              className={inputClass}
            />
            <button
              onClick={addEmail}
              disabled={!newEmail.trim()}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded transition-all shrink-0"
              style={{ backgroundColor: !newEmail.trim() ? '#CCC' : '#052EF0' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div>
            <label className={labelClass}>Weekly Digest</label>
            <p className="text-xs text-neutral-400">Send top HOT/WARM signals every Monday at 9am UTC</p>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setDigestEnabled(v => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
              style={{ backgroundColor: digestEnabled ? '#052EF0' : '#E5E5E0' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                style={{ transform: digestEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          ) : (
            <span className="text-xs font-medium" style={{ color: digestEnabled ? '#052EF0' : '#999' }}>
              {digestEnabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>
      </div>

      {/* Slack */}
      <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
        <SectionHeader icon={Slack} title="Slack Integration" subtitle="Post HOT signals to a Slack channel in real time" />

        <div>
          <label className={labelClass}>Incoming Webhook URL</label>
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhook}
            onChange={e => setSlackWebhook(e.target.value)}
            disabled={!isAdmin}
            className={inputClass}
          />
          <p className="text-[10px] text-neutral-300 mt-1">
            Create at api.slack.com/apps → Incoming Webhooks → Add New Webhook
          </p>
        </div>

        {isAdmin && slackWebhook && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="text-xs font-medium px-3 py-1.5 rounded border transition-colors"
              style={{ borderColor: '#E5E5E0', color: testingSlack ? '#999' : '#052EF0' }}
            >
              {testingSlack ? 'Sending...' : 'Send Test Message'}
            </button>
            {slackTestMsg && (
              <span className={`text-xs font-medium ${slackTestMsg.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                {slackTestMsg}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scan Defaults */}
      <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
        <SectionHeader icon={BarChart2} title="Scan Defaults" subtitle="Default parameters for scheduled scans" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Days Back</label>
            <select
              value={daysBack}
              onChange={e => setDaysBack(parseInt(e.target.value))}
              disabled={!isAdmin}
              className={inputClass}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Max Results per Source</label>
            <select
              value={maxResults}
              onChange={e => setMaxResults(parseInt(e.target.value))}
              disabled={!isAdmin}
              className={inputClass}
            >
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-display font-semibold tracking-wider uppercase text-white rounded transition-all"
            style={{ backgroundColor: saving ? '#999' : '#052EF0' }}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Settings saved.</span>}
        </div>
      )}
    </div>
  );
}

// ─── Spend tab (admin only) ───────────────────────────────────────────────────

function SpendStat({ label, value, sub }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-lg p-4">
      <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-black">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SpendTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSpend();
      setData(res.data);
    } catch (e) {
      setError('Could not load spend data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [addingManual,  setAddingManual]  = useState(false);
  const [manualForm,    setManualForm]    = useState({ description: '', category: 'anthropic', date: '', amount: '' });
  const [savingManual,  setSavingManual]  = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);

  const fmt  = (n) => n == null ? '—' : `$${n.toFixed(2)}`;
  const fmtN = (n) => n == null ? '—' : n.toLocaleString();

  const handleAddManual = async (e) => {
    e.preventDefault();
    setSavingManual(true);
    try {
      await adminApi.addManualSpend({
        description: manualForm.description,
        category:    manualForm.category,
        date:        manualForm.date || new Date().toISOString().slice(0, 10),
        amount:      parseFloat(manualForm.amount),
      });
      setManualForm({ description: '', category: 'anthropic', date: '', amount: '' });
      setAddingManual(false);
      await load();
    } catch (err) {
      console.error('Manual spend add failed:', err);
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteManual = async (entryId) => {
    setDeletingId(entryId);
    try {
      await adminApi.deleteManualSpend(entryId);
      await load();
    } catch (err) {
      console.error('Manual spend delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="py-12 text-center text-sm text-neutral-400">Loading spend data…</div>;
  if (error)   return <div className="py-12 text-center text-sm text-red-400">{error}</div>;

  const pc  = data.proxycurl;
  const sa  = data.serpapi;
  const an  = data.anthropic;
  const tot = data.totals;
  const cb  = data.crunchbase || {};
  const rs  = data.resend     || {};

  return (
    <div className="space-y-8">

      {/* All-time summary */}
      <div>
        <SectionHeader icon={CreditCard} title="All Time" subtitle="Cumulative estimated spend since launch" />
        <div className="grid grid-cols-4 gap-3">
          <SpendStat
            label="Founder APIs"
            value={fmt((pc.estimated_cost_all_time || 0) + (sa.estimated_cost_all_time || 0) + (cb.estimated_cost_all_time || 0))}
            sub={`${fmtN((pc.lookups_all_time || 0) + (sa.searches_all_time || 0) + (cb.lookups_all_time || 0))} lookups & searches total`}
          />
          <SpendStat
            label="Claude (Anthropic)"
            value={fmt(an.estimated_cost_all_time)}
            sub={`${fmtN(an.enrichments_all_time)} enrichments · ~${fmt(an.cost_per_enrichment)}/ea`}
          />
          <SpendStat
            label="Email Alerts"
            value={`${fmtN(rs.emails_all_time)} sent`}
            sub={`Free plan · ${rs.plan || '3,000/mo'}`}
          />
          <SpendStat
            label="Total Estimated"
            value={fmt(tot.estimated_cost_all_time)}
            sub="All paid API services combined"
          />
        </div>
      </div>

      {/* This month summary */}
      <div>
        <SectionHeader icon={CreditCard} title="This Month" subtitle="Estimated API spend since the 1st" />
        <div className="grid grid-cols-4 gap-3">
          <SpendStat
            label="Founder APIs"
            value={fmt((pc.estimated_cost_this_month || 0) + (sa.estimated_cost_this_month || 0) + (cb.estimated_cost_this_month || 0))}
            sub={`${fmtN((pc.lookups_this_month || 0) + (sa.searches_this_month || 0) + (cb.lookups_this_month || 0))} lookups & searches`}
          />
          <SpendStat
            label="Claude (Anthropic)"
            value={fmt(an.estimated_cost_this_month)}
            sub={`${fmtN(an.enrichments_this_month)} enrichments this month`}
          />
          <SpendStat
            label="Email Alerts"
            value={`${rs.emails_this_month != null ? fmtN(rs.emails_this_month) : '—'} sent`}
            sub="This month"
          />
          <SpendStat
            label="Total This Month"
            value={fmt(tot.estimated_cost_this_month)}
            sub="All paid API services"
          />
        </div>
      </div>

      {/* Proxycurl detail */}
      <div>
        <SectionHeader icon={Linkedin} title="Proxycurl (LinkedIn)" subtitle="Founder LinkedIn profile lookups — fires on HOT signals with a discovered founder" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SpendStat
            label="Credits Remaining"
            value={pc.credits_available == null ? '—' : fmtN(pc.credits_available)}
            sub={pc.error ? `Error: ${pc.error}` : 'Live from Proxycurl API'}
          />
          <SpendStat
            label="All-Time Lookups"
            value={fmtN(pc.lookups_all_time)}
            sub={`${fmtN(pc.lookups_this_month)} this month · est. ${fmt(pc.estimated_cost_all_time)} total`}
          />
        </div>
        <p className="text-xs text-neutral-300">
          LinkedIn profile fetch fires on HOT signals (score ≥ 70) with a discovered founder.
          ~{fmt(pc.cost_per_lookup)} per profile lookup.{' '}
          <a href="https://nubela.co/proxycurl" target="_blank" rel="noreferrer" className="underline hover:text-neutral-500">nubela.co/proxycurl</a>
        </p>
      </div>

      {/* SerpAPI detail */}
      <div>
        <SectionHeader icon={Search} title="SerpAPI (Founder Discovery)" subtitle="Web search to identify founders behind new brands" />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <SpendStat
            label="Searches Left This Month"
            value={sa.searches_left == null ? '—' : fmtN(sa.searches_left)}
            sub={sa.error ? `Error: ${sa.error}` : `Plan: ${sa.plan_name || 'Free'}`}
          />
          <SpendStat
            label="Monthly Allowance"
            value={sa.searches_per_month == null ? '—' : fmtN(sa.searches_per_month)}
            sub={`${fmtN(sa.this_month_usage || 0)} used so far this month`}
          />
          <SpendStat
            label="App-Tracked Searches"
            value={fmtN(sa.searches_this_month)}
            sub={`${fmtN(sa.searches_all_time)} all-time founder discoveries`}
          />
        </div>
        <p className="text-xs text-neutral-300">
          SerpAPI fires on HOT signals to find founder names via web + Product Hunt search.
          Free plan: 250 searches/month.{' '}
          <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noreferrer" className="underline hover:text-neutral-500">serpapi.com</a>
        </p>
      </div>

      {/* Crunchbase detail */}
      <div>
        <SectionHeader
          icon={Database}
          title="Crunchbase (Company Intelligence)"
          subtitle="Company info, founder names, and funding history for HOT brands"
        />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <SpendStat
            label="Status"
            value={cb.active ? 'Active' : 'Not Configured'}
            sub={cb.active ? 'API key set in Railway' : 'Add CRUNCHBASE_API_KEY to activate'}
          />
          <SpendStat
            label="Lookups This Month"
            value={fmtN(cb.lookups_this_month)}
            sub={`${fmtN(cb.lookups_all_time)} all-time`}
          />
          <SpendStat
            label="Est. Cost"
            value={fmt(cb.estimated_cost_this_month)}
            sub="Depends on Crunchbase plan tier"
          />
        </div>
        <p className="text-xs text-neutral-300">
          Crunchbase fires on HOT signals to retrieve company data, founder identities, and prior funding.
          Active only when <code className="bg-neutral-100 px-1 rounded">CRUNCHBASE_API_KEY</code> is set.{' '}
          <a href="https://data.crunchbase.com/docs/using-the-api" target="_blank" rel="noreferrer"
             className="underline hover:text-neutral-500">data.crunchbase.com</a>
        </p>
      </div>

      {/* Anthropic detail */}
      <div>
        <SectionHeader icon={Zap} title="Anthropic (Claude)" subtitle="Signal enrichment and founder re-scoring" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SpendStat
            label="All-Time Enrichments"
            value={fmtN(an.enrichments_all_time)}
            sub={`Est. total cost: ${fmt(an.estimated_cost_all_time)}`}
          />
          <SpendStat
            label="Cost Per Signal"
            value={fmt(an.cost_per_enrichment)}
            sub="Claude Sonnet (full enrichment)"
          />
        </div>
        <p className="text-xs text-neutral-300">
          Estimates are based on average token usage. Check{' '}
          <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer"
            className="underline hover:text-neutral-500">console.anthropic.com</a>{' '}
          for exact billing.
        </p>
      </div>

      {/* Resend detail */}
      <div>
        <SectionHeader
          icon={Mail}
          title="Resend (Email Alerts)"
          subtitle="HOT signal alerts, founder enrichment notifications, weekly digests"
        />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SpendStat
            label="Alerts Sent This Month"
            value={rs.emails_this_month != null ? fmtN(rs.emails_this_month) : '—'}
            sub={rs.error ? `Error: ${rs.error}` : `Plan: ${rs.plan || 'Free (3,000/mo)'}`}
          />
          <SpendStat
            label="All-Time Alerts"
            value={fmtN(rs.emails_all_time)}
            sub="HOT signal scan alerts only (excludes invites, resets)"
          />
        </div>
        <p className="text-xs text-neutral-300">
          Free plan covers 3,000 emails/month (100/day limit). Includes HOT brand alerts, founder enrichment
          notifications, and Monday weekly digests.{' '}
          <a href="https://resend.com/overview" target="_blank" rel="noreferrer"
             className="underline hover:text-neutral-500">resend.com</a>
        </p>
      </div>

      {/* Manual spend log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={CreditCard} title="Manual Spend Log" subtitle="One-time costs not tracked automatically — LinkedIn scrapes, Anthropic top-ups, etc." />
          <button
            onClick={() => setAddingManual(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors"
            style={{ borderColor: '#052EF0', color: '#052EF0' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Log Expense
          </button>
        </div>

        {addingManual && (
          <form onSubmit={handleAddManual} className="bg-white border border-neutral-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. LinkedIn founder scrape for FounderRadar initial import"
                value={manualForm.description}
                onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Category</label>
              <select
                value={manualForm.category}
                onChange={e => setManualForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="linkedin">LinkedIn / Proxycurl</option>
                <option value="serpapi">SerpAPI</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                value={manualForm.date}
                onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Amount (USD)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="75.00"
                value={manualForm.amount}
                onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0]"
              />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setAddingManual(false)} className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-black transition-colors">Cancel</button>
              <button
                type="submit"
                disabled={savingManual}
                className="px-4 py-2 text-xs font-semibold rounded text-white transition-colors"
                style={{ backgroundColor: savingManual ? '#93C5FD' : '#052EF0' }}
              >
                {savingManual ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}

        {data.manual_spend?.entries?.length > 0 ? (
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid #E5E5E0' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: '#F9F9F8' }}>
                  {['Date', 'Description', 'Category', 'Amount', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data.manual_spend.entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-400 font-mono">{entry.date}</td>
                    <td className="px-4 py-3 text-neutral-700">{entry.description}</td>
                    <td className="px-4 py-3 text-neutral-400 capitalize">{entry.category}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-black">${entry.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteManual(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-neutral-300 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-neutral-50">
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-neutral-500 text-right">Total logged</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-black">${data.manual_spend.total.toFixed(2)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          !addingManual && (
            <p className="text-xs text-neutral-300 italic">No manual entries yet. Use "Log Expense" to record one-time costs.</p>
          )
        )}
      </div>

      {/* Rate card */}
      <div>
        <SectionHeader icon={BarChart2} title="Rate Card" subtitle="Per-unit cost by data source — updated manually when pricing changes" />
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid #E5E5E0' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#F9F9F8' }}>
                {['Source', 'What it does', 'Triggers when', 'Unit cost', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {[
                {
                  source: 'USPTO TESS',
                  what:   'New trademark filings',
                  when:   'Every scheduled scan',
                  cost:   'Free',
                  active: true,
                },
                {
                  source: 'SEC EDGAR (Form D)',
                  what:   'Reg D fundraise filings (all 50 states)',
                  when:   'Every scheduled scan',
                  cost:   'Free',
                  active: true,
                },
                {
                  source: 'Product Hunt',
                  what:   'New product launches',
                  when:   'Every scheduled scan',
                  cost:   'Free',
                  active: true,
                },
                {
                  source: 'Brand Website Scraping',
                  what:   'About/Team page — direct founder name + LinkedIn URL extraction',
                  when:   'Auto on HOT signals (before LinkedIn lookup)',
                  cost:   'Free',
                  active: true,
                },
                {
                  source: 'Crunchbase',
                  what:   'Company intel: founders, funding history, prior backing',
                  when:   'Auto on HOT signals with discovered founder',
                  cost:   cb.active ? 'Varies by plan' : 'Not configured',
                  active: cb.active || false,
                },
                {
                  source: 'SerpAPI',
                  what:   'Founder name discovery (web + Product Hunt search)',
                  when:   'Auto on HOT signals (score ≥ 70)',
                  cost:   'Free (250/mo) · ~$0.01 overage',
                  active: true,
                },
                {
                  source: 'Proxycurl (NinjaPear)',
                  what:   'LinkedIn founder profile lookup',
                  when:   'Auto on HOT signals with discovered founder',
                  cost:   `~${fmt(pc.cost_per_lookup)} / profile`,
                  active: true,
                },
                {
                  source: 'Anthropic (Claude Sonnet)',
                  what:   'Full signal enrichment + scoring',
                  when:   'Score button / batch enrich',
                  cost:   `~${fmt(an.cost_per_enrichment)} / signal`,
                  active: true,
                },
                {
                  source: 'Anthropic (Claude Haiku)',
                  what:   'Founder re-score after LinkedIn enrichment',
                  when:   'Auto after HOT LinkedIn hit',
                  cost:   '~$0.005 / re-score',
                  active: true,
                },
                {
                  source: 'Resend',
                  what:   'HOT alert emails, founder notifications, weekly digests',
                  when:   'On HOT signals, founder score ≥ 75, every Monday',
                  cost:   'Free (3,000/mo)',
                  active: true,
                },
              ].map(row => (
                <tr key={row.source} className="hover:bg-neutral-50 transition-colors">
                  <td className={`px-4 py-3 font-semibold ${row.active === false ? 'text-neutral-300' : 'text-black'}`}>{row.source}</td>
                  <td className={`px-4 py-3 ${row.active === false ? 'text-neutral-400' : 'text-neutral-500'}`}>{row.what}</td>
                  <td className={`px-4 py-3 ${row.active === false ? 'text-neutral-400' : 'text-neutral-400'}`}>{row.when}</td>
                  <td className="px-4 py-3 font-mono font-medium" style={{ color: row.cost === 'Free' || row.cost.startsWith('Free') ? '#16A34A' : row.active === false ? '#9CA3AF' : '#374151' }}>{row.cost}</td>
                  <td className="px-4 py-3">
                    {row.active === false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-neutral-100 text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-green-50 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        On
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh + timestamp */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <p className="text-xs text-neutral-300">
          Last refreshed: {data.generated_at ? new Date(data.generated_at).toLocaleTimeString() : '—'}
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

    </div>
  );
}

// ─── Consumer Deals watchlist bulk import (inside ToolsTab) ─────────────────

const CONSUMER_DEALS_BRANDS = [
  { name: "On Running",        category: "Footwear",   deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 11000, what_they_do: "Performance running footwear" },
  { name: "Alo Yoga",          category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 10000, what_they_do: "Premium yoga and athleisure apparel" },
  { name: "Celsius",           category: "Beverage",   deal_type: "Public",      acquirer: "Public Markets",  year: null, valuation_m: 10000, what_they_do: "Fitness-focused energy drinks" },
  { name: "Chobani",           category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 10000, what_they_do: "Greek yogurt and food products" },
  { name: "Chewy",             category: "Pet",        deal_type: "IPO",         acquirer: "Public Markets",  year: 2019, valuation_m: 8700,  what_they_do: "Online pet products retailer" },
  { name: "Peloton",           category: "Fitness",    deal_type: "Public",      acquirer: "Public Markets",  year: null, valuation_m: 8000,  what_they_do: "Connected fitness bikes and content" },
  { name: "e.l.f. Beauty",     category: "Beauty",     deal_type: "Public",      acquirer: "Public Markets",  year: null, valuation_m: 7000,  what_they_do: "Accessible prestige beauty brand" },
  { name: "Warby Parker",      category: "Eyewear",    deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 6000,  what_they_do: "DTC eyewear brand" },
  { name: "BodyArmor",         category: "Beverage",   deal_type: "Acquisition", acquirer: "Coca-Cola",       year: 2021, valuation_m: 5600,  what_they_do: "Sports hydration drink" },
  { name: "Vuori",             category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 4000,  what_they_do: "Premium performance apparel" },
  { name: "Oura",              category: "Wearables",  deal_type: "Private",     acquirer: "",                year: null, valuation_m: 5200,  what_they_do: "Smart health ring / wearable" },
  { name: "Kind Snacks",       category: "Food",       deal_type: "Acquisition", acquirer: "Mars",            year: 2020, valuation_m: 5000,  what_they_do: "Nut and fruit-based snack bars" },
  { name: "Fabletics",         category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 3500,  what_they_do: "Activewear subscription brand" },
  { name: "Figs",              category: "Apparel",    deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 3000,  what_they_do: "Premium medical scrubs brand" },
  { name: "Allbirds",          category: "Footwear",   deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 2500,  what_they_do: "Sustainable wool and eucalyptus sneakers" },
  { name: "Skims",             category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 4000,  what_they_do: "Shapewear and loungewear (Kim Kardashian)" },
  { name: "Whoop",             category: "Wearables",  deal_type: "Private",     acquirer: "",                year: null, valuation_m: 3600,  what_they_do: "Fitness wearable for athletes" },
  { name: "Beats",             category: "Consumer Tech", deal_type: "Acquisition", acquirer: "Apple",        year: 2014, valuation_m: 3000,  what_they_do: "Headphones and audio products" },
  { name: "Therabody",         category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1800,  what_they_do: "Percussive therapy / Theragun devices" },
  { name: "Savage X Fenty",    category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1000,  what_they_do: "Inclusive lingerie brand (Rihanna)" },
  { name: "HeyDude",           category: "Footwear",   deal_type: "Acquisition", acquirer: "Crocs",           year: 2022, valuation_m: 2500,  what_they_do: "Casual lightweight footwear" },
  { name: "Rare Beauty",       category: "Beauty",     deal_type: "Private",     acquirer: "",                year: null, valuation_m: 2000,  what_they_do: "Inclusive makeup brand (Selena Gomez)" },
  { name: "Bombas",            category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1000,  what_they_do: "Mission-driven premium socks and basics" },
  { name: "Poppi",             category: "Beverage",   deal_type: "Acquisition", acquirer: "PepsiCo",         year: 2025, valuation_m: 1950,  what_they_do: "Prebiotic soda with apple cider vinegar" },
  { name: "Olipop",            category: "Beverage",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1850,  what_they_do: "Prebiotic and gut-health soda" },
  { name: "Glossier",          category: "Beauty",     deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1800,  what_they_do: "Gen Z DTC beauty brand" },
  { name: "Bloom Nutrition",   category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 700,   what_they_do: "Greens and women's nutrition supplements" },
  { name: "Alani Nu",          category: "Beverage",   deal_type: "Acquisition", acquirer: "Celsius",         year: 2025, valuation_m: 1800,  what_they_do: "Women's fitness energy drinks and supplements" },
  { name: "DECIEM",            category: "Beauty",     deal_type: "Acquisition", acquirer: "Estee Lauder",    year: 2021, valuation_m: 2200,  what_they_do: "Parent of The Ordinary skincare brand" },
  { name: "BarkBox",           category: "Pet",        deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 1600,  what_they_do: "Monthly dog toy and treat subscription" },
  { name: "NotCo",             category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1500,  what_they_do: "AI-driven plant-based food brand" },
  { name: "Ruggable",          category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1500,  what_they_do: "Machine-washable DTC rugs" },
  { name: "Magic Spoon",       category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 700,   what_they_do: "Better-for-you high-protein cereal" },
  { name: "Feastables",        category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 600,   what_they_do: "Chocolate bars (MrBeast brand)" },
  { name: "Athleta",           category: "Apparel",    deal_type: "Subsidiary",  acquirer: "Gap Inc",         year: null, valuation_m: 1200,  what_they_do: "Women's performance apparel (Gap subsidiary)" },
  { name: "Honest Company",    category: "Baby/Home",  deal_type: "IPO",         acquirer: "Public Markets",  year: 2021, valuation_m: 1500,  what_they_do: "Clean baby and personal care products" },
  { name: "Harry's",           category: "Grooming",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1700,  what_they_do: "DTC men's shaving and grooming brand" },
  { name: "Liquid Death",      category: "Beverage",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1400,  what_they_do: "Mountain water in tallboy cans — anti-brand brand" },
  { name: "The Farmer's Dog",  category: "Pet",        deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1800,  what_they_do: "Fresh human-grade dog food subscription" },
  { name: "Gymshark",          category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1300,  what_they_do: "Fitness apparel built through influencer community" },
  { name: "Chomps",            category: "Food",       deal_type: "Acquisition", acquirer: "Keurig Dr Pepper", year: 2024, valuation_m: 800,  what_they_do: "Clean-label meat sticks / beef jerky" },
  { name: "Athletic Brewing",  category: "Beverage",   deal_type: "Acquisition", acquirer: "Keurig Dr Pepper", year: 2024, valuation_m: 800,  what_they_do: "Non-alcoholic craft beer" },
  { name: "Daily Harvest",     category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1200,  what_they_do: "Plant-based meal delivery subscription" },
  { name: "Dollar Shave Club", category: "Grooming",   deal_type: "Acquisition", acquirer: "Unilever",        year: 2016, valuation_m: 1000,  what_they_do: "Razor and grooming subscription" },
  { name: "Quest Nutrition",   category: "Food",       deal_type: "Acquisition", acquirer: "Simply Good Foods", year: 2019, valuation_m: 1000, what_they_do: "High-protein bars, chips, and nutrition" },
  { name: "Rhode",             category: "Beauty",     deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1000,  what_they_do: "Skincare brand (Hailey Bieber)" },
  { name: "AG1",               category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1200,  what_they_do: "Comprehensive daily nutritional drink" },
  { name: "Cirkul",            category: "Beverage",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 1000,  what_they_do: "Flavor-cartridge water bottle subscription" },
  { name: "Rothy's",           category: "Footwear",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 700,   what_they_do: "Sustainable flats made from recycled plastic" },
  { name: "Manscaped",         category: "Grooming",   deal_type: "SPAC",        acquirer: "Nasdaq",          year: 2023, valuation_m: 1000,  what_they_do: "Men's below-the-waist grooming brand" },
  { name: "Eight Sleep",       category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 500,   what_they_do: "Smart mattress cover for sleep optimization" },
  { name: "Article",           category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 600,   what_they_do: "DTC modern furniture brand" },
  { name: "Nom Nom",           category: "Pet",        deal_type: "Acquisition", acquirer: "Mars Petcare",    year: 2022, valuation_m: 500,   what_they_do: "Fresh human-grade dog and cat food" },
  { name: "True Classic",      category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 500,   what_they_do: "Premium basics for men — DTC" },
  { name: "HexClad",           category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 500,   what_they_do: "Hybrid stainless and non-stick cookware" },
  { name: "Ritual",            category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 400,   what_they_do: "Transparent traceable vitamin supplements" },
  { name: "Nutrafol",          category: "Wellness",   deal_type: "Acquisition", acquirer: "Unilever",        year: 2022, valuation_m: 1000,  what_they_do: "Hair wellness supplements" },
  { name: "Kodiak Cakes",      category: "Food",       deal_type: "Acquisition", acquirer: "L Catterton",     year: 2021, valuation_m: 500,   what_they_do: "High-protein whole grain pancake and waffle mixes" },
  { name: "Reformation",       category: "Apparel",    deal_type: "Acquisition", acquirer: "Permira",         year: 2020, valuation_m: 1000,  what_they_do: "Sustainable women's fashion brand" },
  { name: "Brooklinen",        category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 500,   what_they_do: "DTC luxury sheets and bedding" },
  { name: "Quip",              category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 400,   what_they_do: "DTC electric toothbrush subscription" },
  { name: "Lovevery",          category: "Kids",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 800,   what_they_do: "Science-based children's toy subscription" },
  { name: "Simple Mills",      category: "Food",       deal_type: "Acquisition", acquirer: "Flowers Foods",   year: 2025, valuation_m: 900,   what_they_do: "Clean-label almond flour snacks and baking mixes" },
  { name: "Huel",              category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 500,   what_they_do: "Nutritionally complete meal replacement (UK)" },
  { name: "Banza",             category: "Food",       deal_type: "Acquisition", acquirer: "Sovos Brands",    year: 2020, valuation_m: 300,   what_they_do: "Chickpea-based pasta and rice" },
  { name: "Liquid I.V.",       category: "Beverage",   deal_type: "Acquisition", acquirer: "Unilever",        year: 2020, valuation_m: 700,   what_they_do: "Electrolyte hydration multiplier" },
  { name: "Beis",              category: "Accessories", deal_type: "Private",    acquirer: "",                year: null, valuation_m: 400,   what_they_do: "Travel accessories (Shay Mitchell brand)" },
  { name: "Once Upon a Farm",  category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 300,   what_they_do: "Organic cold-pressed baby and kids food" },
  { name: "Our Place",         category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 300,   what_they_do: "Always Pan — multicultural cookware brand" },
  { name: "Catalina Crunch",   category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Keto-friendly cereal and snacks" },
  { name: "David Protein",     category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 150,   what_they_do: "Premium protein bar (Peter Rahal)" },
  { name: "MeUndies",          category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Fabric-obsessed underwear subscription" },
  { name: "Parachute",         category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 400,   what_they_do: "DTC luxury home textiles and bedding" },
  { name: "Cuts Clothing",     category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Premium men's T-shirts and basics" },
  { name: "Seed",              category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 300,   what_they_do: "Daily synbiotic probiotic supplement" },
  { name: "Super Coffee",      category: "Beverage",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 400,   what_they_do: "Protein-enhanced coffee drinks" },
  { name: "SmartSweets",       category: "Food",       deal_type: "Acquisition", acquirer: "TPG Growth",      year: 2021, valuation_m: 360,   what_they_do: "Low-sugar candy that tastes like the real thing" },
  { name: "Caraway",           category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 300,   what_they_do: "Ceramic non-stick cookware — DTC" },
  { name: "Hello Products",    category: "Beauty",     deal_type: "Acquisition", acquirer: "Colgate-Palmolive", year: 2020, valuation_m: 300, what_they_do: "Natural oral care — toothpaste and mouthwash" },
  { name: "Chamberlain Coffee", category: "Beverage",  deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Coffee brand (Emma Chamberlain)" },
  { name: "Wild",              category: "Beauty",     deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Refillable natural deodorant (UK)" },
  { name: "Graza",             category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 100,   what_they_do: "Single-origin olive oil in squeeze bottle" },
  { name: "Outdoor Voices",    category: "Apparel",    deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Activity-focused casual activewear brand" },
  { name: "Magic Mind",        category: "Beverage",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 50,    what_they_do: "Productivity matcha shot with adaptogens" },
  { name: "Perfect Bar",       category: "Food",       deal_type: "Acquisition", acquirer: "Nestle",          year: 2019, valuation_m: 300,   what_they_do: "Refrigerated whole-food protein bar" },
  { name: "Fly By Jing",       category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 100,   what_they_do: "Authentic Sichuan chili crisp and sauces" },
  { name: "Burrow",            category: "Home",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 200,   what_they_do: "Modular furniture DTC — build-anywhere sofa" },
  { name: "Ollie",             category: "Pet",        deal_type: "Private",     acquirer: "",                year: null, valuation_m: 400,   what_they_do: "Fresh human-grade dog food subscription" },
  { name: "Marine Layer",      category: "Apparel",    deal_type: "Acquisition", acquirer: "Freestyle Solutions", year: 2020, valuation_m: 100, what_they_do: "Ultra-soft basics — California casual lifestyle" },
  { name: "Moon Juice",        category: "Wellness",   deal_type: "Private",     acquirer: "",                year: null, valuation_m: 150,   what_they_do: "Adaptogenic supplements and beauty food" },
  { name: "Lalo",              category: "Kids",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 100,   what_they_do: "Modern baby gear for millennial parents" },
  { name: "Mid-Day Squares",   category: "Food",       deal_type: "Private",     acquirer: "",                year: null, valuation_m: 80,    what_they_do: "Functional chocolate protein bars (Canada)" },
  { name: "Stasher",           category: "Home",       deal_type: "Acquisition", acquirer: "SC Johnson",      year: 2023, valuation_m: 150,   what_they_do: "Platinum silicone reusable food storage bags" },
  { name: "Care/of",           category: "Wellness",   deal_type: "Acquisition", acquirer: "Bayer",           year: 2019, valuation_m: 225,   what_they_do: "Personalized vitamin packs — shut down 2024" },
  { name: "Primal Kitchen",    category: "Food",       deal_type: "Acquisition", acquirer: "Kraft Heinz",     year: 2019, valuation_m: 200,   what_they_do: "Paleo/keto condiments and sauces" },
  { name: "Cocofloss",         category: "Beauty",     deal_type: "Private",     acquirer: "",                year: null, valuation_m: 50,    what_they_do: "Premium coconut-oil infused dental floss" },
  { name: "Native",            category: "Beauty",     deal_type: "Acquisition", acquirer: "P&G",             year: 2017, valuation_m: 100,   what_they_do: "Natural deodorant — clean personal care" },
];

function WatchlistBulkImportSection() {
  const [status,  setStatus]  = useState(null); // null | { added, skipped }
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');

  const handleImport = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await adminApi.bulkImportWatchlist(CONSUMER_DEALS_BRANDS);
      setStatus(res.data);
      setMsg(`✓ Done — ${res.data.added.length} brands added, ${res.data.skipped.length} already on watchlist.`);
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Import failed'));
    } finally {
      setLoading(false);
    }
  };

  const alreadyDone = status && status.added.length === 0 && status.skipped.length > 0;

  return (
    <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
      <SectionHeader
        icon={Database}
        title="Consumer Deals Watchlist"
        subtitle={`Bulk-add all ${CONSUMER_DEALS_BRANDS.length} brands from the Recent Consumer Deals list to your Watchlist`}
      />
      <div className="mt-4">
        {status && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-3 text-center" style={{ background: '#f0fdf4' }}>
              <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{status.added.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Added</div>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: '#f8f8f6' }}>
              <div className="text-2xl font-bold text-neutral-400">{status.skipped.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Already on watchlist</div>
            </div>
          </div>
        )}
        <button
          onClick={handleImport}
          disabled={loading || alreadyDone}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity"
          style={{ background: alreadyDone ? '#6b7280' : '#052EF0' }}
        >
          <Database size={14} />
          {loading ? 'Importing…' : alreadyDone ? 'All brands already imported' : `Import ${CONSUMER_DEALS_BRANDS.length} brands to Watchlist`}
        </button>
        {msg && (
          <p className={`text-xs mt-2 ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
        )}
        <p className="text-xs text-neutral-400 mt-3">
          Imports On Running, Poppi, Gymshark, Eight Sleep, Vuori, Olipop, and 91 more notable consumer brands
          from the Recent Consumer Deals spreadsheet. Skips brands already on the watchlist.
        </p>
      </div>
    </div>
  );
}

// ─── Inbox Audit section (inside ToolsTab) ───────────────────────────────────

function InboxAuditSection() {
  const [auditData,    setAuditData]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [running,      setRunning]      = useState(false);
  const [msg,          setMsg]          = useState('');
  const [brandInput,   setBrandInput]   = useState('');
  const [showInput,    setShowInput]    = useState(false);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLatestInboxAudit();
      setAuditData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setAuditData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLatest(); }, [loadLatest]);

  const handleRunAudit = async () => {
    const lines = brandInput.split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) {
      setMsg('✗ Paste at least one brand name.');
      return;
    }
    setRunning(true);
    setMsg('');
    try {
      const res = await adminApi.runInboxAudit(lines);
      setAuditData(res.data);
      setShowInput(false);
      setBrandInput('');
      setMsg(`✓ Audit complete — ${res.data.total_checked} brands checked.`);
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Audit failed'));
    } finally {
      setRunning(false);
    }
  };

  const coverageColor = auditData
    ? auditData.coverage_pct >= 80 ? '#16a34a'
      : auditData.coverage_pct >= 50 ? '#d97706'
      : '#dc2626'
    : '#6b7280';

  return (
    <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
      <SectionHeader
        icon={Mail}
        title="Deals Inbox Audit"
        subtitle="Check which consumer brands from your Gmail Deals inbox are NOT in the signal database. Runs automatically on the 1st of each month via scheduled task."
      />

      {/* Latest result summary */}
      {loading && <p className="text-sm text-neutral-400">Loading last audit…</p>}

      {!loading && auditData && (
        <div className="mb-5">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded p-3 text-center" style={{ background: '#F7F7F5', border: '1px solid #E5E5E0' }}>
              <div className="text-xl font-bold text-black">{auditData.total_checked}</div>
              <div className="text-xs text-neutral-400 mt-0.5">Brands Checked</div>
            </div>
            <div className="rounded p-3 text-center" style={{ background: '#F7F7F5', border: '1px solid #E5E5E0' }}>
              <div className="text-xl font-bold" style={{ color: '#16a34a' }}>{auditData.found_count}</div>
              <div className="text-xs text-neutral-400 mt-0.5">Found in DB</div>
            </div>
            <div className="rounded p-3 text-center" style={{ background: '#F7F7F5', border: '1px solid #E5E5E0' }}>
              <div className="text-xl font-bold" style={{ color: '#dc2626' }}>{auditData.missing_count}</div>
              <div className="text-xs text-neutral-400 mt-0.5">Missed by Scanner</div>
            </div>
            <div className="rounded p-3 text-center" style={{ background: '#F7F7F5', border: '1px solid #E5E5E0' }}>
              <div className="text-xl font-bold" style={{ color: coverageColor }}>{auditData.coverage_pct}%</div>
              <div className="text-xs text-neutral-400 mt-0.5">Coverage</div>
            </div>
          </div>

          {auditData.missing?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Missed Brands</p>
              <div className="rounded overflow-hidden" style={{ border: '1px solid #FEE2E2' }}>
                {auditData.missing.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                    style={{ background: i % 2 === 0 ? '#FFF7F7' : '#FFFFFF', borderBottom: i < auditData.missing.length - 1 ? '1px solid #FEE2E2' : 'none' }}
                  >
                    <span className="font-medium text-black">{b.name}</span>
                    <span className="text-xs text-neutral-400">not in signal DB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditData.found?.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-600">
                Show {auditData.found.length} brand{auditData.found.length !== 1 ? 's' : ''} found in DB
              </summary>
              <div className="mt-2 rounded overflow-hidden" style={{ border: '1px solid #DCFCE7' }}>
                {auditData.found.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center px-3 py-2 text-sm"
                    style={{ background: i % 2 === 0 ? '#F0FDF4' : '#FFFFFF', borderBottom: i < auditData.found.length - 1 ? '1px solid #DCFCE7' : 'none' }}
                  >
                    <span className="text-green-700 mr-2">✓</span>
                    <span className="text-black">{b.name}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <p className="text-xs text-neutral-300 mt-3">
            Last run: {new Date(auditData.run_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}

      {!loading && !auditData && (
        <p className="text-sm text-neutral-400 mb-4">No audit has been run yet. Paste brand names below to run your first check.</p>
      )}

      {/* Manual run controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowInput(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider text-white rounded transition-all"
          style={{ backgroundColor: '#052EF0' }}
        >
          <Mail className="w-3.5 h-3.5" />
          {showInput ? 'Cancel' : 'Run Manual Audit'}
        </button>
        {auditData && (
          <button
            onClick={loadLatest}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        )}
      </div>

      {showInput && (
        <div className="mt-4">
          <label className={labelClass}>Brand Names (one per line)</label>
          <textarea
            value={brandInput}
            onChange={e => setBrandInput(e.target.value)}
            placeholder={"Filament\nStripes Beauty\nMosh\nCalifornia Naturals\nExperiment Beauty"}
            rows={8}
            className="w-full border border-neutral-200 rounded px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#052EF0] transition-colors resize-y"
          />
          <p className="text-xs text-neutral-400 mt-1.5 mb-3">
            Paste brand names from your Deals inbox — one per line. The audit checks each against the signal database.
          </p>
          <button
            onClick={handleRunAudit}
            disabled={running || !brandInput.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider text-white rounded transition-all disabled:opacity-50"
            style={{ backgroundColor: running ? '#999' : '#020A52' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running…' : 'Run Audit'}
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-sm font-medium mt-3 ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ─── Tools tab ───────────────────────────────────────────────────────────────

function ToolsTab() {
  const [pressRunning,    setPressRunning]    = useState(false);
  const [pressMsg,        setPressMsg]        = useState('');
  const [domainRunning,   setDomainRunning]   = useState(false);
  const [domainMsg,       setDomainMsg]       = useState('');

  const handleRunPress = async () => {
    setPressRunning(true);
    setPressMsg('');
    try {
      const res = await adminApi.runPressMonitor();
      setPressMsg('✓ ' + res.data.message);
    } catch (err) {
      setPressMsg('✗ ' + (err.response?.data?.error || 'Request failed'));
    } finally {
      setPressRunning(false);
    }
  };

  const handleCheckDomains = async () => {
    setDomainRunning(true);
    setDomainMsg('');
    try {
      const res = await adminApi.checkAllDomains();
      setPressMsg('');
      setDomainMsg('✓ ' + res.data.message);
    } catch (err) {
      setDomainMsg('✗ ' + (err.response?.data?.error || 'Request failed'));
    } finally {
      setDomainRunning(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Press Monitor */}
      <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
        <SectionHeader
          icon={Search}
          title="Trade Press Monitor"
          subtitle="Scan 21 consumer trade publications and cross-reference against all brands in your DB. Runs automatically every Thursday at 08:00 UTC."
        />
        <div className="flex items-center gap-4">
          <button
            onClick={handleRunPress}
            disabled={pressRunning}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider text-white rounded transition-all disabled:opacity-50"
            style={{ backgroundColor: pressRunning ? '#999' : '#052EF0' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pressRunning ? 'animate-spin' : ''}`} />
            {pressRunning ? 'Starting…' : 'Run Press Scan Now'}
          </button>
          {pressMsg && (
            <p className={`text-sm font-medium ${pressMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {pressMsg}
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Results appear in Signal Detail → Press Coverage within ~2 minutes. Brands with hits get a{' '}
          <span className="font-bold" style={{ color: '#0A5C36' }}>PRESS</span> badge on their card.
        </p>
      </div>

      {/* Domain Checker */}
      <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
        <SectionHeader
          icon={Database}
          title="Domain Status Checker"
          subtitle="Retroactively check domain status for all existing domain signals that haven't been crawled yet. New domain signals are checked automatically."
        />
        <div className="flex items-center gap-4">
          <button
            onClick={handleCheckDomains}
            disabled={domainRunning}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider text-white rounded transition-all disabled:opacity-50"
            style={{ backgroundColor: domainRunning ? '#999' : '#020A52' }}
          >
            <Globe className={`w-3.5 h-3.5 ${domainRunning ? 'animate-pulse' : ''}`} />
            {domainRunning ? 'Queuing…' : 'Check All Domains'}
          </button>
          {domainMsg && (
            <p className={`text-sm font-medium ${domainMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {domainMsg}
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Each domain is crawled in the background. Results appear in Signal Detail as{' '}
          <span className="font-bold text-green-600">LIVE</span>{' '}
          <span className="font-bold text-amber-600">COMING SOON</span>{' '}
          <span className="font-bold text-neutral-400">PARKED</span>{' '}
          badges on domain signal cards.
        </p>
      </div>

      {/* Consumer Deals Watchlist */}
      <WatchlistBulkImportSection />

      {/* Inbox Audit */}
      <InboxAuditSection />

      {/* LinkedIn Network Poll */}
      <LinkedInPollSection />

    </div>
  );
}

function LinkedInPollSection() {
  const [estimate,  setEstimate]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [running,   setRunning]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [msg,       setMsg]       = useState('');

  const fetchEstimate = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await adminApi.linkedinPollEstimate();
      setEstimate(res.data);
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Failed to load estimate'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  const handleRun = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setRunning(true);
    setMsg('');
    try {
      const res = await adminApi.linkedinPollRun();
      setMsg('✓ ' + res.data.message);
      setConfirmed(false);
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Failed to start poll'));
    } finally {
      setRunning(false);
    }
  };

  const canAfford = estimate?.credits_available != null
    && estimate.credits_available >= (estimate.credits_needed || 0);

  return (
    <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
      <SectionHeader
        icon={Linkedin}
        title="LinkedIn Network Poll"
        subtitle="Scan imported connections for headline changes to stealth / founder language. Runs quarterly — admin approval required before any Proxycurl credits are spent."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2" style={{ borderColor: '#052EF0' }} />
          Loading estimate…
        </div>
      ) : estimate ? (
        <div className="space-y-4">

          {/* Cost estimate card */}
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#F5F0EB' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Eligible contacts</span>
              <span className="text-sm font-bold" style={{ color: '#052EF0' }}>{estimate.eligible_contacts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Credits needed</span>
              <span className="text-sm font-bold text-neutral-700">{estimate.credits_needed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Credits available</span>
              <span className={`text-sm font-bold ${
                estimate.credits_available == null ? 'text-neutral-400' :
                canAfford ? 'text-green-600' : 'text-red-500'
              }`}>
                {estimate.credits_available != null ? estimate.credits_available.toLocaleString() : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #E5E5E0' }}>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Estimated cost</span>
              <span className="text-base font-bold text-neutral-900">${estimate.estimated_cost_usd.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-400">
            Contacts connected in the last {estimate.cutoff_years} years with a stored LinkedIn URL. 3 credits per profile.
            Runs in the background — you'll receive an email summary with any stealth signals detected.
          </p>

          {confirmed && !running && (
            <div className="p-3 rounded text-xs text-amber-700 bg-amber-50 border border-amber-200">
              This will spend <strong>${estimate.estimated_cost_usd.toFixed(2)}</strong> in Proxycurl credits
              scanning {estimate.eligible_contacts.toLocaleString()} profiles. Click again to confirm.
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRun}
              disabled={running || estimate.eligible_contacts === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider text-white rounded transition-all disabled:opacity-50"
              style={{ backgroundColor: running ? '#999' : confirmed ? '#B45309' : '#052EF0' }}
            >
              <Linkedin className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
              {running ? 'Starting poll…' : confirmed ? 'Confirm & Spend Credits' : 'Approve & Run Poll'}
            </button>
            {confirmed && !running && (
              <button
                onClick={() => setConfirmed(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={fetchEstimate}
              disabled={loading}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Refresh estimate
            </button>
          </div>
        </div>
      ) : null}

      {msg && (
        <p className={`text-sm font-medium mt-3 ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────

const TABS = [
  { id: 'alerts',    label: 'Alerts',    icon: Bell,       adminOnly: false },
  { id: 'schedules', label: 'Schedules', icon: Clock,      adminOnly: false },
  { id: 'team',      label: 'Team',      icon: Users,      adminOnly: false },
  { id: 'spend',     label: 'Spend',     icon: CreditCard, adminOnly: true  },
  { id: 'tools',     label: 'Tools',     icon: Zap,        adminOnly: true  },
];

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('alerts');

  return (
    <div className="max-w-3xl mx-auto px-6 py-7">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">Platform configuration for Stealth Finder.</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-neutral-200 mb-7">
        {TABS.filter(t => !t.adminOnly || isAdmin).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors
                ${active ? 'text-black' : 'text-neutral-400 hover:text-black'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#052EF0' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'alerts'    && <AlertsTab isAdmin={isAdmin} />}
      {activeTab === 'schedules' && (
        <>
          <SchedulerHealthBanner />
          <ScheduledScans embedded />
        </>
      )}
      {activeTab === 'team'      && <Team embedded />}
      {activeTab === 'spend'     && isAdmin && <SpendTab />}
      {activeTab === 'tools'     && isAdmin && <ToolsTab />}

    </div>
  );
}
