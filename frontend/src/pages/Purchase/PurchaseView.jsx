import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { LayoutDashboard } from "lucide-react";

export default function PurchaseView() {
     const navigate = useNavigate();
       const location=useLocation()
     const from =location.state?.from 
const Party_Id = location.state?.partyId;
const Item_Id=location.state?.itemId
    
     console.log(Party_Id);
    console.log(from);
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
        const {id:Purchase_Id} = useParams()
    const {data:purchase} = useGetSinglePurchaseQuery(Purchase_Id)
    console.log(purchase);
   
    
return (
        <>
            <div className="sb2-2-2">
                <ul>

                    <NavLink style={{ display: "flex", flexDirection: "row" }}
                        to="/home"

                    >
                        <LayoutDashboard size={20} style={{ marginRight: '8px' }} />

                        Dashboard
                    </NavLink>

                </ul>
            </div>
            {/* <div className="sb2-2-3">
                <div className="row" style={{margin: "0px"}}>
                    <div className="col-md-12">
                        <div style={{ padding: "20px" }}
                            className="box-inn-sp"> */}
           
                        <div style={{ padding: "20px" }}
                            className="flex flex-col bg-white ">
                            
                                {/* <div style={{ marginTop: "15px" }} className=" inn-title  ">
                                    <h4 className="text-2xl font-bold mb-2">View Purchase</h4>
                                    <p className="text-gray-500 mb-6">View Purchase Details</p>
                                </div> */}
    <div className="inn-title w-full px-2 py-3">

  <div className="
    flex flex-col sm:flex-row 
    justify-between 
    items-start sm:items-center 
    w-full 
  
    mt-4              
  ">

    {/* LEFT HEADER */}
    <div className="w-full sm:w-auto">
      <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-4">View Purchase</h4>
     
    </div>

    {/* RIGHT BUTTON SECTION */}
    <div className="
      w-full sm:w-auto 
      flex flex-wrap sm:flex-nowrap 
      justify-start sm:justify-end 
      gap-3
    ">
      {/* <button
        type="button"
        onClick={() => navigate("/home")}
        className="text-white font-bold py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
        Back
      </button> */}
      {/* <button 
  type="button"
  onClick={() => {
    if (from === "party-sales-purchases-details") {
      navigate(`/party/party-sales-purchases-details/${Party_Id}`);
    } else if (from === "item-sales-purchases-details") {
      navigate(`/item/item-sales-purchases-details/${Item_Id}`);
    } else {
      navigate("/sale/all-sales");
    }
  }}
  className="text-white font-bold py-2 px-4 rounded"
  style={{ backgroundColor: "#4CA1AF" }}
>
  Back
</button> */}
  <button
  type="button"
     onClick={() => {
    if (from === "party-sales-purchases-details") {

          navigate({
  pathname: `/party/party-sales-purchases-details/${Party_Id}`,
  search: location.search,
})
 
      //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
    } else if (from === "item-sales-purchases-details") {
     navigate({
  pathname: `/item/item-sales-purchases-details/${Item_Id}`,
  search: location.search,
})
      // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
    } 
     else if (from === "party-payables") {
      

      navigate({
  pathname: `/party/payables`,
  search: location.search,
})
}  
    else {
    navigate({
  pathname: "/purchase/all-purchases",
  search: location.search,
})
     
      // navigate("/sale/all-sales");
    }
  }}
//     onClick={() => {
//     if (from === "party-sales-purchases-details") {
//       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
// //        navigate({
// //   pathname: `/party/party-sales-purchases-details/${Party_Id}`,
// //   search: location.search,
// // })
//       //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
//     } else if (from === "item-sales-purchases-details") {
//      navigate({
//   pathname: `/item/item-sales-purchases-details/${Item_Id}`,
//   search: location.search,
// })
//       // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
//     } else {
//                                     navigate({
//   pathname: "/purchase/all-purchases",
//   search: location.search,
// })
     
//       // navigate("/sale/all-sales");
//     }
//   }}
//   onClick={() => {
//     if (from === "party-sales-purchases-details") {
//       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
//     } 
    
//     else if (from === "item-sales-purchases-details") {
//       navigate(`/item/item-sales-purchases-details/${Item_Id}`);
//     }else {
//                                               navigate({
//   pathname: "/purchase/all-purchases",
//   search: location.search,
// })
//       // navigate(`/purchase/all-purchases`);
//     }
//   }}
  className="text-white font-bold py-2 px-4 rounded"
  style={{ backgroundColor: "#4CA1AF" }}
>
  Back
</button>

      <button
        type="button"
        onClick={() => navigate("/purchase/all-purchases")}
        className="text-white py-2 px-4 rounded"
        style={{ backgroundColor: "#4CA1AF" }}
      >
        All Purchases
      </button>
    </div>

  </div>
</div>
                           
                            <div style={{padding:"0"}} className="tab-inn">
                                {/* <div className="row">
                                    <div className="input-field col s6">
                                        <span className="active">
                                            Party
                                        </span>
                                        <input type="text" value={purchase?.billPurchaseDetails?.Party_Name ?? ""}
                                            className="validate" readOnly />


                                    </div>
                                    <div className="input-field col s6">
                                        <span className="active">
                                            GSTIN
                                        </span>
                                        <input type="text" value={purchase?.billPurchaseDetails?.GSTIN ?? ""}
                                            className="validate" readOnly />


                                    </div>
                                </div>
                                <div className="row">
                                    <div className="input-field col s6">
                                        <span className="active">
                                            Bill Number
                                        </span>
                                        <input type="text" 
                                        value={purchase?.billPurchaseDetails?.Bill_Number ?? "N/A"}
                                            className="validate" readOnly />


                                    </div>
                                    <div className="input-field col s6">
                                        <span className="active">
                                            Bill Date
                                        </span>
                                        <input type="text"
                                            value={
                                                new Date(purchase
                                                    ?.billPurchaseDetails?.Bill_Date).toLocaleDateString({
                                                day: "numeric",
                                                month: "numeric",
                                                year: "numeric",
                                            })}
                                            className="validate" readOnly />


                                    </div>
                                </div>

                                <div className="row">
                                    <div className="input-field col s6">
                                        <span className="active ">
                                            State of Supply
                                        </span>
                                        <input type="text" 
                                        value={purchase?.billPurchaseDetails?.State_Of_Supply ?? "N/A"}
                                            className="validate" readOnly />


                                    </div>
                                    <div className="input-field col s6">
                                        <span className="active">Payment Type</span>
                                        <input type="text" value={purchase?.billPurchaseDetails?.Payment_Type ?? "N/A"}
                                            className="validate" readOnly />


                                    </div>
                                </div>
                                <div className="row w-1/2 mt-2">
                                    <div className="input-field col s6">

                                        <span className="active">
                                            Reference Number

                                        </span>
                                        <input type="text" value={purchase?.billPurchaseDetails?.Reference_Number ?? "N/A"}
                                            className="validate" readOnly />
                                    </div>
                                </div> */}
                                <div className="flex flex-col justify-between gap-6 w-full sm:flex-row heading-wrapper">
                                                    <div className="grid grid-rows-3 ml-2 w-full sm:w-1/2 lg:w-1/3 ">
                                                      {/* <div className="input-field col s6 relative"> */}
                                                      <div className=" flex  items-center gap-2 relative 
                                                       party-class"
                                                        style={{ marginBottom: "0px", marginTop: "0px" }}>
                                                        <span className="whitespace-nowrap active ">
                                                          Party
                                                         
                                                        </span>
                                                        
                              
                                         <input type="text"   style={{ marginBottom: "0px" }}
                                         value={purchase?.billPurchaseDetails?.Party_Name ?? ""}
                                             readOnly />
                                                        {/* RHF Error */}
                                                       
                                                      </div>
                                                      <div className="input-field  flex gap-2
                                                              justify-center items-center w-1/2 gstin-class">
                                                        <span className=" whitespace-nowrap active ">
                                                          GSTIN
                                
                                                        </span>
                                
                        <input type="text" style={{ marginBottom: "0px" }}
                        value={purchase?.billPurchaseDetails?.GSTIN ?? ""}
                                             readOnly />
                                                      
                                                      </div>
                                
                                
                                                    </div>
                                                    {/* <div className="row  "> */}
                                                    <div className="grid grid-rows-3 w-full sm:w-1/2 lg:w-1/3 
                                          ml-auto gap-0  mr-2">
                                
                                
                                
                                
                                                      {/* Bill Number */}
                                                      <div className="flex items-center w-full gap-3  justify-end">
                                                        {/* <div className="input-field col s6 mt-4"> */}
                                                        <span className="whitespace-nowrap ">
                                                          Bill Number
                                                         
                                                        </span>
                                
                                              <input type="text" style={{ marginBottom: "0px" }}
                                        value={purchase?.billPurchaseDetails?.Bill_Number ?? "N/A"}
                                             readOnly />
                                                     
                                                      </div>
                                                      <div className="flex items-center w-full gap-3  justify-end">
                                                        {/* <div className="input-field col s6 mt-4"> */}
                                                        <span className="whitespace-nowrap ">
                                                          Bill Date
                                                          
                                                        </span>
                                
                                              <input type="text"
                                            value={
                                                new Date(purchase
                                                    ?.billPurchaseDetails?.Bill_Date).toLocaleDateString({
                                                day: "numeric",
                                                month: "numeric",
                                                year: "numeric",
                                            })}
                                            style={{ marginBottom: "0px" }}
                                            readOnly />
                                                       
                                                      </div>
                                                      {/* State of Supply */}
                                
                                
                                
                                                      <div className="flex
                                                                           items-center w-full gap-3 justify-end
                                                                           state-of-supply-class">
                                                        {/* <div className="row w-1/2"> */}
                                
                                                        <span className=" whitespace-nowrap active">
                                                          State of Supply
                                                         
                                                        </span>
                                                         <input  style={{ marginBottom: "0px" }}
                                                          type="text" 
                                        value={purchase?.billPurchaseDetails?.State_Of_Supply ?? "N/A"}
                                             readOnly />
                                                      </div>
                                
                                    <div className="flex
                                                                           items-center w-full gap-3 justify-end
                                                                           ">
                                                        {/* <div className="row w-1/2"> */}
                                
                                                        <span className=" whitespace-nowrap active">
                                                          Payment Type
                                                         
                                                        </span>
                                                   <input style={{ marginBottom: "0px" }}
                                                   type="text" value={purchase?.billPurchaseDetails?.Payment_Type ?? "N/A"}
                                             readOnly />
                                                      </div>

                                                       <div className="flex
                                                                           items-center w-full gap-3 justify-end
                                                                           ">
                                                        {/* <div className="row w-1/2"> */}
                                
                                                        <span className=" whitespace-nowrap active">
                                                         Refeerence Number
                                                         
                                                        </span>
                                                 <input style={{ marginBottom: "0px" }}
                                                 type="text" value={purchase?.billPurchaseDetails?.Reference_Number ?? "N/A"}
                                             readOnly />
                                                      </div>
                                
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
                                            {purchase?.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{item?.Item_Category}</td>
                                                    <td>{item?.Item_Name}</td>
                                                    <td>{item?.Item_HSN}</td>
                                                    <td>{item?.Quantity}</td>
                                                    <td>{item?.Item_Unit}</td>
                                                    <td>{item?.Purchase_Price}</td>
                                                    <td>{
                                                         item?.Discount_Type_On_Purchase_Price === "Percentage" ?
                                                          `${item?.Discount_On_Purchase_Price==0.00?0:item?.Discount_On_Purchase_Price}%`:

                                                          `₹${item?.Discount_On_Purchase_Price}`
                                                    }</td>
                                                    {/* <td>{item?.Tax_Type}</td> */}
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
    <div className="flex flex-col space-y-2 w-full mt-4 sm:w-1/2 md:w-1/3 ml-auto">
        
        {/* Total Amount Field */}
        <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">Total Amount</span>
            {/* <label className="font-medium">Total Amount</label> */}
            <input
                style={{ backgroundColor: "transparent",marginBottom:"0px",height: "1rem" }}
                type="text"
                className="input-field border-b border-gray-300  w-1/2 p-1"
                value={purchase?.billPurchaseDetails?.Total_Amount ?? 0.00}
                readOnly
            />
        </div>
        
        {/* Total Received Field */}
        <div className="flex gap-4 items-center">
          <span className="font-medium whitespace-nowrap">Total Paid</span>
            {/* <label className="font-medium">Total Paid</label> */}
            <input
                style={{ backgroundColor: "transparent",marginBottom:"0px",height: "1rem" }}
                type="text"
                className="input-field border-b border-gray-300 w-1/2 p-1"
                value={purchase?.billPurchaseDetails?.Total_Paid ?? 0.00}
                readOnly
            />
        </div>
        
        {/* Balance Due Field (Often styled differently) */}
        <div className="flex gap-4 items-center ">
          <span className="font-medium whitespace-nowrap">Balance Due</span>
            {/* <label className="font-bold text-lg">Balance Due</label> */}
            <input
                style={{ backgroundColor: "transparent",marginBottom:"0px",height: "1rem" }}
                type="text"
                className="input-field  w-1/2 p-1 font-extrabold text-lg"
                value={purchase?.billPurchaseDetails?.Balance_Due ?? 0.00}
                readOnly
            />
        </div>
        
    </div>
</div>
 <div className="flex justify-end gap-4 mt-4">
  <button
  type="button"
    onClick={() => {
    if (from === "party-sales-purchases-details") {

          navigate({
  pathname: `/party/party-sales-purchases-details/${Party_Id}`,
  search: location.search,
})
 
      //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
    } else if (from === "item-sales-purchases-details") {
     navigate({
  pathname: `/item/item-sales-purchases-details/${Item_Id}`,
  search: location.search,
})
      // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
    } else {
                                    navigate({
  pathname: "/purchase/all-purchases",
  search: location.search,
})
     
      // navigate("/sale/all-sales");
    }
  }}
//       onClick={() => {
//     if (from === "party-sales-purchases-details") {
//       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
// //        navigate({
// //   pathname: `/party/party-sales-purchases-details/${Party_Id}`,
// //   search: location.search,
// // })
//       //  navigate(`/party/party-sales-purchases-details/${Party_Id}`);
//     } else if (from === "item-sales-purchases-details") {
//      navigate({
//   pathname: `/item/item-sales-purchases-details/${Item_Id}`,
//   search: location.search,
// })
//       // navigate(`/item/item-sales-purchases-details/${Item_Id}`);
//     } else {
//                                     navigate({
//   pathname: "/purchase/all-purchases",
//   search: location.search,
// })
     
//       // navigate("/sale/all-sales");
//     }
//   }}
//   onClick={() => {
//     if (from === "party-sales-purchases-details") {
//       navigate(`/party/party-sales-purchases-details/${Party_Id}`);
//     } 
    
//     else if (from === "item-sales-purchases-details") {
//       navigate(`/item/item-sales-purchases-details/${Item_Id}`);
//     }else {
//                                         navigate({
//   pathname: "/purchase/all-purchases",
//   search: location.search,
// })
//       // navigate(`/purchase/all-purchases`);
//     }
//   }}
  className="text-white font-bold py-2 px-4 rounded"
  style={{ backgroundColor: "#4CA1AF" }}
>
  Cancel
</button>
                
                </div>
                            </div>
                        </div>
                 
             <style>
        {`
  /*  screens between 1000px and 640px */
  @media (max-width: 1000px) and (min-width: 641px) {

    /* Keep sale-wrapper horizontal but avoid tight spacing */
    .sale-wrapper{
      flex-direction: row !important;
      gap: 10px !important;
    }

    /* Left section slightly wider */
    .sale-left {
      width: 45% !important;
    }

    /* Right section slightly narrower */
    .sale-right {
      width: 55% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* Inputs must not stretch too much */
    .sale-right > div > input {
      width: 80% !important;
    }

    /* Select dropdowns also */
    .state-of-supply-class > select {
      width: 80% !important;
    }

    /* Party, Invoice, GSTIN fields */
    .party-class,
    .invoice-number-class,
    .gstin-class,
    .invoice-date-class,
    .state-of-supply-class {
      width: 100% !important;
    }
  }

@media (max-width: 640px) {

  /* Make Party + GSTIN stack vertically */
  .heading-wrapper {
    flex-direction: column !important;
    gap: 16px !important;
    width: 100% !important;
  }

  /* Fix Party container */
  .party-class {
    width: 100% !important;
  }

  /* Make Party input full width */
  .party-class input {
    width: 100% !important;
  }



  /* GSTIN block full width */
  .gstin-class {
    width: 100% !important;
    justify-content: flex-start !important;
  }

  /* GSTIN input also full width */
  .gstin-class input {
    width: 80% !important;
  }
  .party-class input {
    width: 80% !important;
  }
}

  /* below 640px */
  @media (max-width: 640px) {

  .party-class{
     width: 95% !important;
  }
    .invoice-number-class,
    .gstin-class,
    .invoice-date-class,
    .state-of-supply-class {
      width: 100% !important;
    }

    .state-of-supply-class > select {
      width: 100% !important;
    }

    .sale-wrapper {
      flex-direction: column !important;
      gap: 20px !important;
    }

    .sale-left {
      width: 100% !important;
    }

    .sale-right {
      width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .sale-right > div {
      width: 100% !important;
    }

    .sale-right > div > input {
      width: 100% !important;
    }

    .sale-input {
      width: 100% !important;
    }

    .sale-checkbox-label {
      padding-left: 30px !important;
    }
  }
`}
      </style>
        </>
    );

}