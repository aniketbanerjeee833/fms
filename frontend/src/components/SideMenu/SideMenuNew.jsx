// // import { useEffect, useState } from "react";
// // import { NavLink, useLocation } from "react-router-dom";
// // import {
// //   LayoutDashboard,
// //   Users,
// //   Package,
// //   ShoppingCart,
// //   DollarSign,
// //   ClipboardMinus,
// //   CalendarDays,
// //   Settings,
// //   ChevronDown,
// // } from "lucide-react";

// // const SideMenu = () => {
// //   const [openMenu, setOpenMenu] = useState(null);
// //   const location = useLocation();

// //   const toggleMenu = (menuKey) => {
// //     setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
// //   };

// //   useEffect(() => {
// //     const currentPath = location.pathname;

// //     if (
// //       currentPath.startsWith("/items/add") ||
// //       currentPath.startsWith("/items/all-items") ||
// //       currentPath.startsWith("/items/add-category") ||
// //       currentPath.startsWith("/items/all-new-items")
// //     ) {
// //       setOpenMenu("Items");
// //     }

// //     if (currentPath.startsWith("/party/add") || currentPath.startsWith("/party/all-parties")) {
// //       setOpenMenu("Parties");
// //     }

// //     if (
// //       currentPath.startsWith("/sale/add") ||
// //       currentPath.startsWith("/sale/all-sales") ||
// //       currentPath.startsWith("/sale/invoice") ||
// //       currentPath.startsWith("/sale/edit") ||
// //       currentPath.startsWith("/sale/view") ||
// //       currentPath.startsWith("/new/sale/add") ||
// //       currentPath.startsWith("/sale/all-new-sales") ||
// //       currentPath.startsWith("/new/sale/edit") ||
// //       currentPath.startsWith("/sale/return")
// //     ) {
// //       setOpenMenu("Sales");
// //     }

// //     if (
// //       currentPath.startsWith("/purchase/add") ||
// //       currentPath.startsWith("/purchase/all-purchases") ||
// //       currentPath.startsWith("/purchase/return")
// //     ) {
// //       setOpenMenu("Purchase");
// //     }

// //     if (
// //       currentPath.startsWith("/daily-expense/add") ||
// //       currentPath.startsWith("/daily-expense/all-expense")
// //     ) {
// //       setOpenMenu("Daily Expense");
// //     }

// //     if (currentPath.startsWith("/financial-year/add")) {
// //       setOpenMenu("Settings");
// //     }

// //     if (
// //       currentPath.startsWith("/reports/sales-purchases-report") ||
// //       currentPath.startsWith("/reports/balance-sheet")
// //     ) {
// //       setOpenMenu("Reports");
// //     }
// //   }, [location]);

// //   const isLinkActive = (linkTo) => {
// //     const normalize = (path) => path.replace(/\/+$/, "");
// //     const current = normalize(location.pathname);
// //     const searchParams = new URLSearchParams(location.search);
// //     const from = location.state?.from || searchParams.get("from") || localStorage.getItem("lastFrom");
// //     const cleanLink = normalize(linkTo);

// //     if (current === cleanLink) return true;

// //     if (
// //       (cleanLink === "/items/add" && current.startsWith("/items/add")) ||
// //       (cleanLink === "/items/add-category" && current.startsWith("/items/add-category")) ||
// //       (cleanLink === "/items/all-items" && current.startsWith("/items/all-items")) ||
// //       (cleanLink === "/items/all-new-items" && current.startsWith("/items/all-new-items"))
// //     )
// //       return true;

// //     if (
// //       (cleanLink === "/party/add" && current.startsWith("/party/add")) ||
// //       (cleanLink === "/party/all-parties" && current.startsWith("/party/all-parties"))
// //     )
// //       return true;

// //     if (
// //       (cleanLink === "/sale/add" && current.startsWith("/sale/add")) ||
// //       (cleanLink === "/sale/all-sales" &&
// //         (current.startsWith("/sale/all-sales") ||
// //           (current.startsWith("/sale/edit") && from === "all-sale-list") ||
// //           (current.startsWith("/sale/view") &&
// //             (from === "all-sale-list" || /^\/sale\/view\/SAL(?!S)/.test(location.pathname)))))
// //     )
// //       return true;

// //     if (
// //       (cleanLink === "/new/sale/add" && current.startsWith("/new/sale/add")) ||
// //       (cleanLink === "/sale/all-new-sales" &&
// //         (current.startsWith("/sale/all-new-sales") ||
// //           (current.startsWith("/new/sale/edit") && from === "all-new-sale-list") ||
// //           (current.startsWith("/sale/view") &&
// //             (from === "all-new-sale-list" || /^\/sale\/view\/SALS/.test(location.pathname)))))
// //     )
// //       return true;

// //     if (
// //       (cleanLink === "/purchase/add" && current.startsWith("/purchase/add")) ||
// //       (cleanLink === "/purchase/all-purchases" && current.startsWith("/purchase/all-purchases")) ||
// //       (cleanLink === "/purchase/return" && current.startsWith("/purchase/return"))
// //     )
// //       return true;

// //     if (
// //       (cleanLink === "/daily-expense/add" && current.startsWith("/daily-expense/add")) ||
// //       (cleanLink === "/daily-expense/all-expense" && current.startsWith("/daily-expense/all-expense"))
// //     )
// //       return true;

// //     if (cleanLink === "/financial-year/add" && current.startsWith("/financial-year/add")) return true;

// //     if (
// //       (cleanLink === "/reports/sales-purchases-report" &&
// //         current.startsWith("/reports/sales-purchases-report")) ||
// //       (cleanLink === "/reports/balance-sheet" && current.startsWith("/reports/balance-sheet"))
// //     )
// //       return true;

// //     return false;
// //   };

// //   const sections = [
// //     {
// //       key: "Parties",
// //       label: "Parties",
// //       icon: Users,
// //       links: [
// //         { to: "/party/add", text: "Add Parties" },
// //         { to: "/party/all-parties", text: "Party Details" },
// //       ],
// //     },
// //     {
// //       key: "Items",
// //       label: "Items",
// //       icon: Package,
// //       links: [
// //         { to: "/items/add-category", text: "Add Category" },
// //         { to: "/items/add", text: "Add Items" },
// //         { to: "/items/all-items", text: "Item Details" },
// //       ],
// //     },
// //     {
// //       key: "Purchase",
// //       label: "Purchase",
// //       icon: ShoppingCart,
// //       links: [
// //         { to: "/purchase/add", text: "Add Purchase" },
// //         { to: "/purchase/return", text: "Purchase Return" },
// //         { to: "/purchase/payment-out", text: "Payment Out" },
// //         { to: "/purchase/all-purchases", text: "All Purchases" },
// //       ],
// //     },
// //     {
// //       key: "Sales",
// //       label: "Sales",
// //       icon: DollarSign,
// //       links: [
// //         { to: "/sale/invoice", text: "Invoice" },
// //         { to: "/sale/add", text: "Add Sale" },
// //         { to: "/sale/return", text: "Sale Return" },
// //         { to: "/sale/payment-in", text: "Payment In" },
// //         { to: "/sale/all-sales", text: "All Sales" },
// //       ],
// //     },
// //     {
// //       key: "Daily Expense",
// //       label: "Daily Expense",
// //       icon: CalendarDays,
// //       links: [
// //         { to: "/daily-expense/add", text: "Add Daily Expense" },
// //         { to: "/daily-expense/all-expense", text: "Daily Expense List" },
// //       ],
// //     },
// //     {
// //       key: "Settings",
// //       label: "Settings",
// //       icon: Settings,
// //       links: [{ to: "/financial-year/add", text: "Financial Year" }],
// //     },
// //     {
// //       key: "Reports",
// //       label: "Reports",
// //       icon: ClipboardMinus,
// //       links: [
// //         { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
// //         { to: "/reports/balance-sheet", text: "Balance Sheet" },
// //       ],
// //     },
// //   ];

// //   return (
// //     <nav className="msb-root">
// //       <style>{`
// //         .msb-root {
// //           --msb-accent: #2f8f9d;
// //           --msb-accent-soft: #eaf6f7;
// //           --msb-text: #33434f;
// //           --msb-text-muted: #4d5f6a ;
// //           --msb-border: #edf2f4;
// //           --msb-hover: #f4f9fa;
// //           height: 100%;
// //           width: 100%;
// //           background: #ffffff;
// //           display: flex;
// //           flex-direction: column;
// //           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
// //           box-sizing: border-box;
// //           padding: 7px 5px 10px;
// //           overflow-y: auto;
// //         }
// //         .msb-root * { box-sizing: border-box; }

// //         .msb-root a,
// //         .msb-root a:hover,
// //         .msb-root a:focus {
// //           text-decoration: none;
// //         }

// //         .msb-list {
// //           list-style: none;
// //           margin: 0;
// //           padding: 0;
// //           display: flex;
// //           flex-direction: column;
// //           gap: 2px;
// //         }

// //         .msb-dash {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //           padding: 4px 6px;
// //           border-radius: 10px;
// //           color: var(--msb-text);
// //           font-size: 14px;
// //           font-weight: 600;
// //           transition: background 0.15s ease, color 0.15s ease;
// //           margin-bottom: 10px;
// //         }
// //         .msb-dash:hover { background: var(--msb-hover); }
// //         .msb-dash.msb-active {
// //           background: var(--msb-accent);
// //           color: #ffffff;
// //         }
// //         .msb-dash svg { flex-shrink: 0; }

// //         .msb-divider {
// //           height: 1px;
// //           background: var(--msb-border);
// //           margin: 6px 4px 12px;
// //         }

// //         .msb-item { position: relative; }

// //         .msb-header {
// //           width: 100%;
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //           padding: 4px 6px;
// //           border-radius: 10px;
// //           background: transparent;
// //           border: none;
// //           cursor: pointer;
// //           color: var(--msb-text);
// //           font-size: 14px;
// //           font-weight: 500;
// //           transition: background 0.15s ease, color 0.15s ease;
// //         }
// //         .msb-header:hover { background: var(--msb-hover); }
// //         .msb-header.msb-open {
// //           background: var(--msb-accent-soft);
// //           color: var(--msb-accent);
// //           font-weight: 600;
// //         }
// //         .msb-header-label {
// //           flex: 1;
// //           text-align: left;
// //         }
// //         .msb-chevron {
// //           transition: transform 0.2s ease;
// //           color: var(--msb-text-muted);
// //           flex-shrink: 0;
// //         }
// //         .msb-header.msb-open .msb-chevron {
// //           transform: rotate(180deg);
// //           color: var(--msb-accent);
// //         }

// //         .msb-submenu {
// //           overflow: hidden;
// //           max-height: 0;
// //           transition: max-height 0.25s ease;
// //         }
// //         .msb-submenu.msb-submenu-open {
// //           max-height: 400px;
// //         }

// //         // .msb-sublist {
// //         //   list-style: none;
// //         //   margin: 4px 0 8px 0;
// //         //   padding: 2px 0 2px 22px;
// //         //   display: flex;
// //         //   flex-direction: column;
// //         //   gap: 1px;
// //         //   position: relative;
// //         //   border-left: 2px solid var(--msb-border);
// //         //   margin-left: 20px;
// //         // }
// //         .msb-sublist {
// //   list-style: none;
// //   margin: 3px 0 6px;
// //   padding: 2px 0 2px 16px;
// //   margin-left: 16px;

// //   display: flex;
// //   flex-direction: column;
// //   gap: 2px;

// //   border-left: 2px solid #dbe4ea;
// // }

// //         .msb-sublink {
// //           display: block;
// //            padding: 2px 4px;
// //             min-height: 34px;    
// //           border-radius: 8px;
// //           color: var(--msb-text-muted);
// //           font-size: 13.5px;
// //           font-weight: 500;
// //           position: relative;
// //           transition: background 0.15s ease, color 0.15s ease;
// //         }
// //         .msb-sublink:hover {
// //           background: var(--msb-hover);
// //           color: var(--msb-text);
// //         }
// //         .msb-sublink.msb-sub-active {
// //           background: var(--msb-accent-soft);
// //           color: var(--msb-accent);
// //           font-weight: 600;
// //         }
// //         .msb-sublink.msb-sub-active::before {
// //           content: "";
// //           position: absolute;
// //           left: -22px;
// //           top: 50%;
// //           transform: translateY(-50%);
// //           width: 2px;
// //           height: 16px;
// //           border-radius: 2px;
// //           background: var(--msb-accent);
// //         }

// //         .msb-root a:focus-visible,
// //         .msb-root button:focus-visible {
// //           outline: 2px solid var(--msb-accent);
// //           outline-offset: 1px;
// //         }

// //         @media (prefers-reduced-motion: reduce) {
// //           .msb-chevron, .msb-submenu, .msb-header, .msb-dash, .msb-sublink {
// //             transition: none !important;
// //           }
// //         }
// //       `}</style>

// //       <ul className="msb-list">
// //         <li>
// //           <NavLink
// //             to="/home"
// //             className={({ isActive }) => `msb-dash ${isActive ? "msb-active" : ""}`}
// //             onClick={() => setOpenMenu(null)}
// //           >
// //             <LayoutDashboard size={18} />
// //             Dashboard
// //           </NavLink>
// //         </li>
// //       </ul>

// //       <div className="msb-divider" />

// //       <ul className="msb-list">
// //         {sections.map(({ key, label, icon: Icon, links }) => {
// //           const isOpen = openMenu === key;
// //           return (
// //             <li className="msb-item" key={key}>
// //               <button
// //                 type="button"
// //                 className={`msb-header ${isOpen ? "msb-open" : ""}`}
// //                 onClick={() => toggleMenu(key)}
// //                 aria-expanded={isOpen}
// //               >
// //                 <Icon size={18} />
// //                 <span className="msb-header-label">{label}</span>
// //                 <ChevronDown size={16} className="msb-chevron" />
// //               </button>

// //               <div className={`msb-submenu ${isOpen ? "msb-submenu-open" : ""}`}>
// //                 <ul className="msb-sublist">
// //                   {links.map(({ to, text }) => (
// //                     <li key={to}>
// //                       <NavLink
// //                         to={to}
// //                         className={`msb-sublink ${isLinkActive(to) ? "msb-sub-active" : ""}`}
// //                       >
// //                         {text}
// //                       </NavLink>
// //                     </li>
// //                   ))}
// //                 </ul>
// //               </div>
// //             </li>
// //           );
// //         })}
// //       </ul>
// //     </nav>
// //   );
// // };

// // export default SideMenu;

// import { useEffect, useState } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   Package,
//   ShoppingCart,
//   DollarSign,
//   ClipboardMinus,
//   CalendarDays,
//   Settings,
//   ChevronDown,
// } from "lucide-react";

// const SideMenu = () => {
//   const [openMenu, setOpenMenu] = useState(null);
//   const location = useLocation();

//   const toggleMenu = (menuKey) => {
//     setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
//   };

//   useEffect(() => {
//     const currentPath = location.pathname;

//     if (
//       currentPath.startsWith("/items/add") ||
//       currentPath.startsWith("/items/all-items") ||
//       currentPath.startsWith("/items/add-category") ||
//       currentPath.startsWith("/items/all-new-items")
//     ) {
//       setOpenMenu("Items");
//     }

//     if (currentPath.startsWith("/party/add") || currentPath.startsWith("/party/all-parties")) {
//       setOpenMenu("Parties");
//     }

//     if (
//       currentPath.startsWith("/sale/add") ||
//       currentPath.startsWith("/sale/all-sales") ||
//       currentPath.startsWith("/sale/invoice") ||
//       currentPath.startsWith("/sale/edit") ||
//       currentPath.startsWith("/sale/view") ||
//       currentPath.startsWith("/new/sale/add") ||
//       currentPath.startsWith("/sale/all-new-sales") ||
//       currentPath.startsWith("/new/sale/edit") ||
//       currentPath.startsWith("/sale/return")
//     ) {
//       setOpenMenu("Sales");
//     }

//     if (
//       currentPath.startsWith("/purchase/add") ||
//       currentPath.startsWith("/purchase/all-purchases") ||
//       currentPath.startsWith("/purchase/return")
//     ) {
//       setOpenMenu("Purchase");
//     }

//     if (
//       currentPath.startsWith("/daily-expense/add") ||
//       currentPath.startsWith("/daily-expense/all-expense")
//     ) {
//       setOpenMenu("Daily Expense");
//     }

//     if (currentPath.startsWith("/financial-year/add")) {
//       setOpenMenu("Settings");
//     }

//     if (
//       currentPath.startsWith("/reports/sales-purchases-report") ||
//       currentPath.startsWith("/reports/balance-sheet")
//     ) {
//       setOpenMenu("Reports");
//     }
//   }, [location]);

//   const isLinkActive = (linkTo) => {
//     const normalize = (path) => path.replace(/\/+$/, "");
//     const current = normalize(location.pathname);
//     const searchParams = new URLSearchParams(location.search);
//     const from = location.state?.from || searchParams.get("from") || localStorage.getItem("lastFrom");
//     const cleanLink = normalize(linkTo);

//     if (current === cleanLink) return true;

//     if (
//       (cleanLink === "/items/add" && current.startsWith("/items/add")) ||
//       (cleanLink === "/items/add-category" && current.startsWith("/items/add-category")) ||
//       (cleanLink === "/items/all-items" && current.startsWith("/items/all-items")) ||
//       (cleanLink === "/items/all-new-items" && current.startsWith("/items/all-new-items"))
//     )
//       return true;

//     if (
//       (cleanLink === "/party/add" && current.startsWith("/party/add")) ||
//       (cleanLink === "/party/all-parties" && current.startsWith("/party/all-parties"))
//     )
//       return true;

//     if (
//       (cleanLink === "/sale/add" && current.startsWith("/sale/add")) ||
//       (cleanLink === "/sale/all-sales" &&
//         (current.startsWith("/sale/all-sales") ||
//           (current.startsWith("/sale/edit") && from === "all-sale-list") ||
//           (current.startsWith("/sale/view") &&
//             (from === "all-sale-list" || /^\/sale\/view\/SAL(?!S)/.test(location.pathname)))))
//     )
//       return true;

//     if (
//       (cleanLink === "/new/sale/add" && current.startsWith("/new/sale/add")) ||
//       (cleanLink === "/sale/all-new-sales" &&
//         (current.startsWith("/sale/all-new-sales") ||
//           (current.startsWith("/new/sale/edit") && from === "all-new-sale-list") ||
//           (current.startsWith("/sale/view") &&
//             (from === "all-new-sale-list" || /^\/sale\/view\/SALS/.test(location.pathname)))))
//     )
//       return true;

//     if (
//       (cleanLink === "/purchase/add" && current.startsWith("/purchase/add")) ||
//       (cleanLink === "/purchase/all-purchases" && current.startsWith("/purchase/all-purchases")) ||
//       (cleanLink === "/purchase/return" && current.startsWith("/purchase/return"))
//     )
//       return true;

//     if (
//       (cleanLink === "/daily-expense/add" && current.startsWith("/daily-expense/add")) ||
//       (cleanLink === "/daily-expense/all-expense" && current.startsWith("/daily-expense/all-expense"))
//     )
//       return true;

//     if (cleanLink === "/financial-year/add" && current.startsWith("/financial-year/add")) return true;

//     if (
//       (cleanLink === "/reports/sales-purchases-report" &&
//         current.startsWith("/reports/sales-purchases-report")) ||
//       (cleanLink === "/reports/balance-sheet" && current.startsWith("/reports/balance-sheet"))
//     )
//       return true;

//     return false;
//   };

//   const sections = [
//     {
//       key: "Parties",
//       label: "Parties",
//       icon: Users,
//       links: [
//         { to: "/party/add", text: "Add Parties" },
//         { to: "/party/all-parties", text: "Party Details" },
//       ],
//     },
//     {
//       key: "Items",
//       label: "Items",
//       icon: Package,
//       links: [
//         { to: "/items/add-category", text: "Add Category" },
//         { to: "/items/add", text: "Add Items" },
//         { to: "/items/all-items", text: "Item Details" },
//       ],
//     },
//     {
//       key: "Purchase",
//       label: "Purchase",
//       icon: ShoppingCart,
//       links: [
//         { to: "/purchase/add", text: "Add Purchase" },
//         { to: "/purchase/return", text: "Purchase Return" },
//         { to: "/purchase/payment-out", text: "Payment Out" },
//         { to: "/purchase/all-purchases", text: "All Purchases" },
//       ],
//     },
//     {
//       key: "Sales",
//       label: "Sales",
//       icon: DollarSign,
//       links: [
//         { to: "/sale/invoice", text: "Invoice" },
//         { to: "/sale/add", text: "Add Sale" },
//         { to: "/sale/return", text: "Sale Return" },
//         { to: "/sale/payment-in", text: "Payment In" },
//         { to: "/sale/all-sales", text: "All Sales" },
//       ],
//     },
//     {
//       key: "Daily Expense",
//       label: "Daily Expense",
//       icon: CalendarDays,
//       links: [
//         { to: "/daily-expense/add", text: "Add Daily Expense" },
//         { to: "/daily-expense/all-expense", text: "Daily Expense List" },
//       ],
//     },
//     {
//       key: "Settings",
//       label: "Settings",
//       icon: Settings,
//       links: [{ to: "/financial-year/add", text: "Financial Year" }],
//     },
//     {
//       key: "Reports",
//       label: "Reports",
//       icon: ClipboardMinus,
//       links: [
//         { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
//         { to: "/reports/balance-sheet", text: "Balance Sheet" },
//       ],
//     },
//   ];

//   return (
//     <nav className="msb-root">
//       <style>{`
//         .msb-root {
//           --msb-accent: #2f8f9d;
//           --msb-accent-soft: #eaf6f7;
//           --msb-text: #33434f;
//           --msb-text-muted: #4d5f6a;
//           --msb-border: #edf2f4;
//           --msb-hover: #f4f9fa;
//           height: 100%;
//           width: 100%;
//           background: #ffffff;
//           display: flex;
//           flex-direction: column;
//           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
//           box-sizing: border-box;
//           padding: 14px 10px 20px;
//           overflow-y: auto;
//         }
//         .msb-root * { box-sizing: border-box; }

//         /* Hard reset — kills leftover Materialize/global list & link defaults
//            (big line-heights, margins, faded link colors) that would otherwise
//            leak into these elements regardless of our custom classNames. */
//         .msb-root ul,
//         .msb-root li {
//           margin: 0 !important;
//           padding: 0 !important;
//           list-style: none !important;
//           line-height: normal !important;
//           min-height: 0 !important;
//         }

//         .msb-root a,
//         .msb-root a:hover,
//         .msb-root a:focus,
//         .msb-root a:visited {
//           text-decoration: none !important;
//           line-height: normal !important;
//         }

//         .msb-list {
//           list-style: none;
//           margin: 0;
//           padding: 0;
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//         }

//         .msb-dash {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px 12px;
//           border-radius: 10px;
//           color: var(--msb-text);
//           font-size: 14px;
//           font-weight: 600;
//           transition: background 0.15s ease, color 0.15s ease;
//           margin-bottom: 10px;
//         }
//         .msb-dash:hover { background: var(--msb-hover); }
//         .msb-dash.msb-active {
//           background: var(--msb-accent);
//           color: #ffffff;
//         }
//         .msb-dash svg { flex-shrink: 0; }

//         .msb-divider {
//           height: 1px;
//           background: var(--msb-border);
//           margin: 6px 4px 12px;
//         }

//         .msb-item { position: relative; }

//         .msb-header {
//           width: 100%;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 8px 12px;
//           border-radius: 10px;
//           background: transparent;
//           border: none;
//           cursor: pointer;
//           color: var(--msb-text);
//           font-size: 14px;
//           font-weight: 500;
//           transition: background 0.15s ease, color 0.15s ease;
//         }
//         .msb-header:hover { background: var(--msb-hover); }
//         .msb-header.msb-open {
//           background: var(--msb-accent-soft);
//           color: var(--msb-accent);
//           font-weight: 600;
//         }
//         .msb-header-label {
//           flex: 1;
//           text-align: left;
//         }
//         .msb-chevron {
//           transition: transform 0.2s ease;
//           color: var(--msb-text-muted);
//           flex-shrink: 0;
//         }
//         .msb-header.msb-open .msb-chevron {
//           transform: rotate(180deg);
//           color: var(--msb-accent);
//         }

//         .msb-submenu {
//           overflow: hidden;
//           max-height: 0;
//           transition: max-height 0.25s ease;
//         }
//         .msb-submenu.msb-submenu-open {
//           max-height: 400px;
//         }

//         .msb-sublist {
//           list-style: none !important;
//           margin: 3px 0 6px 20px !important;
//           padding: 2px 0 2px 18px !important;
//           display: flex;
//           flex-direction: column;
//           gap: 0px;
//           position: relative;
//           border-left: 2px solid var(--msb-border);
//         }

//         .msb-sublink {
//           display: block !important;
//           padding: 4px 10px !important;
//           border-radius: 8px;
//           color: var(--msb-text-muted) !important;
//           font-size: 13px !important;
//           font-weight: 500 !important;
//           line-height: 1.3 !important;
//           position: relative;
//           transition: background 0.15s ease, color 0.15s ease;
//         }
//         .msb-sublink:hover {
//           background: var(--msb-hover);
//           color: var(--msb-text) !important;
//         }
//         .msb-sublink.msb-sub-active {
//           background: var(--msb-accent-soft);
//           color: var(--msb-accent) !important;
//           font-weight: 600 !important;
//         }
//         .msb-sublink.msb-sub-active::before {
//           content: "";
//           position: absolute;
//           left: -22px;
//           top: 50%;
//           transform: translateY(-50%);
//           width: 2px;
//           height: 16px;
//           border-radius: 2px;
//           background: var(--msb-accent);
//         }

//         .msb-root a:focus-visible,
//         .msb-root button:focus-visible {
//           outline: 2px solid var(--msb-accent);
//           outline-offset: 1px;
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .msb-chevron, .msb-submenu, .msb-header, .msb-dash, .msb-sublink {
//             transition: none !important;
//           }
//         }
//       `}</style>

//       <ul className="msb-list">
//         <li>
//           <NavLink
//             to="/home"
//             className={({ isActive }) => `msb-dash ${isActive ? "msb-active" : ""}`}
//             onClick={() => setOpenMenu(null)}
//           >
//             <LayoutDashboard size={18} />
//             Dashboard
//           </NavLink>
//         </li>
//       </ul>

//       <div className="msb-divider" />

//       <ul className="msb-list">
//         {sections.map(({ key, label, icon: Icon, links }) => {
//           const isOpen = openMenu === key;
//           return (
//             <li className="msb-item" key={key}>
//               <button
//                 type="button"
//                 className={`msb-header ${isOpen ? "msb-open" : ""}`}
//                 onClick={() => toggleMenu(key)}
//                 aria-expanded={isOpen}
//               >
//                 <Icon size={18} />
//                 <span className="msb-header-label">{label}</span>
//                 <ChevronDown size={16} className="msb-chevron" />
//               </button>

//               <div className={`msb-submenu ${isOpen ? "msb-submenu-open" : ""}`}>
//                 <ul className="msb-sublist">
//                   {links.map(({ to, text }) => (
//                     <li key={to}>
//                       <NavLink
//                         to={to}
//                         className={`msb-sublink ${isLinkActive(to) ? "msb-sub-active" : ""}`}
//                       >
//                         {text}
//                       </NavLink>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </li>
//           );
//         })}
//       </ul>
//     </nav>
//   );
// };

// export default SideMenu;