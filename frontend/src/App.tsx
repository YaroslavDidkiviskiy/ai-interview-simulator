import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import HomePage from './pages/HomePage'
import CreateSessionPage from './pages/CreateSessionPage'
import SessionDetailPage from './pages/SessionDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route
            path="/sessions/create"
            element={
              <PrivateRoute>
                <CreateSessionPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/:sessionId"
            element={
              <PrivateRoute>
                <SessionDetailPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
