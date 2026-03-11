import { motion } from 'framer-motion';
import { ArrowLeft, Store, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegisterRoleSelect = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#8B5E3C] via-[#6a432c] to-[#2f2016] px-4 py-10 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 rounded-full bg-[#3E2C1C] p-2 text-yellow-300 transition hover:bg-[#533827]"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="w-full max-w-4xl rounded-[32px] border border-orange-200/15 bg-[#4A2F20]/90 p-8 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">Join Scrapay</p>
          <h1 className="mt-3 text-4xl font-black text-orange-200">Choose Your Role First</h1>
          <p className="mt-4 text-sm leading-6 text-orange-100/80">
            Your registration flow depends on whether you are selling scrap as a household user or operating as a vendor.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            onClick={() => navigate('/register/user')}
            className="rounded-[28px] border border-orange-200/10 bg-[#5A3725] p-7 text-left shadow-xl transition hover:-translate-y-1 hover:bg-[#6A412C]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-400 text-black">
              <User className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-white">Sign up as User</h2>
            <p className="mt-3 text-sm leading-6 text-orange-100/80">
              Best for households or individuals booking scrap pickup and comparing verified vendors.
            </p>
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            onClick={() => navigate('/register/vendor')}
            className="rounded-[28px] border border-orange-200/10 bg-[#5A3725] p-7 text-left shadow-xl transition hover:-translate-y-1 hover:bg-[#6A412C]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-black">
              <Store className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-white">Sign up as Vendor</h2>
            <p className="mt-3 text-sm leading-6 text-orange-100/80">
              Best for scrap businesses that want to receive pickup orders, manage operations, and grow through the platform.
            </p>
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default RegisterRoleSelect;
