const express = require('express');
const { authenticate } = require('../middleware/auth');
const { listDoctors } = require('../controllers/doctorController');

const router = express.Router();

router.get('/', authenticate, listDoctors);

module.exports = router;
