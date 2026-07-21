const jwt = require('jsonwebtoken');
const User = require('../model/User');

/**
 * Helper function to generate a JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * Registers a new user
 */
const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error('Please provide all fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  };
};

/**
 * Authenticates a user and generates token
 */
const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  };
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};
