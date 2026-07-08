import { useEffect, useState } from 'react';

/**
 * Reads the browser's Network Information API to decide whether to conserve
 * data / bandwidth. Available on Chromium (Android especially); unsupported on
 * iOS Safari, where it safely reports "not constrained" and callers keep their
 * default (higher-quality) behavior.
 */
// Below this estimated bandwidth (Mbps) we treat the connection as constrained
// even on a "4g" effectiveType — covers weak/congested mobile data.
const SLOW_DOWNLINK_MBPS = 1.5;

interface NetworkQuality {
  /** Data Saver on, a slow effectiveType (2g/3g), or low estimated downlink. */
  dataSaver: boolean;
  saveData: boolean;
  effectiveType: string | null;
  /** Estimated downlink in Mbps, or null when unavailable (e.g. iOS Safari). */
  downlink: number | null;
}

const read = (): NetworkQuality => {
  if (typeof navigator === 'undefined') return { dataSaver: false, saveData: false, effectiveType: null, downlink: null };
  const conn = (navigator as any).connection as
    | { effectiveType?: string; saveData?: boolean; downlink?: number }
    | undefined;
  if (!conn) return { dataSaver: false, saveData: false, effectiveType: null, downlink: null };
  const saveData = !!conn.saveData;
  const effectiveType = conn.effectiveType ?? null;
  const downlink = typeof conn.downlink === 'number' ? conn.downlink : null;
  const slowType = effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  const slowDownlink = downlink !== null && downlink > 0 && downlink < SLOW_DOWNLINK_MBPS;
  return { dataSaver: saveData || slowType || slowDownlink, saveData, effectiveType, downlink };
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
