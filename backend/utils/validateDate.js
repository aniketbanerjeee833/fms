// utils/validateDate.js

export const isValidDate = (d) => d && /^\d{4}-\d{2}-\d{2}$/.test(d);

export const validateDateRange = (fromDate, toDate) => {
  if (fromDate && !isValidDate(fromDate)) {
    return "Invalid fromDate format. Use YYYY-MM-DD";
  }
  if (toDate && !isValidDate(toDate)) {
    return "Invalid toDate format. Use YYYY-MM-DD";
  }
  if (fromDate && toDate && fromDate > toDate) {
    return "fromDate cannot be after toDate";
  }
  return null; // null means valid
};