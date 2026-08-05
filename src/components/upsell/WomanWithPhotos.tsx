/**
 * The mobile-landing hero motif: the woman holding her phone, with guest
 * photos drifting behind her on a marquee. Shared so the upsell popup and
 * the פלאש+ upgrade page show exactly the same thing.
 */

/** The same six photos the mobile-landing hero floats behind the woman. */
const S = 'https://d1sayt91mdit04.cloudfront.net/static/landing';
export const FLOATING_SHOTS = [
  `${S}/hero-1.jpg`, // replaced 5tprJQnK
  `${S}/QMjzvJk9.png`,
  `${S}/hero-2.jpg`, // replaced xjRcq8Vz
  `${S}/vmGKCtLq.png`,
  `${S}/rpqH7NC3.png`,
  `${S}/hero-3.jpg`, // replaced 7LqRjnM2
];

export const WomanWithPhotos = ({
  womanClassName = 'h-40 w-auto',
  className = '',
}: {
  womanClassName?: string;
  className?: string;
}) => (
  <div className={`relative flex justify-center overflow-hidden ${className}`}>
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[42%] -translate-y-1/2 w-[150%] overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div className="flex whitespace-nowrap wwp-marquee" style={{ willChange: 'transform' }}>
        {[...FLOATING_SHOTS, ...FLOATING_SHOTS, ...FLOATING_SHOTS, ...FLOATING_SHOTS].map((src, i) => (
          <div
            key={i}
            className="mx-2 flex-shrink-0 rounded-[12px]"
            style={{
              width: 91,
              height: 91,
              padding: 3,
              backgroundColor: '#f5f5f4',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div className="w-full h-full bg-white rounded-[9px] overflow-hidden">
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <img
      src="/images/woman-holding-phone.png"
      alt=""
      loading="lazy"
      className={`relative z-[1] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.14)] ${womanClassName}`}
    />

    <style>{`
      @keyframes wwpMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      .wwp-marquee { animation: wwpMarquee 26s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .wwp-marquee { animation: none } }
    `}</style>
  </div>
);

export default WomanWithPhotos;
