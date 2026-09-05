// // Layout.jsx


// import SideMenu from "../SideMenu/SideMenu";


// export default function Layout({ children }) {
//   return (
//     <>
//        {/* <Header/> */}
//     <div className="container-fluid sb2">
//       {/* <div className="row"> */}
//       <div className="row">
//         {/* Sidebar (always visible) */}
//         <div className="sb2-1">
//           <SideMenu/>
//         </div>

//         {/* Main content */}
//         {/* <div className="sb2-2">{children}</div> */}
//         <div className="sb2-2"

//         >{children}</div>
//       </div>
//     </div>
//     </>
//   );
// }

// Layout.jsx


import SideMenu from "../SideMenu/SideMenu";


// export default function Layout({ children }) {
//   return (
//     <>
//       {/* <Header/> */}
//       <div className="container-fluid sb2">
//         <div className="row">
//           {/* Sidebar */}
//           <div className="sb2-1">
//           <SideMenu/>
//         </div>

//           {/* Main content */}
//       <div className="sb2-2">{children}</div>
//         </div>
//       </div>
//     </>
//   );
// }

export default function Layout({ children }) {
  return (
    <div
      className="container-fluid sb2"
      style={{
        padding: 0,
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* Sidebar */}
      <div className="sb2-1">
        <SideMenu />
      </div>

      {/* Main content */}
      <div className="sb2-2">
        {children}
      </div>
    </div>
  );
}
