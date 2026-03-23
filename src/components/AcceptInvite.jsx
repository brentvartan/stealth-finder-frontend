import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { auth } from '../api/client';
import { useAuth } from '../context/AuthContext';

const BullishIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="33" height="33" stroke="currentColor" strokeWidth="3" />
    <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="currentColor" />
    <polygon points="8.5,22 27,22 26,25 8.5,25" fill="currentColor" />
  </svg>
);

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  const token = searchParams.get('token') || '';

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!token) setError('No invite token found. Ask your admin to resend the invite.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.acceptInvite(token, firstName.trim(), lastName.trim(), password);
      const { user: userData, access_token, refresh_token } = res.data;
      loginWithTokens(userData, access_token, refresh_token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = [
    'w-full px-4 py-3 rounded text-sm',
    'bg-white/5 border border-white/15',
    'text-white placeholder-white/30',
    'focus:outline-none focus:border-[#052EF0] focus:bg-white/10',
    'transition-all',
  ].join(' ');

  const labelClass = 'block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, #052EF0 0%, #020A52 45%, #010525 100%)',
      }}
    >
      {/* ── Brand lockup (matches Login exactly) ── */}
      <div className="mb-8 flex flex-col items-center gap-8">
        <BullishIcon className="w-6 h-6 text-white/40" />
        <div
          style={{
            border: '1.5px solid rgba(255,255,255,0.45)',
            borderRadius: '50%',
            width: 272,
            height: 188,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="text-center leading-tight">
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Stealth</span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Startup</span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Finder</span>
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-sm rounded-lg overflow-hidden"
        style={{
          background: 'rgba(1, 5, 37, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header bar */}
        <div className="px-7 pt-6 pb-1 border-b border-white/10">
          <p className="text-[10px] font-display font-semibold tracking-widest uppercase text-white/40 pb-3">
            Join the Team
          </p>
        </div>

        <div className="p-7">
          {error && (
            <div className="mb-5 p-3 rounded text-xs text-red-300 bg-red-900/30 border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First</label>
                <input
                  type="text"
                  placeholder="Brent"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Last</label>
                <input
                  type="text"
                  placeholder="Vartan"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={inputClass}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>
                Password <span className="normal-case font-sans font-normal text-white/25">(min 8 chars)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputClass + ' pr-11'}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white rounded p-1 text-neutral-800 hover:text-black transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={inputClass + ' pr-11'}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white rounded p-1 text-neutral-800 hover:text-black transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token || !firstName.trim() || !lastName.trim() || !password || !confirm}
              className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
              style={{
                backgroundColor:
                  loading || !token || !firstName.trim() || !lastName.trim() || !password || !confirm
                    ? '#1a1a6e'
                    : '#052EF0',
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                  Creating account...
                </>
              ) : (
                'Join the Team →'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/20 tracking-wide">© 2026 Bullish. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
