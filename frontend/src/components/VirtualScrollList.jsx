

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualScrollList = forwardRef(function VirtualScrollList({
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
    endMessage = "— End of results —",
    overscan = 12,
    getItemKey = (item, index) => index,
    dynamicHeight = false,
    className = "",
    style = {},
    isRowActive,

}, ref) {
    const scrollRef = useRef(null);
    const loadMoreInFlightRef = useRef(false); // 👈 guards against double-fire between the two effects

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: estimateSize || (() => rowHeight),
        overscan,
    });

    // useImperativeHandle(ref, () => ({
    //     scrollToIndex: (index, options) => {
    //         rowVirtualizer.scrollToIndex(index, options);
    //     },
    // }));
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index, options) => {
        if (!dynamicHeight) {
            rowVirtualizer.scrollToIndex(index, options);
            return;
        }

        // For dynamic-height lists, estimated row sizes are wrong until rows
        // actually render and get measured. Keep re-scrolling on successive
        // frames until the measured position stops changing (or we give up).
        let attempts = 0;
        const maxAttempts = 10;
        let lastOffset = null;

        const attemptScroll = () => {
            rowVirtualizer.scrollToIndex(index, options);
            attempts++;

            const container = scrollRef.current;
            const currentOffset = container?.scrollTop ?? null;

            const stabilized =
                lastOffset !== null &&
                currentOffset !== null &&
                Math.abs(currentOffset - lastOffset) < 1;

            lastOffset = currentOffset;

            if (!stabilized && attempts < maxAttempts) {
                requestAnimationFrame(attemptScroll);
            }
        };

        requestAnimationFrame(attemptScroll);
    },
}));
    const virtualItems = rowVirtualizer.getVirtualItems();

    // Reset the in-flight guard once fetching actually completes
    useEffect(() => {
        if (!isFetching) {
            loadMoreInFlightRef.current = false;
        }
    }, [isFetching]);

    // Scroll-based trigger — fires while user is scrolling near the end
    useEffect(() => {
        if (!onLoadMore || !hasMore || isFetching) return;
        if (loadMoreInFlightRef.current) return;

        const lastItem = virtualItems[virtualItems.length - 1];
        if (!lastItem) return;

        if (lastItem.index >= items.length - loadMoreThreshold) {
            loadMoreInFlightRef.current = true;
            onLoadMore();
        }
    }, [virtualItems, items.length, isFetching, hasMore, onLoadMore, loadMoreThreshold]);

    // Height-check trigger — fires when loaded content doesn't fill the
    // scroll container, so there's no scrollbar and the effect above
    // would otherwise never fire again.
    useEffect(() => {
        if (!onLoadMore || !hasMore || isFetching) return;
        if (loadMoreInFlightRef.current) return;

        const container = scrollRef.current;
        if (!container) return;

        const containerHeight = container.clientHeight;
        if (containerHeight === 0) return; // guard against pre-layout 0-height reads

        const totalContentHeight = rowVirtualizer.getTotalSize();

        if (totalContentHeight <= containerHeight) {
            loadMoreInFlightRef.current = true;
            onLoadMore();
        }
    }, [items.length, hasMore, isFetching, onLoadMore, rowVirtualizer]);

    const calculatedHeight = height ?? Math.min(items.length * rowHeight, maxHeight);

    return (
        <div
            className={className}
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "100%",
                width: "100%",
                minWidth: "fit-content",
                padding: 4,
                ...style,
            }}
        >
            {header}

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    minHeight: 0,
                    height: height !== undefined ? height : calculatedHeight,
                    overflowY: "auto",
                    overflowX: "visible",
                    position: "relative",
                    width: "100%",
                }}
            >
                {items.length === 0 && !isFetching ? (
                    <div className="px-3 py-2 text-center"
                        style={{ paddingTop: 40, paddingBottom: 40 }}>
                        {emptyMessage}
                    </div>
                ) : (
                    <div style={{ height: rowVirtualizer.getTotalSize(), width: "100%", position: "relative" }}>
                        {virtualItems.map((virtualRow) => {
                            const item = items[virtualRow.index];
                            if (!item) return null;
                            const active = isRowActive ? isRowActive(item, virtualRow.index) : false;
                            return (
                                <div
                                    key={getItemKey(item, virtualRow.index)}
                                    data-index={virtualRow.index}
                                    ref={dynamicHeight ? rowVirtualizer.measureElement : undefined}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`,
                                        zIndex: active ? 50 : 1,
                                        color: "black"
                                    }}
                                >
                                    {renderRow(item, virtualRow.index)}
                                </div>
                            );
                        })}
                    </div>
                )}

                {isFetching && (
                    <div className="text-center text-xs text-gray-400 py-2" style={{ position: "sticky", bottom: 0, background: "white" }}>
                        Loading more...
                    </div>
                )}

                {!hasMore && !isFetching && items.length > 0 && (
                    <div className="flex justify-center py-3">
                        <span className="text-xs text-gray-300">{endMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );

});

export default VirtualScrollList;