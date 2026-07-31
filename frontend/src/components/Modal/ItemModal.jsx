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


export default function ItemModal({itemDetails,editingItem,onClose}) {
    const dropdownRef = useRef(null);
    const dispatch = useDispatch()
      const itemUnits = {
    "gm": "Gram",
    "Kg": "Kilogram",
    "lt": "Litre",
    "pcs": "Piece",

  }
    const { data: categories } = useGetAllCategoriesQuery()
    console.log(categories)
       const [newCategory, setNewCategory] = useState("");
      const [addCategory] = useAddCategoryMutation();
   const [search, setSearch] = useState("");
     const [open, setOpen] = useState(false);
     const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const[eachItemBillAndInvoiceNumbersModalOpen,setEachItemBillAndInvoiceNumbersModalOpen]=useState(false)
    const[editItem,{isLoading:isEditingItem}]=useEditItemMutation()
const [shouldFetchBills, setShouldFetchBills] = useState(false);

const { data: apiResponse } =
  useGetEachItemBillAndInvoiceNumbersQuery(itemDetails?.Item_Id, {
    skip: !shouldFetchBills,  // fetch only when user clicks
  });

   
    const eachItemBillAndInvoiceNumbers = apiResponse?.billAndInvoiceNumbers || {
  purchaseDetails: { count: 0, details: [] },
  saleDetails: { count: 0, details: [] },
};
    //  const [showModal, setShowModal] = useState(false);
      const {
        register,
        
        setValue,
        reset,
        watch,
   
        
        formState: { errors },
      } = useForm({
        resolver: zodResolver(itemFormSchema)
    
      })


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

  useEffect(()=>{
if(!editingItem) return
 if(!itemDetails) return

 if(Object.keys(itemDetails).length===0) return
 setSearch(itemDetails.Item_Category)
 reset({
   Item_Name:itemDetails.Item_Name,
   Item_Description:itemDetails.Item_Description,
   Item_Category:itemDetails.Item_Category,
   Item_Unit:itemDetails.Item_Unit,
   Item_HSN:itemDetails.Item_HSN
 })


  },[itemDetails,editingItem])


  
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
//   const handleSubmit=async()=>{
    
//     if(!editingItem) return
//     try{
//       const res=await editItem({
//         body:formValues,
//         Item_Id:itemDetails.Item_Id
//       }).unwrap()
//       const resData=  res;
//       console.log(res,"res")
//       if(resData?.success){
//         toast.success("Item Updated Successfully")
//         onClose()
//         dispatch(itemApi.util.invalidateTags(["Item"]))
//       }
//     }
//     catch(err){
//       console.error(err)
//       toast.error("Failed to update item")
//     }
//   }

// const fetchEachItemBillAndSaleNumbers=async()=>{
//     setEachItemBillAndInvoiceNumbersModalOpen(true)
// }
const handleEdit = async () => {
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
                <div >
                    
                  <div className="row">

  <div
    style={{ width: "50%" }}
    className="relative mt-3"
    ref={dropdownRef}
  >
    <span className="active">Category</span>
    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
  
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
        {categories && categories?.filter((cat) =>cat.Item_Category.toLowerCase().includes(search.toLowerCase()))
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
      
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
         
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
          <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
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
                      <span className="active">Select Unit</span>
                      <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      <select
                        id="Item_Unit"
  
                        {...register("Item_Unit")}
                        className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2"
                      >
                        {
                          Object.keys(itemUnits).length > 0 && Object.entries(itemUnits).map(([key, value]) => (
  
                            <option key={key} value={key}>
                              {`${value}  (${key}) `}
                            </option>
                          ))
                        }
       
                      </select>
  
                      {errors?.Item_Unit && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors?.Item_Unit?.message}
                        </p>
                      )}
                    </div>
  
  </div>
                  
                 
  
                  <div className="flex justify-end mt-4">
                    {/* <button
  type="button"
  disabled={formValues.errorCount > 0}
  onClick={() => {
    if (itemDetails?.Item_Id) {
      fetchItemBills(itemDetails.Item_Id);  // CALL API HERE
    }
    setEachItemBillAndInvoiceNumbersModalOpen(true);
  }}
  className="text-white font-bold py-2 px-4 rounded"
  style={{ backgroundColor: "#4CA1AF" }}
>
  {isEditingItem ? "Saving..." : "Save"}
</button> */}
<button
  type="button"
  disabled={formValues.errorCount > 0}
  onClick={() => {
    if (itemDetails?.Item_Id) {
      setShouldFetchBills(true);      // 👉 triggers API call
    }
    setEachItemBillAndInvoiceNumbersModalOpen(true); // open modal
  }}
  className="text-white font-bold py-2 px-4 rounded"
  style={{ backgroundColor: "#4CA1AF" }}
>
  {isEditingItem ? "Saving..." : "Save"}
</button>


                    {/* <button
                      type="button"
                      disabled={formValues.errorCount > 0}
                      onClick={()=>setEachItemBillAndInvoiceNumbersModalOpen(true)}
                      className=" text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "#4CA1AF" }}
                    >
                      {isEditingItem ? "Saving..." : "Save"}
                    </button> */}
                  </div>
                </div>

              </div>
     </div>
 
            
{/* {eachItemBillAndInvoiceNumbersModalOpen && (
    <div
    className="fixed inset-0 
    flex items-center justify-center 
    bg-white z-50 bg-opacity-50 "
  >
    <div style={{ maxHeight: "85vh" }}
     className="bg-white p-6 rounded-lg overflow-y-auto
     shadow-lg w-full max-w-xl">
      
      <h3 className="text-xl font-semibold text-center text-[#4CA1AF] mb-4">
         Associated  Bill & Invoice Numbers 
      </h3>

  
      <div className="grid grid-cols-2 gap-6">

        
        <div>
          <h4 style={{color:"red"}}
          className="text-lg font-semibold text-gray-800 mb-2 ">
            🧾 Purchase Bills ({eachItemBillAndInvoiceNumbers?.purchaseDetails?.count || 0})
          </h4>

          <div className="border p-3 rounded-md max-h-60 overflow-auto bg-gray-50">
            {eachItemBillAndInvoiceNumbers?.purchaseDetails?.details?.length > 0 ? (
              eachItemBillAndInvoiceNumbers.purchaseDetails.details.map((bill) => (
                <div
                  key={bill.Purchase_Id}
                  className="border-b py-2 flex flex-col"
                >
                  <p className="font-medium text-gray-900">Bill No: {bill.Bill_Number}</p>
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

        <div>
          <h4 style={{color:"green"}}
          className="text-lg font-semibold text-gray-800 mb-2 ">
            📄 Sale Invoices ({eachItemBillAndInvoiceNumbers?.saleDetails?.count || 0})
          </h4>

          <div className="border p-3 rounded-md max-h-60 overflow-auto bg-gray-50">
            {eachItemBillAndInvoiceNumbers?.saleDetails?.details?.length > 0 ? (
              eachItemBillAndInvoiceNumbers.saleDetails.details.map((invoice) => (
                <div
                  key={invoice.Sale_Id}
                  className="border-b py-2 flex flex-col"
                >
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
   
      <div className="flex justify-center flex-col gap-2 mt-6">
           <p className="text-xl font-semibold text-center text-[#4CA1AF] mb-2">
        Are you sure you want to update this item?
      </p>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => {
           
             handleEdit();     // only when editing
          }}
          className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
        >
          {isEditingItem ? "Saving" : "OK"}
        </button>

        <button
          type="button"
          onClick={() => setEachItemBillAndInvoiceNumbersModalOpen(false)}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
        >
          Cancel
        </button>
        </div>
      </div>

    </div>
  </div>
)} */}
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


  
  
    </>
    );
}
