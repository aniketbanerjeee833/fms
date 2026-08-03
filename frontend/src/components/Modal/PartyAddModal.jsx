import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { partyFormSchema } from "../../schema/partyFormSchema";
import { useAddPartyMutation, useEditPartyMutation } from "../../redux/api/partyAPi";
import { partyApi } from "../../redux/api/partyAPi";

const ACCENT = "#4CA1AF";




const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default function PartyAddModal({ onClose, onSave, partyDetails, editingParty, restrictedMode = false }) {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const TABS = restrictedMode ? ["GST & Address"] : ["GST & Address", "Credit & Balance"];
  const [activeTab, setActiveTab] = useState("GST & Address");
  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [showBalanceType, setShowBalanceType] = useState(false);
  const [customLimit, setCustomLimit] = useState(false);
  const [defaultBillingIdx, setDefaultBillingIdx] = useState(null);
  const [defaultShippingIdx, setDefaultShippingIdx] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

  const [addParty, { isLoading: isAdding }] = useAddPartyMutation();
  const [updateParty, { isLoading: isUpdating }] = useEditPartyMutation();
  const isLoading = isAdding || isUpdating;
  //console.log(partyDetails, "partyDetails");
  /* ── form ── */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
        { Address_Type: "Billing", Address_Text: "", Is_Default: false },
        { Address_Type: "Shipping", Address_Text: "", Is_Default: false },
      ],
      Opening_Balance: "",
      Opening_Balance_Type: null,
      Opening_Balance_Date: new Date().toISOString().split("T")[0],
      Credit_Limit_Type: "No_Limit",
      Credit_Limit: "",
    },
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: "addresses",
  });

  const openingBalanceWatch = watch("Opening_Balance");
  const openingBalanceType = watch("Opening_Balance_Type");

  /* show balance type toggle when OB has a value */
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
  useEffect(() => {
    if (restrictedMode && activeTab !== "GST & Address") {
      setActiveTab("GST & Address");
    }
  }, [restrictedMode, activeTab]);
  /* prefill for edit */
  useEffect(() => {
    if (!editingParty || !partyDetails) return;

    setStateSearch(partyDetails.State ?? "");

    /* figure out default address indices */
    const addresses = partyDetails.addresses ?? [];
    const defBilling = addresses.findIndex((a) => a.Address_Type === "Billing" && a.Is_Default);
    const defShipping = addresses.findIndex((a) => a.Address_Type === "Shipping" && a.Is_Default);
    if (defBilling >= 0) setDefaultBillingIdx(defBilling);
    if (defShipping >= 0) setDefaultShippingIdx(defShipping);

    /* custom limit toggle */
    if (partyDetails.Credit_Limit_Type === "Custom") setCustomLimit(true);

    reset({
      Party_Name: partyDetails.Party_Name ?? "",
      GSTIN: partyDetails.GSTIN ?? "",
      Phone_Number: partyDetails.Phone_Number ?? "",
      State: partyDetails.State ?? "",
      Email_Id: partyDetails.Email_Id ?? "",
      Opening_Balance: partyDetails.Opening_Balance ?? "",
      Opening_Balance_Type: partyDetails.Opening_Balance_Type ?? null,
      Opening_Balance_Date: partyDetails.Opening_Balance_Date
        ? new Date(partyDetails.Opening_Balance_Date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      Credit_Limit_Type: partyDetails.Credit_Limit_Type ?? "No_Limit",
      Credit_Limit: partyDetails.Credit_Limit ?? "",
      addresses: addresses.length > 0 ? addresses : [
        { Address_Type: "Billing", Address_Text: "", Is_Default: false },
        { Address_Type: "Shipping", Address_Text: "", Is_Default: false },
      ],
    });
  }, [editingParty, partyDetails, reset]);

  /* ── default address helpers ── */
  const handleDefaultBilling = (selectedIndex) => {
    setDefaultBillingIdx(selectedIndex);
    const addresses = watch("addresses") || [];
    addresses.forEach((address, index) => {
      if (address.Address_Type === "Billing") {
        setValue(`addresses.${index}.Is_Default`, index === selectedIndex, { shouldDirty: true });
      }
    });
  };

  const handleDefaultShipping = (selectedIndex) => {
    setDefaultShippingIdx(selectedIndex);
    const addresses = watch("addresses") || [];
    addresses.forEach((address, index) => {
      if (address.Address_Type === "Shipping") {
        setValue(`addresses.${index}.Is_Default`, index === selectedIndex, { shouldDirty: true });
      }
    });
  };

  /* ── submit ── */
  const onSubmit = async (data) => {
    try {
      if (editingParty) {
        const res = await updateParty({ Party_Id: partyDetails.Party_Id, body: data }).unwrap();
        if (!res?.success) { toast.error("Failed to update party"); return; }
        toast.success("Party updated successfully!");
        dispatch(partyApi.util.invalidateTags(["Party"]));
        onSave?.(res);      // ⭐ ADD THIS
        onClose();

      } else {
        const res = await addParty({ body: data }).unwrap();
        console.log("addParty res", res);
        if (!res?.success) { toast.error("Failed to add party"); return; }
        toast.success("Party added successfully!");
        dispatch(partyApi.util.invalidateTags(["Party"]));
        //onSave(res?.Party_Name);
        onSave(res);
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Something went wrong");
    }
  };

  /* ── shared styles ── */
  const inputCls = "w-full outline-none border-b-2 border-gray-300 focus:border-[#4CA1AF] text-gray-900 py-1 bg-transparent transition-colors";
  const labelCls = "text-xs font-medium text-gray-500 mb-0.5";
  const formValues = watch();
  console.log("formValues", formValues);
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
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        className="bg-white w-full rounded-lg shadow-lg p-6 overflow-y-auto"
        style={{ maxWidth: "56rem", maxHeight: "90vh" }}
      >
        {/* ── HEADER ── */}
        <div className="flex justify-between items-center"
          style={{ marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
          <h4 className="text-xl font-semibold text-gray-900">
            {editingParty ? "Edit Party" : "Add New Party"}
          </h4>
          <button type="button" onClick={onClose}
            style={{ backgroundColor: "transparent", fontSize: "20px" }}
            className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <style>{`
          .pty-tab-active   { color: red; border-bottom: 2px solid red; font-weight: 600; background: white; }
          .pty-tab-inactive { color: #6b7280; border-bottom: 2px solid transparent; font-weight: 500; }
          .pty-tab-inactive:hover { color: #374151; }
          .pty-toggle {
            position: relative; width: 44px; height: 24px;
            background: #d1d5db; border-radius: 999px;
            cursor: pointer; transition: background 0.2s; flex-shrink: 0;
          }
          .pty-toggle.on { background: red; }
          .pty-toggle::after {
            content: ""; position: absolute; top: 3px; left: 3px;
            width: 18px; height: 18px; background: white; border-radius: 50%;
            transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.15);
          }
          .pty-toggle.on::after { transform: translateX(20px); }
        `}</style>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* ── TOP ROW: Party Name / GSTIN / Phone ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <span className={labelCls}>Party Name <span className="text-red-500">*</span></span>
              <input type="text" placeholder="Party Name" className={inputCls} disabled={restrictedMode} {...register("Party_Name")} />
              {errors?.Party_Name && <p className="text-red-500 text-xs mt-1">{errors.Party_Name.message}</p>}
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>GSTIN</span>
              <input type="text" maxLength={15} placeholder="GSTIN" className={inputCls}
                {...register("GSTIN")}
                onChange={(e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }}
              />
              {errors?.GSTIN && <p className="text-red-500 text-xs mt-1">{errors.GSTIN.message}</p>}
            </div>

            <div className="flex flex-col">
              <span className={labelCls}>Phone Number</span>
              <input type="tel" maxLength={10} placeholder="Phone Number" disabled={restrictedMode} className={inputCls}
                {...register("Phone_Number")}
                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10); }}
              />
              {errors?.Phone_Number && <p className="text-red-500 text-xs mt-1">{errors.Phone_Number.message}</p>}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="border-b border-gray-200 flex gap-0 mb-0">
            {TABS.map((tab) => (
              <button key={tab} type="button"
                style={{ background: "none", cursor: "pointer" }}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm transition-colors ${activeTab === tab ? "pty-tab-active" : "pty-tab-inactive"}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* ── TAB PANELS ── */}
          <div className="bg-gray-50 rounded-b-lg p-6">

            {/* ══ GST & ADDRESS ══ */}
            {activeTab === "GST & Address" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                {/* col 1 — State + Email */}
                <div className="flex flex-col gap-6">
                  {/* State searchable dropdown */}
                  <div className="flex flex-col relative" ref={dropdownRef}>
                    <span className={labelCls}>State</span>
                    <input type="text" value={stateSearch}
                      onClick={() => setStateOpen((p) => !p)}
                      onChange={(e) => { setStateSearch(e.target.value); setStateOpen(true); }}
                      placeholder="Search state"
                      className={inputCls}
                    />
                    {stateOpen && (
                      <div className="absolute top-full left-0 z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
                          .map((s, i) => (
                            <div key={i} onClick={() => { setStateSearch(s); setValue("State", s); setStateOpen(false); }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{s}</div>
                          ))}
                        {STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                          <p className="px-3 py-2 text-gray-400 text-sm">No state found</p>
                        )}
                      </div>
                    )}
                    <input type="hidden" {...register("State")} />
                    {errors?.State && <p className="text-red-500 text-xs mt-1">{errors.State.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <span className={labelCls}>Email</span>
                    <input type="text" placeholder="example@email.com" className={inputCls} disabled={restrictedMode} {...register("Email_Id")} />
                    {errors?.Email_Id && <p className="text-red-500 text-xs mt-1">{errors.Email_Id.message}</p>}
                  </div>
                </div>

                {/* col 2 — Billing Addresses */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Billing Addresses</span>
                    <button type="button"
                      style={{ color: ACCENT, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                      onClick={() => appendAddress({ Address_Type: "Billing", Address_Text: "", Is_Default: false })}>
                      + Add Billing
                    </button>
                  </div>

                  {addressFields.map((field, i) => {
                    if (field.Address_Type !== "Billing") return null;
                    const isDefault = defaultBillingIdx === i;
                    return (
                      <div key={field.id}
                        onClick={() => handleDefaultBilling(i)}
                        className="flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all"
                        style={{ borderColor: isDefault ? ACCENT : "#e5e7eb", backgroundColor: isDefault ? "#eaf6f7" : "white" }}>
                        <div className="flex-shrink-0 rounded-full"
                          style={{ width: 10, height: 10, backgroundColor: isDefault ? ACCENT : "#d1d5db", marginTop: 6 }} />
                        <textarea
                          rows={3}
                          placeholder="Billing Address"
                          className="flex-1 min-h-[70px] resize-y"
                          style={{
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            fontSize: 13,
                          }}
                          {...register(`addresses.${i}.Address_Text`)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {/* <textarea rows={2} placeholder="Billing Address"
                          style={{  flex: 1, border: "none", background: "transparent", outline: "none",
                             fontSize: 13,minHeight: "44px" }}
                          {...register(`addresses.${i}.Address_Text`)}
                          onClick={(e) => e.stopPropagation()}
                          onInput={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                          }}
                        /> */}
                        {addressFields.filter((f) => f.Address_Type === "Billing").length > 1 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeAddress(i); }}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
                        )}
                        {isDefault && (
                          <span className="text-xs font-medium flex-shrink-0" style={{ color: ACCENT, marginTop: 4 }}>Default</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* col 3 — Shipping Addresses */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Shipping Addresses</span>
                    <button type="button"
                      style={{ color: ACCENT, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
                      onClick={() => appendAddress({ Address_Type: "Shipping", Address_Text: "", Is_Default: false })}>
                      + Add Shipping
                    </button>
                  </div>

                  {addressFields.map((field, i) => {
                    if (field.Address_Type !== "Shipping") return null;
                    const isDefault = defaultShippingIdx === i;
                    return (
                      <div key={field.id}
                        onClick={() => handleDefaultShipping(i)}
                        className="flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all"
                        style={{ borderColor: isDefault ? ACCENT : "#e5e7eb", backgroundColor: isDefault ? "#eaf6f7" : "white" }}>
                        <div className="flex-shrink-0 rounded-full"
                          style={{ width: 10, height: 10, backgroundColor: isDefault ? ACCENT : "#d1d5db", marginTop: 6 }} />
                        <textarea rows={2} placeholder="Shipping Address"
                          style={{ resize: "none", flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13 }}
                          {...register(`addresses.${i}.Address_Text`)}
                          onClick={(e) => e.stopPropagation()} />
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); removeAddress(i); }}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>✕</button>
                        {isDefault && (
                          <span className="text-xs font-medium flex-shrink-0" style={{ color: ACCENT, marginTop: 4 }}>Default</span>
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
                    <input type="text" placeholder="0.00" className={inputCls}
                      {...register("Opening_Balance")}
                      onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={labelCls}>As Of Date</span>
                    <input type="date" className={inputCls} {...register("Opening_Balance_Date")} />
                  </div>
                </div>

                {/* To Pay / To Receive */}
                {showBalanceType && (
                  <div className="flex flex-col gap-2">
                    <span className={labelCls}>Balance Type</span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="checkbox"
                          checked={openingBalanceType === "To_Pay"}
                          onChange={(e) => setValue("Opening_Balance_Type", e.target.checked ? "To_Pay" : null, { shouldDirty: true, shouldValidate: true })}
                        />
                        To Pay
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="checkbox"
                          checked={openingBalanceType === "To_Receive"}
                          onChange={(e) => setValue("Opening_Balance_Type", e.target.checked ? "To_Receive" : null, { shouldDirty: true, shouldValidate: true })}
                        />
                        To Receive
                      </label>
                    </div>
                    {errors?.Opening_Balance_Type && (
                      <p className="text-red-500 text-xs">{errors.Opening_Balance_Type.message}</p>
                    )}
                  </div>
                )}

                {/* Credit Limit toggle */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Credit Limit</span>
                    <span className={`text-sm ${!customLimit ? "font-medium text-gray-700" : "text-gray-400"}`}>No Limit</span>
                    <div className={`pty-toggle ${customLimit ? "on" : ""}`}
                      onClick={() => {
                        const next = !customLimit;
                        setCustomLimit(next);
                        setValue("Credit_Limit_Type", next ? "Custom" : "No_Limit", { shouldDirty: true, shouldValidate: true });
                        if (!next) setValue("Credit_Limit", "", { shouldDirty: true, shouldValidate: true });
                      }} />
                    <span className={`text-sm ${customLimit ? "font-medium text-gray-700" : "text-gray-400"}`}>Custom Limit</span>
                  </div>

                  {customLimit && (
                    <div className="flex flex-col max-w-xs">
                      <span className={labelCls}>Credit Limit Amount</span>
                      <input type="text" placeholder="Enter credit limit" className={inputCls}
                        {...register("Credit_Limit")}
                        onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ""); }}
                      />
                      {errors?.Credit_Limit && <p className="text-red-500 text-xs mt-1">{errors.Credit_Limit.message}</p>}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700">
              Cancel
            </button>
            <button type="button" disabled={isLoading}
              onClick={() => editingParty ? setConfirmModal(true) : handleSubmit(onSubmit)()}
              className="px-5 py-2 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: ACCENT }}>
              {isLoading ? "Saving..." : editingParty ? "Update" : "Save"}
            </button>
          </div>

        </form>
      </div>

      {/* ── CONFIRM EDIT MODAL ── */}
      {confirmModal && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 200,
        }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-center text-red-600 mb-4">
              Are you sure you want to update this Party?
            </h3>
            <div className="flex justify-center gap-4">
              <button type="button"
                onClick={() => { setConfirmModal(false); handleSubmit(onSubmit)(); }}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: ACCENT }}>
                {isUpdating ? "Updating..." : "Yes"}
              </button>
              <button type="button" onClick={() => setConfirmModal(false)}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}