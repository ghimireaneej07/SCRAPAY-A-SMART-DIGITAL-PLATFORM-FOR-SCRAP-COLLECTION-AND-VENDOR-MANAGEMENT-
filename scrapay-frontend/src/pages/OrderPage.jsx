import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService.js';

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ rating: '5', review: '' });

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

  const canCancel = ['pending', 'accepted'].includes(order.status);

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      const updated = await orderService.cancelMyOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError(err.message || 'Unable to cancel order.');
    } finally {
      setSubmitting(false);
    }
  };

  const canLeaveFeedback = order.status === 'completed' && !order.feedback;

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const created = await orderService.submitFeedback(order.id, {
        rating: Number(feedback.rating),
        review: feedback.review,
      });
      setOrder((prev) => ({ ...prev, feedback: created }));
    } catch (err) {
      setError(err.message || 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl rounded-xl bg-[#A1623C] p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-orange-100">Order #{order.id}</h1>
        <p className="mt-1 text-sm text-orange-200">Status: {order.status}</p>
        <p className="mt-4 text-sm text-orange-100">Pickup: {new Date(order.pickup_datetime).toLocaleString()}</p>
        <p className="mt-2 text-sm text-orange-100">Address: {order.address}</p>
        {order.pickup_person_name && (
          <div className="mt-4 rounded-md bg-[#4A2F20] p-4 text-sm text-orange-100">
            <p className="font-semibold text-orange-200">Approved Pickup Details</p>
            <p className="mt-2">Pickup Person: {order.pickup_person_name}</p>
            {order.pickup_person_contact && <p>Contact: {order.pickup_person_contact}</p>}
            {order.approved_at && <p>Approved At: {new Date(order.approved_at).toLocaleString()}</p>}
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-orange-100">Items</h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="rounded-md bg-[#4A2F20] p-3 text-sm">
                <p>{item.category_name}: {item.quantity_kg} kg</p>
                {item.note && <p className="mt-1 text-orange-200">Note: {item.note}</p>}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={`${item.category_name} scrap`}
                    className="mt-3 h-32 w-full rounded-md object-cover md:w-56"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-base font-semibold text-yellow-100">
          Estimated Total: INR {order.total_estimated}
        </p>

        {canLeaveFeedback && (
          <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-3 rounded-md bg-[#4A2F20] p-4">
            <h2 className="text-lg font-semibold text-orange-100">Rate this pickup</h2>
            <select
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              value={feedback.rating}
              onChange={(event) => setFeedback((prev) => ({ ...prev, rating: event.target.value }))}
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Bad</option>
            </select>
            <textarea
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              rows="3"
              placeholder="Write your review (optional)"
              value={feedback.review}
              onChange={(event) => setFeedback((prev) => ({ ...prev, review: event.target.value }))}
            />
            <button
              type="submit"
              className="rounded-md bg-green-600 px-5 py-2 font-semibold hover:bg-green-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}

        {order.feedback && (
          <div className="mt-6 rounded-md bg-[#4A2F20] p-4">
            <h2 className="text-lg font-semibold text-orange-100">Your Feedback</h2>
            <p className="mt-1 text-sm text-orange-200">Rating: {order.feedback.rating}/5</p>
            {order.feedback.review && <p className="mt-2 text-sm text-orange-100">{order.feedback.review}</p>}
          </div>
        )}

        <div className="mt-6">
          {canCancel && (
            <button
              type="button"
              className="mr-3 rounded-md bg-red-500 px-5 py-2 font-semibold hover:bg-red-600 disabled:opacity-60"
              onClick={handleCancel}
              disabled={submitting}
            >
              {submitting ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
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
