const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { addRecord, getMyHistory } = require('../controllers/medicalRecordController');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('doctor'), addRecord);
router.get('/mine', authorize('patient'), getMyHistory);

module.exports = router;
