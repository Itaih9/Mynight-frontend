import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Smartphone,
  RefreshCcw,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  Lock,
  Loader2,
  X,
  Send,
  HelpCircle,
  Timer,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar } from '@/components/ui';
import { BuildingGalleryLoader, InfinityRingsLoader, VerificationButton, Navbar } from '@/components/common';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/config/routes';
import { authApi, couponApi, paymentApi } from '@/services/api';
import { tokenizeCard } from '@/services/sumit';
import { SumitHostedCheckout } from '@/components/payment/SumitHostedCheckout';

const USE_SUMIT_IFRAME = true;

const OTP_PHONE_HISTORY = 'mynight_otp_phone_v1';
const OTP_IP_HISTORY = 'mynight_otp_ip_v1';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OpeningGiftAnimation = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center mb-2">
       <div className="absolute inset-0 bg-gold-primary/20 blur-2xl rounded-full scale-100 animate-pulse" />
       {[...Array(16)].map((_, i) => (
         <motion.div
           key={i}
           className={`absolute w-1.5 h-1.5 rounded-full z-0 ${['bg-gold-primary', 'bg-black', 'bg-gray-400', 'bg-yellow-300'][i % 4]}`}
           initial={{ opacity: 0, y: 10, x: 0, scale: 0 }}
           animate={{
             opacity: [0, 1, 1, 0],
             y: [10, -45 - Math.random() * 25],
             x: [(Math.random() - 0.5) * 60],
             scale: [0, 1.2, 0.5],
             rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)]
           }}
           transition={{
             duration: 1.2,
             ease: "easeOut",
             delay: 0.6,
             repeat: Infinity,
             repeatDelay: 2.3
           }}
         />
       ))}
       <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-primary relative z-10 drop-shadow-lg">
         <path d="M4 10h16v11H4z" className="fill-gold-primary/10" />
         <path d="M12 10v11" strokeOpacity="0.6" />
         <motion.g
           initial={{ y: 0, rotate: 0 }}
           animate={{
             y: [0, 0, 0, -10, -10, 0],
             rotate: [0, -3, 3, -3, -12, 0]
           }}
           transition={{
             duration: 3.5,
             times: [0, 0.1, 0.2, 0.25, 0.5, 0.7],
             repeat: Infinity,
             ease: "easeInOut"
           }}
           style={{ originX: 0.5, originY: 1 }}
         >
            <path d="M2 6h20v4H2z" className="fill-gold-primary/20" />
            <path d="M12 6v4" strokeOpacity="0.6" />
            <path d="M7.5 6H12" strokeOpacity="0.6" />
            <path d="M16.5 6H12" strokeOpacity="0.6" />
            <path d="M12 6c0-3 2.5-3 2.5 0" />
            <path d="M12 6c0-3-2.5-3-2.5 0" />
         </motion.g>
       </svg>
    </div>
  );
};

const BackgroundDecoration = () => (
  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-gray-200 rounded-full blur-[100px]"></div>
  </div>
);

const ProgressDots = ({ step, onStepClick, className = "" }: { step: 1 | 2 | 3, onStepClick?: (step: 1 | 2 | 3) => void, className?: string }) => (
  <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      {[1, 2, 3].map((s) => (
          <button
              key={s}
              type="button"
              onClick={() => onStepClick?.(s as 1 | 2 | 3)}
              disabled={!onStepClick}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-black scale-125' : 'bg-gray-300'} ${onStepClick ? 'cursor-pointer hover:bg-gray-400' : 'cursor-default'}`}
          />
      ))}
  </div>
);

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setNewUser, setCurrentEvent, currentEvent } = useUserStore();

  const packageName = searchParams.get('package') || 'UNLIMITED';
  const basePrice = parseInt(searchParams.get('price') || '590', 10);
  const refCodeFromUrl = (searchParams.get('ref') || '').trim().toUpperCase() || undefined;
  const resumePayment = searchParams.get('resumePayment') === '1';

  const PACKAGE_DATA: Record<string, { hebrewName: string; features: string[] }> = {
    'The Morning After': {
      hebrewName: 'האוספת',
      features: [
        "אוספים הכל מהאורחים בשבילכם",
        "נשלח קישור בווצאפ לכל אורח",
        "העלאה מהירה ללא אפליקציה",
        "איכות מקסימלית ללא כיווץ",
        "נהנים מהרגעים עד שהצלם מוכן"
      ]
    },
    'UNLIMITED': {
      hebrewName: 'המושלמת',
      features: [
        "האוספת + החכמה = חבילה מושלמת",
        "מיון אורחים ואלבום אישי בווצאפ",
        "אוספים הכל מהאורחים בבוקר שאחרי",
        "אלבום חכם מושלם מקצה לקצה",
        "קישור בווצאפ לכל אורח",
        "סריקת אלפי תמונות בדיוק מירבי",
        "שליחת אלבום אישי ישירות לנייד",
        "חוויה דיגיטלית אישית ויוקרתית"
      ]
    },
    'Here I Am': {
      hebrewName: 'החכמה',
      features: [
        "מיון אורחים ואלבום אישי בווצאפ",
        "שליחת אלבום אישי ישירות לנייד",
        "סריקת אלפי תמונות בדיוק מירבי",
        "חוסך לאורחים חיפוש בגלריות",
        "חוויה אישית לכל אורח ואורחת"
      ]
    }
  };

  const currentPackage = PACKAGE_DATA[packageName] || PACKAGE_DATA['UNLIMITED'];

  const [step, setStep] = useState<'register' | 'registration_confirmed' | 'loading' | 'payment' | 'terms'>('register');
  const [loadingSubStep, setLoadingSubStep] = useState<'spinning' | 'verified'>('spinning');

  const [formData, setFormData] = useState({
    partner1: '',
    partner2: '',
    eventDate: '',
    phone: '',
    otp: '',
    coupon: ''
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    id: ''
  });
  const [contactData, setContactData] = useState({
    email: '',
    category: 'בעיה עם הקופון',
    message: ''
  });

  const [triggerAutoShine, setTriggerAutoShine] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [isOtpShaking, setIsOtpShaking] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showResendFeedback, setShowResendFeedback] = useState(false);
  const [mockOtpMessage, setMockOtpMessage] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [attemptedPaymentSubmit, setAttemptedPaymentSubmit] = useState(false);
  const [sumitRedirectPaymentId, setSumitRedirectPaymentId] = useState<string | null>(null);
  const [sumitRedirectError, setSumitRedirectError] = useState('');
  const [sumitRedirectStarting, setSumitRedirectStarting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(basePrice);
  const [displayedPrice, setDisplayedPrice] = useState(basePrice);
  const [triggerPricePulse, setTriggerPricePulse] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    if (isTouch) {
      const interval = setInterval(() => {
        setTriggerAutoShine(true);
        setTimeout(() => setTriggerAutoShine(false), 1000);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    let timer: number;
    if (showOtpModal && otpCountdown > 0) {
      timer = window.setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpCountdown]);

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
    if (finalPrice !== displayedPrice) {
      const startValue = displayedPrice;
      const endValue = finalPrice;
      const duration = 2000;
      const startTime = performance.now();

      const animatePrice = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const progress = rawProgress < 0.5
          ? 16 * Math.pow(rawProgress, 5)
          : 1 - Math.pow(-2 * rawProgress + 2, 5) / 2;

        const currentVal = Math.floor(startValue + (endValue - startValue) * progress);
        setDisplayedPrice(currentVal);

        if (rawProgress < 1) {
          requestAnimationFrame(animatePrice);
        } else {
          setDisplayedPrice(endValue);
          setTriggerPricePulse(true);
          setTimeout(() => setTriggerPricePulse(false), 800);
        }
      };

      requestAnimationFrame(animatePrice);
    }
  }, [finalPrice]);

  useEffect(() => {
    if (!resumePayment) return;
    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token');
    if (isLoggedIn && currentEvent && !(currentEvent as any).isPaid && step === 'register') {
      setStep('payment');
    }
  }, [resumePayment, currentEvent, step]);

  useEffect(() => {
    if (step === 'loading') {
      setLoadingSubStep('spinning');
      const timerSpin = setTimeout(() => {
        setLoadingSubStep('verified');
        const timerSuccess = setTimeout(() => {
          setStep('payment');
        }, 1800);
        return () => clearTimeout(timerSuccess);
      }, 1200);
      return () => clearTimeout(timerSpin);
    }
  }, [step]);

  useEffect(() => {
    const handlePopState = () => {
      if (step === 'payment' || step === 'terms') {
        setStep('registration_confirmed');
        window.history.pushState(null, '', window.location.href);
      } else if (step === 'registration_confirmed') {
        setStep('register');
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner1 || !formData.partner2) {
        setRegisterError('אופס, שכחתם למלא את שמות שני בני הזוג');
        return;
    }
    if (!formData.eventDate) {
        setRegisterError('מתי החגיגה? בואו נבחר תאריך לאירוע');
        return;
    }
    setRegisterError('');
    setStep('registration_confirmed');
  };

  const handleDateSelect = (date: Date) => {
    if (!formData.partner1 || !formData.partner2) {
      setRegisterError('אנא מלאו את שמות בני הזוג לפני בחירת תאריך');
      setShowCalendar(false);
      return;
    }
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000));
    const dateString = adjustedDate.toISOString().split('T')[0];
    setFormData({...formData, eventDate: dateString});
    setShowCalendar(false);
    setRegisterError('');
    setStep('registration_confirmed');
  };

  const checkRateLimits = (phone: string) => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    const cleanPhone = phone.replace(/\D/g, '');

    const phoneHistoryStr = localStorage.getItem(OTP_PHONE_HISTORY) || '{}';
    const phoneHistory = JSON.parse(phoneHistoryStr);
    const phoneTimestamps: number[] = (phoneHistory[cleanPhone] || []).filter((t: number) => t > oneHourAgo);

    if (phoneTimestamps.length >= 3) {
      return "הגעת למכסה המקסימלית של קודים למספר זה בשעה האחרונה. נסה שוב מאוחר יותר.";
    }

    const ipHistoryStr = localStorage.getItem(OTP_IP_HISTORY) || '[]';
    const ipHistory: number[] = JSON.parse(ipHistoryStr);

    const recentIpTimestampsHour = ipHistory.filter(t => t > oneHourAgo);
    const recentIpTimestampsDay = ipHistory.filter(t => t > oneDayAgo);

    if (recentIpTimestampsHour.length >= 5) {
      return "מטעמי אבטחה, ניתן לשלוח עד 5 קודים בשעה מכתובת זו.";
    }

    if (recentIpTimestampsDay.length >= 10) {
      return "עברת את המכסה היומית לשליחת קודים. נסה שוב מחר.";
    }

    return null;
  };

  const recordOtpRequest = (phone: string) => {
    const now = Date.now();
    const cleanPhone = phone.replace(/\D/g, '');

    const phoneHistoryStr = localStorage.getItem(OTP_PHONE_HISTORY) || '{}';
    const phoneHistory = JSON.parse(phoneHistoryStr);
    const phoneTimestamps: number[] = (phoneHistory[cleanPhone] || []).filter((t: number) => t > (now - 3600000));
    phoneHistory[cleanPhone] = [...phoneTimestamps, now];
    localStorage.setItem(OTP_PHONE_HISTORY, JSON.stringify(phoneHistory));

    const ipHistoryStr = localStorage.getItem(OTP_IP_HISTORY) || '[]';
    const ipHistory: number[] = JSON.parse(ipHistoryStr).filter((t: number) => t > (now - 86400000));
    ipHistory.push(now);
    localStorage.setItem(OTP_IP_HISTORY, JSON.stringify(ipHistory));
  };

  const handleCardRevealContinue = async () => {
    setIsLoading(true);
    setRegisterError('');

    try {
      const response = await authApi.registerDirect({
        partnerName1: formData.partner1,
        partnerName2: formData.partner2,
        weddingDate: formData.eventDate,
        referralCode: refCodeFromUrl,
        packageName: currentPackage.hebrewName,
      });

      if (response.data) {
        login(response.data.token, response.data.user);
        if (response.data.event) {
          setCurrentEvent(response.data.event);
        }
        setStep('loading');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || '';
      setRegisterError(message || 'שגיאה בהרשמה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.otp.length !== 6) {
          setOtpError('קוד האימות חייב להכיל 6 ספרות');
          setIsOtpShaking(true);
          setTimeout(() => setIsOtpShaking(false), 500);
          return;
      }

      setOtpError('');
      setIsLoading(true);

      try {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        const response = await authApi.registerVerifyOtp({
          phoneNumber: cleanPhone,
          otp: formData.otp,
          partnerName1: formData.partner1,
          partnerName2: formData.partner2,
          weddingDate: formData.eventDate,
          packageName: currentPackage.hebrewName,
        });

        if (response.data) {
          login(response.data.token, response.data.user);
          if (response.data.event) {
            setCurrentEvent(response.data.event);
          }
          setShowOtpModal(false);
          setStep('loading');
        }
      } catch (err: any) {
        setOtpError(err.response?.data?.error || err.response?.data?.message || 'קוד לא תקין, בואו ננסה שוב');
        setIsOtpShaking(true);
        setTimeout(() => setIsOtpShaking(false), 500);
      } finally {
        setIsLoading(false);
      }
  }

  const handleResendOtp = async () => {
    if (isResendingOtp || otpCountdown > 0) return;

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const limitError = checkRateLimits(cleanPhone);
    if (limitError) {
      setOtpError(limitError);
      return;
    }

    setIsResendingOtp(true);
    setOtpError('');

    try {
      const response = await authApi.registerSendOtp({ phoneNumber: cleanPhone, referralCode: refCodeFromUrl });
      if (response.data?.message?.includes('OTP:')) {
        setMockOtpMessage(response.data.message);
      }
      setFormData(prev => ({ ...prev, otp: '' }));
      setOtpCountdown(60);
      recordOtpRequest(cleanPhone);
      setShowResendFeedback(true);
      setTimeout(() => setShowResendFeedback(false), 2000);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || err.response?.data?.message || 'שגיאה בשליחת קוד חדש');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleGoogleAuth = () => {
    setShowGoogleModal(true);
  };

  const completeGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      setShowGoogleModal(false);
      setStep('loading');
    }, 2000);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedPaymentSubmit(true);

    const eventId = (currentEvent as any)?._id || (currentEvent as any)?.id;
    if (!eventId) {
        setPaymentError('שגיאה: לא נמצא אירוע. אנא נסו שוב.');
        return;
    }

    if (finalPrice <= 0 && isCouponApplied) {
        setIsLoading(true);
        setPaymentError('');
        try {
            const response = await paymentApi.payWithCoupon({
                eventId,
                couponCode: formData.coupon,
                amount: basePrice
            });
            if (response.success || response.data) {
                setPaymentConfirmed(true);
            } else {
                setPaymentError('שגיאה בתשלום עם הקופון');
            }
        } catch (err: any) {
            console.error('Payment with coupon failed:', err);
            setPaymentError(err.response?.data?.error || 'שגיאה בתשלום עם הקופון');
        } finally {
            setIsLoading(false);
        }
        return;
    }

    const cleanCard = paymentData.cardNumber.replace(/\D/g, '');
    const cleanCVV = paymentData.cvv.replace(/\D/g, '');
    const cleanID = paymentData.id.replace(/\D/g, '');
    const cleanExpiry = paymentData.expiry.replace(/\D/g, '');

    let errorMsg = '';
    if (!cleanCard || cleanCard.length < 16) errorMsg = 'מספר כרטיס לא תקין, אנא בדקו שוב';
    else if (!paymentData.expiry || cleanExpiry.length < 4 || expiryError) errorMsg = expiryError || 'תוקף כרטיס לא תקין';
    else if (!cleanCVV || cleanCVV.length < 3) errorMsg = 'קוד CVV חייב להכיל לפחות 3 ספרות';
    else if (!cleanID || cleanID.length < 9) errorMsg = 'מספר תעודת זהות חייב להכיל 9 ספרות';

    if (errorMsg) {
        setPaymentError(errorMsg);
        return;
    }

    setPaymentError('');
    setIsLoading(true);

    try {
        const createResponse = await paymentApi.create({
            eventId,
            amount: basePrice,
            couponCode: isCouponApplied ? formData.coupon : undefined
        });

        const { paymentId, publicKey, companyId } = createResponse.data || {};

        if (!paymentId || !publicKey || !companyId) {
            setPaymentError('שגיאה ביצירת תשלום. נסו שוב.');
            return;
        }

        const [expMonth, expYear] = paymentData.expiry.split('/');
        const fullYear = 2000 + parseInt(expYear, 10);

        const { token } = await tokenizeCard({
            companyId,
            publicKey,
            cardNumber: cleanCard,
            expirationMonth: parseInt(expMonth, 10),
            expirationYear: fullYear,
            cvv: cleanCVV,
            citizenId: cleanID,
        });

        const chargeResponse = await paymentApi.charge({ paymentId, token });

        if (chargeResponse.success || chargeResponse.data) {
            setPaymentConfirmed(true);
        } else {
            setPaymentError('התשלום נכשל. בדקו את פרטי הכרטיס ונסו שוב.');
        }
    } catch (err: any) {
        console.error('Sumit payment failed:', err);
        setPaymentError(err.response?.data?.error || err.message || 'שגיאה בעיבוד התשלום');
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartSumitRedirect = async () => {
    const evId = (currentEvent as any)?._id || (currentEvent as any)?.id;
    if (!evId) {
      setSumitRedirectError('שגיאה: לא נמצא אירוע');
      return;
    }
    setSumitRedirectStarting(true);
    setSumitRedirectError('');

    if (isCouponApplied && finalPrice <= 0) {
      try {
        const response = await paymentApi.payWithCoupon({
          eventId: evId,
          couponCode: formData.coupon,
          amount: basePrice,
        });
        if (response.success || response.data) {
          setPaymentConfirmed(true);
        } else {
          setSumitRedirectError('שגיאה בתשלום עם הקופון');
        }
      } catch (err: any) {
        setSumitRedirectError(err?.response?.data?.error || err?.message || 'שגיאה בתשלום עם הקופון');
      } finally {
        setSumitRedirectStarting(false);
      }
      return;
    }

    try {
      const createResponse = await paymentApi.create({
        eventId: evId,
        amount: basePrice,
        couponCode: isCouponApplied ? formData.coupon : undefined,
      });
      const paymentId = createResponse.data?.paymentId;
      if (!paymentId) {
        setSumitRedirectError('שגיאה ביצירת תשלום. נסו שוב.');
        return;
      }
      if (createResponse.data?.success && !createResponse.data?.publicKey) {
        setPaymentConfirmed(true);
        return;
      }
      setSumitRedirectPaymentId(paymentId);
    } catch (err: any) {
      setSumitRedirectError(err?.response?.data?.error || err?.message || 'שגיאה ביצירת תשלום');
    } finally {
      setSumitRedirectStarting(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join('-') || value;
    setPaymentData({...paymentData, cardNumber: formatted});
    if (paymentError) setPaymentError('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const cleanValue = value.replace(/\D/g, '');
      let formatted = cleanValue;
      let error = '';
      if (cleanValue.length >= 2) {
          const month = parseInt(cleanValue.substring(0, 2), 10);
          if (month < 1 || month > 12) error = 'חודש לא תקין';
      }
      if (cleanValue.length === 4) {
          const year = parseInt(cleanValue.substring(2, 4), 10);
          if (year < 25) error = 'נראה שהכרטיס פג תוקף';
      }
      if (cleanValue.length > 2) formatted = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
      else formatted = cleanValue;
      setExpiryError(error);
      setPaymentData({...paymentData, expiry: formatted});
      if (paymentError) setPaymentError('');
  };

  const handleCouponApply = async (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) e.preventDefault();
      if (!formData.coupon) return;
      setIsCouponLoading(true);
      setCouponError(false);

      try {
          const response = await couponApi.validate({ code: formData.coupon, packageName: currentPackage.hebrewName });
          const data = response.data;
          if (data?.valid && ((data.discountAmount && data.discountAmount > 0) || (data.discountPercent && data.discountPercent > 0))) {
              const fixed = data.discountAmount && data.discountAmount > 0 ? data.discountAmount : 0;
              const discountAmount = fixed > 0
                ? Math.min(fixed, basePrice)
                : Math.round((basePrice * (data.discountPercent || 0)) / 100 * 100) / 100;
              const newPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
              setFinalPrice(newPrice);
              setSavingsAmount(discountAmount);
              setIsCouponApplied(true);
          } else {
              setCouponError(true);
          }
      } catch (err: any) {
          console.error('Coupon validation failed:', err);
          setCouponError(true);
      } finally {
          setIsCouponLoading(false);
      }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingContact(true);
    setTimeout(() => {
        setIsSendingContact(false);
        setContactSuccess(true);
        setTimeout(() => {
            setShowContactModal(false);
            setContactSuccess(false);
            setContactData({ email: '', category: 'בעיה עם הקופון', message: '' });
        }, 2000);
    }, 1500);
  };

  const getFormattedDate = () => {
    if (!formData.eventDate) return '';
    const date = new Date(formData.eventDate);
    return date.toLocaleDateString('he-IL');
  };

  const getCoupleName = () => {
    if (formData.partner1 && formData.partner2) return `${formData.partner1} ו${formData.partner2}`;
    return formData.partner1 || formData.partner2 || 'זוג יקר';
  }

  const handleDotClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setStep('register');
    } else if (targetStep === 2 && (step === 'registration_confirmed' || step === 'payment')) {
      setStep('registration_confirmed');
    }
  }

  const handlePaymentComplete = () => {
    setNewUser(true);
    localStorage.setItem('show-welcome-popup', 'true');
    // The coupon-payment success path never refreshes currentEvent from the
    // server before getting here, so isPaid would still read false in the
    // store. Upload.tsx redirects back to /register?resumePayment=1 whenever
    // it sees isPaid === false, which is exactly the bug this fixes: without
    // this, a 100%-off coupon would bounce the user straight back to payment
    // with an "Event is already paid" error on the next attempt.
    if (currentEvent) {
      setCurrentEvent({ ...currentEvent, isPaid: true } as any);
    }
    navigate(ROUTES.UPLOAD);
  };

  const sheenStyles = `
    @keyframes sheen-slide {
      0% { left: 200%; opacity: 0; }
      5% { opacity: 1; }
      95% { opacity: 1; }
      100% { left: -100%; opacity: 0; }
    }
    .sheen-effect {
      position: absolute; top: 0; left: 200%; width: 50%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.4), transparent);
      transform: skewX(-25deg); pointer-events: none; z-index: 20;
    }
    .group:hover .sheen-effect, .animate-sheen-mobile .sheen-effect {
      animation: sheen-slide 0.7s ease-in-out forwards;
    }
    @keyframes slide-up-fade {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
        animation: slide-up-fade 0.4s ease-out forwards;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    .google-btn:hover .google-icon {
      transform: rotate(-15deg) scale(1.1);
    }
    @keyframes price-wow {
      0% { transform: scale(1); color: black; }
      40% { transform: scale(1.25); color: #16a34a; }
      100% { transform: scale(1); color: black; }
    }
    .animate-price-wow {
      animation: price-wow 0.8s ease-in-out;
    }
  `;

  const slideVariants = {
    initial: { x: 0, opacity: 1 },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <style>{sheenStyles}</style>
      <Navbar forceHome />

      <div className="flex-grow flex flex-col relative">
        <AnimatePresence mode="wait">

          {step === 'register' && (
            <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex flex-col justify-start pt-8 md:justify-center md:pt-16 md:pb-12 w-full relative"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
                    <div className="max-w-md lg:max-w-xl w-full space-y-10 animate-fade-in text-center">
                        <div className="space-y-4">
                            <h2 className="text-5xl lg:text-[78px] font-bold text-black tracking-tight font-rubik leading-tight">רישום לאתר</h2>
                            <p className="text-gray-500 text-lg lg:text-2xl">תאריך, שמות ומתקדמים</p>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="space-y-8 text-right" noValidate>
                            <div className="grid grid-cols-2 gap-6 text-right">
                                <div className="text-right">
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 text-right pr-[6px]">שם בן/בת הזוג</label>
                                    <input
                                    required
                                    type="text"
                                    placeholder="נועה"
                                    className={`w-full px-4 lg:px-6 py-4 lg:py-5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all text-lg ${
                                        registerError && !formData.partner1 ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-200 focus:border-gold-primary'
                                    }`}
                                    value={formData.partner1}
                                    onChange={e => {
                                        const val = e.target.value.replace(/^\s+/, '');
                                        setFormData({...formData, partner1: val});
                                        if(registerError) setRegisterError('');
                                    }}
                                    />
                                </div>
                                <div className="text-right">
                                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 text-right pr-[6px]">שם בן/בת הזוג</label>
                                    <input
                                    required
                                    type="text"
                                    placeholder="איתי"
                                    className={`w-full px-4 lg:px-6 py-4 lg:py-5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all text-lg ${
                                        registerError && !formData.partner2 ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-200 focus:border-gold-primary'
                                    }`}
                                    value={formData.partner2}
                                    onChange={e => {
                                        const val = e.target.value.replace(/^\s+/, '');
                                        setFormData({...formData, partner2: val});
                                        if(registerError) setRegisterError('');
                                    }}
                                    />
                                </div>
                            </div>
                            <div className="relative" ref={calendarRef}>
                                <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 pr-[5px]">תאריך האירוע</label>
                                <div
                                    className={`w-full px-4 lg:px-6 py-4 lg:py-5 rounded-2xl border bg-gray-50 hover:bg-white outline-none transition-all flex items-center justify-between cursor-pointer ${
                                        registerError && !formData.eventDate ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setShowCalendar(!showCalendar)}
                                >
                                    <span className={`text-lg ${formData.eventDate ? 'text-black font-bold' : 'text-gray-400'}`}>
                                    {formData.eventDate ? getFormattedDate() : 'שנה/חודש/יום'}
                                    </span>
                                    <CalendarIcon className="text-gray-400" size={24} />
                                </div>
                                {showCalendar && (
                                    <div className="absolute top-full right-0 mt-2 z-20 w-full flex justify-center sm:justify-start">
                                        <Calendar
                                            selected={formData.eventDate ? new Date(formData.eventDate) : undefined}
                                            onSelect={handleDateSelect}
                                        />
                                    </div>
                                )}
                            </div>
                            {registerError && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-slide-up">
                                    <p className="text-red-600 text-base font-medium text-center">
                                        {registerError}
                                    </p>
                                </div>
                            )}
                            <p className="text-gray-400 text-sm text-center">בחרו תאריך והמשיכו</p>
                        </form>
                    </div>
                </div>
                <ProgressDots step={1} onStepClick={handleDotClick} className="absolute bottom-6 left-0 right-0 w-full" />
            </motion.div>
          )}

          {step === 'registration_confirmed' && (
            <motion.div
                key="confirmed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex flex-col items-center justify-start pt-4 md:justify-center md:pt-0 px-4 pb-9 md:py-12 relative"
            >
                <BackgroundDecoration />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md lg:max-w-xl w-full text-center space-y-8 relative z-10"
                >
                    <div className="relative w-[92%] aspect-[4/5] max-w-sm mx-auto perspective-1000">
                        <motion.div
                            initial={{ rotateX: 20, y: 50, opacity: 0 }}
                            animate={{ rotateX: 0, y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, duration: 1.5 }}
                            className="w-full h-full bg-[#FAFAFA] rounded-xl shadow-2xl border border-gray-100 relative overflow-hidden flex flex-col items-center justify-center px-6 text-center"
                        >
                            <div className="absolute inset-4 border border-gold-primary/30 rounded-lg pointer-events-none" />
                            <div className="absolute inset-[19px] border border-gold-primary/30 rounded-lg pointer-events-none" />

                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center py-10">
                                <div className="flex flex-col items-center justify-center space-y-0">
                                    <motion.span
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                      className="font-serif text-[5.5rem] leading-[1] text-black font-medium tracking-tight block h-[5.5rem] flex items-center justify-center"
                                    >
                                      {formData.eventDate ? formData.eventDate.split('-')[2] : '31'}
                                    </motion.span>
                                    <motion.span
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                                      className="font-serif text-[5.5rem] leading-[1] text-black font-medium tracking-tight block h-[5.5rem] flex items-center justify-center"
                                    >
                                      {formData.eventDate ? formData.eventDate.split('-')[1] : '12'}
                                    </motion.span>
                                    <motion.span
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                                      className="font-serif text-[5.5rem] leading-[1] text-black font-medium tracking-tight block h-[5.5rem] flex items-center justify-center"
                                    >
                                      {formData.eventDate ? formData.eventDate.split('-')[0].slice(2) : '25'}
                                    </motion.span>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.5, duration: 1.0 }}
                                        className="flex items-center justify-center gap-2 sm:gap-3 w-full px-4"
                                    >
                                        <span className="font-bona text-2xl sm:text-3xl md:text-4xl text-black font-bold tracking-wide truncate">{formData.partner1}</span>
                                        <span className="font-cursive text-3xl sm:text-4xl md:text-5xl text-gold-primary font-normal translate-y-1 shrink-0">&</span>
                                        <span className="font-bona text-2xl sm:text-3xl md:text-4xl text-black font-bold tracking-wide truncate">{formData.partner2}</span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.8, duration: 1.0 }}
                                        className="font-serif text-sm text-gray-500 uppercase tracking-[0.15em] text-center"
                                    >
                                        The album
                                    </motion.div>
                                </div>
                            </div>

                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>
                        </motion.div>
                    </div>

                    <button
                    onClick={handleCardRevealContinue}
                    disabled={isLoading}
                    className={`
                        w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:brightness-105
                        text-white font-bold text-2xl lg:text-3xl py-7 rounded-2xl
                        shadow-2xl shadow-gold-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]
                        flex items-center justify-center gap-4 group relative overflow-hidden
                        ${triggerAutoShine ? 'animate-sheen-mobile' : ''}
                    `}
                    >
                    <div className="sheen-effect"></div>
                    {isLoading ? <Loader2 className="animate-spin relative z-10" size={32} /> : <><span className="relative z-10">המשך לתשלום</span><CreditCard size={32} className="relative z-10 group-hover:rotate-12 transition-transform" /></>}
                    </button>
                    {registerError && <p className="text-red-500 text-base font-medium text-center animate-fade-in">{registerError}</p>}
                    <div className="pt-4 flex justify-center">
                        <button
                            onClick={() => setStep('register')}
                            className="text-gold-primary font-bold text-base lg:text-lg flex items-center gap-2 hover:underline transition-all opacity-80 hover:opacity-100"
                        >
                            <RefreshCcw size={18} />
                            <span>לשינוי תאריך</span>
                        </button>
                    </div>
                </motion.div>
                <ProgressDots step={2} onStepClick={handleDotClick} className="absolute bottom-6 left-0 right-0 w-full" />
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
                key="loading"
                variants={slideVariants}
                initial="initial"
                exit="exit"
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl px-4"
            >
                <AnimatePresence mode="wait">
                    {loadingSubStep === 'spinning' ? (
                        <motion.div
                            key="spinning"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="w-full max-w-2xl bg-white p-10 md:p-16 rounded-[50px] shadow-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[450px]"
                        >
                            <InfinityRingsLoader size={180} />
                            <h3 className="text-3xl font-bold text-black animate-pulse mt-8">מאמת פרטים ומכין את האלבום...</h3>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="verified"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-2xl bg-white p-10 md:p-16 rounded-[50px] shadow-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[450px]"
                        >
                            <div className="relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20"
                                >
                                    <Check size={48} strokeWidth={3} />
                                </motion.div>
                            </div>
                            <h3 className="text-4xl font-black text-black tracking-tight text-center mt-8">הפרטים אומתו בהצלחה!</h3>
                            <p className="text-gray-400 text-lg mt-4 font-medium">מעבירים אתכם לתשלום מאובטח...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
          )}

          {step === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-grow flex flex-col bg-white min-h-screen"
            >
              <div className="max-w-4xl mx-auto px-6 py-12">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                        <ShieldCheck className="text-black" size={24} />
                     </div>
                     <h1 className="text-4xl font-bold tracking-tight">תנאי השימוש</h1>
                  </div>

                  <div className="prose prose-sm md:prose-base max-w-none text-gray-600 space-y-6 leading-relaxed">
                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">1. הסכמה לתנאים</h2>
                        <p>השימוש באתר ובשירות My Night (להלן: "השירות") מהווה הסכמה מלאה ובלתי חוזרת לכל התנאים המפורטים להלן.</p>
                     </section>

                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">2. תיאור השירות</h2>
                        <p>My Night מספקת פלטפורמה לאיסוף, ניהול והפצה של תמונות וסרטונים מאירועי חתונה. השירות כולל שימוש בטכנולוגיית זיהוי פנים (AI) לצורך שיוך תמונות לאורחים באופן אישי.</p>
                     </section>

                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">3. פרטיות וזיהוי פנים</h2>
                        <p>השימוש בזיהוי פנים נועד אך ורק לצורך שיפור חווית המשתמש והפצת התמונות לאורחים הרלוונטיים. My Night מתחייבת שלא למכור את נתוני זיהוי הפנים לצד ג'. התמונות נשמרות בשרתים מאובטחים לפרק זמן מוגבל המוגדר בחבילת השירות.</p>
                     </section>

                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">4. אחריות משתמש</h2>
                        <p>האחריות על תוכן התמונות והסרטונים המועלים לשירות חלה על המעלים בלבד. חל איסור מוחלט על העלאת תוכן פוגעני, לא חוקי או כזה המפר זכויות יוצרים של צד שלישי.</p>
                     </section>

                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">5. ביטול עסקה והחזרים</h2>
                        <p>מכיוון שהשירות הינו שירות דיגיטלי שהקמתו מתבצעת באופן מיידי עם התשלום, לא ניתן לבטל את העסקה לאחר רכישת החבילה, למעט במקרים חריגים ועל פי שיקול דעתה הבלעדי של החברה.</p>
                     </section>

                     <section>
                        <h2 className="text-xl font-bold text-black mb-2">6. הגבלת תוכן וזמן האירוע</h2>
                        <p>אין להעלות לאתר תמונות או סרטונים שאינם מיום האירוע או הבוק. הפרת סעיף זה עלולה לגרום לסגירת הגלריה באופן מיידי וללא החזר כספי.</p>
                     </section>
                  </div>

                  <button
                    onClick={() => setStep('payment')}
                    className="mt-12 flex items-center gap-2 text-black font-bold border-b-2 border-black pb-1 hover:text-gold-primary hover:border-gold-primary transition-colors"
                  >
                    <ArrowRight size={20} />
                    <span>חזרה לדף התשלום</span>
                  </button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-start px-4 pt-6 pb-12 relative bg-gray-50 min-h-screen"
            >
                {paymentConfirmed && (
                    <BuildingGalleryLoader
                        coupleNames={getCoupleName()}
                        eventDate={formData.eventDate}
                        onComplete={handlePaymentComplete}
                    />
                )}

                {showContactModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactModal(false)}></div>
                        <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 animate-fade-in shadow-2xl overflow-hidden">
                            <button onClick={() => setShowContactModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-black z-20"><X size={24} /></button>
                            {contactSuccess ? (
                                <div className="py-12 text-center animate-fade-in flex flex-col items-center">
                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4"><Check size={32} strokeWidth={3} /></div>
                                    <h3 className="text-2xl font-bold mb-2">נשלח בהצלחה!</h3>
                                    <p className="text-gray-500">נחזור אליך בקרוב מאוד</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-gold-primary/10 text-gold-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                           <OpeningGiftAnimation />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1 text-black">איך נוכל לעזור?</h3>
                                        <p className="text-sm text-gray-500">השאירו פרטים ונציג יחזור אליכם בנוגע לקופון</p>
                                    </div>
                                    <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                                        <input required type="email" placeholder="אימייל לחזרה" dir="ltr" className={`w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all ${contactData.email ? 'text-left' : 'text-right'}`} value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})} />
                                        <textarea required rows={3} placeholder="מה הבעיה עם הקופון?" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all text-right resize-none" value={contactData.message} onChange={(e) => setContactData({...contactData, message: e.target.value})} />
                                        <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-gray-800"><span>שליחה</span><Send size={18} /></button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <BackgroundDecoration />
                <div className="max-w-lg lg:max-w-2xl w-full bg-white rounded-[40px] shadow-xl px-10 pb-10 pt-6 lg:px-14 lg:pb-14 lg:pt-9 animate-fade-in relative z-10 mt-2">
                    {USE_SUMIT_IFRAME ? (
                      <div className="space-y-8">
                        <div className="text-center mb-6">
                          <h2 className="text-4xl font-bold text-black mb-3">תשלום מאובטח</h2>
                          <p className="text-gray-500 lg:text-xl">דף תשלום מאובטח של Sumit — פרטי הכרטיס לא נשמרים אצלנו</p>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 overflow-hidden text-right">
                          <div className="flex justify-between items-start mb-6">
                            <h3 className="font-black text-black text-2xl tracking-tight">החבילה {currentPackage.hebrewName}</h3>
                            <p className="text-4xl font-black text-black transition-all duration-300">₪{basePrice}</p>
                          </div>
                          <div className="space-y-4">
                            {currentPackage.features.map((feature, i) => (
                              <div key={i} className="flex items-center gap-3 justify-start text-gray-600 font-medium">
                                <Check size={18} className="text-black shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {!sumitRedirectPaymentId && (
                          <div className="space-y-6 text-right">
                            <label className="block text-sm font-bold text-gray-400 mb-2 pr-1">קוד קופון (אם יש)</label>
                            <div className="flex gap-4">
                              <div className="relative flex-grow">
                                <input type="text" placeholder="הכנס קוד" className={`w-full px-6 py-4 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all text-right text-lg ${couponError ? 'border-red-500' : 'border-gray-100 focus:border-black'}`} value={formData.coupon} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCouponApply(e as any))} onChange={e => { setFormData({...formData, coupon: e.target.value}); if (couponError) setCouponError(false); }} />
                              </div>
                              <button type="button" onClick={() => handleCouponApply()} disabled={isCouponLoading || !formData.coupon} className={`px-8 rounded-2xl font-bold text-lg shadow-lg relative overflow-hidden group min-w-[140px] flex items-center justify-center transition-all ${isCouponApplied ? 'bg-green-500 text-white' : (!formData.coupon ? 'bg-gray-200 text-gray-400' : 'bg-black text-white hover:bg-gray-800')}`}>
                                <span className="relative z-10 whitespace-nowrap flex items-center gap-2">{isCouponLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isCouponApplied ? <Check size={18} /> : 'הפעלת קופון')}</span>
                              </button>
                            </div>
                            {isCouponApplied && <p className="text-green-600 font-bold text-base animate-fade-in text-right px-1">חסכתם {savingsAmount} שקלים עם הקופון!</p>}
                            {couponError && !isCouponApplied && <p className="text-red-500 font-bold text-base animate-fade-in text-right px-1">אופס! הקופון לא עבר. שננסה שוב עם קוד אחר?</p>}
                            <div className="mt-8 flex justify-between items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                              <span className="font-bold text-gray-600 text-xl">סה"כ לתשלום:</span>
                              <span className="font-black text-4xl text-black">₪{displayedPrice}</span>
                            </div>
                          </div>
                        )}

                        {sumitRedirectError && <div className="text-red-500 text-base font-medium bg-red-50 p-4 rounded-xl text-center">{sumitRedirectError}</div>}

                        {sumitRedirectPaymentId ? (
                          <SumitHostedCheckout
                            paymentId={sumitRedirectPaymentId}
                            onFailure={(msg) => {
                              setSumitRedirectError(msg || 'התשלום לא הושלם');
                              setSumitRedirectPaymentId(null);
                            }}
                            className="min-h-[200px]"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartSumitRedirect}
                            disabled={sumitRedirectStarting}
                            className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold text-xl sm:text-2xl py-6 rounded-2xl shadow-lg flex items-center justify-center gap-3"
                          >
                            {sumitRedirectStarting ? <Loader2 className="animate-spin" /> : (
                              <>
                                <span className="whitespace-nowrap">המשך לתשלום מאובטח</span>
                                <Lock size={24} className="shrink-0" />
                              </>
                            )}
                          </button>
                        )}

                        <div className="flex flex-col items-center gap-1">
                          <div className="text-gray-400 text-xs font-bold">
                            בלחיצה על המשך אתם מסכימים{' '}
                            <button type="button" onClick={() => setStep('terms')} className="border-b border-gray-300 hover:text-black hover:border-black">לתנאי השימוש</button>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest pt-1">
                            <ShieldCheck size={12} className="text-green-500" />
                            <span>תשלום מאובטח על שרתי Sumit | PCI-DSS</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <form onSubmit={handlePaymentSubmit} className="space-y-8" noValidate>
                        <div className="text-center mb-10"><h2 className="text-4xl font-bold text-black mb-3">תשלום מאובטח</h2><p className="text-gray-500 lg:text-xl">פרטים אחרונים והאלבום החכם מוכן</p></div>
                        <div className="space-y-6 text-right">
                            <label className="block text-sm font-bold text-gray-400 mb-2 pr-1">מספר כרטיס אשראי</label>
                            <div className="relative">
                                <input required type="text" placeholder="4580-5566-7788-9900" className={`w-full px-6 py-5 pl-14 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all text-left text-xl ${attemptedPaymentSubmit && (paymentData.cardNumber.replace(/\D/g, '').length < 16) ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-100 focus:border-black'}`} dir="ltr" maxLength={19} value={paymentData.cardNumber} onChange={handleCardNumberChange} />
                                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 pr-1 text-right">תוקף</label>
                                    <input required type="text" placeholder="MM/YY" className={`w-full px-6 py-5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all text-center text-xl ${(expiryError || (attemptedPaymentSubmit && paymentData.expiry.length < 5)) ? 'ring-2 ring-red-500 border-red-500 text-red-500' : 'border-gray-100 focus:border-black'}`} dir="ltr" maxLength={5} value={paymentData.expiry} onChange={handleExpiryChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 pr-1 text-left">CVV</label>
                                    <input required type="text" placeholder="123" className={`w-full px-6 py-5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all text-center text-xl ${attemptedPaymentSubmit && (paymentData.cvv.replace(/\D/g, '').length < 3) ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-100 focus:border-black'}`} dir="ltr" maxLength={4} value={paymentData.cvv} onChange={e => { setPaymentData({...paymentData, cvv: e.target.value.replace(/\D/g, '')}); if (paymentError) setPaymentError(''); }} />
                                </div>
                            </div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 pr-1">תעודת זהות</label>
                            <input required type="text" placeholder="234567890" className={`w-full px-6 py-5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none transition-all text-left text-xl ${attemptedPaymentSubmit && (paymentData.id.replace(/\D/g, '').length < 9) ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-100 focus:border-black'}`} dir="ltr" maxLength={9} value={paymentData.id} onChange={e => { setPaymentData({...paymentData, id: e.target.value.replace(/\D/g, '')}); if (paymentError) setPaymentError(''); }} />
                        </div>
                        <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 mb-6 mt-10 overflow-hidden text-right">
                            <div className="flex justify-between items-start mb-6"><h3 className="font-black text-black text-2xl tracking-tight">החבילה {currentPackage.hebrewName}</h3><p className="text-4xl font-black text-black transition-all duration-300">₪{basePrice}</p></div>
                            <div className="space-y-4">
                                {currentPackage.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 justify-start text-gray-600 font-medium">
                                        <Check size={18} className="text-black shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6 text-right">
                            <label className="block text-sm font-bold text-gray-400 mb-2 pr-1">קוד קופון (אם יש)</label>
                            <div className="flex gap-4">
                                <div className="relative flex-grow">
                                    <input type="text" placeholder="הכנס קוד" className={`w-full px-6 py-4 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all text-right text-lg ${couponError ? 'border-red-500' : 'border-gray-100 focus:border-black'}`} value={formData.coupon} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCouponApply(e as any))} onChange={e => { setFormData({...formData, coupon: e.target.value}); if (couponError) setCouponError(false); }} />
                                </div>
                                <button type="button" onClick={() => handleCouponApply()} disabled={isCouponLoading || !formData.coupon} className={`px-8 rounded-2xl font-bold text-lg shadow-lg relative overflow-hidden group min-w-[140px] flex items-center justify-center transition-all ${isCouponApplied ? 'bg-green-500 text-white' : (!formData.coupon ? 'bg-gray-200 text-gray-400' : 'bg-black text-white hover:bg-gray-800')} ${triggerAutoShine && formData.coupon && !isCouponApplied ? 'animate-sheen-mobile' : ''}`}><div className="sheen-effect"></div><span className="relative z-10 whitespace-nowrap flex items-center gap-2">{isCouponLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isCouponApplied ? <><Check size={18} /></> : 'הפעלת קופון')}</span></button>
                            </div>
                            {isCouponApplied && <p className="text-green-600 font-bold text-base animate-fade-in text-right px-1">חסכתם {savingsAmount} שקלים עם הקופון!</p>}
                            {couponError && !isCouponApplied && <p className="text-red-500 font-bold text-base animate-fade-in text-right px-1">אופס! הקופון לא עבר. שננסה שוב עם קוד אחר?</p>}
                            {couponError && <div className="mt-2 flex items-center gap-2 animate-fade-in flex-row-reverse justify-end"><span className="text-base text-red-500 font-medium">הקופון לא זוהה. שננסה שוב?</span><button type="button" onClick={() => setShowContactModal(true)} className="text-base text-gray-500 underline hover:text-black flex items-center gap-1"><span>צור קשר</span><HelpCircle size={16} /> </button></div>}
                            <div className="mt-8 flex justify-between items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <span className="font-bold text-gray-600 text-xl">סה"כ לתשלום:</span>
                                <span className={`font-black text-4xl transition-colors duration-300 inline-block origin-center ${triggerPricePulse ? 'animate-price-wow' : 'text-black'}`}>
                                  ₪{displayedPrice}
                                </span>
                            </div>
                        </div>
                        {paymentError && <div className="text-red-500 text-base font-medium bg-red-50 p-4 rounded-xl text-center animate-fade-in">{paymentError}</div>}
                        <div className="pt-1 lg:pt-4 space-y-4">
                            <button type="submit" disabled={isLoading} className={`w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:brightness-105 text-white font-bold text-2xl lg:text-3xl py-6 rounded-2xl shadow-lg transition-all relative flex items-center justify-center overflow-hidden -translate-y-3 ${triggerAutoShine ? 'animate-sheen-mobile' : ''}`}><div className="sheen-effect"></div><div className="relative z-10 flex items-center justify-center w-full px-6">{isLoading ? <Loader2 className="animate-spin" /> : <div className="flex items-center justify-center gap-3"><span className="relative">הפעלת האלבום של {formData.partner1} ו{formData.partner2}</span><Lock size={24} className="shrink-0" /></div>}</div></button>
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-gray-400 text-xs font-bold transition-colors">
                                    בלחיצה על הפעלת האלבום אתם מסכימים{' '}
                                    <button type="button" onClick={() => setStep('terms')} className="border-b border-gray-300 hover:text-black hover:border-black transition-colors">לתנאי השימוש</button>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest pt-1">
                                    <ShieldCheck size={12} className="text-green-500" />
                                    <span>תשלום מאובטח | פתיחה מיידית</span>
                                </div>
                            </div>
                        </div>
                    </form>
                    )}
                </div>
                <ProgressDots step={3} onStepClick={handleDotClick} className="absolute bottom-6 left-0 right-0 w-full" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
