import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MoreVertical,
  ChevronRight,
  Package,
  Tags,

} from "lucide-react";

import {
  useGetAllCategoriesCursorQuery,

  useGetItemsByCategoryQuery,
} from "../../redux/api/itemApi";

import AddItemCategoryModal from "../../components/Modal/AddItemCategoryModal";
import ItemModal from "../../components/Modal/ItemModal";
import MoveToCategoryModal from "../../components/Modal/MoveToCategoryModal";



const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ItemsByCategory() {
  //const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // controller's getAllCategories returns the raw array directly
  //const { data: categoriesRaw, isLoading } = useGetAllCategoriesQuery();
  // const categories = categoriesRaw || [];

  const selectedCategoryId = searchParams.get("categoryId") || null;
  const categorySearch = searchParams.get("q") || "";
  const itemSearch = searchParams.get("itemSearch") || "";
  const [menuOpen, setMenuOpen] = useState(null);
  //const [itemRowMenu, setItemRowMenu] = useState(null);
  //const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState({ open: false, mode: "add", data: null });
  const [showMoveModal, setShowMoveModal] = useState(false);
  //const [showEditItemModal, setShowEditItemModal] = useState(false);
  //const [editingItem, setEditingItem] = useState(null);
  const [leftCursor, setLeftCursor] = useState(null);
  const leftSentinelRef = useRef(null);
  const leftObserverRef = useRef(null);

  const {
    data: categoryResponse,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useGetAllCategoriesCursorQuery({ cursor: leftCursor, search: categorySearch, limit: 10 });

  const categories = categoryResponse?.categories || [];
  const categoriesHasMore = categoryResponse?.hasMore ?? false;
  const categoriesNextCursor = categoryResponse?.nextCursor ?? null;

  useEffect(() => { setLeftCursor(null); }, [categorySearch]);

  const handleLeftObserver = useCallback((entries) => {
    if (entries[0].isIntersecting && categoriesHasMore && categoriesNextCursor && !isCategoriesFetching && !isCategoriesLoading) {
      setLeftCursor(categoriesNextCursor);
    }
  }, [categoriesHasMore, categoriesNextCursor, isCategoriesFetching, isCategoriesLoading]);

  useEffect(() => {
    if (leftObserverRef.current) leftObserverRef.current.disconnect();
    leftObserverRef.current = new IntersectionObserver(handleLeftObserver, { threshold: 0.1 });
    if (leftSentinelRef.current) leftObserverRef.current.observe(leftSentinelRef.current);
    return () => leftObserverRef.current?.disconnect();
  }, [handleLeftObserver]);

  // const {
  //   data: itemsResponse,
  //   isLoading: isItemsLoading,
  // } = useGetItemsByCategoryQuery(
  //   {
  //     categoryId: selectedCategoryId || "all",
  //     search: itemSearch,
  //   },
  //   {
  //     skip: !selectedCategoryId,
  //   }
  // );

  // const items = itemsResponse?.items || [];
  /* ── RIGHT — items under selected category, cursor infinite scroll ── */
  const [rightCursor, setRightCursor] = useState(null);
  const rightSentinelRef = useRef(null);
  const rightObserverRef = useRef(null);

  const {
    data: itemsResponse,
    isLoading: isItemsLoading,
    isFetching: isItemsFetching,
    refetch: refetchItems,
  } = useGetItemsByCategoryQuery({ categoryId: selectedCategoryId, cursor: rightCursor, search: itemSearch });

  const items = itemsResponse?.items || [];
  const totalItems = itemsResponse?.totalItems || 0;
  //const categoryInfo = itemsResponse?.category;
  const itemsHasMore = itemsResponse?.hasMore ?? false;
  const itemsNextCursor = itemsResponse?.nextCursor ?? null;

  useEffect(() => { setRightCursor(null); }, [selectedCategoryId, itemSearch]);

  const handleRightObserver = useCallback((entries) => {
    if (entries[0].isIntersecting && itemsHasMore && itemsNextCursor && !isItemsFetching && !isItemsLoading) {
      setRightCursor(itemsNextCursor);
    }
  }, [itemsHasMore, itemsNextCursor, isItemsFetching, isItemsLoading]);

  useEffect(() => {
    if (rightObserverRef.current) rightObserverRef.current.disconnect();
    rightObserverRef.current = new IntersectionObserver(handleRightObserver, { threshold: 0.1 });
    if (rightSentinelRef.current) rightObserverRef.current.observe(rightSentinelRef.current);
    return () => rightObserverRef.current?.disconnect();
  }, [handleRightObserver]);

  // const filteredCategories = useMemo(() => {
  //   // "All" and "Uncategorized" are always pinned at the top, unaffected by cursor pagination
  //   return categories.filter((c) => c.Item_Category?.toLowerCase().includes(categorySearch.toLowerCase()));
  // }, [categories, categorySearch]);


  // default to "all" bucket on first load
  useEffect(() => {
    if (!categories.length || selectedCategoryId) return;

    const next = new URLSearchParams(searchParams);
    next.set("categoryId", "uncategorized");

    setSearchParams(next, { replace: true });
  }, [
    categories,
    selectedCategoryId,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    const closeMenu = () => {
      setMenuOpen(null);
      //setItemRowMenu(null);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // const sidebarCategories = useMemo(() => {
  //   const all = { Category_Id: "all", Item_Category: "All Items" };
  //   return [all, ...categories];
  // }, [categories]);

  // const filteredCategories = useMemo(() => {
  //   return sidebarCategories.filter((c) =>
  //     c.Item_Category.toLowerCase().includes(categorySearch.toLowerCase())
  //   );
  // }, [sidebarCategories, categorySearch]);
  const filteredCategories = categories
  console.log("filteredCategories", filteredCategories)
  const totalCategories = categoryResponse?.totalCategories || 0
  const selectedCategory =
    filteredCategories.find((c) => c.Category_Id === selectedCategoryId) || null;

  // const totalStockValue = useMemo(
  //   () => items.reduce((sum, it) => sum + Number(it.Stock_Value || 0), 0),
  //   [items]
  // );

  const handleSelectCategory = (category) => {
    const next = new URLSearchParams(searchParams);
    next.set("categoryId", category.Category_Id);
    next.delete("itemSearch");
    setSearchParams(next);
    setMenuOpen(null);
  };

  // const handleCategoryAdded = (savedCategory) => {
  //   setShowAddCategoryModal(false);

  //   if (savedCategory?.Category_Id) {
  //     const next = new URLSearchParams(searchParams);

  //     next.set("categoryId", savedCategory.Category_Id);

  //     next.delete("itemSearch");

  //     setSearchParams(next);
  //   }
  // };

console.log(selectedCategory)

  return (
    <>
      {/* ── BREADCRUMB ── */}


      <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">Items By Categories</h4>
              <p className="text-gray-500 text-sm">Manage your item categories and stock</p>
            </div>

            {/* <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
            >
              + Add Category
            </button> */}
            <button
              type="button"
              onClick={() => setCategoryModal({ open: true, mode: "add", data: null })}
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
            >
              + Add Category
            </button>
          </div>
        </div>

        {/* ── SPLIT LAYOUT ── */}
        <div
          className="flex flex-col lg:flex-row gap-0"
          style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}
        >

          {/* ══ LEFT — 30% — category list ══ */}
          <div
            className="w-full lg:w-[30%] overflow-y-auto overflow-x-hidden"
            style={{
              borderRight: "1px solid #e2e8f0",
              minHeight: "500px",
              maxHeight: "calc(100vh - 180px)",
              boxSizing: "border-box",
            }}
          >
            {/* search */}
            <div className="p-3" style={{ borderBottom: "1px solid #f1f5f9", boxSizing: "border-box" }}>
              <div className="relative" style={{ width: "100%", maxWidth: 180, height: 34 }}>
                <Search
                  size={14}
                  style={{ position: "absolute", left: 9, top: 10, color: "#94a3b8", pointerEvents: "none" }}
                />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => {
                    const value = e.target.value;

                    const next = new URLSearchParams(searchParams);

                    if (value) {
                      next.set("q", value);
                    } else {
                      next.delete("q");
                    }

                    setSearchParams(next, { replace: true });
                  }}
                  placeholder="Search Category"
                  className="border rounded-md text-sm outline-none"
                  style={{
                    width: "100%",
                    height: 34,
                    paddingLeft: 30,
                    paddingRight: 8,
                    borderColor: "#dbe3ea",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* list header */}
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
            >
              <Tags size={15} style={{ color: "#4CA1AF" }} />
              <span className="text-xs font-semibold text-black uppercase tracking-wider">
                Categories ({totalCategories})
              </span>
            </div>

            {isCategoriesLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Tags size={36} strokeWidth={1.2} />
                <p className="text-sm">No categories found</p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategoryId === category.Category_Id;
                //const isAllBucket = category.Category_Id === "all";
                const isUncategorized = category.Category_Id === "uncategorized";

                return (
                  <div
                    key={category.Category_Id}
                    onClick={() => handleSelectCategory(category)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (category.Category_Id === "uncategorized") return; // can't edit the virtual bucket
                      setCategoryModal({
                        open: true,
                        mode: "edit",
                        data: { Category_Id: category.Category_Id, Item_Category: category.Item_Category },
                      });
                    }}
                    className="relative flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                      borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ width: 36, height: 36, backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9" }}
                      >
                        <Tags size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                          {category.Item_Category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {/* {!isAllBucket && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const next = new URLSearchParams(searchParams);

                            next.set("categoryId", category.Category_Id);
                            next.delete("itemSearch");

                            setSearchParams(next);

                            setMenuOpen(
                              menuOpen === category.Category_Id
                                ? null
                                : category.Category_Id
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          title="More"
                        >
                          <MoreVertical size={14} style={{ color: "#374151" }} />
                        </button>
                      )} */}
                      {!isUncategorized && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const next = new URLSearchParams(searchParams);

                            next.set("categoryId", category.Category_Id);
                            next.delete("itemSearch");

                            setSearchParams(next);

                            setMenuOpen(
                              menuOpen === category.Category_Id
                                ? null
                                : category.Category_Id
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          title="More"
                        >
                          <MoreVertical size={14} style={{ color: "#374151" }} />
                        </button>
                      )}

                      <ChevronRight size={14} style={{ color: isSelected ? "#4CA1AF" : "#a5aab1" }} />
                    </div>

                    {menuOpen === category.Category_Id && (
                      <div
                        className="absolute bg-white shadow-lg rounded-md"
                        style={{ right: 10, top: 48, width: 140, zIndex: 50, border: "1px solid #e2e8f0" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryModal({
                              open: true,
                              mode: "edit",
                              data: { Category_Id: category.Category_Id, Item_Category: category.Item_Category },
                            });
                            setMenuOpen(null);
                          }}
                          //disabled
                          title="Edit category"
                          style={{ color: "#374151", cursor: "pointer" }}
                        >
                          View/Edit
                        </button>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-500 transition-colors"
                          disabled
                          title="Delete category — coming soon"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={leftSentinelRef} style={{ height: 1 }} />
            {isCategoriesFetching && leftCursor && <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>}
          </div>

          {/* ══ RIGHT — 70% — detail panel ══ */}
          <div
            className="w-full lg:w-[70%] p-1 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <div className="flex flex-col h-full">

              {/* ── CATEGORY SUMMARY CARD ── */}
              {/* <div className="rounded-xl p-2 mb-2 flex items-center justify-between gap-4"> */}
              <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* LEFT — All Items + item count */}
                <div className="flex items-center gap-4">

                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#4CA1AF22",
                    }}
                  >
                    <Package size={22} style={{ color: "#4CA1AF" }} />
                  </div>

                  <div>
                    <h6
                      className="font-bold text-gray-900"
                      style={{ fontSize: 18, margin: 0 }}
                    >
                      {selectedCategory?.Item_Category}
                    </h6>

                    <p className="text-gray-500 text-sm mt-0.5">
                      {totalItems} item{totalItems !== 1 ? "s" : ""}
                    </p>
                  </div>

                </div>

                {/* RIGHT — Search */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div
                    className="relative flex-shrink-0 w-full sm:w-auto"
                    style={{
                      width: 220,
                      height: 36,
                    }}
                  >
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 10,
                        color: "#94a3b8",
                        pointerEvents: "none",
                      }}
                    />

                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => {
                        const value = e.target.value;

                        const next = new URLSearchParams(searchParams);

                        if (value) {
                          next.set("itemSearch", value);
                        } else {
                          next.delete("itemSearch");
                        }

                        setSearchParams(next, { replace: true });
                      }}
                      placeholder="Search"
                      className="w-full h-full border rounded-md text-sm outline-none"
                      style={{
                        height: 36,
                        paddingLeft: 34,
                        paddingRight: 10,
                        borderColor: "#dbe3ea",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {selectedCategory?.Category_Id !== "uncategorized" && (<button
                    type="button"
                     onClick={() => setShowMoveModal(true)}
                    className="w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: "#4CA1AF",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  >
                    Move to this category
                  </button>)}
                </div>


              </div>

              {/* ── ITEMS TABLE ── */}
              <div className="table-responsive table-desi">
                <table
                  className="w-full min-w-[700px]"
                //style={{ fontSize: 13, borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr
                    //style={{ borderBottom: "2px solid #e2e8f0" }}
                    >
                      <th
                        //className="text-left py-2 px-3 font-semibold text-black"
                        style={{
                          //fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Item Name
                      </th>

                      <th
                        className="text-left py-2 px-3 font-semibold text-black"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Stock
                      </th>

                      <th
                        className="text-right py-2 px-3 font-semibold text-black"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Stock Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isItemsLoading ? (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                          Loading...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                          No items to show
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.Item_Id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onDoubleClick={() => {
                            setEditingItem(item);
                            setShowEditItemModal(true);
                          }}
                        >
                          <td className="py-2 px-3 text-black">
                            {item.Item_Name}
                          </td>

                          <td
                            //className="py-2 px-3"
                            style={{
                              color: item.Stock_Quantity < 0 ? "#dc2626" : "#000000",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.Stock_Quantity} {item.Unit || ""}
                          </td>

                          <td
                            className=" text-right"
                            style={{
                              color: "#000000",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹ {fmt(item.Stock_Value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
            <div ref={rightSentinelRef} style={{ height: 1 }} />
            {isItemsFetching && rightCursor && <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>}
            {!itemsHasMore && items.length > 0 && <div className="text-center text-xs text-gray-300 py-2">— End of items —</div>}
          </div>

        </div>
      </div>

      {/* {showAddCategoryModal && (
        <AddItemCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSave={handleCategoryAdded}
        />

      )} */}
      {categoryModal.open && (
        <AddItemCategoryModal
          mode={categoryModal.mode}
          categoryData={categoryModal.data}
          onClose={() => setCategoryModal({ open: false, mode: "add", data: null })}
          onSave={(savedCategory) => {
            setCategoryModal({ open: false, mode: "add", data: null });

            if (savedCategory?.Category_Id) {
              const next = new URLSearchParams(searchParams);
              next.set("categoryId", savedCategory.Category_Id);
              next.delete("itemSearch");
              setSearchParams(next);
            }
          }}
        />
      )}

      {showMoveModal && (
  <MoveToCategoryModal
    targetCategory={selectedCategory}
    onClose={() => setShowMoveModal(false)}
    onMoved={() => {
      setShowMoveModal(false);

      // refetch category items if needed
      refetchItems?.();
    }}
  />
)} 

    </>
  );
}