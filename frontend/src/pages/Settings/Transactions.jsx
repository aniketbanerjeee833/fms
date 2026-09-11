
import React, { useEffect, useState, useRef, memo } from "react";
import { toast } from "react-toastify";

import {
  useGetAllTransactionsSettingsQuery,
  useUpdateTransactionsSettingMutation,
  useGetTransactionPrefixesQuery,
  useAddTransactionPrefixMutation,
  useToggleTransactionPrefixMutation,
  useDeleteTransactionPrefixMutation,
} from "../../redux/api/Settings/transactionsSettingApi";

const TRANSACTION_PREFIX_TYPES = {
  sale: "Sale",
  //credit_note: "Credit Note",
  //debit_note: "Debit Note",
};

// =========================================================
// SETTING ROW
// =========================================================

function SettingRow({ setting, isUpdating, onToggle }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-md border border-slate-200 min-h-[64px] mt-2">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {setting.setting_label}
        </p>
        {setting.description && (
          <p className="text-xs text-gray-500 mt-0.5">
            {setting.description}
          </p>
        )}
      </div>

      <div
        className={`item-toggle ${
          Number(setting.setting_value) === 1 ? "on" : ""
        }`}
        onClick={() => {
          if (isUpdating) return;
          onToggle(setting.setting_key, setting.setting_value);
        }}
        style={{
          opacity: isUpdating ? 0.6 : 1,
          cursor: isUpdating ? "not-allowed" : "pointer",
        }}
      />
    </div>
  );
}

// =========================================================
// CUSTOM PREFIX DROPDOWN
// =========================================================

const CustomPrefixDropdown = memo(function CustomPrefixDropdown({
  prefixes,
  selectedPrefix,
  isChanging,
  onSelect,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = prefixes.find(
    (p) => String(p.id) === String(selectedPrefix)
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (id) => {
    if (isChanging) return;
    onSelect(id);
    setIsOpen(false);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="relative w-full mb-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => !isChanging && setIsOpen((prev) => !prev)}
        disabled={isChanging}
        className={`w-full h-[38px] flex items-center justify-between px-3 border border-slate-300 rounded text-sm text-gray-700 bg-white ${
          isChanging ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span>{selected ? selected.prefix_name : "None"}</span>
        <span
          className={`text-[20px] text-gray-500 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 max-h-[180px] overflow-y-auto bg-white border border-slate-300 rounded shadow-md">
          {prefixes.length === 0 ? (
            <div className="p-2.5 text-xs text-gray-400 text-center">
              No prefixes yet
            </div>
          ) : (
            prefixes.map((prefix) => {
              const isSelected =
                String(prefix.id) === String(selectedPrefix);

              return (
                <div
                  key={prefix.id}
                  onClick={() => handleItemClick(prefix.id)}
                  className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer ${
                    isSelected
                      ? "bg-[#e8f6f8] text-[#4CA1AF] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {prefix.prefix_name}
                    {isSelected && (
                      <span className="text-[11px] text-[#4CA1AF]">✓</span>
                    )}
                  </span>

                {prefix.prefix_name !== "None" && (
  <button
    type="button"
    style={{
      color: isSelected ? "#ef4444" : "red",
    }}
    onClick={(e) => handleDeleteClick(e, prefix.id)}
    title="Delete prefix"
    className="px-1.5 text-sm leading-none"
  >
    🗑
  </button>
)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

// =========================================================
// TRANSACTION PREFIX FIELD
// =========================================================

function TransactionPrefixField({
  transactionType,
  label,
  prefixes,
  onAdd,
  onToggle,
  onDelete,
}) {
  const activePrefix = prefixes.find(
    (prefix) => Number(prefix.is_active) === 1
  );

  const [selectedPrefix, setSelectedPrefix] = useState(
    activePrefix?.id ? String(activePrefix.id) : ""
  );

  const [newPrefix, setNewPrefix] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const active = prefixes.find(
      (prefix) => Number(prefix.is_active) === 1
    );
    setSelectedPrefix(active?.id ? String(active.id) : "");
  }, [prefixes]);

  const handleSelect = async (id) => {
    setSelectedPrefix(String(id));
    if (!id) return;

    try {
      setIsChanging(true);
      await onToggle(Number(id), 1);
    } catch {
      // Parent handles error
    } finally {
      setIsChanging(false);
    }
  };

  const handleAdd = async () => {
    const value = newPrefix.trim();

    if (!value) {
      toast.error("Please enter a prefix");
      return;
    }

    try {
      setIsAdding(true);
      await onAdd({
        transaction_type: transactionType,
        prefix_name: value,
      });
      setNewPrefix("");
    } catch {
      // Parent handles error
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isAdding) handleAdd();
    }
  };

  return (
    <div className="relative border border-slate-300 rounded-md px-2.5 pt-3.5 pb-2.5 bg-white">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      <CustomPrefixDropdown
        prefixes={prefixes}
        selectedPrefix={selectedPrefix}
        isChanging={isChanging}
        onSelect={handleSelect}
        onDelete={onDelete}
      />

      <div className="flex items-center gap-2 mt-1.5">
        <input
          type="text"
          value={newPrefix}
          onChange={(e) => setNewPrefix(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add prefix"
          disabled={isAdding}
          className="form-control flex-1 min-w-0 h-[34px] box-border"
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="text-white font-bold py-2 px-4 rounded bg-[#4CA1AF] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAdding ? "..." : "ADD"}
        </button>
      </div>
    </div>
  );
}

// =========================================================
// TRANSACTIONS
// =========================================================

export default function Transactions() {
  const {
    data: settingsData = [],
    isLoading: isLoadingSettings,
  } = useGetAllTransactionsSettingsQuery();

  const settings = settingsData?.settings || [];

  const [
    updateTransactionsSetting,
    { isLoading: isUpdatingSetting },
  ] = useUpdateTransactionsSettingMutation();

  const {
    data: prefixesData,
    isLoading: isLoadingPrefixes,
  } = useGetTransactionPrefixesQuery();

  const prefixes = prefixesData?.prefixes || [];

  const [addTransactionPrefix] = useAddTransactionPrefixMutation();
  const [toggleTransactionPrefix] = useToggleTransactionPrefixMutation();
  const [deleteTransactionPrefix] = useDeleteTransactionPrefixMutation();

  const handleToggleSetting = async (setting_key, currentValue) => {
    const newValue = Number(currentValue) === 1 ? 0 : 1;

    try {
      await updateTransactionsSetting({
        setting_key,
        setting_value: newValue,
      }).unwrap();

      toast.success("Setting applied successfully");
    } catch (err) {
      console.error("Failed to update Transactions setting:", err);
      toast.error(err?.data?.message || "Failed to update setting");
    }
  };

  const handleAddPrefix = async ({ transaction_type, prefix_name }) => {
    try {
      await addTransactionPrefix({ transaction_type, prefix_name }).unwrap();
      toast.success("Prefix added successfully");
    } catch (err) {
      console.error("Failed to add transaction prefix:", err);
      toast.error(err?.data?.message || "Failed to add prefix");
      throw err;
    }
  };

  const handleTogglePrefix = async (id, is_active) => {
    try {
      await toggleTransactionPrefix({ id, is_active }).unwrap();
      toast.success("Default prefix selected");
    } catch (err) {
      console.error("Failed to toggle transaction prefix:", err);
      toast.error(err?.data?.message || "Failed to select prefix");
      throw err;
    }
  };

  const handleDeletePrefix = async (id) => {
    try {
      await deleteTransactionPrefix(id).unwrap();
      toast.success("Prefix deleted successfully");
    } catch (err) {
      console.error("Failed to delete transaction prefix:", err);
      toast.error(err?.data?.message || "Failed to delete prefix");
    }
  };

  return (
    <>
      <div className="inn-title">
        <h4 className="text-2xl font-bold mb-2">Transactions Settings</h4>
        <p className="text-gray-500">
          Configure transaction-related features based on your requirements
        </p>
      </div>

      {isLoadingSettings ? (
        <p className="text-gray-400 text-sm">Loading settings...</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 mt-2">
          {settings.map((setting) => (
            <SettingRow
              key={setting.setting_key}
              setting={setting}
              isUpdating={isUpdatingSetting}
              onToggle={handleToggleSetting}
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="inn-title p-2.5">
          <h4 className="text-xl font-bold mb-2">Transaction Prefixes</h4>
          <p className="text-gray-500">
            Configure prefixes used for transaction numbers
          </p>
        </div>

        {isLoadingPrefixes ? (
          <p className="text-gray-400 text-sm">Loading prefixes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full mt-2">
            {Object.entries(TRANSACTION_PREFIX_TYPES).map(
              ([transactionType, transactionLabel]) => {
                const typePrefixes = prefixes.filter(
                  (prefix) => prefix.transaction_type === transactionType
                );

                return (
                  <TransactionPrefixField
                    key={transactionType}
                    transactionType={transactionType}
                    label={transactionLabel}
                    prefixes={typePrefixes}
                    onAdd={handleAddPrefix}
                    onToggle={handleTogglePrefix}
                    onDelete={handleDeletePrefix}
                  />
                );
              }
            )}
          </div>
        )}
      </div>

      <style>{`
        .item-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          background: #cbd5e1;
          border-radius: 999px;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .item-toggle.on {
          background: #4CA1AF;
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
    </>
  );
}
// import React, { useEffect, useState, useRef, memo } from "react";
// import { toast } from "react-toastify";

// import {
//   useGetAllTransactionsSettingsQuery,
//   useUpdateTransactionsSettingMutation,

//   // Transaction prefixes
//   useGetTransactionPrefixesQuery,
//   useAddTransactionPrefixMutation,
//   useToggleTransactionPrefixMutation,
//   useDeleteTransactionPrefixMutation,
// } from "../../redux/api/Settings/transactionsSettingApi";


// // =========================================================
// // TRANSACTION PREFIX TYPES
// // =========================================================

// const TRANSACTION_PREFIX_TYPES = {
//   sale: "Sale",
//   //credit_note: "Credit Note",
//   //debit_note: "Debit Note",
// };


// // =========================================================
// // SETTING ROW
// // =========================================================

// function SettingRow({ setting, isUpdating, onToggle }) {
//   return (
//     <div
//       className="flex items-center justify-between px-4 py-3 rounded-md border setting-row mt-2"
//       style={{ borderColor: "#e2e8f0" }}
//     >
//       <div>
//         <p className="text-sm font-semibold text-gray-900">
//           {setting.setting_label}
//         </p>

//         {setting.description && (
//           <p className="text-xs text-gray-500 mt-0.5">
//             {setting.description}
//           </p>
//         )}
//       </div>

//       <div
//         className={`item-toggle ${
//           Number(setting.setting_value) === 1 ? "on" : ""
//         }`}
//         onClick={() => {
//           if (isUpdating) return;
//           onToggle(setting.setting_key, setting.setting_value);
//         }}
//         style={{
//           opacity: isUpdating ? 0.6 : 1,
//           cursor: isUpdating ? "not-allowed" : "pointer",
//         }}
//       />
//     </div>
//   );
// }


// // =========================================================
// // CUSTOM PREFIX DROPDOWN
// // Inline replacement for native <select> — shows delete
// // button per item, highlights selected, closes on select
// // or outside click
// // =========================================================

// const CustomPrefixDropdown = memo(function CustomPrefixDropdown({
//   prefixes,
//   selectedPrefix,
//   isChanging,
//   onSelect,
//   onDelete,
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const containerRef = useRef(null);

//   const selected = prefixes.find(
//     (p) => String(p.id) === String(selectedPrefix)
//   );

//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (containerRef.current && !containerRef.current.contains(e.target)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleItemClick = (id) => {
//     if (isChanging) return;
//     onSelect(id);
//     setIsOpen(false);
//   };

//   const handleDeleteClick = (e, id) => {
//     e.stopPropagation();
//     onDelete(id);
//   };

//   return (
//     <div className="custom-prefix-dropdown" ref={containerRef}>
//       <button
//         type="button"
//         className="custom-prefix-dropdown-trigger"
//         style={{backgroundColor:"white"}}
//         onClick={() => !isChanging && setIsOpen((prev) => !prev)}
//         disabled={isChanging}
//       >
//         <span>{selected ? selected.prefix_name : "None"}</span>
//         <span className={`custom-prefix-caret ${isOpen ? "open" : ""}`}>
//           ▾
//         </span>
//       </button>

//       {isOpen && (
//         <div className="custom-prefix-dropdown-menu">
//           {prefixes.length === 0 ? (
//             <div className="custom-prefix-dropdown-empty">
//               No prefixes yet
//             </div>
//           ) : (
//             prefixes.map((prefix) => {
//               const isSelected =
//                 String(prefix.id) === String(selectedPrefix);

//               return (
//                 <div
//                   key={prefix.id}
//                   className={`custom-prefix-dropdown-item ${
//                     isSelected ? "selected" : ""
//                   }`}
//                   onClick={() => handleItemClick(prefix.id)}
//                 >
//                   <span className="custom-prefix-dropdown-item-name">
//                     {prefix.prefix_name}
//                     {isSelected && (
//                       <span className="custom-prefix-check">✓</span>
//                     )}
//                   </span>

//                   {prefix.prefix_name !== "None" && (
//                     <button
//                       type="button"
//                       className="custom-prefix-dropdown-delete"
//                       onClick={(e) => handleDeleteClick(e, prefix.id)}
//                       title="Delete prefix"
//                     >
//                       🗑
//                     </button>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       )}
//     </div>
//   );
// });


// // =========================================================
// // TRANSACTION PREFIX FIELD
// // =========================================================

// function TransactionPrefixField({
//   transactionType,
//   label,
//   prefixes,
//   onAdd,
//   onToggle,
//   onDelete,
// }) {
//   const activePrefix = prefixes.find(
//     (prefix) => Number(prefix.is_active) === 1
//   );

//   const [selectedPrefix, setSelectedPrefix] = useState(
//     activePrefix?.id ? String(activePrefix.id) : ""
//   );

//   const [newPrefix, setNewPrefix] = useState("");
//   const [isAdding, setIsAdding] = useState(false);
//   const [isChanging, setIsChanging] = useState(false);

//   // =======================================================
//   // KEEP SELECTED VALUE SYNCHRONIZED
//   // =======================================================

//   useEffect(() => {
//     const active = prefixes.find(
//       (prefix) => Number(prefix.is_active) === 1
//     );
//     setSelectedPrefix(active?.id ? String(active.id) : "");
//   }, [prefixes]);

//   // =======================================================
//   // SELECT PREFIX
//   // =======================================================

//   const handleSelect = async (id) => {
//     setSelectedPrefix(String(id));

//     if (!id) return;

//     try {
//       setIsChanging(true);
//       await onToggle(Number(id), 1);
//     } catch {
//       // Parent handles error
//     } finally {
//       setIsChanging(false);
//     }
//   };

//   // =======================================================
//   // ADD PREFIX
//   // =======================================================

//   const handleAdd = async () => {
//     const value = newPrefix.trim();

//     if (!value) {
//       toast.error("Please enter a prefix");
//       return;
//     }

//     try {
//       setIsAdding(true);

//       await onAdd({
//         transaction_type: transactionType,
//         prefix_name: value,
//       });

//       setNewPrefix("");
//     } catch {
//       // Parent handles error
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   // =======================================================
//   // ENTER KEY
//   // =======================================================

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       if (!isAdding) {
//         handleAdd();
//       }
//     }
//   };

//   return (
//     <div className="transaction-prefix-field">
//       {/* =================================================
//           LABEL
//       ================================================= */}
//       <label>{label}</label>

//       {/* =================================================
//           CUSTOM DROPDOWN (replaces native <select>)
//       ================================================= */}
//       <CustomPrefixDropdown
//         prefixes={prefixes}
//         selectedPrefix={selectedPrefix}
//         isChanging={isChanging}
//         onSelect={handleSelect}
//         onDelete={onDelete}
//       />

//       {/* =================================================
//           ADD PREFIX
//       ================================================= */}
//       <div className="transaction-prefix-add">
//         <input
//           type="text"
//           value={newPrefix}
//           onChange={(e) => setNewPrefix(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Add prefix"
//           className="form-control"
//           disabled={isAdding}
//         />

//         <button
//           type="button"
//           onClick={handleAdd}
//           className="text-white font-bold py-2 px-4 rounded"
//           style={{ backgroundColor: "#4CA1AF" }}
//           disabled={isAdding}
//         >
//           {isAdding ? "..." : "ADD"}
//         </button>
//       </div>
//     </div>
//   );
// }


// // =========================================================
// // TRANSACTIONS
// // =========================================================

// export default function Transactions() {

//   // =======================================================
//   // GET TRANSACTIONS SETTINGS
//   // =======================================================

//   const {
//     data: settingsData = [],
//     isLoading: isLoadingSettings,
//   } = useGetAllTransactionsSettingsQuery();

//   const settings = settingsData?.settings || [];

//   // =======================================================
//   // UPDATE SETTING
//   // =======================================================

//   const [
//     updateTransactionsSetting,
//     { isLoading: isUpdatingSetting },
//   ] = useUpdateTransactionsSettingMutation();

//   // =======================================================
//   // GET TRANSACTION PREFIXES
//   // =======================================================

//   const {
//     data: prefixesData,
//     isLoading: isLoadingPrefixes,
//   } = useGetTransactionPrefixesQuery();

//   const prefixes = prefixesData?.prefixes || [];

//   // =======================================================
//   // PREFIX MUTATIONS
//   // =======================================================

//   const [addTransactionPrefix] = useAddTransactionPrefixMutation();
//   const [toggleTransactionPrefix] = useToggleTransactionPrefixMutation();
//   const [deleteTransactionPrefix] = useDeleteTransactionPrefixMutation();

//   // =======================================================
//   // TOGGLE TRANSACTIONS SETTING
//   // =======================================================

//   const handleToggleSetting = async (setting_key, currentValue) => {
//     const newValue = Number(currentValue) === 1 ? 0 : 1;

//     try {
//       await updateTransactionsSetting({
//         setting_key,
//         setting_value: newValue,
//       }).unwrap();

//       toast.success("Setting applied successfully");
//     } catch (err) {
//       console.error("Failed to update Transactions setting:", err);
//       toast.error(err?.data?.message || "Failed to update setting");
//     }
//   };

//   // =======================================================
//   // ADD PREFIX
//   // =======================================================

//   const handleAddPrefix = async ({ transaction_type, prefix_name }) => {
//     try {
//       await addTransactionPrefix({
//         transaction_type,
//         prefix_name,
//       }).unwrap();

//       toast.success("Prefix added successfully");
//     } catch (err) {
//       console.error("Failed to add transaction prefix:", err);
//       toast.error(err?.data?.message || "Failed to add prefix");
//       throw err;
//     }
//   };

//   // =======================================================
//   // TOGGLE PREFIX
//   // =======================================================

//   const handleTogglePrefix = async (id, is_active) => {
//     try {
//       await toggleTransactionPrefix({ id, is_active }).unwrap();
//       toast.success("Default prefix selected");
//     } catch (err) {
//       console.error("Failed to toggle transaction prefix:", err);
//       toast.error(err?.data?.message || "Failed to select prefix");
//       throw err;
//     }
//   };

//   // =======================================================
//   // DELETE PREFIX
//   // =======================================================

//   const handleDeletePrefix = async (id) => {
//     try {
//       await deleteTransactionPrefix(id).unwrap();
//       toast.success("Prefix deleted successfully");
//     } catch (err) {
//       console.error("Failed to delete transaction prefix:", err);
//       toast.error(err?.data?.message || "Failed to delete prefix");
//     }
//   };

//   // =======================================================
//   // UI
//   // =======================================================

//   return (
//     <>
//       {/* ===================================================
//           TRANSACTIONS SETTINGS TITLE
//       =================================================== */}

//       <div className="inn-title">
//         <h4 className="text-2xl font-bold mb-2">
//           Transactions Settings
//         </h4>

//         <p className="text-gray-500">
//           Configure transaction-related features based on your requirements
//         </p>
//       </div>

//       {/* ===================================================
//           TRANSACTIONS SETTINGS
//       =================================================== */}

//       {isLoadingSettings ? (
//         <p className="text-gray-400 text-sm">Loading settings...</p>
//       ) : (
//         <div className="grid grid-cols-1 gap-x-6 mt-2">
//           {settings.map((setting) => (
//             <SettingRow
//               key={setting.setting_key}
//               setting={setting}
//               isUpdating={isUpdatingSetting}
//               onToggle={handleToggleSetting}
//             />
//           ))}
//         </div>
//       )}

//       {/* ===================================================
//           TRANSACTION PREFIXES
//       =================================================== */}

//       <div className="mt-4">
//         {/* <div className="inn-title">
//          */}
//           <div className="inn-title" style={{padding:"10px"}}> 
//           <h4 className="text-xl font-bold mb-2">
//             Transaction Prefixes
//           </h4>

//           <p className="text-gray-500">
//             Configure prefixes used for transaction numbers
//           </p>
//         </div>

//         {isLoadingPrefixes ? (
//           <p className="text-gray-400 text-sm">Loading prefixes...</p>
//         ) : (
//           <div className="transaction-prefix-grid mt-2">
//             {Object.entries(TRANSACTION_PREFIX_TYPES).map(
//               ([transactionType, transactionLabel]) => {
//                 const typePrefixes = prefixes.filter(
//                   (prefix) => prefix.transaction_type === transactionType
//                 );

//                 return (
//                   <TransactionPrefixField
//                     key={transactionType}
//                     transactionType={transactionType}
//                     label={transactionLabel}
//                     prefixes={typePrefixes}
//                     onAdd={handleAddPrefix}
//                     onToggle={handleTogglePrefix}
//                     onDelete={handleDeletePrefix}
//                   />
//                 );
//               }
//             )}
//           </div>
//         )}
//       </div>

//       {/* ===================================================
//           STYLES
//       =================================================== */}

//       <style>{`

//         /* ==================================================
//            SETTING ROW
//         ================================================== */

//         .setting-row {
//           min-height: 64px;
//           box-sizing: border-box;
//         }

//         /* ==================================================
//            TOGGLE
//         ================================================== */

//         .item-toggle {
//           position: relative;
//           width: 44px;
//           height: 24px;
//           background: #cbd5e1;
//           border-radius: 999px;
//           cursor: pointer;
//           transition: background 0.2s;
//           flex-shrink: 0;
//         }

//         .item-toggle.on {
//           background: #4CA1AF;
//         }

//         .item-toggle::after {
//           content: "";
//           position: absolute;
//           top: 3px;
//           left: 3px;
//           width: 18px;
//           height: 18px;
//           background: white;
//           border-radius: 50%;
//           transition: transform 0.2s;
//           box-shadow: 0 1px 3px rgba(0,0,0,.15);
//         }

//         .item-toggle.on::after {
//           transform: translateX(20px);
//         }

//         /* ==================================================
//            PREFIX GRID
//         ================================================== */

//         .transaction-prefix-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//           width: 100%;
//         }

//         /* ==================================================
//            PREFIX FIELD
//         ================================================== */

//         .transaction-prefix-field {
//           position: relative;
//           border: 1px solid #d1d5db;
//           border-radius: 6px;
//           padding: 14px 10px 10px;
//           background: #fff;
//           box-sizing: border-box;
//         }

//         /* ==================================================
//            CUSTOM DROPDOWN
//         ================================================== */

//         .custom-prefix-dropdown {
//           position: relative;
//           width: 100%;
//           margin-bottom: 8px;
//         }

//         .custom-prefix-dropdown-trigger {
//           width: 100%;
//           height: 38px;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0 10px;
//           border: 1px solid #d1d5db;
//           border-radius: 4px;
          
//           cursor: pointer;
//           font-size: 13px;
//           color: #374151;
//           box-sizing: border-box;
//         }

//         .custom-prefix-dropdown-trigger:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         .custom-prefix-caret {
//           font-size: 10px;
//           color: #6b7280;
//           transition: transform 0.15s;
//         }

//         .custom-prefix-caret.open {
//           transform: rotate(180deg);
//         }

//         .custom-prefix-dropdown-menu {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           z-index: 20;
//           max-height: 180px;
//           overflow-y: auto;
//           background: #fff;
//           border: 1px solid #d1d5db;
//           border-radius: 4px;
//           box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
//         }

//         .custom-prefix-dropdown-empty {
//           padding: 10px;
//           font-size: 12px;
//           color: #9ca3af;
//           text-align: center;
//         }

//         .custom-prefix-dropdown-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 8px 10px;
//           font-size: 13px;
//           color: #374151;
//           cursor: pointer;
//           box-sizing: border-box;
//         }

//         .custom-prefix-dropdown-item:hover {
//           background: #f9fafb;
//         }

//         .custom-prefix-dropdown-item.selected {
//           background: #e8f6f8;
//           color: #4CA1AF;
//           font-weight: 600;
//         }

//         .custom-prefix-dropdown-item-name {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }

//         .custom-prefix-check {
//           font-size: 11px;
//           color: #4CA1AF;
//         }

//         .custom-prefix-dropdown-delete {
//           border: none;
//           background: transparent;
//           color: #dc2626;
//           cursor: pointer;
//           padding: 2px 6px;
//           font-size: 14px;
//           line-height: 1;
//           flex-shrink: 0;
//         }

//         .custom-prefix-dropdown-delete:hover {
//           color: #dc2626;
//         }

//         /* ==================================================
//            ADD AREA
//         ================================================== */

//         .transaction-prefix-add {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           margin-top: 6px;
//         }

//         .transaction-prefix-add input {
//           flex: 1;
//           min-width: 0;
//           height: 34px;
//           margin-bottom: 0;
//           box-sizing: border-box;
//         }

//         /* ==================================================
//            MOBILE
//         ================================================== */

//         @media (max-width: 768px) {
//           .transaction-prefix-grid {
//             grid-template-columns: 1fr;
//           }
//         }

//       `}</style>
//     </>
//   );
// }
