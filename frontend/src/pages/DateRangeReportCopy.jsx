// import {   useParams } from "react-router-dom";
// import { useGetSalesNewSalesPurchasesInDateRangeQuery, usePrintDailyReportMutation } from "../redux/api/reportApi"
// import { useState } from "react";



// export default function DateRangeReport() {
//  const TAX_TYPES = {
//         "GST0": "GST 0%",
//         "GST0.25": "GST 0.25%",
//         "GST3": "GST 3%",
//         GST5: "GST 5%",
//         GST12: "GST 12%",
//         GST18: "GST 18%",
//         GST28: "GST 28%",
//         GST40: "GST 40%",
//         "IGST0": "IGST 0%",
//         "IGST0.25": "IGST 0.25%",
//         "IGST3": "IGST 3%",
//         IGST5: "IGST 5%",
//         IGST12: "IGST 12%",
//         IGST18: "IGST 18%",
//         IGST28: "IGST 28%",
//         IGST40: "IGST 40%"
//     }
//   const {fromDate,toDate}=useParams();

//   const[page, setPage] = useState(1);
//       const handlePageChange = (newPage) => {
//         setPage(newPage);
//     }
//     const handleNextPage = () => {
//         setPage(page + 1);
//     }
//     const handlePreviousPage = () => {
//         setPage(page - 1);
//     }
//   //console.log(date);
//   const{data:getSalesNewSalesPurchasesDateRange}= 
//   useGetSalesNewSalesPurchasesInDateRangeQuery({
//      page,
//         fromDate,
//         toDate,
//   });
//   const salesNewSalesPurchasesEachDay=getSalesNewSalesPurchasesDateRange?.data;
//   console.log(getSalesNewSalesPurchasesDateRange,salesNewSalesPurchasesEachDay);
//   const sales=salesNewSalesPurchasesEachDay?.sales?.items||[];
// //   const newSales=salesNewSalesPurchasesEachDay?.newSales?.items||[];
//   const purchases=salesNewSalesPurchasesEachDay?.purchases?.items||[];
//  const salesPage = getSalesNewSalesPurchasesDateRange?.page || 1;
// const limit = getSalesNewSalesPurchasesDateRange?.limit || 10;

// const purchaseTotalCount =
//   getSalesNewSalesPurchasesDateRange?.purchaseTotalCount || 0;

// // how many records exist BEFORE sales begin
// const salesStartIndex = Math.max(purchaseTotalCount - (salesPage - 1) * limit, 0) > 0
//   ? 0
//   : (salesPage - 1) * limit - purchaseTotalCount;
// //   const limit = getSalesNewSalesPurchasesDateRange?.limit || 10;
// // const salesPage = getSalesNewSalesPurchasesDateRange?.page || 1;




// // // total pages that had purchases
// // const purchasePages = Math.ceil(
// //   (getSalesNewSalesPurchasesDateRange?.purchaseTotalCount || 0) / limit
// // );

// // // how many sales pages already passed
// // const salesPagesBefore =
// //   salesPage > purchasePages ? salesPage - purchasePages - 1 : 0;

// // // how many sales already shown
// // const salesStartIndex = salesPagesBefore * limit;
//   console.log(sales,purchases,"sales,purchases");
//       const[printDailyReport,{isLoading:isPrintLoading}]=usePrintDailyReportMutation();
//   //  const handlePrint = async () => {
//   //   try {
//   //     console.log("🖨️ Print clicked",getSalesNewSalesPurchasesDateRange?.data);
//   //     const pdfBlob = await printDailyReport(getSalesNewSalesPurchasesDateRange?.data).unwrap(); // now returns Blob
  
//   //     if (!pdfBlob) throw new Error("Failed to generate PDF");
  
//   //     // Create a URL for the PDF blob
//   //     const pdfUrl = window.URL.createObjectURL(pdfBlob);
  
//   //     // Open PDF in new tab
//   //     const newWindow = window.open(pdfUrl, "_blank");
//   //     if (newWindow) newWindow.focus();
//   //     else alert("Please allow pop-ups for printing.");
  
//   //   } catch (err) {
//   //     console.error("❌ Error during print process:", err);
//   //     alert("Could not generate the print document.");
//   //   }
//   // }
//   const handlePrint = async () => {
//   try {
//     const data = getSalesNewSalesPurchasesDateRange?.data;

//     // const payload = {
//     //     date:date,
//     //   sales: data?.sales?.items|| [],
//     //   totalSalesAmount: data?.sales?.totalSalesAmount,
//     //   totalSalesReceivedAmount: data?.sales?.totalSalesReceivedAmount,

//     //   newSales: data?.newSales?.items || [],
//     //   newSalesTotalAmount: data?.newSales?.newSalesAmount,
//     // totalNewSalesReceivedAmount: data?.newSales?.totalNewSalesReceivedAmount,

//     //   purchases: data?.purchases?.items || [],
//     //   totalPurchasesAmount: data?.purchases?.totalPurchasesAmount,
//     //   totalPurchasesPaidAmount: data?.purchases?.totalPurchasesPaidAmount
//     // };
// const payload = {
//   fromDate,toDate,

//   // SALES
//   sales: data?.sales?.items || [],
//   totalSalesAmount: data?.sales?.totalSalesAmount,
//   totalSalesReceivedAmount: data?.sales?.totalSalesReceivedAmount,
//   totalSalesBalanceDue: data?.sales?.totalSalesBalanceDue,

//   // NEW SALES
// //   newSales: data.newSales.items || [],
// //   totalNewSalesAmount: data.newSales.totalNewSalesAmount,
// //   totalNewSalesReceivedAmount: data.newSales.totalNewSalesReceivedAmount,
// //   totalNewSalesBalanceDue: data.newSales.totalNewSalesBalanceDue,

//   // PURCHASES
//   purchases: data?.purchases.items|| [],
//   totalPurchasesAmount: data?.purchases?.totalPurchasesAmount,
//   totalPurchasesPaidAmount: data?.purchases?.totalPurchasePaidAmount,
//   totalPurchasesBalanceDue: data?.purchases?.totalPurchasesBalanceDue
// };



//     console.log(" Sending payload:", payload);

//     const pdfBlob = await printDailyReport(payload).unwrap();

//     const url = URL.createObjectURL(pdfBlob);
//     const win = window.open(url, "_blank");
//     if (win) win.focus();

//   } catch (err) {
//     console.error("❌ Print Error:", err);
//     alert("Could not generate the print document.");
//   }
// };
// console.log(salesNewSalesPurchasesEachDay?.sales?.totalSalesAmount );
//    return (
         
            
//              <div className="sb2-2-3 mt-4">
//                  <div className="row" style={{margin: "0px"}}>
//                      <div className="col-md-12">
//                          <div style={{ padding: "20px" }}
//                              className="box-inn-sp">
//                              {/* <div className="flex justify-end  items-center gap-64">
//                                  <div style={{ marginTop: "0px",borderBottom:"none" }} 
//                                  className=" inn-title  ">
//                                      <h4 className="text-2xl font-bold mb-2">
//                                         DATE RANGE REPORT &nbsp; &nbsp;  {fromDate} to {toDate}
                                        
//                                      </h4>
                                     
//                                  </div>
                             
                                         
//                           <button
//                     type="button"
//                     disabled={isPrintLoading}
//                     onClick={()=>handlePrint()}
                  
//                     className=" text-white font-bold py-2 px-4 rounded"
//                     style={{ backgroundColor: "#4CA1AF" }}
//                   >
//                    {isPrintLoading ? "Printing..." : "Print"}
//                   </button>
//                   </div> */}
//                                         <div className="flex items-center justify-between w-full">
  
//   {/* LEFT spacer to center title */}
//   <div className="flex-1"></div>

//   {/* CENTER TITLE */}
//   <div
//     className="text-center flex-1  whitespace-nowrap inn-title "
//     style={{ marginTop: "0px", borderBottom: "none" }}
//   >
//     <h4 className="text-2xl font-bold mb-2">
//         DATE RANGE REPORT &nbsp;{fromDate} to {toDate}
//     </h4>
//   </div>

//   {/* PRINT BUTTON (Right aligned) */}
//   <div className="flex-1 flex justify-end">
//     <button
//       type="button"
//       disabled={isPrintLoading}
//       onClick={handlePrint}
//       className="text-white font-bold py-2 px-4 rounded"
//       style={{ backgroundColor: "#4CA1AF" }}
//     >
//       {isPrintLoading ? "Printing..." : "Print"}
//     </button>
//   </div>

// </div>
                              
//                              {purchases?.length > 0 && <div className="flex justify-center align-center">
//                                  <h3 className="text-2xl  font-bold mb-2"
//                                  style={{color:"red"}}>Total Purchases</h3>
//                              </div>}
//                              {salesNewSalesPurchasesEachDay && purchases?.length>0 &&
//                              purchases?.map((purchases,index) => (
//                               <div  key={purchases?.purchase_id}>
//                               <div className="w-8 h-8 rounded-full mt-1
//                               bg-red-500 flex justify-center items-center">
//                                  {/* {(getSalesNewSalesPurchasesDateRange?.currentPage - 1) * 10 + (index + 1)}. */}
//                                 {/* <span className="text-white ">{index+1}</span> */}
//                                  <span className="text-white ">
//                                  {(getSalesNewSalesPurchasesDateRange?.page - 1) * 10 + (index + 1)}</span>
//                               </div>
//                                 <div style={{padding:"0"}} className="tab-inn"
//                                >

//                                  <div style={{background: "#f0f0f0"}} className="row">
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              Party
//                                          </span>
//                                          <input type="text" value={purchases?.Party_Name ?? ""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              GSTIN
//                                          </span>
//                                          <input type="text" 
//                                          value={purchases?.GSTIN ?? ""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                 
                                 
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                                Bill Number
//                                          </span>
//                                          <input type="text" value={purchases?.Bill_Number??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                             Bill Date
//                                          </span>
//                                          <input type="text"
//                                             //  value={new Date(purchases?.Bill_Date??"").toLocaleDateString({
//                                             //      day: "numeric",
//                                             //      month: "numeric",
//                                             //      year: "numeric",
//                                             //  })}
//                                              value={purchases?.Bill_Date??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                 
                                
//                                      <div className="input-field col s6">
//                                          <span className="active ">
//                                              State of Supply
//                                          </span>
//                                          <input type="text" value={purchases?.State_Of_Supply??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">Payment Type</span>
//                                          <input type="text" value={purchases?.Payment_Type??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                
                                 
//                                      <div className="input-field col s6">
 
//                                          <span className="active">
//                                              Reference Number
 
//                                          </span>
//                                          <input type="text" value={purchases?.Reference_Number ?? "N/A"}
//                                              className="validate" readOnly />
//                                      </div>
//                                  </div>
//                                  <div className="table-responsive table-desi mt-4">
//                                      <table className="table table-hover">
//                                          <thead>
//                                              <tr>
 
//                                                  <th>Sl.No</th>
//                                                  <th>Category</th>
//                                                  <th>Item</th>
//                                                  <th>Item_HSN</th>
//                                                  <th>Qty</th>
//                                                  <th>Unit</th>
//                                                  <th>Price/Unit</th>
//                                                  <th>Discount</th>
//                                                  <th>Tax</th>
//                                                  <th>Tax Amount</th>
//                                                  <th>Amount</th>
//                                              </tr>
//                                          </thead>
//                                          <tbody>
//                                              {purchases?.items?.map((item, index) => (
//                                                  <tr key={index}>
//                                                      <td>{index + 1}</td>
//                                                      <td>{item?.Item_Category}</td>
//                                                      <td>{item?.Item_Name}</td>
//                                                      <td>{item?.Item_HSN}</td>
//                                                      <td>{item?.Quantity}</td>
//                                                      <td>{item?.Item_Unit}</td>
//                                                      <td>{item?.Purchase_Price}</td>
//                                                      <td>{
//                                                           item?.Discount_Type_On_Purchase_Price === "Percentage" ? `${item?.Discount_On_Purchase_Price==0.00?0:
//                                                             item?.Discount_On_Purchase_Price}%` : `₹${item?.Discount_On_Purchase_Price}`
//                                                      }</td>
//                                                      {/* <td>{item?.Tax_Type}</td> */}
//                                                      <td>{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
//                                                      }</td>
//                                                      <td>{item?.Tax_Amount}</td>
//                                                      <td>{item?.Amount}</td>
//                                                  </tr>
//                                              ))}
//                                          </tbody>
//                                      </table>
//                                  </div>
//                                <div className="w-full"> {/* Container to ensure the totals span full available width */}
     
//      {/* This inner div is what holds the totals and is pushed to the right */}
//      <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
//      style={{width:"100%"}}>
         
//          {/* Total Amount Field */}
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Amount</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300   p-1"
//                  value={purchases?.Total_Amount ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Total Received Field */}
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Paid</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300  p-1"
//                  value={purchases?.Total_Paid ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Balance Due Field (Often styled differently) */}
//          <div className="flex justify-between items-center ">
//              <label className="font-bold text-lg">Balance Due</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field   p-1 font-extrabold text-lg"
//                  value={purchases?.Balance_Due ?? 0.00}
//                  readOnly
//              />
         
         
//      </div>
//  </div>
 
// </div>
// </div>
//   {/* <div className="border-b border-black-300"></div> */}
// </div>
// ))}
// {/* // :(<p className="text-center">No Purchases</p>)} */}

// {/* {salesNewSalesPurchasesEachDay && purchases?.length>0 &&
//     <div className="grid grid-rows-2 mt-1">
//          <div className=" flex justify-center items-center">
//             <h4>Purchase Summary</h4>
//          </div>
     
//          <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
//          style={{width:"100%",marginBottom:"0px"}}>
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Amount</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300   p-1"
//                  value={salesNewSalesPurchasesEachDay?.purchases?.totalPurchasesAmount ?? 0.00}
//                  readOnly
//              />
//          </div>
         
         
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Paid</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300  p-1"
//                  value={salesNewSalesPurchasesEachDay?.purchases?.totalPurchasePaidAmount?? 0.00}
//                  readOnly
//              />
//          </div>
         
        
//          <div className="flex justify-between items-center ">
//              <label className="font-bold text-lg">Balance Due</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field   p-1 font-extrabold text-lg"
//                  value={salesNewSalesPurchasesEachDay?.purchases?.totalPurchasesBalanceDue ?? 0.00}
//                  readOnly
//              />
         
         
//      </div>
//      </div>
//  </div> } */}
                            
//                              {/* <div className="border-b border-black-300"></div> */}
//                              { sales?.length>0 &&<div className="flex justify-center align-center mt-2">
//                                  <h3 className="text-2xl  font-bold mb-2"
//                                  style={{color:"green"}}>Total Sales</h3>
//                              </div>}
//                               {salesNewSalesPurchasesEachDay && sales?.length>0 &&
//                               sales?.map((sales,index) => (
                                
//                               <div  key={sales?.sale_id}>
//                                <div className="w-8 h-8 rounded-full mt-1
//                               bg-green-500 flex justify-center items-center">
//                                  {/* <span className="text-white "> */}
//                                  {/* {(getSalesNewSalesPurchasesDateRange?.page - 1) * 10 + (index + 1)}</span> */}
//                                  <span className="text-white ">{salesStartIndex + index + 1}</span>
//                               </div>
//                               <div style={{padding:"0"}} className="tab-inn"
//                              >
//                                  <div style={{background: "#f0f0f0"}} className="row">
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              Party
//                                          </span>
//                                          <input type="text" value={sales?.Party_Name ?? ""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              GSTIN
//                                          </span>
//                                          <input type="text" 
//                                          value={sales?.GSTIN ?? ""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                 
                                 
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              Invoice Number
//                                          </span>
//                                          <input type="text" value={sales?.Invoice_Number??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">
//                                              Invoice Date
//                                          </span>
//                                          <input type="text"
//                                                 //  value={new Date(sales?.Invoice_Date??"").toLocaleDateString({
//                                                 //      day: "numeric",
//                                                 //      month: "numeric",
//                                                 //      year: "numeric",
//                                                 //  })}
//                                                 value={sales?.Invoice_Date??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                 
                                
//                                      <div className="input-field col s6">
//                                          <span className="active ">
//                                              State of Supply
//                                          </span>
//                                          <input type="text" value={sales?.State_Of_Supply??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
//                                      <div className="input-field col s6">
//                                          <span className="active">Payment Type</span>
//                                          <input type="text" value={sales?.Payment_Type??""}
//                                              className="validate" readOnly />
 
 
//                                      </div>
                                
                                 
//                                      <div className="input-field col s6">
 
//                                          <span className="active">
//                                              Reference Number
 
//                                          </span>
//                                          <input type="text" value={sales?.Reference_Number ?? "N/A"}
//                                              className="validate" readOnly />
//                                      </div>
//                                  </div>
//                                  <div className="table-responsive table-desi mt-4">
//                                      <table className="table table-hover">
//                                          <thead>
//                                              <tr>
 
//                                                  <th>Sl.No</th>
//                                                  <th>Category</th>
//                                                  <th>Item</th>
//                                                  <th>Item_HSN</th>
//                                                  <th>Qty</th>
//                                                  <th>Unit</th>
//                                                  <th>Price/Unit</th>
//                                                  <th>Discount</th>
//                                                  <th>Tax</th>
//                                                  <th>Tax Amount</th>
//                                                  <th>Amount</th>
//                                              </tr>
//                                          </thead>
//                                          <tbody>
//                                              {sales?.items?.map((item, index) => (
//                                                  <tr key={index}>
//                                                      <td>{index + 1}</td>
//                                                      <td>{item?.Item_Category}</td>
//                                                      <td>{item?.Item_Name}</td>
//                                                      <td>{item?.Item_HSN}</td>
//                                                      <td>{item?.Quantity}</td>
//                                                      <td>{item?.Item_Unit}</td>
//                                                      <td>{item?.Sale_Price}</td>
//                                                      <td>{
//                                                           item?.Discount_Type_On_Sale_Price === "Percentage" ? `${item?.Discount_On_Sale_Price==0.00?0:item?.Discount_On_Sale_Price}%` : `₹${item?.Discount_On_Sale_Price}`
//                                                      }</td>
//                                                      {/* <td>{item?.Tax_Type}</td> */}
//                                                      <td>{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
//                                                      }</td>
//                                                      <td>{item?.Tax_Amount}</td>
//                                                      <td>{item?.Amount}</td>
//                                                  </tr>
//                                              ))}
//                                          </tbody>
//                                      </table>
//                                  </div>
//                                <div className="w-full"> {/* Container to ensure the totals span full available width */}
     
//      {/* This inner div is what holds the totals and is pushed to the right */}
//      <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
//      style={{width:"100%"}}>
         
//          {/* Total Amount Field */}
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Amount</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300  w-1/2 p-1"
//                  value={sales?.Total_Amount ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Total Received Field */}
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Received</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300 w-1/2 p-1"
//                  value={sales?.Total_Received ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Balance Due Field (Often styled differently) */}
//          <div className="flex justify-between items-center ">
//              <label className="font-bold text-lg">Balance Due</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field  w-1/2 p-1 font-extrabold text-lg"
//                  value={sales?.Balance_Due ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//      </div>
//  </div>
 
   
//                              </div>
//                               <div className="border-b border-black-300"></div>
//                             </div>))}
                            
//                             {/* // :
//                             // (<p className="text-center">No sales </p>)} */}

                            
//                             {/* {salesNewSalesPurchasesEachDay && sales?.length>0 &&
//                      <div className="grid grid-rows-2 mt-1">
//          <div className=" flex justify-center items-center">
//             <h4>Sales Summary</h4>
//          </div> 
//     <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
//      style={{width:"100%"}}>
         
//          {/* Total Amount Field 
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Amount</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300   p-1"
//                  value={salesNewSalesPurchasesEachDay?.sales?.totalSalesAmount ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Total Received Field 
//          <div className="flex justify-between items-center">
//              <label className="font-medium">Total Received</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field border-b border-gray-300  p-1"
//                  value={salesNewSalesPurchasesEachDay?.sales?.totalSalesReceivedAmount ?? 0.00}
//                  readOnly
//              />
//          </div>
         
//          {/* Balance Due Field (Often styled differently) 
//          <div className="flex justify-between items-center ">
//              <label className="font-bold text-lg">Balance Due</label>
//              <input
//                  style={{ backgroundColor: "transparent" }}
//                  type="text"
//                  className="input-field   p-1 font-extrabold text-lg"
//                  value={salesNewSalesPurchasesEachDay?.sales?.totalSalesBalanceDue ?? 0.00}
//                  readOnly
//              />
         
         
//      </div>
//      </div>  
//  </div> } */}
//                                                       <div className="flex justify-center align-center p-4">
//   <div className="flex items-center space-x-2 flex-wrap justify-center">

//     {/* PREVIOUS */}
//     <button
//       type="button"
//       onClick={() => handlePreviousPage()}
//       disabled={page === 1}
//       className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
//         ${page === 1 ? 'opacity-50 ' : ''}
//       `}
//     >
//       ← Previous
//     </button>

//     {/* PAGE NUMBERS — DESKTOP / TABLET */}
//     <div style={{marginRight:"0px"}}
//     className="hidden sm:flex space-x-2">
//       {/* {[...Array(foodItems?.totalPages).keys()].map((index) => (
//         <button
//           key={index}
//           onClick={() => handlePageChange(index + 1)}
//           className={
//             `px-3 py-1 rounded ${
//               page === index + 1
//                 ? 'bg-[#ff0000] text-white'
//                 : 'bg-gray-200 hover:bg-gray-300'
//             }`
//           }
//         >
//           {index + 1}
//         </button>
//       ))} */}
//                   {(() => {
//   const totalPages = getSalesNewSalesPurchasesDateRange?.totalPages || 1;
//   const maxVisible = 5; // how many pages around current
//   const pages = [];

//   let start = Math.max(1, page - 2);
//   let end = Math.min(totalPages, page + 2);

//   // Adjust if near start
//   if (page <= 3) {
//     end = Math.min(totalPages, maxVisible);
//   }

//   // Adjust if near end
//   if (page > totalPages - 3) {
//     start = Math.max(1, totalPages - maxVisible + 1);
//   }

//   // First page + dots
//   if (start > 1) {
//     pages.push(
//       <button
//         key={1}
//         onClick={() => handlePageChange(1)}
//         className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
//       >
//         1
//       </button>
//     );

//     if (start > 2) {
//       pages.push(
//         <span key="start-dots" className="px-2">...</span>
//       );
//     }
//   }

//   // Middle pages
//   for (let i = start; i <= end; i++) {
//     pages.push(
//       <button
//         key={i}
//         onClick={() => handlePageChange(i)}
//         className={`px-3 py-1 rounded ${
//           page === i
//             ? 'bg-[#4CA1AF] text-white'
//             : 'bg-gray-200 hover:bg-gray-300'
//         }`}
//       >
//         {i}
//       </button>
//     );
//   }

//   // Last page + dots
//   if (end < totalPages) {
//     if (end < totalPages - 1) {
//       pages.push(
//         <span key="end-dots" className="px-2">...</span>
//       );
//     }

//     pages.push(
//       <button
//         key={totalPages}
//         onClick={() => handlePageChange(totalPages)}
//         className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
//       >
//         {totalPages}
//       </button>
//     );
//   }

//   return pages;
// })()}
//     </div>

//     {/* CURRENT PAGE — MOBILE ONLY */}
//     <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm">
//       Page {page} / {getSalesNewSalesPurchasesDateRange?.totalPages || 1}
//     </div>

//     {/* NEXT */}
//     <button
//       type="button"
//       onClick={() => handleNextPage()}
//       disabled={page === getSalesNewSalesPurchasesDateRange?.totalPages || 
//         getSalesNewSalesPurchasesDateRange?.totalPages === 0}
//       className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
//         ${
//           page === getSalesNewSalesPurchasesDateRange?.totalPages ||
//           getSalesNewSalesPurchasesDateRange?.totalPages === 0
//             ? 'opacity-50 '
//             : ''
//         }
//       `}
//     >
//       Next →
//     </button>

//   </div>
// </div>

 

                             
//                          </div>
                       
//                      </div>
//                  </div>
//              </div>
         
//      );
// }
