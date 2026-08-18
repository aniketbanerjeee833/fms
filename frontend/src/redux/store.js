
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage for web
import userReducer from "./reducer/userReducer";

import { partyApi } from "./api/partyAPi";
import { itemApi } from "./api/itemApi";
import { purchaseApi } from "./api/purchaseApi";
import { saleApi } from "./api/saleApi";
import { dashboardApi } from "./api/dashboardApi";
import { userApi } from "./api/userApi";
import { reportApi } from "./api/reportApi";
import { dailyExpenseApi } from "./api/dailyExpenseApi";
import { settingsApi } from "./api/settingsApi";

import { paymentOutApi } from "./api/paymentOutApi";
import { paymentInApi } from "./api/paymentInApi";
import { purchaseReturnApi } from "./api/purchaseReturnApi";
import { saleReturnApi } from "./api/saleReturnApi";
import { cashInHandApi } from "./api/cashInHandApi";
import { bankAccountApi } from "./api/bankAccountApi";
import { expenseApi } from "./api/expenseApi";
import { termsConditionsApi } from "./api/termsConditionsApi";


// ✅ Combine reducers
const rootReducer = combineReducers({
  
   user: userReducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [partyApi.reducerPath]: partyApi.reducer,
  [itemApi.reducerPath]: itemApi.reducer,
 
  [purchaseApi.reducerPath]: purchaseApi.reducer,
  [purchaseReturnApi.reducerPath]: purchaseReturnApi.reducer,
  [saleReturnApi.reducerPath]: saleReturnApi.reducer,
  [saleApi.reducerPath]: saleApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [dailyExpenseApi.reducerPath]: dailyExpenseApi.reducer,
  [paymentOutApi.reducerPath]:paymentOutApi.reducer,
  [paymentInApi.reducerPath]: paymentInApi.reducer,
  [cashInHandApi.reducerPath]: cashInHandApi.reducer,
  [bankAccountApi.reducerPath]: bankAccountApi.reducer,
  [expenseApi.reducerPath]: expenseApi.reducer,
  [reportApi.reducerPath]: reportApi.reducer,
  [settingsApi.reducerPath]: settingsApi.reducer,
  [termsConditionsApi.reducerPath]: termsConditionsApi.reducer

 
});

// ✅ Persist config (only persist user slice)
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"], // only user slice is persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required by redux-persist
    }).concat(
      dashboardApi.middleware,
      partyApi.middleware,
      saleApi.middleware,
      itemApi.middleware,
      
      purchaseApi.middleware,
      purchaseReturnApi.middleware,
      saleReturnApi.middleware,
      userApi.middleware,
      dailyExpenseApi.middleware,
      paymentOutApi.middleware,
      paymentInApi.middleware,
      cashInHandApi.middleware,
      bankAccountApi.middleware,
      expenseApi.middleware,
      reportApi.middleware,
      settingsApi.middleware,
      termsConditionsApi.middleware
     
    ),
});

export const persistor = persistStore(store);
export default store;
