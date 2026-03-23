import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Bullish logo mark — square border + two parallelogram bars
const BullishIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="33" height="33" stroke="currentColor" strokeWidth="3" />
    <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="currentColor" />
    <polygon points="8.5,22 27,22 26,25 8.5,25" fill="currentColor" />
  </svg>
);

export default function Login() {
  const [mode, setMode] = useState('login');

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass + ' pr-11'}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
              <div className="text-center mt-3">
                <Link
                  to="/forgot-password"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass + ' pr-11'}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
