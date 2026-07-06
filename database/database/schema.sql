-- ============================================================
-- MEDIBOOK DATABASE SCHEMA
-- Database & Persistence Architect: Praise Daniella
-- ============================================================

CREATE DATABASE medibook;
\c medibook;

-- USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'receptionist', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PATIENTS TABLE
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(20),
    blood_type VARCHAR(5),
    allergies TEXT
);

-- DOCTORS TABLE
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    consultation_fee DECIMAL(10,2)
);

-- RECEPTIONISTS TABLE
CREATE TABLE receptionists (
    receptionist_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    department VARCHAR(100)
);

-- TIME SLOTS
CREATE TABLE time_slots (
    slot_id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, date, start_time)
);

-- APPOINTMENTS
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    slot_id INTEGER NOT NULL REFERENCES time_slots(slot_id),
    date_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MEDICAL RECORDS
CREATE TABLE medical_records (
    record_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    appointment_id INTEGER UNIQUE REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    history_of_presenting_illness TEXT,
    diagnosis TEXT,
    symptoms TEXT,
    doctor_notes TEXT,
    treatment_plan TEXT,
    lab_results JSONB DEFAULT '[]',
    prescription TEXT,
    follow_up_date DATE,
    follow_up_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRESCRIPTIONS
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    medical_record_id INTEGER REFERENCES medical_records(record_id) ON DELETE SET NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    refills INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date_time);
CREATE INDEX idx_time_slots_doctor_date ON time_slots(doctor_id, date);
CREATE INDEX idx_time_slots_available ON time_slots(is_available);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- TRIGGER: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FUNCTION: Prevent double-booking (Transaction Lock)
CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id INTEGER,
    p_doctor_id INTEGER,
    p_slot_id INTEGER,
    p_date_time TIMESTAMP,
    p_reason TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_appointment_id INTEGER;
    v_is_available BOOLEAN;
BEGIN
    SELECT is_available INTO v_is_available
    FROM time_slots
    WHERE slot_id = p_slot_id
    FOR UPDATE;
    
    IF NOT v_is_available THEN
        RAISE EXCEPTION 'Slot is already booked. Please select another time.';
    END IF;
    
    INSERT INTO appointments (patient_id, doctor_id, slot_id, date_time, reason, status)
    VALUES (p_patient_id, p_doctor_id, p_slot_id, p_date_time, p_reason, 'scheduled')
    RETURNING appointment_id INTO v_appointment_id;
    
    UPDATE time_slots SET is_available = false WHERE slot_id = p_slot_id;
    
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_patient_id, 'CREATE_APPOINTMENT', 'appointment', v_appointment_id, 
            jsonb_build_object('slot_id', p_slot_id, 'date_time', p_date_time));
    
    RETURN v_appointment_id;
END;
$$;

SELECT '✅ MediBook Database Schema Created Successfully!' AS status;
