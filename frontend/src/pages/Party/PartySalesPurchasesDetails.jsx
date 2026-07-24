
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGetSinglePartyDetailsSalesPurchasesQuery, usePrintSinglePartyDetailsSalesPurchasesReportMutation } from '../../redux/api/partyAPi';
import { useState } from 'react';
import { Eye, Filter, SquarePen } from 'lucide-react';
import PartyDetailPrint from '../../components/PartyDetailsPrint/PartyDetailsPrint';

export default function PartySalesPurchasesDetails() {
    const TAX_TYPES = {
        "GST0": "GST 0%",
        "GST0.25": "GST 0.25%",
        "GST3": "GST 3%",
        GST5: "GST 5%",
        GST12: "GST 12%",
        GST18: "GST 18%",
        GST28: "GST 28%",
        GST40: "GST 40%",
        "IGST0": "IGST 0%",
        "IGST0.25": "IGST 0.25%",
        "IGST3": "IGST 3%",
        IGST5: "IGST 5%",
        IGST12: "IGST 12%",
        IGST18: "IGST 18%",
        IGST28: "IGST 28%",
        IGST40: "IGST 40%"
    }
     const location = useLocation();
    const { id: Party_Id } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { data: partyDetails } =
        useGetSinglePartyDetailsSalesPurchasesQuery({Party_Id, page});
    console.log(partyDetails, "partyDetails");
    const purchases = partyDetails?.purchases ?? [];
    const sales = partyDetails?.sales ?? [];
    const party = partyDetails?.partyDetails ?? {};
    console.log(party, "party", purchases, "purchases", sales, "sales");
    const [singlePartyDetailsSalesPurchases, { isLoading: isPrintLoading }] = 
    usePrintSinglePartyDetailsSalesPurchasesReportMutation()
    //const[showRangeModal, setShowRangeModal] = useState(false);
    //   const [fromDate, setFromDate] = useState('');
    //     const [toDate, setToDate] = useState('')
    const handlePageChange = (newPage) => {
        setPage(newPage);
    }
    const handleNextPage = () => {
        setPage(page + 1);
    }
    const handlePreviousPage = () => {
        setPage(page - 1);
    } 

    const [showPrint, setShowPrint] = useState(false);
     const handlePrint = () => {
    setShowPrint(true);

    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

    // const handlePrint = async () => {
    //     try {
    //         const payload = {
    //             party: partyDetails?.partyDetails,
    //             purchases: partyDetails?.purchases ?? [],
    //             sales: partyDetails?.sales ?? [],
    //             summary: {
    //                 purchaseSummary: partyDetails?.summary?.purchases,
    //                 salesSummary: partyDetails?.summary?.sales,
    //             },
    //         };

    //         console.log("Print Payload:", payload);

    //         const pdfBlob = await singlePartyDetailsSalesPurchases(payload).unwrap(); // your RTK mutation

    //         const url = URL.createObjectURL(pdfBlob);
    //         window.open(url, "_blank");

    //     } catch (err) {
    //         console.error("❌ Print Error:", err);
    //         alert("Could not generate print PDF.");
    //     }
    // };

    //       const handlePrint = async () => {
    //   try {
    //     // const data = partyDetails?.data;


    // const payload = {


    //   // SALES
    //   sales: partyDetails?.sales|| [],
    // //   totalSalesAmount: data?.sales?.totalSalesAmount,
    // //   totalSalesReceivedAmount: data?.sales?.totalSalesReceivedAmount,
    // //   totalSalesBalanceDue: data?.sales?.totalSalesBalanceDue,

    //   // NEW SALES
    // //   newSales: data.newSales.items || [],
    // //   totalNewSalesAmount: data.newSales.totalNewSalesAmount,
    // //   totalNewSalesReceivedAmount: data.newSales.totalNewSalesReceivedAmount,
    // //   totalNewSalesBalanceDue: data.newSales.totalNewSalesBalanceDue,

    //   // PURCHASES
    //   purchases: partyDetails?.purchases|| [],
    // //   totalPurchasesAmount: data?.purchases?.totalPurchasesAmount,
    // //   totalPurchasesPaidAmount: data?.purchases?.totalPurchasePaidAmount,
    // //   totalPurchasesBalanceDue: data?.purchases?.totalPurchasesBalanceDue
    // };



    //     console.log(" Sending payload:", payload);

    //     ///const pdfBlob = await printDailyReport(payload).unwrap();

    //     //const url = URL.createObjectURL(pdfBlob);
    //     const win = window.open(url, "_blank");
    //     if (win) win.focus();

    //   } catch (err) {
    //     console.error("❌ Print Error:", err);
    //     alert("Could not generate the print document.");
    //   }
    // };
    return (
        <>
        {/* <div className="sb2-2-3 mt-4">
                <div className="row" style={{ margin: "0px" }}>
                    <div className="col-md-12">
                        <div style={{ padding: "20px" }}
                            className="box-inn-sp"> */}
            
                        <div style={{ padding: "20px" }}
                            className="flex flex-col bg-white mt-4 ">

                            <div className="flex items-center justify-between w-full">

                                {/* LEFT spacer to center title */}
                                <div className="flex-1"></div>

                                {/* CENTER TITLE */}
                                <div
                                    className="text-center flex-1 whitespace-nowrap  inn-title "
                                    style={{ marginTop: "0px", borderBottom: "none" }}
                                >
                                    <h4 className="text-2xl font-bold mb-2">
                                        PARTY NAME : {party?.Party_Name}
                                    </h4>

                                    <div className='flex flex-row gap-4 w-full'>
                                        <div >
                                            <span className=" font-bold mb-2">
                                                Phone Number : {party?.Phone_Number || "N/A"}
                                            </span>
                                        </div>
                                        <div >
                                            <span className=" font-bold mb-2">
                                                Email_Id : {party?.Email_Id || "N/A"}
                                            </span>
                                        </div>
                                        <div >
                                            <span className="font-bold mb-2">
                                                Shipping Address : {party?.Shipping_Address || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* PRINT BUTTON (Right aligned) */}
                                <div className="flex-1 flex mt-4 justify-end gap-4">

                                    {/* <button
      type="button"
    //   disabled={isPrintLoading}
    //   onClick={handlePrint}
      className="text-white font-bold py-2 px-4 rounded"
      style={{ backgroundColor: "#4CA1AF" }}
    >
        Print
      
    </button> */}
                                    {/* <button  style={{ backgroundColor: "#4CA1AF" }}
                    onClick={() => setShowRangeModal(true)}
                    className="px-4 py-2 bg-blue-600  text-white rounded-lg transition text-sm sm:text-base  flex items-center gap-2"
                  >
<Filter className="w-4 h-4" />
Date Range Report
</button> */}
                                    {/* <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-medium mb-1">From Date</span>
                                            <input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => setFromDate(e.target.value)}
                                                className="border p-2 rounded-md shadow-sm text-gray-700 sm:w-auto"
                                                title="Search from date"
                                            />
                                        </div>


                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-medium mb-1">To Date</span>
                                            <input
                                            style={{padding: "0px"}}
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                                className="border p-2 rounded-md shadow-sm text-gray-700 sm:w-auto"
                                                title="Search to date"
                                            />
                                        </div> */}
                                    <div className="flex flex-col  justify-center items-center">
                                        <button
                                            type="button"
                                            //                                                      navigate({
                                            //   pathname: "/purchase/all-purchases",
                                            //   search: location.search,
                                            // })
                                            // onClick={() => navigate("/party/all-parties")}

                                            onClick={() => navigate({
                                                pathname: "/party/all-parties",
                                                search: location.search,
                                            })}
                                            className="text-white font-bold py-2 px-4 rounded"
                                            style={{ backgroundColor: "#4CA1AF" }}
                                        >
                                            Back
                                        </button>
                                    </div>
                                    <div className="flex flex-col  justify-center items-center">
                                        <button
                                            type="button"
                                            onClick={() => handlePrint()}
                                            className="text-white font-bold py-2 px-4 rounded"
                                            style={{ backgroundColor: "#4CA1AF" }}
                                        >
                                            {isPrintLoading ? "Printing..." : "Print"}
                                        </button>
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-center align-center">
                                <h3 className="text-2xl  font-bold mb-2"
                                    style={{ color: "red" }}>Total Purchases</h3>
                            </div>
                            {partyDetails && purchases?.length > 0 ?
                                purchases?.map((purchases, index) => (
                                    <div key={purchases?.Purchase_Id}>
                                        <div className="w-8 h-8 rounded-full mt-1
                              bg-red-500 flex justify-center items-center">
                                            {/* <span className="text-white ">{index + 1}</span> */}
                                            <span className="text-white ">
                                                {(partyDetails?.currentPage - 1) * 10 + (index + 1)}</span>
                                        </div>
                                        <div style={{ padding: "0" }} className="tab-inn"
                                        >
                                            <div style={{ width: "100%", padding: "0px" }}
                                                className="flex  justify-end gap-2 ">

                                                {/* <Eye
                                                    onClick={() =>
                                                        navigate(`/purchase/view/${purchases?.Purchase_Id}`, {
                                                            state: {
                                                                from: "party-sales-purchases-details",
                                                                partyId: Party_Id
                                                            }
                                                        })
                                                    }
                                                    style={{
                                                        cursor: "pointer",
                                                        backgroundColor: "transparent",
                                                        color: "#4CA1AF"
                                                    }}
                                                /> */}

                                                  <NavLink to={`/purchase/view/${purchases?.Purchase_Id}${location.search}`}
                                                    state={{
                                                        from: "party-sales-purchases-details",
                                                        partyId: Party_Id
                                                    }}
                                                >
                                                    <Eye
                                                        style={{
                                                            cursor: "pointer",
                                                            backgroundColor: "transparent",
                                                            color: "#4CA1AF",
                                                        }}
                                                    />
                                                </NavLink>

                                                  <NavLink to={`/purchase/edit/${purchases?.Purchase_Id}${location.search}`}
                                                    state={{
                                                        from: "party-sales-purchases-details",
                                                        partyId: Party_Id
                                                    }}
                                                >
                                                    <SquarePen
                                                        style={{
                                                            cursor: "pointer",
                                                            backgroundColor: "transparent",
                                                            color: "#4CA1AF",
                                                        }}
                                                    />
                                                </NavLink>

                                            </div>
                                            <div style={{ background: "#f0f0f0" }} className="row">


                                                <div className="input-field col s6">
                                                    <span className="active">
                                                        Bill Number
                                                    </span>
                                                    <input type="text" value={purchases?.Bill_Number ?? ""}
                                                        className="validate" readOnly />


                                                </div>
                                                <div className="input-field col s6">
                                                    <span className="active">
                                                        Bill Date
                                                    </span>
                                                    <input type="text"

                                                        value={new Date(purchases?.Bill_Date).
                                                            toLocaleDateString("en-IN",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                }
                                                            ) ?? ""}
                                                        className="validate" readOnly />


                                                </div>


                                                <div className="input-field col s6">
                                                    <span className="active ">
                                                        State of Supply
                                                    </span>
                                                    <input type="text" value={purchases?.State_Of_Supply ?? ""}
                                                        className="validate" readOnly />


                                                </div>
                                                <div className="input-field col s6">
                                                    <span className="active">Payment Type</span>
                                                    <input type="text" value={purchases?.Payment_Type ?? ""}
                                                        className="validate" readOnly />


                                                </div>


                                                <div className="input-field col s6">

                                                    <span className="active">
                                                        Reference Number

                                                    </span>
                                                    <input type="text" value={purchases?.Reference_Number ?? "N/A"}
                                                        className="validate" readOnly />
                                                </div>
                                            </div>
                                            <div className="table-responsive table-desi mt-4">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>

                                                            <th>Sl.No</th>
                                                            <th>Category</th>
                                                            <th>Item</th>
                                                            <th>Item_HSN</th>
                                                            <th>Qty</th>
                                                            <th>Unit</th>
                                                            <th>Price/Unit</th>
                                                            <th>Discount</th>
                                                            <th>Tax</th>
                                                            <th>Tax Amount</th>
                                                            <th>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {purchases?.items?.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{index + 1}</td>
                                                                 
                                                                <td>{item?.Item_Category}</td>
                                                                <td>{item?.Item_Name}</td>
                                                                <td>{item?.Item_HSN}</td>
                                                                <td>{item?.Quantity}</td>
                                                                <td>{item?.Item_Unit}</td>
                                                                <td>{item?.Purchase_Price}</td>
                                                                <td>{
                                                                    item?.Discount_Type_On_Purchase_Price === "Percentage" ? `${item?.Discount_On_Purchase_Price == 0.00 ? 0 :
                                                                        item?.Discount_On_Purchase_Price}%` : `₹${item?.Discount_On_Purchase_Price}`
                                                                }</td>

                                                                <td>{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
                                                                }</td>
                                                                <td>{item?.Tax_Amount}</td>
                                                                <td>{item?.Amount}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="w-full"> {/* Container to ensure the totals span full available width */}

                                                {/* This inner div is what holds the totals and is pushed to the right */}
                                                <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
                                                    style={{ width: "100%" }}>

                                                    {/* Total Amount Field */}
                                                    <div className="flex justify-between items-center">
                                                        <label className="font-medium">Total Amount</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field border-b border-gray-300   p-1"
                                                            value={purchases?.Total_Amount ?? 0.00}
                                                            readOnly
                                                        />
                                                    </div>

                                                    {/* Total Received Field */}
                                                    <div className="flex justify-between items-center">
                                                        <label className="font-medium">Total Paid</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field border-b border-gray-300  p-1"
                                                            value={purchases?.Total_Paid ?? 0.00}
                                                            readOnly
                                                        />
                                                    </div>

                                                    {/* Balance Due Field (Often styled differently) */}
                                                    <div className="flex justify-between items-center ">
                                                        <label className="font-bold text-lg">Balance Due</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field   p-1 font-extrabold text-lg"
                                                            value={purchases?.Balance_Due ?? 0.00}
                                                            readOnly
                                                        />


                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                        <div className="border-b border-black-300"></div>
                                    </div>
                                ))
                                : (<p className="text-center">No Purchases</p>)}

                            {partyDetails && purchases?.length > 0 &&
                                <div className="grid grid-rows-2 mt-1">
                                    <div className=" flex justify-center items-center">
                                        <h4>Purchase Summary</h4>
                                    </div>
                                    {/* Total Amount Field */}
                                    <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
                                        style={{ width: "100%", marginBottom: "0px" }}>
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium">Total Amount</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field border-b border-gray-300   p-1"
                                                value={partyDetails?.summary?.purchases?.Total_Amount ?? 0.00}
                                                readOnly
                                            />
                                        </div>

                                        {/* Total Received Field */}
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium">Total Paid</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field border-b border-gray-300  p-1"
                                                value={partyDetails?.summary?.purchases?.Total_Paid ?? 0.00}
                                                readOnly
                                            />
                                        </div>

                                        {/* Balance Due Field (Often styled differently) */}
                                        <div className="flex justify-between items-center ">
                                            <label className="font-bold text-lg">Balance Due</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field   p-1 font-extrabold text-lg"
                                                value={partyDetails?.summary?.purchases?.Balance_Due ?? 0.00}
                                                readOnly
                                            />


                                        </div>
                                    </div>
                                </div>}

                            <div className="border-b border-black-300"></div>
                            <div className="flex justify-center align-center mt-2">
                                <h3 className="text-2xl  font-bold mb-2"
                                    style={{ color: "green" }}>Total Sales</h3>
                            </div>
                            {partyDetails && sales?.length > 0 ?
                                sales?.map((sales, index) => (

                                    <div key={sales?.Sale_Id}>
                                        <div className="w-8 h-8 rounded-full mt-1
                              bg-green-500 flex justify-center items-center">
                                            {/* <span className="text-white ">{index + 1}</span>
                                             */}
                                             <span className="text-white "> {(partyDetails?.currentPage - 1) * 10 + (index + 1)}</span>
                                        </div>
                                        <div style={{ padding: "0" }} className="tab-inn"
                                        >
                                            <div style={{ width: "100%", padding: "0px" }}
                                                className="flex justify-end gap-2">
                                                {/* <Eye onClick={() => navigate(`/sale/view/${sales?.Sale_Id}`)}
                                                                      style={{
                                                                        cursor: "pointer",
                                                                        backgroundColor: "transparent",
                                                                        color: "#4CA1AF"
                                                                      }} />*/}
                                                {/* <Eye
  onClick={() =>
    navigate(`/sale/view/${sales?.Sale_Id}`, {
      state: {
        from: "party-sales-purchases-details",
        partyId: Party_Id
      }
    })
  }
  style={{
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#4CA1AF"
  }}
/> */}

                                                <NavLink to={`/sale/view/${sales?.Sale_Id}${location.search}`}
                                                    state={{
                                                        from: "party-sales-purchases-details",
                                                        partyId: Party_Id
                                                    }}
                                                >
                                                    <Eye
                                                        style={{
                                                            cursor: "pointer",
                                                            backgroundColor: "transparent",
                                                            color: "#4CA1AF",
                                                        }}
                                                    />
                                                </NavLink>

                                                <NavLink to={`/sale/edit/${sales?.Sale_Id}${location.search}`}
                                                    state={{
                                                        from: "party-sales-purchases-details",
                                                        partyId: Party_Id
                                                    }}
                                                >
                                                   <SquarePen
                                                        style={{
                                                            cursor: "pointer",
                                                            backgroundColor: "transparent",
                                                            color: "#4CA1AF",
                                                        }}
                                                    />
                                                </NavLink>

                                            </div>
                                            <div style={{ background: "#f0f0f0" }} className="row">


                                                <div className="input-field col s6">
                                                    <span className="active">
                                                        Invoice Number
                                                    </span>
                                                    <input type="text" value={sales?.Invoice_Number ?? ""}
                                                        className="validate" readOnly />


                                                </div>
                                                <div className="input-field col s6">
                                                    <span className="active">
                                                        Invoice Date
                                                    </span>
                                                    <input type="text"
                                                        //  value={new Date(sales?.Invoice_Date??"").toLocaleDateString({
                                                        //      day: "numeric",
                                                        //      month: "numeric",
                                                        //      year: "numeric",
                                                        //  })}
                                                        value={new Date(sales?.Invoice_Date).
                                                            toLocaleDateString("en-IN",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                }
                                                            ) ?? ""}
                                                        className="validate" readOnly />


                                                </div>


                                                <div className="input-field col s6">
                                                    <span className="active ">
                                                        State of Supply
                                                    </span>
                                                    <input type="text" value={sales?.State_Of_Supply ?? ""}
                                                        className="validate" readOnly />


                                                </div>
                                                <div className="input-field col s6">
                                                    <span className="active">Payment Type</span>
                                                    <input type="text" value={sales?.Payment_Type ?? ""}
                                                        className="validate" readOnly />


                                                </div>


                                                <div className="input-field col s6">

                                                    <span className="active">
                                                        Reference Number

                                                    </span>
                                                    <input type="text" value={sales?.Reference_Number ?? "N/A"}
                                                        className="validate" readOnly />
                                                </div>
                                            </div>
                                            <div className="table-responsive table-desi mt-4">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>

                                                            <th>Sl.No</th>
                                                            <th>Category</th>
                                                            <th>Item</th>
                                                            <th>Item_HSN</th>
                                                            <th>Qty</th>
                                                            <th>Unit</th>
                                                            <th>Price/Unit</th>
                                                            <th>Discount</th>
                                                            <th>Tax</th>
                                                            <th>Tax Amount</th>
                                                            <th>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sales?.items?.map((item, index) => (
                                                            <tr key={index}>
                                                                {/* <td> {(partyDetails?.currentPage - 1) * 10 + (index + 1)}.</td> */}
                                                                <td>{index + 1}</td>
                                                                <td>{item?.Item_Category}</td>
                                                                <td>{item?.Item_Name}</td>
                                                                <td>{item?.Item_HSN}</td>
                                                                <td>{item?.Quantity}</td>
                                                                <td>{item?.Item_Unit}</td>
                                                                <td>{item?.Sale_Price}</td>
                                                                <td>{
                                                                    item?.Discount_Type_On_Sale_Price === "Percentage" ? `${item?.Discount_On_Sale_Price == 0.00 ? 0 : item?.Discount_On_Sale_Price}%` : `₹${item?.Discount_On_Sale_Price}`
                                                                }</td>

                                                                <td>{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
                                                                }</td>
                                                                <td>{item?.Tax_Amount}</td>
                                                                <td>{item?.Amount}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="w-full"> {/* Container to ensure the totals span full available width */}

                                                {/* This inner div is what holds the totals and is pushed to the right */}
                                                <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
                                                    style={{ width: "100%" }}>

                                                    {/* Total Amount Field */}
                                                    <div className="flex justify-between items-center">
                                                        <label className="font-medium">Total Amount</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field border-b border-gray-300  w-1/2 p-1"
                                                            value={sales?.Total_Amount ?? 0.00}
                                                            readOnly
                                                        />
                                                    </div>

                                                    {/* Total Received Field */}
                                                    <div className="flex justify-between items-center">
                                                        <label className="font-medium">Total Received</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field border-b border-gray-300 w-1/2 p-1"
                                                            value={sales?.Total_Received ?? 0.00}
                                                            readOnly
                                                        />
                                                    </div>

                                                    {/* Balance Due Field (Often styled differently) */}
                                                    <div className="flex justify-between items-center ">
                                                        <label className="font-bold text-lg">Balance Due</label>
                                                        <input
                                                            style={{ backgroundColor: "transparent" }}
                                                            type="text"
                                                            className="input-field  w-1/2 p-1 font-extrabold text-lg"
                                                            value={sales?.Balance_Due ?? 0.00}
                                                            readOnly
                                                        />
                                                    </div>

                                                </div>
                                            </div>


                                        </div>
                                        <div className="border-b border-black-300"></div>
                                    </div>)) : (<p className="text-center">No sales </p>)}
                            {partyDetails && sales?.length > 0 &&
                                <div className="grid grid-rows-2 mt-1">
                                    <div className=" flex justify-center items-center">
                                        <h4>Sales Summary</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
                                        style={{ width: "100%" }}>

                                        {/* Total Amount Field */}
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium">Total Amount</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field border-b border-gray-300   p-1"
                                                value={partyDetails?.summary?.sales?.Total_Amount ?? 0.00}
                                                readOnly
                                            />
                                        </div>

                                        {/* Total Received Field */}
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium">Total Received</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field border-b border-gray-300  p-1"
                                                value={partyDetails?.summary?.sales?.Total_Received ?? 0.00}
                                                readOnly
                                            />
                                        </div>

                                        {/* Balance Due Field (Often styled differently) */}
                                        <div className="flex justify-between items-center ">
                                            <label className="font-bold text-lg">Balance Due</label>
                                            <input
                                                style={{ backgroundColor: "transparent" }}
                                                type="text"
                                                className="input-field   p-1 font-extrabold text-lg"
                                                value={partyDetails?.summary?.sales?.Balance_Due ?? 0.00}
                                                readOnly
                                            />


                                        </div>
                                    </div>
                                </div>}




                        </div>
                        <div className="flex justify-center align-center space-x-2 p-4">
                            <button type="button"
                                onClick={() => handlePreviousPage()}
                                disabled={page === 1}
                                className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === 1 ? 'opacity-50 ' : ''}
                `}
                            >
                                ← Previous
                            </button>
                            {[...Array(partyDetails?.totalPages).keys()].map((index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(index + 1)}
                                    // className={`px-3 py-1 rounded ${page === index + 1 ? 'bg-[#7346ff] text-white' : 'bg-gray-200 hover:bg-gray-300'
                                    //     }`}
                                    className={
                                        `px-3 py-1 rounded ${page === index + 1 ? 'bg-[#4CA1AF] text-white' :
                                            'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            <button type="button"
                                onClick={() => handleNextPage()}
                                disabled={page === partyDetails?.totalPages || partyDetails?.totalPages === 0}
                                className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === partyDetails?.totalPages || partyDetails?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                            >
                                Next →
                            </button>
                        </div>
                 
            {showPrint && <PartyDetailPrint data={partyDetails} />}
        </>
    )
}
