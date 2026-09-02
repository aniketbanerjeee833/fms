import { useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { useLazyGetItemsByCodeQuery } from "../../redux/api/itemApi";
import BarcodeScanner from "../Barcode/BarcodeScanner";
const ACCENT = "#4CA1AF"
export default function ScanCodeModal({ onClose, onSave }) {
  const [code, setCode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [isLooking, setIsLooking] = useState(false);
  const inputRef = useRef(null);

  // const [lookupItemByCode] = useLazyLookupItemByCodeQuery(); 
  const [getItemByCode] = useLazyGetItemsByCodeQuery();


  // const handleAddCode = async (scannedCode = code) => {
  //   const trimmed = scannedCode.trim();
  //   //const trimmed = code.trim();

  //   // =====================================================
  //   // IF CODE ALREADY EXISTS → INCREASE QUANTITY
  //   // =====================================================

  //   const existingItem = scannedItems.find(
  //     (it) =>
  //       it.Code?.trim()?.toLowerCase() ===
  //       trimmed.toLowerCase()
  //   );

  //   if (existingItem) {
  //     setScannedItems((prev) =>
  //       prev.map((it) =>
  //         it.Code?.trim()?.toLowerCase() ===
  //           trimmed.toLowerCase()
  //           ? {
  //             ...it,
  //             Quantity: Number(it.Quantity || 0) + 1,
  //           }
  //           : it
  //       )
  //     );

  //     setCode("");
  //     inputRef.current?.focus();
  //     return;
  //   }

  //   setIsLooking(true);


  //   try {
  //     // =====================================================
  //     // LOOK UP ITEM FROM BACKEND
  //     // =====================================================

  //     const response =
  //       await getItemByCode(trimmed).unwrap();

  //     const res = response?.item;

  //     // =====================================================
  //     // ITEM NOT FOUND
  //     // =====================================================

  //     if (!res?.Item_Id) {
  //       toast.error(
  //         `No item found for code "${trimmed}"`
  //       );

  //       setCode("");
  //       inputRef.current?.focus();
  //       return;
  //     }

  //     // =====================================================
  //     // ITEM FOUND
  //     // RETURN ALL USEFUL DETAILS TO PARENT
  //     // =====================================================

  //     const scannedItem = {
  //       // -------------------------------------------------
  //       // BARCODE / CODE
  //       // -------------------------------------------------

  //       Code: trimmed,

  //       // -------------------------------------------------
  //       // BASIC ITEM DETAILS
  //       // -------------------------------------------------

  //       Item_Id: res.Item_Id,
  //       Item_Name: res.Item_Name || "",
  //       Item_HSN: res.Item_HSN || "",
  //       Item_Category: res.Item_Category || "",
  //       Item_Type: res.Item_Type || "",

  //       // -------------------------------------------------
  //       // UNITS
  //       // -------------------------------------------------

  //       Primary_Unit: res.Primary_Unit || "",

  //       Primary_Unit_Id: res.Primary_Unit_Id || null,

  //       Secondary_Unit: res.Secondary_Unit || "",

  //       Secondary_Unit_Id: res.Secondary_Unit_Id || null,

  //       Conversion_Rate: res.Conversion_Rate ?? null,

  //       Available_Units:
  //         Array.isArray(res.Available_Units)
  //           ? res.Available_Units
  //           : [],

  //       // -------------------------------------------------
  //       // SALE DETAILS
  //       // Parent can use these for Sale/Sale Return
  //       // -------------------------------------------------

  //       Sale_Price:
  //         Number(res.Sale_Price) || 0,

  //       Sale_Price_Type: res.Sale_Price_Type || "With_Tax",

  //       Discount_On_Sale_Price: res.Discount_On_Sale_Price ?? "",

  //       Discount_Type_On_Sale_Price: res.Discount_Type_On_Sale_Price ||
  //         "Percentage",

  //       // -------------------------------------------------
  //       // PURCHASE DETAILS
  //       // Parent can use these for Purchase/Purchase Return
  //       // -------------------------------------------------

  //       Purchase_Price: Number(res.Purchase_Price) || 0,

  //       Purchase_Price_Type:
  //         res.Purchase_Price_Type ||
  //         "Without_Tax",

  //       // -------------------------------------------------
  //       // MRP
  //       // -------------------------------------------------

  //       MRP:
  //         res.MRP !== null &&
  //           res.MRP !== undefined
  //           ? Number(res.MRP)
  //           : null,

  //       Discount_On_MRP_For_Sale:
  //         res.Discount_On_MRP_For_Sale ??
  //         "",

  //       // -------------------------------------------------
  //       // STOCK
  //       // -------------------------------------------------

  //       Stock_Quantity:
  //         Number(res.Stock_Quantity || 0),

  //       // -------------------------------------------------
  //       // SCANNED QUANTITY
  //       // Default = 1
  //       // User can change it in modal
  //       // -------------------------------------------------

  //       Quantity: 1,
  //     };

  //     // =====================================================
  //     // ADD TO SCANNED LIST
  //     // =====================================================

  //     setScannedItems((prev) => [
  //       ...prev,
  //       scannedItem,
  //     ]);

  //     // =====================================================
  //     // CLEAR INPUT FOR NEXT SCAN
  //     // =====================================================

  //     setCode("");
  //     inputRef.current?.focus();

  //   } catch (err) {
  //     console.error(
  //       "❌ Code lookup failed:",
  //       err
  //     );

  //     toast.error(
  //       err?.data?.message ||
  //       `No item found for code "${trimmed}"`
  //     );

  //     setCode("");
  //     inputRef.current?.focus();

  //   } finally {
  //     setIsLooking(false);
  //   }
  // };
  
  const handleAddCode = async (scannedCode = code) => {
  const trimmed = String(scannedCode || "").trim();

  if (!trimmed) return;

  // =====================================================
  // IF CODE ALREADY EXISTS → INCREASE QUANTITY
  // =====================================================

  const existingItem = scannedItems.find(
    (it) =>
      it.Code?.trim()?.toLowerCase() ===
      trimmed.toLowerCase()
  );

  if (existingItem) {
    setScannedItems((prev) =>
      prev.map((it) =>
        it.Code?.trim()?.toLowerCase() ===
          trimmed.toLowerCase()
          ? {
              ...it,
              Quantity: Number(it.Quantity || 0) + 1,
            }
          : it
      )
    );

    setCode("");
    inputRef.current?.focus();
    return;
  }

  setIsLooking(true);

  try {
    const response =
      await getItemByCode(trimmed).unwrap();

    const res = response?.item;

    // =====================================================
    // ITEM NOT FOUND
    // =====================================================

    if (!res?.Item_Id) {
      toast.error(
        `No item found for code "${trimmed}"`
      );

      setCode("");
      inputRef.current?.focus();
      return;
    }

    // =====================================================
    // ITEM FOUND
    // =====================================================

    const scannedItem = {
      Code: trimmed,

      Item_Id: res.Item_Id,
      Item_Name: res.Item_Name || "",
      Item_HSN: res.Item_HSN || "",
      Item_Category: res.Item_Category || "",
      Item_Type: res.Item_Type || "",

      Primary_Unit: res.Primary_Unit || "",
      Primary_Unit_Id: res.Primary_Unit_Id || null,

      Secondary_Unit: res.Secondary_Unit || "",
      Secondary_Unit_Id: res.Secondary_Unit_Id || null,

      Conversion_Rate: res.Conversion_Rate ?? null,

      Available_Units:
        Array.isArray(res.Available_Units)
          ? res.Available_Units
          : [],

      Sale_Price:
        Number(res.Sale_Price) || 0,

      Sale_Price_Type:
        res.Sale_Price_Type || "With_Tax",

      Discount_On_Sale_Price:
        res.Discount_On_Sale_Price ?? "",

      Discount_Type_On_Sale_Price:
        res.Discount_Type_On_Sale_Price ||
        "Percentage",

      Purchase_Price:
        Number(res.Purchase_Price) || 0,

      Purchase_Price_Type:
        res.Purchase_Price_Type ||
        "Without_Tax",

      MRP:
        res.MRP !== null &&
        res.MRP !== undefined
          ? Number(res.MRP)
          : null,

      Discount_On_MRP_For_Sale:
        res.Discount_On_MRP_For_Sale ?? "",

      Stock_Quantity:
        Number(res.Stock_Quantity || 0),

      Quantity: 1,
    };

    setScannedItems((prev) => [
      ...prev,
      scannedItem,
    ]);

    setCode("");
    inputRef.current?.focus();

  } catch (err) {
    console.error(
      "❌ Code lookup failed:",
      err
    );

    toast.error(
      err?.data?.message ||
      `No item found for code "${trimmed}"`
    );

    setCode("");
    inputRef.current?.focus();

  } finally {
    setIsLooking(false);
  }
};
  const handleQuantityChange = (code, value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    setScannedItems((prev) =>
      prev.map((it) => (it.Code === code ? { ...it, Quantity: sanitized } : it))
    );
  };

  const handleRemove = (code) => {
    setScannedItems((prev) => prev.filter((it) => it.Code !== code));
  };

  const handleSave = () => {
    if (scannedItems.length === 0) {
      toast.info("Scan at least one item before saving.");
      return;
    }

    // normalize quantity to a number, default to 1 if blank 
    const normalized = scannedItems.map((it) => ({
      ...it,
      Quantity: Number(it.Quantity) > 0 ? Number(it.Quantity) : 1,
    }));

    onSave(normalized);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        padding: "1rem",
        marginTop: "50px",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ paddingBottom: 10 }}>
          <h4 className="text-lg font-semibold text-gray-900">Scan code/serial</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 14 }} />

        {/* Scan input row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Enter code/serial:</span>
          <span className="text-sm text-gray-500">{scannedItems.length} Entered</span>
        </div>

        {/* <div className="flex gap-2 mb-4"> 
             <div className="input-field col s6 " 
              style={{ 
      flex: 1, 
      margin: 0, 
      
    }} 
             > 
          <input 
            ref={inputRef} 
            type="text" 
            autoFocus 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            onKeyDown={(e) => { 
              if (e.key === "Enter") { 
                e.preventDefault(); 
                handleAddCode(); 
              } 
            }} 
            placeholder="Enter/Scan" 
            className="w-full outline-none border-b-2 text-gray-900" 
            style={{marginBottom:"0"}} 
            //style={{ height: 40, backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }} 
          /> 
          </div> 
            <BarcodeScanner
    label=""
    placeholder="Scan barcode"
    autoFocus={false}
    onScan={(scannedValue) => {
      handleAddCode(scannedValue);
    }}
  />
            
          <button 
            type="button" 
            onClick={handleAddCode} 
            disabled={isLooking || !code.trim()} 
            className="text-white font-bold  px-4 rounded" 
            style={{ 
              backgroundColor: ACCENT, 
              border: "none", 
              cursor: isLooking || !code.trim() ? "not-allowed" : "pointer", 
              opacity: isLooking || !code.trim() ? 0.6 : 1, 
            }} 
          > 
            {isLooking ? "..." : "Add"} 
          </button> 
          </div>  */}
        <div className="flex gap-2 mb-4">
          <div
            className="input-field col s6"
            style={{
              flex: 1,
              margin: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                   if (e.key === "Enter") {
      e.preventDefault();
      handleAddCode(e.currentTarget.value);
    }
                // if (e.key === "Enter") {
                //   e.preventDefault();
                //    handleAddCode(code);   // explicit
                //   //handleAddCode();
                // }
              }}
              placeholder="Enter / Scan barcode"
              className="w-full outline-none border-b-2 text-gray-900"
              style={{ marginBottom: "0" }}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            onClick={() => handleAddCode(code)}
            //onClick={handleAddCode}
            disabled={isLooking || !code.trim()}
            className="text-white font-bold px-4 rounded"
            style={{
              backgroundColor: ACCENT,
              border: "none",
              cursor:
                isLooking || !code.trim()
                  ? "not-allowed"
                  : "pointer",
              opacity:
                isLooking || !code.trim()
                  ? 0.6
                  : 1,
            }}
          >
            {isLooking ? "..." : "Add"}
          </button>
        </div>


        {/* Scanned items list — scrollable */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {scannedItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No items scanned yet.</p>
          ) : (
            scannedItems.map((it) => (
              <div
                key={it.Code}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-gray-800 font-medium truncate">{it.Item_Name}</span>
                  <span className="text-xs text-gray-400 truncate">{it.Code}</span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 mb-0.5">Quantity</span>
                    <input
                      type="text"
                      value={it.Quantity}
                      onChange={(e) => handleQuantityChange(it.Code, e.target.value)}
                      className="rounded-md text-sm outline-none px-2 text-center"
                      style={{ width: 64, height: 32, border: "1px solid #d1d5db" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(it.Code)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
                    title="Remove"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-[#4CA1AF] text-white hover:bg-[#3b8c98]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

