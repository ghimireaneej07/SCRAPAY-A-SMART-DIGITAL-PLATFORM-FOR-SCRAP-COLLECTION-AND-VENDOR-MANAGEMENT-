import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

const OrderPage = () => {
  const { state } = useLocation();
  const { id } = useParams();

  const scrap = state || {};
  const [weight, setWeight] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    const totalPrice = scrap.price * weight;
    console.log('Order placed:', {
      itemId: scrap.id,
      weight,
      scheduledDate,
      totalPrice,
    });
    alert(`Order placed successfully!\nTotal: ₹${totalPrice}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Order Pickup: {scrap.name}</h2>
      <form onSubmit={handleOrderSubmit}>
        <label className="block mb-2 text-gray-700">Weight (kg)</label>
        <input
          type="number"
          min="1"
          required
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded"
        />

        <label className="block mb-2 text-gray-700">Pickup Date</label>
        <input
          type="date"
          required
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Confirm Order
        </button>
      </form>
    </div>
  );
};

export default OrderPage;
