import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEditExpenseItemMasterMutation } from "../../redux/api/expenseApi";

export default function EditExpenseItemModal({
    item,
    onClose,
}) {
    const [itemName, setItemName] = useState("");
    const [itemHSN, setItemHSN] = useState("");
    const [price, setPrice] = useState("");
    // const [priceType, setPriceType] = useState("Tax Excluded");
    const [taxType, setTaxType] = useState("");

    const [error, setError] = useState("");

    const [editExpenseItemMaster, { isLoading }] =
        useEditExpenseItemMasterMutation();

    /* ===========================================
       Populate Item
    =========================================== */

    useEffect(() => {
        if (!item) return;

        console.log("Tax_Type:", item.Tax_Type);

        setItemName(item.Item_Name || "");
        setItemHSN(item.Item_HSN || "");
        setPrice(item.Price ?? "");
        // setPriceType(item.Price_Type || "Tax Excluded");
        setTaxType(item.Tax_Type || "None");
    }, [item]);

    /* ===========================================
       Update Item
    =========================================== */

    const handleSave = async () => {
        if (!itemName.trim()) {
            setError("Item Name is required");
            return;
        }

        const payload = {
            itemName: itemName.trim(),
            itemHSN: itemHSN.trim(),
            price,
            // priceType,
            taxType,
        };

        try {
            const res = await editExpenseItemMaster({
                id: item.id,
                body: payload,
            }).unwrap();

            toast.success(
                res?.message || "Expense Item updated successfully!"
            );

            onClose();
        } catch (err) {
            toast.error(
                err?.data?.message ||
                "Failed to update expense item"
            );
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                marginTop: "4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(4px)",
                zIndex: 100,
                padding: "1rem",
            }}
        >
            <div
                className="bg-white w-full rounded-lg shadow-lg overflow-hidden"
                style={{
                    maxWidth: "720px",
                    padding: "22px",
                }}
            >
                {/* Header */}

                <div
                    className="flex justify-between items-center"
                    style={{
                        marginBottom: "18px",
                    }}
                >
                    <h4 className="text-xl font-semibold text-gray-900">
                        Edit Expense Item
                    </h4>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            width: "30px",
                            height: "30px",
                            fontSize: "20px",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}

                <div
                    className="flex flex-col"
                    style={{
                        gap: "18px",
                    }}
                >

                    {/* Row 1 */}

                    <div
                        className="grid grid-cols-2"
                        style={{
                            columnGap: "18px",
                        }}
                    >

                        {/* Item Name */}

                        <div className="flex flex-col">
                            <span className="active">
                                Item Name
                                <span className="text-red-500 font-bold text-lg">
                                    &nbsp;*
                                </span>
                            </span>

                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => {
                                    setItemName(e.target.value);

                                    if (error) {
                                        setError("");
                                    }
                                }}
                                className="w-full outline-none border-b-2 text-gray-900"
                                placeholder="Enter Item Name"
                            />

                            {error && (
                                <p className="text-red-500 text-xs mt-1">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* HSN */}

                        <div className="flex flex-col">
                            <span className="active">
                                HSN / SAC
                            </span>

                            <input
                                type="text"
                                value={itemHSN}
                                onChange={(e) =>
                                    setItemHSN(e.target.value)
                                }
                                className="w-full outline-none border-b-2 text-gray-900"
                                placeholder="Enter HSN / SAC"
                            />
                        </div>

                    </div>

                    {/* Pricing */}

                    {/* <div className="font-semibold text-gray-700">
                        Pricing
                    </div> */}

                    {/* Row 2 */}

                    <div
                        className="grid grid-cols-2"
                        style={{
                            columnGap: "18px",
                        }}
                    >

                        {/* Price */}

                        <div className="flex flex-col">
                            <span className="active">
                                Price
                            </span>

                            <input
                                type="number"
                                value={price}
                                onChange={(e) =>
                                    setPrice(e.target.value)
                                }
                                className="w-full outline-none border-b-2 text-gray-900"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Price Type */}

                        {/* <div className="flex flex-col">
                            <span className="active">
                                Price Type
                            </span>

                            <select
                                value={priceType}
                                onChange={(e) =>
                                    setPriceType(e.target.value)
                                }
                                className="w-full outline-none border-b-2 text-gray-900 bg-white"
                                style={{
                                    padding: "4px 0",
                                }}
                            >
                                <option value="Tax Excluded">
                                    Tax Excluded
                                </option>

                                <option value="Tax Included">
                                    Tax Included
                                </option>
                            </select>
                        </div> */}

                        {/* Tax Rate */}

                        <div className="flex flex-col">
                            <span className="active">
                                Tax Rate
                            </span>

                            <select
                                value={taxType}
                                onChange={(e) =>
                                    setTaxType(e.target.value)
                                }
                                className="w-full outline-none border-b-2 text-gray-900 bg-white"
                                style={{
                                    padding: "4px 0",
                                }}
                            >
                                <option value="None">NONE</option>

                                <option value="IGST0">IGST@0%</option>
                                <option value="GST0">GST@0%</option>

                                <option value="IGST0.25">IGST@0.25%</option>
                                <option value="GST0.25">GST@0.25%</option>

                                <option value="IGST3">IGST@3%</option>
                                <option value="GST3">GST@3%</option>

                                <option value="IGST5">IGST@5%</option>
                                <option value="GST5">GST@5%</option>

                                <option value="IGST12">IGST@12%</option>
                                <option value="GST12">GST@12%</option>

                                <option value="IGST18">IGST@18%</option>
                                <option value="GST18">GST@18%</option>

                                <option value="IGST28">IGST@28%</option>
                                <option value="GST28">GST@28%</option>
                            </select>
                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div
                    className="flex justify-end gap-3"
                    style={{
                        marginTop: "24px",
                    }}
                >

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-md text-white"
                        style={{
                            backgroundColor: "#4CA1AF",
                            minWidth: "110px",
                        }}
                    >
                        {isLoading
                            ? "Updating..."
                            : "Update"}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                        Cancel
                    </button>

                </div>

            </div>
        </div>
    );
}