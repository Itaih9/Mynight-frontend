import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import { CelebrationButton } from '@/components/common/CelebrationButton';
import { affiliateApi } from '@/services/api/affiliate.api';
import { useAffiliateStore } from '@/store/affiliateStore';

const AffiliateLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [triggerAutoShine, setTriggerAutoShine] = useState(false);

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

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  const handleRegister = () => {
    navigate(ROUTES.AFFILIATE);
  };

  const [isLoading, setIsLoading] = useState(false);
  const affiliateStore = useAffiliateStore();

  useEffect(() => {
    if (affiliateStore.token && affiliateStore.affiliate) {
      navigate(ROUTES.AFFILIATE_DASHBOARD, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.includes('@')) {
      setError('כתובת אימייל לא תקינה');
      return;
    }
    if (formData.password.length < 4) {
      setError('סיסמה קצרה מדי');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await affiliateApi.login({
        email: formData.email,
        password: formData.password,
      });
      if (response.success && response.data) {
        affiliateStore.login(response.data.token, response.data.affiliate);
        navigate(ROUTES.AFFILIATE_DASHBOARD);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'שגיאה בהתחברות';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const DiamondIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9Z"/>
      <path d="M11 3 8 9l4 13 4-13-3-6"/>
      <path d="M2 9h20"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <style>{`
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
      `}</style>

      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md space-y-6 text-center">

            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <DiamondIcon />
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                    כניסת שותפים
                </h2>
                <p className="text-gray-500 text-sm">התחברו לממשק הניהול שלכם</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                <div className="relative">
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({...formData, email: e.target.value});
                            if(error) setError('');
                        }}
                        placeholder="אימייל"
                        className={`w-full text-right px-4 pl-12 py-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition-none placeholder-gray-300 ${
                            error && error.includes('אימייל') ? 'border-red-500 text-red-500' : 'border-gray-100 focus:border-black text-black'
                        }`}
                        dir="auto"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                </div>

                <div className="relative">
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({...formData, password: e.target.value});
                            if(error) setError('');
                        }}
                        placeholder="סיסמה"
                        className={`w-full text-right px-4 pl-12 py-4 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition-none placeholder-gray-300 ${
                            error && error.includes('סיסמה') ? 'border-red-500 text-red-500' : 'border-gray-100 focus:border-black text-black'
                        }`}
                        dir="auto"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-medium bg-red-50 py-2 px-4 rounded-lg inline-block w-full">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                        w-full bg-black text-white py-5 rounded-xl text-xl font-medium
                        hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 mt-4
                        group relative overflow-hidden
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        ${triggerAutoShine ? 'animate-sheen-mobile' : ''}
                    `}
                >
                    <div className="sheen-effect"></div>
                    <span className="relative z-10">{isLoading ? 'מתחבר...' : 'כניסה למערכת'}</span>
                </button>
            </form>

            <div className="w-full flex items-center justify-center gap-4 relative py-2">
                <div className="h-px bg-gray-100 flex-grow"></div>
                <span className="text-gray-400 text-sm bg-white px-2">עדיין לא שותפים שלנו?</span>
                <div className="h-px bg-gray-100 flex-grow"></div>
            </div>

            <CelebrationButton
                onClick={handleRegister}
                label="הרשמה לתכנית השותפים"
                fullWidth={true}
            />

            <button
                onClick={handleBack}
                className="text-gray-400 hover:text-black transition-colors text-sm font-medium flex items-center justify-center gap-2 mt-4 mx-auto"
            >
                <ArrowRight size={16} />
                חזרה לדף הבית
            </button>

        </div>
      </div>
    </div>
  );
};

export default AffiliateLogin;
