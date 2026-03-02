import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppFlow } from '../hooks/useAppFlow.js';
import { orderService } from '../services/orderService.js';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { setSelectedOrder } = useAppFlow();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await orderService.getVendorOrders('pending');
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Unable to load orders.');
      }
    };
    loadOrders();
  }, []);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    navigate('/vendor/order-details');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-6 py-10 text-white sm:px-10">
      <h1 className="mb-12 text-4xl font-extrabold tracking-wide text-orange-300">Order Requests</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

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
              </div>
              <button
                onClick={() => handleViewOrder(order)}
                type="button"
                className="rounded-full bg-orange-400 p-3 shadow transition hover:bg-orange-500"
                aria-label={`View order from ${order.customer_name}`}
              >
                <FaArrowRight />
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
