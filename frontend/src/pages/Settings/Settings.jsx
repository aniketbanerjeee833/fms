






// export default function FinancialYear() {
//   // const [newallFinancialYearName, setNewallFinancialYearName] = useState("");
   
//   // const [editallFinancialYearId, setEditallFinancialYearId] = useState(null);
   
//   // const [allFinancialYearError, setallFinancialYearError] = useState("");
//   //const dispatch = useDispatch();

//   // const [addallFinancialYear, { isLoading: isAddingAddallFinancialYear }] = useAddallFinancialYearMutation();
//   // const [updateallFinancialYear] = useUpdateallFinancialYearMutation();
//   // const { data: allFinancialYear } = useGetSingleallFinancialYearQuery();

//    //const [addNewSaleallFinancialYear, { isLoading: isAddingAddNewSaleallFinancialYear }] = useAddNewSaleallFinancialYearMutation();
//   // const [updateNewSaleallFinancialYear] = useUpdateNewSaleallFinancialYearMutation();

//   const[startDate,setStartDate] = useState('');
//   const[endDate,setEndDate] = useState('');
//   const[financialYear,setFinancialYear] = useState('');
//   const [addFinancialYear, { isLoading: isAddingFinancialYear }]=useAddFinancialYearMutation();

//   const [updateCurrentFinancialYear] = useUpdateCurrentFinancialYearMutation();
// // Get start year
// const startYear = startDate ? new Date(startDate).getFullYear() : null;

// // End date must be next year onwards
// const endMinDate = startYear ? `${startYear + 1}-01-01` : "";

//   const { data: allFinancialYear } = useGetAllFinancialYearsQuery();
//   console.log(allFinancialYear);
// useEffect(() => {
//   if (startDate && endDate) {
//     const startYear = new Date(startDate).getFullYear();
//     const endYear = new Date(endDate).getFullYear();

//     // Auto-fill
//     setFinancialYear(`${startYear}-${endYear}`);
//   }
// }, [startDate, endDate]);

// //  const [activeTab, setActiveTab] = useState("Purchase Items allFinancialYear");
// const handleSubmit = async (e) => {
//   e.preventDefault();

//   if (!startDate || !endDate || !financialYear) {
//     toast.error("Start Date, End Date and Financial Year are required.");
//     return;
//   }

//   if (new Date(startDate) > new Date(endDate)) {
//     toast.error("Start Date cannot be greater than End Date");
//     return;
//   }

//   try {
//     const res = await addFinancialYear({
//       financialYear,
//       startDate,
//       endDate
//     }).unwrap();

//     console.log("Added Success:", res);
//     toast.success("Financial Year Added Successfully");
    
//     // Reset
//     setStartDate("");
//     setEndDate("");
//     setFinancialYear("");

//   } catch (err) {
//     console.error("Failed to add financial year:", err);
//     toast.error(err?.data?.message || "Error adding financial year");
//   }
// };

//   const handleSetCurrentFinancialYear = async (id,financialYear) => {
//     try {
//       await updateCurrentFinancialYear({ financialYearId: id }).unwrap();
//       toast.success(`Your Current Financial Year Updated to ${financialYear}`);
//       //refetch(); // refresh list
//     } catch (err) {
//       console.error(err);
//       toast.error(err?.data?.message || "Update failed");
//     }
//   };

//   return (
//     <>
   
//       {/* <div className="sb2-2-3">
//         <div className="row">
//           <div className="col-md-12">
//             <div className="box-inn-sp"> */}
      
//             <div className="flex flex-col bg-white"
//             style={{height: "90%" }}
//             >
//               <div className="inn-title">
//                 <h4 className="text-2xl font-bold mb-2">Financial Year</h4>
//                 <p className="text-gray-500 mb-6">
//                   Add or Select Financial Year
//                 </p>
//               </div>
//           <div className="flex gap-6 w-full mt-6 pb-3">
//                   <div className=" flex space-x-8 pl-4">
                                      
//                                     </div>
                                    
//                                     </div>
//               <div className="tab-inn">
//                 <form onSubmit={(e)=>handleSubmit(e)} 
//                 onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
//                   <div className="row flex flex-row gap-4">
//                     {/* allFinancialYear Name Field */}
                    
//                     {/* <div className="input-field col s6 ">
//                       <span className="active">
                      
//                         Start Date
//                         <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                       </span>
//                       <input
//                         type="date"
//                         id="Start_Date"
//                          onChange={(e) => setStartDate(e.target.value)}
//                          value={startDate}
                      
                        
//                         className="w-full outline-none border-b-2 text-gray-900"
//                       />
                     
//                     </div>
//                     <div className="input-field col s6 ">
//                       <span className="active">
                       
//                         End Date
//                         <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                       </span>
//                       <input
//                         type="date"
//                         id="End_Date"
//                          onChange={(e) => setEndDate(e.target.value)}
//                          value={endDate}
//                         min={startDate || ""}
                        
//                         className="w-full outline-none border-b-2 text-gray-900"
//                       />
                     
//                     </div> */}
//                     <div className="input-field col s6">
//   <span className="active">
//     Start Date <span className="text-red-500 font-bold text-lg">*</span>
//   </span>
//   <input
//     type="date"
//     value={startDate}
//     onChange={(e) => {
//       setStartDate(e.target.value);
//       setEndDate(""); // reset end date
//     }}
//     className="w-full outline-none border-b-2 text-gray-900"
//   />
// </div>

// <div className="input-field col s6">
//   <span className="active">
//     End Date <span className="text-red-500 font-bold text-lg">*</span>
//   </span>
//   <input
//     type="date"
//     value={endDate}
//     onChange={(e) => setEndDate(e.target.value)}
//     min={endMinDate}    // 👈 THE MAIN RULE
//     disabled={!startDate} 
//     className="w-full outline-none border-b-2 text-gray-900"
//   />
// </div>

//                     <div className="input-field col s6 ">
//                       <span >
//                         {/* {editallFinancialYearId ? "Edit allFinancialYear" : "allFinancialYear Name"} */}
//                         Financial Year
                        
//                       </span>
//                       <input
//                         type="text"
//                         id="Financial_Year"
//                        value={financialYear}
//                         className="w-full outline-none border-b-2 text-gray-900 mt-2"
//                         readOnly
//                       />
                    
//                     </div>
//                      <div
//                       className="input-field col s6 
//                      items-center flex justify-end 
//                       ">
//                         <button
//                           type="submit"
//                           style={{ backgroundColor: "#4CA1AF" }}
//                           className="waves-effect waves-light btn-large"
//                           // value="Save"
//                           //value="Save"
                          
//                         >
//                            {isAddingFinancialYear ? "Saving...":"Save"}
//                           </button>
//                       </div>
                  
//                   </div>
//                 </form>

//                 {/* Existing allFinancialYear */}
//                 {/* {allFinancialYear && allFinancialYear?.length > 0 &&
//                   allFinancialYear.map((allFinancialYear,index) => (
//                    <div className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]">
//                     <div
//                       key={index}
//                       className="flex items-center justify-between px-4 py-2 bg-[#f3f2fd] border-l-4 border-[#4CA1AF] border border-gray-300 rounded-md text-sm text-[#4CA1AF] font-medium"
//                     >
//                       <input 
//                        type="checkbox" className="mr-2" />
//                       <span>{allFinancialYear?.Financial_Year}</span>
//                     </div>
//                   </div> 
//                   )
                  
//                 )} */}
//                 {allFinancialYear?.length > 0 &&
//         allFinancialYear.map((fy, index) => (
//           <div
//             key={index}
//             className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]"
//           >
//             <div
//               className="flex items-center justify-between px-3 py-2 bg-[#f3f2fd] 
//               border-l-4 border-[#4CA1AF] border border-gray-300 
//               rounded-md text-sm text-[#4CA1AF] font-medium"
//             >
//               <input
//                 type="checkbox"
//                 className="mr-2 cursor-pointer"
//                 checked={fy.Current_Financial_Year === 1}
//                 onChange={() => handleSetCurrentFinancialYear(fy.id, fy.Financial_Year)}
//               />

//               <span>{fy.Financial_Year}</span>
//             </div>
//           </div>
//         ))}
    

//               </div>
               
//             </div>
          
//     </>
//   );
// }
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";

import { useAddFinancialYearMutation, useGetAllFinancialYearsQuery,
   useGetAllSettingsQuery,
   useUpdateCurrentFinancialYearMutation, 
   useUpdateSettingMutation} from "../../redux/api/Settings/settingsApi";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("financialYear"); // "financialYear" | "settings"

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [addFinancialYear, { isLoading: isAddingFinancialYear }] = useAddFinancialYearMutation();
  const [updateCurrentFinancialYear] = useUpdateCurrentFinancialYearMutation();

  const startYear = startDate ? new Date(startDate).getFullYear() : null;
  const endMinDate = startYear ? `${startYear + 1}-01-01` : "";

  const { data: allFinancialYear } = useGetAllFinancialYearsQuery();

  const { data: settingsData = [], isLoading: isLoadingSettings } = useGetAllSettingsQuery();
  const settings = settingsData?.settings || [];

  const [updateSetting, { isLoading: isUpdatingSetting }] = useUpdateSettingMutation();

  useEffect(() => {
    if (startDate && endDate) {
      const sYear = new Date(startDate).getFullYear();
      const eYear = new Date(endDate).getFullYear();
      setFinancialYear(`${sYear}-${eYear}`);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !financialYear) {
      toast.error("Start Date, End Date and Financial Year are required.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start Date cannot be greater than End Date");
      return;
    }

    try {
      await addFinancialYear({ financialYear, startDate, endDate }).unwrap();
      toast.success("Financial Year Added Successfully");
      setStartDate("");
      setEndDate("");
      setFinancialYear("");
    } catch (err) {
      console.error("Failed to add financial year:", err);
      toast.error(err?.data?.message || "Error adding financial year");
    }
  };

  const handleSetCurrentFinancialYear = async (id, fyName) => {
    try {
      await updateCurrentFinancialYear({ financialYearId: id }).unwrap();
      toast.success(`Your Current Financial Year Updated to ${fyName}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Update failed");
    }
  };

  const handleToggleSetting = async (setting_key, currentValue) => {
    const newValue = currentValue ? 0 : 1;

    try {
      await updateSetting({ setting_key, setting_value: newValue }).unwrap();
    } catch (err) {
      console.error("Failed to update setting:", err);
      toast.error(err?.data?.message || "Failed to update setting");
    }
  };

  return (
    <div className="flex bg-white" style={{ minHeight: "90vh" }}>

      {/* ══ LEFT NAV ══ */}
      <div
        className="flex flex-col"
        style={{
          width: 220,
          borderRight: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        <div className="inn-title" style={{ padding: "1rem" }}>
          <h4 className="text-lg font-bold">Preferences</h4>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection("financialYear")}
          className="text-left px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: activeSection === "financialYear" ? "#f0f9ff" : "transparent",
            borderLeft: activeSection === "financialYear" ? "3px solid #4CA1AF" : "3px solid transparent",
            color: activeSection === "financialYear" ? "#4CA1AF" : "#374151",
            border: "none",
            cursor: "pointer",
          }}
        >
          Financial Year
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("Items")}
          className="text-left px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: activeSection === "Items" ? "#f0f9ff" : "transparent",
            borderLeft: activeSection === "Items" ? "3px solid #4CA1AF" : "3px solid transparent",
            color: activeSection === "Items" ? "#4CA1AF" : "#374151",
            border: "none",
            cursor: "pointer",
          }}
        >
          Items
        </button>
      </div>

      {/* ══ RIGHT CONTENT ══ */}
      <div className="flex-1 p-6">

        {activeSection === "financialYear" && (
          <>
            <div className="inn-title">
              <h4 className="text-2xl font-bold mb-2">Financial Year</h4>
              <p className="text-gray-500 mb-6">Add or Select Financial Year</p>
            </div>

            <div className="tab-inn">
              <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              >
                <div className="row flex flex-row gap-4">
                  <div className="input-field col s6">
                    <span className="active">
                      Start Date <span className="text-red-500 font-bold text-lg">*</span>
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setEndDate("");
                      }}
                      className="w-full outline-none border-b-2 text-gray-900"
                    />
                  </div>

                  <div className="input-field col s6">
                    <span className="active">
                      End Date <span className="text-red-500 font-bold text-lg">*</span>
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={endMinDate}
                      disabled={!startDate}
                      className="w-full outline-none border-b-2 text-gray-900"
                    />
                  </div>

                  <div className="input-field col s6">
                    <span>Financial Year</span>
                    <input
                      type="text"
                      value={financialYear}
                      className="w-full outline-none border-b-2 text-gray-900 mt-2"
                      readOnly
                    />
                  </div>

                  <div className="input-field col s6 items-center flex justify-end">
                    <button
                      type="submit"
                      style={{ backgroundColor: "#4CA1AF" }}
                      className="waves-effect waves-light btn-large"
                    >
                      {isAddingFinancialYear ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>

              {allFinancialYear?.length > 0 &&
                allFinancialYear.map((fy, index) => (
                  <div
                    key={index}
                    className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]"
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-[#f3f2fd]
                      border-l-4 border-[#4CA1AF] border border-gray-300
                      rounded-md text-sm text-[#4CA1AF] font-medium"
                    >
                      <input
                        type="checkbox"
                        className="mr-2 cursor-pointer"
                        checked={fy.Current_Financial_Year === 1}
                        onChange={() => handleSetCurrentFinancialYear(fy.id, fy.Financial_Year)}
                      />
                      <span>{fy.Financial_Year}</span>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeSection === "Items" && (
          <>
            <div className="inn-title">
              <h4 className="text-2xl font-bold mb-2">Settings</h4>
              <p className="text-gray-500 mb-6">Turn features on or off based on your requirements</p>
            </div>

            {isLoadingSettings ? (
              <p className="text-gray-400 text-sm">Loading settings...</p>
            ) : (
              <div className="space-y-3 mt-2" style={{ maxWidth: 600 }}>
                {settings?.map((setting) => (
                  <div
                    key={setting.setting_key}
                    className="flex items-center justify-between px-4 py-3 rounded-md border"
                    style={{ borderColor: "#e2e8f0" }}
                  >
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
                      className={`item-toggle ${setting.setting_value ? "on" : ""}`}
                      onClick={() => {
                        if (isUpdatingSetting) return;
                        handleToggleSetting(setting.setting_key, setting.setting_value);
                      }}
                      style={{ opacity: isUpdatingSetting ? 0.6 : 1 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      <style>{`
        .item-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          background: #cbd5e1;
          border-radius: 999px;
          cursor: pointer;
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
    </div>
  );
}
