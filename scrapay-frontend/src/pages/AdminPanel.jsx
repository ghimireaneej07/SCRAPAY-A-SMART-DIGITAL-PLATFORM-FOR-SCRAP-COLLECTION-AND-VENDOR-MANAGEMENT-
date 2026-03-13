import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import { catalogService } from '../services/catalogService.js';

const shellCardClass =
  'rounded-[30px] border border-white/10 bg-[#1b120f]/75 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl';

const surfaceCardClass = 'rounded-[26px] border border-white/8 bg-[#0f0a08]/55 p-5 backdrop-blur';

const statusOptions = [
  { value: '', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusPillClass = {
  pending: 'bg-amber-400/90 text-[#2c1a0d]',
  accepted: 'bg-sky-400/90 text-[#0c2030]',
  in_progress: 'bg-violet-400/90 text-[#21143a]',
  completed: 'bg-emerald-400/90 text-[#0a2716]',
  rejected: 'bg-rose-400/90 text-[#310c18]',
  cancelled: 'bg-slate-300/90 text-[#1f2126]',
};

const quickLinkClass =
  'inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-[#f5dfbf] transition hover:bg-white/10';

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  return `INR ${numericValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatCompact = (value) => Number(value || 0).toLocaleString('en-IN');

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleDateString();
};

const formatDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleString();
};

const toTitle = (value) => (value || '').replaceAll('_', ' ');

const buildTrendSeries = (orders, mapper) => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map((date) => {
    const total = orders.reduce((sum, order) => {
      const createdAt = new Date(order.created_at);
      if (
        createdAt.getFullYear() === date.getFullYear() &&
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getDate() === date.getDate()
      ) {
        return sum + mapper(order);
      }
      return sum;
    }, 0);

    return {
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: total,
    };
  });
};

const buildChartGeometry = (data, width = 420, height = 200, padding = 24) => {
  const values = data.map((item) => Number(item.value || 0));
  const max = Math.max(...values, 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((item, index) => {
    const x = padding + step * index;
    const y = height - padding - (Number(item.value || 0) / max) * (height - padding * 2);
    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points.at(-1).x.toFixed(2)} ${(height - padding).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - padding).toFixed(2)} Z`
    : '';

  return { max, points, linePath, areaPath, width, height, padding };
};

const MetricCard = ({ icon, label, value, detail, progress }) => {
  const Icon = icon;

  return (
    <article className={shellCardClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gray-400">{label}</p>
          <p className="mt-4 text-4xl font-black text-white tabular-nums">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-3 text-[#ffd199]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-gray-300/85">{detail}</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#f97316,#f59e0b)]"
          style={{ width: `${Math.max(8, Math.min(progress, 100))}%` }}
        />
      </div>
    </article>
  );
};

const AreaTrendChart = ({ title, description, data, valueFormatter, summaryLabel, summaryValue }) => {
  const geometry = useMemo(() => buildChartGeometry(data, 440, 220, 26), [data]);
  const yTicks = [1, 0.66, 0.33, 0].map((factor) => Math.round(geometry.max * factor));

  return (
    <article className={shellCardClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Performance trend</p>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300/85">{description}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{summaryLabel}</p>
          <p className="mt-2 text-2xl font-black text-white">{summaryValue}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0a08]/60 p-4">
        <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="h-[18rem] w-full">
          <defs>
            <linearGradient id="admin-area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(249,115,22,0.45)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.02)" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y =
              geometry.height -
              geometry.padding -
              (tick / Math.max(geometry.max, 1)) * (geometry.height - geometry.padding * 2);
            return (
              <g key={tick}>
                <line
                  x1={geometry.padding}
                  x2={geometry.width - geometry.padding}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 6"
                />
                <text x="0" y={y + 4} fill="rgba(255,255,255,0.42)" fontSize="11">
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}

          <path d={geometry.areaPath} fill="url(#admin-area-fill)" />
          <path d={geometry.linePath} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

          {geometry.points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="#120c0a" stroke="#f59e0b" strokeWidth="3" />
              <text x={point.x} y={geometry.height - 4} textAnchor="middle" fill="rgba(255,255,255,0.56)" fontSize="11">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </article>
  );
};

const ColumnChart = ({ title, description, data }) => {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <article className={shellCardClass}>
      <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Live benchmark</p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-300/85">{description}</p>

      <div className="mt-6 grid gap-4">
        {data.map((item, index) => (
          <div key={item.label} className="rounded-[24px] border border-white/8 bg-[#0f0a08]/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs text-gray-400">{item.note || 'Latest published benchmark'}</p>
              </div>
              <p className="text-sm font-bold text-[#ffcb84]">{formatCurrency(item.value)}</p>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="relative h-28 w-12 overflow-hidden rounded-[18px] bg-white/8">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-[18px] bg-[linear-gradient(180deg,#f8b85b,#f97316)] shadow-[0_12px_24px_rgba(249,115,22,0.28)]"
                  style={{ height: `${Math.max(14, (Number(item.value || 0) / max) * 100)}%` }}
                />
              </div>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(10, (Number(item.value || 0) / max) * 100)}%`,
                      background: ['#f8b85b', '#f97316', '#fb7185', '#38bdf8', '#4ade80', '#facc15'][index % 6],
                    }}
                  />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
                  Relative strength {Math.round((Number(item.value || 0) / max) * 100)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-300/85">{description}</p>
    </div>
    {action}
  </div>
);

const PreviewEmpty = ({ message }) => (
  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 px-5 py-8 text-sm text-gray-300">
    {message}
  </div>
);

const AdminPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [rateForm, setRateForm] = useState({
    category: '',
    price_per_kg: '',
    effective_from: '',
    is_active: true,
  });

  const refresh = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setRefreshing(true);

      const [vendorData, categoryData, rateData, analyticsData, orderData, accountData] = await Promise.all([
        adminService.getVendors(),
        catalogService.getCategories(),
        adminService.getMarketRates(),
        adminService.getAnalytics(),
        adminService.getOrders(statusFilter),
        adminService.getAccounts(),
      ]);

      setVendors(vendorData);
      setCategories(categoryData);
      setRates(rateData);
      setAnalytics(analyticsData);
      setOrders(orderData);
      setAccounts(accountData);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load admin data.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh(true);
    const pollInterval = setInterval(() => {
      refresh(false);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [refresh]);

  const handleManualRefresh = () => {
    refresh(false);
  };

  const handleVendorApproval = async (vendor) => {
    try {
      const updated = await adminService.setVendorVerification(vendor.id, true);
      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to approve vendor.');
    }
  };

  const toggleAccountStatus = async (account) => {
    try {
      const updated = await adminService.setAccountStatus(account.id, !account.is_active);
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to update account status.');
    }
  };

  const handleRateSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await adminService.createMarketRate({
        category: Number(rateForm.category),
        price_per_kg: rateForm.price_per_kg,
        effective_from: rateForm.effective_from,
        is_active: rateForm.is_active,
      });
      setRateForm({ category: '', price_per_kg: '', effective_from: '', is_active: true });
      const latestRates = await adminService.getMarketRates();
      setRates(latestRates);
    } catch (err) {
      setError(err.message || 'Unable to create market rate.');
    }
  };

  const vendorSummary = useMemo(() => {
    const verified = vendors.filter((vendor) => vendor.is_verified).length;
    const online = vendors.filter((vendor) => vendor.is_online).length;
    const pending = vendors.filter((vendor) => vendor.verification_status === 'pending').length;
    return { verified, online, pending };
  }, [vendors]);

  const userAccounts = useMemo(
    () => accounts.filter((account) => account.role === 'user'),
    [accounts],
  );

  const activeUsers = useMemo(
    () => userAccounts.filter((account) => account.is_active).length,
    [userAccounts],
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
  const previewVendors = useMemo(() => vendors.slice(0, 4), [vendors]);
  const previewUsers = useMemo(() => userAccounts.slice(0, 4), [userAccounts]);

  const latestRateBenchmarks = useMemo(() => {
    const latestByCategory = new Map();
    rates.forEach((rate) => {
      if (!latestByCategory.has(rate.category.id)) {
        latestByCategory.set(rate.category.id, {
          id: rate.id,
          label: rate.category.name,
          value: Number(rate.price_per_kg),
          note: `Effective ${formatDate(rate.effective_from)}`,
        });
      }
    });
    return Array.from(latestByCategory.values()).slice(0, 5);
  }, [rates]);

  const orderTrendData = useMemo(
    () => buildTrendSeries(orders, () => 1),
    [orders],
  );

  const revenueTrendData = useMemo(
    () =>
      buildTrendSeries(orders, (order) => {
        const revenueValue = Number(order.total_final ?? order.total_estimated ?? 0);
        return order.status === 'completed' ? revenueValue : 0;
      }),
    [orders],
  );

  const watchlistItems = useMemo(
    () => [
      {
        title: 'Pending vendor approvals',
        value: vendorSummary.pending,
        detail: 'Vendors waiting for an approval decision',
      },
      {
        title: 'Suspended customers',
        value: userAccounts.filter((account) => !account.is_active).length,
        detail: 'Accounts currently blocked from placing orders',
      },
      {
        title: 'Latest published rate',
        value: latestRateBenchmarks[0] ? formatCurrency(latestRateBenchmarks[0].value) : 'INR 0',
        detail: latestRateBenchmarks[0]?.label || 'No market rate published yet',
      },
    ],
    [latestRateBenchmarks, userAccounts, vendorSummary.pending],
  );

  const completionRate = analytics?.total_orders
    ? Math.round(((analytics.completed_orders || 0) / analytics.total_orders) * 100)
    : 0;
  const verificationRate = vendors.length ? Math.round((vendorSummary.verified / vendors.length) * 100) : 0;
  const activeUserRate = userAccounts.length ? Math.round((activeUsers / userAccounts.length) * 100) : 0;
  const revenueMomentum = revenueTrendData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const topMetrics = [
    {
      icon: Users,
      label: 'Users',
      value: formatCompact(analytics?.total_users || 0),
      detail: `${activeUsers} active customers available on the platform right now.`,
      progress: activeUserRate || 10,
    },
    {
      icon: Building2,
      label: 'Vendors',
      value: formatCompact(analytics?.total_vendors || 0),
      detail: `${vendorSummary.verified} verified vendors, ${vendorSummary.online} currently online.`,
      progress: verificationRate || 12,
    },
    {
      icon: ClipboardList,
      label: 'Orders',
      value: formatCompact(analytics?.total_orders || 0),
      detail: `${analytics?.completed_orders || 0} completed orders with ${completionRate}% completion rate.`,
      progress: completionRate || 8,
    },
    {
      icon: Wallet,
      label: 'Revenue',
      value: formatCurrency(analytics?.revenue || 0),
      detail: `${formatCurrency(revenueMomentum)} generated from completed orders over the last 7 days.`,
      progress: Math.min(100, Math.max(10, completionRate + 12)),
    },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120c0a] px-4 py-8 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_16%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(199,88,29,0.14),transparent_24%),radial-gradient(circle_at_74%_76%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(135deg,#120c0a_0%,#1f130d_40%,#2f1a10_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 pb-10">
        <header className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Platform operations</p>
            <h1 className="mt-5 text-4xl font-black text-[#fff1df] sm:text-5xl lg:text-6xl">Admin Console</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300/90">
              Unified operations workspace for vendor trust, account governance, order oversight, and market pricing decisions.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={quickLinkClass}>
                Overview
              </button>
              <Link to="/admin/vendors" className={quickLinkClass}>
                Vendors
              </Link>
              <Link to="/admin/users" className={quickLinkClass}>
                Users
              </Link>
              <button
                type="button"
                onClick={() => document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={quickLinkClass}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('rates-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={quickLinkClass}
              >
                Rates
              </button>
            </div>
          </div>

          <div className={`${shellCardClass} flex flex-col justify-between gap-5`}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Live control</p>
              <h2 className="mt-3 text-2xl font-black text-white">Balanced oversight, no dead space</h2>
              <p className="mt-3 text-sm leading-7 text-gray-300/85">
                Critical metrics, charts, management previews, and rate publishing now flow in one balanced admin surface.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-[#f6dfbc] transition hover:bg-white/10 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm text-gray-300">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 backdrop-blur">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 backdrop-blur">
            Loading operations data...
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AreaTrendChart
            title="Order activity"
            description="Daily order creation trend over the last 7 days using actual platform records."
            data={orderTrendData}
            valueFormatter={(value) => `${value}`}
            summaryLabel="7 day total"
            summaryValue={formatCompact(orderTrendData.reduce((sum, item) => sum + item.value, 0))}
          />

          <ColumnChart
            title="Market rate pulse"
            description="Latest rate benchmarks from recently published market entries."
            data={
              latestRateBenchmarks.length
                ? latestRateBenchmarks
                : [{ label: 'No rates yet', value: 0, note: 'Publish a rate to populate this chart' }]
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className={shellCardClass}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Trust layer</p>
                <h2 className="mt-1 text-2xl font-black text-white">{vendorSummary.verified}/{vendors.length || 1}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-300/85">Verified vendors ready to receive customer orders right now.</p>
          </article>

          <article className={shellCardClass}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Revenue pulse</p>
                <h2 className="mt-1 text-2xl font-black text-white">{formatCurrency(revenueMomentum)}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-300/85">Completed-order revenue captured across the last 7 days.</p>
          </article>

          <article className={shellCardClass}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-200">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Queue pressure</p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {orders.filter((order) => ['pending', 'accepted', 'in_progress'].includes(order.status)).length}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-300/85">Orders that still need coordination, approval, or live execution.</p>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className={shellCardClass}>
            <SectionHeader
              eyebrow="Vendor verification"
              title="Vendor management preview"
              description="Keep the dashboard concise here, then open the dedicated vendor page when the list grows."
              action={
                <Link to="/admin/vendors" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-[#f6dfbc] transition hover:bg-white/10">
                  View more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            <div className="space-y-4">
              {previewVendors.length === 0 && <PreviewEmpty message="No vendors available yet." />}
              {previewVendors.map((vendor) => (
                <article key={vendor.id} className={surfaceCardClass}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-white">{vendor.business_name || vendor.username}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            statusPillClass[vendor.verification_status] || 'bg-white/10 text-white'
                          }`}
                        >
                          {toTitle(vendor.verification_status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">{vendor.full_name || vendor.username}</p>
                      <p className="mt-1 text-sm text-gray-400">{vendor.email}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                        {vendor.city || 'City not added'} | {vendor.is_online ? 'Online now' : 'Offline'}
                      </p>
                    </div>

                    {vendor.verification_status === 'pending' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleVendorApproval(vendor)}
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                        <Link
                          to="/admin/vendors"
                          className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20"
                        >
                          Full review
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        {vendor.verification_status === 'approved' ? 'Ready for pickup flow' : 'Review complete'}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={shellCardClass}>
            <SectionHeader
              eyebrow="Customer accounts"
              title="User management preview"
              description="Surface the latest customer accounts here and move heavier moderation into a dedicated page."
              action={
                <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-[#f6dfbc] transition hover:bg-white/10">
                  View more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            <div className="space-y-4">
              {previewUsers.length === 0 && <PreviewEmpty message="No customer accounts available yet." />}
              {previewUsers.map((account) => (
                <article key={account.id} className={surfaceCardClass}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-white">{account.full_name || account.username}</p>
                      <p className="mt-2 text-sm text-gray-400">{account.email}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                        {account.is_active ? 'Account active' : 'Account suspended'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAccountStatus(account)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition ${
                        account.is_active ? 'bg-rose-500 hover:bg-rose-400' : 'bg-sky-600 hover:bg-sky-500'
                      }`}
                    >
                      {account.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div id="orders-section" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className={shellCardClass}>
            <SectionHeader
              eyebrow="Order oversight"
              title="Recent orders"
              description="Track the most recent orders with status, pickup timing, and customer/vendor pairing."
              action={
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#0d0908]/75 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              }
            />

            <div className="space-y-4">
              {recentOrders.length === 0 && <PreviewEmpty message="No orders match the current filter." />}
              {recentOrders.map((order) => (
                <article key={order.id} className={surfaceCardClass}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-white">Order #{order.id}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            statusPillClass[order.status] || 'bg-white/10 text-white'
                          }`}
                        >
                          {toTitle(order.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">
                        Customer: <span className="font-semibold text-white">{order.customer_name}</span> | Vendor:{' '}
                        <span className="font-semibold text-white">{order.vendor_name || 'Unassigned'}</span>
                      </p>
                      <p className="mt-2 text-sm text-gray-400">{order.address}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                        Pickup {formatDateTime(order.pickup_datetime)}
                      </p>
                    </div>
                    <p className="text-lg font-black text-[#ffcb84]">{formatCurrency(order.total_estimated)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="rates-section" className={shellCardClass}>
            <SectionHeader
              eyebrow="Rate desk"
              title="Publish market rate"
              description="Add a fresh rate entry without leaving the dashboard flow."
            />

            <form onSubmit={handleRateSubmit} className="space-y-4">
              <select
                value={rateForm.category}
                onChange={(event) => setRateForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
                required
              >
                <option value="" className="bg-[#1f1713]">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-[#1f1713]">
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={rateForm.price_per_kg}
                onChange={(event) => setRateForm((prev) => ({ ...prev, price_per_kg: event.target.value }))}
                placeholder="Price per kg"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#caa780] focus:border-amber-400/40"
                required
              />
              <input
                type="datetime-local"
                value={rateForm.effective_from}
                onChange={(event) => setRateForm((prev) => ({ ...prev, effective_from: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
                required
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-[linear-gradient(90deg,#f97316,#f59e0b)] px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-110 shadow-[0_18px_40px_rgba(249,115,22,0.35)]"
              >
                Publish rate
              </button>
            </form>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className={shellCardClass}>
            <SectionHeader
              eyebrow="Recent rates"
              title="Published rate entries"
              description="Recent market rate entries with their effective date and current benchmark value."
            />

            <div className="space-y-3">
              {rates.slice(0, 5).length === 0 && <PreviewEmpty message="No rate entries have been published yet." />}
              {rates.slice(0, 5).map((rate) => (
                <article key={rate.id} className={surfaceCardClass}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-white">{rate.category.name}</p>
                      <p className="mt-2 text-sm text-gray-400">Effective {formatDateTime(rate.effective_from)}</p>
                    </div>
                    <p className="text-sm font-black text-[#ffcb84]">{formatCurrency(rate.price_per_kg)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={shellCardClass}>
            <SectionHeader
              eyebrow="Watchlist"
              title="Operations watchlist"
              description="Short, real-data highlights to keep the dashboard balanced all the way to the bottom of the page."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {watchlistItems.map((item) => (
                <article key={item.title} className={surfaceCardClass}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/8 p-3 text-[#ffcb84]">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">{item.title}</p>
                      <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-300/85">{item.detail}</p>
                </article>
              ))}

              <article className={`${surfaceCardClass} md:col-span-2`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Revenue trend</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {revenueTrendData.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{item.label}</p>
                      <p className="mt-3 text-lg font-black text-white">{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
