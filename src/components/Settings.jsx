import React, { useState, useEffect, useCallback } from 'react';
import { settings as settingsApi, admin as adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, Save, Bell, Slack, BarChart2, Clock, Users, CreditCard, RefreshCw, Linkedin, Zap, Search, Database, Mail, Globe } from 'lucide-react';
import ScheduledScans from './ScheduledScans';
import Team from './Team';

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

  const fmt  = (n) => n == null ? '—' : `$${n.toFixed(2)}`;
  const fmtN = (n) => n == null ? '—' : n.toLocaleString();

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

      {/* Total this month */}
      <div>
        <SectionHeader icon={CreditCard} title="This Month" subtitle="Estimated API spend since the 1st" />
        <div className="grid grid-cols-4 gap-3">
          <SpendStat
            label="Founder APIs"
            value={fmt((pc.estimated_cost_this_month || 0) + (sa.estimated_cost_this_month || 0))}
            sub={`${fmtN((pc.lookups_this_month || 0) + (sa.searches_this_month || 0))} Proxycurl + SerpAPI + Crunchbase lookups & searches`}
          />
          <SpendStat
            label="Claude (Anthropic)"
            value={fmt(an.estimated_cost_this_month)}
            sub={`${fmtN(an.enrichments_this_month)} enrichments · ~${fmt(an.cost_per_enrichment)}/ea`}
          />
          <SpendStat
            label="Email Alerts"
            value={rs.emails_this_month != null ? fmtN(rs.emails_this_month) : '—'}
            sub={`${fmtN(rs.emails_all_time)} all-time HOT alerts sent`}
          />
          <SpendStat
            label="Total Estimated"
            value={fmt(tot.estimated_cost_this_month)}
            sub="All API services combined"
          />
        </div>
      </div>

      {/* Proxycurl detail */}
      <div>
        <SectionHeader icon={Linkedin} title="Proxycurl (LinkedIn)" subtitle="Founder LinkedIn profile lookups via NinjaPear" />
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

      {/* Inbox Audit */}
      <InboxAuditSection />

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
      {activeTab === 'schedules' && <ScheduledScans embedded />}
      {activeTab === 'team'      && <Team embedded />}
      {activeTab === 'spend'     && isAdmin && <SpendTab />}
      {activeTab === 'tools'     && isAdmin && <ToolsTab />}

    </div>
  );
}
