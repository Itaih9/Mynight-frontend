import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminAffiliate } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clock,
  X,
  DollarSign,
  Wallet,
  Loader2,
  PlusCircle,
  Eye,
} from 'lucide-react';

const categoryLabels: Record<string, string> = {
  photographer: 'Photographer',
  makeup: 'Makeup',
  costume: 'Costume',
  manager: 'Manager',
  venue: 'Venue',
  other: 'Other',
};

const intentLabels: Record<string, string> = {
  resell: 'Resell',
  affiliate: 'Affiliate',
};

export const AdminAffiliates = () => {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [payoutModal, setPayoutModal] = useState<AdminAffiliate | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [topupModal, setTopupModal] = useState<AdminAffiliate | null>(null);
  const [topupEvents, setTopupEvents] = useState('1');
  const [topupNote, setTopupNote] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');

  const [usagesModal, setUsagesModal] = useState<AdminAffiliate | null>(null);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [usagesData, setUsagesData] = useState<any>(null);

  const openPayout = (affiliate: AdminAffiliate) => {
    setPayoutModal(affiliate);
    setPayoutAmount(String(affiliate.pendingEarnings || 0));
    setPayoutNote('');
    setPayoutError('');
  };

  const handlePayout = async () => {
    if (!payoutModal) return;
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayoutError('Amount must be greater than 0');
      return;
    }
    if (amount > (payoutModal.pendingEarnings || 0)) {
      setPayoutError('Amount exceeds available balance');
      return;
    }
    setPayoutLoading(true);
    setPayoutError('');
    try {
      await adminApi.payoutAffiliate(payoutModal._id, amount, payoutNote || undefined);
      setSuccessToast(`Paid out ₪${amount.toFixed(2)} to ${payoutModal.email}`);
      setTimeout(() => setSuccessToast(null), 3500);
      setPayoutModal(null);
      loadAffiliates(pagination.page);
    } catch (err: any) {
      setPayoutError(err?.response?.data?.error || 'Failed to record payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const openTopup = (affiliate: AdminAffiliate) => {
    setTopupModal(affiliate);
    setTopupEvents('1');
    setTopupNote('');
    setTopupError('');
  };

  const handleTopup = async () => {
    if (!topupModal) return;
    const events = parseInt(topupEvents, 10);
    if (!Number.isFinite(events) || events <= 0) {
      setTopupError('Events must be a positive integer');
      return;
    }
    setTopupLoading(true);
    setTopupError('');
    try {
      const result = await adminApi.topUpPrepaid(topupModal._id, events, topupNote || undefined);
      setSuccessToast(`Added ${events} events to ${topupModal.email}. Code: ${result.prepaidCouponCode}`);
      setTimeout(() => setSuccessToast(null), 5000);
      setTopupModal(null);
      loadAffiliates(pagination.page);
    } catch (err: any) {
      setTopupError(err?.response?.data?.error || 'Failed to top up');
    } finally {
      setTopupLoading(false);
    }
  };

  const openUsages = async (affiliate: AdminAffiliate) => {
    setUsagesModal(affiliate);
    setUsagesLoading(true);
    setUsagesData(null);
    try {
      const data = await adminApi.getAffiliatePrepaid(affiliate._id);
      setUsagesData(data);
    } catch (err: any) {
      setErrorToast(err?.response?.data?.error || 'Failed to load usages');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setUsagesLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliates(1);
  }, []);

  const loadAffiliates = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getAffiliates(page, 20);
      setAffiliates(data.affiliates);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (affiliateId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      await adminApi.updateAffiliateStatus(affiliateId, status);
      setAffiliates(affiliates.map(a =>
        a._id === affiliateId ? { ...a, status } : a
      ));
    } catch (err) {
      setErrorToast('Failed to update affiliate status');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <UserCheck className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'rejected':
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AdminLayout>
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}
      <>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Affiliates</h1>
          <span className="text-sm text-slate-600">{pagination.total} total affiliates</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Affiliate</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Category</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Intent</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Referral Code</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Referrals</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Earnings</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Joined</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {affiliate.email}
                          </p>
                          <p className="text-xs text-slate-500">{affiliate.phone}</p>
                          {affiliate.name && (
                            <p className="text-xs text-slate-400">{affiliate.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                          {categoryLabels[affiliate.category] || affiliate.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          {intentLabels[affiliate.intent] || affiliate.intent}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {affiliate.referralCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(affiliate.status)}`}>
                          {getStatusIcon(affiliate.status)}
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {affiliate.referralCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">
                            ₪{(affiliate.totalEarnings || 0).toFixed(2)}
                          </p>
                          {(affiliate.pendingEarnings || 0) > 0 && (
                            <p className="text-xs text-amber-600">
                              ₪{affiliate.pendingEarnings.toFixed(2)} pending
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(affiliate.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={affiliate.status}
                            onChange={(e) => handleStatusChange(affiliate._id, e.target.value as 'pending' | 'approved' | 'rejected')}
                            className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-slate-400"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          {(affiliate.pendingEarnings || 0) > 0 && (
                            <button
                              onClick={() => openPayout(affiliate)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                              title="Pay this affiliate directly"
                            >
                              <Wallet size={14} />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() => openTopup(affiliate)}
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            title="Add prepaid events to this partner"
                          >
                            <PlusCircle size={14} />
                            <span>Top up</span>
                            {(affiliate.prepaidBalance || 0) > 0 && (
                              <span className="ml-1 bg-white/20 px-1.5 rounded">{affiliate.prepaidBalance}</span>
                            )}
                          </button>
                          {affiliate.status === 'approved' && (
                            <button
                              onClick={() => openUsages(affiliate)}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                              title="View assigned coupons and prepaid usages"
                            >
                              <Eye size={14} />
                              <span>{(affiliate.prepaidUsed || 0) > 0 ? `${affiliate.prepaidUsed} used` : 'View'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {affiliates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No affiliates yet</p>
                </div>
              )}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadAffiliates(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadAffiliates(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-green-600 text-white">
            {successToast}
          </div>
        )}

        {payoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
            <div className="absolute inset-0 bg-black/50" onClick={() => !payoutLoading && setPayoutModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Pay affiliate</h3>
                  <button onClick={() => !payoutLoading && setPayoutModal(null)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  <div className="font-medium text-slate-900">{payoutModal.name || payoutModal.email}</div>
                  <div className="text-xs text-slate-400">{payoutModal.email} · {payoutModal.phone}</div>
                  <div className="mt-2 text-xs text-slate-500">Available balance: <span className="font-bold text-slate-900">₪{(payoutModal.pendingEarnings || 0).toFixed(2)}</span></div>
                </div>

                {(payoutModal.bankName || payoutModal.bankBranch || payoutModal.bankAccountNumber || payoutModal.bankAccountHolder || payoutModal.bankDetails || payoutModal.paypalEmail) ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-left" dir="ltr">
                    <div className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide">Send to:</div>
                    <div className="space-y-1.5 text-base">
                      {payoutModal.bankName && <div><span className="text-slate-500">Bank:</span> <span className="text-slate-900 font-semibold">{payoutModal.bankName}</span></div>}
                      {payoutModal.bankBranch && <div><span className="text-slate-500">Branch:</span> <span className="text-slate-900 font-semibold font-mono">{payoutModal.bankBranch}</span></div>}
                      {payoutModal.bankAccountNumber && <div><span className="text-slate-500">Account:</span> <span className="text-slate-900 font-semibold font-mono">{payoutModal.bankAccountNumber}</span></div>}
                      {payoutModal.bankAccountHolder && <div><span className="text-slate-500">Holder:</span> <span className="text-slate-900 font-semibold">{payoutModal.bankAccountHolder}</span></div>}
                      {payoutModal.paypalEmail && <div><span className="text-slate-500">PayPal:</span> <span className="text-slate-900 font-semibold">{payoutModal.paypalEmail}</span></div>}
                      {payoutModal.bankDetails && !payoutModal.bankAccountNumber && (
                        <div><span className="text-slate-500">Notes:</span> <span className="text-slate-900 font-semibold">{payoutModal.bankDetails}</span></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800" dir="ltr">
                    No bank details on file. Ask the affiliate to fill them in before paying.
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Amount (ILS)</label>
                    <input type="number" value={payoutAmount} onChange={(e) => { setPayoutAmount(e.target.value); setPayoutError(''); }} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-base font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Note (optional)</label>
                    <input type="text" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="e.g. bank transfer ref" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm" />
                  </div>
                  {payoutError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{payoutError}</div>}
                  <div className="text-xs text-slate-400">This records the payout in the system and deducts the amount from the affiliate's balance. Send the actual money externally (bank transfer / PayPal).</div>
                </div>
              </div>
              <div className="flex gap-2 px-6 pb-6">
                <button onClick={() => setPayoutModal(null)} disabled={payoutLoading} className="flex-1 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button onClick={handlePayout} disabled={payoutLoading} className="flex-1 py-2.5 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {payoutLoading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                  <span>Record payout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {topupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
            <div className="absolute inset-0 bg-black/50" onClick={() => !topupLoading && setTopupModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Top up prepaid events</h3>
                  <button onClick={() => !topupLoading && setTopupModal(null)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  <div className="font-medium text-slate-900">{topupModal.name || topupModal.email}</div>
                  <div className="text-xs text-slate-400">{topupModal.email} · {topupModal.phone}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 rounded-lg p-2">Available: <span className="font-bold text-blue-700">{topupModal.prepaidBalance || 0}</span></div>
                    <div className="bg-slate-50 rounded-lg p-2">Used: <span className="font-bold text-slate-700">{topupModal.prepaidUsed || 0}</span></div>
                  </div>
                  {topupModal.prepaidCouponCode && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs font-mono">
                      Code: <span className="font-bold">{topupModal.prepaidCouponCode}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Number of events to add</label>
                    <input type="number" min="1" value={topupEvents} onChange={(e) => { setTopupEvents(e.target.value); setTopupError(''); }} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-base font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Note (optional)</label>
                    <input type="text" value={topupNote} onChange={(e) => setTopupNote(e.target.value)} placeholder="e.g. paid via Sumit ref #12345" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm" />
                  </div>
                  {topupError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{topupError}</div>}
                  <div className="text-xs text-slate-400">After confirming, a unique 100% discount code is generated (or kept) for this partner. Each couple who uses it deducts 1 from the balance.</div>
                </div>
              </div>
              <div className="flex gap-2 px-6 pb-6">
                <button onClick={() => setTopupModal(null)} disabled={topupLoading} className="flex-1 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button onClick={handleTopup} disabled={topupLoading} className="flex-1 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {topupLoading ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                  <span>Add events</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {usagesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
            <div className="absolute inset-0 bg-black/50" onClick={() => setUsagesModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-left">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Prepaid usage history</h3>
                  <button onClick={() => setUsagesModal(null)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  <div className="font-medium text-slate-900">{usagesModal.name || usagesModal.email}</div>
                  {usagesData && (
                    <div className="mt-2 flex gap-2 text-xs">
                      <div className="bg-blue-50 rounded-lg px-3 py-1.5">Balance: <span className="font-bold text-blue-700">{usagesData.balance}</span></div>
                      <div className="bg-green-50 rounded-lg px-3 py-1.5">Used: <span className="font-bold text-green-700">{usagesData.used}</span></div>
                      {usagesData.couponCode && (
                        <div className="bg-amber-50 rounded-lg px-3 py-1.5 font-mono">{usagesData.couponCode}</div>
                      )}
                    </div>
                  )}
                </div>

                {usagesLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></div>}

                {usagesData?.linkedCoupons?.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Assigned coupons (2% commission per use)</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {usagesData.linkedCoupons.map((c: any) => (
                        <div key={c._id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-sm text-slate-900">{c.code}</div>
                            <div className="text-xs text-slate-500">{c.discountPercent}% discount · used {c.usedCount} times{c.maxUses > 0 ? ` / max ${c.maxUses}` : ''}</div>
                          </div>
                          {c.isActive ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Inactive</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usagesData && usagesData.usages?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Prepaid code usage history</div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {usagesData.usages.map((u: any) => (
                        <div key={u._id} className="bg-slate-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-slate-900 truncate">{u.coupleName || u.eventName}</div>
                            <div className="text-xs text-slate-400 truncate">{u.eventName} · code: {u.couponCode}</div>
                          </div>
                          <div className="text-xs text-slate-400 shrink-0 ml-3">{new Date(u.usedAt || u.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usagesData && (!usagesData.usages || usagesData.usages.length === 0) && (!usagesData.linkedCoupons || usagesData.linkedCoupons.length === 0) && (
                  <div className="text-center py-8 text-sm text-slate-400">No assigned coupons or prepaid usages yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    </AdminLayout>
  );
};
