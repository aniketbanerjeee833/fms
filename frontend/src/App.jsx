import { lazy, Suspense } from 'react';
import { Routes, Route, BrowserRouter, Navigate, useLocation, Outlet } from 'react-router-dom';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout/Layout';
import { useGetUserQuery } from './redux/api/userApi';
import Spinner from './components/Layout/Spinner';








// 🧩 Lazy imports
const Header = lazy(() => import('./components/Header/Header'));
const Login = lazy(() => import('./pages/User/Login/Login'));

const Dashboard = lazy(() => import('./pages/Dashboard'));


const DayWiseReport = lazy(() => import('./pages/DayWiseReport'));
const DateRangeReport = lazy(() => import('./pages/DateRangeReport'));

const PartyPayablesLeft = lazy(() => import('./pages/Party/PartyPayablesLeft'));
const PartyReceivablesLeft = lazy(() => import('./pages/Party/PartyReceivablesLeft'));

const AddCategory = lazy(() => import('./pages/Items/AddCategories'));
const PartyAdd = lazy(() => import('./pages/Party/PartyAdd'));
const Parties= lazy(() => import('./pages/Party/Parties'));
const PartySalesPurchasesDetails = lazy(() => import('./pages/Party/PartySalesPurchasesDetails'));

const Items = lazy(() => import('./pages/Items/Items'));
const AllItemsList = lazy(() => import('./pages/Items/AllItemsList'));
const ItemSalesPurchasesDetails = lazy(() => import('./pages/Items/ItemsSalesPurchasesDetails'));


const PurchaseAdd = lazy(() => import('./pages/Purchase/PurchaseAdd'));
const PaymentOut= lazy(() => import('./pages/Purchase/PaymentOut'));
const PurchaseReturn= lazy(() => import('./pages/Purchase/PurchaseReturn'));
const PurchaseReturnAdd= lazy(() => import('./pages/Purchase/PurchaseReturnAdd'));
const PurchaseReturnEdit= lazy(() => import('./pages/Purchase/PurchaseReturnEdit'));
const PurchaseView = lazy(() => import('./pages/Purchase/PurchaseView'));
const AllPurchasesList = lazy(() => import('./pages/Purchase/AllPurchaseList'));
const PurchaseEdit = lazy(() => import('./pages/Purchase/PurchaseEdit'));

const Invoice = lazy(() => import('./pages/Sale/Invoice'));
const AllSaleList = lazy(() => import('./pages/Sale/AllSaleList'));
const PaymentIn= lazy(() => import('./pages/Sale/PaymentIn'));
const SaleReturn= lazy(() => import('./pages/Sale/SaleReturn'));
const SaleReturnAdd= lazy(() => import('./pages/Sale/SaleReturnAdd'));
const SaleReturnEdit= lazy(() => import('./pages/Sale/SaleReturnEdit'));
const SaleAdd = lazy(() => import('./pages/Sale/SaleAdd'));
const SaleView = lazy(() => import('./pages/Sale/SaleView'));
const SaleEdit = lazy(() => import('./pages/Sale/SaleEdit'));


// const AddDailyExpense = lazy(() => import('./pages/DailyExpense/AddDailyExpense'));
const ExpensesByCategories = lazy(() => import('./pages/Expense/ExpensesByCategories'));
const ExpensesByItems = lazy(() => import('./pages/Expense/ExpensesByItems'));
const AddExpense = lazy(() => import('./pages/Expense/AddExpense'));
const EditExpense = lazy(() => import('./pages/Expense/EditExpense'));
const ExpensePreview = lazy(() => import('./pages/Expense/ExpensePreview'));

const CashInHand= lazy(() => import('./pages/CashAndBank/CashInHand'));
const BankAccounts= lazy(() => import('./pages/CashAndBank/BankAccounts'));

const FinancialYear = lazy(() => import('./pages/Settings/FinancialYear'));
// const Reports = lazy(() => import('./pages/Reports'));


//REPORTS
const SalesPurchasesReport= lazy(() => import('./pages/Reports/SalesPurchasesReport'));
const BalanceSheet = lazy(() => import('./pages/Reports/BalanceSheet'));

// ==========================================
// 🔒 Auth Route Guards
// ==========================================




function ProtectedRoute() {
  const location = useLocation();
  const { data, isLoading, isError } = useGetUserQuery(undefined, {
    skip: location.pathname === "/login", // ⛔ Skip fetch on login
  });

  if (isLoading) return ;

  const isAuthenticated = data?.authenticated || data?.user;

  if (isError || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// 🔓 Public Route — prevent logged-in users from accessing /login
function PublicRoute() {
  const location = useLocation();
  const { data, isLoading } = useGetUserQuery(undefined, {
    skip: location.pathname !== "/login", // ✅ Only run this check on login page
  });

  if (isLoading) return ;

  const isAuthenticated = data?.authenticated;

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}

function RouterWrapper() {
  const location = useLocation();
  console.log(location);
  const hideHeader = location.pathname === "/login" || 
  location.pathname.startsWith("/day-wise-report") ||
  location.pathname.startsWith("/date-range-report");

  return (
    <>
      {!hideHeader && <Header />}
    <Suspense fallback={<Spinner size="lg" text="Loading..." />}>
        <Routes>
          {/* Public Route: Login */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/home"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />

            <Route
              path="/items/add-category"
              element={
                <Layout>
                  <AddCategory />
                </Layout>
              }
            />
            <Route
              path="/items/add"
              element={
                <Layout>
                  <Items />
                </Layout>
              }
            />
            <Route
              path="/items/all-items"
              element={
                <Layout>
                  <AllItemsList />
                </Layout>
              }
            />
                  <Route
              path="/item/item-sales-purchases-details/:id"
              element={
                
                  <ItemSalesPurchasesDetails/>
               
              }
            />
            <Route
              path="/party/add"
              element={
                <Layout>
                  <PartyAdd />
                </Layout>
              }
            />
            <Route
              path="/party/parties"
              element={
                <Layout>
                  <Parties />
                </Layout>
              }
            />
              <Route
              path="/party/party-sales-purchases-details/:id"
              element={
                
                  <PartySalesPurchasesDetails/>
               
              }
            />
            <Route
              path="/sale/invoice"
              element={
                <Layout>
                  <Invoice />
                </Layout>
              }
            />
            <Route
              path="/sale/add"
              element={
               
                  <SaleAdd />
              
              }
            />
           
             <Route
              path="/sale/edit/:id"
              element={
               
                  <SaleEdit />
              
              }
            /> 
            <Route
              path="/sale/all-sales"
              element={
                <Layout>
                  <AllSaleList />
                </Layout>
              }
            />
              <Route
              path="/sale/payment-in"
              element={
                   <Layout>

                  
                  <PaymentIn />
                   </Layout>
                
              }
            />
             <Route
              path="/sale/return"
              element={
                 <Layout>
                  <SaleReturn />
                  </Layout>
                
              }
            />
             
              <Route
              path="/sale/view/:id"
              element={
               
                  <SaleView />
             
              }
            />
            <Route
              path="/purchase/add"
              element={
             
                  <PurchaseAdd />
                
              }
            />
            <Route
              path="/sale/return/add/:id"
              element={
                 
                  <SaleReturnAdd/>
                 
              }
            />
             <Route
              path="/sale/return/edit/:id"
              element={
                 
                  <SaleReturnEdit/>
                 
              }
            />
             <Route
              path="/purchase/payment-out"
              element={
                   <Layout>

                  
                  <PaymentOut />
                   </Layout>
                
              }
            />
            <Route
              path="/purchase/return"
              element={
                 <Layout>
                  <PurchaseReturn />
                  </Layout>
                
              }
            />
            <Route
              path="/purchase/return/edit/:id"
              element={
                 
                  <PurchaseReturnEdit/>
                 
              }
            />
             <Route
              path="/purchase/return/add/:id"
              element={
                 
                  <PurchaseReturnAdd/>
                 
              }
            />
              <Route
              path="/purchase/edit/:id"
              element={
             
                  <PurchaseEdit />
                
              }
            />
            <Route
              path="/purchase/view/:id"
              element={
               
                  <PurchaseView />
             
              }
            />
            <Route
              path="/purchase/all-purchases"
              element={
                <Layout>
                  <AllPurchasesList />
                </Layout>
              }
            />

              <Route
              path="/cash-bank/cash-in-hand"
              element={
                <Layout>
                  <CashInHand/>
                </Layout>
              }
            />
             <Route
              path="/cash-bank/bank-accounts"
              element={
                <Layout>
                  <BankAccounts/>
                </Layout>
              }
            />

            {/* <Route
              path="/daily-expense/add"
              element={
                <Layout>
                  <AddDailyExpense/>
                </Layout>
              }
            /> */}
              <Route
                           path="/expense/categories"
                           element={
                             <Layout>
                               <ExpensesByCategories />
                             </Layout>
                           }
                         />
                         <Route
                           path="/expense/items"
                           element={
                             <Layout>
                               <ExpensesByItems />
                             </Layout>
                           }
                         />
                         <Route
                           path="/expense/add"
                           element={
             
                             <AddExpense />
             
                           }
                         />
                         <Route
                           path="/expense/edit/:id"
                           element={
                             <EditExpense />
                           }
                         />
                         <Route
                           path="/expense/preview/:id"
                           element={
                             <ExpensePreview />
                           }
                         />
            {/* <Route
              path="/reports"
              element={
                <Layout>
                  <Reports />
                </Layout>
              }
            /> */}
             <Route
              path="/reports/sales-purchases-report"
              element={
                <Layout>
                  <SalesPurchasesReport/>
                </Layout>
              }
            />
                 <Route
              path="/reports/balance-sheet"
              element={
                <Layout>
                  <BalanceSheet/>
                </Layout>
              }
            />
              <Route
              path="/day-wise-report/:date"
              element={
                
                  <DayWiseReport/>
              
              }
            />
        
              <Route
             path="/date-range-report/:fromDate/:toDate" 
            element={<DateRangeReport/>} 
            />

              <Route
              path="/financial-year/add"
              element={
                <Layout>
                  <FinancialYear/>
                </Layout>
              }
            />

            <Route path="/party/payables" element={
              <Layout>
              <PartyPayablesLeft/>
              </Layout>
              } 
              />
            <Route path="/party/receivables" element={
              <Layout>
              <PartyReceivablesLeft/>
              </Layout> 
              } 
              />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>

              <ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  draggable
  theme="colored"
/>
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterWrapper />
    </BrowserRouter>
  );
}
// ✅ PublicRoute – Prevent logged-in users from seeing /login
// function PublicRoute() {
//   const [isAuthenticated, setIsAuthenticated] = useState(null);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const res = await axios.get('/api/user/getUser', { withCredentials: true });
//         setIsAuthenticated(res.data.authenticated);
//       } catch {
//         setIsAuthenticated(false);
//       }
//     };
//     checkAuth();
//   }, []);

//   if (isAuthenticated === null) return <div>Loading...</div>;
//   return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
// }
// return(
//   <BrowserRouter>
// <Header/>
//   <Routes>
//     <Route
//             path="/login"
//             element={
           
//                 <Login />
            
              
//             }
//           />
//     <Route path="/" element={
//       <Layout>
//       <Dashboard/>
//       </Layout>
//       } />
//     {/* <Route path="/items/add" element={<Items/>} /> */}

//      <Route
//           path="/items/add-category"
//           element={
//             <Layout>
//               <AddCategory />
//             </Layout>
//           }
//         />
//       <Route 
       
//           path="/items/add"
//           element={
//             <Layout>
//               <Items />
//             </Layout>
//           }
//         />
//       <Route 
//       path="/items/all-items"
//        element={
//         <Layout>
//         <AllItemsList/>
//         </Layout>
//         } 
//         />
   

    
//        <Route path="/party/add" element={
//         <Layout>
//         <PartyAdd/>
//         </Layout>
//         } />
//         <Route path="/party/all-parties" element={
//           <Layout>
//           <AllPartiesList/>
//           </Layout>
//           } />
//            <Route path="/sale/invoice" element={
//           <Layout>
//           <Invoice/>
//           </Layout>
//           } />
          
//             <Route path="/sale/add" element={
     
//       <SaleAdd/>
    
//       } />
//           <Route path="/sale/all-sales" element={
//           <Layout>
//           <AllSaleList/>
//           </Layout>
//           } />

//         <Route path="/purchase/add" element={
//           // <Layout>
//           <PurchaseAdd/>
//           // </Layout>
//           } />
//             <Route path="/purchase/view/:id" element={
//           // <Layout>
//           <PurchaseView/>
//           // </Layout>
//           } />
//               <Route path="/purchase/all-purchases" element={
//           <Layout>
//           <AllPurchasesList/>
//           </Layout>
//           } />
//   </Routes>
 
//       <ToastContainer position="top-right" autoClose={3000} />
// </BrowserRouter>
// )