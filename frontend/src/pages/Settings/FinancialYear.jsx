


import { NavLink } from "react-router-dom";


import { LayoutDashboard } from "lucide-react";
import { useAddFinancialYearMutation, useGetAllFinancialYearsQuery,
   useUpdateCurrentFinancialYearMutation } from "../../redux/api/settingsApi";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";


export default function FinancialYear() {
  // const [newallFinancialYearName, setNewallFinancialYearName] = useState("");
   
  // const [editallFinancialYearId, setEditallFinancialYearId] = useState(null);
   
  // const [allFinancialYearError, setallFinancialYearError] = useState("");
  //const dispatch = useDispatch();

  // const [addallFinancialYear, { isLoading: isAddingAddallFinancialYear }] = useAddallFinancialYearMutation();
  // const [updateallFinancialYear] = useUpdateallFinancialYearMutation();
  // const { data: allFinancialYear } = useGetSingleallFinancialYearQuery();

   //const [addNewSaleallFinancialYear, { isLoading: isAddingAddNewSaleallFinancialYear }] = useAddNewSaleallFinancialYearMutation();
  // const [updateNewSaleallFinancialYear] = useUpdateNewSaleallFinancialYearMutation();

  const[startDate,setStartDate] = useState('');
  const[endDate,setEndDate] = useState('');
  const[financialYear,setFinancialYear] = useState('');
  const [addFinancialYear, { isLoading: isAddingFinancialYear }]=useAddFinancialYearMutation();

  const [updateCurrentFinancialYear] = useUpdateCurrentFinancialYearMutation();
// Get start year
const startYear = startDate ? new Date(startDate).getFullYear() : null;

// End date must be next year onwards
const endMinDate = startYear ? `${startYear + 1}-01-01` : "";

  const { data: allFinancialYear } = useGetAllFinancialYearsQuery();
  console.log(allFinancialYear);
useEffect(() => {
  if (startDate && endDate) {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();

    // Auto-fill
    setFinancialYear(`${startYear}-${endYear}`);
  }
}, [startDate, endDate]);

//  const [activeTab, setActiveTab] = useState("Purchase Items allFinancialYear");
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
    const res = await addFinancialYear({
      financialYear,
      startDate,
      endDate
    }).unwrap();

    console.log("Added Success:", res);
    toast.success("Financial Year Added Successfully");
    
    // Reset
    setStartDate("");
    setEndDate("");
    setFinancialYear("");

  } catch (err) {
    console.error("Failed to add financial year:", err);
    toast.error(err?.data?.message || "Error adding financial year");
  }
};

  const handleSetCurrentFinancialYear = async (id,financialYear) => {
    try {
      await updateCurrentFinancialYear({ financialYearId: id }).unwrap();
      toast.success(`Your Current Financial Year Updated to ${financialYear}`);
      //refetch(); // refresh list
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Update failed");
    }
  };

  return (
    <>
      <div className="sb2-2-2">
        <ul>
          <li>
            {/* <NavLink to={"/home"}>
              <i className="fa fa-home" aria-hidden="true"></i> Dashboard
            </NavLink> */}
                 <NavLink style={{display:"flex",flexDirection:"row"}}
                                                    to="/home"
                                        
                                                  >
                                                    <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                                                    {/* <i className="fa fa-home mr-2" aria-hidden="true"></i> */}
                                                    Dashboard
                                                  </NavLink>
          </li>
        </ul>
      </div>
      {/* <div className="sb2-2-3">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}
      
            <div className="flex flex-col bg-white ">
              <div className="inn-title">
                <h4 className="text-2xl font-bold mb-2">Financial Year</h4>
                <p className="text-gray-500 mb-6">
                  Add or Select Financial Year
                </p>
              </div>
          <div className="flex gap-6 w-full mt-6 pb-3">
                  <div className=" flex space-x-8 pl-4">
                                      
                                    </div>
                                    
                                    </div>
              <div className="tab-inn">
                <form onSubmit={(e)=>handleSubmit(e)} 
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                  <div className="row flex flex-row gap-4">
                    {/* allFinancialYear Name Field */}
                    
                    {/* <div className="input-field col s6 ">
                      <span className="active">
                      
                        Start Date
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                      <input
                        type="date"
                        id="Start_Date"
                         onChange={(e) => setStartDate(e.target.value)}
                         value={startDate}
                      
                        
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                     
                    </div>
                    <div className="input-field col s6 ">
                      <span className="active">
                       
                        End Date
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                      <input
                        type="date"
                        id="End_Date"
                         onChange={(e) => setEndDate(e.target.value)}
                         value={endDate}
                        min={startDate || ""}
                        
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                     
                    </div> */}
                    <div className="input-field col s6">
  <span className="active">
    Start Date <span className="text-red-500 font-bold text-lg">*</span>
  </span>
  <input
    type="date"
    value={startDate}
    onChange={(e) => {
      setStartDate(e.target.value);
      setEndDate(""); // reset end date
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
    min={endMinDate}    // 👈 THE MAIN RULE
    disabled={!startDate} 
    className="w-full outline-none border-b-2 text-gray-900"
  />
</div>

                    <div className="input-field col s6 ">
                      <span >
                        {/* {editallFinancialYearId ? "Edit allFinancialYear" : "allFinancialYear Name"} */}
                        Financial Year
                        
                      </span>
                      <input
                        type="text"
                        id="Financial_Year"
                       value={financialYear}
                        className="w-full outline-none border-b-2 text-gray-900 mt-2"
                        readOnly
                      />
                    
                    </div>
                     <div
                      className="input-field col s6 
                     items-center flex justify-end 
                      ">
                        <button
                          type="submit"
                          style={{ backgroundColor: "#4CA1AF" }}
                          className="waves-effect waves-light btn-large"
                          // value="Save"
                          //value="Save"
                          
                        >
                           {isAddingFinancialYear ? "Saving...":"Save"}
                          </button>
                      </div>
                  
                  </div>
                </form>

                {/* Existing allFinancialYear */}
                {/* {allFinancialYear && allFinancialYear?.length > 0 &&
                  allFinancialYear.map((allFinancialYear,index) => (
                   <div className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]">
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-[#f3f2fd] border-l-4 border-[#4CA1AF] border border-gray-300 rounded-md text-sm text-[#4CA1AF] font-medium"
                    >
                      <input 
                       type="checkbox" className="mr-2" />
                      <span>{allFinancialYear?.Financial_Year}</span>
                    </div>
                  </div> 
                  )
                  
                )} */}
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
               
            </div>
          
    </>
  );
}
