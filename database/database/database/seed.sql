-- ============================================================
-- MEDIBOOK SAMPLE DATA
-- ============================================================

\c medibook;

-- Users
INSERT INTO users (email, password_hash, name, phone, role) VALUES
('admin@medibook.com', '$2a$10$hashedpassword', 'System Admin', '+254700000000', 'admin'),
('dr.raquel@medibook.com', '$2a$10$hashedpassword', 'Dr. Raquel Hanness', '+254712345678', 'doctor'),
('dr.troy@medibook.com', '$2a$10$hashedpassword', 'Dr. Troy Waweru', '+254723456789', 'doctor'),
('patient@medibook.com', '$2a$10$hashedpassword', 'Jane Doe', '+254734567890', 'patient'),
('reception@medibook.com', '$2a$10$hashedpassword', 'Mary Rehab', '+254745678901', 'receptionist');

-- Doctors
INSERT INTO doctors (user_id, specialization, license_number, consultation_fee) VALUES
(2, 'Cardiology', 'LIC-001', 150.00),
(3, 'Pediatrics', 'LIC-002', 120.00);

-- Patients
INSERT INTO patients (user_id, date_of_birth, gender, address, emergency_contact) VALUES
(4, '1990-05-15', 'Female', '123 Main St, Nairobi', '+254755678912');

-- Receptionists
INSERT INTO receptionists (user_id, department) VALUES
(5, 'Front Desk');

-- Time Slots
INSERT INTO time_slots (doctor_id, date, start_time, end_time, is_available) VALUES
(1, CURRENT_DATE + INTERVAL '2 days', '09:00', '09:30', true),
(1, CURRENT_DATE + INTERVAL '2 days', '09:30', '10:00', true),
(1, CURRENT_DATE + INTERVAL '2 days', '10:00', '10:30', true);

-- Medical Record sample
INSERT INTO medical_records (
    patient_id, visit_date, chief_complaint, diagnosis, symptoms, doctor_notes
) VALUES (
    1, CURRENT_DATE - INTERVAL '30 days',
    'Chest pain and shortness of breath',
    'Angina Pectoris - Stable',
    'Chest pain, SOB, fatigue',
    'ECG shows ST depression. Stress test recommended.'
);

SELECT '✅ Sample data inserted successfully!' AS status;
