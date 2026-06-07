import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, Check, Share2, Download, Wallet, Users, TrendingUp,
  LogOut, Settings, X, Loader2, AlertCircle, CheckCircle2, QrCode, Star, Tag,
} from 'lucide-react';
import { affiliateApi } from '@/services/api/affiliate.api';
import { useAffiliateStore } from '@/store/affiliateStore';
import { ROUTES } from '@/config/routes';
import logoSvg from '@/assets/logo.svg';
import type { Affiliate, Referral, AffiliateStats, Withdrawal } from '@/types/api.types';
import LandingFooter from '@/components/landing/LandingFooter';
import { Footer as MobileFooter } from '@/components/mobile-landing/Footer';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: 'gold' | 'green' | 'gray' }> = ({ icon, label, value, sub, accent = 'gray' }) => {
  const accentColors: Record<string, string> = {
    gold: 'bg-gold-primary/10 text-gold-primary',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-center mb-2 md:mb-3">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${accentColors[accent]}`}>{icon}</div>
      </div>
      <div className="text-2xl md:text-3xl font-black text-black mb-1 break-all text-center">{value}</div>
      <div className="text-xs md:text-sm font-medium text-gray-500 text-center">{label}</div>
      {sub && <div className="text-[10px] md:text-xs text-gray-400 mt-1 text-center">{sub}</div>}
    </div>
  );
};

const AffiliateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { affiliate: storedAffiliate, token, logout, setAffiliate } = useAffiliateStore();

  const [affiliate, setLocalAffiliate] = useState<Affiliate | null>(storedAffiliate as Affiliate | null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [prepaid, setPrepaid] = useState<{ balance: number; used: number; couponCode?: string; usages: any[] } | null>(null);
  const [prepaidCodeCopied, setPrepaidCodeCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.AFFILIATE_LOGIN);
    }
  }, [token, navigate]);

  const refreshAll = async () => {
    if (!storedAffiliate) return;
    setLoading(true);
    try {
      const [meRes, statsRes, refsRes, wdRes, prepaidRes] = await Promise.all([
        affiliateApi.getMe(),
        affiliateApi.getStats(storedAffiliate._id),
        affiliateApi.getReferrals(storedAffiliate._id),
        affiliateApi.getWithdrawals(),
        affiliateApi.getPrepaid(),
      ]);
      if (meRes?.data) {
        setLocalAffiliate(meRes.data);
        setAffiliate(meRes.data);
      }
      if (statsRes?.data) setStats(statsRes.data);
      if (refsRes?.data) setReferrals(refsRes.data);
      if (wdRes?.data) setWithdrawals(wdRes.data);
      if (prepaidRes?.data) setPrepaid(prepaidRes.data as any);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'שגיאה בטעינת הנתונים';
      setToast({ kind: 'error', text: msg });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const referralLink = useMemo(() => {
    const code = affiliate?.referralCode || '';
    return `${window.location.origin}/register?ref=${code}`;
  }, [affiliate?.referralCode]);

  const handleCopy = async (text: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'link') {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    } catch {
      setToast({ kind: 'error', text: 'לא הצלחנו להעתיק. נסו שוב.' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `הצטרפו ל-MyNight דרך הקישור שלי 💍\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AFFILIATE_LOGIN);
  };

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gold-primary" />
      </div>
    );
  }

  const greetingName = affiliate.name || affiliate.email.split('@')[0];
  const availableBalance = affiliate.pendingEarnings || 0;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(referralLink)}&margin=10`;
  const hasBankDetails = Boolean(
    affiliate.bankName?.trim() &&
    affiliate.bankBranch?.trim() &&
    affiliate.bankAccountNumber?.trim() &&
    affiliate.bankAccountHolder?.trim()
  );
  const hasPendingRequest = withdrawals.some((w) => w.status === 'pending');
  const canRequestWithdrawal = availableBalance >= 100 && hasBankDetails && !hasPendingRequest;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between" dir="ltr">
          <button onClick={() => navigate(ROUTES.HOME)} className="focus:outline-none">
            <img src={logoSvg} alt="MY NIGHT" className="h-10 w-auto" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfile(true)} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" title="הגדרות פרופיל">
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" title="התנתקות">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-black mb-1">שלום, {greetingName}</h1>
          <p className="text-gray-500 text-base md:text-lg">סקירה על ההפניות והרווחים שלך</p>
        </div>

        {affiliate.status !== 'approved' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-amber-900">החשבון ממתין לאישור</p>
              <p className="text-sm text-amber-800">לאחר אישור הצוות תוכלו להתחיל לשתף ולצבור עמלות.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Users size={20} />} label="סך הפניות" value={stats?.totalReferrals ?? 0} accent="gray" />
          <StatCard icon={<TrendingUp size={20} />} label="הפניות שהומרו" value={stats?.convertedReferrals ?? 0} accent="green" />
          <StatCard icon={<Wallet size={20} />} label="זמין למשיכה" value={`₪${availableBalance}`} sub={`שולם עד כה: ₪${affiliate.paidEarnings || 0}`} accent="gold" />
        </div>

        <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold mb-2">הקישור האישי שלך</h2>
          <p className="text-gray-500 text-sm md:text-base mb-5 md:mb-6">שתפו את הקישור עם זוגות והרוויחו עמלה על כל אירוע שמשלם.</p>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
            <div className="flex-grow min-w-0 bg-gray-50 border border-gray-100 rounded-2xl px-4 md:px-5 py-3 md:py-4 text-left" dir="ltr">
              <div className="text-xs text-gray-400 mb-1">Referral link</div>
              <div className="font-mono text-xs md:text-sm text-black break-all">{referralLink}</div>
            </div>
            <button onClick={() => handleCopy(referralLink, 'link')} className={`shrink-0 px-5 py-3 sm:py-0 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${linkCopied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
              {linkCopied ? <><span>הועתק</span><Check size={18} /></> : <><span>העתקה</span><Copy size={18} /></>}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2 md:gap-3 mb-5 md:mb-6">
            <div className="text-sm text-gray-500">קוד אישי:</div>
            <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono font-bold text-black text-sm">{affiliate.referralCode}</code>
            <button onClick={() => handleCopy(affiliate.referralCode, 'code')} className="text-sm text-gray-500 hover:text-black transition-colors">
              {codeCopied ? 'הועתק' : 'העתקה'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            <button onClick={handleWhatsAppShare} className="flex items-center gap-2 bg-[#25D366] hover:brightness-110 text-white font-bold px-6 py-3 rounded-xl transition-all">
              <span>שיתוף בוואטסאפ</span>
              <WhatsAppIcon size={20} />
            </button>
            <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-black font-bold px-6 py-3 rounded-xl transition-all">
              <span>הצגת QR</span>
              <QrCode size={20} />
            </button>
            <button onClick={async () => { try { await navigator.share?.({ url: referralLink, text: 'הצטרפו ל-MyNight דרך הקישור שלי' }); } catch {} }} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-black font-bold px-6 py-3 rounded-xl transition-all">
              <span>שיתוף נוסף</span>
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">היסטוריית הפניות</h2>
            {referrals.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>עוד אין הפניות. שתפו את הקישור שלכם כדי להתחיל.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-right text-xs text-gray-400 uppercase tracking-wider">
                      <th className="px-2 py-3 font-medium">תאריך</th>
                      <th className="px-2 py-3 font-medium">סטטוס</th>
                      <th className="px-2 py-3 font-medium">סכום תשלום</th>
                      <th className="px-2 py-3 font-medium">עמלה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {referrals.map((r) => (
                      <tr key={r._id}>
                        <td className="px-2 py-3 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString('he-IL')}</td>
                        <td className="px-2 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            r.status === 'paid' ? 'bg-green-100 text-green-700' :
                            r.status === 'converted' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {r.status === 'paid' ? 'שולם' : r.status === 'converted' ? 'הומר' : 'ממתין'}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-700">{r.paymentAmount ? `₪${r.paymentAmount}` : '—'}</td>
                        <td className="px-2 py-3 text-sm font-bold text-black">{r.commissionAmount ? `₪${r.commissionAmount}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold mb-2">בקשת משיכה</h2>
            <p className="text-sm text-gray-500 mb-4 whitespace-pre-line">{`ניתן למשוך מ-250 ש"ח\nהצוות יעבד את הבקשה והסכום יעודכן בהקדם.`}</p>

            <div className="bg-gold-primary/5 border border-gold-primary/20 rounded-2xl p-4 mb-4">
              <div className="text-xs text-gray-500 mb-1">זמין למשיכה</div>
              <div className="text-3xl font-black text-black">₪{availableBalance}</div>
            </div>

            {!hasBankDetails && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <p className="text-amber-900 font-bold mb-1">חסרים פרטי בנק</p>
                <p className="text-amber-800 text-xs leading-relaxed">כדי לבקש משיכה יש למלא קודם את פרטי הבנק (בנק, סניף, מספר חשבון, שם בעל החשבון).</p>
                <button onClick={() => setShowProfile(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-700">
                  <span>מילוי פרטי בנק עכשיו</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowWithdrawal(true)}
              disabled={!canRequestWithdrawal}
              className="w-full bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {hasPendingRequest ? 'יש בקשה ממתינה' : !hasBankDetails ? 'נדרשים פרטי בנק' : 'בקשת משיכה חדשה'}
            </button>

            {withdrawals.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-bold text-gray-500 mb-3">היסטוריית משיכות</div>
                <div className="space-y-2">
                  {withdrawals.slice(0, 5).map((w) => (
                    <div key={w._id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
                      <div>
                        <div className="font-bold text-black">₪{w.amount}</div>
                        <div className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString('he-IL')}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        w.status === 'paid' ? 'bg-green-100 text-green-700' :
                        w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {w.status === 'paid' ? 'שולם' : w.status === 'rejected' ? 'נדחה' : 'ממתין'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      {prepaid && ((prepaid as any).linkedCoupons?.length > 0) && (
        <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-8" dir="rtl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-black text-black">קודי הנחה אישיים שלכם</h3>
              <p className="text-xs text-gray-500 mt-0.5">קודים שהוקצו אליכם — כל שימוש מזכה אתכם בעמלה של 2%.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(prepaid as any).linkedCoupons.map((c: any) => (
              <div key={c._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-lg text-black" dir="ltr">{c.code}</span>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded-full">{c.discountPercent}% הנחה</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>{c.usedCount} שימושים{c.maxUses > 0 ? ` / ${c.maxUses} מקסימום` : ''}</div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(c.code); setToast({ kind: 'success', text: 'הקוד הועתק' }); setTimeout(() => setToast(null), 1500); }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <span>העתק</span>
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prepaid && (prepaid.balance > 0 || prepaid.used > 0 || prepaid.couponCode) && (
        <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-8" dir="rtl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-black text-black">בנק אירועים</h3>
              <p className="text-xs text-gray-500 mt-0.5">קוד הנחה אישי שתוכלו לתת לזוגות. כל שימוש מוריד אירוע אחד מהמכסה.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gold-primary/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-gold-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-black">{prepaid.balance}</div>
              <div className="text-xs text-gray-500 mt-1 font-bold">זמינים</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-black">{prepaid.used}</div>
              <div className="text-xs text-gray-500 mt-1 font-bold">נוצלו</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-black">{prepaid.balance + prepaid.used}</div>
              <div className="text-xs text-gray-500 mt-1 font-bold">סה"כ</div>
            </div>
          </div>

          {prepaid.couponCode && (
            <div className="bg-gradient-to-r from-gold-primary/10 to-amber-50 rounded-2xl p-4 mb-5 border border-gold-primary/20">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-bold">קוד ההנחה האישי שלכם (100%):</span>
                  <span className="font-mono font-black text-lg text-black truncate" dir="ltr">{prepaid.couponCode}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(prepaid.couponCode!); setPrepaidCodeCopied(true); setTimeout(() => setPrepaidCodeCopied(false), 2000); }}
                  className="shrink-0 bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 text-sm"
                >
                  <span>{prepaidCodeCopied ? 'הועתק!' : 'העתק'}</span>
                  {prepaidCodeCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          {prepaid.usages && prepaid.usages.length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-500 mb-3">אירועים שניצלו את הקוד</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {prepaid.usages.map((u: any) => (
                  <div key={u._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-black text-sm truncate">{u.coupleName || u.eventName}</div>
                      {u.coupleName && u.eventName && u.coupleName !== u.eventName && (
                        <div className="text-xs text-gray-400 truncate">{u.eventName}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 mr-3">{new Date(u.usedAt || u.createdAt).toLocaleDateString('he-IL')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!prepaid.usages || prepaid.usages.length === 0) && prepaid.balance > 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              הקוד טרם שומש. שתפו אותו עם הזוגות שלכם כדי להתחיל להרוויח!
            </div>
          )}
        </div>
      )}
      </div>

      {showQR && (
        <Modal title="קוד QR לקישור האישי" onClose={() => setShowQR(false)}>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <img src={qrUrl} alt="QR code" width={240} height={240} className="block" />
            </div>
            <a href={qrUrl} download={`mynight-${affiliate.referralCode}.png`} className="flex items-center gap-2 text-sm font-bold text-black hover:underline">
              <span>הורדת התמונה</span>
              <Download size={16} />
            </a>
            <p className="text-xs text-gray-400 text-center max-w-xs">הציגו את הקוד בכרטיס ביקור או בעמדה פיזית — כל סריקה תוביל לרישום עם הקוד שלכם.</p>
          </div>
        </Modal>
      )}

      {showWithdrawal && (
        <WithdrawalModal
          maxAmount={availableBalance}
          onClose={() => setShowWithdrawal(false)}
          onSuccess={() => {
            setToast({ kind: 'success', text: 'הבקשה נשלחה בהצלחה' });
            setTimeout(() => setToast(null), 3000);
            setShowWithdrawal(false);
            refreshAll();
          }}
        />
      )}

      {showProfile && (
        <ProfileModal
          affiliate={affiliate}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => {
            setLocalAffiliate(updated);
            setAffiliate(updated);
            setToast({ kind: 'success', text: 'הפרטים נשמרו' });
            setTimeout(() => setToast(null), 3000);
            setShowProfile(false);
          }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-bold ${toast.kind === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}

      {loading && referrals.length === 0 && (
        <div className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
          <Loader2 size={16} className="animate-spin" />
          <span>טוען נתונים…</span>
        </div>
      )}

      <div className="mt-10" dir="ltr">
        {isMobile ? <MobileFooter /> : <LandingFooter />}
      </div>
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={22} /></button>
      </div>
      {children}
    </div>
  </div>
);

const WithdrawalModal: React.FC<{ maxAmount: number; onClose: () => void; onSuccess: () => void }> = ({ maxAmount, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>(String(maxAmount));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 100) {
      setError('סכום מינימלי למשיכה: ₪100');
      return;
    }
    if (num > maxAmount) {
      setError('הסכום חורג מהיתרה הזמינה');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await affiliateApi.requestWithdrawal({ amount: num, note });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'שגיאה בשליחת הבקשה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="בקשת משיכה" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">סכום (₪)</label>
          <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none text-lg font-bold" dir="ltr" />
          <div className="text-xs text-gray-400 mt-1">זמין: ₪{maxAmount}</div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">הערה (אופציונלי)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none resize-none" />
        </div>
        {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
        <button onClick={submit} disabled={loading} className="w-full bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
          <span>שליחת בקשה</span>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
        </button>
      </div>
    </Modal>
  );
};

const ProfileModal: React.FC<{ affiliate: Affiliate; onClose: () => void; onSaved: (a: Affiliate) => void }> = ({ affiliate, onClose, onSaved }) => {
  const [name, setName] = useState(affiliate.name || '');
  const [phone, setPhone] = useState(affiliate.phone || '');
  const [paypalEmail, setPaypalEmail] = useState(affiliate.paypalEmail || '');
  const [bankName, setBankName] = useState(affiliate.bankName || '');
  const [bankBranch, setBankBranch] = useState(affiliate.bankBranch || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(affiliate.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(affiliate.bankAccountHolder || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await affiliateApi.updateProfile({
        name,
        phone,
        paypalEmail,
        bankName,
        bankBranch,
        bankAccountNumber,
        bankAccountHolder,
      });
      if (res?.data) onSaved(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="הגדרות פרופיל" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">שם מלא</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">טלפון</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">PayPal (אופציונלי)</label>
          <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none" dir="ltr" />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-3">פרטי בנק להעברה</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">בנק</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value.slice(0, 30))}
                placeholder="לדוגמה: הפועלים"
                maxLength={30}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none text-sm text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">סניף</label>
              <input
                type="text"
                inputMode="numeric"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="לדוגמה: 123"
                maxLength={4}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none text-sm text-right"
                dir="rtl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">מספר חשבון</label>
              <input
                type="text"
                inputMode="numeric"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="עד 9 ספרות"
                maxLength={9}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none text-sm text-right"
                dir="rtl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">שם בעל החשבון</label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value.slice(0, 60))}
                maxLength={60}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-black outline-none text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">כל ארבעת השדות נדרשים. סניף עד 4 ספרות, חשבון עד 9 ספרות (כללי בנקאות ישראלית).</p>
        </div>

        {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
        <button onClick={save} disabled={loading} className="w-full bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
          <span>שמירה</span>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
        </button>
      </div>
    </Modal>
  );
};

export default AffiliateDashboard;
