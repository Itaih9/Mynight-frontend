import React, { useState, useEffect } from 'react';
import { reviewApi } from '@/services/api/review.api';

const fallbackReviews = [
  {
    text: "במקום לבקש מכל האורחים, פשוט נחנו בבוקר שאחרי והתמונות זרמו לבד לכולם. הצלתם אותנו!",
    name: "נועה ועידן",
    location: "הדריה, ינואר 2025"
  },
  {
    text: "האורחים עפו על זה! הטלפון לא הפסיק לקבל הודעות תודה מאנשים שמצאו תמונות נדירות שלהם מהרחבה.",
    name: "רועי ומיכל",
    location: "תיאודור, מרץ 2025"
  },
  {
    text: "פחדנו להסתבך טכנית, אבל הפתיחה לקחה בדיוק 3 דקות. שירות חובה לכל זוג שרוצה ראש שקט באירוע.",
    name: "עמית וגל",
    location: "הרמוזו, פברואר 2025"
  }
];

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5C518" stroke="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const TestimonialFloatingCard: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [reviews, setReviews] = useState(fallbackReviews);

  useEffect(() => {
    reviewApi.getApproved().then((res) => {
      if (res.data && res.data.length > 0) {
        setReviews(res.data.map((r) => ({
          text: r.text,
          name: r.name || '',
          location: '',
        })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setIsVisible(true);
      }, 500);

    }, 6000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[380px] border border-gray-100/50">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <StarIcon key={s} />
        ))}
      </div>

      <div
        key={currentIndex}
        className={`transition-opacity duration-500 ease-in-out min-h-[140px] flex flex-col justify-between ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-lg font-medium text-gray-900 leading-relaxed mb-4">
          "{reviews[currentIndex].text}"
        </p>

        <div>
          <p className="font-bold text-black text-lg">
            {reviews[currentIndex].name}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {reviews[currentIndex].location}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
            <div className="flex -space-x-3 space-x-reverse">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="mr-3 text-xs font-medium text-gray-500">
              הצטרפו למאות זוגות שבחרו בMy Night
            </span>
        </div>
      </div>
    </div>
  );
};

export default TestimonialFloatingCard;
