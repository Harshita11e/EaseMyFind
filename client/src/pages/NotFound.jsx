import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-200">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mt-4">Page Not Found</h2>
        <p className="text-slate-500 mt-2 mb-8">Looks like this page got lost too!</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}