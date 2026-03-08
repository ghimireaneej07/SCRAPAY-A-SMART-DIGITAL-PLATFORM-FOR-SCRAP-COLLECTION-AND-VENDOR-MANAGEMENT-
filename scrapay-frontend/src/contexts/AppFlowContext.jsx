import { createContext, useContext, useMemo, useState } from 'react';

const AppFlowContext = createContext(null);

export const AppFlowProvider = ({ children }) => {
  const [selectedScraps, setSelectedScraps] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const resetSellFlow = () => {
    setSelectedScraps([]);
    setSelectedVendor(null);
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
