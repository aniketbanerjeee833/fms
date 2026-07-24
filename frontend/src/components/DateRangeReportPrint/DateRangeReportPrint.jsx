import "./DateRangeReportPrint.css";

export default function DateRangeReportPrint({ data }) {
  const {
    fromDate,
    toDate,
     date,           // ✅ add this
    sales = [],
    purchases = []
  } = data || {};
console.log("Data:", data);
  const safe = (v) => (v ? v : "N/A");

  const renderSection = (title, list, type) => {
    if (!list || list.length === 0) return null;

    return (
      <div className="section">
        <h3 className="section-title">{title.toUpperCase()}</h3>

        {list.map((entry, idx) => (
          <div key={idx} className="entry">

            {/* HEADER */}
            <div className="entry-header">
              <div>
                <div><b>Party Name:</b> {safe(entry.Party_Name)}</div>
                <div><b>GSTIN:</b> {safe(entry.GSTIN)}</div>
              </div>

              <div className="right">
                <div>
                  <b>{type === "purchase" ? "Bill No" : "Invoice No"}:</b>{" "}
                  {safe(entry.Bill_Number || entry.Invoice_Number)}
                </div>
                <div>
                  <b>{type === "purchase" ? "Bill Date" : "Invoice Date"}:</b>{" "}
                  {safe(entry.Bill_Date || entry.Invoice_Date)}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <table className="report-table">
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
                {entry.items?.map((it, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{safe(it.Item_Category)}</td>
                    <td>{safe(it.Item_Name)}</td>
                    <td>{safe(it.Item_HSN)}</td>
                    <td>{it.Quantity} {safe(it.Item_Unit)}</td>
                    <td>{it.Sale_Price || it.Purchase_Price}</td>
                    <td>{it.Tax_Type}</td>
                    <td>{it.Amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className="totals">
  <p>
    <span>Total Amount</span>
    <span>₹{safe(entry.Total_Amount)}</span>
  </p>

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
    <div className="report-container" id="report-print">
      <h2 className="text-center">
  {fromDate && toDate
    ? `DATE RANGE REPORT (${fromDate} to ${toDate})`
    : `DAILY REPORT (${date || "N/A"})`}
</h2>
      {/* <h2 className="text-center">
        {fromDate && toDate ? "DATE RANGE REPORT" : "DAILY REPORT"}
      </h2> */}

      {renderSection("Purchases", purchases, "purchase")}
      {renderSection("Sales", sales, "sale")}
    </div>
  );
}