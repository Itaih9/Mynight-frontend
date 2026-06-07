import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminContact } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Eye,
  Trash2,
  X
} from 'lucide-react';

export const AdminContacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedContact, setSelectedContact] = useState<AdminContact | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    loadContacts(1);
  }, []);

  const loadContacts = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getContacts(page, 20);
      setContacts(data.contacts);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (contactId: string, status: string) => {
    try {
      await adminApi.updateContactStatus(contactId, status);
      loadContacts(pagination.page);
      if (selectedContact?._id === contactId) {
        setSelectedContact({ ...selectedContact, status: status as any });
      }
    } catch (err) {
      setErrorToast('Failed to update contact status');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await adminApi.deleteContact(contactId);
      loadContacts(pagination.page);
      if (selectedContact?._id === contactId) {
        setSelectedContact(null);
      }
    } catch (err) {
      setErrorToast('Failed to delete contact');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'read':
        return 'bg-slate-100 text-slate-700';
      case 'replied':
        return 'bg-emerald-100 text-emerald-700';
      case 'archived':
        return 'bg-slate-100 text-slate-500';
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
          <h1 className="text-2xl font-semibold text-slate-900">Contact Messages</h1>
          <span className="text-sm text-slate-600">{pagination.total} messages</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => {
                      setSelectedContact(contact);
                      if (contact.status === 'new') {
                        handleUpdateStatus(contact._id, 'read');
                      }
                    }}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedContact?._id === contact._id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mb-1">{contact.subject}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
                  <button
                    onClick={() => loadContacts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-600">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => loadContacts(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              {selectedContact ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedContact.subject}</h2>
                      <p className="text-sm text-slate-600">
                        From: {selectedContact.name} ({selectedContact.email})
                      </p>
                      {selectedContact.phone && (
                        <p className="text-sm text-slate-500">Phone: {selectedContact.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(selectedContact._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Status:</span>
                    <select
                      value={selectedContact.status}
                      onChange={(e) => handleUpdateStatus(selectedContact._id, e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <a
                      href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      Reply via Email
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Eye className="w-8 h-8 mb-2" />
                  <p className="text-sm">Select a message to view</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    </AdminLayout>
  );
};
