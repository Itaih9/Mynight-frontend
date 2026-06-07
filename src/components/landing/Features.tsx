import React from 'react';
import { Smartphone, ShieldCheck, Zap, Infinity } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Infinity size={28} strokeWidth={1.5} />,
      title: "הכל כלול",
      desc: (
        <>
          במקום לשבור את הראש על השוואה בין חבילות, מה יותר ומה פחות - אנחנו מציעים חבילה אחת שכוללת ה-כ-ל
          <span className="block md:inline font-bold"> ב-590 ש"ח בלבד.</span>
        </>
      )
    },
    {
      icon: <Smartphone size={28} strokeWidth={1.5} />,
      title: "אפס מאמץ מכם",
      desc: "אתם לא צריכים לרדוף אחרי אף אחד. המערכת עושה הכל אוטומטית ברקע."
    },
    {
      icon: <ShieldCheck size={28} strokeWidth={1.5} />,
      title: "פרטיות מלאה לאורחים",
      desc: "אנחנו מזהים פנים בדיוק רב ושולחים לכל אורח רק את התמונות שהוא מופיע בהן."
    },
    {
      icon: <Zap size={28} strokeWidth={1.5} />,
      title: "איכות מקורית",
      desc: "תמונות וסרטונים באיכות המלאה (4K), בלי הכיווץ המעצבן של אפליקציות ההודעות."
    }
  ];

  return (
    <section className="pt-0 pb-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-black tracking-tight font-secular">למה לבחור בנו?</h2>
          <div className="w-12 h-0.5 bg-black mx-auto mt-3"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 bg-white border border-gray-100 hover:border-black transition-colors duration-500 group">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-black mb-4 group-hover:bg-black group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">{feature.title}</h3>
              <div className="text-gray-500 leading-relaxed font-light text-lg">
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
