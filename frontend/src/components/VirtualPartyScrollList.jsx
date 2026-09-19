import { useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualPartyScrollList({
  parties = [],
  isFetching = false,
  hasMore = false,
  onLoadMore,
  scrollRef,
  onSelectParty,
}) {
  const ROW_HEIGHT = 56;

  const rowVirtualizer = useVirtualizer({
    count: parties.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Load next page when near bottom
  useEffect(() => {
    const lastItem =
      virtualItems[virtualItems.length - 1];

    if (!lastItem) return;
    if (!hasMore) return;
    if (isFetching) return;

    if (
      lastItem.index >=
      parties.length - 15
    ) {
      onLoadMore();
    }
  }, [
    virtualItems,
    parties.length,
    isFetching,
    hasMore,
    onLoadMore,
  ]);

  return (
    <div
      ref={(el) => {
        scrollRef.current = el;
      }}
      style={{
        height: Math.min(
          parties.length * ROW_HEIGHT,
          240
        ),
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {parties.length === 0 && !isFetching ? (
        <div className="px-3 py-2 text-gray-400 text-center">
          No Party found
        </div>
      ) : (
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const party =
              parties[virtualRow.index];

            if (!party) return null;

            const bal = Number(
              party.Current_Balance ?? 0
            );

            const balColor =
              bal < 0
                ? "#ef4444"
                : "#16a34a";

            return (
              <div
                key={party.Party_Id}
                onMouseDown={(e) =>
                  e.preventDefault()
                }
                onClick={() =>
                  onSelectParty(party)
                }
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer gap-4"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  borderBottom:
                    "1px solid #f3f4f6",
                  boxSizing: "border-box",
                }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-gray-800 font-medium truncate">
                    {party.Party_Name}
                  </span>

                  <span className="text-xs text-gray-400">
                    {party.Phone_Number || "—"}
                  </span>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    Balance
                  </span>

                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: balColor,
                    }}
                  >
                    ₹
                    {bal.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFetching && (
  <div className="text-center text-xs text-gray-400 py-2">
    Loading more...
  </div>
)}

{!isFetching && !hasMore && parties.length > 0 && (
  <div className="text-center text-xs text-gray-400 py-2">
    — End of parties —
  </div>
)}
    </div>
  );
}

export default VirtualPartyScrollList;