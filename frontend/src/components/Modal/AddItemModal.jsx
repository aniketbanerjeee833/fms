import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { X } from "lucide-react";

import { itemFormSchema } from "../../schema/itemFormSchema";
import {
    itemApi,
    useAddCategoryMutation,
    useAddItemMutation,
    useGetAllCategoriesQuery,
} from "../../redux/api/itemApi";
import { useGetAllItemUnitsQuery } from "../../redux/api/itemApi";
import SelectUnitModal from "./SelectUnitModal";
import { purchaseApi } from "../../redux/api/purchaseApi";
import { saleApi } from "../../redux/api/saleApi";

export default function AddItemModal({ onClose, onSave, defaultItemType = "Product" }) {
    const dispatch = useDispatch();
    const dropdownRef = useRef(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(itemFormSchema),
        defaultValues: {
            Item_Type: defaultItemType,   // ← pre-selects the toggle
        },
    });

    const { data: itemUnitsFetched } = useGetAllItemUnitsQuery();
    const itemUnits = itemUnitsFetched;

    const { data: categories } = useGetAllCategoriesQuery();

    const [addItem, { isLoading: isAddingItem }] = useAddItemMutation();
    const [addCategory] = useAddCategoryMutation();

    const [activeTab, setActiveTab] = useState("Items");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [showSelectUnitModal, setShowSelectUnitModal] = useState(false);

    const primaryUnit = watch("Primary_Unit");
    const secondaryUnit = watch("Secondary_Unit");
    const conversionRate = watch("Conversion_Rate");

    const itemType = watch("Item_Type") || "Product";
    {/* label text swaps based on Item_Type — table/schema stays Item_Name, Item_HSN etc. unchanged */ }
    const fieldLabel = (base) => (itemType === "Service" ? `Service ${base}` : `Item ${base}`);
    //const TABS = itemType === "Service" ? ["Items"] : ["Items", "Stock"];

    // keep activeTab valid if it becomes "Stock" while itemType flips to Service
    useEffect(() => {
        if (itemType === "Service" && activeTab === "Stock") {
            setActiveTab("Items");
        }
    }, [itemType, activeTab]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (cat) => {
        setSelected(cat);
        setValue("Item_Category", cat, { shouldValidate: true });
        setOpen(false);
    };

    const handleAddCategory = async () => {
        if (newCategory.trim() === "") return;

        try {
            const res = await addCategory({
                body: { Item_Category: newCategory.trim() },
            });

            const data = res?.data || res;

            if (data?.success) {
                const addedCat = newCategory.trim();

                setSelected(addedCat);
                setValue("Item_Category", addedCat, { shouldValidate: true });
                setSearch(addedCat);

                dispatch(itemApi.util.invalidateTags(["Category"]));

                setShowCategoryModal(false);
                setNewCategory("");
                setOpen(false);
            } else {
                toast.error(data?.message || "Failed to add category");
            }
        } catch (err) {
            console.error("❌ Error adding category:", err);
            toast.error("Something went wrong");
        }
    };

    const onSubmit = async (data) => {
        try {
            const res = await addItem({ body: data }).unwrap();

            toast.success(res?.message || "New Item added successfully!");

            if (onSave) {
                onSave(res?.item || null);
            }

            if (onClose) {
                onClose();
            }
            dispatch(itemApi.util.invalidateTags(["Item", "ItemLedger"]));
            dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
            dispatch(saleApi.util.invalidateTags(["Sale"]));
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error(error?.data?.message || "Failed to add new item");
        }
    };
    const formValues = watch()
    console.log(formValues)

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex  items-center justify-center"
                style={{
                    backgroundColor: "rgba(39, 19, 19, 0.3)",
                    backdropFilter: "blur(4px)",
                    padding: "1rem",
                    marginTop: "50px",

                }}
                onClick={onClose}
            >
                <div
                    className="bg-white w-full max-w-4xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6" style={{ paddingBottom: "10px" }}>
                        <div className="flex flex-col">
                            <h4 className="text-xl font-semibold text-gray-900">Add New Item</h4>
                            <p className="text-gray-500 text-sm">Add new item details</p>
                        </div>
                        <button
                            type="button"
                            style={{ backgroundColor: "transparent" }}
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Tabs */}

                    {/* <div className="flex gap-6 w-full mb-3">
                        <div className="flex space-x-8">
                            {["Items", "Stock"].map((tab) => (
                                <button
                                    type="button"
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        outline: "none",
                                        padding: "0.5rem 1rem",
                                        borderBottom: activeTab === tab ? "1px solid red" : "none",
                                        color: activeTab === tab ? "red" : "gray",
                                        fontWeight: activeTab === tab ? "600" : "500",
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div> */}
                    {/* ── Product / Service toggle ── */}
                    <style>{`
  .item-toggle {
    position: relative;
    width: 44px; height: 24px;
    background: #d1d5db;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .item-toggle.on { background: #4CA1AF; }
  .item-toggle::after {
    content: "";
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.15);
  }
  .item-toggle.on::after { transform: translateX(20px); }
`}</style>

                    <div className="flex items-center gap-3 mb-4">
                        {/* <span className="text-sm font-medium text-gray-700">Item Type</span> */}
                        <span className={`text-sm ${itemType === "Product" ? "font-medium text-gray-700" : "font-medium text-gray-700"}`}>
                            Product
                        </span>
                        <div
                            className={`item-toggle ${itemType === "Service" ? "on" : ""}`}
                            onClick={() => {
                                const next = itemType === "Product" ? "Service" : "Product";
                                setValue("Item_Type", next, { shouldValidate: true, shouldDirty: true });
                                if (next === "Service" && activeTab === "Stock") {
                                    setActiveTab("Items");
                                }
                            }}
                        />
                        <span className={`text-sm ${itemType === "Service" ? "font-medium text-gray-700" : "font-medium text-gray-700"}`}>
                            Service
                        </span>
                    </div>

                    <input type="hidden" {...register("Item_Type")} />

                    {/* Tabs — Stock hidden entirely when Service */}
                    <div className="flex gap-6 w-full mb-3">
                        <div className="flex space-x-8">
                            {(itemType === "Service" ? ["Items"] : ["Items", "Stock"]).map((tab) => (
                                <button
                                    type="button"
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        outline: "none",
                                        padding: "0.5rem 1rem",
                                        borderBottom: activeTab === tab ? "2px solid #4CA1AF" : "2px solid transparent",
                                        color: activeTab === tab ? "#4CA1AF" : "gray",
                                        fontWeight: activeTab === tab ? "600" : "500",
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {activeTab === "Items" && (
                            <div>
                                <div className="flex gap-4">
                                    {/* Category dropdown */}
                                    <div style={{ width: "50%" }} className="relative mt-3" ref={dropdownRef}>
                                        <span className="active">Category</span>

                                        <input
                                            type="text"
                                            value={search}
                                            onClick={() => setOpen((prev) => !prev)}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search category"
                                            className="w-full outline-none border-b-2 text-gray-900"
                                        />

                                        {open && (
                                            <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                <span
                                                    onClick={() => {
                                                        setShowCategoryModal(true);
                                                        setOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                                                >
                                                    + Add Category
                                                </span>

                                                {categories
                                                    ?.filter((cat) =>
                                                        cat.Item_Category.toLowerCase().includes(search.toLowerCase())
                                                    )
                                                    .map((cat, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                handleSelect(cat.Item_Category);
                                                                setSearch(cat.Item_Category);
                                                            }}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                        >
                                                            {cat.Item_Category}
                                                        </div>
                                                    ))}

                                                {categories?.filter((cat) =>
                                                    cat.Item_Category.toLowerCase().includes(search.toLowerCase())
                                                ).length === 0 && (
                                                        <p className="px-3 py-2 text-gray-500">No categories found</p>
                                                    )}
                                            </div>
                                        )}

                                        <input type="hidden" {...register("Item_Category")} value={selected || ""} />

                                        {showCategoryModal && (
                                            <div
                                                style={{
                                                    position: "fixed",
                                                    inset: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "rgba(0,0,0,0.4)",
                                                    backdropFilter: "blur(4px)",
                                                    zIndex: 60,
                                                }}
                                                onClick={() => setShowCategoryModal(false)}
                                            >
                                                <div
                                                    className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        style={{ backgroundColor: "transparent" }}
                                                        onClick={() => setShowCategoryModal(false)}
                                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        ✕
                                                    </button>

                                                    <h4 className="text-lg font-semibold mb-4">Add New Category</h4>
                                                    <input
                                                        type="text"
                                                        value={newCategory}
                                                        onChange={(e) => setNewCategory(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4CA1AF]"
                                                        placeholder="Enter category name"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            style={{ backgroundColor: "lightgray" }}
                                                            onClick={() => setShowCategoryModal(false)}
                                                            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAddCategory}
                                                            style={{ backgroundColor: "#4CA1AF" }}
                                                            className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#5c52d4]"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Name */}
                                    <div className="input-field col s6" style={{ width: "50%" }}>
                                        <span className="active">
                                            {fieldLabel("Name")}
                                            <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                        </span>
                                        <input
                                            type="text"
                                            id="Item_Name"
                                            {...register("Item_Name")}
                                            placeholder=" Item Name"
                                            className="w-full outline-none border-b-2 text-gray-900"
                                        />
                                        {errors?.Item_Name && (
                                            <p className="text-red-500 text-xs mt-1">{errors?.Item_Name?.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    {/* HSN */}
                                    <div className="input-field col s6" style={{ width: "50%" }}>
                                        {/* //<span className="active">Item HSN Code</span> */}
                                        <span className="active">{fieldLabel("HSN Code")}</span>
                                        <input
                                            type="text"
                                            id="Item_HSN"
                                            {...register("Item_HSN")}
                                            placeholder=" Item HSN Code"
                                            className="w-full outline-none border-b-2 text-gray-900"
                                            maxLength={8}
                                            onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                                            }}
                                        />
                                        {errors?.Item_HSN && (
                                            <p className="text-red-500 text-xs mt-1">{errors?.Item_HSN?.message}</p>
                                        )}
                                    </div>

                                    {/* Unit */}
                                    <div className="input-field col s6" style={{ width: "50%" }}>
                                        {/* <span className="active">Unit</span> */}
                                        <span className="active">{fieldLabel("Unit")}</span>

                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowSelectUnitModal(true)}
                                                className="px-4 py-2 rounded-md border"
                                                style={{ backgroundColor: "white", borderColor: "#4CA1AF", color: "#4CA1AF" }}
                                            >
                                                {primaryUnit ? "Change Unit" : "Select Unit"}
                                            </button>

                                            {primaryUnit && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    <span>
                                                        Primary: <strong>{primaryUnit}</strong>
                                                    </span>

                                                    {secondaryUnit && (
                                                        <>
                                                            <span className="ml-3">
                                                                Secondary: <strong>{secondaryUnit}</strong>
                                                            </span>
                                                            <div className="mt-1 text-[#4CA1AF]">
                                                                1 {primaryUnit} = {conversionRate} {secondaryUnit}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === "Stock" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6">
                                <div className="flex flex-col">
                                    <span className="active">Opening Quantity</span>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        className="w-full outline-none border-b-2 text-gray-900"
                                        {...register("Opening_Quantity")}
                                        onInput={(e) => {
                                            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <span className="active">At Price</span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="w-full outline-none border-b-2 text-gray-900"
                                        {...register("At_Price")}
                                        onInput={(e) => {
                                            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <span className="active">As Of Date</span>
                                    <input
                                        type="date"
                                        className="w-full outline-none border-b-2 text-gray-900"
                                        defaultValue={new Date().toISOString().slice(0, 10)}
                                        {...register("As_Of_Date")}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <span className="active">Min Stock To Maintain</span>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        className="w-full outline-none border-b-2 text-gray-900"
                                        {...register("Min_Stock")}
                                        onInput={(e) => {
                                            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <span className="active">Location</span>
                                    <input
                                        type="text"
                                        className="w-full outline-none border-b-2 text-gray-900"
                                        {...register("Location")}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white font-bold py-2 px-4 rounded"
                                style={{ backgroundColor: "#94a3b8" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isAddingItem}
                                className="text-white font-bold py-2 px-4 rounded"
                                style={{ backgroundColor: "#4CA1AF" }}
                            >
                                {isAddingItem ? "Adding..." : "Add Item"}
                            </button>
                        </div>
                    </form>
                </div>


            </div>
            {showSelectUnitModal && (
                <SelectUnitModal
                    units={itemUnits || []}
                    primaryUnit={primaryUnit}
                    secondaryUnit={secondaryUnit}
                    conversionRate={conversionRate}
                    initialBase={primaryUnit || ""}
                    initialSecondary={secondaryUnit || ""}
                    initialConversionRate={conversionRate || ""}
                    onClose={() => setShowSelectUnitModal(false)}
                    onSave={(newUnit) => {
                        setValue("Primary_Unit", newUnit.baseUnit || null, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });
                        setValue("Secondary_Unit", newUnit.secondaryUnit || null, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });
                        setValue(
                            "Conversion_Rate",
                            newUnit.secondaryUnit ? Number(newUnit.conversionRate) : null,
                            { shouldValidate: true, shouldDirty: true }
                        );
                        setShowSelectUnitModal(false);
                    }}
                />
            )}
        </>
    );
}

