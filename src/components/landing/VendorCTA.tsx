import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

const VendorCTA: React.FC = () => {
  const [hsl] = useState({ h: 0, s: 0, l: 90 });
  const navigate = useNavigate();

  return (
    <section
      className="pt-[48px] pb-[45px] relative z-[250] transition-colors duration-300"
      dir="rtl"
      style={{ backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }}
    >
      <div className="absolute inset-0 pointer-events-none noise-bg opacity-20 z-0 mix-blend-overlay" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold font-['Assistant'] text-stone-900 mb-6 tracking-tight">
          אתם מהתחום? בואו ניתן לזוגות שלכם יותר
        </h2>
        <p className="text-lg md:text-xl text-stone-500 font-['Assistant'] font-light mb-10 max-w-3xl mx-auto leading-relaxed">
          צלמים, ספקים ובעלי אולמות – הצטרפו לתוכנית השותפים שלנו ותהנו מעמלות מתגמלות
          <br />
          ולקוחות מרוצים.
        </p>
        <button
          onClick={() => navigate(ROUTES.AFFILIATE_LOGIN)}
          className="bg-black hover:bg-stone-800 text-white font-['Assistant'] font-bold text-base md:text-[20px] py-3 md:py-4 px-6 md:px-10 rounded-xl inline-flex items-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
        >
          <span>להצטרפות לתוכנית השותפים</span>
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
};

export default VendorCTA;