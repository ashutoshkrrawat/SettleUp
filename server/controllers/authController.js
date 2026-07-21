const authService = require('../services/authService');

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userData = await authService.registerUser({ name, email, password });
    res.status(201).json(userData);
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = error.message.includes('already exists') || error.message.includes('provide all') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser({ email, password });
    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    const statusCode = error.message.includes('Invalid credentials') ? 401 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
