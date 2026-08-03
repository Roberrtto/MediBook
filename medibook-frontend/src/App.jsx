import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RoleRoute } from './routes/RoleRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { PATIENT_NAV, RECEPTIONIST_NAV, DOCTOR_NAV, IT_ADMIN_NAV } from './config/nav'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import NotFound from './pages/shared/NotFound'
import Unauthorized from './pages/shared/Unauthorized'

import PatientDashboard from './pages/patient/PatientDashboard'
import BookAppointment from './pages/patient/BookAppointment'
import MyAppointments from './pages/patient/MyAppointments'
import MedicalRecords from './pages/patient/MedicalRecords'

import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard'
import WalkInBooking from './pages/receptionist/WalkInBooking'

import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientChart from './pages/doctor/PatientChart'
import AuditLog from './pages/admin/AuditLog'

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['patient']}>
              <DashboardLayout navItems={PATIENT_NAV} roleLabel="Patient" title="MediBook" />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="records" element={<MedicalRecords />} />
      </Route>

      {/* Receptionist */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['receptionist']}>
              <DashboardLayout navItems={RECEPTIONIST_NAV} roleLabel="Receptionist" title="MediBook" />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistDashboard />} />
        <Route path="walk-in" element={<WalkInBooking />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['doctor']}>
              <DashboardLayout navItems={DOCTOR_NAV} roleLabel="Doctor" title="MediBook" />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="patients/:appointmentId" element={<PatientChart />} />
      </Route>

      {/* IT Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['admin']}>
              <DashboardLayout navItems={IT_ADMIN_NAV} roleLabel="IT Admin" title="MediBook" />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AuditLog />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
