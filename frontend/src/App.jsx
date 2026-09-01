import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AppShell from './layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyEntry from './pages/DailyEntry';
import Trainees from './pages/Trainees';
import Assessment from './pages/Assessment';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily" element={<DailyEntry />} />
          <Route path="/trainees" element={<Trainees />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
