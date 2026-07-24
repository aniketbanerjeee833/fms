import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { useEffect, useState } from "react";

import { Eye, LayoutDashboard, SquarePen } from "lucide-react";
import PartyAddModal from "../../components/Modal/PartyAddModal";

export default function AllPartiesList() {

    //const [page, setPage] = useState(1);
    // const { data: parties, isLoading, isError } = useGetAllPartiesQuery({ page });
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const page = Number(searchParams.get("page")) || 1;
    const searchTerm = searchParams.get("search") || ""
    const [selectedParty, setSelectedParty] = useState(null);
    //const [searchTerm, setSearchTerm] = useState("");
    const { data: parties, isLoading } = useGetAllPartiesQuery({ page, search: searchTerm });
    console.log(parties);
    const [showPartyModalForEdit, setShowPartyModalForEdit] = useState(false)
    //const [editingParty, setEditingParty] = useState(false)

    const navigate = useNavigate();
    console.log(selectedParty)

    const handlePageChange = (newPage) => {
        setSearchParams({
            page: newPage,
            search: searchTerm,

        });
    }
    const handleNextPage = () => {
        setSearchParams({
            page: page + 1,
            search: searchTerm,

        });
    };

    const handlePreviousPage = () => {
        setSearchParams({
            page: Math.max(1, page - 1),
            search: searchTerm,

        });
    };
    // const handlePageChange = (newPage) => {
    //     setPage(newPage);
    // }
    // const handleNextPage = () => {
    //     setPage(page + 1);
    // }
    // const handlePreviousPage = () => {
    //     setPage(page - 1);
    // }
    useEffect(() => {
        if (parties && parties?.parties?.length > 0) {
            setSelectedParty(parties?.parties[0]);
        }
    }, [parties]);


    return (
        <>

            <div className="sb2-2-2">
                <ul >
                    <li>
                        {/* <NavLink
                                    to="/home"

                                >
                                    <i className="fa fa-home mr-2" aria-hidden="true"></i>
                                   Dashboard
                                </NavLink> */}
                        <NavLink style={{ display: "flex", flexDirection: "row" }}
                            to="/home"

                        >
                            <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                            {/* <i className="fa fa-home mr-2" aria-hidden="true"></i> */}
                            Dashboard
                        </NavLink>
                    </li>

                </ul>
            </div>
            {/* <div className="sb2-2-3 ">
                <div className="row">
                    <div className="col-md-12">
                        <div className="box-inn-sp"> */}
        
                        <div className="flex flex-col bg-white">

                            <div className="inn-title">
                                <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">
                                    {/* Left Section */}
                                    <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
                                        <div>
                                            <h4 className="text-2xl font-bold mb-1">All Parties</h4>
                                            <p className="text-gray-500 text-sm sm:text-base">
                                                All Parties Details
                                            </p>
                                        </div>
                                        <button
                                            style={{
                                                outline: "none",
                                                boxShadow: "none",
                                                backgroundColor: "#4CA1AF",
                                            }}
                                            className="text-white px-4 py-2 rounded-md sm:hidden"
                                            onClick={() => navigate("/party/add")}
                                        >
                                            Add Party
                                        </button>
                                    </div>


                                    <div

                                        className="
        flex flex-col gap-2 sm:flex-row sm:flex-wrap gap-0
        sm:space-x-4 space-y-3 sm:space-y-0
        sm:items-center"
                                    >


                                        <div className="flex items-center w-full sm:w-56">
                                            <input
                                                type="text"
                                                placeholder="Search ..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchParams({
                                                        page: 1,               // reset page on new search
                                                        search: e.target.value,

                                                    });
                                                }}
                                                // onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full sm:w-56"
                                            />
                                        </div>


                                        <div className="hidden sm:block">
                                            <button
                                                style={{
                                                    outline: "none",
                                                    boxShadow: "none",
                                                    backgroundColor: "#4CA1AF",
                                                }}
                                                className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                                                onClick={() => navigate("/party/add")}
                                            >
                                                Add  Party
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="tab-inn">
                                <div className="table-responsive table-desi">
                                    {isLoading ? (
                                        <p className="text-center mt-4">Fetching Parties...</p>
                                    ) : parties?.length === 0 ? (
                                        <p className="text-center mt-4">No parties found.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Left side (Party List) */}
                                            <div className="p-2 border-r border-gray-300 overflow-x-auto ">
                                                <table className="w-full ">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left">Sl.No</th>
                                                            <th className="text-left">Party Name</th>
                                                            <th className="text-left py-1 px-2">GSTIN</th>
                                                            {/* <th className="text-left py-1 px-2">Phone</th> */}
                                                            <th className="text-left py-1 px-2">State</th>
                                                            {/* <th className="text-left py-1 px-2">Email</th> */}
                                                            <th className="text-left py-1 px-2">Billing Address</th>
                                                            <th style={{color:"green"}}
                                                             className="text-left py-1 px-2
                                                            ">Total Sales</th>
                                                            <th style={{color:"red"}} className="text-left py-1 px-2">Total Purchase</th>
                                                            {/* <th className="text-left py-1 px-2">Shipping Address</th> */}
                                                            <th className="text-center py-1 px-2">View</th>
                                                            <th className="text-center py-1 px-2">Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {parties &&
                                                            parties?.parties?.length > 0 &&
                                                            parties?.parties?.map((party, idx) => (
                                                                <tr
                                                                    key={party.Party_Id}

                                                                >
                                                                    <td>
                                                                        {(parties?.currentPage - 1) * 10 + (idx + 1)}.
                                                                    </td>

                                                                    <td
                                                                        className=" max-w-[200px] line-clamp-2"
                                                                        title={party.Party_Name}
                                                                    >
                                                                        {party.Party_Name}
                                                                    </td>
                                                                    {/* <td
                                                                        // onClick={() => handlePartyClick(party.Party_Id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {party.Party_Name}
                                                                    </td> */}
                                                                    <td>{party?.GSTIN || "N/A"}</td>
                                                                    {/* <td>{party?.Phone_Number || "N/A"}</td> */}
                                                                    <td>{party?.State || "N/A"}</td>
                                                                    {/* <td>{party?.Email || "N/A"}</td> */}
                                                                    <td
                                                                        className=" max-w-[220px] line-clamp-2"
                                                                        title={party?.Billing_Address }
                                                                    >
                                                                        {party?.Billing_Address }
                                                                    </td>
                                                                    {/* <td>{party?.Billing_Address || "N/A"}</td> */}
                                                                    <td style={{color:"green"}}>{party?.Total_Sales_Amount || "N/A"}</td>
                                                                    <td style={{color:"red"}}>{party?.Total_Purchases_Amount || "N/A"}</td>
                                                                    {/* <td>{party?.Shipping_Address || "N/A"}</td> */}
                                                                    {/* <td className="text-center">
                                                                    <button
                                                                        onClick={() => handlePartyClick(party.Party_Id)}
                                                                        className="text-[#4CA1AF]"
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td> */}
                                                                    <td>
                                                                        {/* ${location.search} */}
                                                                        <NavLink
                                                                            to={`/party/party-sales-purchases-details/${party?.Party_Id}${location.search}`}
                                                                            state={{ from: "party-details" }}
                                                                        >

                                                                            {/* <NavLink
                                                                        to={`/party/party-sales-purchases-details/${party?.Party_Id}`}
                                                                        state={{ from: "party-details" }}
                                                                    > */}
                                                                            <Eye
                                                                                style={{
                                                                                    cursor: "pointer",
                                                                                    backgroundColor: "transparent",
                                                                                    color: "#4CA1AF",
                                                                                }}
                                                                            />
                                                                        </NavLink></td>
                                                                    <td>
                                                                        <SquarePen
                                                                            onClick={() => {
                                                                                setSelectedParty(party);     // ← STORE PARTY CLICKED
                                                                                setShowPartyModalForEdit(true);
                                                                            }}
                                                                            style={{
                                                                                cursor: "pointer",
                                                                                backgroundColor: "transparent",
                                                                                color: "#4CA1AF"
                                                                            }} />

                                                                    </td>

                                                                </tr>

                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                        </div>)}
                                </div>

                            </div>

                            {showPartyModalForEdit && (
                                <PartyAddModal
                                    partyDetails={{ ...selectedParty }}
                                    editingParty={true}
                                    onClose={() => setShowPartyModalForEdit(false)}
                                />
                            )}

                            <div className="flex justify-center align-center p-4">
                        <div className="flex items-center space-x-2 flex-wrap justify-center">

                            {/* PREVIOUS */}
                            <button
                                type="button"
                                onClick={() => handlePreviousPage()}
                                disabled={page === 1}
                                className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === 1 ? 'opacity-50 ' : ''}
      `}
                            >
                                ← Previous
                            </button>

                            {/* PAGE NUMBERS — DESKTOP / TABLET */}
                            <div style={{ marginRight: "0px" }}
                                className="hidden sm:flex space-x-2">
                                {/* {[...Array(foodItems?.totalPages).keys()].map((index) => (
        <button
          key={index}
          onClick={() => handlePageChange(index + 1)}
          className={
            `px-3 py-1 rounded ${
              page === index + 1
                ? 'bg-[#ff0000] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`
          }
        >
          {index + 1}
        </button>
      ))} */}
                                {(() => {
                                    const totalPages = parties?.totalPages || 1;
                                    const maxVisible = 5; // how many pages around current
                                    const pages = [];

                                    let start = Math.max(1, page - 2);
                                    let end = Math.min(totalPages, page + 2);

                                    // Adjust if near start
                                    if (page <= 3) {
                                        end = Math.min(totalPages, maxVisible);
                                    }

                                    // Adjust if near end
                                    if (page > totalPages - 3) {
                                        start = Math.max(1, totalPages - maxVisible + 1);
                                    }

                                    // First page + dots
                                    if (start > 1) {
                                        pages.push(
                                            <button
                                                key={1}
                                                onClick={() => handlePageChange(1)}
                                                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                            >
                                                1
                                            </button>
                                        );

                                        if (start > 2) {
                                            pages.push(
                                                <span key="start-dots" className="px-2">...</span>
                                            );
                                        }
                                    }

                                    // Middle pages
                                    for (let i = start; i <= end; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`px-3 py-1 rounded ${page === i
                                                    ? 'bg-[#4CA1AF] text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }

                                    // Last page + dots
                                    if (end < totalPages) {
                                        if (end < totalPages - 1) {
                                            pages.push(
                                                <span key="end-dots" className="px-2">...</span>
                                            );
                                        }

                                        pages.push(
                                            <button
                                                key={totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                            >
                                                {totalPages}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}
                            </div>

                            {/* CURRENT PAGE — MOBILE ONLY */}
                            <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm">
                                Page {page} / {parties?.totalPages || 1}
                            </div>

                            {/* NEXT */}
                            <button
                                type="button"
                                onClick={() => handleNextPage()}
                                disabled={page === parties?.totalPages ||
                                    parties?.totalPages === 0}
                                className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === parties?.totalPages ||
                                        parties?.totalPages === 0
                                        ? 'opacity-50 '
                                        : ''
                                    }
      `}
                            >
                                Next →
                            </button>

                        </div>
                    </div>

                        </div>
                    {/* </div> */}

                    
                    {/* <div className="flex justify-center align-center space-x-2 p-4">
                        <button type="button"
                            onClick={() => handlePreviousPage()}
                            disabled={page === 1}
                            className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === 1 ? 'opacity-50 ' : ''}
                `}
                        >
                            ← Previous
                        </button>
                        {[...Array(parties?.totalPages).keys()].map((index) => (
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
                            disabled={page === parties?.totalPages || parties?.totalPages === 0}
                            className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === parties?.totalPages || parties?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                        >
                            Next →
                        </button>
                    </div> */}

                {/* </div>
            </div> */}



        </>
    )
}


{/* <div>
                                        <div className="p-2 overflow-x-auto">
                                            {selectedParty ? (
                                                <table className="w-full  border-gray-300  min-w-[500px]">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left">GSTIN</th>
                                                            <th className="text-left">Phone</th>
                                                            <th className="text-left">State</th>
                                                            <th className="text-left">Email</th>
                                                            <th className="text-left">Billing Address</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>{selectedParty?.GSTIN || "N/A"}</td>
                                                            <td>{selectedParty?.Phone_Number || "N/A"}</td>
                                                            <td>{selectedParty?.State || "N/A"}</td>
                                                            <td>{selectedParty?.Email_Id || "N/A"}</td>
                                                            <td>{selectedParty?.Billing_Address || "N/A"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-gray-500">Select a party to view details</p>
                                            )}
                                        </div>

                                        <div className="p-2 overflow-x-auto border-gray-300">
                                           
                                                <table className="w-full min-w-[500px]">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left">Sl.No</th>
                                                            <th className="text-left">Type</th>
                                                            <th className="text-left "> Date</th>
                                                           
                                                            <th className="text-left">Payment Type</th>
                                                            <th className="text-left">Amount </th>
                                                            <th className="text-left">Balance Due</th>
                                                            <th>View</th>
                                                            <th>Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody> 
                                                        {allPartyDetails && allPartyDetails?.length > 0 ? (
                                                        allPartyDetails?.map((party, idx) => (
                                                        

                                                   
                                                        <tr key={idx}>
                                                           <td>{party?.Type}</td>
                                                           <td>{idx + 1}</td>
                                                            {party?.Type==="Purchase" ? <td>{
                                                            new Date(party?.Bill_Date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "numeric",
                                    year: "numeric",
                                  })
                                                            }</td>
                                                            :<td>{new Date(
                                                                party?.Invoice_Date
                                                              ).toLocaleDateString(
                                                                "en-IN",
                                                                {
                                                                  day: "numeric",
                                                                  month: "numeric",
                                                                  year: "numeric",
                                                                }
                                                              
                                                            )}</td>}
                                                            
                                                            
                                                            <td>{party?.Payment_Type}</td>
                                                            <td>{party?.Total_Amount}</td>
                                                            <td>{party?.Balance_Due}</td>
                                                          
                                                        </tr>
                                                        ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="8" className="text-center">
                                                                    No data available
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>

                                                </table>
                                            
                                        </div>
                                        </div> */}
{/* <div className="space-y-4">

                                           
                                            <div className="border rounded-md shadow-sm bg-white p-3">
                                                <h5 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-2">
                                                    Party Information
                                                </h5>

                                                <div className="p-2 overflow-x-auto">
                                                    {selectedParty ? (
                                                        <table className="w-full min-w-[500px]">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="text-left py-1 px-2">GSTIN</th>
                                                                    <th className="text-left py-1 px-2">Phone</th>
                                                                    <th className="text-left py-1 px-2">State</th>
                                                                    <th className="text-left py-1 px-2">Email</th>
                                                                    <th className="text-left py-1 px-2">Billing Address</th>
                                                                     <th className="text-left py-1 px-2">Shipping Address</th>
                                                                       <th className="text-center py-1 px-2">View</th>
                                                                <th className="text-center py-1 px-2">Edit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="border-b">
                                                                    <td className="py-1 px-2">{selectedParty?.GSTIN || "N/A"}</td>
                                                                    <td className="py-1 px-2">{selectedParty?.Phone_Number || "N/A"}</td>
                                                                    <td className="py-1 px-2">{selectedParty?.State || "N/A"}</td>
                                                                    <td className="py-1 px-2">{selectedParty?.Email_Id || "N/A"}</td>
                                                                    <td className="py-1 px-2">{selectedParty?.Billing_Address || "N/A"}</td>
                                                                     <td className="py-1 px-2">{selectedParty?.Shipping_Address || "N/A"}</td>
                                                                     <td><NavLink
                                                                                     to={`/party/party-sales-purchases-details/${selectedParty?.Party_Id}`}
                                                                                    state={{ from: "party-details" }}
                                                                                >
                                                                                    <Eye
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            backgroundColor: "transparent",
                                                                                            color: "#4CA1AF",
                                                                                        }}
                                                                                    />
                                                                                </NavLink></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-gray-500">Select a party to view details</p>
                                                    )}
                                                </div>
                                            </div>

                                           
                                            {/* <div className="border rounded-md shadow-sm bg-white p-3">
                                                <h5 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-2">
                                                    Sales & Purchase Summary
                                                </h5>

                                                <div className="p-2 overflow-x-auto">
                                                    <table className="w-full min-w-[500px]">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="text-left py-1 px-2">Sl.No</th>
                                                                <th className="text-left py-1 px-2">Type</th>
                                                                <th className="text-left py-1 px-2">Date</th>
                                                                <th className="text-left py-1 px-2">Payment Type</th>
                                                                <th className="text-left py-1 px-2">Amount</th>
                                                                <th className="text-left py-1 px-2">Balance Due</th>
                                                                <th className="text-center py-1 px-2">View</th>
                                                                <th className="text-center py-1 px-2">Edit</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {allPartyDetails && allPartyDetails?.length > 0 ? (
                                                                allPartyDetails?.map((party, idx) => (
                                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                                        <td className="py-1 px-2">{idx + 1}</td>
                                                                        <td className="py-1 px-2">{party?.Type}</td>

                                                                        <td className="py-1 px-2">
                                                                            {party?.Type === "Purchase"
                                                                                ? new Date(party?.Bill_Date).toLocaleDateString("en-IN", {
                                                                                    day: "numeric",
                                                                                    month: "numeric",
                                                                                    year: "numeric",
                                                                                })
                                                                                : new Date(party?.Invoice_Date).toLocaleDateString("en-IN", {
                                                                                    day: "numeric",
                                                                                    month: "numeric",
                                                                                    year: "numeric",
                                                                                })}
                                                                        </td>

                                                                        <td className="py-1 px-2">{party?.Payment_Type}</td>
                                                                        <td className="py-1 px-2">{party?.Total_Amount}</td>
                                                                        <td className="py-1 px-2">{party?.Balance_Due}</td>
                                                                        <td className="text-center py-1 px-2">
                                                                            {party?.Type === "Purchase" ? (
                                                                                <NavLink
                                                                                    to={`/purchase/view/${party?.Purchase_Id}`}
                                                                                    state={{ from: "party-details" }}
                                                                                >
                                                                                    <Eye
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            backgroundColor: "transparent",
                                                                                            color: "#4CA1AF",
                                                                                        }}
                                                                                    />
                                                                                </NavLink>
                                                                            ) : (
                                                                                <NavLink
                                                                                    to={`/sale/view/${party?.Sale_Id}`}
                                                                                    state={{ from: "party-details" }}
                                                                                >
                                                                                    <Eye
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            backgroundColor: "transparent",
                                                                                            color: "#4CA1AF",
                                                                                        }}
                                                                                    />
                                                                                </NavLink>
                                                                            )}
                                                                        </td>

                                                                        <td className="text-center py-1 px-2">
                                                                            {party?.Type === "Purchase" ? (
                                                                                <NavLink
                                                                                    to={`/purchase/edit/${party?.Purchase_Id}`}
                                                                                    state={{ from: "party-details" }}
                                                                                >
                                                                                    <SquarePen
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            backgroundColor: "transparent",
                                                                                            color: "#4CA1AF",
                                                                                        }}
                                                                                    />
                                                                                </NavLink>
                                                                            ) : (
                                                                                <NavLink
                                                                                    to={`/sale/edit/${party?.Sale_Id}`}
                                                                                    state={{ from: "party-details" }}
                                                                                >
                                                                                    <SquarePen
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            backgroundColor: "transparent",
                                                                                            color: "#4CA1AF",
                                                                                        }}
                                                                                    />
                                                                                </NavLink>
                                                                            )}
                                                                        </td>

                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="8" className="text-center py-3 text-gray-500">
                                                                        No data available
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div> */}