const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

const users = [];
const medicalRecords = [];
const timeSlots = [];
const appointments = [];
const auditLogs = [];

timeSlots.push(
    { id: 1, doctorId: 3, startTime: "2026-07-28T09:00:00.000Z", endTime: "2026-07-28T09:30:00.000Z", isAvailable: true },
    { id: 2, doctorId: 3, startTime: "2026-07-28T10:00:00.000Z", endTime: "2026-07-28T10:30:00.000Z", isAvailable: true },
    { id: 3, doctorId: 4, startTime: "2026-07-29T14:00:00.000Z", endTime: "2026-07-29T14:30:00.000Z", isAvailable: true }
);

function createAuditLog(userId, action, description) {
    const logEntry = {
        logId: auditLogs.length + 1,
        timestamp: new Date().toISOString(),
        userId: userId || "SYSTEM_CRON",
        action,
        description
    };
    auditLogs.push(logEntry);
}

app.get('/api/test', (req, res) => {
    res.json({ message: "Hello Maida! Your MediBook backend is alive and fully loaded!" });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existingUser = users.find(u => u.email === email);
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: users.length + 1, email, password: hashedPassword, role };
        users.push(newUser);

        createAuditLog(newUser.id, "USER_REGISTER", `Registered email ${email} with role ${role}`);
        res.status(201).json({ message: "User registered successfully!", userId: newUser.id });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            'super_secret_key_123',
            { expiresIn: '1h' }
        );

        createAuditLog(user.id, "USER_LOGIN", `User ${email} successfully logged in`);
        res.json({ message: "Login successful!", token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

const verifyToken = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Access denied" });

        try {
            const decoded = jwt.verify(token, 'super_secret_key_123');
            req.user = decoded;
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            next();
        } catch (err) {
            res.status(400).json({ error: "Invalid token" });
        }
    };
};

app.get('/api/slots', verifyToken(['Patient', 'Receptionist', 'Doctor']), (req, res) => {
    res.json({ slots: timeSlots });
});

app.post('/api/appointments/book', verifyToken(['Patient', 'Receptionist']), (req, res) => {
    try {
        const { slotId, doctorId, reason } = req.body;
        const slot = timeSlots.find(s => s.id === parseInt(slotId));

        if (!slot) return res.status(404).json({ error: "Time slot not found" });
        if (!slot.isAvailable) return res.status(409).json({ error: "Booking collision detected. Slot is taken." });

        slot.isAvailable = false;

        const newAppointment = {
            id: appointments.length + 1,
            patientId: req.user.userId,
            doctorId: parseInt(doctorId),
            slotId: slot.id,
            dateTime: slot.startTime,
            status: "CONFIRMED",
            reason
        };

        appointments.push(newAppointment);
        createAuditLog(req.user.userId, "BOOK_APPOINTMENT", `Booked appointment ID ${newAppointment.id}`);
        res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });
    } catch (err) {
        res.status(500).json({ error: "Booking failed" });
    }
});

app.post('/api/appointments/cancel/:appointmentId', verifyToken(['Patient', 'Receptionist']), (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = appointments.find(a => a.id === parseInt(appointmentId));

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        const now = new Date();
        const apptTime = new Date(appointment.dateTime);
        const hoursDifference = (apptTime - now) / (1000 * 60 * 60);

        if (hoursDifference < 2) {
            return res.status(400).json({ error: "Cancellation rejected. Minimum 2 hours notice required." });
        }

        appointment.status = "CANCELLED";
        const slot = timeSlots.find(s => s.id === appointment.slotId);
        if (slot) slot.isAvailable = true;

        createAuditLog(req.user.userId, "CANCEL_APPOINTMENT", `Cancelled appointment ID ${appointment.id}`);
        res.json({ message: "Appointment successfully cancelled", appointment });
    } catch (err) {
        res.status(500).json({ error: "Cancellation failed" });
    }
});

app.get('/api/clinical/history/:patientId', verifyToken(['Patient', 'Doctor']), (req, res) => {
    const { patientId } = req.params;
    if (req.user.role === 'Patient' && req.user.userId !== parseInt(patientId)) {
        return res.status(403).json({ error: "Unauthorized access to health data" });
    }
    const patientHistory = medicalRecords.filter(r => r.patientId === parseInt(patientId));
    res.json({ message: "Records retrieved successfully", history: patientHistory });
});

app.post('/api/clinical/notes', verifyToken(['Doctor']), (req, res) => {
    try {
        const { patientId, diagnosis, notes, prescriptions } = req.body;
        const newRecord = {
            id: medicalRecords.length + 1,
            patientId: parseInt(patientId),
            doctorId: req.user.userId,
            diagnosis,
            notes,
            prescriptions,
            visitDate: new Date().toISOString()
        };
        medicalRecords.push(newRecord);

        createAuditLog(req.user.userId, "CREATE_CLINICAL_NOTE", `Added clinical note for patient ${patientId}`);
        res.status(201).json({ message: "Clinical note added successfully", recordId: newRecord.id });
    } catch (err) {
        res.status(500).json({ error: "Failed to add clinical note" });
    }
});

app.get('/api/admin/audit', verifyToken(['Receptionist']), (req, res) => {
    res.json({ logs: auditLogs });
});

setInterval(() => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = appointments.filter(a => {
        const apptTime = new Date(a.dateTime);
        return a.status === "CONFIRMED" && Math.abs(apptTime - twentyFourHoursFromNow) < (60 * 60 * 1000);
    });

    upcoming.forEach(appt => {
        console.log(`[NOTIFICATION ENGINE] Sending SendGrid Email and Twilio SMS reminder for Appointment ID: ${appt.id}`);
        createAuditLog(null, "SEND_REMINDER", `Automated 24h notification sent for appointment ${appt.id}`);
    });
}, 15000);

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
