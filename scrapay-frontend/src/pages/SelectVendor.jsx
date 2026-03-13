import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppFlow } from '../hooks/useAppFlow.js';
import { orderService } from '../services/orderService.js';
import VerificationBadge from '../components/VerificationBadge.jsx';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.3 } },
};

const SelectVendor = () => {
  const [sortByRating, setSortByRating] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { selectedScraps, setSelectedVendor } = useAppFlow();

  useEffect(() => {
    let mounted = true;

    const loadWithoutGeo = async () => {
      try {
        const result = await orderService.getVendors();
        if (mounted) setVendors(result);
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load vendors.');
      }
    };

    const loadVendors = async () => {
      try {
        if (!navigator.geolocation) {
          await loadWithoutGeo();
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const result = await orderService.getVendors({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                radius_km: 25,
              });
              if (mounted) setVendors(result);
            } catch (err) {
              if (mounted) setError(err.message || 'Unable to load vendors.');
            }
          },
          async () => {
            await loadWithoutGeo();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
        );
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load vendors.');
      }
    };
    loadVendors();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) =>
      sortByRating ? Number(b.rating_avg || 0) - Number(a.rating_avg || 0) : 0,
    );
  }, [sortByRating, vendors]);

  const handleSelect = (vendor) => {
    setSelectedVendor(vendor);
    navigate('/sell-scrap');
  };

  if (!selectedScraps.length) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-2xl font-bold text-orange-300">No scrap selected</h1>
        <p className="mt-2 text-orange-100">Choose scrap types before vendor selection.</p>
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
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-wide text-orange-300">Select Vendor</h1>
        <button
          onClick={() => setSortByRating((prev) => !prev)}
          type="button"
          className="w-fit rounded-md bg-orange-400 px-5 py-2 font-semibold shadow-md transition hover:bg-orange-500"
        >
          {sortByRating ? 'Sorted by rating' : 'Sort by rating'}
        </button>
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        {error && <p className="text-sm text-red-300">{error}</p>}
        <AnimatePresence>
          {sortedVendors.map((vendor) => (
            <motion.article
              key={vendor.id}
              variants={cardVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className="flex flex-col gap-4 rounded-xl bg-[#A1623C] p-6 text-white shadow-md transition-all hover:bg-[#b77546] hover:shadow-xl md:flex-row md:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">{vendor.business_name || vendor.username}</h2>
                  {vendor.is_verified && (
                    <VerificationBadge status="approved" size="sm" />
                  )}
                </div>
                <p className="mt-2 text-sm text-orange-200">⭐ Rating {vendor.rating_avg}/5</p>
                <p className="mt-1 text-sm text-orange-200">📍 Service radius {vendor.service_radius_km} km</p>
                {vendor.license_number && (
                  <p className="mt-1 text-sm text-orange-200">📄 License {vendor.license_number}</p>
                )}
                <p className="mt-2 text-xs text-orange-200/80">
                  {vendor.is_online ? '🟢 Online' : '⚪ Offline'}
                </p>
              </div>
              <motion.button
                onClick={() => handleSelect(vendor)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="rounded-md bg-orange-400 px-6 py-2 font-bold text-white shadow-md transition hover:bg-orange-500"
              >
                Select
              </motion.button>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SelectVendor;
