import React, { useState, useEffect, useCallback } from 'react';
import { settings as settingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, Slack, Bell, BarChart2, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const [alertEmails,    setAlertEmails]    = useState([]);
  const [newEmail,       setNewEmail]       = useState('');
  const [slackWebhook,   setSlackWebhook]   = useState('');
  const [digestEnabled,  setDigestEnabled]  = useState(true);
  const [daysBack,       setDaysBack]       = useState(30);
  const [maxResults,     setMaxResults]     = useState(200);

  const [testingSlack,   setTestingSlack]   = useState(false);
  const [slackTestMsg,   setSlackTestMsg]   = useState('');

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
    } catch (err) {
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

  const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors disabled:bg-neutral-50 disabled:text-neutral-400';
  const labelClass = 'block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider';

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#052EF0' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-7 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">Settings</h1>
          <p className="text-neutral-400 text-sm mt-1">Platform configuration for Stealth Finder.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold tracking-wider uppercase text-white rounded transition-all"
            style={{ backgroundColor: saving ? '#999' : '#052EF0' }}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        )}
      </div>

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

    </div>
  );
}
