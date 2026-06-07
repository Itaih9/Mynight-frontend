import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { ArrowRight, HelpCircle, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import logoSvg from '@/assets/logo.svg';

const faqs = [
  {
    question: "איך האורחים מקבלים את התמונות?",
    answer: "המערכת שלנו שולחת קישור בווצאפ לכל אורח שאישר הגעה ברשימה ששלחתם לנו. האורח מצלם סלפי ומקבל תוך שניות את כל התמונות שלו."
  },
  {
    question: "האם התמונות נשמרות באיכות מלאה?",
    answer: "כן, בהחלט. אנחנו שומרים את כל התמונות והסרטונים באיכות המקורית שלהם (4K) ללא כיווץ."
  },
  {
    question: "מה האורחים יכולים לראות?",
    answer: "אתם מחליטים! המערכת מאפשרת לכם לשלוט בדיוק במה שהאורחים רואים. ניתן להגדיר שהם יקבלו רק את התמונות האישיות שלהם, או לפתוח להם גישה גם לתמונות הצלם, לגלריה הכללית ולרגעים שצילמו אורחים אחרים."
  },
  {
    question: "האם המידע שלי מאובטח?",
    answer: "אבטחת המידע היא בראש סדר העדיפויות שלנו. כל המידע מוצפן, ואנחנו לא משתפים פרטים עם צד שלישי."
  },
  {
    question: "לכמה זמן הגלריה נשמרת?",
    answer: "הגלריה נשמרת ל6 חודשים לאחר החתונה. צריכים עוד זמן להינות? שלחו לנו מייל ונשמח להוסיף זמן ללא עלות!"
  },
  {
    question: "מה זה התחייבות מלאה?",
    answer: "אנחנו בטוחים ב-100% בחוויה שאנחנו מספקים. אם מכל סיבה שהיא לא תהיו מרוצים מהשירות, צרו איתנו קשר עד שלושה חודשים לאחר החתונה ותקבלו החזר כספי מלא. בלי שאלות, בלי אותיות קטנות. ההתחייבות ניתנת לחבילה המושלמת בלבד."
  }
];

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight size={24} />
          </button>
          <Link to={ROUTES.HOME}>
            <img src={logoSvg} alt="MY NIGHT" className="h-7" />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto space-y-8 animate-fade-in py-12 px-6 text-right">

        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-black">מרכז עזרה</h1>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 text-center space-y-4">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-gold-primary">
              <HelpCircle size={48} />
           </div>
           <h2 className="text-2xl font-bold">איך אפשר לעזור?</h2>
           <p className="text-gray-500">אספנו עבורכם את השאלות הנפוצות ביותר</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-2xl overflow-hidden transition-all bg-white hover:border-gray-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-right font-bold text-lg"
              >
                <span>{faq.question}</span>
                {openIndex === index ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-5 pt-0 text-gray-500 leading-relaxed border-t border-gray-50 mt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <h3 className="text-xl font-bold mb-4">עדיין צריכים עזרה?</h3>
          <div className="w-full">
            <a href="mailto:help@mynight.co.il" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-all group gap-3 w-full">
              <Mail size={24} className="text-gray-400 group-hover:text-white" />
              <span className="font-bold">אימייל</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Help;
