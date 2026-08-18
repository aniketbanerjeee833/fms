import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Tags, Eye, Trash2, MoreVertical } from "lucide-react";

import {
    useGetAllItemUnitsCursorQuery,

    useGetAllItemUnitsQuery,

    useGetUnitConversionsQuery, // adjust name to match your actual endpoint
} from "../../redux/api/itemApi"; // adjust path to wherever these live

import AddUnitModal from "../../components/Modal/AddUnitModal";
import SelectUnitModal from "../../components/Modal/SelectUnitModal";

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ItemUnits() {
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedUnitId = searchParams.get("unitId") || null;
    const unitSearch = searchParams.get("q") || "";
    const conversionSearch = searchParams.get("convSearch") || "";
    const [unitMenuOpen, setUnitMenuOpen] = useState(null);
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [showSelectUnitModal, setShowSelectUnitModal] = useState(false)
    const { data: itemUnits } = useGetAllItemUnitsQuery();
    // ── LEFT — units cursor pagination ──────────────────────────
    const [leftCursor, setLeftCursor] = useState(null);
    const leftSentinelRef = useRef(null);
    const leftObserverRef = useRef(null);

    const {
        data: unitsResponse,
        isLoading: isUnitsLoading,
        isFetching: isUnitsFetching,
    } = useGetAllItemUnitsCursorQuery({ cursor: leftCursor, search: unitSearch, limit: 10 });
    console.log(unitsResponse, "unitsResponse");
    const units = unitsResponse?.units || [];
    const totalUnits = unitsResponse?.totalUnits || 0;
    const unitsHasMore = unitsResponse?.hasMore ?? false;
    const unitsNextCursor = unitsResponse?.nextCursor ?? null;

    useEffect(() => { setLeftCursor(null); }, [unitSearch]);

    const handleLeftObserver = useCallback((entries) => {
        if (entries[0].isIntersecting && unitsHasMore && unitsNextCursor && !isUnitsFetching && !isUnitsLoading) {
            setLeftCursor(unitsNextCursor);
        }
    }, [unitsHasMore, unitsNextCursor, isUnitsFetching, isUnitsLoading]);

    useEffect(() => {
        if (leftObserverRef.current) leftObserverRef.current.disconnect();
        leftObserverRef.current = new IntersectionObserver(handleLeftObserver, { threshold: 0.1 });
        if (leftSentinelRef.current) leftObserverRef.current.observe(leftSentinelRef.current);
        return () => leftObserverRef.current?.disconnect();
    }, [handleLeftObserver]);

    // Default to first unit on initial load
    useEffect(() => {
        if (!units.length || selectedUnitId) return;

        const next = new URLSearchParams(searchParams);
        next.set("unitId", units[0].id);
        setSearchParams(next, { replace: true });
    }, [units, selectedUnitId, searchParams, setSearchParams]);

    // ── RIGHT — conversions cursor pagination ───────────────────
    const [rightCursor, setRightCursor] = useState(null);
    const rightSentinelRef = useRef(null);
    const rightObserverRef = useRef(null);
    const rightUnitRef = useRef(selectedUnitId);

    // If the unit just changed (ref hasn't caught up yet), force cursor to null on THIS render
    const effectiveRightCursor = rightUnitRef.current === selectedUnitId ? rightCursor : null;

    const {
        data: conversionsResponse,
        isLoading: isConversionsLoading,
        isFetching: isConversionsFetching,
        refetch: refetchConversions
    } = useGetUnitConversionsQuery({ unitId: selectedUnitId, cursor: effectiveRightCursor, search: conversionSearch });
    console.log(conversionsResponse, "conversionsResponse");
    const conversions = conversionsResponse?.conversions || [];
    const totalConversions = conversionsResponse?.totalConversions || 0;
    const conversionsHasMore = conversionsResponse?.hasMore ?? false;
    const conversionsNextCursor = conversionsResponse?.nextCursor ?? null;

    useEffect(() => {
        rightUnitRef.current = selectedUnitId;
        setRightCursor(null);
    }, [selectedUnitId, conversionSearch]);

    const handleRightObserver = useCallback((entries) => {
        if (entries[0].isIntersecting && conversionsHasMore && conversionsNextCursor && !isConversionsFetching && !isConversionsLoading) {
            setRightCursor(conversionsNextCursor);
        }
    }, [conversionsHasMore, conversionsNextCursor, isConversionsFetching, isConversionsLoading]);

    useEffect(() => {
        if (rightObserverRef.current) rightObserverRef.current.disconnect();
        rightObserverRef.current = new IntersectionObserver(handleRightObserver, { threshold: 0.1 });
        if (rightSentinelRef.current) rightObserverRef.current.observe(rightSentinelRef.current);
        return () => rightObserverRef.current?.disconnect();
    }, [handleRightObserver]);

    const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;

    const handleSelectUnit = (unit) => {
        const next = new URLSearchParams(searchParams);
        next.set("unitId", unit.id);
        next.delete("convSearch");
        setSearchParams(next);
    };
    useEffect(() => {
        const closeMenu = () => {
            setUnitMenuOpen(null);
        };

        document.addEventListener("click", closeMenu);

        return () => {
            document.removeEventListener("click", closeMenu);
        };
    }, []);

    return (
        <>
            <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

                {/* ── PAGE HEADER ── */}
                <div className="inn-title">
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <h4 className="text-2xl font-bold mb-1">Item Units</h4>
                            <p className="text-gray-500 text-sm">Manage your item units and conversions</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setShowAddUnitModal(true)}
                                className="w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: "#4CA1AF",
                                    outline: "none",
                                    boxShadow: "none",
                                }}
                            >
                                + Add Unit
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowSelectUnitModal(true)}
                                className="w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                    backgroundColor: "#4CA1AF",
                                    outline: "none",
                                    boxShadow: "none",
                                }}
                            >
                                + Add Conversion
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── SPLIT LAYOUT ── */}
                <div
                    className="flex flex-col lg:flex-row gap-0"
                    style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}
                >

                    {/* ══ LEFT — 30% — unit list ══ */}
                    <div
                        className="w-full lg:w-[30%] overflow-y-auto overflow-x-hidden"
                        style={{
                            borderRight: "1px solid #e2e8f0",
                            minHeight: "500px",
                            maxHeight: "calc(100vh - 180px)",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* search */}
                        <div className="p-3" style={{ borderBottom: "1px solid #f1f5f9", boxSizing: "border-box" }}>
                            <div className="relative" style={{ width: "100%", maxWidth: 180, height: 34 }}>
                                <Search
                                    size={14}
                                    style={{ position: "absolute", left: 9, top: 10, color: "#94a3b8", pointerEvents: "none" }}
                                />
                                <input
                                    type="text"
                                    value={unitSearch}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const next = new URLSearchParams(searchParams);
                                        if (value) next.set("q", value);
                                        else next.delete("q");
                                        setSearchParams(next, { replace: true });
                                    }}
                                    placeholder="Search Unit"
                                    className="border rounded-md text-sm outline-none"
                                    style={{
                                        width: "100%",
                                        height: 34,
                                        paddingLeft: 30,
                                        paddingRight: 8,
                                        borderColor: "#dbe3ea",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>

                        {/* list header */}
                        <div
                            className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
                        >
                            <Tags size={15} style={{ color: "#4CA1AF" }} />
                            <span className="text-xs font-semibold text-black uppercase tracking-wider">
                                Units ({totalUnits})
                            </span>
                        </div>

                        {isUnitsLoading ? (
                            <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
                        ) : units.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                                <Tags size={36} strokeWidth={1.2} />
                                <p className="text-sm">No units found</p>
                            </div>
                        ) : (
                            units.map((unit) => {
                                const isSelected = Number(selectedUnitId) === Number(unit.id);

                                return (
                                    <div
                                        key={unit.id}
                                        onClick={() => handleSelectUnit(unit)}
                                        className="relative flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                                        style={{
                                            backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                                            borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div
                                                className="flex items-center justify-center rounded-lg flex-shrink-0"
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9",
                                                }}
                                            >
                                                <Tags
                                                    size={18}
                                                    style={{
                                                        color: isSelected ? "#4CA1AF" : "#94a3b8",
                                                    }}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p
                                                    className="font-semibold text-gray-800 truncate text-sm"
                                                    style={{ margin: 0 }}
                                                >
                                                    {unit.Unit_Name}
                                                </p>

                                                {unit.Unit_Shorthand && (
                                                    <p
                                                        className="text-gray-400 text-xs truncate"
                                                        style={{ margin: 0 }}
                                                    >
                                                        {unit.Unit_Shorthand}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* SHOW MENU ONLY WHEN System = 0 AND Is_Used = 0 */}
                                        {Number(unit.Is_System) === 0 &&
                                            Number(unit.Is_Used) === 0 && (
                                                <div
                                                    style={{ position: "relative" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setUnitMenuOpen(
                                                                unitMenuOpen === unit.id ? null : unit.id
                                                            )
                                                        }
                                                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                                        style={{
                                                            backgroundColor: "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <MoreVertical
                                                            size={16}
                                                            style={{ color: "#64748b" }}
                                                        />
                                                    </button>

                                                    {unitMenuOpen === unit.id && (
                                                        <div
                                                            className="absolute bg-white shadow-lg rounded-md"
                                                            style={{
                                                                right: 0,
                                                                top: 32,
                                                                width: 140,
                                                                zIndex: 100,
                                                                border: "1px solid #e2e8f0",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                                onClick={() => {
                                                                    setUnitMenuOpen(null);
                                                                    //handleEditUnit(unit);
                                                                }}
                                                            >
                                                                <Eye
                                                                    size={13}
                                                                    style={{ color: "#4CA1AF" }}
                                                                />
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-sm"
                                                                style={{ color: "#dc2626" }}
                                                                onClick={() => {
                                                                    setUnitMenuOpen(null);
                                                                    //handleDeleteUnit(unit);
                                                                }}
                                                            >
                                                                <Trash2
                                                                    size={13}
                                                                    style={{ color: "#dc2626" }}
                                                                />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={leftSentinelRef} style={{ height: 1 }} />
                        {isUnitsFetching && leftCursor && <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>}
                    </div>

                    {/* ══ RIGHT — 70% — conversions panel ══ */}
                    <div
                        className="w-full lg:w-[70%] p-1 overflow-y-auto"
                        style={{ maxHeight: "calc(100vh - 180px)" }}
                    >
                        <div className="flex flex-col h-full">

                            {/* ── UNIT SUMMARY CARD ── */}
                            <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="flex items-center justify-center rounded-xl"
                                        style={{ width: 44, height: 44, backgroundColor: "#4CA1AF22" }}
                                    >
                                        <Package size={22} style={{ color: "#4CA1AF" }} />
                                    </div>

                                    <div>
                                        <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
                                            {selectedUnit?.Unit_Name}
                                        </h6>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                            {totalConversions} conversion{totalConversions !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* RIGHT — Search */}
                                <div className="relative flex-shrink-0 w-full sm:w-auto" style={{ width: 220, height: 36 }}>
                                    <Search
                                        size={16}
                                        style={{ position: "absolute", left: 10, top: 10, color: "#94a3b8", pointerEvents: "none" }}
                                    />
                                    <input
                                        type="text"
                                        value={conversionSearch}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const next = new URLSearchParams(searchParams);
                                            if (value) next.set("convSearch", value);
                                            else next.delete("convSearch");
                                            setSearchParams(next, { replace: true });
                                        }}
                                        placeholder="Search"
                                        className="w-full h-full border rounded-md text-sm outline-none"
                                        style={{ height: 36, paddingLeft: 34, paddingRight: 10, borderColor: "#dbe3ea", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            {/* ── CONVERSIONS TABLE ── */}
                            <div className="table-responsive table-desi">
                                <table className="w-full min-w-[700px]">
                                    {/* <thead>
                                        <tr>
                                            <th>Sl.No</th>
                                            <th
                                                className="text-left py-2 px-3 font-semibold text-black"
                                                style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}
                                            >
                                                Converts To
                                            </th>
                                            <th
                                                className="text-right py-2 px-3 font-semibold text-black"
                                                style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}
                                            >
                                                Conversion Factor
                                            </th>
                                        </tr>
                                    </thead> */}
                                    <thead>
                                        <tr>
                                            <th>Sl.No</th>
                                            <th>Conversion</th>
                                        </tr>
                                    </thead>
                                    {/* <tbody>
                                        {isConversionsLoading ? (
                                            <tr>
                                                <td colSpan={3} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : conversions.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    No conversions to show
                                                </td>
                                            </tr>
                                        ) : (
                                            conversions.map((conv, idx) => (
                                                <tr
                                                    key={conv.Conversion_Id}
                                                    style={{ borderBottom: "1px solid #f1f5f9" }}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td>{idx + 1}.</td>
                                                    <td className="py-2 px-3 text-black">
                                                        {conv.To_Unit_Name}
                                                    </td>
                                                    <td className="text-right" style={{ color: "#000000", whiteSpace: "nowrap" }}>
                                                        {conv.Conversion_Factor}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody> */}
                                    <tbody>
                                        {isConversionsLoading ? (
                                            <tr>
                                                <td colSpan={2} className="text-center text-gray-400 py-12">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : conversions.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="text-center text-gray-400 py-12">
                                                    No conversions to show
                                                </td>
                                            </tr>
                                        ) : (
                                            conversions.map((conv, idx) => (
                                                <tr
                                                    key={conv.id}
                                                    className="hover:bg-gray-50"
                                                    style={{ borderBottom: "1px solid #f1f5f9" }}
                                                >
                                                    <td>{idx + 1}</td>

                                                    <td className="py-3 px-3">
                                                        {`1 ${conv.Primary_Unit} = ${conv.Conversion_Rate} ${conv.Secondary_Unit}`}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                        <div ref={rightSentinelRef} style={{ height: 1 }} />
                        {isConversionsFetching && rightCursor && <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>}
                        {!conversionsHasMore && conversions.length > 0 && <div className="text-center text-xs text-gray-300 py-2">— End of conversions —</div>}
                    </div>

                </div>
            </div>

            {showAddUnitModal && (
                <AddUnitModal
                    onClose={() => setShowAddUnitModal(false)}
                    onSave={(savedUnit) => {
                        setShowAddUnitModal(false);
                        if (savedUnit?.id) {
                            const next = new URLSearchParams(searchParams);
                            next.set("unitId", savedUnit.id);
                            setSearchParams(next);
                        }
                    }}
                />
            )}
            {showSelectUnitModal && (
                <SelectUnitModal
                 units={itemUnits || []}
                    onClose={() => setShowSelectUnitModal(false)}
                    onSave={() => {
                        setShowSelectUnitModal(false);

                        // reset infinite scroll cursor
                        setRightCursor(null);

                        // refetch conversions for selected unit
                        refetchConversions();
                    }}
                />
            )}
            {/* {showSelectUnitModal && (
                <SelectUnitModal
                units={itemUnits || []}
                    onClose={() => setShowSelectUnitModal(false)}
                    onSave={()=>setShowSelectUnitModal(false)}
                    // onSelect={(unit) => {
                    //     //setSelectedUnit(unit); // optional
                    //     setShowSelectUnitModal(false);
                    //     //setShowAddConversionModal(true); // open conversion modal next
                    // }}
                />
            )} */}
        </>
    );
}