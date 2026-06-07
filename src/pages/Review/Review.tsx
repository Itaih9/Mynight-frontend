import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Star, Send, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { reviewApi } from '@/services/api/review.api';
import logoSvg from '@/assets/logo.svg';

const Review: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const wordCount = review.trim().split(/\s+/).filter(Boolean).length;
  const isTextValid = wordCount >= 2;
  const canSubmit = rating > 0 && isTextValid;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await reviewApi.submit({ rating, text: review });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col" dir="rtl">
        <div className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
          <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
            <div />
            <Link to={ROUTES.HOME}>
              <img src={logoSvg} alt="MY NIGHT" className="h-7" />
            </Link>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-right">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold">תודה על המשוב!</h2>
          <p className="text-gray-500 text-lg">שמחנו לקחת חלק ברגעים המיוחדים שלכם.</p>
          <button
            onClick={handleBack}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold mt-8 hover:bg-gray-800 transition-colors"
          >
            חזרה לגלריה
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight size={24} />
          </button>
          <Link to={ROUTES.HOME}>
            <img src={logoSvg} alt="MY NIGHT" className="h-7" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-right">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-gray-50 text-black rounded-3xl flex items-center justify-center border border-gray-100">
            <Star size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black">השארת ביקורת</h1>
            <p className="text-gray-500 text-lg">ספרו לנו איך הייתה החוויה שלכם</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={40}
                  fill={(hoverRating || rating) >= star ? "#F5C518" : "none"}
                  className={(hoverRating || rating) >= star ? "text-gold-primary" : "text-gray-200"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">החוויה שלכם</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="כתבו כאן..."
              maxLength={500}
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all resize-none scrollbar-thin"
            />
            <div className="flex justify-between text-xs text-gray-400 px-1 font-medium">
                <span className={!isTextValid && review.length > 0 ? "text-red-400" : ""}>
                    {wordCount < 2 ? 'מינימום 2 מילים' : 'נראה מעולה!'}
                </span>
                <span>{review.length}/500</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${canSubmit ? 'bg-black text-white hover:bg-gray-800 shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <span>שליחה</span>
            <Send size={20} />
          </button>
        </form>

        <button
          onClick={handleBack}
          className="w-full text-gray-400 hover:text-black font-medium flex items-center justify-center gap-2 pt-2 transition-colors"
        >
          <ArrowRight size={20} />
          <span>ביטול וחזרה</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default Review;
