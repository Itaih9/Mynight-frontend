import { useEffect, useState } from 'react';

/**
 * Reads the browser's Network Information API to decide whether to conserve
 * data / bandwidth. Available on Chromium (Android especially); unsupported on
 * iOS Safari, where it safely reports "not constrained" and callers keep their
 * default (higher-quality) behavior.
 */
interface NetworkQuality {
  /** Data Saver is on, or the connection is estimated as slow (2g/3g). */
  dataSaver: boolean;
  saveData: boolean;
  effectiveType: string | null;
}

const read = (): NetworkQuality => {
  if (typeof navigator === 'undefined') return { dataSaver: false, saveData: false, effectiveType: null };
  const conn = (navigator as any).connection as
    | { effectiveType?: string; saveData?: boolean }
    | undefined;
  if (!conn) return { dataSaver: false, saveData: false, effectiveType: null };
  const saveData = !!conn.saveData;
  const effectiveType = conn.effectiveType ?? null;
  const slow = effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  return { dataSaver: saveData || slow, saveData, effectiveType };
};

export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(read);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn || typeof conn.addEventListener !== 'function') return;
    const onChange = () => setQuality(read());
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener('change', onChange);
  }, []);

  return quality;
}
