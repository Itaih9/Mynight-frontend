import { useState, useEffect } from 'react';
import { adminApi, type AdminAccount } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, ShieldCheck, ShieldOff } from 'lucide-react';
import { AdminLayout } from './AdminLayout';

export const AdminAdmins = () => {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const load = async () => {
    try {
      setAdmins(await adminApi.listAdmins());
    } catch {
      // Layout already surfaces auth failures; an empty list is enough here.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    setCreating(true);
    try {
      await adminApi.createAdmin(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '' });
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Could not create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (admin: AdminAccount) => {
    try {
      await adminApi.setAdminActive(admin._id, !admin.isActive);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Could not update admin');
    }
  };

  const handleDelete = async (admin: AdminAccount) => {
    if (!window.confirm(`Delete admin ${admin.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteAdmin(admin._id);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Could not delete admin');
    }
  };

  return (
    <AdminLayout>
      <div dir="ltr" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admins</h1>
            <p className="text-sm text-slate-600 mt-1">
              Anyone listed here can sign in to this panel with full access.
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add admin
          </Button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {admins.map((admin) => (
                  <tr key={admin._id} className={admin.isActive ? '' : 'bg-slate-50/60'}>
                    <td className="px-4 py-3 font-medium text-slate-900">{admin.name}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          admin.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(admin)}
                          title={admin.isActive ? 'Disable sign-in' : 'Enable sign-in'}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          {admin.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          title="Delete"
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No admins yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" dir="ltr">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Add admin</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Temporary password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 characters"
                required
              />
              <p className="text-xs text-slate-500">
                Share this password with them directly. They can change it from the panel once signed in.
              </p>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={creating} className="flex-1">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
