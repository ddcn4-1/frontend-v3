import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../pages/login';
import { SelectPage } from '../../pages/select';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select" element={<SelectPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
