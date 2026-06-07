import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Camera, Upload, ArrowLeft, ArrowDown, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventsApi } from '@/services/api';
import type { Event } from '@/types/api.types';
import logoSvg from '@/assets/logo.svg';

const GuestLanding: React.FC = () => {
  const navigate = useNavigate();
  const { eventCode } = useParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventCode) {
        setError('קוד אירוע חסר');
        setIsLoading(false);
        return;
      }

      try {
        const response = await eventsApi.getByCodeOrSlug(eventCode);
        if (response.data) {
          setEvent(response.data);
        } else {
          setError('האירוע לא נמצא');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'שגיאה בטעינת האירוע');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventCode]);

  const coupleName = event?.name || '';
  const date = (event as any)?.weddingDate || event?.eventDate || '';
  const packageName = (event as any)?.packageName as string | undefined;

  const showGuestUpload = packageName !== 'החכמה';
  const showSelfie = packageName !== 'האוספת';

  const formattedDate = date ? new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const handleBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleSelfieClick = () => {
    if (eventCode) {
      navigate(ROUTES.GUEST_SELFIE.replace(':eventCode', eventCode));
    }
  };

  const handleUploadClick = () => {
    if (eventCode) {
      navigate(ROUTES.GUEST_UPLOAD.replace(':eventCode', eventCode));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-gold-primary mx-auto mb-4" />
          <p className="text-gray-500 font-medium">טוען אירוע...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">אופס!</h1>
          <p className="text-gray-500 mb-6">{error}</p>
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
    <div className="min-h-screen bg-white text-charcoal font-sans flex flex-col relative" dir="rtl">

      <div className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
         <button onClick={handleBack} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-black transition-colors">
            <ArrowRight size={20} />
         </button>
         <button onClick={handleGoHome} className="focus:outline-none">
            <img src={logoSvg} alt="Logo" className="h-[36px] md:h-[42px] w-auto object-contain" />
         </button>
      </div>

      <div className="flex-grow flex flex-col md:flex-row items-stretch relative overflow-hidden">

        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-gold-primary/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-50 rounded-full blur-[100px]" />
        </div>

        {showGuestUpload && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center z-10 bg-white/50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                    תודה שחגגתם עם<br/>
                    <span className="text-gold-primary">{coupleName}</span>
                </h1>
                {formattedDate && <p className="text-gray-500 text-lg mb-2">{formattedDate}</p>}
                <p className="text-xl font-medium text-black mb-8 leading-relaxed">
                    נשמח לראות את החתונה מהעיניים שלכם!<br/>
                    יש לכם רגעים שווים שצילמתם?
                </p>

                <button
                    onClick={handleUploadClick}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-800 hover:scale-[1.02] transition-all flex flex-row-reverse items-center justify-center gap-3 group"
                >
                    <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                    <span>העלאת תמונות וסרטונים</span>
                </button>
            </motion.div>
        </div>
        )}

        {showGuestUpload && showSelfie && (
        <div className="flex md:flex-col items-center justify-center p-4 z-10">
            <div className="flex md:flex-col gap-2 text-gold-primary/40">
                <motion.div
                    className="md:hidden"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <ArrowDown size={32} strokeWidth={3} />
                </motion.div>

                <motion.div
                    className="hidden md:block"
                    animate={{ x: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <ArrowLeft size={32} strokeWidth={3} />
                </motion.div>
            </div>
        </div>
        )}

        {showSelfie && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center z-10 bg-gold-primary/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-lg border border-gold-primary/10"
            >
                <div className="w-20 h-20 bg-gold-primary text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-primary/20">
                    <Camera size={36} strokeWidth={2} />
                </div>

                <h2 className="text-3xl font-black mb-4">רוצים את התמונות שלכם?</h2>
                <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                    המערכת החכמה שלנו תסרוק את כל התמונות מהאירוע ותשלח אליכם רק את אלו שאתם מופיעים בהן.
                </p>

                <button
                    onClick={handleSelfieClick}
                    className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-black py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-row-reverse items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                    <Camera size={24} />
                    <span>חיפוש התמונות שלי</span>
                </button>

                <p className="text-xs text-gray-400 mt-4">
                    * באמצעות זיהוי פנים מאובטח
                </p>
            </motion.div>
        </div>
        )}

      </div>
    </div>
  );
};

export default GuestLanding;
