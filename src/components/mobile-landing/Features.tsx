import React, { useEffect, useRef } from 'react';
import { Zap, ShieldCheck, Smartphone } from 'lucide-react';
import { SplitText } from './SplitText'; 
import { HighlightEffect } from './utils/HighlightEffect';

// Standalone SVG replacement for MdAttachMoney
const MdAttachMoneyReplacement = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
  </svg>
);

export const Features: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headlineRef.current) {
      const effect = new HighlightEffect(headlineRef.current);
      return () => {
        if (typeof effect.resetChars === 'function') effect.resetChars();
      };
    }
  }, []);

  const features = [
    {
      icon: MdAttachMoneyReplacement,
      title: "הכי משתלם",
      description: "המחירים שלנו שוברי שוק.\nמצאתם שירות בפחות מMy Night?\nנשווה את המחיר."
    },
    {
      icon: ShieldCheck,
      title: "פרטיות מלאה",
      description: "כל המידע על האורחים נמחק מיד לאחר השימוש וכל אורח מקבל רק את התמונות שהוא מופיע בהן."
    },
    {
      icon: Smartphone,
      title: "אפס מאמץ",
      description: "אתם לא צריכים לרדוף אחרי אף אחד. המערכת עושה הכל אוטומטית ברקע."
    },
    {
      icon: Zap,
      title: "איכות מקורית",
      description: "תמונות וסרטונים באיכות המלאה (4K)\nבלי הכיווץ המעצבן של הווצאפ."
    }
  ];

  return (
    <section 
      id="features" 
      ref={sectionRef} 
      className="pt-[42px] pb-[36px] bg-[#FAFAFA] relative z-[250]" 
      dir="rtl"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .gradient-chars .char {
          background: linear-gradient(to bottom, #000 0%, #78716c 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          padding-bottom: 0.15em;
          margin-bottom: -0.15em;
        }
      `}} />

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex justify-center text-center mb-[32px] mt-0 w-full">
          <h2 
            ref={headlineRef}
            className="text-[63px] md:text-[97px] font-black font-['Assistant'] text-stone-900 flex flex-col items-center justify-center relative leading-[1.1] w-full"
          >
            <span className="whitespace-nowrap block text-center">
              <SplitText text="למה לבחור ב-" />
            </span>
            
            <span 
              className="gradient-chars block text-center" 
              dir="ltr"
            >
              <SplitText text="My Night" />
            </span>
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`group bg-white border border-stone-100 px-4 pt-6 text-center hover:border-[#FACD21] transition-all duration-300 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-3xl h-full ${
                idx >= 2 ? 'pb-[16px]' : 'pb-6'
              }`}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-200 flex items-center justify-center mb-3 text-stone-900 bg-stone-50/50 group-hover:border-[#FACD21] group-hover:text-[#FACD21] group-hover:bg-[#FACD21]/10 transition-colors duration-300 flex-shrink-0 aspect-square">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-bold font-['Assistant'] text-stone-900 mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-stone-500 font-['Assistant'] font-light leading-relaxed text-sm whitespace-pre-line">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};