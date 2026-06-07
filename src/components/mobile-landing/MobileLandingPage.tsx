import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import Navbar from './Navbar';
import { TopPage } from './TopPage';
import { Packages } from './Packages';
import { Experience } from './Experience';
import { Marquee } from './Marquee';
import { Features } from './Features';
import { Reviews } from './Reviews';
import { VendorCTA } from './VendorCTA';
import { Footer } from './Footer';

export const MobileLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentEvent } = useUserStore();
  const eventSlug = currentEvent?.customSlug || currentEvent?.eventCode;
  const [highlightedPackageIndex, setHighlightedPackageIndex] = useState<number | null>(null);
  const [animatingPackageIndex, setAnimatingPackageIndex] = useState<number | null>(null);
  const [isHoverDisabled, setIsHoverDisabled] = useState(false);

  const handleNavigation = (page: 'home' | 'login' | 'vendor' | 'vendorLogin' | 'terms' | 'gallery' | 'help' | 'guestLanding' | 'guestUpload' | 'guestPersonalGallery') => {
    const routeMap: Record<string, string> = {
      home: ROUTES.HOME,
      login: ROUTES.LOGIN,
      vendor: ROUTES.AFFILIATE,
      vendorLogin: ROUTES.AFFILIATE_LOGIN,
      terms: ROUTES.TERMS,
      gallery: ROUTES.GALLERY,
      help: ROUTES.HELP,
      guestLanding: ROUTES.GUEST_LANDING.replace(':eventCode', eventSlug || 'demo'),
      guestUpload: ROUTES.GUEST_UPLOAD.replace(':eventCode', eventSlug || 'demo'),
      guestPersonalGallery: ROUTES.GUEST_GALLERY.replace(':eventCode', eventSlug || 'demo'),
    };
    navigate(routeMap[page] || ROUTES.HOME);
  };

  const triggerPackageHighlight = (index: number) => {
    setIsHoverDisabled(true);
    setTimeout(() => setIsHoverDisabled(false), 2500);

    const element = document.getElementById('packages');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        setHighlightedPackageIndex(index);
        setAnimatingPackageIndex(index);

        setTimeout(() => setAnimatingPackageIndex(null), 1150);

        setTimeout(() => setHighlightedPackageIndex(null), 3500);
      }, 200);
    }
  };

  const handleSmartPackageClick = () => navigate(ROUTES.GALLERY_SHOWCASE);
  const handleMorningAfterClick = () => triggerPackageHighlight(0);

  return (
    <div dir="ltr" className="min-h-screen bg-[#FAFAFA] font-['Assistant'] text-stone-900 selection:bg-rose-100 selection:text-rose-600 md:pt-[72px]">
      <Navbar onNavigate={handleNavigation} />

      <TopPage onMoreInfoClick={handleSmartPackageClick} />

      <Marquee />

      <Experience
        onMoreInfoClick={handleMorningAfterClick}
        onGiantClick={handleSmartPackageClick}
      />

      <Packages
        highlightedPackageIndex={highlightedPackageIndex}
        animatingPackageIndex={animatingPackageIndex}
        isHoverDisabled={isHoverDisabled}
      />

      <Reviews />

      <Features />

      <VendorCTA />

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-photos {
          0% { transform: translateX(70vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-photos {
          animation: marquee-photos 40s linear infinite;
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-rtl {
          animation: marquee-rtl ease-out forwards;
        }
        @keyframes photo-entrance {
          0% { opacity: 0; transform: translate(-50%, calc(120vh - 60px)) scale(0.6); }
          5% { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, calc(-50% - 40px)) scale(1); }
        }
        @keyframes tracker-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.95) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 0.8; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-in-up {
          animation: fadeInOut 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes breathing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes sheen-slide-rtl {
          0% { left: 150%; }
          45% { left: -100%; }
          100% { left: -100%; }
        }
        .sheen-element-btn {
          animation: sheen-slide-rtl 5s infinite ease-in-out;
        }
        @keyframes highlight-pop {
          0% { transform: scale(var(--base-scale, 1)) translateY(0); }
          40% { transform: scale(var(--base-scale, 1)) translateY(-44px); }
          100% { transform: scale(var(--base-scale, 1)) translateY(0); }
        }
        .animate-highlight-pop {
          animation: highlight-pop 1.12s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes marquee {
          0% { transform: translateX(150px); }
          100% { transform: translateX(calc(-50% + 150px)); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        @keyframes fade-glow {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-glow {
          animation: fade-glow 4s ease-in-out forwards;
        }
        button { cursor: pointer; }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}} />
    </div>
  );
};
