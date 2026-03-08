import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { orderService } from '../services/orderService.js';

const CompletedOrders = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await orderService.getVendorOrders('completed');
        setCompletedOrders(data);
      } catch (err) {
        setError(err.message || 'Unable to load completed orders.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-6 py-10 font-serif text-white">
      <h2 className="mb-8 text-center text-3xl font-bold text-orange-300">Completed Orders</h2>
      {loading && <p className="mb-4 text-center text-sm text-orange-100">Loading completed orders...</p>}
      {error && <p className="mb-4 text-center text-sm text-red-300">{error}</p>}

      <div className="mb-3 grid grid-cols-3 px-4 text-lg font-semibold text-orange-100">
        <span>User</span>
        <span>Details</span>
        <span className="text-right">Status</span>
      </div>

      <div className="space-y-5">
        {completedOrders.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-3 items-center gap-4 rounded-xl bg-[#A1623C] px-6 py-4 shadow transition-all duration-300 hover:bg-[#bb8a5b]"
          >
            <div className="space-y-1">
              <p className="text-lg font-bold">{order.customer_name}</p>
              <p className="text-sm font-medium text-orange-100">
                {order.items.map((item) => item.category_name).join(', ')}
              </p>
            </div>

            <div className="text-sm text-white">{order.address}</div>

            <div className="flex justify-end pr-4">
              <FaCheckCircle className="animate-pulse text-3xl text-green-300 drop-shadow-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedOrders;
