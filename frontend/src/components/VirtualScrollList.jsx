import  { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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
    dynamicHeight = false, // 👈 new prop — opt-in per usage
    className = "",
    style = {},
    isRowActive, // 👈 new — (item, index) => boolean
    
}, ref) {
    const scrollRef = useRef(null);
    
    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: estimateSize || (() => rowHeight),
        overscan,
    });

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index, options) => {
            rowVirtualizer.scrollToIndex(index, options);
        },
    }));

    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        if (!onLoadMore || !hasMore) return;
        const lastItem = virtualItems[virtualItems.length - 1];
        if (!lastItem) return;
        if (lastItem.index >= items.length - loadMoreThreshold && !isFetching) {
            onLoadMore();
        }
    }, [virtualItems, items.length, isFetching, hasMore, onLoadMore, loadMoreThreshold]);

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
                minWidth: "fit-content",  // 👈 add this
                padding: 4,
                ...style,
            }}
        >
            {header}

            <div
                ref={scrollRef}
                //className="virtual-scroll-list"
                style={{
                    flex: 1,
                    minHeight: 0,
                    height: height !== undefined ? height : calculatedHeight,
                    overflowY: "auto",
                    //overflowX: "visible",
                    overflowX: "hidden",
                    position: "relative",
                    width: "100%",
                }}
              
            >
                {items.length === 0 && !isFetching ? (
                    <div className="px-3 py-2  text-center" 
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
                                    ref={dynamicHeight ? rowVirtualizer.measureElement : undefined} // 👈 key change
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`,
                                        zIndex: active ? 50 : 1,
                                        color:"black"
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
              {/* <style>
        {`

.virtual-scroll-list::-webkit-scrollbar {
  width: 12px;
}

.virtual-scroll-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.virtual-scroll-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.virtual-scroll-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
`}
      </style> */}
        </div>
    );
   
});

export default VirtualScrollList;