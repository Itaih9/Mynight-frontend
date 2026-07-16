import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import { getTokenScope } from '@/lib/utils';
import { eventsApi, authApi } from '@/services/api';
import logoSvg from '@/assets/logo.svg';
import Footer from '@/components/common/Footer';
import {
  Calendar as CalendarIcon,
  Users,
  Upload as UploadIcon,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Clock,
  ChevronLeft,
  FileSpreadsheet,
  Loader2,
  PlusCircle,
  Share2,
  Database,
  Settings,
  FileText,
  Trash2,
  Lock,
  Mail,
  Phone,
  X,
  Check,
  Eye,
  Layers,
  Camera,
  Smartphone,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/ui';
import { ChampagneReveal } from '@/components/common';

const HeroSection: React.FC<{
  names: string;
  date: string;
  hasSlug: boolean;
  hasFile: boolean;
}> = ({ names, date, hasSlug, hasFile }) => {
  const daysRemaining = useMemo(() => {
    const target = new Date(date);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [date]);

  const formattedDate = useMemo(() => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [date]);

  return (
    <div className="bg-gray-100 text-charcoal p-8 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden mb-8 border border-gray-200">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-right space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">{names}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-600 text-xl font-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-primary">
              <circle cx="9" cy="12" r="6" />
              <circle cx="15" cy="12" r="6" />
            </svg>
            <span>{formattedDate}</span>
          </div>

          <div className="pt-4 space-y-3">
             <p className="text-gray-500 font-bold text-sm">נותר להפעלת המערכת:</p>
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border -translate-y-[1px] ${hasSlug ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>
                      {hasSlug && <Check size={12} strokeWidth={4} />}
                   </div>
                   <span className={`text-sm font-medium ${hasSlug ? 'text-black' : 'text-gray-400'}`}>הגדרת לינק אישי</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border -translate-y-[1px] ${hasFile ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>
                      {hasFile && <Check size={12} strokeWidth={4} />}
                   </div>
                   <span className={`text-sm font-medium ${hasFile ? 'text-black' : 'text-gray-400'}`}>העלאת קובץ מאשרים</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-gold-primary text-black p-8 rounded-[32px] shadow-[0_20px_50px_rgba(245,197,24,0.3)] min-w-[200px] text-center min-h-[200px]">
          {daysRemaining > 0 ? (
            <>
              <span className="text-6xl font-black leading-none">{daysRemaining}</span>
              <span className="text-xl font-bold mt-2">ימים לחתונה</span>
            </>
          ) : (
            <>
               <span className="text-4xl font-black leading-tight">עשיתם<br/>את זה!</span>
            </>
          )}
          <Clock size={24} className="mt-4 opacity-50" />
        </div>
      </div>
    </div>
  );
};

const ExcelUploader: React.FC<{
  eventId?: string;
  onUploadSuccess: (file: File) => void;
  uploadedFile: { name: string; size: number } | null;
  onReset: () => void;
}> = ({ eventId, onUploadSuccess, uploadedFile, onReset }) => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const allowedExtensions = ['xlsx', 'xls', 'csv', 'pdf'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      alert('סוג קובץ לא נתמך. אנא העלו קובץ אקסל, CSV או PDF.');
      return;
    }

    if (!eventId) {
      alert('שגיאה: אין אירוע פעיל');
      return;
    }

    setStatus('uploading');
    setUploadError('');

    try {
      await eventsApi.uploadGuestListFile(eventId, file);
      setStatus('success');
      onUploadSuccess(file);
    } catch (err: any) {
      setStatus('idle');
      setUploadError(err.response?.data?.error || 'שגיאה בהעלאת הקובץ');
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    try {
      await eventsApi.deleteGuestListFile(eventId);
      setStatus('idle');
      onReset();
    } catch (err) {
      console.error('Failed to delete guest list file:', err);
    }
  };

  if (status === 'success' || uploadedFile) {
    return (
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl flex flex-col animate-fade-in text-right h-full">
        <div className="flex items-center gap-4 mb-8 justify-between">
          <h3 className="text-2xl font-bold">הקובץ התקבל בהצלחה!</h3>
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-sm">
            <CheckCircle2 size={32} />
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 flex items-center justify-end">
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="font-bold text-black truncate max-w-[150px] md:max-w-[250px]">{uploadedFile?.name || 'רשימת אורחים'}</p>
              <p className="text-xs text-gray-400" dir="ltr">{uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : ''}</p>
            </div>
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 mb-8">
          <p className="text-blue-900 font-medium leading-relaxed">
            הקובץ התקבל בהצלחה! הצוות שלנו יעבור על הרשימה ויעדכן את הגלריה בקרוב.
          </p>
        </div>

        <button onClick={handleDelete} className="mt-auto w-full py-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all group">
          <Trash2 size={20} className="group-hover:text-red-500 transition-colors" />
          <span>הסרה והעלאה מחדש</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl flex flex-col text-right h-full">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold">ייבוא רשימת מאשרים</h3>
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
            <FileSpreadsheet size={28} />
          </div>
        </div>
        <p className="text-gray-500 font-medium text-lg leading-relaxed">
          העלו את רשימת מאשרי ההגעה (אקסל, CSV או PDF) והצוות שלנו יטפל בהפצה.
        </p>
      </div>

      <div className="relative flex-grow flex flex-col">
        <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv, .pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
        <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-[32px] p-12 transition-all flex flex-col items-center justify-center text-center gap-6 flex-grow ${status === 'uploading' ? 'bg-gray-50 border-gray-200 cursor-wait' : ''} ${dragActive ? 'bg-gold-primary/5 border-gold-primary scale-[0.99]' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-black'}`}>
          {status === 'uploading' ? (
            <>
              <div className="relative">
                <Loader2 size={64} className="text-black animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Database size={24} className="text-gold-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-bold">מעלה קובץ...</p>
                <p className="text-gray-400 font-medium">מאבטח נתונים ושומר במערכת</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center shadow-xl mb-2">
                <UploadIcon size={36} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-2">גררו קובץ לכאן</p>
                <p className="text-gray-400 font-medium">או לחצו לבחירה מתיקייה</p>
                <div className="flex items-center gap-2 justify-center mt-4 text-xs font-bold text-gray-300 uppercase tracking-widest">
                  <span>PDF</span><span className="w-1 h-1 bg-gray-200 rounded-full"></span><span>CSV</span><span className="w-1 h-1 bg-gray-200 rounded-full"></span><span>EXCEL</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-red-600 text-sm font-medium text-center">{uploadError}</p>
        </div>
      )}
      <div className="mt-8">
        <p className="text-sm text-gray-400 text-center font-medium flex items-center justify-center gap-2">
          <Lock size={14} />
          <span>המידע שלכם מאובטח ומוצפן בתקן המחמיר ביותר.</span>
        </p>
      </div>
    </div>
  );
};

const SLUG_CHANGE_LIMIT = 3;

const LinksCenter: React.FC<{
  initialSlug?: string;
  weddingDate: string;
  eventId?: string;
  slugChangeCount?: number;
  onSaveSlug: (newSlug: string, newCount?: number) => void;
}> = ({ initialSlug, weddingDate, eventId, slugChangeCount = 0, onSaveSlug }) => {
  const [slugInput, setSlugInput] = useState(initialSlug || '');
  const [partner1Eng, setPartner1Eng] = useState('');
  const [partner2Eng, setPartner2Eng] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isLocked = slugChangeCount >= SLUG_CHANGE_LIMIT;
  const remainingChanges = Math.max(0, SLUG_CHANGE_LIMIT - slugChangeCount);

  useEffect(() => {
    if (initialSlug) setSlugInput(initialSlug);
  }, [initialSlug]);

  const generateSlugFromNames = () => {
    if (!partner1Eng || !partner2Eng) return;
    const dateObj = new Date(weddingDate);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    const generated = `${partner1Eng.toLowerCase()}-${partner2Eng.toLowerCase()}-${formattedDate}-${suffix}`.replace(/\s+/g, '-');
    setSlugInput(generated);
    setSetupError('');
  };

  const handleSaveSlug = async () => {
    if (isLocked) {
      setSetupError('הקישור נעול. ניתן לשנות 3 פעמים בלבד. לשינוי נוסף יש לפנות לתמיכה.');
      return;
    }
    if (!slugInput.trim()) {
      setSetupError('אנא הזינו קישור');
      return;
    }
    if (!eventId) {
      setSetupError('שגיאה: לא נמצא אירוע');
      return;
    }
    const cleanSlug = slugInput.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (cleanSlug.length < 3) {
      setSetupError('הקישור חייב להכיל לפחות 3 תווים');
      return;
    }
    setIsSaving(true);
    setSetupError('');
    try {
      const res = await eventsApi.updateSlug(eventId, cleanSlug);
      setSlugInput(res.data.customSlug);
      onSaveSlug(res.data.customSlug, (res.data as any).slugChangeCount);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || '';
      if (msg.includes('already in use')) {
        setSetupError('הקישור כבר תפוס, אנא בחרו קישור אחר');
      } else if (msg.includes('limit reached')) {
        setSetupError('הקישור נעול. ניתן לשנות 3 פעמים בלבד. לשינוי נוסף יש לפנות לתמיכה.');
      } else {
        setSetupError(msg || 'שגיאה בשמירת הקישור');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const validateEnglish = (val: string) => {
    return val.replace(/[^a-zA-Z\s]/g, '');
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl animate-fade-in text-right h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-2xl font-bold">הגדרת קישור אישי</h3>
        <LinkIcon size={28} className="text-gold-primary" />
      </div>
      <p className="text-gray-500 mb-6 leading-relaxed text-lg">
        הזינו את שמותיכם באנגלית ליצירת קישור, או ערכו ישירות את הקישור למטה.
      </p>
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            הקישור נעול לעריכה. השתמשתם במכסת השינויים ({SLUG_CHANGE_LIMIT}). לשינוי נוסף יש לפנות לתמיכה.
          </p>
        </div>
      )}
      {!isLocked && slugChangeCount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-sm text-blue-800">
          ניתן לשנות את הקישור עוד {remainingChanges} פעמים
        </div>
      )}
      <div className="space-y-5 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">שם באנגלית</label>
            <input type="text" placeholder="Noa" disabled={isLocked} className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-left font-medium disabled:opacity-50 disabled:cursor-not-allowed" dir="ltr" value={partner1Eng} onChange={(e) => { setPartner1Eng(validateEnglish(e.target.value)); setSetupError(''); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">שם באנגלית</label>
            <input type="text" placeholder="Itay" disabled={isLocked} className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-left font-medium disabled:opacity-50 disabled:cursor-not-allowed" dir="ltr" value={partner2Eng} onChange={(e) => { setPartner2Eng(validateEnglish(e.target.value)); setSetupError(''); }} />
          </div>
        </div>
        <button type="button" onClick={generateSlugFromNames} disabled={isLocked || !partner1Eng || !partner2Eng} className="w-full bg-gray-100 text-black py-3 rounded-xl font-bold text-base hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          יצירת קישור מהשמות
        </button>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">קישור אישי</label>
          <div className="relative">
            <input type="text" dir="ltr" readOnly className="w-full px-5 py-4 rounded-xl bg-gray-100 border border-gray-200 outline-none transition-all text-left font-medium text-sm text-gray-500 cursor-not-allowed" placeholder="noa-itay-25-05-2025" value={slugInput} />
          </div>
          {slugInput && <p className="text-gray-400 text-xs mt-2 text-left" dir="ltr">mynight.co.il/guest/{slugInput}</p>}
        </div>
        {setupError && <p className="text-red-500 text-sm font-medium animate-fade-in">{setupError}</p>}
        {savedSuccess && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
            <div className="bg-green-100 p-1.5 rounded-full text-green-600 shrink-0"><CheckCircle2 size={16} /></div>
            <p className="font-bold text-green-800 text-sm">הקישור נשמר בהצלחה!</p>
          </div>
        )}
        <button onClick={handleSaveSlug} disabled={isLocked || isSaving || !slugInput.trim()} className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg mt-auto disabled:opacity-50 disabled:cursor-not-allowed">
          {isSaving ? <Loader2 className="animate-spin" /> : isLocked ? <><span>הקישור נעול</span><Lock size={20} /></> : <><span>שמירת קישור</span><CheckCircle2 size={20} /></>}
        </button>
        {!isLocked && (
          <p className="text-center text-sm font-medium text-orange-600 mt-3">
            יש להגדיר את הקישור האישי עד יום האירוע
          </p>
        )}
      </div>
    </div>
  );
};

const SharingOptions: React.FC<{
  guestLink: string;
  galleryLink: string;
  customSlug: string;
  eventId?: string;
  packageName?: string;
  initialPermissions?: { showProPhotos: boolean; showGuestPhotos: boolean; showGuestStories: boolean };
  onPermissionsChange?: (permissions: { showProPhotos?: boolean; showGuestPhotos?: boolean; showGuestStories?: boolean }) => void;
}> = ({ guestLink, galleryLink, customSlug, eventId, packageName, initialPermissions, onPermissionsChange }) => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    pro: initialPermissions?.showProPhotos ?? true,
    guests: initialPermissions?.showGuestPhotos ?? true,
    stories: initialPermissions?.showGuestStories ?? true
  });
  const [regCopied, setRegCopied] = useState(false);
  const [galleryCopied, setGalleryCopied] = useState(false);
  const [uploadCopied, setUploadCopied] = useState(false);
  const [selfieCopied, setSelfieCopied] = useState(false);

  const uploadLinkUrl = customSlug ? `https://mynight.co.il/guest/${customSlug}/upload` : '';
  const selfieLinkUrl = customSlug ? `https://mynight.co.il/guest/${customSlug}/selfie` : '';
  const isAll = permissions.pro && permissions.guests && permissions.stories;

  const showGuestUpload = packageName !== 'החכמה';
  const showSelfie = packageName !== 'האוספת';
  const mainLinkLabel = !showSelfie
    ? 'קישור ליום שאחרי (העלאת תמונות מאורחים):'
    : !showGuestUpload
      ? 'קישור לאלבום אישי (זיהוי פנים):'
      : 'קישור ליום שאחרי ואלבום אישי (זיהוי פנים):';

  useEffect(() => {
    if (initialPermissions) {
      setPermissions({
        pro: initialPermissions.showProPhotos,
        guests: initialPermissions.showGuestPhotos,
        stories: initialPermissions.showGuestStories,
      });
    }
  }, [initialPermissions]);

  const handleToggleAll = () => {
    const newValue = !isAll;
    setPermissions({ pro: newValue, guests: newValue, stories: newValue });
    onPermissionsChange?.({
      showProPhotos: newValue,
      showGuestPhotos: newValue,
      showGuestStories: newValue,
    });
  };

  const handleToggleItem = (key: 'pro' | 'guests' | 'stories') => {
    const newValue = !permissions[key];
    setPermissions(prev => ({ ...prev, [key]: newValue }));
    const fieldMap = { pro: 'showProPhotos', guests: 'showGuestPhotos', stories: 'showGuestStories' } as const;
    onPermissionsChange?.({ [fieldMap[key]]: newValue });
  };
  const handleCopyLink = (text: string, setCopied: (val: boolean) => void) => { if (!text) return; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleViewGuestPage = () => {
    if (customSlug) {
      navigate(ROUTES.GUEST_LANDING.replace(':eventCode', customSlug));
    }
  };

  const OptionRow = ({ label, icon: Icon, isActive, onToggle }: any) => (
    <div onClick={onToggle} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none group ${isActive ? 'border-gold-primary bg-gold-primary/5 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-gold-primary text-black shadow-md' : 'bg-gray-100 text-gray-400'}`}><Icon size={18} /></div>
        <span className={`font-medium ${isActive ? 'text-black font-bold' : 'text-gray-500 group-hover:text-gray-700'}`}>{label}</span>
      </div>
      <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${isActive ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}><motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className="w-5 h-5 bg-white rounded-full shadow-sm" /></div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl mt-8 text-right animate-fade-in">
      <div className="flex items-center gap-4 mb-8 justify-start">
        <h3 className="text-3xl font-bold">אפשרויות שיתוף לאורחים</h3>
        <Share2 size={32} className="text-black" />
      </div>

      <p className="text-gray-500 mb-8 leading-relaxed text-lg">
        בחרו אילו תכנים יהיו חשופים לאורחים בקישור האישי שלהם.
        הגדרות אלו חלות באופן מיידי על כל הקישורים שנשלחו.
      </p>

      <div className="space-y-3">
        <OptionRow label="כל התמונות והסרטונים" icon={Layers} isActive={isAll} onToggle={handleToggleAll} />
        {showSelfie && (
          <OptionRow label="תמונות וסרטונים מהצלם" icon={Camera} isActive={permissions.pro} onToggle={() => handleToggleItem('pro')} />
        )}
        {showGuestUpload && (
          <OptionRow label="תמונות וסרטונים מאורחים אחרים" icon={Users} isActive={permissions.guests} onToggle={() => handleToggleItem('guests')} />
        )}
        {showGuestUpload && (
          <OptionRow label="סטוריז מאורחים אחרים" icon={Smartphone} isActive={permissions.stories} onToggle={() => handleToggleItem('stories')} />
        )}
      </div>

      {guestLink && (
        <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <p className="text-gray-500 font-bold text-sm">{mainLinkLabel}</p>
                    <button onClick={handleViewGuestPage} className="text-gold-primary hover:text-black text-sm font-bold underline underline-offset-4 flex items-center gap-2 transition-colors"><span>איך זה נראה?</span><Eye size={16} /></button>
                </div>
                <div className="relative">
                    <input type="text" readOnly value={guestLink} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none" dir="ltr" />
                    <button onClick={() => handleCopyLink(guestLink, setRegCopied)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black" title="העתק קישור">{regCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
                </div>
            </div>
            <div>
                <p className="text-gray-500 font-bold mb-3 text-sm">קישור לצפייה בגלריה הציבורית (ללא העלאה):</p>
                <div className="relative">
                    <input type="text" readOnly value={galleryLink} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none" dir="ltr" />
                    <button onClick={() => handleCopyLink(galleryLink, setGalleryCopied)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black" title="העתק קישור">{galleryCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
                </div>
            </div>

            {(showGuestUpload || showSelfie) && (
            <div className="pt-6 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-4 font-medium">קישורים ישירים (לפי פעולה ספציפית):</p>

                <div className={`grid gap-4 ${showGuestUpload && showSelfie ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                    {showGuestUpload && (
                    <div>
                        <p className="text-gray-500 font-bold mb-3 text-sm flex items-center gap-2"><UploadIcon size={14} className="text-gold-primary" />קישור להעלאת תמונות וסרטונים בלבד:</p>
                        <div className="relative">
                            <input type="text" readOnly value={uploadLinkUrl} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none" dir="ltr" />
                            <button onClick={() => handleCopyLink(uploadLinkUrl, setUploadCopied)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black" title="העתק קישור">{uploadCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
                        </div>
                    </div>
                    )}

                    {showSelfie && (
                    <div>
                        <p className="text-gray-500 font-bold mb-3 text-sm flex items-center gap-2"><Camera size={14} className="text-gold-primary" />קישור לזיהוי פנים (סלפי) בלבד:</p>
                        <div className="relative">
                            <input type="text" readOnly value={selfieLinkUrl} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none" dir="ltr" />
                            <button onClick={() => handleCopyLink(selfieLinkUrl, setSelfieCopied)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black" title="העתק קישור">{selfieCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
                        </div>
                    </div>
                    )}
                </div>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

const SetPasswordModal: React.FC<{ onClose: () => void; initialPhone?: string }> = ({ onClose, initialPhone = '' }) => {
    const cleanInitialPhone = initialPhone && !initialPhone.startsWith('temp_') ? initialPhone : '';
    const [pass, setPass] = useState(''); const [confirm, setConfirm] = useState(''); const [phoneNumber, setPhoneNumber] = useState(cleanInitialPhone); const [emailAddress, setEmailAddress] = useState(''); const [showPass, setShowPass] = useState(false); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => { let val = e.target.value.replace(/\D/g, ''); if (val.length > 10) val = val.slice(0, 10); if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3); setPhoneNumber(val); if (error) setError(''); };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (phoneNumber) { const cleanPhone = phoneNumber.replace(/\D/g, ''); if (cleanPhone.length !== 10) { setError('מספר טלפון חייב להכיל 10 ספרות'); return; } } if (emailAddress) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(emailAddress)) { setError('יש בעיה בכתובת המייל, שננסה שוב?'); return; } } const isEnglishKeyboard = /^[ -~]*$/.test(pass); const englishLetterCount = (pass.match(/[a-zA-Z]/g) || []).length; if (!isEnglishKeyboard) { setError('הסיסמה חייבת להיות באנגלית בלבד (אותיות, מספרים או סימנים)'); return; } if (englishLetterCount < 6) { setError('הסיסמה חייבת להכיל לפחות 6 אותיות באנגלית'); return; } if (pass !== confirm) { setError('הסיסמאות אינן תואמות'); return; } setIsLoading(true); try { const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : undefined; const cleanEmail = emailAddress ? emailAddress.trim() : undefined; await authApi.setPassword({ password: pass, phoneNumber: cleanPhone, email: cleanEmail }); localStorage.removeItem('show-welcome-popup'); onClose(); } catch (err: any) { const msg = err?.response?.data?.error || err?.response?.data?.message || ''; if (msg.includes('already in use')) { setError('מספר הטלפון כבר קיים במערכת'); } else { setError(msg || 'שגיאה בשמירת הסיסמה'); } } finally { setIsLoading(false); } };
    const handleSkip = () => { localStorage.removeItem('show-welcome-popup'); onClose(); };
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl text-center max-h-[90dvh] overflow-hidden">
                <div className="overflow-y-auto max-h-[90dvh] p-6 md:p-8">
                <div className="w-12 h-12 bg-gold-primary/10 rounded-2xl flex items-center justify-center mx-auto text-gold-primary mb-4"><Sparkles size={28} /></div>
                <h3 className="text-2xl font-black mb-2">ברוכים הבאים!</h3>
                <p className="text-gray-500 mb-5 leading-relaxed text-sm">כדי שתוכלו להיכנס ללוח הבקרה בכל זמן,<br />אנא קבעו סיסמה אישית.</p>
                <form onSubmit={handleSubmit} className="space-y-3 text-right">
                    <div><label className="block text-xs font-bold text-gray-400 mb-1.5 pr-1">מספר טלפון</label><input type="tel" dir="ltr" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-left font-medium text-sm" value={phoneNumber} placeholder="054-7700000" onChange={handlePhoneChange} /></div>
                    <div><label className="block text-xs font-bold text-gray-400 mb-1.5 pr-1">אימייל</label><input type="email" dir="ltr" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-left font-medium text-sm" value={emailAddress} placeholder="name@example.com" onChange={e => { setEmailAddress(e.target.value); if (error) setError(''); }} /></div>
                    <div><label className="block text-xs font-bold text-gray-400 mb-1.5 pr-1">סיסמה חדשה</label><div className="relative"><input type={showPass ? "text" : "password"} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-right font-medium text-sm" value={pass} placeholder="לפחות 6 אותיות באנגלית" onChange={e => setPass(e.target.value)} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
                    <div><label className="block text-xs font-bold text-gray-400 mb-1.5 pr-1">אימות סיסמה</label><input type={showPass ? "text" : "password"} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none transition-all text-right font-medium text-sm" value={confirm} placeholder="הזינו שוב את הסיסמה" onChange={e => setConfirm(e.target.value)} /></div>
                    {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3.5 rounded-xl font-black text-base shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 mt-2">{isLoading ? <Loader2 className="animate-spin" size={18} /> : 'שמירה וכניסה למערכת'}</button>
                </form>
                </div>
            </motion.div>
        </div>
    );
};

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentEvent, isNewUser, token } = useUserStore();

  const eventId = (currentEvent as any)?._id || (currentEvent as any)?.id;

  const coupleNames = user?.partnerName1 && user?.partnerName2
    ? `${user.partnerName1} ו${user.partnerName2}`
    : 'זוג לדוגמה';
  const weddingDate = user?.weddingDate || new Date().toISOString().split('T')[0];
  const phone = user?.phoneNumber || '';
  const email = user?.email || '';

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [newName1, setNewName1] = useState(user?.partnerName1 || '');
  const [newName2, setNewName2] = useState(user?.partnerName2 || '');
  const [newPhone, setNewPhone] = useState(phone?.startsWith('temp_') ? '' : phone);
  const [newEmail, setNewEmail] = useState(email);
  const [newDate, setNewDate] = useState(weddingDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [customSlug, setCustomSlug] = useState(currentEvent?.customSlug || '');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(() => localStorage.getItem('show-welcome-popup') === 'true');
  const [showChampagne, setShowChampagne] = useState(() => isNewUser && !localStorage.getItem('champagne-played'));

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN);
      return;
    }
    // Phone-login sessions are scoped to the gallery only — keep them out of the
    // event-management page.
    if (getTokenScope(token) === 'gallery') {
      navigate(ROUTES.GALLERY, { replace: true });
    }
  }, [token, navigate]);

  // Note: previously this force-redirected unpaid events to the payment page
  // using a hardcoded price map. Those prices went stale when packages were
  // repriced, sending couples to a checkout that no longer matched. A logged-in
  // couple should always land on their event management page; payment is offered
  // from the packages flow, not forced here.

  useEffect(() => {
    if (currentEvent?.customSlug && !customSlug) {
      setCustomSlug(currentEvent.customSlug);
    }
  }, [currentEvent?.customSlug]);

  useEffect(() => {
    if (user) {
      setNewName1(user.partnerName1 || '');
      setNewName2(user.partnerName2 || '');
      setNewPhone(user.phoneNumber && !user.phoneNumber.startsWith('temp_') ? user.phoneNumber : '');
      setNewEmail(user.email || '');
      setNewDate(user.weddingDate || new Date().toISOString().split('T')[0]);
    }
  }, [user]);

  useEffect(() => {
    if (!isEditingSettings || !token) return;
    authApi
      .getProfile()
      .then((res) => {
        if (res?.data) useUserStore.getState().setUser(res.data);
      })
      .catch(() => {});
  }, [isEditingSettings, token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarRef]);

  useEffect(() => {
    if (!eventId || typeof eventId !== 'string' || eventId.length !== 24) return;
    eventsApi
      .getById(eventId)
      .then((response) => {
        if (response.data) {
          useUserStore.getState().setCurrentEvent(response.data as any);
        }
      })
      .catch((err) => console.error('Failed to refresh event:', err));
  }, [eventId]);

  useEffect(() => {
    const fetchGuestListFile = async () => {
      if (!eventId || typeof eventId !== 'string' || eventId.length !== 24) return;
      try {
        const response = await eventsApi.getGuestListFile(eventId);
        if (response.data) {
          setUploadedFile({
            name: response.data.originalName,
            size: response.data.size,
          });
        }
      } catch (err) {
        console.error('Failed to fetch guest list file:', err);
      }
    };
    fetchGuestListFile();
  }, [eventId]);

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const handleSaveSettings = async () => {
    if (newPhone) {
      const cleanPhone = newPhone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setSettingsError('מספר טלפון חייב להכיל 10 ספרות');
        return;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setSettingsError('כתובת המייל אינה תקינה');
      return;
    }
    if (!newName1 || !newName2) return;
    setIsSavingSettings(true);
    setSettingsError('');
    try {
      const cleanPhone = newPhone ? newPhone.replace(/\D/g, '') : undefined;
      const res = await authApi.updateProfile({
        partnerName1: newName1,
        partnerName2: newName2,
        weddingDate: newDate,
        phoneNumber: cleanPhone,
        email: newEmail,
      });
      useUserStore.getState().setUser(res.data);
      setIsEditingSettings(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || '';
      if (msg.includes('already in use')) {
        setSettingsError('מספר הטלפון כבר קיים במערכת');
      } else {
        setSettingsError(msg || 'שגיאה בשמירת ההגדרות');
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDownloadGuide = () => {
    const pdfUrl = "/guide.pdf";
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = "MyNight_User_Guide.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNavigateToGallery = () => {
    navigate(ROUTES.GALLERY);
  };

  const handleSharingPermissionsChange = useCallback(async (
    permissions: { showProPhotos?: boolean; showGuestPhotos?: boolean; showGuestStories?: boolean }
  ) => {
    if (!eventId || typeof eventId !== 'string' || eventId.length !== 24) return;
    try {
      const response = await eventsApi.updateSharingPermissions(eventId, permissions);
      const updated = response.data?.sharingPermissions;
      if (updated) {
        const store = useUserStore.getState();
        const existing = store.currentEvent;
        if (existing) {
          store.setCurrentEvent({ ...existing, sharingPermissions: updated } as any);
        }
      }
    } catch (error) {
      console.error('Failed to update sharing permissions:', error);
    }
  }, [eventId]);

  const guestLinkUrl = customSlug ? `https://mynight.co.il/guest/${customSlug}` : '';
  const galleryLinkUrl = customSlug ? `https://mynight.co.il/gallery/${customSlug}` : '';

  return (
    <>
      {showChampagne && <ChampagneReveal onComplete={() => { setShowChampagne(false); useUserStore.getState().setNewUser(false); localStorage.setItem('champagne-played', 'true'); }} />}
      <AnimatePresence>{showPasswordPopup && !showChampagne && <SetPasswordModal key="password-modal" onClose={() => setShowPasswordPopup(false)} initialPhone={phone} />}</AnimatePresence>
      <div className="min-h-screen bg-[#FDFDFD] transition-all duration-700" dir="rtl">
        {isEditingSettings && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditingSettings(false)}></div>
            <div className="bg-white rounded-[32px] w-full max-w-lg relative z-10 shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden">
              <div className="overflow-y-auto max-h-[90vh] p-8 md:p-12">
              <div className="relative flex items-center justify-center mb-8"><button onClick={() => setIsEditingSettings(false)} className="absolute right-0 text-gray-400 hover:text-black"><X size={24} /></button><h3 className="text-3xl font-bold text-center">הגדרות חשבון</h3></div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-400 mb-2">שם בן/בת זוג 1</label><input type="text" className="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none text-right font-bold text-xl" value={newName1} onChange={e => setNewName1(e.target.value)} /></div><div><label className="block text-sm font-medium text-gray-400 mb-2">שם בן/בת זוג 2</label><input type="text" className="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none text-right font-bold text-xl" value={newName2} onChange={e => setNewName2(e.target.value)} /></div></div>
                <div className="relative" ref={calendarRef}><label className="block text-sm font-medium text-gray-400 mb-2">תאריך האירוע</label><div className="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all cursor-pointer flex items-center justify-between" onClick={() => setShowCalendar(!showCalendar)}><span className="font-bold text-xl text-black">{newDate ? new Date(newDate).toLocaleDateString('he-IL') : 'בחירת תאריך'}</span><CalendarIcon className="text-gray-400" size={24} /></div>{showCalendar && (<div className="absolute top-full right-0 mt-2 z-50 w-full flex justify-center shadow-2xl rounded-xl"><Calendar selected={newDate ? new Date(newDate) : undefined} onSelect={(date) => { const offset = date.getTimezoneOffset(); const adjustedDate = new Date(date.getTime() - (offset*60*1000)); const dateString = adjustedDate.toISOString().split('T')[0]; setNewDate(dateString); setShowCalendar(false); }} /></div>)}</div>
                <div><label className="block text-sm font-medium text-gray-400 mb-2">מספר טלפון</label><div className="relative"><input type="tel" dir="ltr" className="w-full px-6 py-4 pl-12 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none text-left font-bold text-xl" value={newPhone} onChange={e => { let val = e.target.value.replace(/\D/g, ''); if (val.length > 10) val = val.slice(0, 10); if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3); setNewPhone(val); if (settingsError) setSettingsError(''); }} /><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} /></div></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-2">אימייל</label><div className="relative"><input type="email" dir="ltr" className="w-full px-6 py-4 pl-12 rounded-xl bg-gray-50 border border-gray-100 focus:border-black outline-none text-left font-bold text-xl" value={newEmail} onChange={e => setNewEmail(e.target.value)} /><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} /></div></div>
                {settingsError && <p className="text-red-500 text-sm font-medium text-center">{settingsError}</p>}
                <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl mt-6 shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3">{isSavingSettings ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}שמירה ועדכון</button>
              </div>
              </div>
            </div>
          </div>
        )}

        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-3">
            <div className="max-w-6xl mx-auto flex justify-between items-center h-[52px]">
                <button onClick={() => setIsEditingSettings(true)} className="text-gray-500 hover:text-black font-medium transition-colors flex items-center gap-2"><span className="text-base font-bold">הגדרות חשבון</span><Settings size={18} /></button>
                <button onClick={handleNavigateToGallery} className="hover:opacity-80 transition-opacity"><img src={logoSvg} alt="MY NIGHT" className="h-[42px] md:h-[50px] w-auto object-contain" /></button>
            </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="mb-4"><h2 className="text-[28px] font-bold text-charcoal leading-none uppercase -translate-x-[5px]">ניהול האירוע</h2></div>
          <HeroSection names={coupleNames} date={weddingDate} hasSlug={!!customSlug} hasFile={!!uploadedFile} />

          <button
            onClick={handleNavigateToGallery}
            className="w-full mb-8 bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black py-6 md:py-7 rounded-[32px] font-black text-2xl md:text-3xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(245,197,24,0.3)] hover:shadow-[0_25px_60px_rgba(245,197,24,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span>צפייה בגלריה</span>
            <Eye size={28} />
          </button>

          <div className="grid gap-8 items-stretch lg:grid-cols-2">
            <ExcelUploader
              eventId={eventId}
              onUploadSuccess={(file) => setUploadedFile({ name: file.name, size: file.size })}
              uploadedFile={uploadedFile}
              onReset={() => setUploadedFile(null)}
            />
            <LinksCenter
              initialSlug={customSlug}
              weddingDate={weddingDate}
              eventId={eventId}
              slugChangeCount={(currentEvent as any)?.slugChangeCount ?? 0}
              onSaveSlug={(s, count) => {
                setCustomSlug(s);
                if (typeof count === 'number') {
                  const store = useUserStore.getState();
                  const existing = store.currentEvent;
                  if (existing) {
                    store.setCurrentEvent({ ...existing, customSlug: s, slugChangeCount: count } as any);
                  }
                }
              }}
            />
          </div>

          <SharingOptions
            guestLink={guestLinkUrl}
            galleryLink={galleryLinkUrl}
            customSlug={customSlug}
            eventId={eventId}
            packageName={(currentEvent as any)?.packageName}
            initialPermissions={currentEvent?.sharingPermissions}
            onPermissionsChange={handleSharingPermissionsChange}
          />

          <div className="mt-12 p-8 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0"><Users size={24} className="text-gold-primary" /></div>
            <div className="text-right"><h4 className="font-bold text-lg">טיפ קטן מהצוות</h4><p className="text-gray-500 text-sm">הסירו דאגה מלבכם! לאחר שתעלו את רשימת המאשרים, אנחנו מטפלים בה-כ-ל!</p></div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Upload;
