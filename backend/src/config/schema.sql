-- MediBook Database Schema
-- Run automatically by docker-compose on first boot (see docker-compose.yml)

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(160)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('patient', 'doctor', 'receptionist')),
    specialty       VARCHAR(120), -- only used when role = 'doctor'
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id                 SERIAL PRIMARY KEY,
    patient_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_time   TIMESTAMPTZ NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'booked'
                        CHECK (status IN ('booked', 'cancelled', 'completed')),
    reason             VARCHAR(255),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Core anti-double-booking guarantee (NFR-12): the DB itself will not allow
    -- two active bookings for the same doctor at the same time.
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_time)
);

CREATE TABLE IF NOT EXISTS medical_records (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    diagnosis       TEXT,
    prescription    TEXT,
    lab_results     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(120) NOT NULL,
    entity       VARCHAR(60)  NOT NULL,
    entity_id    INTEGER,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time ON appointments (doctor_id, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records (patient_id);
