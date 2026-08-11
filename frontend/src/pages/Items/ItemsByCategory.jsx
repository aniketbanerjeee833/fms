import { useMemo, useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MoreVertical,
  ChevronRight,
  Package,
  Tags,
  
} from "lucide-react";

import {
  useGetAllCategoriesQuery,
  useGetItemsByCategoryQuery,
} from "../../redux/api/itemApi";

import AddItemCategoryModal from "../../components/Modal/AddItemCategoryModal";
import ItemModal from "../../components/Modal/ItemModal";



const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ItemsByCategory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // controller's getAllCategories returns the raw array directly
  const { data: categoriesRaw, isLoading } = useGetAllCategoriesQuery();
  const categories = categoriesRaw || [];

  const selectedCategoryId = searchParams.get("categoryId") || null;
  const categorySearch = searchParams.get("q") || "";
  const itemSearch = searchParams.get("itemSearch") || "";
  const [menuOpen, setMenuOpen] = useState(null);
  const [itemRowMenu, setItemRowMenu] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  //const [showEditItemModal, setShowEditItemModal] = useState(false);
  //const [editingItem, setEditingItem] = useState(null);


  const {
    data: itemsResponse,
    isLoading: isItemsLoading,
  } = useGetItemsByCategoryQuery(
    {
      categoryId: selectedCategoryId || "all",
      search: itemSearch,
    },
    {
      skip: !selectedCategoryId,
    }
  );

  const items = itemsResponse?.items || [];
  // console.log("category items",items)

  // default to "all" bucket on first load
  useEffect(() => {
    if (!categories.length || selectedCategoryId) return;

    const next = new URLSearchParams(searchParams);
    next.set("categoryId", "all");

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
      setItemRowMenu(null);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const sidebarCategories = useMemo(() => {
    const all = { Category_Id: "all", Item_Category: "All Items" };
    return [all, ...categories];
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return sidebarCategories.filter((c) =>
      c.Item_Category.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sidebarCategories, categorySearch]);

  const selectedCategory =
    sidebarCategories.find((c) => c.Category_Id === selectedCategoryId) || null;

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

  const handleCategoryAdded = (savedCategory) => {
    setShowAddCategoryModal(false);

    if (savedCategory?.Category_Id) {
      const next = new URLSearchParams(searchParams);

      next.set("categoryId", savedCategory.Category_Id);

      next.delete("itemSearch");

      setSearchParams(next);
    }
  };



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

            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
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
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categories ({filteredCategories.length})
              </span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Tags size={36} strokeWidth={1.2} />
                <p className="text-sm">No categories found</p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategoryId === category.Category_Id;
                const isAllBucket = category.Category_Id === "all";

                return (
                  <div
                    key={category.Category_Id}
                    onClick={() => handleSelectCategory(category)}
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
                      {!isAllBucket && (
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
                          <MoreVertical size={14} style={{ color: "#94a3b8" }} />
                        </button>
                      )}

                      <ChevronRight size={14} style={{ color: isSelected ? "#4CA1AF" : "#cbd5e1" }} />
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
                          disabled
                          title="Edit category — coming soon"
                          style={{ color: "#9ca3af", cursor: "not-allowed" }}
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
          </div>

          {/* ══ RIGHT — 70% — detail panel ══ */}
          <div
            className="w-full lg:w-[70%] p-1 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <div className="flex flex-col h-full">

              {/* ── CATEGORY SUMMARY CARD ── */}
              <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 44, height: 44, backgroundColor: "#4CA1AF22" }}
                  >
                    <Package size={22} style={{ color: "#4CA1AF" }} />
                  </div>
                  <div>
                    <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
                      {selectedCategory?.Item_Category}
                    </h6>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs uppercase text-gray-400 mb-1">Stock Value</p>
                    <p className="font-bold" style={{ color: "#4CA1AF", fontSize: 18 }}>
                      ₹ {fmt(totalStockValue)}
                    </p>
                  </div>
                </div> */}
              </div>

              {/* ── SEARCH ITEMS ── */}
              <div className="px-1 py-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <div className="relative" style={{ width: "40%", minWidth: 220, maxWidth: 300, height: 36 }}>
                  <Search
                    size={16}
                    style={{ position: "absolute", left: 10, top: 10, color: "#94a3b8", pointerEvents: "none" }}
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
                    style={{ height: 36, paddingLeft: 34, paddingRight: 10, borderColor: "#dbe3ea" }}
                  />
                </div>
              </div>

              {/* ── ITEMS TABLE ── */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full min-w-[600px]" style={{ fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      {["Item Name", "Unit", "Stock", "Stock Value", ""].map((h, index) => (
                        <th
                          key={index}
                          className="text-left py-2 px-3 font-semibold text-black"
                          style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isItemsLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
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
                          <td className="py-2 px-3 text-black">{item.Item_Name}</td>
                          <td className="py-2 px-3 text-black">{item.Unit || "—"}</td>
                          <td
                            className="py-2 px-3"
                            style={{ color: item.Stock_Quantity < 0 ? "#dc2626" : "#000000" }}
                          >
                            {item.Stock_Quantity}
                          </td>
                          <td className="py-2 px-3 font-semibold" style={{ color: "#000000", whiteSpace: "nowrap" }}>
                            ₹ {fmt(item.Stock_Value)}
                          </td>
                          {/* <td className="py-2 px-3">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemRowMenu(itemRowMenu === item.Item_Id ? null : item.Item_Id);
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 focus:outline-none"
                                style={{ background: "transparent", boxShadow: "none" }}
                              >
                                <MoreVertical size={14} style={{ color: "#94a3b8" }} />
                              </button>

                              {itemRowMenu === item.Item_Id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border overflow-hidden"
                                  style={{ width: 160, zIndex: 999, borderColor: "#e5e7eb" }}
                                >
                                  <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                                    style={{ color: "#374151" }}
                                    onClick={() => {
                                      setItemRowMenu(null);
                                      setEditingItem(item);
                                      setShowEditItemModal(true);
                                    }}
                                  >
                                    <Eye size={13} style={{ color: "#4CA1AF" }} />
                                    View/Edit
                                  </button>

                                  <button
                                    type="button"
                                    disabled
                                    title="Delete item — coming soon"
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                                    style={{ color: "#dc2626", opacity: 0.5, cursor: "not-allowed" }}
                                  >
                                    <Trash2 size={13} style={{ color: "#dc2626" }} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td> */}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      </div>

      {showAddCategoryModal && (
        <AddItemCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onSave={handleCategoryAdded}
        />
      )}

      {/* {showEditItemModal && (
        <ItemModal
          itemDetails={editingItem}
          editingItem={true}
          onClose={() => {
            setShowEditItemModal(false);
            setEditingItem(null);
          }}
        />
      )} */}

    </>
  );
}