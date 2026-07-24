const adminAuth = (req, res, next) => {
 
  if (req.user.role !== "admin") {
 
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  // Attach adminId for convenience
  req.adminId = req.user.id;
  console.log("Admin authenticated:", req.user.username);

  next();
};
    export default adminAuth;