import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../components/common.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../lib/auth.jsx';

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <Link to={user.role === 'ADMIN' ? '/admin' : '/app'}>
                <Button size="sm">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button size="sm" variant="secondary">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-white dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo />
          <p className="max-w-md text-xs text-slate-400">
            Student project · a screening aid, not a diagnostic device · not for clinical use.
            Method after Varshni et al., <em>Pneumonia Detection Using CNN based Feature
            Extraction</em>, IEEE 2019.
          </p>
          <div className="flex gap-4 text-xs">
            <Link to="/login" className="link">
              Sign in
            </Link>
            <Link to="/register" className="link">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
