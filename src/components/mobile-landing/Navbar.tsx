import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import logoSvg from '@/assets/logo.svg';

interface NavbarProps {
  onNavigate: (page: 'home' | 'login' | 'vendor' | 'vendorLogin' | 'terms' | 'gallery' | 'help' | 'guestLanding' | 'guestUpload' | 'guestPersonalGallery') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleNavigation = (page: 'home' | 'login' | 'vendor' | 'vendorLogin' | 'terms' | 'gallery' | 'help' | 'guestLanding' | 'guestUpload' | 'guestPersonalGallery') => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const logoUrl = logoSvg;

  return (
    <>
      <nav 
        className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-stone-200 transition-all border-b"
        style={{ borderBottomWidth: '1px' }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[45px] md:h-[72px]" dir="ltr">
            
            {/* Logo on Left */}
            <div className="flex items-center gap-3">
              <button onClick={() => handleNavigation('home')} className="focus:outline-none">
                <img src={logoUrl} alt="MY NIGHT" className="h-[43px] md:h-[72px] w-auto object-contain" />
              </button>
            </div>

            {/* Hamburger on Right */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -mr-2 text-black hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                aria-label="Open menu"
              >
                {/* Custom Hamburger Icon for varied line thickness */}
                <svg
                  width="43"
                  height="43"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[43px] h-[43px]"
                >
                  {/* Top line: 20% thinner than 1.2 ≈ 0.96 */}
                  <line x1="4" x2="20" y1="6" y2="6" strokeWidth="0.96" />
                  {/* Middle line: 10% thinner than 1.2 ≈ 1.08 */}
                  <line x1="4" x2="20" y1="12" y2="12" strokeWidth="1.08" />
                  {/* Bottom line: Base thickness 1.2 */}
                  <line x1="4" x2="20" y1="18" y2="18" strokeWidth="1.2" />
                </svg>
              </button>
            </div>
            
          </div>
        </div>
      </nav>

      <div 
        className={`fixed inset-0 z-[1200] transition-visibility duration-300 ${isMenuOpen ? 'visible' : 'invisible delay-300'}`}
      >
        <div 
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        <div 
          className={`absolute top-0 right-0 w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
             <div className="flex items-center justify-between mb-6">
                <button onClick={() => handleNavigation('home')} className="focus:outline-none">
                  <img src={logoUrl} alt="MY NIGHT" className="h-[55px] w-auto object-contain" />
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
                onClick={() => handleNavigation('login')}
                className="text-lg font-medium font-['Assistant'] text-black hover:text-gray-600 transition-colors text-right"
               >
                 כניסה לזוגות
               </button>

               <button
                onClick={() => handleNavigation('vendorLogin')}
                className="text-lg font-medium font-['Assistant'] text-black hover:text-gray-600 transition-colors text-right"
               >
                 ספקים ושותפים
               </button>

               <button
                onClick={() => handleNavigation('help')}
                className="text-lg font-medium font-['Assistant'] text-black hover:text-gray-600 transition-colors text-right"
               >
                 עזרה
               </button>

               <button
                onClick={() => handleNavigation('terms')}
                className="text-lg font-medium font-['Assistant'] text-black hover:text-gray-600 transition-colors text-right"
               >
                תנאי שימוש
               </button>
             </div>

             <div className="mt-auto pt-8 flex justify-center pb-8">
                <button onClick={() => handleNavigation('home')} className="transition-opacity hover:opacity-100 opacity-100 group">
                  <img src={logoUrl} alt="MY NIGHT" className="h-8 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                </button>
             </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;