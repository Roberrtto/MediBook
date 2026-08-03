import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  FileText,
  CalendarRange,
  UserPlus,
  ClipboardList,
} from 'lucide-react'

export const PATIENT_NAV = [
  { to: '/patient', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
  { to: '/patient/appointments', label: 'My Appointments', icon: CalendarCheck },
  { to: '/patient/records', label: 'Medical Records', icon: FileText },
]

export const RECEPTIONIST_NAV = [
  { to: '/receptionist', label: 'Clinic Calendar', icon: CalendarRange, end: true },
  { to: '/receptionist/walk-in', label: 'Walk-in Booking', icon: UserPlus },
]

export const DOCTOR_NAV = [
  { to: '/doctor', label: 'Daily Schedule', icon: ClipboardList, end: true },
]

export const IT_ADMIN_NAV = [
  { to: '/admin', label: 'Audit Log', icon: ClipboardList, end: true },
]

export const SPECIALTIES = [
  'General Practice',
  'Pediatrics',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Gynecology',
  'ENT',
]
