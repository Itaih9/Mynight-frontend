import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Navbar } from '@/components/common';

type Choice = 'self' | 'gift';

/**
 * The new first step of registration: is the package for the couple themselves
 * ("עבורי", default) or a gift ("כמתנה")? A sliding pill toggle picks, then
 * routes to the normal register flow or the gift flow.
 */
export const GiftChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [choice, setChoice] = useState<Choice>('self');

  const proceed = () => {
    // Forward any package/price params to the register flow so package-specific
    // CTAs keep their selection; the gift flow picks its own.
    navigate(choice === 'gift' ? ROUTES.GIFT : `${ROUTES.REGISTER}${location.search}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">החבילה עבור:</h1>
          <p className="text-gray-500 text-lg mb-10">בחרו למי מיועדת החבילה</p>

          {/* Sliding pill toggle */}
          <div className="relative flex bg-gray-100 rounded-full p-1.5 mb-10 select-none">
            <span
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-md transition-transform duration-300 ease-out"
              style={{ transform: choice === 'self' ? 'translateX(0)' : 'translateX(-100%)' }}
              aria-hidden="true"
            />
            <button
              onClick={() => setChoice('self')}
              className={`relative z-10 flex-1 py-4 rounded-full text-lg font-bold transition-colors ${choice === 'self' ? 'text-black' : 'text-gray-400'}`}
            >
              עבורי
            </button>
            <button
              onClick={() => setChoice('gift')}
              className={`relative z-10 flex-1 py-4 rounded-full text-lg font-bold transition-colors ${choice === 'gift' ? 'text-black' : 'text-gray-400'}`}
            >
              כמתנה 🎁
            </button>
          </div>

          <button
            onClick={proceed}
            className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold text-xl py-5 rounded-2xl shadow-xl hover:brightness-105 active:scale-[0.98] transition-all"
          >
            המשך
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftChoice;
