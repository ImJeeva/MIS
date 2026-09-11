import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, BadgeCheck, Ban, RotateCcw } from 'lucide-react';
import { api, apiError } from '../../lib/api.js';
import { useAdminUsers, useInvalidate } from '../../lib/queries.js';
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/misc.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { RoleBadge } from '../../components/common.jsx';
import { fmtDate } from '../../lib/format.js';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const params = { q: q || undefined, role: role || undefined, page, pageSize: 20 };
  const { data, isLoading } = useAdminUsers(params);
  const invalidate = useInvalidate();
  const [busyId, setBusyId] = useState(null);

  const act = async (id, body, msg) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/users/${id}`, body);
      toast.success(msg);
      invalidate(['admin', 'users', params], ['admin', 'stats']);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusyId(null);
    }
  };

  const users = data?.users || [];
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div>
      <PageHeader title="Users" description="Verify doctors, suspend or restore accounts." />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="w-40">
          <option value="">All roles</option>
          <option value="PATIENT">Patients</option>
          <option value="DOCTOR">Doctors</option>
          <option value="ADMIN">Admins</option>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.fullName}</p>
                          <p className="truncate text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        {u.role === 'DOCTOR' &&
                          (u.isVerified ? (
                            <Badge tone="green">verified</Badge>
                          ) : (
                            <Badge tone="amber">pending</Badge>
                          ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.status === 'ACTIVE' ? (
                        <Badge tone="green" dot>active</Badge>
                      ) : (
                        <Badge tone="rose" dot>suspended</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {u.role === 'DOCTOR' && !u.isVerified && (
                          <Button size="sm" loading={busyId === u.id} onClick={() => act(u.id, { isVerified: true }, 'Doctor verified')}>
                            <BadgeCheck className="h-3.5 w-3.5" /> Verify
                          </Button>
                        )}
                        {u.role !== 'ADMIN' &&
                          (u.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busyId === u.id}
                              onClick={() => act(u.id, { status: 'SUSPENDED' }, 'Account suspended')}
                            >
                              <Ban className="h-3.5 w-3.5" /> Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busyId === u.id}
                              onClick={() => act(u.id, { status: 'ACTIVE' }, 'Account restored')}
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
