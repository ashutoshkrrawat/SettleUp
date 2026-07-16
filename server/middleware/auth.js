const jwt = require('jsonwebtoken');
const User = require('../model/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split header "Bearer <token>" to extract the token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token signature using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database using decoded ID, and exclude password field
      req.user = await User.findById(decoded.id).select('-password');

      // Continue to the next controller function
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token was found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
