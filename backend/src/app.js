const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'medibook-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/doctors', doctorRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Must be registered last: Express recognizes error middleware by its 4-argument signature.
app.use(errorHandler);

module.exports = app;
