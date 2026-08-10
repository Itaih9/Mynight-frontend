export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  START: '/start',
  DISPOSABLE_CAMERA: '/camera/:code',
  // Free פלאש: its own landing + signup, deliberately not on the packages page.
  // /flash = the ad landing page; /flash/register = the signup form.
  FLASH: '/flash',
  FLASH_REGISTER: '/flash/register',
  // Existing event's post-registration page (QR, link, tips) — e.g. after paying.
  FLASH_EVENT: '/flash/event',
  // Single-product page for the Here I Am upsell. NOT where upsell CTAs go:
  // it captures contact details, and a couple who has already decided should
  // not be made to ask to be called back. CTAs use UPGRADE_CHECKOUT.
  HERE_I_AM: '/here-i-am',
  // Straight into checkout for the החכמה package. No ?price — the server
  // charges the package's own price and the page reads it from /api/packages,
  // so a stale link can never quote the wrong figure.
  UPGRADE_CHECKOUT: '/register?package=Here%20I%20Am',
  // Flash Plus (פלאש+) plans + upgrade checkout.
  FLASH_PLUS: '/flash-plus',
  // Flash+ code-in-link payment return (public, no auth).
  FLASH_THANKS: '/flash/thanks',
  GIFT: '/gift',
  GIFT_CALLBACK: '/gift-callback',
  GIFT_CLAIM: '/gift/:code',
  REGISTER: '/register',
  UPLOAD: '/upload',
  GALLERY: '/gallery',
  GALLERY_LOGIN: '/gallery-login',
  GALLERY_SHOWCASE: '/gallery-showcase',
  PUBLIC_GALLERY: '/gallery/:eventCode',
  GUEST_LANDING: '/guest/:eventCode',
  GUEST_SELFIE: '/guest/:eventCode/selfie',
  GUEST_UPLOAD: '/guest/:eventCode/upload',
  GUEST_GALLERY: '/guest/:eventCode/gallery',
  AFFILIATE: '/affiliate',
  AFFILIATE_LOGIN: '/affiliate/login',
  AFFILIATE_DASHBOARD: '/affiliate/dashboard',
  HELP: '/help',
  TERMS: '/terms',
  REVIEW: '/review',
  COUPON: '/coupon',
  PAYMENT_CALLBACK: '/payment-callback',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_CAMPAIGNS: '/admin/campaigns',
  ADMIN_REFERRALS: '/admin/referrals',
  ADMIN_AFFILIATES: '/admin/affiliates',
  ADMIN_CONTACTS: '/admin/contacts',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_ADMINS: '/admin/admins',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_PACKAGES: '/admin/packages',
  ADMIN_UPLOAD: '/admin/upload/:eventId',
} as const;
