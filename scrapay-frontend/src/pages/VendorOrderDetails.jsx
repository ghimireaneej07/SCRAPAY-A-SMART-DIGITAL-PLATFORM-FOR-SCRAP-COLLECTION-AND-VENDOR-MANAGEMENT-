import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService.js';

const VendorOrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvalForm, setApprovalForm] = useState({
    pickup_person_name: '',
    pickup_person_contact: '',
    pickup_datetime: '',
  });

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await orderService.getVendorOrderById(id);
        setSelectedOrder(data);
        setApprovalForm({
          pickup_person_name: data.pickup_person_name || '',
          pickup_person_contact: data.pickup_person_contact || '',
          pickup_datetime: data.pickup_datetime ? new Date(data.pickup_datetime).toISOString().slice(0, 16) : '',
        });
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
      const payload =
        action === 'accept'
          ? {
              pickup_person_name: approvalForm.pickup_person_name,
              pickup_person_contact: approvalForm.pickup_person_contact,
              pickup_datetime: approvalForm.pickup_datetime ? new Date(approvalForm.pickup_datetime).toISOString() : undefined,
            }
          : undefined;
      const updated = await orderService.vendorAction(
        selectedOrder.id,
        action,
        payload,
      );
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
              <UserRound className="h-5 w-5" /> {selectedOrder.customer_name}
            </div>
            <div className="w-max rounded bg-white px-3 py-1 text-sm font-medium text-[#8B5E3C]">
              {selectedOrder.items.map((item) => item.category_name).join(', ')}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-1 h-4 w-4" />
            <p className="leading-snug">{selectedOrder.address}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-xl bg-[#C2976C] p-6 shadow-lg">
        <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-6 py-2 font-medium text-black">
          <CalendarDays className="h-4 w-4" />
          <span>{pickupDate.toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-6 py-2 font-medium text-black">
          <Clock3 className="h-4 w-4" />
          <span>{pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="w-full rounded-xl bg-[#8B5E3C] p-4 text-sm text-orange-50">
          <p className="font-semibold text-orange-100">Scrap Items</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="rounded-lg bg-[#A1623C] p-3">
                <p className="font-semibold">{item.category_name}</p>
                <p className="mt-1">{item.quantity_kg} kg</p>
                {item.note && <p className="mt-1 text-orange-100">Note: {item.note}</p>}
                {item.image_url && <img src={item.image_url} alt={item.category_name} className="mt-3 h-32 w-full rounded-md object-cover" />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-full bg-[#8B5E3C] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-orange-100">
          Status: {selectedOrder.status}
        </div>

        {selectedOrder.status === 'pending' && (
          <div className="w-full rounded-xl bg-[#8B5E3C] p-4 text-sm text-orange-50">
            <p className="font-semibold text-orange-100">Pickup Approval Details</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input
                className="rounded-md bg-yellow-100 px-3 py-2 text-black"
                placeholder="Pickup person name"
                value={approvalForm.pickup_person_name}
                onChange={(event) => setApprovalForm((prev) => ({ ...prev, pickup_person_name: event.target.value }))}
              />
              <input
                className="rounded-md bg-yellow-100 px-3 py-2 text-black"
                placeholder="Contact number"
                value={approvalForm.pickup_person_contact}
                onChange={(event) => setApprovalForm((prev) => ({ ...prev, pickup_person_contact: event.target.value }))}
              />
              <input
                type="datetime-local"
                className="rounded-md bg-yellow-100 px-3 py-2 text-black"
                value={approvalForm.pickup_datetime}
                onChange={(event) => setApprovalForm((prev) => ({ ...prev, pickup_datetime: event.target.value }))}
              />
            </div>
          </div>
        )}

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
