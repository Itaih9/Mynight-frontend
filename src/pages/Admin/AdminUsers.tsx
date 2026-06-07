import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type User } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  X,
  Loader2,
  Check,
  Trash2,
} from 'lucide-react';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
    danger?: boolean;
  } | null>(null);
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const handleDeleteUser = (user: User) => {
    setConfirmState({
      title: 'Delete user',
      message: `Permanently delete ${user.name || user.phoneNumber}? This also deletes all of their events, photos, files, and face data. This cannot be undone.`,
      confirmLabel: 'Delete user',
      danger: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteUser(user._id);
          setToast({ kind: 'success', text: 'User deleted' });
          setTimeout(() => setToast(null), 3000);
          loadUsers(pagination.page);
        } catch (err) {
          setToast({ kind: 'error', text: 'Failed to delete user' });
          setTimeout(() => setToast(null), 3000);
        }
      },
    });
  };

  const handleResetPassword = async () => {
    if (!resetUser || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await adminApi.resetUserPassword(resetUser._id, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setResetUser(null);
        setNewPassword('');
        setResetSuccess(false);
      }, 1500);
    } catch (err: any) {
      setResetError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  const loadUsers = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(page, 20);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <span className="text-sm text-slate-600">{pagination.total} total users</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Phone</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Name</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Email</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Referral Code</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Joined</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{user.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        {user.referralCode && (
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">{user.referralCode}</code>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setResetUser(user); setNewPassword(''); setResetError(''); setResetSuccess(false); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Reset Password">
                            <KeyRound size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadUsers(pagination.page + 1)}
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
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.kind === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.text}
          </div>
        )}

        {confirmState && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => !confirmRunning && setConfirmState(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${confirmState.danger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{confirmState.title}</h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed">{confirmState.message}</p>
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
                  onClick={async () => {
                    if (confirmRunning) return;
                    setConfirmRunning(true);
                    try {
                      await confirmState.onConfirm();
                    } finally {
                      setConfirmRunning(false);
                      setConfirmState(null);
                    }
                  }}
                  disabled={confirmRunning}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${confirmState.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {confirmRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {resetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setResetUser(null)} />
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Reset Password</h3>
                <button onClick={() => setResetUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                {resetUser.phoneNumber} {resetUser.name ? `(${resetUser.name})` : ''}
              </p>
              {resetSuccess ? (
                <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
                  <Check size={20} />
                  <span className="font-medium">Password reset successfully</span>
                </div>
              ) : (
                <>
                  <input type="text" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setResetError(''); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-900 outline-none" />
                  {resetError && <p className="text-red-500 text-xs mt-2">{resetError}</p>}
                  <button onClick={handleResetPassword} disabled={resetLoading} className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    <span>Reset Password</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
    </AdminLayout>
  );
};
