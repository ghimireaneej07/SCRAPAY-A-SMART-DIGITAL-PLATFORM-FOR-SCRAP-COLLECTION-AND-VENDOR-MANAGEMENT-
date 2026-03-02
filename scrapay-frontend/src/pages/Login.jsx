import { motion } from 'framer-motion';
import { ArrowLeft, Store, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { authService } from '../services/authService.js';

const roleRedirect = {
  user: '/user/dashboard',
  vendor: '/vendor/dashboard',
  admin: '/admin',
};

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

  const signUpAs = (role) => {
    navigate(role === 'vendor' ? '/register/vendor' : '/register/user');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 rounded-full bg-[#3E2C1C] p-2 text-yellow-300 transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        title="Go back"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <motion.section
        className="w-full max-w-md rounded-2xl bg-[#4A2F20] p-8 text-white shadow-xl"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        aria-label="Login form"
      >
        <h1 className="mb-6 text-center text-3xl font-bold text-orange-300">Welcome Back</h1>

        <form onSubmit={handleLogin} className="flex flex-col space-y-5">
          <div>
            <label htmlFor="username" className="mb-1 block text-orange-200">
              Username
            </label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-lg bg-yellow-100 px-4 py-3 text-black transition-shadow duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-orange-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg bg-yellow-100 px-4 py-3 text-black transition-shadow duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-orange-400 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-orange-500 hover:shadow-xl"
          >
            Sign In
          </motion.button>
        </form>

        <div className="my-6 border-t border-gray-600" />

        <div className="space-y-3 text-center">
          <p className="text-sm text-gray-300">Do not have an account?</p>
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={() => signUpAs('user')}
              whileHover={{ scale: 1.08 }}
              type="button"
              className="flex items-center gap-2 rounded-full bg-orange-300 px-4 py-2 text-black transition-all duration-300 hover:bg-orange-400 hover:shadow-lg"
            >
              <User size={18} />
              <span>User</span>
            </motion.button>
            <motion.button
              onClick={() => signUpAs('vendor')}
              whileHover={{ scale: 1.08 }}
              type="button"
              className="flex items-center gap-2 rounded-full bg-orange-300 px-4 py-2 text-black transition-all duration-300 hover:bg-orange-400 hover:shadow-lg"
            >
              <Store size={18} />
              <span>Vendor</span>
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Login;
