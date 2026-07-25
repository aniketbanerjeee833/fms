import  { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {LayoutDashboard,Users, Package, ShoppingCart, DollarSign, ClipboardMinus, CalendarDays, Settings } from 'lucide-react'

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
    

 
    if(currentPath.startsWith("/party/add") || currentPath.startsWith("/party/all-parties") )
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
 
    if(currentPath.startsWith("/purchase/add") || 
    currentPath.startsWith("/purchase/all-purchases") ||
    currentPath.startsWith("/purchase/return") )
     {
      setOpenMenu("Purchase");
      
    }

    if(currentPath.startsWith("/daily-expense/add") || 
    currentPath.startsWith("/daily-expense/all-expense") )
     {
      setOpenMenu("Daily Expense");
      
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
    (cleanLink === "/party/all-parties" && current.startsWith("/party/all-parties"))
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

    if((cleanLink==="/daily-expense/add" && current.startsWith("/daily-expense/add"))||
    (cleanLink==="/daily-expense/all-expense" && current.startsWith("/daily-expense/all-expense"))
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


// const isLinkActive = (linkTo) => {
//   // const currentPath = location.pathname;
//   // const from = location.state?.from || new URLSearchParams(location.search).get("from");
//   // const currentPath = location.pathname;
//   // const searchParams = new URLSearchParams(location.search);
//   // const from = location.state?.from || searchParams.get("from");
//   // // 🔹 Exact path match
//   // if (currentPath === linkTo) return true;
//   const normalize = (path) => path.replace(/\/+$/, ""); // remove trailing slashes
//   const currentPath = normalize(location.pathname);
//   const searchParams = new URLSearchParams(location.search);
//   const from = location.state?.from || searchParams.get("from");
//   const cleanLink = normalize(linkTo);
//   // 🔹 Items Section
//   if (
//     (cleanLink === `/items/add/` && currentPath.startsWith("/items/add")) ||
//     (cleanLink === `/items/add-category/` && currentPath.startsWith("/items/add-category")) ||
//     (cleanLink === `/items/all-items/` && currentPath.startsWith("/items/all-items")) ||
//     (cleanLink === `/items/all-new-items/` && currentPath.startsWith("/items/all-new-items"))
//   ) return true;

//   // 🔹 Parties Section
//   if (
//     (cleanLink === `/party/add/` && currentPath.startsWith("/party/add")) ||
//     (cleanLink === `/party/all-parties/` && currentPath.startsWith("/party/all-parties"))
//   ) return true;

//   // 🔹 Sales Section (Standard Sale)
//   // if (
//   //   (cleanLink === `/sale/add/` && currentPath.startsWith("/sale/add")) ||
//   //   (cleanLink === `/sale/all-sales/` && (
//   //     currentPath.startsWith("/sale/all-sales") ||
//   //     (currentPath.startsWith("/sale/edit") && from === "all-sale-list") ||
//   //     (currentPath.startsWith("/sale/view") && from === "all-sale-list")
//   //   ))
//   // ) return true;

//   // // 🔹 Sales Section (New Sale)
//   // if (
//   //   (cleanLink === `/new/sale/add/` && currentPath.startsWith("/new/sale/add")) ||
//   //   (cleanLink === `/sale/all-new-sales/` && (
//   //     currentPath.startsWith("/sale/all-new-sales") ||
//   //     (currentPath.startsWith("/sale/edit") && from === "all-new-sale-list") ||
//   //     (currentPath.startsWith("/sale/view") && from === "all-new-sale-list")
//   //   ))
//   // ) 
//   if (
//     (cleanLink === "/sale/all-sales" && (
//       currentPath.startsWith("/sale/all-sales") ||
//       (currentPath.startsWith("/sale/edit") && from === "all-sale-list") ||
//       (currentPath.startsWith("/sale/view") && from === "all-sale-list")
//     ))
//   ) return true;

//   // 🔹 Sales Section (New Sale)
//   if (
//     (cleanLink === "/sale/all-new-sales" && (
//       currentPath.startsWith("/sale/all-new-sales") ||
//       (currentPath.startsWith("/new/sale/edit") && from === "all-new-sale-list") ||
//       (currentPath.startsWith("/sale/view") && from === "all-new-sale-list")
//     ))
//   )
//   return true;

//   // 🔹 Purchase Section
//   if (
//     (cleanLink === `/purchase/add/` && currentPath.startsWith("/purchase/add")) ||
//     (cleanLink === `/purchase/all-purchases/` && currentPath.startsWith("/purchase/all-purchases"))
//   ) return true;

//   return false;
// };


// const isLinkActive = (linkTo) => {
//   const currentPath = location.pathname;
//   const from = location.state?.from || new URLSearchParams(location.search).get("from");
//   console.log("from", from);

//   if (currentPath === linkTo) return true;

//   if (linkTo === `/items/add/`)  {
//     return true;
//   }
//   if(linkTo === `/items/add-category/`){
//     return true;
//   }
//   if(linkTo === `/items/all-items/`){
//     return true;
//   }
 
//   if(linkTo === `/party/add/`){
//     return true;
//   }
//   if(linkTo === `/party/all-parties/`){
//     return true;
//   }
//    if((linkTo === `/sale/add/`) || (linkTo === `/sale/invoice/`) || (linkTo === `/sale/view/`) || (linkTo === `/new/sale/add/`)){
//     return true;
//   }
//     if((linkTo === `/sale/all-sales/`) || (linkTo === `/sale/edit/`) && from==="all-sale-list"){
//     return true;
//   }
//   if((linkTo === `/sale/all-new-sales/`) || (linkTo === `/sale/edit/`) && from==="all-new-sale-list"){
//     return true;
//   }
//   if(linkTo === `/purchase/add/`){
//     return true;
//   }
//     if(linkTo === `/purchase/all-purchases/`){
//     return true;
//   }
    
//   return false;
// };

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
        className="collapsible"
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
           { to: "/party/add", text: "Add Parties" },
            { to: "/party/all-parties", text: "Party Details" },
             
          ])}
          {renderMenu("Items", <Package size={20} />, [
             { to: "/items/add-category", text: "Add Category" },
            { to: "/items/add", text: "Add Items" },
            { to: "/items/all-items", text: "Item Details" },
         
          ])}
        
             {renderMenu("Purchase", <ShoppingCart size={20} />, [
           
            { to: "/purchase/add", text: "Add Purchase" },
              { to: "/purchase/return", text: "Purchase Return" },
            { to: "/purchase/payment-out", text: "Payment Out" },
            { to: "/purchase/all-purchases", text: " All Purchases " },
          ])}

         
               {renderMenu("Sales", <DollarSign size={20} />, [
           
           {to: "/sale/invoice", text: " Invoice" },
            { to: "/sale/add", text: "Add Sale" },
              { to: "/sale/return", text: "Sale Return" },
             { to: "/sale/payment-in", text: "Payment In" },
             { to: "/sale/all-sales", text: " All Sales" },
          
          ])}
           {renderMenu("Daily Expense", <CalendarDays  size={20} />, [
           
            { to: "/daily-expense/add", text: "Add Daily Expense" },
            { to: "/daily-expense/all-expense", text: " Daily Expense List" },
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
                  {
  renderMenu(
    "Reports",
    <ClipboardMinus size={20} />,
    [
      { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
       { to: "/reports/balance-sheet", text: "Balance Sheet" },
    ]
  )}
        </ul>
      </div>
    </>
  );
};



export default SideMenu;


