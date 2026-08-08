import { useEffect, useState } from "react";
import { useEditExpenseCategoryMutation } from "../../redux/api/expenseApi";
import { toast } from "react-toastify";

export default function EditExpenseCategoryModal({
  category,
  onClose,
}) {
  const [categoryName, setCategoryName] = useState("");
  const [expenseType, setExpenseType] = useState("Indirect Expense");
  const [error, setError] = useState("");

  const [editExpenseCategory, { isLoading }] =
    useEditExpenseCategoryMutation();

  /* ===========================
     Populate existing category
  ============================ */
  useEffect(() => {
    if (!category) return;

    setCategoryName(category.Category_Name || "");

    setExpenseType(
      category.Category_Type === "Direct"
        ? "Direct Expense"
        : "Indirect Expense"
    );
  }, [category]);

  /* ===========================
     Update Category
  ============================ */
  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    const payload = {
      Category_Name: categoryName.trim(),
      Category_Type:
        expenseType === "Direct Expense"
          ? "Direct"
          : "Indirect",
    };

    try {
      const res = await editExpenseCategory({
        id: category.id,
        body: payload,
      }).unwrap();

      toast.success(
        res?.message || "Expense category updated successfully!"
      );

      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message ||
          "Failed to update expense category"
      );
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
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6"
          style={{
            marginBottom: "20px",
            paddingBottom: "10px",
          }}
        >
          <h4 className="text-xl font-semibold text-gray-900">
            Edit Expense Category
          </h4>

          <button
            type="button"
            style={{
              backgroundColor: "transparent",
              height: "30px",
              width: "30px",
              fontSize: "20px",
            }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4">
          {/* Category Name */}
          <div
            style={{ width: "100%" }}
            className="flex flex-col"
          >
            <span className="active">
              Expense Category
              <span className="text-red-500 font-bold text-lg">
                &nbsp;*
              </span>
            </span>

            <input
              type="text"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);

                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter Expense Category"
              className="w-full outline-none border-b-2 text-gray-900"
            />

            {error && (
              <p className="text-red-500 text-xs mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Expense Type */}
          <div
            style={{ width: "100%" }}
            className="flex flex-col"
          >
            <span className="active">
              Expense Type
              <span className="text-red-500 font-bold text-lg">
                &nbsp;*
              </span>
            </span>

            <select
              value={expenseType}
              onChange={(e) =>
                setExpenseType(e.target.value)
              }
              className="w-full outline-none border-b-2 text-gray-900 bg-white"
              style={{ padding: "4px 0" }}
            >
              <option value="Direct Expense">
                Direct Expense
              </option>

              <option value="Indirect Expense">
                Indirect Expense
              </option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 rounded-md text-white"
            style={{
              backgroundColor: "#4CA1AF",
            }}
          >
            {isLoading ? "Updating..." : "Update"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}