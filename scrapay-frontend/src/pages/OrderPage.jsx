import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService.js';

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await orderService.getMyOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Unable to load order details.');
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

  if (error || !order) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-2xl font-bold text-orange-300">{error || 'Order not found'}</h1>
        <button
          className="mt-5 rounded-md bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600"
          onClick={() => navigate('/user/dashboard')}
          type="button"
        >
          Back to dashboard
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl rounded-xl bg-[#A1623C] p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-orange-100">Order #{order.id}</h1>
        <p className="mt-1 text-sm text-orange-200">Status: {order.status}</p>
        <p className="mt-4 text-sm text-orange-100">Pickup: {new Date(order.pickup_datetime).toLocaleString()}</p>
        <p className="mt-2 text-sm text-orange-100">Address: {order.address}</p>

        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-orange-100">Items</h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="rounded-md bg-[#4A2F20] p-3 text-sm">
                {item.category_name}: {item.quantity_kg} kg
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-base font-semibold text-yellow-100">
          Estimated Total: INR {order.total_estimated}
        </p>

        <div className="mt-6">
          <button
            type="button"
            className="rounded-md bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600"
            onClick={() => navigate('/user/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </section>
  );
};

export default OrderPage;
