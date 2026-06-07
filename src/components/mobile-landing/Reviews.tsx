import React, { useState, useEffect } from 'react';

// Revised bottom line: 5% less saturation and 3px higher
const DateHighlight = ({ dateText }: { dateText: string }) => {
  return (
    <span
      style={{ 
        color: '#7573BA', 
        transform: 'translateY(-3px)' 
      }}
      className="inline-block font-medium text-[0.75em] tracking-wider transition-all duration-300"
    >
      {dateText}
    </span>
  );
};

const REVIEWS = [
  { quote: "מלא רגעים שהצלם בכלל לא ראה.", info: "איתי ומיה | חוות רונית | יוני 2025" },
  { quote: "חוסך המון כאב ראש.", info: "יונתן ודנה | האחוזה, בית חנן | אוגוסט 2025" },
  { quote: "הורידו מאיתנו את המרדף אחרי כולם.", info: "עומר ועדי | על הים, קיסריה | אוקטובר 2025" },
  { quote: "התענגנו על התמונות בירח דבש.", info: "גיא וליאן | ביער, חדרה | דצמבר 2025" },
  { quote: "מתנה מושלמת לעצמנו ליום שאחרי.", info: "עידן וטל | טרמינל | ינואר 2026" }
];

export const Reviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
        setIsFading(false);
      }, 1700);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentReview = REVIEWS[currentIndex];

  return (
    <div className="relative z-[400]">
      {/* Background fill to blend with upper section */}
      <div 
        className="absolute top-0 left-0 right-0 bg-[#F7F7F7] -z-10" 
        style={{ height: '50%' }} 
      />
      
      <div className="relative" style={{ marginTop: '-44px', marginBottom: '-22px' }}>
        <section 
          id="reviews"
          style={{ 
            height: '272px', 
            borderRadius: '35px', 
            paddingTop: '0px' 
          }}
          className="relative flex items-center justify-center overflow-hidden transition-all duration-300 bg-[hsl(223,10%,94%)]"
        >
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 pointer-events-none noise-bg opacity-20 z-0 mix-blend-overlay" />

          <div className="max-w-6xl mx-auto px-6 text-center relative z-10 flex flex-col items-center w-full">
            
            {/* Quote Text */}
            <div style={{ transform: 'translateY(0px)' }} className="w-full">
              <h2 
                className={`font-normal italic text-stone-900 tracking-tight leading-[1.0] select-none transition-opacity duration-[1350ms] ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
                style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: '2.6rem' }}
                dir="rtl"
              >
                "{currentReview.quote}"
              </h2>
            </div>

            {/* Spacer */}
            <div style={{ height: '23px' }} className="relative w-full" />

            {/* Info Text */}
            <div style={{ transform: 'translateY(11px)' }} className="w-full">
              <div 
                className={`font-['Assistant'] font-light text-stone-500 tracking-widest uppercase select-none transition-opacity duration-[1350ms] ease-in-out delay-[350ms] ${isFading ? 'opacity-0' : 'opacity-100'}`}
                style={{ fontSize: '1.35rem' }}
                dir="rtl"
              >
                {(() => {
                  const parts = currentReview.info.split(' | ');
                  if (parts.length === 3) {
                    return (
                      <div className="flex flex-col items-center">
                        <span className="mb-1">{parts[0]} | {parts[1]}</span>
                        <DateHighlight dateText={parts[2]} />
                      </div>
                    );
                  }
                  return currentReview.info;
                })()}
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};