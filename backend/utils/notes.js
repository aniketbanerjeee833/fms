// only amount >0 needs to have an item name for purchase sale everywhre

// Because Amount is the one field that represents actual money at stake — it's the number that flows into Total_Amount, gets summed with other items, and determines what the user owes/paid. Every other field (Category, HSN, Unit, Discount%, Quantity, Price) is just an input that feeds into computing Amount — none of them independently represent value on their own.

// Concretely, walk through both examples
// Case A — stray discount, no name:

// json
// { "Item_Name": "", "Discount_On_Purchase_Price": "10", "Quantity": "", "Purchase_Price": "", "Amount": "0.00" }
// There's no Quantity and no Purchase_Price, so even though "10%" is sitting in the discount field, there's nothing to discount from. The computed Amount is 0. If you deleted this row entirely, the purchase's Total_Amount doesn't change by even one paisa. Nothing of financial consequence would be lost by dropping it — the "10" was just incidental leftover typing in a field that never got to matter.

// Case B — real quantity and price, no name:

// json
// { "Item_Name": "", "Quantity": "10", "Purchase_Price": "5", "Amount": "50.00" (or should be) }
// Here Quantity × Price = 50. If this got silently dropped, Total_Amount on the saved bill would be ₹50 less than what the user visually saw and expected when they filled it in. That's real financial data disappearing without any warning — the user would look at their saved bill later and the numbers wouldn't add up, with no explanation why.

// The general principle
// Any field that's just an ingredient (category, HSN, unit, discount%, even quantity/price individually) doesn't matter on its own — what matters is whether those ingredients ever combined into a nonzero Amount. Amount is the single downstream number that:

// gets summed into Total_Amount
// is what the split/payment amount has to reconcile against
// is the actual thing the user is trying to record when they fill out a purchase line
// So checking Amount > 0 (rather than "is any field non-blank") is checking exactly the right thing: did this row ever produce real value that the user would notice missing? If yes and there's no name to attach it to, that's an error worth surfacing. If no (Amount stayed 0 regardless of what stray text is elsewhere in the row), it's safe to treat as a non-row and drop silently — exactly like Vyapar does, since a ₹0 line item is indistinguishable from "nothing was really entered here."




//PUCHASE

// The rule is now:

// Always keep every positive payment. In addition, keep the first valid payment method even when its amount is blank/₹0. All other blank/₹0 rows are dropped.

// | Test | Enter in UI                          | `payment_splits` expected   | Ledger expected                               |
// | ---- | ------------------------------------ | --------------------------- | --------------------------------------------- |
// | 1    | HDFC blank → ANCO blank → Cash blank | HDFC ₹0 only                | HDFC ₹0 in `bank_transactions`                |
// | 2    | Cash blank → HDFC blank → ANCO blank | Cash ₹0 only                | **No** cash/bank row                          |
// | 3    | HDFC blank → ANCO ₹5 → Cash ₹10      | HDFC ₹0, ANCO ₹5, Cash ₹10  | HDFC ₹0 + ANCO ₹5 in bank; Cash ₹10 in cash   |
// | 4    | HDFC ₹5 → ANCO blank → Cash ₹10      | HDFC ₹5, Cash ₹10           | HDFC ₹5 in bank; Cash ₹10 in cash             |
// | 5    | HDFC blank → ANCO blank → Cash ₹10   | HDFC ₹0, Cash ₹10           | HDFC ₹0 in bank; Cash ₹10 in cash             |
// | 6    | Cash ₹10 → HDFC blank → ANCO ₹5      | Cash ₹10, ANCO ₹5           | Cash ₹10 in cash; ANCO ₹5 in bank             |
// | 7    | HDFC blank → Cheque ₹6 → Cash ₹4     | HDFC ₹0, Cheque ₹6, Cash ₹4 | HDFC ₹0 bank + Cash ₹4 cash; no Cheque ledger |


//SALE payment type pens only price is there
// No meaningful sale amount
// → payment controls unavailable
// → splits []
// → no bank/cash ledger

// Sale amount exists
// → enable payment controls
// → Cash/Bank/etc.
// → actual payment ledger entries
