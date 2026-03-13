import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Recycle, Route, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const sections = [
  {
    icon: Recycle,
    title: 'Why Scrapay Exists',
    copy:
      'Scrap collection is often informal, fragmented, and hard to trust. Scrapay exists to give that ecosystem a digital structure without losing the practical reality of how pickup work actually happens.',
  },
  {
    icon: Route,
    title: 'How The Platform Works',
    copy:
      'Users identify scrap and request pickup, vendors manage operational flow, and admins maintain verification, rates, and system trust. Each role sees only the tools needed for its work.',
  },
  {
    icon: ShieldCheck,
    title: 'What Makes It Valuable',
    copy:
      'The platform is designed around trust, visibility, and execution quality. Clear order states, verified vendors, and administrative oversight help the experience stay accountable.',
  },
];

const values = [
  'A warm, operational experience instead of a generic utility app.',
  'Marketplace trust through verification and role-aware access.',
  'A path from household convenience to production-grade operations.',
  'A visual language that feels premium, grounded, and industrial.',
];

const About = () => {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  const nextStepConfig = (() => {
    if (isBootstrapping) {
      return {
        title: 'Loading your workspace.',
        copy: 'We are checking your current session so we can show the most relevant next action.',
        ctaLabel: 'Please wait',
        to: '/about',
        disabled: true,
      };
    }

    if (!isAuthenticated) {
      return {
        title: 'Move from story to signup.',
        copy: 'Choose the role that fits you and enter the Scrapay flow as a user, vendor, or future platform operator.',
        ctaLabel: 'Choose Your Role',
        to: '/register',
        disabled: false,
      };
    }

    if (user?.role === 'vendor') {
      return {
        title: 'Continue into vendor operations.',
        copy: 'Open your vendor workspace to review pickup requests, manage queue activity, and keep service availability updated.',
        ctaLabel: 'Go to Vendor Dashboard',
        to: '/vendor/dashboard',
        disabled: false,
      };
    }

    if (user?.role === 'admin') {
      return {
        title: 'Return to platform control.',
        copy: 'Open the admin console to review accounts, watch order activity, and maintain marketplace trust.',
        ctaLabel: 'Open Admin Panel',
        to: '/admin',
        disabled: false,
      };
    }

    return {
      title: 'Continue your Scrapay journey.',
      copy: 'Go back to your dashboard to book a pickup, track your requests, and work with verified vendors.',
      ctaLabel: 'Go to Dashboard',
      to: '/user/dashboard',
      disabled: false,
    };
  })();

  return (
    <section className="relative overflow-hidden bg-[#120c0a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(245,158,11,0.22),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(199,88,29,0.17),transparent_22%),linear-gradient(135deg,#120c0a_0%,#25160f_34%,#4a2a18_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-10"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-[#d8b48c]">About Scrapay</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h1 className="text-5xl font-black leading-[1.02] text-[#f8e8d1]">A more trustworthy way to move scrap through digital systems.</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#d7c0ab]">
                Scrapay is not only a pickup booking tool. It is a structured layer between people who need convenient disposal, vendors who run real operations, and admins who maintain platform integrity.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/8 bg-[#1b120f]/82 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#a88d75]">Core Values</p>
              <div className="mt-5 space-y-4">
                {values.map((value) => (
                  <div key={value} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-[#ffd08a]">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-[#d7c0ab]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.42 }}
                className="rounded-[32px] border border-white/8 bg-[#1b120f]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/16 text-[#ffd08a]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-[#f8e8d1]">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#d7c0ab]">{section.copy}</p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.42 }}
          className="mt-10 rounded-[34px] border border-white/8 bg-[linear-gradient(90deg,rgba(249,115,22,0.18),rgba(245,158,11,0.08))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#d8b48c]">Next Step</p>
              <h2 className="mt-2 text-3xl font-black text-[#f8e8d1]">{nextStepConfig.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#e0cab3]">
                {nextStepConfig.copy}
              </p>
            </div>
            <Link
              to={nextStepConfig.to}
              aria-disabled={nextStepConfig.disabled}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#2f1a10] shadow-[0_16px_40px_rgba(249,115,22,0.35)] transition ${
                nextStepConfig.disabled
                  ? 'pointer-events-none bg-white/20 text-white/70'
                  : 'bg-[linear-gradient(90deg,#f97316,#f59e0b)] hover:brightness-105'
              }`}
            >
              {nextStepConfig.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
