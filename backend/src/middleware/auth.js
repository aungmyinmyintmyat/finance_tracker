const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Look for the token in the "Authorization" header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID to the request object
    next(); // Move to the next function (the actual route logic)
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};