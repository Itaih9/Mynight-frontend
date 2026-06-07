import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Image as ImageIcon, Send, CheckCircle2, Square, Heart, Smartphone, Sparkles, Users, Search, Camera, ChevronsDown, Info, X } from 'lucide-react';
import { PackagesTitle } from './PackagesTitle';
import { GuaranteeHighlightEffect } from './utils/GuaranteeHighlightEffect';
import { packagesApi } from '@/services/api';

const GuaranteeText = () => {
  const textRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    let effect: GuaranteeHighlightEffect | null = null;
    if (textRef.current) {
      effect = new GuaranteeHighlightEffect(textRef.current, { rainbow: false });
    }
    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  const text = "מתחייבים שתהנו. אחרת - עלינו!";
  return (
    <span 
      ref={textRef} 
      className="text-white font-['Assistant'] font-bold text-[19px] tracking-[-0.02em] inline-flex"
      style={{ '--color-highlight-end': '#fde68a', '--color-highlight-end-alt': '#fef3c7' } as React.CSSProperties}
    >
      {text.split('').map((char, i) => (
        <span key={i} className={char === ' ' ? 'whitespace-pre' : 'char inline-block'}>
          {char}
        </span>
      ))}
    </span>
  );
};

const GuaranteeCard = ({ isExpanded }: { isExpanded: boolean }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="absolute inset-x-0 -top-9 h-9 overflow-hidden pointer-events-none z-0">
        <div 
            className={`absolute left-1/2 w-[calc(87%-40px)] h-[36px] bg-[#f59e0b] rounded-t-xl flex items-center justify-center shadow-sm transition-all duration-500 ease-in-out pb-1 overflow-hidden cursor-pointer pointer-events-auto ${
                isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translateX(-50%) translateY(${isExpanded ? '0' : '100%'})`
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
        >
            <div className="relative z-10 flex items-center gap-1.5">
              <GuaranteeText />
              <Info className="w-4 h-4 text-white opacity-90 translate-y-[2px]" />
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()} dir="rtl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-3 text-[#f59e0b]">
              <h3 className="font-bold text-xl font-['Assistant'] text-gray-900">אחריות מלאה</h3>
              <Info className="w-6 h-6 translate-y-[2px]" />
            </div>
            <p className="text-gray-600 font-['Assistant'] text-lg leading-relaxed">
              אנחנו בטוחים ב-100% בחוויה שאנחנו מספקים. אם מכל סיבה שהיא לא תהיו מרוצים מהשירות, צרו איתנו קשר עד שלושה חודשים לאחר החתונה ותקבלו החזר כספי מלא. בלי שאלות, בלי אותיות קטנות.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

interface PackagesProps {
  highlightedPackageIndex: number | null;
  animatingPackageIndex: number | null;
  isHoverDisabled: boolean;
}

const defaultPackages = [
    {
      key: "morning_after",
      title: "האוספת",
      englishTitle: "The Morning After",
      baseColor: "#F0D9B7",
      shadow: "shadow-[0_20px_40px_rgba(219,198,167,0.1)]",
      price: "350₪",
      ctaText: "לבחירה",
      iconStyle: "square",
      textColor: "text-white",
      isDark: true,
      features: [
        { text: "אוספים הכל מהאורחים בשבילכם", Icon: ImageIcon },
        { text: "נשלח קישור בווצאפ לכל אורח", Icon: Send },
        { text: "העלאה מהירה ללא אפליקציה", Icon: Smartphone },
        { text: "איכות מקסימלית ללא כיווץ", Icon: Sparkles },
        { text: "נהנים מהרגעים עד שהצלם מוכן", Icon: Users }
      ]
    },
    {
      key: "unlimited",
      title: "המושלמת",
      englishTitle: "The Perfect Night",
      baseColor: "#DBC056",
      shadow: "shadow-[0_25px_50px_rgba(15,23,42,0.25)]",
      price: "590₪",
      ctaText: "לבחירה",
      isPopular: true,
      iconStyle: "circle",
      textColor: "text-white",
      useStroke: true, 
      features: [
        { text: "האוספת + החכמה = [HEART]", Icon: ImageIcon },
        { text: "מיון אורחים ואלבום אישי בווצאפ", Icon: Users },
        { text: "אוספים הכל מהאורחים בבוקר שאחרי", Icon: ImageIcon },
        { text: "אלבום חכם מושלם מקצה לקצה", Icon: Sparkles },
        { text: "קישור בווצאפ לכל אורח", Icon: Send },
        { text: "סריקת אלפי תמונות בדיוק מירבי", Icon: Camera },
        { text: "שליחת אלבום אישי ישירות לנייד", Icon: Smartphone },
        { text: "חוויה דיגיטלית אישית ויוקרתית", Icon: Sparkles }
      ]
    },
    {
      key: "here_i_am",
      title: "החכמה",
      englishTitle: "Here I Am",
      baseColor: "#B5D9EA",
      shadow: "shadow-[0_20px_40px_rgba(181,217,234,0.15)]",
      price: "450₪",
      ctaText: "לבחירה",
      isSmart: true,
      iconStyle: "square",
      textColor: "text-white",
      isDark: true,
      features: [
        { text: "מיון אורחים ואלבום אישי בווצאפ", Icon: Users },
        { text: "שליחת אלבום אישי ישירות לנייד", Icon: Smartphone },
        { text: "סריקת אלפי תמונות בדיוק מירבי", Icon: Search },
        { text: "חוסך לאורחים חיפוש בגלריות", Icon: Sparkles },
        { text: "חוויה אישית לכל אורח ואורחת", Icon: Users }
      ]
    }
  ];

const NOISE_OPTIONS = [
  { name: "Framer 4K", url: "https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png" },
  { name: "Fine Grain", url: "https://www.transparenttextures.com/patterns/stardust.png" },
  { name: "Rough Concrete", url: "https://www.transparenttextures.com/patterns/concrete-wall.png" },
  { name: "Subtle Grey", url: "https://www.transparenttextures.com/patterns/always-grey.png" },
  { name: "White Wall", url: "https://www.transparenttextures.com/patterns/white-wall-3-2.png" },
  { name: "Crinkled", url: "https://www.transparenttextures.com/patterns/crinkled-paper.png" }
];

const HEBREW_FONTS = [
  "Assistant",
  "Rubik",
  "Heebo",
  "Varela Round",
  "Secular One",
  "Amatic SC",
  "Frank Ruhl Libre",
  "Miriam Libre"
];

export const Packages: React.FC<PackagesProps> = ({ highlightedPackageIndex, animatingPackageIndex, isHoverDisabled }) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [packages, setPackages] = useState(defaultPackages);

  useEffect(() => {
    let cancelled = false;
    packagesApi.getPublic()
      .then((res) => {
        if (cancelled || !res.data?.length) return;
        const overrides = new Map(res.data.map((p) => [p.key, p]));
        setPackages(defaultPackages.map((pkg) => {
          const o = overrides.get(pkg.key);
          if (!o) return pkg;
          return { ...pkg, title: o.title, englishTitle: o.englishTitle, price: `${o.price}₪` };
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Configs with updated user specified values + Gradient Controls
  // Updated Perfect Night (Index 1) with new CTA values: HUE 45, SAT 100, LIG 81, OPACITY 0.44, BLUR 18.5
  const [configs, setConfigs] = useState([
    { 
        h: 35, s: 0, l: 36, noise: 0.43, texture: 0.21, gradType: 'linear', gradAngle: 299, gradPosX: 50, gradPosY: 50, gradSize: 34, 
        ctaH: 0, ctaS: 0, ctaL: 0, ctaOpacity: 0.2, ctaGradAngle: 0, ctaGradEnabled: false, noiseIdx: 3, bottomShadowOpacity: 0.36, 
        ctaY: 17, priceY: 63, featuresMargin: 3,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 31, ctaHeight: 160, ctaFontSize: 84, ctaTextY: 9, ctaTextX: 0,
        priceScaleX: 1, priceScaleY: 0.96, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.59, priceSymbolY: 3, priceSymbolX: -4,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#FFFCF1', ctaColor: '#ffffff'
    }, // Morning After
    { 
        h: 43, s: 78, l: 60, noise: 1.28, texture: 0.19, gradType: 'linear', gradAngle: 112, gradPosX: 50, gradPosY: 50, gradSize: 50, 
        ctaH: 45, ctaS: 100, ctaL: 81, ctaGradAngle: 187, ctaGradEnabled: true, noiseIdx: 3, ctaBlur: 18.5, ctaOpacity: 0.44, bottomShadowOpacity: 0.01, 
        ctaY: 19, priceY: 63, featuresMargin: 1,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 41, ctaHeight: 183, ctaFontSize: 102.5, ctaTextY: 7, ctaTextX: 3,
        priceScaleX: 0.94, priceScaleY: 0.93, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.6, priceSymbolY: 4, priceSymbolX: 1,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#fffee5', ctaColor: '#ffffff'
    }, // Perfect Night
    { 
        h: 200, s: 0, l: 14, noise: 0.73, texture: 0.05, gradType: 'linear', gradAngle: 307, gradPosX: 50, gradPosY: 50, gradSize: 41, 
        ctaH: 0, ctaS: 0, ctaL: 0, ctaOpacity: 0.2, ctaGradAngle: 0, ctaGradEnabled: false, noiseIdx: 3, bottomShadowOpacity: 0.24, 
        ctaY: 17, priceY: 63, featuresMargin: 3,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 31, ctaHeight: 160, ctaFontSize: 84, ctaTextY: 9, ctaTextX: 0,
        priceScaleX: 1, priceScaleY: 0.96, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.59, priceSymbolY: 3, priceSymbolX: -4,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#FFFCF1', ctaColor: '#ffffff'
    } // Here I Am
  ]);
  
  void highlightedPackageIndex;
  void animatingPackageIndex;
  void isHoverDisabled;

  // Title container transforms
  const containerStyle = {
  transform: 'translateY(-25px)'
};

  return (
    <section 
      id="packages" 
     ref={sectionRef} 
      className="pt-[35px] mt-[-67px] pb-[68px] bg-[#F7F7F7] rounded-t-[40px] shadow-[0_-25px_50px_rgba(0,0,0,0.15)] relative z-[350]"
>
        <div className="max-w-[1400px] mx-auto px-6">
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Assistant:wght@200..800&family=Frank+Ruhl+Libre:wght@300..900&family=Heebo:wght@100..900&family=Miriam+Libre:wght@400;700&family=Rubik:ital,wght@0,300..900;1,300..900&family=Secular+One&family=Varela+Round&display=swap');
          `}} />
          <div className="w-full mb-[-34px] flex justify-center overflow-x-clip">
                <div
                  className="relative pt-[20px] pb-[55px] px-12 text-center"
                  style={containerStyle}
                  dir="rtl"
                >
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 w-screen" 
                      style={{ 
                        top: '27px',
                        bottom: '24px',
                        zIndex: 0
                      }} 
                    />

		                    <PackagesTitle />

                        <div 
                          className="absolute left-1/2 -translate-x-1/2 h-[1px] w-screen z-10" 
                          style={{ 
                            bottom: '40px',
                            background: 'linear-gradient(to right, #B0AAA5 0%, #66615F 20%, #66615F 80%, #B0AAA5 100%)',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                          }} 
                        />
                </div>
          </div>

          <div className="flex flex-col gap-6" dir="rtl">
            {[1, 2, 0].map((i) => {
              const pkg = packages[i];
              const cfg = configs[i];

                 const isExpanded = expandedIndex === i;
                 
                 const color1 = `hsl(${cfg.h}, ${cfg.s + 2}%, ${Math.min(98, cfg.l + 20)}%)`;
                 const color2 = `hsl(${cfg.h}, ${cfg.s}%, ${cfg.l}%)`;
                 let background = '';
                 if (cfg.gradType === 'radial') {
                    background = `radial-gradient(circle at ${cfg.gradPosX}% ${cfg.gradPosY}%, ${color1} 0%, ${color2} ${cfg.gradSize}%)`;
                 } else {
                    background = `linear-gradient(${cfg.gradAngle}deg, ${color1} 0%, ${color2} ${cfg.gradSize}%)`;
                 }
                 const backgroundStyle = { background };
                 const noiseUrl = NOISE_OPTIONS[cfg.noiseIdx || 0].url;
                 const noiseClass = (i === 0 || i === 2) ? 'grayscale' : '';

                 const opacity = cfg.ctaOpacity ?? 1;
                 const ctaBgColor = `hsla(${cfg.ctaH}, ${cfg.ctaS}%, ${cfg.ctaL}%, ${opacity})`;
                 let ctaDynamicStyle: React.CSSProperties = { background: ctaBgColor };
                 if (pkg.isPopular && cfg.ctaGradEnabled) {
                     const ctaBgColor2 = `hsla(${cfg.ctaH}, ${cfg.ctaS}%, ${Math.max(0, cfg.ctaL - 15)}%, ${opacity})`;
                     ctaDynamicStyle = { 
                        background: `linear-gradient(${cfg.ctaGradAngle}deg, ${ctaBgColor} 0%, ${ctaBgColor2} 100%)`
                     };
                 }
                 
                 const priceDigits = pkg.price.replace(/\D/g, '');
                 const priceSymbol = pkg.price.replace(/[0-9]/g, '');

                 return (
	                    <div 
	                      key={i}
	                      className={`relative rounded-[20px] overflow-hidden mb-4 shadow-lg transition-all duration-500`}
	                      style={{ ...backgroundStyle, paddingBottom: isExpanded ? '1rem' : '0' }}
	                    >
                        <div className={`absolute inset-0 pointer-events-none z-[1] mix-blend-overlay ${noiseClass}`} style={{ opacity: cfg.noise, backgroundImage: `url('${noiseUrl}')`, backgroundSize: '100% 100%' }} />
                        <div className="absolute inset-0 z-[1] brightness-110 contrast-125 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none mix-blend-overlay" style={{ opacity: cfg.texture }} />
                        
                        <div 
                          className="relative z-10 flex items-center justify-between p-6 pb-4 cursor-pointer"
                          onClick={() => setExpandedIndex(isExpanded ? null : i)}
                        >
                            <div className="text-right">
                                <h3 className="text-[32px] font-black text-white font-['Assistant'] leading-none mb-1 drop-shadow-md">{pkg.title}</h3>
                                <span className="text-sm font-bold text-white/90 uppercase tracking-widest font-['Assistant'] drop-shadow-sm">{pkg.englishTitle}</span>
                            </div>

                            <div 
                                className="w-[42px] h-[42px] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-sm active:scale-95 transition-transform"
                            >
                                <ChevronsDown className={`text-white w-[25.2px] h-[25.2px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        <div className="relative z-10 h-[1px] bg-white/30 mx-6 mb-4" />

                        <div className={`relative z-10 grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} style={{ willChange: 'grid-template-rows' }}>
                            <div className="overflow-hidden min-h-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                                <div className={`px-6 ${(i === 2 || i === 0) ? 'pb-2' : 'pb-8 md:pb-12'}`}>
                                    <ul className="flex flex-col gap-4">
                                        {pkg.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 justify-between text-right flex-row-reverse">
                                                <div className="min-w-[24px] h-[24px] rounded-lg bg-white/20 flex items-center justify-center shadow-sm">
                                                    {pkg.iconStyle === 'circle' ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <feature.Icon className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className="font-['Assistant'] font-bold text-lg text-white drop-shadow-sm leading-tight flex-1">
                                                    {feature.text.replace('[HEART]', '')}
                                                    {feature.text.includes('[HEART]') && <Heart className="inline-block w-4 h-4 fill-red-500 text-red-500 mx-1" />}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 px-6 transition-all duration-500 ease-in-out" style={{ marginTop: isExpanded && i === 1 ? '1.125rem' : '0' }}>
                            {i === 1 && (
                                <GuaranteeCard isExpanded={isExpanded} />
                            )}
                            <button
                                onClick={() => navigate(`${ROUTES.REGISTER}?package=${pkg.title}&price=${priceDigits}`)}
                                className="w-full py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all duration-500 ease-in-out flex items-center justify-between px-6 relative z-10"
                                style={ctaDynamicStyle}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-white font-['Assistant'] font-bold text-[13px] opacity-90">מחיר לחבילה</span>
                                    <div className="text-white font-['Miriam_Libre'] font-bold text-2xl leading-none flex items-baseline gap-1">
                                        <span>{priceDigits}</span>
                                        <span className="text-lg">{priceSymbol}</span>
                                    </div>
                                </div>
                                <span className="text-white font-['Assistant'] font-black text-2xl tracking-wide drop-shadow-md">
                                    {pkg.ctaText}
                                </span>
                            </button>
                        </div>
                    </div>
                 );
            })}
          </div>





        </div>
        
    </section>
  );
}
