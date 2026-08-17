// import { useState } from "react";
// import { useAddCategoryMutation } from "../../redux/api/itemApi";
// import { toast } from "react-toastify";
// import { X } from "lucide-react";



// export default function AddItemCategoryModal({ onClose, onSave }) {
//   const [newCategory, setNewCategory] = useState("");
//   const [categoryError, setCategoryError] = useState("");

//   const [addCategory, { isLoading: isAddingCategory }] = useAddCategoryMutation();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (newCategory.trim() === "") {
//       setCategoryError("Category cannot be empty");
//       return;
//     }

//     setCategoryError("");

//     try {
//       const res = await addCategory({
//         body: { Item_Category: newCategory.trim() },
//       });

//       const data = res?.data || res;

//       if (data?.success) {
//         toast.success("New Category added successfully!");

//         const savedCategory = {
//           Category_Id: data.Category_Id,
//           Item_Category: data.Item_Category,
//         };

//         setNewCategory("");

//         if (onSave) {
//           onSave(savedCategory);
//         }
//       } else {
//         toast.error(res?.error?.data?.message || "Failed to add category");
//       }
//     } catch (err) {
//       console.error("❌ Error adding category:", err);
//       toast.error("Something went wrong");
//     }
//   };


  
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex justify-between items-center px-6 py-4 border-b">
//           <h4 className="text-lg font-bold">Add New Category</h4>
//           <button
//             type="button"
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-800"
//             style={{ background: "transparent", border: "none" }}
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <form
//           onSubmit={handleSubmit}
//           onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
//           className="px-6 py-5"
//         >
//           <div className="flex flex-col gap-2">
//             <span className="active">
//               Item Category
//               <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
//             </span>
//             <input
//               type="text"
//               autoFocus
//               value={newCategory}
//               onChange={(e) => {
//                 setNewCategory(e.target.value);
//                 if (categoryError) setCategoryError("");
//               }}
//               placeholder="Item Category"
//               className="w-full outline-none border-b-2 text-gray-900"
//             />
//             {categoryError && (
//               <p className="text-red-500 text-xs mt-1">{categoryError}</p>
//             )}
//           </div>

//           <div className="flex justify-end gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-white font-bold py-2 px-4 rounded"
//               style={{ backgroundColor: "#94a3b8" }}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isAddingCategory}
//               className="text-white font-bold py-2 px-4 rounded"
//               style={{ backgroundColor: "#4CA1AF" }}
//             >
//               {isAddingCategory ? "Saving..." : "Add Category"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { useAddCategoryMutation, useEditCategoryMutation } from "../redux/api/itemCategoryApi"; // adjust path

export default function AddItemCategoryModal({
  mode = "add",          // "add" | "edit"
  categoryData = null,    // { Category_Id, Item_Category } — required when mode="edit"
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const [newCategory, setNewCategory] = useState(isEdit ? categoryData?.Item_Category || "" : "");
  const [categoryError, setCategoryError] = useState("");

  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [editCategory, { isLoading: isEditing }] = useEditCategoryMutation();
  const isSaving = isAdding || isEditing;

  // keep the input in sync if categoryData changes (e.g. double-click a different row)
  useEffect(() => {
    if (isEdit) {
      setNewCategory(categoryData?.Item_Category || "");
    }
  }, [isEdit, categoryData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newCategory.trim() === "") {
      setCategoryError("Category cannot be empty");
      return;
    }

    setCategoryError("");

    try {
      if (isEdit) {
        const res = await editCategory({
          categoryId: categoryData.Category_Id,
          body: { Item_Category: newCategory.trim() },
        });

        const data = res?.data || res;

        if (data?.success !== false && !res?.error) {
          toast.success("Category updated successfully!");

          const savedCategory = {
            Category_Id: categoryData.Category_Id,
            Item_Category: newCategory.trim(),
          };

          if (onSave) onSave(savedCategory);
        } else {
          toast.error(res?.error?.data?.message || data?.message || "Failed to update category");
        }
      } else {
        const res = await addCategory({
          body: { Item_Category: newCategory.trim() },
        });

        const data = res?.data || res;

        if (data?.success) {
          toast.success("New Category added successfully!");

          const savedCategory = {
            Category_Id: data.Category_Id,
            Item_Category: data.Item_Category,
          };

          setNewCategory("");
          if (onSave) onSave(savedCategory);
        } else {
          toast.error(res?.error?.data?.message || "Failed to add category");
        }
      }
    } catch (err) {
      console.error("❌ Error saving category:", err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h4 className="text-lg font-bold">
            {isEdit ? "Edit Category" : "Add New Category"}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            style={{ background: "transparent", border: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          className="px-6 py-5"
        >
          <div className="flex flex-col gap-2">
            <span className="active">
              Item Category
              <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
            </span>
            <input
              type="text"
              autoFocus
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                if (categoryError) setCategoryError("");
              }}
              placeholder="Item Category"
              className="w-full outline-none border-b-2 text-gray-900"
            />
            {categoryError && (
              <p className="text-red-500 text-xs mt-1">{categoryError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="text-white font-bold py-2 px-4 rounded"
              style={{ backgroundColor: "#94a3b8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="text-white font-bold py-2 px-4 rounded"
              style={{ backgroundColor: "#4CA1AF" }}
            >
              {isSaving ? "Saving..." : isEdit ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}