const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

const users = [];
const medicalRecords = [];

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

        res.json({ message: "Login successful!", token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

const verifyToken = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ');
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

app.get('/api/clinical/history/:patientId', verifyToken(['Patient', 'Doctor']), (req, res) => {
    const { patientId } = req.params;
    const patientHistory = medicalRecords.filter(r => r.patientId === patientId);
    res.json({ message: "Records retrieved successfully", history: patientHistory });
});

app.post('/api/clinical/notes', verifyToken(['Doctor']), (req, res) => {
    const { patientId, diagnosis, notes, prescriptions } = req.body;
    const newRecord = {
        id: medicalRecords.length + 1,
        patientId,
        doctorId: req.user.userId,
        diagnosis,
        notes,
        prescriptions,
        visitDate: new Date().toISOString()
    };
    medicalRecords.push(newRecord);
    res.status(201).json({ message: "Clinical note added successfully", recordId: newRecord.id });
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
