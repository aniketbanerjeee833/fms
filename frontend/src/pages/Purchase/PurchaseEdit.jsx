import { useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { purchaseFormSchema } from "../../schema/purchaseFormSchema";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi, useAddCategoryMutation, useGetAllCategoriesQuery, useGetAllItemsQuery } from "../../redux/api/itemApi";
import { useRef } from "react";
import { useEffect } from "react";

import { purchaseApi, useEditPurchaseMutation, useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { toast } from "react-toastify";

import { useDispatch } from "react-redux";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import { LayoutDashboard } from "lucide-react";
import AddUnitModal from "../../components/Modal/AddUnitModal";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";
import { dashboardApi } from "../../redux/api/dashboardApi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";

import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import { Trash2 } from "lucide-react";
import { termsConditionsApi, useGetAllTermsQuery } from "../../redux/api/termsConditionsApi";
import TermsAndConditionsSelector from "../../components/TermsAndConditionSelector";
import AddItemModal from "../../components/Modal/AddItemModal";
import BankAccountModal from "../../components/Modal/BankAccountModal";
import PaymentTypeSelect from "../../components/PaymentTypeSelect";
export default function PurchaseEdit() {
  const location = useLocation();
  const from = location.state?.from

  const Party_Id = location.state?.partyId;
  const Item_Id = location.state?.itemId
  const bankId = location.state?.bankId;
  // const partyId=location.state?.partyId;
  // //console.log("Edit page query:", location.search, from);
  const { id: Purchase_Id } = useParams();
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

  const categoryRefs = useRef([]); // store refs for category dropdowns
  const itemRefs = useRef([]);     // store refs for item dropdowns
  const basePurchasePriceRef = useRef({});
  const basePurchaseUnitRef = useRef({});
  const unitRefs = useRef([]);
  const navigate = useNavigate();
  const { data: parties } = useGetAllPartiesQuery();
  const [showItemAddModal, setShowItemAddModal] = useState(false);
  //const [newlyAddedItem, setNewlyAddedItem] = useState(null);
  const [activeItemRow, setActiveItemRow] = useState(null);
  // find this line in your code and add refetch:
  const { data: items, refetch: refetchItems } = useGetAllItemsQuery();

  const { data: categories } = useGetAllCategoriesQuery()
  const { data: termsTemplates } = useGetAllTermsQuery("Purchase_Bill");
  console.log(termsTemplates, "termsTemplates");
 const { data: banks = [],refetch: refetchBanks } = useGetAllBankAccountsQuery();
  const { data: purchase }
    = useGetSinglePurchaseQuery(Purchase_Id)
  const [open, setOpen] = useState(false);
  //const[categoryOpen,setCategoryOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  //const[selected,setSelected] = useState([]);
  const [partySearch, setPartySearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  // const dropdownRef=useRef(null);
  // const[search,setSearch] = useState("");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showSplitBox, setShowSplitBox] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showGSTIN, setShowGSTIN] = useState("");
  const [originalTotal, setOriginalTotal] = useState(null);
  const [addCategory] = useAddCategoryMutation();

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [activeUnitRow, setActiveUnitRow] = useState(null);

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
  const { data: itemUnits = [] } = useGetAllItemUnitsQuery();
  // console.log(itemUnits, "itemUnits");
  // const {data: itemUnitsFetched} = useGetAllItemUnitsQuery();
  // console.log(itemUnitsFetched, "itemUnitsFetched");
  // const itemUnits=itemUnitsFetched
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

  const [rows, setRows] = useState([
    {
      itemSearch: "", itemOpen: false, isExistingItem: false, isHSNLocked: false,
      isUnitLocked: false, CategoryOpen: false, 
      categorySearch: "", unitOpen: false, unitSearch: "",
    }
  ]);

  const [editPurchase, { isLoading: isEditingPurchase }] = useEditPurchaseMutation();
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




  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    //getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      Party_Name: "",

      Bill_Number: "",
      Bill_Date: "",
      State_Of_Supply: "",
      Total_Amount: "",
      Balance_Due: "",
      Total_Paid: "",
      Terms_Conditions_Id: null,
      Terms_Conditions_Description: "",
      // Payment_Type: "Cash",
      // Reference_Number: "",
      //Bank_Account_Id: null,   // 🔹 added
      splits: [{ Payment_Type: "Cash", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],
      items: [{


        Item_Category: "",
        Item_Name: "",
        Quantity: "",
        Item_Unit: "",
        Purchase_Price: "",

        Discount_On_Purchase_Price: "",
        Discount_Type_On_Purchase_Price: "Percentage",
        Tax_Type: "None",
        Tax_Amount: "",
        Amount: "",
      }
      ]
    }

  })
  const { fields, append, remove } = useFieldArray({
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
      Purchase_Price: "",
      Discount_On_Purchase_Price: "",
      Discount_Type_On_Purchase_Price: "Percentage",
      Tax_Type: "None",
      Tax_Amount: "",
      Amount: "",
    });
  };

  // const handleDeleteRow = (i) => {
  //   setRows((prev) => prev.filter((_, idx) => idx !== i)); // remove UI state
  //   remove(i); // remove from form
  // };

  const handleDeleteRow = (i) => {
    // 1. get current items BEFORE removal
    const currentItems = watch("items");

    // 2. calculate new total excluding the deleted row
    const newTotal = currentItems.reduce((sum, row, idx) => {
      if (idx === i) return sum;                    // skip deleted row
      return sum + parseFloat(row.Amount || 0);
    }, 0);

    const currentTotalPaid = parseFloat(watch("Total_Paid") || 0);
    const newBalanceDue = newTotal - currentTotalPaid;

    // 3. remove from UI state and form
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    remove(i);

    // 4. update totals
    setValue("Total_Amount", newTotal.toFixed(2), { shouldValidate: true });
    setValue("Balance_Due", newBalanceDue.toFixed(2), { shouldValidate: true });
  };

  const itemsValues = watch("items");   // watch all item rows
  const totalPaid = watch("Total_Paid"); // watch Total_Paid
  const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));

  const calculateRowAmount = (row, index, itemsValues) => {
    const price = num(row.Purchase_Price);
    const qty = Math.max(0, num(row.Quantity)); // default 1
    const subtotal = price * qty;

    // discount
    let disc = num(row.Discount_On_Purchase_Price);
    if ((row.Discount_Type_On_Purchase_Price || "Percentage") === "Percentage") {
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
      Quantity: String(qty),
      Tax_Amount: taxAmount.toFixed(2),
      Amount: finalAmount.toFixed(2),
      Total_Amount: totalAmount.toFixed(2), // ✅ correct grand total
      Balance_Due: (totalAmount - num(totalPaid)).toFixed(2),
    };
  };





  //const itemsValues = watch("items"); // watch all rows
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
    // setValue("Total_Paid", computedTotalPaid.toFixed(2), {
    //   shouldValidate: false,
    //   shouldDirty: true,
    // });
    if (splitsWatch.length > 1) {
    setValue("Total_Paid", computedTotalPaid.toFixed(2), {
      shouldValidate: false,
      shouldDirty: true,
    });
  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountWatch, computedTotalPaid]);



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
  console.log("purchase", purchase);
  const emptyRow = () => ({
    Item_Category: "",
    Item_Name: "",
    itemSearch: "",
    Item_HSN: "",
    Quantity: "",
    Item_Unit: "",
    Purchase_Price: "",
    Discount_On_Purchase_Price: "",
    Discount_Type_On_Purchase_Price: "Percentage",
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
  useEffect(() => {
    if (purchase) {
      setPartySearch(purchase?.billPurchaseDetails?.Party_Name)
      // const prefilledRows = purchase?.items?.map((item) => ({
      //   ...item,
      //   itemSearch: item.Item_Name,
      //   itemOpen: false,
      //   CategoryOpen: false,
      //   isHSNLocked: false,
      //   isUnitLocked: false,
      //   isExistingItem: true,

      // }))
      // const prefilledRows = purchase?.items?.length > 0
      //   ? purchase.items.map((item) => ({
      //     ...item,
      //     // Primary_Unit: item.Primary_Unit || "",
      //     // Secondary_Unit: item.Secondary_Unit || "",
      //     // Conversion_Rate: item.Conversion_Rate || "",

      //     // Available_Units: Array.isArray(item.Available_Units)
      //     //   ? item.Available_Units
      //     //   : [],
      //     Item_Unit: item.Selected_Unit || "",
      //     itemSearch: item.Item_Name,
      //     itemOpen: false,
      //     CategoryOpen: false,
      //     isHSNLocked: false,
      //     isUnitLocked: false,
      //     isExistingItem: true,
      //   }))
      //   : [emptyRow()];

      const prefilledRows = purchase?.items?.length > 0
        ? purchase.items.map((item, index) => {

          // Original purchase price saved in this purchase line
          const purchasePrice = Number(item.Purchase_Price) || 0;

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

          const selectedUnit =
            item.Selected_Unit || primaryUnit;

          let basePurchasePrice = purchasePrice;

          if (
            selectedUnit === secondaryUnit &&
            conversionRate > 0
          ) {
            basePurchasePrice = purchasePrice * conversionRate;
          }

          // Store original/base price separately
          basePurchasePriceRef.current[index] = basePurchasePrice;
          basePurchaseUnitRef.current[index] = primaryUnit;

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
        Quantity: item.Quantity || "",
        Item_Unit: item.Item_Unit || "",
        Purchase_Price: item.Purchase_Price || "",

        Discount_On_Purchase_Price:
          item.Discount_On_Purchase_Price || "",

        Discount_Type_On_Purchase_Price:
          item.Discount_Type_On_Purchase_Price || "Percentage",

        Tax_Type: item.Tax_Type || "None",
        Tax_Amount: item.Tax_Amount || "",
        Amount: item.Amount || "",
      }));
      setRows(prefilledRows)
      reset({
        Party_Name: purchase?.billPurchaseDetails?.Party_Name,
        GSTIN: purchase?.billPurchaseDetails?.GSTIN,
        Bill_Number: purchase?.billPurchaseDetails?.Bill_Number,
        Bill_Date: toLocalDateString(purchase?.billPurchaseDetails?.Bill_Date),
        State_Of_Supply: purchase?.billPurchaseDetails?.State_Of_Supply,
        Total_Amount: purchase?.billPurchaseDetails?.Total_Amount,
        Total_Paid: purchase?.billPurchaseDetails?.Total_Paid,
        Balance_Due: purchase?.billPurchaseDetails?.Balance_Due,
        Terms_Conditions_Id: purchase?.billPurchaseDetails?.Terms_Conditions_Id ?? null,

        Terms_Conditions_Description: purchase?.billPurchaseDetails?.Terms_Conditions_Description ?? "",
        //Payment_Type: purchase?.billPurchaseDetails?.Payment_Type,
        //Bank_Account_Id: purchase?.billPurchaseDetails?.Bank_Account_Id, // ✅ Add this
        //Reference_Number: purchase?.billPurchaseDetails?.Reference_Number,
        splits:
          purchase?.splits?.length > 0
            ? purchase.splits.map((split) => ({
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
        // ✅ CLEAN RHF DATA
        items: formItems,
        //items: prefilledRows
      })
      setShowSplitBox((purchase?.splits?.length || 0) > 1);
    }
  }, [purchase])
  useEffect(() => {
    if (purchase) {
      setShowGSTIN(purchase.GSTIN || "");   // ✅ only UI update
    }
  }, [purchase]);



  const onSubmit = async (data) => {
    console.log("Form Data (from RHF):", data);

    // =========================================================
    // 1. NORMALIZE PAYMENT SPLITS
    // =========================================================

    const rawSplits = data.splits || [];

    const normalizedSplits = rawSplits.map((split) => ({
      ...split,
      Amount: Number(split.Amount) || 0,
    }));

    // =========================================================
    // 2. FIND FIRST VALID PAYMENT METHOD
    //
    // Bank is valid only when account is selected.
    // Cash / Cheque / Neft are valid when Payment_Type exists.
    // =========================================================

    const firstValidIndex = normalizedSplits.findIndex((split) => {
      if (!split.Payment_Type) {
        return false;
      }

      if (
        split.Payment_Type === "Bank" &&
        !split.Bank_Account_Id
      ) {
        return false;
      }

      return true;
    });

    // =========================================================
    // 3. BUILD VALID SPLITS
    //
    // RULE:
    //
    // Positive amount -> ALWAYS KEEP
    //
    // Blank / ₹0 -> ONLY keep if it is the FIRST
    //               valid payment method
    //
    // Other ₹0 rows -> DROP
    // =========================================================

    const validSplits = [];

    normalizedSplits.forEach((split, index) => {
      // No payment type
      if (!split.Payment_Type) {
        return;
      }

      // Bank without account
      if (
        split.Payment_Type === "Bank" &&
        !split.Bank_Account_Id
      ) {
        return;
      }

      // ---------------------------------------------
      // Positive amount -> always keep
      // ---------------------------------------------
      if (split.Amount > 0) {
        validSplits.push(split);
        return;
      }

      // ---------------------------------------------
      // ₹0 / blank -> only FIRST valid payment method
      // ---------------------------------------------
      if (index === firstValidIndex) {
        validSplits.push({
          ...split,
          Amount: 0,
        });
      }
    });

    // =========================================================
    // 4. CALCULATE TOTAL PAID FROM SURVIVING SPLITS
    // =========================================================

    const totalPaid = validSplits.reduce(
      (sum, split) => {
        return sum + (Number(split.Amount) || 0);
      },
      0
    );

    // =========================================================
    // 5. BUILD PAYLOAD
    // =========================================================

    const payload = {
      ...data,

      // Don't trust old Total_Paid from form.
      // Recalculate from valid payment splits.
      Total_Paid: totalPaid,

      splits: validSplits,
    };

    // console.log("Raw Splits:", rawSplits);
    // console.log("Normalized Splits:", normalizedSplits);
    // console.log("First Valid Index:", firstValidIndex);
    // console.log("Valid Splits:", validSplits);
    // console.log("Total Paid:", totalPaid);
    // console.log("Final Edit Payload:", payload);

    // =========================================================
    // 6. SUBMIT EDIT
    // =========================================================

    try {
      const res = await editPurchase({
        body: payload,
        Purchase_Id,
      }).unwrap();

      console.log("Purchase updated successfully:", res);

      const resData = res?.data || res;

      // =======================================================
      // 7. INVALIDATE CACHE
      // =======================================================

      dispatch(
        purchaseApi.util.invalidateTags(["Purchase"])
      );

      dispatch(
        itemApi.util.invalidateTags(["Item", "ItemLedger"])
      );

      dispatch(
        dashboardApi.util.invalidateTags(["Dashboard"])
      );

      dispatch(
        cashInHandApi.util.invalidateTags(["CashInHand"])
      );

      // Since purchase can contain MULTIPLE banks,
      // invalidate the general BankAccount tag.
      dispatch(
        bankAccountApi.util.invalidateTags([
          "BankAccount",
        ])
      );

      dispatch(
        partyApi.util.invalidateTags([
          "Party",
          "PartyLedger",
        ])
      );

      // =======================================================
      // 8. RESPONSE CHECK
      // =======================================================

      if (!resData?.success) {
        toast.error("Failed to update purchase");
        return;
      }

      toast.success("Purchase updated successfully!");

      // =======================================================
      // 9. NAVIGATION
      // =======================================================

      if (from === "party-payables") {
        navigate({
          pathname: "/party/payables",
          search: location.search,
        });
      }

      else if (
        from === "party-sales-purchases-details"
      ) {
        navigate({
          pathname:
            `/party/party-sales-purchases-details/${Party_Id}`,
          search: location.search,
        });

        dispatch(
          partyApi.util.invalidateTags(["Party"])
        );
      }

      else if (
        from === "item-sales-purchases-details"
      ) {
        navigate({
          pathname:
            `/item/item-sales-purchases-details/${Item_Id}`,
          search: location.search,
        });

        dispatch(
          itemApi.util.invalidateTags(["Item"])
        );
      }
      else if (from === "items-by-item") {
        navigate({
          pathname: "/items/all-items",
          search: `?itemId=${Item_Id}`,
        });
      }
      else if (from === "bank-accounts") {
        navigate({
          pathname: "/cash-bank/bank-accounts",
          search: `?bankId=${bankId}`,
        });
      }

      else if (from === "party-details") {
        navigate({
          pathname: "/party/parties",
          search: location.search,
        });
      }

      else if (from === "cash-in-hand") {
        navigate({
          pathname: "/cash-bank/cash-in-hand",
        });
      }

      else {
        navigate({
          pathname: "/purchase/all-purchases",
          search: location.search,
        });
      }

    } catch (error) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to update purchase.";

      toast.error(errorMessage);

      console.error(
        "Purchase update failed:",
        error
      );
    }
  };

  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
  const paymentType = watch("splits.0.Payment_Type");
  return (
    <>
      {/* <div className="sb2-2-2">
        <ul>
          <li>
         
            <NavLink style={{ display: "flex", flexDirection: "row" }}
              to="/home"

            >
              <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
             
              Dashboard
            </NavLink>
          </li>

        </ul>
      </div> */}

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
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">Edit Purchase</h4>
              {/* <p className="text-gray-500 mb-2 sm:mb-4">
        Add new purchase details
      </p> */}
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
                // onClick={() => navigate("/purchase/all-purchases")}
                //                                onClick={()=>navigate({
                //   pathname: "/purchase/all-purchases",
                //   search: location.search,
                // })}
                onClick={() => {

                  if (from === "party-payables") {
                    navigate({
                      pathname: `/party/payables`,
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
                  }
                  else if (from === "items-by-item") {


                    navigate({
                      pathname: "/items/all-items",
                      search: `?itemId=${Item_Id}`,
                    });
                  }
                  else if (from === "bank-accounts") {
                    // 🔹 new — return to Bank Accounts page with the same account selected
                    navigate({
                      pathname: `/cash-bank/bank-accounts`,
                      search: `?bankId=${bankId}`,
                    })
                  }
                  else if (from === "party-details") {
                    // 🔹 new — return to Bank Accounts page with the same account selected
                    navigate({
                      pathname: `/party/parties`,
                      search: location.search,
                      // search: `?partyId=${partyId}`,
                    });
                  }
                  else if (from === "cash-in-hand") {
                    // 🔹 new — return to Bank Accounts page with the same account selected
                    navigate({
                      pathname: `/cash-bank/cash-in-hand`,

                    });
                  }
                  else {
                    navigate({
                      pathname: "/purchase/all-purchases",
                      search: location.search,
                    })
                  }
                }}
                //     else if (from === "party-payables") {


                //       navigate({
                //   pathname: `/party/payables`,
                //   search: location.search,
                // })
                // }  
                className="text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => navigate("/purchase/all-purchases")}
                className="text-white py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                All Purchases
              </button>
            </div>

          </div>
        </div>
        <div style={{ padding: "0px", backgroundColor: "#f1f1f19d" }} className="tab-inn">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col justify-between gap-6 w-full sm:flex-row heading-wrapper">


              <div className="grid grid-rows-2 ml-2 w-full sm:w-1/2 lg:w-1/3 ">

                <div className=" flex flex-col relative mt-2 gap-2 party-class"
                  style={{ marginBottom: "0px", marginTop: "0px" }}>
                  <span className="whitespace-nowrap active ">
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

                  {/* Add Party Modal */}
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

                        // setValue(
                        //   "Billing_Name",
                        //   newParty.Billing_Name || "",
                        //   {
                        //     shouldValidate: true,
                        //     shouldDirty: true,
                        //   }
                        // );



                        setShowPartyModal(false);
                      }}
                    />
                  )}

                  {/* RHF Error */}
                  {errors?.Party_Name && (
                    <p className="text-red-500 text-xs mt-1">{errors?.Party_Name?.message}</p>
                  )}
                </div>
                <div className="input-field  flex gap-4
                              justify-center items-center  gstin-class">
                  <span className=" whitespace-nowrap active ">
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





                {/* Bill Number */}
                <div className="flex items-center w-full gap-3  justify-end">
                  <span className="whitespace-nowrap ">
                    Bill Number
                    {/* <span className="text-red-500">*</span> */}
                  </span>

                  <input
                    type="text"
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    id=" Bill_Number"
                    {...register("Bill_Number")}
                    placeholder="Bill_Number"
                    className="w-full outline-none invoice-number-class  text-gray-900"
                  />
                  {errors?.Bill_Number && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Bill_Number?.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center w-full gap-3  justify-end">
                  <span className="whitespace-nowrap ">
                    Bill Date
                    {/* <span className="text-red-500">*</span> */}
                  </span>

                  <input
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    type="date"
                    id=" Bill_Date"
                    {...register("Bill_Date")}
                    placeholder=" Bill_Date"
                    className="w-full outline-none invoice-date-class   text-gray-900"
                  />
                  {errors?.Bill_Date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Bill_Date?.message}
                    </p>
                  )}
                </div>
                {/* State of Supply */}




                <div className="flex
                                           items-center w-full gap-3 justify-end
                                           state-of-supply-class">
                  <span className="whitespace-nowrap ">
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
                    {/* <option value="West Bengal">West Bengal</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Delhi">Delhi</option> */}
                  </select>
                  {errors?.State_Of_Supply && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.State_Of_Supply?.message}
                    </p>
                  )}
                </div>
              </div>



            </div>








            <div className="table-responsive table-desi mt-4">
              <table className="table table-hover">
                <thead>
                  <tr>

                    <th>Sl.No</th>
                    <th>Category</th>
                    <th>Item</th>
                    <th>Item_HSN</th>
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
                      <td style={{ padding: "0px", width: "18%", position: "relative" }}>
                        <div ref={(el) => (itemRefs.current[i] = el)}> {/* ✅ attach ref */}
                          <input
                            type="text"
                            value={rows[i]?.itemSearch || ""}
                            onChange={(e) => {
                              const typedValue = e.target.value;
                              handleRowChange(i, "itemSearch", typedValue);
                              handleRowChange(i, "CategoryOpen", false);
                              handleRowChange(i, "unitOpen", false);
                              setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true, shouldDirty: true });
                              handleRowChange(i, "isHSNLocked", false);
                              handleRowChange(i, "isExistingItem", false);
                              handleRowChange(i, "isUnitLocked", false);
                              // ✅ If typed value doesn’t match any existing item → unlock category
                              const exists = items?.items?.find(
                                (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
                              );
                              if (exists) {
                                // ✅ Only store if it's a valid item
                                setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true, shouldDirty: true });
                                handleRowChange(i, "isExistingItem", true);
                              } else {
                                // ❌ Clear Item_Name in RHF to trigger error
                                // setValue(`items.${i}.Item_Name`, "", { shouldValidate: true, shouldDirty: true });
                                // handleRowChange(i, "isExistingItem", false);
                                setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true, shouldDirty: true });
                                handleRowChange(i, "isExistingItem", false);
                                handleRowChange(i, "Primary_Unit", null);      // 🔹 add this
                                handleRowChange(i, "Secondary_Unit", null);    // 🔹 add this
                                handleRowChange(i, "Available_Units", []);
                              }
                              //handleRowChange(i, "isExistingItem", exists); // false if new item
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                const typedValue = rows[i]?.itemSearch?.trim() || "";
                                if (!typedValue) return;

                                const matchedItem = items?.items?.find(
                                  (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
                                );

                                if (matchedItem) {
                                  // ✅ auto-fill exactly like clicking from dropdown
                                  setRows((prev) => {
                                    const updated = [...prev];
                                    updated[i] = {
                                      ...updated[i],
                                      itemSearch: matchedItem.Item_Name,   // normalize display
                                      Item_Category: matchedItem.Item_Category || "",
                                      Item_HSN: matchedItem.Item_HSN || "",
                                      categorySearch: matchedItem.Item_Category || "",
                                      isExistingItem: true,
                                      isHSNLocked: false,
                                      isUnitLocked: false,
                                      itemOpen: false,
                                      // ✅ CURRENT MASTER
                                      Primary_Unit: matchedItem.Primary_Unit || null,
                                      Secondary_Unit: matchedItem.Secondary_Unit || null,
                                      Conversion_Rate: matchedItem.Conversion_Rate || null,

                                      // ✅ ONLY CURRENT MASTER AVAILABLE UNITS
                                      Available_Units: Array.isArray(matchedItem.Available_Units)
                                        ? matchedItem.Available_Units
                                        : [],
                                    };
                                    return updated;
                                  });

                                  setValue(`items.${i}.Item_Name`, matchedItem.Item_Name, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_Category`, matchedItem.Item_Category, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_HSN`, matchedItem.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Purchase_Price`, matchedItem.Purchase_Price || 0, { shouldValidate: true, shouldDirty: true });

                                  setValue(`items.${i}.Item_Unit`, matchedItem.Primary_Unit || "", { shouldValidate: true, shouldDirty: true });
                                  basePurchasePriceRef.current[i] = Number(matchedItem.Purchase_Price) || 0;
                                  basePurchaseUnitRef.current[i] = matchedItem.Primary_Unit || "";
                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    {
                                      ...itemsValues[i],
                                      Item_Name: matchedItem.Item_Name,
                                      Purchase_Price: matchedItem.Purchase_Price || 0,
                                      Quantity: itemsValues[i]?.Quantity || 0,
                                    },
                                    i,
                                    itemsValues
                                  );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                                } else {
                                  // // no match — close dropdown
                                  //      handleRowChange(i, "Primary_Unit", null);      // 🔹 add this
                                  // handleRowChange(i, "Secondary_Unit", null);    // 🔹 add this
                                  handleRowChange(i, "itemOpen", false);
                                }
                              }, 150); // small delay so click-from-dropdown fires first
                            }}
                            onClick={() => {
                              handleRowChange(i, "itemOpen", true);
                              handleRowChange(i, "unitOpen", false);
                              handleRowChange(i, "CategoryOpen", false);
                            }}
                            //onClick={() => handleRowChange(i, "itemOpen", !rows[i]?.itemOpen)}
                            placeholder="Item Name"
                            className="w-full outline-none border-b-2 text-gray-900"
                          />
                          {/* RHF error */}
                          {errors?.items?.[i]?.Item_Name && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors?.items?.[i]?.Item_Name?.message}
                            </p>
                          )}
                          {/* Dropdown List */}

                          {rows[i]?.itemOpen && (
                            <div
                              style={{ width: "45rem" }}
                              className="absolute z-20  w-full bg-white border
                      border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
                              {/* ✅ ADD ITEM BUTTON — new addition, sits above the table */}
                              <div
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleRowChange(i, "itemOpen", true);
                                  setActiveItemRow(i);
                                  setShowItemAddModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 cursor-pointer"
                                style={{
                                  borderBottom: "1px solid #e5e7eb",
                                  color: "#4CA1AF",
                                  fontWeight: 600,
                                  fontSize: 13,
                                  position: "sticky",
                                  top: 0,
                                  backgroundColor: "#fff",
                                  zIndex: 1,
                                }}
                              >
                                <span style={{ fontSize: 17, lineHeight: 1 }}>⊕</span>
                                Add Item
                              </div>

                              {/* ══════════════════════════════════════════════
        EVERYTHING BELOW IS YOUR EXISTING CODE — UNCHANGED
    ══════════════════════════════════════════════ */}
                              <table className="w-full text-sm border-collapse">
                                <thead className="bg-gray-100 border-b">
                                  <tr>
                                    <th>Sl.No</th>
                                    <th className="text-left px-3 py-2">Item Name</th>
                                    <th className="text-left px-3 py-2">Sale Price</th>
                                    <th className="text-left px-3 py-2">Purchase Price</th>
                                    <th className="text-left px-3 py-2">Stock</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items?.items
                                    ?.filter((it) =>
                                      it.Item_Name.toLowerCase().includes(
                                        (rows[i]?.itemSearch || "").toLowerCase()
                                      )
                                    )
                                    .map((it, idx) => (
                                      <tr
                                        key={idx}
                                        onClick={() => {

                                          setRows((prev) => {
                                            const updated = [...prev];
                                            updated[i] = {
                                              ...updated[i],
                                              Item_Category: it.Item_Category || "",
                                              Item_HSN: it.Item_HSN || "",
                                              categorySearch: it.Item_Category || "", // ✅ sync UI state
                                              isExistingItem: true,   // lock category
                                              isHSNLocked: false,      // lock HSN
                                              isUnitLocked: false,     // lock unit
                                              Primary_Unit: it.Primary_Unit || null,      // 🔹 add this
                                              Secondary_Unit: it.Secondary_Unit || null,  // 🔹 add this
                                              //Available_Units: item.Available_Units || [],
                                              Conversion_Rate: it.Conversion_Rate || null,
                                              Available_Units: Array.isArray(it.Available_Units)
                                                ? it.Available_Units
                                                : [],
                                            };
                                            return updated;
                                          });
                                          handleRowChange(i, "itemSearch", it.Item_Name);
                                          handleRowChange(i, "isExistingItem", true); // ✅ mark as existing
                                          handleRowChange(i, "CategoryOpen", false);
                                          handleRowChange(i, "unitOpen", false);
                                          setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });

                                          setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Purchase_Price`, it.Purchase_Price || 0, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Quantity`, 1, { shouldValidate: true, shouldDirty: true });
                                          //setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_Unit`, it.Primary_Unit || "", { shouldValidate: true, shouldDirty: true });
                                          basePurchasePriceRef.current[i] = Number(it.Purchase_Price) || 0;
                                          basePurchaseUnitRef.current[i] = it.Primary_Unit || "";
                                          handleRowChange(i, "itemOpen", false);


                                          const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                            {
                                              ...itemsValues[i],
                                              Item_Name: it.Item_Name,
                                              Purchase_Price: it.Purchase_Price || 0,
                                              Quantity: itemsValues[i]?.Quantity || 0,
                                              Discount_On_Purchase_Price: itemsValues[i]?.Discount_On_Purchase_Price || 0,
                                              Discount_Type_On_Purchase_Price: itemsValues[i]?.Discount_Type_On_Purchase_Price,
                                              Tax_Type: itemsValues[i]?.Tax_Type
                                            },
                                            i,
                                            itemsValues
                                          );

                                          setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                          setValue(`Total_Amount`, Total_Amount, { shouldValidate: true, shouldDirty: true });
                                          setValue(`Balance_Due`, Balance_Due, { shouldValidate: true, shouldDirty: true });
                                        }}

                                        className="hover:bg-gray-100 cursor-pointer border-b"
                                      >
                                        <td>{idx + 1}</td>
                                        <td className="px-3 py-2">{it.Item_Name}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Sale_Price || 0}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Purchase_Price || 0}</td>
                                        <td className="px-3 py-2 whitespace-nowrap"
                                          style={{
                                            padding: "0.5rem 0.75rem", // same as Tailwind px-3 py-2
                                            color: it.Stock_Quantity <= 0 ? "red" : "limegreen",
                                            fontWeight: "500", // optional: matches Tailwind's medium weight
                                          }}
                                        >
                                          {it.Stock_Quantity || 0}{" "}{it.Primary_Unit}
                                        </td>
                                      </tr>
                                    ))}

                                  {items?.items?.filter((it) =>
                                    it.Item_Name.toLowerCase().includes(
                                      (rows[i]?.itemSearch || "").toLowerCase()
                                    )
                                  ).length === 0 && (
                                      <tr>
                                        <td colSpan={4} className="px-3 py-2 text-gray-400 text-center">
                                          No Item found
                                        </td>
                                      </tr>
                                    )}
                                </tbody>
                              </table>
                            </div>
                          )}



                        </div>
                      </td>

                      {/*HSN Code */}
                      <td style={{ padding: "0px", width: "8%" }}>
                        <input
                          type="text"
                          maxLength={8}
                          value={rows[i]?.Item_HSN || watch(`items.${i}.Item_HSN`) || ""}
                          onChange={(e) => {
                            // if (!rows[i]?.isHSNLocked) {
                            //   handleRowChange(i, "Item_HSN", e.target.value);
                            //   setValue(`items.${i}.Item_HSN`, e.target.value, { shouldValidate: true, shouldDirty: true });
                            // }
                            e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            handleRowChange(i, "Item_HSN", e.target.value);
                            setValue(`items.${i}.Item_HSN`, e.target.value, { shouldValidate: true, shouldDirty: true });
                          }}
                          placeholder="HSN Code"
                          className="w-full outline-none border-b-2 text-gray-900"
                        //readOnly={rows[i]?.isHSNLocked} // ✅ lock if item is from dropdown
                        />
                        {errors?.items?.[i]?.Item_HSN && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Item_HSN.message}
                          </p>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: "0px", width: "4%" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ width: "100%" }}

                          // {...register(`items.${i}.Quantity`)}
                          {...register(`items.${i}.Quantity`)}

                          onChange={(e) => {

                            e.target.value = e.target.value
                              .replace(/[^0-9.]/g, "")
                              .replace(/(\..*)\./g, "$1");
                            setValue(`items.${i}.Quantity`, e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });

                            // if (!itemsValues[i]?.Item_Name || itemsValues[i]?.Item_Name.trim() === "") {
                            //   return;
                            // }
                            // const { Tax_Amount, Amount,Total_Amount } = calculateRowAmount({
                            //   ...itemsValues[i],
                            //   Quantity: e.target.value,
                            // });

                            const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                              {
                                ...itemsValues[i],
                                Quantity: Number(e.target.value),
                              },
                              i,
                              itemsValues
                            );

                            setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                            setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                            setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                            setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
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
                                    const basePrice = Number(basePurchasePriceRef.current[i]) || 0;

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

                                    //const roundedPrice = newPrice.toFixed(2);
                                    const baseUnit =
                                      basePurchaseUnitRef.current[i];

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





                                    setValue(`items.${i}.Purchase_Price`, roundedPrice, { shouldValidate: true, shouldDirty: true });

                                    // recompute Amount/Tax/Total with the new price
                                    const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                      { ...itemsValues[i], Purchase_Price: roundedPrice },
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
                                                const basePrice = Number(basePurchasePriceRef.current[i]) || 0;

                                                const baseUnit = basePurchaseUnitRef.current[i];

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
                                                  `items.${i}.Purchase_Price`,
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
                                                    Purchase_Price:
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

                                                setValue(
                                                  "Total_Amount",
                                                  Total_Amount,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );

                                                setValue(
                                                  "Balance_Due",
                                                  Balance_Due,
                                                  {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                  }
                                                );
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


                      {/* Price/Unit */}
                      <td style={{ padding: "0px", width: "6%" }}>
                        <div className="d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control"
                            style={{ width: "100%", marginBottom: "0px" }}
                            {...register(`items.${i}.Purchase_Price`)}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, "");;

                              // ✅ allow digits and one dot


                              // ✅ if more than one dot, keep only the first
                              const parts = val.split(".");
                              if (parts.length > 2) {
                                val = parts[0] + "." + parts.slice(1).join(""); // collapse extra dots
                              }

                              // ✅ limit to 2 decimal places
                              if (val.includes(".")) {
                                const [int, dec] = val.split(".");
                                val = int + "." + dec.slice(0, 2);
                              }

                              e.target.value = val;
                              setValue(`items.${i}.Purchase_Price`, val, { shouldValidate: true });
                              basePurchasePriceRef.current[i] = Number(val) || 0;
                              basePurchaseUnitRef.current[i] = itemsValues[i]?.Item_Unit || "";

                              //setValue(`items.${i}.Purchase_Price`, Number(val), { shouldValidate: true });
                              // if (!itemsValues[i]?.Item_Name || itemsValues[i]?.Item_Name.trim() === "") {
                              //   return;
                              // }


                              const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                { ...itemsValues[i], Purchase_Price: val },
                                i,
                                itemsValues
                              );

                              setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                              setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                              setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                              setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                            }}

                            placeholder="Price"
                          />

                        </div>
                        {errors?.items?.[i]?.Purchase_Price && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Purchase_Price.message}
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
                            {...register(`items.${i}.Discount_On_Purchase_Price`)}

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
                                { ...itemsValues[i], Discount_On_Purchase_Price: val },
                                i,
                                itemsValues
                              );

                              setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                              setValue(`items.${i}.Amount`, Amount);
                              setValue("Total_Amount", Total_Amount);
                              setValue("Balance_Due", Balance_Due);
                            }}

                            placeholder="Discount"
                          />
                          <Controller
                            control={control}
                            name={`items.${i}.Discount_Type_On_Purchase_Price`}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="form-select ms-2"
                                style={{ width: "50%", fontSize: "12px" }}
                                onChange={(e) => {
                                  field.onChange(e); // ✅ let RHF handle its state


                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    { ...itemsValues[i], Discount_Type_On_Purchase_Price: e.target.value },
                                    i,
                                    itemsValues
                                  );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                                }}
                              >
                                <option value="Percentage">%</option>
                                <option value="Amount">Amount</option>
                              </select>
                            )}
                          />
                        </div>
                      </td>


                      <td style={{ padding: "0px", width: "12%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Tax_Type`}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="form-select"
                              style={{ width: "100%", fontSize: "12px", marginBottom: "0px" }}
                              onChange={(e) => {
                                field.onChange(e); // ✅ update RHF value


                                const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                  { ...itemsValues[i], Tax_Type: e.target.value },
                                  i,
                                  itemsValues
                                );
                                setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                                setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
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
              <div className="grid grid-cols-1 sm:grid-cols-3 px-2 gap-4 w-full sale-wrapper">

                {/* <div className="flex flex-col px-2 w-full  sale-left"> */}

                <TermsAndConditionsSelector
                  termsList={termsTemplates}
                  value={watch("Terms_Conditions_Id")}
                  description={watch("Terms_Conditions_Description")}
                  onChange={({ Terms_Conditions_Id, Terms_Conditions_Description }) => {
                    setValue("Terms_Conditions_Id", Terms_Conditions_Id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    setValue(
                      "Terms_Conditions_Description",
                      Terms_Conditions_Description,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    );
                  }}
                  onRefresh={() => dispatch(termsConditionsApi.util.invalidateTags(["Terms"]))}
                />
                <div className="flex flex-col px-2">
                  <div className="flex flex-col mt-3 gap-2 w-full">
                    {!showSplitBox ? (
                      <>
                        <div className="flex flex-col w-full">
                          <span className="active">Payment Type</span>

                          <input
                            type="hidden"
                            {...register("splits.0.Payment_Type", { required: "Payment Type is required" })}
                          />

                          {/* <select
                            id="Payment_Type"
                            value={
                              paymentType === "Bank"
                                ? `bank_${watch("splits.0.Bank_Account_Id") || ""}`
                                : paymentType || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith("bank_")) {
                                const bankId = val.replace("bank_", "");
                                setValue("splits.0.Payment_Type", "Bank", { shouldValidate: true, shouldDirty: true });
                                setValue("splits.0.Bank_Account_Id", Number(bankId), { shouldValidate: true, shouldDirty: true });
                              } else {
                                setValue("splits.0.Payment_Type", val, { shouldValidate: true, shouldDirty: true });
                                setValue("splits.0.Bank_Account_Id", null, { shouldValidate: true, shouldDirty: true });
                              }
                            }}
                          >
                          
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Neft">Neft</option>
                            {banks?.map((bank) => (
                              <option key={bank.Bank_Account_Id} value={`bank_${bank.Bank_Account_Id}`}>
                                {bank.Account_Display_Name}
                              </option>
                            ))}
                          </select> */}
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
                    <div className="flex items-center gap-2">
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
            <div className="flex justify-end gap-4 ">
              <button
                type="button"
                onClick={() => {
                  // setShowModal(false)
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
                      pathname: "/purchase/all-purchases",
                      search: location.search,
                    })

                    // navigate("/sale/all-sales");
                  }
                }}
                // onClick={() => navigate({
                //   pathname: "/purchase/all-purchases",
                //   search: location.search,
                // })}
                // onClick={() => navigate("/purchase/all-purchases")}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formValues.errorCount > 0 || isEditingPurchase}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isEditingPurchase ? "Updating..." : "Update Purchase"}
              </button>
            </div>
          </form >

        </div >


      </div >

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
      )
      }
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
        )
      }
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
`}
      </style>
    </>
  );
}


{/* <td style={{ padding: "0px", width: "10%", position: "relative" }}>
                        <div ref={(el) => (categoryRefs.current[i] = el)}>
                          <input
                            type="text"
                            value={watch(`items.${i}.Item_Category`) || rows[i]?.categorySearch || ""}
                            style={{ marginBottom: "0px" }}
                            readOnly={rows[i]?.isExistingItem}
                            placeholder="Category"
                            className="w-full outline-none border-b-2 text-gray-900"
                            onClick={() => {
                              if (!rows[i]?.isExistingItem) {
                                setRows((prev) =>
                                  prev.map((row, idx) => ({
                                    ...row,
                                    CategoryOpen: idx === i ? !row.CategoryOpen : false,
                                  }))
                                );
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleRowChange(i, "categorySearch", value);
                              setValue(`items.${i}.Item_Category`, value, { shouldValidate: true });
                              handleRowChange(i, "isExistingItem", false);
                            }}
                          />


                          {errors?.items?.[i]?.Item_Category && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Item_Category.message}
                            </p>
                          )}

                          {rows[i]?.CategoryOpen && !rows[i]?.isExistingItem && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              <span className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setShowModal(true);
                                  handleRowChange(i, "CategoryOpen", false);
                                }}>
                                + Add Category
                              </span>

                              {categories
                                ?.filter((cat) =>
                                  cat.Item_Category.toLowerCase().startsWith(
                                    (rows[i]?.categorySearch || "").toLowerCase()
                                  )
                                )
                                .map((cat, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      handleSelect(i, cat.Item_Category);
                                      handleRowChange(i, "categorySearch", cat.Item_Category);
                                      setValue(`items.${i}.Item_Category`, cat.Item_Category, { shouldValidate: true });
                                      handleRowChange(i, "CategoryOpen", false);
                                    }}

                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    {cat.Item_Category}
                                  </div>
                                ))}

                              {categories?.filter((cat) =>
                                cat.Item_Category.toLowerCase().startsWith(
                                  (rows[i]?.categorySearch || "").toLowerCase()
                                )
                              ).length === 0 && (
                                  <p className="px-3 py-2 text-gray-500">No categories found</p>
                                )}
                            </div>
                          )}
                        </div>
                        {showModal && (
                          <div
                            style={{
                              position: "fixed",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(0,0,0,0.4)",
                              backdropFilter: "blur(4px)",
                              zIndex: 30,
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
                                <button
                                  type="button"
                                  onClick={() => setShowModal(false)}

                                  style={{ backgroundColor: "lightgray" }}
                                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  Cancel
                                </button>
                                {/* <button
                                        type="button"
                                        onClick={() => {
                                          if (from === "party-sales-purchases-details") {

                                            navigate({
                                              pathname: `/party/party-sales-purchases-details/${Party_Id}`,
                                              search: location.search,
                                            })
                                          }
                                            //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
                                          // } else if (from === "item-sales-purchases-details") {
                                          //   navigate({
                                          //     pathname: `/item/item-sales-purchases-details/${Item_Id}`,
                                          //     search: location.search,
                                          //   })
                                          //   // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
                                          // } 
                                          else {
                                            navigate({
                                              pathname: "/purchase/all-purchases",
                                              search: location.search,
                                            })

                                            // navigate("/sale/all-sales");
                                          }
                                        }}
                                        //       onClick={() => {
                                        //     if (from === "party-sales-purchases-details") {
                                        //       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
                                        // //        navigate({
                                        // //   pathname: `/party/party-sales-purchases-details/${Party_Id}`,
                                        // //   search: location.search,
                                        // // })
                                        //       //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
                                        //     } else if (from === "item-sales-purchases-details") {
                                        //      navigate({
                                        //   pathname: `/item/item-sales-purchases-details/${Item_Id}`,
                                        //   search: location.search,
                                        // })
                                        //       // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
                                        //     } else {
                                        //                                     navigate({
                                        //   pathname: "/purchase/all-purchases",
                                        //   search: location.search,
                                        // })

                                        //       // navigate("/sale/all-sales");
                                        //     }
                                        //   }}
                                        //   onClick={() => {
                                        //     if (from === "party-sales-purchases-details") {
                                        //       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
                                        //     } 

                                        //     else if (from === "item-sales-purchases-details") {
                                        //       navigate(`/item/item-sales-purchases-details/${Item_Id}`);
                                        //     }else {
                                        //                                         navigate({
                                        //   pathname: "/purchase/all-purchases",
                                        //   search: location.search,
                                        // })
                                        //       // navigate(`/purchase/all-purchases`);
                                        //     }
                                        //   }}
                                        className="text-white font-bold py-2 px-4 rounded"
                                        style={{ backgroundColor: "#4CA1AF" }}
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
                        {/* {showModal && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 30,
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
          <button
            type="button"
            onClick={() => setShowModal(false)}
            style={{ backgroundColor: "lightgray" }}
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
                      </td> */}