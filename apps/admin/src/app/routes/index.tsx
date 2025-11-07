/**
 * Admin App Routes
 * FSD v2.1: app/routes/index.tsx
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../layouts/Layout';
import { AdminUsersPage } from '@/pages/users';
import { AdminPerformancesPage } from '@/pages/performances';
import { AdminBookingsPage } from '@/pages/bookings';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/" element={<Navigate to="/performances" replace />} />
        <Route path="/users" element={<AdminUsersPage />} />
        <Route path="/performances" element={<AdminPerformancesPage />} />
        <Route path="/bookings" element={<AdminBookingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
