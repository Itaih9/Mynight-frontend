import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin.api';
import { AdminLayout } from './AdminLayout';
import { Loader } from '@/components/common/Loader';
import { CheckCircle2, XCircle, Loader2, Wallet } from 'lucide-react';

interface AdminWithdrawal {
  _id: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  note?: string;
  adminNote?: string;
  bankDetailsSnapshot?: string;
  paidAt?: string;
  createdAt: string;
  affiliateId?: {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    paypalEmail?: string;
    bankDetails?: string;
    referralCode?: string;
  } | string;
}

interface ConfirmState {
  kind: 'paid' | 'reject';
  withdrawal: AdminWithdrawal;
  note: string;
}

export const AdminWithdrawals = () => {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmRunning, setConfirmRunning] = useState(false);

  const load = async (filter: 'all' | 'pending' | 'paid' | 'rejected' = statusFilter) => {
    setLoading(true);
    try {
      const data = await adminApi.listWithdrawals(filter === 'all' ? undefined : filter);
      setItems(data || []);
    } catch (err) {
      setToast({ kind: 'error', text: 'Failed to load withdrawals' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openMarkPaid = (w: AdminWithdrawal) => setConfirmState({ kind: 'paid', withdrawal: w, note: '' });
  const openReject = (w: AdminWithdrawal) => setConfirmState({ kind: 'reject', withdrawal: w, note: '' });

  const runConfirm = async () => {
    if (!confirmState) return;
    setConfirmRunning(true);
    setActingId(confirmState.withdrawal._id);
    try {
      if (confirmState.kind === 'paid') {
        await adminApi.markWithdrawalPaid(confirmState.withdrawal._id, confirmState.note || undefined);
        setToast({ kind: 'success', text: 'Marked as paid' });
      } else {
        await adminApi.rejectWithdrawal(confirmState.withdrawal._id, confirmState.note || undefined);
        setToast({ kind: 'success', text: 'Rejected' });
      }
      setTimeout(() => setToast(null), 2500);
      setConfirmState(null);
      await load();
    } catch (err: any) {
      setToast({ kind: 'error', text: err?.response?.data?.error || 'Failed' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActingId(null);
      setConfirmRunning(false);
    }
  };

  return (
    <AdminLayout>
      <>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="text-gold-primary" size={28} />
            <h1 className="text-2xl font-semibold text-slate-900">Affiliate Withdrawals</h1>
          </div>
          <div className="flex items-center gap-2">
            {(['pending', 'paid', 'rejected', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-slate-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-50" />
            <p>No withdrawals in this category.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Affiliate</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Bank / PayPal</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Note</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((w) => {
                  const aff = typeof w.affiliateId === 'object' ? w.affiliateId : null;
                  return (
                    <tr key={w._id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(w.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-slate-900">{aff?.name || aff?.email || '—'}</div>
                        {aff && <div className="text-xs text-slate-400">{aff.email}{aff.phone ? ` · ${aff.phone}` : ''}</div>}
                        {aff?.referralCode && <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{aff.referralCode}</code>}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">₪{w.amount}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                        {w.bankDetailsSnapshot || aff?.bankDetails || aff?.paypalEmail || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{w.note || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          w.status === 'paid' ? 'bg-green-100 text-green-700' :
                          w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {w.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => openMarkPaid(w)} disabled={actingId === w._id} className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50" title="Mark as paid">
                              {actingId === w._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </button>
                            <button onClick={() => openReject(w)} disabled={actingId === w._id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {confirmState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
            <div className="absolute inset-0 bg-black/50" onClick={() => !confirmRunning && setConfirmState(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left">
              <div className="p-6">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  confirmState.kind === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}>
                  {confirmState.kind === 'paid' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                </div>
                <h3 className="text-xl font-bold text-center mb-2">
                  {confirmState.kind === 'paid' ? 'Mark withdrawal as paid' : 'Reject withdrawal'}
                </h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed mb-4">
                  {confirmState.kind === 'paid'
                    ? `This will deduct ₪${confirmState.withdrawal.amount} from the affiliate's pending balance and add it to paid earnings. Make sure you have already sent the money externally.`
                    : `This will reject the withdrawal request. The affiliate's balance is not affected.`}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-sm space-y-1">
                  <div><span className="text-slate-500">Affiliate:</span> <span className="font-semibold text-slate-900">{(typeof confirmState.withdrawal.affiliateId === 'object' && confirmState.withdrawal.affiliateId?.email) || '—'}</span></div>
                  <div><span className="text-slate-500">Amount:</span> <span className="font-semibold text-slate-900">₪{confirmState.withdrawal.amount}</span></div>
                  {confirmState.withdrawal.bankDetailsSnapshot && (
                    <div><span className="text-slate-500">Send to:</span> <span className="font-semibold text-slate-900">{confirmState.withdrawal.bankDetailsSnapshot}</span></div>
                  )}
                </div>

                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {confirmState.kind === 'paid' ? 'Note (optional)' : 'Reason (optional)'}
                </label>
                <input
                  type="text"
                  value={confirmState.note}
                  onChange={(e) => setConfirmState({ ...confirmState, note: e.target.value })}
                  placeholder={confirmState.kind === 'paid' ? 'e.g. bank transfer ref' : 'e.g. duplicate request'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setConfirmState(null)}
                  disabled={confirmRunning}
                  className="flex-1 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={runConfirm}
                  disabled={confirmRunning}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                    confirmState.kind === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {confirmRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : (confirmState.kind === 'paid' ? 'Mark paid' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.kind === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.text}
          </div>
        )}
      </>
    </AdminLayout>
  );
};
