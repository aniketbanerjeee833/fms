import { LayoutDashboard } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dailyExpenseSchema } from "../../schema/dailyExpenseSchema";
import { useAddDailyExpenseMutation } from "../../redux/api/dailyExpenseApi";
import { toast } from "react-toastify";

export default function AddDailyExpense() {
   const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dailyExpenseSchema)

  })

  const [addDailyExpense]=useAddDailyExpenseMutation()
  const navigate = useNavigate();
  const onSubmit = async(data) => {
    console.log("Form Data (from RHF):", data);
    try {
      const res = await addDailyExpense({
        body: data,
      }).unwrap();
      console.log(" successfully:", res);
      const resData = res?.data || res;
      if (!resData?.success) {
        toast.error("Failed to add new daily expense");
        return;
      } else {
        toast.success("New daily expense added successfully!");
        navigate("/daily-expense/all-expense");
      }
    } catch (error) {
      const errorMessage =
        error?.data?.message || error?.message || "Failed to add new lead";
      toast.error(errorMessage);
      // toast.error("Failed to add lead");
      console.error("Submission failed", error);
    }
  };


  const formValues = watch();
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);
   return (<>
  
  
      {/* <div className="sb2-2-2">
        <ul >
          <li >
            <NavLink style={{display:"flex" ,flexDirection:"row"}}
              to="/home"
  
            >
              <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
              
              Dashboard
            </NavLink>
          </li>
  
        </ul>
      </div> */}
      {/* <div className="sb2-2-3 ">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}
      
            <div className="flex flex-col bg-white ">
              <div className="inn-title">
                <h4 className="text-2xl font-bold mb-2">Add Daily Expense</h4>
                <p className="text-gray-500 mb-6">
                  Add daily Expense details
                </p>
              </div>
            
              <div className=" tab-inn">
  
  
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex gap-8">
  
  
                    <div className="input-field col s6 ">
                      <span className="active">
                        Date
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                      <input
                        type="date"
                        id="Date"
                        {...register("Date")}
                        
                        
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                      {errors?.Date && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors?.Date?.message}
                        </p>
                      )}
                    </div>
  
                 <div className="input-field col s6 ">
                      <span className="active">
                        Purpose
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                      <textarea
                        type="text"
                        style={{resize:"none"}}
                        id="Purpose"
                        // {...register("Purpose")}
                        {...register("Purpose")}
                        placeholder="Purpose"
                        
                        className="w-full outline-none border-b-1 py-2 px-1  text-gray-900">
                      </textarea>
                      {errors?.Purpose && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors?.Purpose?.message}
                        </p>
                      )}
                    </div>
                       <div className="input-field col s6 mt-3 ">
      <span className="active">
          Amount
          <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
      </span>
  
      <input
          type="text"
          id="Amount"
          // {...register("Item_HSN")}
           {...register("Amount")}
          placeholder=" Amount"
          className="w-full outline-none border-b-2 text-gray-900"
          
             onChange={(e) => {
  let val = e.target.value;

  // ✅ allow digits and one dot
  val = val.replace(/[^0-9.]/g, "");

  // ✅ if more than one dot, keep only the first
  const parts = val.split(".");
  if (parts.length > 2) {
    val = parts[0] + "." + parts.slice(1).join(""); // collapse extra dots
  }

  // ✅ limit to 2 decimal places
  if (val.includes(".")) {
    const [int, dec] = val.split(".");
    val = int + "." + dec.slice(0, 2);
  }

  e.target.value = val;

}}

      />
      
      {errors?.Amount && (
          <p className="text-red-500 text-xs mt-1">
              {errors?.Amount?.message}
          </p>
      )}
  </div>
  
                  </div>
                  
                  <div style={{paddingLeft:"0px",marginLeft:"0px"}}
                   className=" flex gap-8  ">
 
  
  <div className="input-field col s6 mb-4 mt-4">
                      <span className="active">Select Payment Mode</span>
                      <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      <select
                        id="Payment Mode"
  
                        // {...register("Item_Unit")}
                        {...register("Payment_Method")}
                        className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2"
                      >
                        
                          
                          <option value="Cash">Cash</option>
                          
                          <option value="Online">Online</option>
                         
       
                      </select>
  
                      {errors?.Payment_Method && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors?.Payment_Method?.message}
                        </p>
                      )}
                    </div>
    <div className="input-field col s6 mb-4 mt-4">
                               <span className="active">Paid Via</span>
                             <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                 
                     <input
          type="text"
          id="Paid_Via"
          // {...register("Item_HSN")}
           {...register("Paid_Via")}
          placeholder=" Paid_Via"
          className="w-full outline-none border-b-2 text-gray-900"

     
      />
  
                      {errors?.Paid_Via && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors?.Paid_Via?.message}
                        </p>
                      )}
                    </div>
  <div className="input-field col s6 mb-4 mt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={formValues.errorCount > 0}
                      className=" text-white font-bold py-2 px-4 rounded"
                      style={{ backgroundColor: "#4CA1AF" }}
                    >
                      Save
                    </button>
                  </div>
  </div>
                  {/* Paid via*/}
                  {/* <div className="row mt-4  w-1/2 ">
                      
  
  </div> */}
  
  
  
  
                 
  
                
                </form>
              </div>
     
  
            </div>
         
  
  
  
    </>
    );
}
