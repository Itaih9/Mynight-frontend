// Suggested gift-card amounts (ILS) shown as pills, plus the full-package option.
export const SUGGESTED_AMOUNTS = [100, 200, 300, 500];

// Feature lists keyed by the package's englishTitle (matches Register.tsx).
// Prices come live from packagesApi so they never drift.
export const PACKAGE_FEATURES: Record<string, { hebrewName: string; features: string[] }> = {
  'The Morning After': {
    hebrewName: 'האוספת',
    features: [
      'אוספים הכל מהאורחים בשבילכם',
      'נשלח קישור בווצאפ לכל אורח',
      'העלאה מהירה ללא אפליקציה',
      'איכות מקסימלית ללא כיווץ',
      'נהנים מהרגעים עד שהצלם מוכן',
    ],
  },
  'Here I Am': {
    hebrewName: 'החכמה',
    features: [
      'מיון אורחים ואלבום אישי בווצאפ',
      'שליחת אלבום אישי ישירות לנייד',
      'סריקת אלפי תמונות בדיוק מירבי',
      'חוסך לאורחים חיפוש בגלריות',
      'חוויה אישית לכל אורח ואורחת',
    ],
  },
  'UNLIMITED': {
    hebrewName: 'המושלמת',
    features: [
      'האוספת + החכמה = חבילה מושלמת',
      'מיון אורחים ואלבום אישי בווצאפ',
      'אוספים הכל מהאורחים בבוקר שאחרי',
      'אלבום חכם מושלם מקצה לקצה',
      'סריקת אלפי תמונות בדיוק מירבי',
      'חוויה דיגיטלית אישית ויוקרתית',
    ],
  },
};

/** sessionStorage key for a gift coupon awaiting auto-apply at the couple's checkout. */
export const GIFT_COUPON_KEY = 'mynight_gift_coupon';
