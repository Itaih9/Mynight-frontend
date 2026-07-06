import React, { useState } from 'react';
import { ArrowRight, Loader2, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/common';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/services/api';

/**
 * Couple gallery login — a stripped-down copy of the user login screen with only
 * the identifier field (phone number or email), no OTP/password. Logs into the
 * couple's own gallery (gallery-scoped session, no event-management access).
 */
export const GalleryLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, setCurrentEvent } = useUserStore();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError('יש להזין מספר טלפון או אימייל');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.galleryLogin({ identifier: value });
      if (response.data) {
        login(response.data.token, response.data.user);
        if (response.data.event) setCurrentEvent(response.data.event);
        navigate(ROUTES.GALLERY, { replace: true });
      }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || '';
      const lower = message.toLowerCase();
      if (status === 429) {
        setError(message || 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.');
      } else if (lower.includes('does not exist')) {
        // Route missing (endpoint not deployed) — not a details problem.
        setError('השירות אינו זמין כרגע. נסו שוב מאוחר יותר.');
      } else if (status === 404 || lower.includes('not found')) {
        setError('הפרטים לא נמצאו במערכת. בדקו את מספר הטלפון או האימייל.');
      } else {
        setError('שגיאה בכניסה. נסו שוב.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <Navbar />

      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md lg:max-w-xl space-y-10 animate-fade-in text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center gap-8">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <Images size={40} className="text-black" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight font-rubik">כניסה לגלריה</h2>
                <p className="text-gray-500 text-lg lg:text-2xl">הזינו מספר טלפון או אימייל</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-right mt-8">
              <div>
                <label className="block text-base lg:text-lg font-medium text-gray-700 mb-2 pr-1">טלפון או אימייל</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="050-0000000 / name@example.com"
                  className="w-full text-center text-2xl font-medium tracking-wide py-5 border rounded-2xl bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
                  dir="ltr"
                  autoFocus
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
                className="w-full bg-black text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'כניסה לגלריה'}
              </button>
            </form>
          </motion.div>

          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="text-gray-400 hover:text-black transition-colors text-lg font-medium flex items-center justify-center gap-3 mx-auto mt-6"
          >
            <ArrowRight size={24} /> חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryLogin;
