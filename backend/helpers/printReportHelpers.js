export const getPurchasesForPrint = async (
  connection,
  whereClause = "",
  params = []
) => {

  const [purchases] = await connection.query(
    `
    SELECT
      p.id,
      p.Purchase_Id,
      p.Bill_Number,
      p.Bill_Date,
      p.Total_Amount,
      p.Total_Paid,
      p.Balance_Due,
      p.Party_Id,

      p.Terms_Conditions_Id,
      p.Terms_Conditions_Description,

      party.Party_Name,
      party.GSTIN,

      tc.Title AS Terms_Conditions_Title

    FROM add_purchase p

    LEFT JOIN add_party party
      ON party.Party_Id = p.Party_Id

    LEFT JOIN terms_conditions tc
      ON tc.id = p.Terms_Conditions_Id

    ${whereClause}

    ORDER BY p.Bill_Date ASC
    `,
    params
  );

  if (!purchases.length) {
    return [];
  }

  const purchaseIds = purchases.map(
    (p) => p.Purchase_Id
  );

  const numericIds = purchases.map(
    (p) => p.id
  );

  const purchasePlaceholders =
    purchaseIds.map(() => "?").join(",");

  const idPlaceholders =
    numericIds.map(() => "?").join(",");

  // ITEMS

  const [items] = await connection.query(
    `
    SELECT
      pi.*,

      i.Item_Name,
      i.Item_HSN,
      i.Item_Unit,
      i.Item_Category,

      i.Primary_Unit,
      i.Secondary_Unit,
      i.Conversion_Rate

    FROM add_purchase_items pi

    LEFT JOIN add_item i
      ON i.Item_Id = pi.Item_Id

    WHERE pi.Purchase_Id IN (${purchasePlaceholders})

    ORDER BY pi.created_at ASC
    `,
    purchaseIds
  );

  // SPLITS

  const [splits] = await connection.query(
    `
    SELECT
      ps.*,
      ba.Account_Display_Name

    FROM payment_splits ps

    LEFT JOIN bank_accounts ba
      ON ba.id = ps.Bank_Account_Id

    WHERE ps.Source_Type='Purchase'
    AND ps.Source_Id IN (${idPlaceholders})

    ORDER BY ps.id ASC
    `,
    numericIds
  );

  const itemMap = {};

  items.forEach((item) => {
    if (!itemMap[item.Purchase_Id]) {
      itemMap[item.Purchase_Id] = [];
    }

    const price = Number(
      item.Purchase_Price || 0
    );

    let discountAmount = 0;

    if (
      Number(
        item.Discount_On_Purchase_Price || 0
      ) > 0
    ) {
      if (
        item.Discount_Type_On_Purchase_Price ===
        "Percentage"
      ) {
        discountAmount =
          (price *
            Number(
              item.Discount_On_Purchase_Price
            )) /
          100;
      } else {
        discountAmount = Number(
          item.Discount_On_Purchase_Price
        );
      }
    }

    itemMap[item.Purchase_Id].push({
      ...item,
      Discount_Amount: Number(
        discountAmount.toFixed(2)
      ),
    });
  });

  const splitMap = {};

  splits.forEach((split) => {
    if (!splitMap[split.Source_Id]) {
      splitMap[split.Source_Id] = [];
    }

    splitMap[split.Source_Id].push({
      Id: split.id,
      Payment_Type: split.Payment_Type,
      Bank_Account_Id:
        split.Bank_Account_Id,
      Account_Display_Name:
        split.Account_Display_Name,
      Amount: split.Amount,
    });
  });

 const purchaseBills = purchases.map((purchase) => ({
  billPurchaseDetails: {
    Purchase_Id: purchase.Purchase_Id,
    Party_Name: purchase.Party_Name,
    GSTIN: purchase.GSTIN,

    Bill_Number: purchase.Bill_Number,
    Bill_Date: purchase.Bill_Date,

    Total_Amount: purchase.Total_Amount,
    Total_Paid: purchase.Total_Paid,
    Balance_Due: purchase.Balance_Due,

    Terms_Conditions_Id:
      purchase.Terms_Conditions_Id,

    Terms_Conditions_Description:
      purchase.Terms_Conditions_Description,

    Terms_Conditions_Title:
      purchase.Terms_Conditions_Title,
  },

  splits:
    splitMap[purchase.id] || [],

  items:
    itemMap[purchase.Purchase_Id] || [],
}));
const summary = {
  totalAmount: 0,
  totalPaid: 0,
  totalBalanceDue: 0,
  totalDiscount: 0,
};

purchaseBills.forEach((bill) => {
  summary.totalAmount += Number(
    bill.billPurchaseDetails.Total_Amount || 0
  );

  summary.totalPaid += Number(
    bill.billPurchaseDetails.Total_Paid || 0
  );

  summary.totalBalanceDue += Number(
    bill.billPurchaseDetails.Balance_Due || 0
  );

  bill.items.forEach((item) => {
    summary.totalDiscount += Number(
      item.Discount_Amount || 0
    );
  });
});
return {
  purchaseBills,
  summary,
};
}

// helpers/salesPrintHelper.js

export const getSalesForPrint = async (
  connection,
  whereClause,
  params
) => {

  // paste everything from
  // getSalesPrintReport
  // starting from

  const [sales] = await connection.query(
      `
      SELECT
        s.id,
        s.Sale_Id,
        s.Phone_Number,
        s.Billing_Name,
        s.Billing_Address,
        s.Invoice_Number,
        s.Invoice_Date,
        s.State_Of_Supply,
        s.Total_Amount,
        s.Total_Received,
        s.Balance_Due,
        s.Party_Id,

        s.Terms_Conditions_Id,
        s.Terms_Conditions_Description,

        p.Party_Name,
        p.GSTIN,
     

        tc.Title AS Terms_Conditions_Title

      FROM add_sale s

      LEFT JOIN add_party p
        ON s.Party_Id = p.Party_Id

      LEFT JOIN terms_conditions tc
        ON s.Terms_Conditions_Id = tc.id

      ${whereClause}

      ORDER BY s.Invoice_Date ASC
      `,
      params
    );

    
  if (!sales.length) {
    return [];
  }

    const saleIds = sales.map((s) => s.Sale_Id);
    const numericIds = sales.map((s) => s.id);

    const salePlaceholders =
      saleIds.map(() => "?").join(",");

    const idPlaceholders =
      numericIds.map(() => "?").join(",");

    // ====================================
    // ITEMS
    // ====================================

    const [items] = await connection.query(
      `
      SELECT
        si.*,

        i.Item_Name,
        i.Item_HSN,
        i.Item_Unit,
        i.Item_Category,

        i.Primary_Unit,
        i.Secondary_Unit,
        i.Conversion_Rate

      FROM add_sale_items si

      LEFT JOIN add_item i
        ON si.Item_Id = i.Item_Id

      WHERE si.Sale_Id IN (${salePlaceholders})

      ORDER BY si.created_at ASC
      `,
      saleIds
    );

    // ====================================
    // PAYMENT SPLITS
    // Source_Id = add_sale.id
    // ====================================

    const [splits] = await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type = 'Sale'
      AND ps.Source_Id IN (${idPlaceholders})

      ORDER BY ps.id ASC
      `,
      numericIds
    );

    // ====================================
    // GROUP ITEMS
    // ====================================

    const itemMap = {};

    // items.forEach((item) => {
    //   if (!itemMap[item.Sale_Id]) {
    //     itemMap[item.Sale_Id] = [];
    //   }

    //   itemMap[item.Sale_Id].push(item);
    // });
    items.forEach((item) => {
      const price = Number(item.Sale_Price || item.Purchase_Price || 0);

      let discountAmount = 0;

      if (
        Number(item.Discount_On_Sale_Price || 0) > 0
      ) {
        if (
          item.Discount_Type_On_Sale_Price === "Percentage"
        ) {
          discountAmount =
            (price *
              Number(item.Discount_On_Sale_Price)) /
            100;
        } else {
          discountAmount = Number(
            item.Discount_On_Sale_Price
          );
        }
      }

      item.Discount_Amount = Number(
        discountAmount.toFixed(2)
      );

      if (!itemMap[item.Sale_Id]) {
        itemMap[item.Sale_Id] = [];
      }

      itemMap[item.Sale_Id].push(item);
    });

    // ====================================
    // GROUP SPLITS
    // keyed by numeric sale id
    // ====================================

    const splitMap = {};

    splits.forEach((split) => {
      if (!splitMap[split.Source_Id]) {
        splitMap[split.Source_Id] = [];
      }

      splitMap[split.Source_Id].push({
        Id: split.id,
        Payment_Type: split.Payment_Type,
        Bank_Account_Id:
          split.Bank_Account_Id,
        Account_Display_Name:
          split.Account_Display_Name,
        Reference_Number:
          split.Reference_Number,
        Amount: split.Amount,
      });
    });

    // ====================================
    // FINAL REPORT
   
    // ====================================

    const invoices = sales.map((sale) => {
      const saleSplits =
        splitMap[sale.id] || [];

      const splitLabels =
        saleSplits.map((s) =>
          s.Payment_Type === "Bank"
            ? s.Account_Display_Name
            : s.Payment_Type
        );

      const counts = {};

      splitLabels.forEach((label) => {
        counts[label] =
          (counts[label] || 0) + 1;
      });

      const Payment_Type_Display =
        Object.entries(counts)
          .map(([label, count]) =>
            count > 1
              ? `${label} (x${count})`
              : label
          )
          .join(" + ");

      return {
        invoicePartyDetails: {
          Sale_Id: sale.Sale_Id,
          Party_Name: sale.Party_Name,
          Billing_Name: sale.Billing_Name,
          Phone_Number: sale.Phone_Number,
          Billing_Address:
            sale.Billing_Address,
          GSTIN: sale.GSTIN,
          State_Of_Supply:
            sale.State_Of_Supply,
          State: sale.State,

          Invoice_Number:
            sale.Invoice_Number,
          Invoice_Date:
            sale.Invoice_Date,

          Total_Amount:
            sale.Total_Amount,
          Total_Received:
            sale.Total_Received,
          Balance_Due:
            sale.Balance_Due,

          Terms_Conditions_Id:
            sale.Terms_Conditions_Id,

          Terms_Conditions_Description:
            sale.Terms_Conditions_Description,

          Terms_Conditions_Title:
            sale.Terms_Conditions_Title,

          Payment_Type_Display,
        },

        splits: saleSplits,

        items:
          itemMap[sale.Sale_Id] || [],
      };
    });
    
const summary = {
  totalAmount: invoices.reduce(
    (sum, inv) =>
      sum +
      Number(
        inv.invoicePartyDetails.Total_Amount || 0
      ),
    0
  ),

  totalReceived: invoices.reduce(
    (sum, inv) =>
      sum +
      Number(
        inv.invoicePartyDetails.Total_Received || 0
      ),
    0
  ),

  totalBalanceDue: invoices.reduce(
    (sum, inv) =>
      sum +
      Number(
        inv.invoicePartyDetails.Balance_Due || 0
      ),
    0
  ),
};
   


  
return {
  invoices,
  summary,
};
};

export const getPurchaseReturnsForPrint = async (
  connection,
  whereClause,
  params
) => {
   const [returns] = await connection.query(
      `
      SELECT
        pr.id,
        pr.Return_Number,
        pr.Bill_Number,
        pr.Bill_Date,
        pr.Return_Date,
        pr.State_Of_Supply,
        pr.Total_Amount,
        pr.Total_Received,
        pr.Balance_Due,
        pr.Party_Id,

        p.Party_Name,
        p.GSTIN
       

      FROM purchase_return pr

      LEFT JOIN add_party p
        ON p.Party_Id = pr.Party_Id

      ${whereClause}

      ORDER BY pr.Return_Date ASC
      `,
      params
    );

    if (!returns.length) {
  return {
    purchaseReturns: [],
    summary: {
      totalAmount: 0,
      totalReceived: 0,
      totalDue: 0,
      totalDiscount: 0,
    },
  };
}

    const returnIds = returns.map(
      (r) => r.id
    );

    const placeholders =
      returnIds.map(() => "?").join(",");

    // ============================
    // ITEMS
    // ============================

    const [items] = await connection.query(
      `
      SELECT
        pri.*,

        i.Item_Name,
        i.Item_HSN,
        i.Item_Unit,
        i.Item_Category,

        i.Primary_Unit,
        i.Secondary_Unit,
        i.Conversion_Rate

      FROM purchase_return_items pri

      LEFT JOIN add_item i
        ON i.Item_Id = pri.Item_Id

      WHERE pri.Purchase_Return_Id IN (${placeholders})

      ORDER BY pri.created_at ASC
      `,
      returnIds
    );

    // ============================
    // SPLITS
    // ============================

    const [splits] = await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type = 'Purchase_Return'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
      returnIds
    );

    const itemMap = {};
    const splitMap = {};

    items.forEach((item) => {
      if (
        !itemMap[item.Purchase_Return_Id]
      ) {
        itemMap[item.Purchase_Return_Id] = [];
      }

      const price = Number(
        item.Purchase_Price || 0
      );

      let discountAmount = 0;

      if (
        Number(
          item.Discount_On_Purchase_Price ||
            0
        ) > 0
      ) {
        if (
          item.Discount_Type_On_Purchase_Price ===
          "Percentage"
        ) {
          discountAmount =
            (price *
              Number(
                item.Discount_On_Purchase_Price
              )) /
            100;
        } else {
          discountAmount = Number(
            item.Discount_On_Purchase_Price
          );
        }
      }

      itemMap[
        item.Purchase_Return_Id
      ].push({
        ...item,
        Discount_Amount: Number(
          discountAmount.toFixed(2)
        ),
      });
    });

    splits.forEach((split) => {
      if (!splitMap[split.Source_Id]) {
        splitMap[split.Source_Id] = [];
      }

      splitMap[split.Source_Id].push({
        Id: split.id,
        Payment_Type: split.Payment_Type,
        Bank_Account_Id:
          split.Bank_Account_Id,
        Account_Display_Name:
          split.Account_Display_Name,
        Amount: split.Amount,
      });
    });

    // ============================
    // SUMMARY
    // ============================

    const summary = {
      totalAmount: 0,
      totalReceived: 0,
      totalDue: 0,
      totalDiscount: 0,
    };

    const purchaseReturns = returns.map(
      (row) => {
        const returnItems =
          itemMap[row.id] || [];

        summary.totalAmount += Number(
          row.Total_Amount || 0
        );

        summary.totalReceived += Number(
          row.Total_Received || 0
        );

        summary.totalDue += Number(
          row.Balance_Due || 0
        );

        returnItems.forEach((item) => {
          summary.totalDiscount += Number(
            item.Discount_Amount || 0
          );
        });

        return {
          purchaseReturnDetails: {
            Purchase_Return_Id:
              row.id,

            Party_Name:
              row.Party_Name,

            GSTIN: row.GSTIN,

            Return_Number:
              row.Return_Number,

            Bill_Number:
              row.Bill_Number,

            Bill_Date:
              row.Bill_Date,

            Return_Date:
              row.Return_Date,

            State_Of_Supply:
              row.State_Of_Supply,

            Total_Amount:
              row.Total_Amount,

            Total_Received:
              row.Total_Received,

            Balance_Due:
              row.Balance_Due,
          },

          splits:
            splitMap[row.id] || [],

          items: returnItems,
        };
        
      }
    );
    return {
  purchaseReturns,

  summary: {
    totalAmount: Number(
      summary.totalAmount.toFixed(2)
    ),

    totalReceived: Number(
      summary.totalReceived.toFixed(2)
    ),

    totalDue: Number(
      summary.totalDue.toFixed(2)
    ),

    totalDiscount: Number(
      summary.totalDiscount.toFixed(2)
    ),
  },
};
  }

  export const getSaleReturnsForPrint = async (
  connection,
  whereClause,
  params
) => {
  const [returns] = await connection.query(
      `
      SELECT
        sr.id,
        sr.Return_Number,
        sr.Invoice_Number,
        sr.Invoice_Date,
        sr.Return_Date,
        sr.State_Of_Supply,
        sr.Total_Amount,
        sr.Total_Paid,
        sr.Balance_Due,
        sr.Party_Id,

        p.Party_Name,
        p.GSTIN
        

      FROM sale_return sr

      LEFT JOIN add_party p
        ON p.Party_Id = sr.Party_Id

      ${whereClause}

      ORDER BY sr.Return_Date ASC
      `,
      params
    );
if (!returns.length) {
  return {
    saleReturns: [],
    summary: {
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      totalDiscount: 0,
    },
  };
}

    const returnIds = returns.map(
      (r) => r.id
    );

    const placeholders =
      returnIds.map(() => "?").join(",");

    // =====================================
    // ITEMS
    // =====================================

    const [items] = await connection.query(
      `
      SELECT
        sri.*,

        i.Item_Name,
        i.Item_HSN,
        i.Item_Unit,
        i.Item_Category,

        i.Primary_Unit,
        i.Secondary_Unit,
        i.Conversion_Rate

      FROM sale_return_items sri

      LEFT JOIN add_item i
        ON i.Item_Id = sri.Item_Id

      WHERE sri.Sale_Return_Id IN (${placeholders})

      ORDER BY sri.created_at ASC
      `,
      returnIds
    );

    // =====================================
    // PAYMENT SPLITS
    // =====================================

    const [splits] = await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type = 'Sale_Return'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
      returnIds
    );

    const itemMap = {};
    const splitMap = {};

    items.forEach((item) => {
      if (!itemMap[item.Sale_Return_Id]) {
        itemMap[item.Sale_Return_Id] = [];
      }

      const price = Number(
        item.Sale_Price || 0
      );

      let discountAmount = 0;

      if (
        Number(item.Discount_On_Sale_Price || 0) > 0
      ) {
        if (
          item.Discount_Type_On_Sale_Price ===
          "Percentage"
        ) {
          discountAmount =
            (price *
              Number(
                item.Discount_On_Sale_Price
              )) /
            100;
        } else {
          discountAmount = Number(
            item.Discount_On_Sale_Price
          );
        }
      }

      itemMap[item.Sale_Return_Id].push({
        ...item,
        Discount_Amount: Number(
          discountAmount.toFixed(2)
        ),
      });
    });

    splits.forEach((split) => {
      if (!splitMap[split.Source_Id]) {
        splitMap[split.Source_Id] = [];
      }

      splitMap[split.Source_Id].push({
        Id: split.id,
        Payment_Type: split.Payment_Type,
        Bank_Account_Id:
          split.Bank_Account_Id,
        Account_Display_Name:
          split.Account_Display_Name,
        Amount: split.Amount,
      });
    });

    // =====================================
    // SUMMARY
    // =====================================

    const summary = {
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      totalDiscount: 0,
    };

    const saleReturns = returns.map((row) => {
      const returnItems =
        itemMap[row.id] || [];

      summary.totalAmount += Number(
        row.Total_Amount || 0
      );

      summary.totalPaid += Number(
        row.Total_Paid || 0
      );

      summary.totalDue += Number(
        row.Balance_Due || 0
      );

      returnItems.forEach((item) => {
        summary.totalDiscount += Number(
          item.Discount_Amount || 0
        );
      });

      return {
        saleReturnDetails: {
          Sale_Return_Id: row.id,

          Party_Name: row.Party_Name,
          GSTIN: row.GSTIN,

          Return_Number: row.Return_Number,
          Invoice_Number: row.Invoice_Number,
          Invoice_Date: row.Invoice_Date,
          Return_Date: row.Return_Date,

          State_Of_Supply:
            row.State_Of_Supply,

          Total_Amount:
            row.Total_Amount,

          Total_Paid:
            row.Total_Paid,

          Balance_Due:
            row.Balance_Due,
        },

        splits:
          splitMap[row.id] || [],

        items: returnItems,
      };
    });

    summary.totalAmount = Number(
      summary.totalAmount.toFixed(2)
    );

    summary.totalPaid = Number(
      summary.totalPaid.toFixed(2)
    );

    summary.totalDue = Number(
      summary.totalDue.toFixed(2)
    );

    summary.totalDiscount = Number(
      summary.totalDiscount.toFixed(2)
    );

   return {
  saleReturns,
  summary,
};
  }
  export const getPaymentInsForPrint = async (
  connection,
  whereClause,
  params
) => {

  const [payments] =
    await connection.query(
      `
      SELECT
        pi.*,

        a.Party_Name,
        a.GSTIN

      FROM payment_in pi

      LEFT JOIN add_party a
        ON a.Party_Id = pi.Party_Id

      LEFT JOIN add_party_addresses pa
        ON pa.Party_Id = pi.Party_Id
       AND pa.Address_Type='Billing'
       AND pa.Is_Default=1

      ${whereClause}

      ORDER BY pi.Payment_Date ASC
      `,
      params
    );

  if (!payments.length) {
    return {
      paymentIns: [],
      summary: {
        totalReceived: 0,
      },
    };
  }

  const paymentIds = payments.map(
    (p) => p.id
  );

  const placeholders =
    paymentIds.map(() => "?").join(",");

  const [splits] =
    await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type='Payment_In'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
      paymentIds
    );

  const splitMap = {};

  splits.forEach((split) => {
    if (!splitMap[split.Source_Id]) {
      splitMap[split.Source_Id] = [];
    }

    splitMap[split.Source_Id].push({
      Id: split.id,
      Payment_Type:
        split.Payment_Type,
      Bank_Account_Id:
        split.Bank_Account_Id,
      Account_Display_Name:
        split.Account_Display_Name,
      Reference_Number:
        split.Reference_Number,
      Amount: split.Amount,
    });
  });

  const summary = {
    totalReceived: 0,
  };

  const paymentIns = payments.map(
    (payment) => {

      summary.totalReceived += Number(
        payment.Received || 0
      );

      return {
        paymentInDetails: {
          id: payment.id,

          Party_Name:
            payment.Party_Name,

          GSTIN:
            payment.GSTIN,

          Receipt_No:
            payment.Receipt_No,

          Payment_Date:
            payment.Payment_Date,

          Received:
            payment.Received,
        },

        splits:
          splitMap[payment.id] || [],
      };
    }
  );

  summary.totalReceived = Number(
    summary.totalReceived.toFixed(2)
  );

  return {
    paymentIns,
    summary,
  };
};
export const getPaymentOutsForPrint = async (
  connection,
  whereClause,
  params
) => {

  const [payments] =
    await connection.query(
      `
      SELECT
        po.*,

        a.Party_Name,
        a.GSTIN

      FROM payment_out po

      LEFT JOIN add_party a
        ON a.Party_Id = po.Party_Id

      LEFT JOIN add_party_addresses pa
        ON pa.Party_Id = po.Party_Id
       AND pa.Address_Type = 'Billing'
       AND pa.Is_Default = 1

      ${whereClause}

      ORDER BY po.Payment_Date ASC
      `,
      params
    );

  if (!payments.length) {
    return {
      paymentOuts: [],
      summary: {
        totalPaid: 0,
      },
    };
  }

  const paymentIds = payments.map(
    (p) => p.id
  );

  const placeholders =
    paymentIds.map(() => "?").join(",");

  const [splits] =
    await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type='Payment_Out'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
      paymentIds
    );

  const splitMap = {};

  splits.forEach((split) => {
    if (!splitMap[split.Source_Id]) {
      splitMap[split.Source_Id] = [];
    }

    splitMap[split.Source_Id].push({
      Id: split.id,
      Payment_Type:
        split.Payment_Type,
      Bank_Account_Id:
        split.Bank_Account_Id,
      Account_Display_Name:
        split.Account_Display_Name,
      Reference_Number:
        split.Reference_Number,
      Amount: split.Amount,
    });
  });

  const summary = {
    totalPaid: 0,
  };

  const paymentOuts = payments.map(
    (payment) => {

      summary.totalPaid += Number(
        payment.Paid || 0
      );

      return {
        paymentOutDetails: {
          id: payment.id,

          Party_Name:
            payment.Party_Name,

          GSTIN:
            payment.GSTIN,

          Receipt_No:payment.Receipt_No, // use Receipt_No if that's your actual column

          Payment_Date:
            payment.Payment_Date,

          Paid:
            payment.Paid,
        },

        splits:
          splitMap[payment.id] || [],
      };
    }
  );

  summary.totalPaid = Number(
    summary.totalPaid.toFixed(2)
  );

  return {
    paymentOuts,
    summary,
  };
};