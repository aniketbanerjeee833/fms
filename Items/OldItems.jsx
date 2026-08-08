import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useEffect } from "react";

import { useDispatch} from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";




import { itemFormSchema } from "../../schema/itemFormSchema";
import { itemApi, useAddCategoryMutation, useAddItemMutation,  useGetAllCategoriesQuery } from "../../redux/api/itemApi";
import { toast } from "react-toastify";
import {  LayoutDashboard } from "lucide-react";
import { useGetAllItemUnitsQuery } from "../../redux/api/miscellaneousApi";
import AddUnitModal from "../../components/Modal/AddUnitModal";
import SelectUnitModal from "../../components/Modal/SelectUnitModal";









export default function Items() {

   //const [showAddUnitModal, setShowAddUnitModal] = useState(false);
   const[showSelectUnitModal,setShowSelectUnitModal] =useState(false)
  const {data: itemUnitsFetched} = useGetAllItemUnitsQuery();
  console.log(itemUnitsFetched, "itemUnitsFetched");
  const itemUnits=itemUnitsFetched
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemFormSchema)

  })

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("Purchase Items");
  // const [wholeSalePrice, setWholeSalePrice] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]); // selected categories

  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const dropdownRef = useRef(null);
  const [addItem, { isLoading:isAddingItem }] = useAddItemMutation();
 const primaryUnit = watch("Primary_Unit");
const secondaryUnit = watch("Secondary_Unit");
const conversionRate = watch("Conversion_Rate");
  const [addCategory] = useAddCategoryMutation();
  const [search, setSearch] = useState("");
  const { data: categories } = useGetAllCategoriesQuery()
  console.log(categories)
  
  const handleSelect = (cat) => {
    setSelected(cat);
    setValue("Item_Category", cat); // update react-hook-form
    setOpen(false);
  };
 
const handleAddCategory = async () => {

  if(newCategory.trim()===""){
    return
  }
  else if (newCategory.trim() !== "") {
    try {
      // ✅ Call backend
      const res = await addCategory({
        body: { Item_Category: newCategory.trim() },
      });

      // Some RTK Query wrappers put the response under `.data`
      const data = res?.data || res;

      if (data?.success) {
        const addedCat = newCategory.trim();

        // ✅ Auto-select the new category (single value)
        setSelected(addedCat);
        setValue("Item_Category", addedCat); // directly set single category

        // ✅ Refresh cache
        dispatch(itemApi.util.invalidateTags(["Category"]));

        // ✅ Reset modal & input
        setShowModal(false);
        setNewCategory("");
        setOpen(true);
      } else {
        console.warn("⚠️ Category not added. Response:", data);
      }
    } catch (err) {
      console.error("❌ Error adding category:", err);
    }
  }
};

  // Toggle category selection

  //   Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


 






  const formValues = watch();
  console.log("Current form values:", formValues);
  console.log("Form errors:", errors);


const onSubmit = async (data) => {
  console.log("Form Data (from RHF):", data);

  try {
    const res = await addItem({
      body: data,
    }).unwrap();

    console.log("Successfully:", res);

    toast.success(res?.message || "New Item added successfully!");
    navigate("/items/all-items");

  } catch (error) {
    console.error("Submission failed:", error);

    // Shows exact message coming from backend
    const backendMessage = error?.data?.message;
    

    toast.error(
      backendMessage || "Failed to add new item"
    );
  }
};
const selectedUnit=watch("Item_Unit")
  return (<>


  
   
          <div className="flex flex-col bg-white">
            <div className="inn-title">
              <h4 className="text-2xl font-bold mb-2">Add New Item</h4>
              <p className="text-gray-500 mb-6">
                Add new item details
              </p>
            </div>
            <div className="flex gap-6 w-full mt-6 pb-3">
                  <div className=" flex space-x-8 pl-4">
                                        {["Purchase Items","Stock"].map((tab) => (
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
                                    
                                    </div>
                                    <div className="tab-inn">
                                      
              <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab ==="Purchase Items"&& (
              <div className=" tab-inn">


                <div className="row">







<div
  style={{ width: "50%" }}
  className="relative mt-3"
  ref={dropdownRef}
>
  <span className="active">Category</span>
  {/* //<span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}

  {/* Search + Dropdown Trigger */}
  <input
    type="text"
    value={search}
    onClick={() => setOpen((prev) => !prev)}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search category"
     className="w-full outline-none border-b-2 text-gray-900 "
  />

  {/* Dropdown List */}
  {open && (
    <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
      {/* Add Category Option */}
      <span
        type="button"
        onClick={() => {
          setShowModal(true);
          setOpen(false);
        }}
        className="w-full text-left px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
      >
        + Add Category
      </span>

      {/* Category List */}
      {categories
        ?.filter((cat) =>
          cat.Item_Category.toLowerCase().includes(search.toLowerCase())
        )
        .map((cat, i) => (
          <div
            key={i}
            onClick={() => {
              handleSelect(cat.Item_Category);
              setSearch(cat.Item_Category);
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {cat.Item_Category}
          </div>
        ))}

      {/* No match case */}
      {categories?.filter((cat) =>
        cat.Item_Category.toLowerCase().includes(search.toLowerCase())
      ).length === 0 && (
        <p className="px-3 py-2 text-gray-500">No categories found</p>
      )}
    </div>
  )}

  {/* Hidden input for react-hook-form */}
  <input type="hidden" {...register("Item_Category")} value={selected || ""} />

  {/* Modal */}
  {showModal && (
    // <div className="fixed inset-0 flex items-center justify-center 
    //               bg-black bg-opacity-40 backdrop-blur-sm z-30">
    <div
  style={{
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)", // ✅ transparent dark
    backdropFilter: "blur(4px)",        // ✅ hazy blur
    zIndex: 30
  }}>
    {/* // <div className="fixed inset-0 flex items-center justify-center bg-gray-800  z-30"> */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        {/* Close Button (top-right) */}
        <button
          type="button"
          style={{ backgroundColor: "transparent" }}
          onClick={() => setShowModal(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h4 className="text-lg font-semibold mb-4">Add New Category</h4>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4CA1AF]"
          placeholder="Enter category name"
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
                     style={{ backgroundColor: "lightgray" }}
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddCategory}
                     style={{ backgroundColor: "#4CA1AF" }}
            className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#5c52d4]"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )}
</div>



                  <div className="input-field col s6 ">
                    <span className="active">
                      Item Name
                      <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                    </span>
                    <input
                      type="text"
                      id="Item_Name"
                      {...register("Item_Name")}
                      placeholder=" Item Name"
                      className="w-full outline-none border-b-2 text-gray-900"
                    />
                    {errors?.Item_Name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors?.Item_Name?.message}
                      </p>
                    )}
                  </div>

              

                </div>
              
                <div className="row">
<div className="input-field col s6 mt-4 ">
    <span className="active">
        Item HSN Code
        {/* <span className="text-red-500 font-bold text-lg">&nbsp;*</span> */}
    </span>

    <input
        type="text"
        id="Item_HSN"
        {...register("Item_HSN")}
        placeholder=" Item HSN Code"
        className="w-full outline-none border-b-2 text-gray-900"
        
       maxLength={8}              // limit to 8 digits
    onInput={(e) => {
      // ✅ Allow only digits
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    }}
    />
    
    {errors?.Item_HSN && (
        <p className="text-red-500 text-xs mt-1">
            {errors?.Item_HSN?.message}
        </p>
    )}
</div>


<div className="input-field col s6 mb-4 mt-4">
  <span className="active">Unit</span>

  <div className="mt-2">
    <button
      type="button"
      onClick={() => setShowSelectUnitModal(true)}
      className="px-4 py-2 rounded-md border"
      style={{
        backgroundColor: "white",
        borderColor: "#4CA1AF",
        color: "#4CA1AF",
      }}
    >
      {primaryUnit ? "Change Unit" : "Select Unit"}
    </button>

    {/* Show selected configuration */}
    {primaryUnit && (
      <div className="mt-2 text-sm text-gray-600">
        <span>
          Primary: <strong>{primaryUnit}</strong>
        </span>

        {secondaryUnit && (
          <>
            <span className="ml-3">
              Secondary: <strong>{secondaryUnit}</strong>
            </span>

            <div className="mt-1 text-[#4CA1AF]">
              1 {primaryUnit} = {conversionRate} {secondaryUnit}
            </div>
          </>
        )}
      </div>
    )}
  </div>
</div>
</div>
                {/* Item Image */}
                <div className="row mt-4  w-1/2 ">





                </div>

               
             
            </div>)}
            {activeTab === "Stock" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6 p-6">
        <div className="flex flex-col">
          <span className="active">Opening Quantity</span>
          <input type="text" placeholder="0"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Opening_Quantity")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">At Price</span>
          <input type="text" placeholder="0.00"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("At_Price")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">As Of Date</span>
          <input type="date"
            className="w-full outline-none border-b-2 text-gray-900"
            defaultValue={new Date().toISOString().slice(0, 10)}
            {...register("As_Of_Date")} />
        </div>

        <div className="flex flex-col">
          <span className="active">Min Stock To Maintain</span>
          <input type="text" placeholder="0"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Min_Stock")}
            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }} />
        </div>

        <div className="flex flex-col">
          <span className="active">Location</span>
          <input type="text"
           //placeholder="e.g. Shelf A3"
            className="w-full outline-none border-b-2 text-gray-900"
            {...register("Location")} />
        </div>
      </div>
    )}
     <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={formValues.errorCount > 0 ||isAddingItem}
                    className=" text-white font-bold py-2 px-4 rounded"
                    style={{ backgroundColor: "#4CA1AF" }}
                  >
                    {isAddingItem ? "Adding..." : "Add Item"}
                  </button>
                </div>
     </form>
    </div>
   

          </div>
       


{showSelectUnitModal && (
  <SelectUnitModal
    units={itemUnits || []}

    initialBase={primaryUnit || ""}

    onClose={() => {
      setShowSelectUnitModal(false);
    }}
    

    onSave={(newUnit) => {
      console.log("Selected unit configuration:", newUnit);

      setValue(
        "Primary_Unit",
        newUnit.baseUnit || null,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );

      setValue(
        "Secondary_Unit",
        newUnit.secondaryUnit || null,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );

      setValue(
        "Conversion_Rate",
        newUnit.secondaryUnit
          ? Number(newUnit.conversionRate)
          : null,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );

      setShowSelectUnitModal(false);
    }}
  />
)}
  </>
  );
};

{/* <div className="input-field col s6 mb-4 mt-4">
                    <span className="active">Select Unit</span>
                    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                    <select
                     value={selectedUnit || ""}   // 👈 control it
                      id="Item_Unit"
    onChange={(e) => {
          const value = e.target.value;

          // ➕ ADD UNIT
          if (value === "__ADD_UNIT__") {
            // setActiveUnitRow(i);
            setValue(`Item_Unit`, "", { shouldValidate: true, shouldDirty: true });
            setShowSelectUnitModal(true);
            return;
          }

          // handleRowChange(i, "Item_Unit", value);
          
           setValue(`Item_Unit`, value, { shouldValidate: true, shouldDirty: true });
        }}
                      // {...register("Item_Unit")}
                      className="w-full border border-gray-300 text-gray-900 bg-white rounded-md p-2"
                    >
                      {/* {
                        Object.keys(itemUnits).length > 0 && Object.entries(itemUnits).map(([key, value]) => (

                          <option key={key} value={key}>
                            {`${value}  (${key}) `}
                          </option>
                        ))
                      }
      
           <option value=""></option>
        <option value="__ADD_UNIT__">➕ Add Unit</option>
      {Array.isArray(itemUnits) &&
  itemUnits.map((unit) => (
    <option
      key={unit.Unit_Shorthand}
      value={unit.Unit_Shorthand}
    >
      {`${unit.Unit_Name} (${unit.Unit_Shorthand})`}
    </option>
  ))}
                    </select>

                    {errors?.Item_Unit && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors?.Item_Unit?.message}
                      </p>
                    )}
                  </div> */}