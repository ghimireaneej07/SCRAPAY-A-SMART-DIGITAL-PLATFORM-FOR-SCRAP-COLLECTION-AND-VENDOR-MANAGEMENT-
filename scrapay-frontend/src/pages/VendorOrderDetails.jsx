import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService.js';

const VendorOrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await orderService.getVendorOrderById(id);
        setSelectedOrder(data);
      } catch (err) {
        setError(err.message || 'Unable to load order.');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center text-white">
        <p className="text-orange-100">Loading order...</p>
      </section>
    );
  }

  if (error || !selectedOrder) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-2xl font-bold text-orange-300">{error || 'Order not found'}</h1>
        <button
          className="mt-5 rounded-md bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600"
          onClick={() => navigate('/vendor/dashboard')}
          type="button"
        >
          Back to dashboard
        </button>
      </section>
    );
  }

  const handleAction = async (action) => {
    try {
      const updated = await orderService.vendorAction(selectedOrder.id, action);
      setSelectedOrder(updated);
      if (updated.status === 'rejected' || updated.status === 'completed') {
        navigate('/vendor/dashboard');
      }
    } catch {
      setError('Unable to update order status.');
    }
  };

  const pickupDate = new Date(selectedOrder.pickup_datetime);

  return (
    <section className="min-h-screen bg-[#8B5E3C] px-6 py-6 font-serif text-white">
      <div className="mb-8 rounded-xl bg-[#A1623C] p-6 shadow-lg">
        <div className="grid grid-cols-1 items-center gap-4 text-sm md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-lg font-bold">
              <FaUser /> {selectedOrder.customer_name}
            </div>
            <div className="w-max rounded bg-white px-3 py-1 text-sm font-medium text-[#8B5E3C]">
              {selectedOrder.items.map((item) => item.category_name).join(', ')}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <FaMapMarkerAlt className="mt-1" />
            <p className="leading-snug">{selectedOrder.address}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-xl bg-[#C2976C] p-6 shadow-lg">
        <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-6 py-2 font-medium text-black">
          <FaCalendarAlt />
          <span>{pickupDate.toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-6 py-2 font-medium text-black">
          <FaClock />
          <span>{pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="rounded-full bg-[#8B5E3C] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-orange-100">
          Status: {selectedOrder.status}
        </div>

        <div className="mt-6 flex gap-6">
          {selectedOrder.status === 'pending' && (
            <>
              <button
                className="rounded-full bg-green-500 px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-green-600"
                onClick={() => handleAction('accept')}
                type="button"
              >
                Accept
              </button>
              <button
                className="rounded-full bg-red-500 px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-red-600"
                onClick={() => handleAction('reject')}
                type="button"
              >
                Reject
              </button>
            </>
          )}
          {selectedOrder.status === 'accepted' && (
            <button
              className="rounded-full bg-blue-500 px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-blue-600"
              onClick={() => handleAction('start')}
              type="button"
            >
              Start Pickup
            </button>
          )}
          {selectedOrder.status === 'in_progress' && (
            <button
              className="rounded-full bg-green-600 px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-green-700"
              onClick={() => handleAction('complete')}
              type="button"
            >
              Complete Pickup
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default VendorOrderDetails;
