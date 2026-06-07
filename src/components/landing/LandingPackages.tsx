import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Image as ImageIcon, Send, CheckCircle2, Square, Heart, Smartphone, Sparkles, Users, Search, Camera, Info, X } from 'lucide-react';
import { GuaranteeHighlightEffect } from '@/components/mobile-landing/utils/GuaranteeHighlightEffect';
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
      className="text-white font-['Assistant'] font-bold text-base tracking-[-0.02em] inline-flex"
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

const GuaranteeCardWeb = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full mt-4 -mb-1 bg-[#f59e0b] rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-all" onClick={() => setIsModalOpen(true)}>
        <GuaranteeText />
        <Info className="w-4 h-4 text-white opacity-90" />
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

interface LandingPackagesProps {
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
      englishTitle: "UNLIMITED",
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

const configs = [
    {
        h: 35, s: 0, l: 36, noise: 0.43, texture: 0.21, gradType: 'linear', gradAngle: 299, gradPosX: 50, gradPosY: 50, gradSize: 34,
        ctaH: 0, ctaS: 0, ctaL: 0, ctaGradAngle: 0, ctaGradEnabled: false, noiseIdx: 3, bottomShadowOpacity: 0.36,
        ctaY: 17, priceY: 63, featuresMargin: 3,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 31, ctaHeight: 160, ctaFontSize: 84, ctaTextY: 9, ctaTextX: 0,
        priceScaleX: 1, priceScaleY: 0.96, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.59, priceSymbolY: 3, priceSymbolX: -4,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#FFFCF1', ctaColor: '#ffffff',
        ctaOpacity: 1, ctaBlur: 0
    },
    {
        h: 43, s: 78, l: 60, noise: 1.28, texture: 0.19, gradType: 'linear', gradAngle: 112, gradPosX: 50, gradPosY: 50, gradSize: 50,
        ctaH: 45, ctaS: 100, ctaL: 81, ctaGradAngle: 187, ctaGradEnabled: true, noiseIdx: 3, ctaBlur: 18.5, ctaOpacity: 0.44, bottomShadowOpacity: 0.01,
        ctaY: 19, priceY: 63, featuresMargin: 1,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 41, ctaHeight: 183, ctaFontSize: 102.5, ctaTextY: 7, ctaTextX: 3,
        priceScaleX: 0.94, priceScaleY: 0.93, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.6, priceSymbolY: 4, priceSymbolX: 1,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#fffee5', ctaColor: '#ffffff'
    },
    {
        h: 200, s: 0, l: 14, noise: 0.73, texture: 0.05, gradType: 'linear', gradAngle: 307, gradPosX: 50, gradPosY: 50, gradSize: 41,
        ctaH: 0, ctaS: 0, ctaL: 0, ctaGradAngle: 0, ctaGradEnabled: false, noiseIdx: 3, bottomShadowOpacity: 0.24,
        ctaY: 17, priceY: 63, featuresMargin: 3,
        priceBgH: 0, priceBgS: 0, priceBgL: 100, priceBgA: 0, priceShowGradient: false, priceGradAngle: 180, priceShadowOpacity: 0, priceSeparatorShow: false,
        priceX: -13, priceFontSize: 31, ctaHeight: 160, ctaFontSize: 84, ctaTextY: 9, ctaTextX: 0,
        priceScaleX: 1, priceScaleY: 0.96, priceSymbolScaleX: 0.6, priceSymbolScaleY: 0.59, priceSymbolY: 3, priceSymbolX: -4,
        priceFont: 'Miriam Libre', ctaFont: 'Assistant', priceColor: '#FFFCF1', ctaColor: '#ffffff',
        ctaOpacity: 1, ctaBlur: 0
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

const LandingPackages: React.FC<LandingPackagesProps> = ({ highlightedPackageIndex, animatingPackageIndex, isHoverDisabled }) => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  const showGlow = (hoveredIndex === 1 && !isHoverDisabled) || animatingPackageIndex === 1;

  const containerStyle = {
    transform: 'translateY(-42px)'
  };

  return (
    <section id="packages" className="pt-[27px] pb-[88px] bg-[#F7F7F7] relative z-[250] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Assistant:wght@200..800&family=Frank+Ruhl+Libre:wght@300..900&family=Heebo:wght@100..900&family=Miriam+Libre:wght@400;700&family=Rubik:ital,wght@0,300..900;1,300..900&family=Secular+One&family=Varela+Round&display=swap');
          `}} />
          <div className="w-full mb-[17px] flex justify-center">
                <div
                  className="relative pt-[71px] pb-[55px] px-12 text-center"
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

                    <div className="relative z-10">
                        <h2
                          className="text-[44px] sm:text-[56px] md:text-[104px] font-black leading-none bg-clip-text text-transparent"
                          style={{
                            fontFamily: "'Assistant', sans-serif",
                            transform: 'translateX(8px) scaleY(1.07)',
                            transformOrigin: 'bottom',
                            backgroundImage: 'linear-gradient(to bottom, #000000, #78716c)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text'
                          }}
                        >
                            החבילות שלנו
                        </h2>
                        <p
                            className="font-['Assistant'] text-stone-500 font-light text-base sm:text-xl md:text-2xl mt-3 md:mt-4 tracking-wide opacity-90 transition-transform ease-out will-change-transform"
                            style={{
                              maxWidth: '800px',
                              margin: '9px auto 0',
                              transform: `scale(${showGlow ? 1.1 : 1})`,
                              transitionDuration: '700ms',
                              transitionDelay: showGlow ? '170ms' : '0ms'
                            }}
                        >
                            בחרו את הדרך המושלמת לחבר את הרגעים המיוחדים
                        </p>
                    </div>

                    <div
                      className="absolute left-1/2 -translate-x-1/2 h-[1px] w-screen z-10"
                      style={{
                        bottom: '24px',
                        background: 'linear-gradient(to right, #B0AAA5 0%, #66615F 20%, #66615F 80%, #B0AAA5 100%)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-end max-w-[500px] lg:max-w-none mx-auto" dir="rtl">
            {packages.map((pkg, i) => {
              const cfg = configs[i];
              const isSpinnerActive = highlightedPackageIndex === i;
              const isAnimating = animatingPackageIndex === i;
              const baseScale = pkg.isPopular ? 1.08 : 1;

              const baseTranslateClass = i === 0 ? 'lg:-translate-y-[59px]' : (i === 2 ? 'lg:-translate-y-[164px]' : '');

              const hitAreaHeight = pkg.isPopular ? '80px' : '40px';
              const hitAreaBottom = `-${hitAreaHeight}`;

              const color1 = `hsl(${cfg.h}, ${cfg.s + 2}%, ${Math.min(98, cfg.l + 20)}%)`;
              const color2 = `hsl(${cfg.h}, ${cfg.s}%, ${cfg.l}%)`;

              let background = '';
              if (cfg.gradType === 'radial') {
                 background = `radial-gradient(circle at ${cfg.gradPosX}% ${cfg.gradPosY}%, ${color1} 0%, ${color2} ${cfg.gradSize}%)`;
              } else {
                 background = `linear-gradient(${cfg.gradAngle}deg, ${color1} 0%, ${color2} ${cfg.gradSize}%)`;
              }

              const backgroundStyle = { background };

              const isHovered = hoveredIndex === i && !isHoverDisabled;
              const transformStyle = isAnimating
                  ? 'none'
                  : `scale(${baseScale}) ${isHovered ? 'translateY(-20px)' : 'translateY(0)'} translateZ(0)`;

              const framePadding = pkg.isPopular
                  ? 'p-[4px] bg-white/60'
                  : 'p-[4px] bg-black/5';

              const innerBorderRadius = pkg.isPopular ? 'rounded-[37px]' : 'rounded-[40px]';

              let titleClasses = '';
              if (pkg.isPopular) {
                titleClasses = 'text-[65px] tracking-[-0.035em] drop-shadow-[0_2.7px_1.8px_rgba(0,0,0,0.07)]';
              } else if (i === 0) {
                titleClasses = 'text-[44px] tracking-tight drop-shadow-[0_1.6px_1.6px_rgba(0,0,0,0.25)]';
              } else {
                titleClasses = 'text-[44px] tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]';
              }

              let subtitleClasses = '';
              if (pkg.isPopular) {
                 subtitleClasses = 'opacity-90 text-[16px] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.1)]';
              } else if (i === 2) {
                 subtitleClasses = 'opacity-80 text-sm drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.1)]';
              } else {
                 subtitleClasses = 'opacity-80 text-sm drop-shadow-sm';
              }

              const subtitleTranslateClass = pkg.isPopular ? 'translate-y-[-10px]' : 'translate-y-[-5px]';

              const featureFontWeight = 'font-black';
              const featureTextSize = pkg.isPopular ? 'text-[22.5px]' : 'text-[20.5px]';
              const featureTracking = 'tracking-[0.02em]';

              let featureShadowClass = '';
              if (pkg.isPopular) {
                  featureShadowClass = 'drop-shadow-[0_1.3px_0.58px_rgba(0,0,0,0.13)] tracking-tight';
              } else if (i === 0) {
                  featureShadowClass = 'drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.10)]';
              } else if (i === 2) {
                  featureShadowClass = 'drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.10)]';
              } else {
                  featureShadowClass = 'drop-shadow-sm';
              }

              let ctaDynamicStyle: React.CSSProperties = {};
              let ctaColorClass = 'text-white';

              if (pkg.isPopular) {
                  const opacity = cfg.ctaOpacity ?? 1;
                  const blur = cfg.ctaBlur ?? 0;

                  const ctaBgColor = `hsla(${cfg.ctaH}, ${cfg.ctaS}%, ${cfg.ctaL}%, ${opacity})`;
                  if (cfg.ctaGradEnabled) {
                      const ctaBgColor2 = `hsla(${cfg.ctaH}, ${cfg.ctaS}%, ${Math.max(0, cfg.ctaL - 15)}%, ${opacity})`;
                      ctaDynamicStyle = {
                          background: `linear-gradient(${cfg.ctaGradAngle}deg, ${ctaBgColor} 0%, ${ctaBgColor2} 100%)`,
                          backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                          WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                      };
                  } else {
                      ctaDynamicStyle = {
                          background: ctaBgColor,
                          backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                          WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                      };
                  }
                  ctaColorClass += ' shadow-[0_13.5px_18px_-5px_rgba(0,0,0,0.1),0_5.4px_7.2px_-4px_rgba(0,0,0,0.1)] hover:brightness-110';
              } else {
                  ctaColorClass += ' bg-white/30 hover:bg-white/40 border border-white/30';
              }

              const ctaTextSize = `text-[${cfg.ctaFontSize}px]`;
              const ctaStroke = pkg.isPopular ? '' : (pkg.useStroke ? '[-webkit-text-stroke:1.2px_white]' : '');

              const ctaTextShadowClass = pkg.isPopular
                  ? 'drop-shadow-[0_1.8px_1.8px_rgba(0,0,0,0.09)]'
                  : 'drop-shadow-md';

              const ctaTextTracking = pkg.isPopular ? 'tracking-[-0.01em]' : 'tracking-wide';

              let iconPositionClass = '';
              if (i === 0) {
                  iconPositionClass = '-top-[5px]';
              } else if (i === 1) {
                  iconPositionClass = '-top-[4px]';
              } else if (i === 2) {
                  iconPositionClass = '-top-[5px]';
              }

              const separatorClass = pkg.isPopular ? 'bg-white/70 shadow-[0_1px_1px_rgba(0,0,0,0.05)]' : 'bg-white/30';

              let separatorPosClass = pkg.isPopular ? 'bottom-[23px]' : 'bottom-[22px]';
              if (i === 2) {
                  separatorPosClass = 'bottom-[21px]';
              }

              const priceTranslateX = `translate-x-[${cfg.priceX}px]`;
              const priceSizeClass = `text-[${cfg.priceFontSize}px]`;

              const priceContainerClass = pkg.isPopular ? 'mb-6 text-center pt-[10px]' : 'mb-6 text-center';
              const priceShadowClass = pkg.isPopular
                  ? 'drop-shadow-[0_2px_1.2px_rgba(0,0,0,0.20)]'
                  : 'drop-shadow-md';

              const featuresListWidth = pkg.isPopular ? 'w-[96%]' : 'w-[94%]';

              const noiseClass = (i === 0 || i === 2) ? 'grayscale' : '';

              const priceDigits = pkg.price.replace(/\D/g, '');
              const priceSymbol = pkg.price.replace(/[0-9]/g, '');

              const noiseUrl = NOISE_OPTIONS[cfg.noiseIdx || 0].url;

              return (
                <div
                  key={i}
                  className={`relative group transition-all duration-500 ease-out transform-gpu will-change-transform ${baseTranslateClass} ${pkg.isPopular ? 'z-20 hover:z-30' : 'z-10 hover:z-30'}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div className="absolute left-0 right-0 bg-transparent z-0" style={{ height: hitAreaHeight, bottom: hitAreaBottom }} />

                    <div
                        className={`relative rounded-[40px] overflow-hidden ${pkg.shadow} transition-all duration-500 group flex flex-col ${framePadding}
                            ${isAnimating ? 'animate-highlight-pop' : ''}
                            ${pkg.isPopular ? 'min-h-[720px] shadow-2xl' : ''}
                            will-change-transform
                        `}
                        style={{
                            transform: transformStyle,
                            '--base-scale': baseScale,
                            backfaceVisibility: 'hidden',
                            transformStyle: 'preserve-3d',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                        } as React.CSSProperties}
                    >
                        <div className={`absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none transition-opacity duration-1000 z-0 ${isSpinnerActive ? 'opacity-100' : 'opacity-0'}`}>
                           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_4s_linear_infinite]"
                                style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 180deg, #FFF176 270deg, #FFEB33 310deg, transparent 360deg)' }} />
                        </div>

                        <div
                            className={`relative z-10 w-full flex-grow ${innerBorderRadius} overflow-hidden flex flex-col`}
                            style={backgroundStyle}
                        >
                            <div
                                className={`absolute inset-0 pointer-events-none z-[1] mix-blend-overlay ${noiseClass}`}
                                style={{
                                    opacity: cfg.noise,
                                    backgroundImage: `url('${noiseUrl}')`,
                                    backgroundSize: '100% 100%'
                                }}
                            />
                            <div
                                className="absolute inset-0 z-[1] brightness-110 contrast-125 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none mix-blend-overlay"
                                style={{ opacity: cfg.texture }}
                            />

                            <div
                                className="absolute bottom-0 left-0 right-0 h-[40%] z-[2] pointer-events-none"
                                style={{
                                    background: `linear-gradient(to top, rgba(0,0,0,${cfg.bottomShadowOpacity || 0.4}) 0%, transparent 100%)`
                                }}
                            />

                            <div
                                className={`relative flex flex-col items-center justify-center z-10 ${pkg.isPopular ? 'h-52 pt-[15px] px-6 pb-6' : 'h-44 p-6'}`}
                            >
                                <h3
                                  className={`font-['Assistant'] font-black mb-0.5 relative z-20 transition-transform duration-500 ease-out text-white ${titleClasses} will-change-transform subpixel-antialiased`}
                                  style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
                                >
                                    {pkg.title}
                                </h3>
                                <span
                                  className={`font-['Assistant'] font-black tracking-[0.1em] uppercase relative z-20 ${subtitleTranslateClass} transition-transform duration-500 ease-out text-white ${subtitleClasses} will-change-transform subpixel-antialiased`}
                                  style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
                                >
                                    {pkg.englishTitle}
                                </span>

                                <div className={`absolute left-1/2 -translate-x-1/2 ml-[-2px] w-16 h-1 rounded-full ${separatorPosClass} ${separatorClass}`} />
                            </div>

                            <div className={`px-8 pt-[15px] pb-0 flex-grow flex flex-col relative z-10 items-center`}>
                                <ul
                                  className={`space-y-5 ${featuresListWidth}`}
                                >
                                    {pkg.features.map((feature, idx) => {
                                        let featureIconPos = iconPositionClass;
                                        if (i === 2 && idx === 1) {
                                           featureIconPos = '-top-[4px]';
                                        }

                                        return (
                                        <li
                                          key={idx}
                                          className="flex items-start gap-4"
                                        >
                                            <div
                                              className={`mt-1 relative ${featureIconPos} min-w-[28px] h-[28px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${pkg.iconStyle === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-white/20 backdrop-blur-sm shadow-sm`}
                                            >
                                                {pkg.iconStyle === 'circle' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                                                ) : (
                                                    <div className="relative">
                                                        <Square className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                                                        <feature.Icon className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" strokeWidth={2.5} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`font-['Assistant'] font-black leading-tight ${featureTextSize} ${featureFontWeight} flex items-center gap-1.5 text-white/100 ${featureShadowClass} ${featureTracking}`}>
                                                {feature.text.includes('[HEART]') ? (
                                                    <>
                                                        {feature.text.split('[HEART]')[0]}
                                                        <Heart className="w-[20px] h-[20px] fill-red-500 text-red-500" strokeWidth={0} />
                                                        {feature.text.split('[HEART]')[1]}
                                                    </>
                                                ) : feature.text}
                                            </span>
                                        </li>
                                    )})}
                                </ul>

                                {pkg.isPopular && (
                                    <GuaranteeCardWeb />
                                )}

                                <div className={`relative group/btn w-full ${pkg.isPopular ? '' : 'mt-[12px]'} z-20`}>
                                    <button
                                      onClick={() => navigate(`${ROUTES.REGISTER}?package=${encodeURIComponent(pkg.englishTitle)}&price=${pkg.price.replace(/\D/g, '')}`)}
                                      className={`py-4.5 rounded-none transition-transform duration-300 relative overflow-hidden group mb-0 z-10 block cursor-pointer
                                        ${ctaColorClass}
                                        w-[calc(100%+64px)] -mx-8
                                        h-[${cfg.ctaHeight}px]
                                        ${ctaStroke}
                                      `}
                                      style={{
                                        ...ctaDynamicStyle,
                                        backfaceVisibility: 'hidden',
                                        transform: 'translateZ(0)',
                                        WebkitFontSmoothing: 'antialiased'
                                      }}
                                    >
                                      {pkg.isPopular && (
                                         <>
                                           <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                              <div className="sheen-element-btn absolute top-0 left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-25deg]" />
                                            </div>
                                         </>
                                      )}
                                      <span
                                        className={`absolute left-0 right-0 text-center z-10 inline-block leading-none ${ctaTextShadowClass} ${pkg.isPopular ? 'translate-x-[1px]' : ''} ${ctaTextTracking} ${ctaTextSize} font-black`}
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transformStyle: 'preserve-3d',
                                            top: `${cfg.ctaTextY}%`,
                                            transform: `translateX(${cfg.ctaTextX || 0}px)`,
                                            fontFamily: `"${cfg.ctaFont}", sans-serif`,
                                            color: cfg.ctaColor
                                        }}
                                      >
                                        <span className="inline-block transition-transform duration-200 group-active:scale-[0.9]">
                                            {pkg.ctaText}
                                        </span>
                                      </span>

                                      <div
                                        className={`absolute left-0 right-0 text-center z-10 w-full flex justify-center items-center ${priceSizeClass} font-black tracking-tight ${priceTranslateX} ${priceShadowClass}`}
                                        style={{
                                            top: `${cfg.priceY}%`,
                                            fontFamily: `"${cfg.priceFont}", sans-serif`,
                                            color: cfg.priceColor,
                                            backfaceVisibility: 'hidden',
                                            transformStyle: 'preserve-3d',
                                            willChange: 'transform'
                                        }}
                                      >
                                          <span
                                              className="inline-block origin-center"
                                              style={{ transform: `scale(${cfg.priceScaleX}, ${cfg.priceScaleY})` }}
                                          >
                                              {priceDigits}
                                          </span>
                                          <span
                                              className="inline-block origin-center mr-[-10px]"
                                              style={{ transform: `translate(${cfg.priceSymbolX || 0}px, ${cfg.priceSymbolY}px) scale(${cfg.priceSymbolScaleX}, ${cfg.priceSymbolScaleY})` }}
                                          >
                                              {priceSymbol}
                                          </span>
                                      </div>
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
    </section>
  );
};

export default LandingPackages;