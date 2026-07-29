const authService = require('../services/AuthService');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialty } = req.body;
  const user = await authService.register({ name, email, password, role, specialty });
  res.status(201).json({ success: true, data: user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.status(200).json({ success: true, data: result });
});
