import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseFormSchema } from "../../schema/expenseFormSchema";
import { toast } from "react-toastify";

import { LayoutDashboard, ChevronDown, Trash2 } from "lucide-react";

import PartyAddModal from "../../components/Modal/PartyAddModal";
import AddExpenseCategoryModal from "../../components/Modal/AddExpenseCategoryModal";
import BankAccountModal from "../../components/Modal/BankAccountModal";
import PaymentTypeSelect from "../../components/PaymentTypeSelect";
// import AddUnitModal from "../../components/Modal/AddUnitModal";

import { useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";

import {
  useGetAllExpenseCategoriesQuery,
  useGetAllExpenseItemMastersQuery,
  useCreateExpenseMutation,
} from "../../redux/api/expenseApi";
import { useGetAllTransactionsSettingsQuery } from "../../redux/api/Settings/transactionsSettingApi";
import { useGetAllTaxesAndGSTSettingsQuery } from "../../redux/api/Settings/taxesAndGSTSettingsApi";

const TAX_RATES = {
  None: 0,
  GST0: 0,
  IGST0: 0,
  "GST0.25": 0.25,
  "IGST0.25": 0.25,
  GST3: 3,
  IGST3: 3,
  GST5: 5,
  IGST5: 5,
  GST12: 12,
  IGST12: 12,
  GST18: 18,
  IGST18: 18,
  GST28: 28,
  IGST28: 28,
};

const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));

const sanitizeAmount = (value) => {
  let val = value.replace(/[^0-9.]/g, "");
  const parts = val.split(".");
  if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
  return val;
};

const emptyRow = () => ({
  Item_Name: "",
  Item_HSN: "",
  // Item_Unit: "",
  Quantity: "",
  Price: "",
  // Price_Type: "Tax Excluded",
  Discount_On_Price: "",
  Discount_Type_On_Price: "Percentage", // "Percentage" | "Amount"
  Tax_Type: "None",
  Tax_Amount: "",
  Amount: "",
});

export default function AddExpense() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ───────────────────────── MOCK DATA (replace with API) ───────────────────────── */
  // TODO: const { data: categories } = useGetAllExpenseCategoriesQuery();
  const { data: categoryResponse, isLoading: isCategoryLoading } =
    useGetAllExpenseCategoriesQuery();

  const categories = categoryResponse?.categories || [];

  // console.log("Category Response:", categoryResponse);
  // console.log("Categories:", categories);

  const { data: itemResponse, isLoading: isItemLoading } =
    useGetAllExpenseItemMastersQuery();

  const items = itemResponse?.items || [];

  // console.log("Item Response:", itemResponse);
  // console.log("Items:", items);

  const { data: partiesResponse, isLoading: isPartyLoading } =
    useGetAllPartiesQuery();
  // console.log("Parties:", partiesResponse);

  // TODO: const { data: banks = [] } = useGetAllBankAccountsQuery();
  const { data: banks = [], isLoading: isBankLoading } =
    useGetAllBankAccountsQuery();
  // console.log("Banks:", banks);

  const { data: transactionsSettingsData } =
    useGetAllTransactionsSettingsQuery();

  const transactionsSettings = transactionsSettingsData?.settings || [];

  const enableTransactionWiseDiscount =
    Number(
      transactionsSettings.find(
        (s) => s.setting_key === "transaction_wise_discount",
      )?.setting_value,
    ) === 1;

  const { data: taxesGSTSettingsData } = useGetAllTaxesAndGSTSettingsQuery();

  const taxesGSTSettings = taxesGSTSettingsData?.settings || [];

  const enableGST =
    Number(
      taxesGSTSettings.find((s) => s.setting_key === "enable_gst")
        ?.setting_value,
    ) === 1;

  const enablePlaceOfSupply =
    Number(
      taxesGSTSettings.find((s) => s.setting_key === "enable_place_of_supply")
        ?.setting_value,
    ) === 1;

  // TODO: const [addExpense, { isLoading: isAddingExpense }] = useAddExpenseMutation();
  const [createExpense, { isLoading: isAddingExpense }] =
    useCreateExpenseMutation();

  /* ───────────────────────── UI STATE ───────────────────────── */
  const [gstEnabled, setGstEnabled] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryRef = useRef(null);

  const [itemOpen, setItemOpen] = useState(null);
  const [itemSearch, setItemSearch] = useState({});
  const itemRefs = useRef({});

  const [partyOpen, setPartyOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const partyRef = useRef(null);

  // const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  // const [activeUnitRow, setActiveUnitRow] = useState(null);

  const [originalTotal, setOriginalTotal] = useState(null);
  const [isRoundOff, setIsRoundOff] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [activeSplitRow, setActiveSplitRow] = useState(null); // which split row triggered "+ Add Bank A/C"
  const [showSplitBox, setShowSplitBox] = useState(false);

  /* close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
      if (partyRef.current && !partyRef.current.contains(e.target)) {
        setPartyOpen(false);
      }

      let clickedInsideItem = false;

      Object.values(itemRefs.current).forEach((ref) => {
        if (ref && ref.contains(e.target)) {
          clickedInsideItem = true;
        }
      });

      if (!clickedInsideItem) {
        setItemOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!enableGST && gstEnabled) {
      setGstEnabled(false);
      setValue("With_GST", false, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableGST]);

  /* ───────────────────────── FORM ───────────────────────── */
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      Category_Name: "",
      Category_Type: "Indirect",
      Party_Id: "",
      Party_Name: "",
      Expense_Number: "",
      Expense_Date: new Date().toISOString().slice(0, 10),
      Bill_Date: "",
      With_GST: false,
      State_Of_Supply: "",
      items: [emptyRow()],
      splits: [
        {
          Payment_Type: "Cash",
          Bank_Account_Id: null,
          Reference_Number: "",
          Amount: "",
        },
      ],
      Transaction_Discount_Percentage: "",
      Transaction_Discount_Amount: "",

      Round_Off: "",
      Total_Amount: "0.00",
      Total_Paid: "",
      Balance_Due: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const {
    fields: splitFields,
    append: appendSplit,
    remove: removeSplit,
  } = useFieldArray({ control, name: "splits" });

  const itemsValues = watch("items");
  const splitsValues = watch("splits") || [];
  const totalAmountWatch = watch("Total_Amount");

  /* ───────────────────────── ITEM TABLE TOTALS ───────────────────────── */

  const calculateTotals = (items = []) => {
    return items.reduce(
      (acc, row) => {
        const qty = Number(row.Quantity) || 0;
        const price = Number(row.Price) || 0;

        const subtotal = price * qty;

        let discount = Number(row.Discount_On_Price) || 0;

        if ((row.Discount_Type_On_Price || "Percentage") === "Percentage") {
          discount = (subtotal * discount) / 100;
        } else if ((row.Discount_Type_On_Price || "Percentage") === "Amount") {
          // Amount discount is per unit
          discount = discount * qty;
        }

        const afterDiscount = Math.max(0, subtotal - discount);

        const taxPercent = TAX_RATES[row.Tax_Type] ?? 0;

        const taxAmount = (afterDiscount * taxPercent) / 100;

        const finalAmount = afterDiscount + taxAmount;

        return {
          totalQty: acc.totalQty + qty,
          totalDiscount: acc.totalDiscount + discount,
          totalTaxAmount: acc.totalTaxAmount + taxAmount,
          totalAmount: acc.totalAmount + finalAmount,
        };
      },
      {
        totalQty: 0,
        totalDiscount: 0,
        totalTaxAmount: 0,
        totalAmount: 0,
      },
    );
  };

  const itemTotals = calculateTotals(itemsValues || []);

  const getRawTotal = () => {
    return (itemsValues || []).reduce(
      (sum, item) => sum + (Number(item.Amount) || 0),
      0,
    );
  };

  const applyRoundOff = (roundOffValue) => {
    const rawTotal = getRawTotal();
    const discountPercentage =
      Number(watch("Transaction_Discount_Percentage")) || 0;

    const discountAmount = Number(watch("Transaction_Discount_Amount")) || 0;

    const calculatedDiscount =
      discountPercentage > 0
        ? (rawTotal * discountPercentage) / 100
        : discountAmount;

    if (discountPercentage > 0) {
      setValue("Transaction_Discount_Amount", calculatedDiscount.toFixed(2), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const afterDiscount = Math.max(0, rawTotal - calculatedDiscount);
    const newTotal = afterDiscount + roundOffValue;
    const totalPaid = Number(watch("Total_Paid")) || 0;

    setValue("Total_Amount", newTotal.toFixed(2), {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue("Balance_Due", (newTotal - totalPaid).toFixed(2), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /* ───────────────────────── ROW CALCULATIONS ───────────────────────── */
  const calculateRowAmount = (row, index, items) => {
    const price = num(row.Price);
    const qty = Math.max(0, num(row.Quantity));
    let subtotal = price * qty;

    const taxPercent = TAX_RATES[row.Tax_Type] ?? 0;

    // If the entered price already includes tax, strip the tax portion out first
    // so discount + tax below always operate on the tax-excluded base amount.
    // if (row.Price_Type === "Tax Included" && taxPercent > 0) {
    //     subtotal = subtotal / (1 + taxPercent / 100);
    // }

    let disc = num(row.Discount_On_Price);

    if ((row.Discount_Type_On_Price || "Percentage") === "Percentage") {
      disc = (subtotal * disc) / 100;
    } else if ((row.Discount_Type_On_Price || "Percentage") === "Amount") {
      // Amount discount is per unit, so multiply by quantity
      disc = disc * qty;
    }

    const afterDiscount = Math.max(0, subtotal - disc);

    const taxAmount = (afterDiscount * taxPercent) / 100;
    const finalAmount = afterDiscount + taxAmount;

    let totalAmount = 0;
    items?.forEach((r, i) => {
      totalAmount += i === index ? num(finalAmount) : num(r.Amount);
    });

    return {
      Tax_Amount: taxAmount.toFixed(2),
      Amount: finalAmount.toFixed(2),
      Total_Amount: totalAmount.toFixed(2),
    };
  };

  const recalcRow = (index, patch) => {
    const updatedRow = { ...itemsValues[index], ...patch };

    const { Tax_Amount, Amount } = calculateRowAmount(
      updatedRow,
      index,
      itemsValues,
    );

    Object.entries(patch).forEach(([key, val]) =>
      setValue(`items.${index}.${key}`, val, {
        shouldValidate: true,
        shouldDirty: true,
      }),
    );

    setValue(`items.${index}.Tax_Amount`, Tax_Amount, { shouldDirty: true });

    setValue(`items.${index}.Amount`, Amount, { shouldDirty: true });

    // Recalculate total after the current row has changed
    const updatedItems = [...itemsValues];

    updatedItems[index] = {
      ...updatedItems[index],
      ...patch,
      Tax_Amount,
      Amount,
    };

    const rawTotal = updatedItems.reduce(
      (sum, item) => sum + (Number(item.Amount) || 0),
      0,
    );

    const discountPercentage =
      Number(watch("Transaction_Discount_Percentage")) || 0;

    const discountAmount = Number(watch("Transaction_Discount_Amount")) || 0;

    const calculatedDiscount =
      discountPercentage > 0
        ? (rawTotal * discountPercentage) / 100
        : discountAmount;

    if (discountPercentage > 0) {
      setValue("Transaction_Discount_Amount", calculatedDiscount.toFixed(2), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const roundOffValue = isRoundOff ? Number(watch("Round_Off")) || 0 : 0;

    const finalTotal =
      Math.max(0, rawTotal - calculatedDiscount) + roundOffValue;

    setValue("Total_Amount", finalTotal.toFixed(2), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleAddRow = () => append(emptyRow());

  const handleDeleteRow = (i) => {
    const remaining = itemsValues.filter((_, idx) => idx !== i);

    const newRawTotal = remaining.reduce(
      (sum, row) => sum + num(row.Amount),
      0,
    );

    remove(i);

    const discountPercentage =
      Number(watch("Transaction_Discount_Percentage")) || 0;

    const discountAmount = Number(watch("Transaction_Discount_Amount")) || 0;

    const calculatedDiscount =
      discountPercentage > 0
        ? (newRawTotal * discountPercentage) / 100
        : discountAmount;

    if (discountPercentage > 0) {
      setValue("Transaction_Discount_Amount", calculatedDiscount.toFixed(2), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const roundOffValue = isRoundOff ? Number(watch("Round_Off")) || 0 : 0;

    const newTotal =
      Math.max(0, newRawTotal - calculatedDiscount) + roundOffValue;

    setValue("Total_Amount", newTotal.toFixed(2), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /* ───────────────────────── PAYMENT SPLITS (mirrors PurchaseAdd) ───────────────────────── */
  const getRowIdentifier = (type, bankId) =>
    type === "Bank" ? `bank_${bankId ?? ""}` : type;

  const needsReference = splitsValues.some(
    (s) => s.Payment_Type === "Cheque" || s.Payment_Type === "Bank",
  );

  const totalPayment = splitsValues.reduce((sum, s) => sum + num(s.Amount), 0);

  const handleAddPaymentType = () => {
    appendSplit({
      Payment_Type: "",
      Bank_Account_Id: null,
      Reference_Number: "",
      Amount: "",
    });
    setShowSplitBox(true);
  };

  // Auto-fill the single split's Amount with Total_Amount, one-directional only
  useEffect(() => {
    if (splitsValues.length === 1) {
      setValue("splits.0.Amount", totalAmountWatch, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountWatch, splitsValues.length]);

  // One-directional: recompute Balance_Due whenever total or splits change.
  // Total_Paid is only auto-derived from splits when there are 2+ payment rows;
  // with 0 or 1 rows the user can type Total_Paid directly.
  useEffect(() => {
    const bal = (Number(totalAmountWatch) || 0) - totalPayment;
    setValue("Balance_Due", bal.toFixed(2), { shouldDirty: true });
    if (splitsValues.length > 1) {
      setValue("Total_Paid", totalPayment.toFixed(2), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmountWatch, totalPayment, splitsValues.length]);

  /* ───────────────────────── ROUND OFF ───────────────────────── */
  const handleRoundOffToggle = (e) => {
    const isChecked = e.target.checked;

    setIsRoundOff(isChecked);

    const rawTotal = getRawTotal();

    if (isChecked) {
      const discountPercentage =
        Number(watch("Transaction_Discount_Percentage")) || 0;

      const discountAmount = Number(watch("Transaction_Discount_Amount")) || 0;

      const calculatedDiscount =
        discountPercentage > 0
          ? (rawTotal * discountPercentage) / 100
          : discountAmount;

      const totalBeforeRoundOff = Math.max(0, rawTotal - calculatedDiscount);

      const rounded = Math.round(totalBeforeRoundOff);

      const diff = Number((rounded - totalBeforeRoundOff).toFixed(2));

      setOriginalTotal(rawTotal);

      setValue("Round_Off", diff !== 0 ? diff.toFixed(2) : "", {
        shouldValidate: true,
        shouldDirty: true,
      });

      applyRoundOff(diff);
    } else {
      setValue("Round_Off", "", {
        shouldValidate: true,
        shouldDirty: true,
      });

      applyRoundOff(0);
    }
  };

  //TOAST
  const onInvalid = (errors) => {
    if (errors?.Total_Paid) {
      toast.error(
        errors.Total_Paid.message || "Paid amount cannot exceed Total Amount",
      );
      return;
    }

    // Optional: show other validation errors through toast as well
    const firstError = Object.values(errors)[0];

    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  /* ───────────────────────── SUBMIT ───────────────────────── */
  const onSubmit = async (data) => {
    // console.log("SUBMITTED ROUND OFF:", data.Round_Off);

    try {
      const payload = {
        ...data,
      };

      // console.log("Submitting Expense :", payload);
      // console.log(payload.items);

      const response = await createExpense({
        body: payload,
      }).unwrap();

      if (!response.success) {
        toast.error(response.message || "Failed to create expense");
        return;
      }

      toast.success("Expense created successfully");

      setTimeout(() => {
        navigate("/expense/categories");
      }, 1200);
    } catch (error) {
      console.error(error);

      toast.error(
        error?.data?.message || error?.message || "Something went wrong",
      );
    }
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        c.Category_Name?.toLowerCase().includes(categorySearch.toLowerCase()),
      ),
    [categories, categorySearch],
  );

  const filteredItems = (index) => {
    const search = itemSearch[index] || "";

    return items.filter((item) =>
      item.Item_Name?.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const filteredParties = useMemo(() => {
    const list = partiesResponse?.parties || [];

    return list.filter(
      (p) =>
        p.Party_Name?.toLowerCase().includes(partySearch.toLowerCase()) ||
        p.Phone_Number?.includes(partySearch),
    );
  }, [partiesResponse, partySearch]);

  // console.log(partiesResponse);

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
    "West Bengal",
  ];

  return (
    <>
      {/* <div className="sb2-2-2">
                <ul>
                    <li>
                        <NavLink style={{ display: "flex", flexDirection: "row" }} to="/home">
                            <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
                            Dashboard
                        </NavLink>
                    </li>
                </ul>
            </div> */}

      {/* <div style={{ padding: "20px" }} 
            className="flex flex-col bg-white"
            > */}
      <div
        className="flex flex-col bg-white"
        style={{
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          padding: "20px",
          boxSizing: "border-box",
          //  marginTop: "2rem"
        }}
      >
        {/* ── PAGE HEADER ── */}
        <div
          className="inn-title flex flex-row flex-nowrap justify-between items-center"
          style={{ marginTop: "2rem" }}
        >
          <div className="flex items-center flex-nowrap gap-4">
            <h4
              className="text-2xl font-bold whitespace-nowrap"
              style={{ margin: 0, padding: 0 }}
            >
              Add New Expense
            </h4>

            {enableGST && (
              <div
                className="flex items-center gap-3 cursor-pointer select-none whitespace-nowrap"
                style={{ display: "flex", alignItems: "center" }}
                onClick={() =>
                  setGstEnabled((prev) => {
                    const next = !prev;
                    setValue("With_GST", next, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    return next;
                  })
                }
              >
                <span
                  style={{
                    color: gstEnabled ? "#4CA1AF" : "#64748b",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "0.3s",
                  }}
                >
                  GST
                </span>

                <div
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 50,
                    background: gstEnabled
                      ? "linear-gradient(135deg,#4CA1AF,#5db9c8)"
                      : "#dbe4ea",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all .35s ease",
                    boxShadow: gstEnabled
                      ? "0 0 8px rgba(76,161,175,.45)"
                      : "inset 0 0 4px rgba(0,0,0,.08)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: gstEnabled ? 27 : 3,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "all .35s ease",
                      boxShadow: "0 3px 8px rgba(0,0,0,.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: gstEnabled ? "#4CA1AF" : "#94a3b8",
                    }}
                  >
                    {gstEnabled ? "✓" : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(location.state?.from || -1)}
              className="text-white font-bold py-2 px-4 rounded"
              style={{ backgroundColor: "#4CA1AF" }}
            >
              Back
            </button>
          </div>
        </div>

        <div
          //style={{ padding: "16px 0", backgroundColor: "#f1f1f19d" }}
          //className="tab-inn"
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
            padding: "0px",
            backgroundColor: "#f1f1f19d",
          }}
          className="tab-inn flex flex-col"
        >
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="flex flex-col"
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* SCROLLABLE FORM CONTENT */}
            <div
              style={{
                flex: 1,
                minHeight: 0,

                minWidth: 0,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {/* ═══ TOP FIELDS ═══ */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 w-full px-2 heading-wrapper">
                {/* LEFT — Category (+ Party if GST) */}
                <div className="flex flex-col gap-4 w-full sm:w-1/2 lg:w-1/3">
                  {gstEnabled && (
                    <div
                      ref={partyRef}
                      className="flex flex-col relative gap-2 party-class"
                    >
                      <span className="whitespace-nowrap active">
                        Search by Name/Phone
                        <span className="text-red-500">&nbsp;*</span>
                      </span>
                      <div className="relative w-full">
                        <div
                          className="flex flex-row border rounded-md bg-white cursor-pointer"
                          onClick={() => setPartyOpen((prev) => !prev)}
                        >
                          <input
                            type="text"
                            value={partySearch}
                            onChange={(e) => {
                              setPartySearch(e.target.value);
                              setValue("Party_Name", e.target.value, {
                                shouldValidate: true,
                              });
                              setPartyOpen(true);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartyOpen(true);
                            }}
                            placeholder="Search by Name/Phone"
                            className="w-full outline-none py-1 px-2 text-gray-900"
                            style={{
                              marginBottom: 0,
                              border: "none",
                              height: "2rem",
                            }}
                          />
                          <span className="absolute right-2 top-2 text-gray-700">
                            <ChevronDown size={16} />
                          </span>
                        </div>

                        {partyOpen && (
                          <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            <span
                              onClick={() => {
                                setShowPartyModal(true);
                                setPartyOpen(false);
                              }}
                              className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                            >
                              + Add Party
                            </span>

                            {filteredParties.map((party) => {
                              const bal = Number(party.Current_Balance ?? 0);
                              const balColor = bal < 0 ? "#ef4444" : "#16a34a";

                              return (
                                <div
                                  key={party.Party_Id}
                                  onClick={() => {
                                    setPartySearch(party.Party_Name);
                                    setValue("Party_Id", party.Party_Id, {
                                      shouldValidate: true,
                                    });
                                    setValue("Party_Name", party.Party_Name, {
                                      shouldValidate: true,
                                    });
                                    setPartyOpen(false);
                                  }}
                                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer gap-4"
                                  style={{ borderBottom: "1px solid #f3f4f6" }}
                                >
                                  {/* Left — party name */}
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-gray-800 font-medium truncate">
                                      {party.Party_Name}
                                    </span>
                                  </div>

                                  {/* Right — balance */}
                                  <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-xs text-gray-400">
                                      Balance
                                    </span>

                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: balColor }}
                                    >
                                      ₹
                                      {bal.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredParties.length === 0 && (
                              <p className="px-3 py-2 text-gray-500">
                                No Party found
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {showPartyModal && (
                        <PartyAddModal
                          onClose={() => setShowPartyModal(false)}
                          onSave={(newParty) => {
                            setPartySearch(newParty);
                            setValue("Party_Name", newParty, {
                              shouldValidate: true,
                            });
                            setShowPartyModal(false);
                          }}
                        />
                      )}

                      {errors?.Party_Name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.Party_Name.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div
                    ref={categoryRef}
                    className="flex flex-col relative gap-2"
                  >
                    <span className="whitespace-nowrap active">
                      Expense Category
                      <span className="text-red-500">&nbsp;*</span>
                    </span>
                    <div className="relative w-full">
                      <div
                        className="flex flex-row border rounded-md bg-white cursor-pointer"
                        onClick={() => setCategoryOpen((prev) => !prev)}
                      >
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setValue("Category_Name", e.target.value, {
                              shouldValidate: true,
                            });
                            setValue("Category_Type", "Indirect", {
                              shouldValidate: true,
                            });
                            setCategoryOpen(true);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryOpen(true);
                          }}
                          placeholder="Select category"
                          className="w-full outline-none py-1 px-2 text-gray-900"
                          style={{
                            marginBottom: 0,
                            border: "none",
                            height: "2rem",
                          }}
                        />
                        <span className="absolute right-2 top-2 text-gray-700">
                          <ChevronDown size={16} />
                        </span>
                      </div>

                      {categoryOpen && (
                        <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          <span
                            onClick={() => {
                              setShowCategoryModal(true);
                              setCategoryOpen(false);
                            }}
                            className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                          >
                            + Add Expense Category
                          </span>
                          {filteredCategories.map((cat, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setCategorySearch(cat.Category_Name);

                                setValue("Category_Name", cat.Category_Name, {
                                  shouldValidate: true,
                                });

                                setValue(
                                  "Category_Type",
                                  cat.Category_Type || "Indirect",
                                  {
                                    shouldValidate: true,
                                  },
                                );

                                setCategoryOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {cat.Category_Name}
                            </div>
                          ))}
                          {filteredCategories.length === 0 && (
                            <p className="px-3 py-2 text-gray-500">
                              No categories found
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {showCategoryModal && (
                      <AddExpenseCategoryModal
                        onClose={() => setShowCategoryModal(false)}
                        onSave={(newCat) => {
                          setCategorySearch(newCat.Category_Name);

                          setValue("Category_Name", newCat.Category_Name, {
                            shouldValidate: true,
                          });

                          setValue(
                            "Category_Type",
                            newCat.Category_Type || "Indirect",
                            {
                              shouldValidate: true,
                            },
                          );
                        }}
                      />
                    )}

                    {errors?.Category_Name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.Category_Name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT — Expense No + Date */}
                <div
                  className={`grid ${gstEnabled ? "grid-rows-4" : "grid-rows-2"} gap-3 w-full sm:w-1/2 lg:w-1/3 ml-auto`}
                >
                  <div className="flex items-center w-full gap-3 justify-end">
                    <span className="whitespace-nowrap">Expense No :</span>
                    <input
                      type="text"
                      {...register("Expense_Number")}
                      style={{
                        marginBottom: 0,
                        width: "50%",
                        border: "none",
                        borderBottom: "1px solid #d1d5db",
                        background: "transparent",
                      }}
                      className="w-full outline-none text-gray-900"
                      // placeholder="Auto"
                    />
                  </div>
                  <div className="flex flex-col items-end w-full gap-1">
                    <div className="flex items-center w-full gap-3 justify-end">
                      <span className="whitespace-nowrap">Expense Date :</span>
                      <input
                        type="date"
                        {...register("Expense_Date")}
                        style={{
                          marginBottom: 0,
                          border: "none",
                          width: "50%",
                        }}
                        className="w-full outline-none text-gray-900 border-b"
                      />
                    </div>
                    {errors?.Expense_Date && (
                      <p className="text-red-500 text-xs">
                        {errors.Expense_Date.message}
                      </p>
                    )}
                  </div>

                  {/* {gstEnabled && (
                                    <div className="flex flex-col items-end w-full gap-1">
                                        <div className="flex items-center w-full gap-3 justify-end">
                                            <span className="whitespace-nowrap">Bill Date</span>
                                            <input
                                                type="date"
                                                {...register("Bill_Date")}
                                                style={{ marginBottom: 0, border: "none", width: "50%" }}
                                                className="w-full outline-none text-gray-900 border-b"
                                            />
                                        </div>
                                        {errors?.Bill_Date && (
                                            <p className="text-red-500 text-xs">{errors.Bill_Date.message}</p>
                                        )}
                                    </div>
                                )} */}

                  {gstEnabled && enablePlaceOfSupply && (
                    <div className="flex items-center w-full gap-3 justify-end">
                      <span className="whitespace-nowrap">State of Supply</span>

                      <select
                        {...register("State_Of_Supply")}
                        style={{
                          marginBottom: 0,
                          border: "none",
                          width: "50%",
                        }}
                        className="w-full outline-none text-gray-900 border-b"
                      >
                        <option value="">Select</option>

                        {states.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ ITEM TABLE ═══ */}
              {errors?.items?.message && (
                <p className="text-red-500 text-xs mt-4 px-2">
                  {errors.items.message}
                </p>
              )}
              <div className="table-responsive table-desi">
                <table
                  className="table table-hover w-full"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "3%" }}>#</th>
                      <th>Item</th>
                      {gstEnabled && <th>HSN Code</th>}
                      <th style={{ width: "6%" }}>Qty</th>
                      {/* <th style={{ width: "9%" }}>Unit</th> */}
                      <th style={{ width: gstEnabled ? "13%" : "auto" }}>
                        Price/Unit
                      </th>
                      {gstEnabled && <th style={{ width: "12%" }}>Discount</th>}
                      <th style={{ width: "10%" }}>Tax</th>
                      <th style={{ width: "8%" }}>Tax Amount</th>
                      <th style={{ width: "9%" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, i) => (
                      <tr key={field.id}>
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(i)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "red",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                margin: 0,
                                height: 14,
                                width: 14,
                                lineHeight: "14px",
                              }}
                            >
                              <Trash2 size={14} style={{ display: "block" }} />
                            </button>
                            <span
                              style={{
                                lineHeight: "14px",
                                fontSize: "inherit",
                              }}
                            >
                              {i + 1}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div
                            ref={(el) => (itemRefs.current[i] = el)}
                            className="relative"
                          >
                            <input
                              type="text"
                              value={
                                itemSearch[i] ?? itemsValues[i]?.Item_Name ?? ""
                              }
                              placeholder="Item Name"
                              className="w-full outline-none border-b-2 text-gray-900"
                              style={{ marginBottom: 0 }}
                              onClick={() => setItemOpen(i)}
                              onChange={(e) => {
                                const value = e.target.value;

                                setItemSearch((prev) => ({
                                  ...prev,
                                  [i]: value,
                                }));

                                recalcRow(i, {
                                  Item_Name: value,
                                });

                                setItemOpen(i);
                              }}
                            />

                            {itemOpen === i && (
                              <div className="absolute z-20 w-full bg-white border rounded shadow max-h-48 overflow-y-auto">
                                {filteredItems(i).length > 0 && (
                                  <>
                                    {/* Header */}
                                    <div
                                      className="flex justify-between px-3 py-2 border-b bg-gray-100"
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#64748b",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 2,
                                      }}
                                    >
                                      <span>ITEM</span>
                                      <span>PRICE</span>
                                    </div>

                                    {filteredItems(i).map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          setItemSearch((prev) => ({
                                            ...prev,
                                            [i]: item.Item_Name,
                                          }));

                                          recalcRow(i, {
                                            Item_Name: item.Item_Name,
                                            Item_HSN: item.Item_HSN || "",
                                            // Item_Unit: item.Item_Unit || "",
                                            Price: item.Price || "",
                                            Quantity: 1,
                                            // Price_Type: item.Price_Type || "Tax Excluded",
                                            Tax_Type: item.Tax_Type || "None",
                                          });

                                          setItemOpen(null);
                                        }}
                                      >
                                        <span>{item.Item_Name}</span>

                                        <span
                                          style={{
                                            fontSize: "13px",
                                            color: "#444",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {Number(
                                            item.Price || 0,
                                          ).toLocaleString("en-IN")}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}

                                {filteredItems(i).length === 0 && (
                                  <div className="px-3 py-2 text-gray-500">
                                    No Items Found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {errors?.items?.[i]?.Item_Name && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Item_Name.message}
                            </p>
                          )}
                        </td>

                        {gstEnabled && (
                          <td>
                            <input
                              type="text"
                              maxLength={8}
                              {...register(`items.${i}.Item_HSN`)}
                              onChange={(e) => {
                                e.target.value = e.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                );
                                setValue(
                                  `items.${i}.Item_HSN`,
                                  e.target.value,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  },
                                );
                              }}
                              placeholder="HSN Code"
                              className="w-full outline-none border-b-2 text-gray-900"
                              style={{ marginBottom: 0 }}
                            />

                            {errors?.items?.[i]?.Item_HSN && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.items[i].Item_HSN.message}
                              </p>
                            )}
                          </td>
                        )}

                        <td>
                          <input
                            type="text"
                            value={itemsValues[i]?.Quantity ?? ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              recalcRow(i, { Quantity: val });
                            }}
                            placeholder="Qty"
                            className="w-full outline-none border-b-2 text-gray-900"
                            style={{ marginBottom: 0 }}
                          />
                          {errors?.items?.[i]?.Quantity && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Quantity.message}
                            </p>
                          )}
                        </td>

                        <td>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={itemsValues[i]?.Price ?? ""}
                              onChange={(e) => {
                                const val = sanitizeAmount(e.target.value);
                                recalcRow(i, { Price: val });
                              }}
                              placeholder="Price"
                              className="outline-none border-b-2 text-gray-900"
                              style={{
                                marginBottom: 0,
                                flex: "1 1 50px",
                                minWidth: "20px",
                              }}
                            />
                          </div>
                          {errors?.items?.[i]?.Price && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Price.message}
                            </p>
                          )}
                        </td>

                        {gstEnabled && (
                          <td>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={itemsValues[i]?.Discount_On_Price ?? ""}
                                onChange={(e) => {
                                  const val = sanitizeAmount(e.target.value);
                                  recalcRow(i, { Discount_On_Price: val });
                                }}
                                placeholder="Disc."
                                className="w-1/2 outline-none border-b-2 text-gray-900"
                                style={{ marginBottom: 0 }}
                              />
                              <select
                                value={
                                  itemsValues[i]?.Discount_Type_On_Price ??
                                  "Percentage"
                                }
                                onChange={(e) =>
                                  recalcRow(i, {
                                    Discount_Type_On_Price: e.target.value,
                                  })
                                }
                                style={{ fontSize: 12, width: "65%" }}
                              >
                                <option value="Percentage">%</option>
                                <option value="Amount">Amount</option>
                              </select>
                            </div>
                          </td>
                        )}

                        <td>
                          <select
                            value={itemsValues[i]?.Tax_Type ?? "None"}
                            onChange={(e) =>
                              recalcRow(i, { Tax_Type: e.target.value })
                            }
                            style={{ fontSize: 12, width: "100%" }}
                          >
                            <option value="None">NONE</option>
                            {enableGST && (
                              <>
                                <option value="IGST0">IGST@0%</option>
                                <option value="GST0">GST@0%</option>
                                <option value="IGST0.25">IGST@0.25%</option>
                                <option value="GST0.25">GST@0.25%</option>
                                <option value="IGST3">IGST@3%</option>
                                <option value="GST3">GST@3%</option>
                                <option value="IGST5">IGST@5%</option>
                                <option value="GST5">GST@5%</option>
                                <option value="IGST12">IGST@12%</option>
                                <option value="GST12">GST@12%</option>
                                <option value="IGST18">IGST@18%</option>
                                <option value="GST18">GST@18%</option>
                                <option value="IGST28">IGST@28%</option>
                                <option value="GST28">GST@28%</option>
                              </>
                            )}
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            value={itemsValues[i]?.Tax_Amount ?? ""}
                            readOnly
                            className="w-full outline-none text-gray-500"
                            style={{
                              marginBottom: 0,
                              backgroundColor: "transparent",
                            }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            value={itemsValues[i]?.Amount ?? ""}
                            readOnly
                            placeholder="Amount"
                            className="w-full outline-none border-b-2 font-semibold"
                            style={{
                              marginBottom: 0,
                              backgroundColor: "transparent",
                              textAlign: "left",
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr>
                      {/* # */}
                      <td></td>

                      {/* Item */}
                      <td>Total</td>

                      {/* HSN Code */}
                      {gstEnabled && <td></td>}

                      {/* Quantity */}
                      <td
                        style={{
                          textAlign: "right",
                        }}
                      >
                        {itemTotals.totalQty.toFixed(2)}
                      </td>

                      {/* Price / Unit */}
                      <td></td>

                      {/* Discount */}
                      {gstEnabled && (
                        <td
                          style={{
                            textAlign: "right",
                          }}
                        >
                          ₹{itemTotals.totalDiscount.toFixed(2)}
                        </td>
                      )}

                      {/* Tax */}
                      <td></td>

                      {/* Tax Amount */}
                      <td
                        style={{
                          textAlign: "right",
                        }}
                      >
                        ₹{itemTotals.totalTaxAmount.toFixed(2)}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          textAlign: "right",
                        }}
                      >
                        ₹{itemTotals.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-white font-bold py-2 px-4 rounded"
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                    + Add Row
                  </button>
                </div>

                {/* ═══ PAYMENT + TOTALS ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-4 w-full mt-4">
                  {/* Payment splits */}
                  <div className="flex flex-col px-2">
                    <div className="flex flex-col mt-3 gap-2 w-full sm:w-128">
                      {!showSplitBox ? (
                        <>
                          <div className="flex flex-col relative w-full">
                            <span className="active">Payment Type</span>

                            <input
                              type="hidden"
                              {...register("splits.0.Payment_Type")}
                            />

                            <PaymentTypeSelect
                              value={
                                splitsValues[0]?.Payment_Type === "Bank"
                                  ? `bank_${splitsValues[0]?.Bank_Account_Id || ""}`
                                  : splitsValues[0]?.Payment_Type || "Cash"
                              }
                              banks={banks}
                              onAddBank={() => {
                                setActiveSplitRow(0);
                                setShowBankModal(true);
                              }}
                              onChange={(val) => {
                                if (val.startsWith("bank_")) {
                                  setValue("splits.0.Payment_Type", "Bank", {
                                    shouldDirty: true,
                                  });
                                  setValue(
                                    "splits.0.Bank_Account_Id",
                                    Number(val.replace("bank_", "")),
                                    { shouldDirty: true },
                                  );
                                } else {
                                  setValue("splits.0.Payment_Type", val, {
                                    shouldDirty: true,
                                  });
                                  setValue("splits.0.Bank_Account_Id", null, {
                                    shouldDirty: true,
                                  });
                                }
                              }}
                            />
                          </div>

                          {needsReference && (
                            <div className="mt-3 flex flex-col">
                              <label className="text-sm">
                                Reference Number
                              </label>
                              <input
                                type="text"
                                style={{ marginBottom: 0 }}
                                {...register("splits.0.Reference_Number")}
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleAddPaymentType}
                            className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                            }}
                          >
                            + Add Payment Type
                          </button>
                        </>
                      ) : (
                        <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3">
                          {splitFields.map((field, index) => {
                            const currentIdentifier = getRowIdentifier(
                              splitsValues[index]?.Payment_Type,
                              splitsValues[index]?.Bank_Account_Id,
                            );
                            const rowNeedsRef =
                              splitsValues[index]?.Payment_Type === "Cheque" ||
                              splitsValues[index]?.Payment_Type === "Bank";

                            const usedValues = splitsValues
                              .map((s, idx) =>
                                idx === index
                                  ? null
                                  : getRowIdentifier(
                                      s.Payment_Type,
                                      s.Bank_Account_Id,
                                    ),
                              )
                              .filter(Boolean);

                            return (
                              <div
                                key={field.id}
                                className="flex flex-col gap-2"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                  <div className="flex flex-col relative">
                                    <span className="text-xs text-gray-500 mb-1">
                                      Payment Type
                                    </span>

                                    <PaymentTypeSelect
                                      value={currentIdentifier || ""}
                                      banks={banks}
                                      usedValues={usedValues}
                                      onAddBank={() => {
                                        setActiveSplitRow(index);
                                        setShowBankModal(true);
                                      }}
                                      onChange={(val) => {
                                        if (val.startsWith("bank_")) {
                                          setValue(
                                            `splits.${index}.Payment_Type`,
                                            "Bank",
                                            { shouldDirty: true },
                                          );
                                          setValue(
                                            `splits.${index}.Bank_Account_Id`,
                                            Number(val.replace("bank_", "")),
                                            { shouldDirty: true },
                                          );
                                        } else {
                                          setValue(
                                            `splits.${index}.Payment_Type`,
                                            val,
                                            { shouldDirty: true },
                                          );
                                          setValue(
                                            `splits.${index}.Bank_Account_Id`,
                                            null,
                                            { shouldDirty: true },
                                          );
                                        }
                                      }}
                                    />
                                  </div>

                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 mb-1">
                                      Amount
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="Amount"
                                      style={{
                                        marginBottom: 0,
                                        width: "80%",
                                      }}
                                      className="border rounded-md px-2 py-1.5"
                                      value={splitsValues[index]?.Amount ?? ""}
                                      onChange={(e) => {
                                        const val = sanitizeAmount(
                                          e.target.value,
                                        );
                                        setValue(
                                          `splits.${index}.Amount`,
                                          val,
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          },
                                        );
                                      }}
                                    />
                                    {errors?.splits?.[index]?.Amount && (
                                      <p className="text-red-500 text-xs mt-1">
                                        {errors.splits[index].Amount.message}
                                      </p>
                                    )}
                                  </div>

                                  {splitFields.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeSplit(index)}
                                      className="text-gray-500"
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        marginTop: "25px",
                                        alignSelf: "flex-start",
                                      }}
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </div>

                                {rowNeedsRef && (
                                  <input
                                    type="text"
                                    placeholder="Reference Number"
                                    style={{ width: "80%" }}
                                    {...register(
                                      `splits.${index}.Reference_Number`,
                                    )}
                                  />
                                )}
                              </div>
                            );
                          })}

                          {errors?.splits?.message && (
                            <p className="text-red-500 text-xs">
                              {errors.splits.message}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              appendSplit({
                                Payment_Type: "",
                                Bank_Account_Id: null,
                                Reference_Number: "",
                                Amount: "",
                              })
                            }
                            className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
                            style={{
                              background: "transparent",
                              border: "none",
                            }}
                          >
                            + Add Another Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Round off + Total */}
                  <div
                    style={{ width: "100%" }}
                    className="grid grid-rows-2 gap-2 w-full sm:w-1/2 lg:w-1/3 ml-auto mr-2"
                  >
                    <div
                      style={{ width: "100%" }}
                      className="flex flex-col gap-4 mt-3 w-full"
                    >
                      {/* Transaction-wise Discount — own row, on top */}
                      {enableTransactionWiseDiscount && gstEnabled &&(
                        <div
                          className="flex items-center gap-2 justify-end ml-auto"
                          style={{ width: "100%" }}
                        >
                          <span className="font-medium whitespace-nowrap">
                            Discount
                          </span>

                          {/* Discount Percentage */}
                          <input
                            type="text"
                            placeholder="%"
                            className="form-control"
                            style={{
                              marginBottom: "0px",
                              height: "1.5rem",
                              width: "100px",
                              textAlign: "right",
                            }}
                            {...register("Transaction_Discount_Percentage")}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, "");

                              const parts = val.split(".");

                              if (parts.length > 2) {
                                val = parts[0] + "." + parts.slice(1).join("");
                              }

                              if (val.includes(".")) {
                                const [integerPart, decimalPart] =
                                  val.split(".");
                                val =
                                  integerPart + "." + decimalPart.slice(0, 3);
                              }

                              const numericValue = Number(val);

                              if (val !== "" && numericValue > 100) {
                                toast.error(
                                  "Discount percentage cannot be greater than 100%",
                                );

                                // Restore previous valid value
                                const previousValue =
                                  watch("Transaction_Discount_Percentage") ||
                                  "";

                                e.target.value = previousValue;

                                return;
                              }

                              e.target.value = val;

                              const percentage = Number(val) || 0;
                              const rawTotal = getRawTotal();

                              const discountAmount =
                                (rawTotal * percentage) / 100;

                              setValue("Transaction_Discount_Percentage", val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              setValue(
                                "Transaction_Discount_Amount",
                                discountAmount > 0
                                  ? discountAmount.toFixed(2)
                                  : "",
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                },
                              );

                              const roundOffValue = isRoundOff
                                ? Number(watch("Round_Off")) || 0
                                : 0;

                              const finalTotal =
                                Math.max(0, rawTotal - discountAmount) +
                                roundOffValue;

                              setValue("Total_Amount", finalTotal.toFixed(2), {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                          />

                          {/* Discount Amount */}
                          <input
                            type="text"
                            placeholder="Amount"
                            className="form-control"
                            style={{
                              marginBottom: "0px",
                              height: "1.5rem",
                              width: "100px",
                              textAlign: "right",
                            }}
                            {...register("Transaction_Discount_Amount")}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, "");

                              const parts = val.split(".");

                              if (parts.length > 2) {
                                val = parts[0] + "." + parts.slice(1).join("");
                              }

                              if (val.includes(".")) {
                                const [integerPart, decimalPart] =
                                  val.split(".");
                                val =
                                  integerPart + "." + decimalPart.slice(0, 3);
                              }

                              e.target.value = val;

                              const amount = Number(val) || 0;
                              const rawTotal = getRawTotal();

                              const percentage =
                                rawTotal > 0 ? (amount / rawTotal) * 100 : 0;

                              setValue("Transaction_Discount_Amount", val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              setValue(
                                "Transaction_Discount_Percentage",
                                amount > 0 ? percentage.toFixed(3) : "",
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                },
                              );

                              const roundOffValue = isRoundOff
                                ? Number(watch("Round_Off")) || 0
                                : 0;

                              const finalTotal =
                                Math.max(0, rawTotal - amount) + roundOffValue;

                              setValue("Total_Amount", finalTotal.toFixed(2), {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                          />
                        </div>
                      )}

                      {/* Round Off + Total Amount — share one row */}
                      <div
                        style={{ width: "100%" }}
                        className="flex justify-between items-center gap-6 w-full mr-4"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="roundOffCheck"
                            className="w-4 h-4 cursor-pointer"
                            checked={isRoundOff}
                            onChange={handleRoundOffToggle}
                          />

                          <span className="font-medium whitespace-nowrap">
                            Round Off
                          </span>

                          <input
                            type="text"
                            {...register("Round_Off")}
                            readOnly={!isRoundOff}
                            onChange={(e) => {
                              const val = e.target.value;

                              setValue("Round_Off", val, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              const numVal = parseFloat(val) || 0;

                              applyRoundOff(numVal);
                            }}
                            style={{
                              marginTop: "10px",
                              width: "60px",
                              height: "1.5rem",
                            }}
                            className="border border-gray-300 text-right text-sm"
                          />
                        </div>

                        <div
                          style={{ width: "100%" }}
                          className="flex items-center gap-2"
                        >
                          <span className="font-medium whitespace-nowrap">
                            Total Amount
                          </span>
                          <input
                            style={{
                              marginBottom: 0,
                              backgroundColor: "transparent",
                              height: "1rem",
                              border: "none",
                              borderBottom: "1px solid #d1d5db",
                            }}
                            type="text"
                            value={totalAmountWatch}
                            readOnly
                          />
                        </div>
                      </div>
                      {errors?.Total_Amount && (
                        <p className="text-red-500 text-xs">
                          {errors.Total_Amount.message}
                        </p>
                      )}

                      {gstEnabled && (
                        <>
                          <div
                            style={{ width: "100%" }}
                            className="flex items-center gap-3 relative"
                          >
                            <div className="flex items-center gap-2 relative">
                              <input
                                type="checkbox"
                                id="totalPaidCheck"
                                className="w-4 h-4 cursor-pointer"
                                disabled={splitsValues.length > 1}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  const total = parseFloat(totalAmountWatch);
                                  if (!total || isNaN(total)) return;

                                  if (isChecked) {
                                    setValue("Total_Paid", total.toFixed(2), {
                                      shouldDirty: true,
                                    });
                                    setValue("Balance_Due", "0.00", {
                                      shouldDirty: true,
                                    });
                                  } else {
                                    setValue("Total_Paid", "0.00", {
                                      shouldDirty: true,
                                    });
                                    setValue("Balance_Due", total.toFixed(2), {
                                      shouldDirty: true,
                                    });
                                  }
                                  if (splitsValues.length === 1) {
                                    setValue(
                                      "splits.0.Amount",
                                      isChecked ? total.toFixed(2) : "",
                                      { shouldDirty: true },
                                    );
                                  }
                                }}
                              />
                              <span className="font-medium whitespace-nowrap">
                                Total Paid
                              </span>
                            </div>

                            <input
                              type="text"
                              value={watch("Total_Paid")}
                              readOnly={splitsValues.length > 1}
                              onChange={(e) => {
                                if (splitsValues.length > 1) return;
                                const val = sanitizeAmount(e.target.value);
                                setValue("Total_Paid", val, {
                                  shouldDirty: true,
                                });

                                const total = parseFloat(totalAmountWatch) || 0;
                                const paid = parseFloat(val) || 0;
                                setValue(
                                  "Balance_Due",
                                  (total - paid).toFixed(2),
                                  { shouldDirty: true },
                                );

                                if (splitsValues.length === 1) {
                                  setValue("splits.0.Amount", val, {
                                    shouldDirty: true,
                                  });
                                }
                              }}
                              style={{
                                marginBottom: 0,
                                height: "1rem",
                                width: "100%",
                                backgroundColor: "transparent",
                                border: "none",
                                borderBottom: "1px solid #d1d5db",
                              }}
                            />
                            {/* Total Paid validation is shown through toast */}
                          </div>

                          <div
                            style={{ width: "100%" }}
                            className="flex gap-2 items-center"
                          >
                            <span className="font-medium whitespace-nowrap">
                              Balance Due
                            </span>
                            <input
                              style={{
                                backgroundColor: "transparent",
                                marginBottom: 0,
                                height: "1rem",
                                width: "100%",
                                border: "none",
                                borderBottom: "1px solid #d1d5db",
                              }}
                              type="text"
                              value={watch("Balance_Due")}
                              readOnly
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ ACTION BUTTONS ═══ */}
            <div
              className="flex justify-end gap-4"
              style={{
                //flexShrink: 0,
                background: "#fff",
                borderTop: "1px solid #e2e8f0",
                padding: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/expense/all-expenses")}
                className="text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#94a3b8" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingExpense}
                className="text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isAddingExpense ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {showBankModal && (
            <BankAccountModal
              onClose={() => {
                setShowBankModal(false);
                setActiveSplitRow(null);
              }}
              onSave={(bank) => {
                if (activeSplitRow !== null) {
                  setValue(`splits.${activeSplitRow}.Payment_Type`, "Bank");

                  setValue(
                    `splits.${activeSplitRow}.Bank_Account_Id`,
                    bank.Bank_Account_Id,
                  );
                }

                setShowBankModal(false);
                setActiveSplitRow(null);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
