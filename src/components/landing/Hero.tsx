import { useState, useEffect } from 'react';
import { ScanFace, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TestimonialFloatingCard from './TestimonialFloatingCard';
import { CelebrationButton } from '@/components/common';
import { ROUTES } from '@/config/routes';

const phrases = [
  "סינון תמונות מתקדם.",
  "אוספים הכל מהאורחים בשבילכם.",
  "כל הרגעים במקום אחד."
];

const Hero: React.FC = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setText(curr => {
        if (isDeleting) {
          return fullText.substring(0, curr.length - 1);
        } else {
          return fullText.substring(0, curr.length + 1);
        }
      });

      let typeSpeed = isDeleting ? 25 : 50;

      if (!isDeleting && text === fullText) {
        typeSpeed = 2000;
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        typeSpeed = 300;
      }

      setTypingSpeed(typeSpeed);
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <section className="relative overflow-hidden lg:min-h-[55vh] flex flex-col justify-start bg-white pt-6 lg:pt-6 pb-4">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]"
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000000 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
      </div>

      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

            <div className="w-full lg:w-[58%] flex flex-col items-center text-center md:translate-x-[15px] lg:translate-x-[39px]">
                <div className="mb-4 inline-flex items-center gap-3 px-3 py-1.5 bg-white rounded-xl text-black text-sm font-medium border border-gray-200 min-h-[40px] shadow-sm relative z-20">
                    <ScanFace size={18} strokeWidth={1.5} className="text-black shrink-0" />
                    <span className="tracking-wide text-base">
                      <span>{text}</span>
                      <span className="animate-pulse ml-0.5 border-r-2 border-black h-5 inline-block align-middle">&nbsp;</span>
                    </span>
                </div>

                <h1 className="mb-5 relative z-20 text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] text-black tracking-tight">
                    הדור הבא של <br className="md:hidden" /> אלבומי החתונה
                </h1>

                <p className="mb-6 relative z-20 text-xl md:text-2xl text-gray-500 leading-relaxed font-light max-w-2xl mx-auto">
                    מהסלפי של החברים ועד התמונות מהצלם – המערכת שלנו אוספת הכל, מזהה מי בתמונה, ושולחת לכל אחד את הזיכרונות שלו.
                </p>

                <div className="inline-flex flex-col items-center gap-4 pt-2 relative z-10 w-full lg:w-auto">
                    <CelebrationButton
                      onClick={() => navigate(ROUTES.GALLERY_SHOWCASE)}
                      label="איך זה נראה"
                      className="w-[90%] flex justify-center lg:inline-block lg:w-auto"
                      buttonClassName="!text-[43px] font-secular !gap-[14px] translate-x-[-3px] md:translate-x-0 py-6 px-4 md:px-12 w-full md:w-auto max-w-none md:max-w-none tracking-[0.02em] [-webkit-text-stroke:1.5px_white]"
                      arrowStrokeWidth={2.5}
                      Icon={Eye}
                    />

                    <button
                        onClick={() => navigate(ROUTES.START)}
                        className="group flex items-center gap-2 text-[14.4px] text-gray-500 font-secular hover:text-black transition-colors -translate-y-[9px] translate-x-[4px] cursor-pointer relative z-20"
                    >
                        <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-black transition-all">לרכישה מהירה | פתיחה מיידית</span>
                    </button>
                </div>
            </div>

            <div className="hidden lg:flex w-full lg:w-[42%] justify-center lg:justify-center relative lg:translate-x-[30px]">
                <div className="relative z-10 w-full max-w-[420px]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold-primary/5 rounded-full blur-3xl -z-10"></div>
                    <TestimonialFloatingCard />
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
