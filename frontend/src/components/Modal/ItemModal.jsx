import { zodResolver } from "@hookform/resolvers/zod";
import { itemFormSchema } from "../../schema/itemFormSchema";
import { useRef } from "react";
import { useState } from "react";
import {
  itemApi, useAddCategoryMutation, useEditItemMutation, useGetAllCategoriesQuery, useGetAllItemUnitsQuery,
  useGetEachItemBillAndInvoiceNumbersQuery
} from "../../redux/api/itemApi";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { purchaseApi } from "../../redux/api/purchaseApi";
import { saleApi } from "../../redux/api/saleApi";
import SelectUnitModal from "./SelectUnitModal";
import { X } from "lucide-react";
import { useGetAllSettingsQuery } from "../../redux/api/Settings/settingsApi";



// export default function ItemModal({ itemDetails, editingItem, onClose, onRefreshBills,
//   onRefreshTab }) {
//   const dropdownRef = useRef(null);
//   const dispatch = useDispatch()
//   console.log("editingItem", editingItem);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     reset,
//     watch,


//     formState: { errors },
//   } = useForm({
//     resolver: zodResolver(itemFormSchema)

//   })
//   const toLocalDateString = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`; // ✅ in yyyy-mm-dd for input[type="date"]
//   };
//   console.log(itemDetails, "itemDetails");
//   const itemType = watch("Item_Type") || "Product";
//   const { data: categories } = useGetAllCategoriesQuery()

//   const [newCategory, setNewCategory] = useState("");
//   const [addCategory] = useAddCategoryMutation();
//   const [search, setSearch] = useState("");
//   const [open, setOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [activeTab, setActiveTab] = useState("Items");
//   const [eachItemBillAndInvoiceNumbersModalOpen, setEachItemBillAndInvoiceNumbersModalOpen] = useState(false)
//   //const primaryUnit = watch("Primary_Unit");
//   //const secondaryUnit = watch("Secondary_Unit");
//   //const conversionRate = watch("Conversion_Rate");
//   const [editItem, { isLoading: isEditingItem }] = useEditItemMutation()
//   const [shouldFetchBills, setShouldFetchBills] = useState(false);
//   const [showSelectUnitModal, setShowSelectUnitModal] = useState(false)
//   const { data: itemUnitsFetched } = useGetAllItemUnitsQuery();

//   const itemUnits = itemUnitsFetched
//   const { data: apiResponse } =
//     useGetEachItemBillAndInvoiceNumbersQuery(itemDetails?.Item_Id, {
//       skip: !shouldFetchBills,  // fetch only when user clicks
//     });
//   //console.log(itemDetails, "itemDetails")
//   console.log(editingItem, "editingItem")
//   //const canEditUnits = itemDetails?.Can_Edit_Units ?? true;
//   const canEditUnits = itemDetails?.Can_Edit_Units ?? {
//     Primary: true,
//     Secondary: true,
//   };
//   useEffect(() => {
//     if (!editingItem) return;
//     if (!itemDetails) return;
//     if (Object.keys(itemDetails).length === 0) return;

//     setSearch(itemDetails.Item_Category);

//     reset({
//       Item_Name: itemDetails.Item_Name,
//       Item_Type: itemDetails.Item_Type || "Product",   // ← add this
//       Item_Description: itemDetails.Item_Description,
//       Item_Category: itemDetails.Item_Category,
//       Item_Unit: itemDetails.Item_Unit,
//       Item_HSN: itemDetails.Item_HSN,
//       Primary_Unit: itemDetails.Primary_Unit,
//       Secondary_Unit: itemDetails.Secondary_Unit,
//       Conversion_Rate: itemDetails.Conversion_Rate,
//       //  Sale Price
//       Sale_Price: itemDetails.Sale_Price ?? "",
//       Sale_Price_Type: itemDetails.Sale_Price_Type ?? "Without_Tax",
//       Discount_On_Sale_Price: itemDetails.Discount_On_Sale_Price ?? "",
//       Discount_Type_On_Sale_Price:
//         itemDetails.Discount_Type_On_Sale_Price ?? "Percentage",

//       //  Purchase Price
//       Purchase_Price: itemDetails.Purchase_Price ?? "",
//       Purchase_Price_Type:
//         itemDetails.Purchase_Price_Type ?? "Without_Tax",
//       Opening_Quantity: itemDetails.Opening_Quantity ?? "",
//       At_Price: itemDetails.At_Price ?? "",
//       // As_Of_Date:
//       //   itemDetails.As_Of_Date ??
//       //   new Date().toISOString().slice(0, 10),
//       As_Of_Date: toLocalDateString(itemDetails.As_Of_Date),
//       Min_Stock: itemDetails.Min_Stock ?? "",
//       Location: itemDetails.Location ?? "",
//     });
//   }, [itemDetails, editingItem, reset]);
//   // useEffect(() => {
//   //   register("Primary_Unit");
//   //   register("Secondary_Unit");
//   //   register("Conversion_Rate");
//   // }, [register]);
//   const primaryUnit = watch("Primary_Unit");
//   const secondaryUnit = watch("Secondary_Unit");
//   const conversionRate = watch("Conversion_Rate");

//   console.log(primaryUnit, secondaryUnit, conversionRate);
//   const eachItemBillAndInvoiceNumbers = apiResponse?.billAndInvoiceNumbers || {
//     purchaseDetails: { count: 0, details: [] },
//     saleDetails: { count: 0, details: [] },
//   };

//   //  const [showModal, setShowModal] = useState(false);

//   const formatConversionRate = (value) =>
//     Number(value).toLocaleString(undefined, {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     });

//   const handleSelect = (cat) => {
//     setSelected(cat);
//     setValue("Item_Category", cat); // update react-hook-form
//     setOpen(false);
//   };
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);





//   const handleAddCategory = async () => {

//     if (newCategory.trim() === "") {
//       return
//     }
//     else if (newCategory.trim() !== "") {
//       try {
//         // ✅ Call backend
//         const res = await addCategory({
//           body: { Item_Category: newCategory.trim() },
//         });

//         // Some RTK Query wrappers put the response under `.data`
//         const data = res?.data || res;

//         if (data?.success) {
//           const addedCat = newCategory.trim();

//           // ✅ Auto-select the new category (single value)
//           setSelected(addedCat);
//           setValue("Item_Category", addedCat); // directly set single category

//           // ✅ Refresh cache
//           dispatch(itemApi.util.invalidateTags(["Category"]));

//           // ✅ Reset modal & input
//           setShowModal(false);
//           setNewCategory("");
//           setOpen(true);
//         } else {
//           console.warn("⚠️ Category not added. Response:", data);
//         }
//       } catch (err) {
//         console.error("❌ Error adding category:", err);
//       }
//     }
//   };
//   const formValues = watch();
//   console.log(formValues, "formValues")
//   console.log(errors)
//   const onSubmit = async () => {
//     console.log("editingItem", editingItem);
//     if (!editingItem) return;
//     const payload = {
//       ...formValues,
//     };

//     if (payload.Item_Type === "Service") {
//       payload.Opening_Quantity = null;
//       payload.At_Price = null;
//       payload.As_Of_Date = null;
//       payload.Min_Stock = null;
//       payload.Location = null;
//     }

//     console.log("EDIT ITEM PAYLOAD:", payload);
//     const oldType = itemDetails.Item_Type;
//     const newType = payload.Item_Type;

//     try {
//       //   const res = await editItem({
//       //     body: formValues,
//       //     Item_Id: itemDetails.Item_Id,
//       //   }).unwrap();
//       await editItem({
//         body: payload,
//         Item_Id: itemDetails.Item_Id,
//       }).unwrap();

//       //await onRefresh?.();
//       await onRefreshBills?.();

//       // switch Product/Service tab if changed
//       if (oldType !== newType) {
//         onRefreshTab?.(newType);
//       }
//       toast.success("Item Updated Successfully");

//       setEachItemBillAndInvoiceNumbersModalOpen(false);
//       onClose();

//       dispatch(
//         itemApi.util.invalidateTags([
//           { type: "Item", id: "LIST" },
//           { type: "ItemsByCategory", id: "LIST" },
//           { type: "ItemLedger", id: "LIST" },
//         ])
//       );

//       dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
//       dispatch(saleApi.util.invalidateTags(["Sale"]));
//       // console.log(res, "res");

//       // if (res?.success) {
//       //   toast.success(res?.message || "Item Updated Successfully");

//       //   setEachItemBillAndInvoiceNumbersModalOpen(false);
//       //   onClose();

//       //   dispatch(
//       //     itemApi.util.invalidateTags([
//       //       { type: "Item", id: "LIST" },
//       //       { type: "ItemsByCategory", id: "LIST" },
//       //       { type: "ItemLedger", id: "LIST" },
//       //     ])
//       //   );
//       //   dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
//       //   dispatch(saleApi.util.invalidateTags(["Sale"]));
//       // }
//     } catch (err) {
//       console.error("Failed to update item:", err);

//       // ✅ Show exact backend error message
//       toast.error(
//         err?.data?.message ||
//         err?.message ||
//         "Failed to update item"
//       );
//     }
//   };
//   return (

//     <>







//       <div
//         style={{
//           marginTop: "50px",
//           position: "fixed",
//           inset: 0,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           backgroundColor: "rgba(0,0,0,0.3)", // dim background
//           backdropFilter: "blur(4px)", // blur effect
//           zIndex: 50,
//           padding: "1rem", // ensures spacing on small screens
//         }}
//       >
//         <div
//           className="bg-white 
//       w-full max-w-4xl rounded-lg 
//       shadow-lg p-6 
//       overflow-y-auto max-h-[90vh]"
//         >
//           <div className="flex justify-between items-center mb-6"
//             style={{ paddingBottom: "10px" }}>
//             <div className="flex flex-col">
//               <h4 className="text-xl font-semibold text-gray-900">
//                 Edit Item
//               </h4>
//               {/* <p className="text-gray-500 mb-6">
//                Edit item details
//               </p> */}
//             </div>
//             <button
//               type="button"
//               style={{ backgroundColor: "transparent" }}
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700 text-2xl"
//             >
//               ✕
//             </button>
//           </div>
//           {/* <div className="flex gap-6 w-full mt-6 pb-3">
//             <div className=" flex space-x-8 pl-4">
//               {["Items", "Stock"].map((tab) => (
//                 <button
//                   type="button"
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   style={{
//                     cursor: "pointer",
//                     backgroundColor: "transparent",
//                     border: "none",
//                     outline: "none",
//                     padding: "0.5rem 1rem",
//                     borderBottom: activeTab === tab ? "1px solid red" : "none",
//                     color: activeTab === tab ? "red" : "gray",
//                     fontWeight: activeTab === tab ? "600" : "500",
//                   }}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </div>

//           </div> */}
//           {/* // .item-toggle.disabled { cursor: not-allowed; opacity: 0.5; } */}
//           <style>{`
//   .item-toggle {
//     position: relative;
//     width: 44px;
//     height: 24px;
//     background: #4CA1AF;
//     border-radius: 999px;
//     cursor: pointer;
//     transition: background 0.2s;
//     flex-shrink: 0;
//   }

//   .item-toggle::after {
//     content: "";
//     position: absolute;
//     top: 3px;
//     left: 3px;
//     width: 18px;
//     height: 18px;
//     background: white;
//     border-radius: 50%;
//     transition: transform 0.2s;
//     box-shadow: 0 1px 3px rgba(0,0,0,.15);
//   }

//   .item-toggle.on::after {
//     transform: translateX(20px);
//   }
// `}</style>

//           <div className="flex items-center gap-3 mb-2">
//             {/* <span className={`text-sm ${itemType === "Product" ? "font-medium text-gray-700" : "text-gray-400"}`}>
//               Product
//             </span>
//             <div
//               className={`item-toggle ${itemType === "Service" ? "on" : ""} 


//               `}
//               onClick={() => {


//                 const next = itemType === "Product" ? "Service" : "Product";
//                 setValue("Item_Type", next, { shouldValidate: true, shouldDirty: true });
//                 if (next === "Service" && activeTab === "Stock") {
//                   setActiveTab("Items");
//                 }
//               }}
//             />
//             <span className={`text-sm ${itemType === "Service" ? "font-medium text-gray-700" : "font-medium text-gray-700"}`}>
//               Service
//             </span> */}
//             <span
//               className="text-sm font-medium"
//               style={{ color: "#4CA1AF" }}
//             >
//               Product
//             </span>

//             <div
//               className={`item-toggle ${itemType === "Service" ? "on" : ""
//                 }`}
//               onClick={() => {
//                 const next =
//                   itemType === "Product"
//                     ? "Service"
//                     : "Product";

//                 setValue("Item_Type", next, {
//                   shouldValidate: true,
//                   shouldDirty: true
//                 });

//                 if (next === "Service" && activeTab === "Stock") {
//                   setActiveTab("Items");
//                 }
//               }}
//             />

//             <span
//               className="text-sm font-medium"
//               style={{ color: "#4CA1AF" }}
//             >
//               Service
//             </span>
//           </div>

//           <input type="hidden" {...register("Item_Type")} />

//           <div className="flex gap-6 w-full mt-6 pb-3">
//             <div className="flex space-x-8 pl-4">
//               {(itemType === "Service" ? ["Items"] : ["Items", "Stock"]).map((tab) => (
//                 <button
//                   type="button"
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   style={{
//                     cursor: "pointer",
//                     backgroundColor: "transparent",
//                     border: "none",
//                     outline: "none",
//                     padding: "0.5rem 1rem",
//                     borderBottom: activeTab === tab ? "2px solid #4CA1AF" : "2px solid transparent",
//                     color: activeTab === tab ? "#4CA1AF" : "gray",
//                     fontWeight: activeTab === tab ? "600" : "500",
//                   }}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <form onSubmit={handleSubmit(onSubmit)}>
//             {activeTab === "Items" && (
//               <div >


//                 <div className="flex gap-4 mt-4">







//                   <div
//                     style={{ width: "50%" }}
//                     className="relative mt-3"
//                     ref={dropdownRef}
//                   >
//                     <span className="active">Category</span>
//                     {/* //<span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}

//                     {/* Search + Dropdown Trigger */}
//                     <input
//                       type="text"
//                       value={search}
//                       onClick={() => setOpen((prev) => !prev)}
//                       onChange={(e) => setSearch(e.target.value)}
//                       placeholder="Search category"
//                       className="w-full outline-none border-b-2 text-gray-900 "
//                     />

//                     {/* Dropdown List */}
//                     {open && (
//                       <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
//                         {/* Add Category Option */}
//                         <span
//                           type="button"
//                           onClick={() => {
//                             setShowModal(true);
//                             setOpen(false);
//                           }}
//                           className="w-full text-left px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
//                         >
//                           + Add Category
//                         </span>

//                         {/* Category List */}
//                         {categories
//                           ?.filter((cat) =>
//                             cat.Item_Category.toLowerCase().includes(search.toLowerCase())
//                           )
//                           .map((cat, i) => (
//                             <div
//                               key={i}
//                               onClick={() => {
//                                 handleSelect(cat.Item_Category);
//                                 setSearch(cat.Item_Category);
//                                 setOpen(false);
//                               }}
//                               className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                             >
//                               {cat.Item_Category}
//                             </div>
//                           ))}

//                         {/* No match case */}
//                         {categories?.filter((cat) =>
//                           cat.Item_Category.toLowerCase().includes(search.toLowerCase())
//                         ).length === 0 && (
//                             <p className="px-3 py-2 text-gray-500">No categories found</p>
//                           )}
//                       </div>
//                     )}

//                     {/* Hidden input for react-hook-form */}
//                     <input type="hidden" {...register("Item_Category")} value={selected || ""} />

//                     {/* Modal */}
//                     {showModal && (
//                       // <div className="fixed inset-0 flex items-center justify-center 
//                       //               bg-black bg-opacity-40 backdrop-blur-sm z-30">
//                       <div
//                         style={{
//                           position: "fixed",
//                           inset: 0,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           backgroundColor: "rgba(0,0,0,0.4)", // ✅ transparent dark
//                           backdropFilter: "blur(4px)",        // ✅ hazy blur
//                           zIndex: 30
//                         }}>
//                         {/* // <div className="fixed inset-0 flex items-center justify-center bg-gray-800  z-30"> */}
//                         <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
//                           {/* Close Button (top-right) */}
//                           <button
//                             type="button"
//                             style={{ backgroundColor: "transparent" }}
//                             onClick={() => setShowModal(false)}
//                             className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
//                           >
//                             ✕
//                           </button>

//                           <h4 className="text-lg font-semibold mb-4">Add New Category</h4>
//                           <input
//                             type="text"
//                             value={newCategory}
//                             onChange={(e) => setNewCategory(e.target.value)}
//                             className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4CA1AF]"
//                             placeholder="Enter category name"
//                           />
//                           <div className="flex justify-end gap-3">
//                             <button
//                               type="button"
//                               style={{ backgroundColor: "lightgray" }}
//                               onClick={() => setShowModal(false)}
//                               className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
//                             >
//                               Cancel
//                             </button>
//                             <button
//                               type="button"
//                               onClick={handleAddCategory}
//                               style={{ backgroundColor: "#4CA1AF" }}
//                               className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#5c52d4]"
//                             >
//                               Add
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>



//                   <div className="input-field col s6 ">
//                     <span className="active">
//                       Item Name
//                       <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                     </span>
//                     <input
//                       type="text"
//                       id="Item_Name"
//                       {...register("Item_Name")}
//                       placeholder=" Item Name"
//                       className="w-full outline-none border-b-2 text-gray-900"
//                     />
//                     {errors?.Item_Name && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors?.Item_Name?.message}
//                       </p>
//                     )}
//                   </div>



//                 </div>

//                 <div className="flex gap-4 mt-4">
//                   <div className="input-field col s6 mt-4 ">
//                     <span className="active">
//                       Item HSN Code
//                       {/* <span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}
//                     </span>

//                     <input
//                       type="text"
//                       id="Item_HSN"
//                       {...register("Item_HSN")}
//                       placeholder=" Item HSN Code"
//                       className="w-full outline-none border-b-2 text-gray-900"

//                       maxLength={8}              // limit to 8 digits
//                       onInput={(e) => {
//                         // ✅ Allow only digits
//                         e.target.value = e.target.value.replace(/[^0-9]/g, "");
//                       }}
//                     />

//                     {errors?.Item_HSN && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors?.Item_HSN?.message}
//                       </p>
//                     )}
//                   </div>



//                   {/* No unit configured */}
//                   <div className="input-field col s6 mb-4 mt-4">
//                     {!primaryUnit && (
//                       <div className="mt-3">
//                         {canEditUnits && (
//                           <button
//                             type="button"
//                             onClick={() => setShowSelectUnitModal(true)}
//                             className="px-4 py-2 rounded-md border"
//                             style={{
//                               backgroundColor: "white",
//                               borderColor: "#4CA1AF",
//                               color: "#4CA1AF",
//                             }}
//                           >
//                             Select Unit
//                           </button>
//                         )}
//                       </div>
//                     )}

//                     {/* Only primary configured */}
//                     {primaryUnit && !secondaryUnit && (
//                       <>
//                         <div className="mt-2 p-3 rounded-md border bg-gray-50">
//                           <div className="text-sm">
//                             <strong>Primary Unit:</strong>{" "}
//                             {primaryUnit.toUpperCase()}
//                           </div>
//                         </div>

//                         {/* {canEditUnits && (
//                           <button
//                             type="button"
//                             onClick={() => setShowSelectUnitModal(true)}
//                             className="mt-3 px-4 py-2 rounded-md border"
//                             style={{
//                               backgroundColor: "white",
//                               borderColor: "#4CA1AF",
//                               color: "#4CA1AF",
//                             }}
//                           >
//                             Add Secondary Unit
//                           </button>
//                         )} */}
//                         {canEditUnits.Secondary && (
//                           <button
//                             type="button"
//                             onClick={() => setShowSelectUnitModal(true)}
//                             className="mt-3 px-4 py-2 rounded-md border"
//                             style={{
//                               backgroundColor: "white",
//                               borderColor: "#4CA1AF",
//                               color: "#4CA1AF",
//                             }}
//                           >
//                             Add Secondary Unit
//                           </button>
//                         )}
//                       </>
//                     )}

//                     {/* Fully configured */}
//                     {/* {primaryUnit && secondaryUnit && (
//                       <>
//                         <div className="mt-2 p-2 rounded-md border bg-gray-50">
//                           <div className="text-sm">
//                             <div>
//                               <strong>Primary Unit:</strong>{" "}
//                               {primaryUnit.toUpperCase()}
//                             </div>

//                             <div className="mt-1">
//                               <strong>Secondary Unit:</strong>{" "}
//                               {secondaryUnit.toUpperCase()}
//                             </div>

//                             <div className="mt-1 text-[#4CA1AF]">
//                               <strong>Conversion:</strong>{" "}
//                               1 {primaryUnit.toUpperCase()} ={" "}
//                               {formatConversionRate(conversionRate)}{" "}
//                               {secondaryUnit.toUpperCase()}
//                             </div>
//                           </div>
//                         </div>

//                         {canEditUnits && (
//                           <button
//                             type="button"
//                             onClick={() => setShowSelectUnitModal(true)}
//                             className="mt-3 px-4 py-2 rounded-md border"
//                             style={{
//                               backgroundColor: "white",
//                               borderColor: "#4CA1AF",
//                               color: "#4CA1AF",
//                             }}
//                           >
//                             Edit Unit
//                           </button>
//                         )}
//                       </>
//                     )} */}
//                     {primaryUnit && secondaryUnit && (
//                       <>
//                         <div className="mt-2 p-2 rounded-md border bg-gray-50">
//                           <div className="text-sm">
//                             <div>
//                               <strong>Primary Unit:</strong>{" "}
//                               {primaryUnit.toUpperCase()}
//                             </div>

//                             <div className="mt-1">
//                               <strong>Secondary Unit:</strong>{" "}
//                               {secondaryUnit.toUpperCase()}
//                             </div>

//                             <div className="mt-1 text-[#4CA1AF]">
//                               <strong>Conversion:</strong>{" "}
//                               1 {primaryUnit.toUpperCase()} ={" "}
//                               {formatConversionRate(conversionRate)}{" "}
//                               {secondaryUnit.toUpperCase()}
//                             </div>
//                           </div>
//                         </div>

//                         {canEditUnits.Secondary && (
//                           <button
//                             type="button"
//                             onClick={() => setShowSelectUnitModal(true)}
//                             className="mt-3 px-4 py-2 rounded-md border"
//                             style={{
//                               backgroundColor: "white",
//                               borderColor: "#4CA1AF",
//                               color: "#4CA1AF",
//                             }}
//                           >
//                             Edit  Unit
//                           </button>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 </div>




//               </div>)}
//             {activeTab === "Stock" && (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6 p-6">
//                 <div className="flex flex-col">
//                   <span className="active">Opening Quantity</span>
//                   <input type="text" placeholder="0"
//                     className="w-full outline-none border-b-2 text-gray-900"
//                     {...register("Opening_Quantity")}
//                     onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="active">At Price</span>
//                   <input type="text" placeholder="0.00"
//                     className="w-full outline-none border-b-2 text-gray-900"
//                     {...register("At_Price")}
//                     onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="active">As Of Date</span>
//                   <input type="date"
//                     className="w-full outline-none border-b-2 text-gray-900"
//                     defaultValue={new Date().toISOString().slice(0, 10)}
//                     {...register("As_Of_Date")} />
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="active">Min Stock To Maintain</span>
//                   <input type="text" placeholder="0"
//                     className="w-full outline-none border-b-2 text-gray-900"
//                     {...register("Min_Stock")}
//                     onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
//                 </div>

//                 <div className="flex flex-col">
//                   <span className="active">Location</span>
//                   <input type="text"
//                     //placeholder="e.g. Shelf A3"
//                     className="w-full outline-none border-b-2 text-gray-900"
//                     {...register("Location")} />
//                 </div>
//               </div>
//             )}
//             <div className="flex justify-end mt-4">
//               <button
//                 type="submit"
//                 disabled={formValues.errorCount > 0 || isEditingItem}
//                 className=" text-white font-bold py-2 px-4 rounded"
//                 style={{ backgroundColor: "#4CA1AF" }}
//               >
//                 {isEditingItem ? "Saving..." : "Save"}
//               </button>
//             </div>
//           </form>


//         </div>




//         {eachItemBillAndInvoiceNumbersModalOpen && (
//           <div
//             className="fixed inset-0 
//     flex items-center justify-center 
//     bg-white z-50 bg-opacity-50 "
//           >
//             {/* Main Modal Box */}
//             <div
//               className="bg-white w-full max-w-2xl rounded-lg shadow-lg 
//                  p-6 overflow-y-auto"
//               style={{ maxHeight: "85vh" }}   // 🔥 fixed height modal
//             >

//               <h3 className="text-xl font-semibold text-center text-[#4CA1AF] mb-4">
//                 Associated Bill & Invoice Numbers
//               </h3>

//               {/* 2 Columns */}
//               <div className="grid grid-cols-2 gap-6">

//                 {/* Purchase Bills */}
//                 <div>
//                   <h4
//                     className="text-lg font-semibold mb-2"
//                     style={{ color: "red" }}
//                   >
//                     🧾 Purchase Bills (
//                     {eachItemBillAndInvoiceNumbers?.purchaseDetails?.count || 0})
//                   </h4>

//                   <div
//                     className="border p-3 rounded-md bg-gray-50 overflow-y-auto"
//                     style={{ maxHeight: "230px" }}   // 🔥 scroll area only
//                   >
//                     {eachItemBillAndInvoiceNumbers?.purchaseDetails?.details?.length > 0 ? (
//                       eachItemBillAndInvoiceNumbers.purchaseDetails.details.map((bill, index) => (
//                         <div key={index} className="border-b py-2 flex flex-col">
//                           <p className="font-medium text-gray-900">
//                             Bill No: {bill.Bill_Number}
//                           </p>
//                           <p className="text-sm text-gray-600">
//                             Date: {new Date(bill.Bill_Date).toLocaleDateString("en-IN")}
//                           </p>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-gray-500 text-center">No Purchase Bills</p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Sale Invoices */}
//                 <div>
//                   <h4
//                     className="text-lg font-semibold mb-2"
//                     style={{ color: "green" }}
//                   >
//                     📄 Sale Invoices (
//                     {eachItemBillAndInvoiceNumbers?.saleDetails?.count || 0})
//                   </h4>

//                   <div
//                     className="border p-3 rounded-md bg-gray-50 overflow-y-auto"
//                     style={{ maxHeight: "230px" }}   // 🔥 scroll area only
//                   >
//                     {eachItemBillAndInvoiceNumbers?.saleDetails?.details?.length > 0 ? (
//                       eachItemBillAndInvoiceNumbers.saleDetails.details.map((invoice, index) => (
//                         <div key={index} className="border-b py-2 flex flex-col">
//                           <p className="font-medium text-gray-900">
//                             Invoice No: {invoice.Invoice_Number}
//                           </p>
//                           <p className="text-sm text-gray-600">
//                             Date: {new Date(invoice.Invoice_Date).toLocaleDateString("en-IN")}
//                           </p>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-gray-500 text-center">No Sale Invoices</p>
//                     )}
//                   </div>
//                 </div>

//               </div>

//               {/* Confirmation Section */}
//               <div className="mt-6">
//                 <p className="text-lg font-semibold text-center text-[#4CA1AF] mb-3">
//                   All above purchase and sales bills will be affected
//                 </p>
//                 <p style={{ color: "red" }}
//                   className="text-lg font-semibold text-center  mb-3">
//                   Are you sure you want to update this item?
//                 </p>

//                 <div className="flex justify-center gap-4">
//                   <button
//                     type="button"
//                     //onClick={() => handleEdit()}
//                     className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
//                   >
//                     {isEditingItem ? "Saving..." : "OK"}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => setEachItemBillAndInvoiceNumbersModalOpen(false)}
//                     className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>

//             </div>
//           </div>
//         )}
//       </div>

//       {showSelectUnitModal && (
//         <SelectUnitModal
//           units={itemUnits || []}
//           primaryUnit={primaryUnit}
//           secondaryUnit={secondaryUnit}
//           conversionRate={conversionRate}
//           conversionHistory={itemDetails?.unitConversions || []}
//           Item_Id={itemDetails?.Item_Id}   // 🔹 add this
//           initialBase={primaryUnit || ""}
//           initialSecondary={secondaryUnit || ""}
//           initialConversionRate={conversionRate || ""}

//           onClose={() => {
//             setShowSelectUnitModal(false);
//           }}

//           onSave={(newUnit) => {
//             console.log("Selected unit configuration:", newUnit);

//             setValue(
//               "Primary_Unit",
//               newUnit.baseUnit || null,
//               {
//                 shouldValidate: true,
//                 shouldDirty: true,
//               }
//             );

//             setValue(
//               "Secondary_Unit",
//               newUnit.secondaryUnit || null,
//               {
//                 shouldValidate: true,
//                 shouldDirty: true,
//               }
//             );

//             setValue(
//               "Conversion_Rate",
//               newUnit.secondaryUnit
//                 ? Number(newUnit.conversionRate)
//                 : null,
//               {
//                 shouldValidate: true,
//                 shouldDirty: true,
//               }
//             );

//             setShowSelectUnitModal(false);
//           }}
//         />
//       )}

//     </>
//   );
// }


export default function ItemModal({ itemDetails, editingItem, onClose, onRefreshBills,
  onRefreshTab }) {
  const dropdownRef = useRef(null);
  //const isInitialEditLoad = useRef(true);
  const dispatch = useDispatch()
  console.log("editingItem", editingItem);

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


  const toLocalDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  console.log(itemDetails, "itemDetails");
  const itemType = watch("Item_Type") || "Product";
  const { data: categories } = useGetAllCategoriesQuery()

  const [newCategory, setNewCategory] = useState("");
  const [addCategory] = useAddCategoryMutation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  // 🔹 renamed to "Pricing" (was "Items") to match AddItemModal's tab naming
  const [activeTab, setActiveTab] = useState("Pricing");
  const [eachItemBillAndInvoiceNumbersModalOpen, setEachItemBillAndInvoiceNumbersModalOpen] = useState(false)
  const [editItem, { isLoading: isEditingItem }] = useEditItemMutation()
  const [shouldFetchBills, setShouldFetchBills] = useState(false);
  const [showSelectUnitModal, setShowSelectUnitModal] = useState(false)
  const { data: itemUnitsFetched } = useGetAllItemUnitsQuery();
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

  const itemUnits = itemUnitsFetched
  const { data: apiResponse } =
    useGetEachItemBillAndInvoiceNumbersQuery(itemDetails?.Item_Id, {
      skip: !shouldFetchBills,
    });

  console.log(editingItem, "editingItem")
  const canEditUnits = itemDetails?.Can_Edit_Units ?? {
    Primary: true,
    Secondary: true,
  };

  // keep activeTab valid if it becomes "Stock" while itemType flips to Service — same guard as AddItemModal
  useEffect(() => {
    if (itemType === "Service" && activeTab === "Stock") {
      setActiveTab("Pricing");
    }
  }, [itemType, activeTab]);

  useEffect(() => {
    if (!editingItem) return;
    if (!itemDetails) return;
    if (Object.keys(itemDetails).length === 0) return;

    setSearch(itemDetails.Item_Category);

    reset({
      Item_Name: itemDetails.Item_Name,
      Item_Type: itemDetails.Item_Type || "Product",
      Item_Code: itemDetails.Item_Code,
      Item_Description: itemDetails.Item_Description,
      Item_Category: itemDetails.Item_Category,
      Item_Unit: itemDetails.Item_Unit,
      Item_HSN: itemDetails.Item_HSN,
      Primary_Unit: itemDetails.Primary_Unit,
      Secondary_Unit: itemDetails.Secondary_Unit,
      Conversion_Rate: itemDetails.Conversion_Rate,

      // Pricing — MRP
      MRP: itemDetails.MRP ?? "",
      Discount_On_MRP_For_Sale: itemDetails.Discount_On_MRP_For_Sale ?? "",

      // Sale Price
      Sale_Price: itemDetails.Sale_Price ?? "",
      Sale_Price_Type: itemDetails.Sale_Price_Type ?? "Without_Tax",
      Discount_On_Sale_Price: itemDetails.Discount_On_Sale_Price ?? "",
      Discount_Type_On_Sale_Price:
        itemDetails.Discount_Type_On_Sale_Price ?? "Percentage",

      // Purchase Price
      Purchase_Price: itemDetails.Purchase_Price ?? "",
      Purchase_Price_Type:
        itemDetails.Purchase_Price_Type ?? "Without_Tax",

      // Stock
      Opening_Quantity: itemDetails.Opening_Quantity ?? "",
      At_Price: itemDetails.At_Price ?? "",
      As_Of_Date: toLocalDateString(itemDetails.As_Of_Date),
      Min_Stock: itemDetails.Min_Stock ?? "",
      Location: itemDetails.Location ?? "",
    });
  }, [itemDetails, editingItem, reset]);

  const primaryUnit = watch("Primary_Unit");
  const secondaryUnit = watch("Secondary_Unit");
  const conversionRate = watch("Conversion_Rate");

  console.log(primaryUnit, secondaryUnit, conversionRate);
  const eachItemBillAndInvoiceNumbers = apiResponse?.billAndInvoiceNumbers || {
    purchaseDetails: { count: 0, details: [] },
    saleDetails: { count: 0, details: [] },
  };

  const formatConversionRate = (value) =>
    Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const handleSelect = (cat) => {
    setSelected(cat);
    setValue("Item_Category", cat, { shouldValidate: true });
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

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") {
      return
    }
    else if (newCategory.trim() !== "") {
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
    }
  };

  const formValues = watch();
  console.log(formValues, "formValues")
  console.log(errors)

  // 🔹 auto-calc Sale_Price from MRP + discount, same behavior as AddItemModal
  //const mrp = watch("MRP");
  //const discountOnMrp = watch("Discount_On_MRP_For_Sale");
  // useEffect(() => {
  //   // Don't recalculate Sale Price when existing item is first loaded
  //   if (editingItem && isInitialEditLoad.current) {
  //     isInitialEditLoad.current = false;
  //     return;
  //   }

  //   const mrpNum = Number(mrp);
  //   const discountNum = Number(discountOnMrp);

  //   if (mrpNum > 0 && discountNum >= 0) {
  //     const calculated = mrpNum - (mrpNum * discountNum) / 100;

  //     setValue("Sale_Price", calculated.toFixed(2), {
  //       shouldValidate: true,
  //       shouldDirty: true,
  //     });
  //   }
  // }, [mrp, discountOnMrp, editingItem, setValue]);
  // useEffect(() => {
  //   const mrpNum = Number(mrp);
  //   const discountNum = Number(discountOnMrp);

  //   if (mrpNum > 0 && discountNum >= 0) {
  //     const calculated = mrpNum - (mrpNum * discountNum) / 100;
  //     setValue("Sale_Price", calculated.toFixed(2), { shouldValidate: true, shouldDirty: true });
  //   }
  // }, [mrp, discountOnMrp, setValue]);

  const onSubmit = async () => {
    console.log("editingItem", editingItem);
    if (!editingItem) return;
    const payload = {
      ...formValues,
    };

    if (payload.Item_Type === "Service") {
      payload.Opening_Quantity = null;
      payload.At_Price = null;
      payload.As_Of_Date = null;
      payload.Min_Stock = null;
      payload.Location = null;
    }

    console.log("EDIT ITEM PAYLOAD:", payload);
    const oldType = itemDetails.Item_Type;
    const newType = payload.Item_Type;

    try {
      await editItem({
        body: payload,
        Item_Id: itemDetails.Item_Id,
      }).unwrap();

      await onRefreshBills?.();

      if (oldType !== newType) {
        onRefreshTab?.(newType);
      }
      toast.success("Item Updated Successfully");

      setEachItemBillAndInvoiceNumbersModalOpen(false);
      onClose();

      dispatch(
        itemApi.util.invalidateTags([
          { type: "Item", id: "LIST" },
          { type: "ItemsByCategory", id: "LIST" },
          { type: "ItemLedger", id: "LIST" },
        ])
      );

      dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
      dispatch(saleApi.util.invalidateTags(["Sale"]));
    } catch (err) {
      console.error("Failed to update item:", err);

      toast.error(
        err?.data?.message ||
        err?.message ||
        "Failed to update item"
      );
    }
  };

  const fieldLabel = (base) => (itemType === "Service" ? `Service ${base}` : `Item ${base}`);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center w-full"
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
          <style>{`
  .item-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: #4CA1AF;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .item-toggle::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.15);
  }
  .item-toggle.on::after {
    transform: translateX(20px);
  }
`}</style>

          <div className="flex justify-between items-center mb-6" style={{ paddingBottom: "10px" }}>
            {/* LEFT SIDE — title + toggle grouped together, matches AddItemModal */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h4 className="text-xl font-semibold text-gray-900">Edit Item</h4>
                <p className="text-gray-500 text-sm">Edit item details</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "#4CA1AF" }}>Product</span>
                <div
                  className={`item-toggle ${itemType === "Service" ? "on" : ""}`}
                  onClick={() => {
                    const next = itemType === "Product" ? "Service" : "Product";
                    setValue("Item_Type", next, { shouldValidate: true, shouldDirty: true });
                    if (next === "Service" && activeTab === "Stock") {
                      setActiveTab("Pricing");
                    }
                  }}
                />
                <span className="text-sm font-medium" style={{ color: "#4CA1AF" }}>Service</span>
              </div>
            </div>

            {/* RIGHT SIDE — close button only */}
            <button
              type="button"
              style={{ backgroundColor: "transparent" }}
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={22} />
            </button>
          </div>

          <input type="hidden" {...register("Item_Type")} />

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ══════════ ALWAYS VISIBLE — Category / Item Name row ══════════ */}
            <div className="flex gap-4">
              <div style={{ width: "50%" }} className="relative " ref={dropdownRef}>
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
                      onClick={() => { setShowCategoryModal(true); setOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                    >
                      + Add Category
                    </span>
                    {(categories || [])
                      ?.filter((cat) => cat.Item_Category.toLowerCase().includes(search.toLowerCase()))
                      .map((cat, i) => (
                        <div
                          key={i}
                          onClick={() => { handleSelect(cat.Item_Category); setSearch(cat.Item_Category); }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {cat.Item_Category}
                        </div>
                      ))}
                    {/* {categories?.filter((cat) => cat.Item_Category.toLowerCase().includes(search.toLowerCase())).length === 0 */}
                    {(categories || []).filter((cat) => String(cat?.Item_Category ?? "").toLowerCase()
                      .includes(String(search ?? "").toLowerCase())
                    ).length === 0
                      && (
                        <p className="px-3 py-2 text-gray-500">No categories found</p>
                      )}
                  </div>
                )}
                <input type="hidden" {...register("Item_Category")} value={selected || ""} />

                {showCategoryModal && (
                  <div
                    style={{
                      position: "fixed", inset: 0, display: "flex", alignItems: "center",
                      justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(4px)", zIndex: 60,
                    }}
                    onClick={() => setShowCategoryModal(false)}
                  >
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative" onClick={(e) => e.stopPropagation()}>
                      <button type="button" style={{ backgroundColor: "transparent" }} onClick={() => setShowCategoryModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
                      <h4 className="text-lg font-semibold mb-4">Add New Category</h4>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4CA1AF]"
                        placeholder="Enter category name"
                        style={{ marginBottom: "0px" }}
                      />
                      <div className="flex justify-end gap-3">
                        <button type="button" style={{ backgroundColor: "lightgray" }} onClick={() => setShowCategoryModal(false)} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700">Cancel</button>
                        <button type="button" onClick={handleAddCategory} style={{ backgroundColor: "#4CA1AF" }} className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#5c52d4]">Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="input-field col s6" style={{ width: "50%", marginTop: "0px" }}>
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
                  style={{ marginBottom: "0px" }}
                />
                {errors?.Item_Name && (
                  <p className="text-red-500 text-xs mt-1">{errors?.Item_Name?.message}</p>
                )}
              </div>
            </div>

            {/* ══════════ ALWAYS VISIBLE — Item Code / HSN / Unit row ══════════ */}
            <div className="flex gap-4 mt-4">
              <div className="input-field col s6" style={{ width: "50%" }}>
                <span className="active">Item Code</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="Item_Code"
                    {...register("Item_Code")}
                    placeholder="Item Code"
                    className="w-full outline-none border-b-2 text-gray-900"
                  />
                </div>
                {errors?.Item_Code && (
                  <p className="text-red-500 text-xs mt-1">{errors?.Item_Code?.message}</p>
                )}
              </div>

              <div className="input-field col s6" style={{ width: "50%" }}>
                <span className="active">{fieldLabel("HSN Code")}</span>
                <input
                  type="text"
                  id="Item_HSN"
                  {...register("Item_HSN")}
                  placeholder=" Item HSN Code"
                  className="w-full outline-none border-b-2 text-gray-900"
                  maxLength={8}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
                  style={{ marginBottom: "0px" }}
                />
                {errors?.Item_HSN && (
                  <p className="text-red-500 text-xs mt-1">{errors?.Item_HSN?.message}</p>
                )}
              </div>

              <div className="input-field col s6" style={{ width: "50%" }}>
                <span className="active">{fieldLabel("Unit")}</span>
                <div className="mt-2">
                  {!primaryUnit && canEditUnits.Primary && (
                    <button
                      type="button"
                      onClick={() => setShowSelectUnitModal(true)}
                      className="px-4 py-2 rounded-md border"
                      style={{ backgroundColor: "white", borderColor: "#4CA1AF", color: "#4CA1AF" }}
                    >
                      Select Unit
                    </button>
                  )}

                  {primaryUnit && (
                    <>
                      <div className="text-sm text-gray-600">
                        <span>Primary: <strong>{primaryUnit.toUpperCase()}</strong></span>
                        {secondaryUnit && (
                          <>
                            <span className="ml-3">Secondary: <strong>{secondaryUnit.toUpperCase()}</strong></span>
                            <div className="mt-1 text-[#4CA1AF]">
                              1 {primaryUnit.toUpperCase()} = {formatConversionRate(conversionRate)} {secondaryUnit.toUpperCase()}
                            </div>
                          </>
                        )}
                      </div>

                      {canEditUnits.Secondary && (
                        <button
                          type="button"
                          onClick={() => setShowSelectUnitModal(true)}
                          className="mt-2 px-4 py-2 rounded-md border"
                          style={{ backgroundColor: "white", borderColor: "#4CA1AF", color: "#4CA1AF" }}
                        >
                          {secondaryUnit ? "Edit Unit" : "Add Secondary Unit"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════ TABS ══════════ */}
            <div className="flex gap-6 w-full mt-6 mb-3">
              <div className="flex space-x-8">
                {(itemType === "Service" ? ["Pricing"] : ["Pricing", "Stock"]).map((tab) => (
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

            {/* ══════════ PRICING TAB — was completely missing before, now matches AddItemModal ══════════ */}
            {activeTab === "Pricing" && (
              <div className="mt-2">
                <div className="flex gap-4">
                  {showMRP && (<div className="input-field col s6" style={{ width: "50%" }}>
                    <span className="active">MRP</span>
                    <input
                      type="text"
                      placeholder="MRP"
                      className="w-full outline-none border-b-2 text-gray-900"
                      {...register("MRP")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");

                        setValue("MRP", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        if (!calculateSalePriceFromMRP) return;
                        const mrpNum = Number(value);
                        const discountNum = Number(
                          watch("Discount_On_MRP_For_Sale")
                        );

                        if (mrpNum > 0 && discountNum >= 0) {
                          const calculated =
                            mrpNum - (mrpNum * discountNum) / 100;

                          setValue("Sale_Price", calculated.toFixed(2), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      //onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                      style={{ marginBottom: "0px" }}
                    />
                    {errors?.MRP && <p className="text-red-500 text-xs mt-1">{errors?.MRP?.message}</p>}
                  </div>)}
                  {showMRP && calculateSalePriceFromMRP && (<div className="input-field col s6" style={{ width: "50%" }}>
                    <span className="active">Disc. On MRP For Sale (%)</span>
                    <input
                      type="text"
                      placeholder="Discount %"
                      className="w-full outline-none border-b-2 text-gray-900"
                      {...register("Discount_On_MRP_For_Sale")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");

                        setValue("Discount_On_MRP_For_Sale", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });

                        // If setting is OFF, do NOT calculate Sale Price
                        if (!calculateSalePriceFromMRP) return;

                        const mrpNum = Number(watch("MRP"));
                        const discountNum = Number(value);

                        if (mrpNum > 0 && discountNum >= 0) {
                          const calculated =
                            mrpNum - (mrpNum * discountNum) / 100;

                          setValue("Sale_Price", calculated.toFixed(2), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      // onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                      style={{ marginBottom: "0px" }}
                    />
                    {errors?.Discount_On_MRP_For_Sale && (
                      <p className="text-red-500 text-xs mt-1">{errors?.Discount_On_MRP_For_Sale?.message}</p>
                    )}
                  </div>)}
                </div>

                <div className="flex gap-4 mt-4">
                  <div className="input-field col s6" style={{ width: "50%" }}>
                    <span className="active">Sale Price</span>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Sale Price"
                        className="w-full outline-none border-b-2 text-gray-900"
                        {...register("Sale_Price")}
                        onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                        style={{ marginBottom: "0px" }}
                      />
                      <select
                        {...register("Sale_Price_Type")}
                        className="border-b-2 outline-none text-gray-900 bg-transparent mt-2"
                        style={{ height: "38px", marginBottom: "1px" }}
                      >
                        <option value="Without_Tax">Without Tax</option>
                        <option value="With_Tax">With Tax</option>
                      </select>
                    </div>
                    {errors?.Sale_Price && <p className="text-red-500 text-xs mt-1">{errors?.Sale_Price?.message}</p>}
                  </div>

                  <div className="input-field col s6" style={{ width: "50%" }}>
                    <span className="active">Disc. On Sale Price</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount"
                        className="w-full outline-none border-b-2 text-gray-900"
                        {...register("Discount_On_Sale_Price")}
                        onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                        style={{ marginBottom: "0px" }}
                      />
                      <select
                        {...register("Discount_Type_On_Sale_Price")}
                        className="border-b-2 outline-none text-gray-900 bg-transparent mt-2"
                        style={{ height: "38px", marginBottom: "1px" }}
                      >
                        <option value="Percentage">Percentage</option>
                        <option value="Amount">Amount</option>
                      </select>
                    </div>
                    {errors?.Discount_On_Sale_Price && (
                      <p className="text-red-500 text-xs mt-1">{errors?.Discount_On_Sale_Price?.message}</p>
                    )}
                  </div>
                </div>

                {itemType === "Product" && (
                  <div className="flex gap-4 mt-4" style={{ width: "50%" }}>
                    <div className="input-field col s6">
                      <span className="active">Purchase Price</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Purchase Price"
                          className="w-full outline-none border-b-2 text-gray-900"
                          {...register("Purchase_Price")}
                          onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                          style={{ marginBottom: "0px" }}
                        />
                        <select {...register("Purchase_Price_Type")} className="border-b-2 outline-none text-gray-900 bg-transparent">
                          <option value="Without_Tax">Without Tax</option>
                          <option value="With_Tax">With Tax</option>
                        </select>
                      </div>
                    </div>
                    {errors?.Purchase_Price && <p className="text-red-500 text-xs mt-1">{errors?.Purchase_Price?.message}</p>}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ STOCK TAB — unchanged ══════════ */}
            {activeTab === "Stock" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6">
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
                    className="w-full outline-none border-b-2 text-gray-900"
                    {...register("Location")} />
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
                disabled={formValues.errorCount > 0 || isEditingItem}
                className="text-white font-bold py-2 px-4 rounded"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isEditingItem ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>

        {eachItemBillAndInvoiceNumbersModalOpen && (
          <div
            className="fixed inset-0 
    flex items-center justify-center 
    bg-white z-50 bg-opacity-50 "
          >
            <div
              className="bg-white w-full max-w-2xl rounded-lg shadow-lg 
                 p-6 overflow-y-auto"
              style={{ maxHeight: "85vh" }}
            >
              <h3 className="text-xl font-semibold text-center text-[#4CA1AF] mb-4">
                Associated Bill & Invoice Numbers
              </h3>

              <div className="grid grid-cols-2 gap-6">
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
                    style={{ maxHeight: "230px" }}
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
                    style={{ maxHeight: "230px" }}
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

              <div className="mt-6">
                <p className="text-lg font-semibold text-center text-[#4CA1AF] mb-3">
                  All above purchase and sales bills will be affected
                </p>
                <p style={{ color: "red" }}
                  className="text-lg font-semibold text-center  mb-3">
                  Are you sure you want to update this item?
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
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
          Item_Id={itemDetails?.Item_Id}
          initialBase={primaryUnit || ""}
          initialSecondary={secondaryUnit || ""}
          initialConversionRate={conversionRate || ""}
          onClose={() => {
            setShowSelectUnitModal(false);
          }}
          onSave={(newUnit) => {
            console.log("Selected unit configuration:", newUnit);

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


