import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Bullish bracket icon
const BullishIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="32" height="32" stroke="currentColor" strokeWidth="3.5" />
    <line x1="9" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="3" />
    <line x1="9" y1="22" x2="27" y2="22" stroke="currentColor" strokeWidth="3" />
  </svg>
);

export default function Login() {
  const [mode, setMode] = useState('login');

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) { setError(result.error); setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('First name and last name are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const result = await register(email, password, firstName.trim(), lastName.trim());
    if (!result.success) { setError(result.error); setLoading(false); }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
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
      {/* ── Brand badge ── */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <BullishIcon className="w-6 h-6 text-white/40" />
        <div
          className="flex items-center justify-center"
          style={{
            border: '1.5px solid rgba(255,255,255,0.45)',
            borderRadius: '50%',
            width: 210,
            height: 210,
          }}
        >
          <div className="text-center leading-tight">
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">
              Stealth
            </span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">
              Startup
            </span>
            <span className="block font-editorial italic text-white text-[1.45rem] tracking-wide">
              Finder
            </span>
          </div>
        </div>
      </div>

      {/* ── Auth card ── */}
      <div
        className="w-full max-w-sm rounded-lg overflow-hidden"
        style={{
          background: 'rgba(1, 5, 37, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Tab switcher */}
        <div className="flex">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-3.5 text-[10px] font-display font-semibold tracking-widest uppercase transition-colors border-b-2 ${
                mode === m
                  ? 'text-white border-[#052EF0]'
                  : 'text-white/25 border-white/10 hover:text-white/50'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="p-7">
          {error && (
            <div className="mb-5 p-3 rounded text-xs text-red-300 bg-red-900/30 border border-red-500/30">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@bullish.co"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: loading ? '#1a1a6e' : '#052EF0' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass} placeholder="Brent" required disabled={loading} />
                </div>
                <div>
                  <label className={labelClass}>Last</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className={inputClass} placeholder="Vartan" required disabled={loading} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputClass} placeholder="you@bullish.co" required disabled={loading} />
              </div>
              <div>
                <label className={labelClass}>
                  Password <span className="normal-case font-sans font-normal text-white/25">(min 8 chars)</span>
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputClass} placeholder="••••••••" required minLength={8} disabled={loading} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: loading ? '#1a1a6e' : '#052EF0' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                    Creating...
                  </>
                ) : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/20 tracking-wide">© 2026 Bullish. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
