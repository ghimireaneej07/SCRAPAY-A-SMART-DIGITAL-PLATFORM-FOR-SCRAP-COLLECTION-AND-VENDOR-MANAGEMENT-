import React, { useState } from 'react';
import ScrapCard from '../components/ScrapCard';

const dummyScrapItems = [
  {
    id: 1,
    name: 'Plastic Bottles',
    description: 'Clean and dry plastic bottles',
    price: 15,
  },
  {
    id: 2,
    name: 'Old Newspapers',
    description: 'Stacked newspaper bundles',
    price: 10,
  },
  {
    id: 3,
    name: 'Aluminum Cans',
    description: 'Crushed beverage cans',
    price: 35,
  },
];

const ScrapListing = () => {
  const [items, setItems] = useState(dummyScrapItems);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Available Scrap Items</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ScrapCard key={item.id} scrap={item} />
        ))}
      </div>
    </div>
  );
};

export default ScrapListing;
