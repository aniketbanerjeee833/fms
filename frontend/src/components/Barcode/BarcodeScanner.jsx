import { useRef, useState, useEffect } from "react";

// ============================================================
// BarcodeScanner.jsx
// Physical (USB / keyboard-wedge) barcode scanner input field.
// These scanners act like a keyboard — they "type" the barcode
// very fast and then send an Enter key. So we just listen for
// fast keystrokes followed by Enter on a normal text input.
// ============================================================

export default function BarcodeScanner({
  onScan,          // callback(scannedValue) — fires when a full barcode is captured
  label = "Barcode",
  placeholder = "Scan or enter barcode",
  autoFocus = true,
}) {
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  const [lastScanned, setLastScanned] = useState(null);

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // keep the field focused so the physical scanner always has
  // somewhere to "type" into, even if the user clicks elsewhere
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Enter key = scanner finished sending the barcode
    if (e.key === "Enter") {
      e.preventDefault();

      const scannedValue = bufferRef.current.trim() || value.trim();

      if (scannedValue) {
        setLastScanned(scannedValue);
        onScan?.(scannedValue);

        // DUMMY handling for now — replace with real lookup later
        console.log("Scanned barcode:", scannedValue);
      }

      bufferRef.current = "";
      setValue("");
      return;
    }

    // Optional: detect "too slow" typing = probably a human, not a scanner.
    // Scanners fire keystrokes within a few ms of each other.
    // (Not enforced here — just tracked in case you want to
    //  distinguish manual typing vs a real scan later.)
    if (timeSinceLastKey > 500) {
      bufferRef.current = "";
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <div className="input-field col s6">
      <span className="active">
        {label}
      </span>

      <input
        ref={inputRef}
        type="text"
        id="Barcode_Input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full outline-none border-b-2 text-gray-900"
      />

      {lastScanned && (
        <p className="text-xs mt-1" style={{ color: "#4CA1AF" }}>
          Last scanned: {lastScanned}
        </p>
      )}
    </div>
  );
}