import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppFlowContext = createContext(null);
const STORAGE_KEY = 'scrapay_app_flow';

const loadStoredFlow = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { selectedScraps: [], selectedVendor: null };
    }
    const parsed = JSON.parse(raw);
    return {
      selectedScraps: Array.isArray(parsed.selectedScraps) ? parsed.selectedScraps : [],
      selectedVendor: parsed.selectedVendor || null,
    };
  } catch {
    return { selectedScraps: [], selectedVendor: null };
  }
};

export const AppFlowProvider = ({ children }) => {
  const [selectedScraps, setSelectedScraps] = useState(() => loadStoredFlow().selectedScraps);
  const [selectedVendor, setSelectedVendor] = useState(() => loadStoredFlow().selectedVendor);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedScraps,
        selectedVendor,
      }),
    );
  }, [selectedScraps, selectedVendor]);

  const resetSellFlow = () => {
    setSelectedScraps([]);
    setSelectedVendor(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      selectedScraps,
      setSelectedScraps,
      selectedVendor,
      setSelectedVendor,
      resetSellFlow,
    }),
    [selectedScraps, selectedVendor],
  );

  return <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>;
};

export const useAppFlowContext = () => {
  const context = useContext(AppFlowContext);
  if (!context) {
    throw new Error('useAppFlowContext must be used inside AppFlowProvider');
  }
  return context;
};
