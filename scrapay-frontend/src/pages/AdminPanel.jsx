import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { catalogService } from '../services/catalogService.js';

const adminSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'users', label: 'Users' },
  { id: 'orders', label: 'Orders' },
  { id: 'rates', label: 'Rates' },
];

const statusOptions = [
  { value: '', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const chartPalette = ['#F59E0B', '#FB7185', '#38BDF8', '#4ADE80', '#F97316', '#A78BFA'];

const MiniBars = ({ data }) => {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-orange-100/80">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: chartPalette[index % chartPalette.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ segments }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
        <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="16" />
        {segments.map((segment, index) => {
          const circumference = 2 * Math.PI * 36;
          const length = (segment.value / total) * circumference;
          const dashOffset = circumference - offset;
          offset += length;
          return (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r="36"
              fill="none"
              stroke={chartPalette[index % chartPalette.length]}
              strokeWidth="16"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          );
        })}
        <text x="60" y="56" textAnchor="middle" className="fill-orange-100 text-[11px] font-bold">
          Orders
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-white text-[16px] font-black">
          {total}
        </text>
      </svg>
      <div className="space-y-2 text-xs">
        {segments.map((segment, index) => (
          <div key={segment.label} className="flex items-center gap-2 text-orange-100/85">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
            />
            <span>{segment.label}</span>
            <span className="font-semibold text-white">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [rateForm, setRateForm] = useState({
    category: '',
    price_per_kg: '',
    effective_from: '',
    is_active: true,
  });

  const refresh = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (err) {
        setError(err.message || 'Unable to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refresh]);

  const vendorSummary = useMemo(() => {
    const verified = vendors.filter((vendor) => vendor.is_verified).length;
    const online = vendors.filter((vendor) => vendor.is_online).length;
    return {
      verified,
      pending: vendors.length - verified,
      online,
    };
  }, [vendors]);

  const displayedOrders = useMemo(() => {
    if (statusFilter) {
      return orders.slice(0, 8);
    }
    return orders
      .filter((order) => ['pending', 'accepted', 'in_progress'].includes(order.status))
      .slice(0, 8);
  }, [orders, statusFilter]);

  const customerAccounts = useMemo(
    () => accounts.filter((account) => account.role === 'user').slice(0, 12),
    [accounts],
  );

  const vendorAccounts = useMemo(
    () => vendors.slice(0, 12),
    [vendors],
  );

  const operationsSummary = useMemo(
    () => ({
      suspendedAccounts: accounts.filter((account) => !account.is_active).length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      liveOrders: orders.filter((order) => ['accepted', 'in_progress'].includes(order.status)).length,
    }),
    [accounts, orders],
  );

  const orderChartData = useMemo(
    () => [
      { label: 'Pending', value: orders.filter((order) => order.status === 'pending').length },
      { label: 'Accepted', value: orders.filter((order) => order.status === 'accepted').length },
      { label: 'In Progress', value: orders.filter((order) => order.status === 'in_progress').length },
      { label: 'Completed', value: orders.filter((order) => order.status === 'completed').length },
      { label: 'Rejected', value: orders.filter((order) => order.status === 'rejected').length },
      { label: 'Cancelled', value: orders.filter((order) => order.status === 'cancelled').length },
    ],
    [orders],
  );

  const accountChartData = useMemo(
    () => [
      { label: 'Active Users', value: accounts.filter((account) => account.role === 'user' && account.is_active).length },
      { label: 'Suspended Users', value: accounts.filter((account) => account.role === 'user' && !account.is_active).length },
      { label: 'Active Vendors', value: accounts.filter((account) => account.role === 'vendor' && account.is_active).length },
      { label: 'Suspended Vendors', value: accounts.filter((account) => account.role === 'vendor' && !account.is_active).length },
    ],
    [accounts],
  );

  const latestRateChartData = useMemo(
    () =>
      rates.slice(0, 6).map((rate) => ({
        label: rate.category.name,
        value: Number(rate.price_per_kg),
      })),
    [rates],
  );

  const toggleVerification = async (vendor) => {
    try {
      const updated = await adminService.setVendorVerification(vendor.id, !vendor.is_verified);
      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to update vendor verification.');
    }
  };

  const toggleAccountStatus = async (account) => {
    try {
      const updated = await adminService.setAccountStatus(account.id, !account.is_active);
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)));
      if (updated.role === 'vendor') {
        setVendors((prev) =>
          prev.map((item) => (item.id === account.id ? { ...item, is_active: updated.is_active } : item)),
        );
      }
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

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-8 text-white sm:px-8">
      <div className="mb-8 rounded-[28px] border border-orange-200/15 bg-[#4A2F20]/80 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">Platform Operations</p>
        <h1 className="mt-2 text-4xl font-black text-orange-200">Scrapay Admin Console</h1>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/80">
          Oversee vendor trust, current market rates, and active order health from one place.
        </p>
      </div>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {loading && <p className="mb-4 text-sm text-orange-100">Loading operations data...</p>}
      {analytics && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
            <p className="text-xs uppercase text-orange-200">Users</p>
            <p className="text-3xl font-bold">{analytics.total_users}</p>
          </div>
          <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
            <p className="text-xs uppercase text-orange-200">Vendors</p>
            <p className="text-3xl font-bold">{analytics.total_vendors}</p>
          </div>
          <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
            <p className="text-xs uppercase text-orange-200">Orders</p>
            <p className="text-3xl font-bold">{analytics.total_orders}</p>
          </div>
          <div className="rounded-2xl bg-[#A1623C] p-4 shadow-lg">
            <p className="text-xs uppercase text-orange-200">Revenue</p>
            <p className="text-3xl font-bold">INR {analytics.revenue}</p>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {adminSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeSection === section.id
                ? 'bg-orange-400 text-black'
                : 'bg-[#4A2F20]/75 text-orange-100 hover:bg-[#5A3A28]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-orange-200/10 bg-[#A1623C] p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-100/70">Platform Pulse</p>
              <h2 className="mt-2 text-2xl font-black text-white">Operational Snapshot</h2>
            </div>
            <div className="rounded-full bg-[#4A2F20] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-200">
              Live overview
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-[#4A2F20] p-4">
              <p className="mb-3 text-sm font-semibold text-orange-100">Order mix</p>
              <DonutChart segments={orderChartData} />
            </div>
            <div className="rounded-2xl bg-[#4A2F20] p-4">
              <p className="mb-3 text-sm font-semibold text-orange-100">Account health</p>
              <MiniBars data={accountChartData} />
            </div>
            <div className="rounded-2xl bg-[#4A2F20] p-4">
              <p className="mb-3 text-sm font-semibold text-orange-100">Latest rate intensity</p>
              <MiniBars data={latestRateChartData.length ? latestRateChartData : [{ label: 'No rates yet', value: 0 }]} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-orange-200/10 bg-[#4A2F20]/85 p-5 shadow-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200/70">Trust Layer</p>
            <p className="mt-2 text-3xl font-black text-white">{vendorSummary.verified}/{vendors.length || 1}</p>
            <p className="mt-2 text-sm text-orange-100/80">vendors currently verified to receive orders</p>
          </div>
          <div className="rounded-[28px] border border-orange-200/10 bg-[#4A2F20]/85 p-5 shadow-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200/70">Queue Pressure</p>
            <p className="mt-2 text-3xl font-black text-white">{operationsSummary.pendingOrders}</p>
            <p className="mt-2 text-sm text-orange-100/80">orders waiting for vendor action</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Verified vendors</p>
          <p className="mt-2 text-3xl font-bold text-white">{vendorSummary.verified}</p>
        </div>
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Pending review</p>
          <p className="mt-2 text-3xl font-bold text-white">{vendorSummary.pending}</p>
        </div>
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Online vendors</p>
          <p className="mt-2 text-3xl font-bold text-white">{vendorSummary.online}</p>
        </div>
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Suspended accounts</p>
          <p className="mt-2 text-3xl font-bold text-white">{operationsSummary.suspendedAccounts}</p>
        </div>
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Pending orders</p>
          <p className="mt-2 text-3xl font-bold text-white">{operationsSummary.pendingOrders}</p>
        </div>
        <div className="rounded-2xl bg-[#4A2F20]/70 p-5 shadow-lg">
          <p className="text-xs uppercase text-orange-200">Live orders</p>
          <p className="mt-2 text-3xl font-bold text-white">{operationsSummary.liveOrders}</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          {(activeSection === 'overview' || activeSection === 'vendors') && (
          <div className="rounded-[24px] bg-[#A1623C] p-5 shadow-lg">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-orange-100">Vendor Review Queue</h2>
                <p className="text-sm text-orange-200/80">Approve trustworthy operators before they receive orders.</p>
              </div>
              <div className="rounded-full bg-[#4A2F20] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-200">
                {vendorAccounts.length} visible vendors
              </div>
            </div>
          <div className="space-y-3">
            {vendorAccounts.map((vendor) => (
              <div key={vendor.id} className="flex flex-col gap-3 rounded-2xl bg-[#4A2F20] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{vendor.business_name || vendor.username}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                      vendor.is_verified ? 'bg-green-600/80 text-white' : 'bg-yellow-500/80 text-black'
                    }`}>
                      {vendor.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                      vendor.is_active ? 'bg-sky-600/80 text-white' : 'bg-red-500/80 text-white'
                    }`}>
                      {vendor.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-xs text-orange-200">{vendor.email}</p>
                  {vendor.license_number && (
                    <p className="text-xs text-orange-200">License: {vendor.license_number}</p>
                  )}
                  <p className="text-xs text-orange-200">
                    Availability: {vendor.is_online ? 'Online' : 'Offline'} • Rating {vendor.rating_avg}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleVerification(vendor)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      vendor.is_verified ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {vendor.is_verified ? 'Remove Verification' : 'Approve Vendor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAccountStatus(vendor)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      vendor.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'
                    }`}
                  >
                    {vendor.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
          )}

          {(activeSection === 'overview' || activeSection === 'orders') && (
          <div className="rounded-[24px] bg-[#A1623C] p-5 shadow-lg">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-orange-100">Order Oversight</h2>
                <p className="text-sm text-orange-200/80">Track customer orders across the platform.</p>
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-full bg-[#4A2F20] px-4 py-2 text-sm text-orange-100 outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {displayedOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-orange-200/20 bg-[#4A2F20]/60 p-5 text-sm text-orange-100/80">
                  No orders match this filter right now.
                </div>
              )}
              {displayedOrders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-[#4A2F20] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">Order #{order.id}</p>
                        <span className="rounded-full bg-orange-400/90 px-2 py-1 text-[10px] font-bold uppercase text-black">
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-orange-100">
                        Customer: {order.customer_name} • Vendor: {order.vendor_name || 'Unassigned'}
                      </p>
                      <p className="mt-1 text-xs text-orange-200">
                        Pickup: {new Date(order.pickup_datetime).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-yellow-100">Est. INR {order.total_estimated}</p>
                  </div>
                  <p className="mt-3 text-sm text-orange-100/90">{order.address}</p>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="space-y-8">
          {(activeSection === 'overview' || activeSection === 'users') && (
          <div className="rounded-[24px] bg-[#A1623C] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-orange-100">Customer Accounts</h2>
                <p className="text-sm text-orange-200/80">Suspend abusive or inactive customer accounts when needed.</p>
              </div>
              <div className="rounded-full bg-[#4A2F20] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-200">
                {customerAccounts.length} visible users
              </div>
            </div>
            <div className="space-y-2">
              {customerAccounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-xl bg-[#4A2F20] p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{account.full_name || account.username}</p>
                    <p className="text-xs text-orange-200">{account.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAccountStatus(account)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      account.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'
                    }`}
                  >
                    {account.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          {(activeSection === 'overview' || activeSection === 'rates') && (
          <div className="rounded-[24px] bg-[#A1623C] p-5 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-orange-100">Rate Desk</h2>
            <form onSubmit={handleRateSubmit} className="space-y-3">
              <select
                value={rateForm.category}
                onChange={(event) => setRateForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-xl bg-yellow-100 px-3 py-2 text-black"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
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
                className="w-full rounded-xl bg-yellow-100 px-3 py-2 text-black"
                required
              />
              <input
                type="datetime-local"
                value={rateForm.effective_from}
                onChange={(event) => setRateForm((prev) => ({ ...prev, effective_from: event.target.value }))}
                className="w-full rounded-xl bg-yellow-100 px-3 py-2 text-black"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold hover:bg-orange-600"
              >
                Publish Rate
              </button>
            </form>
          </div>
          )}

          {(activeSection === 'overview' || activeSection === 'rates') && (
          <div className="rounded-[24px] bg-[#A1623C] p-5 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-orange-100">Recent Rate Entries</h2>
            <div className="space-y-2 text-sm">
              {rates.slice(0, 10).map((rate) => (
                <div key={rate.id} className="rounded-xl bg-[#4A2F20] p-3">
                  <p className="font-semibold text-white">{rate.category.name}</p>
                  <p className="text-orange-100">INR {rate.price_per_kg} per kg</p>
                  <p className="text-xs text-orange-200">
                    Effective {new Date(rate.effective_from).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
