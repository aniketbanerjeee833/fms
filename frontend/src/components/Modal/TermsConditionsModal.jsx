// import { useState, useRef, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { X } from "lucide-react";

// /* ─────────────────────────────────────────────────────────────
//    Replace these with your real RTK Query hooks
// ───────────────────────────────────────────────────────────────*/
// // import {
// //   useGetAllTermsQuery,
// //   useAddTermsMutation,
// //   useUpdateTermsMutation,
// // } from "../api/termsApi";

// const APPLICABLE_OPTIONS = [
//   { key: "Sale_Invoice",         label: "Sale Invoice" },
//   //{ key: "Sale_Order",           label: "Sale Order" },
//   //{ key: "Delivery_Challan",     label: "Delivery Challan" },
//   //{ key: "Estimation_Quotation", label: "Estimation/Quotation" },
//   { key: "Purchase_Bill",        label: "Purchase Bill" },
//   //{ key: "Purchase_Order",       label: "Purchase Order" },
//   //{ key: "Proforma_Invoice",     label: "Proforma Invoice" },
// ];

// const ACCENT = "#4CA1AF";

// /* ═══════════════════════════════════════════════════════════════
//    MODAL
// ═══════════════════════════════════════════════════════════════ */
// function TermsModal({ mode = "add", initialData = null, onClose, onSave, isSaving = false }) {
//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       Title:                initialData?.Title                || "",
//       Terms:                initialData?.Terms                || "",
//       Sale_Invoice:         initialData?.Sale_Invoice         || false,
//       //Sale_Order:           initialData?.Sale_Order           || false,
//       ////Delivery_Challan:     initialData?.Delivery_Challan     || false,
//       //Estimation_Quotation: initialData?.Estimation_Quotation || false,
//       Purchase_Bill:        initialData?.Purchase_Bill        || false,
//       //Purchase_Order:       initialData?.Purchase_Order       || false,
//       //Proforma_Invoice:     initialData?.Proforma_Invoice     || false,
//     },
//   });

//   const formValues  = watch();
//   const titleFilled    = formValues.Title?.trim().length > 0;
//   const anyApplicable  = APPLICABLE_OPTIONS.some((opt) => formValues[opt.key]);
//   const canSave        = titleFilled && anyApplicable;

//   const onSubmit = (data) => {
//     if (!canSave) return;
//     onSave(data);
//   };

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "rgba(0,0,0,0.35)",
//         backdropFilter: "blur(4px)",
//         zIndex: 60,
//         padding: "1rem",
//       }}
//     >
//       <div
//         className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col"
//         style={{ maxHeight: "90vh" }}
//       >
//         {/* Header */}
//         <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
//           <h4 className="text-lg font-semibold text-gray-900">
//             {mode === "add" ? "Add Terms & Conditions" : "Edit Terms & Conditions"}
//           </h4>
//           <button
//             type="button"
//             onClick={onClose}
//             style={{ background: "transparent", border: "none", cursor: "pointer" }}
//           >
//             <X size={20} className="text-gray-500 hover:text-gray-700" />
//           </button>
//         </div>

//         <form
//           onSubmit={handleSubmit(onSubmit)}
//           className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-5"
//         >
//           {/* Title */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium text-gray-700">Title</label>
//             <input
//               type="text"
//               placeholder="Enter title"
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4CA1AF] transition-colors"
//               {...register("Title", { required: "Title is required" })}
//             />
//             {errors?.Title && (
//               <p className="text-red-500 text-xs mt-0.5">{errors.Title.message}</p>
//             )}
//             <p className="text-xs text-gray-500 mt-0.5">
//               You can select the term based on the header you select here
//             </p>
//           </div>

//           {/* Terms */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-medium text-gray-700">Terms</label>
//             <textarea
//               rows={8}
//               placeholder="Paste/Write your terms and conditions here"
//               style={{ resize: "vertical" }}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4CA1AF] transition-colors"
//               {...register("Terms")}
//             />
//           </div>

//           {/* Applicable For */}
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium text-gray-700">Applicable for:</label>
//             <div className="grid grid-cols-2 gap-y-2 gap-x-4">
//               {APPLICABLE_OPTIONS.map((opt) => (
//                 <label
//                   key={opt.key}
//                   className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
//                 >
//                   <input
//                     type="checkbox"
//                     className="w-4 h-4 cursor-pointer"
//                     style={{ accentColor: ACCENT }}
//                     {...register(opt.key)}
//                   />
//                   {opt.label}
//                 </label>
//               ))}
//             </div>
//             {titleFilled && !anyApplicable && (
//               <p className="text-amber-500 text-xs mt-0.5">
//                 Please select at least one applicable type to enable Save
//               </p>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="flex justify-end gap-3 mt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
//             >
//               No, Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={!canSave || isSaving}
//               className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
//               style={{
//                 backgroundColor: ACCENT,
//                 opacity: canSave && !isSaving ? 1 : 0.4,
//                 cursor: canSave && !isSaving ? "pointer" : "not-allowed",
//               }}
//             >
//               {isSaving ? "Saving..." : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════
//    TERMS & CONDITIONS SELECTOR WIDGET
//    Usage in your sale/purchase form:
//      <TermsConditionsModal
//        termsList={termsData?.terms || []}
//        value={watch("Terms_Conditions_Id")}
//        onChange={(id) => setValue("Terms_Conditions_Id", id)}
//        onRefresh={() => dispatch(termsApi.util.invalidateTags(["Terms"]))}
//      />
// ═══════════════════════════════════════════════════════════════ */
// export function TermsConditionsModal({
//   termsList = [],
//   value     = null,
//   onChange,
//   onRefresh,
// }) {
//   const [dropOpen, setDropOpen] = useState(false);
//   const [modal,    setModal]    = useState({ open: false, mode: "add", data: null });
//   const [isSaving, setIsSaving] = useState(false);
//   const dropRef = useRef(null);

//   useEffect(() => {
//     const handler = (e) => {
//       if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const selected = termsList.find((t) => t.Terms_Conditions_Id === value) || null;

//   const handleSave = async (formData) => {
//     setIsSaving(true);
//     try {
//       if (modal.mode === "edit") {
//         // await updateTerms({ id: modal.data.Terms_Conditions_Id, ...formData }).unwrap();
//         console.log("UPDATE terms:", modal.data.Terms_Conditions_Id, formData);
//       } else {
//         // const res = await addTerms(formData).unwrap();
//         // onChange?.(res.Terms_Conditions_Id); // auto-select newly created
//         console.log("ADD terms:", formData);
//       }
//       onRefresh?.();
//       setModal({ open: false, mode: "add", data: null });
//     } catch (err) {
//       console.error("Failed to save terms:", err);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <>
//       <style>{`
//         .tnc-drop-item { transition: background 0.12s; }
//         .tnc-drop-item:hover { background: #f4f9fa; }
//       `}</style>
//  <div
//       style={{
//         position: "fixed",
//         marginTop: "4rem",
//         inset: 0,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "rgba(0,0,0,0.3)",
//         backdropFilter: "blur(4px)",
//         zIndex: 50,
//         padding: "1rem",
//       }}
//     >
//       <div className="flex flex-col gap-2 w-full">
//         <span className="text-sm font-semibold text-gray-800">Terms &amp; Conditions</span>

//         {/* ── Title dropdown ── */}
//         <div className="relative" ref={dropRef}>
//           <div
//             onClick={() => setDropOpen((p) => !p)}
//             className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer text-sm hover:border-[#4CA1AF] transition-colors"
//           >
//             <span className={selected ? "text-gray-900" : "text-gray-400"}>
//               {selected ? selected.Title : "Select Title"}
//             </span>
//             <span className="text-gray-500" style={{ fontSize: 12 }}>▼</span>
//           </div>

//           {dropOpen && (
//             <div className="absolute top-full left-0 z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
//               {/* Add new */}
//               <div
//                 onClick={() => {
//                   setDropOpen(false);
//                   setModal({ open: true, mode: "add", data: null });
//                 }}
//                 className="tnc-drop-item px-3 py-2 text-sm cursor-pointer font-medium"
//                 style={{ color: ACCENT }}
//               >
//                 + Add Terms &amp; Conditions
//               </div>

//               {termsList.length === 0 && (
//                 <p className="px-3 py-2 text-xs text-gray-400">No terms saved yet</p>
//               )}

//               {termsList.map((t) => {
//                 const isSelected = value === t.Terms_Conditions_Id;
//                 return (
//                   <div
//                     key={t.Terms_Conditions_Id}
//                     className="tnc-drop-item flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
//                     style={{
//                       background:  isSelected ? "#eaf6f7" : undefined,
//                       color:       isSelected ? ACCENT    : "#374151",
//                       fontWeight:  isSelected ? 500       : 400,
//                     }}
//                   >
//                     <span
//                       className="flex-1"
//                       onClick={() => { onChange?.(t.Terms_Conditions_Id); setDropOpen(false); }}
//                     >
//                       {t.Title}
//                     </span>

//                     {/* Edit */}
//                     <button
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setDropOpen(false);
//                         setModal({ open: true, mode: "edit", data: t });
//                       }}
//                       title="Edit"
//                       style={{
//                         background: "none", border: "none",
//                         cursor: "pointer", color: "#9ca3af",
//                         fontSize: 14, padding: "0 4px",
//                       }}
//                     >
//                       ✎
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ── Preview box ── */}
//         <div
//           className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-white text-sm"
//           style={{ minHeight: 72 }}
//         >
//           {selected?.Terms ? (
//             <p className="text-gray-700 whitespace-pre-wrap text-xs leading-5">
//               {selected.Terms}
//             </p>
//           ) : (
//             <p className="text-gray-400 italic text-xs">
//               Selected terms and conditions appear here
//             </p>
//           )}
//         </div>

//         {/* Clear */}
//         {selected && (
//           <button
//             type="button"
//             onClick={() => onChange?.(null)}
//             style={{
//               background: "none", border: "none",
//               cursor: "pointer", color: "#ef4444",
//               fontSize: 12, alignSelf: "flex-end", padding: 0,
//             }}
//           >
//             Clear
//           </button>
//         )}
//       </div>
//       </div>

//       {/* {modal.open && (
//         <TermsModal
//           mode={modal.mode}
//           initialData={modal.data}
//           onClose={() => setModal({ open: false, mode: "add", data: null })}
//           onSave={handleSave}
//           isSaving={isSaving}
//         />
//       )} */}
//     </>
//   );
// }

// export default TermsConditionsModal;




import { useForm } from "react-hook-form";
import { X } from "lucide-react";
 
/* ─────────────────────────────────────────────────────────────
   Replace these with your real RTK Query hooks
───────────────────────────────────────────────────────────────*/
// import {
//   useGetAllTermsQuery,
//   useAddTermsMutation,
//   useUpdateTermsMutation,
// } from "../api/termsApi";
 
const APPLICABLE_OPTIONS = [
  { key: "Sale_Invoice",         label: "Sale Invoice" },
  //{ key: "Sale_Order",           label: "Sale Order" },
  //{ key: "Delivery_Challan",     label: "Delivery Challan" },
  //{ key: "Estimation_Quotation", label: "Estimation/Quotation" },
  { key: "Purchase_Bill",        label: "Purchase Bill" },
  //{ key: "Purchase_Order",       label: "Purchase Order" },
  //{ key: "Proforma_Invoice",     label: "Proforma Invoice" },
];
 
const ACCENT = "#4CA1AF";
 
/* ═══════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════ */
export default function TermsConditionsModal({ mode = "add", initialData = null, onClose, onSave, isSaving = false }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      Title:                initialData?.Title                || "",
      Terms:                initialData?.Terms                || "",
      Sale_Invoice:         initialData?.Sale_Invoice         || false,
      //Sale_Order:           initialData?.Sale_Order           || false,
      //Delivery_Challan:     initialData?.Delivery_Challan     || false,
      ///Estimation_Quotation: initialData?.Estimation_Quotation || false,
      Purchase_Bill:        initialData?.Purchase_Bill        || false,
      //Purchase_Order:       initialData?.Purchase_Order       || false,
      //Proforma_Invoice:     initialData?.Proforma_Invoice     || false,
    },
  });
  

  const formValues=watch()
  const titleFilled    = formValues.Title?.trim().length > 0;
  const anyApplicable  = APPLICABLE_OPTIONS.some((opt) => formValues[opt.key]);
  const canSave        = titleFilled && anyApplicable;
 
  const onSubmit = (data) => {
    if (!canSave) return;
    onSave(data);
  };

 
  console.log("Form Data (from RHF) in terms and conditions:", formValues);
  console.log(initialData, "Initial Data",isSaving);
 
  return (
    <div
      style={{
        position: "fixed",
       marginTop:"3rem",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        padding: "1rem",
      }}
>
  <div
    className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 max-h-[90vh]"
  >
    {/* Header */}
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900">
        {mode === "add" ? "Add Terms & Conditions" : "Edit Terms & Conditions"}
      </h4>
      <button
        type="button"
        onClick={onClose}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <X size={20} className="text-gray-500 hover:text-gray-700" />
      </button>
    </div>

    <div
      //onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col flex-1 overflow-y-auto px-4 py-2 gap-5"
    >
      {/* Title — small */}
      <div className="flex flex-col gap-1 sm:w-1/2">
          <span className="active">Title</span>
        {/* <input
          type="text"
          placeholder="Enter title"
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#4CA1AF] transition-colors"
          style={{ height: "2.25rem" }}
          {...register("Title", { required: "Title is required" })}
        /> */}
         <input
                type="text"
           
                placeholder="Enter title"
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                 {...register("Title", { required: "Title is required" })}
              />
        {errors?.Title && (
          <p className="text-red-500 text-xs mt-0.5">{errors.Title.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          You can select the term based on the header you select here
        </p>
      </div>

      {/* Terms — big */}
      <div className="flex flex-col gap-1">
        <span className="active">Terms</span>
        <textarea
          rows={5}
          placeholder="Paste/Write your terms and conditions here"
          style={{ resize: "vertical", minHeight: "150px" }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4CA1AF] transition-colors"
          {...register("Terms")}
        />
      </div>

      {/* Applicable For */}
      <div className="flex flex-col gap-2">
        <span className="active">Applicable For</span>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
          {APPLICABLE_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
            >
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: ACCENT }}
                {...register(opt.key)}
              />
              {opt.label}
            </div>
          ))}
        </div>
        {titleFilled && !anyApplicable && (
          <p className="text-amber-500 text-xs mt-0.5">
            Please select at least one applicable type to enable Save
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          No, Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave || isSaving}
            onClick={handleSubmit(onSubmit)}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
          style={{
            backgroundColor: ACCENT,
            opacity: canSave && !isSaving ? 1 : 0.4,
            cursor: canSave && !isSaving ? "pointer" : "not-allowed",
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
</div>
  );
}