const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getDoctorSchedule,
  getAllAppointments,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(authenticate); // every appointment route requires login

router.post('/', authorize('patient', 'receptionist'), bookAppointment);
router.patch('/:id/cancel', authorize('patient', 'receptionist'), cancelAppointment);
router.get('/mine', authorize('patient'), getMyAppointments);
router.get('/schedule', authorize('doctor', 'receptionist'), getDoctorSchedule);
router.get('/', authorize('receptionist'), getAllAppointments);

module.exports = router;
