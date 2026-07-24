import { useState } from "react";
import { useGetEachItemSalesPurchasesDetailsQuery, usePrintEachItemSalesPurchasesDetailsReportMutation } from "../../redux/api/itemApi";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { Eye, Square, SquarePen } from "lucide-react";
import ItemDetailsPrint from "../../components/ItemDetailsPrint/ItemDetailsPrint";


export default function ItemsSalesPurchasesDetails() {
    const location = useLocation();
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
   const {id:Item_Id} = useParams();
   console.log(Item_Id);
     
    const { data: eachItemSalesPurchaseDetails } = 
    useGetEachItemSalesPurchasesDetailsQuery(Item_Id);
    console.log(eachItemSalesPurchaseDetails, "eachItemSalesPurchaseDetails");
    const navigate = useNavigate();
    const purchases=eachItemSalesPurchaseDetails?.purchases||[];
    const sales=eachItemSalesPurchaseDetails?.sales||[];

    const[eachItemSalesPurchaseDetailsReport,{isLoading:isPrintLoading}]=
        usePrintEachItemSalesPurchasesDetailsReportMutation()
    
    const[page,setPage] = useState(1);
     const handlePageChange = (newPage) => {
        setPage(newPage)
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
//     const handlePrint = async () => {
//   try {
//     const payload = {
//       //party: partyDetails?.partyDetails,
//       itemName: eachItemSalesPurchaseDetails?.Item_Name,
//       purchases: eachItemSalesPurchaseDetails?.purchases ?? [],
//       sales: eachItemSalesPurchaseDetails?.sales ?? [],
//     //   summary: {
//     //     purchaseSummary: partyDetails?.summary?.purchases,
//     //     salesSummary: partyDetails?.summary?.sales,
//     //   },
//     };

//     console.log("Print Payload:", payload);

//     const pdfBlob = await eachItemSalesPurchaseDetailsReport(payload).unwrap(); // your RTK mutation

//     const url = URL.createObjectURL(pdfBlob);
//     window.open(url, "_blank");

//   } catch (err) {
//     console.error("❌ Print Error:", err);
//     alert("Could not generate print PDF.");
//   }
// };
return (
    <>
         {/* <div className="sb2-2-3 mt-4">
                 <div className="row" style={{margin: "0px"}}>
                     <div className="col-md-12">
                         <div style={{ padding: "20px" }}
                             className="box-inn-sp"> */}
     
                         <div style={{ padding: "20px" }}
                             className="flex flex-col bg-white mt-4">
                             
                       <div className="flex items-center justify-between w-full">
  
  {/* LEFT spacer to center title */}
  <div className="flex-1"></div>

  {/* CENTER TITLE */}
   <div
    className="text-center flex-1 whitespace-nowrap  inn-title "
    style={{ marginTop: "0px", borderBottom: "none" }}
  >
    <h4 className="text-2xl font-bold mb-2">
      ITEM NAME : {eachItemSalesPurchaseDetails?.Item_Name} 
    </h4>

    {/* <div className='flex flex-row gap-4 w-full'>
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
    </div> */}
  </div> 

  {/* PRINT BUTTON (Right aligned) */}
  <div className="flex-1 flex justify-end gap-4">
      <button
        type="button"
                onClick={()=> navigate({
  pathname:"/items/all-items",
  search: location.search,
})}
        // onClick={() => navigate("/items/all-items")}
        className="text-white font-bold py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
        Back
      </button>
        <button
        type="button"
        onClick={()=>handlePrint()}
        className="text-white font-bold py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
      
        {isPrintLoading?"Printing...":"Print"} 
      </button>
    {/* <button
      type="button"
    //   disabled={isPrintLoading}
    //   onClick={handlePrint}
      className="text-white font-bold py-2 px-4 rounded"
      style={{ backgroundColor: "#4CA1AF" }}
    >
        Print
      
    </button> */}
  </div>

</div>

                             <div className="flex justify-center align-center">
                                 <h3 className="text-2xl  font-bold mb-2"
                                 style={{color:"red"}}> Purchases</h3>
                             </div>
                             {eachItemSalesPurchaseDetails && purchases?.length>0 ?
                             purchases?.map((purchases,index) => (

                              <div  key={purchases?.Purchase_Id}>
                              <div className="w-8 h-8 rounded-full mt-1
                              bg-red-500 flex justify-center items-center">
                                <span className="text-white ">{index+1}</span>
                              </div>
                                <div style={{padding:"0"}} className="tab-inn">
                              
                                  <div style={{width:"100%",padding:"0px"}}
                                       className=" flex  justify-end gap-2">  
                                                {/* <Eye
                                         onClick={() =>
                                           navigate(`/purchase/view/${purchases?.Purchase_Id}`, {
                                             state: {
                                               from: "item-sales-purchases-details",
                                               itemId: Item_Id
                                             }
                                           })
                                         }
                                         style={{
                                           cursor: "pointer",
                                           backgroundColor: "transparent",
                                           color: "#4CA1AF"
                                         }}
                                       /> */}
                                          <NavLink 
                                          to={`/purchase/view/${purchases?.Purchase_Id}${location.search}`}
                                        state={{ from: "item-sales-purchases-details",itemId: Item_Id }}
                                    >
                                    <Eye
                                       style={{
                                          cursor: "pointer",
                                           backgroundColor: "transparent",
                                           color: "#4CA1AF",
                                            }}
                                            />
                                         </NavLink>
                                          <NavLink 
                                          to={`/purchase/edit/${purchases?.Purchase_Id}${location.search}`}
                                        state={{ from: "item-sales-purchases-details",itemId: Item_Id }}
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
                                  {/* <Eye onClick={() => navigate(`/purchase/view/${purchases?.Purchase_Id}`)}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: "transparent",
                                    color: "#4CA1AF"
                                  }} /></div> */}
                                 <div style={{background: "#f0f0f0"}} className="row ">
                                     
                                  <div className="input-field col s6">
                                         <span className="active">
                                               Party Name
                                         </span>
                                         <input type="text" value={purchases?.Party_Name??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                               
                                     <div className="input-field col s6">
                                         <span className="active">
                                               Bill Number
                                         </span>
                                         <input type="text" value={purchases?.Bill_Number??""}
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
                                                )??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                                 
                                
                                     <div className="input-field col s6">
                                         <span className="active ">
                                             State of Supply
                                         </span>
                                         <input type="text" value={purchases?.State_Of_Supply??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                                     <div className="input-field col s6">
                                         <span className="active">Payment Type</span>
                                         <input type="text" value={purchases?.Payment_Type??""}
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
                                                 <tr key={index} >
                                                     <td className={
                                                      item.Item_Id==Item_Id ? "selected" : ""}>{index + 1}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Item_Category}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Item_Name}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Item_HSN}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Quantity}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Item_Unit}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Purchase_Price}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{
                                                          item?.Discount_Type_On_Purchase_Price === "Percentage" ? `${item?.Discount_On_Purchase_Price==0.00?0:
                                                            item?.Discount_On_Purchase_Price}%` : `₹${item?.Discount_On_Purchase_Price}`
                                                     }</td>
                                                    
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""} >{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
                                                     }</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Tax_Amount}</td>
                                                     <td className={item.Item_Id==Item_Id ? "selected" : ""}>{item?.Amount}</td>
                                                 </tr>
                                             ))}
                                         </tbody> 
                                     </table>
                                 </div>
                               <div className="w-full"> 
                                {/* Container to ensure the totals span full available width */}
     
     {/* This inner div is what holds the totals and is pushed to the right */}
      <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
     style={{width:"100%"}}>
         
      
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
:(<p className="text-center">No Purchases</p>)

}

{/* {eachItemSalesPurchaseDetails && purchases?.length>0 && */}
    {/* <div className="grid grid-rows-2 mt-1">
         <div className=" flex justify-center items-center">
            <h4>Purchase Summary</h4>
         </div>
        
         <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
         style={{width:"100%",marginBottom:"0px"}}>
         <div className="flex justify-between items-center">
             <label className="font-medium">Total Amount</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field border-b border-gray-300   p-1"
                 //value={eachItemSalesPurchaseDetails?.summary?.purchases?.Total_Amount ?? 0.00}
                 readOnly
             />
         </div>
        
         <div className="flex justify-between items-center">
             <label className="font-medium">Total Paid</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field border-b border-gray-300  p-1"
                 //value={eachItemSalesPurchaseDetails?.summary?.purchases?.Total_Paid?? 0.00}
                 readOnly
             />
         </div>
        
         <div className="flex justify-between items-center ">
             <label className="font-bold text-lg">Balance Due</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field   p-1 font-extrabold text-lg"
                 //value={eachItemSalesPurchaseDetails?.summary?.purchases?.Balance_Due ?? 0.00}
                 readOnly
             />
         
         
     </div>
     </div>
 </div> } */}                      <div className="border-b border-black-300"></div>
                                 <div className="flex justify-center align-center mt-2">
                                 <h3 className="text-2xl  font-bold mb-2"
                                 style={{color:"green"}}> Sales</h3>
                             </div>
                           
                                   {eachItemSalesPurchaseDetails && sales?.length>0 ?
                             sales?.map((sales,index) => (

                              <div  key={sales?.Sale_Id}>
                              <div className="w-8 h-8 rounded-full mt-1
                              bg-red-500 flex justify-center items-center">
                                <span className="text-white ">{index+1}</span>
                              </div>
                                <div style={{padding:"0"}} className="tab-inn"
                               >
                                  <div style={{width:"100%",padding:"0px"}}
                                       className=" flex  justify-end gap-2">    
                                  {/* <Eye onClick={() => navigate(`/sale/view/${sales?.Sale_Id}`)}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: "transparent",
                                    color: "#4CA1AF"
                                  }} /> */}
                                        {/* <Eye
                                         onClick={() =>
                                           navigate(`/sale/view/${sales?.Sale_Id}`, {
                                             state: {
                                               from: "item-sales-purchases-details",
                                               itemId: Item_Id
                                             }
                                           })
                                         }
                                         style={{
                                           cursor: "pointer",
                                           backgroundColor: "transparent",
                                           color: "#4CA1AF"
                                         }}
                                       /> */}
                                          <NavLink 
                                          to={`/sale/view/${sales?.Sale_Id}${location.search}`}
                                        state={{ from: "item-sales-purchases-details" ,itemId: Item_Id}}
                                    >
                                    <Eye
                                       style={{
                                          cursor: "pointer",
                                           backgroundColor: "transparent",
                                           color: "#4CA1AF",
                                            }}
                                            />
                                         </NavLink>
                                         <NavLink 
                                          to={`/sale/edit/${sales?.Sale_Id}${location.search}`}
                                        state={{ from: "item-sales-purchases-details" ,itemId: Item_Id}}
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
                                  
                                 <div style={{background: "#f0f0f0"}} className="row">
                                     
                                 
                                     <div className="input-field col s6">
                                         <span className="active">
                                              Invoice Number
                                         </span>
                                         <input type="text" value={sales?.Invoice_Number??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                                     <div className="input-field col s6">
                                         <span className="active">
                                            Invoice Date
                                         </span>
                                         <input type="text"
                                         
                                             value={new Date(sales?.Invoice_Date).
                                                toLocaleDateString("en-IN",
                                                {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                }
                                                )??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                                 
                                
                                     <div className="input-field col s6">
                                         <span className="active ">
                                             State of Supply
                                         </span>
                                         <input type="text" value={sales?.State_Of_Supply??""}
                                             className="validate" readOnly />
 
 
                                     </div>
                                     <div className="input-field col s6">
                                         <span className="active">Payment Type</span>
                                         <input type="text" value={sales?.Payment_Type??""}
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
                                                 <tr key={index} >
                                                     <td className={
                                                      item.Item_Id==Item_Id ? "sale-selected" : ""}>{index + 1}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Item_Category}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Item_Name}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Item_HSN}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Quantity}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Item_Unit}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Sale_Price}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{
                                                          item?.Discount_Type_On_Sale_Price === "Percentage" ? `${item?.Discount_On_Sale_Price==0.00?0:
                                                            item?.Discount_On_Sale_Price}%` : `₹${item?.Discount_On_Sale_Price}`
                                                     }</td>
                                                    
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""} >{Object.keys(TAX_TYPES).includes(item?.Tax_Type) ? TAX_TYPES[item?.Tax_Type] : item?.Tax_Type
                                                     }</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Tax_Amount}</td>
                                                     <td className={item.Item_Id==Item_Id ? "sale-selected" : ""}>{item?.Amount}</td>
                                                 </tr>
                                             ))}
                                         </tbody> 
                                     </table>
                                 </div>
                               <div className="w-full"> 
                                {/* Container to ensure the totals span full available width */}
     
     {/* This inner div is what holds the totals and is pushed to the right */}
      <div className="grid grid-cols-3 gap-4  sm:w-1/2 md:w-1/3 "
     style={{width:"100%"}}>
         
      
         <div className="flex justify-between items-center">
             <label className="font-medium">Total Amount</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field border-b border-gray-300   p-1"
                 value={sales?.Total_Amount ?? 0.00}
                 readOnly
             />
         </div>
         
         
         <div className="flex justify-between items-center">
             <label className="font-medium">Total Received</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field border-b border-gray-300  p-1"
                 value={sales?.Total_Received ?? 0.00}
                 readOnly
             />
         </div>
         
    
         <div className="flex justify-between items-center ">
             <label className="font-bold text-lg">Balance Due</label>
             <input
                 style={{ backgroundColor: "transparent" }}
                 type="text"
                 className="input-field   p-1 font-extrabold text-lg"
                 value={sales?.Balance_Due ?? 0.00}
                 readOnly
             />
         
         
     </div>
 </div> 
 
</div>
</div>
  <div className="border-b border-black-300"></div>
</div>
))
:(<p className="text-center">No Sales</p>)

}                        
                                  

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
                            {[...Array(eachItemSalesPurchaseDetails?.totalPages).keys()].map((index) => (
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
                                disabled={page === eachItemSalesPurchaseDetails?.totalPages || eachItemSalesPurchaseDetails?.totalPages === 0}
                                className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === eachItemSalesPurchaseDetails?.totalPages || eachItemSalesPurchaseDetails?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                            >
                                Next →
                            </button>
                        </div>
                   
              {showPrint && <ItemDetailsPrint data={eachItemSalesPurchaseDetails} />}
             <style>
              {`
              .selected {
  background-color: #ec3b0eff !important;
  color: white !important;
}

.sale-selected {
  background-color: green !important;
  color: white !important;
},
               `
              }
             </style>
    </>
  )
}
