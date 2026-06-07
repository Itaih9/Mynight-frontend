import React from 'react';
import { Zap, ShieldCheck, Smartphone, Infinity } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "איכות מקורית",
    description: "תמונות וסרטונים באיכות המלאה (4K)\nבלי הכיווץ המעצבן של הווצאפ."
  },
  {
    icon: ShieldCheck,
    title: "פרטיות מלאה",
    description: "כל המידע על האורחים נמחק מיד לאחר השימוש וכל אורח מקבל רק את התמונות שהוא מופיע בהן."
  },
  {
    icon: Infinity,
    title: "הכי משתלם",
    description: "המחירים שלנו שוברי שוק.\nמצאתם שירות בפחות מMy Night?\nנשווה את המחיר."
  },
  {
    icon: Smartphone,
    title: "אפס מאמץ",
    description: "אתם לא צריכים לרדוף אחרי אף אחד. המערכת עושה הכל אוטומטית ברקע."
  }
];

const LandingFeatures: React.FC = () => {
  return (
      <section id="features" className="pt-[28px] pb-[36px] bg-[#FAFAFA] relative z-[250]" dir="rtl">
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="text-center mb-[28px] -mt-[2px]">
                <h2 className="text-[40px] sm:text-[52px] md:text-[69px] lg:text-[91px] font-black font-['Assistant'] text-stone-900 inline-block relative">
                    למה לבחור ב-
                    <span className="bg-gradient-to-b from-black to-stone-500 bg-clip-text text-transparent">
                        My Night?
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="group bg-white border border-stone-100 px-6 md:px-8 pt-8 md:pt-10 pb-1 text-center hover:border-[#FACD21] transition-all duration-300 min-h-0 md:min-h-[320px] flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-3xl">
                        <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center mb-6 text-stone-900 bg-stone-50/50 group-hover:border-[#FACD21] group-hover:text-[#FACD21] group-hover:bg-[#FACD21]/10 transition-colors duration-300">
                             <feature.icon size={22} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold font-['Assistant'] text-stone-900 mb-4 tracking-tight">
                            {feature.title}
                        </h3>
                        <p className="text-stone-500 font-['Assistant'] font-light leading-relaxed text-lg whitespace-pre-line">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </section>
  );
};

export default LandingFeatures;