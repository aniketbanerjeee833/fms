
import { NavLink, useNavigate } from "react-router-dom";
import { partyFormSchema } from "../../schema/partyFormSchema";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-toastify";
import { partyApi, useAddPartyMutation } from "../../redux/api/partyAPi";
import { LayoutDashboard } from "lucide-react";
import { useDispatch } from "react-redux";

// export default function PartyAdd() {
//     // const { userId } = useSelector((state) => state.user);
//     const navigate = useNavigate();
//     const dispatch = useDispatch();
//     const [activeTab, setActiveTab] = useState("GST & Address");
//     const [shippingAdress, setShippingAddress] = useState(false);
//     const [open, setOpen] = useState(false);
//      const [search, setSearch] = useState("");
//      const[selected, setSelected] = useState(null);
// const dropdownRef = useRef(null);
//     const [addParty, { isLoading: isAddingParty }] = useAddPartyMutation();
//       useEffect(() => {
//         const handleClickOutside = (e) => {
//           if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//             setOpen(false);
//           }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//       }, []);

// const states = [
//   "Andaman and Nicobar Islands",
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chandigarh",
//   "Chhattisgarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Delhi",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jammu and Kashmir",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Ladakh",
//   "Lakshadweep",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Puducherry",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal"
// ];
//     const {
//         register,
//         handleSubmit,
//         setValue,
//         watch,
//         formState: { errors },
//     } = useForm({
//         resolver: zodResolver(partyFormSchema)

//     })
//     const formValues = watch();
//     console.log("Current form values:", formValues);
//     console.log("Form errors:", errors);

//   const handleSelect = (state) => {
//     setSelected(state);
//     setValue("State", state); // update react-hook-form
//     setOpen(false);
//   };
//     const onSubmit = async (data) => {
//         console.log("Form Data (from RHF):", data);
//         try {
//             const res = await addParty({
//                 body: data,
//             }).unwrap();

//             console.log(" successfully:", res);
//             const resData = res?.data || res;
//             dispatch(partyApi.util.invalidateTags(["Party"]));
//             if (!resData?.success) {
//                 toast.error("Failed to add new party");
//                 return;
//             } else {
//                 toast.success("New Party added successfully!");
//                 navigate("/party/all-parties");
//             }





//         } catch (error) {
//             const errorMessage =
//                 error?.data?.message || error?.message || "Failed to add new lead";

//             toast.error(errorMessage);
//             // toast.error("Failed to add lead");
//             console.error("Submission failed", error);
//         }

//     }
//     return (<>


//         {/* <div className="sb2-2-2">
//             <ul >
//                 <li>

//                     <NavLink style={{ display: "flex", flexDirection: "row" }}
//                         to="/home"

//                     >
//                         <LayoutDashboard size={20} style={{ marginRight: '8px' }} />

//                         Dashboard
//                     </NavLink>
//                 </li>

//             </ul>
//         </div> */}
//         {/* <div className="sb2-2-3 ">
//             <div className="row">
//                 <div className="col-md-12">
//                     <div className="box-inn-sp"> */}

//                     <div className="flex flex-col bg-white ">
//                         <div className="inn-title">
//                             <h4 className="text-2xl font-bold mb-2">Add Party</h4>
//                             <p className="text-gray-500 mb-6">
//                                 Add new party details
//                             </p>
//                         </div>
//                         <div className=" tab-inn">


//                             <form onSubmit={handleSubmit(onSubmit)}>
//                                 <div className="grid grid-cols-3 gap-6">









//                                     {/* Party Name Field */}
//                                     <div className="flex flex-col">
//                                         <span className="active">
//                                             Party Name
//                                             <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//                                         </span>
//                                         <input
//                                             type="text"
//                                             id="Party_Name"
//                                             {...register("Party_Name")}
//                                             placeholder=" Party Name"
//                                             className="w-full outline-none border-b-2 text-gray-900"
//                                         />
//                                         {errors?.Party_Name && (
//                                             <p className="text-red-500 text-xs mt-1">
//                                                 {errors?.Party_Name?.message}
//                                             </p>
//                                         )}
//                                     </div>

//                                     {/*GSTIN */}
//                                     <div className="flex flex-col mt-2 ">
//                                         <span className="active">
//                                             GSTIN

//                                         </span>

//                                         <input
//                                             type="text"
//                                             id="Gstin"
//                                             maxLength={15}
//                                             {...register("GSTIN")}
//                                             onChange={(e) => {
//                                                 // Only allow uppercase letters and digits
//                                                 const filtered = e.target.value
//                                                     .toUpperCase()
//                                                     .replace(/[^A-Z0-9]/g, "");
//                                                 e.target.value = filtered;
//                                             }}
//                                             placeholder="GSTIN"
//                                             className="w-full outline-none border-b-2 text-gray-900 pl-8"
//                                         />


//                                         {errors?.GSTIN && (
//                                             <p className="text-red-500 text-xs mt-1">
//                                                 {errors?.GSTIN?.message}
//                                             </p>
//                                         )}
//                                     </div>


//                                     {/*Phone Number */}
//                                     <div className="flex flex-col mt-2">
//                                         <span className="active">
//                                             Phone Number

//                                         </span>

//                                         <input
//                                             type="text"
//                                             id="phone-number"
//                                             {...register("Phone_Number")}



//                                             onInput={(e) => {
//                                                 // Only allow digits and max 10 characters
//                                                 e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
//                                             }}
//                                             placeholder="Phone Number"
//                                             className="w-full outline-none border-b-2 text-gray-900"
//                                         />
//                                         {errors?.Phone_Number && (
//                                             <p className="text-red-500 text-xs mt-1">
//                                                 {errors?.Phone_Number?.message}
//                                             </p>
//                                         )}
//                                     </div>
//                                 </div>
//                                 <div className="mt-6">
//                                     {/* Horizontal Line with Tabs */}
//                                     <div className="border-b border-gray-300 flex space-x-8">
//                                         {["GST & Address"].map((tab) => (
//                                             <button
//                                                 type="button"
//                                                 key={tab}
//                                                 onClick={() => setActiveTab(tab)}
//                                                 style={{
//                                                     cursor: "pointer",
//                                                     backgroundColor: "transparent",
//                                                     border: "none",
//                                                     outline: "none",
//                                                     padding: "0.5rem 1rem",
//                                                     borderBottom: activeTab === tab ? "1px solid red" : "none",
//                                                     color: activeTab === tab ? "red" : "gray",
//                                                     fontWeight: activeTab === tab ? "600" : "500",
//                                                 }}
//                                             >
//                                                 {tab}
//                                             </button>
//                                         ))}
//                                     </div>


//                                     {/* Grey Div Below */}
//                                     <div className="bg-gray-100 p-6 mt-4 rounded">
//                                         {activeTab === "GST & Address" && (
//                                             <>
//                                                 <div className="grid grid-cols-2 gap-4">
//                                                     <div className="flex flex-col gap-12">


//                                                         <div 

//   className=" relative "
//   ref={dropdownRef} >



//                                                             <span className="active">
//                                                                 State

//                                                             </span>



//   <span className="text-red-500 font-bold text-lg">&nbsp;*</span>

//   {/* Search + Dropdown Trigger */}
//   <input
//     type="text"
//     value={search}
//     onClick={() => setOpen((prev) => !prev)}
//     onChange={(e) => setSearch(e.target.value)}
//     placeholder="Search state"
//      className="w-full outline-none border-b-2 text-gray-900 "
//   />

//   {/* Dropdown List */}
//   {open && (
//     <div className="absolute z-20 flex flex-col
//       w-full bg-white border border-gray-300 
//      rounded-md shadow-lg max-h-48 overflow-y-auto">


//       {/* Category List */}
//       {states
//         ?.filter((state) =>
//           state.toLowerCase().includes(search.toLowerCase())
//         )
//         .map((state, i) => (
//           <div
//             key={i}
//             onClick={() => {
//               handleSelect(state);
//               setSearch(state);
//               setOpen(false);
//             }}
//             className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//           >
//             {state}
//             {/* {cat.Item_Category} */}
//           </div>
//         ))}

//       {/* No match case */}
//       {states?.filter((state) =>
//         state.toLowerCase().includes(search.toLowerCase())
//       ).length === 0 && (
//         <p className="px-3 py-2 text-gray-500">No categories found</p>
//       )}
//     </div>
//   )}

//   {/* Hidden input for react-hook-form */}
//   {/* <input type="hidden" {...register("Item_Category")} value={selected || ""} /> */}

//   {/* Modal */}

// {/* </div> */}
//                                                             {/* <select
//                                                                 id=" State"
//                                                                 {...register("State")}
//                                                                 className="w-full outline-none border-b-2 text-gray-900 bg-white"
//                                                             >
//                                                                 <option value="">Select State</option>
//                                                                 <option value="West Bengal"> West Bengal </option>

//                                                                 <option value="Maharashtra"> Maharashtra </option>

//                                                             </select> */}
//                                                             {errors?.State && (
//                                                                 <p className="text-red-500 text-xs mt-1">
//                                                                     {errors?.State?.message}
//                                                                 </p>
//                                                             )}
//                                                         </div>
//                                                         <div className="flex flex-col ">
//                                                             <span className="active">
//                                                                 Email_Id

//                                                             </span>
//                                                             <input
//                                                                 type="text"
//                                                                 id="Email_Id"
//                                                                 {...register("Email_Id")}
//                                                                 placeholder="example@email.com"
//                                                                 className="w-full outline-none border-b-2 text-gray-900 bg-white"
//                                                             />
//                                                             {errors?.Email_Id && (
//                                                                 <p className="text-red-500 text-xs mt-1">
//                                                                     {errors?.Email_Id?.message}
//                                                                 </p>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                     <div className="flex flex-col gap-2">
//                                                         {/* Billing Address */}
//                                                         <div className="flex flex-col">
//                                                             <span className="active">
//                                                                 Billing Address
//                                                             </span>
//                                                             <textarea
//                                                                 style={{ resize: "none" }}
//                                                                 id="Billing_Address"
//                                                                 {...register("Billing_Address")}
//                                                                 className="w-full outline-none text-gray-900 
//       bg-white resize-none border border-gray-300 rounded-md p-2 
//       h-40"
//                                                                 placeholder="Billing Address"
//                                                             ></textarea>
//                                                             {errors?.Billing_Address && (
//                                                                 <p className="text-red-500 text-xs mt-1">
//                                                                     {errors?.Billing_Address?.message}
//                                                                 </p>
//                                                             )}
//                                                         </div>

//                                                         {/* <p className="text-blue-500 cursor-pointer" onClick={() => setShippingAddress(!shippingAdress)}>Add Shipping Address</p> */}
//                                                         <p
//                                                             className="text-[#4CA1AF] cursor-pointer font-medium hover:underline mt-2"
//                                                             onClick={() => setShippingAddress(!shippingAdress)}
//                                                         >
//                                                             {shippingAdress
//                                                                 ? "Hide Shipping Address"
//                                                                 : "Add Shipping Address"}
//                                                         </p>
//                                                         {shippingAdress && <div className="flex flex-col">
//                                                             <span className="active">
//                                                                 Shipping Address
//                                                             </span>
//                                                             <textarea
//                                                                 style={{ resize: "none" }}
//                                                                 id="Shipping_Address"
//                                                                 {...register("Shipping_Address")}
//                                                                 className="w-full outline-none text-gray-900 
//       bg-white resize-none border border-gray-300 rounded-md p-2 
//       h-40"
//                                                                 placeholder="Shipping Address"
//                                                             ></textarea>
//                                                             {errors?.Shipping_Address && (
//                                                                 <p className="text-red-500 text-xs mt-1">
//                                                                     {errors?.Shipping_Address?.message}
//                                                                 </p>
//                                                             )}
//                                                         </div>}
//                                                     </div>




//                                                 </div>
//                                                 <div className="flex justify-end">
//                                                     <button
//                                                         type="submit"
//                                                         disabled={formValues.errorCount > 0 || isAddingParty}
//                                                         className=" text-white font-bold py-2 px-4 rounded"
//                                                         style={{ backgroundColor: "#4CA1AF" }}
//                                                     >
//                                                         {isAddingParty ? "Adding..." : "Add Party"}
//                                                     </button>
//                                                 </div>
//                                             </>
//                                         )

//                                         }

//                                     </div>
//                                 </div>

//                             </form>
//                         </div>

//                     </div>




//     </>
//     );
// };







const STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const TABS = ["GST & Address", "Credit & Balance"];

const ACCENT = "#4CA1AF";
const ACCENT_L = "#eaf6f7";   // light tint for active tab underline bg

export default function PartyAdd() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState("GST & Address");
    //const [showShipping, setShowShipping] = useState(false);
    const [stateOpen, setStateOpen] = useState(false);
    const [stateSearch, setStateSearch] = useState("");

    /* Credit & Balance */
    const [showBalanceType, setShowBalanceType] = useState(false); // visible once OB entered
    //const [openingBalanceType, setOpeningBalanceType] = useState("To_Pay"); // "To_Pay" | "To_Receive"
    const [customLimit, setCustomLimit] = useState(false);

    const dropdownRef = useRef(null);

    const [addParty, { isLoading: isAddingParty }] = useAddPartyMutation();
    const handleDefaultBilling = (selectedIndex) => {
        setDefaultBillingIdx(selectedIndex);

        const addresses = watch("addresses") || [];

        addresses.forEach((address, index) => {
            if (address.Address_Type === "Billing") {
                setValue(
                    `addresses.${index}.Is_Default`,
                    index === selectedIndex,
                    {
                        shouldDirty: true,
                        shouldValidate: true,
                    }
                );
            }
        });
    };

    const handleDefaultShipping = (selectedIndex) => {
        setDefaultShippingIdx(selectedIndex);

        const addresses = watch("addresses") || [];

        addresses.forEach((address, index) => {
            if (address.Address_Type === "Shipping") {
                setValue(
                    `addresses.${index}.Is_Default`,
                    index === selectedIndex,
                    {
                        shouldDirty: true,
                        shouldValidate: true,
                    }
                );
            }
        });
    };
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(partyFormSchema),
        defaultValues: {
            Party_Name: "",
            GSTIN: "",
            Phone_Number: "",
            State: "",
            Email_Id: "",
            addresses: [
                {
                    Address_Type: "Billing",
                    Address_Text: "",
                    Is_Default: false,
                },
                {
                    Address_Type: "Shipping",
                    Address_Text: "",
                    Is_Default: false,
                }
            ],
            Opening_Balance: "",           // empty string in the input — becomes null on submit if untouched
            Opening_Balance_Type: null,
            Opening_Balance_Date: new Date().toISOString().split("T")[0],  // default to today
            Credit_Limit_Type: "No_Limit",
            Credit_Limit: "",
            //Opening_Balance_Type: "To_Pay",

            //Additional_Fields: "",
        },
    });
    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control,
        name: "addresses",
    });

    // track which index is the default for each type
    // const [defaultBillingIdx, setDefaultBillingIdx] = useState(0);
    // const [defaultShippingIdx, setDefaultShippingIdx] = useState(0);
    const [defaultBillingIdx, setDefaultBillingIdx] = useState(null);
    const [defaultShippingIdx, setDefaultShippingIdx] = useState(null);
    const openingBalanceWatch = watch("Opening_Balance");

    useEffect(() => {
        const val = openingBalanceWatch;
        setShowBalanceType(val !== "" && val !== undefined && val !== null);
    }, [openingBalanceWatch]);

    /* close state dropdown on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setStateOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelectState = (state) => {
        setStateSearch(state);
        setValue("State", state);
        setStateOpen(false);
    };
    const onSubmit = async (data) => {
        console.log("Form Data:", data);

        // Example:
        // {
        //   Party_Name: "ABC",
        //   Opening_Balance: "500",
        //   Opening_Balance_Type: "To_Receive",
        //   Opening_Balance_Date: "2026-08-03",
        //   ...
        // }

        try {
            const res = await addParty({
                body: data,
            }).unwrap();

            toast.success(res?.message || "Party added successfully!");
            dispatch(partyApi.util.invalidateTags(["Party"]));
            navigate("/party/parties");
        } catch (error) {
            console.error("Submission failed:", error);

            toast.error(
                error?.data?.message ||
                error?.data?.errors?.[0]?.message ||
                error?.message ||
                "Failed to add party"
            );
        }
    };
    // const onSubmit = async (data) => {
    //     const payload = {
    //         ...data,
    //         Opening_Balance_Type: showBalanceType ? openingBalanceType : null,
    //         Credit_Limit: customLimit ? data.Credit_Limit : null,
    //     };
    //     try {
    //         const res = await addParty({ body: payload }).unwrap();
    //         const resData = res?.data || res;
    //         dispatch(partyApi.util.invalidateTags(["Party"]));
    //         if (!resData?.success) {
    //             toast.error("Failed to add new party");
    //             return;
    //         }
    //         toast.success("Party added successfully!");
    //         navigate("/party/all-parties");
    //     } catch (error) {
    //         toast.error(error?.data?.message || error?.message || "Failed to add party");
    //     }
    // };
    const formValues = watch();
    console.log("Current form values:", formValues);
    console.log("Form errors:", errors);
    /* ─── shared input style ─── */
    const inputCls = "w-full outline-none border-b-2 border-gray-300 focus:border-[#4CA1AF] text-gray-900 py-1 bg-transparent transition-colors";
    const labelCls = "text-xs font-medium text-gray-500 mb-0.5";
    const openingBalanceType = watch("Opening_Balance_Type");
    return (
        <div className="flex flex-col bg-white">
            <style>{`
        .pty-tab-active {
          color: red;
          border-bottom: 2px solid red;
          font-weight: 600;
          background-color: white;
        }
        .pty-tab-inactive {
          color: #6b7280;
          border-bottom: 2px solid transparent;
          font-weight: 500;
        }
        .pty-tab-inactive:hover { color: #374151; }
        .pty-toggle {
          position: relative;
          width: 44px; height: 24px;
          background: #d1d5db;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .pty-toggle.on { background: red; }
        .pty-toggle::after {
          content: "";
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
        }
        .pty-toggle.on::after { transform: translateX(20px); }
        .pty-radio {
          accent-color: ${ACCENT};
          width: 15px; height: 15px;
          cursor: pointer;
        }
      `}</style>

            {/* ── header ── */}
            <div className="inn-title">
                <h4 className="text-2xl font-bold mb-1">Add Party</h4>
                <p className="text-gray-500 text-sm">Add new party details</p>
            </div>

            <div className="tab-inn">
                <form onSubmit={handleSubmit(onSubmit)}>

                    {/* ── TOP ROW: Party Name / GSTIN / Phone ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                        <div className="flex flex-col">
                            <span className={labelCls}>
                                Party Name 
                                <span className="text-red-500">*</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Party Name"
                                className={inputCls}
                                {...register("Party_Name")}
                            />
                            {errors?.Party_Name && (
                                <p className="text-red-500 text-xs mt-1">{errors.Party_Name.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className={labelCls}>GSTIN</span>
                            <input
                                type="text"
                                maxLength={15}
                                placeholder="GSTIN"
                                className={inputCls}
                                {...register("GSTIN")}
                                onChange={(e) => {
                                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                }}
                            />
                            {errors?.GSTIN && (
                                <p className="text-red-500 text-xs mt-1">{errors.GSTIN.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className={labelCls}>Phone Number</span>
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                className={inputCls}
                                {...register("Phone_Number")}
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                                }}
                            />
                            {errors?.Phone_Number && (
                                <p className="text-red-500 text-xs mt-1">{errors.Phone_Number.message}</p>
                            )}
                        </div>
                    </div>

                    {/* ── TABS ── */}
                    <div className="border-b border-gray-200 flex gap-0 mb-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                style={{ background: "none", cursor: "pointer" }}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 text-sm transition-colors ${activeTab === tab ? "pty-tab-active" : "pty-tab-inactive"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB PANELS ── */}
                    <div className="bg-gray-50 rounded-b-lg p-6">

                        {/* ══ GST & ADDRESS ══ */}
                        {activeTab === "GST & Address" && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                                {/* left col */}
                                <div className="flex flex-col gap-6">
                                    {/* State searchable dropdown */}
                                    <div className="flex flex-col relative" ref={dropdownRef}>
                                        <span className={labelCls}>
                                            State 
                                            {/* <span className="text-red-500">*</span> */}
                                        </span>
                                        <input
                                            type="text"
                                            value={stateSearch}
                                            onClick={() => setStateOpen((p) => !p)}
                                            onChange={(e) => { setStateSearch(e.target.value); setStateOpen(true); }}
                                            placeholder="Search state"
                                            className={inputCls}
                                        />
                                        {stateOpen && (
                                            <div className="absolute top-full left-0 z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                                {STATES.filter((s) =>
                                                    s.toLowerCase().includes(stateSearch.toLowerCase())
                                                ).map((s, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleSelectState(s)}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    >
                                                        {s}
                                                    </div>
                                                ))}
                                                {STATES.filter((s) =>
                                                    s.toLowerCase().includes(stateSearch.toLowerCase())
                                                ).length === 0 && (
                                                        <p className="px-3 py-2 text-gray-400 text-sm">No state found</p>
                                                    )}
                                            </div>
                                        )}
                                        <input type="hidden" {...register("State")} />
                                        {errors?.State && (
                                            <p className="text-red-500 text-xs mt-1">{errors.State.message}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col">
                                        <span className={labelCls}>Email</span>
                                        <input
                                            type="text"
                                            placeholder="example@email.com"
                                            className={inputCls}
                                            {...register("Email_Id")}
                                        />
                                        {errors?.Email_Id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.Email_Id.message}</p>
                                        )}
                                    </div>
                                </div>


                                {/* <div className="flex flex-col gap-4">
                                    <div className="flex flex-col">
                                        <span className={labelCls}>Billing Address</span>
                                        <textarea
                                            rows={4}
                                            placeholder="Billing Address"
                                            style={{ resize: "none" }}
                                            className="w-full outline-none text-gray-900 bg-white border border-gray-300 rounded-md p-2 focus:border-[#4CA1AF] transition-colors text-sm"
                                            {...register("Billing_Address")}
                                        />
                                        {errors?.Billing_Address && (
                                            <p className="text-red-500 text-xs mt-1">{errors.Billing_Address.message}</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="text-sm font-medium self-start hover:underline"
                                        style={{ color: ACCENT, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                        onClick={() => setShowShipping((p) => !p)}
                                    >
                                        {showShipping ? "Hide Shipping Address" : "+ Add Shipping Address"}
                                    </button>

                                    {showShipping && (
                                        <div className="flex flex-col">
                                            <span className={labelCls}>Shipping Address</span>
                                            <textarea
                                                rows={4}
                                                placeholder="Shipping Address"
                                                style={{ resize: "none" }}
                                                className="w-full outline-none text-gray-900 bg-white border border-gray-300 rounded-md p-2 focus:border-[#4CA1AF] transition-colors text-sm"
                                                {...register("Shipping_Address")}
                                            />
                                        </div>
                                    )}
                                </div> */}
                                {/* mid col — addresses */}
                                <div className="flex flex-col gap-6">
                                    {/* BILLING */}
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={labelCls}>Billing Addresses</span>
                                        <button
                                            type="button"
                                            style={{ color: ACCENT, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                                            onClick={() => appendAddress({ Address_Type: "Billing", Address_Text: "" })}
                                        >
                                            + Add Billing
                                        </button>
                                    </div>

                                    {addressFields.map((field, i) => {
                                        if (field.Address_Type !== "Billing") return null;

                                        const isDefault = defaultBillingIdx === i;

                                        return (
                                            <div
                                                key={field.id}
                                                onClick={() => handleDefaultBilling(i)}
                                                className="flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all"
                                                style={{
                                                    borderColor: isDefault ? ACCENT : "#e5e7eb",
                                                    backgroundColor: isDefault ? "#eaf6f7" : "white",
                                                }}
                                            >
                                                <div
                                                    className="mt-1 flex-shrink-0 rounded-full"
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        backgroundColor: isDefault ? ACCENT : "#d1d5db",
                                                        marginTop: 6,
                                                    }}
                                                />

                                                <textarea
                                                    rows={2}
                                                    placeholder="Billing Address"
                                                    style={{
                                                        resize: "none",
                                                        flex: 1,
                                                        border: "none",
                                                        background: "transparent",
                                                        outline: "none",
                                                        fontSize: 13,
                                                    }}
                                                    {...register(`addresses.${i}.Address_Text`)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />

                                                {addressFields.filter(
                                                    (f) => f.Address_Type === "Billing"
                                                ).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeAddress(i);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}

                                                {isDefault && (
                                                    <span
                                                        className="text-xs font-medium flex-shrink-0"
                                                        style={{ color: ACCENT, marginTop: 4 }}
                                                    >
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* SHIPPING */}
                                {/* right col */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={labelCls}>Shipping Addresses</span>

                                        <button
                                            type="button"
                                            style={{
                                                color: ACCENT,
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontSize: 13,
                                            }}
                                            onClick={() =>
                                                appendAddress({
                                                    Address_Type: "Shipping",
                                                    Address_Text: "",
                                                    Is_Default: false,
                                                })
                                            }
                                        >
                                            + Add Shipping
                                        </button>
                                    </div>

                                    {addressFields.map((field, i) => {
                                        if (field.Address_Type !== "Shipping") return null;

                                        const isDefault = defaultShippingIdx === i;

                                        return (
                                            <div
                                                key={field.id}
                                                onClick={() => handleDefaultShipping(i)}
                                                className="flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all"
                                                style={{
                                                    borderColor: isDefault ? ACCENT : "#e5e7eb",
                                                    backgroundColor: isDefault ? "#eaf6f7" : "white",
                                                }}
                                            >
                                                {/* Default indicator */}
                                                <div
                                                    className="flex-shrink-0 rounded-full"
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        backgroundColor: isDefault ? ACCENT : "#d1d5db",
                                                        marginTop: 6,
                                                    }}
                                                />

                                                {/* Address */}
                                                <textarea
                                                    rows={2}
                                                    placeholder="Shipping Address"
                                                    style={{
                                                        resize: "none",
                                                        flex: 1,
                                                        border: "none",
                                                        background: "transparent",
                                                        outline: "none",
                                                        fontSize: 13,
                                                    }}
                                                    {...register(`addresses.${i}.Address_Text`)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />

                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeAddress(i);
                                                    }}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#ef4444",
                                                        cursor: "pointer",
                                                        padding: "2px 4px",
                                                        flexShrink: 0,
                                                    }}
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>

                                                {/* Default label */}
                                                {isDefault && (
                                                    <span
                                                        className="text-xs font-medium flex-shrink-0"
                                                        style={{
                                                            color: ACCENT,
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        )}

                        {/* ══ CREDIT & BALANCE ══ */}
                        {activeTab === "Credit & Balance" && (
                            <div className="flex flex-col gap-6 max-w-lg">

                                {/* Opening Balance + As Of Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className={labelCls}>Opening Balance</span>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            className={inputCls}
                                            {...register("Opening_Balance")}
                                            onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={labelCls}>As Of Date</span>
                                        <input
                                            type="date"
                                            defaultValue={new Date().toISOString().slice(0, 10)}
                                            className={inputCls}
                                            {...register("As_Of_Date")}
                                        />
                                    </div>
                                </div>

                                {/* To Pay / To Receive — appears when OB has a value */}
                                {showBalanceType && (
                                    <div className="flex flex-col gap-2">
                                        <span className={labelCls}>Balance Type</span>

                                        <div className="flex gap-6">
                                            {/* TO PAY */}
                                            <div className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="pty-checkbox "
                                                    checked={openingBalanceType === "To_Pay"}
                                                    onChange={(e) => {
                                                        setValue(
                                                            "Opening_Balance_Type",
                                                            e.target.checked ? "To_Pay" : null,
                                                            {
                                                                shouldDirty: true,
                                                                shouldValidate: true,
                                                            }
                                                        );
                                                    }}
                                                />

                                                To Pay 
                                            </div>

                                            {/* TO RECEIVE */}
                                            <div className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    className="pty-checkbox"
                                                    checked={openingBalanceType === "To_Receive"}
                                                    onChange={(e) => {
                                                        setValue(
                                                            "Opening_Balance_Type",
                                                            e.target.checked ? "To_Receive" : null,
                                                            {
                                                                shouldDirty: true,
                                                                shouldValidate: true,
                                                            }
                                                        );
                                                    }}
                                                />

                                                To Receive
                                            </div>
                                        </div>

                                        {errors?.Opening_Balance_Type && (
                                            <p className="text-red-500 text-xs">
                                                {errors.Opening_Balance_Type.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Credit Limit */}

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Credit Limit
                                        </span>

                                        {/* Left label */}
                                        <span
                                            className={`text-sm ${!customLimit
                                                ? "font-medium text-gray-700"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            No Limit
                                        </span>

                                        {/* Toggle */}
                                        <div
                                            className={`pty-toggle ${customLimit ? "on" : ""}`}
                                            onClick={() => {
                                                const nextValue = !customLimit;

                                                setCustomLimit(nextValue);

                                                setValue(
                                                    "Credit_Limit_Type",
                                                    nextValue ? "Custom" : "No_Limit",
                                                    {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    }
                                                );

                                                // When switching back to No Limit
                                                if (!nextValue) {
                                                    setValue("Credit_Limit", "", {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    });
                                                }
                                            }}
                                        />

                                        {/* Right label */}
                                        <span
                                            className={`text-sm ${customLimit
                                                ? "font-medium text-gray-700"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            Custom Limit
                                        </span>
                                    </div>

                                    {customLimit && (
                                        <div className="flex flex-col max-w-xs">
                                            <span className={labelCls}>
                                                Credit Limit Amount
                                            </span>

                                            <input
                                                type="text"
                                                placeholder="Enter credit limit"
                                                className={inputCls}
                                                {...register("Credit_Limit")}
                                                onInput={(e) => {
                                                    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                                }}
                                            />

                                            {errors?.Credit_Limit && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.Credit_Limit.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ADDITIONAL FIELDS ══ */}
                        {/* {activeTab === "Additional Fields" && (
              <div className="flex flex-col gap-4 max-w-lg">
                <div className="flex flex-col">
                  <span className={labelCls}>Additional Fields</span>
                  <textarea
                    rows={5}
                    placeholder="Any additional notes or custom fields..."
                    style={{ resize: "none" }}
                    className="w-full outline-none text-gray-900 bg-white border border-gray-300 rounded-md p-2 focus:border-[#4CA1AF] transition-colors text-sm"
                    {...register("Additional_Fields")}
                  />
                </div>
              </div>
            )} */}
                    </div>

                    {/* ── FOOTER ACTIONS ── */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/party/all-parties")}
                            className="px-5 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isAddingParty}
                            className="px-5 py-2 rounded-md text-sm font-medium text-white"
                            style={{ backgroundColor: ACCENT }}
                        >
                            {isAddingParty ? "Adding..." : "Add Party"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}