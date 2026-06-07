import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { paymentApi } from '@/services/api';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import { BuildingGalleryLoader } from '@/components/common';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('');
  const { user, setNewUser } = useUserStore();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!paymentId) {
        setStatus('failed');
        setMessage('חסר מזהה תשלום');
        return;
      }
      try {
        const res = await paymentApi.verifySumitRedirect(paymentId);
        if (cancelled) return;
        if (res.success) {
          setStatus('success');
          setMessage('התשלום הושלם בהצלחה');
        } else {
          setStatus('failed');
          setMessage(res.message || 'התשלום לא הושלם');
        }
      } catch (err: any) {
        if (cancelled) return;
        setStatus('failed');
        const errMsg = err?.response?.data?.error || err?.response?.data?.message || 'שגיאה באימות התשלום';
        setMessage(errMsg);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const handleAnimationComplete = () => {
    setNewUser(true);
    localStorage.setItem('show-welcome-popup', 'true');
    navigate(ROUTES.UPLOAD);
  };

  const handleRetry = () => navigate(ROUTES.REGISTER);

  if (status === 'success') {
    const coupleNames = [user?.partnerName1, user?.partnerName2].filter(Boolean).join(' ו') || user?.name || 'הזוג היקר';
    return (
      <BuildingGalleryLoader
        coupleNames={coupleNames}
        eventDate={user?.weddingDate}
        onComplete={handleAnimationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gold-primary" />
            <h1 className="text-2xl font-bold mb-2">מאמתים את התשלום…</h1>
            <p className="text-gray-500">אנא המתינו רגע</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">התשלום לא הושלם</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <button onClick={handleRetry} className="bg-black text-white px-8 py-3 rounded-xl font-bold">
              חזרה לעמוד התשלום
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
