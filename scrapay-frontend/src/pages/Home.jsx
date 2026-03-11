import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import scrapHero from '/assets/scrap-hero.png';

const pillars = [
  {
    icon: Truck,
    title: 'Pickup With Structure',
    copy: 'From selection to doorstep collection, Scrapay turns a messy offline process into a guided digital flow.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust In The Loop',
    copy: 'Vendor verification, platform oversight, and visible order status make the experience credible.',
  },
  {
    icon: Sparkles,
    title: 'Waste Into Value',
    copy: 'Users unlock convenient recycling while vendors and admins operate inside the same connected system.',
  },
];

const steps = [
  'Choose scrap categories and estimate quantities.',
  'Match with a suitable verified vendor.',
  'Schedule pickup and track the order lifecycle.',
  'Complete the pickup with clear platform visibility.',
];

const Home = () => {
  return (
    <section className="relative overflow-hidden bg-[#120c0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_16%,rgba(245,158,11,0.22),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(199,88,29,0.18),transparent_22%),radial-gradient(circle_at_74%_76%,rgba(245,158,11,0.12),transparent_20%),linear-gradient(135deg,#120c0a_0%,#25160f_34%,#4a2a18_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="grid min-h-[78vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-10"
          >
            <p className="text-xs uppercase tracking-[0.45em] text-[#d8b48c]">Scrapay Platform</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] text-[#f8e8d1] sm:text-6xl">
              The modern operating layer for scrap pickup.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#d7c0ab]">
              Scrapay connects households, vendors, and platform admins inside one warm but disciplined digital experience. It is designed to make collection cleaner, faster, and more trustworthy.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#f97316,#f59e0b)] px-6 py-3 text-sm font-bold text-[#2f1a10] shadow-[0_16px_40px_rgba(249,115,22,0.35)] transition hover:brightness-105"
              >
                Start With Scrapay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#f3e1c9] transition hover:bg-white/[0.08]"
              >
                Learn The Story
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {pillars.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * (index + 1), duration: 0.4 }}
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
            initial={{ opacity: 0, x: 24, y: 18 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.22),transparent_56%)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[40px] border border-white/8 bg-[#1b120f]/82 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-[#a88d75]">How it moves</p>
                <h2 className="mt-3 text-2xl font-black text-[#f8e8d1]">From clutter to collection.</h2>
                <div className="mt-5 space-y-4">
                  {steps.map((step, index) => (
                    <div key={step} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-sm font-bold text-[#ffd08a]">
                        0{index + 1}
                      </div>
                      <p className="text-sm leading-6 text-[#d7c0ab]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4">
                <img
                  src={scrapHero}
                  alt="Scrapay pickup visual"
                  className="h-[300px] w-full rounded-[24px] object-cover object-center"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
