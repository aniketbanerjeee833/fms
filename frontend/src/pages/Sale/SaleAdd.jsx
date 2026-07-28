
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi, useGetAllItemsQuery } from "../../redux/api/itemApi";
import { useRef } from "react";
import { useEffect } from "react";


import { toast } from "react-toastify";

import { useDispatch } from "react-redux";
import { saleApi, useAddSaleMutation, useGetLatestInvoiceNumberQuery } from "../../redux/api/saleApi";
import { saleFormSchema } from "../../schema/saleFormSchema";

import PartyAddModal from "../../components/Modal/PartyAddModal";
import { LayoutDashboard } from "lucide-react";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";
import AddUnitModal from "../../components/Modal/AddUnitModal";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";




export default function SaleAdd() {

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



  const navigate = useNavigate();
  const { data: parties } = useGetAllPartiesQuery();
  const { data: items } = useGetAllItemsQuery();
  //console.log(items,parties);
  const { data: banks = [] } = useGetAllBankAccountsQuery();
  //const { data: categories, isLoading: isLoadingCategories } = useGetAllCategoriesQuery()
  const [open, setOpen] = useState(false);
  //const[categoryOpen,setCategoryOpen] = useState(false);
  //const [showModal, setShowModal] = useState(false);
  //const[selected,setSelected] = useState([]);
  const [partySearch, setPartySearch] = useState("");
  const [originalTotal, setOriginalTotal] = useState(null);

  // const [newCategory, setNewCategory] = useState("");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    item: null,
    rowIndex: null
  });
  const { data: latestInvoiceNumber, refetch } = useGetLatestInvoiceNumberQuery();

  // force refetch on component mount
  useEffect(() => {
    refetch();
  }, []);
  const [showGSTIN, setShowGSTIN] = useState("");
  console.log(latestInvoiceNumber, "latestInvoiceNumber");

  //  const itemUnits = {
  //     "gm": "Gram",
  //     "Kg": "Kilogram",
  //     "lt": "Litre",
  //     "pcs": "Piece",

  //   }
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
  const { data: itemUnits = [] } = useGetAllItemUnitsQuery();
  console.log(itemUnits, "itemUnits");
  // const {data: itemUnitsFetched} = useGetAllItemUnitsQuery();
  // console.log(itemUnitsFetched, "itemUnitsFetched");
  // const itemUnits=itemUnitsFetched
  //     const [rows, setRows] = useState([
  //   { itemSearch: "", itemOpen: false } // ✅ only UI state here
  // ]);
  useEffect(() => {
    setValue("Invoice_Number", latestInvoiceNumber?.newInvoiceNumber);
  }, [latestInvoiceNumber]);

  const [rows, setRows] = useState([
    {
      itemSearch: "", itemOpen: false, isExistingItem: false, isHSNLocked: false,
      isUnitLocked: false, CategoryOpen: false, categorySearch: ""
    }
  ]);

  const [addSale, { isLoading: isAddingSale }] = useAddSaleMutation();
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      Party_Name: "",
      GSTIN: "",
      Invoice_Number: "",
      Invoice_Date: "",
      State_Of_Supply: "",
      Total_Amount: "",
      Balance_Due: "",
      Total_Received: "",
      Payment_Type: "Cash",
      Bank_Account_Id: null,   // 🔹 added
      Reference_Number: "",
      items: [{


        Item_Category: "",
        Item_Name: "",
        Quantity: 0,
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
      Quantity: 0,
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



  // const calcAll = (data) => {
  //   // ensure items exist & valid
  //   const cleanedItems = (data.items || [])
  //     .filter((it) => (it.Item_Name || "").trim() !== "")
  //     .map(calculateRowAmount);

  //   const totalAmount = cleanedItems.reduce(
  //     (sum, it) => sum + num(it.Amount),
  //     0
  //   );

  //   const totalReceived = num(data.Total_Received); // optional
  //   const balanceDue = totalAmount - totalReceived;

  //   return {
  //     items: cleanedItems,
  //     totals: {
  //       Total_Amount: totalAmount.toFixed(2),
  //       Total_Received: totalReceived.toFixed(2),
  //       Balance_Due: balanceDue.toFixed(2),
  //     },
  //   };
  // };


  //const itemsValues = watch("items"); // watch all rows
  const formValues = watch();




  const onSubmit = async (data) => {
    console.log("Form Data (from RHF):", data);


    if (!data.items || data.items.length === 0) {
      toast.error("Please add at least one item before saving the sale.");
      return;
    }

    // ✅ Clean up items (optional safety — remove blank rows)
    const cleanedItems = data.items.filter(
      (it) => it.Item_Name && it.Item_Name.trim() !== ""
    );

    if (cleanedItems.length === 0) {
      toast.error("Please add at least one valid item with a name.");
      return;
    }

    // ✅ Validate no duplicates
    const seenItems = new Set();
    for (const item of cleanedItems) {
      const name = item.Item_Name?.trim().toLowerCase();

      if (seenItems.has(name)) {
        toast.error(`Duplicate item '${item.Item_Name}' found.`);
        return;
      }
      seenItems.add(name);
    }

    // ✅ Ensure all items have tax & amount values (since auto-calculated)
    const itemsWithDefaults = cleanedItems.map((item) => ({
      ...item,
      Tax_Type: item.Tax_Type || "None",
      Tax_Amount: item.Tax_Amount || "0.00",
      Amount: item.Amount || "0.00",
    }));

    // ✅ Build final payload
    const payload = {
      ...data,
      items: itemsWithDefaults,
      Total_Amount: data.Total_Amount || 0,
      Total_Received: data.Total_Received || 0,
      Balance_Due:
        data.Balance_Due ||
        ((data.Total_Amount || 0) - (data.Total_Received || 0)),
    };

    console.log("📦 Final Payload Sent:", payload);

    try {
      const res = await addSale({
        body: payload,
      }).unwrap();
      console.log(" successfully:", res);
      const resData = res?.data || res;
      dispatch(itemApi.util.invalidateTags(["Item"]));
      dispatch(saleApi.util.invalidateTags(["Sale"]));
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      dispatch(bankAccountApi.util.invalidateTags([
        { type: "BankAccount", id: payload.Bank_Account_Id },
        "BankAccount",   // ← this hits getAllBankAccounts which providesTags: ["BankAccount"]
      ]));
      if (!resData?.success) {
        toast.error("Failed to add new sale");
        return;
      } else {
        toast.success("New Sale added successfully!");
        navigate("/sale/all-sales");
      }

    } catch (error) {
      const errorMessage =
        error?.data?.message || error?.message || "Failed to add new sale";
      toast.error(errorMessage);
      // toast.error("Failed to add lead");
      console.error("Submission failed", error);
    }
  }


  useEffect(() => {
    const gstin = parties?.parties?.find(
      (party) => party.Party_Name === watch("Party_Name")
    )?.GSTIN;

    setShowGSTIN(gstin || ""); // ✅ never undefined
  }, [watch("Party_Name"), parties]);


  const handleItemSelect = (it, i) => {
    console.log("Selected Item:", it, "at row", i);
    setRows((prev) => {
      const updated = [...prev];
      updated[i] = {
        ...updated[i],
        Item_Category: it.Item_Category || "",
        Item_HSN: it.Item_HSN || "",
        categorySearch: it.Item_Category || "",
        isExistingItem: true,
        isHSNLocked: true,
        isUnitLocked: true,
      };
      return updated;
    });

    handleRowChange(i, "itemSearch", it.Item_Name);
    handleRowChange(i, "isExistingItem", true);
    handleRowChange(i, "CategoryOpen", false);

    setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0.0, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${i}.Tax_Type`, it.Tax_Type, { shouldValidate: true, shouldDirty: true });
    handleRowChange(i, "itemOpen", false);

    const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
      {
        ...itemsValues[i],
        Item_Name: it.Item_Name,
        Sale_Price: it.Sale_Price,
        Quantity: itemsValues[i]?.Quantity || 0,
        Discount_On_Sale_Price: itemsValues[i]?.Discount_On_Sale_Price || 0,
        Discount_Type_On_Sale_Price: itemsValues[i]?.Discount_Type_On_Sale_Price,
        Tax_Type: itemsValues[i]?.Tax_Type,
      },
      i,
      itemsValues
    );

    setValue(`items.${i}.Tax_Amount`, Tax_Amount);
    setValue(`items.${i}.Amount`, Amount);
    setValue(`Total_Amount`, Total_Amount);
    setValue(`Balance_Due`, Balance_Due);
  };

  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
  const paymentType = watch("Payment_Type", "");
  console.log(itemsValues, "itemsValues");
  return (
    <>
      <div className="sb2-2-2">
        <ul>
          {/* <li>
                            <NavLink to="/home">
                                <i className="fa fa-home mr-2" aria-hidden="true"></i>
                                Dashboard
                            </NavLink>
                        </li> */}
          <NavLink style={{ display: "flex", flexDirection: "row" }}
            to="/home"

          >
            <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
            {/* <i className="fa fa-home mr-2" aria-hidden="true"></i> */}
            Dashboard
          </NavLink>

        </ul>
      </div>

      {/* Main Content */}
      {/* <div className="sb2-2-3">
                    <div className="row" style={{margin: "0px"}}>
                        <div className="col-md-12">
                            <div style={{padding: "20px"}}
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
              <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">Add New Sale</h4>
              {/* <p className="text-gray-500 mb-2 sm:mb-4">
        Add new sale details
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
                onClick={() => navigate("/sale/all-sales")}
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


            <div className="flex flex-col justify-between gap-6 w-full sm:flex-row heading-wrapper">
              {/* <div className="flex flex-wrap justify-between gap-6 w-full "> */}

              {/* <div className="flex justify-between"> */}
              <div className="grid grid-rows-2 ml-2 w-full sm:w-1/2 lg:w-1/3 ">

                {/* <div className="input-field  relative"> */}
                <div className="flex flex-col relative mt-2 gap-2 party-class"
                  style={{ marginBottom: "0px", marginTop: "0px" }}>

                  {/* <div className="grid grid-cols-[140px_1fr] items-center gap-2"> */}
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
                          setValue("Party_Name", value, { shouldValidate: true, shouldDirty: true });
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
                              setValue("Party_Name", matchedParty.Party_Name, { shouldValidate: true, shouldDirty: true });
                              setValue("GSTIN", matchedParty.GSTIN || "", { shouldValidate: true, shouldDirty: true });
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
                                setValue("Party_Name", party.Party_Name, { shouldValidate: true, shouldDirty: true });
                                setValue("GSTIN", party.GSTIN || "", { shouldValidate: true, shouldDirty: true });
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
                      onSave={(newParty) => {
                        setPartySearch(newParty);
                        setValue("Party_Name", newParty, { shouldValidate: true, shouldDirty: true });
                        setShowPartyModal(false);
                      }}
                    />
                  )}

                  {/* RHF Error */}
                  {errors?.Party_Name && (
                    <p className="text-red-500 text-xs mt-1">{errors?.Party_Name?.message}</p>
                  )}
                </div>

                {/* <div className="input-field   "> */}


                <div className="input-field  flex gap-4
                              justify-center items-center  gstin-class">
                  <span className=" whitespace-nowrap active ">
                    GSTIN

                  </span>

                  <input
                    type="text"
                    style={{ marginBottom: "0px" }}
                    id=" GSTIN"
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

                  {/* Label */}
                  <span className="whitespace-nowrap ">
                    Invoice Number <span className="text-red-500">*</span>
                  </span>

                  {/* Input */}
                  <input
                    type="text"
                    id="Invoice_Number"
                    {...register("Invoice_Number")}
                    placeholder="Invoice Number"
                    readOnly

                    // className="  outline-none text-gray-900 py-1 bg-transparent"
                    className="
       invoice-number-class
      outline-none 
      text-gray-900 
      py-1 
      bg-transparent "



                    style={{ marginBottom: 0, border: "none", width: "50%" }}
                  />

                </div>

                {/* Error message */}
                {errors?.Invoice_Number && (
                  <p className="text-red-500 text-xs mt-1">{errors.Invoice_Number.message}</p>
                )}




                {/* Invoice Date */}
                <div className="flex items-center w-full gap-3 justify-end">
                  {/* <div className="grid grid-cols-[140px_0.9fr] items-center gap-2"> */}
                  {/* <div className="input-field  "> */}
                  <span className=" whitespace-nowrap active">
                    Invoice Date
                    <span className="text-red-500">*</span>
                  </span>

                  <input
                    style={{ marginBottom: 0, width: "50%", border: "none" }}
                    type="date"
                    id=" Invoice_Date"
                    {...register("Invoice_Date")}
                    placeholder=" Invoice_Date"
                    className="w-full outline-none text-gray-900 invoice-date-class"
                    min={
                      latestInvoiceNumber?.latestInvoiceInfo?.createdAt
                        ? new Date(latestInvoiceNumber?.latestInvoiceInfo?.createdAt).toISOString().split("T")[0]
                        : ""
                    } // ✅ Prevent earlier dates
                  />
                  {errors?.Invoice_Date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors?.Invoice_Date?.message}
                    </p>
                  )}
                </div>






                {/* State of Supply */}
                <div className="flex
                                           items-center w-full gap-3 justify-end
                                           state-of-supply-class">
                  {/* <div className="grid grid-cols-[140px_0.9fr] items-center gap-2"> */}
                  {/* <div className="input-field  "> */}
                  <span className=" whitespace-nowrap active">
                    State of Supply
                    <span className="text-red-500">*</span>
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

                      <td
                        style={{ padding: "0px", position: "relative" }}>

                        <div ref={(el) => (categoryRefs.current[i] = el)}>



                          <input
                            type="text"
                            value={rows[i]?.categorySearch || watch(`items.${i}.Item_Category`) || ""}
                            style={{ marginBottom: "0px" }}
                            readOnly

                            placeholder="Category"
                            className="w-full outline-none border-b-2 text-gray-900"
                          // readOnly={rows[i]?.isExistingItem} // 🔒 lock if item exists
                          />

                          {errors?.items?.[i]?.Item_Category && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.items[i].Item_Category.message}
                            </p>
                          )}


                        </div>

                      </td>


                      <td style={{ padding: "0px", width: "18%", position: "relative" }}>
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
                                // ✅ Only store if it's a valid item
                                setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true, shouldDirty: true });
                                handleRowChange(i, "isExistingItem", true);
                              } else {
                                // ❌ Clear Item_Name in RHF to trigger error
                                setValue(`items.${i}.Item_Name`, "", { shouldValidate: true, shouldDirty: true });
                                handleRowChange(i, "isExistingItem", false);
                              }
                              //handleRowChange(i, "isExistingItem", exists); // false if new item
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
                                          if (it.Stock_Quantity <= 0) {
                                            // show confirmation modal instead of directly adding
                                            setConfirmModal({ open: true, item: it, rowIndex: i });
                                            return;
                                          }

                                          // ✅ proceed directly if stock > 0
                                          handleItemSelect(it, i);
                                        }}
                                        className="hover:bg-gray-100 cursor-pointer border-b"
                                      >
                                        <td>{idx + 1}</td>
                                        <td className="px-3 py-2">{it.Item_Name}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Sale_Price || 0}</td>
                                        <td className="px-3 py-2 text-gray-600">{it.Purchase_Price || 0}</td>
                                        {/* <td className="px-3 py-2 text-gray-500">{it.Stock_Quantity || 0}</td> */}
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
                          {confirmModal.open && (
                            <div
                              className="fixed inset-0 
    flex items-center justify-center 
    bg-white z-50 bg-opacity-50"
                            >
                              <div className="bg-white p-6 rounded-lg shadow-lg
     w-96 relative">
                                <h3 style={{ color: "red" }} className="text-lg font-semibold mb-4
       text-center ">
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
                                    className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white 
          hover:bg-[#4CA1AF]"
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
                          )}


                          {/* RHF error */}

                        </div>

                      </td>

                      {/*HSN Code */}
                      <td style={{ padding: "0px", width: "8%" }}>
                        <input
                          type="text"
                          readOnly
                          value={rows[i]?.Item_HSN || watch(`items.${i}.Item_HSN`) || ""}

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
                          value={watch(`items.${i}.Quantity`)?.toString() || ""}
                          {...register(`items.${i}.Quantity`, { valueAsNumber: true })}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9]/g, "");
                            //let stockQty = items?.items?.find((item) => item.Item_Name === itemsValues[i]?.Item_Name)?.Stock_Quantity || 0;
                            //console.log(stockQty);

                            if (!itemsValues[i]?.Item_Name?.trim()) return;

                            // ✅ Clamp value
                            let num = parseInt(value, 10);

                            if (isNaN(num) || num < 0) {
                              num = 0; // reset to 0
                            }

                            // ✅ Update only via RHF
                            setValue(`items.${i}.Quantity`, num, { shouldValidate: true, shouldDirty: true });

                            // ✅ Recalculate row + totals
                            const { Tax_Amount, Amount, Total_Amount, Balance_Due } =
                              calculateRowAmount({ ...itemsValues[i], Quantity: num || 0 }, i, itemsValues);

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


                      {/* Unit */}
                      {/* <td style={{ padding: "0px" ,width: "8%" }}>
  <Controller
    control={control}
    name={`items.${i}.Item_Unit`}
    render={({ field }) => (
      <select
        {...field}
        className="form-select "
        style={{ width: "100%", fontSize: "12px",marginLeft:"0px" }}
        disabled={rows[i]?.isUnitLocked} // ✅ lock only if item is from dropdown
        onChange={(e) => {
          const value = e.target.value;
          handleRowChange(i, "Item_Unit", value);
          setValue(`items.${i}.Item_Unit`, value);
        }}
      >
        <option value="">Select</option>
        {Object.entries(itemUnits).map(([key, value]) => (
          <option key={key} value={key}>
            {`${value} (${key})`}
          </option>
        ))}
      </select>
    )}
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
                            {...register(`items.${i}.Sale_Price`)}
                            //         onChange={(e) => {
                            //   let val = e.target.value;

                            //   // ✅ allow digits and one dot
                            //   val = val.replace(/[^0-9.]/g, "");

                            //   // ✅ if more than one dot, keep only the first
                            //   const parts = val.split(".");
                            //   if (parts.length > 2) {
                            //     val = parts[0] + "." + parts.slice(1).join(""); // collapse extra dots
                            //   }

                            //   // ✅ limit to 2 decimal places
                            //   if (val.includes(".")) {
                            //     const [int, dec] = val.split(".");
                            //     val = int + "." + dec.slice(0, 2);
                            //   }

                            //   e.target.value = val;
                            // //setValue(`items.${i}.Sale_Price`, Number(val), { shouldValidate: true, shouldDirty: true });
                            //   if (!itemsValues[i]?.Item_Name || itemsValues[i]?.Item_Name.trim() === "") {
                            //     return;
                            //   }


                            //     const { Tax_Amount, Amount, Total_Amount,Balance_Due } = calculateRowAmount(
                            //     { ...itemsValues[i], Sale_Price: val },
                            //     i,
                            //     itemsValues
                            //   );

                            //   setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                            // }}
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
                              setValue(`items.${i}.Sale_Price`, val, { shouldValidate: true, shouldDirty: true });

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
                            //           onInput={(e) => {
                            //             e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            // //                 const { Tax_Amount, Amount ,Total_Amount} = calculateRowAmount({
                            // //   ...itemsValues[i],

                            // //   Discount_On_Purchase_Price: e.target.value,

                            // // });
                            //     const { Tax_Amount, Amount, Total_Amount,Balance_Due } = calculateRowAmount(
                            //   { ...itemsValues[i], Discount_On_Sale_Price: e.target.value },
                            //   i,
                            //   itemsValues
                            // );

                            //   setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue(`items.${i}.Amount`, Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue("Total_Amount", Total_Amount, { shouldValidate: true, shouldDirty: true });
                            //   setValue("Balance_Due", Balance_Due, { shouldValidate: true, shouldDirty: true });
                            // // setValue(`items.${i}.Tax_Amount`, Tax_Amount);
                            // // setValue(`items.${i}.Amount`, Amount);

                            //           }}
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
                                val = int + "." + dec;
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


                                  const { Tax_Amount, Amount, Total_Amount, Balance_Due } = calculateRowAmount(
                                    { ...itemsValues[i], Discount_Type_On_Sale_Price: e.target.value },
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
                              style={{
                                width: "100%", fontSize: "12px", marginBottom: "0px",
                                pointerEvents: "none", // ✅ visually disabled
                                cursor: "not-allowed",
                                backgroundColor: "#f3f4f6", // light gray
                              }}
                              onChange={(e) => {
                                field.onChange(e); // ✅ update RHF value

                                // const { Tax_Amount, Amount,Total_Amount } = calculateRowAmount({
                                //   ...itemsValues[i],
                                //   Tax_Type: e.target.value,
                                // });
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
              <div className="grid grid-cols-2 sm:grid-cols-2 px-2 gap-4 w-full sale-wrapper">

                {/* <div className="flex flex-col sm:flex-row justify-between gap-4 w-full"> */}
                {/* <div className="flex  justify-between gap-4 w-full">  */}
                {/* Add Row Button */}
                {/* LEFT SECTION */}
                <div className="flex flex-col px-2 w-full sm:w-64 sale-left">

                  {/* <div className="flex flex-col px-2 w-full sm:w-64"> */}
                  {/* <div className="flex flex-col px-2 w-1/8"> */}
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className=" text-white font-bold py-2 px-4 w-1/2 rounded  "
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                    + Add Row
                  </button>
                  <div className="flex flex-col  mt-3 gap-2  w-full sm:w-64"
                  >
                    {/* <div className="flex flex-col w-full">
                  <span className="active">Payment Type</span>
                 
                    <select id="Payment_Type" {...register("Payment_Type")}
                     >
                      <option value="">Select Payment Type</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Neft">Neft</option>
                    </select>
                    {errors?.Payment_Type && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors?.Payment_Type?.message}
                      </p>
                    )}
                  </div> */}
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
                  </div>
                </div>
                {/* <div className="grid grid-rows-3 gap-2 w-full sm:w-1/2 lg:w-1/3 ml-auto mr-2 sale-right">


 
     <div className="flex  gap-3 items-center justify-end w-full sm:w-auto">
      <div className="flex items-center gap-4 relative">
         
        

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

      setValue("Total_Amount", rounded.toFixed(2), { shouldValidate: true, shouldDirty: true });
      setValue("Balance_Due", (rounded - totalReceived).toFixed(2), { shouldValidate: true, shouldDirty: true });

    } else {
      if (originalTotal !== null) {
        setValue("Total_Amount", originalTotal.toFixed(2), { shouldValidate: true, shouldDirty: true });

        setValue(
          "Balance_Due",
          (originalTotal - totalReceived).toFixed(2),
          { shouldValidate: true, shouldDirty: true }
        );
      }
    }
  }}
/>


           <span className="font-medium whitespace-nowrap">Round Off</span>
      </div>
    <span className="font-medium whitespace-nowrap"
        >Total Amount</span>
    <input
      style={{ backgroundColor: "transparent" ,marginBottom:"0px",width:"50%",
        height:"1rem"
      }}
      type="text"
      className="form-control  "
      {...register("Total_Amount")}
      value={watch("Total_Amount") || ""}
      readOnly
    />
  </div>


  <div className="flex items-center  gap-3 relative justify-end">
{/* 
  

  <div className="flex items-center gap-4 relative">
    <input
      type="checkbox"
     
      
      id="totalReceivedCheck"
        className="w-4 h-4 cursor-pointer"
      // className="w-4 h-4 cursor-pointer p-3 mr-4 absolute top-0.2 right-30"
          onChange={(e) => {
  const isChecked = e.target.checked;
  const totalAmount = parseFloat(watch("Total_Amount"));

  // 🧠 If no total amount entered, do nothing
  if (!totalAmount || isNaN(totalAmount)) {
    // Optional: visually reset the checkbox
   

    // Clear both fields to stay consistent
    setValue("Total_Received", "");
    setValue("Balance_Due", "");
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
    style={{marginBottom:"0px", height:"1rem",width:"50%"}}
    onChange={(e) => {
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
    }}
    // className="form-control"
  />
</div>



  
  <div className="flex  gap-3 items-center justify-end">
    <span className="font-medium whitespace-nowrap">Balance Due</span>
    <input
      style={{ backgroundColor: "transparent",marginBottom:"0px",height:"1rem",width:"50%" }}
      type="text"
      className="form-control  "
      {...register("Balance_Due")}
      // value={watch("Balance_Due") || ""}
      readOnly
    />
  </div>
</div> */}
                <div style={{ width: "100%" }}
                  className="grid grid-rows-2 gap-2  sm:w-1/2 lg:w-1/3 ml-auto mr-2 sale-right">


                  <div style={{ width: "100%" }}
                    className="flex justify-between items-start gap-6  mr-4">
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
                      // disabled={!watch("roundOffCheck") && originalTotal === null}
                      />
                    </div>

                    <div style={{ width: "100%" }}
                      className="flex flex-col gap-4 mt-3 ">
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



                      <div style={{ width: "100%" }}
                        className="flex items-center  gap-3 relative ">

                        <div className="flex items-center gap-2 relative">

                          <input
                            type="checkbox"


                            id="totalReceivedCheck"
                            className="w-4 h-4 cursor-pointer"
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const totalAmount = parseFloat(watch("Total_Amount"));

                              // 🧠 If no total amount entered, do nothing
                              if (!totalAmount || isNaN(totalAmount)) {
                                // Optional: visually reset the checkbox


                                // Clear both fields to stay consistent
                                setValue("Total_Received", "");
                                setValue("Balance_Due", "");
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
                          onChange={(e) => {
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
                          }}
                        // className="form-control"
                        />
                      </div>




                      <div style={{ width: "100%" }}
                        className="flex  gap-2 items-center ">

                        <span className="font-medium whitespace-nowrap">Balance Due</span>
                        <input
                          style={{ backgroundColor: "transparent", marginBottom: "0px", height: "1rem", width: "100%" }}
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

                onClick={() => navigate("/sale/all-sales")}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formValues.errorCount > 0 || isAddingSale}
                className=" text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isAddingSale ? "Saving..." : "Save"}
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
        // onSave={({  unitKey }) => {
        //   // 1️⃣ Add unit to dropdown list
        //   // setItemUnits((prev) => ({
        //   //   ...prev,
        //   //   [unitKey]: unitName,
        //   // }));

        //   // 2️⃣ Auto-select newly added unit
        //   setValue(`items.${activeUnitRow}.Item_Unit`, unitKey);
        //   handleRowChange(activeUnitRow, "Item_Unit", unitKey);

        //   // 3️⃣ Close modal
        //   setShowAddUnitModal(false);
        //   setActiveUnitRow(null);
        // }}
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

  /* Dropdown fix so it does NOT go off-screen */
  // .party-class .absolute {
  //   width: 100% !important;
  //   left: 0 !important;
  // }

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


//#4CA1AF
{/* <input
                                            type="text"
                                            style={{marginBottom:"0px",marginTop:"0px"}}
                                            id="Party_Name"
                                            value={partySearch}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setPartySearch(value);
                                              setValue("Party_Name", value, { shouldValidate: true, shouldDirty: true });
                                              setOpen(true);
                                            }}
                                            onClick={() => setOpen((prev) => !prev)}
                                            onBlur={() => {
                                              const typedValue = partySearch.trim().toLowerCase();
                                        
                                              // ✅ Full match only (not partial)
                                              const matchedParty = parties?.parties?.find(
                                                (party) => party.Party_Name.toLowerCase() === typedValue
                                              );
                                        
                                              if (matchedParty) {
                                                // ✅ Set full party info
                                                setPartySearch(matchedParty.Party_Name);
                                                setValue("Party_Name", matchedParty.Party_Name, { shouldValidate: true, shouldDirty: true });
                                        
                                                // ✅ Check GSTIN (must be present)
                                                if (!matchedParty.GSTIN || matchedParty.GSTIN.trim() === "") {
                                               
                                                  setValue("GSTIN", "", { shouldValidate: true, shouldDirty: true });
                                                } else {
                                                  setValue("GSTIN", matchedParty.GSTIN, { shouldValidate: true, shouldDirty: true });
                                                }
                                        
                                               
                                              } else {
                                                // ❌ Not an exact match → clear field
                                                setPartySearch("");
                                                setValue("Party_Name", "");
                                              }
                                        
                                              setTimeout(() => setOpen(false), 150);
                                            }}
                                            placeholder="Party Name"
                                            className="w-full outline-none border-b-2 text-gray-900"
                                          />
                                        
                                
                                          {open && (
                                            <div className="absolute top-20 z-20 flex flex-col mt-1
                                             w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                              <span
                                                onClick={() => setShowPartyModal(true)}
                                                className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                                              >
                                                + Add Party
                                              </span>
                                        
                                              {parties?.parties
                                                ?.filter(
                                                  (party) =>
                                                    party?.Party_Name?.toLowerCase().includes(partySearch.toLowerCase()) ||
                                                    party?.Phone_Number?.includes(partySearch)
                                                )
                                                .map((party, i) => (
                                                  <div
                                                    key={i}
                                                    onClick={() => {
                                                      // Select from dropdown
                                                      setPartySearch(party.Party_Name);
                                                      setValue("Party_Name", party.Party_Name, { shouldValidate: true, shouldDirty: true });
                                        
                                                      // ✅ GSTIN validation on selection
                                                      if (!party.GSTIN || party.GSTIN.trim() === "") {
                                                        
                                                        setValue("GSTIN", "", { shouldValidate: true, shouldDirty: true });
                                                      } else {
                                                        setValue("GSTIN", party.GSTIN, { shouldValidate: true, shouldDirty: true });
                                                      }
                                        
                                                     
                                                      setOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                  >
                                                    {party.Party_Name} ({party.Phone_Number})
                                                  </div>
                                                ))}
                                        
                                             
                                              {parties?.parties?.filter((party) =>
                                                party?.Party_Name?.toLowerCase().includes(partySearch.toLowerCase())
                                              ).length === 0 && (
                                                <p className="px-3 py-2 text-gray-500">No Party found</p>
                                              )}
                                            </div>
                                          )} */}