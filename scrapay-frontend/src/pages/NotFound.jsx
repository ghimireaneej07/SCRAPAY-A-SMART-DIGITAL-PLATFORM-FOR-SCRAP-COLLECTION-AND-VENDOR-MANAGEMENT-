import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold text-orange-400">404</h1>
      <p className="mt-3 text-lg text-gray-200">Page not found.</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-orange-500 px-5 py-2 font-semibold text-white transition hover:bg-orange-600"
      >
        Back to home
      </Link>
    </section>
  );
};

export default NotFound;
