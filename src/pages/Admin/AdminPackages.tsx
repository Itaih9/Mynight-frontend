import { useState, useEffect } from 'react';
import { packagesApi, type PackageItem } from '@/services/api/packages.api';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package as PackageIcon, Save } from 'lucide-react';
import { AdminLayout } from './AdminLayout';

interface PackageDraft {
  title: string;
  englishTitle: string;
  price: number;
  compareAtPrice: number;
  isActive: boolean;
}

export const AdminPackages = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PackageDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await packagesApi.getAllAdmin();
      const list = res.data || [];
      setPackages(list);
      const initialDrafts: Record<string, PackageDraft> = {};
      list.forEach((p) => {
        initialDrafts[p.key] = {
          title: p.title,
          englishTitle: p.englishTitle,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? 0,
          isActive: p.isActive,
        };
      });
      setDrafts(initialDrafts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (key: string, field: keyof PackageDraft, value: any) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSave = async (key: string) => {
    const draft = drafts[key];
    if (!draft) return;
    if (!draft.title.trim() || !draft.englishTitle.trim()) {
      setError('Title and English title are required');
      return;
    }
    if (draft.price < 0 || Number.isNaN(draft.price)) {
      setError('Price must be a positive number');
      return;
    }

    try {
      setSavingKey(key);
      setError('');
      const res = await packagesApi.update(key, draft);
      if (res.data) {
        setPackages((prev) => prev.map((p) => (p.key === key ? res.data! : p)));
        setToast(`Saved "${draft.title}"`);
        setTimeout(() => setToast(''), 2500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSavingKey(null);
    }
  };

  const hasChanges = (key: string) => {
    const original = packages.find((p) => p.key === key);
    const draft = drafts[key];
    if (!original || !draft) return false;
    return (
      original.title !== draft.title ||
      original.englishTitle !== draft.englishTitle ||
      original.price !== draft.price ||
      (original.compareAtPrice ?? 0) !== draft.compareAtPrice ||
      original.isActive !== draft.isActive
    );
  };

  return (
    <AdminLayout>
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Packages</h1>
              <p className="text-sm text-slate-500 mt-0.5">Edit the package names and prices shown on the landing page.</p>
            </div>
          </div>
        </div>

        {toast && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">{toast}</div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => {
              const draft = drafts[pkg.key];
              if (!draft) return null;
              const changed = hasChanges(pkg.key);
              return (
                <div key={pkg.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="mb-5">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Package Key</div>
                    <code className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded">{pkg.key}</code>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hebrew Title</label>
                      <Input
                        value={draft.title}
                        onChange={(e) => updateDraft(pkg.key, 'title', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">English Title</label>
                      <Input
                        value={draft.englishTitle}
                        onChange={(e) => updateDraft(pkg.key, 'englishTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Price (₪)</label>
                      <Input
                        type="number"
                        min="0"
                        value={draft.price}
                        onChange={(e) => updateDraft(pkg.key, 'price', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {pkg.key === 'unlimited' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Strikethrough Price (₪)</label>
                        <Input
                          type="number"
                          min="0"
                          value={draft.compareAtPrice}
                          onChange={(e) => updateDraft(pkg.key, 'compareAtPrice', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-slate-400 mt-1">Crossed-out price shown above the real price. 0 = auto (sum of the other packages).</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <Button
                      onClick={() => handleSave(pkg.key)}
                      loading={savingKey === pkg.key}
                      disabled={!changed}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    </AdminLayout>
  );
};
