import { useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllItemsForLedgerQuery, useGetAllItemsQuery } from "../../redux/api/itemApi";


import { Eye, LayoutDashboard, SquarePen } from "lucide-react";
import ItemModal from "../../components/Modal/ItemModal";

export default function AllItemsList() {

    //const [page, setPage] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const page = Number(searchParams.get("page")) || 1;
    const searchTerm = searchParams.get("search") || ""

    const navigate = useNavigate();
    //const [selectedItem, setSelectedItems] = useState(null);
    //const [searchTerm, setSearchTerm] = useState(""); // 🔍 search text
        // const [fromDate, setFromDate] = useState('');
        // const [toDate, setToDate] = useState('');
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const { data: items, isLoading } = useGetAllItemsQuery({
        page,
        search: searchTerm,
        fromDate,
        toDate,
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModalForEdit, setShowItemModalForEdit] = useState(false)
      const {
            data: itemsResponse,
           //isLoading,
        } = useGetAllItemsForLedgerQuery({});
        console.log("itemsLedgerResponse", itemsResponse);

    const handlePageChange = (newPage) => {
        setSearchParams({
            page: newPage,
            search: searchTerm,
            fromDate,
            toDate,

        });
    }
    const handleNextPage = () => {
        setSearchParams({
            page: page + 1,
            search: searchTerm,
             fromDate,
            toDate,

        });
    };

    const handlePreviousPage = () => {
        setSearchParams({
            page: Math.max(1, page - 1),
            search: searchTerm,
             fromDate,
            toDate,

        });
    };


    console.log("items", items, items?.items);
    //   console.log("Filtered Items:", filteredItems);
    return (
        <>

            {/* <div className="sb2-2-2">
                <ul >
                    <li>

                        <NavLink style={{ display: "flex", flexDirection: "row" }}
                            to="/home"

                        >
                            <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                           
                            Dashboard
                        </NavLink>
                    </li>

                </ul>
            </div> */}
                 {/* <div className="sb2-2-3 ">
                <div className="row">
                    <div className="col-md-12">
                        <div className="box-inn-sp"> */}
          
                        <div className="flex flex-col bg-white">

                            <div className="inn-title">
                                <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

                                    <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
                                        <div>
                                            <h4 className="text-2xl font-bold mb-1">All Items</h4>
                                            <p className="text-gray-500 text-sm sm:text-base">
                                                All Item Details
                                            </p>
                                        </div>


                                        <button
                                            style={{
                                                outline: "none",
                                                boxShadow: "none",
                                                backgroundColor: "#4CA1AF",
                                            }}
                                            className="text-white px-4 py-2 rounded-md sm:hidden"

                                        >
                                            Add Item
                                        </button>
                                    </div>


                                    <div
                                        className="
        flex flex-col gap-2 sm:flex-row sm:flex-wrap gap-0
        sm:space-x-4 space-y-3 sm:space-y-0
        sm:items-center
         sm:justify-between
      "
                                    >

                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-medium mb-1">From Date</span>
                                            <input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => {
                                                    setSearchParams({
                                                        page: 1,
                                                        search: searchTerm,
                                                        fromDate: e.target.value,
                                                        toDate
                                                    });
                                                }}
                                                // onChange={(e) => setFromDate(e.target.value)}
                                                className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                                                title="Search from date"
                                            />
                                        </div>


                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-medium mb-1">To Date</span>
                                            <input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => {
                                                    setSearchParams({
                                                        page: 1,
                                                        search: searchTerm,
                                                        fromDate,
                                                        toDate: e.target.value
                                                    });
                                                }}
                                                // onChange={(e) => setToDate(e.target.value)}
                                                className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                                                title="Search to date"
                                            />
                                        </div>


                                        <div className="flex items-center w-full sm:w-56">
                                            <input
                                                type="text"
                                                placeholder="Search items..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchParams({
                                                        page: 1,               // reset page on new search
                                                        search: e.target.value,
                                                        fromDate,
                                                        toDate,

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
                                                onClick={() => navigate("/items/add")}
                                            >
                                                Add Item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="tab-inn">
                                <div className="table-responsive table-desi">
                                    {isLoading ? (
                                        <p className="text-center mt-4">Fetching items...</p>
                                    ) : items?.length === 0 ? (
                                        <p className="text-center mt-4">No items found.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Left side (item List) */}
                                            <div className="p-2 border-r border-gray-300 overflow-x-auto ">
                                                <table className="w-full ">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left">Sl.No</th>
                                                            <th className="text-left">Item Category</th>
                                                            <th className="text-left">Item Name</th>
                                                            <th className="text-left">Stock</th>
                                                            {/* <th className="text-left ">Added at </th> */}
                                                            <th className="text-left ">Purchase Price </th>
                                                            <th className="text-left ">Sale Price </th>
                                                            <th className="text-left">Item HSN</th>

                                                            <th className="text-left">View</th>
                                                            <th className="text-left">Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items &&
                                                            items?.items?.length > 0 &&
                                                            items?.items?.map((item, idx) => (
                                                                <tr
                                                                    key={item.Item_Id}
                                                                // className={
                                                                //     selectedItem?.Item_Id === item.Item_Id
                                                                //         ? "bg-[#f3f2fd] text-[#4CA1AF]"
                                                                //         // ? "bg-[#f3f2fd]  text-[#7346ff]"
                                                                //         : ""
                                                                // }
                                                                >
                                                                    <td>
                                                                        {(items?.currentPage - 1) * 10 + (idx + 1)}.
                                                                    </td>
                                                                    <td>{item?.Item_Category || "N/A"}</td>
                                                                    <td
                                                                        // onClick={() => handleItemClick(item.Item_Id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {item?.Item_Name}
                                                                    </td>
                                                                    <td className={item?.Stock_Quantity <= 0 ? "text-red-500" : "text-green-500"}>
                                                                        {item?.Stock_Quantity}
                                                                    </td>

                                                                    <td>{item?.Purchase_Price || "N/A"}</td>
                                                                    <td>{item?.Sale_Price || "N/A"}</td>
                                                                    <td>{item?.Item_HSN || "N/A"}</td>

                                                                    <td>
                                                                        {/* <NavLink
                                                                            to={`/item/item-sales-purchases-details/${item?.Item_Id}`}
                                                                            state={{ from: "item-details" }}
                                                                        > */}
                                                                        <NavLink
                                                                            to={`/item/item-sales-purchases-details/${item?.Item_Id}${location.search}`}
                                                                            state={{ from: "item-details" }}
                                                                        >
                                                                            <Eye
                                                                                style={{
                                                                                    cursor: "pointer",
                                                                                    backgroundColor: "transparent",
                                                                                    color: "#4CA1AF",
                                                                                }}
                                                                            />
                                                                        </NavLink>
                                                                    </td>
                                                                    <td>
                                                                        <SquarePen
                                                                            onClick={() => {
                                                                                setSelectedItem(item);     // ← STORE PARTY CLICKED
                                                                                setShowItemModalForEdit(true);
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


                                        </div>



                                    )}

                                </div>
                            </div>
                            {showItemModalForEdit && (
                                <ItemModal
                                    itemDetails={selectedItem}
                                    editingItem={true}
                                    onClose={() => setShowItemModalForEdit(false)}
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
                                            const totalPages = items?.totalPages || 1;
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
                                        Page {page} / {items?.totalPages || 1}
                                    </div>

                                    {/* NEXT */}
                                    <button
                                        type="button"
                                        onClick={() => handleNextPage()}
                                        disabled={page === items?.totalPages ||
                                            items?.totalPages === 0}
                                        className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === items?.totalPages ||
                                                items?.totalPages === 0
                                                ? 'opacity-50 '
                                                : ''
                                            }
      `}
                                    >
                                        Next →
                                    </button>

                                </div>
                            </div>
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
                                {[...Array(items?.totalPages).keys()].map((index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePageChange(index + 1)}
                                        // className={
                                        //     `px-3 py-1 rounded ${page === index + 1 ? 'bg-[#7346ff] text-white' : 
                                        //         'bg-gray-200 hover:bg-gray-300'
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
                                    disabled={page === items?.totalPages || items?.totalPages === 0}
                                    className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === items?.totalPages || items?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                                >
                                    Next →
                                </button>
                            </div> */}
                        </div>

               
            <style>
                {`
              .text-red-500 {
 
  color: red !important;
}
  .text-green-500 {
 
  color: green !important;
},

               `
                }
            </style>
        </>


    )
}
