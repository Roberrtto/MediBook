import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** NFR-01: enforce Role-Based Access Control at the route level. */
export function RoleRoute({ allow, children }) {
  const { user } = useAuth()

  if (!allow.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
