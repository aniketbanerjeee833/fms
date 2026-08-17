import { useState, } from "react";
import { X, Search, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

import { useGetItemsNotInCategoryQuery, useMoveItemsToCategoryMutation } from "../../redux/api/itemApi";

const ACCENT = "#4CA1AF";

/**
 * MoveToCategoryModal
 *
 * Props:
 *   targetCategory — { Category_Id, Item_Category } the items are being moved INTO
 *   onClose        — () => void
 *   onMoved        — () => void  (called after a successful move, e.g. to refetch)
 */
export default function MoveToCategoryModal({ targetCategory, onClose, onMoved }) {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    //const [removeFromExisting, setRemoveFromExisting] = useState(false);
    //   const [sortField, setSortField]     = useState("Item_Name"); // "Item_Name" | "Stock_Quantity"
    //   const [sortDir, setSortDir]         = useState("asc");       // "asc" | "desc"
    console.log(targetCategory, "targetCategory");

    const categoryId = targetCategory?.Category_Id;
   
    //const { data: itemsResponse, isLoading } = useGetAllItemsQuery();
    const {
        data: itemsResponse,
        isLoading,

    } = useGetItemsNotInCategoryQuery(categoryId, {
        skip: !categoryId,
    });
    //const allItems = itemsResponse?.items || itemsResponse || [];
    console.log(itemsResponse, "itemsResponse");
    const items = (itemsResponse?.data || []).filter((it) =>
        it.Item_Name?.toLowerCase().includes(search.toLowerCase())
    );
    const [moveItemstoCategory, { isLoading: isMoving }] = useMoveItemsToCategoryMutation();

    /* ── filter + sort ── */
    //   const items = useMemo(() => {
    //     let list = allItems.filter((it) =>
    //       it.Item_Name?.toLowerCase().includes(search.toLowerCase())
    //     );

    //     list = [...list].sort((a, b) => {
    //       let av, bv;
    //       if (sortField === "Stock_Quantity") {
    //         av = Number(a.Stock_Quantity) || 0;
    //         bv = Number(b.Stock_Quantity) || 0;
    //       } else {
    //         av = (a.Item_Name || "").toLowerCase();
    //         bv = (b.Item_Name || "").toLowerCase();
    //       }
    //       if (av < bv) return sortDir === "asc" ? -1 : 1;
    //       if (av > bv) return sortDir === "asc" ? 1 : -1;
    //       return 0;
    //     });

    //     return list;
    //   }, [allItems, search, sortField, sortDir]);
    // const items = useMemo(() => {
    //   let list = [...(itemsResponse?.data || [])];

    //   if (search) {
    //     list = list.filter((it) =>
    //       it.Item_Name?.toLowerCase().includes(search.toLowerCase())
    //     );
    //   }

    //   return list.sort(...);
    // }, [itemsResponse, search, sortField, sortDir]);
    const allVisibleSelected = items.length > 0 && items.every((it) => selectedIds.has(it.Item_Id));

    //   const toggleSort = (field) => {
    //     if (sortField === field) {
    //       setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    //     } else {
    //       setSortField(field);
    //       setSortDir("asc");
    //     }
    //   };

    const toggleOne = (itemId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                items.forEach((it) => next.delete(it.Item_Id));
            } else {
                items.forEach((it) => next.add(it.Item_Id));
            }
            return next;
        });
    };


    console.log(selectedIds, "selectedIds");
    const handleMove = async () => {
        if (selectedIds.size === 0) {
            toast.info("Select at least one item to move.");
            return;
        }

        try {
            //   const res = await moveItems({
            //     body: {
            //       Category_Id: targetCategory.Category_Id,
            //       Item_Category: targetCategory.Item_Category,
            //       itemIds: Array.from(selectedIds),
            //       removeFromExisting,
            //     },
            //   }).unwrap();
             const res = await moveItemstoCategory({
      Item_Category: targetCategory.Item_Category,
      itemIds: Array.from(selectedIds),
    }).unwrap();
            console.log("selectedIds", selectedIds);

            toast.success(res?.message || `${selectedIds.size} item(s) moved to "${targetCategory.Item_Category}"`);
            onMoved?.();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to move items");
        }
    };



    //   const SortIcon = ({ field }) => {
    //     if (sortField !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />;
    //     return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
    //   };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                padding: "1rem",
                marginTop: "4rem",
            }}
        >
            <div
                className="bg-white w-full rounded-lg shadow-lg flex flex-col p-6"
                style={{ maxWidth: "42rem", maxHeight: "80vh" }}
            >
                {/* Header */}
                <div
                    className="flex justify-between items-center px-6 py-4"
                    style={{ borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}
                >
                    <h4 className="text-lg font-semibold text-gray-900">Select Items</h4>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pt-4" style={{ flexShrink: 0 }}>
                    <div className="relative">
                        {/* <Search
              size={16}
              style={{ position: "absolute", left: 12, top: 11, color: "#94a3b8", pointerEvents: "none" }}
            /> */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search items"
                            className="w-full border rounded-full outline-none p-2"
                        //   style={{
                        //     height: 38,
                        //     paddingLeft: 36,
                        //     paddingRight: 12,
                        //     borderColor: "#d1d5db",
                        //   }}
                        //   onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                        //   onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                        />
                    </div>
                </div>

                {/* Table header */}
                <div
                    className="flex items-center px-6 mt-3"
                    style={{
                        borderBottom: "1px solid #e5e7eb",
                        paddingBottom: 8,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ width: 32 }}>
                        <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleAllVisible}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                    </div>
                    <div
                        className="flex items-center gap-1 flex-1 text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                    //onClick={() => toggleSort("Item_Name")}
                    >
                        {/* Item Name <SortIcon field="Item_Name" /> */}
                        Item Name
                    </div>
                    <div
                        className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                        style={{ width: 100 }}
                    //onClick={() => toggleSort("Stock_Quantity")}
                    >
                        Quantity
                        {/* Quantity <SortIcon field="Stock_Quantity" /> */}
                    </div>
                </div>

                {/* Item list — scrollable */}
                <div
                    style={{
                        overflowY: "auto",
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    {isLoading ? (
                        <div className="text-center text-gray-400 text-sm py-10">Loading items...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-10">No items found</div>
                    ) : (
                        items.map((item) => {
                            const isChecked = selectedIds.has(item.Item_Id);
                            const qty = Number(item.Stock_Quantity) || 0;
                            return (
                                <div
                                    key={item.Item_Id}
                                    onClick={() => toggleOne(item.Item_Id)}
                                    className="flex items-center px-6 cursor-pointer"
                                    style={{
                                        height: 46,
                                        backgroundColor: isChecked ? "#f0f9ff" : "transparent",
                                        borderBottom: "1px solid #f3f4f6",
                                    }}
                                    onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                                    onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                    <div style={{ width: 32 }}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleOne(item.Item_Id)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: 16, height: 16, cursor: "pointer" }}
                                        />
                                    </div>
                                    <div className="flex-1 text-sm text-gray-800">{item.Item_Name}</div>
                                    <div
                                        className="text-sm font-medium text-right"
                                        style={{ width: 100, color: qty <= 0 ? "#dc2626" : "#16a34a" }}
                                    >
                                        {qty}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {/* className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4" */}
                <div className="flex justify-end mt-6 gap-3"
                //style={{ borderTop: "1px solid #e5e7eb", flexShrink: 0 }}
                >
                    {/* <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={removeFromExisting}
              onChange={(e) => setRemoveFromExisting(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            Remove selected items from existing category
          </label> */}


                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-full text-sm font-medium"
                        style={{ backgroundColor: "#e5e7eb", color: "#374151", border: "none", cursor: "pointer" }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleMove}
                        disabled={isMoving || selectedIds.size === 0}
                        className="px-5 py-2 rounded-full text-sm font-semibold text-white"
                        style={{
                            backgroundColor: ACCENT,
                            border: "none",
                            cursor: isMoving || selectedIds.size === 0 ? "not-allowed" : "pointer",
                            opacity: isMoving || selectedIds.size === 0 ? 0.6 : 1,
                        }}
                    >
                       
                        {isMoving ? "Moving..." : "Move to this category"}
                    </button>

                </div>
            </div>
        </div>
    );
}