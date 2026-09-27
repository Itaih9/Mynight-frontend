import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Photo } from '@/types/api.types';

/**
 * A masonry grid whose photos never move once placed.
 *
 * CSS `columns` fills column 1 top to bottom, then column 2, and rebalances
 * every time an image finishes loading and gains its height. In a gallery that
 * loads lazily, photos the guest has already seen jump between columns and
 * newly loaded ones appear above them.
 *
 * Here each item is given a column up front, from its known size only (never
 * from what has loaded), so nothing is ever re-placed: a photo that loads late
 * can only push the ones BELOW it in its own column down. Items go to the
 * currently shortest column, in order, so the page still reads top-first.
 */

/** Tailwind's md / lg breakpoints, matching the old `columns-2 md:columns-3 lg:columns-4`. */
const columnCountFor = (width: number) => (width >= 1024 ? 4 : width >= 768 ? 3 : 2);

const useColumnCount = () => {
  const [count, setCount] = useState(() => (typeof window === 'undefined' ? 2 : columnCountFor(window.innerWidth)));
  useEffect(() => {
    const onResize = () => setCount(columnCountFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
};

/** Height per unit of width for a portrait phone photo, when the real size is unknown. */
const DEFAULT_HEIGHT_PER_WIDTH = 4 / 3;

export const assignColumns = <T,>(
  items: T[],
  columnCount: number,
  heightPerWidth: (item: T) => number | null
): T[][] => {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array(columnCount).fill(0);
  for (const item of items) {
    let shortest = 0;
    for (let c = 1; c < columnCount; c += 1) if (heights[c] < heights[shortest]) shortest = c;
    columns[shortest].push(item);
    const h = heightPerWidth(item);
    heights[shortest] += h && Number.isFinite(h) && h > 0 ? h : DEFAULT_HEIGHT_PER_WIDTH;
  }
  return columns;
};

/** height / width of a photo from the dimensions recorded at upload, if any. */
export const photoHeightPerWidth = (photo: Photo): number | null => {
  const { width, height } = photo.metadata ?? {};
  return width && height ? height / width : null;
};

interface MasonryColumnsProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** height / width from data the API already sent; null when unknown. */
  heightPerWidth: (item: T) => number | null;
  renderItem: (item: T) => ReactNode;
}

export function MasonryColumns<T>({ items, getKey, heightPerWidth, renderItem }: MasonryColumnsProps<T>) {
  const columnCount = useColumnCount();
  // heightPerWidth reads item data only, so the placement depends on nothing
  // but the list and the column count.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(() => assignColumns(items, columnCount, heightPerWidth), [items, columnCount]);

  return (
    <div className="flex items-start gap-[3px]">
      {columns.map((column, c) => (
        <div key={c} className="flex-1 min-w-0">
          {column.map((item) => (
            <div key={getKey(item)}>{renderItem(item)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default MasonryColumns;
