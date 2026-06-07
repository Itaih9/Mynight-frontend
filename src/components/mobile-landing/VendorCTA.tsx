import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { ArrowLeft } from 'lucide-react';

export const VendorCTA: React.FC = () => {
  const navigate = useNavigate();
  const [hsl] = useState({ h: 0, s: 0, l: 90 });
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <div className="relative z-[250] overflow-hidden">
      {/* Background fillers for corners - ensuring they cover the area behind the rounded section */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#FAFAFA] -z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white -z-10" />

      <section 
        id="vendor-cta"
        ref={sectionRef}
        className="pb-[25px] pt-[35px] mt-0 relative z-[250] transition-colors duration-300 rounded-[40px]" 
        dir="rtl"
        style={{ backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }}
      >
        {/* Noise Overlay */}
        <div className="absolute inset-0 pointer-events-none noise-bg opacity-20 z-0 mix-blend-overlay" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-[35px] md:text-[53px] font-extrabold font-['Assistant'] text-stone-900 tracking-tight mb-[12px] leading-[0.96]">
            אתם מהתחום? בואו ניתן לזוגות שלכם יותר
          </h2>
          <p className="text-lg md:text-xl text-stone-500 font-['Assistant'] font-extralight max-w-3xl mx-auto leading-relaxed pt-0 mb-[25px]">
          צלמים, ספקים ובעלי אולמות – הצטרפו לתוכנית השותפים שלנו ותהנו מעמלות מתגמלות
          <br />
          ולקוחות מרוצים.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => navigate(ROUTES.AFFILIATE_LOGIN)}
            className="bg-black hover:bg-stone-800 text-white font-['Assistant'] font-bold text-[20px] py-4 px-10 rounded-xl inline-flex items-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <span className="whitespace-nowrap">להצטרפות לתוכנית השותפים</span>
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      </section>
  </div>
);
}