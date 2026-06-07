import React, { useState, useEffect } from 'react';

const REVIEWS = [
  {
    quote: "מלא רגעים שהצלם בכלל לא ראה.",
    info: "איתי ומיה | חוות רונית | יוני 2025"
  },
  {
    quote: "חוסך המון כאב ראש.",
    info: "יונתן ודנה | האחוזה, בית חנן | אוגוסט 2025"
  },
  {
    quote: "הורידו מאיתנו את המרדף אחרי כולם.",
    info: "עומר ועדי | על הים, קיסריה | אוקטובר 2025"
  },
  {
    quote: "התענגנו על התמונות בירח דבש.",
    info: "גיא וליאן | ביער, חדרה | דצמבר 2025"
  },
  {
    quote: "מתנה מושלמת לעצמנו ליום שאחרי.",
    info: "עידן וטל | טרמינל | ינואר 2026"
  }
];

const LandingReviews: React.FC = () => {
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
    <div className="relative z-[250]">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#F7F7F7] -z-10" />
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[60%] h-[200px] bg-white rounded-full blur-[100px] opacity-70 -z-0 pointer-events-none" />

        <section
            className="py-10 md:py-12 relative flex items-center justify-center overflow-hidden h-[250px] md:h-[350px] transition-colors duration-300 rounded-[24px] md:rounded-[50px] bg-[hsl(223,10%,94%)]"
        >
          <div className="absolute inset-0 pointer-events-none noise-bg opacity-20 z-0 mix-blend-overlay" />

          <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
            <div>
              <h2
                className={`text-2xl sm:text-4xl md:text-6xl lg:text-[5.5rem] font-normal italic text-stone-900 tracking-tight mb-8 md:mb-[62px] leading-[1.2] select-none transition-opacity duration-[1350ms] ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
                style={{ fontFamily: "'Frank Ruhl Libre', serif" }}
                dir="rtl"
              >
                "{currentReview.quote}"
              </h2>
              <p
                className={`text-lg md:text-2xl font-['Assistant'] font-light text-stone-500 tracking-widest uppercase select-none transition-opacity duration-[1350ms] ease-in-out delay-[350ms] ${isFading ? 'opacity-0' : 'opacity-100'}`}
                dir="rtl"
              >
                {currentReview.info}
              </p>
            </div>
          </div>
        </section>
    </div>
  );
};

export default LandingReviews;