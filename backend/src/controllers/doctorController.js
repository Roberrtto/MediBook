const userRepository = require('../repositories/UserRepository');
const asyncHandler = require('../utils/asyncHandler');

// FR-02: patients need to see available doctors filtered by specialty
exports.listDoctors = asyncHandler(async (req, res) => {
  const doctors = await userRepository.findAllDoctors();
  res.status(200).json({ success: true, data: doctors });
});
