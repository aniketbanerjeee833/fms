

// const errorHandler = (err, req, res, next) => {
//   console.error("🔥 Global Error:", err);
//   res.status(err.status || 500).json({
//     message: err.message || "Internal server error",
//   });
// };


// export default errorHandler;
// middleware/errorHandler.js
const isProduction=false
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Global Error:", err);

  // Default error response
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  // 🧩 Handle MySQL-specific errors
  if (err.code) {
    switch (err.code) {
      case "ER_DUP_ENTRY":
        statusCode = 409;
        message = "Duplicate entry detected. Please use unique values.";
        break;
      case "ER_BAD_FIELD_ERROR":
        statusCode = 400;
        message = "Invalid field in database query.";
        break;
      case "ER_PARSE_ERROR":
        statusCode = 500;
        message = "Database query parse error.";
        break;
      case "PROTOCOL_CONNECTION_LOST":
        statusCode = 503;
        message = "Database connection lost. Please retry.";
        break;
      case "ECONNREFUSED":
        statusCode = 503;
        message = "Database connection refused.";
        break;
        case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
  statusCode = 400;
  message = "Invalid date or value provided for a field.";
  break;
      default:
        message = `Database Error: ${err.code}`;
        break;
    }
  }

  // 🧩 Handle Zod validation errors
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(", ");
  }

  // 🧩 Handle custom app errors
  if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized access.";
  }

  // 🧩 Handle JWT or session-related errors
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please log in again.";
  }

  // 🧩 Handle unknown errors gracefully
  if (statusCode === 500) {
    console.error("Stack Trace:", err.stack);
  }
if (!statusCode || statusCode < 400 || statusCode >= 600) {
  statusCode = 500;
}
  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && { stack: err.stack }),
  });
};

export default errorHandler;
