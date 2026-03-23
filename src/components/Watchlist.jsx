import React, { useState, useEffect, useCallback } from 'react';
import { items } from '../api/client';
import { Linkedin, Twitter, Trash2, PlusCircle, Users, ExternalLink } from 'lucide-react';

export default function Watchlist() {
  const [watchlist,   setWatchlist]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [adding,      setAdding]      = useState(false);
  const [removingId,  setRemovingId]  = useState(null);
  const [error,       setError]       = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  const [formData, setFormData] = useState({
    name: '', company: '', linkedin: '', twitter: '', notes: '',
  });

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
              id:      item.id,
              name:    meta.name || item.title,
              company: meta.company || '',
              linkedin: meta.linkedin || '',
              twitter:  meta.twitter || '',
              notes:   meta.notes || '',
              addedAt: meta.added_at || item.created_at,
            }];
          }
        } catch (e) {}
        return [];
      });

      parsed.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      setWatchlist(parsed);
    } catch (err) {
      setError('Failed to load watchlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setAdding(true);
    setError('');
    try {
      const meta = {
        _type:    'watchlist',
        name:     formData.name.trim(),
        company:  formData.company.trim(),
        linkedin: formData.linkedin.trim(),
        twitter:  formData.twitter.trim().replace(/^@/, ''),
        notes:    formData.notes.trim(),
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

  const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors';
  const labelClass = 'block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider';

  return (
    <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
          Watchlist
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Track specific founders, operators and talent - in a role or in stealth - that you think have a high probability of building a remarkable brand one day.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
      )}
      {successMsg && (
        <div className="p-3 rounded text-xs text-green-700 bg-green-50 border border-green-200">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Add Form ── */}
        <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-4">
            Add to Watchlist
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className={labelClass}>Founder Name <span className="text-[#052EF0] normal-case font-sans font-normal">*</span></label>
              <input type="text" placeholder="Sarah Chen" value={formData.name}
                onChange={e => update('name', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Company / Background</label>
              <input type="text" placeholder="e.g. VP Marketing at Seed-stage CPG brand" value={formData.company}
                onChange={e => update('company', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>LinkedIn URL</label>
              <input type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin}
                onChange={e => update('linkedin', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Twitter / X Handle</label>
              <input type="text" placeholder="@sarahchen" value={formData.twitter}
                onChange={e => update('twitter', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                placeholder="Why you're watching them, connection, background..."
                value={formData.notes}
                onChange={e => update('notes', e.target.value)}
                className={`${inputClass} resize-none`}
                rows="2"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !formData.name.trim()}
              className="w-full py-2.5 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: (adding || !formData.name.trim()) ? '#CCC' : '#052EF0' }}
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
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

        {/* ── Watchlist entries ── */}
        <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
              Active Watchlist
            </h3>
            <span className="text-xs font-medium text-neutral-300">
              {watchlist.length} {watchlist.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: '#052EF0' }} />
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No founders on your watchlist yet.</p>
              <p className="text-xs text-neutral-300 mt-1">Add someone using the form.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {watchlist.map(founder => (
                <div
                  key={founder.id}
                  className="rounded p-3 transition-colors hover:bg-neutral-50"
                  style={{ border: '1px solid #E5E5E0' }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black text-sm">{founder.name}</div>
                      {founder.company && (
                        <div className="text-xs text-neutral-400 mt-0.5">{founder.company}</div>
                      )}
                      {founder.notes && (
                        <div className="text-xs text-neutral-500 mt-1 font-editorial italic">{founder.notes}</div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {founder.linkedin && (
                          <a
                            href={founder.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: '#052EF0' }}
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
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: '#052EF0' }}
                          >
                            <Twitter className="w-3 h-3" />
                            @{founder.twitter}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-300 mt-1.5 font-medium">
                        Added {new Date(founder.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(founder.id)}
                      disabled={removingId === founder.id}
                      className="text-neutral-200 hover:text-red-400 disabled:opacity-40 transition-colors p-1 shrink-0"
                      title="Remove from watchlist"
                    >
                      {removingId === founder.id
                        ? <div className="animate-spin rounded-full h-4 w-4 border-b border-red-400" />
                        : <Trash2 className="w-3.5 h-3.5" />
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
