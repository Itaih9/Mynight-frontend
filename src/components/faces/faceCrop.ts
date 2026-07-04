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
 * rounded-full container so the given face bounding box is centered and framed
 * within the circle.
 *
 * boundingBox coords are 0–1 fractions of the image; imgW/imgH are the natural
 * pixel dimensions and are multiplied in to keep the crop undistorted. `fit` is
 * the share of the circle the face box's larger side should occupy, leaving a
 * little breathing room around the face.
 */
export function faceCircleImageStyle(
  box: FaceBoundingBox,
  imgW: number | undefined,
  imgH: number | undefined,
  size: number,
  fit = 0.86
): CSSProperties {
  const w = imgW && imgW > 0 ? imgW : 1;
  const h = imgH && imgH > 0 ? imgH : 1;

  const faceX = box.Left * w;
  const faceY = box.Top * h;
  const faceW = box.Width * w;
  const faceH = box.Height * h;

  const scale = (size * fit) / Math.max(faceW || 1, faceH || 1);

  return {
    position: 'absolute',
    width: `${w * scale}px`,
    height: `${h * scale}px`,
    left: `${size / 2 - (faceX + faceW / 2) * scale}px`,
    top: `${size / 2 - (faceY + faceH / 2) * scale}px`,
    maxWidth: 'none',
  };
}
