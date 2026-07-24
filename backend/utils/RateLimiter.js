// import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// const _15Mins = 15 * 60 * 1000;
// const _10Mins = 10 * 60 * 1000;
// const _1Mins= 1 * 60 * 1000;

// export const RateLimiter = ({
//   windowTimeInMs = _15Mins, // default: 15 min
//   limit = 250, // default: 250 requests
//   message = "Too many requests. Please try again later.",
//   keyGenerator = (req, res) => ipKeyGenerator(req.ip, 56), // default: IP-based with IPv6 support
// } = {}) => {
//   return rateLimit({
//     windowMs: windowTimeInMs,
//     max: limit,
//     message,
//     keyGenerator,
//   });
// };

// // Factory to generate independent limiter instances
// const makeLimiter = (
//   limit,
//   windowMs,
//   useUserId = false,
//   useIp = true,
//   message = "Too many attempts, try again later."
// ) => {
//   return RateLimiter({
//     keyGenerator: (req, res) => {
//       if (useUserId && req.user?._id) return req.user._id.toString();
//       if (useIp) return ipKeyGenerator(req.ip, 56);
//     },
//     limit,
//     windowTimeInMs: windowMs,
//     message,
//   });
// };

// const rateLimiterConfig = {
//     // Auth Routes Limiters
   

//     loginLimiter: [3, _1Mins, false, true, "Too many login attempts. Please wait 10 minutes before retrying."],
// }
// export const limiter = Object.fromEntries(
//   Object.entries(rateLimiterConfig).map(([key, value]) => [
//     key,
//     makeLimiter(...value),
//   ])
// );

// rateLimiter.js
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const _15Mins = 15 * 60 * 1000;
const _10Mins = 10 * 60 * 1000;
const _1Min = 1 * 60 * 1000;

// ✅ Universal JSON-safe handler
const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

// ✅ General factory
export const RateLimiter = ({
  windowTimeInMs = _15Mins,
  limit = 250,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req, res) => ipKeyGenerator(req.ip, 56),
} = {}) => {
  return rateLimit({
    windowMs: windowTimeInMs,
    max: limit,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message,
      }),
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// ✅ Shortcut to create custom instances
const makeLimiter = (
  limit,
  windowMs,
  useUserId = false,
  useIp = true,
  message = "Too many attempts, try again later."
) =>
  RateLimiter({
    keyGenerator: (req) => {
      if (useUserId && req.user?._id) return req.user._id.toString();
      if (useIp) return ipKeyGenerator(req.ip, 56);
    },
    limit,
    windowTimeInMs: windowMs,
    message,
  });

// ✅ Your specific configuration
const rateLimiterConfig = {
  loginLimiter: [
    3,
    _1Min,
    false,
    true,
    "Too many login attempts. Please wait 1 minute before retrying.",
  ],
};

export const limiter = Object.fromEntries(
  Object.entries(rateLimiterConfig).map(([key, value]) => [
    key,
    makeLimiter(...value),
  ])
);
