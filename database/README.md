# MediBook Database

## Schema Overview

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | All system users (base table) |
| `patients` | Patient-specific data |
| `doctors` | Doctor-specific data |
| `receptionists` | Receptionist-specific data |

### Appointment Management
| Table | Description |
|-------|-------------|
| `time_slots` | Doctor availability |
| `appointments` | All appointments |

### Medical Records
| Table | Description |
|-------|-------------|
| `medical_records` | Patient records, summaries, lab results |
| `prescriptions` | All prescriptions |

### Security & Audit
| Table | Description |
|-------|-------------|
| `audit_logs` | Immutable audit trail (NFR-02) |
