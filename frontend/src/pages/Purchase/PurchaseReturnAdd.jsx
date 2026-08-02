import { useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi, useAddCategoryMutation, useGetAllCategoriesQuery, useGetAllItemsQuery } from "../../redux/api/itemApi";
import { useRef } from "react";
import { useEffect } from "react";

import { useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { toast } from "react-toastify";

import { useDispatch } from "react-redux";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import { LayoutDashboard } from "lucide-react";
import AddUnitModal from "../../components/Modal/AddUnitModal";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";

import { purchaseReturnApi, useCreatePurchaseReturnMutation } from "../../redux/api/purchaseReturnApi";
import { purchaseReturnFormSchema } from "../../schema/purchaseReturnFormScema";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import { Trash2 } from "lucide-react"
export default function PurchaseReturnAdd() {
  const location = useLocation();
  const from = location.state?.from

  const Party_Id = location.state?.partyId;
  const Item_Id = location.state?.itemId
  console.log("Purchase Return page query:", location.search);
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


  const navigate = useNavigate();
  const { data: parties } = useGetAllPartiesQuery();
  const { data: items } = useGetAllItemsQuery();

  const { data: categories } = useGetAllCategoriesQuery()
  const { data: banks = [] } = useGetAllBankAccountsQuery();
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
  const [showGSTIN, setShowGSTIN] = useState("");
  const [originalTotal, setOriginalTotal] = useState(null);
  const [addCategory] = useAddCategoryMutation();
  const [showSplitBox, setShowSplitBox] = useState(false);

  // const itemUnits = {
  //   "gm": "Gram",
  //   "Kg": "Kilogram",
  //   "lt": "Litre",
  //   "pcs": "Piece",

  // }
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [activeUnitRow, setActiveUnitRow] = useState(null);
  // const [newUnitKey, setNewUnitKey] = useState("");
  // const [newUnitName, setNewUnitName] = useState("");
  //  const itemUnitsFetched = {
  //     "gm": "Gram",
  //     "Kg": "Kilogram",
  //     "lt": "Litre",
  //     "pcs": "Piece",

  //   }
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
      isUnitLocked: false, CategoryOpen: false, categorySearch: ""
    }
  ]);

  const [createPurchaseReturn, { isLoading: isCreating }] = useCreatePurchaseReturnMutation();

  // const [editPurchase, { isLoading: isEditingPurchase }] = useEditPurchaseMutation();
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

          const clickedInsideCategory =
            catRef && catRef.contains(event.target);
          const clickedInsideItem =
            itemRef && itemRef.contains(event.target);

          // if clicked outside both → close
          if (!clickedInsideCategory && !clickedInsideItem) {
            return { ...row, CategoryOpen: false, itemOpen: false };
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseReturnFormSchema),
    defaultValues: {
      Party_Name: "",
      Return_Number: "",
      Bill_Number: "",
      Bill_Date: "",
      Return_Date: new Date().toISOString().slice(0, 10),
      State_Of_Supply: "",
      Total_Amount: "",
      Balance_Due: "",
      Total_Received: "",
      splits: [{ Payment_Type: "Cash", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],
      items: [
        {
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
        },
      ],
    },
  });
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
      ...prev.map((row) => ({
        ...row,
        CategoryOpen: false,
        itemOpen: false,
      })),
      {
        itemSearch: "",
        itemOpen: false,
        CategoryOpen: false,
        isHSNLocked: false,
        isUnitLocked: false,
        isExistingItem: false,
        categorySearch: "",
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

    // No total recalc needed — new row is empty (Amount = 0)
    // Total_Amount stays the same, Balance_Due stays the same
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

    const currentTotalReceived = parseFloat(watch("Total_Received") || 0);
    const newBalanceDue = newTotal - currentTotalReceived;

    // 3. remove from UI state and form
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    remove(i);

    // 4. update totals
    setValue("Total_Amount", newTotal.toFixed(2), { shouldValidate: true });
    setValue("Balance_Due", newBalanceDue.toFixed(2), { shouldValidate: true });
  };
  const itemsValues = watch("items");   // watch all item rows
  const totalReceived = watch("Total_Received"); // watch Total_Received
  const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));

  const calculateRowAmount = (row, index, itemsValues) => {
    const price = num(row.Purchase_Price);
    const qty = Math.max(1, num(row.Quantity)); // default 1
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
      Balance_Due: (totalAmount - num(totalReceived)).toFixed(2),
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
    isHSNLocked: false,
    isUnitLocked: false,
    isExistingItem: false,
  });
  useEffect(() => {
    if (purchase) {
      setPartySearch(purchase?.billPurchaseDetails?.Party_Name);
      // const prefilledRows = purchase?.items?.map((item) => ({
      //   ...item,
      //   itemSearch: item.Item_Name,
      //   itemOpen: false,
      //   CategoryOpen: false,
      //   isHSNLocked: false,
      //   isUnitLocked: true,
      //   isExistingItem: true,
      // }));
      const prefilledRows = purchase?.items?.length > 0
        ? purchase.items.map((item) => ({
          ...item,
          itemSearch: item.Item_Name,
          itemOpen: false,
          CategoryOpen: false,
          isHSNLocked: false,
          isUnitLocked: true,
          isExistingItem: true,
        }))
        : [emptyRow()];
      setRows(prefilledRows);

      reset({
        Return_Date: new Date().toISOString().slice(0, 10),
        Return_Number: "",
        Party_Name: purchase?.billPurchaseDetails?.Party_Name,
        GSTIN: purchase?.billPurchaseDetails?.GSTIN,
        Bill_Number: purchase?.billPurchaseDetails?.Bill_Number,
        Bill_Date: toLocalDateString(purchase?.billPurchaseDetails?.Bill_Date),
        State_Of_Supply: purchase?.billPurchaseDetails?.State_Of_Supply,
        Total_Amount: purchase?.billPurchaseDetails?.Total_Amount,
        Total_Received: "",
        Balance_Due: purchase?.billPurchaseDetails?.Balance_Due,
        // splits replaces Payment_Type / Bank_Account_Id / Reference_Number —
        // seed row 1 with the original purchase's payment info as a starting
        // suggestion; user can change it freely, it's just a convenience default
        // splits: [
        //   {
        //     Payment_Type: purchase?.billPurchaseDetails?.Payment_Type || "Cash",
        //     Bank_Account_Id: purchase?.billPurchaseDetails?.Bank_Account_Id || null,
        //     Reference_Number: purchase?.billPurchaseDetails?.Reference_Number || "",
        //     Amount: "",
        //   },
        // ],
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
        items: prefilledRows,
      });

      // always start single-payment for a brand new return — there's no prior
      // return record to inspect the way initialData.splits worked before
      setShowSplitBox((purchase?.splits?.length || 0) > 1);
    }
  }, [purchase]);
  useEffect(() => {
    if (purchase) {
      setShowGSTIN(purchase.GSTIN || "");   // ✅ only UI update
    }
  }, [purchase]);
  // Keeps amount inputs numeric-only (digits + a single decimal point)
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
  const buildPaymentTypeOptions = (banks) => [
    { value: "Cash", label: "Cash", repeatable: false },
    { value: "Cheque", label: "Cheque", repeatable: true },
    { value: "Neft", label: "Neft", repeatable: true },
    ...(banks || []).map((bank) => ({
      value: `bank_${bank.Bank_Account_Id}`,
      label: bank.Account_Display_Name,
      repeatable: false,
    })),
  ];

  const getRowIdentifier = (type, bankId) =>
    type === "Bank" ? `bank_${bankId ?? ""}` : type;

  //Inside the component:

  const getUsedIdentifiers = (excludeIndex) => {
    const splitValues = watch("splits") || [];
    return splitValues
      .map((s, i) =>
        i === excludeIndex ? null : getRowIdentifier(s.Payment_Type, s.Bank_Account_Id)
      )
      .filter(Boolean);
  };

  const getAvailableOptions = (excludeIndex) => {
    const used = getUsedIdentifiers(excludeIndex);
    return buildPaymentTypeOptions(banks).filter(
      (opt) => opt.repeatable || !used.includes(opt.value)
    );
  };

  const handleAddPaymentType = () => {
    appendSplit({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" });
    setShowSplitBox(true);
  };

  // live-derived total — never stored as a separate field
  const splitsWatch = watch("splits") || [];
  const computedTotalReceived = splitsWatch.reduce(
    (sum, s) => sum + (parseFloat(s.Amount) || 0),
    0
  );

  // one-directional: recompute Balance_Due whenever the total-amount or splits change.
  // (One-directional only — do NOT also sync splits from Balance_Due, that
  // two-way sync is exactly what caused the "value shown but still required"
  // bug in the Payment-Out modal.)
  const totalAmountWatch = watch("Total_Amount");
  useEffect(() => {
    const bal = (Number(totalAmountWatch) || 0) - computedTotalReceived;
    setValue("Balance_Due", bal.toFixed(2), { shouldValidate: false, shouldDirty: true });
    setValue("Total_Received", computedTotalReceived.toFixed(2), {
      shouldValidate: false,
      shouldDirty: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountWatch, computedTotalReceived]);
  //   const onSubmit = async (data) => {
  //     console.log("Form Data (from RHF):", data);

  //     const payload = { ...data };

  //     // ── validate items ──
  //     // const seenItems = new Set();
  //     // for (const item of payload.items) {
  //     //   const name = item.Item_Name?.trim().toLowerCase();
  //     //   const category = item.Item_Category?.trim().toLowerCase();
  //     //   const itemHSN = item.Item_HSN?.trim().toLowerCase();
  //     //   const Quantity = item.Quantity;

  //     //   if (!name || !category || !itemHSN || !Quantity) {
  //     //     toast.error("Each item must have a valid name, category, HSN and quantity.");
  //     //     return;
  //     //   }

  //     //   if (seenItems.has(name)) {
  //     //     toast.error(
  //     //       `Duplicate item '${item.Item_Name}' found. Please ensure each item appears only once.`
  //     //     );
  //     //     return;
  //     //   }
  //     //   seenItems.add(name);
  //     // }

  //     // ── validate items ──
  // for (const item of payload.items) {
  //   const name = item.Item_Name?.trim();
  //   const category = item.Item_Category?.trim();
  //   const itemHSN = item.Item_HSN?.trim();
  //   const quantity = Number(item.Quantity);

  //   if (!name || !category || !itemHSN || quantity <= 0) {
  //     toast.error("Each item must have a valid name, category, HSN and quantity.");
  //     return;
  //   }
  // }

  //     console.log("payload:", payload);

  //     try {
  //       const res = await createPurchaseReturn({
  //         Purchase_Id: Purchase_Id,   // ← from useParams() or props
  //         ...payload,                 // ← everything else (Party_Name, items, etc.)
  //       }).unwrap();
  //       //console.log("Created successfully:", res);

  //       // invalidate so list refetches
  //       dispatch(purchaseReturnApi.util.invalidateTags(["PurchaseReturn"]));
  //       dispatch(itemApi.util.invalidateTags(["Item"]));
  //       dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
  //       dispatch(bankAccountApi.util.invalidateTags([
  //         { type: "BankAccount", id: payload.Bank_Account_Id },
  //         "BankAccount",   // ← this hits getAllBankAccounts which providesTags: ["BankAccount"]
  //       ]));
  //       if (!res?.success) {
  //         toast.error("Failed to add debit note");
  //         return;
  //       }

  //       toast.success("Debit Note added  successfull!");

  //       // ── navigate back based on where user came from ──
  //       if (from === "purchase-return-list") {
  //         navigate({
  //           pathname: "/purchase/return",
  //           search: location.search,
  //         });
  //       } else {
  //         navigate({
  //           pathname: "/purchase/return",
  //           search: location.search,
  //         });
  //       }

  //     } catch (error) {
  //       const errorMessage =
  //         error?.data?.message || error?.message || "Failed to add new debit note.";
  //       toast.error(errorMessage);
  //       //console.error("Submission failed", error);
  //     }
  //   };


  // console.log("showGSTIN:", showGSTIN, purchase);
  const onSubmit = async (data) => {
    console.log("Form Data (from RHF):", data);

    // =========================================================
    // 1. ITEMS
    //
    // Do NOT remove blank item rows here.
    //
    // Backend decides:
    //
    // No Item_Name + Amount > 0
    //     -> ERROR
    //
    // No Item_Name + Amount blank/0
    //     -> SKIP
    //
    // Empty purchase return is allowed.
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
    // 3. NORMALIZE PAYMENT SPLITS
    //
    // Remove rows that don't have a valid payment method.
    //
    // Bank also needs Bank_Account_Id.
    // =========================================================

    const normalizedSplits = (data.splits || [])
      .filter((split) => {
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
      })
      .map((split) => ({
        ...split,
        Amount: Number(split.Amount) || 0,
      }));

    // =========================================================
    // 4. FIRST VALID PAYMENT METHOD STAYS
    //
    // Cash  ₹0     -> KEEP if first
    // HDFC  ₹0     -> DROP if second/middle/last
    // SBI   ₹500   -> KEEP
    //
    // Example:
    //
    // Cash   ₹0      KEEP
    // HDFC   ₹0      DROP
    // SBI    ₹500    KEEP
    //
    // Result:
    //
    // Cash ₹0
    // SBI  ₹500
    // =========================================================

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        // First valid payment method always stays
        if (index === 0) {
          return true;
        }

        // Remaining methods need positive amount
        return split.Amount > 0;
      }
    );

    // =========================================================
    // 5. TOTAL RECEIVED
    //
    // Never trust Total_Received from the form.
    // Calculate it from surviving splits.
    // =========================================================

    const totalReceived = validSplits.reduce(
      (sum, split) =>
        sum + (Number(split.Amount) || 0),
      0
    );

    // =========================================================
    // 6. BALANCE DUE
    // =========================================================

    const balanceDue = totalAmount - totalReceived;

    // =========================================================
    // 7. OPTIONAL FRONTEND SAFETY CHECK
    //
    // Backend checks this again.
    // =========================================================

    // if (totalReceived > totalAmount) {
    //   toast.error(
    //     "Received amount should be less than or equal to Total Amount"
    //   );

    //   return;
    // }

    // =========================================================
    // 8. BUILD PAYLOAD
    // =========================================================

    const payload = {
      ...data,

      items: itemsWithDefaults,

      Total_Amount: totalAmount,

      Total_Received: totalReceived,

      Balance_Due: balanceDue,

      splits: validSplits,
    };

    console.log(
      "Final Purchase Return Payload:",
      payload
    );

    // =========================================================
    // 9. SUBMIT
    // =========================================================

    try {
      const res = await createPurchaseReturn({
        Purchase_Id,
        ...payload,
      }).unwrap();

      console.log(
        "Purchase Return created:",
        res
      );

      if (!res?.success) {
        toast.error(
          "Failed to add debit note"
        );

        return;
      }

      // =======================================================
      // 10. INVALIDATE CACHE
      // =======================================================

      dispatch(
        purchaseReturnApi.util.invalidateTags([
          "PurchaseReturn",
        ])
      );

      dispatch(
        itemApi.util.invalidateTags([
          "Item",
        ])
      );

      dispatch(
        cashInHandApi.util.invalidateTags([
          "CashInHand",
        ])
      );

      dispatch(
        bankAccountApi.util.invalidateTags([
          "BankAccount",
        ])
      );

      dispatch(
        partyApi.util.invalidateTags([
          "Party",
        ])
      );

      // =======================================================
      // 11. SUCCESS
      // =======================================================

      toast.success(
        "Debit Note added successfully!"
      );

      // =======================================================
      // 12. NAVIGATION
      // =======================================================

      if (from === "purchase-return-list") {
        navigate({
          pathname: "/purchase/return",
          search: location.search,
        });
      } else {
        navigate({
          pathname: "/purchase/return",
          search: location.search,
        });
      }

    } catch (error) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to add new debit note.";

      toast.error(errorMessage);

      console.error(
        "Purchase Return submission failed:",
        error
      );
    }
  };
  console.log("Current form values:", formValues);

  console.log("Form errors:", errors);
  const paymentType = watch("splits.0.Payment_Type");
  // const paymentType = watch("Payment_Type", "");
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
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">Debit Note</h4>

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

                        {parties?.parties
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
                          ))}

                        {parties?.parties?.filter((party) =>
                          party?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase())
                        ).length === 0 && (
                            <p className="px-3 py-2 text-gray-500">No Party found</p>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Add Party Modal */}
                  {showPartyModal && (
                    <PartyAddModal
                      onClose={() => setShowPartyModal(false)}
                      onSave={(newParty) => {
                        setPartySearch(newParty);
                        setValue("Party_Name", newParty, { shouldValidate: true });
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




                {/* Return Number */}
                <div className="flex items-center w-full gap-3  justify-end">
                  <span className="whitespace-nowrap ">
                    Return Number
                    {/* <span className="text-red-500">*</span> */}
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
                  {/* {errors?.State_Of_Supply && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.State_Of_Supply?.message}
                    </p>
                  )} */}
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

                      {/* 
                      <td style={{ padding: "0px", width: "10%", position: "relative" }}>
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
                                      isUnitLocked: true,
                                      itemOpen: false,
                                    };
                                    return updated;
                                  });

                                  setValue(`items.${i}.Item_Name`, matchedItem.Item_Name, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_Category`, matchedItem.Item_Category, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_HSN`, matchedItem.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Purchase_Price`, matchedItem.Purchase_Price || 0, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_Unit`, matchedItem.Item_Unit, { shouldValidate: true, shouldDirty: true });

                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    {
                                      ...itemsValues[i],
                                      Item_Name: matchedItem.Item_Name,
                                      Purchase_Price: matchedItem.Purchase_Price || 0,
                                      Quantity: itemsValues[i]?.Quantity || 1,
                                    },
                                    i,
                                    itemsValues
                                  );

                                  setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                                  setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                                } else {
                                  // no match — close dropdown
                                  handleRowChange(i, "itemOpen", false);
                                }
                              }, 150); // small delay so click-from-dropdown fires first
                            }}
                            onClick={() => handleRowChange(i, "itemOpen", !rows[i]?.itemOpen)}
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
                              style={{ width: "40rem" }}
                              className="absolute z-20  w-full bg-white border
                           border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
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
                                              isUnitLocked: true,     // lock unit
                                            };
                                            return updated;
                                          });
                                          handleRowChange(i, "itemSearch", it.Item_Name);
                                          handleRowChange(i, "isExistingItem", true); // ✅ mark as existing
                                          handleRowChange(i, "CategoryOpen", false);
                                          setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });

                                          setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Purchase_Price`, it.Purchase_Price || 0, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Quantity`, 0, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true, shouldDirty: true });
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
                                        {/* <td style={{color:"transparent"}}
              className={`px-3 py-2 ${it.Stock_Quantity <= 0 ? "text-red-500" : "text-green-500"}`}>
                {it.Stock_Quantity || 0}</td> */}
                                        <td
                                          style={{
                                            padding: "0.5rem 0.75rem", // same as Tailwind px-3 py-2
                                            color: it.Stock_Quantity <= 0 ? "red" : "limegreen",
                                            fontWeight: "500", // optional: matches Tailwind's medium weight
                                          }}
                                        >
                                          {it.Stock_Quantity || 0}
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
                          readOnly={rows[i]?.isHSNLocked} // ✅ lock if item is from dropdown
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
                          {...register(`items.${i}.Quantity`)}


                          onChange={(e) => {

                            e.target.value = e.target.value.replace(/[^0-9]/g, "");
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

                    
                      <td style={{ padding: "0px", width: "12%" }}>
                        <Controller
                          control={control}
                          name={`items.${i}.Item_Unit`}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="form-select"
                              style={{ width: "100%", fontSize: "12px", marginLeft: "0px" }}
                              disabled={rows[i]?.isUnitLocked}
                              onChange={(e) => {
                                const value = e.target.value;

                                // ➕ ADD UNIT
                                if (value === "__ADD_UNIT__") {
                                  setActiveUnitRow(i);
                                  setShowAddUnitModal(true);
                                  return;
                                }

                                handleRowChange(i, "Item_Unit", value);
                                setValue(`items.${i}.Item_Unit`, value, { shouldValidate: true, shouldDirty: true });
                              }}
                            >
                              <option value=""></option>
                              <option value="__ADD_UNIT__">➕ Add Unit</option>
                              {Array.isArray(itemUnits) &&
                                itemUnits.map((unit) => (
                                  <option
                                    key={unit.Unit_Shorthand}
                                    value={unit.Unit_Shorthand}
                                  >
                                    {`${unit.Unit_Name} (${unit.Unit_Shorthand})`}
                                  </option>
                                ))}

                              {/* ➕ Add Unit always at bottom */}

                            </select>
                          )}
                        />
                        {errors?.items?.[i]?.Item_Unit && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Item_Unit.message}
                          </p>
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


              {/* <div className="flex flex-col  mt-3 gap-2  w-full sm:w-64">
                          <div className="flex flex-col w-full">
                      <span className="active">Payment Type</span>

                      <select
                        id="Payment_Type"
                        value={
                          watch("Payment_Type") === "Bank"
                            ? `bank_${watch("Bank_Account_Id") || ""}`
                            : watch("Payment_Type") || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("bank_")) {
                            const bankId = val.replace("bank_", "");
                            setValue("Payment_Type", "Bank", { shouldValidate: true, shouldDirty: true });
                            setValue("Bank_Account_Id", Number(bankId), { shouldValidate: true, shouldDirty: true });
                          } else {
                            setValue("Payment_Type", val, { shouldValidate: true, shouldDirty: true });
                            setValue("Bank_Account_Id", null, { shouldValidate: true, shouldDirty: true });
                          }
                        }}
                      >
                        <option value="">Select Payment Type</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Neft">Neft</option>
                        {banks?.map((bank) => (
                          <option
                            key={bank.Bank_Account_Id}
                            value={`bank_${bank.Bank_Account_Id}`}
                          >
                            {bank.Account_Display_Name}
                          </option>
                        ))}
                       
                      </select>

                      {errors?.Payment_Type && (
                        <p className="text-red-500 text-xs mt-1">{errors?.Payment_Type?.message}</p>
                      )}
                      {errors?.Bank_Account_Id && (
                        <p className="text-red-500 text-xs mt-1">{errors?.Bank_Account_Id?.message}</p>
                      )}
                    </div>




                          {(paymentType === "Cheque" || paymentType === "Neft") && (

                            <div className="flex flex-col w-full ">
                              <span className="active whitespace-nowrap">
                                {paymentType === "Cheque" ? "Cheque Number" : "NEFT Reference Number"}
                              </span>

                              <input
                                type="text"
                                id="Reference_Number"
                                {...register("Reference_Number")}
                                placeholder={`Enter ${paymentType} number`}
                                className="w-full outline-none border-b-2 text-gray-900"
                              />

                              {errors?.Reference_Number && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors?.Reference_Number?.message}
                                </p>
                              )}
                            </div>

                          )}
                        </div> */}
              {/* Payment Type — single payment or split box, same pattern as Payment-In/Payment-Out */}
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

                          <select
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
                            <option value="">Select Payment Type</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Neft">Neft</option>
                            {banks?.map((bank) => (
                              <option key={bank.Bank_Account_Id} value={`bank_${bank.Bank_Account_Id}`}>
                                {bank.Account_Display_Name}
                              </option>
                            ))}
                          </select>

                          {errors?.splits?.[0]?.Payment_Type && (
                            <p className="text-red-500 text-xs mt-1">{errors.splits[0].Payment_Type.message}</p>
                          )}
                        </div>

                        {/* {(paymentType === "Cheque" || paymentType === "Neft") && (
                          <div className="flex flex-col w-full">
                            <span className="active whitespace-nowrap">
                              {paymentType === "Cheque" ? "Cheque Number" : "NEFT Reference Number"}
                            </span>

                            <input
                              type="text"
                              id="Reference_Number"
                              {...register("splits.0.Reference_Number")}
                               style={{ width: "80%" }}
                              placeholder={`Enter ${paymentType} number`}
                              // className="w-full outline-none border-b-2 text-gray-900"
                            />
                          </div>
                        )} */}
                        {(paymentType === "Bank" || paymentType === "Cheque" || paymentType === "Neft") && (
                          <div className="mt-3 flex flex-col">
                            <label className="text-sm">Reference Number</label>
                            <input
                              type="text"
                              //readOnly={isView}
                              style={{ width: "80%", marginBottom: "0px" }}
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
                          const rowOptions = getAvailableOptions(index);
                          const currentIdentifier = getRowIdentifier(rowType, watch(`splits.${index}.Bank_Account_Id`));
                          const amountField = register(`splits.${index}.Amount`, {
                            required: "Required",
                            validate: (v) => (v !== "" && Number(v) > 0) || "Enter valid amount",
                          });

                          return (
                            <div key={field.id} className="flex flex-col gap-2">
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                <div className="flex flex-col flex-1">
                                  <span className="text-xs text-gray-500 mb-1">Payment Type</span>
                                  <select
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
                                  </select>
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
                          const totalReceived = parseFloat(watch("Total_Received")) || 0;

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
                          const totalReceived = parseFloat(watch("Total_Received")) || 0;

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


                            id="totalReceivedCheck"
                            className="w-4 h-4 cursor-pointer"
                            disabled={splitsWatch.length > 1}   // 🔹 add this

                            onChange={(e) => {

                              const isChecked = e.target.checked;
                              const totalAmount = parseFloat(watch("Total_Amount"));

                              // 🧠 If no total amount entered, do nothing
                              if (!totalAmount || isNaN(totalAmount)) {
                                // Optional: visually reset the checkbox


                                // Clear both fields to stay consistent
                                setValue("Total_Received", "");
                                setValue("Balance_Due", "");
                                if (splitsWatch.length === 1) {
                                  setValue("splits.0.Amount", "", { shouldValidate: true, shouldDirty: true });
                                }
                                return;
                              }

                              if (isChecked) {
                                // ✅ Set Total_Received = Total_Amount, Balance_Due = 0
                                setValue("Total_Received", totalAmount.toFixed(2));
                                setValue("Balance_Due", 0);
                              } else {
                                // ✅ When unchecked, restore Balance_Due = Total_Amount
                                setValue("Total_Received", "");
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
                            htmlFor="totalReceivedCheck"
                            className="font-medium whitespace-nowrap"
                          >
                            Total Received
                          </span>

                        </div>


                        <input
                          type="text"
                          {...register("Total_Received")}
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
                            setValue("Total_Received", val);

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
              {/* <button
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
                                              pathname: "/purchase/return",
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