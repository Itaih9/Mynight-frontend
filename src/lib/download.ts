/**
 * Saving a file from the browser, in a way Safari actually honours.
 *
 * The gallery used to build an <a download> and click it after awaiting the
 * signed URL. That fails on Safari, and sometimes on Chrome, for three separate
 * reasons — all of them invisible to the user, because the failure is "nothing
 * happens" rather than an error:
 *
 * 1. `download` is ignored on a CROSS-ORIGIN href. Our media lives on S3/
 *    CloudFront, a different origin from the app, so the attribute never
 *    applied and the click was only ever a plain navigation. What actually
 *    saves the file is the `Content-Disposition: attachment` the backend puts
 *    on the signed URL (photos.service.ts) — not the attribute.
 * 2. `target="_blank"` turns that navigation into a POPUP, and a popup opened
 *    after an `await` is blocked: the user activation that authorised it has
 *    already expired by the time the network round-trip returns. This is why
 *    the single-photo download in the face album did nothing at all on Safari.
 * 3. Revoking an object URL immediately after `.click()` can cancel the
 *    download outright on Safari, which has not finished reading it yet.
 *
 * Assigning `location.href` is subject to none of this: it is not a popup, so
 * no blocker applies, and it does not need a live user activation. Because the
 * response is an attachment the page does not navigate away — the browser just
 * saves the file.
 */

/**
 * Where `<a download>` is honoured: blob:/data: URLs and our own origin.
 * Anywhere else the attribute is dropped and only the server's
 * Content-Disposition decides whether the browser saves or displays.
 */
const canUseDownloadAttribute = (url: string): boolean => {
  if (url.startsWith('blob:') || url.startsWith('data:')) return true;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Save the file at `url`.
 *
 * `filename` is a request, not a guarantee: for a cross-origin URL the browser
 * takes the name from the server's Content-Disposition and ignores ours.
 */
export const saveUrl = (url: string, filename?: string): void => {
  if (canUseDownloadAttribute(url)) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    // No target: a new tab would make this a popup, which is blocked once the
    // click is no longer inside a live user activation.
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  // Cross-origin: the attribute would be dropped anyway, so navigate instead.
  // The attachment header saves the file and leaves the page where it is.
  window.location.href = url;
};

/** Milliseconds to keep an object URL alive after the click. */
const REVOKE_DELAY_MS = 60_000;

/**
 * Save an in-memory blob (a zip we streamed from the API) under `filename`.
 * A blob URL is same-origin, so here the download attribute really does apply
 * and the name we pass is the name the user gets.
 */
export const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  saveUrl(url, filename);
  // Deferred, not immediate: Safari cancels a download whose object URL is
  // revoked before it has finished reading it.
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
