import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserRound, Stethoscope } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { apiError } from '../lib/api.js';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Select } from '../components/ui/Field.jsx';
import { Logo } from '../components/common.jsx';
import { cn } from '../lib/cn.js';

export default function Register() {
  const { register: doRegister } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (v) => {
    setBusy(true);
    try {
      const user = await doRegister({ ...v, role });
      toast.success('Account created');
      nav('/app', { replace: true });
      if (role === 'DOCTOR') {
        toast('An admin will verify your account before patients can find you.', { icon: '🔎', duration: 6000 });
      }
    } catch (e) {
      toast.error(apiError(e, 'Could not create account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-10">
      <div className="w-full">
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="card p-7">
          <h1 className="text-lg font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">It takes less than a minute.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { key: 'PATIENT', label: 'I am a patient', icon: UserRound },
              { key: 'DOCTOR', label: 'I am a doctor', icon: Stethoscope },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition',
                  role === r.key
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                )}
              >
                <r.icon className="h-5 w-5" />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <Field label="Full name" error={errors.fullName?.message}>
              <Input placeholder="Jane Doe" {...register('fullName', { required: 'Required' })} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="you@example.com" {...register('email', { required: 'Required' })} />
            </Field>
            <Field label="Password" error={errors.password?.message} hint="At least 6 characters">
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })}
              />
            </Field>

            {role === 'DOCTOR' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Specialization">
                  <Input placeholder="Pulmonology" {...register('specialization')} />
                </Field>
                <Field label="License no.">
                  <Input placeholder="TN-XXXX" {...register('licenseNo')} />
                </Field>
              </div>
            )}

            <Field label="Gender (optional)">
              <Select {...register('gender')}>
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </Select>
            </Field>

            <Button type="submit" className="w-full" loading={busy}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
