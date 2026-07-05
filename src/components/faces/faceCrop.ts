import type { CSSProperties } from 'react';

export interface FaceBoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

export interface FaceEntry {
  faceId: string;
  boundingBox: FaceBoundingBox;
}

/**
 * Inline styles for an <img> placed absolutely inside a `size`×`size`
 * rounded-full container so the given face is framed cleanly within the circle.
 *
 * boundingBox coords are 0–1 fractions of the image; imgW/imgH are the natural
 * pixel dimensions, multiplied in so the crop is undistorted.
 *
 * The face box is padded (so the whole face has breathing room and the circle
 * never clips it), scaled to *cover* the circle (no empty/gray gaps), then the
 * position is clamped so the image always covers the circle. That clamp is what
 * keeps a face near a photo edge fully inside the circle instead of being cut
 * off — and for a face that is genuinely only partially in the original photo,
 * it pads as far as the image allows and still shows the partial face.
 */
export function faceCircleImageStyle(
  box: FaceBoundingBox,
  imgW: number | undefined,
  imgH: number | undefined,
  size: number,
  pad = 0.6
): CSSProperties {
  const w = imgW && imgW > 0 ? imgW : 1;
  const h = imgH && imgH > 0 ? imgH : 1;

  const faceW = box.Width * w;
  const faceH = box.Height * h;
  const faceCx = (box.Left + box.Width / 2) * w;
  const faceCy = (box.Top + box.Height / 2) * h;

  // Padded square region around the face we'd like to frame in the circle.
  const region = Math.max(faceW, faceH, 1) * (1 + pad);
  // Use the framing scale, but never less than what's needed to cover the
  // circle with image (so there are no gray gaps at the edges).
  const scale = Math.max(size / region, size / Math.min(w, h));

  const renderedW = w * scale;
  const renderedH = h * scale;

  // Center on the face, then clamp so the image edges never come inside the
  // circle — this shifts a near-edge face back into view instead of clipping.
  const clamp = (v: number, rendered: number) => Math.min(0, Math.max(size - rendered, v));

  return {
    position: 'absolute',
    width: `${renderedW}px`,
    height: `${renderedH}px`,
    left: `${clamp(size / 2 - faceCx * scale, renderedW)}px`,
    top: `${clamp(size / 2 - faceCy * scale, renderedH)}px`,
    maxWidth: 'none',
  };
}
