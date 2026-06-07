import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi, type DashboardStats } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  Users,
  Calendar,
  Tag,
  ChevronRight,
  Link2,
  MessageSquare,
  DollarSign,
  Star
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-slate-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Link
          to="/admin/users"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.users.total || 0}</p>
          <p className="text-sm text-slate-600">Total Users</p>
        </Link>

        <Link
          to="/admin/events"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.events.total || 0}</p>
          <p className="text-sm text-slate-600">
            Total Events
            <span className="text-emerald-600 ml-2">({stats?.events.paid || 0} paid)</span>
          </p>
        </Link>

        <Link
          to="/admin/coupons"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.coupons.total || 0}</p>
          <p className="text-sm text-slate-600">
            Total Coupons
            <span className="text-purple-600 ml-2">({stats?.coupons.active || 0} active)</span>
          </p>
        </Link>

        <Link
          to="/admin/referrals"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-orange-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.referrals?.total || 0}</p>
          <p className="text-sm text-slate-600">
            Total Referrals
            <span className="text-orange-600 ml-2">({stats?.referrals?.converted || 0} converted)</span>
          </p>
        </Link>

        <Link
          to="/admin/contacts"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-cyan-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.contacts?.total || 0}</p>
          <p className="text-sm text-slate-600">
            Contact Messages
            <span className="text-cyan-600 ml-2">({stats?.contacts?.new || 0} new)</span>
          </p>
        </Link>

        <Link
          to="/admin/reviews"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.reviews?.total || 0}</p>
          <p className="text-sm text-slate-600">
            Reviews
            <span className="text-amber-600 ml-2">({stats?.reviews?.pending || 0} pending)</span>
          </p>
        </Link>
      </div>
    </AdminLayout>
  );
};
