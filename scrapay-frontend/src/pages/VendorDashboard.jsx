import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationStatusCard from '../components/VerificationStatusCard';
import { authService } from '../services/authService.js';
import { orderService } from '../services/orderService.js';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderData, availability, profileData] = await Promise.all([
          orderService.getVendorOrders(),
          authService.getVendorAvailability(),
          authService.getProfile(),
        ]);
        setOrders(
          orderData.filter((order) =>
            ['pending', 'accepted', 'in_progress'].includes(order.status),
          ),
        );
        setIsOnline(Boolean(availability.is_online));
        setProfile(profileData);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'pending').length;
    const active = orders.filter((order) => ['accepted', 'in_progress'].includes(order.status)).length;
    return {
      total: orders.length,
      pending,
      active,
    };
  }, [orders]);

  const handleViewOrder = (order) => {
    navigate(`/vendor/order-details/${order.id}`);
  };

  const toggleAvailability = async () => {
    try {
      setUpdatingAvailability(true);
      const updated = await authService.setVendorAvailability(!isOnline);
      setIsOnline(Boolean(updated.is_online));
    } catch (err) {
      setError(err.message || 'Unable to update availability.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-6 py-10 text-white sm:px-10">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-orange-200/15 bg-[#4A2F20]/75 p-6 shadow-xl lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-orange-200/70">Vendor Operations</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-wide text-orange-300">Order Requests</h1>
          <p className="mt-2 text-sm text-orange-100/80">Monitor incoming pickups and move active jobs forward.</p>
        </div>
        <button
          type="button"
          onClick={toggleAvailability}
          disabled={updatingAvailability || (profile && !profile.is_verified)}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${
            isOnline ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
          title={profile && !profile.is_verified ? 'Available only for verified vendors' : ''}
        >
          {updatingAvailability ? 'Updating...' : isOnline ? 'Available for pickup' : 'Marked offline'}
        </button>
      </div>

      {/* Verification Status Card */}
      {profile && profile.verification_status && (
        <VerificationStatusCard
          status={profile.verification_status}
          rejectionReason={profile.rejection_reason || ''}
          verifiedAt={profile.verified_at}
        />
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Open queue</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Pending review</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Active pickups</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.active}</p>
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {loading && <p className="mb-4 text-sm text-orange-200">Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200/20 bg-[#4A2F20]/60 p-8 text-center">
          <h2 className="text-xl font-semibold text-orange-200">No active pickup requests</h2>
          <p className="mt-2 text-sm text-orange-100/80">New customer orders will appear here when assigned to you.</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {orders.map((order, index) => (
          <motion.article
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="rounded-xl bg-[#A1623C] p-6 text-white shadow-md transition-all hover:bg-[#b77643] hover:shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-yellow-100">{order.customer_name}</h2>
                <p className="mt-1 text-base text-orange-100">{order.items.map((item) => item.category_name).join(', ')}</p>
                <p className="mt-1 text-sm uppercase tracking-wide text-orange-200">Status: {order.status}</p>
              </div>
              <button
                onClick={() => handleViewOrder(order)}
                type="button"
                className="rounded-full bg-orange-400 p-3 shadow transition hover:bg-orange-500"
                aria-label={`View order from ${order.customer_name}`}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-orange-300 pt-3 text-base italic leading-relaxed text-orange-100">
              {order.address}
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <button
          onClick={() => navigate('/vendor/completed-orders')}
          type="button"
          className="w-full max-w-md rounded-xl bg-orange-500 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-orange-600"
        >
          View Completed Orders
        </button>
      </div>
    </section>
  );
};

export default VendorDashboard;
