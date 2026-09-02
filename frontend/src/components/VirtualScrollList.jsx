import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * VirtualScrollList
 *
 * A single reusable virtualized list/table you can drop in anywhere you
 * currently render a long `.map()` of rows — item dropdowns, bank ledgers,
 * party lists, transaction tables, etc. Only the rows actually visible in
 * the viewport (+ overscan) ever exist in the DOM, no matter how many
 * thousands of items are in `items`.
 *
 * Props:
 *   items            — the full (already-loaded) array to render
 *   renderRow        — (item, index) => ReactNode. You control what each
 *                       row looks like — a CSS-grid row, a plain div, etc.
 *                       Do NOT set position/top/transform yourself; the
 *                       wrapper below handles that.
 *   rowHeight        — fixed px height per row (default 44). Use this when
 *                       every row is the same height — by far the common
 *                       case (dropdown rows, ledger rows).
 *   estimateSize     — optional (index) => number, for variable-height
 *                       rows. If provided, overrides rowHeight.
 *   height           — px height of the scroll viewport. If omitted, it
 *                       auto-sizes to `items.length * rowHeight`, capped
 *                       at `maxHeight`.
 *   maxHeight        — cap for the auto-sized height (default 240, i.e.
 *                       your old `max-h-60`).
 *   header           — optional ReactNode rendered once, above the
 *                       scrollable area, outside the virtualizer (sticky
 *                       column headers, an "+ Add" row, etc).
 *   onLoadMore       — () => void, called once when the user scrolls near
 *                       the end of the currently-loaded `items`.
 *   isFetching       — bool, shows a "Loading more…" footer and suppresses
 *                       duplicate onLoadMore calls while true.
 *   hasMore          — bool, stops calling onLoadMore once there's nothing
 *                       left to fetch.
 *   loadMoreThreshold— how many rows from the end triggers onLoadMore
 *                       (default 15).
 *   emptyMessage     — text shown when items.length === 0 and !isFetching.
 *   overscan         — extra rows rendered above/below the viewport so
 *                       fast scrolling never flashes blank gaps (default 12).
 *   className/style  — passed to the outer wrapper div.
 */
export default function VirtualScrollList({
    items = [],
    renderRow,
    rowHeight = 44,
    estimateSize,
    height,
    maxHeight = 240,
    header = null,
    onLoadMore,
    isFetching = false,
    hasMore = false,
    loadMoreThreshold = 15,
    emptyMessage = "No results found",
    overscan = 12,
    getItemKey = (item, index) => index,
    className = "",
    style = {},
}) {
  const scrollRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: estimateSize || (() => rowHeight),
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  /* ── infinite-scroll trigger — fires through the virtualizer's own
     render cycle, so it's naturally throttled without a manual RAF/
     scroll-event guard. ── */
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length - loadMoreThreshold && !isFetching) {
      onLoadMore();
    }
  }, [virtualItems, items.length, isFetching, hasMore, onLoadMore, loadMoreThreshold]);

  const viewportHeight =
    height ?? Math.min(items.length * rowHeight, maxHeight);

  return (
    <div className={className} style={style}>
      {header}

      <div
        ref={scrollRef}
        style={{
          height: viewportHeight,
          overflowY: "auto",
          position: "relative",
        }}
      >
        {items.length === 0 && !isFetching ? (
          <div className="px-3 py-2 text-gray-400 text-center">{emptyMessage}</div>
        ) : (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const item = items[virtualRow.index];
              if (!item) return null;

              return (
                <div
                key={getItemKey(item, virtualRow.index)}
                  //key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderRow(item, virtualRow.index)}
                </div>
              );
            })}
          </div>
        )}

        {isFetching && (
          <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>
        )}
      </div>
    </div>
  );
}