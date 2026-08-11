import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi, useAddCategoryMutation, useGetAllCategoriesQuery, useGetAllItemsQuery } from "../../redux/api/itemApi";



import { toast } from "react-toastify";


import { saleApi, useEditSaleMutation, useGetSingleSaleQuery } from "../../redux/api/saleApi";


import PartyAddModal from "../../components/Modal/PartyAddModal";
import { LayoutDashboard } from "lucide-react";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";
import AddUnitModal from "../../components/Modal/AddUnitModal";
import { dashboardApi } from "../../redux/api/dashboardApi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import { Trash2 } from "lucide-react";
import { saleEditFormSchema } from "../../schema/saleEditFormSchema";
import { termsConditionsApi, useGetAllTermsQuery } from "../../redux/api/termsConditionsApi";
import TermsAndConditionsSelector from "../../components/TermsAndConditionSelector";
import AddItemModal from "../../components/Modal/AddItemModal";



export default function SaleEdit() {

  const location = useLocation();
  const from = location.state?.from
  const Party_Id = location.state?.partyId;
  const Item_Id = location.state?.itemId
  const bankId = location.state?.bankId;
  //console.log("Edit page query:", bankId);
  const { id: Sale_Id } = useParams();
  const { data: banks = [] } = useGetAllBankAccountsQuery();
  const { data: categories } = useGetAllCategoriesQuery()
  //const partyId = location.state?.partyId;
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
  const baseSalePriceRef = useRef({});



  const navigate = useNavigate();
  const { data: sale }
    = useGetSingleSaleQuery(Sale_Id, {
      skip: Sale_Id === undefined,
    });
  const { data: parties } = useGetAllPartiesQuery();
  const [showItemAddModal, setShowItemAddModal] = useState(false);
  const [newlyAddedItem, setNewlyAddedItem] = useState(null);
  const [activeItemRow, setActiveItemRow] = useState(null);
  // find this line in your code and add refetch:
  const { data: items, refetch: refetchItems } = useGetAllItemsQuery();
  // console.log(items);
  //const { data: categories, isLoading: isLoadingCategories } = useGetAllCategoriesQuery()
  const [open, setOpen] = useState(false);

  const [partySearch, setPartySearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showEditPartyModal, setShowEditPartyModal] = useState(false);
  const [currentPartyDetails, setCurrentPartyDetails] = useState(null);
  const [showSplitBox, setShowSplitBox] = useState(false);
  const [originalTotal, setOriginalTotal] = useState(null);
  // const [confirmModal, setConfirmModal] = useState({
  //   open: false,
  //   item: null,
  //   rowIndex: null
  // });
  const [showGSTIN, setShowGSTIN] = useState("");
  const [addCategory] = useAddCategoryMutation();
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [activeUnitRow, setActiveUnitRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { data: itemUnits = [] } = useGetAllItemUnitsQuery();
  const { data: termsTemplates } = useGetAllTermsQuery("Sale_Invoice");



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
    resolver: zodResolver(saleEditFormSchema),
    defaultValues: {

      Party_Name: "",
      Billing_Name: "",
      Phone_Number: "",
      Billing_Address: "",
      GSTIN: "",
      Invoice_Number: "",
      Invoice_Date: "",
      State_Of_Supply: "",
      Total_Amount: "",
      Balance_Due: "",
      Total_Received: "",
      Terms_Conditions_Id: null,
      Terms_Conditions_Description: "",
      // Payment_Type: "Cash",
      // Bank_Account_Id: null,   // 🔹 added
      // Reference_Number: "",
      splits: [{ Payment_Type: "Cash", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],
      items: [{


        Item_Category: "",
        Item_Name: "",
        Quantity: "",
        Item_Unit: "",
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });



  const [rows, setRows] = useState([
    {
      itemSearch: "", itemOpen: false, isExistingItem: false, isHSNLocked: false,
      isUnitLocked: false, CategoryOpen: false, categorySearch: "", itemQuantity: 0, itemTaxType: ""
    },
  ]);

  const [editSale, { isLoading: isEditingSale }] = useEditSaleMutation();
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
      Sale_Price: "",
      Discount_On_Sale_Price: "",
      Discount_Type_On_Sale_Price: "Percentage",
      Tax_Type: "None",
      Tax_Amount: "",
      Amount: "",
    });
  };

  const handleDeleteRow = (i) => {
    setRows((prev) => prev.filter((_, idx) => idx !== i)); // remove UI state
    remove(i); // remove from form
  };
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
          // setNewCategory("");
          // setOpen(true);
        } else {
          console.warn("⚠️ Category not added. Response:", data);
        }
      } catch (err) {
        console.error("❌ Error adding category:", err);
      }
    }
  };
  const itemsValues = watch("items");   // watch all item rows
  const totalReceived = watch("Total_Received"); // watch Total_Received
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
      Balance_Due: (totalAmount - num(totalReceived)).toFixed(2),
    };
  };




  const formValues = watch();







  useEffect(() => {
    const gstin = parties?.parties?.find(
      (party) => party.Party_Name === watch("Party_Name")
    )?.GSTIN;

    setShowGSTIN(gstin || ""); // ✅ never undefined
  }, [watch("Party_Name"), parties]);
  console.log(sale)
  const toLocalDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // ✅ in yyyy-mm-dd for input[type="date"]
  };
  console.log(sale);
  const emptyRow = () => ({
    Item_Category: "",
    Item_Name: "",
    itemSearch: "",
    Item_HSN: "",
    Item_Unit: "",
    Quantity: "",
    Sale_Price: "",
    Discount_On_Sale_Price: "",
    Discount_Type_On_Sale_Price: "Percentage",
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
    if (sale) {

      setPartySearch(sale.invoicePartyDetails.Party_Name);


      // const prefilledRows = sale?.items?.length > 0
      //   ? sale.items.map((item) => ({
      //     ...item,
      //     Item_Unit: item.Selected_Unit || "",
      //     itemSearch: item.Item_Name,
      //     itemOpen: false,
      //     CategoryOpen: false,
      //     isHSNLocked: false,
      //     isUnitLocked: false,
      //     isExistingItem: true,
      //   }))
      //   : [emptyRow()];
      const prefilledRows = sale?.items?.length > 0
        ? sale.items.map((item, index) => {

          // Original purchase price saved in this purchase line
          const salePrice = Number(item.Sale_Price) || 0;

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

          return {
            ...item,

            Item_Unit: selectedUnit,

            itemSearch: item.Item_Name,
            itemOpen: false,
            CategoryOpen: false,

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

      //setRows(prefilledRows);

      reset({
        Party_Name: sale.invoicePartyDetails?.Party_Name || "",
        Billing_Name: sale.invoicePartyDetails?.Billing_Name || "",
        Phone_Number: sale.invoicePartyDetails?.Phone_Number || "",
        Billing_Address: sale.invoicePartyDetails?.Billing_Address || "",
        GSTIN: sale.invoicePartyDetails?.GSTIN || "",
        Invoice_Number: sale.invoicePartyDetails?.Invoice_Number || "",

        Invoice_Date: toLocalDateString(sale.invoicePartyDetails?.Invoice_Date),
        //  Invoice_Date: sale.invoicePartyDetails?.Invoice_Date,
        State_Of_Supply: sale.invoicePartyDetails?.State_Of_Supply || "",
        Total_Amount: sale.invoicePartyDetails?.Total_Amount || "",
        Total_Received: sale.invoicePartyDetails?.Total_Received || "",
        Balance_Due: sale.invoicePartyDetails?.Balance_Due || "",
        Terms_Conditions_Id: sale?.invoicePartyDetails?.Terms_Conditions_Id ?? null,

        Terms_Conditions_Description: sale?.invoicePartyDetails?.Terms_Conditions_Description ?? "",

        // Payment_Type: sale.invoicePartyDetails?.Payment_Type || "",
        // Bank_Account_Id: sale.invoicePartyDetails?.Bank_Account_Id, // ✅ Add this
        // Reference_Number: sale.invoicePartyDetails?.Reference_Number || "",
        splits:
          sale?.splits?.length > 0
            ? sale.splits.map((split) => ({
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
        items: formItems,
        // items: prefilledRows
      })
      setShowSplitBox((sale?.splits?.length || 0) > 1);
    }
  }, [sale]);
  console.log(sale)
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
  const paymentType = watch("splits.0.Payment_Type");

  useEffect(() => {
    if (sale) {

      // setValue("GSTIN", sale.GSTIN ? String(sale.GSTIN) : "");
      setShowGSTIN(sale.GSTIN ? String(sale.GSTIN) : "");
    }
  }, [sale]);


  const salePartyName = sale?.invoicePartyDetails?.Party_Name;

  useEffect(() => {
    if (!salePartyName) return;
    if (!parties?.parties?.length) return;

    const matchedParty = parties.parties.find(
      (party) =>
        party.Party_Name?.trim().toLowerCase() ===
        salePartyName.trim().toLowerCase()
    );

    console.log("MATCHED EDIT PARTY:", matchedParty);

    setCurrentPartyDetails(matchedParty || null);

  }, [salePartyName, parties?.parties]);
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
  }, [totalAmountWatch, computedTotalReceived])


  const onSubmit = async (data) => {
    console.log("🧾 Form Data (from RHF):", data);

    // =========================================================
    // 1. ITEMS
    //
    // Send rows to backend AS-IS.
    //
    // Backend decides:
    // No name + Amount > 0  -> ERROR
    // No name + Amount 0    -> SKIP
    // Valid item name       -> PROCESS
    //
    // Empty sale is allowed.
    // =========================================================

    const itemsWithDefaults = (data.items || []).map((item) => ({
      ...item,

      Tax_Type: item.Tax_Type || "None",

      Tax_Amount:
        item.Tax_Amount === "" ||
          item.Tax_Amount === undefined ||
          item.Tax_Amount === null
          ? 0
          : Number(item.Tax_Amount),

      Amount:
        item.Amount === "" ||
          item.Amount === undefined ||
          item.Amount === null
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
    // SAME RULE AS ADD SALE:
    //
    // Total = 0
    //   -> NO payment splits
    //
    // Total > 0
    //   -> first VALID payment method always stays
    //      even if blank / ₹0
    //
    //   -> later blank / ₹0 methods are dropped
    //   -> later positive methods stay
    //
    // Example:
    //
    // Cash  0       -> KEEP (first)
    // HDFC  40      -> KEEP
    // ANCO  0       -> DROP
    // SBI   5       -> KEEP
    // =========================================================

    let validSplits = [];

    if (totalAmount > 0) {
      const normalizedSplits = (data.splits || [])
        .filter((split) => {
          // No payment type
          if (!split.Payment_Type) {
            return false;
          }

          // Bank selected but no bank account
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

          // blank / undefined / null -> 0
          Amount: Number(split.Amount) || 0,
        }));

      validSplits = normalizedSplits.filter(
        (split, index) => {
          // First valid payment method ALWAYS survives
          if (index === 0) {
            return true;
          }

          // Every later payment needs positive amount
          return split.Amount > 0;
        }
      );
    }

    // =========================================================
    // 4. TOTAL RECEIVED
    //
    // Calculate from surviving splits.
    // Don't trust data.Total_Received.
    // =========================================================

    const totalReceived = validSplits.reduce(
      (sum, split) =>
        sum + (Number(split.Amount) || 0),
      0
    );

    // =========================================================
    // 5. BALANCE DUE
    // =========================================================

    const balanceDue = totalAmount - totalReceived;

    // =========================================================
    // 6. BUILD PAYLOAD
    // =========================================================

    const payload = {
      ...data,

      items: itemsWithDefaults,

      Total_Amount: totalAmount,
      Total_Received: totalReceived,
      Balance_Due: balanceDue,

      // IMPORTANT:
      // Send filtered splits, not data.splits
      splits: validSplits,
    };

    console.log("📦 Final Edit Sale Payload:", payload);

    // =========================================================
    // 7. SUBMIT
    // =========================================================

    try {
      const res = await editSale({
        Sale_Id,
        body: payload,
      }).unwrap();

      console.log("✅ Edit Sale Response:", res);

      if (!res?.success) {
        toast.error(
          "Failed to update sale. Please try again."
        );
        return;
      }

      // =======================================================
      // 8. INVALIDATE CACHE
      // =======================================================

      dispatch(
        saleApi.util.invalidateTags(["Sale"])
      );

      dispatch(
        itemApi.util.invalidateTags(["Item"])
      );

      dispatch(
        dashboardApi.util.invalidateTags([
          "Dashboard",
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
        partyApi.util.invalidateTags(["Party"])
      );

      toast.success("Sale updated successfully!");

      // =======================================================
      // 9. NAVIGATION
      // =======================================================

      if (from === "party-receivables") {
        navigate({
          pathname: "/party/receivables",
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
      }

      else if (from === "party-details") {
        navigate({
          pathname: "/party/parties",
          search: location.search,
        });
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

      else if (from === "cash-in-hand") {
        navigate({
          pathname: "/cash-bank/cash-in-hand",
        });
      }

      else {
        navigate({
          pathname: "/sale/all-sales",
          search: location.search,
        });
      }

    } catch (error) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to update sale.";

      toast.error(message);

      console.error(
        "❌ Submission failed:",
        error
      );
    }
  };
  // const handleItemSelect = (it, i) => {
  //   console.log("Selected Item:", it, "at row", i);
  //   setRows((prev) => {
  //     const updated = [...prev];
  //     updated[i] = {
  //       ...updated[i],
  //       Item_Category: it.Item_Category || "",
  //       Item_HSN: it.Item_HSN || "",
  //       categorySearch: it.Item_Category || "",
  //       isExistingItem: true,
  //       isHSNLocked: false,
  //       isUnitLocked: false,
  //     };
  //     return updated;
  //   });

  //   handleRowChange(i, "itemSearch", it.Item_Name);
  //   handleRowChange(i, "isExistingItem", true);
  //   handleRowChange(i, "CategoryOpen", false);

  //   setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });
  //   setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
  //   setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
  //   setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0.0, { shouldValidate: true, shouldDirty: true });
  //   setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true, shouldDirty: true });
  //   setValue(`items.${i}.Tax_Type`, it.Tax_Type, { shouldValidate: true, shouldDirty: true });
  //   handleRowChange(i, "itemOpen", false);


  const showSalePayment = totalAmountWatch > 0;

  console.log(currentPartyDetails, "currentPartyDetails");
  //console.log(sale)
  return (
    <>
      {/* <div className="sb2-2-2">
        <ul>

          <NavLink style={{ display: "flex", flexDirection: "row" }}
            to="/home"

          >
            <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
         
            Dashboard
          </NavLink>

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
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">Edit Sale</h4>
              {/* <p className="text-gray-500 mb-2 sm:mb-4">
           Edit sale details
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
                onClick={() => {

                  if (from === "party-receivables") {
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
                    });
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
                onClick={() => navigate("/sale/all-sales")}
                className="text-white py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                All Sales
              </button>
            </div>

          </div>
        </div>
        <div style={{ padding: "0", backgroundColor: "#f1f1f19d" }} className="tab-inn">
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="flex flex-col justify-between gap-6 w-full lg:flex-row heading-wrapper">

              {/* ══════════════════ LEFT SIDE ══════════════════ */}
              <div className="flex flex-col gap-4 w-full lg:w-2/3">

                {/* ── ROW 1: Party + Phone Number ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">


                  {/* <div className={`grid grid-cols-1 ${showBillingName ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-x-6 gap-y-4`}> */}
                  {/* Party */}
                  <div className="flex flex-col gap-2 relative party-class">
                    {/* <span className="whitespace-nowrap active">
                                    Party
                                    <span className="text-red-500">*</span>
                                  </span> */}
                    <span className="whitespace-nowrap active">
                      {currentPartyDetails?.Party_Name === "Cash Sale" ? "Party" : "Party"}
                      {currentPartyDetails?.Party_Name === "Cash Sale" ? <span className="text-red-500">*</span> : <span className="text-red-500">*</span>}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            setPartySearch(value);
                            setValue("Party_Name", value, { shouldValidate: true, shouldDirty: true });
                            setOpen(true);

                            const matchedParty = parties?.parties?.find(
                              (p) => p.Party_Name.toLowerCase() === value.trim().toLowerCase()
                            );

                            if (matchedParty) {
                              setValue("GSTIN", matchedParty.GSTIN || "", { shouldValidate: true, shouldDirty: true });
                              const defaultBilling = matchedParty.addresses?.find(
                                (a) => a.Address_Type === "Billing" && a.Is_Default
                              );
                              setValue("Billing_Address", defaultBilling?.Address_Text || "", { shouldValidate: true, shouldDirty: true });
                              setCurrentPartyDetails(matchedParty);
                              setValue("Phone_Number", matchedParty.Phone_Number || "", {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue("Billing_Name", matchedParty.Billing_Name || "", { shouldValidate: true, shouldDirty: true });

                            } else {
                              // typed value doesn't match any known party — treat as new, clear stale data
                              setValue("Phone_Number", "", {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              setValue("GSTIN", "", { shouldValidate: true, shouldDirty: true });
                              setValue("Billing_Address", "", { shouldValidate: true, shouldDirty: true });
                              setCurrentPartyDetails(null);
                              setValue("Billing_Name", "", { shouldValidate: true, shouldDirty: true });
                            }
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
                                setValue("Phone_Number", matchedParty.Phone_Number || "", {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });

                                setValue("Party_Name", matchedParty.Party_Name, { shouldValidate: true, shouldDirty: true });
                                setValue("GSTIN", matchedParty.GSTIN || "", { shouldValidate: true, shouldDirty: true });
                                const defaultBilling = matchedParty.addresses?.find(
                                  (a) => a.Address_Type === "Billing" && a.Is_Default
                                );
                                setValue("Billing_Address", defaultBilling?.Address_Text || "", { shouldValidate: true, shouldDirty: true });
                                setCurrentPartyDetails(matchedParty);
                                setValue("Billing_Name", matchedParty.Billing_Name || "", { shouldValidate: true, shouldDirty: true });
                              } else {
                                setValue("Billing_Name", "", { shouldValidate: true, shouldDirty: true });
                              }

                              setOpen(false);
                            }, 150);
                          }}
                          placeholder="Search By Name/Phone"
                          className="w-full outline-none py-1 px-2 text-gray-900"
                          style={{ marginBottom: 0, marginTop: "4px", border: "none", borderBottom: "none", height: "2rem" }}
                        />
                        <div className="w-10"></div>
                        <span className="absolute right-0 px-2 top-1/3 text-gray-700">▼</span>
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
                                  setValue("Phone_Number", party.Phone_Number || "", { shouldValidate: true, shouldDirty: true });
                                  setValue("Party_Name", party.Party_Name, { shouldValidate: true, shouldDirty: true });
                                  setValue("GSTIN", party.GSTIN || "", { shouldValidate: true, shouldDirty: true });
                                  const defaultBilling = party.addresses?.find(
                                    (a) => a.Address_Type === "Billing" && a.Is_Default
                                  );
                                  setValue("Billing_Address", defaultBilling?.Address_Text || "", { shouldValidate: true, shouldDirty: true });
                                  setValue("Billing_Name", party.Billing_Name || "", { shouldValidate: true, shouldDirty: true });

                                  setCurrentPartyDetails(party);

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

                    {/* {showPartyModal && (
                      <PartyAddModal
                        onClose={() => setShowPartyModal(false)}
                        onSave={(newParty) => {
                          setPartySearch(newParty);
                          setValue("Party_Name", newParty, { shouldValidate: true, shouldDirty: true });
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

                          setCurrentPartyDetails(newParty);

                          setShowPartyModal(false);
                        }}
                      />
                    )}


                    {/* {saleMode === "Credit" && errors?.Party_Name && (
                      <p className="text-red-500 text-xs mt-1">{errors?.Party_Name?.message}</p>
                    )} */}
                  </div>


                  {watch("Party_Name")?.trim().toLowerCase() !== "cash sale" && (<div className="flex flex-col gap-2">
                    <span className="whitespace-nowrap active">
                      {currentPartyDetails?.Party_Name === "Cash Sale" ? "Billing Name (Optional)" : "Billing Name"}
                    </span>
                    <input
                      type="text"
                      id="Billing_Name"
                      {...register("Billing_Name")}
                      placeholder="Billing Name"
                      className="w-full outline-none border-b-2 text-gray-900"
                      style={{ marginBottom: 0 }}
                    />
                    {errors?.Billing_Name && (
                      <p className="text-red-500 text-xs">{errors?.Billing_Name?.message}</p>
                    )}
                  </div>)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Phone Number — compact inline label+input */}

                  <div className="flex flex-col gap-2">

                    <span className="whitespace-nowrap active">Phone Number</span>
                    <input
                      type="tel"
                      maxLength={10}
                      id="Phone_Number"
                      {...register("Phone_Number")}
                      placeholder="Phone Number"
                      className="w-full outline-none border-b-2 text-gray-900"
                      style={{ marginBottom: 0 }}
                    />

                    {errors?.Phone_Number && (
                      <p className="text-red-500 text-xs ">{errors?.Phone_Number?.message}</p>
                    )}
                  </div>

                  {/* GSTIN — compact inline label+input, pinned to top */}
                  {watch("Party_Name")?.trim().toLowerCase() !== "cash sale" && (<div className="flex flex-col gap-2 self-start">

                    <span className="whitespace-nowrap active">GSTIN</span>
                    <input
                      type="text"
                      id="GSTIN"
                      value={showGSTIN || ""}
                      {...register("GSTIN")}
                      placeholder="GSTIN"
                      className="w-full outline-none border-b-2 text-gray-900"
                      style={{ marginBottom: 0 }}
                      readOnly
                    />
                  </div>)}
                  {/* {errors?.GSTIN && (
                                  <p className="text-red-500 text-xs sm:pl-[142px]">{errors?.GSTIN?.message}</p>
                                )} */}
                </div>

                {/* ── ROW 2: Billing Address + GSTIN ── */}
                {watch("Party_Name")?.trim().toLowerCase() !== "cash sale" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                    {/* Billing Address */}
                    <div className="flex flex-col gap-2">
                      <span className="active">Billing Address</span>
                      <textarea
                        {...register("Billing_Address")}
                        rows={5}
                        placeholder="Billing Address"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none resize-none focus:border-blue-500"
                        style={{ minHeight: "80px" }}
                      />

                      {/* Address has content — show Remove / Change */}
                      {watch("Billing_Address") && currentPartyDetails && (
                        <div className="flex justify-end gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setValue("Billing_Address", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            Remove
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowEditPartyModal(true)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#4CA1AF",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Change
                          </button>
                        </div>
                      )}

                      {/* Address was just removed — offer to pick one from the party instead */}
                      {!watch("Billing_Address") && currentPartyDetails && (
                        <div className="flex justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => setShowEditPartyModal(true)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#4CA1AF",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Select Billing Address
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {showEditPartyModal && (
                  <PartyAddModal
                    editingParty={true}
                    partyDetails={currentPartyDetails}
                    restrictedMode={true}
                    onClose={() => setShowEditPartyModal(false)}
                    onSave={(updatedParty) => {
                      const defaultBilling = updatedParty.addresses?.find(
                        (a) => a.Address_Type === "Billing" && a.Is_Default
                      );
                      setValue("Billing_Address", defaultBilling?.Address_Text || "", { shouldDirty: true, shouldValidate: true });
                      setShowEditPartyModal(false);
                      setCurrentPartyDetails(updatedParty);
                    }}
                  />
                )}

              </div>

              {/* ══════════════════ RIGHT SIDE ══════════════════ */}
              <div className="flex flex-col gap-4 w-full lg:w-1/3">

                {/* Invoice Number */}
                <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <span className="whitespace-nowrap">Invoice Number</span>
                  <input
                    type="text"
                    id="Invoice_Number"
                    {...register("Invoice_Number")}
                    placeholder="Invoice Number"
                    readOnly
                    className="invoice-number-class outline-none text-gray-900 py-1 bg-transparent border-b-2 w-full"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {errors?.Invoice_Number && (
                  <p className="text-red-500 text-xs pl-[162px]">{errors?.Invoice_Number?.message}</p>
                )}

                {/* Invoice Date */}
                <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <span className="whitespace-nowrap active">Invoice Date</span>
                  <input
                    type="date"
                    id="Invoice_Date"
                    {...register("Invoice_Date")}
                    className="invoice-date-class w-full outline-none text-gray-900 border-b-2"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {errors?.Invoice_Date && (
                  <p className="text-red-500 text-xs pl-[162px]">{errors?.Invoice_Date?.message}</p>
                )}

                {/* State of Supply */}
                <div className="grid grid-cols-[150px_1fr] items-center gap-3 state-of-supply-class">
                  <span className="whitespace-nowrap active">State of Supply</span>
                  <select
                    id="stateOfSupply"
                    className="validate w-full border-b-2"
                    style={{ marginBottom: 0 }}
                    {...register("State_Of_Supply")}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
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
                <tbody style={{ maxHeight: "10rem", overflowY: "scroll", backgroundColor: "#f1f1f19d" }}>
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
                              setShowModal(false);
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
                                    // onClick={() => {
                                    //   handleSelect(i, cat.Item_Category);
                                    //   handleRowChange(i, "categorySearch", cat.Item_Category);
                                    //   handleRowChange(i, "CategoryOpen", false);
                                    // }}
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
                            <div className="bg-white p-6 rounded-lg shadow-lg w-128 relative">
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
                                className="w-full border border-gray-300 rounded-md
           p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4CA1AF]"
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
                      <td style={{ padding: "0px", width: "20%", position: "relative" }}>
                        <div ref={(el) => (itemRefs.current[i] = el)}> {/* ✅ attach ref */}
                          <input
                            type="text"
                            value={rows[i]?.itemSearch || ""}
                            onChange={(e) => {
                              const typedValue = e.target.value;
                              handleRowChange(i, "itemSearch", typedValue);
                              handleRowChange(i, "CategoryOpen", false);
                              // setValue(`items.${i}.Item_Name`, typedValue);
                              handleRowChange(i, "isHSNLocked", false);
                              handleRowChange(i, "isExistingItem", false);
                              handleRowChange(i, "isUnitLocked", false);

                              const exists = items?.items?.find(
                                (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
                              );
                              if (exists) {
                                setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
                                //setValue(`items.${i}.Item_Id`, exists.Item_Id, { shouldValidate: true }); // ✅ re-link if it matches another real item
                                handleRowChange(i, "isExistingItem", true);
                              } else {
                                setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });  // ✅ keep typed value (not "")
                                //setValue(`items.${i}.Item_Id`, "", { shouldValidate: false });           // ✅ detach old Item_Id → backend treats as new item
                                handleRowChange(i, "isExistingItem", false);

                                handleRowChange(i, "Primary_Unit", null);
                                handleRowChange(i, "Secondary_Unit", null);
                                handleRowChange(i, "Available_Units", []);
                              }
                              // if (exists) {
                              //   // ✅ Only store if it's a valid item
                              //   setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
                              //   handleRowChange(i, "isExistingItem", true);
                              // } else {
                              //   // ❌ Clear Item_Name in RHF to trigger error
                              //   setValue(`items.${i}.Item_Name`, "", { shouldValidate: true });
                              //   handleRowChange(i, "isExistingItem", false);
                              // }
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
                                  setValue(`items.${i}.Sale_Price`, matchedItem.Sale_Price || 0, { shouldValidate: true, shouldDirty: true });
                                  //setValue(`items.${i}.Item_Unit`, matchedItem.Item_Unit, { shouldValidate: true, shouldDirty: true });
                                  setValue(`items.${i}.Item_Unit`, matchedItem.Primary_Unit || "", { shouldValidate: true, shouldDirty: true });
                                  baseSalePriceRef.current[i] = Number(matchedItem.Sale_Price) || 0;
                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    {
                                      ...itemsValues[i],
                                      Item_Name: matchedItem.Item_Name,
                                      Sale_Price: matchedItem.Sale_Price || 0,
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

                          {errors?.items?.[i]?.Item_Name && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Item_Name.message}
                            </p>
                          )}



                          {/* Dropdown List */}
                          {/* {rows[i]?.itemOpen && (
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
                                              isUnitLocked: false,     // lock unit
                                              itemQuantity: it.Stock_Quantity || 0,
                                              Primary_Unit: it.Primary_Unit || null,
                                              Secondary_Unit: it.Secondary_Unit || null,
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
                                          setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true });
                                          setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true });
                                          setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0.00, { shouldValidate: true });
                                          //setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true });
                                          setValue(
                                            `items.${i}.Item_Unit`,
                                            it.Primary_Unit || "",
                                            {
                                              shouldValidate: true,
                                              shouldDirty: true,
                                            }
                                          );
                                          setValue(`items.${i}.Quantity`, it.Stock_Quantity || 0, { shouldValidate: true });
                                          
                                          handleRowChange(i, "itemOpen", false);


                                          const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                            {
                                              ...itemsValues[i],
                                              Item_Name: it.Item_Name,
                                              Sale_Price: it.Sale_Price || 0,
                                              Quantity: itemsValues[i]?.Quantity || 0,
                                              Discount_On_Sale_Price: itemsValues[i]?.Discount_On_Sale_Price || 0,
                                              Discount_Type_On_Sale_Price: itemsValues[i]?.Discount_Type_On_Sale_Price,
                                              Tax_Type: itemsValues[i]?.Tax_Type
                                            },
                                            i,
                                            itemsValues
                                          );

                                          setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                                          setValue(`items.${i}.Amount`, Amount);
                                          setValue(`Total_Amount`, Total_Amount);
                                          setValue(`Balance_Due`, Balance_Due);
                                        }}

                                        className="hover:bg-gray-100 cursor-pointer border-b"
                                      >
                                        <td>{idx + 1}</td>
                                        <td className="px-3 py-2">{it.Item_Name}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Sale_Price || 0}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Purchase_Price || 0}</td>
                                        
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
                          )} */}
                          {rows[i]?.itemOpen && (
                            <div
                              style={{ width: "40rem" }}
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
                                          setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });

                                          setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Quantity`, 0, { shouldValidate: true, shouldDirty: true });
                                          //setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true, shouldDirty: true });
                                          setValue(`items.${i}.Item_Unit`, it.Primary_Unit || "", { shouldValidate: true, shouldDirty: true });
                                          baseSalePriceRef.current[i] = Number(it.Sale_Price) || 0;
                                          handleRowChange(i, "itemOpen", false);


                                          const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                            {
                                              ...itemsValues[i],
                                              Item_Name: it.Item_Name,
                                              Sale_Price: it.Sale_Price || 0,
                                              Quantity: itemsValues[i]?.Quantity || 0,
                                              Discount_On_Sale_Price: itemsValues[i]?.Discount_On_Sale_Price || 0,
                                              Discount_Type_On_Sale_Price: itemsValues[i]?.Discount_Type_On_Sale_Price,
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
                          {/* {confirmModal.open && (
                            <div
                              className="fixed inset-0 flex items-center justify-center bg-white z-50 bg-opacity-50"
                            >
                              <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                                <h3 style={{ color: "red" }} className="text-lg font-semibold mb-4 text-center ">
                                  ⚠ Item Out of Stock
                                </h3>
                                <p className="text-gray-700 text-center mb-6">
                                  The item <b>{confirmModal.item?.Item_Name}</b> has 0 stock.<br />
                                  Do you still want to add it?
                                </p>
                                <div className="flex justify-center gap-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleItemSelect(confirmModal.item, confirmModal.rowIndex);
                                      setConfirmModal({ open: false, item: null, rowIndex: null });
                                    }}
                                    className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#4CA1AF]"
                                  >
                                    Yes, Add Item
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmModal({ open: false, item: null, rowIndex: null })
                                    }
                                    style={{ outline: "none", backgroundColor: "gray" }}
                                    className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300
           text-gray-700 "
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )} */}


                          {/* RHF error */}

                        </div>
                      </td>

                      {/*HSN Code */}
                      <td style={{ padding: "0px", width: "8%" }}>
                        <input
                          type="text"

                          value={rows[i]?.Item_HSN || watch(`items.${i}.Item_HSN`) || ""}
                          onChange={(e) => {
                            handleRowChange(i, "Item_HSN", e.target.value);
                            setValue(`items.${i}.Item_HSN`, e.target.value, { shouldValidate: true, shouldDirty: true });
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

                      {/* Quantity */}
                      <td style={{ padding: "0px", width: "4%" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ width: "100%" }}
                          //value={watch(`items.${i}.Quantity`)?.toString() || ""}
                          {...register(`items.${i}.Quantity`)}
                          onChange={(e) => {
                            let value = e.target.value;

                            value = value.replace(/[^0-9.]/g, "")
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

                            //  let num = Number(value);

                            //   if (!Number.isFinite(num) || num < 0) {
                            //     num = 0;
                            //   }
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
                            setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                            setValue("Balance_Due", Balance_Due, { shouldValidate: true });
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

                            const availableUnits = Array.isArray(row?.Available_Units)
                              ? row.Available_Units
                              : [];

                            return (
                              <select
                                {...field}
                                value={field.value || ""}
                                className="form-select"
                                style={{
                                  width: "100%",
                                  fontSize: "12px",
                                  marginLeft: "0px",
                                }}
                                disabled={row?.isUnitLocked}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (value === "__ADD_UNIT__") {
                                    setActiveUnitRow(i);
                                    setShowAddUnitModal(true);
                                    return;
                                  }

                                  field.onChange(value);

                                  handleRowChange(i, "Item_Unit", value);

                                  setValue(`items.${i}.Item_Unit`, value, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                
                                {availableUnits.length > 0 ? (
                                  availableUnits.map((unit) => (
                                    <option
                                      key={unit.Unit_Shorthand}
                                      value={unit.Unit_Shorthand}
                                    >
                                      {unit.Unit_Name} ({unit.Unit_Shorthand})
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="">NONE</option>

                               
                                    {Array.isArray(itemUnits) &&
                                      itemUnits.map((unit) => (
                                        <option
                                          key={unit.Unit_Shorthand}
                                          value={unit.Unit_Shorthand}
                                        >
                                          {unit.Unit_Name} ({unit.Unit_Shorthand})
                                        </option>
                                      ))}

                                    <option value="__ADD_UNIT__">
                                      ➕ Add Unit
                                    </option>
                                  </>
                                )}
                              </select>
                            );
                          }}
                        />

                        {errors?.items?.[i]?.Item_Unit && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[i].Item_Unit.message}
                          </p>
                        )}
                      </td> */}

                      <td style={{ padding: "0px", width: "12%" }}>
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
                                  const row = rows[i];

                                  const availableUnits = Array.isArray(row?.Available_Units)
                                    ? row.Available_Units
                                    : [];

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

                                    if (basePrice <= 0) {
                                      return;
                                    }

                                    let newPrice = basePrice;

                                    // =====================================================
                                    // PRIMARY → SECONDARY
                                    // Example:
                                    // ₹45 / Kg
                                    // 1 Kg = 1000 Gm
                                    // ₹45 / 1000 = ₹0.045
                                    // UI allows only 2 decimals → ₹0.05
                                    // =====================================================

                                    if (
                                      previousUnit === primaryUnit &&
                                      newUnit === secondaryUnit
                                    ) {
                                      newPrice = basePrice / conversionRate;
                                    }

                                    // =====================================================
                                    // SECONDARY → PRIMARY
                                    // IMPORTANT:
                                    // Do NOT use current displayed price.
                                    // Restore original base price.
                                    // =====================================================

                                    else if (
                                      previousUnit === secondaryUnit &&
                                      newUnit === primaryUnit
                                    ) {
                                      newPrice = basePrice;
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
                      </td>
                      <td style={{ padding: "0px", width: "6%" }}>
                        <div className="d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control"
                            style={{ width: "100%", marginBottom: "0px" }}
                            {...register(`items.${i}.Sale_Price`)}

                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = val.split(".");
                              if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                              if (val.includes(".")) {
                                const [intPart, decPart] = val.split(".");
                                val = intPart + "." + decPart.slice(0, 2);
                              }

                              e.target.value = val;

                              // 🟩 Update RHF internal state FOR VALIDATION
                              setValue(`items.${i}.Sale_Price`, val, { shouldValidate: true });
                              baseSalePriceRef.current[i] = Number(val) || 0;

                              const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                { ...itemsValues[i], Sale_Price: val },
                                i,
                                itemsValues
                              );

                              setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                              setValue(`items.${i}.Amount`, Amount);
                              setValue("Total_Amount", Total_Amount);
                              setValue("Balance_Due", Balance_Due);
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
                              setValue("Total_Amount", Total_Amount);
                              setValue("Balance_Due", Balance_Due);
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
                                  setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                                  setValue("Balance_Due", Balance_Due, { shouldValidate: true });
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
                                setValue("Total_Amount", Total_Amount, { shouldValidate: true });
                                setValue("Balance_Due", Balance_Due, { shouldValidate: true });
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
                <TermsAndConditionsSelector
                  termsList={termsTemplates}
                  applicable="Sale_Invoice"
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
                  {/* <div className="flex flex-col px-2 w-full  sale-left"> */}


                  {showSalePayment && (
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
                              {/* <option value="">Select Payment Type</option> */}
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
                    </div>)}
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
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="button"
                //          onClick={()=> navigate({
                // pathname: "/sale/all-sales",
                //   search: location.search,
                // })
                //          }
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
              </button>
              <button
                type="submit"
                disabled={formValues.errorCount > 0 || isEditingSale}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isEditingSale ? "Updating..." : "Update Sale"}
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

            setNewlyAddedItem(savedItem);

            setTimeout(() => {
              setNewlyAddedItem(null);
            }, 8000);

            setShowItemAddModal(false);

            // Reopen the SAME row's dropdown
            if (activeItemRow !== null) {
              handleRowChange(activeItemRow, "itemOpen", true);
            }

            setActiveItemRow(null);
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
{/* <div className="flex flex-col justify-between gap-6 w-full sm:flex-row heading-wrapper">
             
              <div className="grid grid-rows-2 ml-2 w-full sm:w-1/2 lg:w-1/3 ">
                <div className=" flex flex-col relative mt-2 gap-2 party-class"
                  style={{ marginBottom: "0px", marginTop: "0px" }}>
                  {/* <div className="input-field col s6 mt-4 relative"> 

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
                  {showPartyModal && (
                    <PartyAddModal
                      onClose={() => setShowPartyModal(false)}
                      onSave={(updatedParty) => {
                        setPartySearch(updatedParty);
                        setValue("Party_Name", updatedParty, { shouldValidate: true });
                        setShowPartyModal(false);
                      }}
                    />
                  )}

                </div>
                <div className="input-field  flex gap-4
                              justify-center items-center  gstin-class">
                  {/* <div className="input-field col s6 mt-4"> 
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
                  {/* <div className="row  "> */}

{/* Invoice Number */ }
{/* <div className="input-field col s6 mt-4"> 
                  <span className="whitespace-nowrap ">
                    Invoice Number 
                    {/* <span className="text-red-500">*</span> 
                  </span>

                  <input
                    type="text"
                    id=" Invoice_Number"
                    {...register("Invoice_Number")}
                    placeholder=" Invoice_Number"
                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                    className="w-full outline-none  text-gray-900
                          invoice-number-class"
                    readOnly
                  />
                  {errors?.Invoice_Number && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Invoice_Number?.message}
                    </p>
                  )}
                </div>



                {/* Invoice Date 
                <div className="flex items-center w-full  gap-3 justify-end">
                  {/* <div className="input-field col s6 mt-4"> 
                  <span className=" whitespace-nowrap active">
                    Invoice Date
                    {/* <span className="text-red-500">*</span> 
                  </span>

                  <input
                    type="date"
                    id=" Invoice_Date"
                    style={{ marginBottom: 0, width: "50%", border: "none" }}
                    {...register("Invoice_Date")}
                    placeholder=" Invoice_Date"
                    className="w-full outline-none invoice-date-class text-gray-900"
                  //                       min={
                  //   latestInvoiceNumber?.latestInvoiceInfo?.createdAt
                  //     ? new Date(latestInvoiceNumber?.latestInvoiceInfo?.createdAt).toISOString().split("T")[0]
                  //     : ""
                  // } // ✅ Prevent earlier dates
                  />
                  {errors?.Invoice_Date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Invoice_Date?.message}
                    </p>
                  )}
                </div>



                <div className="flex items-center w-full gap-3 justify-end state-of-supply-class">
                  {/* <div className="row w-1/2"> */}

{/* State of Supply */ }
{/* <div className="input-field col s6"> 
                  <span className=" whitespace-nowrap active">
                    State of Supply
                    {/* <span className="text-red-500">*</span> 
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
                  {/* {errors?.State_Of_Supply && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.State_Of_Supply?.message}
                    </p>
                  )} 
                </div>


              </div>

            </div> */}