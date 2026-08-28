import BarcodeScanner from "../components/BarcodeScanner";



export default function BarcodeScannerInput() {
  const handleScan = (code) => {
    // DUMMY — replace later with real lookup logic
    // e.g. fetch item by barcode, autofill Item_Name, etc.
    console.log("Scanned barcode:", code); // e.g. "X001X15XDH"
  };

  return (
    <div className="row">
      <BarcodeScanner
        onScan={handleScan}
        label="Scan Barcode"
        placeholder="Scan or enter barcode"
      />
    </div>
  );
}