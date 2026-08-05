import { useState } from "react";
//import { useAddItemUnitMutation } from "../../redux/api/miscellaneousApi";
//import { toast } from "react-toastify";


// export default function AddUnitModal({onClose,onSave}) {
//        const[itemUnitName, setItemUnitName] = useState("");
//        const[itemUnitShortHand, setItemUnitShortHand] = useState("");

//         //    console.log(dailyExpense, editingDailyExpense,"editingDailyExpense");
               
//            const [addItemUnit, { isLoading:isAddingItemUnitLoading }]=useAddItemUnitMutation();
           
//            //const[editSingleDailyExpense, { isLoading }] = useEditSingleDailyExpenseMutation();
//        const handleSave = async () => {
//          if (isAddingItemUnitLoading) return; // 🔥 STOP DOUBLE CALL
//   try {
//     if (!itemUnitName) {
//       toast.error("Unit Name cannot be empty!");
//       return;
//     }

//     const payload = {
//       Unit_Name: itemUnitName,
//       Unit_Shorthand: itemUnitShortHand,
//     };

//     const res = await addItemUnit(payload).unwrap();

//     toast.success(res.message);

//     onClose();
//                    onSave({
//       Unit_Name: payload.Unit_Name,
//       Unit_Shorthand: payload.Unit_Shorthand
//     });

//   } catch (err) {
//     toast.error(err?.data?.message || "Adding Item Unit Failed!");
//   }
// };
//     //          const handleSave = async () => {
//     //        try {
//     //         const payload={
//     //           Unit_Name:itemUnitName,
//     //           Unit_Shorthand:itemUnitShortHand
//     //         }
//     //         console.log(payload);
//     //         if(!payload.Unit_Name){
//     //           toast.error("Unit Name cannot be empty!");
//     //           return;
//     //         }
//     //          const res = await addItemUnit(payload).unwrap();
//     //        console.log(" successfully:", res);
//     //         //  const resData = res?.data || res;
//     //           const resData = res;
//     //          console.log(resData);
//     //          if(!resData?.success) {
//     //            toast.error("Adding Item Unit Failed!");
//     //            return;
//     //          }else{
//     //            toast.success("Item Unit added Successfully!");
//     //              onClose();  // close modal
//     //                onSave({
//     //   Unit_Name: payload.Unit_Name,
//     //   Unit_Shorthand: payload.Unit_Shorthand
//     // });
//     //          }
           
//     //        } catch (err) {
//     //          toast.error(err?.data?.message || "Adding Item Unit Failed!");
//     //          console.error("Add Item Unit error:", err);
//     //        }
//     //      };
//   return (
//  <div
//   style={{
//     position: "fixed",
//     marginTop: "4rem",
//     inset: 0,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(0,0,0,0.3)", // dim background
//     backdropFilter: "blur(4px)", // blur effect
//     zIndex: 50,
//     padding: "1rem", // ensures spacing on small screens
//   }}
// >
//     <div
//       className="bg-white 
//       w-full
//        max-w-xl rounded-lg 
//       shadow-lg p-6 
//     overflow-hidden max-h-[90vh]
//       "
//     >
     
//        <div className="flex justify-between items-center mb-6"
//       style={{marginBottom:"20px",paddingBottom:"10px"}}>
//         <h4 className="text-xl font-semibold text-gray-900">
//             Add Unit
//           {/* {editingDailyExpense ? "Edit Daily Expense" : "View Daily Expense"} */}
//         </h4>
//         <button
//           type="button"
//           style={{ backgroundColor: "transparent" ,height:"30px",width:"30px",
//             fontSize:"20px"
//           }}
//           onClick={onClose}
//           className="text-gray-500 hover:text-gray-700 "
//         >
//           ✕
//         </button>
//       </div>

      
//     <div >
//       <div className="row flex flex-col gap-2">
  

// <div style={{width:"100%"}}
// className=" flex flex-col ">
//   <span className="active">
//     Item Name
//     <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//   </span>

//   <input
//   type="text"
//     // type={editingDailyExpense ? "date" : "text"}
//     id="Date"
//     value={itemUnitName}
//     // value={
//     //   editingDailyExpense
//     //     ? dailyExpense?.Date     // must be yyyy-mm-dd
//     //     : new Date(dailyExpense?.Date).toLocaleDateString("en-IN", {
//     //         day: "numeric",
//     //         month: "numeric",
//     //         year: "numeric",
//     //       })
//     // }
//     //readOnly={!editingDailyExpense}
//     // onChange={(e) =>
//     //   editingDailyExpense &&
//     //   setDailyExpense({ ...dailyExpense, Date: e.target.value })
//     // }
//     onChange={(e) => {
//         setItemUnitName(e.target.value);
//     }}
//     className="w-full outline-none border-b-2 text-gray-900"
//   />
// </div>


  
//                  <div style={{width:"100%"}}
//                   className="flex flex-col ">
//                       <span className="active">
//                         Short Hand
//                         <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                       </span>
                     
//                       <input
//   type="text"
//     // type={editingDailyExpense ? "date" : "text"}
//     id="Date"
//     value={itemUnitShortHand}
//     // value={
//     //   editingDailyExpense
//     //     ? dailyExpense?.Date     // must be yyyy-mm-dd
//     //     : new Date(dailyExpense?.Date).toLocaleDateString("en-IN", {
//     //         day: "numeric",
//     //         month: "numeric",
//     //         year: "numeric",
//     //       })
//     // }
//     //readOnly={!editingDailyExpense}
//     // onChange={(e) =>
//     //   editingDailyExpense &&
//     //   setDailyExpense({ ...dailyExpense, Date: e.target.value })
//     // }
//     onChange={(e) => {
//         setItemUnitShortHand(e.target.value);
//     }}
//     className="w-full outline-none border-b-2 text-gray-900"
//   />
//                     </div>


  
  
//                   </div>

//                     <div className="flex justify-end mt-4 gap-4">
//                        <button
//                       type="button"
//                   onClick={handleSave}
//       disabled={isAddingItemUnitLoading}
//                       className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
//                       style={{ backgroundColor: "#4CA1AF" }}
//                     >
//                            {isAddingItemUnitLoading ? "Saving..." : "Save"}
//                     </button>
//                          <button
//                       type="button"
//                   onClick={()=>onClose()}
   
//                            className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
                     
//                     >
//                         Cancel
//                            {/* {isAddingItemUnitLoading ? "Saving..." : "Save"} */}
//                     </button>
//                     {/* {editingDailyExpense===false && <button
//                       type="button"
                      
//                       className=" text-white font-bold py-2 px-4 rounded"
//                       style={{ backgroundColor: "#4CA1AF" }}
//                     >
//                       Print
//                     </button>} */}
//                   </div>
                  
 
//                   {/* Paid via*/}
    
//   </div>
  
  
  
                 
  
//                   {/* <div className="flex justify-end mt-4 gap-4">
//                       {editingDailyExpense && <button
//                       type="button"
//                   onClick={handleSave}
//       disabled={isLoading}
//                       className=" text-white font-bold py-2 px-4 rounded"
//                       style={{ backgroundColor: "#4CA1AF" }}
//                     >
//                            {isLoading ? "Saving..." : "Save"}
//                     </button>}
              
//                   </div> */}
//     </div>
//   </div>
// );
// }

import {  useEffect } from "react";

/**
 * SelectUnitModal
 *
 * Props:
 *   units        — array of { Unit_Shorthand, Unit_Name } from useGetAllItemUnitsQuery
 *   onClose      — () => void
 *   onSave       — ({ baseUnit, secondaryUnit, conversionRate }) => void
 *   initialBase  — pre-selected base unit shorthand (optional)
 */
export default function SelectUnitModal({ units = [], onClose, onSave, initialBase = "" }) {
  const [baseUnit, setBaseUnit]           = useState(initialBase || "");
  const [secondaryUnit, setSecondaryUnit] = useState("");
  const [selectedRate, setSelectedRate]   = useState(null); // index of selected radio
  const [customRate, setCustomRate]       = useState("0");

  // Suggested conversion rates between the two selected units
  // In a real app these would come from a lookup table.
  // Here we generate one standard suggestion if units differ, otherwise just custom.
  const suggestions = (() => {
    if (!baseUnit || !secondaryUnit || baseUnit === secondaryUnit) return [];

    // Well-known pairs — extend as needed
    const knownRates = {
      "Gm-Kg": 0.001,
      "Kg-Gm": 1000,
      "ml-l":  0.001,
      "l-ml":  1000,
      "cm-m":  0.01,
      "m-cm":  100,
    };
    const key = `${baseUnit}-${secondaryUnit}`;
    const rate = knownRates[key];
    return rate !== undefined ? [rate] : [];
  })();

  const baseLabel      = units.find((u) => u.Unit_Shorthand === baseUnit)?.Unit_Name      || baseUnit;
  const secondaryLabel = units.find((u) => u.Unit_Shorthand === secondaryUnit)?.Unit_Name || secondaryUnit;

  // When suggestions change, reset radio selection
  useEffect(() => {
    setSelectedRate(null);
    setCustomRate("0");
  }, [baseUnit, secondaryUnit]);

  const handleSave = () => {
    const rate =
      selectedRate !== null && suggestions[selectedRate] !== undefined
        ? suggestions[selectedRate]
        : parseFloat(customRate) || 0;

    onSave({
      baseUnit,
      secondaryUnit: secondaryUnit || null,
      conversionRate: secondaryUnit ? rate : null,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl"
        style={{ width: 480, maxWidth: "95vw", padding: "28px 28px 20px" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-gray-800" style={{ fontSize: 17, margin: 0 }}>
            Select Unit
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}
          >
            ✕
          </button>
        </div>

        {/* ── Unit selects ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Base Unit */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4CA1AF", letterSpacing: "0.06em" }}>
              BASE UNIT
            </span>
            <select
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              style={{
                border: "2px solid #4CA1AF",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 14,
                color: "#1f2937",
                outline: "none",
                backgroundColor: "white",
              }}
            >
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                  {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Unit */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4CA1AF", letterSpacing: "0.06em" }}>
              SECONDARY UNIT
            </span>
            <select
              value={secondaryUnit}
              onChange={(e) => setSecondaryUnit(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 14,
                color: "#1f2937",
                outline: "none",
                backgroundColor: "white",
              }}
            >
              <option value="">None</option>
              {units
                .filter((u) => u.Unit_Shorthand !== baseUnit)
                .map((u) => (
                  <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                    {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* ── Conversion Rates — only when secondary is selected ── */}
        {secondaryUnit && baseUnit && (
          <div className="mb-6">
            <p className="font-semibold text-gray-700 mb-3" style={{ fontSize: 14 }}>
              Conversion Rates
            </p>

            <div className="flex flex-col gap-3">
              {/* Suggested rates (e.g. 1 Gm = 0.001 Kg) */}
              {suggestions.map((rate, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setSelectedRate(i)}
                >
                  <div
                    style={{
                      width: 18, height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${selectedRate === i ? "#4CA1AF" : "#9ca3af"}`,
                      backgroundColor: selectedRate === i ? "#4CA1AF" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedRate === i && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>
                    1&nbsp;<strong style={{ color: "#1f2937" }}>{baseLabel.toUpperCase()}</strong>
                    &nbsp;=&nbsp;
                    <strong style={{ color: "#1f2937" }}>{rate}</strong>
                    &nbsp;{secondaryLabel.toUpperCase()}
                  </span>
                </label>
              ))}

              {/* Custom rate row */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setSelectedRate(null)}
              >
                <div
                  style={{
                    width: 18, height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${selectedRate === null ? "#4CA1AF" : "#9ca3af"}`,
                    backgroundColor: selectedRate === null ? "#4CA1AF" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selectedRate === null && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
                  )}
                </div>
                <span style={{ fontSize: 14, color: "#6b7280" }}>
                  1&nbsp;<strong style={{ color: "#1f2937" }}>{baseLabel.toUpperCase()}</strong>
                  &nbsp;=
                </span>
                <input
                  type="text"
                  value={customRate}
                  onClick={(e) => { e.stopPropagation(); setSelectedRate(null); }}
                  onChange={(e) => {
                    setSelectedRate(null);
                    setCustomRate(e.target.value.replace(/[^0-9.]/g, ""));
                  }}
                  className="w-1/2"
                  style={{
                    
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 14,
                    outline: "none",
                    marginBottom: 0,
                  }}
                />
                <span style={{ fontSize: 14, color: "#6b7280" }}>
                  {secondaryLabel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Divider + Footer ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!baseUnit}
            className="text-white font-semibold px-6 py-2 rounded-md"
            style={{
              backgroundColor: baseUnit ? "#4CA1AF" : "#9ca3af",
              border: "none",
              cursor: baseUnit ? "pointer" : "not-allowed",
              fontSize: 14,
            }}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
