import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowDown, Star, Heart, Eye as EyeIcon } from 'lucide-react';
import { CelebrationButton } from './CelebrationButton';
import { PhoneMockup } from './PhoneMockup';
import { FloatingPhoto } from './FloatingPhoto';
import { WEDDING_IMAGES } from './constants';

const DESKTOP_PATHS = {
  leftTop: {
    startOffsetX: -22,
    startOffsetY: -261,
    endOffsetX: 15,
    endOffsetY: -120,
    control1OffsetX: -126,
    control1OffsetY: 48,
    control2OffsetX: 93,
    control2OffsetY: -133
  },
  left: {
    startOffsetX: -22,
    startOffsetY: -141,
    endOffsetX: 15,
    endOffsetY: 0,
    control1OffsetX: -126,
    control1OffsetY: 168,
    control2OffsetX: 93,
    control2OffsetY: -13
  },
  leftBottom: {
    startOffsetX: -22,
    startOffsetY: -21,
    endOffsetX: 15,
    endOffsetY: 120,
    control1OffsetX: -126,
    control1OffsetY: 288,
    control2OffsetX: 93,
    control2OffsetY: 107
  },
  right: {
    startOffsetX: 56,
    startOffsetY: -500,
    endOffsetX: 20,
    endOffsetY: -52,
    control1OffsetX: 170,
    control1OffsetY: -87,
    control2OffsetX: 51,
    control2OffsetY: -100
  },
  right2: {
    startOffsetX: 80,
    startOffsetY: 201,
    endOffsetX: 20,
    endOffsetY: 231,
    control1OffsetX: 170,
    control1OffsetY: 418,
    control2OffsetX: 110,
    control2OffsetY: 30
  }
};

const MOBILE_PATHS = {
  leftTop: {
    startOffsetX: -22,
    startOffsetY: -261,
    endOffsetX: 21,
    endOffsetY: -144,
    control1OffsetX: -126,
    control1OffsetY: 48,
    control2OffsetX: -230,
    control2OffsetY: -267
  },
  left: {
    startOffsetX: -22,
    startOffsetY: -141,
    endOffsetX: 3,
    endOffsetY: 32,
    control1OffsetX: -126,
    control1OffsetY: 168,
    control2OffsetX: -70,
    control2OffsetY: 2
  },
  leftBottom: {
    startOffsetX: -22,
    startOffsetY: -21,
    endOffsetX: -18,
    endOffsetY: 179,
    control1OffsetX: -126,
    control1OffsetY: 288,
    control2OffsetX: -79,
    control2OffsetY: 240
  },
  right: {
    startOffsetX: 56,
    startOffsetY: -500,
    endOffsetX: -44,
    endOffsetY: -90,
    control1OffsetX: 170,
    control1OffsetY: -87,
    control2OffsetX: 119,
    control2OffsetY: -37
  },
  right2: {
    startOffsetX: 80,
    startOffsetY: 201,
    endOffsetX: 23,
    endOffsetY: 217,
    control1OffsetX: 170,
    control1OffsetY: 418,
    control2OffsetX: 110,
    control2OffsetY: 30
  }
};

const CustomEye = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" strokeWidth="inherit" />
    <circle cx="12" cy="12" r="3" strokeWidth="inherit" />
  </svg>
);

export const Experience: React.FC<{ onMoreInfoClick: () => void; onGiantClick: () => void }> = ({ onMoreInfoClick, onGiantClick }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const isMobile = windowWidth < 1024;

  // Layout Config State
  const [layoutConfig, setLayoutConfig] = useState<any>({
    headlineScale: 1.4,
    headlineY: -32,
    headlineX: 0,
    subtextScale: 0.8,
    subtextY: -31,
    subtextX: 0,
    ctaScale: 1,
    ctaY: 0,
    ctaX: 0,
    phoneScale: 0.9,
    phoneY: -179,
    phoneX: 5,
    giantScale: 0.9,
    giantY: -122,
    giantX: 0,
    giantGradH: 47,
    giantGradS: 84,
    giantGradL: 66,
    giantGradPos1: 17,
    giantGradH2: 47,
    giantGradS2: 92,
    giantGradL2: 66,
    giantGradPos2: 50,
    giantGradH3: 46,
    giantGradS3: 84,
    giantGradL3: 74,
    giantGradPos3: 62,
    giantGradH4: 46,
    giantGradS4: 84,
    giantGradL4: 94,
    giantGradPos4: 100,
    giantGradAngle: 196,
    giantGradType: 'linear',
    giantGradEnabled: true,
    giantGradOpacity: 1,
    giantGradBlur: 0,
    giantBorderRadiusTL: 14,
    giantBorderRadiusTR: 14,
    giantBorderRadiusBL: 15,
    giantBorderRadiusBR: 14,
    giantFont: "Assistant",
    giantColor: "#ffffff",
    giantText: "איך זה נראה",
    giantFontSize: 48,
    giantPaddingX: 30,
    giantPaddingY: 0,
    giantIconName: "Eye",
    headlineText: "אל תפספסו\nשניה אחת",
    subtextText: "במקום לרדוף אחרי תמונות בווצאפ – המערכת שלנו אוספת עבורכם את כל התמונות והסרטונים מהאורחים למקום אחד ובאיכות הגבוהה ביותר,\nכבר בבוקר שאחרי.",
    sectionPaddingBottom: 30,
    showPaths: false,
    elements: {},
    paths: {
        leftTop: {
          startOffsetX: -22,
          startOffsetY: -244,
          endOffsetX: 21,
          endOffsetY: -127,
          control1OffsetX: -126,
          control1OffsetY: 48,
          control2OffsetX: -230,
          control2OffsetY: -250
        },
        left: {
          startOffsetX: -22,
          startOffsetY: -124,
          endOffsetX: 3,
          endOffsetY: 49,
          control1OffsetX: -126,
          control1OffsetY: 168,
          control2OffsetX: -70,
          control2OffsetY: 19
        },
        leftBottom: {
          startOffsetX: -22,
          startOffsetY: -4,
          endOffsetX: -18,
          endOffsetY: 196,
          control1OffsetX: -126,
          control1OffsetY: 305,
          control2OffsetX: -79,
          control2OffsetY: 257
        },
        right: {
          startOffsetX: 56,
          startOffsetY: -483,
          endOffsetX: -44,
          endOffsetY: -73,
          control1OffsetX: 170,
          control1OffsetY: -70,
          control2OffsetX: 119,
          control2OffsetY: -20
        },
        right2: {
          startOffsetX: 80,
          startOffsetY: 218,
          endOffsetX: 23,
          endOffsetY: 234,
          control1OffsetX: 170,
          control1OffsetY: 435,
          control2OffsetX: 110,
          control2OffsetY: 47
        }
      }
    });

  const getElementStyle = (id: string) => {
    const settings = layoutConfig.elements?.[id];
    if (!settings) return {};
    return {
      marginTop: `${settings.marginTop}px`,
      marginBottom: `${settings.marginBottom}px`,
      paddingTop: `${settings.paddingTop}px`,
      paddingBottom: `${settings.paddingBottom}px`,
      lineHeight: settings.lineHeight,
    };
  };
  
  // Config state
  const [anchorY, setAnchorY] = useState(241);

  // Configuration for consistent spacing
  const IMG_WIDTH = 41.1; // Width of the photo in pixels (Increased by 15% from 35.7px)
  const VISUAL_GAP = 20; // Desired gap in pixels (Increased to ensure white space and no overlap)
  const DESIRED_UNIT = IMG_WIDTH + VISUAL_GAP;
  const SPEED_PX_PER_SEC = isMobile ? 25.71 : 30.25; // 15% slower on mobile (30.25 * 0.85)

  // State for 5 paths
  const [paths, setPaths] = useState<{
    leftTop: { d: string; length: number; rawD: string };
    left: { d: string; length: number; rawD: string };
    leftBottom: { d: string; length: number; rawD: string };
    right: { d: string; length: number; rawD: string };
    right2: { d: string; length: number; rawD: string };
  }>({
    leftTop: { d: "", length: 0, rawD: "" },
    left: { d: "", length: 0, rawD: "" },
    leftBottom: { d: "", length: 0, rawD: "" },
    right: { d: "", length: 0, rawD: "" },
    right2: { d: "", length: 0, rawD: "" }
  });

  // Phone Center State
  const [phoneCenter, setPhoneCenter] = useState({ x: 0, y: 0 });
  
  const phoneRef = useRef<HTMLDivElement>(null);
  const giantRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState({ distance: 0, width: 0, height: 0 });

  useEffect(() => {
    if (isMobile && phoneRef.current && giantRef.current) {
      const phoneRect = phoneRef.current.getBoundingClientRect();
      const giantRect = giantRef.current.getBoundingClientRect();
      setMeasurements({
        distance: Math.round(giantRect.top - phoneRect.bottom),
        width: Math.round(giantRect.width),
        height: Math.round(giantRect.height)
      });
    }
  }, [isMobile, layoutConfig, sectionSize]);

  // Dragging State
  const [draggedPoint, setDraggedPoint] = useState<{
    pathKey: keyof typeof layoutConfig.paths;
    pointType: 'start' | 'end' | 'control1' | 'control2';
  } | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLayoutConfig(prev => ({
      ...prev,
      paths: isMobile ? MOBILE_PATHS : DESKTOP_PATHS
    }));
  }, [isMobile]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const updateSize = () => {
      if (sectionRef.current) {
        const { width, height } = sectionRef.current.getBoundingClientRect();
        
        // Only update if width changes or height changes significantly (to avoid mobile address bar resets)
        setSectionSize(prev => {
          if (prev.width !== width || Math.abs(prev.height - height) > 150) {
            return { width, height };
          }
          return prev;
        });
      }
    };

    // Initial size
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sectionSize.width === 0 || sectionSize.height === 0) return;

    const updatePaths = () => {
      const w = sectionSize.width;
      const h = sectionSize.height;
      const section = sectionRef.current;
      
      const phoneContainer = document.getElementById('phone-mockup-container');
      
      let phoneCenterX = w / 2;
      let phoneCenterY = h / 2;

      if (phoneContainer && section) {
        const phoneRect = phoneContainer.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        
        phoneCenterX = phoneRect.left + phoneRect.width / 2 - sectionRect.left;
        phoneCenterY = phoneRect.top + phoneRect.height / 2 - sectionRect.top;
      }
      
      setPhoneCenter({ x: phoneCenterX, y: phoneCenterY });

      // Apply offsets
      const { leftTop, left, leftBottom, right, right2 } = layoutConfig.paths;

      // 1. Left Top Path
      const startXLeftTop = leftTop.startOffsetX;
      const startYLeftTop = phoneCenterY + leftTop.startOffsetY;
      const endXLeftTop = phoneCenterX + leftTop.endOffsetX;
      const endYLeftTop = phoneCenterY + leftTop.endOffsetY;
      const cp1XLeftTop = (w * 0.2) + leftTop.control1OffsetX;
      const cp1YLeftTop = (phoneCenterY - 50) + leftTop.control1OffsetY;
      const cp2XLeftTop = (w * 0.4) + leftTop.control2OffsetX;
      const cp2YLeftTop = (phoneCenterY - 20) + leftTop.control2OffsetY;
      const dLeftTop = `M ${startXLeftTop} ${startYLeftTop} C ${cp1XLeftTop} ${cp1YLeftTop} ${cp2XLeftTop} ${cp2YLeftTop} ${endXLeftTop} ${endYLeftTop}`;

      // 2. Left Path (Arrow 1) - Coming from Left
      const startX1 = left.startOffsetX;
      const startY1 = phoneCenterY + left.startOffsetY;
      const endX1 = phoneCenterX + left.endOffsetX;
      const endY1 = phoneCenterY + left.endOffsetY;
      const cp1X1 = (w * 0.2) + left.control1OffsetX;
      const cp1Y1 = (phoneCenterY - 50) + left.control1OffsetY;
      const cp2X1 = (w * 0.4) + left.control2OffsetX;
      const cp2Y1 = (phoneCenterY - 20) + left.control2OffsetY;
      const d1 = `M ${startX1} ${startY1} C ${cp1X1} ${cp1Y1} ${cp2X1} ${cp2Y1} ${endX1} ${endY1}`;

      // 3. Left Bottom Path
      const startXLeftBottom = leftBottom.startOffsetX;
      const startYLeftBottom = phoneCenterY + leftBottom.startOffsetY;
      const endXLeftBottom = phoneCenterX + leftBottom.endOffsetX;
      const endYLeftBottom = phoneCenterY + leftBottom.endOffsetY;
      const cp1XLeftBottom = (w * 0.2) + leftBottom.control1OffsetX;
      const cp1YLeftBottom = (phoneCenterY - 50) + leftBottom.control1OffsetY;
      const cp2XLeftBottom = (w * 0.4) + leftBottom.control2OffsetX;
      const cp2YLeftBottom = (phoneCenterY - 20) + leftBottom.control2OffsetY;
      const dLeftBottom = `M ${startXLeftBottom} ${startYLeftBottom} C ${cp1XLeftBottom} ${cp1YLeftBottom} ${cp2XLeftBottom} ${cp2YLeftBottom} ${endXLeftBottom} ${endYLeftBottom}`;

      // 4. Right Path (Arrow 2) - Coming from Right
      const startX2 = w + right.startOffsetX;
      const startY2 = phoneCenterY + right.startOffsetY;
      const endX2 = phoneCenterX + right.endOffsetX;
      const endY2 = phoneCenterY + right.endOffsetY;
      const cp1X2 = (w * 0.8) + right.control1OffsetX;
      const cp1Y2 = (phoneCenterY - 50) + right.control1OffsetY;
      const cp2X2 = (w * 0.6) + right.control2OffsetX;
      const cp2Y2 = (phoneCenterY - 20) + right.control2OffsetY;
      const d2 = `M ${startX2} ${startY2} C ${cp1X2} ${cp1Y2} ${cp2X2} ${cp2Y2} ${endX2} ${endY2}`;

      // 5. Right 2 Path (Arrow 3) - Coming from Right (Lower)
      const startX3 = w + right2.startOffsetX;
      const startY3 = phoneCenterY + right2.startOffsetY;
      const endX3 = phoneCenterX + right2.endOffsetX;
      const endY3 = phoneCenterY + right2.endOffsetY;
      const cp1X3 = (w * 0.8) + right2.control1OffsetX;
      const cp1Y3 = (phoneCenterY - 50) + right2.control1OffsetY;
      const cp2X3 = (w * 0.6) + right2.control2OffsetX;
      const cp2Y3 = (phoneCenterY - 20) + right2.control2OffsetY;
      const d3 = `M ${startX3} ${startY3} C ${cp1X3} ${cp1Y3} ${cp2X3} ${cp2Y3} ${endX3} ${endY3}`;

      // Helper to get length
      const getLength = (d: string) => {
        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("d", d);
        return pathEl.getTotalLength();
      };

      setPaths({
        leftTop: { d: `path("${dLeftTop}")`, length: getLength(dLeftTop), rawD: dLeftTop },
        left: { d: `path("${d1}")`, length: getLength(d1), rawD: d1 },
        leftBottom: { d: `path("${dLeftBottom}")`, length: getLength(dLeftBottom), rawD: dLeftBottom },
        right: { d: `path("${d2}")`, length: getLength(d2), rawD: d2 },
        right2: { d: `path("${d3}")`, length: getLength(d3), rawD: d3 }
      });
    };
    
    // Initial update
    updatePaths();
    
  }, [sectionSize, anchorY, layoutConfig.paths]);

  const handlePointerDown = (
    e: React.PointerEvent, 
    pathKey: keyof typeof layoutConfig.paths, 
    pointType: 'start' | 'end' | 'control1' | 'control2'
  ) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggedPoint({ pathKey, pointType });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedPoint || !sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = sectionSize.width;
    const { x: phoneCenterX, y: phoneCenterY } = phoneCenter;

    const { pathKey, pointType } = draggedPoint;
    let newOffsetX = 0;
    let newOffsetY = 0;

    // Determine base values based on pathKey and pointType
    // Left paths: leftTop, left, leftBottom
    // Right paths: right, right2
    const isLeft = pathKey.startsWith('left');

    if (pointType === 'start') {
      const baseX = isLeft ? 0 : w;
      const baseY = phoneCenterY;
      newOffsetX = x - baseX;
      newOffsetY = y - baseY;
    } else if (pointType === 'end') {
      const baseX = phoneCenterX;
      const baseY = phoneCenterY;
      newOffsetX = x - baseX;
      newOffsetY = y - baseY;
    } else if (pointType === 'control1') {
      const baseX = isLeft ? w * 0.2 : w * 0.8;
      const baseY = phoneCenterY - 50;
      newOffsetX = x - baseX;
      newOffsetY = y - baseY;
    } else if (pointType === 'control2') {
      const baseX = isLeft ? w * 0.4 : w * 0.6;
      const baseY = phoneCenterY - 20;
      newOffsetX = x - baseX;
      newOffsetY = y - baseY;
    }

    setLayoutConfig(prev => ({
      ...prev,
      paths: {
        ...prev.paths,
        [pathKey]: {
          ...prev.paths[pathKey],
          [`${pointType}OffsetX`]: Math.round(newOffsetX),
          [`${pointType}OffsetY`]: Math.round(newOffsetY)
        }
      }
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedPoint) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggedPoint(null);
    }
  };

  const groups = useMemo(() => {
    // Split images into 5 groups
    const chunkSize = Math.ceil(WEDDING_IMAGES.length / 5);
    const images1 = WEDDING_IMAGES.slice(0, chunkSize);
    const images2 = WEDDING_IMAGES.slice(chunkSize, chunkSize * 2);
    const images3 = WEDDING_IMAGES.slice(chunkSize * 2, chunkSize * 3);
    const images4 = WEDDING_IMAGES.slice(chunkSize * 3, chunkSize * 4);
    const images5 = WEDDING_IMAGES.slice(chunkSize * 4);

    const createGroupConfig = (images: string[], pathLength: number) => {
      if (pathLength === 0 || images.length === 0) return { floatingImages: [], duration: 0, gap: 0 };
      
      const count = Math.max(1, Math.floor(pathLength / DESIRED_UNIT));
      const totalDuration = pathLength / SPEED_PX_PER_SEC;
      const singleGapDuration = totalDuration / count;

      let groupImages: string[] = [];
      while (groupImages.length < count) {
        groupImages = [...groupImages, ...images];
      }
      groupImages = groupImages.slice(0, count);

      return {
        floatingImages: groupImages,
        duration: totalDuration,
        gap: singleGapDuration
      };
    };

    return {
      leftTop: createGroupConfig(images1, paths.leftTop.length),
      left: createGroupConfig(images2, paths.left.length),
      leftBottom: createGroupConfig(images3, paths.leftBottom.length),
      right: createGroupConfig(images4, paths.right.length),
      right2: createGroupConfig(images5, paths.right2.length)
    };
  }, [paths, DESIRED_UNIT, SPEED_PX_PER_SEC]);

  const baseButtonSize = 36.9; 
  const scaleW = sectionSize.width / 1920;
  // TopPage logic: (baseButtonSize * scaleW) + 4.5
  // We want 10% smaller than previous (which was 20% larger than TopPage):
  // Previous: * 1.2
  // New: * 1.2 * 0.9 = * 1.08
  // User requested 20% reduction twice (0.8 * 0.8 = 0.64), then 25% increase (0.64 * 1.25 = 0.8)
  // Then requested 2pt larger (approx 2.7px)
  const buttonFontSize = (((baseButtonSize * scaleW) + 4.5) * 1.08 * 0.8) + 2.7;

  const getGiantIcon = () => {
    switch (layoutConfig.giantIconName) {
      case 'ArrowDown': return ArrowDown;
      case 'Star': return Star;
      case 'Heart': return Heart;
      case 'Eye': 
      default: return CustomEye;
    }
  };

  return (
      <section 
        id="experience" 
        ref={sectionRef}
        className={`relative z-[300] md:min-h-screen flex flex-col items-center bg-[#EDEDED] pt-[38px] md:pt-[46px] pb-0 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden`}
        style={{ paddingBottom: `${layoutConfig.sectionPaddingBottom}px` }}
        >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(225,29,72,0.03)_0%,transparent_50%)]" />
        
        {/* Floating Photos Wrapper - Clips photos to section bounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Photos Stream - Left Top Group */}
            <div 
              className="flow-container transform translate-y-0" 
              style={{ 
                '--wedding-path': paths.leftTop.d,
                zIndex: isMobile ? 10 : 300
              } as React.CSSProperties}
            >
              {groups.leftTop.floatingImages.map((src, i) => (
                <FloatingPhoto 
                  key={`leftTop-${i}`} 
                  src={src} 
                  index={i} 
                  total={groups.leftTop.floatingImages.length} 
                  duration={groups.leftTop.duration}
                  gap={groups.leftTop.gap}
                  flip={true}
                />
              ))}
            </div>

            {/* Floating Photos Stream - Left Group */}
            <div 
              className="flow-container transform translate-y-0" 
              style={{ 
                '--wedding-path': paths.left.d,
                zIndex: isMobile ? 10 : 300
              } as React.CSSProperties}
            >
              {groups.left.floatingImages.map((src, i) => (
                <FloatingPhoto 
                  key={`left-${i}`} 
                  src={src} 
                  index={i} 
                  total={groups.left.floatingImages.length} 
                  duration={groups.left.duration}
                  gap={groups.left.gap}
                  flip={true}
                />
              ))}
            </div>

            {/* Floating Photos Stream - Left Bottom Group */}
            <div 
              className="flow-container transform translate-y-0" 
              style={{ 
                '--wedding-path': paths.leftBottom.d,
                zIndex: isMobile ? 10 : 300
              } as React.CSSProperties}
            >
              {groups.leftBottom.floatingImages.map((src, i) => (
                <FloatingPhoto 
                  key={`leftBottom-${i}`} 
                  src={src} 
                  index={i} 
                  total={groups.leftBottom.floatingImages.length} 
                  duration={groups.leftBottom.duration}
                  gap={groups.leftBottom.gap}
                  flip={true}
                />
              ))}
            </div>

            {/* Floating Photos Stream - Right Group */}
            <div 
              className="flow-container transform translate-y-0" 
              style={{ 
                '--wedding-path': paths.right.d,
                zIndex: isMobile ? 10 : 300
              } as React.CSSProperties}
            >
              {groups.right.floatingImages.map((src, i) => (
                <FloatingPhoto 
                  key={`right-${i}`} 
                  src={src} 
                  index={i} 
                  total={groups.right.floatingImages.length} 
                  duration={groups.right.duration}
                  gap={groups.right.gap}
                />
              ))}
            </div>

            {/* Floating Photos Stream - Right 2 Group */}
            <div 
              className="flow-container transform translate-y-0" 
              style={{ 
                '--wedding-path': paths.right2.d,
                zIndex: isMobile ? 10 : 300
              } as React.CSSProperties}
            >
              {groups.right2.floatingImages.map((src, i) => (
                <FloatingPhoto 
                  key={`right2-${i}`} 
                  src={src} 
                  index={i} 
                  total={groups.right2.floatingImages.length} 
                  duration={groups.right2.duration}
                  gap={groups.right2.gap}
                />
              ))}
            </div>
        </div>

        {/* Main Content Wrapper - Flex-grow to center the grid in available space on desktop */}
        <div className={`w-full ${isMobile ? 'flex flex-col' : 'flex-grow flex flex-col justify-center'}`}>
            <div className="w-full px-4 md:px-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-20 transform translate-y-0 relative z-20">
              {/* Phone Column - Order 2 on mobile (bottom), Order 1 on desktop (left) */}
              <div 
                className="order-2 lg:order-1 flex flex-col items-center"
              >
                <div
                  id="phone-mockup-container"
                  ref={phoneRef}
                  data-debug-id="exp-phone"
                  className="relative z-[200] w-[280px] sm:w-[320px] mx-auto"
                  style={isMobile ? {
                    transform: `scale(${layoutConfig.phoneScale}) translate(${layoutConfig.phoneX}px, ${layoutConfig.phoneY}px)`,
                    ...getElementStyle('exp-phone')
                  } : {}}
                >
                  <PhoneMockup />
                </div>
              </div>

              {/* Text Column - Order 1 on mobile (top), Order 2 on desktop (right) */}
              {/* Calculated calc(80px - 12.5vw) to center between phone right edge and screen right edge */}
              {/* Changed max-w-2xl to max-w-4xl to accommodate longer text on one line */}
              {/* Moved 10px left: calc(80px - 12.5vw - 10px) */}
              <div 
                className="relative z-[210] max-w-4xl text-center mx-auto lg:translate-x-[calc(70px_-_12.5vw)] lg:-translate-y-[90px] order-1 lg:order-2" 
                dir="rtl"
              >
                <h1
                  data-debug-id="exp-headline"
                  className="mb-5 relative z-20 text-[53px] md:text-[77px] lg:text-[77px] font-black leading-[1.1] tracking-tight font-['Assistant'] rounded-lg whitespace-pre-line text-[#292929]"
                  style={isMobile ? {
                    fontSize: `${99 * (windowWidth / 1920) * 2.7}px`,
                    transform: `translate(${layoutConfig.headlineX}px, ${layoutConfig.headlineY}px)`,
                    transformOrigin: 'center bottom',
                    ...getElementStyle('exp-headline')
                  } : {}}
                >
                  {isMobile ? layoutConfig.headlineText.split('\n').map((line, i) => (
                    <span key={i} className={`block whitespace-nowrap ${i > 0 ? '-mt-[2px]' : ''}`}>
                      {line}
                    </span>
                  )) : (
                    <>
                    <span className="block whitespace-nowrap">בלילה שלכם</span>
                    <span className="block whitespace-nowrap -mt-[2px]">אל תפספסו שניה אחת</span>
                    </>
                  )}
                </h1>
                <p
                  data-debug-id="exp-subtext"
                  className="mb-8 relative z-20 text-[24px] text-gray-500 leading-relaxed font-normal font-['Assistant'] opacity-80 max-w-2xl mx-auto rounded-lg whitespace-pre-line bg-transparent transform -translate-y-[10px]"
                  style={isMobile ? {
                    fontSize: '19.4442px',
                    transform: 'translate(0px, -44px)',
                    transformOrigin: 'center top',
                    ...getElementStyle('exp-subtext')
                  } : {}}
                >
                  {isMobile ? layoutConfig.subtextText : (
                    <>
                    במקום לרדוף אחרי תמונות בווצאפ – המערכת שלנו אוספת עבורכם את כל התמונות והסרטונים מהאורחים למקום אחד ובאיכות הגבוהה ביותר,
                    <span className="whitespace-nowrap"> כבר בבוקר שאחרי.</span>
                    </>
                  )}
                </p>
                
                {/* CTA Button - Hidden on mobile as requested */}
                {!isMobile && (
                  <div 
                    className="inline-flex flex-col items-center gap-4 pt-2 -translate-y-[14px] relative z-10 w-full justify-center"
                  >
                      <CelebrationButton 
                        onClick={onMoreInfoClick} 
                        label="לחבילה האוספת" 
                        className="w-auto flex justify-center" 
                        buttonClassName="py-[0.5em] px-[1.5em] font-['Assistant'] font-bold tracking-[0.015em] !shadow-none flex-row-reverse gap-[0.5em]" 
                        textClassName="-translate-y-[2px]"
                        style={{ fontSize: `${buttonFontSize}px` }} 
                        arrowStrokeWidth={3} 
                        Icon={ArrowDown} 
                      />
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Giant Button - Incorporated into the section (Desktop Only) */}
        {!isMobile && (
          <div 
            id="giant-cta-container" 
            className="relative z-[250] mt-0 md:mt-24 mb-12 w-full flex justify-center px-6"
          >
              <CelebrationButton 
                  onClick={onGiantClick} 
                  label={layoutConfig.giantText} 
                  sheenDuration="1.7s"
                  className="w-auto flex justify-center" 
                  buttonClassName={`font-['Assistant'] font-extrabold !gap-[32px] w-auto max-w-none tracking-[0.05em] [-webkit-text-stroke:3px_white] !shadow-none !rounded-t-none !rounded-b-[29px] md:!rounded-b-[69px] md:text-[163px] lg:text-[198px] md:pt-6 md:pb-[28px] md:px-[78px] ${layoutConfig.giantGradEnabled ? '' : '!from-[#616161] !to-[#0f0f0f]'}`} 
                  textClassName="-translate-y-[4px]"
                  buttonStyle={layoutConfig.giantGradEnabled ? {
                    background: layoutConfig.giantGradType === 'radial' 
                      ? `radial-gradient(circle at center, hsla(${layoutConfig.giantGradH}, ${layoutConfig.giantGradS}%, ${layoutConfig.giantGradL}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos1}%, hsla(${layoutConfig.giantGradH2}, ${layoutConfig.giantGradS2}%, ${layoutConfig.giantGradL2}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos2}%, hsla(${layoutConfig.giantGradH3}, ${layoutConfig.giantGradS3}%, ${layoutConfig.giantGradL3}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos3}%, hsla(${layoutConfig.giantGradH4}, ${layoutConfig.giantGradS4}%, ${layoutConfig.giantGradL4}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos4}%)`
                      : `linear-gradient(${layoutConfig.giantGradAngle}deg, hsla(${layoutConfig.giantGradH}, ${layoutConfig.giantGradS}%, ${layoutConfig.giantGradL}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos1}%, hsla(${layoutConfig.giantGradH2}, ${layoutConfig.giantGradS2}%, ${layoutConfig.giantGradL2}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos2}%, hsla(${layoutConfig.giantGradH3}, ${layoutConfig.giantGradS3}%, ${layoutConfig.giantGradL3}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos3}%, hsla(${layoutConfig.giantGradH4}, ${layoutConfig.giantGradS4}%, ${layoutConfig.giantGradL4}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos4}%)`,
                    filter: layoutConfig.giantGradBlur > 0 ? `blur(${layoutConfig.giantGradBlur}px)` : 'none',
                    fontFamily: `"${layoutConfig.giantFont}", sans-serif`,
                    color: layoutConfig.giantColor
                  } : {
                    fontFamily: `"${layoutConfig.giantFont}", sans-serif`,
                    color: layoutConfig.giantColor
                  }}
                  Icon={getGiantIcon()} 
              />
          </div>
        )}

        {/* Mobile Giant Button - Absolute Bottom */}
        {isMobile && (
          <div 
            ref={giantRef}
            data-debug-id="exp-giant-btn"
            className="absolute bottom-0 left-0 w-full z-[250] flex justify-center"
            style={{
              transform: `scale(${layoutConfig.giantScale}) translate(${layoutConfig.giantX}px, ${layoutConfig.giantY}px)`,
              transformOrigin: 'center bottom',
              ...getElementStyle('exp-giant-btn')
            }}
          >
            <CelebrationButton 
                onClick={onGiantClick} 
                label={layoutConfig.giantText} 
                sheenDuration="0s"
                className="w-full flex justify-center" 
                buttonClassName={`font-['Assistant'] font-extrabold tracking-tight shadow-[0_15px_35px_rgba(0,0,0,0.3)] bg-gradient-to-r !hover:scale-100 !active:scale-100 !hover:brightness-100 overflow-hidden sheen-disabled ${layoutConfig.giantGradEnabled ? '' : '!from-zinc-300 !via-black !to-zinc-300'}`} 
                buttonStyle={layoutConfig.giantGradEnabled ? {
                  width: '100%',
                  height: '96px',
                  fontSize: `${layoutConfig.giantFontSize}px`,
                  paddingTop: `${layoutConfig.giantPaddingY}px`,
                  paddingBottom: `${layoutConfig.giantPaddingY}px`,
                  paddingLeft: `${layoutConfig.giantPaddingX}px`,
                  paddingRight: `${layoutConfig.giantPaddingX}px`,
                  borderTopLeftRadius: `${layoutConfig.giantBorderRadiusTL}px`,
                  borderTopRightRadius: `${layoutConfig.giantBorderRadiusTR}px`,
                  borderBottomLeftRadius: `${layoutConfig.giantBorderRadiusBL}px`,
                  borderBottomRightRadius: `${layoutConfig.giantBorderRadiusBR}px`,
                  background: layoutConfig.giantGradType === 'radial' 
                    ? `radial-gradient(circle at center, hsla(${layoutConfig.giantGradH}, ${layoutConfig.giantGradS}%, ${layoutConfig.giantGradL}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos1}%, hsla(${layoutConfig.giantGradH2}, ${layoutConfig.giantGradS2}%, ${layoutConfig.giantGradL2}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos2}%, hsla(${layoutConfig.giantGradH3}, ${layoutConfig.giantGradS3}%, ${layoutConfig.giantGradL3}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos3}%, hsla(${layoutConfig.giantGradH4}, ${layoutConfig.giantGradS4}%, ${layoutConfig.giantGradL4}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos4}%)`
                    : `linear-gradient(${layoutConfig.giantGradAngle}deg, hsla(${layoutConfig.giantGradH}, ${layoutConfig.giantGradS}%, ${layoutConfig.giantGradL}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos1}%, hsla(${layoutConfig.giantGradH2}, ${layoutConfig.giantGradS2}%, ${layoutConfig.giantGradL2}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos2}%, hsla(${layoutConfig.giantGradH3}, ${layoutConfig.giantGradS3}%, ${layoutConfig.giantGradL3}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos3}%, hsla(${layoutConfig.giantGradH4}, ${layoutConfig.giantGradS4}%, ${layoutConfig.giantGradL4}%, ${layoutConfig.giantGradOpacity}) ${layoutConfig.giantGradPos4}%)`,
                  filter: layoutConfig.giantGradBlur > 0 ? `blur(${layoutConfig.giantGradBlur}px)` : 'none',
                  fontFamily: `"${layoutConfig.giantFont}", sans-serif`,
                  color: layoutConfig.giantColor
                } : {
                  width: '100%',
                  height: '96px',
                  fontSize: `${layoutConfig.giantFontSize}px`,
                  paddingTop: `${layoutConfig.giantPaddingY}px`,
                  paddingBottom: `${layoutConfig.giantPaddingY}px`,
                  paddingLeft: `${layoutConfig.giantPaddingX}px`,
                  paddingRight: `${layoutConfig.giantPaddingX}px`,
                  borderTopLeftRadius: `${layoutConfig.giantBorderRadiusTL}px`,
                  borderTopRightRadius: `${layoutConfig.giantBorderRadiusTR}px`,
                  borderBottomLeftRadius: `${layoutConfig.giantBorderRadiusBL}px`,
                  borderBottomRightRadius: `${layoutConfig.giantBorderRadiusBR}px`,
                  fontFamily: `"${layoutConfig.giantFont}", sans-serif`,
                  color: layoutConfig.giantColor
                }}
                textClassName="whitespace-nowrap -translate-y-[1px]"
                iconClassName="-translate-x-[5px] scale-90"
                Icon={getGiantIcon()} 
            />
            <style dangerouslySetInnerHTML={{__html: `
              .sheen-disabled .sheen-element { display: none !important; }
              .sheen-disabled:hover { transform: none !important; filter: none !important; }
            `}} />
            
            {/* Measurement Labels */}
            {layoutConfig.showPaths && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none whitespace-nowrap">
                <div className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full mb-1">
                  Distance: {measurements.distance}px
                </div>
                <div className="bg-purple-600/80 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Size: {measurements.width}x{measurements.height}px
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Path Debugger Overlay */}
        {layoutConfig.showPaths && (
          <svg className="absolute inset-0 z-[9999] pointer-events-none w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
              </marker>
            </defs>
            {(Object.entries(paths) as [keyof typeof paths, typeof paths.left][]).map(([key, pathData]) => {
              const parts = pathData.rawD.split(' ');
              // Expected format: M startX startY C cp1X cp1Y cp2X cp2Y endX endY
              if (parts.length < 10) return null;
              
              const startX = parseFloat(parts[1]);
              const startY = parseFloat(parts[2]);
              const cp1X = parseFloat(parts[4]);
              const cp1Y = parseFloat(parts[5]);
              const cp2X = parseFloat(parts[6]);
              const cp2Y = parseFloat(parts[7]);
              const endX = parseFloat(parts[8]);
              const endY = parseFloat(parts[9]);
              
              const color = key === 'left' ? 'red' : key === 'right' ? 'blue' : 'green';
              
              return (
                <g key={key}>
                  {/* Main Path */}
                  <path d={pathData.rawD} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
                  
                  {/* Control Lines */}
                  <line x1={startX} y1={startY} x2={cp1X} y2={cp1Y} stroke={color} strokeWidth="1" opacity="0.4" />
                  <line x1={endX} y1={endY} x2={cp2X} y2={cp2Y} stroke={color} strokeWidth="1" opacity="0.4" />
                  
                  {/* Control Points */}
                  <circle cx={cp1X} cy={cp1Y} r="6" fill={color} opacity="0.8" className="pointer-events-none" />
                  <circle 
                    cx={cp1X} cy={cp1Y} r="20" fill="transparent" 
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, key, 'control1')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />

                  <circle cx={cp2X} cy={cp2Y} r="6" fill={color} opacity="0.8" className="pointer-events-none" />
                  <circle 
                    cx={cp2X} cy={cp2Y} r="20" fill="transparent" 
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, key, 'control2')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                  
                  {/* Start/End Points */}
                  <circle cx={startX} cy={startY} r="6" fill={color} opacity="0.8" className="pointer-events-none" />
                  <circle 
                    cx={startX} cy={startY} r="20" fill="transparent" 
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, key, 'start')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />

                  <circle cx={endX} cy={endY} r="6" fill={color} opacity="0.8" className="pointer-events-none" />
                  <circle 
                    cx={endX} cy={endY} r="20" fill="transparent" 
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => handlePointerDown(e, key, 'end')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                  
                  {/* Start/End Labels */}
                  <text x={startX} y={startY - 10} fill={color} fontSize="12" fontWeight="bold">Start</text>
                  <text x={endX} y={endY + 20} fill={color} fontSize="12" fontWeight="bold">End</text>
                </g>
              );
            })}
          </svg>
        )}

        {/* CSS Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ribbon-flow {
            0% { offset-distance: 0%; transform: scale(0.5); opacity: 0; }
            10% { transform: scale(1); opacity: 1; }
            90% { opacity: 1; }
            100% { offset-distance: 100%; transform: scale(0.5); opacity: 0; }
          }
          @keyframes slideUp {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slide-up {
            animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0;
          }
          @keyframes bottomLeftReveal {
            0% { opacity: 0; transform: translate(-10px, 10px) scale(0.95); }
            100% { opacity: 1; transform: translate(0, 0) scale(1); }
          }
          .animate-bottom-left-reveal {
            animation: bottomLeftReveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          .flow-container {
            position: absolute;
            inset: 0;
            z-index: 50;
            pointer-events: none;
          }
          .flow-image {
            position: absolute;
            width: 41.1px;
            height: 41.1px;
            background: white;
            border: 2.4px solid white;
            border-radius: 9.6px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            offset-path: var(--wedding-path);
            offset-rotate: auto 180deg;
            /* Animation is now controlled via inline styles in FloatingPhoto component */
            will-change: offset-distance;
          }
          .inner-shield {
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 9.6px;
          }
          .photo-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .hebrew-font {
             font-family: 'Assistant', sans-serif;
          }
        `}} />
      </section>
  );
}