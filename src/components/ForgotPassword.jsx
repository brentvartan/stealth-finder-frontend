import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/client';
import { ArrowLeft, Mail } from 'lucide-react';

const BullishIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="33" height="33" stroke="currentColor" strokeWidth="3" />
    <polygon points="8.5,10.5 18,10.5 17,13 8.5,13" fill="currentColor" />
    <polygon points="8.5,22 27,22 26,25 8.5,25" fill="currentColor" />
  </svg>
);

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
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
          {submitted ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: 'rgba(5,46,240,0.2)', border: '1px solid rgba(5,46,240,0.4)' }}>
                <Mail className="w-5 h-5 text-[#052EF0]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-base uppercase tracking-widest mb-2">
                  Check your email
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  If <span className="text-white/80 font-medium">{email}</span> is registered,
                  you'll receive a reset link within a few minutes.
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all"
                style={{ backgroundColor: '#052EF0' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-1">
                  Reset Password
                </h2>
                <p className="text-white/40 text-xs leading-relaxed">
                  Enter your email and we'll send you a link to set a new password.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded text-xs text-red-300 bg-red-900/30 border border-red-500/30">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-wide uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@bullish.co"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 text-sm font-display font-semibold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
                  style={{ backgroundColor: (loading || !email.trim()) ? '#1a1a6e' : '#052EF0' }}
                >
                  {loading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" /> Sending...</>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
