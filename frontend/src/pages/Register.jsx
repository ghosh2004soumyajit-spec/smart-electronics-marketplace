import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/ui/Icons';

const EASE_OUT = [0.16, 1, 0.3, 1];

const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), label: 'One uppercase letter' },
  { test: (v) => /[0-9]/.test(v), label: 'One number' },
];

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(form.password)).length;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.email.trim()) return setError('Email address is required.');
    if (passwordStrength < PASSWORD_RULES.length) return setError('Password does not meet all requirements.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    const result = await register(form.full_name.trim(), form.email.trim(), form.password, form.phone.trim() || undefined);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  const strengthColor = ['bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-volt'];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-blueprint opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative w-full max-w-[440px]"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="VoltHaus home">
            <LogoMark size={32} />
            <span className="font-display text-[20px] font-bold uppercase tracking-[0.2em]">
              Volt<span className="text-volt">Haus</span>
            </span>
          </Link>
          <p className="label mb-2">New Account</p>
          <h1 className="font-display text-3xl font-bold">Create account</h1>
        </div>

        {/* Card */}
        <div className="border border-line bg-paper p-8">
          <div className="mb-6 border-b border-line pb-4 flex items-center justify-between">
            <span className="label-volt">— Auth</span>
            <span className="label">Registration</span>
          </div>

          <form id="register-form" onSubmit={submit} noValidate className="space-y-5">
            {/* Error */}
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

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="label block">Full name</label>
              <input
                id="reg-name"
                name="full_name"
                type="text"
                autoComplete="name"
                value={form.full_name}
                onChange={handle}
                required
                placeholder="John Doe"
                className="w-full border border-line bg-paper2 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink3 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="label block">Email address</label>
              <input
                id="reg-email"
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

            {/* Phone (optional) */}
            <div className="space-y-1.5">
              <label htmlFor="reg-phone" className="label block">
                Phone <span className="text-ink3 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handle}
                placeholder="+91 98765 43210"
                className="w-full border border-line bg-paper2 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink3 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="label block">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handle}
                  required
                  placeholder="••••••••"
                  className="w-full border border-line bg-paper2 px-4 py-3 pr-12 font-mono text-sm text-ink placeholder:text-ink3 focus:border-ink focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  id="reg-toggle-pw"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 label px-1 hover:text-ink transition-colors"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-1">
                    {PASSWORD_RULES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 transition-all duration-300 ${i < passwordStrength ? strengthColor[passwordStrength] : 'bg-line'}`}
                      />
                    ))}
                  </div>
                  <ul className="space-y-0.5">
                    {PASSWORD_RULES.map((r) => (
                      <li key={r.label} className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${r.test(form.password) ? 'text-volt' : 'text-ink3'}`}>
                        <span>{r.test(form.password) ? '✓' : '○'}</span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="label block">Confirm password</label>
              <input
                id="reg-confirm"
                name="confirm"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm}
                onChange={handle}
                required
                placeholder="••••••••"
                className={`w-full border bg-paper2 px-4 py-3 font-mono text-sm text-ink placeholder:text-ink3 focus:outline-none transition-colors ${
                  touched && form.confirm && form.password !== form.confirm
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-line focus:border-ink'
                }`}
              />
              {touched && form.confirm && form.password !== form.confirm && (
                <p className="font-mono text-[11px] text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <SpinIcon /> Creating account…
                </span>
              ) : (
                'Create account →'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-line pt-5 flex items-center justify-between">
            <span className="label">Have an account?</span>
            <Link
              to="/login"
              state={{ from }}
              className="ul-link label-volt font-mono text-[11px] uppercase tracking-[0.14em]"
            >
              Sign in →
            </Link>
          </div>
        </div>
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
