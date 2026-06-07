import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Camera, Smartphone, ArrowRight, Check, RefreshCcw, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventsApi, galleryApi } from '@/services/api';
import type { Event, Photo } from '@/types/api.types';
import logoSvg from '@/assets/logo.svg';

const GuestSelfie: React.FC = () => {
  const navigate = useNavigate();
  const { eventCode } = useParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [step, setStep] = useState<'welcome' | 'camera' | 'processing' | 'success' | 'no-matches'>('welcome');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [showCameraChoice, setShowCameraChoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const coupleName = event?.name || '';
  const date = (event as any)?.weddingDate || event?.eventDate || '';
  const formattedDate = date ? new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

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
          if ((response.data as any).packageName === 'האוספת') {
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

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleSuccess = () => {
    if (eventCode) {
      navigate(ROUTES.GUEST_GALLERY.replace(':eventCode', eventCode), {
        state: { matchedPhotos, fromSelfie: true }
      });
    }
  };

  const startCamera = () => {
    setStep('camera');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && event) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
          setStep('processing');
          performFaceMatch(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const performFaceMatch = async (file: File) => {
    if (!event) return;

    try {
      setMatchError(null);
      const response = await galleryApi.matchPhotos(event._id, file);

      if (response.data?.matchedPhotos && response.data.matchedPhotos.length > 0) {
        setMatchedPhotos(response.data.matchedPhotos);
        setStep('success');
      } else {
        setStep('no-matches');
      }
    } catch (err: any) {
      console.error('Face match failed:', err);
      setMatchError(err.response?.data?.error || 'שגיאה בזיהוי פנים');
      setStep('no-matches');
    }
  };

  const resetAndTryAgain = () => {
    setStep('camera');
    setSelectedImage(null);
    setSelectedFile(null);
    setMatchedPhotos([]);
    setMatchError(null);
  };

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
            onClick={handleGoHome}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center relative overflow-hidden font-sans text-charcoal" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />

        <div className="relative z-10 w-full max-w-md flex flex-col h-[100dvh] p-6">

            <div className="flex justify-between items-center mb-4 md:mb-8 shrink-0">
                 <button onClick={handleBack} className="p-2 bg-white/50 backdrop-blur rounded-full text-gray-500 hover:text-black transition-colors border border-gray-100">
                    <ArrowRight size={20} />
                 </button>
                 <button onClick={handleGoHome} className="focus:outline-none">
                    <img src={logoSvg} alt="Logo" className="h-6" />
                 </button>
            </div>

            <AnimatePresence mode="wait">
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center flex-grow justify-center pb-10 space-y-6 md:space-y-8"
                    >
                         <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FFD946] rounded-full flex items-center justify-center shadow-lg shadow-gold-primary/40 mb-2 relative">
                            <Camera size={36} className="text-black relative z-10 md:w-10 md:h-10" />
                         </div>

                         <div className="space-y-2">
                             <p className="text-xs md:text-sm font-bold tracking-widest text-gray-400 uppercase">ברוכים הבאים לחתונה של</p>
                             <h1 className="text-3xl md:text-4xl font-black text-black leading-tight">{coupleName}</h1>
                             {formattedDate && <p className="text-base md:text-lg text-gray-500 font-light">{formattedDate}</p>}
                         </div>

                         <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 max-w-xs mx-auto">
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                רוצים את התמונות שלכם מהאירוע? <br/>
                                <strong>צלמו סלפי קצר</strong> והמערכת תשלח אליכם את כל התמונות בהן אתם מופיעים.
                            </p>
                         </div>

                         <button
                            onClick={startCamera}
                            className="w-full bg-black text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                         >
                            <Camera size={22} />
                            <span>בואו נתחיל</span>
                         </button>
                    </motion.div>
                )}

                {step === 'camera' && (
                    <motion.div
                         key="camera"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex flex-col items-center flex-grow w-full pb-6"
                    >
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 shrink-0">צלמו או העלו סלפי ברור</h2>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            className="hidden"
                            ref={cameraInputRef}
                            onChange={handleFileSelect}
                        />

                        {showCameraChoice && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                                <motion.div
                                    initial={{ y: 300 }}
                                    animate={{ y: 0 }}
                                    exit={{ y: 300 }}
                                    className="w-full bg-white rounded-t-3xl p-6 flex flex-col gap-4"
                                >
                                    <div className="flex justify-center mb-2">
                                        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <h3 className="text-xl font-bold text-center mb-2">בחרו דרך העלאה</h3>
                                    <button
                                        onClick={() => {
                                            setShowCameraChoice(false);
                                            cameraInputRef.current?.click();
                                        }}
                                        className="w-full bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                                        dir="ltr"
                                    >
                                        <Camera size={22} />
                                        <span>צילום סלפי</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCameraChoice(false);
                                            fileInputRef.current?.click();
                                        }}
                                        className="w-full bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                                        dir="ltr"
                                    >
                                        <Smartphone size={22} />
                                        <span>בחירת סלפי מגלריה</span>
                                    </button>
                                    <button
                                        onClick={() => setShowCameraChoice(false)}
                                        className="w-full text-gray-600 py-3 font-medium rounded-2xl hover:bg-gray-100 transition-all"
                                    >
                                        ביטול
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        <div className="flex-grow w-full relative mb-6 md:mb-8 flex flex-col">
                             <div className="w-full flex-grow bg-gray-100 rounded-[32px] overflow-hidden relative shadow-lg border border-gray-200">
                                 {selectedImage ? (
                                     <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                         <img
                                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                                            alt="Selfie Example"
                                            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                                         />
                                         <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                                         <div className="relative z-10 w-48 h-64 border-2 border-black/20 rounded-[50%] border-dashed flex items-center justify-center">
                                            <p className="text-black/40 font-medium text-sm">המקום לפנים שלכם</p>
                                         </div>
                                     </div>
                                 )}

                                 <div className="absolute inset-0 pointer-events-none">
                                     <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                         <defs>
                                             <mask id="mask">
                                                 <rect width="100%" height="100%" fill="white" />
                                                 <ellipse cx="50" cy="45" rx="28" ry="38" fill="black" />
                                             </mask>
                                         </defs>
                                         <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#mask)" />
                                         <ellipse cx="50" cy="45" rx="28" ry="38" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2" opacity="0.8" />
                                     </svg>
                                 </div>
                             </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-center gap-3">
                            <button
                                onClick={() => setShowCameraChoice(true)}
                                className="w-20 h-20 bg-white border-4 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg active:scale-95 group"
                            >
                                <div className="w-16 h-16 bg-gold-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Camera size={32} className="text-black opacity-75" />
                                </div>
                            </button>
                            <p className="text-gray-400 text-xs font-medium">לחץ כדי לבחור דרך העלאה</p>
                        </div>
                    </motion.div>
                )}

                {step === 'processing' && (
                    <motion.div
                         key="processing"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex flex-col items-center justify-center flex-grow pb-20"
                    >
                        <div className="relative mb-8">
                            {selectedImage ? (
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 relative">
                                    <img src={selectedImage} alt="Processing" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-gray-100 bg-gray-50"></div>
                            )}
                            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-gold-primary border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">מחפש תמונות...</h2>
                        <p className="text-gray-500">סורקים את הגלריה של {coupleName}</p>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div
                         key="success"
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center justify-center flex-grow pb-20 text-center"
                    >
                        <div className="w-24 h-24 bg-gold-primary text-black rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-gold-primary/30">
                            <Check size={48} strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-black mb-4">מצאנו אותך!</h2>
                        <p className="text-gray-500 text-lg leading-relaxed max-w-xs mx-auto mb-8">
                            נמצאו {matchedPhotos.length} תמונות שלך מהאירוע של {coupleName}.
                        </p>

                        <button
                            onClick={handleSuccess}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span>לצפייה בתמונות</span>
                            <ArrowLeft size={20} />
                        </button>

                        <button
                            onClick={resetAndTryAgain}
                            className="mt-6 text-gray-400 font-medium flex flex-row-reverse items-center gap-2 hover:text-black transition-colors"
                        >
                            <RefreshCcw size={18} />
                            <span>נסה שוב עם תמונה אחרת</span>
                        </button>
                    </motion.div>
                )}

                {step === 'no-matches' && (
                    <motion.div
                         key="no-matches"
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex flex-col items-center justify-center flex-grow pb-20 text-center"
                    >
                        <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-8">
                            <Camera size={48} strokeWidth={2} />
                        </div>
                        <h2 className="text-3xl font-black mb-4">לא מצאנו התאמות</h2>
                        <p className="text-gray-500 text-lg leading-relaxed max-w-xs mx-auto mb-8">
                            {matchError || 'לא הצלחנו למצוא תמונות שלך. נסה לצלם סלפי ברור יותר או עם תאורה טובה יותר.'}
                        </p>

                        <button
                            onClick={resetAndTryAgain}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all flex flex-row-reverse items-center justify-center gap-2"
                        >
                            <RefreshCcw size={20} />
                            <span>נסה שוב</span>
                        </button>

                        <button
                            onClick={handleBack}
                            className="mt-6 text-gray-400 font-medium hover:text-black transition-colors"
                        >
                            חזרה לדף הבית
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default GuestSelfie;
