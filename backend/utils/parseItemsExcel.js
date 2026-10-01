import XLSX from "xlsx";

const normalize = (value) =>
  String(value ?? "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const COLUMNS = [
  {
    header: "Item name*",
    field: "Item_Name",
  },
  {
    header: "Item code",
    field: "Item_Code",
  },
  {
    header: "Category",
    field: "Item_Category",
  },
  {
    header: "HSN",
    field: "Item_HSN",
  },
  {
    header: "Default MRP",
    field: "MRP",
  },
  {
    header: "Sale price",
    field: "Sale_Price",
  },
  {
    header: "Purchase price",
    field: "Purchase_Price",
  },
  {
    header: "Discount Type",
    field: "Discount_Type_On_Sale_Price",
  },
  {
    header: "Sale Discount",
    field: "Discount_On_Sale_Price",
  },
  {
    header: "Opening stock quantity",
    field: "Opening_Quantity",
  },
  {
    header: "Minimum stock quantity",
    field: "Min_Stock",
  },
  {
    header: "Item Location",
    field: "Location",
  },
  {
    header: "Base Unit (x)",
    field: "Primary_Unit",
  },
  {
    header: "Secondary Unit (y)",
    field: "Secondary_Unit",
  },
  {
    header: "Conversion Rate (n) (x = ny)",
    field: "Conversion_Rate",
  },
];

const parseItemsExcel = (filePath) => {
 if (!filePath) {
    throw new Error("Excel file path is missing.");
  }
 const workbook = XLSX.readFile(filePath, {
  cellDates: false,
});

  if (!workbook.SheetNames.length) {
    throw new Error("Excel file does not contain any sheet.");
  }

  // Prefer Item Details sheet
  const sheetName =
    workbook.SheetNames.find(
      (name) => normalize(name) === normalize("Item Details")
    ) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error("Could not read the Excel sheet.");
  }

 const sheetData = XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  defval: "",
  blankrows: false,
});

console.log("SHEET DATA FIRST 10 ROWS:");
console.log(sheetData.slice(0, 10));

if (!sheetData.length) {
  throw new Error("Excel sheet is empty.");
}

  // =========================================================
  // FIND HEADER ROW
  // =========================================================

  let headerIndex = -1;

  for (let i = 0; i < sheetData.length; i++) {
    const row = sheetData[i];

    const hasItemName = row.some(
      (cell) => normalize(cell) === normalize("Item name*")
    );

    if (hasItemName) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(
      'Could not find the header row. Make sure the sheet contains "Item name*".'
    );
  }

  const headers = sheetData[headerIndex];

  // =========================================================
  // MAP EXCEL HEADER -> COLUMN INDEX
  // =========================================================

  const columnIndexes = {};

  for (const column of COLUMNS) {
    const index = headers.findIndex(
      (header) => normalize(header) === normalize(column.header)
    );

    if (index !== -1) {
      columnIndexes[column.field] = index;
    }
  }

  // Item name is mandatory
  if (columnIndexes.Item_Name === undefined) {
    throw new Error('Required column "Item name*" is missing.');
  }

  // =========================================================
  // PARSE DATA ROWS
  // =========================================================

  const rows = [];

  for (let i = headerIndex + 1; i < sheetData.length; i++) {
    const excelRow = sheetData[i];

    if (!excelRow || excelRow.length === 0) {
      continue;
    }

    // Convert row to strings first
    const firstValue = String(excelRow[0] ?? "").trim();

    // Ignore completely empty rows
    const hasAnyValue = excelRow.some(
      (value) => String(value ?? "").trim() !== ""
    );

    if (!hasAnyValue) {
      continue;
    }

    // Ignore note rows such as:
    // ** Please do not modify...
    if (firstValue.startsWith("**")) {
      continue;
    }

    const raw = {};

    for (const column of COLUMNS) {
      const index = columnIndexes[column.field];

      if (index === undefined) {
        raw[column.field] = "";
        continue;
      }

      raw[column.field] = excelRow[index] ?? "";
    }

    rows.push({
      rowNo: i + 1,
      raw,
    });
  }

  return rows;
};

export default parseItemsExcel;