import "./PartyDetailsPrint.css";

export default function PartyDetailsPrint({ data }) {
  const {
    partyDetails = {},
    purchases = [],
    sales = []
  } = data || {};
console.log("Party Data:", data);
console.log("Purchases Data:", partyDetails);
  const safe = (v) => (v !== undefined && v !== null ? v : "N/A");

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN");
  };

  const renderSection = (title, list, type) => {
    if (!list.length) return null;

    return (
      <div className="party-section">
        <h2 className="section-title">{title}</h2>

        {list.map((entry, idx) => (
          <div className="party-card" key={idx}>

            {/* 🔹 HEADER */}
            <div className="card-header">
              <div>
                <p><b>Party Name:</b> {safe(partyDetails?.Party_Name)}</p>
                <p><b>GSTIN:</b> {safe(partyDetails?.GSTIN)}</p>
              </div>

              <div className="right">
                <p>
                  <b>{type === "purchase" ? "Bill No" : "Invoice No"}:</b>{" "}
                  {safe(entry?.Bill_Number || entry?.Invoice_Number)}
                </p>
                <p>
                  <b>{type === "purchase" ? "Bill Date" : "Invoice Date"}:</b>{" "}
                  {formatDate(entry?.Bill_Date || entry?.Invoice_Date)}
                </p>
              </div>
            </div>

            {/* 🔹 TABLE */}
            <table className="print-table">
              <thead>
                <tr>
                  <th>Sl</th>
                  <th>Category</th>
                  <th>Item</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Tax</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(entry.items || []).map((it, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{safe(it.Item_Category)}</td>
                    <td>{safe(it.Item_Name)}</td>
                    <td>{safe(it.Item_HSN)}</td>
                    <td>{safe(it.Quantity)}</td>
                    <td>{safe(it.Sale_Price || it.Purchase_Price)}</td>
                    <td>{safe(it.Tax_Type)}</td>
                    <td>{Number(it.Amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🔹 TOTALS */}
            <div className="totals">
              <p><span>Total Amount</span><span>₹{safe(entry.Total_Amount)}</span></p>
              <p>
                <span>{type === "purchase" ? "Paid" : "Received"}</span>
                <span>₹{safe(entry.Total_Paid || entry.Total_Received)}</span>
              </p>
              <p className="balance">
                <span>Balance Due</span>
                <span>₹{safe(entry.Balance_Due)}</span>
              </p>
            </div>

          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="print-container">

      {/* 🔥 HEADER */}
      <h1 className="main-title">{safe(partyDetails?.Party_Name)}</h1>

      <p className="center">GSTIN: {safe(partyDetails.GSTIN)}</p>
      <p className="center">Billing Address: {safe(partyDetails.Billing_Address)}</p>

      {/* 🔥 SECTIONS */}
      {renderSection("Purchases", purchases, "purchase")}
      {renderSection("Sales", sales, "sale")}

    </div>
  );
}