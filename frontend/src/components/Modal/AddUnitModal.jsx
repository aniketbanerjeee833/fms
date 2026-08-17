import { toast } from "react-toastify";
import { useAddItemUnitMutation } from "../../redux/api/miscellaneousApi";
import { useState } from "react";

export default function AddUnitModal({onClose,onSave}) {
       const[itemUnitName, setItemUnitName] = useState("");
       const[itemUnitShortHand, setItemUnitShortHand] = useState("");

        //    console.log(dailyExpense, editingDailyExpense,"editingDailyExpense");
               
           const [addItemUnit, { isLoading:isAddingItemUnitLoading }]=useAddItemUnitMutation();
           
           //const[editSingleDailyExpense, { isLoading }] = useEditSingleDailyExpenseMutation();
       const handleSave = async () => {
         if (isAddingItemUnitLoading) return; // 🔥 STOP DOUBLE CALL
  try {
    if (!itemUnitName) {
      toast.error("Unit Name cannot be empty!");
      return;
    }

    const payload = {
      Unit_Name: itemUnitName,
      Unit_Shorthand: itemUnitShortHand,
    };

    const res = await addItemUnit(payload).unwrap();

    toast.success(res.message);

    onClose();
                   onSave({
      Unit_Name: payload.Unit_Name,
      Unit_Shorthand: payload.Unit_Shorthand
    });

  } catch (err) {
    toast.error(err?.data?.message || "Adding Item Unit Failed!");
  }
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
    backgroundColor: "rgba(0,0,0,0.3)", // dim background
    backdropFilter: "blur(4px)", // blur effect
    zIndex: 50,
    padding: "1rem", // ensures spacing on small screens
  }}
>
    <div
      className="bg-white 
      w-full
       max-w-xl rounded-lg 
      shadow-lg p-6 
    overflow-hidden max-h-[90vh]
      "
    >
     
       <div className="flex justify-between items-center mb-6"
      style={{marginBottom:"20px",paddingBottom:"10px"}}>
        <h4 className="text-xl font-semibold text-gray-900">
            Add Unit
          {/* {editingDailyExpense ? "Edit Daily Expense" : "View Daily Expense"} */}
        </h4>
        <button
          type="button"
          style={{ backgroundColor: "transparent" ,height:"30px",width:"30px",
            fontSize:"20px"
          }}
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 "
        >
          ✕
        </button>
      </div>

      
    <div >
      <div className="row flex flex-col gap-2">
  

<div style={{width:"100%"}}
className=" flex flex-col ">
  <span className="active">
    Item Name
    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
  </span>

  <input
  type="text"
    // type={editingDailyExpense ? "date" : "text"}
    id="Date"
    value={itemUnitName}
    // value={
    //   editingDailyExpense
    //     ? dailyExpense?.Date     // must be yyyy-mm-dd
    //     : new Date(dailyExpense?.Date).toLocaleDateString("en-IN", {
    //         day: "numeric",
    //         month: "numeric",
    //         year: "numeric",
    //       })
    // }
    //readOnly={!editingDailyExpense}
    // onChange={(e) =>
    //   editingDailyExpense &&
    //   setDailyExpense({ ...dailyExpense, Date: e.target.value })
    // }
    onChange={(e) => {
        setItemUnitName(e.target.value);
    }}
    className="w-full outline-none border-b-2 text-gray-900"
  />
</div>


  
                 <div style={{width:"100%"}}
                  className="flex flex-col ">
                      <span className="active">
                        Short Hand
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                     
                      <input
  type="text"
    // type={editingDailyExpense ? "date" : "text"}
    id="Date"
    value={itemUnitShortHand}
    // value={
    //   editingDailyExpense
    //     ? dailyExpense?.Date     // must be yyyy-mm-dd
    //     : new Date(dailyExpense?.Date).toLocaleDateString("en-IN", {
    //         day: "numeric",
    //         month: "numeric",
    //         year: "numeric",
    //       })
    // }
    //readOnly={!editingDailyExpense}
    // onChange={(e) =>
    //   editingDailyExpense &&
    //   setDailyExpense({ ...dailyExpense, Date: e.target.value })
    // }
    onChange={(e) => {
        setItemUnitShortHand(e.target.value);
    }}
    className="w-full outline-none border-b-2 text-gray-900"
  />
                    </div>


  
  
                  </div>

                    <div className="flex justify-end mt-4 gap-4">
                       <button
                      type="button"
                  onClick={handleSave}
      disabled={isAddingItemUnitLoading}
                      className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
                      style={{ backgroundColor: "#4CA1AF" }}
                    >
                           {isAddingItemUnitLoading ? "Saving..." : "Save"}
                    </button>
                         <button
                      type="button"
                  onClick={()=>onClose()}
   
                           className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
                     
                    >
                        Cancel
                           {/* {isAddingItemUnitLoading ? "Saving..." : "Save"} */}
                    </button>
                    {/* {editingDailyExpense===false && <button
                      type="button"
                      
                      className=" text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "#4CA1AF" }}
                    >
                      Print
                    </button>} */}
                  </div>
                  
 
                  {/* Paid via*/}
    
  </div>
  
  
  
                 
  
    </div>
  </div>
);
}