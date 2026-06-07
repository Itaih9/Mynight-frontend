import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

const Partners: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-8 pb-[52px] md:py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 tracking-tight">
          אתם מהתחום? <br className="md:hidden" />בואו ניתן לזוגות שלכם יותר
        </h2>
        <p className="text-xl text-gray-500 mb-7 leading-relaxed font-light max-w-2xl mx-auto">
          צלמים, ספקים ובעלי אולמות – הצטרפו לתוכנית השותפים שלנו ותהנו מעמלות מתגמלות ולקוחות מרוצים.
        </p>
        <button
          onClick={() => navigate(ROUTES.AFFILIATE)}
          className="bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-xl text-lg font-medium transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 group"
        >
          <span>להצטרפות לתוכנית השותפים</span>
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default Partners;
