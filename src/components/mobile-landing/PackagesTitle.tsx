import React from 'react';

export const PackagesTitle: React.FC = () => (
  <div className="relative z-10">
    <h2
      className="text-[12vw] md:text-[104px] font-black leading-none whitespace-nowrap text-stone-800"
      style={{ fontFamily: "'Assistant', sans-serif" }}
    >
      החבילות שלנו
    </h2>
    <p
      className="font-['Assistant'] text-stone-500 font-light text-xl md:text-2xl mt-4 tracking-wide opacity-90"
      style={{ maxWidth: '800px', margin: '0 auto 0' }}
    >
      בחרו את הדרך המושלמת לחבר את <span className="whitespace-nowrap">הרגעים המיוחדים</span>
    </p>
  </div>
);
