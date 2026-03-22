import React, { useState, useEffect, useCallback } from 'react';
import { auth, admin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, CheckCircle, ShieldCheck, UserCircle, Crown } from 'lucide-react';

export default function Team({ embedded = false }) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending]     = useState(false);
  const [sentTo, setSentTo]       = useState('');
  const [inviteError, setInviteError] = useState('');

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await admin.listUsers({ per_page: 100 });
      setMembers(res.data.users || []);
    } catch (err) {
      setError('Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    setInviteError('');
    setSentTo('');
    try {
      await auth.invite(inviteEmail.trim().toLowerCase());
      setSentTo(inviteEmail.trim().toLowerCase());
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors';
  const labelClass = 'block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider';

  return (
    <div className={embedded ? 'space-y-5' : 'max-w-7xl mx-auto px-6 py-7 space-y-6'}>

      {/* Page header */}
      {!embedded && (
        <div>
          <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">
            Team
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Bullish partners and analysts with access to Stealth Finder.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Invite form — admin only */}
        {isAdmin && (
          <div className="bg-white rounded-lg p-6" style={{ border: '1px solid #E5E5E0' }}>
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-4">
              Invite a Partner or Analyst
            </h3>

            {sentTo && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded text-xs text-green-700 bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Invite sent</span> to <span className="font-mono">{sentTo}</span>.
                  They'll receive an email with a link to set their password.
                </div>
              </div>
            )}

            {inviteError && (
              <div className="mb-4 p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className={labelClass}>
                  Email address <span className="text-[#052EF0] normal-case font-sans font-normal">*</span>
                </label>
                <input
                  type="email"
                  placeholder="partner@bullish.co"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending || !inviteEmail.trim()}
                className="w-full py-2.5 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: (sending || !inviteEmail.trim()) ? '#CCC' : '#052EF0' }}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Invite
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-[10px] text-neutral-300 leading-relaxed">
              The invite link expires in 7 days. The recipient sets their own name and password.
              They'll have <strong>Analyst</strong> access by default.
            </p>
          </div>
        )}

        {/* Team member list */}
        <div
          className={`bg-white rounded-lg p-6 ${!isAdmin ? 'lg:col-span-2' : ''}`}
          style={{ border: '1px solid #E5E5E0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
              Active Members
            </h3>
            <span className="text-xs font-medium text-neutral-300">
              {members.filter(m => m.is_active).length} active
            </span>
          </div>

          {error && (
            <div className="p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200 mb-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: '#052EF0' }} />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No team members found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {members.map(member => {
                const isSelf = member.id === currentUser?.id;
                const isAdminMember = member.role === 'admin';

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded p-3"
                    style={{ border: `1px solid ${isSelf ? '#052EF0' : '#E5E5E0'}`, backgroundColor: isSelf ? '#F0F4FF' : '#fff' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-display font-bold"
                      style={{
                        backgroundColor: isAdminMember ? '#052EF0' : '#F2F2F2',
                        color: isAdminMember ? '#fff' : '#666',
                      }}
                    >
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-black leading-none">
                          {member.first_name} {member.last_name}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                            style={{ backgroundColor: '#052EF0', color: '#fff' }}>
                            You
                          </span>
                        )}
                        {isAdminMember && (
                          <Crown className="w-3 h-3 text-[#052EF0]" title="Admin" />
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 font-mono truncate">
                        {member.email}
                      </div>
                    </div>

                    {/* Role + status */}
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide capitalize">
                        {member.role === 'admin' ? 'Admin' : 'Analyst'}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-medium ${member.is_active ? 'text-green-500' : 'text-red-400'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
