import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi, useAddCategoryMutation, useGetAllCategoriesQuery, useGetItemsForDropdownQuery, useLazyGetItemByNameQuery } from "../../redux/api/itemApi";



import { toast } from "react-toastify";





import PartyAddModal from "../../components/Modal/PartyAddModal";

import { useGetAllItemUnitsQuery } from "../../redux/api/itemApi";
import AddUnitModal from "../../components/Modal/AddUnitModal";

import { saleReturnApi, useUpdateSaleReturnMutation, useGetSaleReturnByIdQuery } from "../../redux/api/saleReturnApi";
import { saleReturnFormSchema } from "../../schema/saleReturnFormSchema";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";


import { ScanLine, Trash2 } from "lucide-react";
import AddItemModal from "../../components/Modal/AddItemModal";
import PaymentTypeSelect from "../../components/PaymentTypeSelect";
import BankAccountModal from "../../components/Modal/BankAccountModal";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback } from "react";
import ScanCodeModal from "../../components/Modal/ScanCodeModal";
import { useGetAllSettingsQuery } from "../../redux/api/Settings/settingsApi";
import { useGetAllTaxesAndGSTSettingsQuery } from "../../redux/api/Settings/taxesAndGSTSettingsApi";
function ItemDropdownVirtualized({

  items,
  isDropdownFetching,
  loadMoreItems,
  scrollRef,
  onAddItemClick,
  onSelectItem,

}) {
  const ROW_HEIGHT = 44; // px — adjust to match your actual row's rendered height

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12, // renders a few extra rows above/below viewport so fast scrolling never shows blank gaps
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // 🔹 fetch-more trigger — fires when the virtualizer's last rendered
  //    item gets within ~15 rows of the end of currently-loaded data.
  //    Runs through the virtualizer's own render cycle, not raw scroll
  //    events, so it's naturally throttled (no manual RAF guard needed).
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length - 15 && !isDropdownFetching) {
      loadMoreItems();
    }
  }, [virtualItems, items.length, isDropdownFetching, loadMoreItems]);

  return (
    <div
      style={{ width: "45rem" }}
      className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg"
    >
      {/* Add Item — stays a normal sticky element, outside the virtual scroll area */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onAddItemClick();
        }}
        className="flex items-center gap-1.5 px-3 py-2 cursor-pointer"
        style={{
          borderBottom: "1px solid #e5e7eb",
          color: "#4CA1AF",
          fontWeight: 600,
          fontSize: 13,
          backgroundColor: "#fff",
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>⊕</span>
        Add Item
      </div>

      {/* Column header row — static, matches the old <thead> */}
      <div
        className="grid text-xs font-semibold bg-gray-100 border-b"
        style={{ gridTemplateColumns: "10% 40% 20% 20% 10%", }}
      >
        <div className="px-3 py-2">SL.NO</div>
        <div className="px-3 py-2">ITEM NAME</div>
        <div className="px-3 py-2">SALE PRICE</div>
        <div className="px-3 py-2">PURCHASE PRICE</div>
        <div className="px-3 py-2">STOCK</div>
      </div>


      {/* 🔹 Scroll viewport — fixed height, this is what the virtualizer measures against */}
      <div
        ref={(el) => (scrollRef.current = el)}
        className="item-dropdown-scroll"
        style={{
          height: Math.min(
            items.length * ROW_HEIGHT,
            240
          ),
          //height: 240, // ≈ your old max-h-60 (60 * 4px = 240px)
          overflowY: "auto",
          position: "relative",
        }}
      >
        {items.length === 0 && !isDropdownFetching ? (
          <div className="px-3 py-2 text-gray-400 text-center">No Item found</div>
        ) : (
          // 🔹 THE key virtualization trick: a spacer div sized to the FULL
          //    (unrendered) list height, so the scrollbar behaves correctly —
          //    then only the visible rows are absolutely positioned inside it.
          <div style={{ height: rowVirtualizer.getTotalSize(), width: "100%", position: "relative" }}>
            {virtualItems.map((virtualRow) => {
              const it = items[virtualRow.index];
              if (!it) return null;

              return (
                <div
                  key={virtualRow.key}
                  onClick={() => {


                    onSelectItem(it, virtualRow.index);
                  }}
                  //onClick={() => onSelectItem(it, virtualRow.index)}
                  className="grid hover:bg-gray-100 cursor-pointer  text-sm"
                  style={{
                    gridTemplateColumns: "10% 40% 20% 20% 10%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    alignItems: "center",
                  }}
                >
                  <div className="px-3">{virtualRow.index + 1}</div>

                  <div className="px-3 truncate">
                    {it.Item_Name}{" "}
                    {it.Item_Code && (
                      <span style={{ color: "#9ca3af", fontWeight: 400 }}>({it.Item_Code})</span>
                    )}
                  </div>

                  <div className="px-3 text-gray-600">{it.Sale_Price || 0}</div>

                  <div className="px-3 text-gray-600">
                    {it.Item_Type === "Service" ? "" : it.Purchase_Price ?? 0}
                  </div>

                  <div
                    className="px-3"
                    style={{
                      color: it.Stock_Quantity <= 0 ? "red" : "limegreen",
                      fontWeight: 500,
                    }}
                  >
                    {it.Item_Type === "Service" ? "" : `${it.Stock_Quantity ?? 0} ${it.Primary_Unit || ""}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isDropdownFetching && (
          <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>
        )}
      </div>
    </div >
  );
}
export default function SaleReturndEdit() {

  const location = useLocation();
  const from = location.state?.from
  const Party_Id = location.state?.partyId;
  const Item_Id = location.state?.itemId
  const bankId = location.state?.bankId;
  // console.log("Sale return Edit page query:", location.search);
  ///const partyId = location.state?.partyId;
  const { id: Sale_Return_Id } = useParams();
  const dispatch = useDispatch();
  const TAX_RATES = {
    "GST0": 0,
    "GST0.25": 0.25,
    "GST3": 3,
    "GST5": 5,
    "GST12": 12,
    "GST18": 18,
    "GST28": 28,
    "GST40": 40,

    "IGST0": 0,
    "IGST0.25": 0.25,
    "IGST3": 3,
    "IGST5": 5,
    "IGST12": 12,
    "IGST18": 18,
    "IGST28": 28,
    "IGST40": 40,
  };
  const states = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
  ];
  const categoryRefs = useRef([]); // store refs for category dropdowns
  const itemRefs = useRef([]);
  const unitRefs = useRef([]);
  const baseSalePriceRef = useRef({});
  const baseSaleUnitRef = useRef({});
  const masterMrpDiscountRef = useRef({});
  const [rows, setRows] = useState([
    {
      itemSearch: "", itemOpen: false, isExistingItem: false, isHSNLocked: false,
      isUnitLocked: false, CategoryOpen: false, categorySearch: "", itemQuantity: 0, itemTaxType: "",
      unitOpen: false, unitSearch: ""
    },
  ]);

  const navigate = useNavigate();
  const { data: sale }
    = useGetSaleReturnByIdQuery(Sale_Return_Id, {
      skip: Sale_Return_Id === undefined,
    });
  const { data: parties } = useGetAllPartiesQuery();
  const [activeItemRow, setActiveItemRow] = useState(null);

  const [itemCursor, setItemCursor] = useState(null);

  const activeSearch =
    activeItemRow !== null
      ? rows[activeItemRow]?.itemSearch || ""
      : "";
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(activeSearch), 300);
    return () => clearTimeout(timer);
  }, [activeSearch]);
  const {
    data: items,
    isFetching: isDropdownFetching,
    refetch: refetchItems

  } =
    useGetItemsForDropdownQuery(
      {
        cursor: itemCursor,
        search: debouncedSearch,
        limit: 20,
      },
      {
        skip: activeItemRow === null,
      }
    );

  const dropdownScrollRefs = useRef({});

  // helper to get/create the ref for row i
  const getDropdownScrollRef = (i) => {
    if (!dropdownScrollRefs.current[i]) {
      dropdownScrollRefs.current[i] = { current: null };
    }
    return dropdownScrollRefs.current[i];
  };



  useEffect(() => {
    setItemCursor(null);
  }, [activeItemRow, activeSearch]);

  const loadMoreItems = useCallback(() => {
    if (
      !isDropdownFetching &&
      items?.hasMore &&
      items?.nextCursor
    ) {
      setItemCursor(items.nextCursor);
    }
  }, [
    isDropdownFetching,
    items?.hasMore,
    items?.nextCursor,
  ]);



  const [getItemByName] = useLazyGetItemByNameQuery();
  const { data: banks = [], refetch: refetchBanks } = useGetAllBankAccountsQuery();
  const [showItemAddModal, setShowItemAddModal] = useState(false);
  // const [newlyAddedItem, setNewlyAddedItem] = useState(null);

  // find this line in your code and add refetch:
  //const { data: items, refetch: refetchItems } = useGetAllItemsQuery();
  const [addCategory] = useAddCategoryMutation();
  const { data: categories } = useGetAllCategoriesQuery()
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showSplitBox, setShowSplitBox] = useState(false);
  //const [originalTotal, setOriginalTotal] = useState(null);

  const [showGSTIN, setShowGSTIN] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);;
  //console.log(latestInvoiceNumber,"latestInvoiceNumber");



  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [activeUnitRow, setActiveUnitRow] = useState(null);
  // const [newUnitKey, setNewUnitKey] = useState("");
  // const [newUnitName, setNewUnitName] = useState("");
  const [isRoundOff, setIsRoundOff] = useState(false)
  const [showScanCodeModal, setShowScanCodeModal] = useState(false);
  const { data: itemUnits = [] } = useGetAllItemUnitsQuery();
  console.log(itemUnits, "itemUnits");

  const { data: settingsData } = useGetAllSettingsQuery();
  const settings = settingsData?.settings || [];

  const showMRP =
    Number(
      settings.find(
        (s) => s.setting_key === "show_mrp"
      )?.setting_value
    ) === 1;

  const calculateSalePriceFromMRP =
    Number(
      settings.find(
        (s) =>
          s.setting_key ===
          "calculate_sale_price_from_mrp_disc"
      )?.setting_value
    ) === 1;

  const barcodeScanEnabled =
    Number(
      settings.find(
        (s) => s.setting_key === "barcode_scan"
      )?.setting_value
    ) === 1;

  const {
    data: taxesGSTSettingsData,
  } = useGetAllTaxesAndGSTSettingsQuery();

  const taxesGSTSettings = taxesGSTSettingsData?.settings || [];

  const enableGST =
    Number(
      taxesGSTSettings.find(
        (s) =>
          s.setting_key === "enable_gst"
      )?.setting_value
    ) === 1;

  // const enableHSNSAC =
  //   Number(
  //     taxesGSTSettings.find(
  //       (s) =>
  //         s.setting_key === "enable_hsn_sac"
  //     )?.setting_value
  //   ) === 1;

  const enablePlaceOfSupply =
    Number(
      taxesGSTSettings.find(
        (s) =>
          s.setting_key ===
          "enable_place_of_supply"
      )?.setting_value
    ) === 1;


  const hasHistoricalMRP =
    sale?.items?.some(
      (item) => item.hasHistoricalMRP === true
    );

  const shouldShowMRP = showMRP || hasHistoricalMRP;
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(saleReturnFormSchema),
    defaultValues: {
      Return_Date: new Date().toISOString().slice(0, 10),  // ✅ FIX — today as default
      Return_Number: "",
      Party_Name: "",
      GSTIN: "",
      Invoice_Number: "",
      Invoice_Date: "",
      State_Of_Supply: "",
      Total_Amount: "",
      Balance_Due: "",
      Total_Paid: "",
      Payment_Type: "Cash",
      Bank_Account_Id: null,   // 🔹 added
      Reference_Number: "",
      splits: [{ Payment_Type: "Cash", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],
      items: [{


        Item_Category: "",
        Item_Name: "",
        Quantity: "",
        Item_Unit: "",
        MRP: "",
        Discount_On_MRP_For_Sale_Percentage: "",
        Sale_Price: "",

        Discount_On_Sale_Price: "",
        Discount_Type_On_Sale_Price: "Percentage",
        Tax_Type: "None",
        Tax_Amount: "",
        Amount: "",
      }
      ]
    }

  })
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const {
    fields: splitFields,
    append: appendSplit,
    remove: removeSplit,
  } = useFieldArray({
    control,
    name: "splits",
  });

  const handleAddCategory = async () => {

    if (newCategory.trim() === "") {
      return
    }
    else if (newCategory.trim() !== "") {
      try {
        // ✅ Call backend
        const res = await addCategory({
          body: { Item_Category: newCategory.trim() },
        });

        // Some RTK Query wrappers put the response under `.data`
        const data = res?.data || res;

        if (data?.success) {
          const addedCat = newCategory.trim();

          // ✅ Auto-select the new category (single value)
          //setSelected(addedCat);
          setValue("Item_Category", addedCat); // directly set single category

          // ✅ Refresh cache
          dispatch(itemApi.util.invalidateTags(["Category"]));

          // ✅ Reset modal & input
          setShowModal(false);
          setNewCategory("");
          setOpen(true);
        } else {
          console.warn("⚠️ Category not added. Response:", data);
        }
      } catch (err) {
        console.error("❌ Error adding category:", err);
      }
    }
  };


  const [updateSaleReturn, { isLoading: isCreating }] = useUpdateSaleReturnMutation();
  // helper to update a field in a specific row
  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      setRows((prev) =>
        prev.map((row, idx) => {
          const catRef = categoryRefs.current[idx];
          const itemRef = itemRefs.current[idx];
          const unitRef = unitRefs.current[idx];

          const clickedInsideCategory =
            catRef && catRef.contains(event.target);
          const clickedInsideItem =
            itemRef && itemRef.contains(event.target);
          const clickedInsideUnit =
            unitRef && unitRef.contains(event.target);

          // if clicked outside both → close
          if (
            !clickedInsideCategory &&
            !clickedInsideItem &&
            !clickedInsideUnit
          ) {
            return {
              ...row,
              CategoryOpen: false,
              itemOpen: false,
              unitOpen: false,
            };
          }

          return row;
        })
      );
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);










  const itemsValues = watch("items");   // watch all item rows
  const totalPaid = watch("Total_Paid"); // watch Total_Paid
  const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));

  // helper to calculate amount in a specific row
  const calculateRowAmount = (row, index, itemsValues) => {
    console.log(row, "row", index, "index", itemsValues, "itemsValues");
    const price = num(row.Sale_Price);
    const qty = row.Quantity || 0; // default 0
    const subtotal = price * qty;

    // discount
    let disc = num(row.Discount_On_Sale_Price);
    if ((row.Discount_Type_On_Sale_Price || "Percentage") === "Percentage") {
      disc = (subtotal * disc) / 100;
    }
    const afterDiscount = Math.max(0, subtotal - disc);

    // tax
    const taxPercent = TAX_RATES[row.Tax_Type] ?? 0;
    const taxAmount = (afterDiscount * taxPercent) / 100;

    const finalAmount = afterDiscount + taxAmount;

    // ✅ Recalculate total with current row updated
    let totalAmount = 0;
    itemsValues?.forEach((r, i) => {
      if (i === index) {
        // use updated values for current row
        totalAmount += parseFloat(finalAmount || 0);
      } else {
        totalAmount += parseFloat(r.Amount || 0);
      }
    });

    return {
      ...row,
      Quantity: Number(qty),
      Tax_Amount: taxAmount.toFixed(2),
      Amount: finalAmount.toFixed(2),
      Total_Amount: totalAmount.toFixed(2), // ✅ correct grand total
      Balance_Due: (totalAmount - num(totalPaid)).toFixed(2),
    };
  };
  const getRawTotal = () => {
    return (itemsValues || []).reduce((sum, it) => sum + (Number(it.Amount) || 0), 0);
  };

  const applyRoundOff = (roundOffValue) => {
    const rawTotal = getRawTotal();
    const totalPaid = Number(watch("Total_Paid")) || 0;
    const newTotal = rawTotal + roundOffValue;

    setValue("Total_Amount", newTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
    setValue("Balance_Due", (newTotal - totalPaid).toFixed(2), { shouldValidate: true, shouldDirty: true });
  };
  const syncTotalsAfterItemChange = () => {
    if (isRoundOff) {
      const currentRoundOff = parseFloat(watch("Round_Off")) || 0;
      applyRoundOff(currentRoundOff);
    } else {
      const rawTotal = getRawTotal();
      setValue("Total_Amount", rawTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
      setValue("Balance_Due", (rawTotal - Number(watch("Total_Paid") || 0)).toFixed(2), { shouldValidate: true, shouldDirty: true });
    }
  };
  const handleAddRow = () => {
    setRows((prev) => [
      // only close CategoryOpen, preserve lock states
      ...prev.map((row) => ({
        ...row,
        CategoryOpen: false,
        itemOpen: false, // also close item dropdown if open
        unitOpen: false
      })),
      {
        itemSearch: "",
        itemOpen: false,
        CategoryOpen: false,
        isHSNLocked: false,
        isUnitLocked: false,
        isExistingItem: false,
        categorySearch: "",
        unitOpen: false,
        unitSearch: "",
      },
    ]);

    append({
      Item_Category: "",
      Item_Name: "",
      Item_HSN: "",
      Quantity: "",
      Item_Unit: "",
      MRP: "",
      Discount_On_MRP_For_Sale_Percentage: "",
      Sale_Price: "",
      Discount_On_Sale_Price: "",
      Discount_Type_On_Sale_Price: "Percentage",
      Tax_Type: "None",
      Tax_Amount: "",
      Amount: "",
    });
  };



  const handleDeleteRow = (i) => {
    // 1. get current items BEFORE removal
    const currentItems = watch("items");

    // 2. calculate new raw total excluding the deleted row
    const newRawTotal = currentItems.reduce((sum, row, idx) => {
      if (idx === i) return sum;
      return sum + parseFloat(row.Amount || 0);
    }, 0);

    const currentTotalPaid = parseFloat(watch("Total_Paid") || 0);

    // 3. remove from UI state and form
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    remove(i);

    // 4. update totals — respecting Round Off if active
    if (isRoundOff) {
      const currentRoundOff = parseFloat(watch("Round_Off")) || 0;
      const newTotal = newRawTotal + currentRoundOff;
      setValue("Total_Amount", newTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
      setValue("Balance_Due", (newTotal - currentTotalPaid).toFixed(2), { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("Total_Amount", newRawTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
      setValue("Balance_Due", (newRawTotal - currentTotalPaid).toFixed(2), { shouldValidate: true, shouldDirty: true });
    }

    // 5. if "Total Paid" checkbox is active, keep it in sync with the new total too
    // if (isTotalPaid) {
    //   const finalTotal = isRoundOff ? newRawTotal + (parseFloat(watch("Round_Off")) || 0) : newRawTotal;
    //   setValue("Total_Paid", finalTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
    //   setValue("Balance_Due", "0.00", { shouldValidate: true, shouldDirty: true });
    //   if ((watch("splits") || []).length === 1) {
    //     setValue("splits.0.Amount", finalTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });
    //   }
    // }
  };
  const formValues = watch();





  // const handleSelect = (rowIndex, categoryName) => {
  //   setRows((prev) => {
  //     const updated = [...prev];
  //     updated[rowIndex] = {
  //       ...updated[rowIndex],
  //       Item_Category: categoryName,
  //       CategoryOpen: false,
  //       isExistingItem: false,   // user-typed, so still editable
  //     };
  //     return updated;
  //   });

  //   setValue(`items.${rowIndex}.Item_Category`, categoryName, { shouldValidate: true });
  // };

  useEffect(() => {
    const gstin = parties?.parties?.find(
      (party) => party.Party_Name === watch("Party_Name")
    )?.GSTIN;

    setShowGSTIN(gstin || ""); // ✅ never undefined
  }, [watch("Party_Name"), parties]);

  const toLocalDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // ✅ in yyyy-mm-dd for input[type="date"]
  };
  const emptyRow = () => ({
    Item_Category: "",
    Item_Name: "",
    itemSearch: "",
    Item_HSN: "",
    MRP: "",
    Discount_On_MRP_For_Sale_Percentage: "",
    Quantity: "",
    Sale_Price: "",
    Discount_On_Sale_Price: "",
    Discount_Type_On_Sale_Price: "Percentage",
    Tax_Type: "None",
    Tax_Amount: "",
    Amount: "",
    itemOpen: false,
    CategoryOpen: false,
    unitOpen: false,
    unitSearch: "",
    isHSNLocked: false,
    isUnitLocked: false,
    isExistingItem: false,
  });
  const originalTaxTypesRef = useRef([]);
  useEffect(() => {
    if (sale) {
      originalTaxTypesRef.current = (sale?.saleReturn?.items || []).map(
        (item) => item?.Tax_Type || "None"
      );
      setPartySearch(sale.saleReturn.Party_Name);



      const prefilledRows = sale?.saleReturn?.items?.length > 0
        ? sale.saleReturn.items.map((item, index) => {

          // Original purchase price saved in this purchase line
          const salePrice = Number(item.Sale_Price) || 0;
          const historicalMRPDiscount =
            Number(item.Discount_On_MRP_For_Sale_Percentage) > 0
              ? Number(item.Discount_On_MRP_For_Sale_Percentage)
              : 0;

          const currentMasterMRPDiscount =
            Number(item.Current_MRP_Discount) > 0
              ? Number(item.Current_MRP_Discount)
              : 0;

          masterMrpDiscountRef.current[index] =
            historicalMRPDiscount > 0
              ? historicalMRPDiscount
              : currentMasterMRPDiscount;
          // If this purchase was saved in secondary unit,
          // convert its price back to PRIMARY price.
          // const primaryUnit = item.Primary_Unit || "";
          // const secondaryUnit = item.Secondary_Unit || "";
          //       const primaryUnit =
          //   item.Primary_Unit ||
          //   availableUnits[0]?.Unit_Shorthand ||
          //   "";

          // const secondaryUnit =
          //   item.Secondary_Unit ||
          //   availableUnits.find(
          //     (u) => u.Unit_Shorthand !== primaryUnit
          //   )?.Unit_Shorthand ||
          //   "";
          //       const conversionRate = Number(item.Conversion_Rate) || 0;
          //       const selectedUnit = item.Selected_Unit || primaryUnit;
          const conversionRate = Number(item.Conversion_Rate) || 0;

          const availableUnits = Array.isArray(item.Available_Units)
            ? item.Available_Units
            : [];

          // Historical snapshot may have Secondary_Unit = null.
          // In that case use CURRENT available units.
          const primaryUnit =
            item.Primary_Unit ||
            availableUnits[0]?.Unit_Shorthand ||
            "";

          const secondaryUnit =
            item.Secondary_Unit ||
            availableUnits.find(
              (u) => u.Unit_Shorthand !== primaryUnit
            )?.Unit_Shorthand ||
            "";

          const selectedUnit = item.Selected_Unit || primaryUnit;

          let baseSalePrice = salePrice;

          if (
            selectedUnit === secondaryUnit &&
            conversionRate > 0
          ) {
            baseSalePrice = salePrice * conversionRate;
          }

          // Store original/base price separately
          baseSalePriceRef.current[index] = baseSalePrice;
          baseSaleUnitRef.current[index] = primaryUnit;
          return {
            ...item,

            Item_Unit: selectedUnit,

            itemSearch: item.Item_Name,
            itemOpen: false,
            CategoryOpen: false,
            unitOpen: false,
            unitSearch: "",

            isHSNLocked: false,
            isUnitLocked: false,
            isExistingItem: true,

            Primary_Unit: primaryUnit,
            Secondary_Unit: secondaryUnit,
            Conversion_Rate: conversionRate,

            Available_Units: availableUnits,
          };
        })
        : [emptyRow()];
      const formItems = prefilledRows.map((item) => ({
        Item_Id: item.Item_Id,
        Item_Name: item.Item_Name || "",
        Item_Category: item.Item_Category || "",
        Item_HSN: item.Item_HSN || "",
        MRP: item.MRP || "",
        Discount_On_MRP_For_Sale_Percentage: item.Discount_On_MRP_For_Sale_Percentage || "",
        Quantity: item.Quantity || "",
        Item_Unit: item.Item_Unit || "",
        Sale_Price: item.Sale_Price || "",

        Discount_On_Sale_Price:
          item.Discount_On_Sale_Price || "",

        Discount_Type_On_Sale_Price:
          item.Discount_Type_On_Sale_Price || "Percentage",

        Tax_Type: item.Tax_Type || "None",
        Tax_Amount: item.Tax_Amount || "",
        Amount: item.Amount || "",
      }));
      setRows(prefilledRows)
      const roundOffFromDb = Number(sale.saleReturn?.Round_Off) || 0;

      //  checkbox reflects whether a real round-off was applied
      setIsRoundOff(roundOffFromDb !== 0);

      reset({
        Return_Date: toLocalDateString(sale.saleReturn?.Return_Date) || new Date().toISOString().slice(0, 10),   // ✅ FIX 1 — today by default
        Return_Number: sale.saleReturn?.Return_Number || "",
        Party_Name: sale.saleReturn?.Party_Name || "",
        GSTIN: sale.saleReturn?.GSTIN || "",
        Invoice_Number: sale.saleReturn?.Invoice_Number || "",

        Invoice_Date: toLocalDateString(sale.saleReturn?.Invoice_Date),
        //  Invoice_Date: sale.saleReturn?.Invoice_Date,
        State_Of_Supply: sale.saleReturn?.State_Of_Supply || "",
        Total_Amount: sale.saleReturn?.Total_Amount || "",
        Round_Off: roundOffFromDb !== 0 ? roundOffFromDb.toFixed(2) : "",
        Total_Paid: sale.saleReturn?.Total_Paid || "",
        Balance_Due: sale.saleReturn?.Balance_Due || "",
        //Balance_Due: sale.saleReturn?.Balance_Due || "",
        // Payment_Type: sale.saleReturn?.Payment_Type || "",
        // Bank_Account_Id: sale.saleReturn?.Bank_Account_Id, // ✅ Add this
        // Reference_Number: sale.saleReturn?.Reference_Number || "",
        splits:
          sale?.saleReturn?.splits?.length > 0
            ? sale?.saleReturn?.splits.map((split) => ({
              Payment_Type: split.Payment_Type,
              Bank_Account_Id: split.Bank_Account_Id,
              Reference_Number: split.Reference_Number || "",
              Amount: split.Amount, // or split.Amount if you want to prefill the original amount
            }))
            : [
              {
                Payment_Type: "Cash",
                Bank_Account_Id: null,
                Reference_Number: "",
                Amount: "",
              },
            ],

        //items: prefilledRows,
        items: formItems
      })
      setShowSplitBox((sale?.saleReturn?.splits?.length || 0) > 1);
    }
  }, [sale]);
  //const Invoice_Number=sale.saleReturn?.Invoice_Number 
  //const Invoice_Date=sale?.saleReturn?.Invoice_Date
  //console.log(sale)
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
  const paymentType = watch("splits.0.Payment_Type");
  useEffect(() => {
    if (sale) {

      // setValue("GSTIN", sale.GSTIN ? String(sale.GSTIN) : "");
      setShowGSTIN(sale.GSTIN ? String(sale.GSTIN) : "");
    }
  }, [sale]);
  const calculateTotals = (items = []) => {
    return items.reduce(
      (acc, item) => {
        const qty = Number(item.Quantity) || 0;
        const price = Number(item.Sale_Price) || 0;

        const subtotal = qty * price;

        const discountRaw =
          Number(item.Discount_On_Sale_Price) || 0;

        const discount =
          item.Discount_Type_On_Sale_Price === "Percentage"
            ? (subtotal * discountRaw) / 100
            : discountRaw * qty;

        acc.totalQty += qty;
        acc.totalDiscount += discount;
        acc.totalTax += Number(item.Tax_Amount) || 0;
        acc.totalAmount += Number(item.Amount) || 0;

        return acc;
      },
      {
        totalQty: 0,
        totalDiscount: 0,
        totalTax: 0,
        totalAmount: 0,
      }
    );
  };
  const totals = calculateTotals(itemsValues || []);

  const sanitizeAmount = (value) => {
    let val = value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    return val;
  };

  // repeatable: true  -> can be picked in more than one row (Cheque / Neft)
  // repeatable: false -> once picked in a row, disappears from every other row (Cash / a specific Bank)
  // const buildPaymentTypeOptions = (banks) => [
  //   { value: "Cash", label: "Cash", repeatable: false },
  //   { value: "Cheque", label: "Cheque", repeatable: true },
  //   { value: "Neft", label: "Neft", repeatable: true },
  //   ...(banks || []).map((bank) => ({
  //     value: `bank_${bank.Bank_Account_Id}`,
  //     label: bank.Account_Display_Name,
  //     repeatable: false,
  //   })),
  // ];

  const getRowIdentifier = (type, bankId) =>
    type === "Bank" ? `bank_${bankId ?? ""}` : type;

  //Inside the component:

  // const getUsedIdentifiers = (excludeIndex) => {
  //   const splitValues = watch("splits") || [];
  //   return splitValues
  //     .map((s, i) =>
  //       i === excludeIndex ? null : getRowIdentifier(s.Payment_Type, s.Bank_Account_Id)
  //     )
  //     .filter(Boolean);
  // };

  // const getAvailableOptions = (excludeIndex) => {
  //   const used = getUsedIdentifiers(excludeIndex);
  //   return buildPaymentTypeOptions(banks).filter(
  //     (opt) => opt.repeatable || !used.includes(opt.value)
  //   );
  // };

  const handleAddPaymentType = () => {
    appendSplit({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" });
    setShowSplitBox(true);
  };

  // live-derived total — never stored as a separate field
  const splitsWatch = watch("splits") || [];
  const computedTotalPaid = splitsWatch.reduce(
    (sum, s) => sum + (parseFloat(s.Amount) || 0),
    0
  );

  // one-directional: recompute Balance_Due whenever the total-amount or splits change.
  // (One-directional only — do NOT also sync splits from Balance_Due, that
  // two-way sync is exactly what caused the "value shown but still required"
  // bug in the Payment-Out modal.)
  const totalAmountWatch = watch("Total_Amount");
  useEffect(() => {
    const bal = (Number(totalAmountWatch) || 0) - computedTotalPaid;
    setValue("Balance_Due", bal.toFixed(2), { shouldValidate: false, shouldDirty: true });
    if (splitsWatch.length > 1) {
      setValue("Total_Paid", computedTotalPaid.toFixed(2), {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountWatch, computedTotalPaid]);


  const onSubmit = async (data) => {
    console.log("Form Data (from RHF):", data);

    // =========================================================
    // 1. ITEMS
    //
    // Do NOT filter blank rows here.
    //
    // Backend handles:
    // No Item_Name + Amount > 0 -> ERROR
    // No Item_Name + Amount 0   -> SKIP
    // Empty items               -> allowed
    // =========================================================

    const itemsWithDefaults = (data.items || []).map((item) => ({
      ...item,

      Tax_Type: item.Tax_Type || "None",

      Tax_Amount:
        item.Tax_Amount === "" ||
          item.Tax_Amount === null ||
          item.Tax_Amount === undefined
          ? 0
          : Number(item.Tax_Amount),

      Amount:
        item.Amount === "" ||
          item.Amount === null ||
          item.Amount === undefined
          ? 0
          : Number(item.Amount),
    }));

    // =========================================================
    // 2. TOTAL AMOUNT
    // =========================================================

    const totalAmount = Number(data.Total_Amount) || 0;

    // =========================================================
    // 3. PAYMENT SPLITS
    //
    // Send splits to backend.
    //
    // Backend decides:
    //
    // First valid:
    // Cash ₹0 -> KEEP
    //
    // Later:
    // HDFC ₹0 -> DROP
    // ANCO ₹25 -> KEEP
    //
    // Don't remove zero splits here because backend needs to
    // know which payment method was FIRST.
    // =========================================================

    const splits = (data.splits || []).map((split) => ({
      ...split,

      Amount:
        split.Amount === "" ||
          split.Amount === null ||
          split.Amount === undefined
          ? 0
          : Number(split.Amount),

      Bank_Account_Id:
        split.Payment_Type === "Bank"
          ? split.Bank_Account_Id || null
          : null,

      Reference_Number:
        split.Reference_Number || "",
    }));

    // =========================================================
    // 4. PAYLOAD
    //
    // Backend recalculates:
    // Total_Paid
    // Balance_Due
    //
    // from validSplits.
    // =========================================================

    const payload = {
      ...data,

      items: itemsWithDefaults,
      splits,

      Total_Amount: totalAmount,
    };

    console.log(
      "Final Edit Sale Return Payload:",
      payload
    );

    // =========================================================
    // 5. UPDATE
    // =========================================================

    try {
      const res = await updateSaleReturn({
        Sale_Return_Id,
        ...payload,
      }).unwrap();

      console.log(
        "Sale Return Updated:",
        res
      );

      if (!res?.success) {
        toast.error(
          "Failed to update credit note"
        );
        return;
      }

      // =======================================================
      // 6. INVALIDATE CACHE
      // =======================================================

      dispatch(
        saleReturnApi.util.invalidateTags([
          "SaleReturn",
        ])
      );


      dispatch(
        itemApi.util.invalidateTags([
          { type: "Item", id: "LIST" },
          { type: "ItemsByCategory", id: "LIST" },
          { type: "ItemLedger", id: "LIST" },
        ])
      );;

      dispatch(
        cashInHandApi.util.invalidateTags([
          "CashInHand",
        ])
      );

      // Bank IDs are inside splits now.
      // No payload.Bank_Account_Id required.
      dispatch(
        bankAccountApi.util.invalidateTags([
          "BankAccount",
        ])
      );

      dispatch(
        partyApi.util.invalidateTags(["Party", "PartyLedger"])
      );

      // =======================================================
      // 7. SUCCESS
      // =======================================================

      toast.success(
        "Credit note updated successfully!"
      );

      // =======================================================
      // 8. NAVIGATION
      // =======================================================
      // if (from === "items-by-item") {
      //   navigate({
      //     pathname: "/items/all-items",
      //     search: `?itemId=${Item_Id}`,
      //   });
      // }
      if (from === "party-receivables") {
        navigate({
          pathname: "/party/receivables",
          search: location.search,
        });
      }
      else if (from === "party-payables") {
        navigate({
          pathname: "/party/payables",
          search: location.search,
        });
      }
      else if (from === "items-by-item") {
        //const params = new URLSearchParams(location.search);

        //params.set("itemId", Item_Id);

        navigate({
          pathname: "/items/all-items",
          search: location.search,
        });
      }
      else if (from === "all-sale-return-list") {
        navigate({
          pathname: "/sale/return",
          search: location.search,
        });
      }

      else if (from === "party-details") {
        navigate({
          pathname: "/party/parties",
          search: location.search,
        });
      }

      else if (from === "bank-accounts") {
        navigate({
          pathname: "/cash-bank/bank-accounts",
          search: `?bankId=${bankId}`,
        });
      }
      else if (from === "cash-in-hand") {
        navigate({
          pathname: "/cash-bank/cash-in-hand",
          search: location.search,
        });
      }
      // else if (from === "cash-in-hand") {
      //   navigate({
      //     pathname: "/cash-bank/cash-in-hand",
      //   });
      // }

      else {
        navigate({
          pathname: "/sale/return",
          search: location.search,
        });
      }

    } catch (error) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to update credit note.";

      toast.error(errorMessage);

      console.error(
        "Sale Return update failed:",
        error
      );
    }
  };
  const handleOpenScanModal = () => {
    setShowScanCodeModal(true);
  };

  const handleScanSave = (scannedItems) => {
    if (!scannedItems?.length) return;

    const currentItems = watch("items") || [];

    // =====================================================
    // CREATE SALE FORM ROWS FROM SCANNED ITEMS
    // =====================================================

    const scannedRows = scannedItems.map((item) => {
      const mrp = Number(item.MRP) || 0;

      const mrpDiscount =
        Number(item.Discount_On_MRP_For_Sale) || 0;

      // ===================================================
      // SALE PRICE
      // If MRP exists (> 0), calculate from MRP discount.
      // Otherwise use master's Sale_Price.
      // ===================================================

      const calculatedSalePrice =
        calculateSalePriceFromMRP && mrp > 0
          ? (mrp - (mrp * mrpDiscount) / 100).toFixed(2)
          : Number(item.Sale_Price) > 0
            ? Number(item.Sale_Price).toFixed(2)
            : "";

      return {
        Item_Category: item.Item_Category || "",
        Item_Name: item.Item_Name || "",
        Item_HSN: item.Item_HSN || "",

        //  MRP only when greater than 0
        // MRP: mrp > 0 ? mrp : "",
        MRP: showMRP && mrp > 0 ? mrp : "",

        //  MRP discount from master
        // Discount_On_MRP_For_Sale_Percentage:
        //   mrp > 0 && mrpDiscount > 0
        //     ? mrpDiscount
        //     : "",
        Discount_On_MRP_For_Sale_Percentage:
          calculateSalePriceFromMRP && mrp > 0 && mrpDiscount > 0
            ? mrpDiscount
            : "",

        Quantity: Number(item.Quantity) || 1,

        Item_Unit: item.Primary_Unit || "",

        // ✅ Calculated Sale Price
        Sale_Price: calculatedSalePrice,

        // ✅ Separate Sale Price discount
        Discount_On_Sale_Price:
          item.Discount_On_Sale_Price ?? "",

        Discount_Type_On_Sale_Price:
          item.Discount_Type_On_Sale_Price ||
          "Percentage",

        Tax_Type: item.Tax_Type || "None",

        Tax_Amount: "",
        Amount: "",
      };
    });

    // =====================================================
    // FILL EXISTING BLANK ROWS FIRST
    // =====================================================

    let combinedItems = [...currentItems];

    let scanIndex = 0;

    for (
      let i = 0;
      i < combinedItems.length &&
      scanIndex < scannedRows.length;
      i++
    ) {
      const row = combinedItems[i];

      const isBlankRow =
        !row?.Item_Name ||
        !row.Item_Name.trim();

      if (isBlankRow) {
        combinedItems[i] = scannedRows[scanIndex];
        scanIndex++;
      }
    }

    // =====================================================
    // REMOVE ALL REMAINING BLANK ROWS
    // =====================================================

    combinedItems = combinedItems.filter(
      (row) =>
        row?.Item_Name &&
        row.Item_Name.trim()
    );


    // =====================================================
    // APPEND REMAINING SCANNED ITEMS
    // =====================================================

    if (scanIndex < scannedRows.length) {
      combinedItems.push(
        ...scannedRows.slice(scanIndex)
      );
    }
    combinedItems.forEach((row, index) => {
      const discount =
        Number(row.Discount_On_MRP_For_Sale_Percentage) || 0;

      masterMrpDiscountRef.current[index] =
        discount > 0 ? discount : "";
    });

    // =====================================================
    // CALCULATE EACH ROW
    // MRP IS NOT PASSED SEPARATELY
    // =====================================================

    const calculatedItems = combinedItems.map(
      (row, index) =>
        calculateRowAmount(
          row,
          index,
          combinedItems
        )
    );

    // =====================================================
    // UPDATE REACT HOOK FORM
    // =====================================================

    // setValue(
    //   "items",
    //   calculatedItems,
    //   {
    //     shouldValidate: true,
    //     shouldDirty: true,
    //   }
    // );
    replace(calculatedItems);

    // =====================================================
    // CREATE UI ROWS
    // =====================================================

    // const scannedUiRows = scannedItems.map((item) => {
    //   const mrp = Number(item.MRP) || 0;

    //   const mrpDiscount =
    //     Number(item.Discount_On_MRP_For_Sale) || 0;

    //   const calculatedSalePrice =
    //     calculateSalePriceFromMRP && mrp > 0
    //       ? (mrp - (mrp * mrpDiscount) / 100).toFixed(2)
    //       : Number(item.Sale_Price) > 0
    //         ? Number(item.Sale_Price).toFixed(2)
    //         : "";
    //   return {
    //     itemSearch:
    //       item.Item_Name || "",

    //     itemOpen: false,

    //     isExistingItem: true,
    //     isHSNLocked: false,
    //     isUnitLocked: false,

    //     CategoryOpen: false,

    //     categorySearch:
    //       item.Item_Category || "",

    //     unitOpen: false,
    //     unitSearch: "",

    //     Item_Id:
    //       item.Item_Id || "",

    //     Item_Name:
    //       item.Item_Name || "",

    //     Item_Category:
    //       item.Item_Category || "",

    //     Item_HSN:
    //       item.Item_HSN || "",

    //     // ✅ MRP from master
    //     MRP: mrp > 0 ? mrp : "",

    //     // ✅ MRP discount from master
    //     Discount_On_MRP_For_Sale_Percentage:
    //       showMRP && calculateSalePriceFromMRP &&
    //         mrp > 0 &&
    //         mrpDiscount > 0
    //         ? mrpDiscount
    //         : "",

    //     Primary_Unit: item.Primary_Unit || null,

    //     Secondary_Unit:
    //       item.Secondary_Unit || null,

    //     Conversion_Rate:
    //       item.Conversion_Rate || null,

    //     Available_Units:
    //       Array.isArray(item.Available_Units)
    //         ? item.Available_Units
    //         : [],

    //     //  Calculated Sale Price
    //     Sale_Price: calculatedSalePrice,

    //     //  Separate Sale Price discount
    //     Discount_On_Sale_Price:
    //       item.Discount_On_Sale_Price ?? "",

    //     Discount_Type_On_Sale_Price:
    //       item.Discount_Type_On_Sale_Price ||
    //       "Percentage",

    //     Tax_Type:
    //       item.Tax_Type || "None",
    //   };
    // });

    // =====================================================
    // UPDATE UI ROWS
    // FILL BLANKS FIRST + REMOVE UNUSED BLANKS
    // =====================================================

    // setRows((prev) => {
    //   const updatedRows = [...prev];

    //   let uiScanIndex = 0;

    //   // ---------------------------------------------------
    //   // Fill existing blank rows
    //   // ---------------------------------------------------

    //   for (
    //     let i = 0;
    //     i < updatedRows.length &&
    //     uiScanIndex < scannedUiRows.length;
    //     i++
    //   ) {
    //     const row = updatedRows[i];

    //     const isBlankRow =
    //       !row?.Item_Name ||
    //       !row.Item_Name.trim();

    //     if (isBlankRow) {
    //       updatedRows[i] =
    //         scannedUiRows[uiScanIndex];

    //       uiScanIndex++;
    //     }
    //   }

    //   // ---------------------------------------------------
    //   // Remove remaining blank rows
    //   // ---------------------------------------------------

    //   const filledRows =
    //     updatedRows.filter(
    //       (row) =>
    //         row?.Item_Name &&
    //         row.Item_Name.trim()
    //     );

    //   // ---------------------------------------------------
    //   // Append remaining scanned rows
    //   // ---------------------------------------------------

    //   if (
    //     uiScanIndex <
    //     scannedUiRows.length
    //   ) {
    //     filledRows.push(
    //       ...scannedUiRows.slice(
    //         uiScanIndex
    //       )
    //     );
    //   }

    //   return filledRows;
    // });

    setRows(
      combinedItems.map((item) => ({
        itemSearch: item.Item_Name || "",

        itemOpen: false,

        isExistingItem: true,
        isHSNLocked: false,
        isUnitLocked: false,

        CategoryOpen: false,
        categorySearch: item.Item_Category || "",

        unitOpen: false,
        unitSearch: "",

        Item_Id: item.Item_Id || "",

        Item_Name: item.Item_Name || "",
        Item_Category: item.Item_Category || "",
        Item_HSN: item.Item_HSN || "",

        // Current MRP setting controls newly scanned items
        MRP: showMRP && Number(item.MRP) > 0
          ? Number(item.MRP)
          : "",

        // MRP discount
        Discount_On_MRP_For_Sale_Percentage:
          showMRP &&
            calculateSalePriceFromMRP &&
            Number(item.Discount_On_MRP_For_Sale_Percentage) > 0
            ? item.Discount_On_MRP_For_Sale_Percentage
            : "",

        Primary_Unit: item.Primary_Unit || null,
        Secondary_Unit: item.Secondary_Unit || null,
        Conversion_Rate: item.Conversion_Rate || null,

        Available_Units: Array.isArray(item.Available_Units)
          ? item.Available_Units
          : [],

        Sale_Price: item.Sale_Price || "",

        Discount_On_Sale_Price:
          item.Discount_On_Sale_Price ?? "",

        Discount_Type_On_Sale_Price:
          item.Discount_Type_On_Sale_Price ||
          "Percentage",

        Tax_Type: item.Tax_Type || "None",
      }))
    );

    // =====================================================
    // CALCULATE GRAND TOTAL
    // =====================================================

    const rawTotal =
      calculatedItems.reduce(
        (sum, item) =>
          sum +
          (Number(item.Amount) || 0),
        0
      );

    const roundOff = isRoundOff
      ? Number(watch("Round_Off")) || 0
      : 0;

    const finalTotal =
      rawTotal + roundOff;

    const totalPaid =
      Number(watch("Total_Paid")) || 0;

    const balanceDue =
      finalTotal - totalPaid;

    // =====================================================
    // UPDATE TOTAL AMOUNT
    // =====================================================

    setValue(
      "Total_Amount",
      finalTotal.toFixed(2),
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );

    // =====================================================
    // UPDATE BALANCE DUE
    // =====================================================

    setValue(
      "Balance_Due",
      balanceDue.toFixed(2),
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );

    // =====================================================
    // CLOSE SCAN MODAL
    // =====================================================

    setShowScanCodeModal(false);
  };

  return (
    <>


      {/* Main Content */}
      {/* <div className="sb2-2-3">
        <div className="row" style={{ margin: "0px" }}>
          <div className="col-md-12">
            <div style={{ padding: "20px" }}
              className="box-inn-sp"> */}

      <div style={{ padding: "20px" }}
        className="flex flex-col bg-white ">

        <div className="inn-title w-full px-2 py-3">

          <div className="
    flex flex-col sm:flex-row 
    justify-between 
    items-start sm:items-center 
    w-full 
  
    mt-4               /* ⭐ Adds spacing from top header */
  ">

            {/* LEFT HEADER */}
            <div className="w-full sm:w-auto">
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">Edit Credit Note</h4>

            </div>

            {/* RIGHT BUTTON SECTION */}
            <div className="
      w-full sm:w-auto 
      flex flex-wrap sm:flex-nowrap 
      justify-start sm:justify-end 
      gap-3
    ">
              <button
                type="button"
                onClick={() => {
                  if (from === "items-by-item") {
                    //const params = new URLSearchParams(location.search);

                    //params.set("itemId", Item_Id);

                    navigate({
                      pathname: "/items/all-items",
                      search: location.search,
                    });
                  }

                  else if (from === "party-payables") {
                    navigate({
                      pathname: "/party/payables",
                      search: location.search,
                    });
                  }
                  else if (from === "party-receivables") {
                    navigate({
                      pathname: `/party/receivables`,
                      search: location.search,
                    })
                  }
                  else if (from === "party-sales-purchases-details") {

                    navigate({
                      pathname: `/party/party-sales-purchases-details/${Party_Id}`,
                      search: location.search,
                    })

                  }
                  else if (from === "item-sales-purchases-details") {
                    navigate({
                      pathname: `/item/item-sales-purchases-details/${Item_Id}`,
                      search: location.search,
                    })
                    // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
                  }
                  else if (from === "party-details") {
                    // 🔹 new — return to Bank Accounts page with the same account selected
                    navigate({
                      pathname: `/party/parties`,
                      search: location.search,
                      // search: `?partyId=${partyId}`,
                    });
                  }
                  else if (from === "bank-accounts") {
                    // 🔹 new — return to Bank Accounts page with the same account selected
                    navigate({
                      pathname: `/cash-bank/bank-accounts`,
                      search: `?bankId=${bankId}`,
                    });
                  }
                  else if (from === "cash-in-hand") {
                    navigate({
                      pathname: "/cash-bank/cash-in-hand",
                      search: location.search,
                    });
                  }
                  // else if (from === "cash-in-hand") {
                  //   // 🔹 new — return to Bank Accounts page with the same account selected
                  //   navigate({
                  //     pathname: `/cash-bank/cash-in-hand`,

                  //   });
                  // }
                  else {
                    navigate({
                      pathname: "/sale/return",
                      search: location.search,
                    })
                  }
                }}

                //            else if (from === "party-receivables") {

                //       navigate({
                //   pathname: `/party/receivables`,
                //   search: location.search,
                // })
                //       // navigate(`/party/party-receivables-left/${Party_Id}`);
                //     }
                // onClick={() => navigate("/sale/all-sales")}
                className="text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => navigate("/sale/return")}
                className="text-white py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                All Debit Notes
              </button>
            </div>

          </div>
        </div>
        <div style={{ padding: "0", backgroundColor: "#f1f1f19d" }} className="tab-inn">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col justify-between gap-6 p-2 w-full sm:flex-row heading-wrapper">
              {/* <div className="row"> */}
              <div className="grid grid-rows-2 ml-2 w-full sm:w-1/2 lg:w-1/3 ">
                <div className=" flex flex-col relative mt-2 gap-2 party-class"
                  style={{ marginBottom: "0px", marginTop: "0px" }}>
                  {/* <div className="input-field col s6 mt-4 relative"> */}

                  <span className="active">
                    Party
                    <span className="text-red-500">*</span>
                  </span>


                  <div className="relative w-full">
                    <div
                      className="flex flex-row border rounded-md bg-white cursor-pointer"
                      onClick={() => setOpen((prev) => !prev)}
                    >
                      <input
                        type="text"
                        id="Party_Name"
                        value={partySearch}
                        // value={partySearch.length>10?partySearch.slice(0,15)+"...":partySearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPartySearch(value);
                          setValue("Party_Name", value, { shouldValidate: true });
                          setOpen(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            const typedValue = partySearch?.trim()?.toLowerCase();
                            const matchedParty = parties?.parties?.find(
                              (p) => p.Party_Name.toLowerCase() === typedValue
                            );

                            if (matchedParty) {
                              setPartySearch(matchedParty.Party_Name);
                              setValue("Party_Name", matchedParty.Party_Name, { shouldValidate: true });
                              setValue("GSTIN", matchedParty.GSTIN || "", { shouldValidate: true });
                            }

                            setOpen(false);
                          }, 150);
                        }}
                        placeholder="Search By Name/Phone"
                        className="w-full outline-none py-1 px-2 text-gray-900"
                        style={{ marginBottom: 0, marginTop: "4px", border: "none", borderBottom: "none", height: "2rem" }}
                      />
                      <div className="w-10 "></div>
                      <span className=" absolute right-0 px-2  top-1/3  text-gray-700">▼</span>
                    </div>

                    {open && (
                      <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <span
                          onClick={() => setShowPartyModal(true)}
                          className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                        >
                          + Add Party
                        </span>

                        {/* {parties?.parties
                          ?.filter(
                            (party) =>
                              party?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase()) ||
                              party?.Phone_Number?.includes(partySearch)
                          )
                          .map((party, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setPartySearch(party.Party_Name);
                                setValue("Party_Name", party.Party_Name, { shouldValidate: true });
                                setValue("GSTIN", party.GSTIN || "", { shouldValidate: true });
                                setOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {party.Party_Name} ({party.Phone_Number})
                            </div>
                          ))} */}
                        {parties?.parties
                          ?.filter(
                            (party) =>
                              party?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase()) ||
                              party?.Phone_Number?.includes(partySearch)
                          )
                          .map((party, i) => {
                            const bal = Number(party.Current_Balance ?? 0);
                            const balColor = bal < 0 ? "#ef4444" : "#16a34a";

                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  setPartySearch(party.Party_Name);
                                  setValue("Party_Name", party.Party_Name, { shouldValidate: true, shouldDirty: true });
                                  setValue("GSTIN", party.GSTIN || "", { shouldValidate: true, shouldDirty: true });
                                  //setValue("Billing_Name", party.Billing_Name || "", { shouldValidate: true, shouldDirty: true });

                                  setOpen(false);
                                }}
                                className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer gap-4"
                                style={{ borderBottom: "1px solid #f3f4f6" }}
                              >
                                {/* Left — name + phone */}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm text-gray-800 font-medium truncate">
                                    {party.Party_Name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {party.Phone_Number || "—"}
                                  </span>
                                </div>

                                {/* Right — balance */}
                                <div className="flex flex-col items-end flex-shrink-0">
                                  <span className="text-xs text-gray-400">Balance</span>
                                  <span className="text-xs font-semibold" style={{ color: balColor }}>
                                    ₹{bal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                        {parties?.parties?.filter((party) =>
                          party?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase())
                        ).length === 0 && (
                            <p className="px-3 py-2 text-gray-500">No Party found</p>
                          )}
                      </div>
                    )}
                  </div>
                  {/* {showPartyModal && (
                    <PartyAddModal
                      onClose={() => setShowPartyModal(false)}
                      onSave={(newParty) => {
                        setPartySearch(newParty);
                        setValue("Party_Name", newParty, { shouldValidate: true });
                        setShowPartyModal(false);
                      }}
                    />
                  )} */}
                  {showPartyModal && (
                    <PartyAddModal
                      onClose={() => setShowPartyModal(false)}
                      onSave={(newParty) => {
                        setPartySearch(newParty.Party_Name);

                        setValue(
                          "Party_Name",
                          newParty.Party_Name,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );

                        setValue(
                          "GSTIN",
                          newParty.GSTIN || "",
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );

                        setValue(
                          "Billing_Name",
                          newParty.Billing_Name || "",
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );

                        //setCurrentPartyDetails(newParty);

                        setShowPartyModal(false);
                      }}
                    />
                  )}

                </div>
                <div className="input-field  flex gap-4
                              justify-center items-center  gstin-class">
                  {/* <div className="input-field col s6 mt-4"> */}
                  <span className="whitespace-nowrap active">
                    GSTIN

                  </span>

                  <input
                    type="text"
                    id=" GSTIN"
                    style={{ marginBottom: "0px" }}
                    value={showGSTIN || ""}
                    {...register("GSTIN")}
                    placeholder="GSTIN"
                    className="w-full outline-none border-b-2 text-gray-900"
                    readOnly
                  />
                  {errors?.GSTIN && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.GSTIN?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-rows-3 w-full sm:w-1/2 lg:w-1/3 
          ml-auto gap-0  mr-2">
                <div className="flex items-center w-full gap-3  justify-end">
                  <span className="whitespace-nowrap ">
                    Return Number
                    <span className="text-red-500">*</span>
                  </span>

                  <input
                    type="text"
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    id=" Return_Number"
                    {...register("Return_Number")}
                    placeholder="Return_Number"
                    className="w-full outline-none invoice-number-class  text-gray-900"
                  />
                  {errors?.Return_Number && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Return_Number?.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center w-full gap-3  justify-end">
                  {/* <div className="row  "> */}

                  {/* Invoice Number */}
                  {/* <div className="input-field col s6 mt-4"> */}
                  <span className="whitespace-nowrap ">
                    Invoice Number <span className="text-red-500">*</span>
                  </span>

                  <input
                    type="text"
                    id=" Invoice_Number"
                    //value={Invoice_Number}

                    {...register("Invoice_Number")}
                    placeholder=" Invoice_Number"
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    className="w-full outline-none  text-gray-900
                          invoice-number-class"
                    readOnly
                  />
                  {/* {errors?.Invoice_Number && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors?.Invoice_Number?.message}
                          </p>
                        )} */}
                </div>



                {/* Invoice Date */}
                <div className="flex items-center w-full  gap-3 justify-end">
                  {/* <div className="input-field col s6 mt-4"> */}
                  <span className=" whitespace-nowrap active">
                    Invoice Date
                    {/* <span className="text-red-500">*</span> */}
                  </span>

                  <input
                    type="text"
                    id=" Invoice_Date"

                    //value={toLocalDateString(Invoice_Date) || ""}
                    style={{ marginBottom: 0, width: "50%", border: "none" }}
                    {...register("Invoice_Date")}
                    //placeholder=" Invoice_Date"
                    readOnly
                    className="w-full outline-none invoice-date-class text-gray-900"

                  />
                  {/* {errors?.Invoice_Date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors?.Invoice_Date?.message}
                          </p>
                        )} */}
                </div>

                {/* Date */}
                <div className="flex items-center w-full gap-3  justify-end">
                  <span className="whitespace-nowrap ">
                    Date
                    {/* <span className="text-red-500">*</span> */}
                  </span>

                  <input
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    type="date"
                    id=" Date"
                    {...register("Return_Date")}
                    placeholder="Date"
                    className="w-full outline-none invoice-date-class   text-gray-900"
                  />
                  {errors?.Return_Date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Return_Date?.message}
                    </p>
                  )}
                </div>
                {enablePlaceOfSupply && (<div className="flex items-center w-full gap-3 justify-end
                                           state-of-supply-class">
                  {/* <div className="row w-1/2"> */}

                  {/* State of Supply */}
                  {/* <div className="input-field col s6"> */}
                  <span className=" whitespace-nowrap active">
                    State of Supply
                    {/* <span className="text-red-500">*</span> */}
                  </span>
                  <select
                    style={{ marginBottom: "0px", width: "50%", border: "none" }}
                    id="stateOfSupply"
                    className="validate mt-2"

                    {...register("State_Of_Supply")}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors?.State_Of_Supply && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.State_Of_Supply?.message}
                    </p>
                  )}
                </div>)}


              </div>

            </div>







            <div className="table-responsive table-desi mt-4">
              <table className="table table-hover">
                <thead>
                  <tr>

                    <th
                      className="cursor-pointer"
                      onClick={handleOpenScanModal}
                    >
                      {barcodeScanEnabled ? (
                        <ScanLine size={18} />
                      ) : (
                        "Sl.No"
                      )}
                    </th>
                    <th>Category</th>
                    <th>Item</th>
                    <th>Item_HSN</th>
                    {shouldShowMRP && <th>MRP</th>}

                    {showMRP && calculateSalePriceFromMRP && (
                      <th>Discount On MRP (%)</th>
                    )}
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Price/Unit</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Tax Amount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody style={{ maxHeight: "10rem", overflowY: "scroll" }}>
                  {fields.map((field, i) => (
                    <tr key={field.id}>
                      {/* Action + Serial Number */}
                      <td style={{ padding: "0px", textAlign: "center", verticalAlign: "middle" }}>
                        <div
                          className="flex align-center justify-center text-center gap-2"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(i)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "red",
                              cursor: "pointer",
                            }}
                          >
                            🗑
                          </button>
                          <span>{i + 1}</span>
                        </div>
                      </td>

                      <td style={{ padding: "0px", width: "10%", position: "relative" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Item_Category`}
                          defaultValue="All"
                          render={({ field }) => (
                            <select
                              {...field}
                              className="form-select"
                              style={{ width: "100%", fontSize: "12px" }}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "__ADD_CATEGORY__") {
                                  setShowModal(true);
                                  return; // don't commit this as the selected value
                                }
                                field.onChange(value);
                              }}
                            >
                              <option value="All">All</option>
                              <option value="__ADD_CATEGORY__">➕ Add Category</option>
                              {categories?.map((cat) => (
                                <option key={cat.Category_Id} value={cat.Item_Category}>
                                  {cat.Item_Category}
                                </option>
                              ))}
                            </select>
                          )}
                        />

                        {showModal && (
                          <div
                            style={{
                              position: "fixed", inset: 0, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 30,
                            }}
                          >
                            <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                              <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{ backgroundColor: "transparent" }}
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
                                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: "lightgray" }} className="px-4 py-2 rounded-md">
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const created = await handleAddCategory(); // should return the created category object
                                    if (created?.Item_Category) {
                                      setValue(`items.${i}.Item_Category`, created.Item_Category, { shouldValidate: true });
                                    }
                                    setShowModal(false);
                                  }}
                                  style={{ backgroundColor: "#4CA1AF" }}
                                  className="px-4 py-2 rounded-md text-white"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Item Dropdown */}
                      <td style={{ padding: "0px", width: "20%", position: "relative" }}>
                        <div ref={(el) => (itemRefs.current[i] = el)}> {/* ✅ attach ref */}
                          <input
                            type="text"
                            value={rows[i]?.itemSearch || ""}
                            // onChange={(e) => {
                            //   const typedValue = e.target.value;
                            //   handleRowChange(i, "itemSearch", typedValue);
                            //   handleRowChange(i, "CategoryOpen", false);
                            //   handleRowChange(i, "unitOpen", false);
                            //   // setValue(`items.${i}.Item_Name`, typedValue);
                            //   handleRowChange(i, "isHSNLocked", false);
                            //   handleRowChange(i, "isExistingItem", false);
                            //   handleRowChange(i, "isUnitLocked", false);

                            //   const exists = items?.items?.find(
                            //     (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
                            //   );
                            //   if (exists) {
                            //     // ✅ Only store if it's a valid item
                            //     setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
                            //     handleRowChange(i, "isExistingItem", true);
                            //   } else {
                            //     // ❌ Clear Item_Name in RHF to trigger error
                            //     setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
                            //     handleRowChange(i, "isExistingItem", false);

                            //     handleRowChange(i, "Primary_Unit", null);      // 🔹 add this
                            //     handleRowChange(i, "Secondary_Unit", null);    // 🔹 add this
                            //     handleRowChange(i, "Available_Units", [])
                            //   }
                            //   //handleRowChange(i, "isExistingItem", exists); // false if new item
                            // }}
                            // onBlur={() => {
                            //   setTimeout(() => {
                            //     const typedValue = rows[i]?.itemSearch?.trim() || "";
                            //     if (!typedValue) return;

                            //     const matchedItem = items?.items?.find(
                            //       (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
                            //     );

                            //     if (matchedItem) {
                            //       // ✅ auto-fill exactly like clicking from dropdown
                            //       setRows((prev) => {
                            //         const updated = [...prev];
                            //         updated[i] = {
                            //           ...updated[i],
                            //           itemSearch: matchedItem.Item_Name,   // normalize display
                            //           Item_Category: matchedItem.Item_Category || "",
                            //           Item_HSN: matchedItem.Item_HSN || "",
                            //           categorySearch: matchedItem.Item_Category || "",
                            //           isExistingItem: true,
                            //           isHSNLocked: false,
                            //           isUnitLocked: false,
                            //           itemOpen: false,
                            //           Primary_Unit: matchedItem.Primary_Unit || null,
                            //           Secondary_Unit: matchedItem.Secondary_Unit || null,
                            //           Conversion_Rate: matchedItem.Conversion_Rate || null,

                            //           //  ONLY CURRENT MASTER AVAILABLE UNITS
                            //           Available_Units: Array.isArray(matchedItem.Available_Units)
                            //             ? matchedItem.Available_Units
                            //             : [],
                            //         };
                            //         return updated;
                            //       });

                            //       setValue(`items.${i}.Item_Name`, matchedItem.Item_Name, { shouldValidate: true, shouldDirty: true });
                            //       setValue(`items.${i}.Item_Category`, matchedItem.Item_Category, { shouldValidate: true, shouldDirty: true });
                            //       setValue(`items.${i}.Item_HSN`, matchedItem.Item_HSN, { shouldValidate: true, shouldDirty: true });
                            //       setValue(`items.${i}.Sale_Price`, matchedItem.Sale_Price || 0, { shouldValidate: true, shouldDirty: true });
                            //       //setValue(`items.${i}.Item_Unit`, matchedItem.Item_Unit, { shouldValidate: true, shouldDirty: true });
                            //       setValue(`items.${i}.Item_Unit`, matchedItem.Item_Unit, {
                            //         shouldValidate: true,
                            //         shouldDirty: true,
                            //       });
                            //       baseSalePriceRef.current[i] = Number(matchedItem.Sale_Price) || 0;
                            //       baseSaleUnitRef.current[i] = matchedItem.Primary_Unit || ""
                            //       const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                            //         {
                            //           ...itemsValues[i],
                            //           Item_Name: matchedItem.Item_Name,
                            //           Sale_Price: matchedItem.Sale_Price || 0,
                            //           Quantity: itemsValues[i]?.Quantity || 0,
                            //         },
                            //         i,
                            //         itemsValues
                            //       );

                            //       setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                            //       setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                            //       syncTotalsAfterItemChange();
                            //       // setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                            //       // setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                            //     } else {
                            //       // no match — close dropdown
                            //       handleRowChange(i, "itemOpen", false);
                            //     }
                            //   }, 150); // small delay so click-from-dropdown fires first
                            // }}
                            // onClick={() => {
                            //   handleRowChange(i, "itemOpen", true);
                            //   handleRowChange(i, "unitOpen", false);
                            //   handleRowChange(i, "CategoryOpen", false);
                            // }}
                            //onClick={() => handleRowChange(i, "itemOpen", !rows[i]?.itemOpen)}

                            onChange={(e) => {
                              const typedValue = e.target.value;
                              setActiveItemRow(i);
                              setItemCursor(null);
                              handleRowChange(i, "itemSearch", typedValue);

                              handleRowChange(i, "CategoryOpen", false);
                              handleRowChange(i, "unitOpen", false);

                              setValue(
                                `items.${i}.Item_Name`,
                                typedValue,
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              );

                              handleRowChange(i, "isHSNLocked", false);
                              handleRowChange(i, "isExistingItem", false);
                              handleRowChange(i, "isUnitLocked", false);

                              // Clear previously selected item details
                              handleRowChange(i, "Primary_Unit", null);
                              handleRowChange(i, "Secondary_Unit", null);
                              handleRowChange(i, "Available_Units", []);
                            }}

                            onBlur={() => {
                              setTimeout(async () => {
                                const typedValue =
                                  rows[i]?.itemSearch?.trim() || "";

                                if (!typedValue) {
                                  handleRowChange(i, "itemOpen", false);
                                  return;
                                }

                                // =====================================================
                                // IMPORTANT:
                                // Capture the CURRENT row before changing anything.
                                // This preserves existing transaction values.
                                // =====================================================

                                const currentRow = itemsValues[i] || {};

                                // Original item currently belonging to this transaction row.
                                // If the user deletes the name and types the same item again,
                                // Item_Id lets us recognize that it is the same item.
                                const existingItemId = currentRow.Item_Id || "";

                                try {
                                  // ===================================================
                                  // EXACT ITEM LOOKUP FROM BACKEND
                                  // ===================================================

                                  const response =
                                    await getItemByName(typedValue).unwrap();

                                  const matchedItem = response?.item;


                                  // ===================================================
                                  // NO EXACT ITEM FOUND
                                  // ===================================================

                                  if (!matchedItem?.Item_Id) {
                                    handleRowChange(
                                      i,
                                      "itemOpen",
                                      false
                                    );
                                    return;
                                  }
                                  masterMrpDiscountRef.current[i] =
                                    Number(matchedItem?.Discount_On_MRP_For_Sale) > 0
                                      ? Number(matchedItem.Discount_On_MRP_For_Sale)
                                      : "";

                                  // ===================================================
                                  // CHECK WHETHER THIS IS THE SAME ITEM
                                  // THAT WAS ALREADY IN THIS TRANSACTION ROW
                                  // ===================================================

                                  const isSameExistingItem =
                                    existingItemId &&
                                    matchedItem.Item_Id === existingItemId;

                                  // ===================================================
                                  // MASTER MRP / MRP DISCOUNT
                                  //
                                  // Only use these for:
                                  //
                                  // 1. A new/blank row
                                  // 2. A different item selected in an existing row
                                  //
                                  // If it is the SAME existing item, preserve
                                  // the transaction's old MRP values.
                                  // ===================================================

                                  const masterMRP =
                                    Number(matchedItem.MRP) > 0
                                      ? matchedItem.MRP
                                      : "";

                                  const historicalMRPDiscount =
                                    Number(
                                      currentRow.Discount_On_MRP_For_Sale_Percentage
                                    ) > 0
                                      ? Number(
                                        currentRow.Discount_On_MRP_For_Sale_Percentage
                                      )
                                      : 0;
                                  const masterMRPDiscount =
                                    Number(
                                      matchedItem.Discount_On_MRP_For_Sale
                                    ) > 0
                                      ? matchedItem.Discount_On_MRP_For_Sale
                                      : "";
                                  const resolvedMRPDiscount =
                                    isSameExistingItem && historicalMRPDiscount > 0
                                      ? historicalMRPDiscount
                                      : masterMRPDiscount;

                                  masterMrpDiscountRef.current[i] = resolvedMRPDiscount;
                                  // ===================================================
                                  // CALCULATE SALE PRICE FROM MASTER
                                  //
                                  // MRP - MRP Discount
                                  // ===================================================


                                  const calculatedMasterSalePrice =
                                    calculateSalePriceFromMRP && Number(masterMRP) > 0
                                      ? (
                                        Number(masterMRP) -
                                        (
                                          Number(masterMRP) *
                                          Number(resolvedMRPDiscount || 0)
                                        ) / 100
                                      ).toFixed(2)
                                      : (
                                        matchedItem.Sale_Price ?? ""
                                      );


                                  // ===================================================
                                  // VALUES TO USE
                                  //
                                  // SAME ITEM:
                                  //     preserve existing transaction values
                                  //
                                  // NEW/DIFFERENT ITEM:
                                  //     use master MRP values
                                  // ===================================================

                                  const resolvedMRP =
                                    isSameExistingItem
                                      ? (currentRow.MRP ?? "")
                                      : masterMRP;



                                  const resolvedSalePrice =
                                    isSameExistingItem
                                      ? (currentRow.Sale_Price ?? "")
                                      : calculatedMasterSalePrice;

                                  // ===================================================
                                  // SALE PRICE DISCOUNT
                                  //
                                  // SAME ITEM:
                                  //     preserve existing transaction discount.
                                  //
                                  // DIFFERENT/NEW ITEM:
                                  //     use master Sale Price discount IF > 0.
                                  //     Otherwise blank.
                                  // ===================================================

                                  const masterSaleDiscount =
                                    Number(
                                      matchedItem.Discount_On_Sale_Price
                                    ) > 0
                                      ? matchedItem.Discount_On_Sale_Price
                                      : "";

                                  const masterSaleDiscountType =
                                    Number(
                                      matchedItem.Discount_On_Sale_Price
                                    ) > 0
                                      ? (
                                        matchedItem
                                          .Discount_Type_On_Sale_Price ||
                                        "Percentage"
                                      )
                                      : "Percentage";

                                  const resolvedSaleDiscount =
                                    isSameExistingItem
                                      ? (
                                        currentRow
                                          .Discount_On_Sale_Price ?? ""
                                      )
                                      : masterSaleDiscount;

                                  const resolvedSaleDiscountType =
                                    isSameExistingItem
                                      ? (
                                        currentRow
                                          .Discount_Type_On_Sale_Price ||
                                        "Percentage"
                                      )
                                      : masterSaleDiscountType;

                                  // ===================================================
                                  // UPDATE ROW
                                  // ===================================================

                                  setRows((prev) => {
                                    const updated = [...prev];

                                    updated[i] = {
                                      ...updated[i],

                                      itemSearch:
                                        matchedItem.Item_Name || "",

                                      Item_Id:
                                        matchedItem.Item_Id || "",

                                      Item_Category:
                                        matchedItem.Item_Category || "",

                                      Item_HSN:
                                        matchedItem.Item_HSN || "",

                                      categorySearch:
                                        matchedItem.Item_Category || "",

                                      isExistingItem: true,

                                      isHSNLocked: false,
                                      isUnitLocked: false,

                                      itemOpen: false,

                                      // ==========================================
                                      // CURRENT MASTER UNIT INFORMATION
                                      // ==========================================

                                      Primary_Unit:
                                        matchedItem.Primary_Unit || null,

                                      Primary_Unit_Id:
                                        matchedItem.Primary_Unit_Id || null,

                                      Secondary_Unit:
                                        matchedItem.Secondary_Unit || null,

                                      Secondary_Unit_Id:
                                        matchedItem.Secondary_Unit_Id || null,

                                      Conversion_Rate:
                                        matchedItem.Conversion_Rate ?? null,

                                      Available_Units:
                                        Array.isArray(
                                          matchedItem.Available_Units
                                        )
                                          ? matchedItem.Available_Units
                                          : [],

                                      // ==========================================
                                      // PRESERVE / RESOLVE SALE DISCOUNT
                                      // ==========================================

                                      Discount_On_Sale_Price:
                                        resolvedSaleDiscount,

                                      Discount_Type_On_Sale_Price:
                                        resolvedSaleDiscountType,
                                    };

                                    return updated;
                                  });

                                  // ===================================================
                                  // ITEM MASTER INFORMATION
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Item_Name`,
                                    matchedItem.Item_Name || "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  setValue(
                                    `items.${i}.Item_Id`,
                                    matchedItem.Item_Id || "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  setValue(
                                    `items.${i}.Item_Category`,
                                    matchedItem.Item_Category || "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  setValue(
                                    `items.${i}.Item_HSN`,
                                    matchedItem.Item_HSN || "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // MRP
                                  //
                                  // SAME ITEM  → old transaction MRP
                                  // NEW ITEM   → master MRP
                                  // ===================================================

                                  setValue(
                                    `items.${i}.MRP`,
                                    resolvedMRP,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // MRP DISCOUNT
                                  //
                                  // SAME ITEM  → old transaction discount
                                  // NEW ITEM   → master discount
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Discount_On_MRP_For_Sale_Percentage`,
                                    showMRP && calculateSalePriceFromMRP
                                      ? resolvedMRPDiscount
                                      : "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // SALE PRICE
                                  //
                                  // SAME ITEM  → old transaction Sale Price
                                  // NEW ITEM   → calculated from master MRP
                                  //
                                  // IMPORTANT:
                                  // Do NOT use matchedItem.Sale_Price for a new item
                                  // when MRP exists.
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Sale_Price`,
                                    resolvedSalePrice,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // SALE PRICE DISCOUNT
                                  //
                                  // SAME ITEM  → preserve existing transaction discount
                                  // NEW ITEM   → master discount if > 0
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Discount_On_Sale_Price`,
                                    resolvedSaleDiscount,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  setValue(
                                    `items.${i}.Discount_Type_On_Sale_Price`,
                                    resolvedSaleDiscountType,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // TAX
                                  //
                                  // SAME ITEM → preserve existing transaction tax
                                  // NEW ITEM  → current/master tax if available
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Tax_Type`,
                                    currentRow.Tax_Type ||
                                    matchedItem.Tax_Type ||
                                    "None",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // QUANTITY
                                  //
                                  // ALWAYS PRESERVE CURRENT ROW QUANTITY
                                  // ===================================================

                                  const resolvedQuantity =
                                    currentRow.Quantity || 1;

                                  setValue(
                                    `items.${i}.Quantity`,
                                    resolvedQuantity,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // UNIT
                                  //
                                  // Keep existing transaction unit if available.
                                  // Otherwise use master primary unit.
                                  // ===================================================

                                  const selectedUnit =
                                    currentRow.Item_Unit ||
                                    matchedItem.Primary_Unit ||
                                    "";

                                  setValue(
                                    `items.${i}.Item_Unit`,
                                    selectedUnit,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // BASE SALE PRICE / UNIT
                                  // ===================================================

                                  baseSalePriceRef.current[i] =
                                    Number(resolvedSalePrice) || 0;

                                  baseSaleUnitRef.current[i] =
                                    selectedUnit;

                                  // ===================================================
                                  // CALCULATE ROW
                                  //
                                  // MRP IS NOT PASSED.
                                  // ===================================================

                                  const calculatedRow = {
                                    ...currentRow,

                                    Item_Id:
                                      matchedItem.Item_Id || "",

                                    Item_Name:
                                      matchedItem.Item_Name || "",

                                    Item_Category:
                                      matchedItem.Item_Category || "",

                                    Item_HSN:
                                      matchedItem.Item_HSN || "",

                                    // ==============================================
                                    // RESOLVED SALE PRICE
                                    // ==============================================

                                    Sale_Price:
                                      resolvedSalePrice,

                                    // ==============================================
                                    // EXISTING QUANTITY
                                    // ==============================================

                                    Quantity:
                                      resolvedQuantity,

                                    // ==============================================
                                    // RESOLVED UNIT
                                    // ==============================================

                                    Item_Unit:
                                      selectedUnit,

                                    // ==============================================
                                    // RESOLVED SALE DISCOUNT
                                    // ==============================================

                                    Discount_On_Sale_Price:
                                      resolvedSaleDiscount,

                                    Discount_Type_On_Sale_Price:
                                      resolvedSaleDiscountType,

                                    // ==============================================
                                    // EXISTING TAX
                                    // ==============================================

                                    Tax_Type:
                                      currentRow.Tax_Type ||
                                      matchedItem.Tax_Type ||
                                      "None",
                                  };

                                  // ===================================================
                                  // CALCULATE TAX + AMOUNT
                                  //
                                  // NO MRP HERE.
                                  // ===================================================

                                  const {
                                    Tax_Amount,
                                    Amount,
                                  } = calculateRowAmount(
                                    calculatedRow,
                                    i,
                                    itemsValues
                                  );

                                  // ===================================================
                                  // SET CALCULATED VALUES
                                  // ===================================================

                                  setValue(
                                    `items.${i}.Tax_Amount`,
                                    Tax_Amount,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  setValue(
                                    `items.${i}.Amount`,
                                    Amount,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  // ===================================================
                                  // UPDATE TOTALS
                                  // ===================================================

                                  syncTotalsAfterItemChange();

                                  // ===================================================
                                  // CLOSE DROPDOWN
                                  // ===================================================

                                  handleRowChange(
                                    i,
                                    "itemOpen",
                                    false
                                  );

                                } catch (err) {
                                  console.error(
                                    "❌ Item name lookup failed:",
                                    err
                                  );

                                  handleRowChange(
                                    i,
                                    "itemOpen",
                                    false
                                  );
                                }
                              }, 150);
                            }}
                            onClick={() => {
                              const currentSearch =
                                rows[i]?.itemSearch?.trim() || "";

                              setActiveItemRow(i);
                              setItemCursor(null);

                              // IMPORTANT:
                              // Existing Edit item should be searched immediately.
                              setDebouncedSearch(currentSearch);

                              handleRowChange(i, "itemOpen", true);
                              handleRowChange(i, "unitOpen", false);
                              handleRowChange(i, "CategoryOpen", false);
                            }}
                            placeholder="Item Name"
                            className="w-full outline-none border-b-2 text-gray-900"
                          />

                          {errors?.items?.[i]?.Item_Name && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Item_Name.message}
                            </p>
                          )}



                          {/* Dropdown List */}



                          {rows[i]?.itemOpen && (
                            <ItemDropdownVirtualized
                              rowIndex={i}
                              items={items?.items || []}
                              isDropdownFetching={isDropdownFetching}
                              loadMoreItems={loadMoreItems}
                              scrollRef={getDropdownScrollRef(i)}

                              onAddItemClick={() => {
                                handleRowChange(i, "itemOpen", true);
                                setActiveItemRow(i);
                                setShowItemAddModal(true);
                              }}
                              onSelectItem={(it) => {
                                //console.log("DROPDOWN ITEM CLICKED:", it);
                                masterMrpDiscountRef.current[i] =
                                  Number(it.Discount_On_MRP_For_Sale) > 0
                                    ? Number(it.Discount_On_MRP_For_Sale)
                                    : "";
                                const resolvedSaleDiscount =
                                  Number(it.Discount_On_Sale_Price) > 0
                                    ? it.Discount_On_Sale_Price
                                    : itemsValues[i]?.Discount_On_Sale_Price ?? "";

                                const resolvedSaleDiscountType =
                                  Number(it.Discount_On_Sale_Price) > 0
                                    ? it.Discount_Type_On_Sale_Price || "Percentage"
                                    : itemsValues[i]?.Discount_Type_On_Sale_Price || "Percentage";

                                const mrp = Number(it.MRP) || 0;
                                const mrpDiscount = Number(it.Discount_On_MRP_For_Sale) || 0;

                                const calculatedSalePrice =
                                  calculateSalePriceFromMRP && mrp > 0
                                    ? (mrp - (mrp * mrpDiscount) / 100).toFixed(2)
                                    : (it.Sale_Price || 0);
                                setRows((prev) => {
                                  const updated = [...prev];
                                  updated[i] = {
                                    ...updated[i],
                                    Item_Category: it.Item_Category || "",
                                    Item_HSN: it.Item_HSN || "",
                                    categorySearch: it.Item_Category || "",
                                    isExistingItem: true,
                                    isHSNLocked: false,
                                    isUnitLocked: false,
                                    Primary_Unit: it.Primary_Unit || null,
                                    Secondary_Unit: it.Secondary_Unit || null,
                                    Conversion_Rate: it.Conversion_Rate || null,
                                    Available_Units: Array.isArray(it.Available_Units) ? it.Available_Units : [],
                                    // MASTER DISCOUNT — dropdown click only

                                    Discount_On_Sale_Price: resolvedSaleDiscount,
                                    Discount_Type_On_Sale_Price: resolvedSaleDiscountType,
                                    //Discount_On_Sale_Price: it.Discount_On_Sale_Price ?? "",

                                    //Discount_Type_On_Sale_Price: it.Discount_Type_On_Sale_Price || "Percentage",
                                  };
                                  return updated;
                                });

                                handleRowChange(i, "itemSearch", it.Item_Name);
                                handleRowChange(i, "isExistingItem", true);
                                handleRowChange(i, "CategoryOpen", false);
                                handleRowChange(i, "unitOpen", false);

                                setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });
                                setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
                                setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                //setValue(`items.${i}.MRP`, it.MRP || "", { shouldValidate: true, shouldDirty: true });
                                if (showMRP) {
                                  setValue(
                                    `items.${i}.MRP`,
                                    Number(it.MRP) > 0 ? it.MRP : "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                } else {
                                  setValue(
                                    `items.${i}.MRP`,
                                    "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }
                                setValue(`items.${i}.Discount_On_MRP_For_Sale_Percentage`, it.Discount_On_MRP_For_Sale || "", { shouldValidate: true, shouldDirty: true });
                                // const mrp = Number(it.MRP) || 0;
                                // const mrpDiscount = Number(it.Discount_On_MRP_For_Sale) || 0;

                                // const calculatedSalePrice =
                                //   mrp > 0
                                //     ? (mrp - (mrp * mrpDiscount) / 100).toFixed(2)
                                //     : (it.Sale_Price || 0);

                                setValue(
                                  `items.${i}.Sale_Price`,
                                  calculatedSalePrice,
                                  { shouldValidate: true, shouldDirty: true }
                                );
                                //setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0, { shouldValidate: true, shouldDirty: true });
                                //setValue(`items.${i}.Discount_On_Sale_Price`, it.Discount_On_Sale_Price ?? "", { shouldValidate: true, shouldDirty: true, });

                                // setValue(`items.${i}.Discount_Type_On_Sale_Price`, it.Discount_Type_On_Sale_Price || "Percentage",
                                //   { shouldValidate: true, shouldDirty: true });
                                //setValue(`items.${i}.Quantity`, 1, { shouldValidate: true, shouldDirty: true });
                                setValue(
                                  `items.${i}.Discount_On_Sale_Price`,
                                  resolvedSaleDiscount,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  }
                                );

                                setValue(
                                  `items.${i}.Discount_Type_On_Sale_Price`,
                                  resolvedSaleDiscountType,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  }
                                );
                                setValue(`items.${i}.Item_Unit`, it.Primary_Unit || "", { shouldValidate: true, shouldDirty: true });

                                //baseSalePriceRef.current[i] = Number(it.Sale_Price) || 0;
                                baseSalePriceRef.current[i] = Number(calculatedSalePrice) || 0;

                                baseSaleUnitRef.current[i] = it.Primary_Unit || "";
                                handleRowChange(i, "itemOpen", false);

                                const { Tax_Amount, Amount } = calculateRowAmount(
                                  {
                                    ...itemsValues[i],
                                    Item_Name: it.Item_Name,
                                    Sale_Price: calculatedSalePrice,
                                    //Sale_Price: it.Sale_Price || 0,
                                    Quantity: itemsValues[i]?.Quantity || 0,
                                    Discount_On_Sale_Price: resolvedSaleDiscount,
                                    Discount_Type_On_Sale_Price: resolvedSaleDiscountType,
                                    // Discount_On_Sale_Price:itemsValues[i]?.Discount_On_Sale_Price ?? 0,
                                    //Discount_Type_On_Sale_Price:itemsValues[i]?.Discount_Type_On_Sale_Price || "Percentage",
                                    // Discount_On_Sale_Price: itemsValues[i]?.Discount_On_Sale_Price || 0,
                                    // Discount_Type_On_Sale_Price: itemsValues[i]?.Discount_Type_On_Sale_Price,
                                    Tax_Type: itemsValues[i]?.Tax_Type,
                                  },
                                  i,
                                  itemsValues
                                );

                                setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                syncTotalsAfterItemChange();
                              }}
                            />
                          )}



                          {/* RHF error */}

                        </div>
                      </td>

                      {/*HSN Code */}
                      <td style={{ padding: "0px", width: "8%" }}>
                        <input
                          type="text"

                          value={rows[i]?.Item_HSN || watch(`items.${i}.Item_HSN`) || ""}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            handleRowChange(i, "Item_HSN", e.target.value);
                            setValue(`items.${i}.Item_HSN`, e.target.value, { shouldValidate: true, shouldDirty: true });
                            // if (!rows[i]?.isHSNLocked) {
                            //   handleRowChange(i, "Item_HSN", e.target.value);
                            //   setValue(`items.${i}.Item_HSN`, e.target.value, { shouldValidate: true, shouldDirty: true });
                            // }
                          }}
                          placeholder="HSN Code"
                          className="w-full outline-none border-b-2 text-gray-900"
                        // readOnly={rows[i]?.isHSNLocked} // ✅ lock if item is from dropdown
                        />
                        {errors?.items?.[i]?.Item_HSN && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Item_HSN.message}
                          </p>
                        )}
                      </td>
                      {/*MRP */}
                      {shouldShowMRP && (
                        <td style={{ padding: "0px", width: "6%" }}>
                          <div className="d-flex align-items-center">
                            <input
                              type="text"
                              className="form-control"
                              style={{ width: "100%", marginBottom: "0px" }}
                              {...register(`items.${i}.MRP`)}
                              onChange={(e) => {
                                let val = e.target.value;

                                val = val.replace(/[^0-9.]/g, "");

                                const parts = val.split(".");
                                if (parts.length > 2) {
                                  val = parts[0] + "." + parts.slice(1).join("");
                                }

                                if (val.includes(".")) {
                                  const [int, dec] = val.split(".");
                                  val = int + "." + dec.slice(0, 2);
                                }

                                if (val === "") {
                                  setValue(`items.${i}.MRP`, "", {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                  setValue(
                                    `items.${i}.Discount_On_MRP_For_Sale_Percentage`,
                                    "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  return;
                                }

                                setValue(`items.${i}.MRP`, val, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });

                                const mrpNum = Number(val) || 0;

                                const discountNum =
                                  Number(masterMrpDiscountRef.current[i]) > 0
                                    ? Number(masterMrpDiscountRef.current[i])
                                    : 0;

                                // Only restore/show MRP discount when calculation is ON
                                if (
                                  calculateSalePriceFromMRP &&
                                  mrpNum > 0 &&
                                  discountNum > 0
                                ) {
                                  setValue(
                                    `items.${i}.Discount_On_MRP_For_Sale_Percentage`,
                                    discountNum,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }

                                // Only calculate Sale Price when calculation is ON
                                if (
                                  calculateSalePriceFromMRP &&
                                  mrpNum > 0
                                ) {
                                  const calculatedSalePrice =
                                    mrpNum - (mrpNum * discountNum) / 100;

                                  setValue(
                                    `items.${i}.Sale_Price`,
                                    calculatedSalePrice.toFixed(2),
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );

                                  const { Tax_Amount, Amount } =
                                    calculateRowAmount(
                                      {
                                        ...itemsValues[i],
                                        Sale_Price: calculatedSalePrice.toFixed(2),
                                      },
                                      i,
                                      itemsValues
                                    );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                  setValue(`items.${i}.Amount`, Amount, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                  syncTotalsAfterItemChange();
                                }
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) === 0) {
                                  e.target.value = "";

                                  setValue(`items.${i}.MRP`, "", {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                  setValue(
                                    `items.${i}.Discount_On_MRP_For_Sale_Percentage`,
                                    "",
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }
                              }}
                              placeholder="MRP"
                            />
                          </div>

                          {errors?.items?.[i]?.MRP && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].MRP.message}
                            </p>
                          )}
                        </td>
                      )}
                      {showMRP && calculateSalePriceFromMRP && (
                        <td style={{ padding: "0px", width: "6%" }}>
                          <div className="d-flex align-items-center">
                            <input
                              type="text"
                              className="form-control"
                              readOnly
                              style={{ width: "100%", marginBottom: "0px" }}
                              {...register(
                                `items.${i}.Discount_On_MRP_For_Sale_Percentage`
                              )}
                            />
                          </div>
                        </td>
                      )}

                      {/* Quantity */}
                      <td style={{ padding: "0px", width: "4%" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ width: "100%" }}
                          //value={watch(`items.${i}.Quantity`)?.toString() || ""}
                          {...register(`items.${i}.Quantity`)}
                          onChange={(e) => {
                            //let value = e.target.value.replace(/[^0-9]/g, "");
                            let value = e.target.value;
                            value = value
                              .replace(/[^0-9.]/g, "")
                              .replace(/(\..*)\./g, "$1");
                            // let currentItemName = itemsValues[i]?.Item_Name?.trim();
                            // if (!currentItemName) return;

                            // // 🔹 Fetch the item’s DB stock (available stock now)
                            // const stockItem = items?.items?.find(
                            //   (item) => item.Item_Name === currentItemName
                            // );
                            // const currentStock = Number(stockItem?.Stock_Quantity || 0);

                            // // 🔹 Get the old quantity from the sale being edited (previously sold)
                            // const previousQuantity = Number(rows[i]?.itemQuantity || 0);

                            // // ✅ Effective available stock = stock + previously sold quantity
                            // const effectiveAvailableStock = currentStock + previousQuantity;


                            // let num = Number(value);

                            // if (!Number.isFinite(num) || num < 0) {
                            //   num = 0;
                            // }
                            // if (num > effectiveAvailableStock) num = effectiveAvailableStock;

                            // ✅ Update via RHF
                            setValue(`items.${i}.Quantity`, value, { shouldValidate: true });

                            // ✅ Recalculate row + totals
                            const { Tax_Amount, Amount, Total_Amount, Balance_Due } =
                              calculateRowAmount(
                                { ...itemsValues[i], Quantity: Number(value) || 0 },
                                i,
                                itemsValues
                              );

                            setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
                            setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
                            syncTotalsAfterItemChange();
                            // setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                            // setValue("Balance_Due", Balance_Due, { shouldValidate: true });
                          }}
                          placeholder="Qty"
                        />

                        {errors?.items?.[i]?.Quantity && (

                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Quantity.message}
                          </p>
                        )}
                      </td>



                      {/* <td style={{ padding: "0px", width: "12%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Item_Unit`}
                          render={({ field }) => {
                            const row = rows[i];
                            const availableUnits = Array.isArray(row?.Available_Units) ? row.Available_Units : [];
                            console.log(row, "row")
                            return (
                              <select
                                {...field}
                                value={field.value || ""}
                                className="form-select"
                                style={{ width: "100%", fontSize: "12px", marginLeft: "0px" }}
                                //disabled={row?.isUnitLocked}
                                onChange={(e) => {
                                  const newUnit = e.target.value;

                                  if (newUnit === "__ADD_UNIT__") {
                                    setActiveUnitRow(i);
                                    setShowAddUnitModal(true);
                                    return;
                                  }

                                  const previousUnit = field.value;
                                  field.onChange(newUnit);
                                  handleRowChange(i, "Item_Unit", newUnit);
                                  setValue(`items.${i}.Item_Unit`, newUnit, { shouldValidate: true, shouldDirty: true });
                                  //const quantity = Number(itemsValues[i]?.Quantity);

                                  // if (!Number.isFinite(quantity) || quantity <= 0) {
                                  //   return;
                                  // }
                                  // 🔹 auto-scale Price/Unit when switching between Primary <-> Secondary
                                  // const primaryUnit = row?.Primary_Unit;
                                  // const secondaryUnit = row?.Secondary_Unit;
                                  // const conversionRate = Number(row?.Conversion_Rate) || 0;
                                  // const currentItem = itemsValues[i];

                                  // const primaryUnit =
                                  //   currentItem?.Primary_Unit ||
                                  //   availableUnits?.[0]?.Unit_Shorthand ||
                                  //   "";

                                  // const secondaryUnit =
                                  //   currentItem?.Secondary_Unit ||
                                  //   availableUnits?.find(
                                  //     (u) => u.Unit_Shorthand !== primaryUnit
                                  //   )?.Unit_Shorthand ||
                                  //   "";

                                  // const conversionRate =
                                  //   Number(currentItem?.Conversion_Rate) || 0;
                                  // const row = rows[i];

                                  // const availableUnits = Array.isArray(row?.Available_Units)
                                  //   ? row.Available_Units
                                  //   : [];

                                  const primaryUnit =
                                    row?.Primary_Unit ||
                                    availableUnits?.[0]?.Unit_Shorthand ||
                                    "";

                                  const secondaryUnit =
                                    row?.Secondary_Unit ||
                                    availableUnits?.find(
                                      (u) => u.Unit_Shorthand !== primaryUnit
                                    )?.Unit_Shorthand ||
                                    "";

                                  const conversionRate =
                                    Number(row?.Conversion_Rate) || 0;

                                  if (
                                    previousUnit &&
                                    newUnit &&
                                    previousUnit !== newUnit &&
                                    primaryUnit &&
                                    secondaryUnit &&
                                    conversionRate > 0
                                  ) {
                                    //const currentPrice = Number(itemsValues[i]?.Purchase_Price) || 0;

                                    //let newPrice = currentPrice;

                                    // switching FROM primary TO secondary — price per unit gets smaller
                                    // if (previousUnit === primaryUnit && newUnit === secondaryUnit) {
                                    //   newPrice = currentPrice / conversionRate;
                                    // }
                                    // // switching FROM secondary TO primary — price per unit gets bigger
                                    // else if (previousUnit === secondaryUnit && newUnit === primaryUnit) {
                                    //   newPrice = currentPrice * conversionRate;
                                    // }

                                    //const roundedPrice = newPrice.toFixed(2);
                                    const basePrice = Number(baseSalePriceRef.current[i]) || 0;

                                    // if (basePrice <= 0) {
                                    //   return;
                                    // }

                                    // let newPrice = basePrice;

                                    // =====================================================
                                    // PRIMARY → SECONDARY
                                    // Example:
                                    // ₹45 / Kg
                                    // 1 Kg = 1000 Gm
                                    // ₹45 / 1000 = ₹0.045
                                    // UI allows only 2 decimals → ₹0.05
                                    // =====================================================

                                    // if (
                                    //   previousUnit === primaryUnit &&
                                    //   newUnit === secondaryUnit
                                    // ) {
                                    //   newPrice = basePrice / conversionRate;
                                    // }

                                    // =====================================================
                                    // SECONDARY → PRIMARY
                                    // IMPORTANT:
                                    // Do NOT use current displayed price.
                                    // Restore original base price.
                                    // =====================================================

                                    // else if (
                                    //   previousUnit === secondaryUnit &&
                                    //   newUnit === primaryUnit
                                    // ) {
                                    //   newPrice = basePrice;
                                    // }

                                    // else {
                                    //   return;
                                    // }

                                    // const roundedPrice = newPrice.toFixed(2);

                                    const baseUnit = baseSaleUnitRef.current[i];

                                    if (basePrice <= 0 || !baseUnit) {
                                      return;
                                    }

                                    let newPrice;

                                    if (newUnit === baseUnit) {
                                      // Back to the unit in which the price was entered
                                      newPrice = basePrice;
                                    }

                                    else if (
                                      baseUnit === primaryUnit &&
                                      newUnit === secondaryUnit
                                    ) {
                                      // Primary → Secondary
                                      newPrice = basePrice / conversionRate;
                                    }

                                    else if (
                                      baseUnit === secondaryUnit &&
                                      newUnit === primaryUnit
                                    ) {
                                      // Secondary → Primary
                                      newPrice = basePrice * conversionRate;
                                    }

                                    else {
                                      return;
                                    }

                                    const roundedPrice = newPrice.toFixed(2);





                                    setValue(`items.${i}.Sale_Price`, roundedPrice, { shouldValidate: true, shouldDirty: true });

                                    // recompute Amount/Tax/Total with the new price
                                    const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                      { ...itemsValues[i], Sale_Price: roundedPrice },
                                      i,
                                      itemsValues
                                    );

                                    setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                    setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                    setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                                    setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                                  }
                                }}
                              >
                                {availableUnits.length > 0 ? (
                                  availableUnits.map((unit) => (
                                    <option key={unit.Unit_Shorthand} value={unit.Unit_Shorthand}>
                                      {unit.Unit_Name} ({unit.Unit_Shorthand})
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="">NONE</option>
                                    {Array.isArray(itemUnits) &&
                                      itemUnits.map((unit) => (
                                        <option key={unit.Unit_Shorthand} value={unit.Unit_Shorthand}>
                                          {unit.Unit_Name} ({unit.Unit_Shorthand})
                                        </option>
                                      ))}
                                    <option value="__ADD_UNIT__">➕ Add Unit</option>
                                  </>
                                )}
                              </select>
                            );
                          }}
                        />

                        {errors?.items?.[i]?.Item_Unit && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[i].Item_Unit.message}</p>
                        )}
                      </td> */}
                      <td style={{ padding: "0px", width: "10%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Item_Unit`}
                          render={({ field }) => {
                            const row = rows[i];
                            const availableUnits = Array.isArray(row?.Available_Units) ? row.Available_Units : [];
                            //const allUnits = availableUnits.length > 0 ? availableUnits : (Array.isArray(itemUnits) ? itemUnits : []);
                            const allUnits =
                              availableUnits.length > 0
                                ? availableUnits
                                : (Array.isArray(itemUnits) ? itemUnits : []);


                            const hasPrimary = !!row?.Primary_Unit;
                            const hasSecondary = !!row?.Secondary_Unit;

                            let unitsWithNone = [];

                            if (!hasPrimary && !hasSecondary) {
                              // No units configured → show None + all master units
                              unitsWithNone = [
                                {
                                  Unit_Name: "None",
                                  Unit_Shorthand: "",
                                },
                                ...(Array.isArray(itemUnits) ? itemUnits : []),
                              ];
                            } else {
                              // Item has its own units
                              unitsWithNone = allUnits;
                            }



                            const selectedLabel = unitsWithNone.find(
                              u => u.Unit_Shorthand === field.value
                            );

                            const getUnitLabel = (unit) =>
                              unit?.Unit_Shorthand
                                ? `${unit.Unit_Name} (${unit.Unit_Shorthand})`
                                : unit.Unit_Name;
                            const displayLabel = selectedLabel
                              ? getUnitLabel(selectedLabel)
                              : "";
                            const filtered = unitsWithNone.filter((u) => {
                              const label = getUnitLabel(u).toLowerCase();

                              return label.includes(
                                (rows[i]?.unitSearch || "").toLowerCase()
                              );
                            });
                            return (
                              <div
                                //  ref={unitRef} 
                                ref={(el) => (unitRefs.current[i] = el)}
                                style={{ position: "relative", width: "100%" }}>


                                <input
                                  readOnly
                                  value={displayLabel}
                                  onClick={() => {
                                    handleRowChange(i, "unitOpen", true);
                                    handleRowChange(i, "itemOpen", false);
                                    handleRowChange(i, "CategoryOpen", false);
                                  }}
                                />

                                {rows[i]?.unitOpen && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      zIndex: 30,
                                      width: "180px",
                                      background: "white",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 6,
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                      marginTop: 2,
                                      maxHeight: 180,
                                      overflowY: "auto",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="Search unit..."
                                      value={rows[i]?.unitSearch || ""}
                                      // value={unitSearch}
                                      onChange={(e) =>
                                        handleRowChange(i, "unitSearch", e.target.value)
                                      }
                                      //onChange={(e) => setUnitSearch(e.target.value)}
                                      style={{
                                        width: "100%",
                                        marginBottom: 0,

                                      }}
                                    />
                                    {!hasPrimary && !hasSecondary && (
                                      <div
                                        onClick={() => {
                                          setActiveUnitRow(i);
                                          setShowAddUnitModal(true);

                                          handleRowChange(i, "unitOpen", false);
                                          handleRowChange(i, "unitSearch", "");
                                        }}
                                        style={{
                                          padding: "8px 10px",
                                          borderBottom: "1px solid #e5e7eb",
                                          cursor: "pointer",
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: "#4CA1AF",
                                          background: "#f8fafc",
                                        }}
                                      >
                                        + Add Unit
                                      </div>
                                    )}
                                    {filtered.length === 0 ? (
                                      <div
                                        onClick={() => {
                                          field.onChange("");

                                          setValue(
                                            `items.${i}.Item_Unit`,
                                            "",
                                            {
                                              shouldValidate: true,
                                              shouldDirty: true,
                                            }
                                          );

                                          handleRowChange(i, "unitOpen", false);
                                          handleRowChange(i, "unitSearch", "");

                                          //setUnitSearch("");
                                        }}
                                        style={{
                                          padding: "6px 10px",
                                          fontSize: 12,
                                          //color: "#9ca3af",
                                          backgroundColor:
                                            field.value === "" ? "#eaf6f7" : "transparent",
                                          color:
                                            field.value === "" ? "#4CA1AF" : "#374151",
                                          fontWeight:
                                            field.value === "" ? 500 : 400,
                                        }}
                                      >
                                        None
                                      </div>
                                    ) : (
                                      filtered.map((unit) => {
                                        const isSelected =
                                          field.value === unit.Unit_Shorthand;

                                        return (
                                          <div
                                            key={unit.Unit_Shorthand}
                                            onClick={() => {
                                              const newUnit = unit.Unit_Shorthand;

                                              const previousUnit = field.value;

                                              field.onChange(newUnit);

                                              handleRowChange(
                                                i,
                                                "Item_Unit",
                                                newUnit
                                              );

                                              setValue(
                                                `items.${i}.Item_Unit`,
                                                newUnit,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                }
                                              );

                                              // close dropdown
                                              handleRowChange(i, "unitOpen", false);
                                              handleRowChange(i, "unitSearch", "");

                                              //setUnitSearch("");


                                              const primaryUnit =
                                                row?.Primary_Unit;

                                              const secondaryUnit =
                                                row?.Secondary_Unit;

                                              const conversionRate =
                                                Number(
                                                  row?.Conversion_Rate
                                                ) || 0;

                                              if (
                                                previousUnit &&
                                                newUnit &&
                                                previousUnit !== newUnit &&
                                                primaryUnit &&
                                                secondaryUnit &&
                                                conversionRate > 0
                                              ) {
                                                const basePrice = Number(baseSalePriceRef.current[i]) || 0;

                                                const baseUnit = baseSaleUnitRef.current[i];

                                                if (
                                                  basePrice <= 0 ||
                                                  !baseUnit
                                                )
                                                  return;

                                                let newPrice;

                                                if (newUnit === baseUnit) {
                                                  newPrice = basePrice;
                                                } else if (
                                                  baseUnit === primaryUnit &&
                                                  newUnit === secondaryUnit
                                                ) {
                                                  newPrice =
                                                    basePrice /
                                                    conversionRate;
                                                } else if (
                                                  baseUnit === secondaryUnit &&
                                                  newUnit === primaryUnit
                                                ) {
                                                  newPrice =
                                                    basePrice *
                                                    conversionRate;
                                                } else {
                                                  return;
                                                }

                                                const roundedPrice =
                                                  newPrice.toFixed(2);

                                                setValue(
                                                  `items.${i}.Sale_Price`,
                                                  roundedPrice,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );

                                                const {
                                                  Tax_Amount,
                                                  Amount,
                                                  Total_Amount,
                                                  Balance_Due,
                                                } = calculateRowAmount(
                                                  {
                                                    ...itemsValues[i],
                                                    Sale_Price:
                                                      roundedPrice,
                                                  },
                                                  i,
                                                  itemsValues
                                                );

                                                setValue(
                                                  `items.${i}.Tax_Amount`,
                                                  Tax_Amount,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );

                                                setValue(
                                                  `items.${i}.Amount`,
                                                  Amount,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );
                                                syncTotalsAfterItemChange();

                                                // setValue(
                                                //   "Total_Amount",
                                                //   Total_Amount,
                                                //   {
                                                //     shouldValidate: true,
                                                //     shouldDirty: true,
                                                //   }
                                                // );

                                                // setValue(
                                                //   "Balance_Due",
                                                //   Balance_Due,
                                                //   {
                                                //     shouldValidate: true,
                                                //     shouldDirty: true,
                                                //   }
                                                // );
                                              }
                                            }}
                                            style={{
                                              padding: "6px 10px",
                                              fontSize: 12,
                                              cursor: "pointer",
                                              backgroundColor: isSelected
                                                ? "#eaf6f7"
                                                : "transparent",
                                              color: isSelected
                                                ? "#4CA1AF"
                                                : "#374151",
                                              fontWeight: isSelected
                                                ? 500
                                                : 400,
                                            }}
                                          >
                                            {getUnitLabel(unit)}
                                            {/* {unit.Unit_Name} (
                                                                                                                                    {unit.Unit_Shorthand}) */}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />

                        {errors?.items?.[i]?.Item_Unit && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[i].Item_Unit.message}</p>
                        )}
                      </td>



                      <td style={{ padding: "0px", width: "6%" }}>
                        <div className="d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control"
                            style={{ width: "100%", marginBottom: "0px" }}
                            {...register(`items.${i}.Sale_Price`)}

                            // onChange={(e) => {
                            //   let val = e.target.value.replace(/[^0-9.]/g, "");
                            //   const parts = val.split(".");
                            //   if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                            //   if (val.includes(".")) {
                            //     const [intPart, decPart] = val.split(".");
                            //     val = intPart + "." + decPart.slice(0, 2);
                            //   }

                            //   e.target.value = val;

                            //   // 🟩 Update RHF internal state FOR VALIDATION
                            //   setValue(`items.${i}.Sale_Price`, val, { shouldValidate: true });
                            //   baseSalePriceRef.current[i] = Number(val) || 0;
                            //   baseSaleUnitRef.current[i] = itemsValues[i]?.Item_Unit || "";
                            //   const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                            //     { ...itemsValues[i], Sale_Price: val },
                            //     i,
                            //     itemsValues
                            //   );

                            //   setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                            //   setValue(`items.${i}.Amount`, Amount);
                            //   syncTotalsAfterItemChange();
                            //   // setValue("Total_Amount", Total_Amount);
                            //   // setValue("Balance_Due", Balance_Due);
                            // }}

                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, "");

                              const parts = val.split(".");
                              if (parts.length > 2) {
                                val = parts[0] + "." + parts.slice(1).join("");
                              }

                              if (val.includes(".")) {
                                const [intPart, decPart] = val.split(".");
                                val = intPart + "." + decPart.slice(0, 2);
                              }

                              e.target.value = val;

                              // Update Sale Price
                              setValue(`items.${i}.Sale_Price`, val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              baseSalePriceRef.current[i] = Number(val) || 0;
                              baseSaleUnitRef.current[i] = itemsValues[i]?.Item_Unit || "";

                              // =====================================================
                              // CALCULATE DISCOUNT ON SALE PRICE BACKWARDS
                              // =====================================================

                              if (showMRP && calculateSalePriceFromMRP) {
                                const mrp =
                                  Number(itemsValues[i]?.MRP) || 0;

                                const enteredSalePrice =
                                  Number(val) || 0;

                                let mrpDiscount = 0;

                                if (mrp > 0 && enteredSalePrice <= mrp) {
                                  mrpDiscount =
                                    ((mrp - enteredSalePrice) / mrp) * 100;
                                }

                                const discountDisplay =
                                  mrpDiscount === 0
                                    ? ""
                                    : mrpDiscount.toFixed(3);

                                setValue(
                                  `items.${i}.Discount_On_MRP_For_Sale_Percentage`,
                                  discountDisplay,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  }
                                );
                              }

                              // Sale discount is always Percentage


                              // =====================================================
                              // RECALCULATE ROW AMOUNT
                              // =====================================================

                              const { Tax_Amount, Amount } = calculateRowAmount(
                                {
                                  ...itemsValues[i],
                                  Sale_Price: val,

                                },
                                i,
                                itemsValues
                              );

                              setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                              setValue(`items.${i}.Amount`, Amount);

                              syncTotalsAfterItemChange();
                            }}


                            placeholder="Price"
                          />

                        </div>
                        {errors?.items?.[i]?.Sale_Price && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Sale_Price.message}
                          </p>
                        )}
                      </td>
                      {/* Discount */}
                      <td style={{ padding: "0px", width: "14%" }}>
                        <div className="d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control"
                            style={{ width: "50%", marginBottom: "0px" }}
                            {...register(`items.${i}.Discount_On_Sale_Price`)}
                            // onInput={(e) => {
                            //   e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            //   //                 const { Tax_Amount, Amount ,Total_Amount} = calculateRowAmount({
                            //   //   ...itemsValues[i],

                            //   //   Discount_On_Purchase_Price: e.target.value,

                            //   // });
                            //   const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                            //     { ...itemsValues[i], Discount_On_Sale_Price: e.target.value },
                            //     i,
                            //     itemsValues
                            //   );

                            //   setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
                            //   setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
                            //   setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                            //   setValue("Balance_Due", Balance_Due, { shouldValidate: true });
                            //   // setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                            //   // setValue(`items.${i}.Amount`, Amount);

                            // }}
                            onInput={(e) => {
                              let val = e.target.value;

                              // allow digits + 1 dot
                              val = val.replace(/[^0-9.]/g, "");

                              const parts = val.split(".");
                              if (parts.length > 2) {
                                val = parts[0] + "." + parts.slice(1).join("");
                              }

                              if (val.includes(".")) {
                                const [int, dec] = val.split(".");
                                val = int + "." + dec.slice(0, 2);
                              }

                              e.target.value = val;

                              const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                { ...itemsValues[i], Discount_On_Sale_Price: val },
                                i,
                                itemsValues
                              );

                              setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                              setValue(`items.${i}.Amount`, Amount);
                              syncTotalsAfterItemChange();
                              // setValue("Total_Amount", Total_Amount);
                              // setValue("Balance_Due", Balance_Due);
                            }}
                            placeholder="Discount"
                          />
                          <Controller
                            control={control}
                            name={`items.${i}.Discount_Type_On_Sale_Price`}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="form-select ms-2"
                                style={{ width: "50%", fontSize: "12px" }}
                                onChange={(e) => {
                                  field.onChange(e); // ✅ let RHF handle its state

                                  // const { Tax_Amount, Amount,Total_Amount } = calculateRowAmount({
                                  //   ...itemsValues[i],
                                  //   Discount_Type_On_Purchase_Price: e.target.value,
                                  // });

                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    { ...itemsValues[i], Discount_Type_On_Sale_Price: e.target.value },
                                    i,
                                    itemsValues
                                  );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
                                  setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
                                  syncTotalsAfterItemChange();
                                  // setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                                  // setValue("Balance_Due", Balance_Due, { shouldValidate: true });
                                }}
                              >
                                <option value="Percentage">%</option>
                                <option value="Amount">Amount</option>
                              </select>
                            )}
                          />
                        </div>
                      </td>


                      {/* <td style={{ padding: "0px", width: "12%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Tax_Type`} // ✅ remove disabled here
                          render={({ field }) => (
                            <select
                              {...field}
                              className="form-select bg-gray-100 text-gray-700"
                              // style={{
                              //   width: "100%",
                              //   fontSize: "12px",
                              //   marginBottom: "0px",
                              //   pointerEvents: "none", // ✅ visually disabled
                              //   cursor: "not-allowed",
                              //   backgroundColor: "#f3f4f6", // light gray
                              // }}
                              onChange={(e) => {
                                field.onChange(e);

                                // ✅ Recalculate amounts on Tax_Type change
                                const { Tax_Amount, Amount, Total_Amount, Balance_Due } =
                                  calculateRowAmount(
                                    { ...itemsValues[i], Tax_Type: e.target.value },
                                    i,
                                    itemsValues
                                  );

                                setValue(`items.${i}.Tax_Amount`, Tax_Amount, {
                                  shouldValidate: true,
                                });
                                setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
                                syncTotalsAfterItemChange();
                                // setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                                // setValue("Balance_Due", Balance_Due, { shouldValidate: true });
                              }}
                            >
                              <option value="None">None</option>
                              <option value="GST0">GST @0%</option>
                              <option value="IGST0">IGST @0%</option>
                              <option value="GST0.25">GST @0.25%</option>
                              <option value="IGST0.25">IGST @0.25%</option>
                              <option value="GST3">GST @3%</option>
                              <option value="IGST3">IGST @3%</option>
                              <option value="GST5">GST @5%</option>
                              <option value="IGST5">IGST @5%</option>
                              <option value="GST12">GST @12%</option>
                              <option value="IGST12">IGST @12%</option>
                              <option value="GST18">GST @18%</option>
                              <option value="IGST18">IGST @18%</option>
                              <option value="GST28">GST @28%</option>
                              <option value="IGST28">IGST @28%</option>
                              <option value="GST40">GST @40%</option>
                              <option value="IGST40">IGST @40%</option>
                            </select>
                          )}
                        />
                      </td> */}
                      {/* Tax Amount Entry */}
                      <td style={{ padding: "0px", width: "12%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Tax_Type`}
                          render={({ field }) => {
                            const originalTaxType =
                              originalTaxTypesRef.current[i] || "None";

                            return (
                              <select
                                {...field}
                                className="form-select bg-gray-100 text-gray-700"
                                onChange={(e) => {
                                  field.onChange(e);

                                  // Recalculate amounts on Tax_Type change
                                  const {
                                    Tax_Amount,
                                    Amount,
                                  } = calculateRowAmount(
                                    {
                                      ...itemsValues[i],
                                      Tax_Type: e.target.value,
                                    },
                                    i,
                                    itemsValues
                                  );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, {
                                    shouldValidate: true,
                                  });

                                  setValue(`items.${i}.Amount`, Amount, {
                                    shouldValidate: true,
                                  });

                                  syncTotalsAfterItemChange();
                                }}
                              >
                                {/* Always show None */}
                                <option value="None">None</option>

                                {enableGST ? (
                                  <>
                                    <option value="GST0">GST @0%</option>
                                    <option value="IGST0">IGST @0%</option>

                                    <option value="GST0.25">GST @0.25%</option>
                                    <option value="IGST0.25">IGST @0.25%</option>

                                    <option value="GST3">GST @3%</option>
                                    <option value="IGST3">IGST @3%</option>

                                    <option value="GST5">GST @5%</option>
                                    <option value="IGST5">IGST @5%</option>

                                    <option value="GST12">GST @12%</option>
                                    <option value="IGST12">IGST @12%</option>

                                    <option value="GST18">GST @18%</option>
                                    <option value="IGST18">IGST @18%</option>

                                    <option value="GST28">GST @28%</option>
                                    <option value="IGST28">IGST @28%</option>

                                    <option value="GST40">GST @40%</option>
                                    <option value="IGST40">IGST @40%</option>
                                  </>
                                ) : (
                                  /* GST OFF:
                                     Show None + original saved tax type */
                                  originalTaxType !== "None" && (
                                    <option value={originalTaxType}>
                                      {originalTaxType.startsWith("GST")
                                        ? `GST @${originalTaxType.replace("GST", "")}%`
                                        : originalTaxType.startsWith("IGST")
                                          ? `IGST @${originalTaxType.replace("IGST", "")}%`
                                          : originalTaxType}
                                    </option>
                                  )
                                )}
                              </select>
                            );
                          }}
                        />
                      </td>



                      {/* Tax Amount */}
                      <td style={{ width: "8%" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ backgroundColor: "transparent" }}
                          {...register(`items.${i}.Tax_Amount`)}
                          readOnly
                        />
                      </td>

                      {/* Amount */}
                      <td style={{ width: "8%" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ backgroundColor: "transparent" }}
                          {...register(`items.${i}.Amount`)}
                          readOnly
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}></td>
                    <td>Total</td>
                    <td></td>
                    {shouldShowMRP && <td></td>}

                    {/* MRP Discount column */}
                    {showMRP && calculateSalePriceFromMRP && <td></td>}

                    <td className="text-right">
                      {totals.totalQty}
                    </td>

                    <td></td>
                    <td></td>

                    <td className="text-right">
                      ₹{totals.totalDiscount.toFixed(2)}
                    </td>

                    <td></td>

                    <td className="text-right">
                      ₹{totals.totalTax.toFixed(2)}
                    </td>

                    <td className="text-right">
                      ₹{totals.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>


              </table>

              <div className="flex sm:w-1/4 p-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full sm:w-auto whitespace-nowrap text-white font-bold py-2 px-4 rounded"
                  style={{ backgroundColor: "#4CA1AF" }}
                >
                  + Add Row
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-4 w-full sale-wrapper">
                <div className="flex flex-col px-2">
                  {/* <div className="flex flex-col px-2 w-full  sale-left"> */}


                  <div className="flex flex-col mt-3 gap-2 w-full sm:w-128">
                    {!showSplitBox ? (
                      <>
                        <div className="flex flex-col w-full">
                          <span className="active">Payment Type</span>

                          {/* Hidden field so RHF tracks/validates splits.0.Payment_Type even though
                               it's driven by setValue in the onChange below, not a native <select {...register}> */}
                          <input
                            type="hidden"
                            {...register("splits.0.Payment_Type", { required: "Payment Type is required" })}
                          />


                          <PaymentTypeSelect
                            value={
                              paymentType === "Bank"
                                ? `bank_${watch("splits.0.Bank_Account_Id") || ""}`
                                : paymentType || ""
                            }
                            banks={banks}
                            onAddBank={() => setShowBankModal(true)}
                            onChange={(val) => {
                              if (val.startsWith("bank_")) {
                                const bankId = val.replace("bank_", "");
                                setValue("splits.0.Payment_Type", "Bank", { shouldValidate: true, shouldDirty: true });
                                setValue("splits.0.Bank_Account_Id", Number(bankId), { shouldValidate: true, shouldDirty: true });
                              } else {
                                setValue("splits.0.Payment_Type", val, { shouldValidate: true, shouldDirty: true });
                                setValue("splits.0.Bank_Account_Id", null, { shouldValidate: true, shouldDirty: true });
                              }
                            }}
                          />

                          {errors?.splits?.[0]?.Payment_Type && (
                            <p className="text-red-500 text-xs mt-1">{errors.splits[0].Payment_Type.message}</p>
                          )}
                        </div>


                        {(paymentType === "Bank" || paymentType === "Cheque" || paymentType === "Neft") && (
                          <div className="mt-3 flex flex-col">
                            <label className="text-sm">Reference Number</label>
                            <input
                              type="text"
                              //readOnly={isView}
                              style={{ marginBottom: "0px" }}
                              {...register("splits.0.Reference_Number")}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleAddPaymentType}
                          className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
                          style={{ background: "transparent", border: "none", padding: 0 }}
                        >
                          + Add Payment Type
                        </button>
                      </>
                    ) : (
                      <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3">
                        {splitFields.map((field, index) => {
                          const rowType = watch(`splits.${index}.Payment_Type`);
                          const needsRef = rowType === "Cheque" || rowType === "Neft" || rowType === "Bank";
                          //const rowOptions = getAvailableOptions(index);
                          const currentIdentifier = getRowIdentifier(rowType, watch(`splits.${index}.Bank_Account_Id`));
                          const amountField = register(`splits.${index}.Amount`, {
                            required: "Required",
                            validate: (v) => (v !== "" && Number(v) > 0) || "Enter valid amount",
                          });
                          const usedValues = splitsWatch
                            .map((s, idx) => {
                              if (idx === index) return null; // exclude current row
                              return s.Payment_Type === "Bank"
                                ? `bank_${s.Bank_Account_Id}`
                                : s.Payment_Type || null;
                            }).filter(Boolean);

                          return (
                            <div key={field.id} className="flex flex-col gap-2">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                <div className="flex flex-col flex-1">
                                  <span className="text-xs text-gray-500 mb-1">Payment Type</span>
                                  {/* <select
                                    value={currentIdentifier || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val.startsWith("bank_")) {
                                        setValue(`splits.${index}.Payment_Type`, "Bank", { shouldValidate: true });
                                        setValue(`splits.${index}.Bank_Account_Id`, Number(val.replace("bank_", "")), { shouldValidate: true });
                                      } else {
                                        setValue(`splits.${index}.Payment_Type`, val, { shouldValidate: true });
                                        setValue(`splits.${index}.Bank_Account_Id`, null, { shouldValidate: true });
                                      }
                                    }}
                                    className="border rounded-md px-2 py-1.5"
                                  >
                                    <option value="">Select Type</option>
                                    {rowOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select> */}
                                  <PaymentTypeSelect
                                    value={currentIdentifier || ""}
                                    banks={banks}
                                    onAddBank={() => setShowBankModal(true)}
                                    usedValues={usedValues}
                                    onChange={(val) => {
                                      if (val.startsWith("bank_")) {
                                        setValue(`splits.${index}.Payment_Type`, "Bank", { shouldValidate: true });
                                        setValue(`splits.${index}.Bank_Account_Id`, Number(val.replace("bank_", "")), { shouldValidate: true });
                                      } else {
                                        setValue(`splits.${index}.Payment_Type`, val, { shouldValidate: true });
                                        setValue(`splits.${index}.Bank_Account_Id`, null, { shouldValidate: true });
                                      }
                                    }}
                                  />
                                </div>

                                <div className="flex flex-col flex-1">
                                  <span className="text-xs text-gray-500 mb-1">Amount</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Amount"
                                    style={{ marginBottom: "0px", width: "80%" }}
                                    className="border rounded-md px-2 py-1.5"
                                    {...amountField}
                                    onChange={(e) => {
                                      e.target.value = sanitizeAmount(e.target.value);
                                      amountField.onChange(e);
                                      clearErrors(`splits.${index}.Amount`);
                                    }}
                                  />
                                  {errors?.splits?.[index]?.Amount && (
                                    <p className="text-red-500 text-xs mt-1">{errors.splits[index].Amount.message}</p>
                                  )}
                                </div>

                                {splitFields.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSplit(index)}
                                    className="text-gray-500 mb-2 mt-4"
                                    style={{ background: "transparent", border: "none" }}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>

                              {needsRef && (
                                <input
                                  type="text"
                                  placeholder="Reference Number"
                                  style={{ width: "80%" }}
                                  // className="border rounded-md px-2 py-1.5 w-full"
                                  {...register(`splits.${index}.Reference_Number`)}
                                />
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() =>
                            appendSplit({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" })
                          }
                          className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
                          style={{ background: "transparent", border: "none" }}
                        >
                          + Add Another Payment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* <div style={{ width: "100%" }}
                                     className="grid grid-rows-2 gap-2 w-full sm:w-1/2 lg:w-1/3 ml-auto mr-2 sale-right"
                                     > */}

                <div style={{ width: "100%" }}
                  className="grid grid-rows-2 gap-2 w-full sm:w-1/2 lg:w-1/3 ml-auto mr-2 "
                >

                  <div style={{ width: "100%" }}
                    className="flex justify-between items-start gap-6 w-full mr-4">
                    {/* <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="roundOffCheck"
                        className="w-4 h-4 cursor-pointer"
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const totalAmount = parseFloat(watch("Total_Amount"));
                          const totalReceived = parseFloat(watch("Total_Paid")) || 0;

                          if (!totalAmount || isNaN(totalAmount)) return;

                          if (isChecked) {
                            setOriginalTotal(totalAmount);

                            // Round off to nearest integer
                            const rounded = Math.round(totalAmount);

                            setValue("Total_Amount", rounded.toFixed(2), { shouldValidate: true });
                            setValue("Balance_Due", (rounded - totalReceived).toFixed(2), { shouldValidate: true });

                          } else {
                            if (originalTotal !== null) {
                              setValue("Total_Amount", originalTotal.toFixed(2), { shouldValidate: true });

                              setValue(
                                "Balance_Due",
                                (originalTotal - totalReceived).toFixed(2),
                                { shouldValidate: true }
                              );
                            }
                          }
                        }}
                      />

                      <span className="font-medium whitespace-nowrap">Round Off</span>


                      <input

                        type="text"

                        style={{ marginTop: "10px", width: "60px", height: "1.5rem" }}
                        className="w-3  border border-gray-300  text-right text-sm"
                        {...register("Round_Off")}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const totalAmount = originalTotal ?? parseFloat(watch("Total_Amount"));
                          const totalReceived = parseFloat(watch("Total_Paid")) || 0;

                          if (isNaN(totalAmount)) return;

                          // New Total
                          const newTotal = totalAmount + val;

                          setValue("Total_Amount", newTotal.toFixed(2));
                          setValue("Balance_Due", (newTotal - totalReceived).toFixed(2));
                        }}
                      //disabled={!watch("roundOffCheck") && originalTotal === null}
                      />
                    </div> */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="roundOffCheck"
                        className="w-4 h-4 cursor-pointer"
                        checked={isRoundOff}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setIsRoundOff(isChecked);

                          const rawTotal = getRawTotal();

                          if (isChecked) {
                            const rounded = Math.round(rawTotal);
                            const diff = Number((rounded - rawTotal).toFixed(2));
                            setValue("Round_Off", diff !== 0 ? diff.toFixed(2) : "", { shouldValidate: true, shouldDirty: true });
                            applyRoundOff(diff);
                          } else {
                            setValue("Round_Off", "", { shouldValidate: true, shouldDirty: true });
                            applyRoundOff(0);
                          }
                        }}
                      />

                      <span className="font-medium whitespace-nowrap">Round Off</span>

                      <input
                        type="text"
                        style={{ marginTop: "10px", width: "60px", height: "1.5rem" }}
                        className="border border-gray-300 text-right text-sm"
                        {...register("Round_Off")}
                        disabled={!isRoundOff}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("Round_Off", val, { shouldValidate: true, shouldDirty: true });
                          const numVal = parseFloat(val) || 0;
                          applyRoundOff(numVal);
                        }}
                      />
                    </div>

                    <div style={{ width: "100%" }} className="flex flex-col gap-4 mt-3 w-full">
                      <div className="flex gap-3 items-center  w-full sm:w-auto">

                        <div style={{ width: "100%" }} className="flex gap-2 ">
                          <span className="font-medium whitespace-nowrap">Total Amount</span>

                          <input
                            style={{ backgroundColor: "transparent", height: "1rem" }}
                            type="text"
                            className="form-control"
                            {...register("Total_Amount")}
                            readOnly
                          />
                        </div>
                      </div>



                      <div style={{ width: "100%" }} className="flex items-center  gap-3 relative ">

                        <div className="flex items-center gap-2 relative">

                          <input
                            type="checkbox"


                            id="totalPaidCheck"
                            className="w-4 h-4 cursor-pointer"
                            disabled={splitsWatch.length > 1}   // 🔹 add this

                            onChange={(e) => {

                              const isChecked = e.target.checked;
                              const totalAmount = parseFloat(watch("Total_Amount"));

                              // 🧠 If no total amount entered, do nothing
                              if (!totalAmount || isNaN(totalAmount)) {
                                // Optional: visually reset the checkbox


                                // Clear both fields to stay consistent
                                setValue("Total_Paid", "");
                                setValue("Balance_Due", "");
                                if (splitsWatch.length === 1) {
                                  setValue("splits.0.Amount", "", { shouldValidate: true, shouldDirty: true });
                                }
                                return;
                              }

                              if (isChecked) {
                                // ✅ Set Total_Paid = Total_Amount, Balance_Due = 0
                                setValue("Total_Paid", totalAmount.toFixed(2));
                                setValue("Balance_Due", 0);
                              } else {
                                // ✅ When unchecked, restore Balance_Due = Total_Amount
                                setValue("Total_Paid", "");
                                setValue("Balance_Due", totalAmount.toFixed(2));
                              }
                              if (splitsWatch.length === 1) {
                                setValue(
                                  "splits.0.Amount",
                                  isChecked ? totalAmount.toFixed(2) : "",
                                  { shouldValidate: true, shouldDirty: true }
                                );
                              }
                            }}
                          />
                          <span
                            htmlFor="totalPaidCheck"
                            className="font-medium whitespace-nowrap"
                          >
                            Total Paid
                          </span>

                        </div>


                        <input
                          type="text"
                          {...register("Total_Paid")}
                          style={{ marginBottom: "0px", height: "1rem", width: "100%" }}
                          readOnly={splitsWatch.length > 1}
                          onChange={(e) => {
                            if (splitsWatch.length > 1) return;
                            let val = e.target.value.replace(/[^0-9.]/g, "");

                            // Allow only one dot
                            const parts = val.split(".");
                            if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");

                            // Limit to 2 decimals
                            if (val.includes(".")) {
                              const [int, dec] = val.split(".");
                              val = int + "." + dec.slice(0, 2);
                            }

                            e.target.value = val;
                            setValue("Total_Paid", val);

                            const totalReceived = parseFloat(val || 0);
                            const totalAmount = parseFloat(watch("Total_Amount") || 0);
                            setValue("Balance_Due", (totalAmount - totalReceived).toFixed(2));
                            if (splitsWatch.length === 1) {
                              const val = e.target.value;
                              setValue("splits.0.Amount", val, { shouldValidate: true, shouldDirty: true });
                            }
                            clearErrors("splits.0.Amount"); // already there ✅
                          }}
                          className="form-control"
                        />
                      </div>




                      <div style={{ width: "100%" }}
                        className="flex  gap-2 items-center ">

                        <span className="font-medium whitespace-nowrap">Balance Due</span>
                        <input
                          style={{
                            backgroundColor: "transparent", marginBottom: "0px",
                            height: "1rem", width: "100%"
                          }}
                          type="text"
                          className="form-control  "
                          {...register("Balance_Due")}

                          readOnly
                        />
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              {/* <button
                      type="button"
                     
                      onClick={() => {
                        if (from === "party-sales-purchases-details") {

                          navigate({
                            pathname: `/party/party-sales-purchases-details/${Party_Id}`,
                            search: location.search,
                          })
                          
                        } 
                        else if (from === "item-sales-purchases-details") {
                          navigate({
                            pathname: `/item/item-sales-purchases-details/${Item_Id}`,
                            search: location.search,
                          })
                          // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
                        } 
                        else {
                          navigate({
                            pathname: "/sale/all-sales",
                            search: location.search,
                          })

                          // navigate("/sale/all-sales");
                        }
                      }}
                      // onClick={() => navigate("/sale/all-sales")}
                      className=" text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "#4CA1AF" }}
                    >
                      Cancel
                    </button> */}
              <button
                type="submit"
                disabled={formValues.errorCount > 0 || isCreating}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isCreating ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

        </div>


      </div>
      {showScanCodeModal && (
        <ScanCodeModal
          onClose={() => setShowScanCodeModal(false)}
          onSave={handleScanSave}
        //items={items?.items || []}

        />
      )}
      {showAddUnitModal && (
        <AddUnitModal
          onClose={() => {
            setShowAddUnitModal(false);
            setActiveUnitRow(null);
          }}
          onSave={(newUnit) => {
            setValue(
              `items.${activeUnitRow}.Item_Unit`,
              newUnit.Unit_Shorthand,
              { shouldValidate: true, shouldDirty: true }
            );

            handleRowChange(
              activeUnitRow,
              "Item_Unit",
              newUnit.Unit_Shorthand
            );

            setShowAddUnitModal(false);
            setActiveUnitRow(null);
          }}

        />
      )}
      {showItemAddModal && (
        <AddItemModal
          onClose={() => {
            setShowItemAddModal(false);

            if (activeItemRow !== null) {
              handleRowChange(activeItemRow, "itemOpen", true);
            }
          }}
          onSave={async (savedItem) => {
            if (!savedItem || typeof savedItem !== "object") {
              setShowItemAddModal(false);
              return;
            }

            await refetchItems();

            // setNewlyAddedItem(savedItem);

            // setTimeout(() => {
            //   setNewlyAddedItem(null);
            // }, 8000);

            setShowItemAddModal(false);

            // Reopen the SAME row's dropdown
            if (activeItemRow !== null) {
              handleRowChange(activeItemRow, "itemOpen", true);
            }

            setActiveItemRow(null);
          }}
        />
      )}
      {showBankModal && (
        <BankAccountModal
          mode="add"
          onClose={() => {
            setShowBankModal(false);
            dispatch(bankAccountApi.util.invalidateTags(["BankAccount"]));
          }}
          onSave={() => {
            refetchBanks();   // 🔹 refetch so new bank appears in dropdown
            setShowBankModal(false);

          }}
        />
      )}
      <style>
        {`
  /*  screens between 1000px and 640px */
  @media (max-width: 1000px) and (min-width: 641px) {

    /* Keep sale-wrapper horizontal but avoid tight spacing */
    .sale-wrapper{
      flex-direction: row !important;
      gap: 10px !important;
    }

    /* Left section slightly wider */
    .sale-left {
      width: 45% !important;
    }

    /* Right section slightly narrower */
    .sale-right {
      width: 55% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* Inputs must not stretch too much */
    .sale-right > div > input {
      width: 80% !important;
    }

    /* Select dropdowns also */
    .state-of-supply-class > select {
      width: 80% !important;
    }

    /* Party, Invoice, GSTIN fields */
    .party-class,
    .invoice-number-class,
    .gstin-class,
    .invoice-date-class,
    .state-of-supply-class {
      width: 100% !important;
    }
  }

@media (max-width: 640px) {

  /* Make Party + GSTIN stack vertically */
  .heading-wrapper {
    flex-direction: column !important;
    gap: 16px !important;
    width: 100% !important;
  }

  /* Fix Party container */
  .party-class {
    width: 100% !important;
  }

  /* Make Party input full width */
  .party-class input {
    width: 100% !important;
  }



  /* GSTIN block full width */
  .gstin-class {
    width: 100% !important;
    justify-content: flex-start !important;
  }

  /* GSTIN input also full width */
  .gstin-class input {
    width: 80% !important;
  }
  .party-class input {
    width: 80% !important;
  }
}

  /* below 640px */
  @media (max-width: 640px) {

  .party-class{
     width: 95% !important;
  }
    .invoice-number-class,
    .gstin-class,
    .invoice-date-class,
    .state-of-supply-class {
      width: 100% !important;
    }

    .state-of-supply-class > select {
      width: 100% !important;
    }

    .sale-wrapper {
      flex-direction: column !important;
      gap: 20px !important;
    }

    .sale-left {
      width: 100% !important;
    }

    .sale-right {
      width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .sale-right > div {
      width: 100% !important;
    }

    .sale-right > div > input {
      width: 100% !important;
    }

    .sale-input {
      width: 100% !important;
    }

    .sale-checkbox-label {
      padding-left: 30px !important;
    }
  }
       .item-dropdown-scroll {
  scrollbar-width: auto;
  scrollbar-color: #94a3b8 #f1f5f9;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.item-dropdown-scroll::-webkit-scrollbar { width: 14px; }
.item-dropdown-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.item-dropdown-scroll::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
  border-radius: 8px;
  border: 3px solid #f1f5f9;
}
.item-dropdown-scroll::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
`}
      </style>
    </>
  );
}
