import React from "react";
import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Printer,
  Download,
} from "lucide-react";

import {
  useGetExpenseByIdQuery,
} from "../../redux/api/expenseApi";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ExpensePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const {
    data: expenseResponse,
    isLoading,
    error,
  } = useGetExpenseByIdQuery(id);

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{
          height: "100vh",
          fontSize: 18,
        }}
      >
        Loading Expense...
      </div>
    );
  }

  if (error || !expenseResponse?.expense) {
    return (
      <div
        className="flex justify-center items-center text-red-500"
        style={{
          height: "100vh",
          fontSize: 18,
        }}
      >
        Failed to load Expense.
      </div>
    );
  }

  const expense = expenseResponse.expense;

  const back = () => {
    navigate(
      location.state?.from || "/expense/categories",
      {
        state: {
          categoryId: location.state?.categoryId,
          itemId: location.state?.itemId,

          txnSearch: location.state?.txnSearch,

          categorySearch: location.state?.categorySearch,
          itemSearch: location.state?.itemSearch,
        },
      }
    );
  };

  return (
    <div
      style={{
        background: "#edf2f7",
        minHeight: "100vh",
        padding: 30,
      }}
    >

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div
        className="no-print flex justify-between items-center mb-6"
      >
        <button
          onClick={back}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white"
          style={{
            background: "#4CA1AF",
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex gap-3">

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white"
            style={{
              background: "#4CA1AF",
            }}
          >
            <Printer size={18} />
            Print
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white"
            style={{
              background: "#4CA1AF",
            }}
          >
            <Download size={18} />
            Download PDF
          </button>

        </div>
      </div>

      {/* ========================= */}
      {/* A4 PAPER */}
      {/* ========================= */}

      <div
        id="expense-preview"
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "auto",
          background: "#fff",
          padding: 40,
          boxShadow:
            "0 8px 30px rgba(0,0,0,.12)",
        }}
      >

        {/* ========================= */}
        {/* TITLE */}
        {/* ========================= */}

        <h2
          style={{
            textAlign: "center",
            fontWeight: 700,
            marginBottom: 25,
          }}
        >
          Expense
        </h2>

        {/* ========================= */}
        {/* COMPANY */}
        {/* ========================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom:
              "2px solid #4CA1AF",
            paddingBottom: 20,
            marginBottom: 25,
          }}
        >

          {/* LOGO */}

          <div
            style={{
              width: 100,
              height: 100,
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontWeight: 600,
            }}
          >
            <img
              src="/logo.png"
              alt="Company Logo"
              style={{
                width: 90,
                height: 90,
                objectFit: "contain",
              }}
            />
          </div>

          {/* COMPANY DETAILS */}

          <div
            style={{
              textAlign: "right",
            }}
          >

            <h3
              style={{
                margin: 0,
                color: "#4CA1AF",
              }}
            >
              ANCO Innovation
            </h3>

            <p
              style={{
                margin: "6px 0",
              }}
            >
              348/103/1,
              Netaji Subhas Chandra Bose Road,
              Naktala,
              Kolkata - 700047
            </p>

            <p
              style={{
                margin: "3px 0",
              }}
            >
              Phone :
              9831166989
            </p>

            <p
              style={{
                margin: "3px 0",
              }}
            >
              Email :
              sales@ancoinnovation.com
            </p>

            <p
              style={{
                margin: "3px 0",
              }}
            >
              GSTIN :
              19AOQPG1954B1ZY
            </p>

            <p
              style={{
                margin: "3px 0",
              }}
            >
              State :
              West Bengal
            </p>

          </div>

        </div>

        {/* ========================= */}
        {/* EXPENSE DETAILS */}
        {/* ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 25,
            marginBottom: 30,
          }}
        >

          {/* LEFT */}

          <div>

            <h4
              style={{
                color: "#4CA1AF",
                marginBottom: 10,
              }}
            >
              Expense For
            </h4>

            <table
              style={{
                width: "100%",
              }}
            >

              <tbody>

                <tr>
                  <td>Category</td>

                  <td>
                    {expense.Category_Name}
                  </td>
                </tr>

                <tr>
                  <td>Type</td>

                  <td>
                    {expense.Category_Type}
                  </td>
                </tr>

                <tr>
                  <td>Party</td>

                  <td>
                    {expense.Party_Name || "—"}
                  </td>
                </tr>

                <tr>
                  <td>State</td>

                  <td>
                    {expense.State_Of_Supply || "—"}
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

          {/* RIGHT */}

          <div>

            <h4
              style={{
                color: "#4CA1AF",
                marginBottom: 10,
              }}
            >
              Expense Details
            </h4>

            <table
              style={{
                width: "100%",
              }}
            >

              <tbody>

                <tr>

                  <td>
                    Expense No
                  </td>

                  <td>
                    {expense.Expense_Number || "—"}
                  </td>

                </tr>

                <tr>

                  <td>
                    Expense Date
                  </td>

                  <td>
                    {fmtDate(
                      expense.Expense_Date
                    )}
                  </td>

                </tr>

                <tr>

                  <td>
                    Bill Date
                  </td>

                  <td>
                    {fmtDate(
                      expense.Bill_Date
                    )}
                  </td>

                </tr>

                <tr>

                  <td>
                    Payment
                  </td>

                  <td>
                    {
                      expense.Payment_Type_Display
                    }
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

        {/* ========================= */}
        {/* PART 2 STARTS HERE */}
        {/* ========================= */}

        {/* ========================= */}
        {/* ITEMS TABLE */}
        {/* ========================= */}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 30,
          }}
        >

          <thead>

            <tr
              style={{
                background: "#4CA1AF",
                color: "#fff",
              }}
            >

              <th
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  width: 50,
                }}
              >
                #
              </th>

              <th
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  textAlign: "left",
                }}
              >
                Item Name
              </th>

              <th
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  width: 120,
                }}
              >
                Quantity
              </th>

              <th
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  width: 150,
                }}
              >
                Price
              </th>

              <th
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  width: 160,
                }}
              >
                Amount
              </th>

            </tr>

          </thead>

          <tbody>

            {expense.items?.map(
              (item, index) => (

                <tr key={item.id}>

                  <td
                    style={{
                      padding: 10,
                      border: "1px solid #ddd",
                      textAlign: "center",
                    }}
                  >
                    {index + 1}
                  </td>

                  <td
                    style={{
                      padding: 10,
                      border: "1px solid #ddd",
                    }}
                  >
                    {item.Item_Name}
                  </td>

                  <td
                    style={{
                      padding: 10,
                      border: "1px solid #ddd",
                      textAlign: "center",
                    }}
                  >
                    {fmt(item.Quantity)}
                  </td>

                  <td
                    style={{
                      padding: 10,
                      border: "1px solid #ddd",
                      textAlign: "right",
                    }}
                  >
                    ₹ {fmt(item.Price)}
                  </td>

                  <td
                    style={{
                      padding: 10,
                      border: "1px solid #ddd",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ₹ {fmt(item.Amount)}
                  </td>

                </tr>

              )
            )}

            {/* TOTAL */}

            <tr
              style={{
                background: "#f7fafc",
                fontWeight: 700,
              }}
            >

              <td
                colSpan={2}
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "right",
                }}
              >
                Total
              </td>

              <td
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                {fmt(

                  expense.items?.reduce(

                    (sum, item) =>
                      sum +
                      Number(
                        item.Quantity || 0
                      ),

                    0

                  )

                )}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                }}
              ></td>

              <td
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "right",
                  color: "#4CA1AF",
                  fontSize: 16,
                }}
              >
                ₹ {fmt(expense.Total_Amount)}
              </td>

            </tr>

          </tbody>

        </table>

        {/* ========================= */}
        {/* TOTALS + AMOUNT IN WORDS */}
        {/* ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 30,
            marginBottom: 40,
          }}
        >

          {/* ========================= */}
          {/* LEFT */}
          {/* ========================= */}

          <div>

            <h4
              style={{
                color: "#4CA1AF",
                marginBottom: 12,
              }}
            >
              Amount in Words
            </h4>

            <div
              style={{
                border: "1px solid #ddd",
                padding: 15,
                minHeight: 70,
                borderRadius: 6,
              }}
            >

              <strong>

                {/* Replace later with amount-to-word function */}

                {expense.Total_Amount}

              </strong>

              {" "}Rupees Only

            </div>

            <div
              style={{
                marginTop: 35,
              }}
            >

              <h4
                style={{
                  color: "#4CA1AF",
                  marginBottom: 10,
                }}
              >
                Payment Details
              </h4>

              <table
                style={{
                  width: "100%",
                }}
              >

                <tbody>

                  <tr>

                    <td
                      style={{
                        padding: "6px 0",
                      }}
                    >
                      Payment Type
                    </td>

                    <td>

                      {expense.Payment_Type_Display || "—"}

                    </td>

                  </tr>

                  <tr>

                    <td
                      style={{
                        padding: "6px 0",
                      }}
                    >
                      Reference No
                    </td>

                    <td>

                      {expense.splits?.[0]?.Reference_Number || "—"}

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* ========================= */}
          {/* RIGHT */}
          {/* ========================= */}

          <div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >

              <div
                style={{
                  background: "#4CA1AF",
                  color: "#fff",
                  padding: 12,
                  fontWeight: 600,
                }}
              >
                Amount Summary
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >

                <tbody>

                  <tr>

                    <td
                      style={{
                        padding: 12,
                      }}
                    >
                      Sub Total
                    </td>

                    <td
                      style={{
                        textAlign: "right",
                        padding: 12,
                      }}
                    >
                      ₹ {fmt(expense.Total_Amount)}
                    </td>

                  </tr>

                  <tr>

                    <td
                      style={{
                        padding: 12,
                      }}
                    >
                      Total
                    </td>

                    <td
                      style={{
                        textAlign: "right",
                        padding: 12,
                        fontWeight: 700,
                      }}
                    >
                      ₹ {fmt(expense.Total_Amount)}
                    </td>

                  </tr>

                  <tr>

                    <td
                      style={{
                        padding: 12,
                      }}
                    >
                      Paid
                    </td>

                    <td
                      style={{
                        textAlign: "right",
                        padding: 12,
                        color: "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      ₹ {fmt(expense.Total_Paid)}
                    </td>

                  </tr>

                  <tr>

                    <td
                      style={{
                        padding: 12,
                      }}
                    >
                      Balance
                    </td>

                    <td
                      style={{
                        textAlign: "right",
                        padding: 12,
                        color:
                          Number(expense.Balance_Due) > 0
                            ? "#dc2626"
                            : "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      ₹ {fmt(expense.Balance_Due)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* ========================= */}
        {/* SIGNATURE */}
        {/* ========================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 80,
          }}
        >

          <div>

            <h4
              style={{
                color: "#4CA1AF",
                marginBottom: 8,
              }}
            >
              For :
            </h4>

            <strong>

              ANCO Innovation

            </strong>

          </div>

          <div
            style={{
              textAlign: "center",
            }}
          >

            <div
              style={{
                height: 50,
              }}
            />

            <div
              style={{
                borderTop: "1px solid #000",
                paddingTop: 8,
                width: 180,
              }}
            >
              Authorized Signatory
            </div>

          </div>

        </div>

      </div>

    </div>



  );
}