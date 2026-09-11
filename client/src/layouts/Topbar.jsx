import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, UserRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useNotifications } from '../lib/queries.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { RoleBadge } from '../components/common.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { cn } from '../lib/cn.js';

export function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { data } = useNotifications();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const unread = data?.unread || 0;
  const notifPath = user?.role === 'ADMIN' ? '/admin' : '/app/notifications';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur dark:bg-slate-950/80">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <ThemeToggle />

      {user?.role !== 'ADMIN' && (
        <Link
          to={notifPath}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      )}

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Avatar name={user?.fullName} src={user?.avatarUrl} size="sm" />
          <span className="hidden text-sm font-medium sm:block">{user?.fullName}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-card-lg dark:bg-slate-900">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
              <div className="mt-1.5">
                <RoleBadge role={user?.role} />
              </div>
            </div>
            <Link
              to={user?.role === 'ADMIN' ? '/admin/profile' : '/app/profile'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <UserRound className="h-4 w-4 text-slate-400" /> Profile & settings
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
