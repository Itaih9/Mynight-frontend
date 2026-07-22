import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi, type AdminEvent } from '@/services/api/admin.api';
import { Loader } from '@/components/common/Loader';
import { AdminLayout } from './AdminLayout';
import {
  Users,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
  Clock,
  RefreshCw,
  Upload,
  Image,
  Trash2,
  Loader2,
  Download,
  FileText,
  Link2,
  Camera,
  Eye,
  MessageCircle,
  Film,
  Copy,
} from 'lucide-react';

export const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [photoModalEvent, setPhotoModalEvent] = useState<AdminEvent | null>(null);
  const [eventPhotos, setEventPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverModalEvent, setCoverModalEvent] = useState<AdminEvent | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [slugModalEvent, setSlugModalEvent] = useState<AdminEvent | null>(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugResetCount, setSlugResetCount] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  const [photogModalEvent, setPhotogModalEvent] = useState<AdminEvent | null>(null);
  const [photogName, setPhotogName] = useState('');
  const [photogIg, setPhotogIg] = useState('');
  const [photogSaving, setPhotogSaving] = useState(false);
  const [photogError, setPhotogError] = useState('');

  const [dispModalEvent, setDispModalEvent] = useState<AdminEvent | null>(null);
  const [dispEnabled, setDispEnabled] = useState(false);
  const [dispLimit, setDispLimit] = useState(16);
  const [dispSaving, setDispSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [photoSelectMode, setPhotoSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
    danger?: boolean;
  } | null>(null);
  const [confirmRunning, setConfirmRunning] = useState(false);

  const [guestListModal, setGuestListModal] = useState<{
    event: AdminEvent;
    guests: { name: string; phone: string }[];
    loading: boolean;
  } | null>(null);

  useEffect(() => {
    loadEvents(1);
  }, []);

  const loadEvents = async (page: number) => {
    try {
      setLoading(true);
      const data = await adminApi.getEvents(page, 20);
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = (event: AdminEvent) => {
    setConfirmState({
      title: 'Delete event',
      message: `Permanently delete "${event.name}" (${event.eventCode})? This removes the event, all its photos, files, and face data. This cannot be undone.`,
      confirmLabel: 'Delete event',
      danger: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteEvent(event._id);
          setSuccessToast('Event deleted');
          setTimeout(() => setSuccessToast(null), 3000);
          loadEvents(pagination.page);
        } catch (err) {
          setErrorToast('Failed to delete event');
          setTimeout(() => setErrorToast(null), 3000);
        }
      },
    });
  };

  const handleExtend = async (eventId: string) => {
    try {
      await adminApi.extendEventUpload(eventId, 30);
      loadEvents(pagination.page);
    } catch (err) {
      setErrorToast('Failed to extend event upload period');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const openSlugModal = (event: AdminEvent) => {
    setSlugModalEvent(event);
    setSlugInput(event.customSlug || '');
    setSlugResetCount(false);
    setSlugError('');
  };

  const closeSlugModal = () => {
    setSlugModalEvent(null);
    setSlugInput('');
    setSlugResetCount(false);
    setSlugError('');
    setSlugSaving(false);
    setCopiedLink(null);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const handleSaveSlug = async () => {
    if (!slugModalEvent) return;
    const cleaned = slugInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (cleaned.length < 3) {
      setSlugError('Slug must be at least 3 characters');
      return;
    }
    if (cleaned === slugModalEvent.customSlug && !slugResetCount) {
      setSlugError('No changes to save');
      return;
    }

    setSlugSaving(true);
    setSlugError('');
    try {
      await adminApi.updateEventSlug(slugModalEvent._id, cleaned, slugResetCount);
      await loadEvents(pagination.page);
      closeSlugModal();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to update slug';
      setSlugError(msg);
    } finally {
      setSlugSaving(false);
    }
  };

  const openPhotogModal = (event: AdminEvent) => {
    setPhotogModalEvent(event);
    setPhotogName(event.photographerName || '');
    setPhotogIg(event.photographerInstagram || '');
    setPhotogError('');
  };

  const handleSavePhotographer = async () => {
    if (!photogModalEvent) return;
    setPhotogSaving(true);
    setPhotogError('');
    try {
      await adminApi.updateEventPhotographer(photogModalEvent._id, {
        photographerName: photogName,
        photographerInstagram: photogIg,
      });
      await loadEvents(pagination.page);
      setPhotogModalEvent(null);
    } catch (err: any) {
      setPhotogError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to save');
    } finally {
      setPhotogSaving(false);
    }
  };

  const openDispModal = (event: AdminEvent) => {
    setDispModalEvent(event);
    setDispEnabled(!!event.disposableEnabled);
    setDispLimit(event.disposableShotLimit || 16);
  };

  const handleSaveDisposable = async () => {
    if (!dispModalEvent) return;
    setDispSaving(true);
    try {
      await adminApi.updateEventDisposable(dispModalEvent._id, { enabled: dispEnabled, shotLimit: dispLimit });
      await loadEvents(pagination.page);
      setDispModalEvent(null);
    } catch {
      // keep the modal open; admin can retry
    } finally {
      setDispSaving(false);
    }
  };

  const handleDownloadGuestList = async (eventId: string) => {
    try {
      const { url } = await adminApi.downloadGuestList(eventId);
      window.open(url, '_blank');
    } catch (err) {
      setErrorToast('Failed to download guest list');
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  const openGuestListModal = async (event: AdminEvent) => {
    setGuestListModal({ event, guests: [], loading: true });
    try {
      const data = await adminApi.getGuestListData(event._id);
      setGuestListModal({ event, guests: data.guests, loading: false });
    } catch (err: any) {
      setErrorToast(err?.response?.data?.error || 'Failed to load guest list');
      setTimeout(() => setErrorToast(null), 3000);
      setGuestListModal(null);
    }
  };

  const buildWhatsAppLink = (phone: string) => {
    let d = (phone || '').replace(/\D/g, '');
    if (!d) return '';
    if (!d.startsWith('972')) {
      d = d.startsWith('0') ? '972' + d.slice(1) : '972' + d;
    }
    return `https://wa.me/${d}`;
  };

  const isUploadExpired = (event: AdminEvent) => {
    if (!event.uploadExpiresAt) return false;
    return new Date() > new Date(event.uploadExpiresAt);
  };

  const openPhotoModal = async (event: AdminEvent) => {
    setPhotoModalEvent(event);
    setPhotosLoading(true);
    setEventPhotos([]);
    setSelectedFiles([]);
    try {
      const data = await adminApi.getEventPhotos(event._id);
      setEventPhotos(data.photos);
    } catch (err) {
      setErrorToast('Failed to load photos');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setPhotosLoading(false);
    }
  };

  const closePhotoModal = () => {
    setPhotoModalEvent(null);
    setEventPhotos([]);
    setSelectedFiles([]);
    setUploadProgress(null);
    setPhotoSelectMode(false);
    setSelectedPhotoIds(new Set());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
      );
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadPhotos = async () => {
    if (!photoModalEvent || selectedFiles.length === 0) return;

    setUploadProgress(0);
    try {
      const result = await adminApi.uploadPhotosToEvent(
        photoModalEvent._id,
        selectedFiles,
        (progress) => setUploadProgress(progress)
      );
      setSuccessToast(`${result.uploaded} photos uploaded successfully`);
      setTimeout(() => setSuccessToast(null), 3000);
      setSelectedFiles([]);
      setUploadProgress(null);

      const data = await adminApi.getEventPhotos(photoModalEvent._id);
      setEventPhotos(data.photos);
      loadEvents(pagination.page);
    } catch (err) {
      setErrorToast('Failed to upload photos');
      setTimeout(() => setErrorToast(null), 3000);
      setUploadProgress(null);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!photoModalEvent) return;
    setConfirmState({
      title: 'Delete photo',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteEventPhoto(photoModalEvent._id, photoId);
          setEventPhotos((prev) => prev.filter((p) => p._id !== photoId));
          setSelectedPhotoIds((prev) => {
            const next = new Set(prev);
            next.delete(photoId);
            return next;
          });
          loadEvents(pagination.page);
        } catch (err) {
          setErrorToast('Failed to delete photo');
          setTimeout(() => setErrorToast(null), 3000);
        }
      },
    });
  };

  const togglePhotoSelected = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(new Set(eventPhotos.map((p) => p._id)));
  };

  const clearSelection = () => setSelectedPhotoIds(new Set());

  const exitSelectMode = () => {
    setPhotoSelectMode(false);
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (!photoModalEvent || selectedPhotoIds.size === 0) return;
    const count = selectedPhotoIds.size;
    setConfirmState({
      title: `Delete ${count} photo${count === 1 ? '' : 's'}`,
      message: `Are you sure you want to delete ${count} selected photo${count === 1 ? '' : 's'}? This action cannot be undone.`,
      confirmLabel: `Delete ${count}`,
      danger: true,
      onConfirm: async () => {
        setBulkDeleting(true);
        try {
          const ids = Array.from(selectedPhotoIds);
          await adminApi.deleteEventPhotosBulk(photoModalEvent._id, ids);
          setEventPhotos((prev) => prev.filter((p) => !selectedPhotoIds.has(p._id)));
          clearSelection();
          setPhotoSelectMode(false);
          loadEvents(pagination.page);
        } catch (err) {
          setErrorToast('Failed to delete selected photos');
          setTimeout(() => setErrorToast(null), 3000);
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  const openCoverModal = (event: AdminEvent) => {
    setCoverModalEvent(event);
  };

  const closeCoverModal = () => {
    setCoverModalEvent(null);
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!coverModalEvent || !e.target.files || e.target.files.length === 0) return;
    const file = Array.from(e.target.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;

    setCoverUploading(true);
    try {
      const coverImage = await adminApi.uploadCoverImage(coverModalEvent._id, file);
      setCoverModalEvent({ ...coverModalEvent, coverImage });
      loadEvents(pagination.page);
      setSuccessToast('Cover image uploaded');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      setErrorToast('Failed to upload cover image');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setCoverUploading(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  const handleDeleteCoverImage = () => {
    if (!coverModalEvent) return;
    setConfirmState({
      title: 'Delete cover image',
      message: 'Are you sure you want to delete the cover image?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setCoverDeleting(true);
        try {
          await adminApi.deleteCoverImage(coverModalEvent._id);
          setCoverModalEvent({ ...coverModalEvent, coverImage: undefined });
          loadEvents(pagination.page);
        } catch (err) {
          setErrorToast('Failed to delete cover image');
          setTimeout(() => setErrorToast(null), 3000);
        } finally {
          setCoverDeleting(false);
        }
      },
    });
  };

  return (
    <AdminLayout>
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {photoModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closePhotoModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{photoModalEvent.name}</h2>
                <p className="text-sm text-slate-500">Event Code: {photoModalEvent.eventCode}</p>
              </div>
              <button onClick={closePhotoModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  <Upload className="w-4 h-4" />
                  Select Files
                </button>
                {selectedFiles.length > 0 && (
                  <>
                    <span className="text-sm text-slate-600">{selectedFiles.length} files selected</span>
                    <button
                      onClick={handleUploadPhotos}
                      disabled={uploadProgress !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {uploadProgress !== null ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => removeSelectedFile(idx)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-600">
                  Uploaded Photos ({eventPhotos.length})
                  {photoSelectMode && selectedPhotoIds.size > 0 && (
                    <span className="ml-2 text-blue-600">— {selectedPhotoIds.size} selected</span>
                  )}
                </h3>

                {eventPhotos.length > 0 && (
                  <div className="flex items-center gap-2">
                    {!photoSelectMode ? (
                      <button
                        onClick={() => setPhotoSelectMode(true)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Select
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={selectedPhotoIds.size === eventPhotos.length ? clearSelection : selectAllPhotos}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          {selectedPhotoIds.size === eventPhotos.length ? 'Deselect all' : 'Select all'}
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          disabled={selectedPhotoIds.size === 0 || bulkDeleting}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete{selectedPhotoIds.size > 0 ? ` (${selectedPhotoIds.size})` : ''}
                        </button>
                        <button
                          onClick={exitSelectMode}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {photosLoading ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : eventPhotos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {eventPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo._id);
                    const isVideo = photo.metadata?.mimeType?.startsWith('video/');
                    const tileSrc = isVideo
                      ? photo.posterUrl
                      : (photo.thumbnailUrl || photo.url);
                    return (
                      <div
                        key={photo._id}
                        onClick={() => photoSelectMode && togglePhotoSelected(photo._id)}
                        className={`relative group aspect-square rounded-lg overflow-hidden bg-slate-100 ${photoSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      >
                        {tileSrc ? (
                          <img
                            src={tileSrc}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-70' : ''}`}
                          />
                        ) : isVideo ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500">
                            <Film className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-medium">Video</span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}

                        {isVideo && tileSrc && (
                          <div className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-full backdrop-blur-sm pointer-events-none">
                            <Film className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {photoSelectMode && (
                          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/70 border-white'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        )}

                        {!photoSelectMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo._id); }}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {coverModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeCoverModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Cover Photo</h2>
                <p className="text-sm text-slate-500">{coverModalEvent.name} — {coverModalEvent.eventCode}</p>
              </div>
              <button onClick={closeCoverModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {coverModalEvent.coverImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                    <img src={coverModalEvent.coverImage.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-3">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={coverUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                      {coverUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Replace</>
                      )}
                    </button>
                    <button
                      onClick={handleDeleteCoverImage}
                      disabled={coverDeleting}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {coverDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400 mb-4">No cover photo set</p>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={coverUploading}
                    className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                  >
                    {coverUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload Cover Photo</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {dispModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="ltr">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDispModalEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Disposable camera</h3>
            <p className="text-sm text-slate-500 mb-4">{dispModalEvent.name}</p>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={dispEnabled} onChange={(e) => setDispEnabled(e.target.checked)} className="w-5 h-5" />
              <span className="text-sm font-medium text-slate-700">Enable disposable camera for this event</span>
            </label>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shots per guest</label>
            <input
              type="number"
              min={1}
              max={200}
              value={dispLimit}
              onChange={(e) => setDispLimit(parseInt(e.target.value) || 16)}
              className="w-full px-3 py-2 mb-3 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm"
            />
            <p className="text-xs text-slate-400 mb-4">Guests shoot at: <span className="font-mono">/camera/{dispModalEvent.eventCode}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setDispModalEvent(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveDisposable} disabled={dispSaving} className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{dispSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {photogModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="ltr">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPhotogModalEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Photographer credit</h3>
            <p className="text-sm text-slate-500 mb-4">{photogModalEvent.name}</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photographer name</label>
            <input
              value={photogName}
              onChange={(e) => setPhotogName(e.target.value)}
              placeholder="e.g. Studio Noa"
              className="w-full px-3 py-2 mb-4 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm"
            />
            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram handle</label>
            <div className="flex items-center rounded-lg border border-slate-200 focus-within:border-slate-400 px-3">
              <span className="text-slate-400 text-sm">@</span>
              <input
                value={photogIg}
                onChange={(e) => setPhotogIg(e.target.value)}
                placeholder="studio.noa"
                className="w-full py-2 pl-1 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Handle, @handle, or full instagram.com URL — all work.</p>
            {photogError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{photogError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setPhotogModalEvent(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePhotographer} disabled={photogSaving} className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{photogSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {slugModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeSlugModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-amber-600" />
                  Edit Personal Link
                </h2>
                <p className="text-sm text-slate-500 mt-1">{slugModalEvent.name} — {slugModalEvent.eventCode}</p>
              </div>
              <button onClick={closeSlugModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* ── Quick-copy links ── */}
              {(() => {
                const base = 'https://mynight.co.il';
                const id = slugModalEvent.customSlug || slugModalEvent.eventCode;
                const links = [
                  { label: 'Gallery', url: `${base}/gallery/${id}` },
                  { label: 'Guest Upload', url: `${base}/guest/${id}/upload` },
                  { label: 'Guest Selfie', url: `${base}/guest/${id}/selfie` },
                  // Disposable camera uses the event code (not the slug).
                  { label: 'Disposable Camera', url: `${base}/camera/${slugModalEvent.eventCode}` },
                  // Couple login screen: the couple enters their phone or email
                  // and drops into their gallery (gallery-only owner view).
                  { label: 'Couple Link', url: `${base}/gallery-login` },
                ];
                return (
                  <div className="space-y-2">
                    {links.map(({ label, url }) => (
                      <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-xs font-medium text-slate-500 w-20 shrink-0">{label}</span>
                        <span className="text-xs text-slate-700 font-mono truncate flex-1" dir="ltr">{url}</span>
                        <button
                          onClick={() => copyLink(url)}
                          className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-800"
                          title={`Copy ${label} link`}
                        >
                          {copiedLink === url ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="bg-slate-50 rounded-lg p-3 text-sm flex items-center justify-between">
                <span className="text-slate-500">User change count</span>
                <span className={`font-bold ${(slugModalEvent.slugChangeCount ?? 0) >= 3 ? 'text-red-600' : 'text-slate-700'}`}>
                  {slugModalEvent.slugChangeCount ?? 0} / 3
                  {(slugModalEvent.slugChangeCount ?? 0) >= 3 && <span className="ml-1 text-xs">(locked)</span>}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New slug</label>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => { setSlugInput(e.target.value); setSlugError(''); }}
                  placeholder="dnaeee-ieid-14-04-2028"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-left font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-2" dir="ltr">
                  mynight.co.il/gallery/{slugInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '...'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Lowercase letters, numbers, and hyphens only. Minimum 3 characters.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={slugResetCount}
                  onChange={(e) => setSlugResetCount(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">
                  Reset change counter to 0
                  <span className="block text-xs text-slate-400 mt-0.5">
                    Allows the user to edit the slug 3 more times on their side.
                  </span>
                </span>
              </label>

              {slugError && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                  {slugError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
              <button
                onClick={closeSlugModal}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={slugSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSlug}
                disabled={slugSaving || !slugInput.trim()}
                className="px-5 py-2.5 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {slugSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Events</h1>
          <span className="text-sm text-slate-600">{pagination.total} total events</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Event Name</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Code</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Owner</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Cover</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Photos</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Paid</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Guest List</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Upload Status</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => {
                    const expired = isUploadExpired(event);
                    return (
                    <tr key={event._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium">{event.name}</div>
                        {event.packageName && (
                          <div className="mt-1 inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full" dir="rtl">
                            {event.packageName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{event.eventCode}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium">{event.userId?.phoneNumber || '-'}</div>
                        <div className="text-xs text-slate-400">{event.userId?.email || '-'}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {event.referredByAffiliate ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full"
                              title={`Referred by ${event.referredByAffiliate.name} (${event.referredByAffiliate.email}) - code ${event.referredByAffiliate.referralCode}`}
                            >
                              Ref: {event.referredByAffiliate.name}
                            </span>
                          ) : null}
                          {event.couponCode ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              Coupon: {event.couponCode}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {event.coverImage ? (
                          <img src={event.coverImage.url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{event.photoCount}</td>
                      <td className="px-6 py-4">
                        {event.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            <X className="w-3 h-3" />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {event.guestListFile ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => openGuestListModal(event)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              <Eye className="w-3 h-3" />
                              View list
                            </button>
                            <button
                              onClick={() => handleDownloadGuestList(event._id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Download className="w-3 h-3" />
                              {event.guestListFile.originalName}
                            </button>
                            {(event.guestListUploadCount ?? 0) > 1 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                                <RefreshCw className="w-2.5 h-2.5" />
                                Re-uploaded {event.guestListUploadCount}x
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!event.uploadStartedAt ? (
                          <span className="text-xs text-slate-400">Not started</span>
                        ) : expired ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                            <X className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <div className="text-xs">
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <Clock className="w-3 h-3" />
                              Active
                            </span>
                            <p className="text-slate-400 mt-0.5">
                              Until {new Date(event.uploadExpiresAt!).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/admin/upload/${event._id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            <Upload className="w-3 h-3" />
                            Upload
                          </Link>
                          <button
                            onClick={() => openPhotoModal(event)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            <Image className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => openCoverModal(event)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                          >
                            <Image className="w-3 h-3" />
                            Cover
                          </button>
                          {event.isPaid && event.uploadStartedAt && (
                            <button
                              onClick={() => handleExtend(event._id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Extend
                            </button>
                          )}
                          <button
                            onClick={() => openSlugModal(event)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                            title={`Change count: ${event.slugChangeCount ?? 0}`}
                          >
                            <Link2 className="w-3 h-3" />
                            Slug
                          </button>
                          <button
                            onClick={() => openPhotogModal(event)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-pink-600 hover:text-pink-700"
                            title={event.photographerName ? `Photographer: ${event.photographerName}` : 'Set photographer'}
                          >
                            <Camera className="w-3 h-3" />
                            Photographer
                          </button>
                          <button
                            onClick={() => openDispModal(event)}
                            className={`inline-flex items-center gap-1 text-xs font-medium ${event.disposableEnabled ? 'text-green-600 hover:text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Disposable camera"
                          >
                            <Camera className="w-3 h-3" />
                            Disposable{event.disposableEnabled ? ' ✓' : ''}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => loadEvents(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-600 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadEvents(pagination.page + 1)}
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

      {guestListModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setGuestListModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Guest List</h3>
                <p className="text-sm text-slate-500">
                  {guestListModal.event.name}
                  {!guestListModal.loading && ` — ${guestListModal.guests.length} guests`}
                </p>
              </div>
              <button
                onClick={() => setGuestListModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {guestListModal.loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : guestListModal.guests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <FileText className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No readable rows found</p>
                  <p className="text-sm text-slate-400 mt-1">The file may be empty or in an unexpected format. Try downloading it instead.</p>
                </div>
              ) : (
                <table className="w-full text-sm" dir="rtl">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-right font-semibold w-10">#</th>
                      <th className="px-4 py-3 text-right font-semibold">שם</th>
                      <th className="px-4 py-3 text-right font-semibold">טלפון</th>
                      <th className="px-4 py-3 text-center font-semibold w-28">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {guestListModal.guests.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{g.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-600" dir="ltr">{g.phone || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {g.phone ? (
                            <a
                              href={buildWhatsAppLink(g.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => handleDownloadGuestList(guestListModal.event._id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download file
              </button>
              <button
                onClick={() => setGuestListModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
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
    </AdminLayout>
  );
};
