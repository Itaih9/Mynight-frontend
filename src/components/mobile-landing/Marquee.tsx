import React, { useRef } from 'react';

const desktopItems = [
  "זיהוי פנים מאובטח",
  "אלבום חכם משותף",
  "הרגעים מהעיניים של האורחים",
  "זיהוי פנים מאובטח",
  "אלבום חכם משותף",
  "הלילה מהעיניים של האורחים"
];
const desktopTextArray = Array(12).fill(desktopItems).flat();

export const Marquee: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const renderMarqueeContent = () => (
    <div className="flex items-center">
      {desktopTextArray.map((item, i) => (
        <React.Fragment key={i}>
          <span className="mx-[5px]">{item}</span>
          <span>│</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
      <div ref={sectionRef} className="h-[52px] md:h-[80px] w-full bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] relative overflow-hidden flex items-center justify-center z-[300] shadow-[0_4px_12px_rgba(250,205,33,0.1)] -mt-[45px] md:mt-0">
        
        {/* Mobile Static Text */}
        <div className="md:hidden w-full h-full flex items-center justify-center text-white font-['Assistant'] font-bold text-xl tracking-wide select-none drop-shadow-sm" dir="rtl">
            <span className="mx-[5px]">אלבום חכם משותף</span>
            <span className="opacity-50 text-lg">||</span>
            <span className="mx-[5px]">זיהוי פנים מאובטח</span>
        </div>

        {/* Desktop Marquee */}
        <div className="hidden md:flex w-full h-full overflow-hidden relative items-center">
            <div 
              className="flex whitespace-nowrap text-white font-['Assistant'] font-bold text-2xl tracking-wide select-none drop-shadow-sm animate-marquee-rtl relative z-10" 
              dir="rtl"
              style={{ animationDuration: '40s', animationDelay: '0s' }}
            >
                {renderMarqueeContent()}
                {renderMarqueeContent()}
            </div>
        </div>
      </div>
  );
};