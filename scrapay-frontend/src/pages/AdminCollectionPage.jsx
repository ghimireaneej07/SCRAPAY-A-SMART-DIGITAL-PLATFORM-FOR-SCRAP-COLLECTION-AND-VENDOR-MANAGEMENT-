import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';

const shellCardClass =
  'rounded-[30px] border border-white/10 bg-[#1b120f]/75 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl';

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f6e7d4] outline-none transition placeholder:text-[#c9ad8b] focus:border-[#f59e0b]/50';

const verificationBadgeClass = {
  pending: 'bg-amber-300/16 text-amber-200 ring-1 ring-amber-300/20',
  approved: 'bg-emerald-300/16 text-emerald-200 ring-1 ring-emerald-300/20',
  rejected: 'bg-rose-300/16 text-rose-200 ring-1 ring-rose-300/20',
};

const accountBadgeClass = {
  active: 'bg-emerald-300/16 text-emerald-200 ring-1 ring-emerald-300/20',
  suspended: 'bg-rose-300/16 text-rose-200 ring-1 ring-rose-300/20',
};

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleDateString();
};

const AdminCollectionPage = ({ mode = 'vendors' }) => {
  const isVendorMode = mode === 'vendors';
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const loadRecords = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setRefreshing(true);
      const response = isVendorMode
        ? await adminService.getVendors()
        : await adminService.getAccounts('user');
      setRecords(response);
      setError('');
    } catch (err) {
      setError(err.message || `Unable to load ${mode}.`);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [isVendorMode, mode]);

  useEffect(() => {
    loadRecords(true);
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          record.full_name,
          record.username,
          record.email,
          record.business_name,
          record.city,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }

      if (statusFilter === 'all') {
        return true;
      }

      if (isVendorMode) {
        if (statusFilter === 'online') {
          return Boolean(record.is_online);
        }
        return record.verification_status === statusFilter;
      }

      if (statusFilter === 'active') {
        return Boolean(record.is_active);
      }
      if (statusFilter === 'suspended') {
        return !record.is_active;
      }
      return true;
    });
  }, [isVendorMode, query, records, statusFilter]);

  const summaryCards = useMemo(() => {
    if (isVendorMode) {
      return [
        {
          label: 'Total vendors',
          value: records.length,
          detail: 'Registered operators on the platform',
        },
        {
          label: 'Pending review',
          value: records.filter((record) => record.verification_status === 'pending').length,
          detail: 'Need approval or rejection',
        },
        {
          label: 'Approved',
          value: records.filter((record) => record.verification_status === 'approved').length,
          detail: 'Ready to receive orders',
        },
        {
          label: 'Online now',
          value: records.filter((record) => record.is_online).length,
          detail: 'Live operational presence',
        },
      ];
    }

    return [
      {
        label: 'Total users',
        value: records.length,
        detail: 'Customer accounts available to manage',
      },
      {
        label: 'Active',
        value: records.filter((record) => record.is_active).length,
        detail: 'Accounts that can place orders',
      },
      {
        label: 'Suspended',
        value: records.filter((record) => !record.is_active).length,
        detail: 'Temporarily blocked customer accounts',
      },
      {
        label: 'Search results',
        value: filteredRecords.length,
        detail: 'Records matching current filters',
      },
    ];
  }, [filteredRecords.length, isVendorMode, records]);

  const handleVendorApproval = async (vendorId) => {
    try {
      setSavingAction(true);
      const updated = await adminService.setVendorVerification(vendorId, true);
      setRecords((prev) => prev.map((record) => (record.id === vendorId ? updated : record)));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to approve vendor.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleVendorRejection = async () => {
    if (!rejectionTarget) {
      return;
    }
    if (!rejectionReason.trim()) {
      setError('Please enter a rejection reason before submitting.');
      return;
    }

    try {
      setSavingAction(true);
      const updated = await adminService.setVendorVerification(rejectionTarget.id, false, rejectionReason.trim());
      setRecords((prev) => prev.map((record) => (record.id === rejectionTarget.id ? updated : record)));
      setRejectionTarget(null);
      setRejectionReason('');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to reject vendor.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleAccountStatus = async (record) => {
    try {
      setSavingAction(true);
      const updated = await adminService.setAccountStatus(record.id, !record.is_active);
      setRecords((prev) => prev.map((item) => (item.id === record.id ? updated : item)));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to update account status.');
    } finally {
      setSavingAction(false);
    }
  };

  const pageTitle = isVendorMode ? 'Vendor Verification Management' : 'Customer Account Management';
  const pageDescription = isVendorMode
    ? 'Handle onboarding, approvals, and operational readiness for the full vendor directory.'
    : 'Review customer records, search quickly, and suspend or reactivate accounts without leaving the admin workspace.';

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120c0a] px-4 py-8 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_16%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(199,88,29,0.14),transparent_24%),radial-gradient(circle_at_74%_76%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(135deg,#120c0a_0%,#1f130d_40%,#2f1a10_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 pb-10">
        <header className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-200/70">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 tracking-normal text-[#f6dfbc] transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <span>{isVendorMode ? 'Vendor directory' : 'User directory'}</span>
            </div>

            <h1 className="mt-6 text-4xl font-black text-[#fff1df] sm:text-5xl">{pageTitle}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300/90">{pageDescription}</p>
          </div>

          <div className={`${shellCardClass} flex flex-col justify-between gap-4`}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Workspace notes</p>
              <p className="mt-3 text-sm leading-7 text-gray-300/90">
                Filter by status, review live totals, and refresh the directory when new vendors or users arrive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadRecords(false)}
              disabled={refreshing || savingAction}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-[#f8e5c7] transition hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh directory
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 backdrop-blur">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.label} className={shellCardClass}>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{card.label}</p>
              <p className="mt-4 text-4xl font-black text-white tabular-nums">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-gray-300/85">{card.detail}</p>
            </article>
          ))}
        </div>

        <section className={`${shellCardClass} space-y-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Filter workspace</p>
              <h2 className="mt-2 text-2xl font-black text-white">Search and narrow results</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d7b288]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={isVendorMode ? 'Search vendor, email, city' : 'Search user, email, username'}
                  className={`pl-11 ${inputClass}`}
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={inputClass}
              >
                {isVendorMode ? (
                  <>
                    <option value="all">All vendors</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="online">Online now</option>
                  </>
                ) : (
                  <>
                    <option value="all">All users</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </section>

        <section className={`${shellCardClass} overflow-hidden`}>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">Directory list</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {filteredRecords.length} {isVendorMode ? 'vendors' : 'users'} match your current view
              </h2>
            </div>
            {loading && <span className="text-sm text-amber-100/80">Loading records...</span>}
          </div>

          <div className="-mx-6 overflow-x-auto px-6">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.25em] text-gray-400">
                  <th className="pb-1 font-semibold">Identity</th>
                  {isVendorMode && <th className="pb-1 font-semibold">Business</th>}
                  <th className="pb-1 font-semibold">Email</th>
                  {isVendorMode && <th className="pb-1 font-semibold">City</th>}
                  <th className="pb-1 font-semibold">Status</th>
                  <th className="pb-1 font-semibold">{isVendorMode ? 'Registered' : 'Account'}</th>
                  <th className="pb-1 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={isVendorMode ? 7 : 5}
                      className="rounded-3xl border border-dashed border-white/10 bg-white/4 px-6 py-10 text-center text-sm text-gray-300"
                    >
                      No records match the current search and filters.
                    </td>
                  </tr>
                )}

                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-top">
                    <td className="rounded-l-3xl border border-white/8 border-r-0 bg-[#0f0a08]/65 px-5 py-4">
                      <p className="font-bold text-white">{record.full_name || record.username}</p>
                      <p className="mt-1 text-xs text-gray-400">@{record.username}</p>
                    </td>

                    {isVendorMode && (
                      <td className="border-y border-white/8 bg-[#0f0a08]/65 px-5 py-4">
                        <p className="font-semibold text-[#f6dfbc]">{record.business_name || '-'}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {record.license_number ? `License ${record.license_number}` : 'License not submitted'}
                        </p>
                      </td>
                    )}

                    <td className="border-y border-white/8 bg-[#0f0a08]/65 px-5 py-4 text-gray-300">
                      {record.email}
                    </td>

                    {isVendorMode && (
                      <td className="border-y border-white/8 bg-[#0f0a08]/65 px-5 py-4 text-gray-300">
                        {record.city || '-'}
                      </td>
                    )}

                    <td className="border-y border-white/8 bg-[#0f0a08]/65 px-5 py-4">
                      {isVendorMode ? (
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                              verificationBadgeClass[record.verification_status] || verificationBadgeClass.pending
                            }`}
                          >
                            {record.verification_status}
                          </span>
                          <p className="text-xs text-gray-400">
                            {record.is_online ? 'Online now' : 'Currently offline'}
                          </p>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            record.is_active ? accountBadgeClass.active : accountBadgeClass.suspended
                          }`}
                        >
                          {record.is_active ? 'Active' : 'Suspended'}
                        </span>
                      )}
                    </td>

                    <td className="border-y border-white/8 bg-[#0f0a08]/65 px-5 py-4 text-gray-300">
                      {isVendorMode ? formatDate(record.date_joined) : record.is_active ? 'Open' : 'Restricted'}
                    </td>

                    <td className="rounded-r-3xl border border-white/8 border-l-0 bg-[#0f0a08]/65 px-5 py-4 text-right">
                      {isVendorMode ? (
                        <div className="flex flex-col items-end gap-2">
                          {record.verification_status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                disabled={savingAction}
                                onClick={() => handleVendorApproval(record.id)}
                                className="rounded-xl bg-emerald-500/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-500 disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={savingAction}
                                onClick={() => {
                                  setRejectionTarget(record);
                                  setRejectionReason(record.rejection_reason || '');
                                  setError('');
                                }}
                                className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              {record.verification_status === 'approved' ? 'Verified' : 'Review complete'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={savingAction}
                          onClick={() => handleAccountStatus(record)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition disabled:opacity-60 ${
                            record.is_active
                              ? 'bg-rose-500/90 hover:bg-rose-500'
                              : 'bg-sky-600/90 hover:bg-sky-600'
                          }`}
                        >
                          {record.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isVendorMode && rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#1b120f] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-rose-200/70">Rejection reason</p>
                <h3 className="mt-1 text-2xl font-black text-white">{rejectionTarget.business_name || rejectionTarget.username}</h3>
              </div>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Explain why this vendor cannot be approved yet."
              className="mt-5 min-h-[150px] w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#f6e7d4] outline-none transition placeholder:text-[#c9ad8b] focus:border-[#f59e0b]/50"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setRejectionTarget(null);
                  setRejectionReason('');
                }}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#f6dfbc] transition hover:bg-white/8"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAction}
                onClick={handleVendorRejection}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-400 disabled:opacity-60"
              >
                Submit rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminCollectionPage;
