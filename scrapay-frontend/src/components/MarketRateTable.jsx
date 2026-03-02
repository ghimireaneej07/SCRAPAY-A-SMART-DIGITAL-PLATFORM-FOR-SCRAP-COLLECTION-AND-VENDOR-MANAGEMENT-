import React from "react";

const MarketRateTable = ({ rates }) => {
  return (
    <div className="border border-white text-white p-4 rounded-md w-full max-w-xs">
      <table className="w-full text-sm">
        <thead className="text-orange-300 border-b border-orange-200">
          <tr>
            <th className="text-left">Scarp</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((item, idx) => (
            <tr key={idx} className="border-b border-white/20">
              <td>{item.name}</td>
              <td>{item.unit}</td>
              <td>{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketRateTable;
