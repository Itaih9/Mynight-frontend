import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { paymentApi } from '@/services/api';

interface SumitHostedCheckoutProps {
  paymentId: string;
  onFailure?: (message?: string) => void;
  className?: string;
}

export const SumitHostedCheckout: React.FC<SumitHostedCheckoutProps> = ({
  paymentId,
  onFailure,
  className,
}) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    paymentApi
      .beginSumitRedirect(paymentId)
      .then((res) => {
        if (cancelled) return;
        const url = res?.data?.redirectUrl;
        if (!url) {
          setError('שגיאה ביצירת דף תשלום');
          onFailure?.('שגיאה ביצירת דף תשלום');
          return;
        }
        window.location.href = url;
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'שגיאה ביצירת דף תשלום';
        setError(msg);
        onFailure?.(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId, onFailure]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className || ''}`} dir="rtl">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`} dir="rtl">
      <Loader2 className="w-10 h-10 animate-spin text-gold-primary mb-3" />
      <p className="text-gray-500">מעבירים אתכם לדף תשלום מאובטח של Sumit…</p>
    </div>
  );
};

export default SumitHostedCheckout;
