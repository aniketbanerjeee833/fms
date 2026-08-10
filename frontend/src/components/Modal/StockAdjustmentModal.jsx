

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
    itemApi,
  useAddStockAdjustmentMutation,
  useEditStockAdjustmentMutation,
} from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";

export default function StockAdjustmentModal({
  itemDetails,
  editingAdjustment = null,
  onClose,
  onSave,
}) {
const dispatch = useDispatch();
  const isEditMode = !!editingAdjustment;

  const hasPrimary = !!itemDetails?.Primary_Unit;
  const hasSecondary = !!itemDetails?.Secondary_Unit;
  const showUnitDropdown = hasPrimary;

  const unitOptions = hasSecondary
    ? [itemDetails.Primary_Unit, itemDetails.Secondary_Unit]
    : hasPrimary
    ? [itemDetails.Primary_Unit]
    : [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset
    
  } = useForm({
    defaultValues: {
      Adjustment_Type: editingAdjustment?.Adjustment_Type || "Add",
      Quantity: editingAdjustment?.Quantity ? String(editingAdjustment.Quantity) : "",
      Selected_Unit: editingAdjustment?.Selected_Unit || itemDetails?.Primary_Unit || "",
      At_Price: editingAdjustment?.At_Price ? String(editingAdjustment.At_Price) : "",
      Details: editingAdjustment?.Details || "",
      // Adjustment_Date is already a clean "YYYY-MM-DD" string once the
      // backend uses dateStrings:true or formatDateOnly() — no .slice() needed
      Adjustment_Date: editingAdjustment?.Adjustment_Date || new Date().toISOString().slice(0, 10),
    },
  });
console.log(editingAdjustment)
  useEffect(() => {
    if (editingAdjustment) {
      reset({
        Adjustment_Type: editingAdjustment.Adjustment_Type || "Add",
        Quantity: editingAdjustment.Quantity ? String(editingAdjustment.Quantity) : "",
        Selected_Unit: editingAdjustment.Selected_Unit || itemDetails?.Primary_Unit || "",
        At_Price: editingAdjustment.At_Price ? String(editingAdjustment.At_Price) : "",
        Details: editingAdjustment.Details || "",
        Adjustment_Date: editingAdjustment.Adjustment_Date || new Date().toISOString().slice(0, 10),
      });
    }
  }, [editingAdjustment, itemDetails, reset]);

  const adjustmentType = watch("Adjustment_Type");

  const [addStockAdjustment, { isLoading: isAdding }] = useAddStockAdjustmentMutation();
  const [editStockAdjustment, { isLoading: isEditing }] = useEditStockAdjustmentMutation();
  const isSaving = isAdding || isEditing;

  const onSubmit = async (formData) => {
    const qty = Number(formData.Quantity);

    if (!formData.Quantity || !Number.isFinite(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (showUnitDropdown && !formData.Selected_Unit) {
      toast.error("Please select a unit");
      return;
    }

    const payload = {
      Item_Id: itemDetails.Item_Id,
      Adjustment_Type: formData.Adjustment_Type,
      Quantity: qty,
      Selected_Unit: showUnitDropdown ? formData.Selected_Unit : null,
      At_Price: formData.At_Price ? Number(formData.At_Price) : null,
      Details: formData.Details?.trim() || null,
      Adjustment_Date: formData.Adjustment_Date,
    };

    try {
      let res;
      if (isEditMode) {
        res = await editStockAdjustment({
          Item_Id: itemDetails.Item_Id,
          id: editingAdjustment.id,
          ...payload,
        }).unwrap();
      } else {
        res = await addStockAdjustment(payload).unwrap();
      }
      dispatch(itemApi.util.invalidateTags(["Item"]));
      toast.success(res?.message || `Stock ${isEditMode ? "adjustment updated" : "adjusted"} successfully`);
      onSave?.(res?.adjustment || payload);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save stock adjustment");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        marginTop: "60px",
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6" style={{ paddingBottom: 10 }}>
          <div className="flex items-center gap-6">
            <h4 className="text-xl font-semibold text-gray-900" style={{ margin: 0 }}>
              Stock Adjustment
            </h4>

            <div className="flex items-center gap-2">
              <span
                style={{ fontSize: 14, fontWeight: 500, color: "#4CA1AF", cursor: "pointer" }}
                onClick={() => setValue("Adjustment_Type", "Add")}
              >
                Add Stock
              </span>

              <input type="hidden" {...register("Adjustment_Type")} />

              <button
                type="button"
                onClick={() =>
                  setValue("Adjustment_Type", adjustmentType === "Add" ? "Reduce" : "Add")
                }
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#4CA1AF",
                  position: "relative",
                  transition: "background-color 0.15s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: adjustmentType === "Add" ? 2 : 22,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "white",
                    transition: "left 0.15s",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                />
              </button>

              <span
                style={{ fontSize: 14, fontWeight: 500, color: "#4CA1AF", cursor: "pointer" }}
                onClick={() => setValue("Adjustment_Type", "Reduce")}
              >
                Reduce Stock
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "#6b7280" }}
          >
            ✕
          </button>
        </div>

        {/* ── Item Name + Adjustment Date row ── */}
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4"
          style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 16 }}
        >
          <div>
            <p className="text-sm text-gray-500" style={{ margin: 0 }}>Item Name</p>
            <p className="font-semibold text-gray-900" style={{ margin: 0, fontSize: 16 }}>
              {itemDetails?.Item_Name}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">Adjustment Date</span>
            <input
              type="date"
              {...register("Adjustment_Date", { required: true })}
              className="w-full outline-none border-b-2 text-gray-900"
             // style={{ borderColor: "#d1d5db" }}
            />
          </div>
        </div>

        {/* ── Total Qty + Unit dropdown + At Price ── */}
        <div className="row gap-2">
          <div className="flex items-stretch gap-1 input-field col s6" style={{ width: "50%" }}>
            <input
              type="text"
              placeholder="Total Qty"
              className="w-full outline-none border-b-2 text-gray-900"
              {...register("Quantity", { required: true })}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9.]/g, "");
              }}
            />

            {showUnitDropdown && (
              <select
                {...register("Selected_Unit")}
                className="border rounded-md px-2 py-2 text-sm outline-none"
                style={{ borderColor: "#d1d5db", minWidth: 80 }}
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="input-field col s6" style={{ width: "50%" }}>
            <input
              type="text"
              placeholder="At Price"
              className="w-full outline-none border-b-2 text-gray-900"
              {...register("At_Price")}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9.]/g, "");
              }}
            />
          </div>
        </div>

        <div className="row gap-2">
          <div className="input-field col s6" style={{ width: "50%" }}>
            <input
              type="text"
              placeholder="Details"
              className="w-full outline-none border-b-2 text-gray-900"
              {...register("Details")}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 rounded-md text-white font-semibold"
            style={{
              backgroundColor: "#4CA1AF",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}