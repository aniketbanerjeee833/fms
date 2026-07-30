import { useDispatch } from "react-redux";
import {  useState,useRef,useEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import { Controller, useFieldArray, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { itemApi,  useGetAllNewItemsQuery } from "../../redux/api/itemApi";



import { toast } from "react-toastify";


import { saleApi, useEditNewSaleMutation, useGetSingleSaleQuery } from "../../redux/api/saleApi";
import { saleFormSchema } from "../../schema/saleFormSchema";

import PartyAddModal from "../../components/Modal/PartyAddModal";
import { LayoutDashboard } from "lucide-react";





export default function NewSaleEdit() {
    const { id: Sale_Id } = useParams();
  const dispatch=useDispatch();
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
const itemRefs = useRef([]);  



const navigate=useNavigate();
    const { data: sale } 
    = useGetSingleSaleQuery(Sale_Id, {
        skip: Sale_Id === undefined,
    });
    const { data: parties} = useGetAllPartiesQuery();
  const { data: items } = useGetAllNewItemsQuery();
    // console.log(items);
      //const { data: categories, isLoading: isLoadingCategories } = useGetAllCategoriesQuery()
    const[open,setOpen] = useState(false);

    const[partySearch,setPartySearch] = useState("");
     //const [newCategory, setNewCategory] = useState("");
     const[showPartyModal,setShowPartyModal] = useState(false);
 
 //const [showGSTIN, setShowGSTIN] = useState("");
 //console.log(latestInvoiceNumber,"latestInvoiceNumber");

 const itemUnits = {
    "gm": "Gram",
    "Kg": "Kilogram",
    "lt": "Litre",
    "pcs": "Piece",

  }

  const {
      control,
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(saleFormSchema),
      defaultValues:{
        Party_Name: "",
      
        Invoice_Number: "",
        Invoice_Date: "",
        State_Of_Supply: "",
        Total_Amount: "",
        Balance_Due: "",
        Total_Received: "",
        Payment_Type: "Cash",
        Reference_Number: "",
        items:[{

        
          Item_Category: "",
          Item_Name: "",
           Quantity: 0,
          Item_Unit:"",
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

// useEffect(() => {
//     setValue("Invoice_Number", latestInvoiceNumber?.newInvoiceNumber);
// },[latestInvoiceNumber]);
// const handleAddCategory = async () => {

//   if(newCategory.trim()===""){
//     return
//   }
//   else if (newCategory.trim() !== "") {
//     try {
//       // ✅ Call backend
//       const res = await addCategory({
//         body: { Item_Category: newCategory.trim() },
//       });

//       // Some RTK Query wrappers put the response under `.data`
//       const data = res?.data || res;

//       if (data?.success) {
//         const addedCat = newCategory.trim();

//         // ✅ Auto-select the new category (single value)
//         setSelected(addedCat);
//         setValue("Item_Category", addedCat); // directly set single category

//         // ✅ Refresh cache
//         dispatch(itemApi.util.invalidateTags(["Category"]));

//         // ✅ Reset modal & input
//         setShowModal(false);
//         setNewCategory("");
//         setOpen(true);
//       } else {
//         console.warn("⚠️ Category not added. Response:", data);
//       }
//     } catch (err) {
//       console.error("❌ Error adding category:", err);
//     }
//   }
// };

const [rows, setRows] = useState([
  { itemSearch: "", itemOpen: false, isExistingItem: false, isHSNLocked: false, 
    isUnitLocked: false, CategoryOpen: false, categorySearch: "",itemQuantity:0 ,itemTaxType:"" },
]);

const[editNewSale,{isLoading:isEditingSale}]=useEditNewSaleMutation();
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
  console.log(row,"row",index,"index",itemsValues,"itemsValues");
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







    useEffect(() => {
  const gstin = parties?.parties?.find(
    (party) => party.Party_Name === watch("Party_Name")
  )?.GSTIN;

  //setShowGSTIN(gstin || ""); // ✅ never undefined
  setValue("GSTIN", gstin ); // keep RHF in sync
}, [watch("Party_Name"), parties]);
const toLocalDateString = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // ✅ in yyyy-mm-dd for input[type="date"]
};
useEffect(() => {
    if(sale){
     
         setPartySearch(sale.invoicePartyDetails.Party_Name);
           const prefilledRows = sale.items.map((it) => ({
      ...it,
      itemSearch: it.Item_Name || "", // for UI display
      isExistingItem: true,           // lock category/HSN if needed
      isHSNLocked: true,
      isUnitLocked: true,
      CategoryOpen: false,
      itemOpen: false,
      itemQuantity: it.Quantity||0,
      itemTaxType: it.Tax_Type||"None",
    }));

    setRows(prefilledRows);
   
          reset({
            Party_Name: sale.invoicePartyDetails?.Party_Name || "",
            Invoice_Number: sale.invoicePartyDetails?.Invoice_Number || "",
        
         Invoice_Date: toLocalDateString(sale.invoicePartyDetails?.Invoice_Date),
            //  Invoice_Date: sale.invoicePartyDetails?.Invoice_Date,
            State_Of_Supply: sale.invoicePartyDetails?.State_Of_Supply || "",
            Total_Amount: sale.invoicePartyDetails?.Total_Amount || "",
            Total_Received: sale.invoicePartyDetails?.Total_Received || "",
            Balance_Due: sale.invoicePartyDetails?.Balance_Due || "",
            Payment_Type: sale.invoicePartyDetails?.Payment_Type || "",
            Reference_Number: sale.invoicePartyDetails?.Reference_Number || "",
            items: sale.items || [],
          })
    }
},[sale]);
useEffect(() => {
  if (sale) {
  
    setValue("GSTIN", sale.GSTIN ? String(sale.GSTIN) : "");

  }
}, [sale]);
console.log(sale)
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
 const paymentType = watch("Payment_Type", "");
 
//   const onSubmit = async(data) => {
//   console.log("Form Data (from RHF):", data);

//   const { items, totals } = calcAll(data);

//   // 2) build payload
//   const payload = {
//     ...data,
//     items,
//     Total_Amount: totals.Total_Amount,
//     Total_Received: totals.Total_Received,           // blank -> 0.00
//     Balance_Due: totals.Balance_Due,
//   };
//   // if(errors){
//   //   toast.error("Failed to add new sale,please add items");
//   //   return;
//   // }
//   const seen = new Set();
//   const itemQuantity={}
// for (const item of formValues.items) {
//   const name = item.Item_Name?.trim().toLowerCase();
   
//   if (seen.has(name)) {
//     toast.error(`Duplicate items detected '${item.Item_Name}' found. Please ensure each item appears only once.`);
//     return;
//   }
//   seen.add(name);

  

// }
// for(const item of formValues.items){
//   const name = item.Item_Name?.trim().toLowerCase();
//   if(!itemQuantity[name]){
//     itemQuantity[name] = item.Quantity;
//   }else{
//     itemQuantity[name] += item.Quantity
//   }
  
// }
// for(const item of items){
//   if(itemQuantity[item.Item_Name].Quantity> item.Quantity){
//     toast.error(`Item Stock exceeded '${item.Item_Name}' found. Please ensure that each item quantity not less than ${itemQuantity[item.Item_Name].Quantity} .`);
//     return;
//   }
// }

//   try{
//     const res = await editSale({
//        Sale_Id,
//       body: payload,
//     }).unwrap();
//     console.log(" successfully:", res);
//     const resData = res?.data || res;
//     dispatch(itemApi.util.invalidateTags(["Item"]));
//     dispatch(saleApi.util.invalidateTags(["Sale"]));
//     if(!resData?.success){
//       toast.error("Failed to add new sale");
//       return;
//     }else{
//       toast.success("New Sale added successfully!");
//      navigate("/sale/all-sales");
//     } 

//   }catch(error){
//     const errorMessage =
//       error?.data?.message || error?.message || "Failed to add new lead";
//     toast.error(errorMessage);
//     // toast.error("Failed to add lead");
//     console.error("Submission failed", error);
//   }
// }
//  const onSubmit = async (data) => {
//   console.log("Form Data (from RHF):", data);

//   // 1️⃣ Recalculate totals before sending
//   const { items, totals } = calcAll(data);

//   // 2️⃣ Build payload
//   const payload = {
//     ...data,
//     items,
//     Total_Amount: totals.Total_Amount,
//     Total_Received: totals.Total_Received || 0.0,
//     Balance_Due: totals.Balance_Due,
//   };

//   // 3️⃣ Ensure items exist
//   if (!payload.items || payload.items.length === 0) {
//     toast.error("Please add at least one item before saving the sale.");
//     return;
//   }

//   // 4️⃣ Duplicate check + Quantity aggregation
//   const seenItems = new Set();
//   const itemQuantities = {};

//   for (const item of payload.items) {
//     const name = item.Item_Name?.trim().toLowerCase();
//     const category = item.Item_Category?.trim().toLowerCase();
//     const itemHSN=item.Item_HSN?.trim().toLowerCase();
//     const Quantity=item.Quantity
    
//     if (!name || !category || !itemHSN || !Quantity) {
//       toast.error("Each item must have a valid name, category, HSN and quantity.");
//       return;
//     }

//     // ❌ Prevent duplicates
//     if (seenItems.has(name)) {
//       toast.error(
//         `Duplicate item '${item.Item_Name}' found. Please ensure each item appears only once.`
//       );
//       return;
//     }
//     seenItems.add(name);

//     // ✅ Aggregate quantity
//     itemQuantities[name] = (itemQuantities[name] || 0) + Number(item.Quantity || 0);
//   }

//   // 5️⃣ Stock & Existence validation (STRICT)
//   for (const item of payload.items) {
//     const dbItem = items.find(
//       (it) => it.Item_Name.trim().toLowerCase() === item.Item_Name.trim().toLowerCase()
//     );

//     // ❌ No new items allowed during sale
//     if (!dbItem) {
//       toast.error(
//         `Item '${item.Item_Name}' does not exist in inventory. Please add it in items  first before selling.`
//       );
//       return;
//     }

//     // const availableStock = Number(dbItem.Stock_Quantity || 0);
//     // const requestedQty = itemQuantities[item.Item_Name.trim().toLowerCase()] || 0;

//     // // ❌ Prevent overselling
//     // if (requestedQty > availableStock) {
//     //   toast.error(
//     //     `Insufficient stock for '${item.Item_Name}'. Available: ${availableStock}, Requested: ${requestedQty}.`
//     //   );
//     //   return;
    
//   }

//   // 6️⃣ Everything valid → Proceed with update
//   try {
//     const res = await editSale({
//       Sale_Id,
//       body: payload,
//     }).unwrap();

//     const resData = res?.data || res;

//     dispatch(itemApi.util.invalidateTags(["Item"]));
//     dispatch(saleApi.util.invalidateTags(["Sale"]));

//     if (!resData?.success) {
//       toast.error("Failed to update sale. Please try again.");
//       return;
//     }

//     toast.success("Sale updated successfully!");
//     navigate("/sale/all-sales");
//   } catch (error) {
//     const errorMessage =
//       error?.data?.message || error?.message || "Failed to update sale.";
//     toast.error(errorMessage);
//     console.error("Submission failed:", error);
//   }
// };
const onSubmit = async (data) => {
  console.log("🧾 Form Data (from RHF):", data);

  // ✅ Validate that at least one item is present
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
 
  // ✅ Submit to backend
  try {
    const res = await editNewSale({
      Sale_Id,
      body: payload,
    }).unwrap();

    if (!res?.success) {
      toast.error("Failed to update sale. Please try again.");
      return;
    }

    // ✅ Refresh & navigate
    dispatch(itemApi.util.invalidateTags(["Item"]));
    dispatch(saleApi.util.invalidateTags(["Sale"]));

    toast.success("Sale updated successfully!");
    navigate("/sale/all-new-sales");
  } catch (error) {
    const message =
      error?.data?.message || error?.message || "Failed to update sale.";
    toast.error(message);
    console.error("❌ Submission failed:", error);
  }
};

console.log(itemsValues,"itemsValues");
    return (
        <>
            <div className="sb2-2-2">
                    <ul>
                       
                             <NavLink style={{display:"flex",flexDirection:"row"}}
                                                                to="/home"
                                                    
                                                              >
                                                                <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                                                                {/* <i className="fa fa-home mr-2" aria-hidden="true"></i> */}
                                                                Dashboard
                                                              </NavLink>

                    </ul>
                </div>

                {/* Main Content */}
                <div className="sb2-2-3">
                    <div className="row" style={{   margin: "0px"}}>
                        <div className="col-md-12">
                            <div style={{padding: "20px"}}
                            className="box-inn-sp">
                                  {/* <div className="inn-title">
                                 <div className="flex justify-between">
                               
                                      <div>
                                        <h4 className="text-2xl font-bold mb-2">Edit Sale</h4>
                                        <p className="text-gray-500 mb-6">
                                            Edit sale details
                                        </p>
                                    </div>
                                
                                      <div>
                                            <button
                                                style={{
                                                    outline: "none",
                                                    boxShadow: "none",
                                                    backgroundColor: "#4CA1AF"
                                                 
                                                }}
                                                className=" text-white px-4 py-2 rounded-md"
                                                onClick={() => navigate("/sale/all-sales")}
                                            >All Sales</button>
                                            </div>
                                        </div>
                                        </div> */}
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
      <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Edit Sale</h4>
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
        onClick={() => navigate("/home")}
        className="text-white font-bold py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
        Back
      </button>

      <button
        type="button"
        onClick={() => navigate("/sale/all-new-sales")}
        className="text-white py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
        All Sales
      </button>
    </div>

  </div>
</div>
                                    <div style={{padding:"0px",backgroundColor: "#f1f1f19d"}} className="tab-inn">
                                        <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col justify-between gap-6 w-full sm:flex-row heading-wrapper">
                                        <div className="grid grid-rows-2 ml-2 w-full sm:w-1/2 lg:w-1/3 ">


                                            <div className="w-1/2 flex flex-col relative mt-2 gap-2 party-class"
                                                style={{ marginBottom: "0px", marginTop: "0px" }}>

                                                {/* <div className="grid grid-cols-[140px_1fr] items-center gap-2"> */}
                                                <span className="whitespace-nowrap active ">
                                                    Party
                                                    <span className="text-red-500">*</span>
                                                </span>
                                                  <div className="relative w-full">

                                                    {/* INPUT WITH ARROW ICON */}
                                                    <div
                                                        className="flex  justify-between border rounded-md  bg-white cursor-pointer"
                                                        onClick={() => setOpen((prev) => !prev)}
                                                    >

  <input
    type="text"
    id="Party_Name"
    value={partySearch}
    onChange={(e) => {
      const value = e.target.value;
      setPartySearch(value);
      setValue("Party_Name", value, { shouldValidate: true });
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
       
          setValue("GSTIN", "", { shouldValidate: true });
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
    className="w-full outline-none py-1 px-2  text-gray-900"
    style={{ marginBottom: 0, marginTop: "4px", border: "none", height: "2rem", borderBottom: "0px" }}
  />
   <span className="ml-2  absolute right-5 top-1/3  text-gray-700">
                                                            ▼
                                     </span>
</div>
  {/* Dropdown */}
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
                
                setValue("GSTIN", "", { shouldValidate: true });
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

      {/* No match */}
      {parties?.parties?.filter((party) =>
        party?.Party_Name?.toLowerCase().includes(partySearch.toLowerCase())
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
                              justify-center items-center w-1/2 gstin-class">
                                                <span className=" whitespace-nowrap active ">
                                                    GSTIN

                                                </span>
                    
                    <input
                      type="text"
                      id=" GSTIN"
                // value={showGSTIN || ""}
                  style={{ marginBottom: "0px" }}
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
                                 
                                      <div className="grid grid-rows-3 w-full sm:w-1/2 lg:w-1/3 ml-auto gap-0  mr-2">

                                  
                                     
      {/* Invoice Number */}
                                         <div className="flex items-center w-full gap-3  justify-end">

                                                {/* Label */}
                                                <span className="whitespace-nowrap ">
                                                    Invoice Number <span className="text-red-500">*</span>
                                                </span>
                    
                    <input
                      type="text"
                      id=" Invoice_Number"
                      {...register("Invoice_Number")}
                      placeholder=" Invoice_Number"
                      
                                className="invoice-number-class outline-none  text-gray-900  py-1   bg-transparent " 
                               style={{ marginBottom: 0, border: "none", width: "50%" }}
                      readOnly
                    />
                    {errors?. Invoice_Number && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors?. Invoice_Number?.message}
                      </p>
                    )}
                  </div>
                                  
                                      

                                        {/* Invoice Date */}
                                       <div className="flex items-center w-full gap-3 justify-end">
                                                {/* <div className="grid grid-cols-[140px_0.9fr] items-center gap-2"> */}
                                                {/* <div className="input-field  "> */}
                                                <span className=" whitespace-nowrap active">
                                                    Invoice Date
                                                    <span className="text-red-500">*</span>
                                                </span>
                                            
                    <input
                      type="date"
                      id=" Invoice_Date"
                        style={{ marginBottom: 0, width: "50%", border: "none" }}
                      {...register("Invoice_Date")}
                      placeholder=" Invoice_Date"
                        className="w-full outline-none text-gray-900 invoice-date-class"
    //                       min={
    //   latestInvoiceNumber?.latestInvoiceInfo?.createdAt
    //     ? new Date(latestInvoiceNumber?.latestInvoiceInfo?.createdAt).toISOString().split("T")[0]
    //     : ""
    // } // ✅ Prevent earlier dates
                    />
                    {errors?.Invoice_Date && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors?. Invoice_Date?.message}
                      </p>
                    )}
                                        </div>

                                      
                                    

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
                                                id="stateOfSupply"
                                                 style={{ marginBottom: "0px", width: "50%", border: "none" }}
                                                className="validate mt-2"
                                              
                                                {...register("State_Of_Supply")}
                                            >
                                                <option value="">Select State</option>
                                                <option value="West Bengal">West Bengal</option>
                                                <option value="Maharashtra">Maharashtra</option>
                                                <option value="Karnataka">Karnataka</option>
                                                <option value="Delhi">Delhi</option>
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
  <tbody style={{maxHeight: "10rem", overflowY: "scroll"}}>
  {fields.map((field, i) => (
    <tr key={field.id}>
      {/* Action + Serial Number */}
      <td style={{ padding: "0px" ,textAlign: "center", verticalAlign: "middle" }}>
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
  style={{  padding: "0px" ,position:"relative" }}>
  
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
  {/* Modal */}
 
</td>

      {/* Item Dropdown */}
      <td style={{ padding: "0px",width: "20%",  position: "relative" }}>
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
handleRowChange(i ,"isUnitLocked", false);
   
    const exists = items?.items?.find(
      (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
    );
      if (exists) {
      // ✅ Only store if it's a valid item
      setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
      handleRowChange(i, "isExistingItem", true);
    } else {
      // ❌ Clear Item_Name in RHF to trigger error
      setValue(`items.${i}.Item_Name`, "", { shouldValidate: true });
      handleRowChange(i, "isExistingItem", false);
    }
    //handleRowChange(i, "isExistingItem", exists); // false if new item
  }}
  // onBlur={(e) => {
  //   const typedValue = e.target.value.trim();

  //   const exists = items?.items?.find(
  //     (it) => it.Item_Name.trim().toLowerCase() === typedValue.toLowerCase()
  //   );

  //   if (exists) {
  //     setValue(`items.${i}.Item_Name`, typedValue, { shouldValidate: true });
  //     handleRowChange(i, "isExistingItem", true);
  //   } else {
  //     setValue(`items.${i}.Item_Name`, "", { shouldValidate: true });
  //     handleRowChange(i, "isExistingItem", false);
  //   }
  // }}
  onClick={() => handleRowChange(i, "itemOpen", !rows[i]?.itemOpen)}
  placeholder="Item Name"
  className="w-full outline-none border-b-2 text-gray-900"
/>

{errors?.items?.[i]?.Item_Name && (
  <p className="text-red-500 text-xs mt-1">
    {errors.items[i].Item_Name.message}
  </p>
)}

   {/* {errors?.items?.[i]?.Item_Name && (
          <p className="text-red-500 text-xs mt-1">
            {errors.items[i].Item_Name.message}
          </p>
        )} */}

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
          <th >Sl.No</th>
          <th className="text-left px-3 py-2">Item Name</th>
          <th className="text-left px-3 py-2">Sale Price</th>
         
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
        isHSNLocked: true,      // lock HSN
        isUnitLocked: true,     // lock unit
        itemQuantity: it.Stock_Quantity || 0,
      };
      return updated;
    });
  handleRowChange(i, "itemSearch", it.Item_Name);
  handleRowChange(i, "isExistingItem", true); // ✅ mark as existing
handleRowChange(i,"CategoryOpen",false);
  setValue(`items.${i}.Item_Category`, it.Item_Category, { shouldValidate: true });
  setValue(`items.${i}.Item_Name`, it.Item_Name, { shouldValidate: true, shouldDirty: true });
  setValue(`items.${i}.Item_HSN`, it.Item_HSN, { shouldValidate: true });
  setValue(`items.${i}.Sale_Price`, it.Sale_Price || 0.00, { shouldValidate: true });
  setValue(`items.${i}.Item_Unit`, it.Item_Unit, { shouldValidate: true });
  setValue(`items.${i}.Quantity`,it.Stock_Quantity || 0, { shouldValidate: true });
  setValue(`items.${i}.Tax_Type`, it.Tax_Type, { shouldValidate: true });
  handleRowChange(i, "itemOpen", false);


    const { Tax_Amount, Amount, Total_Amount,Balance_Due } = calculateRowAmount(
    { ...itemsValues[i], 
        Item_Name: it.Item_Name,
    Sale_Price: it.Sale_Price || 0,
    Quantity: itemsValues[i]?.Quantity || 0,
    Discount_On_Sale_Price: itemsValues[i]?.Discount_On_Sale_Price || 0,
    Discount_Type_On_Sale_Price: itemsValues[i]?.Discount_Type_On_Sale_Price,
    Tax_Type: itemsValues[i]?.Tax_Type },
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
              <td className="px-3 py-2 ">{idx + 1}</td>
              <td className="px-3 py-2">{it.Item_Name}</td>
              <td className="px-3 py-2 ">{it.Sale_Price || 0}</td>
              {/* <td className="px-3 py-2 text-gray-600">{it.Purchase_Price || 0}</td> */}
              {/* <td className="px-3 py-2 text-gray-500">{it.Stock_Quantity || 0}</td> */}
                              {/* <td
  style={{
    padding: "0.5rem 0.75rem", // same as Tailwind px-3 py-2
    color: it.Stock_Quantity <= 0 ? "red" : "limegreen",
    fontWeight: "500", // optional: matches Tailwind's medium weight
  }}
>
  {it.Stock_Quantity || 0}
</td> */}
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

        {/* RHF error */}
     
        </div>
      </td>

        {/*HSN Code */}
       <td style={{ padding: "0px",width: "8%"}}>
  <input
    type="text"
    readOnly
    value={rows[i]?.Item_HSN || watch(`items.${i}.Item_HSN`) || ""}
    // onChange={(e) => {
    //   if (!rows[i]?.isHSNLocked) {
    //     handleRowChange(i, "Item_HSN", e.target.value);
    //     setValue(`items.${i}.Item_HSN`, e.target.value);
    //   }
    // }}
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
<td style={{ padding: "0px" ,width: "4%"}}>
  <input
    type="text"
    className="form-control"
    style={{ width: "100%" }}
    value={watch(`items.${i}.Quantity`)?.toString() || ""}
    {...register(`items.${i}.Quantity`, { valueAsNumber: true })}
    onChange={(e) => {
      let value = e.target.value.replace(/[^0-9]/g, "");
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

      let num = parseInt(value, 10);
      if (isNaN(num) || num < 0) num = 0;
      // if (num > effectiveAvailableStock) num = effectiveAvailableStock;

      // ✅ Update via RHF
      setValue(`items.${i}.Quantity`, num, { shouldValidate: true });

      // ✅ Recalculate row + totals
      const { Tax_Amount, Amount, Total_Amount, Balance_Due } =
        calculateRowAmount(
          { ...itemsValues[i], Quantity: num || 0 },
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


      {/* Unit */}
     <td style={{ padding: "0px"  ,width: "10%"}}>
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
</td>


      {/* Price/Unit */}
      <td style={{ padding: "0px",width: "6%" }}>
        <div className="d-flex align-items-center">
          <input
            type="text"
            className="form-control"
            style={{ width: "100%", marginBottom: "0px" }}
            {...register(`items.${i}.Sale_Price`)}
        onChange={(e) => {
  let val = e.target.value;

  // ✅ allow digits and one dot
  val = val.replace(/[^0-9.]/g, "");

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

  if (!itemsValues[i]?.Item_Name || itemsValues[i]?.Item_Name.trim() === "") {
    return;
  }

  // const { Tax_Amount, Amount,Total_Amount } = calculateRowAmount({
  //   ...itemsValues[i],
  //   Purchase_Price: val,
  // });
    const { Tax_Amount, Amount, Total_Amount,Balance_Due } = calculateRowAmount(
    { ...itemsValues[i], Sale_Price: val },
    i,
    itemsValues
  );
 
  setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
  setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
  setValue("Total_Amount", Total_Amount, { shouldValidate: true });
  setValue("Balance_Due", Balance_Due, { shouldValidate: true });
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
      <td style={{ padding: "0px" ,width: "14%" }}>
        <div className="d-flex align-items-center">
          <input
            type="text"
            className="form-control"
            style={{ width: "50%", marginBottom: "0px" }}
            {...register(`items.${i}.Discount_On_Sale_Price`)}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "");
  //                 const { Tax_Amount, Amount ,Total_Amount} = calculateRowAmount({
  //   ...itemsValues[i],
   
  //   Discount_On_Purchase_Price: e.target.value,
   
  // });
      const { Tax_Amount, Amount, Total_Amount,Balance_Due } = calculateRowAmount(
    { ...itemsValues[i], Discount_On_Sale_Price: e.target.value },
    i,
    itemsValues
  );
  
    setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
    setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
    setValue("Total_Amount", Total_Amount, { shouldValidate: true });
    setValue("Balance_Due", Balance_Due, { shouldValidate: true });
  // setValue(`items.${i}.Tax_Amount`, Tax_Amount);
  // setValue(`items.${i}.Amount`, Amount);
            
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

            const { Tax_Amount, Amount, Total_Amount ,Balance_Due} = calculateRowAmount(
    { ...itemsValues[i],  Discount_Type_On_Sale_Price: e.target.value},
    i,
    itemsValues
  );

        setValue(`items.${i}.Tax_Amount`, Tax_Amount, { shouldValidate: true });
        setValue(`items.${i}.Amount`, Amount, { shouldValidate: true });
        setValue("Total_Amount", Total_Amount,  { shouldValidate: true });
        setValue("Balance_Due", Balance_Due,  { shouldValidate: true });
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
        style={{
          width: "100%",
          fontSize: "12px",
          marginBottom: "0px",
          pointerEvents: "none", // ✅ visually disabled
          cursor: "not-allowed",
          backgroundColor: "#f3f4f6", // light gray
        }}
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
     

   <div className="flex flex-col sm:flex-row justify-between gap-4 w-full sale-wrapper">
    
               <div className="flex flex-col px-2 w-full sm:w-64 sale-left">
      <button
        type="button"
        onClick={handleAddRow}
       className=" text-white font-bold py-2 px-4 w-1/2 rounded "
        style={{ backgroundColor: "#4CA1AF" }}
      >
        + Add Row
      </button>
       <div className="flex flex-col  mt-3 gap-2  w-full sm:w-64">
        <div className="flex flex-col w-full">
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
<div className="grid grid-rows-3 gap-2 w-full sm:w-1/2 lg:w-1/3 ml-auto mr-2 sale-right">
                      {/* <div className=" flex flex-col gap-2 w-1/3"> */}
                        {/* Total Amount */}
                          <div className="flex  gap-3 items-center justify-end w-full sm:w-auto">
                        {/* <div className="flex justify-between items-center"> */}
                          <span className="font-medium whitespace-nowrap">Total Amount</span>
    <input
      style={{ backgroundColor: "transparent" ,marginBottom:"0px",width:"50%",height:"1rem"}}
      type="text"
      className="form-control  "
      {...register("Total_Amount")}
      value={watch("Total_Amount") || ""}
      readOnly
    />
  </div>

  {/* Total Paid */}
       <div className="flex items-center  gap-3 relative justify-end">
                        {/* <div className="flex items-center justify-between  gap-2"> */}
                          {/* Checkbox + Label */}
                            <div className="flex items-center gap-4 relative">
    <input
      type="checkbox"
     
      
      id="totalPaidCheck"
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

  {/* Input field */}
  <input
    type="text"
    {...register("Total_Received")}
    style={{marginBottom:"0px", height:"1rem",width:"50%"}}
    placeholder="Enter received amount"
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

      const totalPaid = parseFloat(val || 0);
      const totalAmount = parseFloat(watch("Total_Amount") || 0);
      setValue("Balance_Due", (totalAmount - totalPaid).toFixed(2));
    }}
    className="form-control"
  />
</div>


  {/* Balance Due */}
 {/* Balance Due */}
                         <div className="flex  gap-3 items-center justify-end">
                              <span className="font-medium whitespace-nowrap">Balance Due</span>
                        {/* <div className="flex justify-between items-center"> */}
                          {/* <label className="font-medium">Balance Due</label> */}
                          <input
                             style={{ backgroundColor: "transparent",marginBottom:"0px",height:"1rem",width:"50%" }}
      type="text"
      className="form-control  "
      {...register("Balance_Due")}
      // value={watch("Balance_Due") || ""}
      readOnly
    />
  </div>
</div>
</div>
    </div>
 <div className="flex justify-end gap-4 mt-4">
   <button
                    type="button"
                
                    onClick={() => navigate("/sale/all-new-sales")}
                    className=" text-white font-bold py-2 px-4 rounded"
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formValues.errorCount > 0 ||isEditingSale}
                    className=" text-white font-bold py-2 px-4 rounded"
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                     {isEditingSale ? "Updating..." : "Update Sale"}
                  </button>
                </div>
                                </form>
                                
                                </div>
                                

                            </div>
                        </div>
                    </div>
                </div>
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
