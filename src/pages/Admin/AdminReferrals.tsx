import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminReferral } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  ChevronLeft,
  ChevronRight,
  Link2,
  Check,
  Clock,
  X,
} from 'lucide-react';

export const AdminReferrals = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    loadReferrals(1);
  }, []);

  const loadReferrals = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getReferrals(page, 20);
      setReferrals(data.referrals);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted':
        return <Check className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'expired':
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'expired':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AdminLayout>
      <>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Referrals</h1>
          <span className="text-sm text-slate-600">{pagination.total} total referrals</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Affiliate</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Referred User</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Commission</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((referral) => (
                    <tr key={referral._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {referral.affiliateId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500">{referral.affiliateId?.email}</p>
                          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {referral.affiliateId?.referralCode}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {referral.referredUserId?.name || referral.referredUserId?.phone || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500">{referral.referredUserId?.email || referral.referredUserId?.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(referral.status)}`}>
                          {getStatusIcon(referral.status)}
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {referral.commissionAmount ? (
                          <span className="font-medium text-emerald-600">
                            {referral.commissionAmount.toFixed(2)} ILS
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div>
                          <p>{new Date(referral.createdAt).toLocaleDateString()}</p>
                          {referral.convertedAt && (
                            <p className="text-xs text-emerald-600">
                              Converted: {new Date(referral.convertedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {referrals.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No referrals yet</p>
                </div>
              )}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadReferrals(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadReferrals(pagination.page + 1)}
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
    </AdminLayout>
  );
};
