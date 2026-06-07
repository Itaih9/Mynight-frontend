import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import {
  Play,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Share2,
  Check,
  Loader2,
  Gift,
  Send,
  Facebook,
  Instagram,
  MoreHorizontal,
  Link as LinkIcon,
  MessageCircle,
  Smartphone,
  Monitor,
  HardDrive,
  Trash2,
  AlertTriangle,
  Pause,
  Heart,
  ArrowRight,
  LayoutDashboard,
  Ticket,
  Star,
  HelpCircle,
  Sparkles,
  Camera,
  Users,
  Copy,
  Lock,
  Menu,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import confetti from 'canvas-confetti';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  source: 'guest' | 'pro';
  url: string;
  thumbnail: string;
  uploaderName: string;
  timestamp: Date;
  orientation?: 'landscape' | 'portrait';
}

interface StoryGroup {
  uploaderName: string;
  avatar: string;
  items: MediaItem[];
}

const AnimatedGiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <rect x="3" y="8" width="18" height="14" rx="2" />
    <path d="M12 8v14" />
    <motion.g
       initial={{ y: 0, rotate: 0 }}
       whileHover={{ y: -4, rotate: -5, transition: { type: "spring", stiffness: 300 } }}
       className="origin-bottom-right"
    >
      <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" className="fill-white" />
      <path d="M12 3v5" />
      <path d="M7.5 3H12" />
      <path d="M16.5 3H12" />
      <path d="M12 3c0-3 2.5-3 2.5 0" />
      <path d="M12 3c0-3-2.5-3-2.5 0" />
    </motion.g>
  </svg>
);

const OpeningGiftAnimation = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center mb-2 overflow-visible">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gold-primary/10 rounded-full border border-gold-primary/20" />

       {[...Array(12)].map((_, i) => (
         <motion.div
           key={i}
           className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full z-0 ${['bg-gold-primary', 'bg-black', 'bg-gray-400'][i % 3]}`}
           initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
           animate={{
             opacity: [0, 1, 1, 0],
             y: [0, -50 - Math.random() * 30],
             x: [(Math.random() - 0.5) * 60],
             scale: [0, 1, 0],
             rotate: [0, Math.random() * 360]
           }}
           transition={{
             duration: 1.5,
             ease: "easeOut",
             delay: 0.6,
             repeat: Infinity,
             repeatDelay: 2
           }}
         />
       ))}

       <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-primary relative z-10 overflow-visible drop-shadow-sm">
         <path d="M4 10h16v11H4z" className="fill-gold-primary/20" />
         <path d="M12 10v11" strokeOpacity="0.6" />

         <motion.g
           initial={{ y: 0, rotate: 0 }}
           animate={{
             y: [0, 0, 0, -14, -14, 0],
             rotate: [0, -2, 2, -5, -8, 0],
           }}
           transition={{
             duration: 3.5,
             times: [0, 0.1, 0.2, 0.25, 0.5, 0.7],
             repeat: Infinity,
             ease: "easeInOut"
           }}
           style={{ originX: 0.5, originY: 1 }}
         >
            <path d="M2 6h20v4H2z" className="fill-gold-primary/30" />
            <path d="M12 6v4" strokeOpacity="0.6" />
            <path d="M7.5 6H12" strokeOpacity="0.6" />
            <path d="M16.5 6H12" strokeOpacity="0.6" />
            <path d="M12 6c0-3 2.5-3 2.5 0" />
            <path d="M12 6c0-3-2.5-3-2.5 0" />
         </motion.g>
       </svg>
    </div>
  );
};

const UNSPLASH_IDS = [
  "1519741497674-611481863552", "1470116073782-48ae2cc4a699", "1511285560982-1351cdeb9821", "1606800052052-a08af7148866",
  "1532712938310-34cb3982ef74", "1469334031218-e382a71b716b", "1465495976277-4387d4b0b4c6", "1519225448526-72997f225912",
  "1507504031981-a236a2674e2a", "1529636798458-92182e662485", "1520854221256-17451cc330e7", "1522673607200-1645062cd955",
  "1510076857177-7470076d4098", "1621621667797-e06afc217fb0", "1623192023573-0761e3d36804", "1523438885200-e635ba2c371e",
  "1515934751635-c81c6bc9a2d8", "1515488042361-ee00e0ddd4e4", "1588260699295-d252f854b445", "1600093463592-8e36ae95ef56",
  "1604928141064-207d6008f017", "1594122230689-45899d9e6f69", "1546193430-c2d207739ed7", "1551522435-a13afa10f103",
  "1545389336-398565a56d92", "1537633552985-df8429e8048b", "1587271407850-8d43891882c0", "1616035222340-9653a992a720",
  "1606216964082-9993309e3789", "1516455207988-06422377f804", "1530103862676-de3c9a59af38", "1533174072545-2b95075d01c5",
  "1525258746803-5c6235423dc2", "1502635385003-ee1e6a1a742f", "1516961642265-531546e84af2", "1509927083124-9a3c4c756453",
  "1500917293047-324b1719732d", "1527529482837-e5bad7d74e48", "1544595856-3053673f4124", "1513279922550-250c2129b13a",
  "1537905569824-f89f14cceb68", "1586105251261-72a756497a11", "1591604466107-ec97de577aff", "1595867865339-acd5dc719939",
  "1611032586959-ac70eb554e43", "1580216773229-3732c2824907", "1624561172888-ac93c696e677", "1522413452208-996ff3f3e740",
  "1529634597507-e050f152d8cc", "1514539079130-25950385365a", "1523438097060-d0e77c74397e", "1532453288672-3a27e9be9efd",
  "1525299333939-253648a35624", "1520295187426-17387cc39722", "1542042161739-011fdd52bf99", "1550005809-91ad75fb315f",
  "1519741347686-c1e0aaf22f8d", "1519167758481-83f55a961501", "1522083165195-3424ed129620", "1512484962260-2e06533c3937",
  "1521478706266-42e453334e85", "1542361345408-24eb7c70c670", "1544077961-9217f687c9dd", "1550525811-e5869dd03032",
  "1552168324-d612d77725e3", "1555243896-c709bfa38207", "1561045696-255801c69346", "1562237672-68393e1b7c12",
  "1563297677-44a70653069c", "1563720223185-11003d516935", "1565405076793-156dd33d195e", "1566737236500-c8ac43014a67",
  "1568478550-9d849963e676", "1569388330-937c07998671", "1572099606223-6e221954224c", "1574096079513-d8259312b785",
  "1579224162461-ea3b88b22a04", "1580824456050-61446b607810", "1583091918090-272e77c44933", "1584132967329-0552e89d1695",
  "1586985289688-ca3cf47d3e6e", "1588699395020-569a5c777e3d", "1590086782057-36882b829899", "1592484854513-56c0f603c3eb",
  "1592866929968-3f9c64700d38", "1593435422339-299f737c34d9", "1593922629683-19df82b9b719", "1594830113165-27f993d07e60",
  "1595267499652-32a2a75877b0", "1596715692634-84c424a06730", "1597825023956-628b0318260e", "1599577732238-04d7c54784e2",
  "1600021350036-749e793933c0", "1603214924242-b0722cc72993", "1604085572555-1849b887e19b", "1605379399642-870262d3d051",
  "1606761563518-125f4705a7b4", "1608753239556-9d3215904838", "1609187313038-020935399587", "1612450219662-79338686232d",
  "1613587029587-43224e237372", "1614798514044-793479a8323e", "1616180373003-8d022530d932", "1616628188894-6164f26b5275",
  "1617450371309-8975517135a6", "1618585090458-7c87c2b3e595", "1619623637604-123772274b53", "1620653629395-97e3a9c7b94c",
  "1621873723399-4c80302322f2", "1622396347895-4524c5218734", "1623091411244-972c41675276", "1624479532729-c70e0503f1eb",
  "1625244724120-1fd1d34d00f6", "1625686036132-73a4b08709f6", "1626202165039-3977d079377a", "1626885365097-7691657c762f",
  "1628092243765-636c7c593678", "1628629007624-9b265774880c", "1629832205510-9430c0067683", "1630526720473-b3260714b7e3",
  "1631477025892-2396116639c6", "1631892695277-2b024764032d", "1632765597793-6c634c034764", "1633539665564-9c59365c6978",
  "1634149622330-79753c072230", "1634835222079-c72076047242", "1635706509341-33303666299b", "1636653392306-039c2c62c262",
  "1637775924732-2432657e2898", "1638383849646-c23f27807779", "1639158332997-7c0303632999", "1639937172776-908050305023"
];

const generateMockMedia = (): MediaItem[] => {
  const videoUrls = [
    'https://assets.mixkit.co/videos/preview/mixkit-putting-on-the-wedding-ring-454-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-couple-at-a-wedding-ceremony-26665-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-wedding-couple-kissing-452-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-bride-holding-a-flower-bouquet-in-her-hands-43183-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-wedding-dress-hanging-on-a-window-1526-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-man-and-woman-dancing-slowly-at-a-wedding-453-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-wedding-cake-with-flowers-1523-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-a-happy-bride-and-groom-embracing-and-laughing-451-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-bride-walking-down-the-aisle-450-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-confetti-falling-on-a-happy-couple-449-large.mp4'
  ];

  const uploaders = ['Official Photographer', 'נועה', 'דניאל', 'מיכל', 'רועי', 'איתי', 'Guest', 'שירה', 'יוסי', 'עמית', 'גל', 'חן', 'מיה', 'טל', 'עידן', 'מאיה', 'יעל', 'עומר', 'נדב', 'תמר'];
  const items: MediaItem[] = [];
  const TOTAL_ITEMS = 400;

  const shuffledIds = [...UNSPLASH_IDS].sort(() => 0.5 - Math.random());

  for (let i = 0; i < TOTAL_ITEMS; i++) {
    const isVideo = i % 5 === 0;
    const isPro = i % 3 === 0;
    const imageId = shuffledIds[i % shuffledIds.length];
    const isPortrait = i % 2 !== 0;
    const width = isPortrait ? 800 : 1200;
    const height = isPortrait ? 1200 : 800;

    const imageUrl = `https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${width}&q=80`;
    const videoUrl = videoUrls[i % videoUrls.length];

    items.push({
      id: `item-${i}-${Date.now()}`,
      type: isVideo ? 'video' : 'photo',
      source: isPro ? 'pro' : 'guest',
      url: isVideo ? videoUrl : imageUrl,
      thumbnail: isVideo ? imageUrl : imageUrl,
      uploaderName: isPro ? 'Official Photographer' : uploaders[i % uploaders.length],
      timestamp: new Date(2025, 4, 12, 16 + (i % 10), (i * 3) % 60),
      orientation: isPortrait ? 'portrait' : 'landscape'
    });
  }

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
};

const MOCK_MEDIA: MediaItem[] = generateMockMedia();

const VerticalColumn = ({ images, delay }: { images: MediaItem[], delay: number }) => {
  const [index, setIndex] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const nextDuration = Math.random() * (7200 - 5000) + 5000;
      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
        scheduleNext();
      }, nextDuration);
    };
    const startTimeout = setTimeout(() => {
       scheduleNext();
    }, delay);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [delay, images.length]);

  useEffect(() => {
    if (isFirstRender.current) {
        const t = setTimeout(() => {
            isFirstRender.current = false;
        }, 100);
        return () => clearTimeout(t);
    }
  }, []);

  const currentItem = images[index];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentItem.id}
          initial={isFirstRender.current ?
            { opacity: 1, filter: 'blur(0px)', scale: 1.15, x: '0%' } :
            { opacity: 0, filter: 'blur(20px)', scale: 1.15, x: '0%' }
          }
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1.15, x: '-12%' }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.15 }}
          transition={{
            opacity: { duration: 1.5, ease: "easeInOut" },
            filter: { duration: 1.5, ease: "easeInOut" },
            x: { duration: 18, ease: "linear" }
          }}
          className="absolute inset-0 w-full h-full"
        >
           {currentItem.type === 'video' ? (
              <video src={currentItem.url} className="w-full h-full object-cover opacity-70" autoPlay muted loop playsInline />
           ) : (
              <img src={currentItem.url} className="w-full h-full object-cover opacity-70" alt="" loading="eager" />
           )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const HeroVerticalCollage = ({ items }: { items: MediaItem[] }) => {
  const col1 = useMemo(() => items.filter((_, i) => i % 3 === 0), [items]);
  const col2 = useMemo(() => items.filter((_, i) => i % 3 === 1), [items]);
  const col3 = useMemo(() => items.filter((_, i) => i % 3 === 2), [items]);
  const mobileItems = useMemo(() => items.filter((_, i) => i % 2 === 0), [items]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="md:hidden w-full h-full">
         <VerticalColumn images={mobileItems} delay={0} />
      </div>
      <div className="hidden md:flex w-full h-full">
         <div className="w-1/3 h-full relative border-r border-white/5">
            <VerticalColumn images={col1} delay={0} />
         </div>
         <div className="w-1/3 h-full relative border-r border-white/5">
            <VerticalColumn images={col2} delay={2300} />
         </div>
         <div className="w-1/3 h-full relative">
            <VerticalColumn images={col3} delay={4600} />
         </div>
      </div>
    </div>
  );
};

const cubeVariants: Variants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0.5,
    scale: 0.8,
    x: 0,
    transformOrigin: direction > 0 ? "left center" : "right center",
    filter: "brightness(0.5)",
    zIndex: 1,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    x: 0,
    filter: "brightness(1)",
    zIndex: 2,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0 }
  },
};

interface GalleryPageProps {
  coupleName?: string;
  isOwner?: boolean;
  guestLink?: string;
}

const Gallery: React.FC<GalleryPageProps> = ({ coupleName = 'נועה ואיתי', isOwner = false, guestLink }) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'guest' | 'pro'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftEmail, setGiftEmail] = useState('');
  const [isGiftSubmitting, setIsGiftSubmitting] = useState(false);
  const [giftSuccess, setGiftSuccess] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const storyIntervalRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const isStoriesDragging = useRef(false);
  const storiesStartX = useRef(0);
  const storiesScrollLeft = useRef(0);
  const storiesHasMoved = useRef(false);

  const [isStoryShareOpen, setIsStoryShareOpen] = useState(false);

  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showMobileMenuTrigger, setShowMobileMenuTrigger] = useState(false);
  const [showDesktopMenuTrigger, setShowDesktopMenuTrigger] = useState(false);

  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    pro: true,
    guests: true,
    stories: true
  });
  const [linkCopied, setLinkCopied] = useState(false);

  const [name1, name2] = useMemo(() => {
    const separator = ' ו';
    if (coupleName.includes(separator)) {
      return coupleName.split(separator);
    }
    return [coupleName, ''];
  }, [coupleName]);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (selectedMedia || activeStoryGroup || isShareSettingsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMedia, activeStoryGroup, isShareSettingsOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      if (window.innerWidth < 768) {
          setShowMobileMenuTrigger(scrollY > windowHeight * 0.30);
          setShowDesktopMenuTrigger(false);
      } else {
          setShowMobileMenuTrigger(false);
          setShowDesktopMenuTrigger(scrollY > windowHeight * 0.15 && scrollY < windowHeight - 120);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOwner]);

  useEffect(() => {
    const groups: { [key: string]: MediaItem[] } = {};
    MOCK_MEDIA.forEach(item => {
        if (!groups[item.uploaderName]) {
            groups[item.uploaderName] = [];
        }
        groups[item.uploaderName].push(item);
    });

    const storyList: StoryGroup[] = Object.keys(groups).map(name => ({
        uploaderName: name,
        items: groups[name],
        avatar: groups[name][0].thumbnail
    }));

    const guestStories = storyList.filter(group => !group.items.some(i => i.source === 'pro'));
    const proStories = storyList.filter(group => group.items.some(i => i.source === 'pro'));

    for (let i = guestStories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [guestStories[i], guestStories[j]] = [guestStories[j], guestStories[i]];
    }

    setStoryGroups([...guestStories, ...proStories]);
  }, []);

  const getShareText = () => {
    const footer = "\n\n- שותף עם MyNight.co.il";
    if (isOwner) {
      return `תראו איזה רגע מהחתונה! היה מטורף${footer}`;
    }
    return `תראו איזה רגע מהחתונה של ${coupleName}! היה מדהים${footer}`;
  };

  const handleStoriesMouseDown = (e: React.MouseEvent) => {
    if (!storiesScrollRef.current) return;
    isStoriesDragging.current = true;
    storiesHasMoved.current = false;
    storiesStartX.current = e.pageX - storiesScrollRef.current.offsetLeft;
    storiesScrollLeft.current = storiesScrollRef.current.scrollLeft;
  };

  const handleStoriesMouseLeave = () => {
    isStoriesDragging.current = false;
  };

  const handleStoriesMouseUp = () => {
    isStoriesDragging.current = false;
  };

  const handleStoriesMouseMove = (e: React.MouseEvent) => {
    if (!isStoriesDragging.current || !storiesScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - storiesScrollRef.current.offsetLeft;
    const walk = (x - storiesStartX.current) * 2;
    if (Math.abs(walk) > 5) storiesHasMoved.current = true;
    storiesScrollRef.current.scrollLeft = storiesScrollLeft.current - walk;
  };

  const handleStoryClick = (group: StoryGroup, validItems: MediaItem[]) => {
    if (storiesHasMoved.current) return;
    setActiveStoryGroup({...group, items: validItems});
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsStoryShareOpen(false);
  };

  const jumpToNextGroup = useCallback(() => {
      if (!activeStoryGroup) return;
      const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);

      if (currentGroupIndex !== -1 && currentGroupIndex < storyGroups.length - 1) {
          setDirection(1);
          const nextGroup = storyGroups[currentGroupIndex + 1];
          const validItems = nextGroup.items.filter(i => !deletedIds.has(i.id));
          if (validItems.length > 0) {
              setActiveStoryGroup({...nextGroup, items: validItems});
              setActiveStoryIndex(0);
              setStoryProgress(0);
              setIsStoryShareOpen(false);
          } else {
              setActiveStoryGroup(null);
          }
      } else {
          setActiveStoryGroup(null);
      }
  }, [activeStoryGroup, storyGroups, deletedIds]);

  const jumpToPrevGroup = useCallback(() => {
      if (!activeStoryGroup) return;
      const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);

      if (currentGroupIndex > 0) {
          setDirection(-1);
          const prevGroup = storyGroups[currentGroupIndex - 1];
          const validItems = prevGroup.items.filter(i => !deletedIds.has(i.id));
          if (validItems.length > 0) {
              setActiveStoryGroup({...prevGroup, items: validItems});
              setActiveStoryIndex(0);
              setStoryProgress(0);
              setIsStoryShareOpen(false);
          }
      }
  }, [activeStoryGroup, storyGroups, deletedIds]);

  useEffect(() => {
    if (!activeStoryGroup || isStoryPaused) {
        if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
        return;
    }
    setStoryProgress(0);
    const duration = 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    storyIntervalRef.current = window.setInterval(() => {
        setStoryProgress(prev => {
            if (prev >= 100) {
                handleNextStorySlide();
                return 0;
            }
            return prev + step;
        });
    }, interval);

    return () => {
        if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
    };
  }, [activeStoryGroup, activeStoryIndex, isStoryPaused]);

  const handleNextStorySlide = useCallback(() => {
      if (!activeStoryGroup) return;
      if (activeStoryIndex < activeStoryGroup.items.length - 1) {
          setActiveStoryIndex(prev => prev + 1);
          setStoryProgress(0);
      } else {
          jumpToNextGroup();
      }
  }, [activeStoryGroup, activeStoryIndex, jumpToNextGroup]);

  const handlePrevStorySlide = useCallback(() => {
      if (!activeStoryGroup) return;
      if (activeStoryIndex > 0) {
          setActiveStoryIndex(prev => prev - 1);
          setStoryProgress(0);
      } else {
          const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);
          if (currentGroupIndex > 0) {
              setDirection(-1);
              const prevGroup = storyGroups[currentGroupIndex - 1];
              const validItems = prevGroup.items.filter(i => !deletedIds.has(i.id));
              if (validItems.length > 0) {
                  setActiveStoryGroup({...prevGroup, items: validItems});
                  setActiveStoryIndex(validItems.length - 1);
                  setStoryProgress(0);
              } else {
                  setActiveStoryGroup(null);
              }
          }
      }
  }, [activeStoryGroup, activeStoryIndex, storyGroups, deletedIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (activeStoryGroup) {
            switch (e.key) {
                case 'ArrowLeft': handleNextStorySlide(); break;
                case 'ArrowRight': handlePrevStorySlide(); break;
                case 'Escape': setActiveStoryGroup(null); break;
            }
        } else if (selectedMedia) {
            switch (e.key) {
                case 'ArrowLeft': navigateLightbox('next'); break;
                case 'ArrowRight': navigateLightbox('prev'); break;
                case 'Escape': closeLightbox(); break;
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryGroup, handleNextStorySlide, handlePrevStorySlide, selectedMedia]);

  const handleStoryDelete = () => {
      if (!activeStoryGroup) return;
      const currentItem = activeStoryGroup.items[activeStoryIndex];
      const newSet = new Set(deletedIds);
      newSet.add(currentItem.id);
      setDeletedIds(newSet);
      const updatedItems = activeStoryGroup.items.filter(i => i.id !== currentItem.id);
      if (updatedItems.length === 0) {
          setActiveStoryGroup(null);
      } else {
          setActiveStoryGroup({ ...activeStoryGroup, items: updatedItems });
          if (activeStoryIndex >= updatedItems.length) {
              setActiveStoryIndex(updatedItems.length - 1);
          }
      }
      setIsDeleteConfirmOpen(false);
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      return newFavs;
    });
  };

  const filteredMedia = useMemo(() => {
    return MOCK_MEDIA.filter(item => {
      if (deletedIds.has(item.id)) return false;

      const matchType = filterType === 'all' || item.type === filterType;
      const matchSource = filterSource === 'all' || item.source === filterSource;
      const matchSearch = searchQuery === '' || item.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFavorite = !showFavoritesOnly || favorites.has(item.id);

      return matchType && matchSource && matchSearch && matchFavorite;
    });
  }, [filterType, filterSource, searchQuery, deletedIds, showFavoritesOnly, favorites]);

  const collageItems = useMemo(() => MOCK_MEDIA, []);

  const openLightbox = (item: MediaItem) => {
    setSelectedMedia(item);
    setShareSuccess(false);
    setIsDownloading(false);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  };

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (!selectedMedia) return;
    const currentIndex = filteredMedia.findIndex(m => m.id === selectedMedia.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < filteredMedia.length) {
      openLightbox(filteredMedia[nextIndex]);
    }
  };

  const handleDelete = () => {
    if (selectedMedia) {
        const newSet = new Set(deletedIds);
        newSet.add(selectedMedia.id);
        setDeletedIds(newSet);
        setIsDeleteConfirmOpen(false);
        closeLightbox();
    }
  };

  const confirmDelete = () => {
      if (activeStoryGroup) {
          handleStoryDelete();
      } else if (selectedMedia) {
          handleDelete();
      }
  };

  const handleDownload = async () => {
    if (!selectedMedia) return;
    setIsDownloading(true);
    try {
      const extension = selectedMedia.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-${selectedMedia.id}.${extension}`;
      const response = await fetch(selectedMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      window.open(selectedMedia.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStoryDownload = async () => {
    if (!activeStoryGroup) return;
    const item = activeStoryGroup.items[activeStoryIndex];
    if (!item) return;
    try {
      const extension = item.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-story-${item.id}.${extension}`;
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      window.open(item.url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!selectedMedia && !activeStoryGroup) return;
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    try {
        await navigator.clipboard.writeText(item.url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        setIsShareMenuOpen(false);
        setIsStoryShareOpen(false);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const handleCopyGuestLink = () => {
    if (!guestLink) return;
    navigator.clipboard.writeText(guestLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
      const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
      if (!item) return;
      const text = getShareText();
      const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + item.url)}`;
      window.open(url, '_blank');
      setIsShareMenuOpen(false);
      setIsStoryShareOpen(false);
  };

  const handleFacebookShare = () => {
      const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
      if (!item) return;
      const text = getShareText();
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(item.url)}&quote=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      setIsShareMenuOpen(false);
      setIsStoryShareOpen(false);
  };

  const handleInstagramStory = async () => {
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    setIsDownloading(true);
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const file = new File([blob], `story-${item.id}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My Night Story`,
          text: `From the wedding of ${coupleName}`
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mynight-${item.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => { window.location.href = "instagram-stories://share"; }, 1000);
      }
    } catch (error) {
       window.location.href = "instagram-stories://share";
    } finally {
       setIsDownloading(false);
       setIsShareMenuOpen(false);
       setIsStoryShareOpen(false);
    }
  };

  const handleNativeShare = async () => {
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `זיכרון מהחתונה של ${coupleName}`,
          text: getShareText(),
          url: item.url,
        });
      } catch (error) { console.log('Share canceled'); }
    } else {
        handleCopyLink();
    }
    setIsShareMenuOpen(false);
    setIsStoryShareOpen(false);
  };

  const handleGiftClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ origin: { x, y }, particleCount: 150, spread: 80, startVelocity: 35, colors: ['#F5C518', '#000000', '#FFFFFF', '#CCCCCC'], zIndex: 201 });
    setIsGiftModalOpen(true);
  };

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftEmail) return;
    setIsGiftSubmitting(true);
    setTimeout(() => {
      setIsGiftSubmitting(false);
      setGiftSuccess(true);
    }, 1500);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = window.innerWidth * 0.2;
    if (info.offset.x > swipeThreshold) {
        jumpToNextGroup();
    } else if (info.offset.x < -swipeThreshold) {
        jumpToPrevGroup();
    }
  };

  const toggleShareSetting = (key: keyof typeof shareSettings) => {
    setShareSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans w-full" dir="rtl">

      <section
        className="relative min-h-[100dvh] w-full overflow-hidden bg-black flex flex-col justify-between"
        style={{ touchAction: 'pan-y' }}
      >
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 transform-gpu pointer-events-none"
        >
          <HeroVerticalCollage items={collageItems} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 pointer-events-none" />
        </motion.div>

        <AnimatePresence>
          {showDesktopMenuTrigger && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setIsSideMenuOpen(true)}
              className="hidden md:flex fixed top-6 right-6 z-[100] p-3 bg-black/80 hover:bg-black text-white rounded-full transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ArrowRight size={24} strokeWidth={1.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-8 md:p-12 flex justify-between md:justify-end items-start">

           <div className="md:hidden text-white/80 font-serif tracking-widest text-lg pt-1 antialiased transform-gpu">
              25.05.25
           </div>

           <img src="https://i.postimg.cc/mPStkVPV/logo.png" alt="MY NIGHT" className="h-8 md:h-12 w-auto object-contain invert brightness-0 opacity-60" />
        </div>

        <div className="relative z-10 w-full p-8 md:p-16 flex justify-between items-end">

          <AnimatePresence>
            {showMobileMenuTrigger && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => setIsSideMenuOpen(true)}
                className="absolute right-0 z-50 bg-gold-primary rounded-l-full shadow-lg flex items-center justify-center cursor-pointer active:scale-95 touch-none"
                style={{ top: '-32px', width: '32px', height: '40px' }}
              >
                <div className="mr-[-4px]">
                   <svg width="10" height="14" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 8L12 0V16L0 8Z" fill="white"/>
                   </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right">
            <motion.p
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: isMobile ? -3 : -6, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-white/50 text-xl md:text-3xl font-bold tracking-wide mb-0 font-bona translate-y-[88px]"
            >
              הלילה של
            </motion.p>
            <h2 className="text-white/55 text-5xl md:text-9xl font-bold tracking-wide leading-none flex flex-row flex-wrap items-baseline gap-y-2 gap-x-3 md:gap-x-4 font-bona justify-start">
              <motion.span
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              >
                {name1}
              </motion.span>

              {name2 && (
                <div className="flex items-center gap-x-3 md:gap-x-4">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        className="font-serif italic text-5xl md:text-8xl text-white/55 font-normal px-1 inline-block md:translate-y-[20px]"
                    >
                        &
                    </motion.span>
                    <motion.span
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                    >
                        {name2}
                    </motion.span>
                </div>
              )}
            </h2>
          </div>

          <div className="text-left hidden md:block">
             <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="text-white/80 font-serif tracking-[0.1em] uppercase flex items-baseline gap-2 md:gap-3 scale-[1.07] origin-left"
              dir="ltr"
            >
              <span className="text-xl md:text-3xl">25</span>
              <span className="text-sm md:text-xl font-light scale-[1.1]">May</span>
              <span className="text-xl md:text-3xl">2025</span>
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">למחוק את המדיה?</h3>
              <p className="text-gray-500 mb-8">הפעולה תסיר את הקובץ מהגלריה לצמיתות.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  מחיקה
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">ניהול שיתוף לאורחים</h3>
                <button onClick={() => setIsShareSettingsOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-500 mb-6 text-sm">בחרו מה האורחים יראו בקישור האישי</p>

              <div className="space-y-4 mb-8">
                <div
                  onClick={() => toggleShareSetting('pro')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.pro ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.pro ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Camera size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.pro ? 'text-black' : 'text-gray-500'}`}>תמונות וסרטונים מהצלם</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.pro ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div
                  onClick={() => toggleShareSetting('guests')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.guests ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.guests ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Users size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.guests ? 'text-black' : 'text-gray-500'}`}>תמונות וסרטונים מאורחים</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.guests ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div
                  onClick={() => toggleShareSetting('stories')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.stories ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.stories ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Smartphone size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.stories ? 'text-black' : 'text-gray-500'}`}>סטוריז</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.stories ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              {guestLink && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 mb-2">קישור לשיתוף</p>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={guestLink}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none font-mono"
                      dir="ltr"
                    />
                    <button
                      onClick={handleCopyGuestLink}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black"
                    >
                      {linkCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Lock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">האורחים אינם יכולים לערוך את הגלריה</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSideMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[160] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[170] shadow-2xl p-8 flex flex-col"
            >
               <button onClick={() => setIsSideMenuOpen(false)} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                 <ArrowRight size={24} strokeWidth={1.5} className="rotate-180" />
               </button>

               <div className="mt-24 flex flex-col gap-8">
                  <button onClick={() => { setIsSideMenuOpen(false); setIsShareSettingsOpen(true); }} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                      <Share2 size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                      <span>שיתוף לאורחים</span>
                  </button>
                  <button onClick={() => navigate(ROUTES.GUEST_LANDING.replace(':eventCode', 'demo'))} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                      <Eye size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                      <span>איך זה נראה לאורחים</span>
                  </button>
                  <button onClick={() => navigate(ROUTES.UPLOAD)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                     <LayoutDashboard size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                     <span>ניהול האירוע</span>
                  </button>
                  <button onClick={() => navigate(ROUTES.COUPON)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                     <Ticket size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                     <span>קופון אישי</span>
                  </button>
                  <button onClick={() => navigate(ROUTES.REVIEW)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                     <Star size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                     <span>השארת ביקורת</span>
                  </button>
                  <button onClick={() => navigate(ROUTES.HELP)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                     <HelpCircle size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                     <span>עזרה</span>
                  </button>
               </div>

               <div className="mt-auto flex justify-center pb-8">
                  <button onClick={() => navigate(ROUTES.HOME)} className="transition-opacity hover:opacity-100 opacity-100 group">
                    <img src="https://i.postimg.cc/mPStkVPV/logo.png" alt="MY NIGHT" className="h-8 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div ref={gridRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">

          {isMobile && isSearchOpen ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 w-full"
              >
                  <div className="relative flex-grow">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        autoFocus
                        placeholder="חיפוש לפי שם..."
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:border-black focus:bg-white transition-all outline-none text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 bg-gray-100 rounded-full">
                      <X size={18} />
                  </button>
              </motion.div>
          ) : (
              <>
                <button onClick={() => setIsSideMenuOpen(true)} className="hidden md:flex p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors text-black">
                    <Menu size={24} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-1.5 md:gap-6 overflow-x-auto flex-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-linear-fade">
                   <button onClick={() => { setFilterType('all'); setFilterSource('all'); }} className={`text-[16px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1.5 py-1 ${filterType === 'all' && filterSource === 'all' && !showFavoritesOnly ? 'font-bold text-black' : 'text-gray-400 hover:text-black'}`}>הכל</button>
                   <button onClick={() => { setFilterSource('pro'); setShowFavoritesOnly(false); }} className={`text-[16px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1.5 py-1 ${filterSource === 'pro' && !showFavoritesOnly ? 'font-bold text-black' : 'text-gray-400 hover:text-black'}`}>צלם</button>
                   <button onClick={() => { setFilterSource('guest'); setShowFavoritesOnly(false); }} className={`text-[16px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1.5 py-1 ${filterSource === 'guest' && !showFavoritesOnly ? 'font-bold text-black' : 'text-gray-400 hover:text-black'}`}>אורחים</button>
                   <button onClick={() => { setFilterType('photo'); setShowFavoritesOnly(false); }} className={`text-[16px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1.5 py-1 ${filterType === 'photo' && !showFavoritesOnly ? 'font-bold text-black' : 'text-gray-400 hover:text-black'}`}>תמונות</button>
                   <button onClick={() => { setFilterType('video'); setShowFavoritesOnly(false); }} className={`text-[16px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1.5 py-1 ${filterType === 'video' && !showFavoritesOnly ? 'font-bold text-black' : 'text-gray-400 hover:text-black'}`}>סרטונים</button>
                </div>

                <div className="flex items-center gap-3 md:gap-6 shrink-0 -ml-[7px]">
                  <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`p-2 rounded-full transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                  >
                      <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
                  </button>

                  <div className="hidden md:block relative w-48">
                      <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input type="text" placeholder="חיפוש לפי שם..." className="w-full pr-6 py-1 bg-transparent border-b border-transparent focus:border-black transition-all outline-none text-base uppercase tracking-widest placeholder:text-gray-300 text-right" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>

                  <button
                      className="md:hidden p-2 text-gray-400 hover:text-black transition-colors"
                      onClick={() => setIsSearchOpen(true)}
                  >
                      <Search size={20} />
                  </button>
                </div>
              </>
          )}
        </div>
      </div>

      <div
        ref={storiesScrollRef}
        className="w-full overflow-x-auto py-6 bg-white border-b border-gray-100 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onMouseDown={handleStoriesMouseDown}
        onMouseLeave={handleStoriesMouseLeave}
        onMouseUp={handleStoriesMouseUp}
        onMouseMove={handleStoriesMouseMove}
      >
        <div className="flex gap-4 px-4 min-w-max">
            {storyGroups.map((group) => {
                const validItems = group.items.filter(i => !deletedIds.has(i.id));
                if (validItems.length === 0) return null;
                return (
                    <button
                        key={group.uploaderName}
                        onClick={(e) => {
                            if (isStoriesDragging.current || storiesHasMoved.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                            handleStoryClick(group, validItems);
                        }}
                        className="flex flex-col items-center gap-2 group w-[22vw] md:w-[8vw] flex-shrink-0 select-none"
                    >
                        <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#E5B24B] via-[#FFEC1C] to-[#D6A230] group-hover:scale-105 transition-transform duration-300 shadow-md">
                            <div className="bg-white p-[3px] rounded-full">
                                <img src={group.avatar} alt={group.uploaderName} className="w-[4.2rem] h-[4.2rem] md:w-20 md:h-20 rounded-full object-cover border border-gray-100 pointer-events-none" />
                            </div>
                        </div>
                        <span className="text-[11px] md:text-sm font-medium text-black truncate w-full text-center">{group.uploaderName}</span>
                    </button>
                );
            })}
        </div>
      </div>

      <main className="w-full px-[3px] py-4">
        {filteredMedia.length === 0 && (
            <div className="py-20 text-center text-gray-400">
                <p>לא נמצאו תמונות</p>
                {showFavoritesOnly && <p className="text-sm mt-2">סמנו תמונות כפייבוריט כדי לראות אותן כאן</p>}
            </div>
        )}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-[3px] space-y-[3px]">
          <AnimatePresence>
            {filteredMedia.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (index % 3) * 0.1 }} onClick={() => openLightbox(item)} className="group relative overflow-hidden bg-gray-50 border-[0.5px] border-gray-100 cursor-pointer mb-[3px] break-inside-avoid">
                <img src={`${item.thumbnail}?auto=format&fit=crop&q=85&w=600`} alt={`Wedding Moment ${item.id}`} className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" loading="lazy" />
                {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"><Play size={20} fill="white" /></div>
                    </div>
                )}
                <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="absolute top-2 left-2 z-20 p-2 rounded-full hover:bg-black/10 transition-colors"
                >
                    <motion.div whileTap={{ scale: 1.2 }}>
                        <Heart
                            size={20}
                            className={`transition-colors duration-300 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-white hover:text-red-500'} ${favorites.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                    </motion.div>
                </button>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 pointer-events-none">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white text-[10px] uppercase tracking-widest font-light mb-1">{item.source === 'pro' ? 'Professional' : item.uploaderName}</p>
                        <p className="text-white/60 text-[8px] uppercase tracking-tighter">{item.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-white flex flex-col"
            onClick={closeLightbox}
          >
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); setIsShareMenuOpen(true); }} className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-md group">
                        <span className="hidden md:inline text-sm font-medium">שיתוף</span>
                        <Share2 size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors shadow-sm group">
                        <span className="hidden md:inline text-sm font-medium">הורדה</span>
                        <Download size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={(e) => toggleFavorite(selectedMedia.id, e)} className="p-3 bg-white border border-gray-100 hover:bg-gray-50 rounded-full shadow-md transition-all group">
                        <Heart size={24} className={favorites.has(selectedMedia.id) ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"} />
                    </button>
                    <button onClick={closeLightbox} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

            </div>

            <div className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
               <AnimatePresence mode="popLayout">
                  <motion.div
                     key={selectedMedia.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     className="relative w-full h-full flex items-center justify-center"
                  >
                     {selectedMedia.type === 'video' ? (
                        <video
                          src={selectedMedia.url}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          autoPlay controls playsInline loop
                        />
                     ) : (
                        <img
                          src={selectedMedia.url}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          alt=""
                        />
                     )}
                  </motion.div>
               </AnimatePresence>

               <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
                  <ChevronLeft size={32} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
                  <ChevronRight size={32} />
               </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-50 p-6 flex justify-between items-end pointer-events-none">

                <div className="flex flex-col items-start pointer-events-auto">
                     <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-right">
                        <p className="font-bold text-sm text-black">{selectedMedia.uploaderName}</p>
                        <p className="text-xs text-gray-500">{selectedMedia.timestamp.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                </div>

                <div className="pointer-events-auto">
                   <button onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(true); }} className="p-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-md">
                      <Trash2 size={20} />
                   </button>
                </div>

            </div>

            <AnimatePresence>
              {isShareMenuOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: 100 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 100 }}
                   className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[200] text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-around mb-4">
                            <button onClick={handleWhatsAppShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-green-100 rounded-full text-green-600"><MessageCircle size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                            </button>
                            <button onClick={handleInstagramStory} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-pink-100 rounded-full text-pink-600"><Instagram size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">Instagram</span>
                            </button>
                            <button onClick={handleFacebookShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Facebook size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">Facebook</span>
                            </button>
                            <button onClick={handleNativeShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-gray-100 rounded-full text-gray-600"><MoreHorizontal size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">עוד</span>
                            </button>
                        </div>
                        <button onClick={() => setIsShareMenuOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">ביטול</button>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeStoryGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center overflow-hidden" dir="rtl">

                {(() => {
                    const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);
                    const prevGroup = currentGroupIndex > 0 ? storyGroups[currentGroupIndex - 1] : null;
                    const nextGroup = currentGroupIndex < storyGroups.length - 1 ? storyGroups[currentGroupIndex + 1] : null;
                    return (
                        <>
                           <div className="hidden md:flex absolute right-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group" onClick={jumpToPrevGroup}>
                               {prevGroup && (
                                   <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                                       <img src={prevGroup.items[0].thumbnail} className="w-full h-full object-cover grayscale-[30%]" alt="" />
                                       <div className="absolute inset-0 bg-black/60" />
                                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                           <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                                                <img src={prevGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                                           </div>
                                           <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{prevGroup.uploaderName}</span>
                                       </div>
                                   </div>
                               )}
                           </div>

                           {prevGroup && (
                               <button onClick={jumpToPrevGroup} className="hidden md:flex absolute right-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"><ChevronRight size={32} /></button>
                           )}

                           <div className="hidden md:flex absolute left-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group" onClick={jumpToNextGroup}>
                               {nextGroup && (
                                   <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                                        <img src={nextGroup.items[0].thumbnail} className="w-full h-full object-cover grayscale-[30%]" alt="" />
                                        <div className="absolute inset-0 bg-black/60" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                                                 <img src={nextGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                                            </div>
                                            <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{nextGroup.uploaderName}</span>
                                        </div>
                                   </div>
                               )}
                           </div>

                           {nextGroup && (
                               <button onClick={jumpToNextGroup} className="hidden md:flex absolute left-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"><ChevronLeft size={32} /></button>
                           )}
                        </>
                    );
                })()}

                <div className="relative w-full h-full perspective-1000 flex items-center justify-center z-20 pointer-events-none">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div key={activeStoryGroup.uploaderName} custom={direction} variants={cubeVariants} initial="enter" animate="center" exit="exit" className="absolute w-full h-full flex items-center justify-center pointer-events-none" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd}>
                            <div className="relative w-full h-full md:w-[45vh] md:aspect-[9/16] bg-black md:rounded-2xl overflow-hidden flex flex-col pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.7)] border-0 md:border md:border-white/10">
                                <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
                                    <div className="flex gap-1 mb-3">
                                        {activeStoryGroup.items.map((_, idx) => (
                                            <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-white" initial={{ width: idx < activeStoryIndex ? '100%' : '0%' }} animate={{ width: idx < activeStoryIndex ? '100%' : (idx === activeStoryIndex ? `${storyProgress}%` : '0%') }} transition={{ ease: "linear", duration: 0 }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={activeStoryGroup.avatar} className="w-8 h-8 rounded-full border border-white/50" />
                                            <span className="text-white font-bold text-sm">{activeStoryGroup.uploaderName}</span>
                                            <span className="text-white/60 text-xs">{activeStoryGroup.items[activeStoryIndex].timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setIsStoryPaused(!isStoryPaused)} className="text-white/80">{isStoryPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}</button>
                                            <button onClick={() => setActiveStoryGroup(null)} className="text-white"><X size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden" onMouseDown={() => setIsStoryPaused(true)} onMouseUp={() => setIsStoryPaused(false)} onTouchStart={() => setIsStoryPaused(true)} onTouchEnd={() => setIsStoryPaused(false)}>

                                    <div className="absolute inset-0 z-0">
                                        <AnimatePresence mode="popLayout">
                                            <motion.img
                                                key={activeStoryGroup.items[activeStoryIndex].id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.6 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5 }}
                                                src={activeStoryGroup.items[activeStoryIndex].thumbnail}
                                                className="w-full h-full object-cover blur-[50px] scale-125 brightness-75"
                                                alt=""
                                            />
                                        </AnimatePresence>
                                    </div>

                                    <div className="absolute inset-0 flex z-20">
                                        <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); handlePrevStorySlide(); }}></div>
                                        <div className="w-2/3 h-full" onClick={(e) => { e.stopPropagation(); handleNextStorySlide(); }}></div>
                                    </div>
                                    {activeStoryGroup.items[activeStoryIndex].type === 'video' ? (
                                        <video src={activeStoryGroup.items[activeStoryIndex].url} className="w-full h-full object-contain relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" autoPlay playsInline loop={false} onEnded={handleNextStorySlide} />
                                    ) : (
                                        <img src={activeStoryGroup.items[activeStoryIndex].url} className="w-full h-full object-contain relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-6 pt-20 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                    <div className="relative pointer-events-auto">
                                      <AnimatePresence>
                                        {isStoryShareOpen && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            className="absolute bottom-full left-1/2 mb-4 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-3 min-w-[50px] shadow-lg"
                                          >
                                            <button onClick={handleInstagramStory} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Instagram size={20} className="text-white" /></button>
                                            <button onClick={handleWhatsAppShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><MessageCircle size={20} className="text-white" /></button>
                                            <button onClick={handleFacebookShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Facebook size={20} className="text-white" /></button>
                                            <button onClick={handleNativeShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><MoreHorizontal size={20} className="text-white" /></button>
                                            <div className="h-px bg-white/20 w-full my-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); handleStoryDownload(); setIsStoryShareOpen(false); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Download size={20} className="text-white" /></button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                      <button onClick={(e) => { e.stopPropagation(); setIsStoryShareOpen(!isStoryShareOpen); }} className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 flex items-center justify-center"><Send size={20} className="pr-[2px] pt-[2px]" /></button>
                                    </div>
                                    <div className="pointer-events-auto flex gap-3">
                                      <button onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(true); }} className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white hover:text-white transition-colors border border-white/10 group"><Trash2 size={20} className="group-hover:text-white" /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <footer className="pb-8 pt-20 px-6 bg-white border-t border-gray-100">
         <div className="max-w-[1800px] mx-auto flex flex-col gap-16">

            <div className="flex flex-col items-center justify-center gap-3 text-center">
                <span className="font-serif italic text-5xl md:text-6xl leading-none" dir="ltr">The End.</span>
                <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.3em] whitespace-nowrap" dir="ltr">Thank you for being part of our story</p>
            </div>

            <div className="flex flex-row items-center justify-between w-full">

                <button onClick={handleGiftClick} className="group flex items-center gap-3 bg-gray-50 hover:bg-gold-primary/10 border border-gray-200 hover:border-gold-primary/30 px-4 py-2 md:px-6 md:py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><AnimatedGiftIcon /></div>
                    <span className="font-medium text-xs md:text-sm text-gray-600 group-hover:text-black">מתנה לאורחים</span>
                </button>

                <div className="flex flex-col items-end">
                    <img src="https://i.postimg.cc/mPStkVPV/logo.png" alt="MY NIGHT" className="h-6 md:h-8 w-auto object-contain opacity-80" />
                    <p className="text-gray-300 text-[9px] uppercase mt-1 hidden md:block">© 2025 All Rights Reserved</p>
                </div>

            </div>
         </div>
      </footer>
    </div>
  );
};

export default Gallery;
