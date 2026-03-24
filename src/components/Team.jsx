import React, { useState, useEffect, useCallback } from 'react';
import { auth, admin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users, Mail, CheckCircle, ShieldCheck, Crown, Shield, Briefcase,
  ChevronDown, ChevronUp, Eye, EyeOff, UserCheck, UserX,
  UserCircle, Plus, Key, RefreshCw, Send, Trash2, AlertTriangle,
} from 'lucide-react';

const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#052EF0] transition-colors disabled:bg-neutral-50 disabled:text-neutral-400';
const labelClass = 'block text-[10px] font-semibold text-neutral-400 mb-1 uppercase tracking-wider';

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'admin',            label: 'Admin',            Icon: Crown,      bg: '#052EF0', color: '#fff'      },
  { value: 'managing_partner', label: 'Managing Partner', Icon: Shield,     bg: '#020A52', color: '#fff'      },
  { value: 'investor',         label: 'Investor',         Icon: Briefcase,  bg: '#F0F4FF', color: '#052EF0'   },
  { value: 'analyst',          label: 'Analyst',          Icon: UserCircle, bg: '#F2F2F2', color: '#666'       },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]));
const DEFAULT_ROLE = ROLE_MAP['analyst'];

// ── Badges ────────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_MAP[role] || DEFAULT_ROLE;
  const { Icon, label, bg, color } = cfg;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: bg, color }}>
      <Icon className="w-2.5 h-2.5" /> {label}
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

function MemberRow({ member: initialMember, currentUser, isCurrentUserAdmin, onDelete }) {
  const [member,      setMember]      = useState(initialMember);
  const [expanded,    setExpanded]    = useState(false);
  const [editFirst,   setEditFirst]   = useState(initialMember.first_name);
  const [editLast,    setEditLast]    = useState(initialMember.last_name);
  const [saving,      setSaving]      = useState(false);
  const [linkSaving,  setLinkSaving]  = useState(false);
  const [nameFb,      setNameFb]      = useState('');
  const [roleFb,      setRoleFb]      = useState('');
  const [statusFb,    setStatusFb]    = useState('');
  const [linkFb,      setLinkFb]      = useState('');
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [deleteFb,    setDeleteFb]    = useState('');

  const isSelf = member.id === currentUser?.id;

  // Sync if parent refreshes
  useEffect(() => {
    setMember(initialMember);
    setEditFirst(initialMember.first_name);
    setEditLast(initialMember.last_name);
  }, [initialMember]);

  const flashFb = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const patch = async (data, fbSetter) => {
    setSaving(true);
    try {
      const res = await admin.updateUser(member.id, data);
      setMember(res.data.user);
      flashFb(fbSetter, '✓ Saved');
    } catch (e) {
      flashFb(fbSetter, e.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = () => {
    if (!editFirst.trim() || !editLast.trim()) return;
    patch({ first_name: editFirst.trim(), last_name: editLast.trim() }, setNameFb);
  };

  const handleRoleChange = (newRole) => patch({ role: newRole }, setRoleFb);

  const handleToggleActive = () => patch({ is_active: !member.is_active }, setStatusFb);

  const handleSendResetLink = async () => {
    setLinkSaving(true);
    setLinkFb('');
    try {
      await admin.sendResetLink(member.id);
      flashFb(setLinkFb, `✓ Reset link sent to ${member.email}`);
    } catch (e) {
      flashFb(setLinkFb, e.response?.data?.error || 'Failed to send');
    } finally {
      setLinkSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteFb('');
    try {
      await admin.deleteUser(member.id);
      onDelete(member.id);
    } catch (e) {
      setDeleteFb(e.response?.data?.error || 'Failed to delete');
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const joinedDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const fbColor = (fb) => (fb && !fb.startsWith('✓')) ? 'text-red-500' : 'text-green-600';

  return (
    <div
      className="rounded-lg overflow-hidden transition-shadow"
      style={{ border: `1px solid ${isSelf ? '#052EF0' : '#E5E5E0'}` }}
    >
      {/* ── Collapsed row ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors hover:bg-neutral-50"
        style={{ backgroundColor: isSelf ? '#F0F4FF' : '#fff' }}
        onClick={() => isCurrentUserAdmin && setExpanded(v => !v)}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-display font-bold"
          style={{
            backgroundColor: (ROLE_MAP[member.role] || DEFAULT_ROLE).bg,
            color:            (ROLE_MAP[member.role] || DEFAULT_ROLE).color,
          }}
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

      {/* ── Expanded edit panel (admin only) ────────────────────────────────── */}
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

          {/* ② Role */}
          <div>
            <p className={labelClass}>Role</p>
            <p className="text-[10px] text-neutral-400 mb-2 leading-relaxed">
              Role controls what this person sees and can do in the app.
              {isSelf && ' You cannot change your own role.'}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={member.role}
                onChange={e => handleRoleChange(e.target.value)}
                disabled={isSelf || saving}
                className={inputClass + ' max-w-[220px]'}
                style={{ cursor: (isSelf || saving) ? 'not-allowed' : 'pointer' }}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {roleFb && <span className={`text-xs font-medium ${fbColor(roleFb)}`}>{roleFb}</span>}
            </div>
          </div>

          {/* ③ Status */}
          <div>
            <p className={labelClass}>Account Status</p>
            <div className="flex items-center gap-2">
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
              {statusFb && <span className={`text-xs font-medium ${fbColor(statusFb)}`}>{statusFb}</span>}
            </div>
            {isSelf && (
              <p className="text-[10px] text-neutral-300 mt-1.5">
                You cannot deactivate your own account.
              </p>
            )}
          </div>

          {/* ④ Password reset — sends email link */}
          <div>
            <p className={labelClass + ' flex items-center gap-1.5'}>
              <Key className="w-3 h-3" /> Password Reset
            </p>
            <p className="text-[10px] text-neutral-400 mb-3 leading-relaxed">
              Send {isSelf ? 'yourself' : member.first_name} a secure reset link via email. The link
              expires in 1 hour. You never see or set their password — they do it themselves.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendResetLink}
                disabled={linkSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border transition-all disabled:opacity-40"
                style={{
                  borderColor:     '#E5E5E0',
                  color:           '#374151',
                  backgroundColor: '#fff',
                }}
              >
                {linkSaving
                  ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-neutral-400" /> Sending…</>
                  : <><Send className="w-3 h-3" /> Send Reset Link</>
                }
              </button>
              {linkFb && <span className={`text-xs font-medium ${fbColor(linkFb)}`}>{linkFb}</span>}
            </div>
            <p className="text-[10px] text-neutral-300 mt-2">
              Email: <span className="font-mono">{member.email}</span>
            </p>
          </div>

          {/* ⑤ Delete user */}
          {!isSelf && (
            <div className="pt-4 border-t border-red-100">
              <p className={labelClass + ' flex items-center gap-1.5 text-red-400'}>
                <Trash2 className="w-3 h-3" /> Delete Account
              </p>
              {!confirmDel ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded border transition-all"
                    style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FFF5F5' }}
                  >
                    <Trash2 className="w-3 h-3" /> Delete {member.first_name}
                  </button>
                  {deleteFb && <span className="text-xs font-medium text-red-500">{deleteFb}</span>}
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#FFF5F5', border: '1px solid #FCA5A5' }}>
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-700 mb-1">
                      Permanently delete {member.first_name} {member.last_name}?
                    </p>
                    <p className="text-[10px] text-red-400 mb-3">
                      This removes their account and cannot be undone. They will lose all access immediately.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded text-white transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#DC2626' }}
                      >
                        {deleting
                          ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/50" /> Deleting…</>
                          : <><Trash2 className="w-3 h-3" /> Yes, Delete</>
                        }
                      </button>
                      <button
                        onClick={() => setConfirmDel(false)}
                        disabled={deleting}
                        className="text-xs font-medium px-3 py-1.5 rounded border transition-all"
                        style={{ borderColor: '#E5E5E0', color: '#666' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
  const [inviteRole,  setInviteRole]  = useState('analyst');
  const [sending,     setSending]     = useState(false);
  const [sentTo,      setSentTo]      = useState('');
  const [inviteError, setInviteError] = useState('');
  const [showInvite,  setShowInvite]  = useState(false);

  const handleMemberDeleted = (deletedId) => {
    setMembers(prev => prev.filter(m => m.id !== deletedId));
  };

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
      await auth.invite(inviteEmail.trim().toLowerCase(), inviteRole);
      setSentTo(inviteEmail.trim().toLowerCase());
      setInviteEmail('');
      setInviteRole('analyst');
      setShowInvite(false);
      setTimeout(loadMembers, 1000);
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setSending(false);
    }
  };

  // Stats
  const activeCount  = members.filter(m => m.is_active).length;
  const adminCount   = members.filter(m => m.role === 'admin').length;
  const partnerCount = members.filter(m => m.role === 'managing_partner').length;
  const investorCount = members.filter(m => m.role === 'investor').length;
  const analystCount = members.filter(m => m.role === 'analyst').length;

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
          {/* ── Stats strip ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total',    value: members.length  },
              { label: 'Active',   value: activeCount     },
              { label: 'Admins',   value: adminCount      },
              { label: 'Partners', value: partnerCount + investorCount },
              { label: 'Analysts', value: analystCount    },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg p-3 text-center" style={{ border: '1px solid #E5E5E0' }}>
                <p className="text-xl font-display font-bold text-black">{value}</p>
                <p className="text-[9px] text-neutral-400 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Header row with invite + refresh ────────────────────────────── */}
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

          {/* ── Invite form (collapsible) ────────────────────────────────────── */}
          {showInvite && (
            <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #052EF0' }}>
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400 mb-3">
                Invite a Team Member
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

              <form onSubmit={handleInvite} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="partner@bullish.co"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className={inputClass + ' shrink-0'}
                    style={{ width: 180 }}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sending || !inviteEmail.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded transition-all"
                    style={{ backgroundColor: (sending || !inviteEmail.trim()) ? '#CCC' : '#052EF0' }}
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/50" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    {sending ? 'Sending…' : 'Send Invite'}
                  </button>
                  <p className="text-[10px] text-neutral-300 leading-relaxed">
                    7-day link · role set now · they choose their own password
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────────────── */}
          {error && (
            <div className="p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          {/* ── Member list ─────────────────────────────────────────────────── */}
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
              {[...members]
                .sort((a, b) => {
                  if (a.id === currentUser?.id) return -1;
                  if (b.id === currentUser?.id) return  1;
                  const roleOrder = { admin: 0, managing_partner: 1, investor: 2, analyst: 3 };
                  const ao = roleOrder[a.role] ?? 4;
                  const bo = roleOrder[b.role] ?? 4;
                  if (ao !== bo) return ao - bo;
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
                    onDelete={handleMemberDeleted}
                  />
                ))
              }
            </div>
          )}

          {/* ── Legend ──────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            {ROLES.map(({ value, label, Icon, bg, color }) => (
              <span key={value} className="flex items-center gap-1 text-[10px] text-neutral-300">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                  style={{ backgroundColor: bg }}>
                  <Icon className="w-2.5 h-2.5" style={{ color }} />
                </span>
                {label}
              </span>
            ))}
            <span className="text-[10px] text-neutral-300 ml-2">· Click any row to edit</span>
          </div>
        </>
      )}
    </div>
  );
}
