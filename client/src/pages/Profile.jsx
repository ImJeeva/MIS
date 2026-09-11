import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { PageHeader } from '../components/ui/misc.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { RoleBadge } from '../components/common.jsx';

export default function Profile() {
  const { user, patchUser } = useAuth();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    gender: user.gender || '',
    specialization: user.specialization || '',
    licenseNo: user.licenseNo || '',
    bio: user.bio || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', form);
      patchUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/users/me/avatar', fd);
      patchUser({ avatarUrl: data.user.avatarUrl });
      toast.success('Photo updated');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile & settings" description="Update your details and photo." />

      <div className="card mb-6 flex items-center gap-5 p-5">
        <div className="relative">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm dark:border-slate-900"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadAvatar(e.target.files?.[0])}
          />
        </div>
        <div>
          <p className="text-base font-bold">{user.fullName}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <RoleBadge role={user.role} />
            {user.role === 'DOCTOR' && (
              <span className="text-xs text-slate-400">
                {user.isVerified ? 'Verified' : 'Pending verification'}
              </span>
            )}
          </div>
        </div>
        {uploading && <span className="ml-auto text-xs text-slate-400">Uploading…</span>}
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <Field label="Full name">
          <Input value={form.fullName} onChange={set('fullName')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+91…" />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={set('gender')}>
              <option value="">Prefer not to say</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>

        {user.role === 'DOCTOR' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Specialization">
                <Input value={form.specialization} onChange={set('specialization')} />
              </Field>
              <Field label="License no.">
                <Input value={form.licenseNo} onChange={set('licenseNo')} />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Shown to patients when they browse doctors." />
            </Field>
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
