import { useState } from "react";
import { useDispatch } from "react-redux";
import { saleApi, useAddInvoiceMutation,   useGetSingleInvoiceQuery, useUpdateInvoiceMutation} from "../../redux/api/saleApi";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import { LayoutDashboard } from "lucide-react";

export default function Invoice() {
  const [newInvoiceName, setNewInvoiceName] = useState("");
   
  const [editInvoiceId, setEditInvoiceId] = useState(null);
   
  const [invoiceError, setInvoiceError] = useState("");
  const dispatch = useDispatch();

  const [addInvoice, { isLoading: isAddingAddInvoice }] = useAddInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const { data: invoice } = useGetSingleInvoiceQuery();

   //const [addNewSaleInvoice, { isLoading: isAddingAddNewSaleInvoice }] = useAddNewSaleInvoiceMutation();
  // const [updateNewSaleInvoice] = useUpdateNewSaleInvoiceMutation();


 const [activeTab, setActiveTab] = useState("Sale Items Invoice");
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent accidental "Enter" form submission
    if (e.key === "Enter") return;

    if (newInvoiceName.trim() === "") {
      setInvoiceError("Invoice cannot be empty");
      return;
    }

    try {
      if (editInvoiceId) {
        // ✅ Update existing invoice
        const res = await updateInvoice({
          id: editInvoiceId,
          body: { Invoice_Name: newInvoiceName.trim(),id:editInvoiceId },
        });
        const data = res?.data || res;

        if (data?.success) {
          toast.success("Invoice updated successfully!");
          setEditInvoiceId(null);
          setNewInvoiceName("");
          dispatch(saleApi.util.invalidateTags(["Invoice"]));
        } else {
          toast.error(res?.error?.data?.message || "Update failed");
        }
      } else {
        // ✅ Add new invoice
        const res = await addInvoice({
          body: { Invoice_Name: newInvoiceName.trim() },
        });
        const data = res?.data || res;

        if (data?.success) {
          toast.success("Invoice added successfully!");
          dispatch(saleApi.util.invalidateTags(["Invoice"]));
          setNewInvoiceName("");
        } else {
          toast.error(res?.error?.data?.message || "Add failed");
        }
      }

      setInvoiceError("");
    } catch (err) {
      console.error("❌ Error saving invoice:", err);
      toast.error("Something went wrong.");
    }
  };

  return (
    <>
     
       {/* <div className="sb2-2-3">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}

     
            <div className="flex flex-col bg-white ">
              <div className="inn-title">
                <h4 className="text-2xl font-bold mb-2">Add/Edit Invoice</h4>
                <p className="text-gray-500 mb-6">
                  Add or edit your invoice
                </p>
              </div>
          <div className="flex gap-6 w-full mt-6 pb-3">
                  <div className=" flex space-x-8 pl-4">
                                        {["Sale Items Invoice"].map((tab) => (
                                            <button
                                                type="button"
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor: "transparent",
                                                    border: "none",
                                                    outline: "none",
                                                    padding: "0.5rem 1rem",
                                                    borderBottom: activeTab === tab ? "1px solid red" : "none",
                                                    color: activeTab === tab ? "red" : "gray",
                                                    fontWeight: activeTab === tab ? "600" : "500",
                                                }}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    </div>
              {activeTab === "Sale Items Invoice" && <div className="tab-inn">
                <form onSubmit={(e)=>handleSubmit(e)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                  <div className="row flex flex-row gap-4">
                    {/* Invoice Name Field */}
                    <div className="input-field col s6 mt-4">
                      <span className="active">
                        {editInvoiceId ? "Edit Invoice" : "Invoice Name"}
                        <span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                      </span>
                      <input
                        type="text"
                        id="Item_Invoice"
                        onChange={(e) => setNewInvoiceName(e.target.value)}
                        value={newInvoiceName}
                        placeholder={
                          editInvoiceId
                            ? "Enter new invoice name"
                            : "Enter invoice name"
                        }
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                      {invoiceError && (
                        <p className="text-red-500 text-xs mt-1">
                          {invoiceError}
                        </p>
                      )}
                    </div>

                    {/* Add Button only if no invoice */}
                    {!invoice?.invoice && !editInvoiceId && (
                      <div className="input-field col s6 mt-4">
                        <input
                          type="submit"
                          style={{ backgroundColor: "#4CA1AF" }}
                          className="waves-effect waves-light btn-large"
                          value="Add Invoice"
                        />
                      </div>
                    )}
                  </div>
                </form>

                {/* Existing Invoice */}
                {invoice?.invoice && (
                  <div className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]">
                    <div
                      key={invoice.invoice.id}
                      className="flex items-center justify-between px-3 py-2 bg-[#f3f2fd] border-l-4 border-[#4CA1AF] border border-gray-300 rounded-md text-sm text-[#4CA1AF] font-medium"
                    >
                      {editInvoiceId === invoice.invoice.id ? (
                        <input
                          type="text"
                          value={newInvoiceName}
                          readOnly
                        //   onChange={(e) => setNewInvoiceName(e.target.value)}
                        //   onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                          className="border-b border-gray-400 outline-none text-gray-800 bg-transparent px-1"
                        />
                      ) : (
                        <span>{invoice.invoice.Invoice_Name}</span>
                      )}

                      <div className="flex gap-3 items-center ml-4">
                        {editInvoiceId === invoice.invoice.id ? (
                          <>
                            <button
                              type="button"
                              disabled={isAddingAddInvoice}
                               style={{backgroundColor:"transparent"}}
                              onClick={() => handleSubmit({ preventDefault: () => {} })}
                              className="text-[#4CA1AF] text-sm font-medium hover:underline"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              style={{backgroundColor:"transparent"}}
                              className="text-red-500 text-sm font-medium hover:underline"
                              onClick={() => {
                                setEditInvoiceId(null);
                                setNewInvoiceName("");
                                setInvoiceError("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <i
                            className="fa fa-pencil text-[#4CA1AF] cursor-pointer"
                            title="Edit"
                            onClick={() => {
                              setEditInvoiceId(invoice.invoice.id);
                              setNewInvoiceName(invoice.invoice.Invoice_Name);
                            }}
                          ></i>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>}
               
            </div>
         
    </>
  );
}
