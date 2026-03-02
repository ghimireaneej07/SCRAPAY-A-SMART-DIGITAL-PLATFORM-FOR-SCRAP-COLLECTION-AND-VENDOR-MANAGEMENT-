import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppFlow } from '../hooks/useAppFlow.js';
import { catalogService } from '../services/catalogService.js';

const scrapItems = [
  { type: 'Plastic', image: '/assets/plastic.jpeg' },
  { type: 'Papers', image: '/assets/paper.jpeg' },
  { type: 'Glass', image: '/assets/glass.jpeg' },
  { type: 'Metals', image: '/assets/metal.jpg' },
  { type: 'E-waste', image: '/assets/E-waste.png' },
];

const UserDashboard = () => {
  const [selected, setSelected] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const navigate = useNavigate();
  const { setSelectedScraps, setSelectedVendor } = useAppFlow();

  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await catalogService.getLatestMarketRates();
        const mapped = {};
        rates.forEach((rate) => {
          mapped[rate.category.name] = Number(rate.price_per_kg);
        });
        setMarketPrices(mapped);
      } catch {
        setMarketPrices({
          Plastic: 15,
          Papers: 18,
          Glass: 28,
          Metals: 20,
          'E-waste': 25,
        });
      }
    };
    loadRates();
  }, []);

  const displayRates = useMemo(() => {
    if (Object.keys(marketPrices).length > 0) return marketPrices;
    return {
      Plastic: 15,
      Papers: 18,
      Glass: 28,
      Metals: 20,
      'E-waste': 25,
    };
  }, [marketPrices]);

  const toggleSelection = (type) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const proceedToVendor = () => {
    if (selected.length === 0) {
      return;
    }
    setSelectedScraps(selected);
    setSelectedVendor(null);
    navigate('/vendor-selection');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-10 text-white sm:px-10">
      <h1 className="mb-8 text-xl font-semibold">Select Your Scrap</h1>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="grid flex-1 grid-cols-2 gap-6 rounded-xl bg-[#A1623C] p-6 sm:grid-cols-3">
          {scrapItems.map(({ type, image }, index) => (
            <motion.button
              key={type}
              type="button"
              onClick={() => toggleSelection(type)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                selected.includes(type)
                  ? 'ring-2 ring-green-400 bg-green-200/10'
                  : 'bg-[#4A2F20] hover:bg-[#5a3a26]'
              }`}
              aria-pressed={selected.includes(type)}
            >
              <div className="h-32 w-full overflow-hidden rounded-lg bg-white sm:h-36">
                <img
                  src={image}
                  alt={type}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <p className="mb-2 mt-2 text-center text-lg font-semibold">{type}</p>
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
              {Object.entries(displayRates).map(([item, price]) => (
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
