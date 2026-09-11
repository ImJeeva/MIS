import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Users, Images, Share2, NotebookPen, ShieldAlert } from 'lucide-react';
import { useAdminStats } from '../../lib/queries.js';
import { PageHeader, Skeleton } from '../../components/ui/misc.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';

const PIE = ['#2563eb', '#14b8a6', '#f59e0b', '#64748b'];

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Overview" description="System-wide activity." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72" />
      </div>
    );
  }

  const roleData = Object.entries(data.usersByRole).map(([name, value]) => ({ name, value }));
  const aiData = Object.entries(data.aiByPrediction).map(([name, value]) => ({
    name: name === 'ABNORMAL' ? 'Flagged' : name === 'NORMAL' ? 'Clear' : name,
    value,
  }));

  return (
    <div>
      <PageHeader title="Overview" description="System-wide activity and health." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Users" value={data.totals.users} icon={Users} />
        <StatTile label="Studies" value={data.totals.studies} icon={Images} tone="teal" />
        <StatTile label="Active shares" value={data.totals.shares} icon={Share2} tone="green" />
        <StatTile
          label="Doctors to verify"
          value={data.totals.pendingDoctors}
          icon={ShieldAlert}
          tone={data.totals.pendingDoctors ? 'amber' : 'slate'}
          hint={data.totals.pendingDoctors ? 'Action needed' : 'All clear'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Uploads — last 14 days" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.uploadsPerDay} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-slate-400"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelFormatter={(d) => `Date ${d}`}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Screening outcomes" />
          <CardBody>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={aiData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={3}>
                    {aiData.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {aiData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                    {d.name}
                  </span>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Users by role" />
          <CardBody>
            <div className="space-y-2">
              {roleData.map((r) => (
                <div key={r.name}>
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{r.name.toLowerCase()}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(r.value / data.totals.users) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Content" />
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data.studiesByType.XRAY || 0}</p>
                <p className="text-xs text-slate-400">X-rays</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.studiesByType.REPORT || 0}</p>
                <p className="text-xs text-slate-400">Reports</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totals.notes}</p>
                <p className="text-xs text-slate-400">Appointment notes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
