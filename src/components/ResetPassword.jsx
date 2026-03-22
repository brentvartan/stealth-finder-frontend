import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { CheckCircle } from 'lucide-react';

const BullishIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="33" height="33" stroke="currentColor" strokeWidth="3" />
    <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="currentColor" />
    <polygon points="8.5,22 27,22 26,25 8.5,25" fill="currentColor" />
  </svg>
);

export default function ResetPassword() {
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const token            = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  const inputClass = [
    'w-full px-4 py-3 rounded text-sm',
    'bg-white/5 border border-white/15',
    'text-white placeholder-white/30',
    'focus:outline-none focus:border-[#052EF0] focus:bg-white/10',
    'transition-all',
  ].join(' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.');                  return; }
    if (!token)                { setError('Invalid reset link. Please request a new one.'); return; }

    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { state: { resetSuccess: true } }), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('expired')) {
        setError('This reset link has expired. Please request a new one.');
      } else if (msg.toLowerCase().includes('invalid')) {
        setError('Invalid reset link. Please request a new one.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #052EF0 0%, #020A52 45%, #010525 100%)' }}
    >
      <div className="mb-10 flex flex-col items-center gap-4">
        <BullishIcon className="w-6 h-6 text-white/40" />
        <div className="flex items-center justify-center"
          style={{ border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: '50%', width: 210, height: 210 }}>
          <div className="text-center leading-tight">
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Stealth</span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Startup</span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">Finder</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-lg overflow-hidden"
        style={{ background: 'rgba(1, 5, 37, 0.75)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
        <div className="p-7">
          {!token ? (
            <div className="text-center space-y-4">
              <p className="text-white/50 text-sm">Invalid reset link.</p>
              <Link to="/forgot-password"
                className="text-xs text-white/40 hover:text-white/70 underline transition-colors">
                Request a new one
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)' }}>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-base uppercase tracking-widest mb-2">
                  Password Updated
                </h2>
                <p className="text-white/50 text-sm">Redirecting you to sign in...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-1">
                  Set New Password
                </h2>
                <p className="text-white/40 text-xs">Choose a strong password — at least 8 characters.</p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded text-xs text-red-300 bg-red-900/30 border border-red-500/30">
                  {error}
                  {(error.includes('expired') || error.includes('Invalid')) && (
                    <Link to="/forgot-password" className="block mt-1.5 underline text-red-300/80 hover:text-red-300">
                      Request a new link
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
                  style={{ backgroundColor: (loading || !password || !confirm) ? '#1a1a6e' : '#052EF0' }}
                >
                  {loading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" /> Updating...</>
                  ) : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
