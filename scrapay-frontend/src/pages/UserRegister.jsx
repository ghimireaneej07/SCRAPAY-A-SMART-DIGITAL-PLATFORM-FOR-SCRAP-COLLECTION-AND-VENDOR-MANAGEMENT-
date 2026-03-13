import { motion } from 'framer-motion';
import { ArrowLeft, Chrome, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authService } from '../services/authService.js';

const inputClass =
  'w-full rounded-2xl border border-white/8 bg-white/[0.05] px-4 py-3 text-sm text-[#f7ead7] outline-none transition placeholder:text-[#b89f88] focus:border-[#f59e0b]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#f59e0b]/20';

const storyCards = [
  {
    icon: Truck,
    title: 'Book pickups faster',
    copy: 'Store your identity and address details so repeat scrap orders feel light and immediate.',
  },
  {
    icon: ShieldCheck,
    title: 'Use trusted vendors',
    copy: 'The platform is built to surface approved vendors with status transparency and oversight.',
  },
  {
    icon: MapPin,
    title: 'Prepare for matching',
    copy: 'Good location information improves the quality of future vendor selection and service coverage.',
  },
];

const UserRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [status, setStatus] = useState({ error: '', success: '' });
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: '', success: '' });
    try {
      setSubmitting(true);
      if (!otpRequested) {
        const otpResponse = await authService.requestOtp({
          purpose: 'register_user',
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          full_name: form.name,
          address: form.location,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        });
        setOtpRequested(true);
        setStatus({
          error: '',
          success: otpResponse.detail || 'OTP sent to your email. Verify it to activate your account.',
        });
        return;
      }
      const session = await authService.verifyOtp({
        purpose: 'register_user',
        email: form.email,
        otp: otpCode,
      });
      login(session.user);
      navigate('/user/dashboard');
    } catch (err) {
      setStatus({ error: err.message || 'Registration failed.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120c0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(245,158,11,0.22),transparent_28%),radial-gradient(circle_at_75%_15%,rgba(199,88,29,0.17),transparent_22%),linear-gradient(135deg,#120c0a_0%,#25160f_34%,#4a2a18_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]" />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-[#f7d9a8] transition hover:bg-white/10"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_1fr] lg:px-8">
        <motion.aside
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-10"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-[#d8b48c]">User Registration</p>
          <h1 className="mt-5 text-5xl font-black leading-[1.02] text-[#f8e8d1]">
            Start your
            <br />
            home pickup story.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#d7c0ab]">
            Create a customer account designed for repeat pickup, trusted vendor selection, and clear order tracking from the first request onward.
          </p>

          <div className="mt-10 space-y-4">
            {storyCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * (index + 1), duration: 0.42 }}
                  className="rounded-[28px] border border-white/8 bg-black/15 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-[#ffd08a]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#f8e8d1]">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#ceb8a1]">{item.copy}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, x: 24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="rounded-[36px] border border-white/8 bg-[#1b120f]/88 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#a88d75]">Create account</p>
              <h2 className="mt-2 text-4xl font-black text-[#f8e8d1]">Sign up as User</h2>
              <p className="mt-2 text-sm text-[#cbb199]">Add your account details, then verify the OTP sent to your email.</p>
            </div>
            <Link to="/register" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[#f1dcc1] transition hover:bg-white/5">
              Change role
            </Link>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#f2dfc6] opacity-80"
            >
              <Chrome className="h-4 w-4" /> Continue with Google
            </button>
            <p className="mt-2 text-xs text-[#9e846d]">Designed entry point only. Google OAuth is not connected yet.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Username</label>
              <input type="text" name="username" required value={form.username} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Phone</label>
              <input type="tel" name="phone" required value={form.phone} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Password</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Pincode</label>
              <input type="text" name="pincode" value={form.pincode} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Address</label>
              <input type="text" name="location" required value={form.location} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">City</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">State</label>
              <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} disabled={otpRequested} />
            </div>

            {otpRequested && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#f3e1c9]">Email OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  className={inputClass}
                  placeholder="Enter the 6-digit OTP from your email"
                  required
                />
              </div>
            )}

            <div className="md:col-span-2">
              {status.error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{status.error}</p>}
              {status.success && <p className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-100">{status.success}</p>}
            </div>

            <div className="md:col-span-2 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-[#9e846d]">This information becomes the foundation for your profile and future pickup scheduling.</p>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[linear-gradient(90deg,#f97316,#f59e0b)] px-8 py-3 text-sm font-bold text-[#2f1a10] shadow-[0_16px_40px_rgba(249,115,22,0.35)] transition hover:brightness-105"
              >
                {submitting ? 'Please wait...' : otpRequested ? 'Verify OTP and Create Account' : 'Send OTP to Continue'}
              </button>
              {otpRequested && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpRequested(false);
                    setOtpCode('');
                    setStatus({ error: '', success: '' });
                  }}
                  className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-[#f2dfc6] transition hover:bg-white/5"
                >
                  Edit Details
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default UserRegister;
