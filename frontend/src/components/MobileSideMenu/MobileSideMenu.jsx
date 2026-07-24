import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {Users, Package, ShoppingCart, DollarSign, X, CalendarDays, ClipboardMinus } from 'lucide-react'

import "./MobileSideMenu.css";
const MobileSideMenu = ({onClose}) => {
  // const { userId } = useSelector((state) => state.user);
  const [openMenu, setOpenMenu] = useState(null);
  const location=useLocation(); // ✅ correct way
  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
  };
  useEffect(() => {
   

const currentPath = location.pathname;
  //const from = location.state?.from || new URLSearchParams(location.search).get("from");
   

    if(currentPath.startsWith("/items/add") || currentPath.startsWith("/items/all-items") ||
    currentPath.startsWith("/items/add-category"))
     {
      setOpenMenu("Items");
      
    }
    
 
 
    if(currentPath.startsWith("/party/add") || currentPath.startsWith("/party/all-parties") )
     {
      setOpenMenu("Parties");
      
    }
  //  if(currentPath.startsWith("/sale/add") || currentPath.startsWith("/sale/all-sales") ||
  //   currentPath.startsWith("/sale/invoice") )
  //    {
  //     setOpenMenu("Sales");
      
  //   }
  if(currentPath.startsWith("/sale/add") || currentPath.startsWith("/sale/all-sales") ||
    currentPath.startsWith("/sale/invoice") || currentPath.startsWith("/sale/edit") 
  || currentPath.startsWith("/sale/view")|| currentPath.startsWith("/new/sale/add")||
    currentPath.startsWith("/sale/all-new-sales")|| currentPath.startsWith("/new/sale/edit") )
     {
      setOpenMenu("Sales");
      
    }
    if(currentPath.startsWith("/purchase/add") || currentPath.startsWith("/purchase/all-purchases") )
     {
      setOpenMenu("Purchase");
      
    }
   if(currentPath.startsWith("/daily-expense/add") || 
    currentPath.startsWith("/daily-expense/all-expense") )
     {
      setOpenMenu("Daily Expense ");
      
    }

    if(currentPath.startsWith("/financial-year/add") )
     {
      setOpenMenu("Settings");
      
    }
    //    if(currentPath.startsWith("/reports/sales-purchases-report") )
    //  {
    //   setOpenMenu("Reports");
      
    // }
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
    (cleanLink === "/items/all-items" && current.startsWith("/items/all-items"))
   
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
    (cleanLink === "/purchase/all-purchases" && current.startsWith("/purchase/all-purchases"))
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
const handleDashBoardClick = () => {
  setOpenMenu(null);
  onClose();
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
                     onClick={onClose}
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
        <div
        className="mobile-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      ></div>
       <div className="mobile-drawer"
       style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "280px",
          height: "100%",
          background: "#fff",
          zIndex: 1000,
          overflowY: "auto",
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
          paddingTop: "20px",
        }}>
      <div  className="sb2-12 flex items-center justify-center  ">
      
          <X onClick={onClose}
             style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#666",
         
          }}/>

        <ul className="flex flex-col items-center">
        
          <li className="mt-4">
            <h5>Inventory Management</h5>
          </li>
        </ul>
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
                    onClick={() => 
                    handleDashBoardClick()

                       
                    } // ✅ Close all submenus
            >
              <i className="fa fa-bar-chart" aria-hidden="true"></i> Dashboard
            </NavLink>
               {renderMenu("Parties", <Users size={20}/>, [
           { to: "/party/add", text: "Add Parties" },
            { to: "/party/all-parties", text: "Party Details" },
             
          ])}
          {renderMenu("Items",  <Package size={20} />, [
             { to: "/items/add-category", text: "Add Category" },
            { to: "/items/add", text: "Add Items" },
            { to: "/items/all-items", text: "Item Details" },
             
         
          ])}
        
             {renderMenu("Purchase",  <ShoppingCart size={20} />, [
           
            { to: "/purchase/add", text: "Add Purchase" },
            { to: "/purchase/all-purchases", text: " Purchase List " },
          ])}
               {renderMenu("Sales", <DollarSign size={20} />, [
           
           {to: "/sale/invoice", text: " Invoice" },
            { to: "/sale/add", text: "Add Sale" },
             
             { to: "/sale/all-sales", text: " Sale List" },
                
          ])}
           {renderMenu("Daily Expense", <CalendarDays size={20} />, [
           
            { to: "/daily-expense/add", text: "Add Daily Expense" },
            { to: "/daily-expense/all-expense", text: " Daily Expense Report" },
          ])}
           {renderMenu("Settings", <DollarSign size={20} />, [
           
            { to: "/financial-year/add", text: "Financial Year" },
          
          ])}
                         {renderMenu(
              "Reports",
              <ClipboardMinus size={20} />,
              [
                { to: "/reports/sales-purchases-report", text: "Sales & Purchases Report" },
                 { to: "/reports/balance-sheet", text: "Balance Sheet" },
               
              ]
            )}
        </ul>
      </div>
    </div>
    </>
  );
};
export default MobileSideMenu;