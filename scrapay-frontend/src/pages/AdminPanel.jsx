import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { catalogService } from '../services/catalogService.js';

const AdminPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState([]);
  const [error, setError] = useState('');
  const [rateForm, setRateForm] = useState({
    category: '',
    price_per_kg: '',
    effective_from: '',
    is_active: true,
  });

  const refresh = async () => {
    const [vendorData, categoryData, rateData] = await Promise.all([
      adminService.getVendors(),
      catalogService.getCategories(),
      adminService.getMarketRates(),
    ]);
    setVendors(vendorData);
    setCategories(categoryData);
    setRates(rateData);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await refresh();
      } catch (err) {
        setError(err.message || 'Unable to load admin data.');
      }
    };
    load();
  }, []);

  const toggleVerification = async (vendor) => {
    try {
      const updated = await adminService.setVendorVerification(vendor.id, !vendor.is_verified);
      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to update vendor verification.');
    }
  };

  const handleRateSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await adminService.createMarketRate({
        category: Number(rateForm.category),
        price_per_kg: rateForm.price_per_kg,
        effective_from: rateForm.effective_from,
        is_active: rateForm.is_active,
      });
      setRateForm({ category: '', price_per_kg: '', effective_from: '', is_active: true });
      const latestRates = await adminService.getMarketRates();
      setRates(latestRates);
    } catch (err) {
      setError(err.message || 'Unable to create market rate.');
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-8 text-white sm:px-8">
      <h1 className="mb-6 text-3xl font-bold text-orange-200">Admin Panel</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-[#A1623C] p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-orange-100">Vendor Verification</h2>
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between rounded bg-[#4A2F20] p-3">
                <div>
                  <p className="font-semibold">{vendor.business_name || vendor.username}</p>
                  <p className="text-xs text-orange-200">{vendor.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleVerification(vendor)}
                  className={`rounded px-3 py-1 text-sm font-semibold ${
                    vendor.is_verified ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {vendor.is_verified ? 'Verified' : 'Verify'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#A1623C] p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-orange-100">Add Market Rate</h2>
          <form onSubmit={handleRateSubmit} className="space-y-3">
            <select
              value={rateForm.category}
              onChange={(event) => setRateForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={rateForm.price_per_kg}
              onChange={(event) => setRateForm((prev) => ({ ...prev, price_per_kg: event.target.value }))}
              placeholder="Price per kg"
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              required
            />
            <input
              type="datetime-local"
              value={rateForm.effective_from}
              onChange={(event) => setRateForm((prev) => ({ ...prev, effective_from: event.target.value }))}
              className="w-full rounded bg-yellow-100 px-3 py-2 text-black"
              required
            />
            <button
              type="submit"
              className="rounded bg-orange-500 px-4 py-2 font-semibold hover:bg-orange-600"
            >
              Add Rate
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-[#A1623C] p-5 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-orange-100">Latest Rate Entries</h2>
        <div className="space-y-2 text-sm">
          {rates.slice(0, 12).map((rate) => (
            <div key={rate.id} className="rounded bg-[#4A2F20] p-2">
              {rate.category.name}: INR {rate.price_per_kg} (effective {new Date(rate.effective_from).toLocaleString()})
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
