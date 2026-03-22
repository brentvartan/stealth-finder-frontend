import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

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

  const inputClass = 'w-full border border-neutral-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#052EF0] transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BullishIcon className="w-10 h-10 text-black mb-3" />
          <h1 className="font-display font-bold text-xl uppercase tracking-widest text-black">
            Stealth Finder
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-editorial italic">
            Bullish Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm" style={{ border: '1px solid #E5E5E0' }}>
          <h2 className="font-display font-bold text-lg uppercase tracking-wide text-black mb-1">
            Accept Invite
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Set up your account to join the team.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded text-xs text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>First Name</label>
                <input
                  type="text"
                  placeholder="Brent"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  type="text"
                  placeholder="Vartan"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !firstName.trim() || !lastName.trim() || !password || !confirm}
              className="w-full py-3 text-sm font-display font-bold tracking-widest uppercase text-white rounded transition-all flex items-center justify-center gap-2 mt-2"
              style={{
                backgroundColor:
                  loading || !token || !firstName.trim() || !lastName.trim() || !password || !confirm
                    ? '#CCC'
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
        </div>

      </div>
    </div>
  );
}
