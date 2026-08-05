import { zodResolver } from "@hookform/resolvers/zod";
import { itemFormSchema } from "../../schema/itemFormSchema";
import { useRef } from "react";
import { useState } from "react";
import { itemApi, useAddCategoryMutation, useEditItemMutation, useGetAllCategoriesQuery, useGetEachItemBillAndInvoiceNumbersQuery } from "../../redux/api/itemApi";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { purchaseApi } from "../../redux/api/purchaseApi";
import { saleApi } from "../../redux/api/saleApi";
import SelectUnitModal from "./SelectUnitModal";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";


export default function ItemModal({itemDetails,editingItem,onClose}) {
    const dropdownRef = useRef(null);
    const dispatch = useDispatch()
    
    // const {
    //   register,
    //   //handleSubmit,
    //   setValue,
    //   watch,
       
    //     reset,
        
    //   formState: { errors },
    // } = useForm({
    //   resolver: zodResolver(itemFormSchema)
  
    // })
      const {
        register,
         handleSubmit,
        setValue,
        reset,
        watch,
   
        
        formState: { errors },
      } = useForm({
        resolver: zodResolver(itemFormSchema)
    
      })

    const { data: categories } = useGetAllCategoriesQuery()
   
       const [newCategory, setNewCategory] = useState("");
      const [addCategory] = useAddCategoryMutation();
   const [search, setSearch] = useState("");
     const [open, setOpen] = useState(false);
     const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState("Purchase Items");
    const[eachItemBillAndInvoiceNumbersModalOpen,setEachItemBillAndInvoiceNumbersModalOpen]=useState(false)
    //const primaryUnit = watch("Primary_Unit");
//const secondaryUnit = watch("Secondary_Unit");
//const conversionRate = watch("Conversion_Rate");
    const[editItem,{isLoading:isEditingItem}]=useEditItemMutation()
const [shouldFetchBills, setShouldFetchBills] = useState(false);
const[showSelectUnitModal,setShowSelectUnitModal] =useState(false)
  const {data: itemUnitsFetched} = useGetAllItemUnitsQuery();
  
  const itemUnits=itemUnitsFetched
const { data: apiResponse } =
  useGetEachItemBillAndInvoiceNumbersQuery(itemDetails?.Item_Id, {
    skip: !shouldFetchBills,  // fetch only when user clicks
  });
console.log(itemDetails,"itemDetails")
// const primaryUnit=itemDetails?.Primary_Unit
// const secondaryUnit=itemDetails?.Secondary_Unit
// const conversionRate=itemDetails?.Conversion_Rate

// useEffect(() => {
//   if (!editingItem || !itemDetails) return;

//   reset({
//     Item_Name: itemDetails.Item_Name,
//     Item_Description: itemDetails.Item_Description,
//     Item_Category: itemDetails.Item_Category,
//     Item_Unit: itemDetails.Item_Unit,
//     Item_HSN: itemDetails.Item_HSN,

//     Primary_Unit: itemDetails.Primary_Unit,
//     Secondary_Unit: itemDetails.Secondary_Unit,
//     Conversion_Rate: itemDetails.Conversion_Rate,
//   });
// }, [itemDetails, editingItem, reset]);
useEffect(() => {
  if (!editingItem) return;
  if (!itemDetails) return;
  if (Object.keys(itemDetails).length === 0) return;

  setSearch(itemDetails.Item_Category);

  reset({
    Item_Name: itemDetails.Item_Name,
    Item_Description: itemDetails.Item_Description,
    Item_Category: itemDetails.Item_Category,
    Item_Unit: itemDetails.Item_Unit,
    Item_HSN: itemDetails.Item_HSN,
    Primary_Unit: itemDetails.Primary_Unit,
    Secondary_Unit: itemDetails.Secondary_Unit,
    Conversion_Rate: itemDetails.Conversion_Rate,
  });
}, [itemDetails, editingItem, reset]);
// useEffect(() => {
//   register("Primary_Unit");
//   register("Secondary_Unit");
//   register("Conversion_Rate");
// }, [register]);
const primaryUnit = watch("Primary_Unit");
const secondaryUnit = watch("Secondary_Unit");
const conversionRate = watch("Conversion_Rate");

console.log(primaryUnit, secondaryUnit, conversionRate);
    const eachItemBillAndInvoiceNumbers = apiResponse?.billAndInvoiceNumbers || {
  purchaseDetails: { count: 0, details: [] },
  saleDetails: { count: 0, details: [] },
};

    //  const [showModal, setShowModal] = useState(false);
    


      const handleSelect = (cat) => {
    setSelected(cat);
    setValue("Item_Category", cat); // update react-hook-form
    setOpen(false);
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

//   useEffect(()=>{
// if(!editingItem) return
//  if(!itemDetails) return

//  if(Object.keys(itemDetails).length===0) return
//  setSearch(itemDetails.Item_Category)
//  reset({
//    Item_Name:itemDetails.Item_Name,
//    Item_Description:itemDetails.Item_Description,
//    Item_Category:itemDetails.Item_Category,
//    Item_Unit:itemDetails.Item_Unit,
//    Item_HSN:itemDetails.Item_HSN
//  })


//   },[itemDetails,editingItem])


  
  const handleAddCategory = async () => {
  
    if(newCategory.trim()===""){
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
          setSelected(addedCat);
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
 const formValues = watch();
console.log(formValues,"formValues")
const onSubmit = async () => {
  if (!editingItem) return;

  try {
    const res = await editItem({
      body: formValues,
      Item_Id: itemDetails.Item_Id,
    }).unwrap();

    console.log(res, "res");

    if (res?.success) {
      toast.success(res?.message || "Item Updated Successfully");

      setEachItemBillAndInvoiceNumbersModalOpen(false);
      onClose();

      dispatch(itemApi.util.invalidateTags(["Item"]));
      dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
      dispatch(saleApi.util.invalidateTags(["Sale"]));
    }
  } catch (err) {
    console.error("Failed to update item:", err);

    // ✅ Show exact backend error message
    toast.error(
      err?.data?.message ||
      err?.message ||
      "Failed to update item"
    );
  }
};
   return (
   
   <>
  
  
    
    

  
   
 <div
  style={{
    marginTop: "50px",
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // dim background
    backdropFilter: "blur(4px)", // blur effect
    zIndex: 50,
    padding: "1rem", // ensures spacing on small screens
  }}
>
    <div
      className="bg-white 
      w-full max-w-4xl rounded-lg 
      shadow-lg p-6 
      overflow-y-auto max-h-[90vh]"
    >
          <div className="flex justify-between items-center mb-6"
      style={{paddingBottom:"10px"}}>
        <div className="flex flex-col">
        <h4 className="text-xl font-semibold text-gray-900">
          Edit Item
        </h4>
        {/* <p className="text-gray-500 mb-6">
               Edit item details
              </p> */}
              </div>
        <button
          type="button"
          style={{ backgroundColor: "transparent" }}
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>
                   <div className="flex gap-6 w-full mt-6 pb-3">
                  <div className=" flex space-x-8 pl-4">
                                        {["Purchase Items","Stock"].map((tab) => (
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
                                    
                                    </div>
                                    <div className="tab-inn">
                                      
              <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab ==="Purchase Items"&& (
              <div className=" tab-inn">


                <div className="row">







<div
  style={{ width: "50%" }}
  className="relative mt-3"
  ref={dropdownRef}
>
  <span className="active">Category</span>
  {/* //<span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}

  {/* Search + Dropdown Trigger */}
  <input
    type="text"
    value={search}
    onClick={() => setOpen((prev) => !prev)}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search category"
     className="w-full outline-none border-b-2 text-gray-900 "
  />

  {/* Dropdown List */}
  {open && (
    <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
      {/* Add Category Option */}
      <span
        type="button"
        onClick={() => {
          setShowModal(true);
          setOpen(false);
        }}
        className="w-full text-left px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
      >
        + Add Category
      </span>

      {/* Category List */}
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
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {cat.Item_Category}
          </div>
        ))}

      {/* No match case */}
      {categories?.filter((cat) =>
        cat.Item_Category.toLowerCase().includes(search.toLowerCase())
      ).length === 0 && (
        <p className="px-3 py-2 text-gray-500">No categories found</p>
      )}
    </div>
  )}

  {/* Hidden input for react-hook-form */}
  <input type="hidden" {...register("Item_Category")} value={selected || ""} />

  {/* Modal */}
  {showModal && (
    // <div className="fixed inset-0 flex items-center justify-center 
    //               bg-black bg-opacity-40 backdrop-blur-sm z-30">
    <div
  style={{
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)", // ✅ transparent dark
    backdropFilter: "blur(4px)",        // ✅ hazy blur
    zIndex: 30
  }}>
    {/* // <div className="fixed inset-0 flex items-center justify-center bg-gray-800  z-30"> */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button (top-right) */}
        <button
          type="button"
          style={{ backgroundColor: "transparent" }}
          onClick={() => setShowModal(false)}
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
            onClick={() => setShowModal(false)}
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



                  <div className="input-field col s6 ">
                    <span className="active">
                      Item Name
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
                      <p className="text-red-500 text-xs mt-1">
                        {errors?.Item_Name?.message}
                      </p>
                    )}
                  </div>

              

                </div>
              
                <div className="row">
<div className="input-field col s6 mt-4 ">
    <span className="active">
        Item HSN Code
        {/* <span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}
    </span>

    <input
        type="text"
        id="Item_HSN"
        {...register("Item_HSN")}
        placeholder=" Item HSN Code"
        className="w-full outline-none border-b-2 text-gray-900"
        
       maxLength={8}              // limit to 8 digits
    onInput={(e) => {
      // ✅ Allow only digits
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    }}
    />
    
    {errors?.Item_HSN && (
        <p className="text-red-500 text-xs mt-1">
            {errors?.Item_HSN?.message}
        </p>
    )}
</div>


<div className="input-field col s6 mb-4 mt-4">
  <span className="active">Unit</span>

  <div className="mt-2">
    <button
      type="button"
      onClick={() => setShowSelectUnitModal(true)}
      className="px-4 py-2 rounded-md border"
      style={{
        backgroundColor: "white",
        borderColor: "#4CA1AF",
        color: "#4CA1AF",
      }}
    >
     Edit Unit
    </button>

    {primaryUnit && (
      <div className="mt-2 text-sm text-gray-600">
        <div>
          Primary: <strong>{primaryUnit.toUpperCase()}</strong>

          {secondaryUnit && (
            <span className="ml-3">
              Secondary: <strong>{secondaryUnit.toUpperCase()}</strong>
            </span>
          )}
        </div>

        {secondaryUnit && conversionRate && (
          <div className="mt-1 text-[#4CA1AF] ">
            1 {primaryUnit.toUpperCase()} ={" "}
            {Number(conversionRate)} {secondaryUnit.toUpperCase()}
          </div>
        )}
      </div>
    )}
  </div>
</div>
</div>
                {/* Item Image */}
                <div className="row mt-4  w-1/2 ">





                </div>

               
             
            </div>)}
            {activeTab === "Stock" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6 p-6">
        <div className="flex flex-col">
          <span className="active">Opening Quantity</span>
          <input type="text" placeholder="0"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Opening_Quantity")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">At Price</span>
          <input type="text" placeholder="0.00"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("At_Price")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">As Of Date</span>
          <input type="date"
            className="w-full outline-none border-b-2 text-gray-900"
            defaultValue={new Date().toISOString().slice(0, 10)}
            {...register("As_Of_Date")} />
        </div>

        <div className="flex flex-col">
          <span className="active">Min Stock To Maintain</span>
          <input type="text" placeholder="0"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Min_Stock")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">Location</span>
          <input type="text"
           //placeholder="e.g. Shelf A3"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Location")} />
        </div>
      </div>
    )}
     <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={formValues.errorCount > 0 ||isEditingItem}
                    className=" text-white font-bold py-2 px-4 rounded"
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                     {isEditingItem ? "Saving..." : "Save"}
                  </button>
                </div>
     </form>
    </div>

              </div>
    
 
            

{eachItemBillAndInvoiceNumbersModalOpen && (
  <div
    className="fixed inset-0 
    flex items-center justify-center 
    bg-white z-50 bg-opacity-50 "
  >
    {/* Main Modal Box */}
    <div
      className="bg-white w-full max-w-2xl rounded-lg shadow-lg 
                 p-6 overflow-y-auto"
      style={{ maxHeight: "85vh" }}   // 🔥 fixed height modal
    >

      <h3 className="text-xl font-semibold text-center text-[#4CA1AF] mb-4">
        Associated Bill & Invoice Numbers
      </h3>

      {/* 2 Columns */}
      <div className="grid grid-cols-2 gap-6">

        {/* Purchase Bills */}
        <div>
          <h4
            className="text-lg font-semibold mb-2"
            style={{ color: "red" }}
          >
            🧾 Purchase Bills (
            {eachItemBillAndInvoiceNumbers?.purchaseDetails?.count || 0})
          </h4>

          <div
            className="border p-3 rounded-md bg-gray-50 overflow-y-auto"
            style={{ maxHeight: "230px" }}   // 🔥 scroll area only
          >
            {eachItemBillAndInvoiceNumbers?.purchaseDetails?.details?.length > 0 ? (
              eachItemBillAndInvoiceNumbers.purchaseDetails.details.map((bill, index) => (
                <div key={index} className="border-b py-2 flex flex-col">
                  <p className="font-medium text-gray-900">
                    Bill No: {bill.Bill_Number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(bill.Bill_Date).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No Purchase Bills</p>
            )}
          </div>
        </div>

        {/* Sale Invoices */}
        <div>
          <h4
            className="text-lg font-semibold mb-2"
            style={{ color: "green" }}
          >
            📄 Sale Invoices (
            {eachItemBillAndInvoiceNumbers?.saleDetails?.count || 0})
          </h4>

          <div
            className="border p-3 rounded-md bg-gray-50 overflow-y-auto"
            style={{ maxHeight: "230px" }}   // 🔥 scroll area only
          >
            {eachItemBillAndInvoiceNumbers?.saleDetails?.details?.length > 0 ? (
              eachItemBillAndInvoiceNumbers.saleDetails.details.map((invoice, index) => (
                <div key={index} className="border-b py-2 flex flex-col">
                  <p className="font-medium text-gray-900">
                    Invoice No: {invoice.Invoice_Number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(invoice.Invoice_Date).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No Sale Invoices</p>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Section */}
      <div className="mt-6">
         <p className="text-lg font-semibold text-center text-[#4CA1AF] mb-3">
          All above purchase and sales bills will be affected
        </p>
        <p style={{color:"red"}}
        className="text-lg font-semibold text-center  mb-3">
          Are you sure you want to update this item?
        </p>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => handleEdit()}
            className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
          >
            {isEditingItem ? "Saving..." : "OK"}
          </button>

          <button
            type="button"
            onClick={() => setEachItemBillAndInvoiceNumbersModalOpen(false)}
            className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>

    </div>
  </div>
)}
 </div>

  {showSelectUnitModal && (
    <SelectUnitModal
      units={itemUnits || []}
     primaryUnit={primaryUnit}
    secondaryUnit={secondaryUnit}
    conversionRate={conversionRate}
     conversionHistory={itemDetails?.unitConversions || []}
Item_Id={itemDetails?.Item_Id}   // 🔹 add this
      initialBase={primaryUnit || ""}
        initialSecondary={secondaryUnit || ""}
  initialConversionRate={conversionRate || ""}
  
      onClose={() => {
        setShowSelectUnitModal(false);
      }}
  
      onSave={(newUnit) => {
        console.log("Selected unit configuration:", newUnit);
  
        setValue(
          "Primary_Unit",
          newUnit.baseUnit || null,
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
  
        setValue(
          "Secondary_Unit",
          newUnit.secondaryUnit || null,
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
  
        setValue(
          "Conversion_Rate",
          newUnit.secondaryUnit
            ? Number(newUnit.conversionRate)
            : null,
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
  
        setShowSelectUnitModal(false);
      }}
    />
  )}
  
    </>
    );
  }