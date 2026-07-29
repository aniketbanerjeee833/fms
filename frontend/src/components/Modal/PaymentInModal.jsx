// import { useState, useEffect, useRef } from "react";
// import { useFieldArray, useForm } from "react-hook-form";
// import { Trash2 } from "lucide-react";
// import { toast } from "react-toastify";
// /**
//  * PaymentInModal
//  *
//  * Mandatory fields (must match backend):
//  *   Party_Id, Payment_Date, Payment_Type, Received
//  *
//  * Backend check being satisfied:
//  *   const { Party_Id, Receipt_No, Payment_Date, Payment_Type, Received } = req.body;
//  *   if (!Party_Id || !Payment_Date || !Payment_Type || !Received) { ... }
//  */
// export default function PaymentInModal({
//   mode = "add",              // "add" | "edit" | "view"
//   initialData = null,        // existing payment-in record for edit/view
//   parties = [],               // array of { Party_Id, Party_Name, Phone_Number, GSTIN } (or { parties: [...] })
//   onClose,
//   onSave,
//   banks,
//   PartyAddModal,               // optional: pass your own <AddParty> component in as a prop
//   isSaving = false,
// }) {
//   const isView = mode === "view";
//   // Normalize parties prop - accepts either an array or { parties: [...] }
//   const partyList = Array.isArray(parties) ? parties : parties?.parties || [];

//   const formatDateForInput = (date) => {
//     if (!date) return "";

//     const d = new Date(date);
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");

//     return `${year}-${month}-${day}`;
//   };

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     control,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       Party_Id: initialData?.Party_Id || "",
//       Party_Name: initialData?.Party_Name || "",
//       Receipt_No: initialData?.Receipt_No || "",
//       Payment_Type: initialData?.Payment_Type || "",
//       Bank_Account_Id: initialData?.Bank_Account_Id || "",

//       Payment_Date: formatDateForInput(initialData?.Payment_Date) || "",

//       Reference_No: initialData?.Reference_No || "",
//       Received: initialData?.Received ?? "",
//       splits: initialData?.splits?.length
//         ? initialData.splits
//         : [{ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],

//     },
//     mode: "onSubmit",
//   });

//   const paymentType = watch("Payment_Type");
//   const { fields, append, remove } = useFieldArray({ control, name: "splits" });
//   const [open, setOpen] = useState(false);
//   const [partySearch, setPartySearch] = useState(initialData?.Party_Name || "");
//   const [showSplitBox, setShowSplitBox] = useState(
//     isView ? (initialData?.splits?.length > 0) : (initialData?.splits?.length > 1)
//   );

//   // ---- Payment-type option list used by every split row ----
//   // repeatable: true  -> can be picked in more than one row (Cheque / Neft)
//   // repeatable: false -> once picked in a row, disappears from every other row (Cash / a specific Bank)
//   const buildPaymentTypeOptions = () => [
//     { value: "Cash", label: "Cash", repeatable: false },
//     { value: "Cheque", label: "Cheque", repeatable: true },
//     { value: "Neft", label: "Neft", repeatable: true },
//     ...(banks || []).map((bank) => ({
//       value: `bank_${bank.Bank_Account_Id}`,
//       label: bank.Account_Display_Name,
//       repeatable: false,
//     })),
//   ];

//   const getRowIdentifier = (type, bankId) =>
//     type === "Bank" ? `bank_${bankId ?? ""}` : type;

//   // returns identifiers already used by OTHER rows (excludes the row we're rendering options for)
//   const getUsedIdentifiers = (excludeIndex) => {
//     const splitValues = watch("splits") || [];
//     return splitValues
//       .map((s, i) =>
//         i === excludeIndex ? null : getRowIdentifier(s.Payment_Type, s.Bank_Account_Id)
//       )
//       .filter(Boolean);
//   };

//   // options available for a given row = all options minus (non-repeatable ones already used elsewhere)
//   const getAvailableOptions = (excludeIndex) => {
//     const used = getUsedIdentifiers(excludeIndex);
//     return buildPaymentTypeOptions().filter(
//       (opt) => opt.repeatable || !used.includes(opt.value)
//     );
//   };
//   const handleAddPaymentType = () => {
//     const currentType = watch("Payment_Type");
//     const currentBankId = watch("Bank_Account_Id");
//     const currentAmount = watch("Received") || "";

//     setValue("splits", [
//       {
//         Payment_Type: currentType,
//         Bank_Account_Id: currentBankId || null,
//         Reference_Number: watch("Reference_No") || "",
//         Amount: currentAmount,
//       },
//       {
//         Payment_Type: "",
//         Bank_Account_Id: null,
//         Reference_Number: "",
//         Amount: "",
//       },
//     ]);

//     setShowSplitBox(true);
//   };
//   // const handleAddPaymentType = () => {
//   //   // seed splits with whatever is currently in the single dropdown, so it's not lost
//   //   const currentType = watch("Payment_Type");
//   //   const currentBankId = watch("Bank_Account_Id");
//   //   const currentAmount = watch("Received") || "";

//   //   append(
//   //     fields.length === 0
//   //       ? [
//   //         { Payment_Type: currentType || "", Bank_Account_Id: currentBankId || null, Reference_Number: "", Amount: currentAmount },
//   //         { Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" },
//   //       ]
//   //       : { Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" }
//   //   );

//   //   setShowSplitBox(true);
//   // };
//   const [showPartyModal, setShowPartyModal] = useState(false);
//   const wrapperRef = useRef(null);

//   // Close the party dropdown when clicking outside of it
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
//         setOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const filteredParties = partyList.filter(
//     (p) =>
//       p?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase()) ||
//       p?.Phone_Number?.includes(partySearch)
//   );

//   const selectParty = (party) => {
//     setPartySearch(party.Party_Name);
//     setValue("Party_Id", party.Party_Id, { shouldValidate: true });
//     setValue("Party_Name", party.Party_Name, { shouldValidate: true });
//     setOpen(false);
//   };

//   const handleAddPartyResult = (newParty) => {
//     // newParty expected shape: { Party_Id, Party_Name } - adjust to whatever your AddParty modal returns
//     if (newParty?.Party_Id) {
//       selectParty(newParty);
//     } else if (typeof newParty === "string") {
//       // fallback if only a name string comes back
//       setPartySearch(newParty);
//       setValue("Party_Name", newParty, { shouldValidate: true });
//     }
//     setShowPartyModal(false);
//   };
//   const formValues = watch();
//   console.log(formValues);
//   const onSubmit = (data) => {
//   if (isView) return;

//   if (!data.Payment_Date) {
//     // shouldn't happen since register has required, but safety net
//     return;
//   }

//   let payload = { ...data };

//   if (showSplitBox) {
//     const splitsTotal = (data.splits || []).reduce(
//       (sum, s) => sum + (Number(s.Amount) || 0),
//       0
//     );

//     if (splitsTotal <= 0) {
//      toast.error("Received amount must be greater than zero");
//       return;
//     }

//     payload.Received = splitsTotal;
//     payload.Payment_Type = null;
//     payload.Bank_Account_Id = null;
//     payload.Reference_No = null;
//   } else {
//     // single mode — backend reads Payment_Type/Bank_Account_Id/Received directly
//     payload.splits = null;
//   }

//   onSave(payload);
// };
//   // const onSubmit = (data) => {
//   //   if (isView) return;
//   //   onSave(data);
//   // };

//   return (
//     <div
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
//       <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 overflow-hidden max-h-[90vh]">
//         {/* Header */}
//         <div
//           className="flex justify-between items-center mb-6"
//           style={{ marginBottom: "20px", paddingBottom: "10px" }}
//         >
//           <h4 className="text-xl font-semibold text-gray-900">
//             {mode === "add" ? "Payment-In" : mode === "edit" ? "Edit Payment-In" : "View Payment-In"}
//           </h4>
//           <button
//             type="button"
//             style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             ✕
//           </button>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           {/* Fields — 2 column grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-">
//             {/* Party (searchable combobox) */}
//             <div
//               ref={wrapperRef}
//               className="flex flex-col relative mt-2 gap-2 party-class"
//               style={{ marginBottom: "0px", marginTop: "0px" }}
//             >
//               <span className="whitespace-nowrap active">
//                 Party
//                 <span className="text-red-500">&nbsp;*</span>
//               </span>

//               {/* Hidden field registered so RHF validates Party_Id */}
//               <input
//                 type="hidden"
//                 {...register("Party_Id", { required: "Party is required" })}
//               />

//               <div className="relative w-full">
//                 <div
//                   className="flex flex-row border rounded-md bg-white cursor-pointer"
//                   onClick={() => !isView && setOpen((prev) => !prev)}
//                 >
//                   <input
//                     type="text"
//                     id="Party_Name"
//                     value={partySearch}
//                     disabled={isView}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       setPartySearch(value);
//                       // typing again invalidates any previously-selected party id
//                       setValue("Party_Id", "", { shouldValidate: false });
//                       setValue("Party_Name", value, { shouldValidate: false });
//                       setOpen(true);
//                     }}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       if (!isView) setOpen(true);
//                     }}
//                     placeholder="Search By Name/Phone"
//                     className="w-full outline-none py-1 px-2 text-gray-900"
//                     style={{
//                       marginBottom: 0,
//                       marginTop: "4px",
//                       border: "none",
//                       borderBottom: "none",
//                       height: "2rem",
//                     }}
//                   />
//                   <div className="w-10" />
//                   {!isView && <span className="absolute right-0 px-2 top-1/3 text-gray-700">▼</span>}
//                 </div>

//                 {open && !isView && (
//                   <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
//                     <span
//                       onClick={() => setShowPartyModal(true)}
//                       className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
//                     >
//                       + Add Party
//                     </span>

//                     {filteredParties.map((party, i) => (
//                       <div
//                         key={party.Party_Id ?? i}
//                         onClick={() => selectParty(party)}
//                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                       >
//                         {party.Party_Name} {party.Phone_Number ? `(${party.Phone_Number})` : ""}
//                       </div>
//                     ))}

//                     {filteredParties.length === 0 && (
//                       <p className="px-3 py-2 text-gray-500">No Party found</p>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Add Party Modal - only rendered if a component was passed in */}
//               {showPartyModal && PartyAddModal && (
//                 <PartyAddModal
//                   onClose={() => setShowPartyModal(false)}
//                   onSave={handleAddPartyResult}
//                 />
//               )}

//               {errors?.Party_Id && (
//                 <p className="text-red-500 text-xs mt-1">{errors.Party_Id.message}</p>
//               )}
//             </div>

//             {/* Receipt No */}
//             <div className="flex flex-col">
//               <span className="active">Receipt No</span>
//               <input
//                 type="text"
//                 readOnly={isView}
//                 placeholder="Enter receipt no."
//                 className="w-full outline-none border-b-2 text-gray-900 py-1"
//                 {...register("Receipt_No")}
//               />
//             </div>

//             {/* Payment Type */}
//             <div className="flex flex-col col-span-2">
//               <span className="active">
//                 Payment Type
//                 <span className="text-red-500">&nbsp;*</span>
//               </span>

//               {!showSplitBox ? (
//                 <>
//                   <select
//                     id="Payment_Type"
//                     disabled={isView}
//                     value={
//                       watch("Payment_Type") === "Bank"
//                         ? `bank_${watch("Bank_Account_Id") || ""}`
//                         : watch("Payment_Type") || ""
//                     }
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       if (val.startsWith("bank_")) {
//                         const bankId = val.replace("bank_", "");
//                         setValue("Payment_Type", "Bank", { shouldValidate: true, shouldDirty: true });
//                         setValue("Bank_Account_Id", Number(bankId), { shouldValidate: true, shouldDirty: true });
//                       } else {
//                         setValue("Payment_Type", val, { shouldValidate: true, shouldDirty: true });
//                         setValue("Bank_Account_Id", null, { shouldValidate: true, shouldDirty: true });
//                       }
//                     }}
//                   >
//                     <option value="">Select Payment Type</option>
//                     <option value="Cash">Cash</option>
//                     <option value="Cheque">Cheque</option>
//                     <option value="Neft">Neft</option>
//                     {banks?.map((bank) => (
//                       <option key={bank.Bank_Account_Id} value={`bank_${bank.Bank_Account_Id}`}>
//                         {bank.Account_Display_Name}
//                       </option>
//                     ))}
//                   </select>

//                   {errors?.Payment_Type && (
//                     <p className="text-red-500 text-xs mt-1">{errors?.Payment_Type?.message}</p>
//                   )}

//                   {!isView && (
//                     <button
//                       type="button"
//                       onClick={handleAddPaymentType}
//                       className="text-[#4CA1AF] text-sm font-medium hover:underline self-start mt-2"
//                       style={{ background: "transparent", border: "none", padding: 0 }}
//                     >
//                       + Add Payment Type
//                     </button>
//                   )}
//                 </>
//               ) : (
//                 <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3 mt-2">
//                   {fields.map((field, index) => {
//                     const rowType = watch(`splits.${index}.Payment_Type`);
//                     const needsRef =
//                       rowType === "Cheque" ||
//                       rowType === "Neft" ||
//                       rowType === "Bank";
//                     // const needsRef = rowType === "Cheque" || rowType === "Neft";
//                     const rowOptions = getAvailableOptions(index);
//                     const currentIdentifier = getRowIdentifier(
//                       rowType,
//                       watch(`splits.${index}.Bank_Account_Id`)
//                     );

//                     return (
//                       <div key={field.id} className="flex flex-col gap-2">
//                         {/* Payment Type | Amount | Delete — all on one line, bottoms aligned */}
//                         <div className="flex items-end gap-2">
//                           <div className="flex flex-col flex-1">
//                             <span className="text-xs text-gray-500 mb-1">Payment Type</span>
//                             <select
//                               disabled={isView}
//                               value={currentIdentifier || ""}
//                               onChange={(e) => {
//                                 const val = e.target.value;
//                                 if (val.startsWith("bank_")) {
//                                   setValue(`splits.${index}.Payment_Type`, "Bank", { shouldValidate: true });
//                                   setValue(`splits.${index}.Bank_Account_Id`, Number(val.replace("bank_", "")), { shouldValidate: true });
//                                 } else {
//                                   setValue(`splits.${index}.Payment_Type`, val, { shouldValidate: true });
//                                   setValue(`splits.${index}.Bank_Account_Id`, null, { shouldValidate: true });
//                                 }
//                               }}
//                               className="border rounded-md px-2 py-1.5"
//                             >
//                               <option value="">Select Type</option>
//                               {rowOptions.map((opt) => (
//                                 <option key={opt.value} value={opt.value}>
//                                   {opt.label}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>

//                           <div className="flex flex-col flex-1 ">
//                             <span className="text-xs text-gray-500 mb-1 ">Amount</span>
//                             <input
//                               type="text"
//                               //step="0.01"
//                               readOnly={isView}
//                               placeholder="Amount"
//                               style={{ marginBottom: "0px", width: "80%" }}
//                               className="border rounded-md px-2 py-1.5"
//                               {...register(`splits.${index}.Amount`, {
//                                 required: "Required",
//                                 validate: (v) => (v !== "" && Number(v) > 0) || "Enter valid amount",
//                               })}
//                             />
//                           </div>

//                           {!isView && fields.length > 1 && (
//                             <button
//                               type="button"
//                               onClick={() => remove(index)}
//                               className="text-gray-500 hover:text-red-500 mb-2"
//                               style={{ background: "transparent", border: "none" }}
//                             >
//                               <Trash2 size={18} />
//                             </button>
//                           )}
//                         </div>

//                         {needsRef && (
//                           <input
//                             type="text"
                           
//                             placeholder={
//                               rowType === "Cheque"
//                                 ? "Reference Number"
//                                 : rowType === "Neft"
//                                   ? "Reference Number"
//                                   : "Reference Number"
//                             }
//                             {...register(`splits.${index}.Reference_Number`)}
//                           />
//                           // <input
//                           //   type="text"
//                           //   readOnly={isView}
//                           //   placeholder="Reference No."
//                           //   className="border rounded-md px-2 py-1.5 w-full"
//                           //   {...register(`splits.${index}.Reference_Number`)}
//                           // />
//                         )}

//                         {errors?.splits?.[index]?.Amount && (
//                           <p className="text-red-500 text-xs">{errors.splits[index].Amount.message}</p>
//                         )}
//                       </div>
//                     );
//                   })}
//                   <div className="flex flex-col flex-1 ">
//                     {!isView && (
//                       <button
//                         type="button"
//                         onClick={() =>
//                           append({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" })
//                         }
//                         className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
//                         style={{ background: "transparent", border: "none" }}
//                       >
//                         + Add Another Payment
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               )}
//               {!showSplitBox &&
//                 (paymentType === "Bank" ||
//                   paymentType === "Cheque" ||
//                   paymentType === "Neft") && (
//                   <div className="mt-3 flex flex-col">
//                     <label className="text-sm">
//                       {paymentType === "Cheque"
//                         ? "Reference Number"
//                         : paymentType === "Neft"
//                           ? "Reference Number"
//                           : "Reference Number"}
//                     </label>

//                     <input
//                       type="text"
//                       style={{  width: "80%" }}
//                       // className="w-full border rounded-md px-2 py-2"
//                       {...register("Reference_No")}
//                     />
//                   </div>
//                 )}
//             </div>

//             {/* Date */}
//             <div className="flex flex-col">
//               <span className="active">
//                 Date
//                 <span className="text-red-500">&nbsp;*</span>
//               </span>
//               <input
//                 type="date"
//                 readOnly={isView}
//                 className="w-full outline-none border-b-2 text-gray-900 py-1"
//                 {...register("Payment_Date", { required: "Date is required" })}
//               />
//               {errors?.Payment_Date && (
//                 <p className="text-red-500 text-xs mt-1">{errors.Payment_Date.message}</p>
//               )}
//             </div>

//             {/* Reference No. - required only for Cheque / Neft */}
//             {(paymentType === "Cheque" || paymentType === "Neft") && (
//               <div className="flex flex-col">
//                 <span className="active whitespace-nowrap">
//                   {paymentType === "Cheque" ? "Cheque Number" : "NEFT Reference Number"}
//                 </span>
//                 <input
//                   type="text"
//                   readOnly={isView}
//                   placeholder={`Enter ${paymentType} number`}
//                   className="w-full outline-none border-b-2 text-gray-900 py-1"
//                   {...register("Reference_No")}
//                 />
//               </div>
//             )}

//             {/* Received */}
//             <div className="flex flex-col">
//               <span className="active">
//                 Received
//                 <span className="text-red-500">&nbsp;*</span>
//               </span>
//               <input
//                 type="text"
//                 //step="0.01"
//                 readOnly={isView}
//                 className="w-full outline-none border-b-2 text-gray-900 py-1"
//                 {...register("Received", {
//                   required: "Received amount is required",
//                   validate: (v) =>
//                     (v !== "" && !isNaN(v) && Number(v) > 0) || "Enter a valid amount greater than 0",
//                 })}
//               />
//               {errors?.Received && (
//                 <p className="text-red-500 text-xs mt-1">{errors.Received.message}</p>
//               )}
//             </div>
//           </div>

//           {/* Footer — Save only, no Print */}
//           {!isView && (
//             <div className="flex justify-end mt-4 gap-4">
//               <button
//                 type="submit"
//                 disabled={isSaving}
//                 className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
//                 style={{ backgroundColor: "#4CA1AF" }}
//               >
//                 {isSaving ? "Saving..." : "Save"}
//               </button>
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
//               >
//                 Cancel
//               </button>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";

/**
 * PaymentInModal
 *
 * `splits` is the single source of truth for ALL payment data — even a
 * single, non-split payment is just `splits` with one entry:
 *   splits: [{ Payment_Type, Bank_Account_Id, Reference_Number, Amount }]
 *
 * There is no separate top-level Payment_Type / Bank_Account_Id /
 * Reference_No / Received field to keep in sync — "Received" is always
 * derived as the sum of splits[].Amount, both on screen and at submit time.
 *
 * This keeps the payload shape identical whether it's Payment-In, Payment-Out,
 * Sale, Purchase, or Expense — every module can share the same splits[] contract.
 *
 * NOTE: your backend currently validates top-level Party_Id / Payment_Date /
 * Payment_Type / Received on req.body. Since Payment_Type is no longer sent
 * at the top level, the backend needs to either read Payment_Type from
 * splits[0] (for the "not really split" case) or — better — validate off
 * splits[] directly and compute Received server-side as the sum. Received
 * IS still sent at the top level below (computed from splits) so that part
 * of the existing check keeps working without backend changes.
 */
export default function PaymentInModal({
  mode = "add",              // "add" | "edit" | "view"
  initialData = null,        // existing payment-in record for edit/view
  parties = [],               // array of { Party_Id, Party_Name, Phone_Number, GSTIN } (or { parties: [...] })
  onClose,
  onSave,
  banks,
  PartyAddModal,               // optional: pass your own <AddParty> component in as a prop
  isSaving = false,
}) {
  const isView = mode === "view";
  // Normalize parties prop - accepts either an array or { parties: [...] }
  const partyList = Array.isArray(parties) ? parties : parties?.parties || [];

  const formatDateForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Keeps amount inputs numeric-only (digits + a single decimal point)
  const sanitizeAmount = (value) => {
    let val = value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    return val;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      Party_Id: initialData?.Party_Id || "",
      Party_Name: initialData?.Party_Name || "",
      Receipt_No: initialData?.Receipt_No || "",
      Payment_Date: formatDateForInput(initialData?.Payment_Date) || "",
      splits: initialData?.splits?.length
        ? initialData.splits
        : [{ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" }],
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "splits" });
  const [open, setOpen] = useState(false);
  const [partySearch, setPartySearch] = useState(initialData?.Party_Name || "");
  const [showSplitBox, setShowSplitBox] = useState(
    isView ? (initialData?.splits?.length > 0) : (initialData?.splits?.length > 1)
  );

  // Single-payment mode watches splits.0 directly — it's the same data, not a copy
  const paymentType = watch("splits.0.Payment_Type");

  // ---- Payment-type option list used by every split row ----
  // repeatable: true  -> can be picked in more than one row (Cheque / Neft)
  // repeatable: false -> once picked in a row, disappears from every other row (Cash / a specific Bank)
  const buildPaymentTypeOptions = () => [
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

  // returns identifiers already used by OTHER rows (excludes the row we're rendering options for)
  const getUsedIdentifiers = (excludeIndex) => {
    const splitValues = watch("splits") || [];
    return splitValues
      .map((s, i) =>
        i === excludeIndex ? null : getRowIdentifier(s.Payment_Type, s.Bank_Account_Id)
      )
      .filter(Boolean);
  };

  // options available for a given row = all options minus (non-repeatable ones already used elsewhere)
  const getAvailableOptions = (excludeIndex) => {
    const used = getUsedIdentifiers(excludeIndex);
    return buildPaymentTypeOptions().filter(
      (opt) => opt.repeatable || !used.includes(opt.value)
    );
  };

  // splits.0 already holds whatever was picked in single mode — just add a blank row
  const handleAddPaymentType = () => {
    append({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" });
    setShowSplitBox(true);
  };

  const [showPartyModal, setShowPartyModal] = useState(false);
  const wrapperRef = useRef(null);

  // Close the party dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredParties = partyList.filter(
    (p) =>
      p?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase()) ||
      p?.Phone_Number?.includes(partySearch)
  );

  const selectParty = (party) => {
    setPartySearch(party.Party_Name);
    setValue("Party_Id", party.Party_Id, { shouldValidate: true });
    setValue("Party_Name", party.Party_Name, { shouldValidate: true });
    setOpen(false);
  };

  const handleAddPartyResult = (newParty) => {
    // newParty expected shape: { Party_Id, Party_Name } - adjust to whatever your AddParty modal returns
    if (newParty?.Party_Id) {
      selectParty(newParty);
    } else if (typeof newParty === "string") {
      // fallback if only a name string comes back
      setPartySearch(newParty);
      setValue("Party_Name", newParty, { shouldValidate: true });
    }
    setShowPartyModal(false);
  };

  // Live-computed total — always derived from splits, never stored separately
  const splitsWatch = watch("splits") || [];
  const computedReceived = splitsWatch.reduce(
    (sum, s) => sum + (parseFloat(s.Amount) || 0),
    0
  );

  const onSubmit = (data) => {
    if (isView) return;

    if (!data.Payment_Date) {
      // shouldn't happen since register has required, but safety net
      return;
    }

    const splits = data.splits || [];
    const total = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);

    if (total <= 0) {
      toast.error("Received amount must be greater than zero");
      return;
    }

    const payload = {
      Party_Id: data.Party_Id,
      Party_Name: data.Party_Name,
      Receipt_No: data.Receipt_No,
      Payment_Date: data.Payment_Date,
      Received: total,
      splits: splits.map((s) => ({
        Payment_Type: s.Payment_Type,
        Bank_Account_Id: s.Bank_Account_Id || null,
        Reference_Number: s.Reference_Number || null,
        Amount: Number(s.Amount) || 0,
      })),
    };

    onSave(payload);
  };

  return (
    <div
      style={{
        position: "fixed",
        marginTop: "4rem",
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
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6"
          style={{ marginBottom: "20px", paddingBottom: "10px" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">
            {mode === "add" ? "Payment-In" : mode === "edit" ? "Edit Payment-In" : "View Payment-In"}
          </h4>
          <button
            type="button"
            style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Fields — 2 column grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Party (searchable combobox) */}
            <div
              ref={wrapperRef}
              className="flex flex-col relative mt-2 gap-2 party-class"
              style={{ marginBottom: "0px", marginTop: "0px" }}
            >
              <span className="whitespace-nowrap active">
                Party
                <span className="text-red-500">&nbsp;*</span>
              </span>

              {/* Hidden field registered so RHF validates Party_Id */}
              <input
                type="hidden"
                {...register("Party_Id", { required: "Party is required" })}
              />

              <div className="relative w-full">
                <div
                  className="flex flex-row border rounded-md bg-white cursor-pointer"
                  onClick={() => !isView && setOpen((prev) => !prev)}
                >
                  <input
                    type="text"
                    id="Party_Name"
                    value={partySearch}
                    disabled={isView}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPartySearch(value);
                      // typing again invalidates any previously-selected party id
                      setValue("Party_Id", "", { shouldValidate: false });
                      setValue("Party_Name", value, { shouldValidate: false });
                      setOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isView) setOpen(true);
                    }}
                    placeholder="Search By Name/Phone"
                    className="w-full outline-none py-1 px-2 text-gray-900"
                    style={{
                      marginBottom: 0,
                      marginTop: "4px",
                      border: "none",
                      borderBottom: "none",
                      height: "2rem",
                    }}
                  />
                  <div className="w-10" />
                  {!isView && <span className="absolute right-0 px-2 top-1/3 text-gray-700">▼</span>}
                </div>

                {open && !isView && (
                  <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <span
                      onClick={() => setShowPartyModal(true)}
                      className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                    >
                      + Add Party
                    </span>

                    {filteredParties.map((party, i) => (
                      <div
                        key={party.Party_Id ?? i}
                        onClick={() => selectParty(party)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {party.Party_Name} {party.Phone_Number ? `(${party.Phone_Number})` : ""}
                      </div>
                    ))}

                    {filteredParties.length === 0 && (
                      <p className="px-3 py-2 text-gray-500">No Party found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Add Party Modal - only rendered if a component was passed in */}
              {showPartyModal && PartyAddModal && (
                <PartyAddModal
                  onClose={() => setShowPartyModal(false)}
                  onSave={handleAddPartyResult}
                />
              )}

              {errors?.Party_Id && (
                <p className="text-red-500 text-xs mt-1">{errors.Party_Id.message}</p>
              )}
            </div>

            {/* Receipt No */}
            <div className="flex flex-col">
              <span className="active">Receipt No</span>
              <input
                type="text"
                readOnly={isView}
                placeholder="Enter receipt no."
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                {...register("Receipt_No")}
              />
            </div>

            {/* Payment Type */}
            <div className="flex flex-col col-span-2">
              <span className="active">
                Payment Type
                <span className="text-red-500">&nbsp;*</span>
              </span>

              {!showSplitBox ? (
                <>
                  {/* Hidden field so RHF tracks/validates splits.0.Payment_Type even though
                      it's driven by setValue in the onChange below, not a native <select {...register}> */}
                  <input
                    type="hidden"
                    {...register("splits.0.Payment_Type", { required: "Payment Type is required" })}
                  />

                  <select
                    id="Payment_Type"
                    disabled={isView}
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

                  {(paymentType === "Bank" || paymentType === "Cheque" || paymentType === "Neft") && (
                    <div className="mt-3 flex flex-col">
                      <label className="text-sm">Reference Number</label>
                      <input
                        type="text"
                        readOnly={isView}
                        style={{ width: "80%", marginBottom: "0px" }}
                        {...register("splits.0.Reference_Number")}
                      />
                    </div>
                  )}

                  {!isView && (
                    <button
                      type="button"
                      onClick={handleAddPaymentType}
                      className="text-[#4CA1AF] text-sm font-medium hover:underline self-start mt-2"
                      style={{ background: "transparent", border: "none", padding: 0 }}
                    >
                      + Add Payment Type
                    </button>
                  )}
                </>
              ) : (
                <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-3 mt-2">
                  {fields.map((field, index) => {
                    const rowType = watch(`splits.${index}.Payment_Type`);
                    const needsRef =
                      rowType === "Cheque" ||
                      rowType === "Neft" ||
                      rowType === "Bank";
                    const rowOptions = getAvailableOptions(index);
                    const currentIdentifier = getRowIdentifier(
                      rowType,
                      watch(`splits.${index}.Bank_Account_Id`)
                    );
                    const amountField = register(`splits.${index}.Amount`, {
                      required: "Required",
                      validate: (v) => (v !== "" && Number(v) > 0) || "Enter valid amount",
                    });

                    return (
                      <div key={field.id} className="flex flex-col gap-2">
                        {/* Payment Type | Amount | Delete — all on one line, bottoms aligned */}
                        <div className="flex items-end gap-2">
                          <div className="flex flex-col flex-1">
                            <span className="text-xs text-gray-500 mb-1">Payment Type</span>
                            <select
                              disabled={isView}
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
                              readOnly={isView}
                              placeholder="Amount"
                              style={{ marginBottom: "0px", width: "80%" }}
                              className="border rounded-md px-2 py-1.5"
                              {...amountField}
                              onChange={(e) => {
                                e.target.value = sanitizeAmount(e.target.value);
                                amountField.onChange(e);
                              }}
                            />
                          </div>

                          {!isView && fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-gray-500 hover:text-red-500 mb-2"
                              style={{ background: "transparent", border: "none" }}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>

                        {needsRef && (
                          <input
                            type="text"
                            readOnly={isView}
                            placeholder="Reference Number"
                            // className="border rounded-md px-2 py-1.5 w-full"
                            {...register(`splits.${index}.Reference_Number`)}
                          />
                        )}

                        {errors?.splits?.[index]?.Amount && (
                          <p className="text-red-500 text-xs">{errors.splits[index].Amount.message}</p>
                        )}
                      </div>
                    );
                  })}

                  {!isView && (
                    <button
                      type="button"
                      onClick={() =>
                        append({ Payment_Type: "", Bank_Account_Id: null, Reference_Number: "", Amount: "" })
                      }
                      className="text-[#4CA1AF] text-sm font-medium hover:underline self-start"
                      style={{ background: "transparent", border: "none" }}
                    >
                      + Add Another Payment
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col">
              <span className="active">
                Date
                <span className="text-red-500">&nbsp;*</span>
              </span>
              <input
                type="date"
                readOnly={isView}
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                {...register("Payment_Date", { required: "Date is required" })}
              />
              {errors?.Payment_Date && (
                <p className="text-red-500 text-xs mt-1">{errors.Payment_Date.message}</p>
              )}
            </div>

            {/* Received — editable when there's one payment, auto-summed & read-only when split */}
            <div className="flex flex-col">
              <span className="active">
                Received
                <span className="text-red-500">&nbsp;*</span>
              </span>

              {!showSplitBox ? (
                <input
                  type="text"
                  inputMode="decimal"
                  readOnly={isView}
                  className="w-full outline-none border-b-2 text-gray-900 py-1"
                  {...register("splits.0.Amount", {
                    required: "Received amount is required",
                    validate: (v) =>
                      (v !== "" && !isNaN(v) && Number(v) > 0) || "Enter a valid amount greater than 0",
                    onChange: (e) => {
                      e.target.value = sanitizeAmount(e.target.value);
                    },
                  })}
                />
              ) : (
                <>
                  <input
                    type="text"
                    readOnly
                    className="w-full outline-none border-b-2 text-gray-900 py-1 bg-gray-100"
                    value={computedReceived > 0 ? computedReceived.toFixed(2) : ""}
                  />
                  {/* <span className="text-xs text-gray-500 mt-1">
                    Auto-calculated from split amounts
                  </span> */}
                </>
              )}

              {errors?.splits?.[0]?.Amount && !showSplitBox && (
                <p className="text-red-500 text-xs mt-1">{errors.splits[0].Amount.message}</p>
              )}
            </div>
          </div>

          {/* Footer — Save only, no Print */}
          {!isView && (
            <div className="flex justify-end mt-4 gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
                style={{ backgroundColor: "#4CA1AF" }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}