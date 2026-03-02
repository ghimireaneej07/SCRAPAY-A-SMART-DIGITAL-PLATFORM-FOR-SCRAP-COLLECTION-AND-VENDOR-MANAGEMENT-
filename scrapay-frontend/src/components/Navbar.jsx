import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const navLinkClass = ({ isActive }) =>
  `transition hover:text-orange-300 ${isActive ? 'text-orange-300' : 'text-white'}`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const closeMenu = () => setIsOpen(false);

  const authLinks = isAuthenticated
    ? [
        ...(user?.role === 'user' ? [{ to: '/user/dashboard', label: 'Dashboard' }] : []),
        ...(user?.role === 'vendor' ? [{ to: '/vendor/dashboard', label: 'Orders' }] : []),
        ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [
        { to: '/login', label: 'Sign In' },
        { to: '/register/user', label: 'Sign Up' },
      ];

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-orange-200/20 bg-[#8B5E3C] text-white shadow-md">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-orange-300"
          aria-label="Scrapay home"
          onClick={closeMenu}
        >
          Scrapay
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 transition hover:bg-[#70482f] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 md:hidden"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex md:text-base">
          <Search className="h-5 w-5" aria-hidden="true" />
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          {authLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-orange-400 px-4 py-2 font-semibold transition hover:bg-orange-500"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-orange-200/20 bg-[#7f5537] md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4 text-sm font-medium">
              <NavLink to="/" className={navLinkClass} onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink to="/about" className={navLinkClass} onClick={closeMenu}>
                About
              </NavLink>
              {authLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-fit rounded-md bg-orange-400 px-4 py-2 font-semibold transition hover:bg-orange-500"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
