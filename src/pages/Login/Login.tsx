import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, Lock, X, Loader2, CheckCircle, ArrowLeft, Smartphone, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar, CelebrationButton, VerificationButton } from '@/components/common';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, setCurrentEvent, token } = useUserStore();

  const [view, setView] = useState<'phone' | 'otp' | 'password'>('password');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [triggerAutoShine, setTriggerAutoShine] = useState(false);
  const [isOtpShaking, setIsOtpShaking] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [mockOtpMessage, setMockOtpMessage] = useState('');

  useEffect(() => {
    if (token) {
      navigate(ROUTES.UPLOAD);
    }
  }, [token, navigate]);

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
    if (otpCountdown > 0) {
      timer = window.setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const formatPhone = (value: string) => {
    let val = value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
    return val;
  };

  const getCleanPhone = () => phone.replace(/\D/g, '');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = getCleanPhone();
    if (cleanPhone.length !== 10) {
      setError('מספר טלפון לא תקין');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.loginSendOtp({ phoneNumber: cleanPhone });
      if (response.data?.message?.includes('OTP:')) {
        setMockOtpMessage(response.data.message);
      }
      setView('otp');
      setOtpCountdown(60);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || '';
      if (status === 429) {
        setError(message || 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.');
      } else if (message.includes('not found') || message.includes('register')) {
        setError('מספר זה לא רשום במערכת. רוצים להירשם?');
      } else {
        setError('שגיאה בשליחת קוד האימות');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('קוד האימות חייב להכיל 6 ספרות');
      setIsOtpShaking(true);
      setTimeout(() => setIsOtpShaking(false), 500);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.loginVerifyOtp({
        phoneNumber: getCleanPhone(),
        otp
      });

      if (response.data) {
        if (response.data.event) {
          login(response.data.token, response.data.user);
          setCurrentEvent(response.data.event);
          navigate(ROUTES.UPLOAD);
        } else {
          // Do NOT call login() here: setting the token would trigger the
          // auto-redirect-to-/upload effect and strand the user on a broken
          // dashboard. Surface the error and keep them on the login screen.
          setError('לא נמצא אירוע המשויך לחשבון זה. אנא פנו לתמיכה.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'קוד לא תקין');
      setIsOtpShaking(true);
      setTimeout(() => setIsOtpShaking(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResendingOtp || otpCountdown > 0) return;

    setIsResendingOtp(true);
    setError('');

    try {
      const response = await authApi.loginSendOtp({ phoneNumber: getCleanPhone() });
      if (response.data?.message?.includes('OTP:')) {
        setMockOtpMessage(response.data.message);
      }
      setOtp('');
      setOtpCountdown(60);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || '';
      if (status === 429) {
        setError(message || 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.');
      } else {
        setError(message || 'שגיאה בשליחת קוד חדש');
      }
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = getCleanPhone();
    const hasPhone = cleanPhone.length > 0;
    const hasEmail = loginEmail.trim().length > 0;
    if (!hasPhone && !hasEmail) {
      setError('יש להזין מספר טלפון או אימייל');
      return;
    }
    if (hasPhone && cleanPhone.length !== 10) {
      setError('מספר טלפון לא תקין');
      return;
    }
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setError('אופס! נסו להכניס את המייל או מספר הטלפון בשנית.');
      return;
    }
    if (!password) {
      setError('יש להזין סיסמה');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const loginData: any = { password };
      if (hasEmail) {
        loginData.email = loginEmail.trim();
      } else {
        loginData.phoneNumber = cleanPhone;
      }
      const response = await authApi.loginWithPassword(loginData);

      if (response.data) {
        if (response.data.event) {
          login(response.data.token, response.data.user);
          setCurrentEvent(response.data.event);
          navigate(ROUTES.UPLOAD);
        } else {
          // Do NOT call login() here: setting the token would trigger the
          // auto-redirect-to-/upload effect and strand the user on a broken
          // dashboard. Surface the error and keep them on the login screen.
          setError('לא נמצא אירוע המשויך לחשבון זה. אנא פנו לתמיכה.');
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || '';
      if (message.toLowerCase().includes('invalid email')) {
        setError('אופס! נסו להכניס את המייל או מספר הטלפון בשנית.');
      } else if (message.includes('not found') || message.includes('register')) {
        setError(loginEmail ? 'אימייל זה לא רשום במערכת' : 'מספר זה לא רשום במערכת');
      } else if (message.includes('No password set')) {
        setError('לא הוגדרה סיסמה לחשבון זה. השתמשו בכניסה עם קוד אימות');
      } else if (message.includes('Invalid password')) {
        setError('סיסמה שגויה');
      } else {
        setError(message || 'שגיאה בכניסה');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
  `;

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <style>{sheenStyles}</style>
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md lg:max-w-xl space-y-10 animate-fade-in text-center">

          <AnimatePresence mode="wait">
            {view === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex flex-col items-center gap-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <Phone size={40} className="text-black" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight font-rubik">כניסת זוגות</h2>
                    <p className="text-gray-500 text-lg lg:text-2xl">הזינו את מספר הטלפון לקבלת קוד</p>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-6 text-right mt-8">
                  <div>
                    <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2 pr-1">מספר טלפון</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(formatPhone(e.target.value));
                        if (error) setError('');
                      }}
                      placeholder="050-0000000"
                      className="w-full text-center text-3xl font-medium tracking-widest py-5 border rounded-2xl bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
                      dir="ltr"
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-base font-medium bg-red-50 py-3 px-6 rounded-2xl text-center animate-fade-in">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-800 transition-all shadow-lg group relative overflow-hidden flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <div className="sheen-effect"></div>
                        <span className="relative z-10">שליחת קוד אימות</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-6 py-4 mt-6">
                  <div className="h-px bg-gray-100 flex-grow"></div>
                  <span className="text-gray-400 text-base lg:text-lg whitespace-nowrap">עדיין אין לכם משתמש?</span>
                  <div className="h-px bg-gray-100 flex-grow"></div>
                </div>

                <CelebrationButton onClick={() => navigate(ROUTES.START)} label="הרשמה לאלבום חכם" fullWidth={true} className="lg:py-8 lg:text-3xl" />

                <button
                  type="button"
                  onClick={() => { setView('password'); setError(''); }}
                  className="text-gray-400 hover:text-black transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto mt-4"
                >
                  <KeyRound size={16} />
                  <span>כניסה עם סיסמה</span>
                </button>
              </motion.div>
            )}

            {view === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center gap-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <Lock size={40} className="text-black" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight font-rubik">כניסה עם סיסמה</h2>
                    <p className="text-gray-500 text-lg lg:text-2xl">הזינו מספר טלפון או אימייל וסיסמה</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-6 text-right mt-8">
                  <div>
                    <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2 pr-1">טלפון או אימייל</label>
                    <input
                      type="text"
                      value={loginEmail || phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[\d\-\s+()]*$/.test(val)) {
                          setPhone(formatPhone(val));
                          setLoginEmail('');
                        } else {
                          setLoginEmail(val);
                          setPhone('');
                        }
                        if (error) setError('');
                      }}
                      placeholder="050-0000000 / name@example.com"
                      className="w-full text-center text-2xl font-medium tracking-wide py-5 border rounded-2xl bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2 pr-1">סיסמה</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="הזינו סיסמה"
                        className="w-full text-center text-2xl font-medium py-5 border rounded-2xl bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-base font-medium bg-red-50 py-3 px-6 rounded-2xl text-center animate-fade-in">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-800 transition-all shadow-lg group relative overflow-hidden flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <div className="sheen-effect"></div>
                        <span className="relative z-10">כניסה</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-6 py-4 mt-6">
                  <div className="h-px bg-gray-100 flex-grow"></div>
                  <span className="text-gray-400 text-base lg:text-lg whitespace-nowrap">עדיין אין לכם משתמש?</span>
                  <div className="h-px bg-gray-100 flex-grow"></div>
                </div>

                <CelebrationButton onClick={() => navigate(ROUTES.START)} label="הרשמה לאלבום חכם" fullWidth={true} className="lg:py-8 lg:text-3xl" />

                <button
                  type="button"
                  onClick={() => { setView('phone'); setError(''); setPassword(''); }}
                  className="text-gray-400 hover:text-black transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto mt-4"
                >
                  <Phone size={16} />
                  <span>כניסה עם קוד אימות</span>
                </button>
              </motion.div>
            )}

            {view === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-col items-center gap-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
                    <Smartphone size={40} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">הזינו קוד אימות</h2>
                    <p className="text-gray-500 text-lg lg:text-2xl">שלחנו קוד לנייד {phone}</p>
                    {mockOtpMessage && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-base font-mono">
                        {mockOtpMessage}
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className={`w-full text-center text-5xl tracking-[0.5em] font-mono py-6 border rounded-2xl bg-gray-50 focus:bg-white focus:border-black outline-none ${isOtpShaking ? 'animate-shake border-red-500' : ''}`}
                    autoFocus
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                  />

                  <div className="h-14 mb-[-4px] text-center flex flex-col items-center justify-start gap-1">
                    {error && <p className="text-red-500 text-base font-medium">{error}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpCountdown > 0 || isResendingOtp}
                        className={`text-sm transition-colors underline cursor-pointer flex items-center gap-2 ${otpCountdown > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-black'}`}
                      >
                        {isResendingOtp && <Loader2 size={12} className="animate-spin" />}
                        <span>לא קיבלתם קוד? שלח שוב</span>
                      </button>
                      {otpCountdown > 0 && (
                        <span className="text-gray-400 text-sm">{formatCountdown(otpCountdown)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-6 rounded-2xl font-bold text-2xl shadow-lg flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'אימות וכניסה'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setView('phone');
                      setOtp('');
                      setError('');
                    }}
                    className="text-gray-400 text-lg flex items-center justify-center gap-2 mx-auto hover:text-black"
                  >
                    <ArrowRight size={20} /> חזרה להזנת טלפון
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="text-gray-400 hover:text-black transition-colors text-lg font-medium flex items-center justify-center gap-3 mx-auto mt-6"
          >
            <ArrowLeft size={24} /> חזרה לדף הבית
          </button>

        </div>
      </div>
    </div>
  );
};

export default Login;
