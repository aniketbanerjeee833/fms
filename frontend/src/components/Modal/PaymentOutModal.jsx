import { useState } from "react";

export default function PaymentOutModal({
  mode = "add",           // "add" | "edit" | "view"
  initialData = null,     // pass existing payment-out record for edit/view
  parties = [],            // party dropdown options you already fetch
  //paymentTypes = [],        // e.g. ["AEPL", "Cash", "UPI", ...]
  onClose,
  onSave,                  // (formData) => call your existing save/update controller
  isSaving = false,
}) {

    console.log(parties)
  const isView = mode === "view";

  const [form, setForm] = useState({
    Party: initialData?.Party || "",
    ReceiptNo: initialData?.ReceiptNo || "",
    PaymentType: initialData?.PaymentType || "",
    Date: initialData?.Date || new Date().toISOString().slice(0, 10),
    ReferenceNo: initialData?.ReferenceNo || "",
    Paid: initialData?.Paid || "",
  });

  const handleChange = (field, value) => {
    if (isView) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form); // wire to your existing add/edit controller call
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
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6"
          style={{ marginBottom: "20px", paddingBottom: "10px" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">
            {mode === "add" ? "Payment-Out" : mode === "edit" ? "Edit Payment-Out" : "View Payment-Out"}
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

        {/* Fields — 2 column grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Row 1 */}
          <div className="flex flex-col">
            <span className="active">
              Party
              <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
            </span>
            <select
              value={form.Party}
              disabled={isView}
              onChange={(e) => handleChange("Party", e.target.value)}
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            >
              <option value="">Select Party</option>
              {parties.map((p) => (
                <option key={p.Party_Id} value={p.Party_Id}>
                  {p.Party_Name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="active">Receipt No</span>
            <input
              type="text"
              value={form.ReceiptNo}
              readOnly={isView}
              onChange={(e) => handleChange("ReceiptNo", e.target.value)}
              placeholder="Enter receipt no."
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            />
          </div>

          {/* Row 2 */}
          {/* <div className="flex flex-col">
            <span className="active">Payment Type</span>
            <select
              value={form.PaymentType}
              disabled={isView}
              onChange={(e) => handleChange("PaymentType", e.target.value)}
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            >
              <option value="">Select Payment Type</option>
              {paymentTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div> */}
          
                          {/* <div className="flex flex-col  w-full mt-3"> */}
                          <div className="flex flex-col">
                            <span className="active">Payment Type</span>

                            <select 
                            >
                              <option value="">Select Payment Type</option>
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Neft">Neft</option>
                            </select>
                            {/* {errors?.Payment_Type && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors?.Payment_Type?.message}
                              </p>
                            )} */}
                          </div>




                          {/* {(paymentType === "Cheque" || paymentType === "Neft") && (

                            <div className="flex flex-col w-full ">
                              <span className="active whitespace-nowrap">
                                {paymentType === "Cheque" ? "Cheque Number" : "NEFT Reference Number"}
                              </span>

                              <input
                                type="text"
                                id="Reference_Number"
                                {...register("Reference_Number")}
                                placeholder={`Enter ${paymentType} number`}
                                className="w-full outline-none border-b-2 text-gray-900"
                              />

                              {errors?.Reference_Number && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors?.Reference_Number?.message}
                                </p>
                              )}
                            </div>

                          )} */}
                     

          <div className="flex flex-col">
            <span className="active">Date</span>
            <input
              type="date"
              value={form.Date}
              readOnly={isView}
              onChange={(e) => handleChange("Date", e.target.value)}
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            />
          </div>

          {/* Row 3 */}
          <div className="flex flex-col">
            <span className="active">Reference No.</span>
            <input
              type="text"
              value={form.ReferenceNo}
              readOnly={isView}
              onChange={(e) => handleChange("ReferenceNo", e.target.value)}
              placeholder="Reference No."
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            />
          </div>

          <div className="flex flex-col">
            <span className="active">Paid</span>
            <input
              type="number"
              value={form.Paid}
              readOnly={isView}
              onChange={(e) => handleChange("Paid", e.target.value)}
              className="w-full outline-none border-b-2 text-gray-900 py-1"
            />
          </div>
        </div>

        {/* Footer — Save only, no Print */}
        {!isView && (
          <div className="flex justify-end mt-4 gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
              style={{ backgroundColor: "#4CA1AF" }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}