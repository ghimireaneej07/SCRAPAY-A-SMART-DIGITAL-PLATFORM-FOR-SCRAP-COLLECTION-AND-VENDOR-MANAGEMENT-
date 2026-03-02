import { useNavigate } from 'react-router-dom';

const ScrapCard = ({ scrap }) => {
  const navigate = useNavigate();

  const handleOrder = () => {
    navigate(`/order/${scrap.id}`, { state: scrap });
  };

  return (
    <article className="flex flex-col justify-between rounded border p-4 shadow transition hover:shadow-lg">
      <div>
        <h3 className="text-lg font-bold">{scrap.name}</h3>
        <p className="text-sm text-gray-600">{scrap.description}</p>
        <p className="mt-2 font-semibold text-green-700">INR {scrap.price} /kg</p>
      </div>
      <button
        onClick={handleOrder}
        type="button"
        className="mt-4 rounded bg-green-600 py-2 text-white hover:bg-green-700"
      >
        Order Pickup
      </button>
    </article>
  );
};

export default ScrapCard;
