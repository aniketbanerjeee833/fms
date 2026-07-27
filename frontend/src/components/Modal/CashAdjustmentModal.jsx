import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { useCreateAdjustmentMutation, useEditAdjustmentMutation } from "../../redux/api/cashInHandApi";

/* ═══════════════════════════════════════════════════════════════════
   USAGE in CashInHand.jsx:

   const [cashAdjustmentModal, setCashAdjustmentModal] = useState({
     open: false,
     mode: "add",    // "add" | "edit"
     data: null,     // null for add, row object for edit
   });

   // Open for ADD (Adjust Cash button):
   onClick={() => setCashAdjustmentModal({ open: true, mode: "add", data: null })}

   // Open for EDIT (edit icon on adjustment row):
   onClick={() => setCashAdjustmentModal({ open: true, mode: "edit", data: row })}

   // In JSX:
   {cashAdjustmentModal.open && (
     <CashAdjustmentModal
       mode={cashAdjustmentModal.mode}
       data={cashAdjustmentModal.data}
       onClose={() => setCashAdjustmentModal({ open: false, mode: "add", data: null })}
     />
   )}
═══════════════════════════════════════════════════════════════════ */
const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function CashAdjustmentModal({ mode = "add", data = null, onClose, currentBalance=0 }) {
    const isEdit = mode === "edit";

    const [createAdjustment, { isLoading: isCreating }] = useCreateAdjustmentMutation();
    const [editAdjustment, { isLoading: isEditing }] = useEditAdjustmentMutation();


    //   const currentBalance = balanceData?.amount || 0;
    const isLoading = isCreating || isEditing;

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            type: "add",
            amount: "",
            adjustment_date: new Date().toISOString().slice(0, 10),
            description: "",
        },
    });

    const watchType = useWatch({ control, name: "type" });
    const watchAmount = useWatch({ control, name: "amount" });

    const enteredAmount = parseFloat(watchAmount) || 0;
    //   const updatedCash   = watchType === "add" || watchType==="edit"
    //     ? currentBalance + enteredAmount
    //     : currentBalance - enteredAmount;
    const oldAmount = Number(data?.amount || 0);

    let updatedCash = currentBalance;

    if (!isEdit) {
        updatedCash =
            watchType === "add"
                ? currentBalance + enteredAmount
                : currentBalance - enteredAmount;
    } else {
        // Remove previous adjustment
        const balanceWithoutOld =
            data.type === "add"
                ? currentBalance - oldAmount
                : currentBalance + oldAmount;

        // Apply new adjustment
        updatedCash =
            watchType === "add"
                ? balanceWithoutOld + enteredAmount
                : balanceWithoutOld - enteredAmount;
    }

    /* prefill when editing */
    useEffect(() => {
        if (isEdit && data) {
            reset({
                type: data.type || "add",
                amount: data.amount || "",
                adjustment_date: data.adjustment_date
                    ? new Date(data.adjustment_date).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10),
                description: data.description || "",
            });
        }
    }, [isEdit, data, reset]);

    const onSubmit = async (formData) => {
        try {
            if (isEdit) {
                await editAdjustment({ id: data.id, ...formData }).unwrap();
                toast.success("Adjustment updated successfully!");
            } else {
                await createAdjustment(formData).unwrap();
                toast.success("Cash adjusted successfully!");
            }
            onClose();
        } catch (err) {
            const msg = err?.data?.message || err?.message || "Something went wrong";
            toast.error(msg);
        }
    };
console.log(updatedCash)
    return (
        <div
            style={{
                marginTop: "50px",
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                padding: "1rem",
            }}
        >
            <div
                className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 overflow-hidden"
                style={{ maxHeight: "90vh" }}
            >
                {/* ── HEADER ── */}
                <div
                    className="flex justify-between items-center"
                    style={{ marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}
                >
                    <h4 className="text-xl font-semibold text-gray-900">
                        {isEdit ? "Edit Adjustment" : "Adjust Cash"}
                    </h4>
                    <button
                        type="button"
                        style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* ── FORM ── */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-5">

                        {/* ROW 1 — Adjustment Type + Amount */}
                        <div className="flex flex-row gap-4">

                            {/* Adjustment Type */}
                            <div className="flex flex-col w-1/2">
                                <span className="active mb-1">
                                    Adjustment
                                    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <select
                                    {...register("type", { required: "Adjustment type is required" })}
                                    className="w-full outline-none border-b-2 text-gray-900 bg-white py-1"
                                    style={{ marginBottom: 0 }}
                                >
                                    <option value="add">Add Cash</option>
                                    <option value="reduce">Reduce Cash</option>
                                </select>
                                {errors?.type && (
                                    <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="flex flex-col w-1/2">
                                <span className="active mb-1">
                                    Enter Amount
                                    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    {...register("amount", {
                                        required: "Amount is required",
                                        validate: (val) => {
                                            const n = Number(val);
                                            if (isNaN(n) || n <= 0) return "Amount must be greater than 0";
                                            return true;
                                        },
                                    })}
                                    onInput={(e) => {
                                        let val = e.target.value.replace(/[^0-9.]/g, "");
                                        const parts = val.split(".");
                                        if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                                        if (val.includes(".")) {
                                            const [int, dec] = val.split(".");
                                            val = int + "." + dec.slice(0, 2);
                                        }
                                        e.target.value = val;
                                    }}
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{ marginBottom: 0 }}
                                />
                                {errors?.amount && (
                                    <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                                )}
                           

                            <div className="mt-2">
                                <span className="text-sm text-gray-500">
                                    Updated Cash:
                                </span>
                                <span
                                    className="ml-2 font-semibold"
                                    style={{
                                        color: updatedCash < 0 ? "#ef4444" : "#4CA1AF",
                                    }}
                                >
                                    ₹ {fmt(updatedCash)}
                                </span>
                            </div>
                             </div>

                        </div>

                        {/* ROW 2 — Adjustment Date + Description */}
                        <div className="flex flex-row gap-4">

                            {/* Adjustment Date */}
                            <div className="flex flex-col w-1/2 ">
                                <span className="active mb-1">
                                    Adjustment Date
                                    <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <input
                                    type="date"
                                    {...register("adjustment_date", { required: "Date is required" })}
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{ marginBottom: 0 }}
                                />
                                {errors?.adjustment_date && (
                                    <p className="text-red-500 text-xs mt-1">{errors.adjustment_date.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="flex flex-col w-1/2 mt-2">
                                <span className="active mb-1">Description</span>
                                <input
                                    type="text"
                                    placeholder="Optional note"
                                    {...register("description")}
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                        </div>

                    </div>

                    {/* ── FOOTER ── */}
                    <div className="flex justify-end mt-6 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2 rounded-md text-white"
                            style={{ backgroundColor: "#4CA1AF" }}
                        >
                            {isLoading ? "Saving..." : isEdit ? "Update" : "Save"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}