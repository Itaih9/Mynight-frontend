import React, { useEffect, useRef, useState } from 'react';
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

  // Held in a ref so it can stay OUT of the effect's dependencies. The parent
  // passes an inline arrow, which is a new identity on every one of its
  // renders — with onFailure in the deps the effect re-ran on each render and
  // opened another payment session. A real customer got three within two
  // seconds, each racing the others' window.location.href, so the browser never
  // navigated: they sat on a dead screen for four minutes, went back, and
  // retried until it worked. Their checkout left five events behind.
  const onFailureRef = useRef(onFailure);
  onFailureRef.current = onFailure;

  // A payment session must be opened at most once per paymentId. Guards both a
  // stray re-render and React StrictMode's deliberate double-invoke in dev.
  const startedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (startedForRef.current === paymentId) return;
    startedForRef.current = paymentId;

    let cancelled = false;
    setError(null);

    paymentApi
      .beginSumitRedirect(paymentId)
      .then((res) => {
        if (cancelled) return;
        const url = res?.data?.redirectUrl;
        if (!url) {
          setError('שגיאה ביצירת דף תשלום');
          onFailureRef.current?.('שגיאה ביצירת דף תשלום');
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
  }, [paymentId]);

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
