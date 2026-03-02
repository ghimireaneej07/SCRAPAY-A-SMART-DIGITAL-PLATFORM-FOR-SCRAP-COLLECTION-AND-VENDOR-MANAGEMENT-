import React, { useEffect, useState } from "react";
import axios from "axios";

const scrapItems = [
  { type: "Plastic", image: "/assets/plastic.jpg" },
  { type: "Papers", image: "/assets/papers.jpg" },
  { type: "Glass", image: "/assets/glass.jpg" },
  { type: "Metals", image: "/assets/metals.jpg" },
  { type: "E-waste", image: "/assets/E-waste.jpg" },
];

const ScrapCollection = () => {
  const [selected, setSelected] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});

  useEffect(() => {
    // Replace with actual ScrapMonster API
    axios
      .get("https://api.scrapmonster.com/v1/prices") // ✨ Example endpoint
      .then((res) => {
        // Simulated structure
        const prices = {
          Iron: 20,
          Plastic: 15,
          Glass: 28,
          Furniture: 25,
          Paper: 18,
        };
        setMarketPrices(prices);
      })
      .catch((err) => {
        console.error("Error fetching prices", err);
      });
  }, []);

  const toggleSelection = (type) => {
    setSelected((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-[#8B5E3C] text-white px-6 py-10">
      <h2 className="text-2xl font-semibold mb-6">Select Scrap</h2>

      {/* Scrap selection grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#A1623C] p-4 rounded-lg mb-6 max-w-2xl mx-auto">
        {scrapItems.map(({ type, image }) => (
          <div
            key={type}
            onClick={() => toggleSelection(type)}
            className={`rounded-lg p-2 text-center cursor-pointer border-2 ${
              selected.includes(type)
                ? "border-orange-400"
                : "border-transparent"
            }`}
          >
            <img src={image} alt={type} className="w-full h-24 object-cover rounded" />
            <p className="mt-2 font-semibold">{type}</p>
          </div>
        ))}
      </div>

      {/* Market Price Table */}
      <div className="bg-[#A1623C] p-4 rounded max-w-sm ml-auto mr-4 mb-8">
        <h3 className="font-semibold mb-2">📈 Market Prices (per kg)</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Scraps</th>
              <th>Quantity</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(marketPrices).map(([item, price]) => (
              <tr key={item}>
                <td>{item}</td>
                <td>kg</td>
                <td>{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sell Button */}
      <div className="flex justify-center">
        <button
          className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-6 rounded"
          onClick={() => {
            console.log("Selected Items:", selected);
            alert("Proceed to enter weight and schedule pickup");
          }}
        >
          Sell
        </button>
      </div>
    </div>
  );
};

export default ScrapCollection;
