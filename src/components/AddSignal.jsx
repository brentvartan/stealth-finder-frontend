import React, { useState } from 'react';
import { items } from '../api/client';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { CONSUMER_CATEGORIES } from './Dashboard';

const SIGNAL_TYPES = [
  { value: 'trademark', label: 'Trademark Filing',      boost: 15 },
  { value: 'delaware',  label: 'Delaware Filing',       boost: 5  },
  { value: 'domain',    label: 'Domain Registration',   boost: 3  },
  { value: 'instagram', label: 'Instagram Handle',      boost: 8  },
  { value: 'shopify',   label: 'Shopify Store',         boost: 10 },
  { value: 'social',    label: 'Social Media Post',     boost: 2  },
  { value: 'manual',    label: 'Manual / Other',        boost: 5  },
];

export default function AddSignal() {
  const [formData, setFormData] = useState({
    signal_type:  'trademark',
    company_name: '',
    category:     'Consumer AI',
    description:  '',
    url:          '',
    notes:        '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const selectedType = SIGNAL_TYPES.find(t => t.value === formData.signal_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const meta = {
        _type:        'signal',
        company_name: formData.company_name.trim(),
        signal_type:  formData.signal_type,
        category:     formData.category,
        score_boost:  selectedType?.boost || 5,
        description:  formData.description.trim(),
        url:          formData.url.trim(),
        notes:        formData.notes.trim(),
        timestamp:    new Date().toISOString(),
      };
      await items.create(formData.company_name.trim(), JSON.stringify(meta));
      setSuccess(true);
      setFormData({ signal_type: 'trademark', company_name: '', category: 'Consumer AI', description: '', url: '', notes: '' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add signal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors';
  const labelClass = 'block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="max-w-7xl mx-auto px-6 py-7">
      <div className="max-w-xl">

        {/* ── Page header ── */}
        <div className="mb-7">
          <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
            Add Signal
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manually log a stealth startup signal. It will appear on the Dashboard and be grouped with signals from the same company.
          </p>
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
          {success && (
            <div className="mb-5 p-3 rounded text-xs text-green-700 bg-green-50 border border-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Signal added! Head to the Dashboard to see matches.
            </div>
          )}
          {error && (
            <div className="mb-5 p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signal type */}
            <div>
              <label className={labelClass}>Signal Type</label>
              <select value={formData.signal_type} onChange={e => update('signal_type', e.target.value)} className={inputClass}>
                {SIGNAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label} (+{t.boost} pts)</option>
                ))}
              </select>
            </div>

            {/* Company name */}
            <div>
              <label className={labelClass}>
                Company / Brand Name <span className="text-[#052EF0] normal-case font-sans">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={e => update('company_name', e.target.value)}
                className={inputClass}
                placeholder="e.g., GetHealthy"
                required
              />
              <p className="text-[11px] text-neutral-300 mt-1">
                Signals with the same company name will be grouped as one match.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>
                Category <span className="text-[#052EF0] normal-case font-sans">*</span>
              </label>
              <select value={formData.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                {CONSUMER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={e => update('description', e.target.value)}
                className={`${inputClass} resize-none`}
                rows="3"
                placeholder={
                  formData.signal_type === 'trademark' ? 'e.g., GETHEALTHY — Class 44 — filed 2026-03-15' :
                  formData.signal_type === 'delaware'  ? 'e.g., GetHealthy Inc. — incorporated 2026-03-10' :
                  formData.signal_type === 'instagram' ? 'e.g., @gethealthy — 0 posts, created this week' :
                  formData.signal_type === 'shopify'   ? 'e.g., gethealthy.myshopify.com — 0 products' :
                  formData.signal_type === 'domain'    ? 'e.g., gethealthy.com — registered 2026-03-12' :
                  'What you found...'
                }
              />
            </div>

            {/* Source URL */}
            <div>
              <label className={labelClass}>Source URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={e => update('url', e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Analyst Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => update('notes', e.target.value)}
                className={`${inputClass} resize-none`}
                rows="2"
                placeholder="Your private analysis or context..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.company_name.trim()}
              className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: (loading || !formData.company_name.trim()) ? '#CCC' : '#052EF0' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Add Signal
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Score reference ── */}
        <div className="mt-4 bg-white rounded-lg p-5" style={{ border: '1px solid #E5E5E0', borderLeft: '3px solid #052EF0' }}>
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-3">
            Signal Score Guide
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-neutral-600 mb-3">
            {SIGNAL_TYPES.filter(t => t.value !== 'manual').map(t => (
              <div key={t.value} className="flex justify-between items-center">
                <span>{t.label}</span>
                <span className="font-display font-bold text-sm" style={{ color: '#052EF0' }}>+{t.boost}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-400 space-y-1">
            <p>Trademark + Delaware or Domain → <strong className="text-black">+20 bonus</strong></p>
            <p>Shopify + Instagram → <strong className="text-black">+15 DTC bonus</strong></p>
            <p>Delaware + Domain + Social → <strong className="text-black">+10 triangle bonus</strong></p>
          </div>
        </div>

      </div>
    </div>
  );
}
