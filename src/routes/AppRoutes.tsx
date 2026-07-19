import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '../config/routes';

import Landing from '../pages/Landing/Landing';
import Login from '../pages/Login/Login';
import GalleryLogin from '../pages/Login/GalleryLogin';
import Register from '../pages/Register/Register';
import GiftChoice from '../pages/Gift/GiftChoice';
import Gift from '../pages/Gift/Gift';
import GiftClaim from '../pages/Gift/GiftClaim';
import Upload from '../pages/Upload/Upload';
import Gallery from '../pages/Gallery/Gallery';
import GalleryShowcase from '../pages/GalleryShowcase/GalleryShowcase';
import GuestLanding from '../pages/Guest/GuestLanding';
import GuestSelfie from '../pages/Guest/GuestSelfie';
import GuestUpload from '../pages/Guest/GuestUpload';
import GuestGallery from '../pages/Guest/GuestGallery';
import Affiliate from '../pages/Affiliate/Affiliate';
import AffiliateLogin from '../pages/Affiliate/AffiliateLogin';
import AffiliateDashboard from '../pages/Affiliate/AffiliateDashboard';
import Help from '../pages/Help/Help';
import Terms from '../pages/Terms/Terms';
import Review from '../pages/Review/Review';
import Coupon from '../pages/Coupon/Coupon';
import PaymentCallback from '../pages/PaymentCallback/PaymentCallback';
import {
  AdminLogin,
  AdminDashboard,
  AdminUsers,
  AdminEvents,
  AdminCoupons,
  AdminReferrals,
  AdminAffiliates,
  AdminContacts,
  AdminReviews,
  AdminAdmins,
  AdminPhotoUpload,
  AdminWithdrawals,
  AdminPackages,
} from '../pages/Admin';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.GALLERY_LOGIN} element={<GalleryLogin />} />
      <Route path={ROUTES.START} element={<GiftChoice />} />
      <Route path={ROUTES.GIFT_CLAIM} element={<GiftClaim />} />
      <Route path={ROUTES.GIFT} element={<Gift />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.UPLOAD} element={<Upload />} />
      <Route path={ROUTES.GALLERY_SHOWCASE} element={<GalleryShowcase />} />
      <Route path={ROUTES.PUBLIC_GALLERY} element={<Gallery />} />
      <Route path={ROUTES.GALLERY} element={<Gallery />} />
      <Route path={ROUTES.GUEST_LANDING} element={<GuestLanding />} />
      <Route path={ROUTES.GUEST_SELFIE} element={<GuestSelfie />} />
      <Route path={ROUTES.GUEST_UPLOAD} element={<GuestUpload />} />
      <Route path={ROUTES.GUEST_GALLERY} element={<GuestGallery />} />
      <Route path={ROUTES.AFFILIATE} element={<Affiliate />} />
      <Route path={ROUTES.AFFILIATE_LOGIN} element={<AffiliateLogin />} />
      <Route path={ROUTES.AFFILIATE_DASHBOARD} element={<AffiliateDashboard />} />
      <Route path={ROUTES.HELP} element={<Help />} />
      <Route path={ROUTES.TERMS} element={<Terms />} />
      <Route path={ROUTES.REVIEW} element={<Review />} />
      <Route path={ROUTES.COUPON} element={<Coupon />} />
      <Route path={ROUTES.PAYMENT_CALLBACK} element={<PaymentCallback />} />
      <Route path={ROUTES.ADMIN} element={<AdminLogin />} />
      <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
      <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
      <Route path={ROUTES.ADMIN_EVENTS} element={<AdminEvents />} />
      <Route path={ROUTES.ADMIN_COUPONS} element={<AdminCoupons />} />
      <Route path={ROUTES.ADMIN_ADMINS} element={<AdminAdmins />} />
      <Route path={ROUTES.ADMIN_REFERRALS} element={<AdminReferrals />} />
      <Route path={ROUTES.ADMIN_AFFILIATES} element={<AdminAffiliates />} />
      <Route path={ROUTES.ADMIN_CONTACTS} element={<AdminContacts />} />
      <Route path={ROUTES.ADMIN_REVIEWS} element={<AdminReviews />} />
      <Route path={ROUTES.ADMIN_WITHDRAWALS} element={<AdminWithdrawals />} />
      <Route path={ROUTES.ADMIN_PACKAGES} element={<AdminPackages />} />
      <Route path={ROUTES.ADMIN_UPLOAD} element={<AdminPhotoUpload />} />
    </Routes>
  );
};
