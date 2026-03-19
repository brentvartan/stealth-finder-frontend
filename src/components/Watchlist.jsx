import React, { useState, useEffect, useCallback } from 'react';
import { items } from '../api/client';
import { Linkedin, Twitter, Trash2, PlusCircle, Users, Bell, ExternalLink } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    linkedin: '',
    twitter: '',
    notes: '',
  });

  // ── Load watchlist from backend ──────────────────────────────────────────────

  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await items.getAll({ per_page: 200 });
      const allItems = response.data.items || [];

      const parsed = allItems.flatMap(item => {
        try {
          const meta = JSON.parse(item.description || '{}');
          if (meta._type === 'watchlist') {
            return [{
              id: item.id,
              name: meta.name || item.title,
              company: meta.company || '',
              linkedin: meta.linkedin || '',
              twitter: meta.twitter || '',
              notes: meta.notes || '',
              addedAt: meta.added_at || item.created_at,
            }];
          }
        } catch (e) {}
        return [];
      });

      // Sort by most recently added
      parsed.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      setWatchlist(parsed);
    } catch (err) {
      setError('Failed to load watchlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  // ── Add founder ──────────────────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setAdding(true);
    setError('');
    try {
      const meta = {
        _type: 'watchlist',
        name: formData.name.trim(),
        company: formData.company.trim(),
        linkedin: formData.linkedin.trim(),
        twitter: formData.twitter.trim().replace(/^@/, ''), // normalise @handle
        notes: formData.notes.trim(),
        added_at: new Date().toISOString(),
      };

      await items.create(formData.name.trim(), JSON.stringify(meta));
      setFormData({ name: '', company: '', linkedin: '', twitter: '', notes: '' });
      setSuccessMsg('Added to watchlist!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadWatchlist();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to watchlist.');
    } finally {
      setAdding(false);
    }
  };

  // ── Remove founder ───────────────────────────────────────────────────────────

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await items.delete(id);
      setWatchlist(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to remove entry.');
    } finally {
      setRemovingId(null);
    }
  };

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

      {/* Info banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="bg-purple-600 p-2.5 rounded-lg shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">👀 Founder Watchlist</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Track specific operators you'd want to back. Add LinkedIn/Twitter profiles of
              ex-Glossier, Warby Parker, Dollar Shave Club founders. The system logs them so you
              can monitor for new company announcements and stealth signals.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Add Form ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-purple-600" />
            Add to Watchlist
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Founder Name *</label>
              <input
                type="text"
                placeholder="Sarah Chen"
                value={formData.name}
                onChange={e => update('name', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Company / Background</label>
              <input
                type="text"
                placeholder="ex-Glossier VP Marketing"
                value={formData.company}
                onChange={e => update('company', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={formData.linkedin}
                onChange={e => update('linkedin', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Twitter/X Handle</label>
              <input
                type="text"
                placeholder="@sarahchen"
                value={formData.twitter}
                onChange={e => update('twitter', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                placeholder="Why you're watching them, connection, background..."
                value={formData.notes}
                onChange={e => update('notes', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="2"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !formData.name.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Add to Watchlist
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Watchlist ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Active Watchlist
            <span className="ml-auto text-sm font-normal text-slate-400">{watchlist.length} entries</span>
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No founders on your watchlist yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add someone using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {watchlist.map(founder => (
                <div
                  key={founder.id}
                  className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{founder.name}</div>
                      {founder.company && (
                        <div className="text-xs text-slate-500 mt-0.5">{founder.company}</div>
                      )}
                      {founder.notes && (
                        <div className="text-xs text-slate-600 mt-1 italic">{founder.notes}</div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {founder.linkedin && (
                          <a
                            href={founder.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {founder.twitter && (
                          <a
                            href={`https://twitter.com/${founder.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Twitter className="w-3 h-3" />
                            @{founder.twitter}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5">
                        Added {new Date(founder.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(founder.id)}
                      disabled={removingId === founder.id}
                      className="text-slate-300 hover:text-red-500 disabled:opacity-40 transition-colors p-1 shrink-0"
                      title="Remove from watchlist"
                    >
                      {removingId === founder.id
                        ? <div className="animate-spin rounded-full h-4 w-4 border-b border-red-400" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
