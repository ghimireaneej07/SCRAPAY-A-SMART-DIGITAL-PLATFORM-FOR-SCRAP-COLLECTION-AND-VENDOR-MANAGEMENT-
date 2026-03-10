import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppFlow } from '../hooks/useAppFlow.js';
import { catalogService } from '../services/catalogService.js';

const imageMap = {
  plastic: '/assets/plastic.jpeg',
  paper: '/assets/paper.jpeg',
  glass: '/assets/glass.jpeg',
  metal: '/assets/metal.jpg',
  ewaste: '/assets/E-waste.png',
};

const normalize = (value) => value.toLowerCase().replace(/[^a-z]/g, '');

const UserDashboard = () => {
  const [selected, setSelected] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setSelectedScraps, setSelectedVendor } = useAppFlow();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rates, allCategories] = await Promise.all([
          catalogService.getLatestMarketRates(),
          catalogService.getCategories(),
        ]);
        const mapped = {};
        rates.forEach((rate) => {
          mapped[rate.category.name] = Number(rate.price_per_kg);
        });
        setMarketPrices(mapped);
        setCategories(allCategories);
      } catch (err) {
        setError(err.message || 'Unable to load categories and rates.');
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayCategories = useMemo(
    () =>
      categories.map((category) => {
        const key = normalize(category.code || category.name);
        return {
          ...category,
          image: category.icon || imageMap[key] || '/assets/scrap-hero.png',
        };
      }),
    [categories],
  );

  const toggleSelection = (categoryId) => {
    setSelected((prev) =>
      prev.includes(categoryId) ? prev.filter((item) => item !== categoryId) : [...prev, categoryId],
    );
  };

  const proceedToVendor = () => {
    if (selected.length === 0) return;
    const selectedCategoryObjects = displayCategories.filter((category) => selected.includes(category.id));
    setSelectedScraps(selectedCategoryObjects);
    setSelectedVendor(null);
    navigate('/vendor-selection');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-10 text-white sm:px-10">
      <h1 className="mb-8 text-xl font-semibold">Select Your Scrap</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="grid flex-1 grid-cols-2 gap-6 rounded-xl bg-[#A1623C] p-6 sm:grid-cols-3">
          {displayCategories.map(({ id, name, image }, index) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => toggleSelection(id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                selected.includes(id)
                  ? 'ring-2 ring-green-400 bg-green-200/10'
                  : 'bg-[#4A2F20] hover:bg-[#5a3a26]'
              }`}
              aria-pressed={selected.includes(id)}
            >
              <div className="h-32 w-full overflow-hidden rounded-lg bg-white sm:h-36">
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <p className="mb-2 mt-2 text-center text-lg font-semibold">{name}</p>
            </motion.button>
          ))}
        </div>

        <aside className="w-full rounded-2xl border border-orange-300 bg-gradient-to-br from-[#a66f44] to-[#774f2a] p-6 shadow-lg lg:w-1/3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-yellow-100">Market Prices</h2>
            <span className="text-sm italic text-orange-200">(per kg)</span>
          </div>
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="border-b border-orange-400 font-semibold text-orange-300">
                <th className="pb-2">Scrap</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(marketPrices).map(([item, price]) => (
                <tr key={item} className="rounded-lg bg-[#4b3221] text-white">
                  <td className="rounded-l-lg px-2 py-2">{item}</td>
                  <td className="px-2 py-2">per/kg</td>
                  <td className="rounded-r-lg px-2 py-2">INR {price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={proceedToVendor}
          type="button"
          disabled={selected.length === 0}
          className="rounded-lg bg-orange-400 px-12 py-3 font-bold text-white shadow-md transition-all duration-300 hover:bg-orange-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Select Vendor
        </button>
      </div>
    </section>
  );
};

export default UserDashboard;
