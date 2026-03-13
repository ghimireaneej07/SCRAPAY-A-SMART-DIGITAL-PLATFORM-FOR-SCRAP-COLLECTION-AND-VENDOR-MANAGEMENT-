import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Footer = () => {
  const { user, isAuthenticated } = useAuth();

  const dashboardLink =
    user?.role === 'vendor'
      ? '/vendor/dashboard'
      : user?.role === 'admin'
        ? '/admin'
        : '/user/dashboard';

  const accountLink = isAuthenticated
    ? { to: dashboardLink, label: 'Dashboard' }
    : { to: '/login', label: 'Login' };

  return (
    <footer className="bg-[#2c1b12] text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* About */}
        <div>
          <h3 className="text-lg font-bold text-orange-400 mb-3">Scrapay</h3>
          <p className="text-sm leading-relaxed">
            Scrapay helps you turn waste into wealth by connecting users with trusted vendors. Sell your scrap easily and sustainably.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-md font-semibold text-orange-300 mb-2">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/about" className="hover:text-white">Contact</Link></li>
            <li><Link to={accountLink.to} className="hover:text-white">{accountLink.label}</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-md font-semibold text-orange-300 mb-2">Support</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/" className="hover:text-white">FAQ</Link></li>
            <li><Link to="/" className="hover:text-white">Terms of Service</Link></li>
            <li><Link to="/" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-md font-semibold text-orange-300 mb-2">Follow Us</h4>
          <div className="flex space-x-4 text-lg">
            <a href="#" className="hover:text-white"><Facebook className="h-4 w-4" /></a>
            <a href="#" className="hover:text-white"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-white"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>

      {/* Bottom Note */}
      <div className="mt-10 border-t border-gray-600 pt-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} <span className="text-orange-400 font-semibold">Scrapay</span>. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
