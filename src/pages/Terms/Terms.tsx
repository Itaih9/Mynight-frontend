import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/common/Navbar';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16 animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
             <h1 className="text-4xl font-bold tracking-tight">תנאי השימוש</h1>
             <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                <ShieldCheck className="text-black" size={24} />
             </div>
          </div>

          <div className="prose prose-sm md:prose-base max-w-none text-gray-600 space-y-6 leading-relaxed">
             <section>
                <h2 className="text-xl font-bold text-black mb-2">1. הסכמה לתנאים</h2>
                <p>השימוש באתר ובשירות My Night (להלן: "השירות") מהווה הסכמה מלאה ובלתי חוזרת לכל התנאים המפורטים להלן.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-black mb-2">2. תיאור השירות</h2>
                <p>My Night מספקת פלטפורמה לאיסוף, ניהול והפצה של תמונות וסרטונים מאירועי חתונה. השירות כולל שימוש בטכנולוגיית זיהוי פנים (AI) לצורך שיוך תמונות לאורחים באופן אישי.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-black mb-2">3. פרטיות וזיהוי פנים</h2>
                <p>השימוש בזיהוי פנים נועד אך ורק לצורך שיפור חווית המשתמש והפצת התמונות לאורחים הרלוונטיים. My Night מתחייבת שלא למכור את נתוני זיהוי הפנים לצד ג'. התמונות נשמרות בשרתים מאובטחים לפרק זמן מוגבל המוגדר בחבילת השירות.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-black mb-2">4. אחריות משתמש</h2>
                <p>האחריות על תוכן התמונות והסרטונים המועלים לשירות חלה על המעלים בלבד. חל איסור מוחלט על העלאת תוכן פוגעני, לא חוקי או כזה המפר זכויות יוצרים של צד שלישי.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-black mb-2">5. ביטול עסקה והחזרים</h2>
                <p>רכשתם חבילה לא נכונה? לא הצלחנו לעמוד בציפיות שלכם? כתבו לנו בוואטסאפ ונעשה הכל כדי לעזור.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-black mb-2">6. הגבלת תוכן וזמן האירוע</h2>
                <p>אין להעלות לאתר תמונות או סרטונים שאינם מיום האירוע או הבוק. הפרת סעיף זה עלולה לגרום לסגירת הגלריה באופן מיידי וללא החזר כספי.</p>
             </section>
          </div>

          <button
            onClick={handleBack}
            className="mt-12 flex items-center gap-2 text-black font-bold border-b-2 border-black pb-1 hover:text-gold-primary hover:border-gold-primary transition-colors"
          >
            <ArrowRight size={20} />
            <span>חזרה לדף הבית</span>
          </button>
      </div>
    </div>
  );
};

export default Terms;
