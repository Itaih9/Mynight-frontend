import React from 'react';
import { CelebrationButton } from './CelebrationButton';

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" strokeWidth="inherit" />
    <circle cx="12" cy="12" r="3" strokeWidth="inherit" />
  </svg>
);

interface GiantCTAProps {
  onClick: () => void;
}

export const GiantCTA: React.FC<GiantCTAProps> = ({ onClick }) => {
  return (
      <section className="py-10 bg-[#FAFAFA] flex justify-center items-center relative z-[250]">
        <div className="max-w-[1400px] w-full px-10 flex justify-center">
            <CelebrationButton 
                onClick={onClick} 
                label="איך זה נראה" 
                sheenDuration="1.7s"
                className="w-auto flex justify-center" 
                buttonClassName="!text-[91px] md:text-[163px] lg:text-[198px] font-['Assistant'] font-black !gap-[32px] py-3 md:py-6 px-[46px] md:px-[78px] w-auto max-w-none tracking-[0.05em] [-webkit-text-stroke:3px_white] !from-[#616161] !to-[#0f0f0f] !shadow-none !rounded-t-none !rounded-b-[29px] md:!rounded-b-[69px]" 
                Icon={Eye} 
            />
        </div>
      </section>
  );
};