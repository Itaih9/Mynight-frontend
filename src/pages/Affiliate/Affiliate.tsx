import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Mail, Phone, Lock, ShoppingBag, Share2, Check, ChevronDown, Camera, Scissors, Paintbrush, Building, UserCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import { affiliateApi } from '@/services/api/affiliate.api';

const Affiliate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    category: '',
    intent: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = [
    { id: 'photographer', label: 'צלם', icon: <Camera size={18} /> },
    { id: 'makeup', label: 'מאפרת/מעצבת שיער', icon: <Paintbrush size={18} /> },
    { id: 'costume', label: 'מעצב/ת תלבושות', icon: <Scissors size={18} /> },
    { id: 'manager', label: 'מנהל חתונות', icon: <UserCircle size={18} /> },
    { id: 'venue', label: 'אולם אירועים', icon: <Building size={18} /> },
    { id: 'other', label: 'אחר', icon: null }
  ];

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length > 3) {
      val = val.slice(0, 3) + '-' + val.slice(3);
    }
    setFormData({ ...formData, phone: val });
    if (errors.phone) setErrors({ ...errors, phone: '' });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
    if (errors.email) setErrors({ ...errors, email: '' });
  };

  const validateEmailFormat = (email: string) => {
    const allowedCharsRegex = /^[a-zA-Z0-9@.\-_+]*$/;
    const structureRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!allowedCharsRegex.test(email) || !structureRegex.test(email) || !email.includes('@')) {
      return false;
    }
    return true;
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmailFormat(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'המייל לא תקין, שננסה שוב?' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!validateEmailFormat(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'המייל לא תקין, שננסה שוב?' }));
      hasError = true;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'מספר טלפון לא תקין' }));
      hasError = true;
    }

    if (formData.password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'סיסמה חייבת להכיל לפחות 6 תווים' }));
      hasError = true;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'הסיסמאות אינן תואמות' }));
      hasError = true;
    }

    if (hasError || !formData.category || !formData.intent) return;

    setIsLoading(true);
    try {
      await affiliateApi.register({
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        category: formData.category,
        intent: formData.intent,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'שגיאה בהרשמה, נסו שוב';
      setErrors(prev => ({ ...prev, email: message }));
    } finally {
      setIsLoading(false);
    }
  };

  const sheenStyles = `
    @keyframes icon-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15) translateY(-2px); }
    }
    .animate-icon {
      animation: icon-bounce 2s ease-in-out infinite;
    }
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
    .group:hover .sheen-effect {
      animation: sheen-slide 0.7s ease-in-out forwards;
    }
  `;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold mb-4">תודה שהצטרפתם!</h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
            הפרטים שלכם התקבלו בהצלחה. נציג מטעמנו יחזור אליכם בהקדם כדי להתחיל את שיתוף הפעולה.
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold transition-all hover:bg-gray-800"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{sheenStyles}</style>
      <Navbar />

      <div className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 animate-fade-in">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-black mb-2">רישום ספקים ושותפים</h2>
            <p className="text-gray-500">תנו עוד לזוגות שלכם ותרוויחו יותר</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">אימייל</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    placeholder="name@example.com"
                    className={`w-full px-4 py-3 pl-10 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all text-left dir-ltr
                      ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-100 focus:border-black'}
                    `}
                    value={formData.email}
                    onBlur={handleEmailBlur}
                    onChange={handleEmailChange}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 mr-1 font-medium animate-fade-in">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">מספר טלפון</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    placeholder="050-0000000"
                    className={`w-full px-4 py-3 pl-10 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all text-left dir-ltr
                      ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-100 focus:border-black'}
                    `}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1 mr-1 font-medium animate-fade-in">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">סיסמה</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="לפחות 6 תווים"
                    className={`w-full px-4 py-3 pl-16 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all text-left dir-ltr
                      ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-100 focus:border-black'}
                    `}
                    value={formData.password}
                    onChange={e => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 mr-1 font-medium animate-fade-in">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">אימות סיסמה</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="הזינו שוב את הסיסמה"
                    className={`w-full px-4 py-3 pl-16 rounded-xl border bg-gray-50 focus:bg-white outline-none transition-all text-left dir-ltr
                      ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-100 focus:border-black'}
                    `}
                    value={formData.confirmPassword}
                    onChange={e => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 mr-1 font-medium animate-fade-in">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">קטגוריית עסק</label>
              <div className="relative">
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="" disabled>בחרו קטגוריה</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 mr-1">אני מעוניין ב:</label>
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, intent: 'resell' })}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right group ${
                    formData.intent === 'resell'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    formData.intent === 'resell' ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <ShoppingBag className={`transition-all ${formData.intent === 'resell' ? 'animate-icon text-white' : 'text-black group-hover:scale-110'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-base md:text-lg whitespace-nowrap">לרכוש חבילה ולמכור בעצמי</p>
                    <p className={`text-sm ${formData.intent === 'resell' ? 'text-gray-300' : 'text-gray-400'}`}>
                      ניהול מלא של המכירה והקשר מול הזוגות
                    </p>
                  </div>
                  {formData.intent === 'resell' && <Check className="mr-auto text-white" size={24} />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, intent: 'affiliate' })}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right group ${
                    formData.intent === 'affiliate'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    formData.intent === 'affiliate' ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <Share2 className={`transition-all ${formData.intent === 'affiliate' ? 'animate-icon text-white' : 'text-black group-hover:scale-110'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-base md:text-lg whitespace-nowrap">לשווק ולהרוויח על כל זוג</p>
                    <p className={`text-sm ${formData.intent === 'affiliate' ? 'text-gray-300' : 'text-gray-400'}`}>
                      קבלת עמלה על כל זוג שנרשם דרככם
                    </p>
                  </div>
                  {formData.intent === 'affiliate' && <Check className="mr-auto text-white" size={24} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.category || !formData.intent}
              className={`
                w-full bg-black text-white font-bold text-xl py-5 rounded-2xl shadow-lg transition-all relative overflow-hidden group
                ${(isLoading || !formData.category || !formData.intent) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}
              `}
            >
              <div className="sheen-effect"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : 'להצטרפות לתכנית השותפים'}
              </span>
            </button>
          </form>

          <button
            onClick={handleBack}
            className="mt-8 text-gray-400 hover:text-black transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default Affiliate;
