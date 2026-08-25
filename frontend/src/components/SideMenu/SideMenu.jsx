import  { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {LayoutDashboard,Users, Package, ShoppingCart, DollarSign, ClipboardMinus, CalendarDays, Settings, Wallet } from 'lucide-react'

const REACT_APP_API_URL = "http://localhost:4000";

const SideMenu = () => {
  // const { userId } = useSelector((state) => state.user);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
  };
  const location=useLocation(); // ✅ correct way
  useEffect(() => {
   

const currentPath = location.pathname;
// console.log("currentPath", currentPath);
  //const from = location.state?.from || new URLSearchParams(location.search).get("from");
     //const searchParams = new URLSearchParams(location.search);
  //const from = location.state?.from || searchParams.get("from");
//const from = location.state?.from || new URLSearchParams(location.search).get("from");
    if(currentPath.startsWith("/items/add") || currentPath.startsWith("/items/all-items") ||
    currentPath.startsWith("/items/add-category")|| currentPath.startsWith("/items/all-new-items") )
     {
      setOpenMenu("Items");
      
    }
    

 
    if(currentPath.startsWith("/party/add") || currentPath.startsWith("/party/all-parties") ||
    currentPath.startsWith("/party/payables") || currentPath.startsWith("/party/receivables") )
     {
      setOpenMenu("Parties");
      
    }
   if(currentPath.startsWith("/sale/add") || currentPath.startsWith("/sale/all-sales") ||
    currentPath.startsWith("/sale/invoice") || currentPath.startsWith("/sale/edit") 
  || currentPath.startsWith("/sale/view")|| currentPath.startsWith("/new/sale/add")||
    currentPath.startsWith("/sale/all-new-sales")|| currentPath.startsWith("/new/sale/edit") ||
    currentPath.startsWith("/sale/return"))
     {
      setOpenMenu("Sales");
      
    }
      if(currentPath.startsWith("/cash-bank/cash-in-hand") || 
    currentPath.startsWith("/cash-bank/bank-accounts") )
    
     {
      setOpenMenu("Cash and Bank");
      
    }
 
    if(currentPath.startsWith("/purchase/add") || 
    currentPath.startsWith("/purchase/all-purchases") ||
    currentPath.startsWith("/purchase/return") )
     {
      setOpenMenu("Purchase");
      
    }

    // if(currentPath.startsWith("/daily-expense/add") || 
    // currentPath.startsWith("/daily-expense/all-expense") )
    //  {
    //   setOpenMenu("Expense");
      
    // }
    if(currentPath.startsWith("/expense/categories") || 
    currentPath.startsWith("/expense/items") )
     {
      setOpenMenu("Expense");
      
    }

    if(currentPath.startsWith("/financial-year/add") )
     {
      setOpenMenu("Settings");
      
    }
     if(currentPath.startsWith("/reports/sales-purchases-report") ||
    currentPath.startsWith("/reports/balance-sheet") )
     {
      setOpenMenu("Reports");
      
    }
 
  }, [location]);

const isLinkActive = (linkTo) => {
  const normalize = (path) => path.replace(/\/+$/, "");
  const current = normalize(location.pathname);
  const searchParams = new URLSearchParams(location.search);
  const from =location.state?.from ||searchParams.get("from") ||localStorage.getItem("lastFrom");

  // const from = location.state?.from || searchParams.get("from");
  const cleanLink = normalize(linkTo);

  // 🔹 Exact match
  if (current === cleanLink) return true;

  // 🔹 Items Section
  if (
    (cleanLink === "/items/add" && current.startsWith("/items/add")) ||
    (cleanLink === "/items/add-category" && current.startsWith("/items/add-category")) ||
    (cleanLink === "/items/all-items" && current.startsWith("/items/all-items")) ||
    (cleanLink === "/items/all-new-items" && current.startsWith("/items/all-new-items"))
  )
    return true;

  // 🔹 Parties Section
  if (
    (cleanLink === "/party/add" && current.startsWith("/party/add")) ||
    (cleanLink === "/party/parties" && current.startsWith("/party/parties")||
    (cleanLink === "/party/payables" && current.startsWith("/party/payables")) ||
    (cleanLink === "/party/receivables" && current.startsWith("/party/receivables")))
  )
    return true;

 
if (
  (cleanLink === "/sale/add" && current.startsWith("/sale/add")) ||
  (cleanLink === "/sale/all-sales" &&
    (current.startsWith("/sale/all-sales") ||
      (current.startsWith("/sale/edit") && from === "all-sale-list") ||
      (current.startsWith("/sale/view") &&
        (from === "all-sale-list" ||
          // fallback: match Sale_Id that starts with "SAL" but NOT "SALS"
          /^\/sale\/view\/SAL(?!S)/.test(location.pathname)))))
)
  return true;

// 🔹 New Sale
if (
  (cleanLink === "/new/sale/add" && current.startsWith("/new/sale/add")) ||
  (cleanLink === "/sale/all-new-sales" &&
    (current.startsWith("/sale/all-new-sales") ||
      (current.startsWith("/new/sale/edit") && from === "all-new-sale-list") ||
      (current.startsWith("/sale/view") &&
        (from === "all-new-sale-list" ||
          // fallback: match Sale_Id that starts with "SALS"
          /^\/sale\/view\/SALS/.test(location.pathname)))))
)
  return true;


  // 🔹 Purchase
  if (
    (cleanLink === "/purchase/add" && current.startsWith("/purchase/add")) ||
    (cleanLink === "/purchase/all-purchases" && current.startsWith("/purchase/all-purchases") ||
      ( cleanLink === "/purchase/return" && current.startsWith("/purchase/return")))
  )
    return true;

  //   if((cleanLink==="/daily-expense/add" && current.startsWith("/daily-expense/add"))||
  //   (cleanLink==="/daily-expense/all-expense" && current.startsWith("/daily-expense/all-expense"))
  // )
  //   return true;

    if(
      (cleanLink==="/expense/categories" && current.startsWith("/expense/categories")) ||
      (cleanLink==="/expense/items" && current.startsWith("/expense/items"))
    )
      return true;

    if(cleanLink==="/financial-year/add" && current.startsWith("/financial-year/add"))
      return true;

    if((cleanLink==="/reports/sales-purchases-report" && 
      current.startsWith("/reports/sales-purchases-report"))||
      (cleanLink==="/reports/balance-sheet" && current.startsWith("/reports/balance-sheet")))
      return true;
  return false;
};




  const renderMenu = (label, iconClass, links, menuKey = label) => {
    return (
      <li key={label}>
        <NavLink
          to="#"
          className={`collapsible-header ${openMenu === menuKey ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            toggleMenu(menuKey);
          }}
        >
          {/* <i className={`fa ${iconClass}`} aria-hidden="true"></i> {label} */}
          <span className="flex items-center gap-2 ">{iconClass } {label}</span>
        </NavLink>

       {openMenu === menuKey && (
          <div className="collapsible-body left-sub-menu">
            <ul>
              {links.map(({ to, text }, index) => (
                <li key={index}>
                  <NavLink
                    to={to}
                    className={isLinkActive(to) ? "menu-active" : ""}
                  >
                    {text}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Sidebar Header */}
      <div  className="sb2-12 flex items-center justify-center  ">
        {/* <ul className="flex flex-col items-center">
        
          <li className="mt-4">
            <h5>Inventory Management</h5>
          </li>
        </ul> */}
      </div>

      {/* Sidebar Navigation */}
      <div
        className="sb2-13"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
         
        }}
      >
        <ul
        //className="collapsible"
          // className="collapsible"
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
          }}
        >
           <NavLink
              to="/home"
              className={({ isActive }) => (isActive ? "menu-active" : "")}
              style={{ display: 'block', padding: '10px 16px',
                color: "#666", textDecoration: 'none' }}
                  onClick={() => setOpenMenu(null)} // ✅ Close all submenus
            >
              
              {/* <i className="fa fa-bar-chart" aria-hidden="true"></i> Dashboard */}
                 <span className="flex items-center gap-2"><LayoutDashboard size={20}/> 
                 Dashboard
                 </span>
            </NavLink>
               {renderMenu("Parties",     <Users size={20}/>, [
          //  { to: "/party/add", text: "Add Parties" },
            { to: "/party/parties", text: "Party Details" },
             
          ])}
          {renderMenu("Items", <Package size={20} />, [
             { to: "/items/categories", text: "Category" },
            //{ to: "/items/add", text: "Add Items" },
            //{ to: "/items/all-items", text: "Item Details" },
                { to: "/items/all-items", text: "Items" },
                { to: "/items/units", text: "Units" },
         
          ])}
          
        
             {renderMenu("Purchase", <ShoppingCart size={20} />, [
           
            //{ to: "/purchase/add", text: "Add Purchase" },
             { to: "/purchase/all-purchases", text: "  Purchase Bills " },
              { to: "/purchase/return", text: "Purchase Return" },
            { to: "/purchase/payment-out", text: "Payment Out" },
           
          ])}

         
               {renderMenu("Sales", <DollarSign size={20} />, [
            { to: "/sale/all-sales", text: "  Sale Invoices" },
           {to: "/sale/invoice", text: " Invoice" },
            //{ to: "/sale/add", text: "Add Sale" },
              { to: "/sale/return", text: "Sale Return" },
             { to: "/sale/payment-in", text: "Payment In" },
            
          
          ])}

           {renderMenu("Cash and Bank", <Wallet  size={20} />, [
           
            { to: "/cash-bank/cash-in-hand", text: "Cash In Hand" },
            { to: "/cash-bank/bank-accounts", text: " Bank Accounts" },
          ])}
           {renderMenu("Expense", <CalendarDays  size={20} />, [
           
            // { to: "/expense/add", text: "Add Expense" },
            { to: "/expense/categories", text: "Categories" },
             { to: "/expense/items", text: "Items" },
          ])}
           {renderMenu("Settings", <Settings  size={20} />, [
           
            { to: "/financial-year/add", text: "Financial Year" },
          
          ])}

           {/* <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? "menu-active" : "")}
              style={{ display: 'block', padding: '10px 16px',
                color: "#666", textDecoration: 'none' }}
                  onClick={() => setOpenMenu(null)} // ✅ Close all submenus
            >
              
              {/* <i className="fa fa-bar-chart" aria-hidden="true"></i> Dashboard 
                 <span className="flex items-center gap-2">  <ClipboardMinus  size={20}/> 
                 Reports
                 </span>
            </NavLink> */}
                  {/* {
  renderMenu(
    "Reports",
    <ClipboardMinus size={20} />,
    [
      { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
       { to: "/reports/balance-sheet", text: "Balance Sheet" },
    ]
  )} */}
        </ul>
      </div>
    </>
  );
};



export default SideMenu;


// import { useState } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import {
//   DollarSign, ShoppingBag, Wallet, CalendarDays,
//   Settings, ClipboardMinus, ChevronDown, LayoutDashboard,
//   ShoppingCart,
// } from "lucide-react";

// export default function Sidebar() {
//   const location = useLocation();
//   const [openMenu, setOpenMenu] = useState(null);

//   const ACCENT = "#4CA1AF";
//   const BG_DARK = "#111827";
//   const BG_HOVER = "#1f2937";
//   const TEXT_MUTED = "#9ca3af";

//   // 🔹 auto-open the group containing the current route on load
//   const isGroupActive = (items) => items.some((i) => location.pathname.startsWith(i.to));

//   const renderMenu = (title, icon, items) => {
//     const isOpen = openMenu === title || (openMenu === null && isGroupActive(items));
//     const active = isGroupActive(items);

//     return (
//       <div style={{ marginBottom: 2 }}>
//         <button
//           onClick={() => setOpenMenu(isOpen ? "__none__" : title)}
//           style={{
//             width: "100%",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "10px 14px",
//             background: "transparent",
//             border: "none",
//             cursor: "pointer",
//             borderRadius: 10,
//             color: active ? "#fff" : TEXT_MUTED,
//             fontWeight: 600,
//             fontSize: 13.5,
//           }}
//           onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BG_HOVER)}
//           onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
//         >
//           <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <span style={{ color: active ? ACCENT : TEXT_MUTED, display: "flex" }}>{icon}</span>
//             {title}
//           </span>
//           <ChevronDown
//             size={15}
//             style={{
//               transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
//               transition: "transform 0.2s ease",
//               color: TEXT_MUTED,
//             }}
//           />
//         </button>

//         <div
//           style={{
//             maxHeight: isOpen ? items.length * 40 + 8 : 0,
//             overflow: "hidden",
//             transition: "max-height 0.25s ease",
//           }}
//         >
//           <div style={{ paddingLeft: 20, paddingTop: 4, paddingBottom: 4, borderLeft: `2px solid #1f2937`, marginLeft: 24 }}>
//             {items.map((item) => (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 onClick={() => setOpenMenu(null)}
//                 style={({ isActive }) => ({
//                   display: "block",
//                   padding: "8px 14px",
//                   borderRadius: 8,
//                   fontSize: 13,
//                   textDecoration: "none",
//                   color: isActive ? "#fff" : TEXT_MUTED,
//                   backgroundColor: isActive ? ACCENT : "transparent",
//                   fontWeight: isActive ? 600 : 400,
//                   marginBottom: 2,
//                   transition: "background-color 0.15s, color 0.15s",
//                 })}
//                 onMouseEnter={(e) => {
//                   if (!location.pathname.startsWith(item.to)) e.currentTarget.style.backgroundColor = BG_HOVER;
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!location.pathname.startsWith(item.to)) e.currentTarget.style.backgroundColor = "transparent";
//                 }}
//               >
//                 {item.text.trim()}
//               </NavLink>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     // <aside
//     //   style={{
//     //     width: 250,
//     //     height: "100vh",
//     //     position: "sticky",
//     //     top: 0,
//     //     backgroundColor: BG_DARK,
//     //     display: "flex",
//     //     flexDirection: "column",
//     //     borderRight: "1px solid #1f2937",
//     //   }}
//     // >
//           <div
//         className="sb2-13"
//         style={{
//           height: "100%",
//           backgroundColor: BG_DARK,
//           display: "flex",
//           flexDirection: "column",
         
//         }}
//       >
//       {/* Brand header */}
//       {/* <div style={{ padding: "20px 16px", borderBottom: "1px solid #1f2937" }}>
//         <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>
//           ANCO<span style={{ color: ACCENT }}>Books</span>
//         </span>
//       </div> */}

//       {/* Scrollable nav */}
//       <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
//         <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
//             <NavLink
//     to="/home"
//     onClick={() => setOpenMenu(null)}
//     style={({ isActive }) => ({
//       display: "flex",
//       alignItems: "center",
//       gap: 10,
//       padding: "10px 14px",
//       borderRadius: 10,
//       textDecoration: "none",
//       fontSize: 13.5,
//       fontWeight: isActive ? 600 : 500,
//       color: isActive ? "#fff" : "#9ca3af",
//       backgroundColor: isActive ? "#4CA1AF" : "transparent",
//       marginBottom: 4,
//     })}
//   >
//     <LayoutDashboard size={19} />
//     Dashboard
//   </NavLink>
//                 {renderMenu("Purchase", <ShoppingCart size={20} />, [
           
//             //{ to: "/purchase/add", text: "Add Purchase" },
//              { to: "/purchase/all-purchases", text: "  Purchase Bills " },
//               { to: "/purchase/return", text: "Purchase Return" },
//             { to: "/purchase/payment-out", text: "Payment Out" },
           
//           ])}
//           {renderMenu("Sales", <DollarSign size={19} />, [
//             { to: "/sale/all-sales", text: "Sale Invoices" },
//             { to: "/sale/invoice", text: "Invoice" },
//             { to: "/sale/return", text: "Sale Return" },
//             { to: "/sale/payment-in", text: "Payment In" },
//           ])}

//           {renderMenu("Cash and Bank", <Wallet size={19} />, [
//             { to: "/cash-bank/cash-in-hand", text: "Cash In Hand" },
//             { to: "/cash-bank/bank-accounts", text: "Bank Accounts" },
//           ])}

//           {renderMenu("Expense", <CalendarDays size={19} />, [
//             { to: "/expense/categories", text: "Categories" },
//             { to: "/expense/items", text: "Items" },
//           ])}

//           {/* {renderMenu("Reports", <ClipboardMinus size={19} />, [
//             { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
//             { to: "/reports/balance-sheet", text: "Balance Sheet" },
//           ])} */}

//           {renderMenu("Settings", <Settings size={19} />, [
//             { to: "/financial-year/add", text: "Financial Year" },
//           ])}
//         </ul>
//       </div>
//     </div>
//   );
// }