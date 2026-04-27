import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: '#94a3b8' }}>
        Loading…
      </div>
    )
  }

  return user ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}
