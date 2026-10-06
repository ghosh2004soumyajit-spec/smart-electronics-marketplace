import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/ui/Icons';

const EASE_OUT = [0.16, 1, 0.3, 1];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-16">
      {/* Background blueprint grid */}
      <div className="pointer-events-none absolute inset-0 bg-blueprint opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative w-full max-w-[400px]"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="VoltHaus home">
            <LogoMark size={32} />
            <span className="font-display text-[20px] font-bold uppercase tracking-[0.2em]">
              Volt<span className="text-volt">Haus</span>
            </span>
          </Link>
          <p className="label mb-2">Account Access</p>
          <h1 className="font-display text-3xl font-bold">Sign in</h1>
        </div>

        {/* Card */}
        <div className="border border-line bg-paper p-8">
          {/* Label strip */}
          <div className="mb-6 border-b border-line pb-4 flex items-center justify-between">
            <span className="label-volt">— Auth</span>
            <span className="label">Login</span>
          </div>

          <form id="login-form" onSubmit={submit} noValidate className="space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="border border-red-300 bg-red-50 px-4 py-3 font-mono text-[12px] text-red-700">
                    ⚠ {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="label block">
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handle}
                required
                placeholder="you@example.com"
                className="w-full border border-line bg-paper2 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink3 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="label block">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handle}
                  required
                  placeholder="••••••••"
                  className="w-full border border-line bg-paper2 px-4 py-3 pr-12 font-mono text-sm text-ink placeholder:text-ink3 focus:border-ink focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  id="login-toggle-pw"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 label px-1 hover:text-ink transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <SpinIcon /> Signing in…
                </span>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 border-t border-line pt-5 flex items-center justify-between">
            <span className="label">New here?</span>
            <Link
              to="/register"
              state={{ from }}
              className="ul-link label-volt hover:text-volt font-mono text-[11px] uppercase tracking-[0.14em]"
            >
              Create account →
            </Link>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-center label">
          By signing in you agree to our{' '}
          <span className="ul-link text-ink3 hover:text-ink cursor-pointer">Terms</span> and{' '}
          <span className="ul-link text-ink3 hover:text-ink cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}

function SpinIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
