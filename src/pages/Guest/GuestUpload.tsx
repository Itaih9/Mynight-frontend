import React, { useState, useRef, useEffect } from 'react';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { ArrowRight, ArrowLeft, Upload, X, Film, Check, Loader2, Plus, User, ChevronRight, ChevronLeft, Camera, Smartphone, RefreshCcw, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventsApi, galleryApi } from '@/services/api';
import type { Event } from '@/types/api.types';
import axios from 'axios';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  uploader: string;
}

const GuestUpload: React.FC = () => {
  const navigate = useNavigate();
  const { eventCode } = useParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);
  const coupleName = event?.name || '';

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventCode) {
        setEventError('קוד אירוע חסר');
        setIsLoadingEvent(false);
        return;
      }

      try {
        const response = await eventsApi.getByCodeOrSlug(eventCode);
        if (response.data) {
          if ((response.data as any).packageName === 'החכמה') {
            setEventError('עמוד זה אינו זמין לחבילה זו');
            setIsLoadingEvent(false);
            return;
          }
          setEvent(response.data);
        } else {
          setEventError('האירוע לא נמצא');
        }
      } catch (err: any) {
        setEventError(err.response?.data?.error || 'שגיאה בטעינת האירוע');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [eventCode]);

  const handleBack = () => {
    if (eventCode) {
      navigate(ROUTES.GUEST_LANDING.replace(':eventCode', eventCode));
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (showNameModal && !isLoadingEvent) {
        setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showNameModal, isLoadingEvent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedFileId) return;
        if (e.key === 'ArrowRight') navigateViewer('next');
        if (e.key === 'ArrowLeft') navigateViewer('prev');
        if (e.key === 'Escape') setSelectedFileId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileId, files]);

  useEffect(() => {
    if (
      !isUploading &&
      files.length > 0 &&
      files.every(f => f.status === 'success' || f.status === 'error') &&
      files.every(f => f.status === 'success')
    ) {
      setTimeout(() => setUploadComplete(true), 300);
    }
  }, [isUploading, files]);

  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (guestName.trim().length < 2) {
          setNameError(true);
          return;
      }
      setShowNameModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: UploadFile[] = Array.from(e.target.files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        progress: 0,
        status: 'pending',
        uploader: guestName
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      const presignedRes = await galleryApi.guestPresignedUrl(
        eventCode!,
        uploadFile.file.name,
        uploadFile.file.type
      );

      const { uploadUrl, key } = presignedRes.data;

      await axios.put(uploadUrl, uploadFile.file, {
        headers: { 'Content-Type': uploadFile.file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id ? { ...f, progress: pct } : f
            ));
          }
        },
      });

      await galleryApi.guestCompleteUpload(eventCode!, key, guestName, {
        size: uploadFile.file.size,
        mimeType: uploadFile.file.type,
      });

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, progress: 100, status: 'success' } : f
      ));
      return true;
    } catch (err: any) {
      console.error('Upload failed:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || '';
      if (msg.includes('not yet activated')) {
        setUploadError('האירוע עדיין לא הופעל. אנא צרו קשר עם הזוג.');
      } else if (msg.includes('expired')) {
        setUploadError('חלון ההעלאה פג תוקף. אנא צרו קשר עם הזוג.');
      } else if (err?.code === 'ERR_NETWORK' || !navigator.onLine) {
        setUploadError('אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.');
      } else {
        setUploadError('שגיאה בהעלאת הקבצים. נסו שוב.');
      }
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'error' } : f
      ));
      return false;
    }
  };

  const runUploadQueue = async (filesToProcess: UploadFile[]) => {
    if (filesToProcess.length === 0 || !event || !eventCode) return;
    setIsUploading(true);
    setUploadError(null);

    const CONCURRENCY = 5;
    const queue = [...filesToProcess];

    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) break;
        await uploadSingleFile(file);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, filesToProcess.length) }, () => worker())
    );
    setIsUploading(false);
  };

  const startUpload = async () => {
    await runUploadQueue(files.filter(f => f.status === 'pending'));
  };

  const retryFailed = async () => {
    const failedFiles = files.filter(f => f.status === 'error');
    if (failedFiles.length === 0) return;
    const resetFiles = failedFiles.map(f => ({ ...f, status: 'pending' as const, progress: 0 }));
    setFiles(prev => prev.map(f => {
      const r = resetFiles.find(r => r.id === f.id);
      return r ?? f;
    }));
    await runUploadQueue(resetFiles);
  };

  const navigateViewer = (direction: 'next' | 'prev') => {
    if (!selectedFileId) return;
    const currentIndex = files.findIndex(f => f.id === selectedFileId);
    if (currentIndex === -1) return;

    if (direction === 'next') {
        const nextIndex = (currentIndex + 1) % files.length;
        setSelectedFileId(files[nextIndex].id);
    } else {
        const prevIndex = (currentIndex - 1 + files.length) % files.length;
        setSelectedFileId(files[prevIndex].id);
    }
  };

  const swipeHandlers = useSwipeNavigation(navigateViewer);

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-gold-primary mx-auto mb-4" />
          <p className="text-gray-500 font-medium">טוען אירוע...</p>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">אופס!</h1>
          <p className="text-gray-500 mb-6">{eventError}</p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-charcoal flex flex-col relative" dir="rtl">

      <AnimatePresence>
        {showNameModal && (
            <motion.div
                key="name-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
                >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
                        <User size={32} className="text-black" />
                    </div>

                    <h2 className="text-2xl font-black mb-2">איך קוראים לך?</h2>
                    <p className="text-gray-500 text-sm mb-6">כדי שהזוג ידע מי העלה את התמונות</p>

                    <form onSubmit={handleNameSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={guestName}
                                onChange={(e) => {
                                    setGuestName(e.target.value);
                                    if (nameError) setNameError(false);
                                }}
                                placeholder="שם מלא (או כינוי)"
                                className={`w-full px-5 py-4 bg-gray-50 rounded-xl border focus:bg-white outline-none transition-all text-center font-bold text-lg ${nameError ? 'border-red-500' : 'border-gray-100 focus:border-black'}`}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span>התחלה</span>
                            <ArrowLeft size={20} />
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}

      </AnimatePresence>

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black">
                <ArrowRight size={24} />
            </button>
            <div>
                <h1 className="font-bold text-lg leading-tight">העלאת מדיה</h1>
                <p className="text-xs text-gray-500">
                    {guestName ? `היי ${guestName}, ` : ''} מעלים לחתונה של {coupleName}
                </p>
            </div>
        </div>
        {!isUploading && files.length > 0 && (
            <span className="text-sm font-bold text-black bg-gray-100 px-3 py-1 rounded-full">{files.length} נבחרו</span>
        )}
      </div>

      <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">

        {uploadComplete ? (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-10"
            >
                <div className="w-24 h-24 bg-gold-primary text-black rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gold-primary/20">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-4xl font-black mb-2 text-black">תודה {guestName}!</h2>
                <p className="text-gray-500 text-lg mb-8 max-w-xs mx-auto">
                    התמונות והסרטונים שלך נשמרו בגלריה של {coupleName} בהצלחה.
                </p>
                <button
                    onClick={() => { setUploadComplete(false); setFiles([]); fileInputRef.current?.click(); }}
                    className="bg-gray-100 text-black px-10 py-4 rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all shadow-sm mb-3 w-full max-w-xs"
                >
                    העלאה נוספת
                </button>
                <button
                    onClick={handleBack}
                    className="bg-black text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl w-full max-w-xs"
                >
                    חזרה לדף הבית
                </button>
            </motion.div>
        ) : (
            <div className="space-y-6">
                {!isUploading && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-[32px] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-black transition-all group min-h-[240px]"
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <div className="w-20 h-20 bg-gray-50 text-black rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-gray-100">
                            <Upload size={32} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-black">לחצו לבחירת קבצים</h3>
                        <p className="text-gray-400 text-base">תמונות וסרטונים באיכות מלאה</p>
                    </div>
                )}

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence>
                        {files.map((file) => (
                            <motion.div
                                key={file.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group shadow-sm border border-gray-100 cursor-pointer"
                                onClick={() => !isUploading && setSelectedFileId(file.id)}
                            >
                                {file.type === 'video' ? (
                                    <video src={file.preview} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                )}

                                {file.type === 'video' && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm pointer-events-none">
                                        <Film size={12} className="text-white" />
                                    </div>
                                )}

                                {!isUploading && (
                                    <button
                                        onClick={(e) => removeFile(file.id, e)}
                                        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                    >
                                        <X size={14} />
                                    </button>
                                )}

                                {isUploading && file.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-gold-primary animate-spin" />
                                    </div>
                                )}

                                {file.status === 'success' && (
                                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center backdrop-blur-[1px]">
                                        <Check size={32} className="text-white drop-shadow-md" strokeWidth={3} />
                                    </div>
                                )}

                                {file.status === 'error' && (
                                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center backdrop-blur-[1px]">
                                        <X size={32} className="text-white drop-shadow-md" strokeWidth={3} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {!isUploading && files.length > 0 && (
                        <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            layout
                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-black hover:border-black/30 bg-white"
                        >
                            <Plus size={28} />
                            <span className="text-xs font-bold mt-2">הוספה</span>
                        </motion.button>
                    )}
                </div>
            </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFile && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
                onClick={() => setSelectedFileId(null)}
            >
                <button
                    onClick={() => setSelectedFileId(null)}
                    className="absolute top-4 left-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors z-50"
                >
                    <X size={24} />
                </button>

                <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8" onClick={(e) => e.stopPropagation()} {...swipeHandlers}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedFile.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative max-w-full max-h-full flex items-center justify-center"
                        >
                            {selectedFile.type === 'video' ? (
                                <video
                                    src={selectedFile.preview}
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <img
                                    src={selectedFile.preview}
                                    alt=""
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {files.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigateViewer('next'); }}
                                className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigateViewer('prev'); }}
                                className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {!uploadComplete && files.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30">
              <div className="max-w-4xl mx-auto">
                  <AnimatePresence>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3"
                      >
                        <div className="bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black rounded-2xl shadow-lg px-4 py-3 flex items-center justify-center gap-3 border border-amber-200/50">
                          <span className="text-sm md:text-base font-bold leading-snug text-center">חשוב להישאר בעמוד עד שהכל יעלה ושום רגע לא ילך לאיבוד</span>
                          <Heart size={20} className="fill-red-500 text-red-500 shrink-0" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {uploadError && (
                    <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                      <p className="text-red-600 text-sm font-medium">{uploadError}</p>
                    </div>
                  )}
                  {!isUploading && files.some(f => f.status === 'error') && (
                    <button
                      onClick={retryFailed}
                      className="w-full mb-3 bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg transition-all active:scale-95"
                    >
                      <RefreshCcw size={20} />
                      <span>ניסיון חוזר ({files.filter(f => f.status === 'error').length} נכשלו)</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setUploadError(null); startUpload(); }}
                    disabled={isUploading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isUploading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            <span>מעלה {files.filter(f => f.status === 'success').length}/{files.length}...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={24} />
                            <span>שליחת {files.length} קבצים</span>
                        </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                      הקבצים ישויכו לשם: <span className="text-black font-bold">{guestName}</span>
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default GuestUpload;
