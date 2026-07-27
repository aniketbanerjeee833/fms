import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
    useCreateBankAccountMutation,
    useEditBankAccountMutation,
} from "../../redux/api/bankAccountApi";

/* ═══════════════════════════════════════════════════════════════════
   USAGE:

   const [bankModal, setBankModal] = useState({ open: false, mode: "add", data: null });

   // Add:
   onClick={() => setBankModal({ open: true, mode: "add", data: null })}

   // Edit (pass bank object from left panel):
   const handleEdit = (bank) => setBankModal({ open: true, mode: "edit", data: bank });

   {bankModal.open && (
     <BankAccountModal
       mode={bankModal.mode}
       data={bankModal.data}
       onClose={() => setBankModal({ open: false, mode: "add", data: null })}
     />
   )}
═══════════════════════════════════════════════════════════════════ */

export default function BankAccountModal({ mode = "add", data = null, onClose }) {
  const isEdit = mode === "edit";
 
  const [createBankAccount, { isLoading: isCreating }] = useCreateBankAccountMutation();
  const [editBankAccount,   { isLoading: isEditing   }] = useEditBankAccountMutation();
  const isLoading = isCreating || isEditing;
 
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      accountDisplayName: "",
      bankName:           "",
      accountHolderName:  "",
      openingBalance:     "",
      asOfDate:           new Date().toISOString().slice(0, 10),
      accountNumber:      "",
      ifscCode:           "",
      upiId:              "",
    },
  });
 
  useEffect(() => {
    if (isEdit && data) {
      reset({
        accountDisplayName: data.Account_Display_Name || "",
        bankName:           data.Bank_Name            || "",
        accountHolderName:  data.Account_Holder_Name  || "",
        openingBalance:     data.Opening_Balance != null ? String(data.Opening_Balance) : "",
        asOfDate:           data.As_Of_Date
          ? new Date(data.As_Of_Date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        accountNumber:      data.Account_Number || "",
        ifscCode:           data.IFSC_Code      || "",
        upiId:              data.UPI_Id         || "",
      });
    }
  }, [isEdit, data, reset]);
 
  const onSubmit = async (formData) => {
    try {
      if (isEdit) {
        await editBankAccount({   Bank_Account_Id: data.Bank_Account_Id, ...formData }).unwrap();
        toast.success("Bank account updated!");
      } else {
        await createBankAccount(formData).unwrap();
        toast.success("Bank account created!");
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Something went wrong");
    }
  };
 
  /* digits + 2 decimal places */
  const numericInput = (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
    if (val.includes(".")) {
      const [int, dec] = val.split(".");
      val = int + "." + dec.slice(0, 2);
    }
    e.target.value = val;
  };
 
  return (
    <div
      style={{
        marginTop:       "50px",
        position:        "fixed",
        inset:           0,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter:  "blur(4px)",
        zIndex:          50,
        padding:         "1rem",
      }}
    >
      {/* wider modal — max-w-2xl */}
      <div
        className="bg-white w-full rounded-lg shadow-lg p-6"
        style={{ maxWidth: "42rem", maxHeight: "90vh", overflowY: "auto" }}
      >
 
        {/* HEADER */}
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit Bank Account" : "Add Bank Account"}
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: "transparent", height: "30px", width: "30px", fontSize: "20px" }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
 
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-5">
 
            {/* ── ROW 1 (3 cols) — Display Name · Bank Name · Holder Name ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 
              <div className="flex flex-col">
                <span className="active mb-1">
                  Account Display Name
                  <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g. SBI Current"
                  {...register("accountDisplayName", { required: "Display Name is required" })}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
                {errors?.accountDisplayName && (
                  <p className="text-red-500 text-xs mt-1">{errors.accountDisplayName.message}</p>
                )}
              </div>
 
              <div className="flex flex-col mt-1">
                <span className="active mb-1">Bank Name</span>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  {...register("bankName")}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
              <div className="flex flex-col">
                <span className="active mb-1">Account Holder Name</span>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  {...register("accountHolderName")}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
            </div>
 
            {/* ── ROW 2 (3 cols) — Opening Balance · As Of Date · Account Number ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 
              <div className="flex flex-col">
                <span className="active mb-1">Opening Balance</span>
                <div
                  className="flex items-center border-b-2 border-gray-300 gap-1"
                //   style={{ paddingBottom: "2px" }}
                >
                  <span className="text-gray-500 font-medium">₹</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    {...register("openingBalance")}
                    onInput={numericInput}
                    className="w-full outline-none text-gray-900"
                    style={{ border: "none", marginBottom: 0 }}
                  />
                </div>
              </div>
 
              <div className="flex flex-col">
                <span className="active mb-1">As Of Date</span>
                <input
                  type="date"
                  {...register("asOfDate")}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
              <div className="flex flex-col">
                <span className="active mb-1">Account Number</span>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  {...register("accountNumber")}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
            </div>
 
            {/* ── ROW 3 (2 cols) — IFSC Code · UPI ID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 
              <div className="flex flex-col">
                <span className="active mb-1">IFSC Code</span>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  {...register("ifscCode")}
                  onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                  maxLength={11}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
              <div className="flex flex-col">
                <span className="active mb-1">UPI ID</span>
                <input
                  type="text"
                  placeholder="e.g. yourname@sbi"
                  {...register("upiId")}
                  className="w-full outline-none border-b-2 text-gray-900"
                  style={{ marginBottom: 0 }}
                />
              </div>
 
            </div>
 
          </div>
 
          {/* FOOTER */}
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