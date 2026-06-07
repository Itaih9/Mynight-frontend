import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminCoupon, type AdminAffiliate } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';

export const AdminCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 100,
    maxUses: '',
    expiresAt: '',
    affiliateId: '',
  });
  const [formError, setFormError] = useState('');
  const [affiliateOptions, setAffiliateOptions] = useState<AdminAffiliate[]>([]);

  useEffect(() => {
    loadCoupons(1);
    adminApi.getAffiliates(1, 200).then((res) => setAffiliateOptions(res.affiliates || [])).catch(() => {});
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
        discountPercent: formData.discountPercent,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
        affiliateId: formData.affiliateId || undefined,
      });
      setShowModal(false);
      setFormData({ code: '', discountPercent: 100, maxUses: '', expiresAt: '', affiliateId: '' });
      loadCoupons(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create coupon');
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
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Linked Partner</th>
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
                      ? `${coupon.discountAmount}\u20aa`
                      : `${coupon.discountPercent}%`;
                    return (
                    <tr key={coupon._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <code className="text-sm font-semibold bg-slate-100 px-2 py-1 rounded">{coupon.code}</code>
                      </td>
                      <td className="px-6 py-4">
                        {couponType === 'prepaid' ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Prepaid</span>
                        ) : couponType === 'affiliate' ? (
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Partner</span>
                        ) : couponType === 'personal' ? (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">Personal</span>
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
                          <span className="text-xs text-slate-300">\u2014</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{discountLabel}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {coupon.usedCount} / {coupon.maxUses || '\u221e'}
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
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
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
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
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

              <Input
                label="Discount Percent"
                type="number"
                min="1"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
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
    </AdminLayout>
  );
};
