import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminReview } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Clock,
  EyeOff,
  X
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';

export const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    loadReviews(1);
  }, [statusFilter]);

  const loadReviews = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getReviews(page, 20, statusFilter || undefined);
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, status: 'pending' | 'approved' | 'hidden') => {
    try {
      await adminApi.updateReviewStatus(reviewId, status);
      setReviews(reviews.map(r =>
        r._id === reviewId ? { ...r, status } : r
      ));
    } catch (err) {
      setErrorToast('Failed to update review status');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'hidden':
        return <EyeOff className="w-3 h-3" />;
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
      case 'hidden':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Reviews</h1>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="hidden">Hidden</option>
            </select>
            <span className="text-sm text-slate-600">{pagination.total} reviews</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      {renderStars(review.rating)}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(review.status)}`}>
                        {getStatusIcon(review.status)}
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={review.status}
                        onChange={(e) => handleStatusChange(review._id, e.target.value as 'pending' | 'approved' | 'hidden')}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-slate-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mb-3">{review.text}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{review.name || review.coupleName || 'Anonymous'}</span>
                      {review.coupleName && review.name && review.coupleName !== review.name && (
                        <span className="text-slate-400">({review.coupleName})</span>
                      )}
                      {review.eventCode && (
                        <code className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded">{review.eventCode}</code>
                      )}
                      {review.eventName && (
                        <span className="text-slate-400">· {review.eventName}</span>
                      )}
                    </div>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reviews found</p>
                </div>
              )}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadReviews(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadReviews(pagination.page + 1)}
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
