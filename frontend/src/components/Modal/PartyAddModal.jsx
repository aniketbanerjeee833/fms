import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { partyApi, useAddPartyMutation, useEditPartyMutation } from "../../redux/api/partyAPi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { partyFormSchema } from "../../schema/partyFormSchema";
import { useEffect } from "react";

export default function PartyAddModal({ onClose,onSave,partyDetails,editingParty }) {
        // const navigate = useNavigate();

const states = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];
 const dispatch = useDispatch();
 const dropdownRef = useRef(null);
        const [activeTab, setActiveTab] = useState("GST & Address");
       const[shippingAdress, setShippingAddress] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);
 const [open, setOpen] = useState(false);
     const [search, setSearch] = useState("");
     const[selected, setSelected] = useState(null);
        const[addParty, { isLoading }] = useAddPartyMutation();
        const[updateParty, { isLoading: isUpdating }] = useEditPartyMutation();
      
        console.log("partyDetails",partyDetails);
        console.log("editingParty",editingParty);

        const {
            register,
            
          reset,
            watch,
                 setValue,
            formState: { errors },
        } = useForm({
            resolver: zodResolver(partyFormSchema),
            defaultValues: {
                Party_Name: "",
                Phone_Number: "",
                GSTIN: "",
                Email_Id: "",
                Shipping_Address: "",
                Billing_Address: "",
                State: "",
            },
    
        })
        const formValues = watch();
        console.log("Current form values:", formValues);
        console.log("Form errors:", errors);
    
        useEffect(() => {
        const handleClickOutside = (e) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);
      const handleSelect = (state) => {
    setSelected(state);
    setValue("State", state); // update react-hook-form
    setOpen(false);
  };
       useEffect(() => {
  if (!editingParty) return;     // Not in edit mode → do nothing
  if (!partyDetails) return;     // No data yet → do nothing
  if (Object.keys(partyDetails).length === 0) return; // empty object
if(partyDetails.State) setSearch(partyDetails.State??"");
  reset({
    Party_Name: partyDetails.Party_Name ?? "",
    Phone_Number: partyDetails.Phone_Number ?? "",
    GSTIN: partyDetails.GSTIN ?? "",
    Email_Id: partyDetails.Email_Id ?? "",
    Shipping_Address: partyDetails.Shipping_Address ?? "",
    Billing_Address: partyDetails.Billing_Address ?? "",
    State: partyDetails.State ?? "",
  });

}, [editingParty, partyDetails, reset]);

    
        const handleSubmit = async () => {
            console.log("Form Data (from RHF):", formValues);
            if(formValues.Party_Name === ""){
                toast.error("Party Name is required");
                return;
            }
            try {
                const res = await addParty({
                    body: formValues,
                }).unwrap();
    
                console.log(" successfully:", res);
                const resData=  res;
                if(!resData?.success){
                    toast.error("Failed to add new party ");
                    return;
                }else{
                    toast.success("New Party added successfully!");
                   
                    
                     onSave(resData?.Party_Name);
                     dispatch(partyApi.util.invalidateTags(["Party"]));
               
                }
               
                
               
            
               
            } catch (error) {
                const errorMessage =
                    error?.data?.message ?? error?.message ?? "Failed to add new party";
          
                toast.error(errorMessage);
                // toast.error("Failed to add lead");
                console.error("Submission failed", error);
            }
    
        }
const handleEdit = async () => {
  console.log("EDIT Party Data:", formValues);

  try {
    const res = await updateParty({
      Party_Id: partyDetails.Party_Id,   // ID required for update
      body: formValues,
    }).unwrap();

    if (!res?.success) {
      toast.error("Failed to update party");
      return;
    }

    toast.success("Party updated successfully!");

    onClose();
    dispatch(partyApi.util.invalidateTags(["Party"]));

  } catch (error) {
    toast.error(error?.data?.message ?? "Failed to update party");
    console.error(error);
  }
};

  return (
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6"
      style={{marginBottom:"20px",paddingBottom:"10px"}}>
        <h4 className="text-xl font-semibold text-gray-900">
          {editingParty ? "Edit Party" : "Add New Party"}
        </h4>
        <button
          type="button"
          style={{ backgroundColor: "transparent" }}
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Form Content */}
      <div>
        <div className="grid grid-cols-3 gap-6">
          {/* Party Name */}
          <div className="flex flex-col mt-0 relative">
            <label
      htmlFor="Party_Name"
      className="active"
    >
              Party Name
              <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
            </label>
            <input
              type="text"
              id="Party_Name"
              {...register("Party_Name")}
              style={{marginLeft:"10px"}}
              placeholder="Party Name"
              className="w-full outline-none border-b-2 text-gray-900"
            />
            {errors?.Party_Name && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.Party_Name?.message}
              </p>
            )}
          </div>

          {/* GSTIN */}
          <div className="flex flex-col mt-2 relative">
                   <label
      htmlFor="GSTIN"
      className="active"
    
    > GSTIN</label>
            <input
              type="text"
              id="GSTIN"
               style={{marginLeft:"10px"}}
                  maxLength={15}
              {...register("GSTIN")}
                onChange={(e) => {
                                                // Only allow uppercase letters and digits
                                                const filtered = e.target.value
                                                    .toUpperCase()
                                                    .replace(/[^A-Z0-9]/g, "");
                                                e.target.value = filtered;
                                            }}
              placeholder="GSTIN"
              className="w-full outline-none border-b-2 text-gray-900"
            />
            {errors?.GSTIN && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.GSTIN?.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col mt-2 relative" >
                <label
      htmlFor="Phone_Number"
      className="active"
    
    >Phone Number</label>
            <input
              type="text"
              id="Phone_Number"
               style={{marginLeft:"10px"}}
              {...register("Phone_Number")}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
              }}
              placeholder="Phone Number"
              className="w-full outline-none border-b-2 text-gray-900 "
            />
            {errors?.Phone_Number && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.Phone_Number?.message}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-300 flex space-x-8">
            {["GST & Address"].map((tab) => (
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
                  borderBottom: activeTab === tab ? "1px solid red" : "none",
                  color: activeTab === tab ? "red" : "gray",
                  fontWeight: activeTab === tab ? "600" : "500",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          
          <div className="bg-gray-100 p-4 sm:p-6 mt-4 rounded-lg">
  {activeTab === "GST & Address" && (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6 mt-2">
          {/* State */}
          {/* <div className="flex flex-col">
            <label
              htmlFor="State"
              className="mb-2 text-sm font-semibold text-gray-700"
            >
              State
            </label>
            <select
              id="State"
              {...register("State")}
              className=" border border-gray-300 rounded-md px-3 py-2 
              bg-white text-gray-900  outline-none transition-all"
            >
              <option value="">Select State</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
            {errors?.State && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.State?.message}
              </p>
            )}
          </div> */}
           <div 
                                                        
  className=" relative "
  ref={dropdownRef} >


    
                                                            <span className="active">
                                                                State

                                                            </span>

    

  <span className="text-red-500 font-bold text-lg">&nbsp;*</span>

  {/* Search + Dropdown Trigger */}
  <input
    type="text"
    value={search}
    onClick={() => setOpen((prev) => !prev)}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search state"
     className="w-full outline-none border-b-2 text-gray-900 "
  />

  {/* Dropdown List */}
  {open && (
    <div className="absolute z-20 flex flex-col
      w-full bg-white border border-gray-300 
     rounded-md shadow-lg max-h-48 overflow-y-auto">
      

      {/* Category List */}
      {states
        ?.filter((state) =>
          state.toLowerCase().includes(search.toLowerCase())
        )
        .map((state, i) => (
          <div
            key={i}
            onClick={() => {
              handleSelect(state);
              setSearch(state);
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {state}
            {/* {cat.Item_Category} */}
          </div>
        ))}

      {/* No match case */}
      {states?.filter((state) =>
        state.toLowerCase().includes(search.toLowerCase())
      ).length === 0 && (
        <p className="px-3 py-2 text-gray-500">No categories found</p>
      )}
    </div>
  )}

  {/* Hidden input for react-hook-form */}
  {/* <input type="hidden" {...register("Item_Category")} value={selected ?? ""} /> */}

  {/* Modal */}

{/* </div> */}
                                                            {/* <select
                                                                id=" State"
                                                                {...register("State")}
                                                                className="w-full outline-none border-b-2 text-gray-900 bg-white"
                                                            >
                                                                <option value="">Select State</option>
                                                                <option value="West Bengal"> West Bengal </option>

                                                                <option value="Maharashtra"> Maharashtra </option>

                                                            </select> */}
                                                            {errors?.State && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {errors?.State?.message}
                                                                </p>
                                                            )}
                                                        </div>

          {/* Email */}
          <div className="flex flex-col ">
            <label
              htmlFor="Email_Id"
              className="mb-2 text-sm font-semibold text-gray-700"
            >
              Email ID
            </label>
            {/* <input
              type="email"
              id="Email_Id"
              {...register("Email_Id")}
              placeholder="example@email.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-[#4CA1AF] outline-none transition-all"
            /> */}
               <input
                     
                        type="email"
                        id="Email_Id"
                        {...register("Email_Id")}
                        placeholder="example@email.com"
                        className=" outline-none border-b-2  text-gray-900 bg-white"
                      />
            {errors?.Email_Id && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.Email_Id?.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2 mt-2">
          {/* Billing Address */}
          <div className="flex flex-col">
            <label
              htmlFor="Billing_Address"
              className="mb-2 text-sm font-semibold text-gray-700"
            >
              Billing Address
            </label>
            <textarea
            style={{resize:"none"}}
              id="Billing_Address"
              {...register("Billing_Address")}
              className="w-full border border-gray-300 resize-none
              rounded-md px-3 py-2 bg-white text-gray-900 h-32 sm:h-40 resize-none  outline-none"
              placeholder="Enter Billing Address"
            ></textarea>
            {errors?.Billing_Address && (
              <p className="text-red-500 text-xs mt-1">
                {errors?.Billing_Address?.message}
              </p>
            )}
          </div>

          {/* Shipping Address Toggle */}
          <p
            className="text-[#4CA1AF] cursor-pointer font-medium hover:underline mt-2"
            onClick={() => setShippingAddress(!shippingAdress)}
          >
            {shippingAdress
              ? "Hide Shipping Address"
              : "Add Shipping Address"}
          </p>

          {shippingAdress && (
            <div className="flex flex-col">
              <label
                htmlFor="Shipping_Address"
                className="mb-2 text-sm font-semibold text-gray-700"
              >
                Shipping Address
              </label>
                 <textarea
                           
                          id="Shipping_Address"
                          {...register("Shipping_Address")}
                          className="w-full outline-none text-gray-900 bg-white border border-gray-300 rounded-md p-2 h-40 resize-none"
                          placeholder="Enter Shipping Address"
                        ></textarea>
              {errors?.Shipping_Address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors?.Shipping_Address?.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
        <button
          type="button"
          onClick={() => onClose()}
          className="text-white
           font-semibold py-2 px-4
            rounded-md w-full sm:w-auto"
          style={{ backgroundColor: "#4CA1AF" }}
        >
          Cancel
        </button>
        <button
  type="button"
  onClick={() => {
    if (editingParty) {
      setConfirmModal(true);   // Open confirmation for editing
    } else {
      handleSubmit();          // No confirmation needed for Add
    }
  }}
  disabled={ isLoading}
  className="text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
  style={{ backgroundColor: "#4CA1AF" }}
>
  Save
  {/* {isLoading ? (editingParty ? "Updating..." : "Saving...") 
             : (editingParty ? "Update" : "Save")} */}
</button>

        {/* <button
  type="button"
  onClick={editingParty ? handleEdit : handleSubmit}
  disabled={isLoading}
  className="text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
  style={{ backgroundColor: "#4CA1AF" }}
>
  {isLoading ??isUpdating ? "Saving..." :  "Save"}
</button> */}

        {/* <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={formValues.errorCount > 0?? isLoading}
          className="text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto"
          style={{ backgroundColor: "#4CA1AF" }}
        >
          {isLoading ? "Saving..." : "Save"}
        </button> */}
      </div>
    </>
  )}
</div>
{confirmModal && (
  <div
    className="fixed inset-0 
    flex items-center justify-center 
    bg-white z-50 bg-opacity-50"
  >
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h3 className="text-lg font-semibold text-center text-red-600 mb-4">
        Are you sure you want to update this Party?
      </h3>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            setConfirmModal(false);
            handleEdit();         // ✔ Trigger update API ONLY ON YES
          }}
          className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
        >
        {isUpdating?"Saving...":"Yes"}
        </button>

        <button
          type="button"
          onClick={() => setConfirmModal(false)}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


        </div>
      </div>
    </div>
  </div>
);

}
       
           