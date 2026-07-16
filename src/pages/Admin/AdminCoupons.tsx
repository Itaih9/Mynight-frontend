import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminCoupon, type AdminAffiliate, type AdminEvent, type CouponDefaults } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';

type DiscountType = 'percent' | 'fixed';

export const AdminCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent' as DiscountType,
    discountValue: 100,
    maxUses: '',
    expiresAt: '',
    affiliateId: '',
    eventId: '',
    packageName: '',
  });
  const [formError, setFormError] = useState('');
  const [affiliateOptions, setAffiliateOptions] = useState<AdminAffiliate[]>([]);
  const [eventOptions, setEventOptions] = useState<AdminEvent[]>([]);

  // Event-coupon defaults panel
  const [defaults, setDefaults] = useState<CouponDefaults | null>(null);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [applying, setApplying] = useState(false);

  // Per-event coupon edit modal
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null);
  const [editDraft, setEditDraft] = useState<{ discountType: DiscountType; discountValue: number; maxUses: string; isActive: boolean }>({
    discountType: 'fixed', discountValue: 0, maxUses: '', isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    loadCoupons(1);
    adminApi.getAffiliates(1, 200).then((res) => setAffiliateOptions(res.affiliates || [])).catch(() => {});
    adminApi.getEvents(1, 500).then((res) => setEventOptions(res.events || [])).catch(() => {});
    adminApi.getCouponDefaults().then(setDefaults).catch(() => {});
  }, []);

  const loadCoupons = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getCoupons(page, 20);
      setCoupons(data.coupons);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      await adminApi.createCoupon({
        code: formData.code,
        ...(formData.discountType === 'fixed'
          ? { discountAmount: formData.discountValue }
          : { discountPercent: formData.discountValue }),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
        affiliateId: formData.affiliateId || undefined,
        ownerEventId: formData.eventId || undefined,
        packageName: formData.packageName || undefined,
      });
      setShowModal(false);
      setFormData({ code: '', discountType: 'percent', discountValue: 100, maxUses: '', expiresAt: '', affiliateId: '', eventId: '', packageName: '' });
      loadCoupons(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await adminApi.deleteCoupon(couponId);
      loadCoupons(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleSaveDefaults = async () => {
    if (!defaults) return;
    try {
      setSavingDefaults(true);
      const updated = await adminApi.updateCouponDefaults(defaults);
      setDefaults(updated);
      showToast('Event-coupon defaults saved. New events will use them.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save defaults');
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleApplyDefaults = async () => {
    if (!confirm('Apply the current defaults to all existing event coupons? Coupons you edited per-event, or that were already used, are left untouched.')) return;
    try {
      setApplying(true);
      const res = await adminApi.applyCouponDefaults();
      showToast(`Updated ${res.updated} existing event coupon${res.updated === 1 ? '' : 's'}.`);
      loadCoupons(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply defaults');
    } finally {
      setApplying(false);
    }
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditCoupon(coupon);
    setEditDraft({
      discountType: coupon.discountAmount && coupon.discountAmount > 0 ? 'fixed' : 'percent',
      discountValue: coupon.discountAmount && coupon.discountAmount > 0 ? coupon.discountAmount : coupon.discountPercent,
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editCoupon) return;
    try {
      setSavingEdit(true);
      const updated = await adminApi.updateCoupon(editCoupon._id, {
        discountType: editDraft.discountType,
        discountValue: editDraft.discountValue,
        maxUses: editDraft.maxUses ? parseInt(editDraft.maxUses) : 0,
        isActive: editDraft.isActive,
      });
      setCoupons((prev) => prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)));
      setEditCoupon(null);
      showToast(`Saved "${updated.code}".`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AdminLayout>
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Coupons</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        {toast && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">{toast}</div>
        )}

        {/* Event gift-coupon defaults */}
        {defaults && (
          <div dir="ltr" className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">Event gift-coupon defaults</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Every new event automatically gets a gift coupon (shown in the couple's gallery) using these values.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount type</label>
                <select
                  value={defaults.discountType}
                  onChange={(e) => setDefaults({ ...defaults, discountType: e.target.value as DiscountType })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  <option value="fixed">Fixed (₪)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {defaults.discountType === 'fixed' ? 'Amount (₪)' : 'Percent (%)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  max={defaults.discountType === 'percent' ? '100' : undefined}
                  value={defaults.discountValue}
                  onChange={(e) => setDefaults({ ...defaults, discountValue: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max uses (0 = unlimited)</label>
                <Input
                  type="number"
                  min="0"
                  value={defaults.maxUses}
                  onChange={(e) => setDefaults({ ...defaults, maxUses: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button onClick={handleSaveDefaults} loading={savingDefaults}>Save defaults</Button>
              <Button variant="outline" onClick={handleApplyDefaults} loading={applying}>Apply to existing events</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Code</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Linked Partner / Event</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Discount</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Usage</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Expires</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => {
                    const linkedPartner = coupon.affiliateId
                      ? affiliateOptions.find((a) => a._id === coupon.affiliateId)
                      : null;
                    const couponType = coupon.type || (coupon.affiliateId ? 'affiliate' : 'standard');
                    const discountLabel = coupon.discountAmount && coupon.discountAmount > 0
                      ? `${coupon.discountAmount}₪`
                      : `${coupon.discountPercent}%`;
                    return (
                    <tr key={coupon._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <code className="text-sm font-semibold bg-slate-100 px-2 py-1 rounded">{coupon.code}</code>
                        {coupon.packageName && (
                          <span className="block mt-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full w-fit" dir="rtl">
                            חבילת {coupon.packageName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {couponType === 'prepaid' ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Prepaid</span>
                        ) : couponType === 'affiliate' ? (
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Partner</span>
                        ) : couponType === 'personal' ? (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">Personal</span>
                        ) : couponType === 'event' ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Event gift</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {linkedPartner ? (
                          <div>
                            <div className="font-medium text-slate-900">{linkedPartner.name || linkedPartner.email}</div>
                            <div className="text-xs text-slate-400">{linkedPartner.referralCode}</div>
                          </div>
                        ) : coupon.ownerCoupleName || coupon.ownerEventCode ? (
                          <div>
                            {coupon.ownerCoupleName && (
                              <div className="font-medium text-slate-900">{coupon.ownerCoupleName}</div>
                            )}
                            {coupon.ownerEventCode && (
                              <div className="text-xs text-slate-400 font-mono">{coupon.ownerEventCode}</div>
                            )}
                          </div>
                        ) : coupon.affiliateId ? (
                          <span className="text-xs text-slate-400 font-mono">{coupon.affiliateId}</span>
                        ) : (
                          <span className="text-xs text-slate-300">{'—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {discountLabel}
                        {couponType === 'event' && coupon.customized && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">custom</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {coupon.usedCount} / {coupon.maxUses || '∞'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        {coupon.isActive ? (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {couponType === 'event' && (
                            <button
                              onClick={() => openEdit(coupon)}
                              className="text-slate-500 hover:text-slate-800 p-1"
                              title="Edit this event's coupon"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div dir="ltr" className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadCoupons(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadCoupons(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div dir="ltr" className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
              <Input
                label="Coupon Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER50"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₪)</option>
                </select>
              </div>

              <Input
                label={formData.discountType === 'fixed' ? 'Discount Amount (₪)' : 'Discount Percent (%)'}
                type="number"
                min="1"
                max={formData.discountType === 'percent' ? '100' : undefined}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                required
              />

              <Input
                label="Max Uses (leave empty for unlimited)"
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Unlimited"
              />

              <Input
                label="Expires At (leave empty for no expiry)"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link to Partner (optional)</label>
                <select
                  value={formData.affiliateId}
                  onChange={(e) => setFormData({ ...formData, affiliateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  <option value="">No partner (regular coupon)</option>
                  {affiliateOptions.filter((a) => a.status === 'approved').map((a) => (
                    <option key={a._id} value={a._id}>{a.name || a.email} ({a.referralCode})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">If linked, every use of this coupon credits the partner with 2% commission.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link to Event (optional)</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  <option value="">No event</option>
                  {eventOptions.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {(ev.name || ev.customSlug || ev.eventCode)} ({ev.eventCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Associate this coupon with a specific event.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Restrict to Package (optional)</label>
                <select
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  {/* Values must match event.packageName exactly (Register.tsx PACKAGE_DATA hebrewName). */}
                  <option value="">All packages</option>
                  <option value="האוספת">האוספת (The Morning After)</option>
                  <option value="המושלמת">המושלמת (Unlimited)</option>
                  <option value="החכמה">החכמה (Here I Am)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">If set, the coupon only works when buying this package.</p>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={creating} className="flex-1">
                  Create Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div dir="ltr" className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit event coupon</h2>
                <code className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded">{editCoupon.code}</code>
              </div>
              <button onClick={() => setEditCoupon(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                <select
                  value={editDraft.discountType}
                  onChange={(e) => setEditDraft({ ...editDraft, discountType: e.target.value as DiscountType })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm bg-white"
                >
                  <option value="fixed">Fixed amount (₪)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>

              <Input
                label={editDraft.discountType === 'fixed' ? 'Discount Amount (₪)' : 'Discount Percent (%)'}
                type="number"
                min="0"
                max={editDraft.discountType === 'percent' ? '100' : undefined}
                value={editDraft.discountValue}
                onChange={(e) => setEditDraft({ ...editDraft, discountValue: parseInt(e.target.value) || 0 })}
              />

              <Input
                label="Max Uses (leave empty for unlimited)"
                type="number"
                min="0"
                value={editDraft.maxUses}
                onChange={(e) => setEditDraft({ ...editDraft, maxUses: e.target.value })}
                placeholder="Unlimited"
              />

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editDraft.isActive}
                  onChange={(e) => setEditDraft({ ...editDraft, isActive: e.target.checked })}
                />
                Active
              </label>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditCoupon(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} loading={savingEdit} className="flex-1">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
