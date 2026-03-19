import React, { useState } from 'react';
import { items } from '../api/client';
import { PlusCircle, CheckCircle, Info } from 'lucide-react';
import { CONSUMER_CATEGORIES } from './Dashboard';

const SIGNAL_TYPES = [
  { value: 'trademark', label: '🏆 Trademark Filing',      boost: 15 },
  { value: 'delaware',  label: '🏛️ Delaware Filing',       boost: 5  },
  { value: 'domain',    label: '🌐 Domain Registration',   boost: 3  },
  { value: 'instagram', label: '📸 Instagram Handle',      boost: 8  },
  { value: 'shopify',   label: '🛍️ Shopify Store',         boost: 10 },
  { value: 'social',    label: '💬 Social Media Post',     boost: 2  },
  { value: 'manual',    label: '✍️ Manual / Other',        boost: 5  },
];

export default function AddSignal() {
  const [formData, setFormData] = useState({
    signal_type: 'trademark',
    company_name: '',
    category: 'Consumer AI',
    description: '',
    url: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const selectedType = SIGNAL_TYPES.find(t => t.value === formData.signal_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const meta = {
        _type: 'signal',
        company_name: formData.company_name.trim(),
        signal_type: formData.signal_type,
        category: formData.category,
        score_boost: selectedType?.boost || 5,
        description: formData.description.trim(),
        url: formData.url.trim(),
        notes: formData.notes.trim(),
        timestamp: new Date().toISOString(),
      };

      // Stored as an item: title = company name, description = JSON metadata
      await items.create(formData.company_name.trim(), JSON.stringify(meta));

      setSuccess(true);
      setFormData({
        signal_type: 'trademark',
        company_name: '',
        category: 'Consumer AI',
        description: '',
        url: '',
        notes: '',
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add signal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add Manual Signal</h2>
          <p className="text-slate-500 mt-1">
            Manually log a stealth startup signal you've discovered. It will be stored in your database and appear on the Dashboard.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {success && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Signal added! Head to the Dashboard to see matches.
            </div>
          )}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signal type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Signal Type</label>
              <select
                value={formData.signal_type}
                onChange={e => update('signal_type', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SIGNAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label} (+{t.boost} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Company name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company / Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={e => update('company_name', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., GetHealthy"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Signals with the same company name will be grouped together as one match.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => update('category', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CONSUMER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => update('description', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                placeholder={
                  formData.signal_type === 'trademark'  ? "e.g., GETHEALTHY — Class 44 — filed 2026-03-15" :
                  formData.signal_type === 'delaware'   ? "e.g., GetHealthy Inc. — incorporated 2026-03-10" :
                  formData.signal_type === 'instagram'  ? "e.g., @gethealthy — 0 posts, created this week" :
                  formData.signal_type === 'shopify'    ? "e.g., gethealthy.myshopify.com — 0 products" :
                  formData.signal_type === 'domain'     ? "e.g., gethealthy.com — registered 2026-03-12" :
                  "What you found..."
                }
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={e => update('url', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Analyst Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => update('notes', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                placeholder="Your private analysis or context..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.company_name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Add Signal
                </>
              )}
            </button>
          </form>
        </div>

        {/* Score reference */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900 text-sm">Signal Score Guide</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-blue-700">
            {SIGNAL_TYPES.filter(t => t.value !== 'manual').map(t => (
              <div key={t.value} className="flex justify-between">
                <span>{t.label}</span>
                <span className="font-semibold">+{t.boost}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-blue-200 mt-3 pt-2 text-xs text-blue-600 space-y-1">
            <p>🏆 Trademark + Delaware or Domain → <strong>+20 bonus</strong></p>
            <p>🛍️ Shopify + Instagram → <strong>+15 DTC bonus</strong></p>
            <p>🔺 Delaware + Domain + Social → <strong>+10 triangle bonus</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
