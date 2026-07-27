import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

/**
 * PaymentInModal
 *
 * Mandatory fields (must match backend):
 *   Party_Id, Payment_Date, Payment_Type, Received
 *
 * Backend check being satisfied:
 *   const { Party_Id, Receipt_No, Payment_Date, Payment_Type, Received } = req.body;
 *   if (!Party_Id || !Payment_Date || !Payment_Type || !Received) { ... }
 */
export default function PaymentInModal({
  mode = "add",              // "add" | "edit" | "view"
  initialData = null,        // existing payment-in record for edit/view
  parties = [],               // array of { Party_Id, Party_Name, Phone_Number, GSTIN } (or { parties: [...] })
  onClose,
  onSave, 
  banks,  
  PartyAddModal,               // optional: pass your own <AddParty> component in as a prop
  isSaving = false,
}) {
  const isView = mode === "view";
  console.log(initialData);
  // Normalize parties prop - accepts either an array or { parties: [...] }
  const partyList = Array.isArray(parties) ? parties : parties?.parties || [];

  const formatDateForInput = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      Party_Id: initialData?.Party_Id || "",
      Party_Name: initialData?.Party_Name || "",
      Receipt_No: initialData?.Receipt_No || "",
      Payment_Type: initialData?.Payment_Type || "",
      Bank_Account_Id: initialData?.Bank_Account_Id || "",

      Payment_Date: formatDateForInput(initialData?.Payment_Date) || "",

      Reference_No: initialData?.Reference_No || "",
      Received: initialData?.Received ?? "",
    },
    mode: "onSubmit",
  });

  const paymentType = watch("Payment_Type");

  const [open, setOpen] = useState(false);
  const [partySearch, setPartySearch] = useState(initialData?.Party_Name || "");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const wrapperRef = useRef(null);

  // Close the party dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredParties = partyList.filter(
    (p) =>
      p?.Party_Name?.toLowerCase()?.includes(partySearch.toLowerCase()) ||
      p?.Phone_Number?.includes(partySearch)
  );

  const selectParty = (party) => {
    setPartySearch(party.Party_Name);
    setValue("Party_Id", party.Party_Id, { shouldValidate: true });
    setValue("Party_Name", party.Party_Name, { shouldValidate: true });
    setOpen(false);
  };

  const handleAddPartyResult = (newParty) => {
    // newParty expected shape: { Party_Id, Party_Name } - adjust to whatever your AddParty modal returns
    if (newParty?.Party_Id) {
      selectParty(newParty);
    } else if (typeof newParty === "string") {
      // fallback if only a name string comes back
      setPartySearch(newParty);
      setValue("Party_Name", newParty, { shouldValidate: true });
    }
    setShowPartyModal(false);
  };

  const formValues = watch();
  console.log(formValues);
  const onSubmit = (data) => {
    if (isView) return;
    onSave(data);
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
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6"
          style={{ marginBottom: "20px", paddingBottom: "10px" }}
        >
          <h4 className="text-xl font-semibold text-gray-900">
            {mode === "add" ? "Payment-In" : mode === "edit" ? "Edit Payment-In" : "View Payment-In"}
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

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Fields — 2 column grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Party (searchable combobox) */}
            <div
              ref={wrapperRef}
              className="flex flex-col relative mt-2 gap-2 party-class"
              style={{ marginBottom: "0px", marginTop: "0px" }}
            >
              <span className="whitespace-nowrap active">
                Party
                <span className="text-red-500">&nbsp;*</span>
              </span>

              {/* Hidden field registered so RHF validates Party_Id */}
              <input
                type="hidden"
                {...register("Party_Id", { required: "Party is required" })}
              />

              <div className="relative w-full">
                <div
                  className="flex flex-row border rounded-md bg-white cursor-pointer"
                  onClick={() => !isView && setOpen((prev) => !prev)}
                >
                  <input
                    type="text"
                    id="Party_Name"
                    value={partySearch}
                    disabled={isView}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPartySearch(value);
                      // typing again invalidates any previously-selected party id
                      setValue("Party_Id", "", { shouldValidate: false });
                      setValue("Party_Name", value, { shouldValidate: false });
                      setOpen(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isView) setOpen(true);
                    }}
                    placeholder="Search By Name/Phone"
                    className="w-full outline-none py-1 px-2 text-gray-900"
                    style={{
                      marginBottom: 0,
                      marginTop: "4px",
                      border: "none",
                      borderBottom: "none",
                      height: "2rem",
                    }}
                  />
                  <div className="w-10" />
                  {!isView && <span className="absolute right-0 px-2 top-1/3 text-gray-700">▼</span>}
                </div>

                {open && !isView && (
                  <div className="absolute z-20 flex flex-col mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <span
                      onClick={() => setShowPartyModal(true)}
                      className="block px-3 py-2 text-[#4CA1AF] font-medium hover:bg-gray-100 cursor-pointer"
                    >
                      + Add Party
                    </span>

                    {filteredParties.map((party, i) => (
                      <div
                        key={party.Party_Id ?? i}
                        onClick={() => selectParty(party)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {party.Party_Name} {party.Phone_Number ? `(${party.Phone_Number})` : ""}
                      </div>
                    ))}

                    {filteredParties.length === 0 && (
                      <p className="px-3 py-2 text-gray-500">No Party found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Add Party Modal - only rendered if a component was passed in */}
              {showPartyModal && PartyAddModal && (
                <PartyAddModal
                  onClose={() => setShowPartyModal(false)}
                  onSave={handleAddPartyResult}
                />
              )}

              {errors?.Party_Id && (
                <p className="text-red-500 text-xs mt-1">{errors.Party_Id.message}</p>
              )}
            </div>

            {/* Receipt No */}
            <div className="flex flex-col">
              <span className="active">Receipt No</span>
              <input
                type="text"
                readOnly={isView}
                placeholder="Enter receipt no."
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                {...register("Receipt_No")}
              />
            </div>

            {/* Payment Type */}
             <div className="flex flex-col">
                      <span className="active">Payment Type</span>

                      <select
                        id="Payment_Type"
                        value={
                          watch("Payment_Type") === "Bank"
                            ? `bank_${watch("Bank_Account_Id") || ""}`
                            : watch("Payment_Type") || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("bank_")) {
                            const bankId = val.replace("bank_", "");
                            setValue("Payment_Type", "Bank", { shouldValidate: true, shouldDirty: true });
                            setValue("Bank_Account_Id", Number(bankId), { shouldValidate: true, shouldDirty: true });
                          } else {
                            setValue("Payment_Type", val, { shouldValidate: true, shouldDirty: true });
                            setValue("Bank_Account_Id", null, { shouldValidate: true, shouldDirty: true });
                          }
                        }}
                      >
                        <option value="">Select Payment Type</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Neft">Neft</option>
                        {banks?.map((bank) => (
                          <option
                            key={bank.Bank_Account_Id}
                            value={`bank_${bank.Bank_Account_Id}`}
                          >
                            {bank.Account_Display_Name}
                          </option>
                        ))}
                       
                      </select>

                      {errors?.Payment_Type && (
                        <p className="text-red-500 text-xs mt-1">{errors?.Payment_Type?.message}</p>
                      )}
                      {errors?.Bank_Account_Id && (
                        <p className="text-red-500 text-xs mt-1">{errors?.Bank_Account_Id?.message}</p>
                      )}
                    </div>

            {/* Date */}
            <div className="flex flex-col">
              <span className="active">
                Date
                <span className="text-red-500">&nbsp;*</span>
              </span>
              <input
                type="date"
                readOnly={isView}
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                {...register("Payment_Date", { required: "Date is required" })}
              />
              {errors?.Payment_Date && (
                <p className="text-red-500 text-xs mt-1">{errors.Payment_Date.message}</p>
              )}
            </div>

            {/* Reference No. - required only for Cheque / Neft */}
            {(paymentType === "Cheque" || paymentType === "Neft") && (
              <div className="flex flex-col">
                <span className="active whitespace-nowrap">
                  {paymentType === "Cheque" ? "Cheque Number" : "NEFT Reference Number"}
                </span>
                <input
                  type="text"
                  readOnly={isView}
                  placeholder={`Enter ${paymentType} number`}
                  className="w-full outline-none border-b-2 text-gray-900 py-1"
                  {...register("Reference_No")}
                />
              </div>
            )}

            {/* Received */}
            <div className="flex flex-col">
              <span className="active">
                Received
                <span className="text-red-500">&nbsp;*</span>
              </span>
              <input
                type="number"
                step="0.01"
                readOnly={isView}
                className="w-full outline-none border-b-2 text-gray-900 py-1"
                {...register("Received", {
                  required: "Received amount is required",
                  validate: (v) =>
                    (v !== "" && !isNaN(v) && Number(v) > 0) || "Enter a valid amount greater than 0",
                })}
              />
              {errors?.Received && (
                <p className="text-red-500 text-xs mt-1">{errors.Received.message}</p>
              )}
            </div>
          </div>

          {/* Footer — Save only, no Print */}
          {!isView && (
            <div className="flex justify-end mt-4 gap-4">
              <button
                type="submit"
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
        </form>
      </div>
    </div>
  );
}