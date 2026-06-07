import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import logoSvg from '@/assets/logo.svg';

interface NavbarProps {
  forceHome?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ forceHome = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentEvent } = useUserStore();
  const eventSlug = currentEvent?.customSlug || currentEvent?.eventCode || (currentEvent as any)?.slug;

  const handleLogoClick = () => {
    if (!forceHome && currentEvent) {
      handleNavigation(ROUTES.GALLERY);
    } else {
      handleNavigation(ROUTES.HOME);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingLeft = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingLeft = '';
    }

    return () => {
       document.body.style.overflow = '';
       document.body.style.paddingLeft = '';
    };
  }, [isMenuOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-[999] bg-white/95 backdrop-blur-sm border-gray-100 transition-all border-b"
        style={{ borderBottomWidth: '1.3px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-[60px]">

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -mr-2 text-black hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                aria-label="Open menu"
              >
                <Menu className="w-7 h-7" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleLogoClick} className="focus:outline-none">
                <img src={logoSvg} alt="MY NIGHT" className="h-[42px] md:h-[50px] w-auto object-contain" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[1000] transition-visibility duration-300 ${isMenuOpen ? 'visible' : 'invisible delay-300'}`}
      >
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          className={`absolute top-0 right-0 w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
             <div dir="ltr" className="flex items-center justify-between mb-6">
                <button onClick={handleLogoClick} className="focus:outline-none">
                  <img src={logoSvg} alt="MY NIGHT" className="h-[36px] w-auto object-contain" />
                </button>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 -m-2 text-black hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                  aria-label="Close menu"
                >
                  <X className="w-8 h-8" strokeWidth={1.5} />
                </button>
             </div>

             <div className="flex flex-col space-y-4">
               <button
                onClick={() => handleNavigation(ROUTES.LOGIN)}
                className="text-lg font-medium text-black hover:text-gray-600 transition-colors text-right"
               >
                 כניסה לזוגות
               </button>

               <button
                onClick={() => handleNavigation(ROUTES.AFFILIATE_LOGIN)}
                className="text-lg font-medium text-black hover:text-gray-600 transition-colors text-right"
               >
                 ספקים ושותפים
               </button>

               <button
                onClick={() => handleNavigation(ROUTES.HELP)}
                className="text-lg font-medium text-black hover:text-gray-600 transition-colors text-right"
               >
                 עזרה
               </button>

               <button
                onClick={() => handleNavigation(ROUTES.TERMS)}
                className="text-lg font-medium text-black hover:text-gray-600 transition-colors text-right"
               >
                תנאי שימוש
               </button>
             </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
