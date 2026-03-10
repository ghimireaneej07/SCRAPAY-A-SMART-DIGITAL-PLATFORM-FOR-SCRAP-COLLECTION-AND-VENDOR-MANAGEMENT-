import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Search, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { catalogService } from '../services/catalogService.js';

const navLinkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-sm font-semibold transition ${isActive ? 'text-white' : 'text-orange-100/90 hover:text-white'}`;

const ProfileAvatar = ({ user }) => {
  const label = user?.full_name || user?.username || 'U';
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={label}
        className="h-11 w-11 rounded-full border border-[#f7b467]/60 object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f7b467]/60 bg-[#6a3f29] font-bold text-[#ffd9a7]">
      {label.charAt(0).toUpperCase()}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ categories: [], vendors: [], orders: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const profileRef = useRef(null);

  const authLinks = isAuthenticated
    ? [
        ...(user?.role === 'user' ? [{ to: '/user/dashboard', label: 'Dashboard' }] : []),
        ...(user?.role === 'vendor' ? [{ to: '/vendor/dashboard', label: 'Dashboard' }] : []),
        ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Dashboard' }] : []),
      ]
    : [
        { to: '/login', label: 'Sign In' },
        { to: '/register/user', label: 'Sign Up' },
      ];

  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    closeMenu();
    navigate('/login');
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || query.trim().length < 2) {
      setResults({ categories: [], vendors: [], orders: [] });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const payload = await catalogService.search(query.trim());
        setResults(payload);
      } catch {
        setResults({ categories: [], vendors: [], orders: [] });
      } finally {
        setLoadingSearch(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isAuthenticated, query]);

  const hasSearchResults = useMemo(
    () =>
      results.categories.length > 0 || results.vendors.length > 0 || results.orders.length > 0,
    [results],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-gradient-to-r from-[#8b5b3d] to-[#7a4d34] text-white shadow-2xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="text-4xl font-black tracking-tight text-[#ffbe70]" onClick={closeMenu}>
          Scrapay
        </Link>

        <div className="relative hidden flex-1 md:block">
          <div className="flex items-center gap-2 rounded-full border border-[#c07a4a] bg-[#6a3f29]/95 px-4 py-2">
            <Search className="h-4 w-4 text-[#ffd9a7]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, vendors, categories"
              className="w-full bg-transparent text-sm text-[#ffe7c6] placeholder:text-[#ffe7c6]/70 focus:outline-none"
            />
          </div>

          {(loadingSearch || hasSearchResults) && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-12 rounded-xl border border-[#c07a4a] bg-[#5d3826] p-3 shadow-xl">
              {loadingSearch && <p className="text-xs text-orange-100">Searching...</p>}
              {!loadingSearch && !hasSearchResults && <p className="text-xs text-orange-100">No results</p>}
              {!loadingSearch && (
                <div className="space-y-2 text-sm">
                  {results.orders.map((order) => (
                    <button
                      key={`o-${order.id}`}
                      type="button"
                      onClick={() => {
                        navigate(`/order/${order.id}`);
                        setQuery('');
                      }}
                      className="block w-full rounded bg-[#77492f] px-3 py-2 text-left hover:bg-[#8a5434]"
                    >
                      Order #{order.id} ({order.status})
                    </button>
                  ))}
                  {results.vendors.map((vendor) => (
                    <button
                      key={`v-${vendor.id}`}
                      type="button"
                      onClick={() => {
                        navigate('/vendor-selection');
                        setQuery('');
                      }}
                      className="block w-full rounded bg-[#77492f] px-3 py-2 text-left hover:bg-[#8a5434]"
                    >
                      Vendor: {vendor.business_name || vendor.username}
                    </button>
                  ))}
                  {results.categories.map((category) => (
                    <button
                      key={`c-${category.id}`}
                      type="button"
                      onClick={() => {
                        navigate('/user/dashboard');
                        setQuery('');
                      }}
                      className="block w-full rounded bg-[#77492f] px-3 py-2 text-left hover:bg-[#8a5434]"
                    >
                      Category: {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
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
            <span className="rounded-full bg-[#6d412b] px-3 py-1 text-xs font-semibold text-[#ffd9a7]">
              Alerts {unreadCount} Live
            </span>
          )}

          {isAuthenticated && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="rounded-full p-0.5 transition hover:bg-white/10"
                aria-label="Open profile menu"
              >
                <ProfileAvatar user={user} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-14 w-56 rounded-xl border border-[#c07a4a] bg-[#5d3826] p-3 shadow-2xl"
                  >
                    <p className="text-sm font-semibold text-[#ffd9a7]">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-[#ffe7c6]/80">{user?.email}</p>
                    <div className="my-2 border-t border-[#8c5c3f]" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#ffe7c6] hover:bg-[#734a33]"
                    >
                      <User className="h-4 w-4" /> Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-[#ff9400] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ff8600]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center rounded-md p-2 hover:bg-[#70482f] md:hidden"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-orange-200/20 bg-[#7f5537] md:hidden"
          >
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-2 rounded-full border border-[#c07a4a] bg-[#6a3f29]/95 px-4 py-2">
                <Search className="h-4 w-4 text-[#ffd9a7]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent text-sm text-[#ffe7c6] placeholder:text-[#ffe7c6]/70 focus:outline-none"
                />
              </div>
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
                  onClick={() => {
                    closeMenu();
                    navigate('/profile');
                  }}
                  className="rounded bg-[#6d412b] px-3 py-2 text-sm text-[#ffd9a7]"
                >
                  Profile
                </button>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded bg-[#ff9400] px-3 py-2 text-sm font-semibold text-white"
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
