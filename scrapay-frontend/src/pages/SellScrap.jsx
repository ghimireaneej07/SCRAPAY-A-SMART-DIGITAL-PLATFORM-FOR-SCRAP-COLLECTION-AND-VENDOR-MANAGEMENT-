import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppFlow } from '../hooks/useAppFlow.js';
import { orderService } from '../services/orderService.js';

const createInitialFormState = (scrapTypes) =>
  scrapTypes.reduce((acc, category) => {
    acc[category.id] = {
      quantity: '',
      pickupDate: '',
      pickupTime: '',
      note: '',
      image: null,
    };
    return acc;
  }, {});

const SellScrap = () => {
  const navigate = useNavigate();
  const { selectedScraps, selectedVendor } = useAppFlow();
  const [formData, setFormData] = useState(() => createInitialFormState(selectedScraps));
  const [pickupAddress, setPickupAddress] = useState('');
  const [error, setError] = useState('');

  const selectedCategories = useMemo(() => selectedScraps, [selectedScraps]);

  const handleChange = (categoryId, field, value) => {
    setFormData((prev) => {
      const updated = { ...prev };

      if (field === 'pickupDate' || field === 'pickupTime') {
        Object.keys(updated).forEach((key) => {
          updated[key] = {
            ...updated[key],
            [field]: value,
          };
        });
      } else {
        updated[categoryId] = {
          ...updated[categoryId],
          [field]: value,
        };
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const firstCategory = selectedCategories[0];
    const pickupDate = formData[firstCategory.id]?.pickupDate;
    const pickupTime = formData[firstCategory.id]?.pickupTime;

    const items = selectedCategories.map((category) => ({
      category_id: category.id,
      quantity_kg: formData[category.id].quantity,
      note: formData[category.id].note,
      image_url: '',
    }));

    try {
      const order = await orderService.createOrder({
        vendor: selectedVendor.id,
        pickup_datetime: `${pickupDate}T${pickupTime}:00+05:30`,
        address: pickupAddress,
        customer_note: '',
        items,
      });
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err.message || 'Unable to submit order.');
    }
  };

  if (!selectedCategories.length || !selectedVendor) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-2xl font-bold text-orange-300">Flow is incomplete</h1>
        <p className="mt-2 text-orange-100">Select scrap and vendor before placing an order.</p>
        <button
          type="button"
          onClick={() => navigate('/user/dashboard')}
          className="mt-5 rounded-md bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600"
        >
          Back to dashboard
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-orange-200">Sell Scrap</h1>
        <p className="mb-8 text-center text-orange-100">
          Selected vendor: <span className="font-semibold">{selectedVendor.business_name || selectedVendor.username}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-orange-200">Pickup Address</label>
            <input
              value={pickupAddress}
              onChange={(event) => setPickupAddress(event.target.value)}
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              required
            />
          </div>

          <div className="mb-8 overflow-x-auto rounded-xl bg-[#A1623C] shadow-lg">
            <table className="w-full text-sm">
              <thead className="text-left text-orange-100">
                <tr>
                  <th className="px-4 py-3">Scrap Type</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Pickup Date</th>
                  <th className="px-4 py-3">Pickup Time</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {selectedCategories.map((category, index) => (
                  <tr key={category.id} className={index % 2 === 0 ? 'bg-[#4A2F20]/60' : ''}>
                    <td className="px-4 py-2 font-semibold">{category.name}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        value={formData[category.id]?.quantity || ''}
                        onChange={(event) => handleChange(category.id, 'quantity', event.target.value)}
                        className="w-full rounded bg-yellow-100 px-2 py-1 text-black"
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={formData[category.id]?.pickupDate || ''}
                        onChange={(event) => handleChange(category.id, 'pickupDate', event.target.value)}
                        className="w-full rounded bg-yellow-100 px-2 py-1 text-black"
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="time"
                        value={formData[category.id]?.pickupTime || ''}
                        onChange={(event) => handleChange(category.id, 'pickupTime', event.target.value)}
                        className="w-full rounded bg-yellow-100 px-2 py-1 text-black"
                        required
                      />
                    </td>
                    <td className="px-2 py-2">
                      <textarea
                        rows="1"
                        value={formData[category.id]?.note || ''}
                        onChange={(event) => handleChange(category.id, 'note', event.target.value)}
                        className="w-full rounded bg-yellow-100 px-2 py-1 text-black"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

          <div className="flex justify-center">
            <button
              type="submit"
              className="rounded-lg bg-orange-400 px-12 py-3 font-bold text-white shadow-md transition-all duration-300 hover:bg-orange-500 hover:shadow-xl"
            >
              Submit Scrap Order
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SellScrap;
