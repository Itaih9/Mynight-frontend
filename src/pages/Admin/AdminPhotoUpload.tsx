import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { adminApi, type AdminEvent, type ZipJobStatus } from '@/services/api/admin.api';
import { AdminLayout } from './AdminLayout';
import {
  Upload,
  X,
  Check,
  Loader2,
  FolderOpen,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Image,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';

const readImageDimensions = (file: File): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth && img.naturalHeight) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
};

/**
 * The moment/category for a folder upload is the top-level subfolder *inside*
 * the selected directory. `webkitRelativePath` is "SelectedRoot/moment/file.jpg",
 * so we drop the selected root to leave "moment/file.jpg" — the same shape the
 * backend derives categories from for ZIP entries. Plain file selections have
 * no webkitRelativePath, so they stay uncategorized.
 */
const getUploadPath = (file: File): string | undefined => {
  const relativePath = (file as any).webkitRelativePath as string | undefined;
  if (!relativePath) return undefined;
  const withoutRoot = relativePath.split('/').slice(1).join('/');
  return withoutRoot || undefined;
};

type FileStatus = 'pending' | 'uploading' | 'uploaded' | 'completed' | 'failed';

interface UploadFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  s3Key?: string;
}

type ZipPhase = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed' | 'resumable';

interface ZipUploadState {
  phase: ZipPhase;
  uploadProgress: number;
  partsCompleted: number;
  totalParts: number;
  jobId?: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  error?: string;
}

interface SavedZipState {
  s3Key: string;
  uploadId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalParts: number;
  completedParts: { partNumber: number; etag: string }[];
  phase: 'uploading' | 'processing';
  jobId?: string;
  timestamp: number;
}

const CONCURRENT_UPLOADS = 30;
const BATCH_SIZE = 50;
const ZIP_CHUNK_CONCURRENCY = 5;
const ZIP_STORAGE_KEY_PREFIX = 'zip-upload-';
const ZIP_STATE_MAX_AGE = 24 * 60 * 60 * 1000;

const getZipStorageKey = (eventId: string) => `${ZIP_STORAGE_KEY_PREFIX}${eventId}`;

const saveZipToStorage = (eventId: string, state: SavedZipState) => {
  try {
    localStorage.setItem(getZipStorageKey(eventId), JSON.stringify(state));
  } catch {}
};

const loadZipFromStorage = (eventId: string): SavedZipState | null => {
  try {
    const raw = localStorage.getItem(getZipStorageKey(eventId));
    if (!raw) return null;
    const state: SavedZipState = JSON.parse(raw);
    if (Date.now() - state.timestamp > ZIP_STATE_MAX_AGE) {
      localStorage.removeItem(getZipStorageKey(eventId));
      return null;
    }
    return state;
  } catch {
    return null;
  }
};

const clearZipStorage = (eventId: string) => {
  try {
    localStorage.removeItem(getZipStorageKey(eventId));
  } catch {}
};

export const AdminPhotoUpload = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const zipPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const zipAbortRef = useRef(false);

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const [savedZipInfo, setSavedZipInfo] = useState<SavedZipState | null>(null);

  const [zipState, setZipState] = useState<ZipUploadState>({
    phase: 'idle',
    uploadProgress: 0,
    partsCompleted: 0,
    totalParts: 0,
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
  });

  const stats = {
    total: files.length,
    pending: files.filter((f) => f.status === 'pending').length,
    uploading: files.filter((f) => f.status === 'uploading').length,
    uploaded: files.filter((f) => f.status === 'uploaded').length,
    completed: files.filter((f) => f.status === 'completed').length,
    failed: files.filter((f) => f.status === 'failed').length,
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const saved = loadZipFromStorage(eventId);
    if (!saved) return;

    if (saved.phase === 'processing' && saved.jobId) {
      setZipState({
        phase: 'processing',
        uploadProgress: 100,
        partsCompleted: saved.totalParts,
        totalParts: saved.totalParts,
        jobId: saved.jobId,
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
      });
      startZipPolling(saved.jobId);
    } else if (saved.phase === 'uploading') {
      setSavedZipInfo(saved);
      setZipState({
        phase: 'resumable',
        uploadProgress: Math.round((saved.completedParts.length / saved.totalParts) * 100),
        partsCompleted: saved.completedParts.length,
        totalParts: saved.totalParts,
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
      });
    }
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (zipPollingRef.current) {
        clearInterval(zipPollingRef.current);
      }
    };
  }, []);

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await adminApi.getEventPhotos(eventId);
      setEvent(data.event);
    } catch (err) {
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  };

  const clearAll = () => {
    if (isUploading) return;
    setFiles([]);
  };

  const retryFailed = () => {
    setFiles((prev) =>
      prev.map((f) => (f.status === 'failed' ? { ...f, status: 'pending', error: undefined, progress: 0 } : f))
    );
  };

  const updateFileStatus = useCallback((id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const uploadZipChunks = async (
    file: File,
    s3Key: string,
    uploadId: string,
    chunkSize: number,
    totalParts: number,
    alreadyCompleted: { partNumber: number; etag: string }[]
  ) => {
    const completedParts = [...alreadyCompleted];
    const completedSet = new Set(completedParts.map((p) => p.partNumber));
    const remaining = Array.from({ length: totalParts }, (_, i) => i + 1).filter(
      (p) => !completedSet.has(p)
    );

    setZipState((prev) => ({
      ...prev,
      phase: 'uploading',
      partsCompleted: completedParts.length,
      totalParts,
      uploadProgress: Math.round((completedParts.length / totalParts) * 100),
    }));

    const PRESIGN_BATCH = 50;

    for (let i = 0; i < remaining.length; i += PRESIGN_BATCH) {
      if (zipAbortRef.current) throw new Error('Upload cancelled');

      const batch = remaining.slice(i, i + PRESIGN_BATCH);
      const presignedUrls = await adminApi.getZipPartPresignedUrls(s3Key, uploadId, batch);
      const urlMap = new Map(presignedUrls.map((p) => [p.partNumber, p.uploadUrl]));

      const activeUploads: Promise<void>[] = [];

      for (const partNumber of batch) {
        if (zipAbortRef.current) throw new Error('Upload cancelled');

        if (activeUploads.length >= ZIP_CHUNK_CONCURRENCY) {
          await Promise.race(activeUploads);
        }

        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const url = urlMap.get(partNumber)!;

        const promise = fetch(url, { method: 'PUT', body: chunk })
          .then((response) => {
            if (!response.ok) throw new Error(`Part ${partNumber} failed: ${response.status}`);
            const etag = response.headers.get('etag') || '';
            completedParts.push({ partNumber, etag });

            if (eventId) {
              saveZipToStorage(eventId, {
                s3Key,
                uploadId,
                fileName: file.name,
                fileSize: file.size,
                chunkSize,
                totalParts,
                completedParts,
                phase: 'uploading',
                timestamp: Date.now(),
              });
            }

            setZipState((prev) => ({
              ...prev,
              partsCompleted: completedParts.length,
              uploadProgress: Math.round((completedParts.length / totalParts) * 100),
            }));
          })
          .then(() => {
            activeUploads.splice(activeUploads.indexOf(promise), 1);
          });

        activeUploads.push(promise);
      }

      await Promise.all(activeUploads);
    }

    return completedParts;
  };

  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !eventId) return;
    const zipFile = e.target.files[0];
    e.target.value = '';

    if (savedZipInfo && savedZipInfo.fileName === zipFile.name && savedZipInfo.fileSize === zipFile.size) {
      await resumeZipUpload(zipFile, savedZipInfo);
      return;
    }

    zipAbortRef.current = false;

    try {
      const { uploadId, s3Key, totalParts, chunkSize } = await adminApi.initiateZipMultipart(
        eventId,
        zipFile.name,
        zipFile.size
      );

      saveZipToStorage(eventId, {
        s3Key,
        uploadId,
        fileName: zipFile.name,
        fileSize: zipFile.size,
        chunkSize,
        totalParts,
        completedParts: [],
        phase: 'uploading',
        timestamp: Date.now(),
      });

      const parts = await uploadZipChunks(zipFile, s3Key, uploadId, chunkSize, totalParts, []);

      await adminApi.completeZipMultipart(s3Key, uploadId, parts);

      setZipState((prev) => ({ ...prev, phase: 'processing', uploadProgress: 100 }));

      const { jobId } = await adminApi.startZipProcessing(eventId, s3Key);

      saveZipToStorage(eventId, {
        s3Key,
        uploadId,
        fileName: zipFile.name,
        fileSize: zipFile.size,
        chunkSize,
        totalParts,
        completedParts: parts,
        phase: 'processing',
        jobId,
        timestamp: Date.now(),
      });

      setZipState((prev) => ({ ...prev, jobId }));
      startZipPolling(jobId);
    } catch (err: any) {
      if (!zipAbortRef.current) {
        setZipState((prev) => ({
          ...prev,
          phase: 'failed',
          error: err?.response?.data?.error || err.message || 'ZIP upload failed',
        }));
      }
    }
  };

  const resumeZipUpload = async (file: File, saved: SavedZipState) => {
    if (!eventId) return;
    zipAbortRef.current = false;
    setSavedZipInfo(null);

    try {
      const parts = await uploadZipChunks(
        file,
        saved.s3Key,
        saved.uploadId,
        saved.chunkSize,
        saved.totalParts,
        saved.completedParts
      );

      await adminApi.completeZipMultipart(saved.s3Key, saved.uploadId, parts);

      setZipState((prev) => ({ ...prev, phase: 'processing', uploadProgress: 100 }));

      const { jobId } = await adminApi.startZipProcessing(eventId, saved.s3Key);

      saveZipToStorage(eventId, {
        ...saved,
        completedParts: parts,
        phase: 'processing',
        jobId,
        timestamp: Date.now(),
      });

      setZipState((prev) => ({ ...prev, jobId }));
      startZipPolling(jobId);
    } catch (err: any) {
      if (!zipAbortRef.current) {
        setZipState((prev) => ({
          ...prev,
          phase: 'failed',
          error: err?.response?.data?.error || err.message || 'Resume failed',
        }));
      }
    }
  };

  const startZipPolling = (jobId: string) => {
    if (zipPollingRef.current) {
      clearInterval(zipPollingRef.current);
    }

    zipPollingRef.current = setInterval(async () => {
      if (!eventId) return;
      try {
        const status: ZipJobStatus = await adminApi.getZipJobStatus(eventId, jobId);
        setZipState((prev) => ({
          ...prev,
          totalFiles: status.totalFiles,
          completedFiles: status.completedFiles,
          failedFiles: status.failedFiles,
        }));

        if (status.status === 'completed' || status.status === 'failed') {
          if (zipPollingRef.current) {
            clearInterval(zipPollingRef.current);
            zipPollingRef.current = null;
          }
          clearZipStorage(eventId);
          setZipState((prev) => ({
            ...prev,
            phase: status.status as ZipPhase,
            error: status.error,
          }));
          loadEvent();
        }
      } catch {
        if (zipPollingRef.current) {
          clearInterval(zipPollingRef.current);
          zipPollingRef.current = null;
        }
        setZipState((prev) => ({ ...prev, phase: 'failed', error: 'Failed to poll job status' }));
      }
    }, 2500);
  };

  const dismissZip = () => {
    if (zipPollingRef.current) {
      clearInterval(zipPollingRef.current);
      zipPollingRef.current = null;
    }
    if (eventId) clearZipStorage(eventId);
    setSavedZipInfo(null);
    setZipState({
      phase: 'idle',
      uploadProgress: 0,
      partsCompleted: 0,
      totalParts: 0,
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
    });
  };

  const cancelZipUpload = async () => {
    zipAbortRef.current = true;
    if (eventId && savedZipInfo) {
      try {
        await adminApi.abortZipMultipart(savedZipInfo.s3Key, savedZipInfo.uploadId);
      } catch {}
    }
    dismissZip();
  };

  const uploadSingleFile = async (
    uploadFile: UploadFile,
    presignedData: { uploadUrl: string; key: string }
  ): Promise<boolean> => {
    try {
      updateFileStatus(uploadFile.id, { status: 'uploading', progress: 0 });

      await axios.put(presignedData.uploadUrl, uploadFile.file, {
        headers: {
          'Content-Type': uploadFile.file.type,
        },
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded / e.total) * 100);
            updateFileStatus(uploadFile.id, { progress });
          }
        },
      });

      updateFileStatus(uploadFile.id, {
        status: 'uploaded',
        progress: 100,
        s3Key: presignedData.key,
      });

      return true;
    } catch (err: any) {
      updateFileStatus(uploadFile.id, {
        status: 'failed',
        error: err.message || 'Upload failed',
      });
      return false;
    }
  };

  const startUpload = async () => {
    if (!eventId || files.length === 0) return;

    setIsUploading(true);
    setIsPaused(false);
    pausedRef.current = false;

    const pendingFiles = files.filter((f) => f.status === 'pending');
    let currentIndex = 0;

    const processNextBatch = async () => {
      while (currentIndex < pendingFiles.length && !pausedRef.current) {
        const batch = pendingFiles.slice(currentIndex, currentIndex + BATCH_SIZE);
        if (batch.length === 0) break;

        const uploadedKeys = new Map<string, string>();

        try {
          const presignedUrls = await adminApi.getBatchPresignedUrls(
            eventId,
            batch.map((f) => ({ fileName: f.file.name, fileType: f.file.type }))
          );

          const presignedMap = new Map(presignedUrls.map((p) => [p.fileName, p]));

          const uploadPromises: Promise<void>[] = [];
          let activeUploads = 0;
          let batchIndex = 0;

          const processFile = async (file: UploadFile) => {
            const presigned = presignedMap.get(file.file.name);
            if (!presigned) {
              updateFileStatus(file.id, { status: 'failed', error: 'No presigned URL' });
              return;
            }
            const success = await uploadSingleFile(file, presigned);
            if (success) {
              uploadedKeys.set(file.id, presigned.key);
            }
          };

          while (batchIndex < batch.length || activeUploads > 0) {
            if (pausedRef.current) break;

            while (activeUploads < CONCURRENT_UPLOADS && batchIndex < batch.length) {
              const file = batch[batchIndex];
              batchIndex++;
              activeUploads++;

              const promise = processFile(file).finally(() => {
                activeUploads--;
              });
              uploadPromises.push(promise);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          await Promise.all(uploadPromises);

          const uploadsRaw = batch.filter((f) => uploadedKeys.has(f.id));
          const dimensions = await Promise.all(uploadsRaw.map((f) => readImageDimensions(f.file)));
          const uploads = uploadsRaw.map((f, i) => ({
            s3Key: uploadedKeys.get(f.id)!,
            size: f.file.size,
            mimeType: f.file.type,
            ...(dimensions[i] || {}),
            ...(getUploadPath(f.file) ? { path: getUploadPath(f.file) } : {}),
          }));

          if (uploads.length > 0) {
            await adminApi.batchCompleteUpload(eventId, uploads);
            batch.forEach((f) => {
              if (uploadedKeys.has(f.id)) {
                updateFileStatus(f.id, { status: 'completed' });
              }
            });
          }
        } catch (err) {
          console.error('Batch processing error:', err);
          batch.forEach((f) => {
            if (!uploadedKeys.has(f.id)) {
              updateFileStatus(f.id, { status: 'failed', error: 'Batch failed' });
            }
          });
        }

        currentIndex += BATCH_SIZE;
      }
    };

    await processNextBatch();
    setIsUploading(false);
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      pausedRef.current = false;
      startUpload();
    } else {
      setIsPaused(true);
      pausedRef.current = true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const zipBusy = zipState.phase === 'uploading' || zipState.phase === 'processing';

  return (
    <AdminLayout>
      <>
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin/events"
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Upload Photos</h1>
            <p className="text-slate-500">
              {event?.name} ({event?.eventCode})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Files</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-slate-500">Failed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  {...({ webkitdirectory: '', directory: '' } as any)}
                />
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleZipSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || zipBusy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Select Files
                </button>

                <button
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isUploading || zipBusy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  Select Folder
                </button>

                {/* <button
                  onClick={() => zipInputRef.current?.click()}
                  disabled={isUploading || zipBusy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  Upload ZIP
                </button> */}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {stats.failed > 0 && (
                  <button
                    onClick={retryFailed}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Failed
                  </button>
                )}

                {stats.completed > 0 && (
                  <button
                    onClick={clearCompleted}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Clear Completed
                  </button>
                )}

                {files.length > 0 && !isUploading && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {zipState.phase !== 'idle' && (
              <div className="mt-4 p-4 rounded-lg border relative">
                {(zipState.phase === 'completed' || zipState.phase === 'failed') && (
                  <button
                    onClick={dismissZip}
                    className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {zipState.phase === 'resumable' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Previous upload incomplete ({savedZipInfo?.completedParts.length}/{savedZipInfo?.totalParts} parts).
                          Select the same file to resume.
                        </span>
                      </div>
                      <button
                        onClick={cancelZipUpload}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-300"
                        style={{ width: `${zipState.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {zipState.phase === 'uploading' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Uploading ZIP... {zipState.partsCompleted}/{zipState.totalParts} parts ({zipState.uploadProgress}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${zipState.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {zipState.phase === 'processing' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Extracting photos... {zipState.completedFiles} of {zipState.totalFiles}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${zipState.totalFiles > 0 ? (zipState.completedFiles / zipState.totalFiles) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {zipState.phase === 'completed' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      {zipState.completedFiles} photos extracted
                      {zipState.failedFiles > 0 && `, ${zipState.failedFiles} failed`}
                    </span>
                  </div>
                )}

                {zipState.phase === 'failed' && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      {zipState.error || 'ZIP processing failed'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {!isUploading ? (
                  <button
                    onClick={startUpload}
                    disabled={stats.pending === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Start Upload ({stats.pending} files)
                  </button>
                ) : (
                  <button
                    onClick={togglePause}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                      isPaused
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    )}
                  </button>
                )}

                {isUploading && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      Uploading... {stats.uploading} active, {stats.uploaded} uploaded
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {files.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No files selected</p>
                <p className="text-sm mt-1">Select files, a folder, or a ZIP to start uploading</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.file.type.startsWith('video/') ? (
                        <span className="text-xs font-medium text-slate-500">VID</span>
                      ) : (
                        <Image className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="w-32 flex-shrink-0">
                      {file.status === 'pending' && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {file.status === 'uploading' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-blue-600 font-medium">{file.progress}%</span>
                        </div>
                      )}
                      {file.status === 'uploaded' && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Uploaded
                        </span>
                      )}
                      {file.status === 'completed' && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                      {file.status === 'failed' && (
                        <span className="text-xs text-red-600 flex items-center gap-1" title={file.error}>
                          <X className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>

                    {!isUploading && file.status !== 'completed' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    </AdminLayout>
  );
};
