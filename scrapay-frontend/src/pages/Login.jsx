import { motion } from 'framer-motion';
import { ArrowLeft, Chrome, LockKeyhole, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authService } from '../services/authService.js';

const roleRedirect = {
  user: '/user/dashboard',
  vendor: '/vendor/dashboard',
  admin: '/admin',
};

const inputClass =
  'w-full rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3 text-sm text-[#f7ead7] outline-none transition placeholder:text-[#b89f88] focus:border-[#f59e0b]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#f59e0b]/20';

const featureCards = [
  {
    icon: Truck,
    title: 'Pickup Tracking',
    copy: 'Follow every request from creation to completion with real operational visibility.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Network',
    copy: 'Work only with vetted vendors and monitored platform actions.',
  },
  {
    icon: Sparkles,
    title: 'Unified Workspace',
    copy: 'Users, vendors, and admins all enter through one consistent Scrapay identity layer.',
  },
];

const Login = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const session = await authService.login(form);
      login(session.user);
      navigate(roleRedirect[session.user.role] ?? '/');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120c0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.22),transparent_28%),radial-gradient(circle_at_78%_14%,rgba(199,88,29,0.18),transparent_24%),radial-gradient(circle_at_72%_76%,rgba(250,204,21,0.12),transparent_22%),linear-gradient(135deg,#120c0a_0%,#25160f_34%,#4a2a18_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]" />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-[#f7d9a8] transition hover:bg-white/10"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-10"
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.45em] text-[#d8b48c]">Scrapay Access</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] text-[#f8e8d1]">
              Waste to value,
              <br />
              managed with clarity.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#d7c0ab]">
              Sign in to enter a platform designed for modern scrap operations. Household users book pickups, vendors run live queues, and admins keep the marketplace trusted.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * (index + 1), duration: 0.42 }}
                  className="rounded-[28px] border border-white/8 bg-black/15 p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-[#ffd08a]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-[#f8e8d1]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#ceb8a1]">{item.copy}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="rounded-[36px] border border-[#f1dcc1]/10 bg-[#1b120f]/88 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-[#ffd08a]">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#f8e8d1]">Account Sign In</h2>
              <p className="mt-1 text-sm text-[#cbb199]">Use your Scrapay credentials to continue.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#f2dfc6] opacity-80"
            >
              <Chrome className="h-4 w-4" /> Continue with Google
            </button>
            <button
              type="button"
              disabled
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#a99179] opacity-80"
            >
              Enterprise SSO Soon
            </button>
          </div>
          <p className="mt-2 text-xs text-[#9e846d]">These are UI placeholders. OAuth is not implemented on the backend yet.</p>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.35em] text-[#a88d75]">Or continue</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#f3e1c9]">
                Username
              </label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={inputClass}
                autoComplete="username"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#f3e1c9]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={inputClass}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[linear-gradient(90deg,#f97316,#f59e0b)] py-3 text-sm font-bold text-[#2f1a10] shadow-[0_16px_40px_rgba(249,115,22,0.35)] transition hover:brightness-105"
            >
              Sign In to Scrapay
            </button>
          </form>

          <div className="mt-7 rounded-[28px] border border-white/8 bg-white/[0.04] px-5 py-5 text-center">
            <p className="text-sm text-[#cbb199]">Do not have an account yet?</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="mt-4 rounded-full bg-[#f5e4c7] px-5 py-2.5 text-sm font-bold text-[#3a2418] transition hover:bg-white"
            >
              Choose Sign Up Role
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Login;
