import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Images,
  Stethoscope,
  Users,
  NotebookPen,
  Bell,
  ShieldCheck,
  ScrollText,
  UserRound,
} from 'lucide-react';
import { Logo } from '../components/common.jsx';
import { cn } from '../lib/cn.js';

const patientNav = [
  { to: '/app', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/upload', label: 'Upload X-ray', icon: Upload },
  { to: '/app/studies', label: 'My studies', icon: Images },
  { to: '/app/doctors', label: 'My doctors', icon: Stethoscope },
  { to: '/app/notes', label: 'Appointment notes', icon: NotebookPen },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
];

const doctorNav = [
  { to: '/app', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/patients', label: 'My patients', icon: Users },
  { to: '/app/studies', label: 'Shared studies', icon: Images },
  { to: '/app/notes', label: 'My notes', icon: NotebookPen },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
];

const adminNav = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/studies', label: 'Studies', icon: Images },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

export function Sidebar({ role, onNavigate }) {
  const nav = role === 'ADMIN' ? adminNav : role === 'DOCTOR' ? doctorNav : patientNav;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white dark:bg-slate-950">
      <div className="flex h-16 items-center px-5">
        <Logo to={role === 'ADMIN' ? '/admin' : '/app'} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <NavLink
          to={role === 'ADMIN' ? '/admin/profile' : '/app/profile'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            )
          }
        >
          {role === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          {role === 'ADMIN' ? 'Admin profile' : 'My profile'}
        </NavLink>
      </div>
    </aside>
  );
}
