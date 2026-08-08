import { NavLink } from "react-router-dom";

import { itemApi, useAddCategoryMutation, useGetAllCategoriesQuery } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { ca } from "zod/v4/locales";
import { toast } from "react-toastify";
import { LayoutDashboard } from "lucide-react";

export default function AddCategory() {

   const [newCategory, setNewCategory] = useState("");
   const dispatch = useDispatch();
    const[categoryError,setCategoryError]=useState("");
   const [addCategory, { isLoading: isAddingCategory }] = useAddCategoryMutation();

   const { data: categories, isLoading: isLoadingCategories } = useGetAllCategoriesQuery()
 const handleSubmit = async (e) => {
  e.preventDefault();
 
   if(newCategory.trim()===""){
    setCategoryError("Category cannot be empty")
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
       console.log(data,res);
 
       if (data?.success) {
         const addedCat = newCategory.trim();
        toast.success("New Category added successfully!");
         // ✅ Auto-select the new category (single value)
      
 
         // ✅ Refresh cache
         dispatch(itemApi.util.invalidateTags(["Category"]));
 
        
         setNewCategory("");
        
       } else {
        toast.error(res?.error?.data?.message );
         console.warn("⚠️ Category not added. Response:", data);
       }
     } catch (err) {
       console.error("❌ Error adding category:", err);
     }
   }
 };

      
    return (
        <>
       
                {/* <div className="sb2-2-2">
                    <ul>
                        <li>
                               <NavLink style={{display:"flex",flexDirection:"row"}}
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
               
                        <div className="flex flex-col bg-white">
                            <div className="inn-title">
                                <h4 className="text-2xl font-bold mb-2">Add New Category</h4>
                                <p className="text-gray-500 mb-6">
                                    Add new Category
                                </p>
                            </div>
                            <div className="tab-inn">



                                <form onSubmit={(e) => handleSubmit(e)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>


                                    <div className="row flex flex-row gap-4">
                                        {/*Lead Name Field*/}
                                        <div className="input-field col s6 mt-0">
                    <span className="active">
                      Item Category
                      <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                    </span>
                    <input
                      type="text"
                      id="Item_Category"
                     onChange={(e) => setNewCategory(e.target.value)}
                      value={newCategory}
                      placeholder=" Item Category"
                      className="w-full outline-none border-b-2 text-gray-900"
                    />
                    {categoryError && (
                      <p className="text-red-500 text-xs mt-1">
                        {categoryError}
                      </p>
                    )}
                  </div>
                                    
                            <div className="input-field col s6">
                                        <input
                                            type="submit"
                                            disabled={isAddingCategory}
                                               style={{ backgroundColor: "#4CA1AF" }}
                                            className="waves-effect waves-light btn-large"
                                            value="Add Category"
                                        />
                                    </div>
                                    </div>
                                </form>

     {/* <div className="mt-4 max-h-[50vh] overflow-y-scroll">
  {categories &&
    categories.map((cat) => (
      <div
        key={cat.id}
        className="p-4 bg-[#f3f2fd] border-l-4 border-[#4CA1AF] rounded-r-md flex justify-between items-center mb-3"
      >
        <div className="flex items-center">
          <span className="text-[#4CA1AF] font-semibold">
            {cat.Item_Category}
          </span>
        </div>
      </div>
    ))}
</div> */}
<div className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]">
  {categories &&
    categories.map((cat) => (
      <div
        key={cat.id}
        className="px-3 py-2 bg-[#f3f2fd] border-l-4 border-[#4CA1AF] border border-gray-300 rounded-md text-sm text-[#4CA1AF] font-medium"
      >
        {cat.Item_Category}
      </div>
    ))}
</div>






                            </div>
                        </div>
                  
</>
    );
}