import React, { useState, useEffect, useCallback } from 'react';
import { auth, admin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users, Mail, CheckCircle, ShieldCheck, Crown, Shield,
  ChevronDown, ChevronUp, Eye, EyeOff, UserCheck, UserX,
  UserCircle, Plus, Key, RefreshCw,
} from 'lucide-react';

const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0] transition-colors disabled:bg-neutral-50 disabled:text-neutral-400';
const labelClass = 'block text-[10px] font-semibold text-neutral-400 mb-1 uppercase tracking-wider';

// ── Badges ────────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: '#052EF0', color: '#fff' }}>
        <Crown className="w-2.5 h-2.5" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
      style={{ backgroundColor: '#F2F2F2', color: '#666' }}>
      <UserCircle className="w-2.5 h-2.5" /> Analyst
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${active ? 'text-green-600' : 'text-red-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Individual member row with expandable edit panel ──────────────────────────

function MemberRow({ member: initialMember, currentUser, isCurrentUserAdmin }) {
  const [member,     setMember]     = useState(initialMember);
  const [expanded,   setExpanded]   = useState(false);
  const [editFirst,  setEditFirst]  = useState(initialMember.first_name);
  const [editLast,   setEditLast]   = useState(initialMember.last_name);
  const [newPwd,     setNewPwd]     = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [pwdSaving,  setPwdSaving]  = useState(false);
  const [nameFb,     setNameFb]     = useState('');
  const [roleFb,     setRoleFb]     = useState('');
  const [statusFb,   setStatusFb]   = useState('');
  const [pwdFb,      setPwdFb]      = useState('');

  const isSelf        = member.id === currentUser?.id;
  const isAdminMember = member.role === 'admin';

  // Sync if parent refreshes
  useEffect(() => {
    setMember(initialMember);
    setEditFirst(initialMember.first_name);
    setEditLast(initialMember.last_name);
  }, [initialMember]);

  const flashFb = (setter, msg, isError = false) => {
    setter(msg);
    setTimeout(() => setter(''), 3000);
    _ = isError; // suppress lint
  };

  const patch = async (data, fbSetter) => {
    setSaving(true);
    try {
      const res = await admin.updateUser(member.id, data);
      setMember(res.data.user);
      flashFb(fbSetter, '✓ Saved');
    } catch (e) {
      flashFb(fbSetter, e.response?.data?.error || 'Error', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = () => {
    if (!editFirst.trim() || !editLast.trim()) return;
    patch({ first_name: editFirst.trim(), last_name: editLast.trim() }, setNameFb);
  };

  const handleToggleRole = () =>
    patch({ role: isAdminMember ? 'user' : 'admin' }, setRoleFb);

  const handleToggleActive = () =>
    patch({ is_active: !member.is_active }, setStatusFb);

  const handleForcePassword = async () => {
    if (newPwd.length < 8) { setPwdFb('Min 8 characters'); return; }
    setPwdSaving(true);
    setPwdFb('');
    try {
      await admin.forceResetPassword(member.id, newPwd);
      setNewPwd('');
      flashFb(setPwdFb, '✓ Password updated');
    } catch (e) {
      flashFb(setPwdFb, e.response?.data?.error || 'Error', true);
    } finally {
      setPwdSaving(false);
    }
  };

  const joinedDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const isNegFb  = (fb) => fb && !fb.startsWith('✓');
  const fbColor  = (fb) => isNegFb(fb) ? 'text-red-500' : 'text-green-600';

  return (
    <div
      className="rounded-lg overflow-hidden transition-shadow"
      style={{ border: `1px solid ${isSelf ? '#052EF0' : '#E5E5E0'}` }}
    >
      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors hover:bg-neutral-50"
        style={{ backgroundColor: isSelf ? '#F0F4FF' : '#fff' }}
        onClick={() => isCurrentUserAdmin && setExpanded(v => !v)}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-display font-bold"
          style={{ backgroundColor: isAdminMember ? '#052EF0' : '#F2F2F2', color: isAdminMember ? '#fff' : '#666' }}
        >
          {member.first_name?.[0]}{member.last_name?.[0]}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-black leading-snug">
              {member.first_name} {member.last_name}
            </span>
            {isSelf && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                style={{ backgroundColor: '#052EF0', color: '#fff' }}>
                You
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
            {member.email}
          </div>
        </div>

        {/* Badges + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <RoleBadge role={member.role} />
          <StatusDot active={member.is_active} />
          {joinedDate && (
            <span className="text-[10px] text-neutral-300 hidden sm:block">{joinedDate}</span>
          )}
          {isCurrentUserAdmin && (
            expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-neutral-300" />
              : <ChevronDown className="w-3.5 h-3.5 text-neutral-300" />
          )}
        </div>
      </div>

      {/* ── Expanded edit panel (admin only) ──────────────────────────────── */}
      {expanded && isCurrentUserAdmin && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-5 space-y-6">

          {/* ① Name */}
          <div>
            <p className={labelClass}>Name</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">First</label>
                <input
                  value={editFirst}
                  onChange={e => setEditFirst(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Last</label>
                <input
                  value={editLast}
                  onChange={e => setEditLast(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleSaveName}
                disabled={saving || !editFirst.trim() || !editLast.trim()}
                className="text-xs font-semibold px-3 py-1.5 rounded text-white transition-colors"
                style={{ backgroundColor: (saving || !editFirst.trim() || !editLast.trim()) ? '#CCC' : '#052EF0' }}
              >
                {saving ? 'Saving…' : 'Save Name'}
              </button>
              {nameFb && <span className={`text-xs font-medium ${fbColor(nameFb)}`}>{nameFb}</span>}
            </div>
          </div>

          {/* ② Role + Status toggles */}
          <div>
            <p className={labelClass}>Access & Status</p>
            <div className="flex flex-wrap gap-2">

              {/* Role toggle */}
              <button
                onClick={handleToggleRole}
                disabled={isSelf || saving}
                title={isSelf ? "Can't change your own role" : isAdminMember ? 'Revoke admin — make Analyst' : 'Grant admin access'}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor:       isAdminMember ? '#052EF0' : '#E5E5E0',
                  color:             isAdminMember ? '#052EF0' : '#374151',
                  backgroundColor:   isAdminMember ? '#F0F4FF' : '#fff',
                }}
              >
                {isAdminMember
                  ? <><Shield className="w-3 h-3" /> Remove Admin</>
                  : <><Crown className="w-3 h-3" /> Make Admin</>
                }
              </button>

              {/* Active toggle */}
              <button
                onClick={handleToggleActive}
                disabled={isSelf || saving}
                title={isSelf ? "Can't deactivate yourself" : member.is_active ? 'Deactivate account' : 'Reactivate account'}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor:     member.is_active ? '#FCA5A5' : '#86EFAC',
                  color:           member.is_active ? '#DC2626' : '#16A34A',
                  backgroundColor: member.is_active ? '#FFF5F5' : '#F0FFF4',
                }}
              >
                {member.is_active
                  ? <><UserX className="w-3 h-3" /> Deactivate</>
                  : <><UserCheck className="w-3 h-3" /> Activate</>
                }
              </button>
            </div>

            {/* Feedback row */}
            <div className="mt-1.5 flex gap-4">
              {roleFb   && <span className={`text-xs font-medium ${fbColor(roleFb)}`}>{roleFb}</span>}
              {statusFb && <span className={`text-xs font-medium ${fbColor(statusFb)}`}>{statusFb}</span>}
            </div>

            {isSelf && (
              <p className="text-[10px] text-neutral-300 mt-1.5">
                Role and status changes cannot be applied to your own account.
              </p>
            )}
          </div>

          {/* ③ Force password reset */}
          <div>
            <p className={labelClass + ' flex items-center gap-1.5'}>
              <Key className="w-3 h-3" /> Set New Password
            </p>
            <p className="text-[10px] text-neutral-400 mb-2 leading-relaxed">
              Force-set a new password{isSelf ? '' : ` for ${member.first_name}`}. The stored password is always
              hashed — you can set it but never see it. Use this if they're locked out or request a reset.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="New password (min 8 characters)"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleForcePassword()}
                  className={inputClass + ' pr-9'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleForcePassword}
                disabled={pwdSaving || newPwd.length < 8}
                className="shrink-0 text-xs font-bold px-4 py-2 rounded text-white transition-colors"
                style={{ backgroundColor: (pwdSaving || newPwd.length < 8) ? '#CCC' : '#111' }}
              >
                {pwdSaving ? 'Setting…' : 'Set'}
              </button>
            </div>
            {pwdFb && (
              <p className={`text-xs mt-1.5 font-medium ${fbColor(pwdFb)}`}>{pwdFb}</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main Team component ───────────────────────────────────────────────────────

export default function Team({ embedded = false }) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [members,     setMembers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending,     setSending]     = useState(false);
  const [sentTo,      setSentTo]      = useState('');
  const [inviteError, setInviteError] = useState('');
  const [showInvite,  setShowInvite]  = useState(false);

  const loadMembers = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    try {
      setLoading(true);
      setError('');
      const res = await admin.listUsers({ per_page: 100 });
      setMembers(res.data.users || []);
    } catch {
      setError('Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

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
      setShowInvite(false);
      // Reload after a moment (new user may appear if they accepted an old invite)
      setTimeout(loadMembers, 1000);
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setSending(false);
    }
  };

  const adminCount  = members.filter(m => m.role === 'admin').length;
  const activeCount = members.filter(m => m.is_active).length;

  return (
    <div className={embedded ? 'space-y-5' : 'max-w-3xl mx-auto px-6 py-7 space-y-6'}>

      {!embedded && (
        <div>
          <h1 className="font-display font-bold text-3xl uppercase tracking-wide text-black">Team</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Bullish partners and analysts with access to Stealth Finder.
          </p>
        </div>
      )}

      {/* Non-admin view */}
      {!isAdmin ? (
        <div className="bg-white rounded-lg p-10 text-center" style={{ border: '1px solid #E5E5E0' }}>
          <ShieldCheck className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Admin access required to manage team members.</p>
          <p className="text-xs text-neutral-300 mt-1">Contact your admin for changes.</p>
        </div>
      ) : (
        <>
          {/* ── Stats strip ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Members', value: members.length },
              { label: 'Active',        value: activeCount    },
              { label: 'Admins',        value: adminCount     },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg p-4 text-center" style={{ border: '1px solid #E5E5E0' }}>
                <p className="text-2xl font-display font-bold text-black">{value}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Header row with invite + refresh ───────────────────────────── */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">
              Members
              <span className="text-[10px] text-neutral-300 ml-2 normal-case font-normal font-sans">
                Click any row to edit
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={loadMembers}
                className="text-neutral-300 hover:text-neutral-500 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setShowInvite(v => !v); setSentTo(''); setInviteError(''); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded text-white transition-colors"
                style={{ backgroundColor: '#052EF0' }}
              >
                <Plus className="w-3 h-3" />
                Invite
              </button>
            </div>
          </div>

          {/* ── Invite form (collapsible) ───────────────────────────────────── */}
          {showInvite && (
            <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #052EF0' }}>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-3">
                Invite a Partner or Analyst
              </h4>

              {sentTo && (
                <div className="mb-3 flex items-start gap-2 p-3 rounded text-xs text-green-700 bg-green-50 border border-green-200">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Invite sent to <strong>{sentTo}</strong>. They'll get an email to set their name and password.</span>
                </div>
              )}
              {inviteError && (
                <div className="mb-3 p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  placeholder="partner@bullish.co"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !inviteEmail.trim()}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded transition-all"
                  style={{ backgroundColor: (sending || !inviteEmail.trim()) ? '#CCC' : '#052EF0' }}
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/50" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>

              <p className="mt-3 text-[10px] text-neutral-300 leading-relaxed">
                Invite link expires in 7 days. New members default to <strong>Analyst</strong> role —
                promote to Admin here after they join.
              </p>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────── */}
          {error && (
            <div className="p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          {/* ── Member list ────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: '#052EF0' }} />
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center" style={{ border: '1px solid #E5E5E0' }}>
              <Users className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No team members found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Admins first, then analysts, then inactive */}
              {[...members]
                .sort((a, b) => {
                  if (a.id === currentUser?.id) return -1;
                  if (b.id === currentUser?.id) return  1;
                  if (a.role === 'admin' && b.role !== 'admin') return -1;
                  if (b.role === 'admin' && a.role !== 'admin') return  1;
                  if (a.is_active && !b.is_active) return -1;
                  if (b.is_active && !a.is_active) return  1;
                  return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                })
                .map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUser={currentUser}
                    isCurrentUserAdmin={isAdmin}
                  />
                ))
              }
            </div>
          )}

          {/* ── Legend ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 pt-1 text-[10px] text-neutral-300">
            <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> Admin — full control</span>
            <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> Analyst — read + search</span>
            <span>Click any row to edit</span>
          </div>
        </>
      )}
    </div>
  );
}
