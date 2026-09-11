import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-3 text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
