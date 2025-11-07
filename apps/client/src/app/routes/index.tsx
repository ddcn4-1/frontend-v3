/**
 * Web App Routes
 * FSD v2.1: app/routes/index.tsx
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../layouts/Layout';
import { PerformancesPage } from '@/pages/performances';
import { PerformanceDetailPage } from '@/pages/performance-details';
import { SeatSelectionPage } from '@/pages/seat-selection';
import { BookingHistoryPage } from '@/pages/booking-history';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<PerformancesPage />} />
        <Route path="/performances/:id" element={<PerformanceDetailPage />} />

        {/* Protected User Routes */}
        <Route path="/seat-selection/:scheduleId" element={<SeatSelectionPage />} />
        <Route path="/booking-history" element={<BookingHistoryPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
