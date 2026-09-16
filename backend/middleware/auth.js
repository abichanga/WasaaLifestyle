const jwt = require("jsonwebtoken");

//checks that a valid login token is present, and attaches the user's info to the request.
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   //now routes know who is calling (userId, role)
    next();               //let the request continue
  } catch (err) {
    res.status(401).json({ message: "Not authorized, invalid ctoken" });
  }
}

//restricts a route to a specific role (e.g. only households, or only providers).
function restrictTo(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: wrong role" });
    }
    next();
  };
}

module.exports = { protect, restrictTo };