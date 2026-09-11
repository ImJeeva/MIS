import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { apiError } from '../lib/api.js';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import { Logo } from '../components/common.jsx';

const demoAccounts = [
  { label: 'Patient', email: 'ravi@mis.local' },
  { label: 'Doctor', email: 'dr.meera@mis.local' },
  { label: 'Admin', email: 'admin@mis.local' },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (v) => {
    setBusy(true);
    try {
      const user = await login(v.email, v.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}`);
      nav(user.role === 'ADMIN' ? '/admin' : '/app', { replace: true });
    } catch (e) {
      toast.error(apiError(e, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (email) => {
    setValue('email', email);
    setValue('password', 'Passw0rd!');
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-10">
      <div className="w-full">
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="card p-7">
          <h1 className="text-lg font-bold tracking-tight">Sign in to MIS</h1>
          <p className="mt-1 text-sm text-slate-500">Access your studies, screenings and notes.</p>

          {params.get('expired') && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Your session expired. Please sign in again.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
            </Field>
            <Button type="submit" className="w-full" loading={busy}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed p-3">
            <p className="text-xs font-medium text-slate-500">Quick demo login (password auto-filled)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoAccounts.map((d) => (
                <button
                  key={d.email}
                  onClick={() => fillDemo(d.email)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
