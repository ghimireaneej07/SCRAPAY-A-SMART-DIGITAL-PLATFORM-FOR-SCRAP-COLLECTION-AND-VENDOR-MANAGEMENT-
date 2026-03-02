import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-orange-400">Access denied</h1>
      <p className="mt-3 text-gray-200">You do not have permission to open this page.</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600"
      >
        Go home
      </Link>
    </section>
  );
};

export default Unauthorized;
